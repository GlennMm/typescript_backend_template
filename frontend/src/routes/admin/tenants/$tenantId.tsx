import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { format } from "date-fns";
import { useEffect, useState } from "react";
import { type TenantDetail, superAdminApi } from "@/api/superAdmin";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { useSuperAdminStore } from "@/stores/superAdminStore";

export const Route = createFileRoute("/admin/tenants/$tenantId")({
  component: TenantDetailPage,
});

function TenantDetailPage() {
  const navigate = useNavigate();
  const { tenantId } = Route.useParams();
  const { isAuthenticated } = useSuperAdminStore();
  const [tenant, setTenant] = useState<TenantDetail | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadTenant = async () => {
    try {
      setIsLoading(true);
      setError(null);
      const response = await superAdminApi.getTenantById(tenantId);
      if (response.success) {
        setTenant(response.data);
      }
    } catch (err: unknown) {
      const error = err as {
        response?: { data?: { error?: { message?: string } } };
      };
      setError(
        error.response?.data?.error?.message || "Failed to load tenant details",
      );
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (!isAuthenticated) {
      navigate({ to: "/admin/login" });
      return;
    }
    loadTenant();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isAuthenticated, navigate, tenantId]);

  const getStatusBadge = (status: string, isActive: boolean) => {
    if (!isActive) {
      return <Badge variant="destructive">Inactive</Badge>;
    }

    switch (status) {
      case "active":
        return <Badge variant="success">Active</Badge>;
      case "suspended":
        return <Badge variant="warning">Suspended</Badge>;
      case "grace_period":
        return <Badge variant="warning">Grace Period</Badge>;
      case "inactive":
        return <Badge variant="destructive">Inactive</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  if (!isAuthenticated || isLoading) {
    return null;
  }

  if (error || !tenant) {
    return (
      <div className="min-h-screen bg-muted/50">
        <div className="border-b bg-background">
          <div className="container mx-auto flex h-16 items-center px-4">
            <Button variant="ghost" onClick={() => navigate({ to: "/admin" })}>
              ← Back to Dashboard
            </Button>
          </div>
        </div>
        <div className="container mx-auto p-4">
          <Card>
            <CardContent className="pt-6">
              <div className="text-center text-destructive">
                {error || "Tenant not found"}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    );
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
      <div className="container mx-auto p-4 space-y-4">
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-2xl">{tenant.name}</CardTitle>
                <CardDescription>
                  <code className="text-xs bg-muted px-2 py-1 rounded">
                    {tenant.slug}
                  </code>
                </CardDescription>
              </div>
              {getStatusBadge(tenant.subscriptionStatus, tenant.isActive)}
            </div>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Basic Information */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm font-medium text-muted-foreground">
                  Tenant ID
                </p>
                <p className="text-sm">{tenant.id}</p>
              </div>
              <div>
                <p className="text-sm font-medium text-muted-foreground">
                  Created
                </p>
                <p className="text-sm">
                  {format(
                    new Date(tenant.createdAt),
                    "MMMM d, yyyy 'at' h:mm a",
                  )}
                </p>
              </div>
            </div>

            {/* Subscription Information */}
            <div>
              <h3 className="text-lg font-semibold mb-3">Subscription</h3>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">
                    Plan
                  </p>
                  <p className="text-sm">{tenant.planName || "N/A"}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">
                    Status
                  </p>
                  <p className="text-sm capitalize">
                    {tenant.subscriptionStatus}
                  </p>
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">
                    Start Date
                  </p>
                  <p className="text-sm">
                    {tenant.subscriptionStartDate
                      ? format(
                          new Date(tenant.subscriptionStartDate),
                          "MMM d, yyyy",
                        )
                      : "N/A"}
                  </p>
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">
                    End Date
                  </p>
                  <p className="text-sm">
                    {tenant.subscriptionEndDate
                      ? format(
                          new Date(tenant.subscriptionEndDate),
                          "MMM d, yyyy",
                        )
                      : "N/A"}
                  </p>
                </div>
              </div>
            </div>

            {/* Database Information */}
            {tenant.dbPath && (
              <div>
                <h3 className="text-lg font-semibold mb-3">Database</h3>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">
                    Database Path
                  </p>
                  <p className="text-xs bg-muted p-2 rounded font-mono break-all">
                    {tenant.dbPath}
                  </p>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
