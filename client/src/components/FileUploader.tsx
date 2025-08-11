import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Upload, X, CheckCircle, AlertCircle } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface FileUploaderProps {
  userId: string;
  documentType: 'passport' | 'id_card' | 'driving_license' | 'selfie';
  onUploadComplete?: (documentId: string) => void;
  accept?: string;
  maxSize?: number; // in MB
}

export function FileUploader({ 
  userId, 
  documentType, 
  onUploadComplete, 
  accept = "image/*,.pdf",
  maxSize = 10 
}: FileUploaderProps) {
  const [file, setFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [uploadComplete, setUploadComplete] = useState(false);
  const { toast } = useToast();

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = event.target.files?.[0];
    if (!selectedFile) return;

    // Validate file size
    if (selectedFile.size > maxSize * 1024 * 1024) {
      toast({
        title: "File too large",
        description: `File must be smaller than ${maxSize}MB`,
        variant: "destructive",
      });
      return;
    }

    setFile(selectedFile);
    setUploadComplete(false);
  };

  const convertToBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => {
        const result = reader.result as string;
        // Remove the data URL prefix (e.g., "data:image/jpeg;base64,")
        const base64 = result.split(',')[1];
        resolve(base64);
      };
      reader.onerror = (error) => reject(error);
    });
  };

  const handleUpload = async () => {
    if (!file) return;

    setUploading(true);
    try {
      const base64Data = await convertToBase64(file);
      
      const uploadData = {
        fileName: file.name,
        fileData: base64Data,
        contentType: file.type,
        fileSize: file.size,
        userId,
        documentType
      };

      const response = await fetch('/api/files/upload', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(uploadData),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Upload failed');
      }

      const result = await response.json();
      
      toast({
        title: "Upload successful",
        description: `${file.name} has been uploaded successfully`,
      });

      setUploadComplete(true);
      onUploadComplete?.(result.documentId);
    } catch (error) {
      console.error('Upload error:', error);
      toast({
        title: "Upload failed",
        description: error instanceof Error ? error.message : "Failed to upload file",
        variant: "destructive",
      });
    } finally {
      setUploading(false);
    }
  };

  const clearFile = () => {
    setFile(null);
    setUploadComplete(false);
  };

  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="file-upload">
          Upload {documentType.replace('_', ' ')} document
        </Label>
        <div className="border-2 border-dashed border-gray-300 dark:border-gray-700 rounded-lg p-6 text-center">
          {!file ? (
            <div>
              <Upload className="mx-auto h-12 w-12 text-gray-400 mb-4" />
              <div className="space-y-2">
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Click to select a file or drag and drop
                </p>
                <p className="text-xs text-gray-500">
                  Supports images and PDF files (max {maxSize}MB)
                </p>
              </div>
              <Input
                id="file-upload"
                type="file"
                accept={accept}
                onChange={handleFileSelect}
                className="mt-4"
              />
            </div>
          ) : (
            <div className="space-y-4">
              <div className="flex items-center justify-center space-x-2">
                {uploadComplete ? (
                  <CheckCircle className="h-8 w-8 text-green-500" />
                ) : (
                  <AlertCircle className="h-8 w-8 text-blue-500" />
                )}
                <div className="text-left">
                  <p className="font-medium">{file.name}</p>
                  <p className="text-sm text-gray-500">
                    {(file.size / 1024 / 1024).toFixed(2)} MB
                  </p>
                  {uploadComplete && (
                    <p className="text-sm text-green-600">Upload complete!</p>
                  )}
                </div>
              </div>
              
              <div className="flex space-x-2 justify-center">
                {!uploadComplete && (
                  <Button 
                    onClick={handleUpload} 
                    disabled={uploading}
                    size="sm"
                  >
                    {uploading ? "Uploading..." : "Upload"}
                  </Button>
                )}
                <Button 
                  variant="outline" 
                  onClick={clearFile}
                  size="sm"
                >
                  <X className="h-4 w-4 mr-1" />
                  {uploadComplete ? "Upload Another" : "Remove"}
                </Button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}