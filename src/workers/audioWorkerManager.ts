import { AUDIO_WORKER_SCRIPT, WorkerAudioResponse } from './audioStreamWorker';

export interface ProcessedAudioResult {
  base64: string;
  mimeType: string;
  rms: number;
  peak: number;
  samplesProcessed: number;
}

export class AudioWorkerManager {
  private worker: Worker | null = null;
  private pendingCallbacks: Map<string, { resolve: (val: any) => void; reject: (err: any) => void }> = new Map();
  private isInitialized = false;

  constructor() {
    this.initWorker();
  }

  private initWorker() {
    if (typeof window === 'undefined' || typeof Worker === 'undefined') return;

    try {
      const blob = new Blob([AUDIO_WORKER_SCRIPT], { type: 'application/javascript' });
      const workerUrl = URL.createObjectURL(blob);
      this.worker = new Worker(workerUrl);

      this.worker.onmessage = (e: MessageEvent<WorkerAudioResponse>) => {
        const { id, type, result, error } = e.data;
        const callbacks = this.pendingCallbacks.get(id);

        if (!callbacks) return;

        if (type === 'ERROR' || error) {
          callbacks.reject(new Error(error || 'Audio Web Worker encountered an error'));
        } else {
          callbacks.resolve(result);
        }

        this.pendingCallbacks.delete(id);
      };

      this.worker.onerror = (err) => {
        console.warn('[AudioWorkerManager] Web Worker runtime exception caught, switching to main-thread processing:', err);
        // Cleanly reject all pending promises so they can trigger fallback without uncaught exceptions
        for (const [id, callbacks] of this.pendingCallbacks.entries()) {
          callbacks.reject(new Error('Audio Web Worker runtime exception, falling back to main-thread.'));
        }
        this.pendingCallbacks.clear();
        this.worker = null;
      };

      this.isInitialized = true;
      console.log('[AudioWorkerManager] Dedicated Audio Web Worker initialized successfully off-main-thread.');
    } catch (err) {
      console.warn('[AudioWorkerManager] Failed launching dedicated Web Worker, falling back to main-thread processing:', err);
      this.worker = null;
    }
  }

  /**
   * Offloads Float32Array PCM encoding to Int16 Base64 and RMS calculation to Web Worker thread
   */
  public async encodePcmChunk(float32Data: Float32Array, sampleRate: number = 16000): Promise<ProcessedAudioResult> {
    if (!this.worker) {
      // Main-thread fallback if Worker failed
      return this.fallbackEncodePcm(float32Data, sampleRate);
    }

    const id = `pcm_enc_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
    try {
      // Clone array to ensure thread safety
      const dataCopy = new Float32Array(float32Data);
      return await new Promise((resolve, reject) => {
        this.pendingCallbacks.set(id, { resolve, reject });
        this.worker!.postMessage({
          id,
          type: 'ENCODE_PCM',
          data: dataCopy,
          sampleRate
        });
      });
    } catch (err) {
      this.pendingCallbacks.delete(id);
      return this.fallbackEncodePcm(float32Data, sampleRate);
    }
  }

  /**
   * Offloads Base64 Int16 PCM decoding back to Float32Array to Web Worker thread
   */
  public async decodePcmChunk(base64Data: string): Promise<{ float32Array: Float32Array; samplesCount: number; rms: number }> {
    if (!this.worker) {
      return this.fallbackDecodePcm(base64Data);
    }

    const id = `pcm_dec_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
    try {
      return await new Promise((resolve, reject) => {
        this.pendingCallbacks.set(id, {
          resolve: (res) => {
            try {
              const f32 = res?.float32Array ? new Float32Array(res.float32Array) : new Float32Array(0);
              resolve({
                float32Array: f32,
                samplesCount: res?.samplesCount || f32.length,
                rms: res?.rms || 0
              });
            } catch (e) {
              resolve(this.fallbackDecodePcm(base64Data));
            }
          },
          reject: (err) => {
            resolve(this.fallbackDecodePcm(base64Data));
          }
        });
        this.worker!.postMessage({
          id,
          type: 'DECODE_PCM',
          data: base64Data
        });
      });
    } catch (err) {
      this.pendingCallbacks.delete(id);
      return this.fallbackDecodePcm(base64Data);
    }
  }

  private fallbackEncodePcm(data: Float32Array, sampleRate: number): ProcessedAudioResult {
    try {
      const l = data ? data.length : 0;
      const int16 = new Int16Array(l);
      let sumSquares = 0;
      let peak = 0;

      for (let i = 0; i < l; i++) {
        const s = Math.max(-1, Math.min(1, data[i] || 0));
        int16[i] = s < 0 ? s * 0x8000 : s * 0x7FFF;
        sumSquares += s * s;
        if (Math.abs(s) > peak) peak = Math.abs(s);
      }

      const rms = Math.sqrt(sumSquares / (l || 1));
      const bytes = new Uint8Array(int16.buffer);
      let binary = '';
      for (let i = 0; i < bytes.byteLength; i++) {
        binary += String.fromCharCode(bytes[i]);
      }

      return {
        base64: btoa(binary),
        mimeType: `audio/pcm;rate=${sampleRate}`,
        rms,
        peak,
        samplesProcessed: l
      };
    } catch (err) {
      return {
        base64: '',
        mimeType: `audio/pcm;rate=${sampleRate}`,
        rms: 0,
        peak: 0,
        samplesProcessed: 0
      };
    }
  }

  private fallbackDecodePcm(base64: string) {
    try {
      if (!base64 || typeof base64 !== 'string') {
        return { float32Array: new Float32Array(0), samplesCount: 0, rms: 0 };
      }
      const binaryString = atob(base64);
      const bytes = new Uint8Array(binaryString.length);
      for (let i = 0; i < binaryString.length; i++) bytes[i] = binaryString.charCodeAt(i);
      const numSamples = Math.floor(bytes.length / 2);
      const dataInt16 = new Int16Array(bytes.buffer, 0, numSamples);
      const float32 = new Float32Array(dataInt16.length);
      let sumSquares = 0;

      for (let i = 0; i < dataInt16.length; i++) {
        const val = dataInt16[i] / 32768.0;
        float32[i] = val;
        sumSquares += val * val;
      }

      const rms = Math.sqrt(sumSquares / (dataInt16.length || 1));
      return { float32Array: float32, samplesCount: float32.length, rms };
    } catch (err) {
      return { float32Array: new Float32Array(0), samplesCount: 0, rms: 0 };
    }
  }

  public terminate() {
    if (this.worker) {
      this.worker.terminate();
      this.worker = null;
      this.pendingCallbacks.clear();
      console.log('[AudioWorkerManager] Audio Web Worker terminated.');
    }
  }
}

export const audioWorkerManager = new AudioWorkerManager();
