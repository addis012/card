import { useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { ArrowLeft, Eye, EyeOff } from "lucide-react";
import { Link } from "wouter";

export default function Profile() {
  const { user } = useAuth();
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const [profileData, setProfileData] = useState({
    firstName: user?.firstName || "Addisu",
    lastName: user?.lastName || "Admasu",
    email: user?.email || "AddisuuAdmasu@gmail.com",
    phone: "+251",
    address: "23 bole gedana",
    city: "addis ababa",
    state: "Addis Ababa",
    zipCode: "1000",
    country: "Ethiopia",
    currentPassword: "",
    newPassword: "",
    confirmPassword: ""
  });

  const handleInputChange = (field: string, value: string) => {
    setProfileData(prev => ({ ...prev, [field]: value }));
  };

  const handleUpdateProfile = () => {
    console.log("Updating profile:", profileData);
    // Handle profile update logic here
  };

  const handleChangePassword = () => {
    console.log("Changing password...");
    // Handle password change logic here
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-800 via-blue-900 to-slate-900 text-white">
      <div className="p-6 space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <Link href="/dashboard">
              <Button variant="ghost" size="sm" className="text-white hover:bg-white/10">
                <ArrowLeft className="h-5 w-5" />
              </Button>
            </Link>
            <h1 className="text-2xl font-bold text-white">
              My Profile
            </h1>
          </div>
          <Button 
            className="bg-green-500 hover:bg-green-600 text-white rounded-xl px-4 py-2"
          >
            Delete Account
          </Button>
        </div>

        {/* Profile Image Section */}
        <div 
          className="relative h-48 bg-gradient-to-r from-orange-400 via-red-400 to-pink-400 rounded-2xl bg-cover bg-center"
          style={{
            backgroundImage: "url('https://images.unsplash.com/photo-1560472354-b33ff0c44a43?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1000&q=80')"
          }}
        >
          <div className="absolute bottom-6 left-6">
            <div className="flex items-center space-x-4">
              <Avatar className="h-20 w-20 border-4 border-white">
                <AvatarImage src="/placeholder-avatar.png" alt={user?.firstName} />
                <AvatarFallback className="bg-green-500 text-white text-2xl font-bold">
                  {user?.firstName?.charAt(0)}{user?.lastName?.charAt(0)}
                </AvatarFallback>
              </Avatar>
              <div>
                <h2 className="text-white text-2xl font-bold">{profileData.firstName}</h2>
                <p className="text-white/90">{profileData.email}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Profile Form */}
        <div className="bg-slate-700/50 backdrop-blur rounded-2xl p-6 space-y-6">
          {/* Personal Information */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="firstName" className="text-white/70 text-sm">
                First Name*
              </Label>
              <Input
                id="firstName"
                value={profileData.firstName}
                onChange={(e) => handleInputChange("firstName", e.target.value)}
                className="w-full bg-slate-600/50 border-slate-500 text-white h-12 mt-1"
              />
            </div>
            <div>
              <Label htmlFor="lastName" className="text-white/70 text-sm">
                Last Name*
              </Label>
              <Input
                id="lastName"
                value={profileData.lastName}
                onChange={(e) => handleInputChange("lastName", e.target.value)}
                className="w-full bg-slate-600/50 border-slate-500 text-white h-12 mt-1"
              />
            </div>
          </div>

          <div>
            <Label htmlFor="country" className="text-white/70 text-sm">
              Country*
            </Label>
            <Select value={profileData.country} onValueChange={(value) => handleInputChange("country", value)}>
              <SelectTrigger className="w-full bg-slate-600/50 border-slate-500 text-white h-12 mt-1">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Ethiopia">Ethiopia</SelectItem>
                <SelectItem value="United States">United States</SelectItem>
                <SelectItem value="United Kingdom">United Kingdom</SelectItem>
                <SelectItem value="Canada">Canada</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label htmlFor="phone" className="text-white/70 text-sm">
              Phone
            </Label>
            <div className="flex mt-1">
              <div className="bg-green-500 px-4 py-3 rounded-l-lg flex items-center">
                <span className="text-white font-semibold">+251</span>
              </div>
              <Input
                id="phone"
                value="070340397"
                onChange={(e) => handleInputChange("phone", e.target.value)}
                className="flex-1 bg-slate-600/50 border-slate-500 text-white h-12 rounded-l-none"
              />
            </div>
          </div>

          <div>
            <Label htmlFor="address" className="text-white/70 text-sm">
              Address
            </Label>
            <Input
              id="address"
              value={profileData.address}
              onChange={(e) => handleInputChange("address", e.target.value)}
              className="w-full bg-slate-600/50 border-slate-500 text-white h-12 mt-1"
            />
          </div>

          <div>
            <Label htmlFor="city" className="text-white/70 text-sm">
              City
            </Label>
            <Input
              id="city"
              value={profileData.city}
              onChange={(e) => handleInputChange("city", e.target.value)}
              className="w-full bg-slate-600/50 border-slate-500 text-white h-12 mt-1"
            />
          </div>

          <div>
            <Label htmlFor="state" className="text-white/70 text-sm">
              State
            </Label>
            <Input
              id="state"
              value={profileData.state}
              onChange={(e) => handleInputChange("state", e.target.value)}
              className="w-full bg-slate-600/50 border-slate-500 text-white h-12 mt-1"
            />
          </div>

          <div>
            <Label htmlFor="zipCode" className="text-white/70 text-sm">
              Zip Code
            </Label>
            <Input
              id="zipCode"
              value={profileData.zipCode}
              onChange={(e) => handleInputChange("zipCode", e.target.value)}
              className="w-full bg-slate-600/50 border-slate-500 text-white h-12 mt-1"
            />
          </div>

          <Button 
            onClick={handleUpdateProfile}
            className="w-full bg-green-500 hover:bg-green-600 text-white py-3 rounded-xl font-medium h-12"
          >
            Update
          </Button>
        </div>

        {/* Change Password Section */}
        <div className="bg-slate-700/50 backdrop-blur rounded-2xl p-6 space-y-6">
          <h3 className="text-white text-xl font-semibold">Change Password</h3>

          <div>
            <Label htmlFor="currentPassword" className="text-white/70 text-sm">
              Current Password*
            </Label>
            <div className="relative mt-1">
              <Input
                id="currentPassword"
                type={showCurrentPassword ? "text" : "password"}
                value={profileData.currentPassword}
                onChange={(e) => handleInputChange("currentPassword", e.target.value)}
                placeholder="Current Password"
                className="w-full bg-slate-600/50 border-slate-500 text-white h-12 pr-10"
              />
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                className="absolute right-2 top-1/2 transform -translate-y-1/2 text-white/50 hover:text-white p-1"
              >
                {showCurrentPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </Button>
            </div>
          </div>

          <div>
            <Label htmlFor="newPassword" className="text-white/70 text-sm">
              New Password*
            </Label>
            <div className="relative mt-1">
              <Input
                id="newPassword"
                type={showNewPassword ? "text" : "password"}
                value={profileData.newPassword}
                onChange={(e) => handleInputChange("newPassword", e.target.value)}
                placeholder="New Password"
                className="w-full bg-slate-600/50 border-slate-500 text-white h-12 pr-10"
              />
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => setShowNewPassword(!showNewPassword)}
                className="absolute right-2 top-1/2 transform -translate-y-1/2 text-white/50 hover:text-white p-1"
              >
                {showNewPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </Button>
            </div>
          </div>

          <div>
            <Label htmlFor="confirmPassword" className="text-white/70 text-sm">
              Confirm Password*
            </Label>
            <div className="relative mt-1">
              <Input
                id="confirmPassword"
                type={showConfirmPassword ? "text" : "password"}
                value={profileData.confirmPassword}
                onChange={(e) => handleInputChange("confirmPassword", e.target.value)}
                placeholder="Confirm Password"
                className="w-full bg-slate-600/50 border-slate-500 text-white h-12 pr-10"
              />
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                className="absolute right-2 top-1/2 transform -translate-y-1/2 text-white/50 hover:text-white p-1"
              >
                {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </Button>
            </div>
          </div>

          <Button 
            onClick={handleChangePassword}
            className="w-full bg-green-500 hover:bg-green-600 text-white py-3 rounded-xl font-medium h-12"
          >
            Change
          </Button>
        </div>
      </div>
    </div>
  );
}