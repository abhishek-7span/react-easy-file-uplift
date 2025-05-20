import React, { useRef, useState, useCallback, useMemo } from 'react';
import { FilePreview } from './FilePreview';
import { UploadProgress } from './UploadProgress';
import { ValidationError } from './ValidationError';
import { X, AlertCircle, CheckCircle, UploadCloud } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { useToast } from '@/components/ui/use-toast';

export type FileUploaderProps = {
  multiple?: boolean;
  maxFileSize?: number; // in bytes
  maxTotalSize?: number; // in bytes
  maxFiles?: number;
  allowedTypes?: string[]; // file extensions: ['.jpg', '.png']
  allowedMimeTypes?: string[]; // mime types: ['image/jpeg', 'image/png']
  validateFile?: (file: File) => boolean | Promise<boolean>;
  onFileSelected?: (files: File[]) => void;
  onUploadProgress?: (percentage: number) => void;
  onUploadSuccess?: (files: File[]) => void;
  onUploadError?: (error: Error) => void;
  onFileRemoved?: (file: File) => void;
  onValidationError?: (error: Error) => void;
  className?: string;
  disabled?: boolean;
  uploadUrl?: string;
  autoUpload?: boolean;
  showPreview?: boolean;
};

export const FileUploader = ({
  multiple = false,
  maxFileSize = 10 * 1024 * 1024, // 10MB default
  maxTotalSize = 50 * 1024 * 1024, // 50MB default
  maxFiles = 10,
  allowedTypes = [],
  allowedMimeTypes = [],
  validateFile,
  onFileSelected,
  onUploadProgress,
  onUploadSuccess,
  onUploadError,
  onFileRemoved,
  onValidationError,
  className,
  disabled = false,
  uploadUrl,
  autoUpload = false,
  showPreview = true
}: FileUploaderProps) => {
  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [files, setFiles] = useState<File[]>([]);
  const [dragActive, setDragActive] = useState<boolean>(false);
  const [uploadProgress, setUploadProgress] = useState<number>(0);
  const [isUploading, setIsUploading] = useState<boolean>(false);
  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({});
  const [uploadStatus, setUploadStatus] = useState<'idle' | 'uploading' | 'success' | 'error'>('idle');

  const totalSize = useMemo(() => files.reduce((acc, file) => acc + file.size, 0), [files]);
  const isOverMaxTotalSize = totalSize > maxTotalSize;
  const isOverMaxFiles = files.length > maxFiles;

  // Handle file selection
  const handleFileChange = async (selectedFiles: FileList | null) => {
    if (!selectedFiles) return;

    const fileArray = Array.from(selectedFiles);
    const newErrors: Record<string, string> = {};
    const validFiles: File[] = [];

    // Process each file for validation
    for (const file of fileArray) {
      try {
        // Check file size
        if (file.size > maxFileSize) {
          newErrors[file.name] = `File exceeds maximum size of ${formatBytes(maxFileSize)}`;
          continue;
        }

        // Check file extension
        if (allowedTypes.length > 0) {
          const fileExtension = `.${file.name.split('.').pop()?.toLowerCase()}`;
          if (!allowedTypes.includes(fileExtension)) {
            newErrors[file.name] = `File type ${fileExtension} not allowed`;
            continue;
          }
        }

        // Check MIME type
        if (allowedMimeTypes.length > 0 && !allowedMimeTypes.includes(file.type)) {
          newErrors[file.name] = `File type ${file.type} not allowed`;
          continue;
        }

        // Custom validation
        if (validateFile) {
          const isValid = await validateFile(file);
          if (!isValid) {
            newErrors[file.name] = 'File failed custom validation';
            continue;
          }
        }

        validFiles.push(file);
      } catch (error) {
        newErrors[file.name] = 'Error validating file';
      }
    }

    // Check total files limit
    if (multiple) {
      if (files.length + validFiles.length > maxFiles) {
        toast({
          title: `Maximum ${maxFiles} files allowed`,
          description: `Please remove some files before adding more.`,
          variant: "destructive"
        });
        
        const errorMessage = `Maximum ${maxFiles} files allowed`;
        onValidationError?.(new Error(errorMessage));
        return;
      }

      // Check total size limit
      const newTotalSize = totalSize + validFiles.reduce((acc, file) => acc + file.size, 0);
      if (newTotalSize > maxTotalSize) {
        toast({
          title: `Total size exceeds maximum of ${formatBytes(maxTotalSize)}`,
          description: `Please remove some files before adding more.`,
          variant: "destructive"
        });
        
        const errorMessage = `Total size exceeds maximum of ${formatBytes(maxTotalSize)}`;
        onValidationError?.(new Error(errorMessage));
        return;
      }
    } else {
      // Single file mode - replace existing file
      setFiles(validFiles);
      if (validFiles.length > 0) {
        onFileSelected?.(validFiles);
        if (autoUpload && uploadUrl) {
          handleUpload(validFiles);
        }
      }
      
      if (Object.keys(newErrors).length > 0) {
        setValidationErrors(newErrors);
        
        const allErrors = Object.values(newErrors).join(', ');
        onValidationError?.(new Error(allErrors));
      }
      return;
    }

    // Multiple file mode - add to existing files
    if (validFiles.length > 0) {
      setFiles((prev) => [...prev, ...validFiles]);
      onFileSelected?.(validFiles);
      
      if (autoUpload && uploadUrl) {
        handleUpload(validFiles);
      }
    }
    
    if (Object.keys(newErrors).length > 0) {
      setValidationErrors((prev) => ({...prev, ...newErrors}));
      
      const allErrors = Object.values(newErrors).join(', ');
      onValidationError?.(new Error(allErrors));
    }
  };

  // Handle file removal
  const handleRemoveFile = (fileToRemove: File) => {
    setFiles((prev) => prev.filter((file) => file !== fileToRemove));
    
    // Clear any validation errors for this file
    if (validationErrors[fileToRemove.name]) {
      const newErrors = {...validationErrors};
      delete newErrors[fileToRemove.name];
      setValidationErrors(newErrors);
    }
    
    onFileRemoved?.(fileToRemove);
  };

  // Handle drag events
  const handleDrag = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    
    if (disabled) return;
    
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  }, [disabled]);

  // Handle drop event
  const handleDrop = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    
    if (disabled) return;
    
    setDragActive(false);
    
    if (e.dataTransfer.files) {
      handleFileChange(e.dataTransfer.files);
    }
  }, [disabled]);

  // Handle upload
  const handleUpload = async (filesToUpload = files) => {
    if (!uploadUrl || filesToUpload.length === 0) return;
    
    setIsUploading(true);
    setUploadStatus('uploading');
    setUploadProgress(0);
    
    try {
      const formData = new FormData();
      
      filesToUpload.forEach((file) => {
        formData.append('files', file);
      });
      
      const xhr = new XMLHttpRequest();
      
      xhr.upload.addEventListener('progress', (event) => {
        if (event.lengthComputable) {
          const progress = Math.round((event.loaded / event.total) * 100);
          setUploadProgress(progress);
          onUploadProgress?.(progress);
        }
      });
      
      xhr.addEventListener('load', () => {
        if (xhr.status >= 200 && xhr.status < 300) {
          setUploadStatus('success');
          onUploadSuccess?.(filesToUpload);
          toast({
            title: "Upload successful",
            description: `${filesToUpload.length} file${filesToUpload.length > 1 ? 's' : ''} uploaded successfully.`,
          });
        } else {
          setUploadStatus('error');
          const error = new Error(`Upload failed with status ${xhr.status}`);
          onUploadError?.(error);
          toast({
            title: "Upload failed",
            description: `Error: ${xhr.statusText}`,
            variant: "destructive",
          });
        }
        setIsUploading(false);
      });
      
      xhr.addEventListener('error', () => {
        setUploadStatus('error');
        const error = new Error('Network error during upload');
        onUploadError?.(error);
        toast({
          title: "Upload failed",
          description: "Network error during upload. Please try again.",
          variant: "destructive",
        });
        setIsUploading(false);
      });
      
      xhr.open('POST', uploadUrl);
      xhr.send(formData);
      
    } catch (error) {
      setUploadStatus('error');
      onUploadError?.(error instanceof Error ? error : new Error(String(error)));
      toast({
        title: "Upload failed",
        description: error instanceof Error ? error.message : "An unknown error occurred",
        variant: "destructive",
      });
      setIsUploading(false);
    }
  };

  // Utility function to format bytes
  const formatBytes = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes';
    
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  // Clear all files
  const clearFiles = () => {
    setFiles([]);
    setValidationErrors({});
    setUploadStatus('idle');
    setUploadProgress(0);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  return (
    <div 
      className={cn(
        "w-full flex flex-col gap-4",
        className
      )}
      aria-busy={isUploading}
      aria-disabled={disabled}
    >
      {/* Upload area */}
      <div 
        className={cn(
          "border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors",
          dragActive ? "border-primary bg-primary/10" : "border-border",
          disabled ? "bg-muted cursor-not-allowed opacity-60" : "hover:border-primary/50 hover:bg-primary/5",
          className
        )}
        onDragEnter={handleDrag}
        onDragOver={handleDrag}
        onDragLeave={handleDrag}
        onDrop={handleDrop}
        onClick={() => !disabled && fileInputRef.current?.click()}
        tabIndex={disabled ? -1 : 0}
        onKeyDown={(e) => {
          if ((e.key === 'Enter' || e.key === ' ') && !disabled) {
            e.preventDefault();
            fileInputRef.current?.click();
          }
        }}
        role="button"
        aria-label={`${multiple ? 'Select multiple files' : 'Select a file'}`}
      >
        <div className="flex flex-col items-center justify-center gap-4">
          <UploadCloud 
            size={40} 
            className={dragActive ? "text-primary" : "text-muted-foreground"} 
            aria-hidden="true" 
          />
          <div>
            <p className="text-base font-semibold">
              {dragActive 
                ? 'Drop files here' 
                : multiple 
                  ? 'Drag & drop files here or click to browse' 
                  : 'Drag & drop a file here or click to browse'
              }
            </p>
            <p className="text-sm text-muted-foreground mt-1">
              {allowedTypes.length > 0 && (
                <span>Allowed file types: {allowedTypes.join(', ')}</span>
              )}
              {allowedTypes.length > 0 && maxFileSize && <span> • </span>}
              {maxFileSize && (
                <span>Max file size: {formatBytes(maxFileSize)}</span>
              )}
              {multiple && maxFiles && <span> • Max files: {maxFiles}</span>}
            </p>
          </div>
        </div>
      </div>
      
      {/* Hidden file input */}
      <input 
        ref={fileInputRef}
        type="file"
        className="hidden"
        onChange={(e) => handleFileChange(e.target.files)}
        multiple={multiple}
        accept={allowedTypes.join(',')}
        disabled={disabled}
        aria-hidden="true"
      />
      
      {/* File validation errors */}
      {Object.keys(validationErrors).length > 0 && (
        <div className="mt-2">
          <ValidationError errors={validationErrors} />
        </div>
      )}
      
      {/* Upload progress */}
      {isUploading && (
        <div className="mt-4">
          <UploadProgress progress={uploadProgress} />
        </div>
      )}
      
      {/* Upload status */}
      {uploadStatus === 'success' && (
        <div className="flex items-center gap-2 text-green-600 mt-2">
          <CheckCircle size={16} />
          <span>Upload successful</span>
        </div>
      )}
      
      {uploadStatus === 'error' && (
        <div className="flex items-center gap-2 text-red-600 mt-2">
          <AlertCircle size={16} />
          <span>Upload failed</span>
        </div>
      )}
      
      {/* File previews */}
      {showPreview && files.length > 0 && (
        <div className="mt-4">
          <h3 className="text-sm font-medium mb-2">Selected files ({files.length})</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {files.map((file, index) => (
              <FilePreview 
                key={`${file.name}-${index}`}
                file={file}
                onRemove={() => handleRemoveFile(file)}
                disabled={isUploading}
              />
            ))}
          </div>
          
          {/* Total size info */}
          <div className="text-sm text-muted-foreground mt-2 flex justify-between">
            <span>Total size: {formatBytes(totalSize)}</span>
            <span>{files.length} {files.length === 1 ? 'file' : 'files'}</span>
          </div>
        </div>
      )}
      
      {/* Action buttons */}
      {files.length > 0 && (
        <div className="flex flex-wrap gap-3 mt-4">
          {uploadUrl && (
            <Button 
              onClick={() => handleUpload()}
              disabled={isUploading || disabled || isOverMaxTotalSize || isOverMaxFiles || files.length === 0}
              aria-busy={isUploading}
            >
              {isUploading ? 'Uploading...' : 'Upload Files'}
            </Button>
          )}
          
          <Button 
            variant="outline" 
            onClick={clearFiles}
            disabled={isUploading || disabled || files.length === 0}
            aria-label="Clear all files"
          >
            Clear All
          </Button>
        </div>
      )}
    </div>
  );
};

export default FileUploader;
