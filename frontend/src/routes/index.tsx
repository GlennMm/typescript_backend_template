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
import { Badge } from "@/components/ui/badge";
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
        localStorage.setItem("selectedTenantSlug", data.tenantSlug);
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

// Navigation items for the sidebar
const navItems = [
  {
    title: "Dashboard",
    icon: "LayoutDashboard",
    url: "/",
  },
  {
    title: "Team",
    icon: "Users",
    url: "/team",
  },
  {
    title: "Projects",
    icon: "FolderKanban",
    url: "/projects",
  },
  {
    title: "Analytics",
    icon: "BarChart3",
    url: "/analytics",
  },
  {
    title: "Settings",
    icon: "Settings",
    url: "/settings",
  },
];

function DashboardSidebar({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) {
  const { tenant } = useAuthStore();
  const navigate = useNavigate();

  return (
    <>
      {/* Mobile overlay */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40 lg:hidden"
          onClick={onClose}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`
          fixed lg:sticky top-0 left-0 z-50
          h-screen w-64 bg-background border-r
          transition-transform duration-300 ease-in-out
          ${isOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"}
        `}
      >
        <div className="flex flex-col h-full">
          {/* Header */}
          <div className="flex items-center justify-between h-16 px-6 border-b">
            <div className="flex items-center space-x-2">
              <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center">
                <span className="text-primary-foreground font-bold text-sm">
                  {tenant?.name.charAt(0).toUpperCase()}
                </span>
              </div>
              <div className="flex flex-col">
                <span className="font-semibold text-sm">{tenant?.name}</span>
                <span className="text-xs text-muted-foreground capitalize">{tenant?.plan}</span>
              </div>
            </div>
            <Button
              variant="ghost"
              size="sm"
              className="lg:hidden"
              onClick={onClose}
            >
              ×
            </Button>
          </div>

          {/* Navigation */}
          <nav className="flex-1 p-4 space-y-2">
            {navItems.map((item) => (
              <button
                key={item.url}
                onClick={() => {
                  navigate({ to: item.url });
                  onClose();
                }}
                className="flex items-center w-full px-3 py-2 text-sm rounded-lg hover:bg-accent hover:text-accent-foreground transition-colors"
              >
                <span className="mr-3">{getIcon(item.icon)}</span>
                {item.title}
              </button>
            ))}
          </nav>

          {/* Footer */}
          <div className="p-4 border-t">
            <Card className="bg-muted">
              <CardContent className="p-4">
                <p className="text-xs font-medium mb-2">Upgrade to Pro</p>
                <p className="text-xs text-muted-foreground mb-3">
                  Unlock advanced features and analytics
                </p>
                <Button size="sm" className="w-full">
                  Upgrade
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </aside>
    </>
  );
}

function getIcon(name: string) {
  const icons: Record<string, string> = {
    LayoutDashboard: "📊",
    Users: "👥",
    FolderKanban: "📁",
    BarChart3: "📈",
    Settings: "⚙️",
  };
  return icons[name] || "•";
}

function Index() {
  const navigate = useNavigate();
  const { user, tenant, isAuthenticated, clearAuth } = useAuthStore();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const handleLogout = () => {
    clearAuth();
    navigate({ to: "/login" });
  };

  if (!isAuthenticated || !user || !tenant) {
    return <TenantSelectionPage />;
  }

  return (
    <div className="flex h-screen overflow-hidden bg-muted/30">
      {/* Sidebar */}
      <DashboardSidebar
        isOpen={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
      />

      {/* Main content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Header */}
        <header className="h-16 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
          <div className="flex items-center justify-between h-full px-6">
            <div className="flex items-center space-x-4">
              <Button
                variant="ghost"
                size="sm"
                className="lg:hidden"
                onClick={() => setSidebarOpen(true)}
              >
                ☰
              </Button>
              <div>
                <h1 className="text-lg font-semibold">Dashboard</h1>
                <p className="text-xs text-muted-foreground">
                  Welcome back, {user.name}
                </p>
              </div>
            </div>

            <div className="flex items-center space-x-4">
              <Badge variant="outline" className="hidden sm:flex">
                {user.role}
              </Badge>
              <Button variant="outline" size="sm" onClick={handleLogout}>
                Sign Out
              </Button>
            </div>
          </div>
        </header>

        {/* Main content area */}
        <main className="flex-1 overflow-y-auto">
          <div className="container py-6 space-y-6">
            {/* Stats Grid */}
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">
                    Total Revenue
                  </CardTitle>
                  <span className="text-2xl">💰</span>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">$45,231</div>
                  <p className="text-xs text-muted-foreground">
                    +20.1% from last month
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">
                    Active Users
                  </CardTitle>
                  <span className="text-2xl">👤</span>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">+2,350</div>
                  <p className="text-xs text-muted-foreground">
                    +180.1% from last month
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">
                    Projects
                  </CardTitle>
                  <span className="text-2xl">📁</span>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">+12</div>
                  <p className="text-xs text-muted-foreground">
                    +19% from last month
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">
                    Team Members
                  </CardTitle>
                  <span className="text-2xl">👥</span>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">+573</div>
                  <p className="text-xs text-muted-foreground">
                    +201 since last hour
                  </p>
                </CardContent>
              </Card>
            </div>

            {/* Main Content Grid */}
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-7">
              {/* Chart Card */}
              <Card className="col-span-full lg:col-span-4">
                <CardHeader>
                  <CardTitle>Overview</CardTitle>
                  <CardDescription>
                    Monthly revenue over the last 6 months
                  </CardDescription>
                </CardHeader>
                <CardContent className="pl-2">
                  <div className="h-[300px] w-full flex items-center justify-center text-muted-foreground">
                    <div className="text-center space-y-2">
                      <p className="text-sm">Chart visualization</p>
                      <p className="text-xs">Install recharts to see the chart</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Recent Activity */}
              <Card className="col-span-full lg:col-span-3">
                <CardHeader>
                  <CardTitle>Recent Activity</CardTitle>
                  <CardDescription>
                    Your team's latest updates
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {[
                      {
                        user: "John Doe",
                        action: "created a new project",
                        time: "2 hours ago",
                      },
                      {
                        user: "Jane Smith",
                        action: "updated team settings",
                        time: "4 hours ago",
                      },
                      {
                        user: "Mike Johnson",
                        action: "invited 3 new members",
                        time: "6 hours ago",
                      },
                      {
                        user: "Sarah Williams",
                        action: "completed 5 tasks",
                        time: "8 hours ago",
                      },
                    ].map((activity, i) => (
                      <div key={i} className="flex items-start space-x-3">
                        <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                          <span className="text-xs font-medium">
                            {activity.user.charAt(0)}
                          </span>
                        </div>
                        <div className="flex-1 space-y-1">
                          <p className="text-sm">
                            <span className="font-medium">{activity.user}</span>{" "}
                            <span className="text-muted-foreground">
                              {activity.action}
                            </span>
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {activity.time}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Account Details */}
            <div className="grid gap-6 md:grid-cols-2">
              <Card>
                <CardHeader>
                  <CardTitle>Account Information</CardTitle>
                  <CardDescription>
                    Your personal and company details
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid gap-4 sm:grid-cols-2">
                    <div className="space-y-1">
                      <p className="text-sm font-medium text-muted-foreground">
                        Email
                      </p>
                      <p className="text-sm">{user.email}</p>
                    </div>
                    <div className="space-y-1">
                      <p className="text-sm font-medium text-muted-foreground">
                        Role
                      </p>
                      <p className="text-sm capitalize">{user.role}</p>
                    </div>
                    <div className="space-y-1">
                      <p className="text-sm font-medium text-muted-foreground">
                        Company
                      </p>
                      <p className="text-sm">{tenant.name}</p>
                    </div>
                    <div className="space-y-1">
                      <p className="text-sm font-medium text-muted-foreground">
                        Company Slug
                      </p>
                      <p className="text-sm font-mono text-xs">{tenant.slug}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Subscription</CardTitle>
                  <CardDescription>
                    Your current plan and billing information
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium">Current Plan</p>
                        <p className="text-2xl font-bold capitalize">{tenant.plan}</p>
                      </div>
                      <Badge
                        variant={
                          tenant.subscriptionStatus === "active"
                            ? "default"
                            : "secondary"
                        }
                      >
                        {tenant.subscriptionStatus}
                      </Badge>
                    </div>
                    <div className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">Users</span>
                        <span className="font-medium">1 / Unlimited</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">Storage</span>
                        <span className="font-medium">2.4 GB / 100 GB</span>
                      </div>
                    </div>
                  </div>
                </CardContent>
                <CardFooter>
                  <Button variant="outline" className="w-full">
                    Manage Subscription
                  </Button>
                </CardFooter>
              </Card>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
