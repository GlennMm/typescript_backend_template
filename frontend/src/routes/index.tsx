import { zodResolver } from "@hookform/resolvers/zod";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { apiClient } from "@/api/client";
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

export const Route = createFileRoute("/")({
  component: Index,
});

const tenantSelectionSchema = z.object({
  tenantSlug: z
    .string()
    .min(1, "Tenant slug is required")
    .regex(/^[a-z0-9-]+$/, "Tenant slug must contain only lowercase letters, numbers, and hyphens"),
});

type TenantSelectionFormData = z.infer<typeof tenantSelectionSchema>;

function TenantSelectionPage() {
  const navigate = useNavigate();
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<TenantSelectionFormData>({
    resolver: zodResolver(tenantSelectionSchema),
    defaultValues: {
      tenantSlug: localStorage.getItem("selectedTenantSlug") || "",
    },
  });

  const onSubmit = async (data: TenantSelectionFormData) => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await apiClient.get(`/tenants/validate/${data.tenantSlug}`);

      if (response.data.success) {
        // Store selected tenant in localStorage
        localStorage.setItem("selectedTenantSlug", data.tenantSlug);
        // Redirect to login page
        navigate({ to: "/login" });
      }
    } catch (err: unknown) {
      const error = err as {
        response?: { data?: { error?: { message?: string } } };
      };
      setError(
        error.response?.data?.error?.message ||
          "Tenant not found. Please check the tenant slug.",
      );
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-muted/50 p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="space-y-1">
          <CardTitle className="text-2xl font-bold">Welcome</CardTitle>
          <CardDescription>
            Enter your company slug to continue
          </CardDescription>
        </CardHeader>
        <form onSubmit={handleSubmit(onSubmit)}>
          <CardContent className="space-y-4">
            {error && (
              <div className="bg-destructive/10 text-destructive text-sm p-3 rounded-md">
                {error}
              </div>
            )}

            <div className="space-y-2">
              <Label htmlFor="tenantSlug">Company Slug</Label>
              <Input
                id="tenantSlug"
                placeholder="your-company"
                {...register("tenantSlug")}
              />
              {errors.tenantSlug && (
                <p className="text-sm text-destructive">
                  {errors.tenantSlug.message}
                </p>
              )}
              <p className="text-xs text-muted-foreground">
                This is your unique company identifier
              </p>
            </div>
          </CardContent>

          <CardFooter className="flex flex-col space-y-4">
            <Button type="submit" className="w-full" disabled={isLoading}>
              {isLoading ? "Checking..." : "Continue"}
            </Button>

            <div className="text-sm text-center text-muted-foreground">
              Don't have an account?{" "}
              <Button
                type="button"
                variant="link"
                className="p-0"
                onClick={() => navigate({ to: "/onboarding" })}
              >
                Create one
              </Button>
            </div>
          </CardFooter>
        </form>
      </Card>
    </div>
  );
}

function Index() {
  const navigate = useNavigate();
  const { user, tenant, isAuthenticated, clearAuth } = useAuthStore();

  const handleLogout = () => {
    clearAuth();
    navigate({ to: "/login" });
  };

  if (!isAuthenticated || !user || !tenant) {
    return <TenantSelectionPage />;
  }

  return (
    <div className="min-h-screen bg-muted/50">
      <header className="border-b bg-background">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold">{tenant.name}</h1>
            <p className="text-sm text-muted-foreground">
              {tenant.plan.charAt(0).toUpperCase() + tenant.plan.slice(1)} Plan
            </p>
          </div>
          <Button variant="outline" onClick={handleLogout}>
            Sign Out
          </Button>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        <div className="grid gap-6">
          <Card>
            <CardHeader>
              <CardTitle>Welcome back, {user.name}!</CardTitle>
              <CardDescription>You're logged in as {user.role}</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">
                      Email
                    </p>
                    <p>{user.email}</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">
                      Company
                    </p>
                    <p>{tenant.name}</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">
                      Subscription Status
                    </p>
                    <p className="capitalize">{tenant.subscriptionStatus}</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">
                      Company Slug
                    </p>
                    <p>{tenant.slug}</p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Quick Actions</CardTitle>
              <CardDescription>Common tasks to get you started</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid gap-2">
                <Button variant="outline" className="justify-start">
                  View Dashboard
                </Button>
                <Button variant="outline" className="justify-start">
                  Manage Team
                </Button>
                <Button variant="outline" className="justify-start">
                  Settings
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
}
