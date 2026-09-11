import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
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
import { Badge } from "@/components/ui/badge";

interface App {
  id: string;
  title: string;
  app_type: string;
  theme: string;
  share_code: string;
  created_at: string;
  updated_at: string;
  is_starred?: boolean;
  folder_id?: string | null;
}

interface Folder {
  id: string;
  name: string;
  color: string;
  icon: string;
}

interface AppTableProps {
  apps: App[];
  folders: Folder[];
  participantCounts: Record<string, number>;
  avgScores?: Record<string, number | null>;
  selectedApps: Set<string>;
  onSelectApp: (appId: string, selected: boolean) => void;
  onSelectAll: (selected: boolean) => void;
  onEdit: (app: App) => void;
  onPreview: (app: App) => void;
  onShare: (app: App) => void;
  onDelete: (app: App) => void;
  onToggleStar: (appId: string, isStarred: boolean) => void;
  onMoveToFolder: (appId: string, folderId: string | null) => void;
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

const AppTable = ({ 
  apps, 
  folders, 
  participantCounts,
  avgScores = {},
  selectedApps, 
  onSelectApp, 
  onSelectAll, 
  onEdit, 
  onPreview, 
  onShare, 
  onDelete, 
  onToggleStar, 
  onMoveToFolder 
}: AppTableProps) => {
  const allSelected = apps.length > 0 && apps.every(app => selectedApps.has(app.id));
  const someSelected = apps.some(app => selectedApps.has(app.id));
  const maxParticipants = Math.max(1, ...apps.map(app => participantCounts[app.id] || 0));


  return (
    <div className="border rounded-lg overflow-hidden bg-card">
      <Table>
        <TableHeader>
          <TableRow className="hover:bg-transparent">
            <TableHead className="w-12">
              <Checkbox
                checked={allSelected}
                onCheckedChange={onSelectAll}
                aria-label="Select all"
                {...(someSelected && !allSelected ? { "data-state": "indeterminate" } : {})}
              />
            </TableHead>
            <TableHead>Title</TableHead>
            <TableHead className="hidden sm:table-cell">Type</TableHead>
            <TableHead className="hidden md:table-cell">Avg score</TableHead>
            <TableHead className="hidden md:table-cell">Participants</TableHead>
            <TableHead className="hidden lg:table-cell">Updated</TableHead>
            <TableHead className="text-right">Actions</TableHead>

          </TableRow>
        </TableHeader>
        <TableBody>
          {apps.map((app) => {
            const TypeIcon = getAppTypeIcon(app.app_type);
            const count = participantCounts[app.id] || 0;
            const score = avgScores[app.id];
            const scorePct = typeof score === "number" ? Math.round(score * 100) : null;

            return (
              <TableRow key={app.id} className="group">
                <TableCell>
                  <Checkbox
                    checked={selectedApps.has(app.id)}
                    onCheckedChange={(checked) => onSelectApp(app.id, !!checked)}
                    aria-label={`Select ${app.title}`}
                  />
                </TableCell>
                <TableCell>
                  <div className="flex items-center gap-3">
                    <TypeIcon className="w-4 h-4 text-muted-foreground shrink-0" />
                    <div className="flex items-center gap-2 min-w-0">
                      <span className="font-medium truncate max-w-[280px]">{app.title}</span>
                      {app.is_starred && (
                        <Star className="w-3.5 h-3.5 fill-yellow-500 text-yellow-500 shrink-0" />
                      )}
                    </div>
                  </div>
                </TableCell>
                <TableCell className="hidden sm:table-cell text-muted-foreground capitalize">{app.app_type}</TableCell>
                <TableCell className="hidden md:table-cell">
                  {scorePct === null ? (
                    <span className="text-muted-foreground/50 text-sm">—</span>
                  ) : (
                    <div className="flex items-center gap-2 min-w-[110px]">
                      <div className="h-1.5 w-16 bg-muted overflow-hidden">
                        <div
                          className={scorePct >= 75 ? "h-full bg-primary" : "h-full bg-foreground"}
                          style={{ width: `${Math.max(scorePct, 2)}%` }}
                        />
                      </div>
                      <span className="text-sm tabular-nums">{scorePct}%</span>
                    </div>
                  )}
                </TableCell>
                <TableCell className="hidden md:table-cell">
                  {count > 0 ? (
                    <div className="flex items-center gap-2 min-w-[90px]">
                      <div className="h-1.5 w-12 bg-muted overflow-hidden">
                        <div
                          className="h-full bg-foreground/60"
                          style={{ width: `${Math.max((count / maxParticipants) * 100, 4)}%` }}
                        />
                      </div>
                      <span className="text-sm tabular-nums">{count}</span>
                    </div>
                  ) : (
                    <span className="text-muted-foreground/50 text-sm">0</span>
                  )}
                </TableCell>

                <TableCell className="hidden lg:table-cell text-muted-foreground text-sm">
                  {formatDistanceToNow(new Date(app.updated_at), { addSuffix: true })}
                </TableCell>
                <TableCell>
                  <div className="flex items-center justify-end gap-1">
                    <Button size="sm" variant="outline" className="h-8 text-xs" onClick={() => onEdit(app)}>
                      <Pencil className="w-3.5 h-3.5 mr-1" />
                      Edit
                    </Button>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                          <MoreVertical className="w-4 h-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => onPreview(app)}>
                          <Eye className="w-4 h-4 mr-2" />
                          Preview
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => onToggleStar(app.id, !app.is_starred)}>
                          <Star className={`w-4 h-4 mr-2 ${app.is_starred ? "fill-yellow-500 text-yellow-500" : ""}`} />
                          {app.is_starred ? "Unstar" : "Star"}
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuSub>
                          <DropdownMenuSubTrigger>
                            <FolderOpen className="w-4 h-4 mr-2" />
                            Move to folder
                          </DropdownMenuSubTrigger>
                          <DropdownMenuSubContent>
                            {app.folder_id && (
                              <>
                                <DropdownMenuItem onClick={() => onMoveToFolder(app.id, null)}>
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
                                  onClick={() => onMoveToFolder(app.id, folder.id)}
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
                        <DropdownMenuItem onClick={() => onShare(app)}>
                          <Share2 className="w-4 h-4 mr-2" />
                          Share Link
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => onDelete(app)} className="text-destructive">
                          <Trash2 className="w-4 h-4 mr-2" />
                          Delete Activity
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
    </div>
  );
};

export default AppTable;
