import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import { Pencil, Eye, Share2, Trash2, MoreVertical, FileQuestion, Layers, Link2, Star, FolderOpen, Folder as FolderIcon, LayoutGrid, Check, Briefcase, BookOpen, GraduationCap, Users, Lightbulb, Target, Award } from "lucide-react";
import { formatDistanceToNow } from "date-fns";

interface AppListItemProps {
  app: {
    id: string;
    title: string;
    app_type: string;
    theme: string;
    share_code: string;
    created_at: string;
    updated_at: string;
    is_starred?: boolean;
    folder_id?: string | null;
  };
  folders: Array<{
    id: string;
    name: string;
    color: string;
    icon: string;
  }>;
  participantCount?: number;
  isSelected?: boolean;
  onSelect?: (selected: boolean) => void;
  onEdit: () => void;
  onPreview: () => void;
  onShare: () => void;
  onDelete: () => void;
  onToggleStar?: (isStarred: boolean) => void;
  onMoveToFolder?: (folderId: string | null) => void;
}

const getAppTypeIcon = (type: string) => {
  switch (type) {
    case "quiz":
      return FileQuestion;
    case "flashcards":
      return Layers;
    case "matching":
      return Link2;
    default:
      return FileQuestion;
  }
};

const iconMap: Record<string, any> = {
  folder: FolderIcon,
  briefcase: Briefcase,
  book: BookOpen,
  graduation: GraduationCap,
  users: Users,
  lightbulb: Lightbulb,
  target: Target,
  award: Award,
};

const colorMap: Record<string, string> = {
  blue: "bg-blue-500",
  green: "bg-green-500",
  purple: "bg-purple-500",
  orange: "bg-orange-500",
  red: "bg-red-500",
  pink: "bg-pink-500",
  yellow: "bg-yellow-500",
  indigo: "bg-indigo-500",
};

const AppListItem = ({ 
  app, 
  folders, 
  participantCount = 0,
  isSelected, 
  onSelect, 
  onEdit, 
  onPreview, 
  onShare, 
  onDelete, 
  onToggleStar, 
  onMoveToFolder 
}: AppListItemProps) => {
  const TypeIcon = getAppTypeIcon(app.app_type);

  return (
    <div className="flex items-center gap-4 p-4 bg-card border rounded-lg hover:border-foreground/30 transition-all group">
      {onSelect && (
        <Checkbox
          checked={isSelected}
          onCheckedChange={onSelect}
          className="shrink-0"
        />
      )}
      
      <div className="p-2 rounded-lg bg-secondary shrink-0">
        <TypeIcon className="w-5 h-5 text-primary" />
      </div>
      
      <div className="flex-1 min-w-0">
        <h3 className="font-semibold truncate">{app.title}</h3>
        <p className="text-sm text-muted-foreground capitalize">
          {app.app_type} • {app.theme} theme
        </p>
      </div>
      
      <div className="hidden sm:flex items-center gap-3 shrink-0">
        {participantCount > 0 ? (
          <Badge variant="secondary" className="gap-1 text-xs">
            <Users className="w-3 h-3" />
            {participantCount}
          </Badge>
        ) : (
          <span className="text-xs text-muted-foreground/50 flex items-center gap-1">
            <Users className="w-3 h-3" /> 0
          </span>
        )}
        <span className="text-sm text-muted-foreground">
          {formatDistanceToNow(new Date(app.updated_at), { addSuffix: true })}
        </span>
      </div>
      
      <div className="flex items-center gap-2 shrink-0">
        <Button size="sm" onClick={onEdit}>
          <Pencil className="w-4 h-4 mr-1" />
          Edit
        </Button>
        <Button size="sm" variant="outline" onClick={onPreview}>
          <Eye className="w-4 h-4 mr-1" />
          Preview
        </Button>
        
        {onToggleStar && (
          <Button
            variant="ghost"
            size="sm"
            className="h-8 w-8 p-0"
            onClick={() => onToggleStar(!app.is_starred)}
          >
            <Star className={`w-4 h-4 ${app.is_starred ? "fill-yellow-500 text-yellow-500" : ""}`} />
          </Button>
        )}
        
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
              <MoreVertical className="w-4 h-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            {onMoveToFolder && (
              <>
                <DropdownMenuSub>
                  <DropdownMenuSubTrigger>
                    <FolderOpen className="w-4 h-4 mr-2" />
                    Move to folder
                  </DropdownMenuSubTrigger>
                  <DropdownMenuSubContent>
                    {app.folder_id && (
                      <>
                        <DropdownMenuItem onClick={() => onMoveToFolder(null)}>
                          <LayoutGrid className="w-4 h-4 mr-2" />
                          Remove from folder
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                      </>
                    )}
                    {folders.map((folder) => {
                      const Icon = iconMap[folder.icon] || FolderIcon;
                      const colorClass = colorMap[folder.color] || "bg-blue-500";
                      const isCurrentFolder = app.folder_id === folder.id;
                      return (
                        <DropdownMenuItem
                          key={folder.id}
                          onClick={() => onMoveToFolder(folder.id)}
                          disabled={isCurrentFolder}
                        >
                          <div className={`w-4 h-4 rounded ${colorClass} flex items-center justify-center mr-2`}>
                            <Icon className="w-2.5 h-2.5 text-white" />
                          </div>
                          {folder.name}
                          {isCurrentFolder && <Check className="w-4 h-4 ml-auto" />}
                        </DropdownMenuItem>
                      );
                    })}
                    {folders.length === 0 && (
                      <DropdownMenuItem disabled>No folders yet</DropdownMenuItem>
                    )}
                  </DropdownMenuSubContent>
                </DropdownMenuSub>
                <DropdownMenuSeparator />
              </>
            )}
            <DropdownMenuItem onClick={onShare}>
              <Share2 className="w-4 h-4 mr-2" />
              Share Link
            </DropdownMenuItem>
            <DropdownMenuItem onClick={onDelete} className="text-destructive">
              <Trash2 className="w-4 h-4 mr-2" />
              Delete Activity
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </div>
  );
};

export default AppListItem;
