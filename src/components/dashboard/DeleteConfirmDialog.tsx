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

interface DeleteConfirmDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: () => void;
  appTitle?: string;
  appCount?: number;
  isBulkDelete?: boolean;
}

const DeleteConfirmDialog = ({ 
  open, 
  onOpenChange, 
  onConfirm, 
  appTitle, 
  appCount = 1,
  isBulkDelete = false 
}: DeleteConfirmDialogProps) => {
  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>
            {isBulkDelete ? `Delete ${appCount} Activities?` : "Delete Activity?"}
          </AlertDialogTitle>
          <AlertDialogDescription>
            {isBulkDelete 
              ? `Are you sure you want to delete ${appCount} activities? This action cannot be undone and all student data will be permanently removed.`
              : `Are you sure you want to delete "${appTitle}"? This action cannot be undone and all student data will be permanently removed.`
            }
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Cancel</AlertDialogCancel>
          <AlertDialogAction onClick={onConfirm} className="bg-destructive hover:bg-destructive/90">
            Delete {isBulkDelete && appCount > 1 ? `${appCount} Activities` : ""}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
};

export default DeleteConfirmDialog;
