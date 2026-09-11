import { useEffect, useState } from "react";
import { AdminRoute } from "@/components/admin/AdminRoute";
import { AdminLayout } from "@/components/admin/AdminLayout";
import { DataTable } from "@/components/admin/DataTable";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface AuditEntry {
  id: string;
  admin_user_id: string;
  action: string;
  target_user_id: string | null;
  details: any;
  created_at: string;
  admin_email?: string;
  target_email?: string;
}

export default function AuditLogPage() {
  const [logs, setLogs] = useState<AuditEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");

  useEffect(() => {
    fetchAuditLogs();
  }, []);

  const fetchAuditLogs = async () => {
    try {
      const { data, error } = await supabase
        .from("admin_audit_log")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(100);

      if (error) throw error;

      setLogs(data || []);
    } catch (error: any) {
      console.error("Error fetching audit logs:", error);
      toast.error("Failed to load audit logs");
    } finally {
      setLoading(false);
    }
  };

  const filteredLogs = logs.filter((log) =>
    log.action.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const columns = [
    {
      header: "Timestamp",
      cell: (row: AuditEntry) => new Date(row.created_at).toLocaleString(),
    },
    {
      header: "Action",
      cell: (row: AuditEntry) => (
        <Badge variant="outline">{row.action}</Badge>
      ),
    },
    {
      header: "Admin",
      cell: (row: AuditEntry) => row.admin_user_id.substring(0, 8) + "...",
    },
    {
      header: "Target User",
      cell: (row: AuditEntry) =>
        row.target_user_id ? row.target_user_id.substring(0, 8) + "..." : "—",
    },
    {
      header: "Details",
      cell: (row: AuditEntry) =>
        row.details ? JSON.stringify(row.details).substring(0, 50) + "..." : "—",
    },
  ];

  return (
    <AdminRoute>
      <AdminLayout>
        <div className="space-y-6">
          <div>
            <h2 className="text-3xl font-bold tracking-tight">Audit Log</h2>
            <p className="text-muted-foreground">
              Track all administrative actions
            </p>
          </div>

          <DataTable
            columns={columns}
            data={filteredLogs}
            searchValue={searchTerm}
            onSearchChange={setSearchTerm}
            searchPlaceholder="Search actions..."
            isLoading={loading}
          />
        </div>
      </AdminLayout>
    </AdminRoute>
  );
}
