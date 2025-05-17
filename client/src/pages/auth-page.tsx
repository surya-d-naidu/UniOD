import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useAuth } from "@/hooks/use-auth";
import { useLocation } from "wouter";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Loader2, User, UserPlus, School } from "lucide-react";
import { Logo } from "@/components/logo";

// Login form schema
const loginSchema = z.object({
  registrationNumber: z.string().min(1, "Registration number is required"),
  password: z.string().min(1, "Password is required"),
});

// Registration form schema
const registrationSchema = z.object({
  registrationNumber: z.string().min(1, "Registration number is required"),
  name: z.string().min(2, "Name is required and must be at least 2 characters"),
  mobile: z.string().min(10, "Mobile number is required"),
  password: z.string().min(6, "Password must be at least 6 characters"),
  confirmPassword: z.string().min(1, "Confirm your password"),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords don't match",
  path: ["confirmPassword"],
});

type LoginFormValues = z.infer<typeof loginSchema>;
type RegistrationFormValues = z.infer<typeof registrationSchema>;

export default function AuthPage() {
  const [activeTab, setActiveTab] = useState<"login" | "register">("login");
  const { user, loginMutation, registerMutation } = useAuth();
  const [, navigate] = useLocation();

  // Redirect if already logged in
  useEffect(() => {
    if (user) {
      navigate(user.role === "admin" ? "/admin" : "/");
    }
  }, [user, navigate]);

  // Login form
  const loginForm = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      registrationNumber: "",
      password: "",
    },
  });

  // Registration form
  const registrationForm = useForm<RegistrationFormValues>({
    resolver: zodResolver(registrationSchema),
    defaultValues: {
      registrationNumber: "",
      name: "",
      mobile: "",
      password: "",
      confirmPassword: "",
    },
  });

  // Login form submission
  const onLoginSubmit = (data: LoginFormValues) => {
    loginMutation.mutate(data);
  };

  // Registration form submission
  const onRegisterSubmit = (data: RegistrationFormValues) => {
    const { confirmPassword, ...registerData } = data;
    registerMutation.mutate(registerData);
  };

  // Switch to admin login
  const handleAdminLogin = () => {
    loginForm.setValue("registrationNumber", "ADMIN001");
    setActiveTab("login");
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 animation-fade bg-neutral-50">
      <div className="w-full max-w-md">
        <Tabs 
          defaultValue="login" 
          value={activeTab} 
          onValueChange={(value) => setActiveTab(value as "login" | "register")}
          className="w-full"
        >
          <Card className="bg-white rounded-xl shadow-xl overflow-hidden">
            {/* Header with Image */}
            <div 
              className="h-48 bg-cover bg-center"
              style={{ 
                backgroundImage: activeTab === "login"
                  ? "url('https://images.unsplash.com/photo-1523050854058-8df90110c9f1?ixlib=rb-4.0.3&auto=format&fit=crop&w=1200&h=400')"
                  : "url('https://images.unsplash.com/photo-1523240795612-9a054b0db644?ixlib=rb-4.0.3&auto=format&fit=crop&w=1200&h=400')" 
              }}
            >
              <div className="h-full w-full bg-gradient-to-r from-primary-900/80 to-primary-700/60 flex items-center justify-center">
                <h1 className="text-white text-3xl font-bold px-6 text-center">
                  {activeTab === "login" ? "University OD Management" : "Student Registration"}
                </h1>
              </div>
            </div>

            <CardContent className="p-8">
              <div className="mb-8 text-center">
                <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-primary-50 mb-4">
                  {activeTab === "login" ? (
                    <User className="text-primary h-8 w-8" />
                  ) : (
                    <UserPlus className="text-primary h-8 w-8" />
                  )}
                </div>
                <h2 className="text-2xl font-semibold text-neutral-800">
                  {activeTab === "login" ? "Student Login" : "Create Account"}
                </h2>
                <p className="text-neutral-500 mt-1">
                  {activeTab === "login" 
                    ? "Sign in to manage your on-duty requests" 
                    : "Register to access the OD Management System"}
                </p>
              </div>

              <TabsList className="grid grid-cols-2 mb-6">
                <TabsTrigger value="login" className="rounded-l-md">Login</TabsTrigger>
                <TabsTrigger value="register" className="rounded-r-md">Register</TabsTrigger>
              </TabsList>

              <TabsContent value="login">
                <Form {...loginForm}>
                  <form onSubmit={loginForm.handleSubmit(onLoginSubmit)} className="space-y-4">
                    <FormField
                      control={loginForm.control}
                      name="registrationNumber"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Registration Number</FormLabel>
                          <FormControl>
                            <Input 
                              placeholder="Enter your registration number" 
                              {...field} 
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={loginForm.control}
                      name="password"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Password</FormLabel>
                          <FormControl>
                            <Input 
                              type="password" 
                              placeholder="Enter your password" 
                              {...field} 
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <div className="flex items-center justify-between">
                      <div className="flex items-center">
                        <input 
                          id="remember-me" 
                          name="remember-me" 
                          type="checkbox" 
                          className="h-4 w-4 text-primary focus:ring-primary border-neutral-300 rounded" 
                        />
                        <label htmlFor="remember-me" className="ml-2 block text-sm text-neutral-600">
                          Remember me
                        </label>
                      </div>
                    </div>

                    <Button 
                      type="submit" 
                      className="w-full"
                      disabled={loginMutation.isPending}
                    >
                      {loginMutation.isPending ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Signing In...
                        </>
                      ) : (
                        <>
                          Sign In
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 ml-2" viewBox="0 0 20 20" fill="currentColor">
                            <path fillRule="evenodd" d="M10.293 5.293a1 1 0 011.414 0l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414-1.414L12.586 11H5a1 1 0 110-2h7.586l-2.293-2.293a1 1 0 010-1.414z" clipRule="evenodd" />
                          </svg>
                        </>
                      )}
                    </Button>
                  </form>
                </Form>
              </TabsContent>

              <TabsContent value="register">
                <Form {...registrationForm}>
                  <form onSubmit={registrationForm.handleSubmit(onRegisterSubmit)} className="space-y-4">
                    <FormField
                      control={registrationForm.control}
                      name="registrationNumber"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Registration Number</FormLabel>
                          <FormControl>
                            <Input 
                              placeholder="Enter your college registration number" 
                              {...field} 
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={registrationForm.control}
                      name="name"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Full Name</FormLabel>
                          <FormControl>
                            <Input 
                              placeholder="Enter your full name" 
                              {...field} 
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={registrationForm.control}
                      name="mobile"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Mobile Number</FormLabel>
                          <FormControl>
                            <Input 
                              type="tel" 
                              placeholder="Enter your mobile number" 
                              {...field} 
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={registrationForm.control}
                      name="password"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Password</FormLabel>
                          <FormControl>
                            <Input 
                              type="password" 
                              placeholder="Create a password" 
                              {...field} 
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={registrationForm.control}
                      name="confirmPassword"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Confirm Password</FormLabel>
                          <FormControl>
                            <Input 
                              type="password" 
                              placeholder="Confirm your password" 
                              {...field} 
                            />
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
                      {registerMutation.isPending ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Registering...
                        </>
                      ) : (
                        <>
                          Register Account
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 ml-2" viewBox="0 0 20 20" fill="currentColor">
                            <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                          </svg>
                        </>
                      )}
                    </Button>
                  </form>
                </Form>
              </TabsContent>
            </CardContent>
          </Card>
        </Tabs>

        <div className="mt-6 text-center">
          <button 
            onClick={handleAdminLogin}
            className="text-neutral-500 text-sm hover:text-primary transition-colors"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 inline mr-1" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z" clipRule="evenodd" />
            </svg>
            Admin Login
          </button>
        </div>
      </div>
    </div>
  );
}
