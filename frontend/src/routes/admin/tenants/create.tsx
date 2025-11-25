import { zodResolver } from "@hookform/resolvers/zod";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { type SubscriptionPlan, superAdminApi } from "@/api/superAdmin";
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
import { useSuperAdminStore } from "@/stores/superAdminStore";

export const Route = createFileRoute("/admin/tenants/create")({
  component: CreateTenantPage,
});

const createTenantSchema = z.object({
  name: z.string().min(2, "Company name must be at least 2 characters"),
  slug: z
    .string()
    .min(2, "Company slug must be at least 2 characters")
    .regex(
      /^[a-z0-9-]+$/,
      "Slug can only contain lowercase letters, numbers, and hyphens",
    ),
  subscriptionPlanId: z.string().min(1, "Please select a subscription plan"),
  adminName: z.string().min(2, "Admin name must be at least 2 characters"),
  adminEmail: z.string().email("Invalid email address"),
  adminPassword: z.string().min(8, "Password must be at least 8 characters"),
});

type CreateTenantFormData = z.infer<typeof createTenantSchema>;

function CreateTenantPage() {
  const navigate = useNavigate();
  const { isAuthenticated } = useSuperAdminStore();
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [plans, setPlans] = useState<SubscriptionPlan[]>([]);
  const [plansLoading, setPlansLoading] = useState(true);

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors },
  } = useForm<CreateTenantFormData>({
    resolver: zodResolver(createTenantSchema),
  });

  useEffect(() => {
    if (!isAuthenticated) {
      navigate({ to: "/admin/login" });
      return;
    }
    loadPlans();
  }, [isAuthenticated, navigate]);

  const loadPlans = async () => {
    try {
      setPlansLoading(true);
      const response = await superAdminApi.getSubscriptionPlans();
      if (response.success) {
        setPlans(response.data);
        // Set default plan if available
        if (response.data.length > 0) {
          setValue("subscriptionPlanId", response.data[0].id);
        }
      }
    } catch (err: unknown) {
      const error = err as {
        response?: { data?: { error?: { message?: string } } };
      };
      setError(
        error.response?.data?.error?.message ||
          "Failed to load subscription plans",
      );
    } finally {
      setPlansLoading(false);
    }
  };

  // Auto-generate slug from company name
  const companyName = watch("name");
  const autoGenerateSlug = () => {
    if (companyName) {
      const slug = companyName
        .toLowerCase()
        .replace(/[^a-z0-9\s-]/g, "")
        .replace(/\s+/g, "-")
        .replace(/-+/g, "-")
        .slice(0, 50);
      setValue("slug", slug);
    }
  };

  const onSubmit = async (data: CreateTenantFormData) => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await superAdminApi.createTenant(data);

      if (response.success) {
        navigate({ to: "/admin" });
      }
    } catch (err: unknown) {
      const error = err as {
        response?: { data?: { error?: { message?: string } } };
      };
      setError(
        error.response?.data?.error?.message ||
          "Failed to create tenant. Please try again.",
      );
    } finally {
      setIsLoading(false);
    }
  };

  if (!isAuthenticated || plansLoading) {
    return null;
  }

  return (
    <div className="min-h-screen bg-muted/50">
      {/* Header */}
      <div className="border-b bg-background">
        <div className="container mx-auto flex h-16 items-center px-4">
          <Button variant="ghost" onClick={() => navigate({ to: "/admin" })}>
            ← Back to Dashboard
          </Button>
        </div>
      </div>

      {/* Main Content */}
      <div className="container mx-auto p-4 flex items-center justify-center">
        <Card className="w-full max-w-2xl">
          <CardHeader>
            <CardTitle>Create New Tenant</CardTitle>
            <CardDescription>
              Set up a new company account with an admin user
            </CardDescription>
          </CardHeader>

          <form onSubmit={handleSubmit(onSubmit)}>
            <CardContent className="space-y-6">
              {error && (
                <div className="bg-destructive/10 text-destructive text-sm p-3 rounded-md">
                  {error}
                </div>
              )}

              {/* Company Information */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold">Company Information</h3>

                <div className="space-y-2">
                  <Label htmlFor="name">Company Name</Label>
                  <Input
                    id="name"
                    placeholder="Acme Inc."
                    {...register("name")}
                  />
                  {errors.name && (
                    <p className="text-sm text-destructive">
                      {errors.name.message}
                    </p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="slug">Company Slug</Label>
                  <div className="flex gap-2">
                    <Input
                      id="slug"
                      placeholder="acme-inc"
                      {...register("slug")}
                    />
                    <Button
                      type="button"
                      variant="outline"
                      onClick={autoGenerateSlug}
                    >
                      Generate
                    </Button>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    This will be used in URLs and must be unique
                  </p>
                  {errors.slug && (
                    <p className="text-sm text-destructive">
                      {errors.slug.message}
                    </p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="subscriptionPlanId">Subscription Plan</Label>
                  <select
                    id="subscriptionPlanId"
                    className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                    {...register("subscriptionPlanId")}
                  >
                    {plans.map((plan) => (
                      <option key={plan.id} value={plan.id}>
                        {plan.name} - {plan.maxUsers} users
                      </option>
                    ))}
                  </select>
                  {errors.subscriptionPlanId && (
                    <p className="text-sm text-destructive">
                      {errors.subscriptionPlanId.message}
                    </p>
                  )}
                </div>
              </div>

              {/* Admin User Information */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold">Admin User</h3>

                <div className="space-y-2">
                  <Label htmlFor="adminName">Full Name</Label>
                  <Input
                    id="adminName"
                    placeholder="John Doe"
                    {...register("adminName")}
                  />
                  {errors.adminName && (
                    <p className="text-sm text-destructive">
                      {errors.adminName.message}
                    </p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="adminEmail">Email</Label>
                  <Input
                    id="adminEmail"
                    type="email"
                    placeholder="admin@example.com"
                    {...register("adminEmail")}
                  />
                  {errors.adminEmail && (
                    <p className="text-sm text-destructive">
                      {errors.adminEmail.message}
                    </p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="adminPassword">Password</Label>
                  <Input
                    id="adminPassword"
                    type="password"
                    placeholder="••••••••"
                    {...register("adminPassword")}
                  />
                  {errors.adminPassword && (
                    <p className="text-sm text-destructive">
                      {errors.adminPassword.message}
                    </p>
                  )}
                </div>
              </div>
            </CardContent>

            <CardFooter className="flex gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => navigate({ to: "/admin" })}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={isLoading}>
                {isLoading ? "Creating..." : "Create Tenant"}
              </Button>
            </CardFooter>
          </form>
        </Card>
      </div>
    </div>
  );
}
