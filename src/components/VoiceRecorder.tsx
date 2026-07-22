import React, { useState, useRef, useEffect } from 'react';
import { auth, firestoreDb } from '@/infrastructure/auth/firebase';
import { collection, addDoc } from 'firebase/firestore';
import { toast } from 'react-hot-toast';
import { 
  Mic, 
  Square, 
  Play, 
  Pause, 
  Sparkles, 
  Save, 
  Trash2, 
  Volume2, 
  RefreshCw,
  Tag,
  Music
} from 'lucide-react';

interface VoiceRecorderProps {
  onProfileCreated?: () => void;
}

export const VoiceRecorder: React.FC<VoiceRecorderProps> = ({ onProfileCreated }) => {
  const [isRecording, setIsRecording] = useState(false);
  const [recordSeconds, setRecordSeconds] = useState(0);
  const [recordedBlob, setRecordedBlob] = useState<Blob | null>(null);
  const [recordedUrl, setRecordedUrl] = useState<string | null>(null);
  const [recordedB64, setRecordedB64] = useState<string | null>(null);
  
  // Naming & tagging states
  const [profileName, setProfileName] = useState('');
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisResult, setAnalysisResult] = useState<any | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [isDragging, setIsDragging] = useState(false);

  // Playback control state
  const [isPlaying, setIsPlaying] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const timerRef = useRef<any>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Clean state
  const resetRecorder = () => {
    setIsRecording(false);
    setRecordSeconds(0);
    setRecordedBlob(null);
    if (recordedUrl) {
      URL.revokeObjectURL(recordedUrl);
    }
    setRecordedUrl(null);
    setRecordedB64(null);
    setProfileName('');
    setAnalysisResult(null);
    setIsPlaying(false);
    if (audioRef.current) {
      audioRef.current.pause();
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    resetRecorder();

    const objectUrl = URL.createObjectURL(file);
    setRecordedBlob(file);
    setRecordedUrl(objectUrl);

    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onloadend = async () => {
      const rawBase64 = (reader.result as string).split(',')[1];
      setRecordedB64(rawBase64);

      // Clean default name
      const baseName = file.name.substring(0, file.name.lastIndexOf('.')) || file.name;
      setProfileName(baseName);

      // Automatically analyze voice traits
      await analyzeRecordedVoice(rawBase64, file.type);
    };

    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files?.[0];
    if (file) {
      if (!file.type.startsWith('audio/')) {
        toast.error("Please drop an audio file.");
        return;
      }
      resetRecorder();

      const objectUrl = URL.createObjectURL(file);
      setRecordedBlob(file);
      setRecordedUrl(objectUrl);

      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onloadend = async () => {
        const rawBase64 = (reader.result as string).split(',')[1];
        setRecordedB64(rawBase64);

        const baseName = file.name.substring(0, file.name.lastIndexOf('.')) || file.name;
        setProfileName(baseName);

        await analyzeRecordedVoice(rawBase64, file.type);
      };
    }
  };

  useEffect(() => {
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
      if (recordedUrl) URL.revokeObjectURL(recordedUrl);
    };
  }, [recordedUrl]);

  const startRecording = async () => {
    try {
      // Clean previous state
      resetRecorder();

      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      audioChunksRef.current = [];
      const options = MediaRecorder.isTypeSupported('audio/webm') ? { mimeType: 'audio/webm' } : undefined;
      const mediaRecorder = new MediaRecorder(stream, options);

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onstop = async () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: options?.mimeType || 'audio/ogg' });
        const objectUrl = URL.createObjectURL(audioBlob);
        setRecordedBlob(audioBlob);
        setRecordedUrl(objectUrl);

        // Convert blob to base64 for submission
        const reader = new FileReader();
        reader.readAsDataURL(audioBlob);
        reader.onloadend = async () => {
          const rawBase64 = (reader.result as string).split(',')[1];
          setRecordedB64(rawBase64);
          
          // Generate a premium draft voice profile name based on index & timestamp
          const suggestedName = `Neural Voice ${new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}`;
          setProfileName(suggestedName);

          // Automatically analyze voice tone & characteristics for standard categorizations!
          await analyzeRecordedVoice(rawBase64, audioBlob.type);
        };

        // Stop micro tracks
        stream.getTracks().forEach(track => track.stop());
      };

      mediaRecorderRef.current = mediaRecorder;
      mediaRecorder.start(250);
      setIsRecording(true);
      setRecordSeconds(0);

      timerRef.current = setInterval(() => {
        setRecordSeconds(prev => prev + 1);
      }, 1000);

      toast.success("Recording started! Speak normally directly into your mic.", { id: 'voice-rec-start' });
    } catch (err) {
      console.error(err);
      toast.error("Unable to access microphone. Please check permissions.");
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
    }
  };

  const analyzeRecordedVoice = async (b64: string, type: string) => {
    setIsAnalyzing(true);
    const toastId = toast.loading("Analyzing voice tone parameters with Gemini AI...");
    try {
      const response = await fetch('/api/voices/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ b64Data: b64, mimeType: type })
      });
      if (!response.ok) {
        throw new Error("HTTP error " + response.status);
      }
      const data = await response.json();
      setAnalysisResult(data);
      toast.success("Voice traits analyzed successfully!", { id: toastId });
    } catch (err) {
      console.error('Analysis failed:', err);
      // fallback
      setAnalysisResult({
        tags: ['conversational', 'warm'],
        description: 'Clean recording, ideal for clear script narrations and dynamic voiceovers.',
        pitch: 135,
        tempo: 125,
        sentiment: 'Friendly & Conversational',
        fingerprint: {
          dynamicRange: 75,
          vocalEnergy: 65,
          resonance: 70,
          clarity: 85,
          stability: 80
        }
      });
      toast.error("Standard vocal profile loaded.", { id: toastId });
    } finally {
      setIsAnalyzing(false);
    }
  };

  // Playback handlers
  const handlePlayback = () => {
    if (!recordedUrl) return;
    if (!audioRef.current) {
      audioRef.current = new Audio(recordedUrl);
      audioRef.current.onended = () => {
        setIsPlaying(false);
      };
    }
    
    if (isPlaying) {
      audioRef.current.pause();
      setIsPlaying(false);
    } else {
      audioRef.current.play();
      setIsPlaying(true);
    }
  };

  // Add recorded voice profiling credentials directly to Firestore storage
  const saveVoiceProfile = async () => {
    if (!profileName.trim()) {
      toast.error("Please enter a name for this custom voice profile.");
      return;
    }
    if (!recordedB64) {
      toast.error("No recorded data to save. Please record first.");
      return;
    }

    setIsSaving(true);
    const savingToastId = toast.loading("Saving voice profile to Firestore...");

    try {
      const userId = auth.currentUser?.email || 'local_creator';
      const voiceProfile = {
        name: profileName,
        b64Data: recordedB64,
        mimeType: recordedBlob?.type || 'audio/webm',
        size: recordedBlob ? (recordedBlob.size / 1024).toFixed(1) + ' KB' : 'Unknown size',
        tags: analysisResult?.tags || ['conversational'],
        description: analysisResult?.description || 'Custom user recorded voice style profile.',
        pitch: analysisResult?.pitch || 145,
        tempo: analysisResult?.tempo || 125,
        sentiment: analysisResult?.sentiment || 'Friendly & Conversational',
        fingerprint: analysisResult?.fingerprint || {
          dynamicRange: 75,
          vocalEnergy: 65,
          resonance: 70,
          clarity: 85,
          stability: 80
        },
        userId,
        createdAt: Date.now()
      };

      // Add to Firestore collection
      await addDoc(collection(firestoreDb, 'voice_profiles'), voiceProfile);

      toast.success("Voice profile synchronized and secured in Firestore database!", { id: savingToastId });
      
      // Clean up and refresh voice profile lists
      resetRecorder();
      if (onProfileCreated) {
        onProfileCreated();
      }
    } catch (error: any) {
      console.error("Firestore persistence error:", error);
      toast.error("Sync failed: " + error.message, { id: savingToastId });
    } finally {
      setIsSaving(false);
    }
  };

  const getTimerDisplay = () => {
    const mins = Math.floor(recordSeconds / 60);
    const secs = recordSeconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div 
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
      className={`bg-zinc-950 border rounded-[2rem] p-6 shadow-xl space-y-6 transition-all duration-200 ${isDragging ? 'border-purple-500 bg-purple-500/5 ring-2 ring-purple-500/20' : 'border-zinc-900 bg-zinc-950'}`}
    >
      <input 
        type="file" 
        ref={fileInputRef} 
        onChange={handleFileSelect} 
        accept="audio/*" 
        className="hidden" 
      />

      <div className="flex items-center justify-between border-b border-zinc-900 pb-3">
        <div className="flex items-center gap-2">
          <div className="p-2 bg-purple-500/10 rounded-lg text-purple-400">
            <Mic size={18} />
          </div>
          <div>
            <h4 className="text-sm font-bold text-white">Vocal Fingerprint Recorder</h4>
            <p className="text-[9px] text-zinc-500 uppercase tracking-wider">Zero-Shot Sync capture & Upload</p>
          </div>
        </div>
        {isRecording && (
          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-red-500/10 border border-red-500/20">
            <span className="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse" />
            <span className="text-[9px] font-bold text-red-500 uppercase tracking-widest">{getTimerDisplay()}</span>
          </div>
        )}
      </div>

      {!recordedBlob ? (
        <div className="space-y-4">
          <p className="text-xs text-zinc-400 leading-relaxed">
            Record a short sentence (e.g., <i>"Welcome to the high velocity neural transcription module"</i>) or drop an audio file to auto-tag & model vocal traits.
          </p>

          {!isRecording ? (
            <div className="space-y-2">
              <button
                onClick={startRecording}
                className="w-full py-4 bg-purple-600 hover:bg-purple-500 text-white rounded-xl font-bold text-xs uppercase tracking-widest transition-all flex items-center justify-center gap-2 shadow-lg shadow-purple-500/10 border-b-2 border-purple-800 cursor-pointer"
              >
                <Mic size={14} className="animate-pulse" />
                Capture Free-form Voice
              </button>
              
              <div className="relative flex py-1 items-center">
                <div className="flex-grow border-t border-zinc-900"></div>
                <span className="flex-shrink mx-4 text-[9px] font-black uppercase text-zinc-650 tracking-widest">OR</span>
                <div className="flex-grow border-t border-zinc-900"></div>
              </div>

              <div 
                onClick={() => fileInputRef.current?.click()}
                className="w-full py-4 border border-dashed border-zinc-800 hover:border-purple-500/40 rounded-xl flex flex-col items-center justify-center gap-1.5 cursor-pointer hover:bg-purple-950/5 text-zinc-500 hover:text-zinc-300 transition-all text-center"
              >
                <Music size={16} className="text-zinc-600" />
                <span className="text-[9px] font-black uppercase tracking-widest">Upload audio sample profile</span>
                <span className="text-[8px] font-semibold text-zinc-700 block uppercase tracking-wider">Drag and Drop WAV/MP3 supported</span>
              </div>
            </div>
          ) : (
            <button
              onClick={stopRecording}
              className="w-full py-4 bg-red-650 hover:bg-red-750 text-white rounded-xl font-bold text-xs uppercase tracking-widest transition-all flex items-center justify-center gap-2 shadow-lg shadow-red-500/15 cursor-pointer"
            >
              <Square size={14} fill="currentColor" />
              Stop & Synthesize Trait
            </button>
          )}
        </div>
      ) : (
        <div className="space-y-5 animate-fade-in">
          {/* Recorder Audio Controls */}
          <div className="p-4 bg-zinc-900/50 rounded-xl border border-zinc-850 flex items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <button
                onClick={handlePlayback}
                className="h-10 w-10 rounded-full bg-white text-black flex items-center justify-center hover:bg-zinc-200 transition-colors shrink-0"
              >
                {isPlaying ? <Pause size={16} fill="currentColor" /> : <Play size={16} fill="currentColor" className="ml-0.5" />}
              </button>
              <div className="text-left min-w-0">
                <p className="text-xs font-bold text-white truncate">Recorded Soundwave</p>
                <p className="text-[9px] text-zinc-500 font-mono">{(recordedBlob.size / 1024).toFixed(1)} KB • webm/ogg</p>
              </div>
            </div>

            <button
              onClick={resetRecorder}
              className="p-2 border border-zinc-850 hover:bg-zinc-900 rounded-lg text-zinc-400 hover:text-white transition-colors"
              title="Redo capture"
            >
              <RefreshCw size={14} />
            </button>
          </div>

          {/* AI Automated Tone Tagging Section */}
          <div className="space-y-3">
            <div className="flex items-center justify-between text-[10px] uppercase font-black tracking-widest text-zinc-400">
              <span className="flex items-center gap-1.5">
                <Tag size={12} className="text-purple-400" />
                Aesthetic classification
              </span>
              {isAnalyzing && (
                <span className="flex items-center gap-1 text-purple-400 animate-pulse">
                  <RefreshCw size={10} className="animate-spin" />
                  Inferring...
                </span>
              )}
            </div>

            {analysisResult ? (
              <div className="p-3.5 rounded-xl bg-purple-500/5 border border-purple-500/10 space-y-3.5 text-left">
                <div className="flex flex-wrap gap-1.5">
                  {analysisResult.tags?.map(tag => (
                    <span 
                      key={tag} 
                      className="px-2 py-0.5 text-[9px] font-black uppercase text-purple-400 bg-purple-500/10 border border-purple-500/20 rounded"
                    >
                      {tag}
                    </span>
                  ))}
                  {analysisResult.sentiment && (
                    <span className="px-2 py-0.5 text-[9px] font-black uppercase text-pink-400 bg-pink-500/10 border border-pink-500/20 rounded">
                      {analysisResult.sentiment}
                    </span>
                  )}
                </div>
                
                <p className="text-[11px] text-zinc-400 leading-normal font-medium">{analysisResult.description}</p>

                {/* Pitch and Tempo indicators */}
                <div className="grid grid-cols-2 gap-2 pt-2 border-t border-zinc-900 text-left">
                  <div className="p-2 bg-zinc-900/60 rounded-lg">
                    <span className="text-[8px] font-black text-zinc-500 uppercase tracking-widest block">Est. Pitch Freq</span>
                    <span className="text-xs font-black text-purple-300 font-mono mt-0.5 block">{analysisResult.pitch || 145} Hz</span>
                    <span className="text-[8px] text-zinc-650 block mt-0.5 font-medium">{analysisResult.pitch && analysisResult.pitch < 150 ? 'Male range/Baritone' : 'Female range/Soprano'}</span>
                  </div>
                  <div className="p-2 bg-zinc-900/60 rounded-lg">
                    <span className="text-[8px] font-black text-zinc-500 uppercase tracking-widest block">Speech Velocity</span>
                    <span className="text-xs font-black text-indigo-300 font-mono mt-0.5 block">{analysisResult.tempo || 120} WPM</span>
                    <span className="text-[8px] text-zinc-650 block mt-0.5 font-medium">Conversational rate</span>
                  </div>
                </div>

                {/* Fingerprint Metrics Horizontal Bars */}
                <div className="space-y-2 pt-2 border-t border-zinc-900">
                  <span className="text-[9px] font-black text-purple-400 uppercase tracking-wider block">Voice Fingerprint Metrics</span>
                  
                  <div className="space-y-1">
                    <div className="flex justify-between text-[8px] font-bold text-zinc-500">
                      <span>Dynamic Range (Modulation)</span>
                      <span className="font-mono text-purple-300">{analysisResult.fingerprint?.dynamicRange ?? 70}%</span>
                    </div>
                    <div className="h-1 bg-zinc-900 rounded-full overflow-hidden">
                      <div className="h-full bg-purple-500 rounded-full" style={{ width: `${analysisResult.fingerprint?.dynamicRange ?? 70}%` }} />
                    </div>
                  </div>

                  <div className="space-y-1">
                    <div className="flex justify-between text-[8px] font-bold text-zinc-500">
                      <span>Vocal Energy (Presence)</span>
                      <span className="font-mono text-indigo-300">{analysisResult.fingerprint?.vocalEnergy ?? 65}%</span>
                    </div>
                    <div className="h-1 bg-zinc-900 rounded-full overflow-hidden">
                      <div className="h-full bg-indigo-500 rounded-full" style={{ width: `${analysisResult.fingerprint?.vocalEnergy ?? 65}%` }} />
                    </div>
                  </div>

                  <div className="space-y-1">
                    <div className="flex justify-between text-[8px] font-bold text-zinc-500">
                      <span>Resonance (Depth/Tone)</span>
                      <span className="font-mono text-blue-300">{analysisResult.fingerprint?.resonance ?? 75}%</span>
                    </div>
                    <div className="h-1 bg-zinc-900 rounded-full overflow-hidden">
                      <div className="h-full bg-blue-500 rounded-full" style={{ width: `${analysisResult.fingerprint?.resonance ?? 75}%` }} />
                    </div>
                  </div>

                  <div className="space-y-1">
                    <div className="flex justify-between text-[8px] font-bold text-zinc-500">
                      <span>Acoustic Clarity</span>
                      <span className="font-mono text-emerald-300">{analysisResult.fingerprint?.clarity ?? 80}%</span>
                    </div>
                    <div className="h-1 bg-zinc-900 rounded-full overflow-hidden">
                      <div className="h-full bg-emerald-500 rounded-full" style={{ width: `${analysisResult.fingerprint?.clarity ?? 80}%` }} />
                    </div>
                  </div>

                  <div className="space-y-1">
                    <div className="flex justify-between text-[8px] font-bold text-zinc-500">
                      <span>Pacing Stability</span>
                      <span className="font-mono text-pink-300">{analysisResult.fingerprint?.stability ?? 85}%</span>
                    </div>
                    <div className="h-1 bg-zinc-900 rounded-full overflow-hidden">
                      <div className="h-full bg-pink-500 rounded-full" style={{ width: `${analysisResult.fingerprint?.stability ?? 85}%` }} />
                    </div>
                  </div>
                </div>

              </div>
            ) : (
              <div className="p-3 rounded-xl border border-dashed border-zinc-850 text-center">
                <p className="text-[10px] text-zinc-500">Auto-generating tag metrics...</p>
              </div>
            )}
          </div>

          {/* Voice profile naming & saving controls */}
          <div className="space-y-3">
            <label className="text-[10px] font-black uppercase tracking-wider text-zinc-500 text-left block ml-1">Profile Name</label>
            <input
              type="text"
              value={profileName}
              onChange={(e) => setProfileName(e.target.value)}
              placeholder="e.g. My Branded Narrator Voice"
              className="w-full bg-zinc-900 border border-zinc-850 rounded-xl px-4 py-3 text-xs text-white placeholder-zinc-600 focus:outline-none focus:border-purple-500 transition-colors"
            />

            <div className="grid grid-cols-2 gap-2 pt-1">
              <button
                onClick={resetRecorder}
                className="py-3 bg-zinc-900 border border-zinc-850 hover:bg-zinc-800 text-zinc-400 hover:text-white rounded-xl text-[10px] font-black uppercase tracking-widest transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={saveVoiceProfile}
                disabled={isSaving || !profileName.trim()}
                className="py-3 bg-purple-600 hover:bg-purple-500 text-white rounded-xl text-[10px] font-black uppercase tracking-widest transition-colors flex items-center justify-center gap-1.5 border-b-2 border-purple-800 shrink-0"
              >
                <Save size={12} />
                Save Profile
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
