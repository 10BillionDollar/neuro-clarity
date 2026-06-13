  import React, { useState, useEffect } from "react";
import { login, LoginPayload, getHospitals, Hospital } from "./auth";
import { useNavigate } from "react-router-dom";
import { useAuth } from "./AuthContext";
import { AuthLayout } from "@/components/layout/AuthLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Eye, EyeOff } from "lucide-react";

export default function Login() {
  const [hospitalName, setHospitalName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [hospitals, setHospitals] = useState<Hospital[]>([]);
  const [hospitalLoadError, setHospitalLoadError] = useState("");
  const [loadingHospitals, setLoadingHospitals] = useState(true);
  const navigate = useNavigate();
  const { login: authLogin, isAuthenticated } = useAuth();

  // Redirect to dashboard if already authenticated
  useEffect(() => {
    if (isAuthenticated) {
      navigate("/", { replace: true });
    }
  }, [isAuthenticated, navigate]);

  useEffect(() => {
    const loadHospitals = async () => {
      try {
        const data = await getHospitals();
        setHospitals(Array.isArray(data.hospitals) ? data.hospitals : []);
        if (!Array.isArray(data.hospitals) || data.hospitals.length === 0) {
          setHospitalLoadError("No hospitals available. Please contact your administrator.");
        }
      } catch (err: any) {
        setHospitalLoadError("Unable to load hospital list. Please refresh the page.");
      } finally {
        setLoadingHospitals(false);
      }
    };

    loadHospitals();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
      e.preventDefault();
      setError("");
      if (!hospitalName) {
        setError("Please select a hospital from the dropdown.");
        return;
      }
      setIsLoading(true);

      const payload: LoginPayload = { hospital_name: hospitalName, email, password };
      try {
        const res = await login(payload);
        if (res.access_token) {
          const userData = {
            email: res.email,
            name: res.name,
            hospital_name: res.hospital_name,
            ...res.user,
          };
          authLogin(res.access_token, userData);
          navigate("/");
        } else {
          setError(res.detail || res.error || "Login failed");
        }
      } catch (err: any) {
        setError(err.message || "Login failed");
      } finally {
        setIsLoading(false);
      }
    };

    return (
    <AuthLayout 
      title="Login" 
      subtitle="Please log in to continue"
    >
      <form onSubmit={handleSubmit} className="space-y-6">
        {error && (
          <div className="bg-destructive/10 border border-destructive/20 text-destructive px-4 py-3 rounded-md">
            {error}
          </div>
        )}
        {hospitalLoadError && (
          <div className="bg-yellow-50 border border-yellow-200 text-yellow-700 px-4 py-3 rounded-md">
            {hospitalLoadError}
          </div>
        )}
        
        <div className="space-y-4">
          <div>
            <Label htmlFor="hospital">Hospital</Label>
            <Select
              value={hospitalName}
              onValueChange={(value) => setHospitalName(value)}
              disabled={loadingHospitals || hospitals.length === 0}
            >
              <SelectTrigger id="hospital" className="w-full">
                <SelectValue placeholder={loadingHospitals ? "Loading hospitals..." : "Select a hospital"} />
              </SelectTrigger>
              <SelectContent>
                {hospitals.length > 0 ? (
                  hospitals.map((hospital) => (
                    <SelectItem key={hospital.hospital_id} value={hospital.hospital_name}>
                      {hospital.hospital_name}
                    </SelectItem>
                  ))
                ) : (
                  <SelectItem value="no-hospitals" disabled>
                    No hospitals available
                  </SelectItem>
                )}
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              placeholder="Enter your email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              disabled={isLoading}
              required
            />
          </div>

          <div>
            <Label htmlFor="password">Password</Label>
            <div className="relative">
              <Input
                id="password"
                type={showPassword ? "text" : "password"}
                placeholder="Enter your password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                disabled={isLoading}
                required
                className="pr-10"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
              >
                {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
          </div>
        </div>

        {/* Forgot Password */}
      
        {/* Headset Toggle */}
    

        {/* Remember Me */}
        <div className="flex items-center space-x-2">
          <Checkbox
            id="remember"
            checked={rememberMe}
            onCheckedChange={(checked) => setRememberMe(checked as boolean)}
          />
          <Label htmlFor="remember" className="text-sm text-muted-foreground">
            Remember Me
          </Label>
        </div>

        {/* Submit Button */}
        <Button
          type="submit"
          className="w-full"
          disabled={isLoading}
        >
          {isLoading ? (
            <span className="inline-flex items-center">
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
              Logging in...
            </span>
          ) : (
            "Continue"
          )}
        </Button>

        {/* Sign Up Link */}
        <div className="text-center">
          <span className="text-sm text-muted-foreground">
            Don't have an account?{" "}
            <button
              type="button"
              onClick={() => navigate("/signup")}
              className="text-primary hover:text-primary/80 font-medium transition-colors"
            >
              Sign Up
            </button>
          </span>
        </div>
      </form>
    </AuthLayout>
  );
  }
  