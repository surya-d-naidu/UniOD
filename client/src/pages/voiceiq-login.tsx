import React from "react"; // Ensure React is imported
import { useForm, Control } from "react-hook-form"; // Ensure Control type is imported
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";

const loginSchema = z.object({
  email: z.string().email("Invalid email address"),
  password: z.string().min(1, "Password is required"),
});

type LoginFormValues = z.infer<typeof loginSchema>;

export default function VoiceIqLoginPage() {
  const loginForm = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: "",
      password: "",
    },
  });

  const onLoginSubmit = (data: LoginFormValues) => {
    console.log("Form submitted with data:", data);
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-neutral-50">
      <div className="w-full max-w-md">
        <Card className="bg-white rounded-xl shadow-xl overflow-hidden">
          {/* Header with Image */}
          <div 
            className="h-48 bg-cover bg-center flex items-center justify-start px-6"
            style={{ 
              backgroundImage: "url('/1516959375267.jpeg')", // Ensure the path is correct
              backgroundColor: "rgba(0, 0, 0, 0.5)", // Add a fallback background color
              backgroundBlendMode: "darken" // Ensure text is visible over the image
            }}
          >
            <h1 className="text-white text-3xl font-bold drop-shadow-lg">VoiceIQ</h1> {/* Add drop shadow for better visibility */}
          </div>

          <CardContent className="p-8">
            <Form {...loginForm}>
              <form onSubmit={loginForm.handleSubmit(onLoginSubmit)} className="space-y-4">
                <FormField
                  control={loginForm.control as Control<LoginFormValues>}
                  name="email"
                  render={({ field }: { field: any }) => (
                    <FormItem>
                      <FormLabel>Email</FormLabel>
                      <FormControl>
                        <Input 
                          placeholder="Enter your email" 
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

                <Button 
                  type="submit" 
                  className="w-full"
                >
                  Login
                </Button>
              </form>
            </Form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
