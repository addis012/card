import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { z } from "zod";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { 
  Form, 
  FormControl, 
  FormDescription, 
  FormField, 
  FormItem, 
  FormLabel, 
  FormMessage 
} from "@/components/ui/form";
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { CheckCircle, Upload, User, CreditCard, FileText, MapPin } from "lucide-react";
import { insertStrowalletCustomerSchema } from "@shared/schema";

const registrationSteps = [
  { id: 1, title: "Personal Info", icon: User },
  { id: 2, title: "Address", icon: MapPin },
  { id: 3, title: "Documents", icon: FileText },
  { id: 4, title: "Complete", icon: CheckCircle },
];

// Extended schema for the full registration form
const fullRegistrationSchema = insertStrowalletCustomerSchema.extend({
  username: z.string().min(3, "Username must be at least 3 characters"),
  password: z.string().min(6, "Password must be at least 6 characters"),
  confirmPassword: z.string(),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords don't match",
  path: ["confirmPassword"],
});

type RegistrationFormData = z.infer<typeof fullRegistrationSchema>;

export default function UserRegistration() {
  const [currentStep, setCurrentStep] = useState(1);
  const [uploadedFiles, setUploadedFiles] = useState<{
    idImage: File | null;
    userPhoto: File | null;
  }>({ idImage: null, userPhoto: null });

  const { toast } = useToast();
  const queryClient = useQueryClient();

  const form = useForm<RegistrationFormData>({
    resolver: zodResolver(fullRegistrationSchema),
    defaultValues: {
      publicKey: import.meta.env.VITE_STROWALLET_PUBLIC_KEY || "",
      firstName: "",
      lastName: "",
      customerEmail: "",
      phoneNumber: "",
      dateOfBirth: "",
      idNumber: "",
      idType: "",
      houseNumber: "",
      line1: "",
      city: "",
      state: "",
      zipCode: "",
      country: "ET",
      username: "",
      password: "",
      confirmPassword: "",
    },
  });

  const registerMutation = useMutation({
    mutationFn: async (data: RegistrationFormData) => {
      // Convert files to base64
      const idImageBase64 = uploadedFiles.idImage 
        ? await fileToBase64(uploadedFiles.idImage)
        : "";
      const userPhotoBase64 = uploadedFiles.userPhoto 
        ? await fileToBase64(uploadedFiles.userPhoto)
        : "";

      const registrationData = {
        ...data,
        idImage: idImageBase64,
        userPhoto: userPhotoBase64,
      };

      return apiRequest('/api/auth/register-full', 'POST', registrationData);
    },
    onSuccess: () => {
      toast({
        title: "Registration Successful!",
        description: "Your account has been created. You can now log in.",
      });
      setCurrentStep(4);
      queryClient.invalidateQueries({ queryKey: ['/api/auth/me'] });
    },
    onError: (error: any) => {
      toast({
        title: "Registration Failed",
        description: error.message || "Something went wrong. Please try again.",
        variant: "destructive",
      });
    },
  });

  const fileToBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = error => reject(error);
    });
  };

  const handleFileUpload = (type: 'idImage' | 'userPhoto', file: File) => {
    setUploadedFiles(prev => ({ ...prev, [type]: file }));
  };

  const validateStep = (step: number): boolean => {
    const values = form.getValues();
    
    switch (step) {
      case 1:
        return !!(values.firstName && values.lastName && values.customerEmail && 
                 values.phoneNumber && values.dateOfBirth && values.username && 
                 values.password && values.confirmPassword);
      case 2:
        return !!(values.houseNumber && values.line1 && values.city && 
                 values.state && values.zipCode && values.country);
      case 3:
        return !!(values.idNumber && values.idType && uploadedFiles.idImage && uploadedFiles.userPhoto);
      default:
        return true;
    }
  };

  const nextStep = () => {
    if (validateStep(currentStep)) {
      setCurrentStep(prev => Math.min(prev + 1, 4));
    } else {
      toast({
        title: "Please complete all required fields",
        description: "Fill in all required information before proceeding.",
        variant: "destructive",
      });
    }
  };

  const prevStep = () => {
    setCurrentStep(prev => Math.max(prev - 1, 1));
  };

  const onSubmit = async (data: RegistrationFormData) => {
    if (validateStep(3)) {
      registerMutation.mutate(data);
    }
  };

  const getStepProgress = () => ((currentStep - 1) / 3) * 100;

  if (currentStep === 4) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-blue-50 to-indigo-100 flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <div className="mx-auto w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mb-4">
              <CheckCircle className="w-8 h-8 text-green-600" />
            </div>
            <CardTitle className="text-2xl" data-testid="title-registration-complete">Registration Complete!</CardTitle>
            <CardDescription>
              Your account has been successfully created. You can now access your dashboard.
            </CardDescription>
          </CardHeader>
          <CardContent className="text-center space-y-4">
            <div className="space-y-2">
              <Badge variant="default" className="text-sm" data-testid="badge-account-status">
                Account Created
              </Badge>
              <p className="text-sm text-gray-600">
                Your Strowallet integration is being processed. You'll be able to create cards once your account is verified.
              </p>
            </div>
            <Button 
              className="w-full" 
              onClick={() => window.location.href = '/login'}
              data-testid="button-go-to-login"
            >
              Go to Login
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-50 to-indigo-100 p-4">
      <div className="max-w-4xl mx-auto">
        {/* Progress Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <h1 className="text-3xl font-bold text-gray-900" data-testid="title-user-registration">
              Create Your Account
            </h1>
            <Badge variant="outline" data-testid="badge-step-indicator">
              Step {currentStep} of 3
            </Badge>
          </div>
          <Progress value={getStepProgress()} className="h-2" data-testid="progress-registration" />
          
          <div className="flex justify-between mt-4">
            {registrationSteps.slice(0, 3).map((step) => {
              const IconComponent = step.icon;
              const isActive = currentStep === step.id;
              const isCompleted = currentStep > step.id;
              
              return (
                <div key={step.id} className="flex flex-col items-center">
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                    isCompleted ? 'bg-green-500 text-white' :
                    isActive ? 'bg-blue-500 text-white' :
                    'bg-gray-200 text-gray-500'
                  }`} data-testid={`step-icon-${step.id}`}>
                    <IconComponent className="w-5 h-5" />
                  </div>
                  <span className={`text-sm mt-2 ${
                    isActive ? 'text-blue-600 font-medium' : 'text-gray-600'
                  }`} data-testid={`step-title-${step.id}`}>
                    {step.title}
                  </span>
                </div>
              );
            })}
          </div>
        </div>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>
                  {currentStep === 1 && "Personal Information"}
                  {currentStep === 2 && "Address Information"}
                  {currentStep === 3 && "Identity Documents"}
                </CardTitle>
                <CardDescription>
                  {currentStep === 1 && "Enter your basic personal details and create your account credentials"}
                  {currentStep === 2 && "Provide your current residential address"}
                  {currentStep === 3 && "Upload required documents for identity verification"}
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Step 1: Personal Information */}
                {currentStep === 1 && (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="firstName"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>First Name</FormLabel>
                          <FormControl>
                            <Input {...field} data-testid="input-first-name" />
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
                            <Input {...field} data-testid="input-last-name" />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="customerEmail"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Email Address</FormLabel>
                          <FormControl>
                            <Input type="email" {...field} data-testid="input-email" />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="phoneNumber"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Phone Number</FormLabel>
                          <FormControl>
                            <Input {...field} placeholder="251912345678" data-testid="input-phone" />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="dateOfBirth"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Date of Birth</FormLabel>
                          <FormControl>
                            <Input type="date" {...field} data-testid="input-date-of-birth" />
                          </FormControl>
                          <FormDescription>Format: MM/DD/YYYY</FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="username"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Username</FormLabel>
                          <FormControl>
                            <Input {...field} data-testid="input-username" />
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
                            <Input type="password" {...field} data-testid="input-password" />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="confirmPassword"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Confirm Password</FormLabel>
                          <FormControl>
                            <Input type="password" {...field} data-testid="input-confirm-password" />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                )}

                {/* Step 2: Address Information */}
                {currentStep === 2 && (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="houseNumber"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>House Number</FormLabel>
                          <FormControl>
                            <Input {...field} data-testid="input-house-number" />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="line1"
                      render={({ field }) => (
                        <FormItem className="md:col-span-2">
                          <FormLabel>Street Address</FormLabel>
                          <FormControl>
                            <Input {...field} placeholder="123 Main Street" data-testid="input-street-address" />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="city"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>City</FormLabel>
                          <FormControl>
                            <Input {...field} data-testid="input-city" />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="state"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>State/Province</FormLabel>
                          <FormControl>
                            <Input {...field} data-testid="input-state" />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="zipCode"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>ZIP/Postal Code</FormLabel>
                          <FormControl>
                            <Input {...field} data-testid="input-zip-code" />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="country"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Country</FormLabel>
                          <Select onValueChange={field.onChange} value={field.value}>
                            <FormControl>
                              <SelectTrigger data-testid="select-country">
                                <SelectValue />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value="US">United States</SelectItem>
                              <SelectItem value="CA">Canada</SelectItem>
                              <SelectItem value="UK">United Kingdom</SelectItem>
                              <SelectItem value="ET">Ethiopia</SelectItem>
                              <SelectItem value="NG">Nigeria</SelectItem>
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                )}

                {/* Step 3: Documents */}
                {currentStep === 3 && (
                  <div className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <FormField
                        control={form.control}
                        name="idType"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>ID Type</FormLabel>
                            <Select onValueChange={field.onChange} value={field.value}>
                              <FormControl>
                                <SelectTrigger data-testid="select-id-type">
                                  <SelectValue placeholder="Select ID type" />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                <SelectItem value="PASSPORT">Passport</SelectItem>
                                <SelectItem value="DRIVERS_LICENSE">Driver's License</SelectItem>
                                <SelectItem value="NATIONAL_ID">National ID</SelectItem>
                                <SelectItem value="BVN">BVN</SelectItem>
                                <SelectItem value="NIN">NIN</SelectItem>
                              </SelectContent>
                            </Select>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={form.control}
                        name="idNumber"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>ID Number</FormLabel>
                            <FormControl>
                              <Input {...field} data-testid="input-id-number" />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      {/* ID Document Upload */}
                      <div className="space-y-3">
                        <Label>Upload ID Document</Label>
                        <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
                          <input
                            type="file"
                            accept="image/*"
                            onChange={(e) => {
                              const file = e.target.files?.[0];
                              if (file) handleFileUpload('idImage', file);
                            }}
                            className="hidden"
                            id="id-upload"
                            data-testid="input-id-upload"
                          />
                          <label htmlFor="id-upload" className="cursor-pointer">
                            <Upload className="mx-auto h-12 w-12 text-gray-400" />
                            <p className="mt-2 text-sm text-gray-600">
                              {uploadedFiles.idImage 
                                ? uploadedFiles.idImage.name 
                                : "Click to upload ID document"
                              }
                            </p>
                          </label>
                        </div>
                      </div>

                      {/* Photo Upload */}
                      <div className="space-y-3">
                        <Label>Upload Photo (Selfie)</Label>
                        <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
                          <input
                            type="file"
                            accept="image/*"
                            onChange={(e) => {
                              const file = e.target.files?.[0];
                              if (file) handleFileUpload('userPhoto', file);
                            }}
                            className="hidden"
                            id="photo-upload"
                            data-testid="input-photo-upload"
                          />
                          <label htmlFor="photo-upload" className="cursor-pointer">
                            <Upload className="mx-auto h-12 w-12 text-gray-400" />
                            <p className="mt-2 text-sm text-gray-600">
                              {uploadedFiles.userPhoto 
                                ? uploadedFiles.userPhoto.name 
                                : "Click to upload your photo"
                              }
                            </p>
                          </label>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Navigation Buttons */}
            <div className="flex justify-between">
              <Button
                type="button"
                variant="outline"
                onClick={prevStep}
                disabled={currentStep === 1}
                data-testid="button-previous-step"
              >
                Previous
              </Button>
              
              {currentStep < 3 ? (
                <Button
                  type="button"
                  onClick={nextStep}
                  data-testid="button-next-step"
                >
                  Next
                </Button>
              ) : (
                <Button
                  type="submit"
                  disabled={registerMutation.isPending}
                  data-testid="button-complete-registration"
                >
                  {registerMutation.isPending ? "Creating Account..." : "Complete Registration"}
                </Button>
              )}
            </div>
          </form>
        </Form>
      </div>
    </div>
  );
}