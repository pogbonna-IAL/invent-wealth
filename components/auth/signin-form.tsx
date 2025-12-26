"use client";

import { useState, useEffect } from "react";
import { signIn } from "next-auth/react";
import { useSearchParams, useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { signUp } from "@/app/actions/auth";

export function SignInForm() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isPasswordLoading, setIsPasswordLoading] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Dev credentials state
  const [devEmail, setDevEmail] = useState("");
  const [devPassword, setDevPassword] = useState("");
  const [isDevLoading, setIsDevLoading] = useState(false);
  const [isDevMode, setIsDevMode] = useState(false);

  // Sign up state
  const [signUpEmail, setSignUpEmail] = useState("");
  const [signUpPassword, setSignUpPassword] = useState("");
  const [signUpName, setSignUpName] = useState("");
  const [signUpConfirmPassword, setSignUpConfirmPassword] = useState("");
  const [isSignUpLoading, setIsSignUpLoading] = useState(false);

  // Check if dev credentials are enabled (always in development)
  useEffect(() => {
    setIsDevMode(
      typeof window !== "undefined" &&
        (window.location.hostname === "localhost" || 
         window.location.hostname === "127.0.0.1" ||
         process.env.NODE_ENV === "development")
    );
  }, []);

  const handleEmailSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

    try {
      const result = await signIn("email", {
        email,
        callbackUrl: searchParams.get("callbackUrl") || "/dashboard",
        redirect: false,
      });

      if (result?.error) {
        setError("Failed to send magic link. Please try again.");
        setIsLoading(false);
      } else {
        setIsSubmitted(true);
      }
    } catch (err) {
      setError("An error occurred. Please try again.");
      setIsLoading(false);
    }
  };

  const handlePasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsPasswordLoading(true);
    setError(null);

    try {
      const callbackUrl = searchParams.get("callbackUrl") || "/dashboard";
      const result = await signIn("credentials", {
        email: email.trim(),
        password: password.trim(),
        callbackUrl,
        redirect: false,
      });

      if (result?.error) {
        setError("Invalid email or password. Please try again.");
        setIsPasswordLoading(false);
      } else if (result?.ok) {
        router.push(callbackUrl);
      } else {
        setError("An unexpected error occurred. Please try again.");
        setIsPasswordLoading(false);
      }
    } catch (err) {
      setError("An error occurred. Please try again.");
      setIsPasswordLoading(false);
    }
  };

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSignUpLoading(true);
    setError(null);

    // Validate passwords match
    if (signUpPassword !== signUpConfirmPassword) {
      setError("Passwords do not match");
      setIsSignUpLoading(false);
      return;
    }

    // Validate password length
    if (signUpPassword.length < 6) {
      setError("Password must be at least 6 characters");
      setIsSignUpLoading(false);
      return;
    }

    try {
      const result = await signUp({
        email: signUpEmail.trim(),
        password: signUpPassword,
        name: signUpName.trim() || undefined,
      });

      if (!result.success) {
        setError(("error" in result && result.error) ? result.error : "Failed to create account");
        setIsSignUpLoading(false);
        return;
      }

      // After successful signup, automatically sign in
      const signInResult = await signIn("credentials", {
        email: signUpEmail.trim(),
        password: signUpPassword,
        callbackUrl: "/dashboard",
        redirect: false,
      });

      if (signInResult?.error) {
        setError("Account created but sign in failed. Please try signing in manually.");
        setIsSignUpLoading(false);
      } else if (signInResult?.ok) {
        // Redirect to dashboard
        router.push("/dashboard");
      }
    } catch (err) {
      console.error("Sign up error:", err);
      setError(`An error occurred: ${err instanceof Error ? err.message : "Unknown error"}`);
      setIsSignUpLoading(false);
    }
  };

  const handleDevSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsDevLoading(true);
    setError(null);

    try {
      console.log("[SignInForm] Attempting dev login:", {
        email: devEmail,
        passwordLength: devPassword.length,
      });

      // Get callbackUrl from query params or default to dashboard
      const callbackUrl = searchParams.get("callbackUrl") || "/dashboard";
      const isAdminLogin = devEmail.trim().toLowerCase() === "admin" && devPassword.trim() === "admin123";

      const result = await signIn("credentials", {
        email: devEmail.trim(),
        password: devPassword.trim(),
        callbackUrl: isAdminLogin ? "/admin" : callbackUrl,
        redirect: false,
      });

      console.log("[SignInForm] SignIn result:", result);

      if (result?.error) {
        console.error("[SignInForm] SignIn error:", result.error);
        setError(`Invalid credentials. Error: ${result.error || "Unknown error"}`);
        setIsDevLoading(false);
      } else if (result?.ok) {
        console.log("[SignInForm] SignIn successful, checking user role...");
        
        // If admin login detected, redirect to admin immediately
        if (isAdminLogin) {
          console.log("[SignInForm] Admin login detected, redirecting to /admin");
          window.location.href = "/admin";
          return;
        }
        
        // For other logins, check if user is admin via API
        try {
          // Wait a moment for session to be established
          await new Promise(resolve => setTimeout(resolve, 100));
          
          const response = await fetch("/api/auth/check-admin");
          if (response.ok) {
            const data = await response.json();
            
            if (data.isAdmin) {
              console.log("[SignInForm] User is admin, redirecting to /admin");
              window.location.href = "/admin";
            } else {
              console.log("[SignInForm] User is not admin, redirecting to:", callbackUrl);
              window.location.href = callbackUrl;
            }
          } else {
            // Fallback redirect
            console.log("[SignInForm] Could not check admin status, redirecting to:", callbackUrl);
            window.location.href = callbackUrl;
          }
        } catch (checkError) {
          // Fallback redirect
          console.log("[SignInForm] Error checking admin status, redirecting to:", callbackUrl);
          window.location.href = callbackUrl;
        }
      } else {
        console.log("[SignInForm] Unexpected result:", result);
        setError("Unexpected response. Please check the console.");
        setIsDevLoading(false);
      }
    } catch (err) {
      console.error("[SignInForm] Exception during sign in:", err);
      setError(`An error occurred: ${err instanceof Error ? err.message : "Unknown error"}`);
      setIsDevLoading(false);
    }
  };

  if (isSubmitted) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Check your email</CardTitle>
          <CardDescription>
            We've sent a magic link to {email}. Click the link in the email to
            sign in.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            The link will expire in 24 hours. If you don't see the email, check your spam folder.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Sign in</CardTitle>
        <CardDescription>
          {isDevMode
            ? "Choose your sign-in method"
            : "Sign in with password or magic link"}
        </CardDescription>
      </CardHeader>
      <CardContent>
        {isDevMode ? (
          <Tabs defaultValue="email" className="w-full">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="email">Email</TabsTrigger>
              <TabsTrigger value="signup">Sign Up</TabsTrigger>
              <TabsTrigger value="dev">Dev Login</TabsTrigger>
            </TabsList>

            <TabsContent value="email" className="space-y-4 mt-4">
              <form onSubmit={handleEmailSubmit} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="you@example.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    className="focus-visible:ring-2"
                    aria-label="Email address"
                  />
                </div>
                {error && (
                  <div className="rounded-lg border border-destructive bg-destructive/10 p-3">
                    <p className="text-sm text-destructive">{error}</p>
                  </div>
                )}
                <Button type="submit" className="w-full" disabled={isLoading}>
                  {isLoading ? "Sending..." : "Send magic link"}
                </Button>
              </form>
            </TabsContent>

            <TabsContent value="signup" className="space-y-4 mt-4">
              <div className="rounded-lg border border-primary/20 bg-primary/5 p-4 mb-4">
                <p className="text-sm font-semibold text-primary mb-1">Create Account</p>
                <p className="text-xs text-muted-foreground">
                  Sign up with email and password. No magic link needed.
                </p>
              </div>
              <form onSubmit={handleSignUp} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="signup-name">Full Name (Optional)</Label>
                  <Input
                    id="signup-name"
                    type="text"
                    placeholder="John Doe"
                    value={signUpName}
                    onChange={(e) => setSignUpName(e.target.value)}
                    className="focus-visible:ring-2"
                    aria-label="Full name"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="signup-email">Email</Label>
                  <Input
                    id="signup-email"
                    type="email"
                    placeholder="you@example.com"
                    value={signUpEmail}
                    onChange={(e) => setSignUpEmail(e.target.value)}
                    required
                    className="focus-visible:ring-2"
                    aria-label="Email address"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="signup-password">Password</Label>
                  <Input
                    id="signup-password"
                    type="password"
                    placeholder="At least 6 characters"
                    value={signUpPassword}
                    onChange={(e) => setSignUpPassword(e.target.value)}
                    required
                    minLength={6}
                    className="focus-visible:ring-2"
                    aria-label="Password"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="signup-confirm-password">Confirm Password</Label>
                  <Input
                    id="signup-confirm-password"
                    type="password"
                    placeholder="Confirm your password"
                    value={signUpConfirmPassword}
                    onChange={(e) => setSignUpConfirmPassword(e.target.value)}
                    required
                    minLength={6}
                    className="focus-visible:ring-2"
                    aria-label="Confirm password"
                  />
                </div>
                {error && (
                  <div className="rounded-lg border border-destructive bg-destructive/10 p-3">
                    <p className="text-sm text-destructive">{error}</p>
                  </div>
                )}
                <Button type="submit" className="w-full" disabled={isSignUpLoading}>
                  {isSignUpLoading ? "Creating account..." : "Create Account"}
                </Button>
                <p className="text-xs text-center text-muted-foreground">
                  By creating an account, you agree to our terms of service and privacy policy.
                </p>
              </form>
            </TabsContent>

            <TabsContent value="dev" className="space-y-4 mt-4">
              <div className="rounded-lg border border-primary/20 bg-primary/5 p-4 mb-4">
                <p className="text-sm font-semibold text-primary mb-1">Admin Login (Development Only)</p>
                <p className="text-xs text-muted-foreground">
                  Use <strong>admin</strong> / <strong>admin123</strong> to sign in as admin
                </p>
              </div>
              <form onSubmit={handleDevSubmit} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="dev-email">Email / Username</Label>
                  <Input
                    id="dev-email"
                    type="text"
                    placeholder="admin"
                    value={devEmail}
                    onChange={(e) => setDevEmail(e.target.value)}
                    required
                    className="focus-visible:ring-2"
                    aria-label="Development email or username"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="dev-password">Password</Label>
                  <Input
                    id="dev-password"
                    type="password"
                    placeholder="admin123"
                    value={devPassword}
                    onChange={(e) => setDevPassword(e.target.value)}
                    required
                    className="focus-visible:ring-2"
                    aria-label="Development password"
                  />
                  <p className="text-xs text-muted-foreground">
                    Development mode only. Use <strong>admin</strong>/<strong>admin123</strong> for admin access, or any email/password for regular user.
                  </p>
                </div>
                {error && (
                  <div className="rounded-lg border border-destructive bg-destructive/10 p-3">
                    <p className="text-sm text-destructive">{error}</p>
                  </div>
                )}
                <Button type="submit" className="w-full" disabled={isDevLoading}>
                  {isDevLoading ? "Signing in..." : "Sign in (Dev)"}
                </Button>
              </form>
            </TabsContent>
          </Tabs>
        ) : (
          <Tabs defaultValue="signin" className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="signin">Sign In</TabsTrigger>
              <TabsTrigger value="signup">Sign Up</TabsTrigger>
            </TabsList>

            <TabsContent value="signin" className="space-y-4 mt-4">
              {/* Password Sign In Form - Primary Option */}
              <div className="space-y-4">
                <div className="rounded-lg border border-primary/20 bg-primary/5 p-3 mb-2">
                  <p className="text-sm font-semibold text-primary">Sign in with Password</p>
                </div>
                <form onSubmit={handlePasswordSubmit} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="email-password">Email</Label>
                    <Input
                      id="email-password"
                      type="email"
                      placeholder="you@example.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      required
                      className="focus-visible:ring-2"
                      aria-label="Email address"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="password-input">Password</Label>
                    <Input
                      id="password-input"
                      type="password"
                      placeholder="Enter your password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      required
                      className="focus-visible:ring-2"
                      aria-label="Password"
                    />
                  </div>
                  {error && (
                    <div className="rounded-lg border border-destructive bg-destructive/10 p-3">
                      <p className="text-sm text-destructive">{error}</p>
                    </div>
                  )}
                  <Button type="submit" className="w-full" disabled={isPasswordLoading}>
                    {isPasswordLoading ? "Signing in..." : "Sign in with Password"}
                  </Button>
                </form>

                {/* Divider */}
                <div className="relative">
                  <div className="absolute inset-0 flex items-center">
                    <span className="w-full border-t" />
                  </div>
                  <div className="relative flex justify-center text-xs uppercase">
                    <span className="bg-background px-2 text-muted-foreground">Or</span>
                  </div>
                </div>

                {/* Magic Link Option */}
                <form onSubmit={handleEmailSubmit} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="email-magic">Email (Magic Link)</Label>
                    <Input
                      id="email-magic"
                      type="email"
                      placeholder="you@example.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      required
                      className="focus-visible:ring-2"
                      aria-label="Email address"
                    />
                  </div>
                  {error && (
                    <div className="rounded-lg border border-destructive bg-destructive/10 p-3">
                      <p className="text-sm text-destructive">{error}</p>
                    </div>
                  )}
                  <Button type="submit" variant="outline" className="w-full" disabled={isLoading}>
                    {isLoading ? "Sending..." : "Send magic link"}
                  </Button>
                  <p className="text-xs text-center text-muted-foreground">
                    Don't have a password? Use magic link to sign in or reset your password.
                  </p>
                </form>
              </div>
            </TabsContent>

            <TabsContent value="signup" className="space-y-4 mt-4">
              <form onSubmit={handleSignUp} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="signup-name-public">Full Name (Optional)</Label>
                  <Input
                    id="signup-name-public"
                    type="text"
                    placeholder="John Doe"
                    value={signUpName}
                    onChange={(e) => setSignUpName(e.target.value)}
                    className="focus-visible:ring-2"
                    aria-label="Full name"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="signup-email-public">Email</Label>
                  <Input
                    id="signup-email-public"
                    type="email"
                    placeholder="you@example.com"
                    value={signUpEmail}
                    onChange={(e) => setSignUpEmail(e.target.value)}
                    required
                    className="focus-visible:ring-2"
                    aria-label="Email address"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="signup-password-public">Password</Label>
                  <Input
                    id="signup-password-public"
                    type="password"
                    placeholder="At least 6 characters"
                    value={signUpPassword}
                    onChange={(e) => setSignUpPassword(e.target.value)}
                    required
                    minLength={6}
                    className="focus-visible:ring-2"
                    aria-label="Password"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="signup-confirm-password-public">Confirm Password</Label>
                  <Input
                    id="signup-confirm-password-public"
                    type="password"
                    placeholder="Confirm your password"
                    value={signUpConfirmPassword}
                    onChange={(e) => setSignUpConfirmPassword(e.target.value)}
                    required
                    minLength={6}
                    className="focus-visible:ring-2"
                    aria-label="Confirm password"
                  />
                </div>
                {error && (
                  <div className="rounded-lg border border-destructive bg-destructive/10 p-3">
                    <p className="text-sm text-destructive">{error}</p>
                  </div>
                )}
                <Button type="submit" className="w-full" disabled={isSignUpLoading}>
                  {isSignUpLoading ? "Creating account..." : "Create Account"}
                </Button>
                <p className="text-xs text-center text-muted-foreground">
                  By creating an account, you agree to our terms of service and privacy policy.
                </p>
              </form>
            </TabsContent>
          </Tabs>
        )}
      </CardContent>
    </Card>
  );
}
