import React, { useState, useEffect } from 'react';
import { X, FileText, File } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface FilePreviewProps {
  file: File;
  onRemove: () => void;
  disabled?: boolean;
}

export const FilePreview: React.FC<FilePreviewProps> = ({ file, onRemove, disabled }) => {
  const [preview, setPreview] = useState<string | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<boolean>(false);

  const isImage = file.type.startsWith('image/');
  const isPdf = file.type === 'application/pdf';

  useEffect(() => {
    if (!file) return;
    
    setLoading(true);
    setError(false);

    // Handle image previews
    if (isImage) {
      const reader = new FileReader();
      
      reader.onload = (e) => {
        setPreview(e.target?.result as string);
        setLoading(false);
      };
      
      reader.onerror = () => {
        setError(true);
        setLoading(false);
      };
      
      reader.readAsDataURL(file);
    } 
    // Handle PDF previews (first page)
    else if (isPdf) {
      // In a real implementation, we'd use PDF.js to generate a thumbnail
      // For simplicity in this demo, we'll just show a PDF icon
      setLoading(false);
    } 
    // Other file types
    else {
      setLoading(false);
    }
    
    return () => {
      if (preview) {
        URL.revokeObjectURL(preview);
      }
    };
  }, [file]);
  
  // Function to format file size
  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes';
    
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  // Handle removal with confirmation
  const handleRemove = () => {
    if (confirm(`Remove file: ${file.name}?`)) {
      onRemove();
    }
  };

  return (
    <div className="group relative border rounded-md p-2 flex flex-col overflow-hidden bg-card hover:shadow-md transition-shadow">
      {/* Preview section */}
      <div className="aspect-square w-full bg-muted rounded-md flex items-center justify-center overflow-hidden">
        {loading ? (
          <div className="animate-pulse bg-muted h-full w-full" />
        ) : error ? (
          <div className="text-destructive flex flex-col items-center justify-center p-4">
            <span className="text-xs text-center">Error loading preview</span>
          </div>
        ) : isImage && preview ? (
          <img 
            src={preview} 
            alt={file.name} 
            className="h-full w-full object-cover"
            onError={() => setError(true)} 
          />
        ) : isPdf ? (
          <File size={48} className="text-red-500" />
        ) : (
          <FileText size={48} className="text-muted-foreground" />
        )}
      </div>
      
      {/* File info */}
      <div className="mt-2 text-sm">
        <p className="font-medium truncate" title={file.name}>
          {file.name}
        </p>
        <p className="text-xs text-muted-foreground">
          {formatFileSize(file.size)}
        </p>
      </div>
      
      {/* Remove button */}
      <Button
        className="absolute top-2 right-2 h-8 w-8 p-0 bg-background/80 hover:bg-background backdrop-blur-sm opacity-0 group-hover:opacity-100 focus:opacity-100 transition-opacity"
        size="icon"
        variant="outline"
        onClick={handleRemove}
        disabled={disabled}
        aria-label={`Remove file: ${file.name}`}
      >
        <X size={16} />
      </Button>
    </div>
  );
};
