'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Upload, FileArchive, Loader2, CheckCircle2, AlertCircle } from 'lucide-react';

export default function UploadPage() {
  const [file, setFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const router = useRouter();

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      if (selectedFile.type === 'application/zip' || selectedFile.name.endsWith('.zip')) {
        setFile(selectedFile);
        setError(null);
        setSuccess(false);
      } else {
        setError('Please upload a valid ZIP file');
        setFile(null);
      }
    }
  };

  const handleUpload = async () => {
    if (!file) {
      setError('Please select a file first');
      return;
    }

    setUploading(true);
    setError(null);
    setSuccess(false);

    try {
      const formData = new FormData();
      formData.append('file', file);

      const response = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to process file');
      }

      setSuccess(true);
      setTimeout(() => {
        router.push('/dashboard');
      }, 1500);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred while processing the file');
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-blue-50 via-white to-purple-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
      <div className="w-full max-w-2xl rounded-2xl border border-gray-200 bg-white p-8 shadow-xl dark:border-gray-800 dark:bg-gray-900">
        <div className="text-center">
          <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-full bg-blue-100 dark:bg-blue-900/30">
            <FileArchive className="h-8 w-8 text-blue-600 dark:text-blue-400" />
          </div>
          <h1 className="mb-2 text-3xl font-bold text-gray-900 dark:text-white">
            LinkedIn Data Analytics
          </h1>
          <p className="mb-8 text-gray-600 dark:text-gray-400">
            Upload your LinkedIn data export ZIP file to get started
          </p>

          <div className="mb-6">
            <label
              htmlFor="file-upload"
              className="flex cursor-pointer flex-col items-center justify-center rounded-lg border-2 border-dashed border-gray-300 bg-gray-50 p-12 transition-colors hover:border-blue-400 hover:bg-blue-50 dark:border-gray-700 dark:bg-gray-800 dark:hover:border-blue-500 dark:hover:bg-blue-900/20"
            >
              <Upload className="mb-4 h-12 w-12 text-gray-400 dark:text-gray-500" />
              <span className="mb-2 text-sm font-medium text-gray-700 dark:text-gray-300">
                {file ? file.name : 'Click to upload or drag and drop'}
              </span>
              <span className="text-xs text-gray-500 dark:text-gray-400">
                ZIP file (Basic_LinkedInDataExport_MM-DD-YYYY.zip)
              </span>
              <input
                id="file-upload"
                type="file"
                accept=".zip,application/zip"
                onChange={handleFileChange}
                className="hidden"
                disabled={uploading}
              />
            </label>
          </div>

          {error && (
            <div className="mb-4 flex items-center justify-center gap-2 rounded-lg bg-red-50 p-4 text-red-700 dark:bg-red-900/20 dark:text-red-400">
              <AlertCircle className="h-5 w-5" />
              <span>{error}</span>
            </div>
          )}

          {success && (
            <div className="mb-4 flex items-center justify-center gap-2 rounded-lg bg-green-50 p-4 text-green-700 dark:bg-green-900/20 dark:text-green-400">
              <CheckCircle2 className="h-5 w-5" />
              <span>File processed successfully! Redirecting to dashboard...</span>
            </div>
          )}

          <button
            onClick={handleUpload}
            disabled={!file || uploading || success}
            className="w-full rounded-lg bg-blue-600 px-6 py-3 font-semibold text-white transition-colors hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50 dark:bg-blue-500 dark:hover:bg-blue-600"
          >
            {uploading ? (
              <span className="flex items-center justify-center gap-2">
                <Loader2 className="h-5 w-5 animate-spin" />
                Processing...
              </span>
            ) : (
              'Process & View Dashboard'
            )}
          </button>

          <div className="mt-8 rounded-lg bg-gray-50 p-4 text-left dark:bg-gray-800">
            <h3 className="mb-2 text-sm font-semibold text-gray-900 dark:text-white">
              Expected file structure:
            </h3>
            <ul className="space-y-1 text-xs text-gray-600 dark:text-gray-400">
              <li>• Basic_LinkedInDataExport_MM-DD-YYYY.zip</li>
              <li>• Contains: Invitations.csv, messages.csv, Rich_Media.csv, Connections.csv</li>
              <li>• Contains: Jobs/Online Job Postings.csv</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
