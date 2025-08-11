import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Upload, CheckCircle, AlertCircle, X } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface DatabaseFileUploaderProps {
  onUploadComplete?: (documentId: string) => void;
  userId: string;
  documentType: 'passport' | 'id_card' | 'driving_license' | 'selfie';
  maxFileSize?: number; // in MB
  accept?: string;
}

export function DatabaseFileUploader({ 
  onUploadComplete, 
  userId, 
  documentType,
  maxFileSize = 10,
  accept = "image/*,.pdf"
}: DatabaseFileUploaderProps) {
  const [isUploading, setIsUploading] = useState(false);
  const [uploadComplete, setUploadComplete] = useState(false);
  const [fileName, setFileName] = useState<string>('');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const { toast } = useToast();

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

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Validate file size
    if (file.size > maxFileSize * 1024 * 1024) {
      toast({
        title: "File too large",
        description: `File must be smaller than ${maxFileSize}MB`,
        variant: "destructive",
      });
      return;
    }

    setSelectedFile(file);
    setFileName(file.name);
    setUploadComplete(false);
  };

  const handleUpload = async () => {
    if (!selectedFile) return;

    setIsUploading(true);
    
    try {
      // Convert file to base64
      const base64Data = await convertToBase64(selectedFile);
      
      // Upload file data to database
      const uploadResponse = await fetch("/api/files/upload", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          fileName: selectedFile.name,
          fileData: base64Data,
          contentType: selectedFile.type,
          fileSize: selectedFile.size,
          userId,
          documentType
        }),
      });

      if (!uploadResponse.ok) {
        const error = await uploadResponse.json();
        throw new Error(error.message || "Failed to upload file");
      }

      const result = await uploadResponse.json();
      
      setUploadComplete(true);
      toast({
        title: "Upload successful",
        description: `${selectedFile.name} has been uploaded successfully`,
      });
      
      onUploadComplete?.(result.documentId);
    } catch (error) {
      console.error("Upload failed:", error);
      toast({
        title: "Upload failed",
        description: error instanceof Error ? error.message : "Failed to upload file",
        variant: "destructive",
      });
    } finally {
      setIsUploading(false);
    }
  };

  const clearFile = () => {
    setSelectedFile(null);
    setFileName('');
    setUploadComplete(false);
  };

  return (
    <div className="space-y-4">
      <div className="border-2 border-dashed border-gray-300 dark:border-gray-700 rounded-lg p-6 text-center">
        {!selectedFile ? (
          <div>
            <Upload className="mx-auto h-12 w-12 text-gray-400 mb-4" />
            <div className="space-y-2">
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Choose a file to upload
              </p>
              <p className="text-xs text-gray-500">
                Supports images and PDF files (max {maxFileSize}MB)
              </p>
            </div>
            <input
              type="file"
              accept={accept}
              onChange={handleFileSelect}
              className="mt-4 block w-full text-sm text-gray-500
                       file:mr-4 file:py-2 file:px-4
                       file:rounded-full file:border-0
                       file:text-sm file:font-semibold
                       file:bg-blue-50 file:text-blue-700
                       hover:file:bg-blue-100
                       dark:file:bg-blue-900 dark:file:text-blue-300"
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
                <p className="font-medium">{fileName}</p>
                <p className="text-sm text-gray-500">
                  {(selectedFile.size / 1024 / 1024).toFixed(2)} MB
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
                  disabled={isUploading}
                  size="sm"
                >
                  {isUploading ? "Uploading..." : "Upload"}
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
  );
}