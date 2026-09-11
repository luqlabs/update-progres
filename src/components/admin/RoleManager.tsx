import { useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
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
import { Shield, ShieldOff } from "lucide-react";
import { toast } from "sonner";

interface RoleManagerProps {
  userId: string;
  currentRole: "admin" | "user";
  onRoleChange: (userId: string, newRole: "admin" | "user") => Promise<void>;
}

export function RoleManager({ userId, currentRole, onRoleChange }: RoleManagerProps) {
  const [isChanging, setIsChanging] = useState(false);
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  const [pendingRole, setPendingRole] = useState<"admin" | "user" | null>(null);

  const handleRoleClick = (newRole: "admin" | "user") => {
    if (newRole === currentRole) return;
    setPendingRole(newRole);
    setShowConfirmDialog(true);
  };

  const handleConfirm = async () => {
    if (!pendingRole) return;

    setIsChanging(true);
    try {
      await onRoleChange(userId, pendingRole);
      toast.success(`Role changed to ${pendingRole}`);
    } catch (error) {
      toast.error("Failed to change role");
      console.error(error);
    } finally {
      setIsChanging(false);
      setShowConfirmDialog(false);
      setPendingRole(null);
    }
  };

  return (
    <>
      <div className="flex items-center gap-2">
        {currentRole === "admin" ? (
          <Badge variant="default" className="gap-1">
            <Shield className="w-3 h-3" />
            Admin
          </Badge>
        ) : (
          <Badge variant="secondary" className="gap-1">
            User
          </Badge>
        )}
        
        <Button
          variant="outline"
          size="sm"
          onClick={() => handleRoleClick(currentRole === "admin" ? "user" : "admin")}
          disabled={isChanging}
        >
          {currentRole === "admin" ? (
            <>
              <ShieldOff className="w-4 h-4 mr-1" />
              Remove Admin
            </>
          ) : (
            <>
              <Shield className="w-4 h-4 mr-1" />
              Make Admin
            </>
          )}
        </Button>
      </div>

      <AlertDialog open={showConfirmDialog} onOpenChange={setShowConfirmDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirm Role Change</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to change this user's role to <strong>{pendingRole}</strong>?
              {pendingRole === "admin" && " This will give them full administrative access."}
              {pendingRole === "user" && " This will revoke their administrative privileges."}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleConfirm}>Confirm</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
