"use client";

import { useCallback, useState } from "react";
import { FileText, ImageIcon, UploadCloud, X } from "lucide-react";
import { useDropzone } from "react-dropzone";
import { Button } from "@/components/ui/button";
import type { StoredFile } from "@/lib/finance-types";
import { fileToStoredFile, formatFileSize } from "@/lib/finance-utils";
import { cn } from "@/lib/utils";

interface FileDropzoneProps {
  value: StoredFile[];
  onChange: (files: StoredFile[]) => void;
  label: string;
  accept: Record<string, string[]>;
  maxFiles?: number;
  maxSize?: number;
  helperText?: string;
}

export function FileDropzone({
  value,
  onChange,
  label,
  accept,
  maxFiles = 5,
  maxSize = 5 * 1024 * 1024,
  helperText,
}: FileDropzoneProps) {
  const [isProcessing, setIsProcessing] = useState(false);
  const onDrop = useCallback(
    async (acceptedFiles: File[]) => {
      setIsProcessing(true);
      try {
        const storedFiles = await Promise.all(acceptedFiles.map(fileToStoredFile));
        const nextFiles = [...value, ...storedFiles].slice(0, maxFiles);
        onChange(nextFiles);
      } finally {
        setIsProcessing(false);
      }
    },
    [maxFiles, onChange, value],
  );

  const { getRootProps, getInputProps, isDragActive, fileRejections } = useDropzone({
    accept,
    maxFiles,
    maxSize,
    onDrop,
  });

  return (
    <div className="space-y-3">
      <div
        {...getRootProps()}
        className={cn(
          "flex min-h-28 cursor-pointer flex-col items-center justify-center gap-2 rounded-lg border border-dashed border-slate-300 bg-slate-50 p-4 text-center transition hover:border-teal-500 hover:bg-teal-50 dark:border-slate-700 dark:bg-slate-900/60 dark:hover:border-teal-400 dark:hover:bg-teal-950/30",
          isDragActive && "border-teal-500 bg-teal-50 dark:bg-teal-950/30",
        )}
      >
        <input {...getInputProps()} />
        <UploadCloud className="h-6 w-6 text-teal-600" />
        <div className="text-sm font-medium">{isProcessing ? "Preparing files..." : label}</div>
        <p className="text-xs text-muted-foreground">
          {helperText ?? `Up to ${maxFiles} files, ${formatFileSize(maxSize)} each`}
        </p>
      </div>

      {fileRejections.length > 0 ? (
        <p className="text-xs text-red-600">Some files were skipped because of type or size limits.</p>
      ) : null}

      {value.length > 0 ? (
        <div className="grid gap-2 sm:grid-cols-2">
          {value.map((file) => {
            const isImage = file.type.startsWith("image/");

            return (
              <div
                key={file.id}
                className="flex items-center gap-3 rounded-lg border bg-background p-2"
              >
                <div className="flex h-12 w-12 shrink-0 items-center justify-center overflow-hidden rounded-md bg-slate-100 dark:bg-slate-800">
                  {isImage ? (
                    <div
                      aria-label={file.name}
                      className="h-full w-full bg-cover bg-center"
                      style={{ backgroundImage: `url(${file.dataUrl})` }}
                    />
                  ) : file.type === "application/pdf" ? (
                    <FileText className="h-5 w-5 text-red-600" />
                  ) : (
                    <ImageIcon className="h-5 w-5 text-slate-500" />
                  )}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium">{file.name}</p>
                  <p className="text-xs text-muted-foreground">{formatFileSize(file.size)}</p>
                </div>
                <Button
                  type="button"
                  size="icon"
                  variant="ghost"
                  onClick={(event) => {
                    event.stopPropagation();
                    onChange(value.filter((item) => item.id !== file.id));
                  }}
                >
                  <X className="h-4 w-4" />
                  <span className="sr-only">Remove file</span>
                </Button>
              </div>
            );
          })}
        </div>
      ) : null}
    </div>
  );
}
