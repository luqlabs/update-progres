import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Logo } from "@/components/ui/logo";
import { Sidebar, SidebarContent, SidebarGroup, SidebarGroupContent, SidebarGroupLabel, SidebarMenu, SidebarMenuButton, SidebarMenuItem, SidebarTrigger, SidebarFooter, useSidebar } from "@/components/ui/sidebar";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { FolderDialog } from "./FolderDialog";
import { NotificationsPopover } from "./NotificationsPopover";
import { LayoutGrid, Star, Folder, MoreVertical, Edit, Trash, Plus, Briefcase, BookOpen, GraduationCap, Users, Lightbulb, Target, Award, MessageSquare, User, CreditCard, Settings, Shield, LogOut, Gift, X, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";

interface Promotion {
  id: string;
  title: string;
  description: string;
  code: string | null;
  discount: string | null;
  theme_color: string;
}

const getPromoThemeColors = (color: string) => {
  switch (color) {
    case "green": return { bg: "bg-green-50 dark:bg-green-950/30", hover: "hover:bg-green-100 dark:hover:bg-green-950/50", icon: "text-green-600 dark:text-green-400", dismiss: "hover:bg-green-200/50 dark:hover:bg-green-900/50" };
    case "blue": return { bg: "bg-blue-50 dark:bg-blue-950/30", hover: "hover:bg-blue-100 dark:hover:bg-blue-950/50", icon: "text-blue-600 dark:text-blue-400", dismiss: "hover:bg-blue-200/50 dark:hover:bg-blue-900/50" };
    case "purple": return { bg: "bg-purple-50 dark:bg-purple-950/30", hover: "hover:bg-purple-100 dark:hover:bg-purple-950/50", icon: "text-purple-600 dark:text-purple-400", dismiss: "hover:bg-purple-200/50 dark:hover:bg-purple-900/50" };
    case "red": return { bg: "bg-red-50 dark:bg-red-950/30", hover: "hover:bg-red-100 dark:hover:bg-red-950/50", icon: "text-red-600 dark:text-red-400", dismiss: "hover:bg-red-200/50 dark:hover:bg-red-900/50" };
    case "pink": return { bg: "bg-pink-50 dark:bg-pink-950/30", hover: "hover:bg-pink-100 dark:hover:bg-pink-950/50", icon: "text-pink-600 dark:text-pink-400", dismiss: "hover:bg-pink-200/50 dark:hover:bg-pink-900/50" };
    default: return { bg: "bg-amber-50 dark:bg-amber-950/30", hover: "hover:bg-amber-100 dark:hover:bg-amber-950/50", icon: "text-amber-600 dark:text-amber-400", dismiss: "hover:bg-amber-200/50 dark:hover:bg-amber-900/50" };
  }
};
const iconMap: Record<string, any> = {
  folder: Folder,
  briefcase: Briefcase,
  book: BookOpen,
  graduation: GraduationCap,
  users: Users,
  lightbulb: Lightbulb,
  target: Target,
  award: Award
};
const colorMap: Record<string, string> = {
  blue: "bg-blue-500",
  green: "bg-green-500",
  purple: "bg-purple-500",
  orange: "bg-orange-500",
  red: "bg-red-500",
  pink: "bg-pink-500",
  yellow: "bg-yellow-500",
  indigo: "bg-indigo-500"
};
interface Folder {
  id: string;
  name: string;
  color: string;
  icon: string;
  app_count: number;
}
interface DashboardSidebarProps {
  folders: Folder[];
  selectedView: string;
  onViewChange: (view: string) => void;
  onFoldersUpdate: () => void;
  starredCount: number;
  canCreate: boolean;
  remainingApps: number | 'unlimited';
  maxApps: number | 'unlimited';
  userEmail?: string;
  userId?: string;
  isAdmin: boolean;
  onSignOut: () => void;
  onCreateNew: () => void;
  isCreatingApp?: boolean;
  showPromo?: boolean;
}
export function DashboardSidebar({
  folders,
  selectedView,
  onViewChange,
  onFoldersUpdate,
  starredCount,
  canCreate,
  remainingApps,
  maxApps,
  userEmail,
  userId,
  isAdmin,
  onSignOut,
  onCreateNew,
  isCreatingApp = false,
  showPromo = false
}: DashboardSidebarProps) {
  const navigate = useNavigate();
  const {
    state
  } = useSidebar();
  const collapsed = state === "collapsed";
  const [folderDialogOpen, setFolderDialogOpen] = useState(false);
  const [editingFolder, setEditingFolder] = useState<Folder | null>(null);
  const [deletingFolderId, setDeletingFolderId] = useState<string | null>(null);
  const [sidebarPromo, setSidebarPromo] = useState<Promotion | null>(null);
  const [promoDismissed, setPromoDismissed] = useState(false);

  useEffect(() => {
    if (showPromo) {
      fetchSidebarPromo();
    }
  }, [showPromo]);

  useEffect(() => {
    if (sidebarPromo) {
      const dismissed = localStorage.getItem(`promo-sidebar-dismissed-${sidebarPromo.id}`);
      if (dismissed === 'true') {
        setPromoDismissed(true);
      }
    }
  }, [sidebarPromo]);

  const fetchSidebarPromo = async () => {
    try {
      const { data, error } = await supabase
        .from("promotions")
        .select("*")
        .eq("is_active", true)
        .contains("display_locations", ["sidebar"])
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle();

      if (error) throw error;
      
      if (data && data.expiry_date && new Date(data.expiry_date) < new Date()) {
        setSidebarPromo(null);
      } else {
        setSidebarPromo(data);
      }
    } catch (error) {
      console.error("Error fetching sidebar promo:", error);
    }
  };

  const handleDismissPromo = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (sidebarPromo) {
      localStorage.setItem(`promo-sidebar-dismissed-${sidebarPromo.id}`, 'true');
    }
    setPromoDismissed(true);
  };
  const handleCreateNew = () => {
    if (!canCreate) {
      toast.error(`You've reached your activity limit of ${maxApps}. Upgrade to create more.`);
      navigate("/settings/billing");
      return;
    }
    onCreateNew();
  };
  const handleCreateFolder = async (folderData: {
    name: string;
    color: string;
    icon: string;
  }) => {
    const {
      data: {
        user
      }
    } = await supabase.auth.getUser();
    if (!user) return;
    const {
      error
    } = await supabase.from("folders").insert({
      user_id: user.id,
      ...folderData,
      display_order: folders.length
    });
    if (error) {
      toast.error("Failed to create folder");
      return;
    }
    toast.success("Folder created");
    onFoldersUpdate();
  };
  const handleUpdateFolder = async (folderData: {
    name: string;
    color: string;
    icon: string;
  }) => {
    if (!editingFolder) return;
    const {
      error
    } = await supabase.from("folders").update(folderData).eq("id", editingFolder.id);
    if (error) {
      toast.error("Failed to update folder");
      return;
    }
    toast.success("Folder updated");
    setEditingFolder(null);
    onFoldersUpdate();
  };
  const handleDeleteFolder = async () => {
    if (!deletingFolderId) return;
    const {
      error
    } = await supabase.from("folders").delete().eq("id", deletingFolderId);
    if (error) {
      toast.error("Failed to delete folder");
      return;
    }
    toast.success("Folder deleted");
    setDeletingFolderId(null);
    if (selectedView === deletingFolderId) {
      onViewChange("all");
    }
    onFoldersUpdate();
  };
  return <>
      <Sidebar className={collapsed ? "w-14" : "w-60"} collapsible="icon">
        <div className={`p-2 border-b flex items-center ${collapsed ? "justify-center" : "justify-between"}`}>
          {!collapsed && <Logo size="sm" />}
          <SidebarTrigger className={collapsed ? "" : "ml-auto"} />
        </div>

        {/* Create New Button */}
        <div className={collapsed ? "px-2 py-3 flex justify-center" : "p-2"}>
          <Button onClick={handleCreateNew} disabled={!canCreate || isCreatingApp} size={collapsed ? "icon" : "default"} title={collapsed ? "Create New" : undefined} className={collapsed ? "h-9 w-9 shrink-0" : "w-full justify-start mx-0 my-[15px]"}>
            <Plus className="w-4 h-4" />
            {!collapsed && <>
                <span className="ml-2">Create New</span>
                {remainingApps !== 'unlimited' && remainingApps !== 0 && <span className="ml-auto text-xs opacity-70">
                    ({remainingApps})
                  </span>}
              </>}
          </Button>
        </div>


        <SidebarContent className="min-h-0 overflow-y-auto">
          <SidebarGroup>
            {!collapsed && <SidebarGroupLabel>Views</SidebarGroupLabel>}
            <SidebarGroupContent>
              <SidebarMenu>
                <SidebarMenuItem>
                  <SidebarMenuButton isActive={selectedView === "all"} onClick={() => onViewChange("all")} tooltip="All Activities" className={collapsed ? "justify-center" : ""}>
                    <LayoutGrid className="w-4 h-4" />
                    {!collapsed && <span>All Activities</span>}
                  </SidebarMenuButton>
                </SidebarMenuItem>

                <SidebarMenuItem>
                  <SidebarMenuButton isActive={selectedView === "starred"} onClick={() => onViewChange("starred")} tooltip="Starred" className={collapsed ? "justify-center" : ""}>
                    <Star className="w-4 h-4" />
                    {!collapsed && <>
                        <span>Starred</span>
                        {starredCount > 0 && <span className="ml-auto text-xs text-muted-foreground">
                            {starredCount}
                          </span>}
                      </>}
                  </SidebarMenuButton>
                </SidebarMenuItem>

              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>

          <SidebarGroup>
            <div className={`flex items-center px-2 ${collapsed ? "justify-center" : "justify-between"}`}>
              {!collapsed && <SidebarGroupLabel>Folders</SidebarGroupLabel>}
              <Button variant="ghost" size="icon" className="h-6 w-6" title="New folder" onClick={() => {
              setEditingFolder(null);
              setFolderDialogOpen(true);
            }}>
                <Plus className="w-4 h-4" />
              </Button>
            </div>
            <SidebarGroupContent>
              <SidebarMenu>
                {folders.map(folder => {
                const Icon = iconMap[folder.icon] || Folder;
                const colorClass = colorMap[folder.color] || "bg-blue-500";
                return <SidebarMenuItem key={folder.id}>
                      <div className={`flex items-center gap-1 w-full ${collapsed ? "justify-center" : ""}`}>
                        <SidebarMenuButton isActive={selectedView === folder.id} onClick={() => onViewChange(folder.id)} tooltip={folder.name} className={collapsed ? "justify-center" : "flex-1"}>
                          <div className={`w-5 h-5 rounded ${colorClass} flex items-center justify-center shrink-0`}>
                            <Icon className="w-3 h-3 text-white" />
                          </div>
                          {!collapsed && <>
                              <span className="truncate">{folder.name}</span>
                              {folder.app_count > 0 && <span className="ml-auto text-xs text-muted-foreground">
                                  {folder.app_count}
                                </span>}
                            </>}
                        </SidebarMenuButton>


                        {!collapsed && <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="icon" className="h-6 w-6 shrink-0">
                                <MoreVertical className="w-3 h-3" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem onClick={() => {
                          setEditingFolder(folder);
                          setFolderDialogOpen(true);
                        }}>
                                <Edit className="w-4 h-4 mr-2" />
                                Edit
                              </DropdownMenuItem>
                              <DropdownMenuSeparator />
                              <DropdownMenuItem onClick={() => setDeletingFolderId(folder.id)} className="text-destructive">
                                <Trash className="w-4 h-4 mr-2" />
                                Delete
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>}
                      </div>
                    </SidebarMenuItem>;
              })}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>

          {/* Promotional Card - Inside SidebarContent so it scrolls */}
          {showPromo && sidebarPromo && !promoDismissed && !collapsed && (() => {
            const colors = getPromoThemeColors(sidebarPromo.theme_color);
            return (
              <div 
                onClick={() => navigate("/upgrade")}
                className={`mx-2 mb-2 p-3 rounded-lg ${colors.bg} cursor-pointer ${colors.hover} transition-colors relative group`}
              >
                <button
                  onClick={handleDismissPromo}
                  className={`absolute top-1 right-1 p-1 rounded-full ${colors.dismiss} opacity-0 group-hover:opacity-100 transition-opacity`}
                  aria-label="Dismiss"
                >
                  <X className={`w-3 h-3 ${colors.icon}`} />
                </button>
                <div className="flex items-center justify-between gap-2">
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-foreground">{sidebarPromo.title}</p>
                    <p className="text-xs text-muted-foreground">
                      {sidebarPromo.discount && sidebarPromo.code 
                        ? `${sidebarPromo.discount} off with ${sidebarPromo.code}`
                        : sidebarPromo.description}
                    </p>
                  </div>
                  <Sparkles className={`w-5 h-5 ${colors.icon} flex-shrink-0`} />
                </div>
              </div>
            );
          })()}

          {/* Help Center Link */}
          {!collapsed && (
            <div
              onClick={() => navigate("/help")}
              className="mx-2 mb-2 p-3 rounded-lg bg-accent/50 cursor-pointer hover:bg-accent transition-colors block"
            >
              <div className="flex items-center justify-between gap-2">
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-foreground">Help Center</p>
                  <p className="text-xs text-muted-foreground">Guides & tutorials</p>
                </div>
                <BookOpen className="w-5 h-5 text-primary flex-shrink-0" />
              </div>
            </div>
          )}

          {/* Feedback Card - Inside SidebarContent so it scrolls */}
          {!collapsed && (
            <a 
              href="https://quizabl.featurebase.app/" 
              target="_blank" 
              rel="noopener noreferrer"
              className="mx-2 mb-2 p-3 rounded-lg bg-blue-50 dark:bg-blue-950/30 cursor-pointer hover:bg-blue-100 dark:hover:bg-blue-950/50 transition-colors block"
            >
              <div className="flex items-center justify-between gap-2">
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-foreground">Share Feedback</p>
                  <p className="text-xs text-muted-foreground">Help us improve Quizabl</p>
                </div>
                <MessageSquare className="w-5 h-5 text-blue-600 dark:text-blue-400 flex-shrink-0" />
              </div>
            </a>
          )}

        </SidebarContent>

        {/* Account Section at Bottom */}
        <SidebarFooter className="border-t p-2 sticky bottom-0 bg-sidebar z-10 shrink-0 pb-[max(env(safe-area-inset-bottom),0.5rem)]">
          <div className={`flex items-center ${collapsed ? "flex-col gap-1" : "justify-between"}`}>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="h-9 w-9">
                  <Avatar className="w-8 h-8">
                    <AvatarImage src="" />
                    <AvatarFallback className="bg-primary/10 text-primary text-sm">
                      {userEmail?.charAt(0).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="start" side="top" className="w-56">
                <DropdownMenuLabel>
                  <div className="flex flex-col space-y-1">
                    <p className="text-sm font-medium">My Account</p>
                    <p className="text-xs text-muted-foreground truncate">
                      {userEmail}
                    </p>
                  </div>
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => navigate("/settings/profile")}>
                  <User className="w-4 h-4 mr-2" />
                  Profile
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => navigate("/settings/billing")}>
                  <CreditCard className="w-4 h-4 mr-2" />
                  Billing
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => navigate("/settings/account")}>
                  <Settings className="w-4 h-4 mr-2" />
                  Account
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                {isAdmin && <>
                    <DropdownMenuItem onClick={() => navigate("/admin")}>
                      <Shield className="w-4 h-4 mr-2" />
                      Admin Panel
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                  </>}
                <DropdownMenuItem onClick={onSignOut}>
                  <LogOut className="w-4 h-4 mr-2" />
                  Sign Out
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>

            {userId && <NotificationsPopover userId={userId} />}
          </div>
        </SidebarFooter>
      </Sidebar>

      <FolderDialog open={folderDialogOpen} onOpenChange={setFolderDialogOpen} onSave={editingFolder ? handleUpdateFolder : handleCreateFolder} folder={editingFolder} />

      <AlertDialog open={!!deletingFolderId} onOpenChange={() => setDeletingFolderId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Folder?</AlertDialogTitle>
            <AlertDialogDescription>
              This will remove the folder but keep all activities. Activities will be moved to "All Activities".
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteFolder}>Delete</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>;
}