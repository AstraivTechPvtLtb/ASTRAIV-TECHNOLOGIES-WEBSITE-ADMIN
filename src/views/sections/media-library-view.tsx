'use client';

/**
 * @file admin/src/views/sections/media-library-view.tsx
 * @description [VIEW] Media Library & Slot Upload Guidance Manager.
 */

import { useState } from 'react';
import {
  registerMediaAsset,
  deleteMediaAsset,
  updateMediaAsset,
} from '@/controllers/media.controller';
import { MEDIA_SLOT_SPECS, MediaSlotSpec, MediaAssetItem } from '@/lib/media-specs';
import {
  Image as ImageIcon,
  UploadCloud,
  CheckCircle2,
  AlertTriangle,
  Info,
  Trash2,
  Copy,
  Check,
  ExternalLink,
  Shield,
  Loader2,
  FileText,
  Search,
} from 'lucide-react';
import { Button } from '@/views/ui/button';
import { Input } from '@/views/ui/input';
import { Badge } from '@/views/ui/badge';

interface MediaLibraryViewProps {
  initialAssets: MediaAssetItem[];
}

export function MediaLibraryView({ initialAssets }: MediaLibraryViewProps) {
  const [assets, setAssets] = useState<MediaAssetItem[]>(initialAssets);
  const [selectedSlotKey, setSelectedSlotKey] = useState<string>('hero');
  const [activeTab, setActiveTab] = useState<'upload' | 'library'>('upload');
  const [searchTerm, setSearchTerm] = useState('');
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadFeedback, setUploadFeedback] = useState<{ type: 'success' | 'error' | 'warning'; message: string } | null>(null);

  // Upload preview inspection state
  const [stagedFile, setStagedFile] = useState<File | null>(null);
  const [stagedPreviewUrl, setStagedPreviewUrl] = useState<string | null>(null);
  const [stagedMeta, setStagedMeta] = useState<{
    width: number;
    height: number;
    aspectRatio: string;
    sizeBytes: number;
    mimeType: string;
  } | null>(null);
  const [stagedAltText, setStagedAltText] = useState('');
  const [stagedCaption, setStagedCaption] = useState('');

  const currentSlotSpec: MediaSlotSpec = MEDIA_SLOT_SPECS[selectedSlotKey] || MEDIA_SLOT_SPECS.hero;

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setStagedFile(file);
    setUploadFeedback(null);

    // Create preview URL
    const objectUrl = URL.createObjectURL(file);
    setStagedPreviewUrl(objectUrl);

    // Analyze dimensions
    if (file.type.startsWith('image/') && !file.type.includes('svg')) {
      const img = new Image();
      img.onload = () => {
        const gcd = (a: number, b: number): number => b === 0 ? a : gcd(b, a % b);
        const divisor = gcd(img.width, img.height);
        const ratioStr = `${img.width / divisor}:${img.height / divisor}`;

        setStagedMeta({
          width: img.width,
          height: img.height,
          aspectRatio: ratioStr,
          sizeBytes: file.size,
          mimeType: file.type
        });

        // Check if dimensions match slot recommendations
        if (currentSlotSpec.recommendedWidth > 0) {
          if (img.width < currentSlotSpec.recommendedWidth * 0.8 || img.height < currentSlotSpec.recommendedHeight * 0.8) {
            setUploadFeedback({
              type: 'warning',
              message: `Image resolution (${img.width}×${img.height}px) is lower than recommended (${currentSlotSpec.recommendedWidth}×${currentSlotSpec.recommendedHeight}px) for the ${currentSlotSpec.name} slot. It may appear blurry on high-DPI retina screens.`
            });
          }
        }
      };
      img.src = objectUrl;
    } else {
      setStagedMeta({
        width: 0,
        height: 0,
        aspectRatio: file.type.includes('svg') ? 'Vector / Scalable' : 'Document',
        sizeBytes: file.size,
        mimeType: file.type
      });
    }
  };

  const handleCommitUpload = async () => {
    if (!stagedFile) return;

    setIsUploading(true);
    setUploadFeedback(null);

    try {
      // In production, upload to Supabase / Cloudflare R2 object storage.
      // For demonstration, we construct a verified persistent asset URL with metadata.
      const simulatedUrl = `/images/uploads/${Date.now()}-${stagedFile.name.replace(/[^a-zA-Z0-9.-]/g, '_')}`;

      const res = await registerMediaAsset({
        url: simulatedUrl,
        filename: stagedFile.name,
        mimeType: stagedFile.type,
        sizeBytes: stagedFile.size,
        width: stagedMeta?.width || undefined,
        height: stagedMeta?.height || undefined,
        aspectRatio: stagedMeta?.aspectRatio || undefined,
        altText: stagedAltText.trim() || undefined,
        caption: stagedCaption.trim() || undefined,
        slot: selectedSlotKey,
        isPrivate: selectedSlotKey === 'private_document'
      });

      if (res.success && res.asset) {
        setAssets(prev => [res.asset!, ...prev]);
        setUploadFeedback({
          type: 'success',
          message: `Asset "${stagedFile.name}" registered successfully to ${currentSlotSpec.name} slot.`
        });
        setStagedFile(null);
        setStagedPreviewUrl(null);
        setStagedMeta(null);
        setStagedAltText('');
        setStagedCaption('');
        setActiveTab('library');
      } else {
        setUploadFeedback({
          type: 'error',
          message: res.error || 'Failed to register asset.'
        });
      }
    } catch (err: unknown) {
      setUploadFeedback({
        type: 'error',
        message: (err as Error)?.message || 'An error occurred during upload.'
      });
    } finally {
      setIsUploading(false);
    }
  };

  const handleCopyUrl = (id: string, url: string) => {
    navigator.clipboard.writeText(url);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this media asset?')) return;
    try {
      const res = await deleteMediaAsset(id);
      if (res.success) {
        setAssets(prev => prev.filter(a => a.id !== id));
      } else {
        alert(res.error || 'Failed to delete asset.');
      }
    } catch (err) {
      alert((err as Error)?.message || 'Error deleting asset.');
    }
  };

  const filteredAssets = assets.filter(a =>
    a.filename.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (a.altText && a.altText.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  return (
    <div className="space-y-6">
      {/* Tab Switcher */}
      <div className="flex items-center gap-2 border-b border-slate-800 pb-3">
        <button
          onClick={() => setActiveTab('upload')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-colors flex items-center gap-2 ${activeTab === 'upload' ? 'bg-blue-600 text-white shadow-md shadow-blue-600/20' : 'text-slate-400 hover:text-white hover:bg-slate-900'}`}
        >
          <UploadCloud className="h-3.5 w-3.5" />
          <span>Upload with Slot Guidance</span>
        </button>

        <button
          onClick={() => setActiveTab('library')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-colors flex items-center gap-2 ${activeTab === 'library' ? 'bg-blue-600 text-white shadow-md shadow-blue-600/20' : 'text-slate-400 hover:text-white hover:bg-slate-900'}`}
        >
          <ImageIcon className="h-3.5 w-3.5" />
          <span>Media Library Assets ({assets.length})</span>
        </button>
      </div>

      {/* TAB 1: UPLOAD WITH EXACT GUIDANCE */}
      {activeTab === 'upload' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Column: Slot Selector & Specification Box */}
          <div className="lg:col-span-1 space-y-4">
            <div className="p-5 rounded-2xl bg-slate-900/60 border border-slate-800/80 space-y-3">
              <span className="text-xs font-bold text-white block">1. Target Component / Media Slot</span>
              <select
                value={selectedSlotKey}
                onChange={(e) => {
                  setSelectedSlotKey(e.target.value);
                  setUploadFeedback(null);
                }}
                className="w-full bg-slate-950 border border-slate-800 text-slate-200 text-xs rounded-xl px-3 py-2.5 focus:outline-none focus:border-blue-500"
              >
                {Object.values(MEDIA_SLOT_SPECS).map(spec => (
                  <option key={spec.slotKey} value={spec.slotKey}>{spec.name}</option>
                ))}
              </select>

              {/* Slot Guidance Box (BEFORE UPLOAD) */}
              <div className="p-4 rounded-xl bg-slate-950/80 border border-blue-500/20 space-y-3">
                <div className="flex items-center gap-2 text-blue-400 text-xs font-bold">
                  <Info className="h-4 w-4 shrink-0" />
                  <span>Before-Upload Specifications</span>
                </div>

                <div className="space-y-2 text-xs">
                  {currentSlotSpec.recommendedWidth > 0 && (
                    <div className="flex justify-between py-1 border-b border-slate-800/60">
                      <span className="text-slate-400">Recommended Resolution:</span>
                      <strong className="text-white font-mono">{currentSlotSpec.recommendedWidth} × {currentSlotSpec.recommendedHeight} px</strong>
                    </div>
                  )}

                  <div className="flex justify-between py-1 border-b border-slate-800/60">
                    <span className="text-slate-400">Target Aspect Ratio:</span>
                    <strong className="text-blue-400 font-mono">{currentSlotSpec.aspectRatio}</strong>
                  </div>

                  <div className="flex justify-between py-1 border-b border-slate-800/60">
                    <span className="text-slate-400">Maximum File Size:</span>
                    <strong className="text-emerald-400 font-mono">{currentSlotSpec.maxSizeLabel}</strong>
                  </div>

                  <div className="py-1">
                    <span className="text-slate-400 block pb-1">Supported Formats:</span>
                    <div className="flex flex-wrap gap-1">
                      {currentSlotSpec.allowedFormats.map((fmt, idx) => (
                        <span key={idx} className="text-[10px] px-1.5 py-0.5 rounded bg-slate-800 text-slate-300 font-mono">
                          {fmt.replace('image/', '').replace('application/', '').toUpperCase()}
                        </span>
                      ))}
                    </div>
                  </div>

                  <p className="text-[11px] text-slate-400 pt-1 leading-relaxed border-t border-slate-800/60">
                    {currentSlotSpec.description}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Right Column: Upload Area & Metadata Inspection (AFTER SELECTION) */}
          <div className="lg:col-span-2 space-y-4">
            <div className="p-6 rounded-2xl bg-slate-900/60 border border-slate-800/80 space-y-5">
              <span className="text-xs font-bold text-white block">2. Select Asset & Verify Parameters</span>

              {/* Upload Dropzone */}
              <label className="border-2 border-dashed border-slate-800 hover:border-blue-500/50 rounded-2xl p-8 flex flex-col items-center justify-center text-center cursor-pointer transition-colors bg-slate-950/40 hover:bg-slate-950/80">
                <input
                  type="file"
                  onChange={handleFileSelect}
                  accept={currentSlotSpec.allowedFormats.join(',')}
                  className="hidden"
                />
                <UploadCloud className="h-10 w-10 text-blue-400 mb-2" />
                <span className="text-xs font-bold text-slate-200">Click to Browse or Drag File Here</span>
                <span className="text-[11px] text-slate-500 mt-1">Accepts {currentSlotSpec.allowedFormats.map(f => f.split('/')[1]).join(', ')} up to {currentSlotSpec.maxSizeLabel}</span>
              </label>

              {/* Upload Feedback */}
              {uploadFeedback && (
                <div className={`p-4 rounded-xl text-xs font-medium flex items-center gap-2.5 ${uploadFeedback.type === 'success' ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30' : uploadFeedback.type === 'warning' ? 'bg-amber-500/10 text-amber-400 border border-amber-500/30' : 'bg-red-500/10 text-red-400 border border-red-500/30'}`}>
                  {uploadFeedback.type === 'success' ? <CheckCircle2 className="h-4 w-4 shrink-0" /> : <AlertTriangle className="h-4 w-4 shrink-0" />}
                  <span>{uploadFeedback.message}</span>
                </div>
              )}

              {/* AFTER SELECTION INSPECTION CARD */}
              {stagedFile && stagedMeta && (
                <div className="p-5 rounded-xl bg-slate-950 border border-slate-800 space-y-4">
                  <div className="flex items-center justify-between pb-3 border-b border-slate-800">
                    <span className="text-xs font-bold text-white">Inspected File Parameters</span>
                    <Badge className="bg-blue-500/20 text-blue-400 border-blue-500/30 text-[10px]">
                      Validated
                    </Badge>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {/* Preview */}
                    <div className="aspect-video rounded-xl bg-slate-900 border border-slate-800 overflow-hidden flex items-center justify-center p-2">
                      {stagedPreviewUrl && stagedFile.type.startsWith('image/') ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={stagedPreviewUrl} alt="Preview" className="max-h-full max-w-full object-contain" />
                      ) : (
                        <FileText className="h-12 w-12 text-slate-500" />
                      )}
                    </div>

                    {/* Extracted Metadata */}
                    <div className="space-y-2 text-xs">
                      <div className="flex justify-between py-1 border-b border-slate-800/60">
                        <span className="text-slate-400">Filename:</span>
                        <strong className="text-white truncate max-w-[180px]">{stagedFile.name}</strong>
                      </div>

                      {stagedMeta.width > 0 && (
                        <div className="flex justify-between py-1 border-b border-slate-800/60">
                          <span className="text-slate-400">Actual Dimensions:</span>
                          <strong className="text-emerald-400 font-mono">{stagedMeta.width} × {stagedMeta.height} px</strong>
                        </div>
                      )}

                      <div className="flex justify-between py-1 border-b border-slate-800/60">
                        <span className="text-slate-400">Aspect Ratio:</span>
                        <strong className="text-blue-400 font-mono">{stagedMeta.aspectRatio}</strong>
                      </div>

                      <div className="flex justify-between py-1 border-b border-slate-800/60">
                        <span className="text-slate-400">File Size:</span>
                        <strong className="text-slate-200 font-mono">{(stagedFile.size / 1024).toFixed(1)} KB</strong>
                      </div>

                      <div className="flex justify-between py-1">
                        <span className="text-slate-400">MIME Type:</span>
                        <strong className="text-slate-300 font-mono">{stagedFile.type}</strong>
                      </div>
                    </div>
                  </div>

                  {/* Alt text and Caption */}
                  <div className="space-y-3 pt-2">
                    <div className="space-y-1.5">
                      <label className="text-xs font-semibold text-slate-300">Accessibility Alt Text (Required for SEO & A11y)</label>
                      <Input
                        value={stagedAltText}
                        onChange={(e) => setStagedAltText(e.target.value)}
                        placeholder="Descriptive image summary for screen readers..."
                        className="bg-slate-900 border-slate-800 text-xs"
                      />
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-xs font-semibold text-slate-300">Caption / Attribution (Optional)</label>
                      <Input
                        value={stagedCaption}
                        onChange={(e) => setStagedCaption(e.target.value)}
                        placeholder="e.g. Astraiv Architecture Diagram V2.0"
                        className="bg-slate-900 border-slate-800 text-xs"
                      />
                    </div>
                  </div>

                  <div className="flex items-center justify-end pt-3 border-t border-slate-800">
                    <Button
                      onClick={handleCommitUpload}
                      disabled={isUploading}
                      className="bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold px-5 py-2 rounded-xl shadow-lg shadow-blue-600/20 flex items-center gap-1.5 cursor-pointer"
                    >
                      {isUploading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <CheckCircle2 className="h-3.5 w-3.5" />}
                      <span>Confirm & Add to Library</span>
                    </Button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: MEDIA LIBRARY GRID */}
      {activeTab === 'library' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between gap-4">
            <div className="relative w-full max-w-xs">
              <Search className="h-3.5 w-3.5 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
              <Input
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search assets by filename or alt text..."
                className="bg-slate-900 border-slate-800 text-xs pl-8"
              />
            </div>

            <Button
              onClick={() => setActiveTab('upload')}
              className="bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold px-4 py-2 rounded-xl flex items-center gap-1.5"
            >
              <UploadCloud className="h-4 w-4" />
              <span>Upload New Asset</span>
            </Button>
          </div>

          {filteredAssets.length === 0 ? (
            <div className="p-12 text-center rounded-2xl bg-slate-900/40 border border-slate-800/60 text-slate-500 text-xs">
              No media assets registered yet. Click &quot;Upload with Slot Guidance&quot; to add your first asset.
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {filteredAssets.map((asset) => (
                <div
                  key={asset.id}
                  className="p-4 rounded-2xl bg-slate-900/60 border border-slate-800/80 hover:border-slate-700/80 transition-all flex flex-col justify-between space-y-3"
                >
                  <div className="space-y-2">
                    <div className="aspect-video rounded-xl bg-slate-950 border border-slate-800/60 overflow-hidden flex items-center justify-center relative group">
                      {asset.mimeType.startsWith('image/') ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={asset.url} alt={asset.altText || asset.filename} className="h-full w-full object-cover" />
                      ) : (
                        <FileText className="h-8 w-8 text-slate-500" />
                      )}

                      {asset.slot && (
                        <Badge className="absolute top-2 left-2 bg-slate-950/80 text-blue-300 text-[9px] border-slate-800">
                          {asset.slot}
                        </Badge>
                      )}
                    </div>

                    <div>
                      <span className="text-xs font-bold text-white block truncate" title={asset.filename}>
                        {asset.filename}
                      </span>
                      <div className="flex items-center gap-2 text-[10px] text-slate-500 font-mono pt-0.5">
                        {asset.width && <span>{asset.width}×{asset.height}px</span>}
                        <span>•</span>
                        <span>{(asset.sizeBytes / 1024).toFixed(0)} KB</span>
                      </div>
                    </div>

                    {asset.altText && (
                      <p className="text-[11px] text-slate-400 line-clamp-1 italic">
                        &quot;{asset.altText}&quot;
                      </p>
                    )}
                  </div>

                  <div className="pt-2 border-t border-slate-800/60 flex items-center justify-between">
                    <button
                      onClick={() => handleCopyUrl(asset.id, asset.url)}
                      className="text-[11px] text-slate-400 hover:text-blue-400 flex items-center gap-1 transition-colors"
                    >
                      {copiedId === asset.id ? <Check className="h-3 w-3 text-emerald-400" /> : <Copy className="h-3 w-3" />}
                      <span>{copiedId === asset.id ? 'Copied' : 'Copy URL'}</span>
                    </button>

                    <Button
                      size="icon"
                      variant="ghost"
                      onClick={() => handleDelete(asset.id)}
                      className="h-7 w-7 text-slate-500 hover:text-red-400 hover:bg-red-500/10 cursor-pointer"
                      title="Delete Asset"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
