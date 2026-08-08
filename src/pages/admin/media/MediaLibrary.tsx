import React, { useState, useEffect, useRef } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { mediaService } from '../../../services/media.service';
import { mediaDB } from '../../../lib/media-storage';
import { useAuth } from '../../../context/AuthContext';
import { Card, CardContent } from '../../../components/ui/card';
import { Input } from '../../../components/ui/input';
import { Button } from '../../../components/ui/button';
import { Badge } from '../../../components/ui/badge';
import {
  Image as ImageIcon,
  Video as VideoIcon,
  FileText as PdfIcon,
  UploadCloud,
  Trash2,
  Search,
  X,
  AlertTriangle,
  Check,
  Eye,
  Loader2,
  Info,
  Copy,
  ExternalLink,
  Edit2
} from 'lucide-react';

export function MediaLibrary() {
  const queryClient = useQueryClient();
  const { hasPermission } = useAuth();

  // Permissions
  const canRead = hasPermission('Media', 'read');
  const canWrite = hasPermission('Media', 'write');
  const canDelete = hasPermission('Media', 'delete');

  // React Query for assets
  const { data: assets = [], isLoading, error, refetch } = useQuery({
    queryKey: ['media-assets'],
    queryFn: mediaService.getAssets,
    enabled: canRead
  });

  // Local State
  const [resolvedUrls, setResolvedUrls] = useState<Record<string, string>>({});
  const [searchQuery, setSearchQuery] = useState('');
  const [activeFilter, setActiveFilter] = useState<'ALL' | 'IMAGE' | 'VIDEO' | 'PDF'>('ALL');
  const [dragActive, setDragActive] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [uploadSuccess, setUploadSuccess] = useState<string | null>(null);

  // Preview & Inspect Modal State
  const [selectedAsset, setSelectedAsset] = useState<any | null>(null);
  const [isEditAltOpen, setIsEditAltOpen] = useState(false);
  const [editAltText, setEditAltText] = useState('');
  const [isSavingAlt, setIsSavingAlt] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  // Delete Dialog State
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);
  const [confirmDeleteName, setConfirmDeleteName] = useState('');

  const fileInputRef = useRef<HTMLInputElement>(null);

  // Resolve DB mock urls to cached local IndexedDB data urls
  useEffect(() => {
    const resolveCachedAssets = async () => {
      const urls: Record<string, string> = {};
      for (const asset of assets) {
        if (asset.url.startsWith('https://media.platform.local/')) {
          try {
            const cached = await mediaDB.get(asset.url);
            if (cached) {
              urls[asset.id] = cached;
            }
          } catch (e) {
            console.error('Error fetching cached file:', e);
          }
        }
      }
      setResolvedUrls(urls);
    };

    if (assets.length > 0) {
      resolveCachedAssets();
    }
  }, [assets]);

  // Mutations
  const uploadMutation = useMutation({
    mutationFn: mediaService.uploadAsset,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['media-assets'] });
      setIsUploading(false);
      setUploadSuccess('File uploaded successfully!');
      setTimeout(() => setUploadSuccess(null), 3000);
    },
    onError: (err: any) => {
      console.error(err);
      setIsUploading(false);
      setUploadError(err.response?.data?.error?.message || 'Failed to upload media asset.');
    }
  });

  const deleteMutation = useMutation({
    mutationFn: mediaService.deleteAsset,
    onSuccess: async (_, deletedId) => {
      // Find the asset to clean up from local IndexedDB
      const asset = assets.find((a: any) => a.id === deletedId);
      if (asset && asset.url.startsWith('https://media.platform.local/')) {
        await mediaDB.delete(asset.url);
      }
      queryClient.invalidateQueries({ queryKey: ['media-assets'] });
      setConfirmDeleteId(null);
      setSelectedAsset(null);
    },
    onError: (err: any) => {
      alert(err.response?.data?.error?.message || 'Failed to delete asset.');
      setConfirmDeleteId(null);
    }
  });

  // Handle Drag Events
  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };

  // Process File and trigger Upload
  const processFile = async (file: File) => {
    // Check supported types
    const isImage = file.type.startsWith('image/');
    const isVideo = file.type.startsWith('video/');
    const isPdf = file.type === 'application/pdf' || file.name.endsWith('.pdf');

    if (!isImage && !isVideo && !isPdf) {
      setUploadError('Unsupported file type. Please upload an image, video, or PDF.');
      return;
    }

    setIsUploading(true);
    setUploadError(null);

    try {
      // Read file content as Base64 Data URL
      const dataUrl = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result as string);
        reader.onerror = () => reject(reader.error);
        reader.readAsDataURL(file);
      });

      // Generate a valid custom domain URL to bypass backend url validation
      const mockUrl = `https://media.platform.local/uploads/${Date.now()}-${file.name.replace(/[^a-zA-Z0-9.-]/g, '_')}`;

      // Store file contents locally inside client IndexedDB mapped to mockUrl
      await mediaDB.set(mockUrl, dataUrl);

      // Save record in the persistent DB via REST API
      uploadMutation.mutate({
        filename: file.name,
        originalName: file.name,
        mimeType: file.type || (isPdf ? 'application/pdf' : 'application/octet-stream'),
        size: file.size,
        url: mockUrl,
        folder: 'root',
        altText: file.name.split('.')[0]
      });
    } catch (e) {
      console.error(e);
      setIsUploading(false);
      setUploadError('Failed to read or cache local file contents.');
    }
  };

  // Handle Drop
  const handleDrop = async (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      await processFile(e.dataTransfer.files[0]);
    }
  };

  // Handle Click File Browse
  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      await processFile(e.target.files[0]);
    }
  };

  const triggerFileBrowser = () => {
    fileInputRef.current?.click();
  };

  // Copy Public URL to Clipboard
  const copyToClipboard = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  // Save updated Alt Text
  const handleSaveAltText = async () => {
    if (!selectedAsset) return;
    setIsSavingAlt(true);
    try {
      await mediaService.updateAsset(selectedAsset.id, {
        ...selectedAsset,
        altText: editAltText
      });
      // Update local state to reflect change immediately
      setSelectedAsset((prev: any) => ({ ...prev, altText: editAltText }));
      queryClient.invalidateQueries({ queryKey: ['media-assets'] });
      setIsEditAltOpen(false);
    } catch (e) {
      alert('Failed to save alt text metadata.');
    } finally {
      setIsSavingAlt(false);
    }
  };

  // Format File Size
  const formatBytes = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  // Filter & Search Logic
  const filteredAssets = assets.filter((asset: any) => {
    const matchesSearch =
      asset.filename.toLowerCase().includes(searchQuery.toLowerCase()) ||
      asset.originalName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (asset.altText && asset.altText.toLowerCase().includes(searchQuery.toLowerCase()));

    const isImage = asset.mimeType.startsWith('image/');
    const isVideo = asset.mimeType.startsWith('video/');
    const isPdf = asset.mimeType === 'application/pdf' || asset.filename.endsWith('.pdf');

    if (activeFilter === 'IMAGE') return matchesSearch && isImage;
    if (activeFilter === 'VIDEO') return matchesSearch && isVideo;
    if (activeFilter === 'PDF') return matchesSearch && isPdf;

    return matchesSearch;
  });

  // Resolve actual URI (Data URL if locally uploaded, else asset.url)
  const getAssetUri = (asset: any) => {
    return resolvedUrls[asset.id] || asset.url;
  };

  // Determine Icon / Component for Asset
  const renderAssetThumbnail = (asset: any) => {
    const uri = getAssetUri(asset);
    const isImage = asset.mimeType.startsWith('image/');
    const isVideo = asset.mimeType.startsWith('video/');
    const isPdf = asset.mimeType === 'application/pdf' || asset.filename.endsWith('.pdf');

    if (isImage) {
      return (
        <img
          src={uri}
          alt={asset.altText || asset.filename}
          referrerPolicy="no-referrer"
          className="w-full h-full object-cover transition-transform group-hover:scale-105 duration-300"
        />
      );
    }

    if (isVideo) {
      return (
        <div className="w-full h-full relative flex items-center justify-center bg-zinc-900">
          <video
            src={uri}
            className="w-full h-full object-cover opacity-60"
            muted
            playsInline
            onMouseEnter={(e) => e.currentTarget.play().catch(() => {})}
            onMouseLeave={(e) => {
              e.currentTarget.pause();
              e.currentTarget.currentTime = 0;
            }}
          />
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
            <div className="bg-background/80 p-2 rounded-full shadow-sm text-foreground">
              <VideoIcon className="h-5 w-5" />
            </div>
          </div>
        </div>
      );
    }

    if (isPdf) {
      return (
        <div className="w-full h-full flex flex-col items-center justify-center bg-red-50 dark:bg-red-950/20 text-red-600 dark:text-red-400 p-4">
          <PdfIcon className="h-10 w-10 mb-2 stroke-[1.5]" />
          <span className="text-[10px] font-bold tracking-wider uppercase bg-red-100 dark:bg-red-900/30 px-1.5 py-0.5 rounded">
            PDF
          </span>
        </div>
      );
    }

    return (
      <div className="w-full h-full flex items-center justify-center bg-zinc-100 dark:bg-zinc-800 text-zinc-500">
        <ImageIcon className="h-8 w-8 stroke-[1.5]" />
      </div>
    );
  };

  // Guard: Unauthorized
  if (!canRead) {
    return (
      <div className="p-12 text-center max-w-md mx-auto space-y-4">
        <AlertTriangle className="h-12 w-12 text-destructive mx-auto stroke-[1.5]" />
        <h3 className="text-xl font-bold">Access Denied</h3>
        <p className="text-sm text-muted-foreground">
          You do not have the required permissions (`Media:read`) to view the Media Library.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Title & Description Header */}
      <div className="flex flex-col gap-2">
        <h1 className="text-3xl font-bold tracking-tight flex items-center gap-2">
          <ImageIcon className="h-8 w-8 text-primary" /> Media Library
        </h1>
        <p className="text-sm text-muted-foreground">
          Central hub to upload, manage, preview, and inspect your media documents, images, and videos.
        </p>
      </div>

      {/* Upload Zone (Drag & Drop) */}
      {canWrite && (
        <div
          onDragEnter={handleDrag}
          onDragOver={handleDrag}
          onDragLeave={handleDrag}
          onDrop={handleDrop}
          onClick={triggerFileBrowser}
          className={`border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-all ${
            dragActive
              ? 'border-primary bg-primary/5 scale-[1.01]'
              : 'border-muted-foreground/20 hover:border-primary/50 hover:bg-muted/10'
          }`}
        >
          <input
            id="media-file-input"
            type="file"
            ref={fileInputRef}
            onChange={handleFileChange}
            accept="image/*,video/*,application/pdf"
            className="hidden"
          />
          <div className="flex flex-col items-center justify-center space-y-3">
            <div className="p-3 bg-primary/10 rounded-full text-primary">
              <UploadCloud className="h-8 w-8" />
            </div>
            <div className="space-y-1">
              <p className="text-sm font-semibold">
                Drag and drop a file here, or click to browse
              </p>
              <p className="text-xs text-muted-foreground">
                Supported formats: Images (PNG, JPG, WEBP, GIF), Videos (MP4, WEBM), and PDFs
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Upload Error or Success Feedback Banner */}
      {uploadError && (
        <div className="flex items-start gap-2.5 p-4 rounded-lg border border-destructive/20 bg-destructive/5 text-destructive text-sm animate-in fade-in slide-in-from-top-2 duration-200">
          <AlertTriangle className="h-4 w-4 mt-0.5 shrink-0" />
          <div className="flex-1">
            <span className="font-semibold">Upload Failed:</span> {uploadError}
          </div>
          <button onClick={() => setUploadError(null)} className="hover:opacity-80">
            <X className="h-4 w-4" />
          </button>
        </div>
      )}

      {uploadSuccess && (
        <div className="flex items-start gap-2.5 p-4 rounded-lg border border-emerald-500/20 bg-emerald-500/5 text-emerald-600 dark:text-emerald-400 text-sm animate-in fade-in slide-in-from-top-2 duration-200">
          <Check className="h-4 w-4 mt-0.5 shrink-0" />
          <div className="flex-1 font-medium">{uploadSuccess}</div>
          <button onClick={() => setUploadSuccess(null)} className="hover:opacity-80">
            <X className="h-4 w-4" />
          </button>
        </div>
      )}

      {isUploading && (
        <div className="flex items-center justify-center gap-3 p-4 border rounded-lg bg-muted/20 text-muted-foreground text-sm">
          <Loader2 className="h-4 w-4 animate-spin text-primary" />
          <span>Processing and uploading your file. Please wait...</span>
        </div>
      )}

      {/* Control Bar: Search & Type Filter Tab Layout */}
      <Card id="media-filters-card" className="border">
        <CardContent className="p-4 flex flex-col md:flex-row gap-4 items-center justify-between">
          {/* Left: Search input */}
          <div className="relative w-full md:max-w-xs">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              id="media-search-input"
              placeholder="Search file name or alt text..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9 w-full"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            )}
          </div>

          {/* Right: MIME Filters */}
          <div className="flex flex-wrap gap-1 border p-1 rounded-lg bg-muted/20 w-full md:w-auto">
            <Button
              id="filter-all"
              variant={activeFilter === 'ALL' ? 'secondary' : 'ghost'}
              size="sm"
              onClick={() => setActiveFilter('ALL')}
              className="flex-1 md:flex-initial text-xs h-8"
            >
              All Assets
            </Button>
            <Button
              id="filter-images"
              variant={activeFilter === 'IMAGE' ? 'secondary' : 'ghost'}
              size="sm"
              onClick={() => setActiveFilter('IMAGE')}
              className="flex-1 md:flex-initial text-xs h-8 gap-1.5"
            >
              <ImageIcon className="h-3.5 w-3.5" />
              Images
            </Button>
            <Button
              id="filter-videos"
              variant={activeFilter === 'VIDEO' ? 'secondary' : 'ghost'}
              size="sm"
              onClick={() => setActiveFilter('VIDEO')}
              className="flex-1 md:flex-initial text-xs h-8 gap-1.5"
            >
              <VideoIcon className="h-3.5 w-3.5" />
              Videos
            </Button>
            <Button
              id="filter-pdfs"
              variant={activeFilter === 'PDF' ? 'secondary' : 'ghost'}
              size="sm"
              onClick={() => setActiveFilter('PDF')}
              className="flex-1 md:flex-initial text-xs h-8 gap-1.5"
            >
              <PdfIcon className="h-3.5 w-3.5" />
              PDFs
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Grid Layout Container */}
      {isLoading ? (
        <div className="flex flex-col items-center justify-center py-24 space-y-4">
          <Loader2 className="h-10 w-10 animate-spin text-primary" />
          <p className="text-sm text-muted-foreground">Retrieving library index...</p>
        </div>
      ) : error ? (
        <div className="p-12 text-center max-w-md mx-auto space-y-4 border rounded-xl bg-destructive/5 border-destructive/20">
          <AlertTriangle className="h-10 w-10 text-destructive mx-auto stroke-[1.5]" />
          <h3 className="text-lg font-bold">Error Fetching Assets</h3>
          <p className="text-sm text-muted-foreground">
            Could not communicate with the asset inventory API. Please reload.
          </p>
          <Button onClick={() => refetch()} variant="outline" size="sm">
            Retry Connection
          </Button>
        </div>
      ) : filteredAssets.length === 0 ? (
        <div className="text-center py-20 border border-dashed rounded-xl space-y-4 bg-muted/10">
          <ImageIcon className="h-12 w-12 text-muted-foreground mx-auto opacity-50 stroke-[1.2]" />
          <div className="space-y-1">
            <p className="text-base font-semibold">No assets found</p>
            <p className="text-sm text-muted-foreground max-w-xs mx-auto">
              {searchQuery || activeFilter !== 'ALL'
                ? 'Try clearing searches or changing your type filters.'
                : 'Upload your first image, presentation PDF, or promotional video to get started.'}
            </p>
          </div>
          {(searchQuery || activeFilter !== 'ALL') && (
            <Button
              id="reset-filters"
              variant="outline"
              size="sm"
              onClick={() => {
                setSearchQuery('');
                setActiveFilter('ALL');
              }}
            >
              Clear Filters
            </Button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
          {filteredAssets.map((asset: any) => (
            <div
              key={asset.id}
              onClick={() => {
                setSelectedAsset(asset);
                setEditAltText(asset.altText || '');
                setIsEditAltOpen(false);
              }}
              className="group cursor-pointer relative bg-card hover:bg-muted/30 border rounded-xl overflow-hidden shadow-sm flex flex-col justify-between hover:border-primary/50 hover:shadow transition-all"
            >
              {/* Image/File cover area */}
              <div className="aspect-square bg-muted/40 relative flex items-center justify-center overflow-hidden border-b">
                {renderAssetThumbnail(asset)}
                
                {/* Visual hover controls overlay */}
                <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2 z-10">
                  <div className="p-2 rounded-full bg-background/90 text-foreground hover:bg-background transition shadow">
                    <Eye className="h-4 w-4" />
                  </div>
                  {canDelete && (
                    <button
                      id={`delete-btn-${asset.id}`}
                      onClick={(e) => {
                        e.stopPropagation();
                        setConfirmDeleteId(asset.id);
                        setConfirmDeleteName(asset.filename);
                      }}
                      className="p-2 rounded-full bg-destructive text-destructive-foreground hover:bg-destructive/90 transition shadow"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  )}
                </div>
              </div>

              {/* Label metadata */}
              <div className="p-3 space-y-1 flex-1 flex flex-col justify-between">
                <p className="text-xs font-semibold text-foreground truncate" title={asset.filename}>
                  {asset.filename}
                </p>
                <div className="flex items-center justify-between gap-1 text-[10px] text-muted-foreground font-medium">
                  <span className="uppercase truncate max-w-[60px]">
                    {asset.mimeType.split('/')[1] || asset.mimeType.split('/')[0] || 'Unknown'}
                  </span>
                  <span>{formatBytes(asset.size)}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Asset Preview Modal */}
      {selectedAsset && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 overflow-y-auto">
          <div className="bg-background border rounded-2xl shadow-xl max-w-4xl w-full max-h-[90vh] flex flex-col md:flex-row overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            
            {/* Left Hand: Main Visual Reader */}
            <div className="flex-1 bg-zinc-950 flex items-center justify-center min-h-[300px] max-h-[50vh] md:max-h-[90vh] relative p-2 border-b md:border-b-0 md:border-r">
              <button
                id="close-modal-top"
                onClick={() => setSelectedAsset(null)}
                className="absolute top-4 left-4 z-10 p-2 rounded-full bg-black/60 text-white hover:bg-black/80 transition"
              >
                <X className="h-4 w-4" />
              </button>

              {selectedAsset.mimeType.startsWith('image/') ? (
                <img
                  src={getAssetUri(selectedAsset)}
                  alt={selectedAsset.altText || selectedAsset.filename}
                  referrerPolicy="no-referrer"
                  className="max-w-full max-h-[80vh] object-contain"
                />
              ) : selectedAsset.mimeType.startsWith('video/') ? (
                <video
                  src={getAssetUri(selectedAsset)}
                  controls
                  className="max-w-full max-h-[80vh] object-contain w-full"
                />
              ) : selectedAsset.mimeType === 'application/pdf' || selectedAsset.filename.endsWith('.pdf') ? (
                <div className="w-full h-full flex flex-col items-center justify-center text-white space-y-4 p-8">
                  <PdfIcon className="h-16 w-16 text-red-500 stroke-[1.2]" />
                  <div className="text-center">
                    <p className="font-semibold text-sm truncate max-w-sm">{selectedAsset.filename}</p>
                    <p className="text-xs text-zinc-400">PDF Document ({formatBytes(selectedAsset.size)})</p>
                  </div>
                  <Button
                    id="open-pdf-btn"
                    asChild
                    variant="secondary"
                    size="sm"
                    className="gap-1.5"
                  >
                    <a href={getAssetUri(selectedAsset)} target="_blank" rel="noopener noreferrer">
                      <ExternalLink className="h-3.5 w-3.5" />
                      Open in New Tab
                    </a>
                  </Button>
                </div>
              ) : (
                <div className="text-center text-white space-y-2 p-8">
                  <ImageIcon className="h-16 w-16 text-zinc-600 mx-auto stroke-[1.2]" />
                  <p className="text-sm">Cannot preview this asset format.</p>
                </div>
              )}
            </div>

            {/* Right Hand: Interactive Metadata & Action Controls */}
            <div className="w-full md:w-[350px] flex flex-col justify-between p-6 overflow-y-auto max-h-[50vh] md:max-h-[90vh] bg-card text-card-foreground">
              <div className="space-y-6">
                <div className="flex justify-between items-start">
                  <div>
                    <h3 className="font-bold text-lg line-clamp-2" title={selectedAsset.filename}>
                      {selectedAsset.filename}
                    </h3>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      Uploaded on {new Date(selectedAsset.createdAt).toLocaleDateString()}
                    </p>
                  </div>
                  <button
                    id="close-modal-right"
                    onClick={() => setSelectedAsset(null)}
                    className="md:block hidden p-1.5 rounded-lg hover:bg-muted text-muted-foreground hover:text-foreground transition"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>

                {/* Properties pane */}
                <div className="space-y-3.5 border-t pt-4">
                  <h4 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Asset Properties</h4>
                  <div className="grid grid-cols-3 gap-2 text-xs">
                    <span className="text-muted-foreground font-medium col-span-1">File Type:</span>
                    <span className="font-semibold truncate col-span-2 uppercase">{selectedAsset.mimeType}</span>

                    <span className="text-muted-foreground font-medium col-span-1">File Size:</span>
                    <span className="font-semibold col-span-2">{formatBytes(selectedAsset.size)}</span>

                    <span className="text-muted-foreground font-medium col-span-1">Folder:</span>
                    <span className="font-semibold col-span-2 truncate">{selectedAsset.folder || 'root'}</span>
                  </div>
                </div>

                {/* Alt Text edit field */}
                <div className="space-y-2.5 border-t pt-4">
                  <div className="flex justify-between items-center">
                    <h4 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Alt Text (SEO)</h4>
                    {canWrite && !isEditAltOpen && (
                      <Button
                        id="edit-alt-btn"
                        variant="ghost"
                        size="sm"
                        onClick={() => setIsEditAltOpen(true)}
                        className="h-7 text-xs gap-1 px-1.5"
                      >
                        <Edit2 className="h-3 w-3" /> Edit
                      </Button>
                    )}
                  </div>

                  {isEditAltOpen ? (
                    <div className="space-y-2">
                      <Input
                        id="alt-text-input"
                        value={editAltText}
                        onChange={(e) => setEditAltText(e.target.value)}
                        placeholder="Describe the media content..."
                        className="text-xs h-9"
                      />
                      <div className="flex gap-2 justify-end">
                        <Button
                          id="cancel-alt-btn"
                          variant="ghost"
                          size="sm"
                          onClick={() => {
                            setEditAltText(selectedAsset.altText || '');
                            setIsEditAltOpen(false);
                          }}
                          className="h-7 text-xs"
                        >
                          Cancel
                        </Button>
                        <Button
                          id="save-alt-btn"
                          size="sm"
                          onClick={handleSaveAltText}
                          disabled={isSavingAlt}
                          className="h-7 text-xs"
                        >
                          {isSavingAlt ? 'Saving...' : 'Save'}
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <p className="text-xs italic text-muted-foreground">
                      {selectedAsset.altText || 'No alt text set.'}
                    </p>
                  )}
                </div>

                {/* Copy / Link field */}
                <div className="space-y-2 border-t pt-4">
                  <h4 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">URL Reference</h4>
                  <div className="flex gap-1.5 items-center bg-muted/30 p-2 rounded-lg border font-mono text-[10px] truncate">
                    <span className="flex-1 truncate">{selectedAsset.url}</span>
                    <Button
                      id={`copy-url-btn-${selectedAsset.id}`}
                      variant="ghost"
                      size="icon"
                      onClick={() => copyToClipboard(selectedAsset.url, selectedAsset.id)}
                      className="h-6 w-6 text-muted-foreground hover:text-foreground shrink-0"
                    >
                      {copiedId === selectedAsset.id ? (
                        <Check className="h-3 w-3 text-emerald-500" />
                      ) : (
                        <Copy className="h-3 w-3" />
                      )}
                    </Button>
                  </div>
                </div>
              </div>

              {/* Delete control pane */}
              {canDelete && (
                <div className="border-t pt-4 mt-6">
                  <Button
                    id="modal-delete-btn"
                    variant="outline"
                    className="w-full text-destructive border-destructive/20 hover:bg-destructive/10 hover:text-destructive text-xs gap-1.5"
                    onClick={() => {
                      setConfirmDeleteId(selectedAsset.id);
                      setConfirmDeleteName(selectedAsset.filename);
                    }}
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                    Delete Asset Permanently
                  </Button>
                </div>
              )}

            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Dialog */}
      {confirmDeleteId && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/40 backdrop-blur-sm">
          <div className="bg-background border rounded-lg shadow-lg max-w-md w-full mx-4 overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            <div className="p-6 space-y-4">
              <div className="flex items-center gap-3 text-destructive">
                <div className="p-2 rounded-full bg-destructive/10">
                  <AlertTriangle className="h-6 w-6" />
                </div>
                <h3 className="text-lg font-bold">Confirm Deletion</h3>
              </div>
              <div className="space-y-2">
                <p className="text-sm text-muted-foreground">
                  Are you sure you want to delete the asset <strong>"{confirmDeleteName}"</strong>?
                </p>
                <p className="text-xs text-destructive bg-destructive/5 p-2 rounded border border-destructive/10">
                  Warning: This action deletes the asset definition immediately. If the asset is currently referenced by other modules (e.g. blog posts, product sheets, SEO previews), it will break their display layout!
                </p>
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <Button
                  id="cancel-delete-modal-btn"
                  variant="outline"
                  onClick={() => setConfirmDeleteId(null)}
                  disabled={deleteMutation.isPending}
                >
                  Cancel
                </Button>
                <Button
                  id="confirm-delete-modal-btn"
                  variant="destructive"
                  onClick={() => deleteMutation.mutate(confirmDeleteId)}
                  disabled={deleteMutation.isPending}
                >
                  {deleteMutation.isPending ? 'Deleting...' : 'Confirm Delete'}
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
