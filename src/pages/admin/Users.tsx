import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { AdminRoute } from "@/components/admin/AdminRoute";
import { AdminLayout } from "@/components/admin/AdminLayout";
import { DataTable } from "@/components/admin/DataTable";
import { StatsCard } from "@/components/admin/StatsCard";
import { Button } from "@/components/ui/button";
import { Eye, Users, CreditCard, UserCheck, Layers, RefreshCw } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface User {
  id: string;
  email: string;
  full_name: string | null;
  created_at: string;
  role: "admin" | "user";
  credits: number;
  apps_created: number;
  plan_name: string | null;
  subscription_status: string | null;
  is_free_tier: boolean | null;
}

export default function UsersPage() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [searchTerm, setSearchTerm] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");

  // Debounce search term
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(searchTerm);
    }, 500);
    return () => clearTimeout(timer);
  }, [searchTerm]);

  const { data: users = [], isLoading } = useQuery({
    queryKey: ["admin-users", debouncedSearch],
    queryFn: async () => {
      const { data, error } = await supabase.functions.invoke("admin-get-users", {
        body: { search: debouncedSearch || undefined },
      });

      if (error) throw error;

      // Sort by newest first
      return (data.users || []).sort((a: User, b: User) => 
        new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
      );
    },
    staleTime: 5 * 60 * 1000, // Cache for 5 minutes
    gcTime: 10 * 60 * 1000, // Keep in cache for 10 minutes
  });

  const handleRefresh = () => {
    queryClient.invalidateQueries({ queryKey: ["admin-users"] });
    toast.success("Refreshing user data...");
  };

  const columns = [
    {
      header: "Email",
      accessorKey: "email" as keyof User,
    },
    {
      header: "Name",
      cell: (row: User) => row.full_name || "—",
    },
    {
      header: "Plan",
      cell: (row: User) => row.plan_name || "Free",
      sortable: true,
      sortValue: (row: User) => row.plan_name || "Free",
    },
    {
      header: "Apps",
      accessorKey: "apps_created" as keyof User,
    },
    {
      header: "Credits",
      accessorKey: "credits" as keyof User,
    },
    {
      header: "Joined",
      cell: (row: User) => new Date(row.created_at).toLocaleDateString(),
    },
    {
      header: "Actions",
      cell: (row: User) => (
        <Button
          variant="ghost"
          size="sm"
          onClick={() => navigate(`/admin/users/${row.id}`)}
        >
          <Eye className="w-4 h-4 mr-1" />
          View
        </Button>
      ),
    },
  ];

  // Calculate stats
  const totalUsers = users.length;
  const activeSubscriptions = users.filter(u => u.subscription_status === "active" && u.is_free_tier === false).length;
  const freeUsers = users.filter(u => u.subscription_status !== "active" || u.is_free_tier === true).length;
  const totalApps = users.reduce((sum, u) => sum + (u.apps_created || 0), 0);

  return (
    <AdminRoute>
      <AdminLayout>
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-3xl font-bold tracking-tight">Users</h2>
              <p className="text-muted-foreground">
                Manage users, subscriptions, and permissions
              </p>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={handleRefresh}
              disabled={isLoading}
            >
              <RefreshCw className={`w-4 h-4 mr-2 ${isLoading ? "animate-spin" : ""}`} />
              Refresh
            </Button>
          </div>

          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <StatsCard
              title="Total Users"
              value={totalUsers}
              icon={Users}
              description="All registered users"
            />
            <StatsCard
              title="Active Subscriptions"
              value={activeSubscriptions}
              icon={CreditCard}
              description="Users with active plans"
            />
            <StatsCard
              title="Free Users"
              value={freeUsers}
              icon={UserCheck}
              description="Users on free tier"
            />
            <StatsCard
              title="Total Apps Created"
              value={totalApps}
              icon={Layers}
              description="All apps across users"
            />
          </div>

          <DataTable
            columns={columns}
            data={users}
            searchValue={searchTerm}
            onSearchChange={setSearchTerm}
            searchPlaceholder="Search by email or name..."
            isLoading={isLoading}
          />
        </div>
      </AdminLayout>
    </AdminRoute>
  );
}
