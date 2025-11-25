import { zodResolver } from "@hookform/resolvers/zod";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { authApi } from "@/api/auth";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAuthStore } from "@/stores/authStore";

export const Route = createFileRoute("/onboarding")({
  component: OnboardingPage,
});

const onboardingSchema = z
  .object({
    // Company information
    tenantName: z.string().min(2, "Company name must be at least 2 characters"),
    tenantSlug: z
      .string()
      .min(2, "Company slug must be at least 2 characters")
      .regex(
        /^[a-z0-9-]+$/,
        "Slug can only contain lowercase letters, numbers, and hyphens",
      ),

    // User information
    name: z.string().min(2, "Name must be at least 2 characters"),
    email: z.string().email("Invalid email address"),
    password: z.string().min(8, "Password must be at least 8 characters"),
    confirmPassword: z.string(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords don't match",
    path: ["confirmPassword"],
  });

type OnboardingFormData = z.infer<typeof onboardingSchema>;

function OnboardingPage() {
  const navigate = useNavigate();
  const setAuth = useAuthStore((state) => state.setAuth);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [step, setStep] = useState<1 | 2>(1);

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors },
  } = useForm<OnboardingFormData>({
    resolver: zodResolver(onboardingSchema),
  });

  // Auto-generate slug from tenant name
  const tenantName = watch("tenantName");
  const autoGenerateSlug = () => {
    if (tenantName) {
      const slug = tenantName
        .toLowerCase()
        .replace(/[^a-z0-9\s-]/g, "")
        .replace(/\s+/g, "-")
        .replace(/-+/g, "-")
        .slice(0, 50);
      return slug;
    }
    return "";
  };

  const onSubmit = async (data: OnboardingFormData) => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await authApi.register(data);

      if (response.success) {
        setAuth({
          user: response.data.user,
          tenant: response.data.tenant,
          accessToken: response.data.accessToken,
          refreshToken: response.data.refreshToken,
        });
        navigate({ to: "/" });
      }
    } catch (err: unknown) {
      const error = err as {
        response?: { data?: { error?: { message?: string } } };
      };
      setError(
        error.response?.data?.error?.message ||
          "Registration failed. Please try again.",
      );
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-muted/50 p-4">
      <Card className="w-full max-w-2xl">
        <CardHeader className="space-y-1">
          <CardTitle className="text-2xl font-bold">
            {step === 1 ? "Create your company" : "Set up your account"}
          </CardTitle>
          <CardDescription>
            {step === 1
              ? "Let's start by setting up your company workspace"
              : "Now, create your admin account"}
          </CardDescription>
          <div className="flex items-center space-x-2 pt-2">
            <div
              className={`h-2 flex-1 rounded ${step >= 1 ? "bg-primary" : "bg-muted"}`}
            />
            <div
              className={`h-2 flex-1 rounded ${step >= 2 ? "bg-primary" : "bg-muted"}`}
            />
          </div>
        </CardHeader>

        <form onSubmit={handleSubmit(onSubmit)}>
          <CardContent className="space-y-4">
            {error && (
              <div className="bg-destructive/10 text-destructive text-sm p-3 rounded-md">
                {error}
              </div>
            )}

            {/* Step 1 Fields */}
            <div className={step === 1 ? "" : "hidden"}>
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="tenantName">Company Name</Label>
                  <Input
                    id="tenantName"
                    placeholder="Acme Inc."
                    {...register("tenantName")}
                  />
                  {errors.tenantName && (
                    <p className="text-sm text-destructive">
                      {errors.tenantName.message}
                    </p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="tenantSlug">Company Slug</Label>
                  <div className="flex gap-2">
                    <Input
                      id="tenantSlug"
                      placeholder="acme-inc"
                      {...register("tenantSlug")}
                    />
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => {
                        const slug = autoGenerateSlug();
                        if (slug) {
                          const input = document.getElementById(
                            "tenantSlug",
                          ) as HTMLInputElement;
                          if (input) input.value = slug;
                        }
                      }}
                    >
                      Generate
                    </Button>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    This will be used in your company URL: yourapp.com/
                    {watch("tenantSlug") || "your-company"}
                  </p>
                  {errors.tenantSlug && (
                    <p className="text-sm text-destructive">
                      {errors.tenantSlug.message}
                    </p>
                  )}
                </div>
              </div>
            </div>

            {/* Step 2 Fields */}
            <div className={step === 2 ? "" : "hidden"}>
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Full Name</Label>
                  <Input
                    id="name"
                    placeholder="John Doe"
                    {...register("name")}
                  />
                  {errors.name && (
                    <p className="text-sm text-destructive">
                      {errors.name.message}
                    </p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="john@example.com"
                    {...register("email")}
                  />
                  {errors.email && (
                    <p className="text-sm text-destructive">
                      {errors.email.message}
                    </p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="password">Password</Label>
                  <Input
                    id="password"
                    type="password"
                    placeholder="••••••••"
                    {...register("password")}
                  />
                  {errors.password && (
                    <p className="text-sm text-destructive">
                      {errors.password.message}
                    </p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="confirmPassword">Confirm Password</Label>
                  <Input
                    id="confirmPassword"
                    type="password"
                    placeholder="••••••••"
                    {...register("confirmPassword")}
                  />
                  {errors.confirmPassword && (
                    <p className="text-sm text-destructive">
                      {errors.confirmPassword.message}
                    </p>
                  )}
                </div>
              </div>
            </div>
          </CardContent>

          <CardFooter className="flex flex-col space-y-4">
            <div className="flex w-full gap-2">
              {step === 2 && (
                <Button
                  type="button"
                  variant="outline"
                  className="flex-1"
                  onClick={() => setStep(1)}
                >
                  Back
                </Button>
              )}
              {step === 1 ? (
                <Button
                  type="button"
                  className="flex-1"
                  onClick={() => setStep(2)}
                >
                  Continue
                </Button>
              ) : (
                <Button type="submit" className="flex-1" disabled={isLoading}>
                  {isLoading ? "Creating account..." : "Create account"}
                </Button>
              )}
            </div>

            <div className="text-sm text-center text-muted-foreground">
              Already have an account?{" "}
              <Button
                type="button"
                variant="link"
                className="p-0"
                onClick={() => navigate({ to: "/login" })}
              >
                Sign in
              </Button>
            </div>
          </CardFooter>
        </form>
      </Card>
    </div>
  );
}
