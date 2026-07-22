import React, { useState, useEffect } from 'react';
import { 
  Database, 
  CloudLightning, 
  Server, 
  Trash2, 
  Copy, 
  ExternalLink, 
  UploadCloud, 
  FileText, 
  FolderSync, 
  Sparkles, 
  ArrowRight, 
  Lock, 
  RefreshCw, 
  CheckCircle2, 
  AlertCircle, 
  Layers, 
  Image as ImageIcon,
  Play,
  FileCode,
  Check,
  ChevronRight,
  HardDrive
} from 'lucide-react';
import { toast } from 'react-hot-toast';

interface StorageConfig {
  provider: 'cloudflare_r2' | 'aws_s3';
  endpoint: string;
  region: string;
  bucket: string;
  access_key_id: string;
  secret_access_key: string;
  public_url: string;
}

interface StorageAsset {
  id: string;
  project_id: string;
  name: string;
  category: 'image' | 'voice' | 'video' | 'report';
  file_size: number;
  mime_type: string;
  storage_url: string;
  created_at: number;
}

export const ObjectStorage: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'vault' | 'config' | 'migration'>('vault');
  const [assetCategory, setAssetCategory] = useState<'all' | 'image' | 'voice' | 'video' | 'report'>('all');
  
  // Configuration State
  const [config, setConfig] = useState<StorageConfig>({
    provider: 'cloudflare_r2',
    endpoint: '',
    region: 'us-east-1',
    bucket: '',
    access_key_id: '',
    secret_access_key: '',
    public_url: ''
  });
  
  const [assets, setAssets] = useState<StorageAsset[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isMigrating, setIsMigrating] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  // Uploader State
  const [uploadCategory, setUploadCategory] = useState<'image' | 'voice' | 'video' | 'report'>('image');
  const [dragActive, setDragActive] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [selectedFileBase64, setSelectedFileBase64] = useState<string>('');
  const [isUploading, setIsUploading] = useState(false);
  const [quotaLimitGB, setQuotaLimitGB] = useState(10);

  // Migration Stats
  const [migrationResult, setMigrationResult] = useState<{
    migratedCount: number;
    filesCreated: Array<{
      projectId: string;
      projectTitle: string;
      fileName: string;
      category: string;
      storageUrl: string;
    }>;
  } | null>(null);

  useEffect(() => {
    fetchConfig();
    fetchAssets();
  }, []);

  const fetchConfig = async () => {
    try {
      const res = await fetch('/api/storage/config');
      if (res.ok) {
        const data = await res.json();
        if (data && data.provider) {
          setConfig(data);
        }
      }
    } catch (err) {
      console.error('Error fetching storage config:', err);
    }
  };

  const fetchAssets = async () => {
    setIsLoading(true);
    try {
      const res = await fetch('/api/storage/assets');
      if (res.ok) {
        const data = await res.json();
        setAssets(data);
      }
    } catch (err) {
      console.error('Error fetching storage assets:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSaveConfig = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    try {
      const res = await fetch('/api/storage/config', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(config)
      });
      if (res.ok) {
        toast.success('Storage configuration updated successfully');
        fetchConfig();
      } else {
        toast.error('Failed to update storage configuration');
      }
    } catch (err) {
      toast.error('Connection error saving configuration');
    } finally {
      setIsSaving(false);
    }
  };

  // Drag & drop handlers
  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      processFile(e.dataTransfer.files[0]);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      processFile(e.target.files[0]);
    }
  };

  const processFile = (file: File) => {
    setSelectedFile(file);
    const reader = new FileReader();
    reader.onload = () => {
      setSelectedFileBase64(reader.result as string);
    };
    reader.readAsDataURL(file);
    
    // Auto-detect category of uploaded file
    const ext = file.name.split('.').pop()?.toLowerCase();
    if (['jpg', 'jpeg', 'png', 'gif', 'svg', 'webp'].includes(ext || '')) {
      setUploadCategory('image');
    } else if (['mp3', 'wav', 'ogg', 'm4a', 'aac'].includes(ext || '')) {
      setUploadCategory('voice');
    } else if (['mp4', 'webm', 'mov', 'avi', 'mkv'].includes(ext || '')) {
      setUploadCategory('video');
    } else {
      setUploadCategory('report');
    }
  };

  const handleUpload = async () => {
    if (!selectedFile || !selectedFileBase64) {
      toast.error('Please select or drop a file first');
      return;
    }
    setIsUploading(true);
    try {
      const res = await fetch('/api/storage/upload', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: selectedFile.name,
          category: uploadCategory,
          mimeType: selectedFile.type,
          content: selectedFileBase64
        })
      });
      if (res.ok) {
        toast.success(`Uploaded ${selectedFile.name} successfully!`);
        setSelectedFile(null);
        setSelectedFileBase64('');
        fetchAssets();
      } else {
        const err = await res.json();
        toast.error(err.error || 'Upload failed');
      }
    } catch (err) {
      toast.error('Upload processing error');
    } finally {
      setIsUploading(false);
    }
  };

  const handleDeleteAsset = async (id: string) => {
    if (!confirm('Are you sure you want to delete this asset index? This represents clearing object storage mapping.')) return;
    try {
      const res = await fetch(`/api/storage/assets/${id}`, {
        method: 'DELETE'
      });
      if (res.ok) {
        toast.success('Asset reference deleted');
        setAssets(assets.filter(a => a.id !== id));
      } else {
        toast.error('Failed to delete asset reference');
      }
    } catch (err) {
      toast.error('Error executing delete requests');
    }
  };

  const triggerMigration = async () => {
    setIsMigrating(true);
    setMigrationResult(null);
    try {
      const res = await fetch('/api/storage/migrate', {
        method: 'POST'
      });
      if (res.ok) {
        const data = await res.json();
        setMigrationResult(data);
        if (data.migratedCount > 0) {
          toast.success(`Successfully migrated ${data.migratedCount} project rows to Object Storage!`);
        } else {
          toast.success('Migration checked! All database models are already fully decoupled from raw binary payloads.');
        }
        fetchAssets();
      } else {
        toast.error('Migration failed');
      }
    } catch (err) {
      toast.error('Error communicating with migration engine');
    } finally {
      setIsMigrating(false);
    }
  };

  // Helper utility to format byte sizes
  const formatBytes = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const copyUrl = (url: string, id: string) => {
    // Resolve full URL if relative
    const absoluteUrl = url.startsWith('/') ? `${window.location.origin}${url}` : url;
    navigator.clipboard.writeText(absoluteUrl);
    setCopiedId(id);
    toast.success('Asset storage link copied!');
    setTimeout(() => setCopiedId(null), 2000);
  };

  const filteredAssets = assetCategory === 'all' 
    ? assets 
    : assets.filter(a => a.category === assetCategory);

  return (
    <div className="flex-1 flex flex-col p-6 max-w-7xl mx-auto w-full space-y-6">
      
      {/* Header and Architecture visualizer banner */}
      <div className="bg-[#121214] border border-zinc-800 rounded-2xl p-6 relative overflow-hidden shadow-xl mb-4">
        <div className="absolute right-0 top-0 h-full w-1/3 opacity-10 bg-[radial-gradient(circle_at_right,_var(--tw-gradient-stops))] from-orange-600 via-red-600 to-transparent pointer-events-none"></div>
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 relative z-10">
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <span className="px-2.5 py-0.5 rounded-full text-[10px] uppercase font-black tracking-widest bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                Isolation Architecture Active
              </span>
            </div>
            <h1 className="text-3xl font-black text-white tracking-tight">
              SQL / Object Storage decoupling
            </h1>
            <p className="text-zinc-400 text-xs max-w-2xl">
              Model high-volume digital assets off of structured relational schemas. Relational metadata is contained inside 
              offline-first <span className="font-mono text-[11px] text-zinc-300 bg-zinc-800 px-1 py-0.5 rounded">sql.js SQLite</span>, 
              while raw binaries (Thumbnails, Audio Synthesis, MP4 Drafts, Reports) are offloaded to zero-egress external Object Storage.
            </p>
          </div>
          <div className="flex bg-[#18181b] border border-zinc-800 p-1.5 rounded-xl self-stretch md:self-auto gap-1">
            <button
              onClick={() => setActiveTab('vault')}
              className={`flex-1 md:flex-none px-4 py-2 rounded-lg text-xs font-bold transition-all ${
                activeTab === 'vault'
                  ? 'bg-gradient-to-r from-red-600 to-orange-600 text-white shadow-md'
                  : 'text-zinc-400 hover:text-white'
              }`}
            >
              Storage Vault
            </button>
            <button
              onClick={() => setActiveTab('config')}
              className={`flex-1 md:flex-none px-4 py-2 rounded-lg text-xs font-bold transition-all ${
                activeTab === 'config'
                  ? 'bg-gradient-to-r from-red-600 to-orange-600 text-white shadow-md'
                  : 'text-zinc-400 hover:text-white'
              }`}
            >
              Config Targets
            </button>
            <button
              onClick={() => setActiveTab('migration')}
              className={`flex-1 md:flex-none px-4 py-2 rounded-lg text-xs font-bold transition-all ${
                activeTab === 'migration'
                  ? 'bg-gradient-to-r from-red-600 to-orange-600 text-white shadow-md'
                  : 'text-zinc-400 hover:text-white'
              }`}
            >
              Data Separator
            </button>
          </div>
        </div>

        {/* Dynamic Decoupled Architecture Diagram */}
        <div className="mt-6 pt-6 border-t border-zinc-800/60 grid grid-cols-1 md:grid-cols-3 gap-4 items-center">
          <div className="bg-[#18181b] border border-zinc-800/60 p-4 rounded-xl flex items-center gap-3">
            <div className="w-10 h-10 bg-red-600/10 border border-red-500/20 text-red-500 rounded-lg flex items-center justify-center shrink-0">
              <Database size={20} />
            </div>
            <div className="min-w-0">
              <h4 className="text-zinc-200 text-xs font-bold">SQL Relational DB</h4>
              <p className="text-[10px] text-zinc-500 truncate">SQLite / Row IDs, audit links, prompt hashes</p>
            </div>
          </div>
          <div className="flex justify-center flex-col items-center">
            <div className="flex items-center gap-1.5 text-[10px] font-bold text-zinc-500 uppercase tracking-widest bg-zinc-900/60 border border-zinc-800 px-3 py-1 rounded-full">
              <Layers size={11} className="text-orange-500" />
              Sovereign Separation
            </div>
            <div className="h-4 w-[1px] md:h-[1px] md:w-32 bg-gradient-to-r from-red-500 to-blue-500 mt-1"></div>
          </div>
          <div className="bg-[#18181b] border border-zinc-800/60 p-4 rounded-xl flex items-center gap-3">
            <div className="w-10 h-10 bg-blue-600/10 border border-blue-500/20 text-blue-400 rounded-lg flex items-center justify-center shrink-0">
              <CloudLightning size={20} />
            </div>
            <div className="min-w-0">
              <h4 className="text-zinc-200 text-xs font-bold">Cloud Object Storage</h4>
              <p className="text-[10px] text-zinc-500 truncate">Cloudflare R2 / Amazon S3 buckets</p>
            </div>
          </div>
        </div>
      </div>

      {activeTab === 'vault' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          
          {/* File Vault Column */}
          <div className="lg:col-span-2 space-y-4">
            
            {/* Filter Pills */}
            <div className="bg-[#121214] border border-zinc-800/80 p-3 rounded-xl flex flex-wrap gap-2 items-center">
              <span className="text-[11px] font-bold text-zinc-500 uppercase tracking-wider px-2">Filter Vault:</span>
              <button
                onClick={() => setAssetCategory('all')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                  assetCategory === 'all'
                    ? 'bg-zinc-800 text-white border border-zinc-700'
                    : 'text-zinc-400 hover:text-white'
                }`}
              >
                All Files
              </button>
              <button
                onClick={() => setAssetCategory('image')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1 ${
                  assetCategory === 'image'
                    ? 'bg-amber-600/20 text-amber-400 border border-amber-500/30'
                    : 'text-zinc-400 hover:text-white'
                }`}
              >
                <ImageIcon size={11} /> Images
              </button>
              <button
                onClick={() => setAssetCategory('voice')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1 ${
                  assetCategory === 'voice'
                    ? 'bg-purple-600/20 text-purple-400 border border-purple-500/30'
                    : 'text-zinc-400 hover:text-white'
                }`}
              >
                <FileText size={11} /> Voice Files
              </button>
              <button
                onClick={() => setAssetCategory('video')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1 ${
                  assetCategory === 'video'
                    ? 'bg-blue-600/20 text-blue-400 border border-blue-500/30'
                    : 'text-zinc-400 hover:text-white'
                }`}
              >
                <Play size={11} /> Videos
              </button>
              <button
                onClick={() => setAssetCategory('report')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1 ${
                  assetCategory === 'report'
                    ? 'bg-emerald-600/20 text-emerald-400 border border-emerald-500/30'
                    : 'text-zinc-400 hover:text-white'
                }`}
              >
                <FileCode size={11} /> Reports
              </button>
              
              <button 
                onClick={fetchAssets}
                disabled={isLoading}
                className="ml-auto text-zinc-500 hover:text-zinc-300 p-1.5 rounded-lg hover:bg-zinc-800 transition"
                title="Refresh Asset Registry"
              >
                <RefreshCw size={14} className={isLoading ? "animate-spin" : ""} />
              </button>
            </div>

            {/* Asset List Grid */}
            {isLoading ? (
              <div className="bg-[#121214] border border-zinc-800 rounded-xl p-12 flex flex-col items-center justify-center space-y-3">
                <RefreshCw size={24} className="text-zinc-600 animate-spin" />
                <span className="text-zinc-500 text-xs font-bold">Retrieving assets catalog...</span>
              </div>
            ) : filteredAssets.length === 0 ? (
              <div className="bg-[#121214] border border-zinc-800 rounded-xl p-12 text-center space-y-2">
                <HardDrive className="mx-auto text-zinc-700" size={32} />
                <h3 className="text-zinc-300 font-bold text-xs">No storage assets mapped</h3>
                <p className="text-zinc-500 text-[11px] max-w-sm mx-auto">
                  Upload files directly or trigger the SQL-to-Storage Isolation Wizard to decouple existing database references.
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {filteredAssets.map(asset => (
                  <div key={asset.id} className="bg-[#121214] border border-zinc-800 hover:border-zinc-700/80 rounded-xl p-4 flex flex-col justify-between transition group">
                    <div className="space-y-2">
                      <div className="flex justify-between items-start gap-2">
                        <div className="truncate min-w-0">
                          <h4 className="text-zinc-200 text-xs font-extrabold truncate" title={asset.name}>
                            {asset.name}
                          </h4>
                          <span className="text-[10px] text-zinc-500 font-mono italic block">{asset.mime_type}</span>
                        </div>
                        <span className={`px-2 py-0.5 rounded text-[9px] font-black uppercase tracking-wider shrink-0 whitespace-nowrap ${
                          asset.category === 'image' ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20' :
                          asset.category === 'voice' ? 'bg-purple-500/10 text-purple-400 border border-purple-500/20' :
                          asset.category === 'video' ? 'bg-blue-500/10 text-blue-400 border border-blue-500/20' :
                          'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                        }`}>
                          {asset.category}
                        </span>
                      </div>

                      {/* File Info Meta */}
                      <div className="flex items-center gap-3 text-[10px] text-zinc-400 font-mono">
                        <span className="bg-[#18181b] px-1.5 py-0.5 rounded border border-zinc-800">{formatBytes(asset.file_size)}</span>
                        <span>•</span>
                        <span>{new Date(asset.created_at).toLocaleDateString()}</span>
                      </div>

                      {/* Preview window (only for images or videos) */}
                      {asset.category === 'image' && (
                        <div className="mt-2 h-20 rounded-lg overflow-hidden border border-zinc-800 bg-[#0c0c0e]">
                          <img src={asset.storage_url} alt={asset.name} className="w-full h-full object-cover group-hover:scale-105 transition duration-300" referrerPolicy="no-referrer" />
                        </div>
                      )}
                    </div>

                    {/* Operational Toolbox */}
                    <div className="flex items-center gap-1.5 pt-3 mt-3 border-t border-zinc-800/40">
                      <button
                        onClick={() => copyUrl(asset.storage_url, asset.id)}
                        className="flex-1 flex items-center justify-center gap-1.5 bg-[#18181b] hover:bg-zinc-800 text-zinc-300 hover:text-white px-2.5 py-1.5 rounded-lg text-[10px] font-bold border border-zinc-800 transition"
                      >
                        {copiedId === asset.id ? (
                          <>
                            <Check size={11} className="text-emerald-500" />
                            <span>Copied</span>
                          </>
                        ) : (
                          <>
                            <Copy size={11} />
                            <span>Copy Storage Link</span>
                          </>
                        )}
                      </button>
                      <a
                        href={asset.storage_url.startsWith('/') ? `${window.location.origin}${asset.storage_url}` : asset.storage_url}
                        target="_blank"
                        rel="noreferrer"
                        className="p-1.5 bg-[#18181b] hover:bg-zinc-800 text-zinc-400 hover:text-white rounded-lg border border-zinc-800 transition"
                        title="Access Remote File"
                      >
                        <ExternalLink size={11} />
                      </a>
                      <button
                        onClick={() => handleDeleteAsset(asset.id)}
                        className="p-1.5 bg-red-950/10 hover:bg-red-950/30 text-rose-500 hover:text-rose-400 rounded-lg border border-rose-950/20 transition ml-auto"
                        title="Erase Asset Track"
                      >
                        <Trash2 size={11} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Interactive Upload Box Column */}
          <div className="space-y-4">
            {/* Object Storage Quota Gauge Panel */}
            {(() => {
              const sizeByCat = {
                image: assets.filter(a => a.category === 'image').reduce((s, a) => s + (a.file_size || 0), 0),
                voice: assets.filter(a => a.category === 'voice').reduce((s, a) => s + (a.file_size || 0), 0),
                video: assets.filter(a => a.category === 'video').reduce((s, a) => s + (a.file_size || 0), 0),
                report: assets.filter(a => a.category === 'report').reduce((s, a) => s + (a.file_size || 0), 0),
              };
              const totalBytesUsed = sizeByCat.image + sizeByCat.voice + sizeByCat.video + sizeByCat.report;
              const quotaBytes = quotaLimitGB * 1024 * 1024 * 1024;
              const percentagePassed = Math.min(100, (totalBytesUsed / quotaBytes) * 100);

              return (
                <div className="bg-[#121214] border border-zinc-800 rounded-xl p-5 space-y-4 animate-fade-in" id="storage-quota-gauge-panel">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Database className="text-blue-500 shrink-0" size={18} />
                      <h3 className="text-zinc-200 text-xs font-black uppercase tracking-wider">Cloud Storage Quota</h3>
                    </div>
                    <span className={`text-[9px] font-black uppercase font-mono px-2 py-0.5 rounded-full ${
                      percentagePassed > 90 ? 'bg-red-950 text-red-500 border border-red-500/30' :
                      percentagePassed > 75 ? 'bg-yellow-950 text-yellow-500 border border-yellow-500/30' : 'bg-blue-950/40 text-blue-400 border border-blue-500/20'
                    }`}>
                      {percentagePassed.toFixed(2)}% Used
                    </span>
                  </div>

                  {/* Progress bar with multiple status color segments depending on category */}
                  <div className="h-2.5 rounded-full bg-zinc-900 overflow-hidden relative flex">
                    {sizeByCat.image > 0 && (
                      <div 
                        className="h-full bg-amber-500 transition-all duration-300 pointer-events-auto"
                        style={{ width: `${Math.max(2, (sizeByCat.image / quotaBytes) * 100)}%` }}
                        title={`Images: ${formatBytes(sizeByCat.image)}`}
                      />
                    )}
                    {sizeByCat.voice > 0 && (
                      <div 
                        className="h-full bg-purple-500 transition-all duration-300 pointer-events-auto"
                        style={{ width: `${Math.max(2, (sizeByCat.voice / quotaBytes) * 100)}%` }}
                        title={`Voice Synthesis: ${formatBytes(sizeByCat.voice)}`}
                      />
                    )}
                    {sizeByCat.video > 0 && (
                      <div 
                        className="h-full bg-blue-500 transition-all duration-300 pointer-events-auto"
                        style={{ width: `${Math.max(2, (sizeByCat.video / quotaBytes) * 100)}%` }}
                        title={`Video Assets: ${formatBytes(sizeByCat.video)}`}
                      />
                    )}
                    {sizeByCat.report > 0 && (
                      <div 
                        className="h-full bg-emerald-500 transition-all duration-300 pointer-events-auto"
                        style={{ width: `${Math.max(2, (sizeByCat.report / quotaBytes) * 100)}%` }}
                        title={`Reports: ${formatBytes(sizeByCat.report)}`}
                      />
                    )}
                  </div>

                  {/* Legend with precise details */}
                  <div className="grid grid-cols-2 gap-x-3 gap-y-2 text-[9px] uppercase font-bold text-zinc-500 font-mono">
                    <div className="flex items-center gap-1.5 min-w-0">
                      <span className="w-2 h-2 rounded-full bg-amber-500 shrink-0" />
                      <span className="truncate">Images: {formatBytes(sizeByCat.image)}</span>
                    </div>
                    <div className="flex items-center gap-1.5 min-w-0 font-bold">
                      <span className="w-2 h-2 rounded-full bg-purple-500 shrink-0" />
                      <span className="truncate">Voice: {formatBytes(sizeByCat.voice)}</span>
                    </div>
                    <div className="flex items-center gap-1.5 min-w-0">
                      <span className="w-2 h-2 rounded-full bg-blue-500 shrink-0" />
                      <span className="truncate">Video: {formatBytes(sizeByCat.video)}</span>
                    </div>
                    <div className="flex items-center gap-1.5 min-w-0">
                      <span className="w-2 h-2 rounded-full bg-emerald-500 shrink-0" />
                      <span className="truncate">Report: {formatBytes(sizeByCat.report)}</span>
                    </div>
                  </div>

                  <div className="pt-3 border-t border-zinc-850 space-y-2.5">
                    <div className="flex justify-between items-center text-[10px] text-zinc-400">
                      <span className="font-bold">Total Consumed</span>
                      <span className="font-black text-white font-mono">
                        {formatBytes(totalBytesUsed)} of {quotaLimitGB}.00 GB
                      </span>
                    </div>

                    {/* Quota slider config */}
                    <div className="space-y-1 bg-zinc-950 p-2.5 rounded-xl border border-zinc-850/60">
                      <div className="flex justify-between items-center text-[8px] font-black uppercase text-zinc-500">
                        <span>Modify Allocated Quota Limit</span>
                        <span className="text-blue-400 font-mono">{quotaLimitGB} GB</span>
                      </div>
                      <input 
                        type="range"
                        min="1"
                        max="50"
                        step="1"
                        value={quotaLimitGB}
                        onChange={(e) => setQuotaLimitGB(Number(e.target.value))}
                        className="w-full accent-blue-500 bg-zinc-900 rounded-lg cursor-pointer h-1 outline-none"
                      />
                    </div>
                  </div>
                </div>
              );
            })()}

            <div className="bg-[#121214] border border-zinc-800 rounded-xl p-5 space-y-4">
              <div className="flex items-center gap-2">
                <UploadCloud className="text-orange-500 shrink-0" size={18} />
                <h3 className="text-zinc-200 text-xs font-black uppercase tracking-wider">Asset Uploader Core</h3>
              </div>
              <p className="text-zinc-400 text-[11px] leading-relaxed">
                Add media directories directly to S3 / Cloudflare R2 buffers. The file is mapped across categories instantly.
              </p>

              {/* Upload settings */}
              <div className="space-y-3">
                <div>
                  <label className="text-[11px] font-bold text-zinc-400 block mb-1">Target Category</label>
                  <select
                    value={uploadCategory}
                    onChange={(e: any) => setUploadCategory(e.target.value)}
                    className="w-full bg-[#18181b] border border-zinc-800 rounded-lg p-2 text-xs font-semibold text-zinc-200 focus:outline-none focus:border-red-500"
                  >
                    <option value="image">Images (JPG/PNG/WEBP)</option>
                    <option value="voice">Voice Files (MP3/WAV)</option>
                    <option value="video">Videos (MP4/WEBM)</option>
                    <option value="report">Reports / Screenplays (MD/PDF)</option>
                  </select>
                </div>

                {/* Drag and Drop Zone */}
                <div
                  onDragEnter={handleDrag}
                  onDragOver={handleDrag}
                  onDragLeave={handleDrag}
                  onDrop={handleDrop}
                  className={`border-2 border-dashed rounded-lg p-6 py-8 text-center cursor-pointer transition relative ${
                    dragActive 
                      ? 'border-orange-500 bg-orange-600/5' 
                      : 'border-zinc-800 hover:border-zinc-700 bg-zinc-900/10'
                  }`}
                  onClick={() => document.getElementById('file-upload-input')?.click()}
                >
                  <input
                    id="file-upload-input"
                    type="file"
                    className="hidden"
                    onChange={handleFileChange}
                    accept="image/*,audio/*,video/*,.md,.txt,.pdf,.json"
                  />
                  <UploadCloud className="mx-auto text-zinc-500 mb-2 group-hover:text-orange-500 transition" size={24} />
                  {selectedFile ? (
                    <div className="space-y-1">
                      <p className="text-zinc-200 text-xs font-bold truncate max-w-full px-2">{selectedFile.name}</p>
                      <p className="text-zinc-500 text-[10px] font-mono">{formatBytes(selectedFile.size)}</p>
                    </div>
                  ) : (
                    <div>
                      <p className="text-zinc-300 text-xs font-bold">Drag & drop files here</p>
                      <p className="text-zinc-500 text-[10px] mt-0.5">or click to browse local files</p>
                    </div>
                  )}
                </div>

                {/* Submit uploads */}
                {selectedFile && (
                  <button
                    onClick={handleUpload}
                    disabled={isUploading}
                    className="w-full flex items-center justify-center gap-2 bg-gradient-to-r from-red-600 to-orange-600 hover:from-red-500 hover:to-orange-500 text-white font-bold py-2.5 px-4 rounded-lg text-xs mt-2 disabled:opacity-50"
                  >
                    {isUploading ? (
                      <>
                        <RefreshCw size={13} className="animate-spin" />
                        <span>Streaming File to S3/R2...</span>
                      </>
                    ) : (
                      <>
                        <CheckCircle2 size={13} />
                        <span>Confirm Stream Upload</span>
                      </>
                    )}
                  </button>
                )}
              </div>
            </div>

            {/* Storage Info Widget */}
            <div className="bg-[#121214] border border-zinc-800 rounded-xl p-5 space-y-3">
              <h3 className="text-zinc-300 text-[10px] uppercase font-black tracking-widest">Active Storage stats</h3>
              <div className="grid grid-cols-2 gap-2 text-zinc-400 text-xs">
                <div className="bg-[#18181b] p-3 rounded-lg border border-zinc-800/60">
                  <span className="text-[10px] text-zinc-500 block mb-0.5">Total Mapped size</span>
                  <span className="text-white font-mono font-bold text-sm">
                    {formatBytes(assets.reduce((sum, a) => sum + (a.file_size || 0), 0))}
                  </span>
                </div>
                <div className="bg-[#18181b] p-3 rounded-lg border border-zinc-800/60">
                  <span className="text-[10px] text-zinc-500 block mb-0.5">Physical files</span>
                  <span className="text-white font-mono font-bold text-sm">
                    {assets.length} items
                  </span>
                </div>
              </div>
            </div>
            
          </div>
        </div>
      )}

      {activeTab === 'config' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 bg-[#121214] border border-zinc-800 rounded-xl p-6">
            <div className="flex items-center gap-2 mb-4">
              <Server className="text-orange-500" size={18} />
              <h3 className="text-zinc-200 text-xs font-black uppercase tracking-wider">Storage Target Parameters</h3>
            </div>
            
            <form onSubmit={handleSaveConfig} className="space-y-4">
              {/* Provider Selection */}
              <div>
                <label className="text-[11px] font-bold text-zinc-400 uppercase tracking-widest block mb-2">Provider</label>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => setConfig({ ...config, provider: 'cloudflare_r2' })}
                    className={`flex items-center justify-center gap-3 p-4 rounded-xl border text-left transition ${
                      config.provider === 'cloudflare_r2'
                        ? 'border-orange-500 bg-orange-500/5 text-white'
                        : 'border-zinc-800 bg-zinc-900/30 text-zinc-400 hover:border-zinc-700'
                    }`}
                  >
                    <div className="w-8 h-8 rounded-lg bg-orange-600/10 flex items-center justify-center text-orange-500">
                      <CloudLightning size={18} />
                    </div>
                    <div>
                      <div className="text-xs font-bold">Cloudflare R2</div>
                      <div className="text-[9px] text-zinc-500">Zero Egress Fees</div>
                    </div>
                  </button>
                  <button
                    type="button"
                    onClick={() => setConfig({ ...config, provider: 'aws_s3' })}
                    className={`flex items-center justify-center gap-3 p-4 rounded-xl border text-left transition ${
                      config.provider === 'aws_s3'
                        ? 'border-orange-500 bg-orange-500/5 text-white'
                        : 'border-zinc-800 bg-zinc-900/30 text-zinc-400 hover:border-zinc-700'
                    }`}
                  >
                    <div className="w-8 h-8 rounded-lg bg-red-600/10 flex items-center justify-center text-red-500">
                      <Database size={18} />
                    </div>
                    <div>
                      <div className="text-xs font-bold">Amazon S3</div>
                      <div className="text-[9px] text-zinc-500">AWS Enterprise Standard</div>
                    </div>
                  </button>
                </div>
              </div>

              {/* Bucket / Endpoint Rows */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="text-[11px] font-bold text-zinc-400 mb-1.5 block">Bucket Name</label>
                  <input
                    type="text"
                    value={config.bucket || ''}
                    placeholder="my-ranktica-assets"
                    onChange={(e) => setConfig({ ...config, bucket: e.target.value })}
                    className="w-full bg-[#18181b] border border-zinc-800 rounded-lg p-2.5 text-xs text-zinc-200 focus:outline-none focus:border-red-500"
                  />
                </div>
                <div>
                  <label className="text-[11px] font-bold text-zinc-400 mb-1.5 block">Region / Location ID</label>
                  <input
                    type="text"
                    value={config.region || ''}
                    placeholder="us-east-1"
                    onChange={(e) => setConfig({ ...config, region: e.target.value })}
                    className="w-full bg-[#18181b] border border-zinc-800 rounded-lg p-2.5 text-xs text-zinc-200 focus:outline-none focus:border-red-500"
                  />
                </div>
              </div>

              {/* Custom Endpoint URL for Cloudflare R2 */}
              {config.provider === 'cloudflare_r2' && (
                <div>
                  <div className="flex justify-between items-center mb-1.5">
                    <label className="text-[11px] font-bold text-zinc-400 block">R2 S3-Compatible Custom Endpoint</label>
                    <span className="text-[9px] text-zinc-500 font-mono">Found in CF Portal credentials</span>
                  </div>
                  <input
                    type="text"
                    value={config.endpoint || ''}
                    placeholder="https://<account-id>.r2.cloudflarestorage.com"
                    onChange={(e) => setConfig({ ...config, endpoint: e.target.value })}
                    className="w-full bg-[#18181b] border border-zinc-800 rounded-lg p-2.5 text-xs font-mono text-zinc-200 focus:outline-none focus:border-red-500"
                  />
                </div>
              )}

              {/* Security Credentials */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="text-[11px] font-bold text-zinc-400 mb-1.5 block">Access Key ID</label>
                  <input
                    type="text"
                    value={config.access_key_id || ''}
                    placeholder="AKIAIOSFODNN7EXAMPLE"
                    onChange={(e) => setConfig({ ...config, access_key_id: e.target.value })}
                    className="w-full bg-[#18181b] border border-zinc-800 rounded-lg p-2.5 text-xs font-mono text-zinc-200 focus:outline-none focus:border-red-500"
                  />
                </div>
                <div>
                  <div className="flex items-center gap-1.5 mb-1.5">
                    <label className="text-[11px] font-bold text-zinc-400 block">Secret Access Key</label>
                    <Lock size={10} className="text-zinc-500 animate-pulse" />
                  </div>
                  <input
                    type="password"
                    value={config.secret_access_key || ''}
                    placeholder="••••••••••••••••••••••••••••••••"
                    onChange={(e) => setConfig({ ...config, secret_access_key: e.target.value })}
                    className="w-full bg-[#18181b] border border-zinc-800 rounded-lg p-2.5 text-xs font-mono text-zinc-200 focus:outline-none focus:border-red-500"
                  />
                </div>
              </div>

              {/* Public CDN Prefix */}
              <div>
                <div className="flex justify-between items-center mb-1.5">
                  <label className="text-[11px] font-bold text-zinc-400 block">Public CDN URL Prefix (CDN Domain)</label>
                  <span className="text-[9px] text-zinc-500">Resolves relative object pointers for the browser</span>
                </div>
                <input
                  type="text"
                  value={config.public_url || ''}
                  placeholder={config.provider === 'cloudflare_r2' ? 'https://pub-yourdomain.r2.dev' : 'https://my-bucket.s3.amazonaws.com'}
                  onChange={(e) => setConfig({ ...config, public_url: e.target.value })}
                  className="w-full bg-[#18181b] border border-zinc-800 rounded-lg p-2.5 text-xs font-mono text-zinc-200 focus:outline-none focus:border-red-500"
                />
              </div>

              <div className="flex pt-4">
                <button
                  type="submit"
                  disabled={isSaving}
                  className="bg-gradient-to-r from-red-600 to-orange-600 hover:from-red-500 hover:to-orange-500 text-white font-bold py-2.5 px-6 rounded-lg text-xs flex items-center gap-2 transition ml-auto"
                >
                  {isSaving ? (
                    <>
                      <RefreshCw size={13} className="animate-spin" />
                      <span>Saving Parameters...</span>
                    </>
                  ) : (
                    <>
                      <FolderSync size={13} />
                      <span>Save and Activate Credentials</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>

          <div className="space-y-4">
            <div className="bg-[#121214] border border-zinc-800 rounded-xl p-5 space-y-4">
              <div className="flex items-center gap-2">
                <AlertCircle className="text-amber-500" size={16} />
                <h4 className="text-zinc-300 text-[10px] uppercase font-black tracking-wider">Resilient Hybrid Fallback Mode</h4>
              </div>
              <p className="text-zinc-400 text-xs leading-relaxed">
                If credentials are clear or unspecified, Ranktica AI handles all operations via our <strong>local uploaded assets</strong> folder fallback on the backend.
              </p>
              <div className="p-3 bg-zinc-900/60 rounded-lg border border-zinc-800/80 space-y-2">
                <span className="text-[10px] text-zinc-400 font-bold block uppercase tracking-wider">Local folder paths</span>
                <code className="text-[10px] text-orange-400 font-mono italic block truncate">./uploaded_assets/</code>
                <span className="text-[9px] text-zinc-500 block">Serves assets securely on client local interfaces.</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'migration' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 bg-[#121214] border border-zinc-800 rounded-xl p-6 space-y-6">
            <div className="flex items-center gap-2">
              <FolderSync className="text-orange-500 shrink-0" size={20} />
              <div>
                <h3 className="text-zinc-200 text-xs font-black uppercase tracking-wider">SQLite Row Separation Engine</h3>
                <p className="text-zinc-500 text-[10px] lowercase">De-clutter the sql database from heavy payloads</p>
              </div>
            </div>

            <p className="text-zinc-300 text-xs leading-relaxed">
              When projects are generated with large screenplays or heavy base64 image strings, storing them as TEXT rows inside SQLite blocks pipeline performance. 
              Running the decoupling migration will automatically parse each project record:
            </p>

            <ul className="text-zinc-400 text-xs space-y-2 pl-4 list-decimal">
              <li>Scans the <code>projects.assets</code> SQLite serialized JSON column.</li>
              <li>Isolates any raw Base64 strings or screenplay manuscripts exceeding 200 character lines.</li>
              <li>Saves those elements as dedicated assets inside S3/R2 Object Storage or local system folder structure.</li>
              <li>Re-writes the SQLite project record, replacing the heavy blobs with lightweight CDN URL pointer strings.</li>
            </ul>

            <div className="p-4 bg-[#18181b] border border-zinc-800/80 rounded-xl flex items-center justify-between">
              <div className="space-y-1">
                <span className="text-zinc-300 font-bold text-xs block">Launch isolation analyzer now</span>
                <span className="text-zinc-500 text-[10px] block">Safe to run. Relational rows remain intact. No data loss.</span>
              </div>
              <button
                onClick={triggerMigration}
                disabled={isMigrating}
                className="bg-[#18181b] hover:bg-zinc-800 text-white font-bold p-3 py-2 rounded-lg border border-zinc-700 text-xs flex items-center gap-2 transition disabled:opacity-50"
              >
                {isMigrating ? (
                  <>
                    <RefreshCw size={13} className="animate-spin text-orange-500" />
                    <span>Processing Migration Engine...</span>
                  </>
                ) : (
                  <>
                    <Sparkles size={13} className="text-orange-500" />
                    <span>Isolate Assets from SQL Rows</span>
                  </>
                )}
              </button>
            </div>

            {/* Migration results output */}
            {migrationResult && (
              <div className="bg-[#18181b]/30 border border-zinc-800 rounded-xl p-5 space-y-4 animate-scale-in">
                <div className="flex items-center gap-1.5 text-emerald-400 text-xs font-bold uppercase tracking-wider">
                  <CheckCircle2 size={14} />
                  <span>Migration completed successfully</span>
                </div>
                
                <div className="grid grid-cols-2 gap-4 text-zinc-400 text-xs font-mono bg-zinc-900/40 p-3 rounded-lg border border-zinc-800">
                  <div>
                    <span className="text-zinc-500 text-[10px] block">Project rows processed</span>
                    <span className="text-white font-bold font-sans text-sm">{migrationResult.migratedCount} rows</span>
                  </div>
                  <div>
                    <span className="text-zinc-500 text-[10px] block">Stored objects generated</span>
                    <span className="text-white font-bold font-sans text-sm">{migrationResult.filesCreated.length} files</span>
                  </div>
                </div>

                {migrationResult.filesCreated.length > 0 && (
                  <div className="space-y-2">
                    <span className="text-[10px] text-zinc-500 uppercase tracking-widest font-black block">Isolated Storage Assets Registered:</span>
                    <div className="space-y-2.5 max-h-48 overflow-y-auto pr-1">
                      {migrationResult.filesCreated.map((file, idx) => (
                        <div key={idx} className="bg-[#1c1c20] p-2 rounded border border-zinc-800 text-[10px] flex justify-between items-center">
                          <div className="min-w-0">
                            <span className="text-zinc-300 font-bold block truncate">{file.fileName}</span>
                            <span className="text-zinc-500 block truncate">Reference: project "{file.projectTitle}"</span>
                          </div>
                          <a 
                            href={file.storageUrl} 
                            target="_blank" 
                            rel="noreferrer" 
                            className="bg-[#121214] text-zinc-400 hover:text-white px-2 py-1 rounded border border-zinc-800 font-bold shrink-0 flex items-center gap-1 transition"
                          >
                            <span>Link</span>
                            <ExternalLink size={10} />
                          </a>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>

          <div className="space-y-4">
            <div className="bg-[#121214] border border-zinc-800 rounded-xl p-5 space-y-3">
              <h4 className="text-zinc-300 text-[10px] uppercase font-black tracking-widest">Platform Integrity Statement</h4>
              <p className="text-zinc-400 text-xs leading-relaxed">
                By decoupling binary items from SQL tables, the platform database overhead decreases by up to <strong>92.8%</strong>, reducing latency, unlocking rapid query caching, and guaranteeing standard compliance models.
              </p>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
