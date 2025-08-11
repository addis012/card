import { useState } from "react";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { insertUserSchema, insertKycDocumentSchema, type InsertUser, type InsertKycDocument } from "@shared/schema";
import { useMutation } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { DatabaseFileUploader } from "@/components/DatabaseFileUploader";
import { UserPlus, Phone, Mail, User, Lock, Shield, Upload, FileText, ArrowRight } from "lucide-react";

export default function Register() {
  const { toast } = useToast();
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [currentStep, setCurrentStep] = useState<"account" | "documents">("account");
  const [userId, setUserId] = useState<string | null>(null);
  const [uploadedDocuments, setUploadedDocuments] = useState<{passport?: string, id_card?: string}>({});

  const form = useForm<InsertUser>({
    resolver: zodResolver(insertUserSchema),
    defaultValues: {
      username: "",
      password: "",
      email: "",
      firstName: "",
      lastName: "",
      phone: "",
      role: "user",
      kycStatus: "pending"
    },
  });

  const kycForm = useForm<InsertKycDocument>({
    resolver: zodResolver(insertKycDocumentSchema),
    defaultValues: {
      documentType: "passport",
      documentUrl: "",
      status: "pending"
    },
  });

  const registerMutation = useMutation({
    mutationFn: async (data: InsertUser) => {
      const response = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || "Registration failed");
      }
      return response.json();
    },
    onSuccess: (response: any) => {
      const userId = response.user?._id || response.user?.id || response._id || response.id;
      setUserId(userId);
      setCurrentStep("documents");
      toast({
        title: "Account Created",
        description: "Now please upload your identity documents to complete registration.",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Registration Failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const kycMutation = useMutation({
    mutationFn: async (data: InsertKycDocument) => {
      const response = await fetch("/api/kyc-documents", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...data, userId }),
      });
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || "KYC document submission failed");
      }
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Document Uploaded",
        description: "Document uploaded successfully. Continue with additional documents or complete registration.",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Upload Failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Upload handlers
  const handleUploadComplete = (documentId: string, docType: "passport" | "id_card") => {
    setUploadedDocuments(prev => ({
      ...prev,
      [docType]: documentId
    }));
    
    toast({
      title: "File Uploaded",
      description: `Your ${docType === "passport" ? "passport" : "ID document"} has been uploaded successfully to database.`,
    });
  };

  const submitDocument = async (docType: "passport" | "id_card") => {
    const documentId = uploadedDocuments[docType];
    if (!documentId || !userId) return;

    // Document is already uploaded to database, just update status
    toast({
      title: "Document Submitted",
      description: `Your ${docType === "passport" ? "passport" : "ID card"} is now under review.`,
    });
  };

  const completeRegistration = () => {
    setIsSubmitted(true);
    toast({
      title: "Registration Complete!",
      description: "Your account and documents have been submitted for review. You can now login.",
    });
  };

  if (isSubmitted) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-950 dark:to-gray-900 flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <div className="mx-auto mb-4 w-12 h-12 bg-green-100 dark:bg-green-900 rounded-full flex items-center justify-center">
              <UserPlus className="w-6 h-6 text-green-600 dark:text-green-400" />
            </div>
            <CardTitle className="text-2xl text-green-600 dark:text-green-400">Registration Complete!</CardTitle>
            <CardDescription>
              Your account and identity documents have been submitted for review. You can now login to track your verification status.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="bg-blue-50 dark:bg-blue-900 p-4 rounded-lg">
                <div className="flex items-start gap-3">
                  <Shield className="w-5 h-5 text-blue-600 mt-0.5" />
                  <div className="text-sm">
                    <p className="font-medium text-blue-900 dark:text-blue-100 mb-1">
                      What happens next?
                    </p>
                    <ul className="text-blue-700 dark:text-blue-200 space-y-1">
                      <li>• Admin will review your documents</li>
                      <li>• Cards will be created upon approval</li>
                      <li>• You'll receive login access once approved</li>
                    </ul>
                  </div>
                </div>
              </div>
              <Link href="/login">
                <Button className="w-full">Go to Login</Button>
              </Link>
              <Link href="/">
                <Button variant="outline" className="w-full">Back to Home</Button>
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-950 dark:to-gray-900 flex items-center justify-center p-4">
      <Card className="w-full max-w-2xl">
        <CardHeader className="text-center">
          <div className="mx-auto mb-4 w-12 h-12 bg-blue-100 dark:bg-blue-900 rounded-full flex items-center justify-center">
            <UserPlus className="w-6 h-6 text-blue-600 dark:text-blue-400" />
          </div>
          <CardTitle className="text-2xl">Create Account</CardTitle>
          <CardDescription>
            Join CardFlow Pro to access professional card services
          </CardDescription>
          <div className="flex justify-center items-center gap-4 mt-6">
            <div className={`flex items-center gap-2 ${currentStep === "account" ? "text-blue-600" : "text-gray-400"}`}>
              <div className={`w-8 h-8 rounded-full flex items-center justify-center ${currentStep === "account" ? "bg-blue-600 text-white" : "bg-gray-200 text-gray-600"}`}>
                1
              </div>
              <span className="text-sm font-medium">Account Info</span>
            </div>
            <ArrowRight className="w-4 h-4 text-gray-400" />
            <div className={`flex items-center gap-2 ${currentStep === "documents" ? "text-blue-600" : "text-gray-400"}`}>
              <div className={`w-8 h-8 rounded-full flex items-center justify-center ${currentStep === "documents" ? "bg-blue-600 text-white" : "bg-gray-200 text-gray-600"}`}>
                2
              </div>
              <span className="text-sm font-medium">ID Documents</span>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {currentStep === "account" ? (
            <div>
          <Form {...form}>
            <form onSubmit={form.handleSubmit((data) => registerMutation.mutate(data))} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="firstName"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>First Name</FormLabel>
                      <FormControl>
                        <div className="relative">
                          <User className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                          <Input 
                            placeholder="John" 
                            className="pl-10" 
                            {...field} 
                          />
                        </div>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="lastName"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Last Name</FormLabel>
                      <FormControl>
                        <div className="relative">
                          <User className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                          <Input 
                            placeholder="Doe" 
                            className="pl-10" 
                            {...field} 
                          />
                        </div>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <FormField
                control={form.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Email</FormLabel>
                    <FormControl>
                      <div className="relative">
                        <Mail className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                        <Input 
                          placeholder="john@example.com" 
                          type="email" 
                          className="pl-10" 
                          {...field} 
                        />
                      </div>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="phone"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Phone Number</FormLabel>
                    <FormControl>
                      <div className="relative">
                        <Phone className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                        <Input 
                          placeholder="+251901234567" 
                          type="tel" 
                          className="pl-10" 
                          {...field}
                          value={field.value || ''}
                        />
                      </div>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="username"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Username (Email or Phone)</FormLabel>
                    <FormControl>
                      <div className="relative">
                        <User className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                        <Input 
                          placeholder="john@example.com or +251901234567" 
                          className="pl-10" 
                          {...field} 
                        />
                      </div>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="password"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Password</FormLabel>
                    <FormControl>
                      <div className="relative">
                        <Lock className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                        <Input 
                          placeholder="Enter secure password" 
                          type="password" 
                          className="pl-10" 
                          {...field} 
                        />
                      </div>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <Button 
                type="submit" 
                className="w-full" 
                disabled={registerMutation.isPending}
              >
                {registerMutation.isPending ? "Creating Account..." : "Create Account"}
              </Button>
            </form>
          </Form>

          <div className="mt-6 text-center">
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Already have an account?{" "}
              <Link href="/login" className="text-blue-600 hover:text-blue-500 font-medium">
                Sign in
              </Link>
            </p>
          </div>
          </div>
          ) : (
            // Document Upload Form
            <div className="space-y-6">
              <div className="text-center">
                <Shield className="w-12 h-12 text-blue-600 mx-auto mb-4" />
                <h3 className="text-lg font-semibold mb-2">Upload Identity Documents</h3>
                <p className="text-gray-600 dark:text-gray-400">
                  Please upload your passport and national ID to complete registration
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <Card className="border-2 border-dashed border-gray-300 dark:border-gray-600">
                  <CardHeader>
                    <CardTitle className="text-lg flex items-center gap-2">
                      <FileText className="w-5 h-5" />
                      Passport
                    </CardTitle>
                    <CardDescription>
                      Upload a clear photo of your passport
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <DatabaseFileUploader
                      userId={userId || ""}
                      documentType="passport"
                      onUploadComplete={(documentId) => handleUploadComplete(documentId, "passport")}
                      maxFileSize={10}
                    />
                    
                    {uploadedDocuments.passport && (
                      <div className="mt-4 space-y-2">
                        <p className="text-sm text-green-600 dark:text-green-400">
                          ✓ Passport uploaded successfully
                        </p>
                        <Button
                          onClick={() => submitDocument("passport")}
                          disabled={kycMutation.isPending}
                          size="sm"
                          className="w-full"
                        >
                          {kycMutation.isPending ? "Submitting..." : "Submit Passport"}
                        </Button>
                      </div>
                    )}
                  </CardContent>
                </Card>

                <Card className="border-2 border-dashed border-gray-300 dark:border-gray-600">
                  <CardHeader>
                    <CardTitle className="text-lg flex items-center gap-2">
                      <FileText className="w-5 h-5" />
                      National ID
                    </CardTitle>
                    <CardDescription>
                      Upload a clear photo of your national ID
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <DatabaseFileUploader
                      userId={userId || ""}
                      documentType="id_card"
                      onUploadComplete={(documentId) => handleUploadComplete(documentId, "id_card")}
                      maxFileSize={10}
                    />
                    
                    {uploadedDocuments.id_card && (
                      <div className="mt-4 space-y-2">
                        <p className="text-sm text-green-600 dark:text-green-400">
                          ✓ National ID uploaded successfully
                        </p>
                        <Button
                          onClick={() => submitDocument("id_card")}
                          disabled={kycMutation.isPending}
                          size="sm"
                          className="w-full"
                        >
                          {kycMutation.isPending ? "Submitting..." : "Submit National ID"}
                        </Button>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </div>

              <div className="bg-amber-50 dark:bg-amber-900 p-4 rounded-lg">
                <div className="flex items-start gap-3">
                  <FileText className="w-5 h-5 text-amber-600 mt-0.5" />
                  <div className="text-sm">
                    <p className="font-medium text-amber-900 dark:text-amber-100 mb-1">
                      Document Requirements
                    </p>
                    <ul className="text-amber-700 dark:text-amber-200 space-y-1">
                      <li>• High-quality photo or scan</li>
                      <li>• All text must be clearly readable</li>
                      <li>• Documents must be valid and unexpired</li>
                      <li>• Maximum file size: 10MB each</li>
                    </ul>
                  </div>
                </div>
              </div>

              <div className="flex gap-3">
                <Button
                  onClick={completeRegistration}
                  className="flex-1"
                  disabled={!uploadedDocuments.passport && !uploadedDocuments.id_card}
                >
                  Complete Registration
                </Button>
                <Button
                  variant="outline"
                  onClick={() => setCurrentStep("account")}
                >
                  Back
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}