"use client";

import React, { useRef, useState } from 'react';
import { CheckCircle2, FileSpreadsheet, Loader2, UploadCloud, XCircle } from 'lucide-react';

type ToastState = {
  type: 'success' | 'error';
  message: string;
} | null;

type ImportExcelProps = {
  onImported?: () => void;
};

export default function ImportExcel({ onImported }: ImportExcelProps) {
  const inputRef = useRef<HTMLInputElement | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [toast, setToast] = useState<ToastState>(null);

  const processFile = async (file?: File) => {
    if (!file || isUploading) return;

    if (!/\.(xlsx|xls)$/i.test(file.name)) {
      setToast({ type: 'error', message: 'File harus berformat .xlsx atau .xls.' });
      return;
    }

    setToast(null);
    setIsUploading(true);

    try {
      const formData = new FormData();
      formData.append('file', file);

      const response = await fetch('/api/piutang/import', {
        method: 'POST',
        body: formData,
      });
      const result = await response.json();

      if (!response.ok || !result.success) {
        throw new Error(result.message || 'File POSTAG tidak dapat diproses.');
      }

      setToast({
        type: 'success',
        message: `${Number(result.processed || 0).toLocaleString('id-ID')} record berhasil diproses.`,
      });
      onImported?.();
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Terjadi kesalahan saat import POSTAG.';
      setToast({ type: 'error', message });
    } finally {
      setIsUploading(false);
      if (inputRef.current) inputRef.current.value = '';
    }
  };

  return (
    <div className="relative rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-950">
      {isUploading && (
        <div className="absolute inset-0 z-10 flex flex-col items-center justify-center rounded-2xl bg-white/80 backdrop-blur-sm dark:bg-slate-950/80">
          <Loader2 className="mb-3 h-8 w-8 animate-spin text-teal-600" />
          <p className="text-sm font-bold text-slate-800 dark:text-slate-100">Memproses POSTAG...</p>
          <p className="mt-1 text-xs text-slate-500">Parsing, cleaning, normalisasi, dan upsert data.</p>
        </div>
      )}

      <div className="mb-4 flex items-center justify-between gap-3">
        <div>
          <p className="text-sm font-black uppercase tracking-wide text-slate-900 dark:text-white">Import POSTAG</p>
          <p className="mt-1 text-xs text-slate-500">Upload file billing BKI dalam format Excel.</p>
        </div>
        <FileSpreadsheet className="h-8 w-8 text-emerald-600" />
      </div>

      <button
        type="button"
        onClick={() => inputRef.current?.click()}
        onDragOver={(event) => {
          event.preventDefault();
          setIsDragging(true);
        }}
        onDragLeave={() => setIsDragging(false)}
        onDrop={(event) => {
          event.preventDefault();
          setIsDragging(false);
          processFile(event.dataTransfer.files?.[0]);
        }}
        className={`flex min-h-44 w-full flex-col items-center justify-center rounded-2xl border-2 border-dashed px-6 py-8 text-center transition ${
          isDragging
            ? 'border-teal-500 bg-teal-50 dark:bg-teal-950/30'
            : 'border-slate-300 bg-slate-50 hover:border-teal-400 hover:bg-teal-50/60 dark:border-slate-700 dark:bg-slate-900 dark:hover:border-teal-500'
        }`}
      >
        <UploadCloud className="mb-3 h-10 w-10 text-teal-600" />
        <span className="text-sm font-bold text-slate-800 dark:text-slate-100">Drop file POSTAG di sini</span>
        <span className="mt-1 text-xs text-slate-500">atau klik untuk memilih file .xlsx/.xls</span>
      </button>

      <input
        ref={inputRef}
        type="file"
        accept=".xlsx,.xls"
        className="hidden"
        onChange={(event) => processFile(event.target.files?.[0])}
      />

      {toast && (
        <div
          className={`mt-4 flex items-start gap-2 rounded-xl border px-3 py-2 text-sm ${
            toast.type === 'success'
              ? 'border-emerald-200 bg-emerald-50 text-emerald-800'
              : 'border-rose-200 bg-rose-50 text-rose-800'
          }`}
        >
          {toast.type === 'success' ? <CheckCircle2 size={18} /> : <XCircle size={18} />}
          <p className="font-semibold">{toast.message}</p>
        </div>
      )}
    </div>
  );
}
