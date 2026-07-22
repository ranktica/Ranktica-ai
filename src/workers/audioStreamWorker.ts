/**
  Dedicated Web Worker for High-Frequency Real-time Audio Stream Processing
  Offloads Float32<->Int16 PCM encoding, base64 conversion, audio signal normalization,
  and RMS amplitude volume metering off the main UI thread.
 */

export interface WorkerAudioMessage {
  id: string;
  type: 'ENCODE_PCM' | 'DECODE_PCM' | 'COMPUTE_METRICS' | 'PROCESS_AUDIO_FRAME';
  data: any;
  sampleRate?: number;
}

export interface WorkerAudioResponse {
  id: string;
  type: 'ENCODE_PCM_SUCCESS' | 'DECODE_PCM_SUCCESS' | 'COMPUTE_METRICS_SUCCESS' | 'PROCESS_AUDIO_FRAME_SUCCESS' | 'ERROR';
  result?: any;
  error?: string;
}

// Inline Web Worker logic string to ensure zero-bundler setup issues in browser environment
export const AUDIO_WORKER_SCRIPT = `
self.onmessage = function(e) {
  if (!e || !e.data) return;
  const { id, type, data, sampleRate = 16000 } = e.data;

  try {
    if (type === 'ENCODE_PCM') {
      if (!data) throw new Error('No audio data provided for encoding');
      let float32;
      if (data instanceof Float32Array) {
        float32 = data;
      } else if (data && data.buffer instanceof ArrayBuffer) {
        float32 = new Float32Array(data.buffer, data.byteOffset || 0, data.length || 0);
      } else if (Array.isArray(data) || (typeof data === 'object' && 'length' in data)) {
        float32 = new Float32Array(data);
      } else {
        float32 = new Float32Array(0);
      }

      const len = float32.length;
      const int16 = new Int16Array(len);
      let sumSquares = 0;
      let peak = 0;

      for (let i = 0; i < len; i++) {
        const s = Math.max(-1, Math.min(1, float32[i] || 0));
        int16[i] = s < 0 ? s * 0x8000 : s * 0x7FFF;
        sumSquares += s * s;
        const absVal = Math.abs(s);
        if (absVal > peak) peak = absVal;
      }

      const rms = Math.sqrt(sumSquares / (len || 1));

      // Convert Int16Array to Base64 safely
      const bytes = new Uint8Array(int16.buffer, int16.byteOffset, int16.byteLength);
      let binary = '';
      const lenBytes = bytes.length;
      for (let i = 0; i < lenBytes; i++) {
        binary += String.fromCharCode(bytes[i]);
      }
      const base64 = btoa(binary);

      self.postMessage({
        id,
        type: 'ENCODE_PCM_SUCCESS',
        result: {
          base64,
          mimeType: 'audio/pcm;rate=' + sampleRate,
          rms,
          peak,
          samplesProcessed: len
        }
      });
    } else if (type === 'DECODE_PCM') {
      if (!data || typeof data !== 'string') throw new Error('Invalid base64 audio data string');
      const binaryString = atob(data);
      const len = binaryString.length;
      const bytes = new Uint8Array(len);
      for (let i = 0; i < len; i++) {
        bytes[i] = binaryString.charCodeAt(i);
      }
      // Ensure byte length is a multiple of 2 for Int16Array to avoid RangeError
      const numSamples = Math.floor(len / 2);
      const int16 = new Int16Array(bytes.buffer, 0, numSamples);
      const float32 = new Float32Array(numSamples);
      let sumSquares = 0;

      for (let i = 0; i < numSamples; i++) {
        const val = int16[i] / 32768.0;
        float32[i] = val;
        sumSquares += val * val;
      }

      const rms = Math.sqrt(sumSquares / (numSamples || 1));

      self.postMessage({
        id,
        type: 'DECODE_PCM_SUCCESS',
        result: {
          float32Array: float32.buffer,
          samplesCount: numSamples,
          rms
        }
      }, [float32.buffer]);
    } else if (type === 'COMPUTE_METRICS') {
      let float32;
      if (data instanceof Float32Array) {
        float32 = data;
      } else if (data && data.buffer instanceof ArrayBuffer) {
        float32 = new Float32Array(data.buffer, data.byteOffset || 0, data.length || 0);
      } else if (Array.isArray(data)) {
        float32 = new Float32Array(data);
      } else {
        float32 = new Float32Array(0);
      }

      let sum = 0;
      let peak = 0;
      for (let i = 0; i < float32.length; i++) {
        const val = Math.abs(float32[i] || 0);
        sum += val * val;
        if (val > peak) peak = val;
      }
      const rms = Math.sqrt(sum / (float32.length || 1));

      self.postMessage({
        id,
        type: 'COMPUTE_METRICS_SUCCESS',
        result: { rms, peak, db: 20 * Math.log10(rms || 0.00001) }
      });
    } else {
      self.postMessage({ id, type: 'ERROR', error: 'Unknown worker action type: ' + type });
    }
  } catch (err) {
    self.postMessage({ id, type: 'ERROR', error: (err && err.message) ? err.message : String(err) });
  }
};
`;
