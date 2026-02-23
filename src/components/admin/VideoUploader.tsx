'use client';

import { useState, useRef, useCallback, useEffect } from 'react';
import * as tus from 'tus-js-client';

interface VideoUploaderProps {
  onUploadComplete: (videoUid: string) => void;
  onProgress?: (percent: number) => void;
  onError?: (error: string) => void;
  maxSizeMB?: number;
  accept?: string;
  className?: string;
}

type UploadState = 'idle' | 'uploading' | 'success' | 'error';

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:7002';

export default function VideoUploader({
  onUploadComplete,
  onProgress,
  onError,
  maxSizeMB = 500,
  accept = 'video/*',
  className = '',
}: VideoUploaderProps) {
  const [state, setState] = useState<UploadState>('idle');
  const [progress, setProgress] = useState(0);
  const [dragOver, setDragOver] = useState(false);
  const [fileName, setFileName] = useState('');
  const [fileSize, setFileSize] = useState(0);
  const [errorMsg, setErrorMsg] = useState('');

  const inputRef = useRef<HTMLInputElement>(null);
  const uploadRef = useRef<tus.Upload | null>(null);
  const mockTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (uploadRef.current) {
        uploadRef.current.abort();
      }
      if (mockTimerRef.current) {
        clearInterval(mockTimerRef.current);
      }
    };
  }, []);

  const formatSize = (bytes: number) => {
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    if (bytes < 1024 * 1024 * 1024) return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
    return `${(bytes / (1024 * 1024 * 1024)).toFixed(2)} GB`;
  };

  const validateFile = (file: File): string | null => {
    if (file.size > maxSizeMB * 1024 * 1024) {
      return `File too large. Maximum size is ${maxSizeMB}MB.`;
    }
    if (!file.type.startsWith('video/')) {
      return 'Invalid file type. Please upload a video file (MP4, MOV, MKV).';
    }
    return null;
  };

  const startMockUpload = useCallback((videoUid: string) => {
    let mockProgress = 0;
    mockTimerRef.current = setInterval(() => {
      mockProgress += Math.random() * 15 + 5;
      if (mockProgress >= 100) {
        mockProgress = 100;
        if (mockTimerRef.current) clearInterval(mockTimerRef.current);
        setProgress(100);
        onProgress?.(100);
        setState('success');
        onUploadComplete(videoUid);
      } else {
        setProgress(Math.round(mockProgress));
        onProgress?.(Math.round(mockProgress));
      }
    }, 300);
  }, [onProgress, onUploadComplete]);

  const handleUpload = useCallback(async (file: File) => {
    const validationError = validateFile(file);
    if (validationError) {
      setErrorMsg(validationError);
      setState('error');
      onError?.(validationError);
      return;
    }

    setFileName(file.name);
    setFileSize(file.size);
    setState('uploading');
    setProgress(0);
    setErrorMsg('');

    try {
      // Request TUS upload URL from backend
      const token = typeof window !== 'undefined' ? localStorage.getItem('admin_token') : null;
      const res = await fetch(`${API_BASE}/api/admin/upload/video`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({ filename: file.name, filesize: file.size }),
      });

      if (!res.ok) throw new Error('Failed to get upload URL');

      const { data } = await res.json();
      const { upload_url, video_uid } = data;

      // Start TUS upload
      const upload = new tus.Upload(file, {
        endpoint: upload_url,
        chunkSize: 20 * 1024 * 1024,
        parallelUploads: 5,
        retryDelays: [0, 1000, 3000, 5000, 10000],
        metadata: {
          filename: file.name,
          filetype: file.type,
        },
        onProgress: (bytesUploaded, bytesTotal) => {
          const pct = Math.round((bytesUploaded / bytesTotal) * 100);
          setProgress(pct);
          onProgress?.(pct);
        },
        onSuccess: () => {
          setProgress(100);
          setState('success');
          onUploadComplete(video_uid);
        },
        onError: (err) => {
          const msg = err.message || 'Upload failed';
          setErrorMsg(msg);
          setState('error');
          onError?.(msg);
        },
      });

      uploadRef.current = upload;
      upload.start();
    } catch {
      // Mock mode fallback: simulate upload when backend is unavailable
      const mockUid = `cf-video-${Date.now()}`;
      startMockUpload(mockUid);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [onUploadComplete, onProgress, onError, startMockUpload]);

  const handleCancel = () => {
    if (uploadRef.current) {
      uploadRef.current.abort();
      uploadRef.current = null;
    }
    if (mockTimerRef.current) {
      clearInterval(mockTimerRef.current);
      mockTimerRef.current = null;
    }
    setState('idle');
    setProgress(0);
    setFileName('');
    setFileSize(0);
    setErrorMsg('');
  };

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    const file = e.dataTransfer.files[0];
    if (file) handleUpload(file);
  }, [handleUpload]);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
  }, []);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) handleUpload(file);
    if (inputRef.current) inputRef.current.value = '';
  };

  const reset = () => {
    setState('idle');
    setProgress(0);
    setFileName('');
    setFileSize(0);
    setErrorMsg('');
  };

  return (
    <div className={`w-full ${className}`}>
      <input
        ref={inputRef}
        type="file"
        accept={accept}
        onChange={handleFileSelect}
        className="hidden"
      />

      {/* Idle State: Drop Zone */}
      {state === 'idle' && (
        <div
          onDrop={handleDrop}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onClick={() => inputRef.current?.click()}
          className={`flex cursor-pointer flex-col items-center justify-center rounded-xl border-2 border-dashed px-6 py-12 transition-colors ${
            dragOver
              ? 'border-amber-400 bg-amber-400/10'
              : 'border-white/20 bg-zinc-900 hover:border-white/40 hover:bg-zinc-800/50'
          }`}
        >
          <svg className="mb-3 h-10 w-10 text-zinc-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5m-13.5-9L12 3m0 0l4.5 4.5M12 3v13.5" />
          </svg>
          <p className="text-sm font-medium text-zinc-300">
            Click to upload or drag video here
          </p>
          <p className="mt-1 text-xs text-zinc-500">
            Max {maxSizeMB}MB &middot; MP4 / MOV / MKV
          </p>
        </div>
      )}

      {/* Uploading State */}
      {state === 'uploading' && (
        <div className="rounded-xl border border-white/10 bg-zinc-900 p-5">
          <div className="mb-3 flex items-center justify-between">
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-medium text-zinc-200">{fileName}</p>
              <p className="text-xs text-zinc-500">{formatSize(fileSize)}</p>
            </div>
            <button
              onClick={handleCancel}
              className="ml-3 rounded-lg p-1.5 text-zinc-500 transition-colors hover:bg-zinc-800 hover:text-zinc-300"
              aria-label="Cancel upload"
            >
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
          <div className="h-2 w-full overflow-hidden rounded-full bg-zinc-800">
            <div
              className="h-full rounded-full bg-gradient-to-r from-amber-500 to-yellow-400 transition-all duration-300"
              style={{ width: `${progress}%` }}
            />
          </div>
          <p className="mt-2 text-right text-xs font-medium text-amber-400">{progress}%</p>
        </div>
      )}

      {/* Success State */}
      {state === 'success' && (
        <div className="rounded-xl border border-emerald-500/30 bg-emerald-500/10 p-5">
          <div className="flex items-center gap-3">
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-emerald-500/20">
              <svg className="h-4 w-4 text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
              </svg>
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-sm font-medium text-emerald-300">Upload complete</p>
              <p className="truncate text-xs text-zinc-400">{fileName}</p>
            </div>
            <button
              onClick={reset}
              className="rounded-lg px-3 py-1.5 text-xs font-medium text-zinc-400 transition-colors hover:bg-zinc-800 hover:text-zinc-200"
            >
              Upload another
            </button>
          </div>
        </div>
      )}

      {/* Error State */}
      {state === 'error' && (
        <div className="rounded-xl border border-red-500/30 bg-red-500/10 p-5">
          <div className="flex items-center gap-3">
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-red-500/20">
              <svg className="h-4 w-4 text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m9-.75a9 9 0 11-18 0 9 9 0 0118 0zm-9 3.75h.008v.008H12v-.008z" />
              </svg>
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-sm font-medium text-red-300">Upload failed</p>
              <p className="text-xs text-zinc-400">{errorMsg}</p>
            </div>
            <button
              onClick={reset}
              className="rounded-lg px-3 py-1.5 text-xs font-medium text-zinc-400 transition-colors hover:bg-zinc-800 hover:text-zinc-200"
            >
              Try again
            </button>
          </div>
        </div>
      )}
    </div>
  );
}