import { Button } from "@/components/ui/button";
import { Trash2, X } from "lucide-react";

interface BulkActionBarProps {
  selectedCount: number;
  totalCount: number;
  onSelectAll: () => void;
  onDelete: () => void;
  onCancel: () => void;
}

const BulkActionBar = ({ 
  selectedCount, 
  totalCount, 
  onSelectAll, 
  onDelete, 
  onCancel 
}: BulkActionBarProps) => {
  if (selectedCount === 0) return null;

  return (
    <div className="fixed bottom-4 left-4 right-4 sm:left-1/2 sm:right-auto sm:-translate-x-1/2 bg-card border shadow-none rounded-lg px-3 py-2 sm:px-4 sm:py-3 flex flex-wrap items-center gap-2 sm:gap-4 z-50 animate-fade-in">
      <span className="text-sm font-medium">
        {selectedCount} selected
      </span>
      
      {selectedCount < totalCount && (
        <Button variant="outline" size="sm" onClick={onSelectAll}>
          Select All ({totalCount})
        </Button>
      )}
      
      <Button variant="destructive" size="sm" onClick={onDelete}>
        <Trash2 className="w-4 h-4 mr-2" />
        Delete Selected
      </Button>
      
      <Button variant="ghost" size="sm" onClick={onCancel} className="ml-auto sm:ml-0">
        <X className="w-4 h-4" />
      </Button>

    </div>
  );
};

export default BulkActionBar;
