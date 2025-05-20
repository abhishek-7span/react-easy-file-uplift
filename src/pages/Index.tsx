
import React, { useState } from 'react';
import FileUploader from '@/components/FileUploader';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';

const Index = () => {
  const [uploadedFiles, setUploadedFiles] = useState<File[]>([]);

  const handleFilesSelected = (files: File[]) => {
    console.log('Files selected:', files);
  };

  const handleFilesUploaded = (files: File[]) => {
    setUploadedFiles(files);
    console.log('Files uploaded successfully:', files);
  };

  const handleFileRemoved = (file: File) => {
    console.log('File removed:', file);
  };

  const handleUploadError = (error: Error) => {
    console.error('Upload error:', error);
  };

  return (
    <div className="min-h-screen p-4 sm:p-8 bg-gray-50 dark:bg-gray-900">
      <div className="max-w-4xl mx-auto space-y-8">
        <div className="text-center">
          <h1 className="text-3xl sm:text-4xl font-bold mb-4">File Upload Component</h1>
          <p className="text-gray-600 dark:text-gray-300 max-w-2xl mx-auto">
            A comprehensive file upload component with support for drag-and-drop, file validation, 
            previews, and progress tracking.
          </p>
        </div>

        <div className="grid gap-8">
          <Card>
            <CardHeader>
              <CardTitle>Single File Upload</CardTitle>
              <CardDescription>
                Upload a single image file (JPG, PNG, GIF, WEBP).
              </CardDescription>
            </CardHeader>
            <CardContent>
              <FileUploader
                allowedTypes={['.jpg', '.jpeg', '.png', '.gif', '.webp']}
                allowedMimeTypes={['image/jpeg', 'image/png', 'image/gif', 'image/webp']}
                maxFileSize={5 * 1024 * 1024} // 5MB
                onFileSelected={handleFilesSelected}
                onUploadSuccess={handleFilesUploaded}
                onFileRemoved={handleFileRemoved}
                onUploadError={handleUploadError}
                uploadUrl="/api/upload" // This is a placeholder URL
              />
            </CardContent>
            <CardFooter className="text-sm text-muted-foreground">
              Max file size: 5MB. Allowed formats: JPG, PNG, GIF, WEBP.
            </CardFooter>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Multiple File Upload</CardTitle>
              <CardDescription>
                Upload multiple files with preview and validation.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <FileUploader
                multiple
                maxFiles={5}
                maxFileSize={10 * 1024 * 1024} // 10MB
                maxTotalSize={50 * 1024 * 1024} // 50MB
                allowedTypes={['.jpg', '.jpeg', '.png', '.pdf', '.doc', '.docx']}
                onFileSelected={handleFilesSelected}
                onUploadSuccess={handleFilesUploaded}
                onFileRemoved={handleFileRemoved}
                onUploadError={handleUploadError}
                uploadUrl="/api/upload-multiple" // This is a placeholder URL
              />
            </CardContent>
            <CardFooter className="text-sm text-muted-foreground">
              Max 5 files. Max size per file: 10MB. Total max size: 50MB.
            </CardFooter>
          </Card>
        </div>

        {uploadedFiles.length > 0 && (
          <div className="mt-8">
            <h2 className="text-xl font-semibold mb-4">Uploaded Files</h2>
            <ul className="list-disc pl-5 space-y-2">
              {uploadedFiles.map((file, index) => (
                <li key={index}>
                  {file.name} ({(file.size / 1024).toFixed(2)} KB)
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
    </div>
  );
};

export default Index;
