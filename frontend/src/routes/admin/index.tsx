import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { format } from "date-fns";
import { useEffect, useState } from "react";
import { superAdminApi, type TenantListItem } from "@/api/superAdmin";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useSuperAdminStore } from "@/stores/superAdminStore";

export const Route = createFileRoute("/admin/")({
  component: AdminDashboard,
});

function AdminDashboard() {
  const navigate = useNavigate();
  const { isAuthenticated, clearAuth, user } = useSuperAdminStore();
  const [tenants, setTenants] = useState<TenantListItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [deleteDialog, setDeleteDialog] = useState<{
    open: boolean;
    tenantId: string | null;
    tenantName: string | null;
  }>({ open: false, tenantId: null, tenantName: null });

  useEffect(() => {
    if (!isAuthenticated) {
      navigate({ to: "/admin/login" });
      return;
    }
    loadTenants();
  }, [isAuthenticated, navigate]);

  const loadTenants = async () => {
    try {
      setIsLoading(true);
      setError(null);
      const response = await superAdminApi.getAllTenants();
      if (response.success) {
        setTenants(response.data);
      }
    } catch (err: unknown) {
      const error = err as {
        response?: { data?: { error?: { message?: string } } };
      };
      setError(
        error.response?.data?.error?.message || "Failed to load tenants",
      );
    } finally {
      setIsLoading(false);
    }
  };

  const handleSuspend = async (tenantId: string) => {
    try {
      setActionLoading(tenantId);
      await superAdminApi.suspendTenant(tenantId);
      await loadTenants();
    } catch (err: unknown) {
      const error = err as {
        response?: { data?: { error?: { message?: string } } };
      };
      setError(
        error.response?.data?.error?.message || "Failed to suspend tenant",
      );
    } finally {
      setActionLoading(null);
    }
  };

  const handleActivate = async (tenantId: string) => {
    try {
      setActionLoading(tenantId);
      await superAdminApi.activateTenant(tenantId);
      await loadTenants();
    } catch (err: unknown) {
      const error = err as {
        response?: { data?: { error?: { message?: string } } };
      };
      setError(
        error.response?.data?.error?.message || "Failed to activate tenant",
      );
    } finally {
      setActionLoading(null);
    }
  };

  const handleDeleteConfirm = async () => {
    if (!deleteDialog.tenantId) return;

    try {
      setActionLoading(deleteDialog.tenantId);
      await superAdminApi.deleteTenant(deleteDialog.tenantId);
      setDeleteDialog({ open: false, tenantId: null, tenantName: null });
      await loadTenants();
    } catch (err: unknown) {
      const error = err as {
        response?: { data?: { error?: { message?: string } } };
      };
      setError(
        error.response?.data?.error?.message || "Failed to delete tenant",
      );
    } finally {
      setActionLoading(null);
    }
  };

  const handleLogout = () => {
    clearAuth();
    navigate({ to: "/admin/login" });
  };

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

  if (!isAuthenticated) {
    return null;
  }

  return (
    <div className="min-h-screen bg-muted/50">
      {/* Header */}
      <div className="border-b bg-background">
        <div className="container mx-auto flex h-16 items-center justify-between px-4">
          <div>
            <h1 className="text-xl font-bold">Super Admin Portal</h1>
            <p className="text-sm text-muted-foreground">
              Logged in as {user?.email}
            </p>
          </div>
          <Button variant="outline" onClick={handleLogout}>
            Logout
          </Button>
        </div>
      </div>

      {/* Main Content */}
      <div className="container mx-auto p-4 space-y-4">
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>Tenant Management</CardTitle>
                <CardDescription>
                  Manage all tenant accounts and subscriptions
                </CardDescription>
              </div>
              <Button onClick={() => navigate({ to: "/admin/tenants/create" })}>
                Create Tenant
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            {error && (
              <div className="mb-4 bg-destructive/10 text-destructive text-sm p-3 rounded-md">
                {error}
              </div>
            )}

            {isLoading ? (
              <div className="text-center py-8 text-muted-foreground">
                Loading tenants...
              </div>
            ) : tenants.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                No tenants found
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Company Name</TableHead>
                    <TableHead>Slug</TableHead>
                    <TableHead>Plan</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Created</TableHead>
                    <TableHead>Subscription End</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {tenants.map((tenant) => (
                    <TableRow key={tenant.id}>
                      <TableCell className="font-medium">
                        {tenant.name}
                      </TableCell>
                      <TableCell>
                        <code className="text-xs bg-muted px-2 py-1 rounded">
                          {tenant.slug}
                        </code>
                      </TableCell>
                      <TableCell>{tenant.planName}</TableCell>
                      <TableCell>
                        {getStatusBadge(
                          tenant.subscriptionStatus,
                          tenant.isActive,
                        )}
                      </TableCell>
                      <TableCell>
                        {format(new Date(tenant.createdAt), "MMM d, yyyy")}
                      </TableCell>
                      <TableCell>
                        {tenant.subscriptionEndDate
                          ? format(
                              new Date(tenant.subscriptionEndDate),
                              "MMM d, yyyy",
                            )
                          : "N/A"}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() =>
                              navigate({ to: `/admin/tenants/${tenant.id}` })
                            }
                          >
                            View
                          </Button>
                          {tenant.isActive &&
                          tenant.subscriptionStatus !== "suspended" ? (
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleSuspend(tenant.id)}
                              disabled={actionLoading === tenant.id}
                            >
                              {actionLoading === tenant.id ? "..." : "Suspend"}
                            </Button>
                          ) : (
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleActivate(tenant.id)}
                              disabled={actionLoading === tenant.id}
                            >
                              {actionLoading === tenant.id ? "..." : "Activate"}
                            </Button>
                          )}
                          <Button
                            variant="destructive"
                            size="sm"
                            onClick={() =>
                              setDeleteDialog({
                                open: true,
                                tenantId: tenant.id,
                                tenantName: tenant.name,
                              })
                            }
                            disabled={actionLoading === tenant.id}
                          >
                            Delete
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Delete Confirmation Dialog */}
      <AlertDialog
        open={deleteDialog.open}
        onOpenChange={(open) =>
          !open &&
          setDeleteDialog({ open: false, tenantId: null, tenantName: null })
        }
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete the tenant "{deleteDialog.tenantName}
              " and all associated data. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel
              variant="outline"
              onClick={() =>
                setDeleteDialog({
                  open: false,
                  tenantId: null,
                  tenantName: null,
                })
              }
            >
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              variant="destructive"
              onClick={handleDeleteConfirm}
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
