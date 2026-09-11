import { useState, useEffect } from "react";
import { AdminLayout } from "@/components/admin/AdminLayout";
import { DataTable } from "@/components/admin/DataTable";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
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
import { Checkbox } from "@/components/ui/checkbox";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Plus, Pencil, Trash2, Copy, Sparkles } from "lucide-react";
import { format } from "date-fns";

interface Promotion {
  id: string;
  title: string;
  description: string;
  code: string | null;
  discount: string | null;
  expiry_date: string | null;
  is_active: boolean;
  display_locations: string[];
  theme_color: string;
  created_at: string;
  updated_at: string;
}

const DISPLAY_LOCATIONS = [
  { value: "dashboard_banner", label: "Dashboard Banner" },
  { value: "sidebar", label: "Dashboard Sidebar" },
  { value: "pricing", label: "Pricing Page" },
  { value: "upgrade", label: "Upgrade Page" },
];

const THEME_COLORS = [
  { value: "amber", label: "Amber (Gold)", className: "bg-amber-500" },
  { value: "green", label: "Green", className: "bg-green-500" },
  { value: "blue", label: "Blue", className: "bg-blue-500" },
  { value: "purple", label: "Purple", className: "bg-purple-500" },
  { value: "red", label: "Red", className: "bg-red-500" },
  { value: "pink", label: "Pink", className: "bg-pink-500" },
];

export default function Promotions() {
  const [promotions, setPromotions] = useState<Promotion[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [editingPromotion, setEditingPromotion] = useState<Promotion | null>(null);
  const [deletingPromotion, setDeletingPromotion] = useState<Promotion | null>(null);
  const [saving, setSaving] = useState(false);

  const [formData, setFormData] = useState({
    title: "",
    description: "",
    code: "",
    discount: "",
    expiry_date: "",
    is_active: true,
    display_locations: ["dashboard_banner"] as string[],
    theme_color: "amber",
  });

  useEffect(() => {
    fetchPromotions();
  }, []);

  const fetchPromotions = async () => {
    try {
      const { data, error } = await supabase
        .from("promotions")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) throw error;
      setPromotions(data || []);
    } catch (error) {
      console.error("Error fetching promotions:", error);
      toast.error("Failed to load promotions");
    } finally {
      setLoading(false);
    }
  };

  const openCreateDialog = () => {
    setEditingPromotion(null);
    setFormData({
      title: "",
      description: "",
      code: "",
      discount: "",
      expiry_date: "",
      is_active: true,
      display_locations: ["dashboard_banner"],
      theme_color: "amber",
    });
    setDialogOpen(true);
  };

  const openEditDialog = (promotion: Promotion) => {
    setEditingPromotion(promotion);
    setFormData({
      title: promotion.title,
      description: promotion.description,
      code: promotion.code || "",
      discount: promotion.discount || "",
      expiry_date: promotion.expiry_date 
        ? format(new Date(promotion.expiry_date), "yyyy-MM-dd'T'HH:mm")
        : "",
      is_active: promotion.is_active,
      display_locations: promotion.display_locations || ["dashboard_banner"],
      theme_color: promotion.theme_color || "amber",
    });
    setDialogOpen(true);
  };

  const handleSave = async () => {
    if (!formData.title || !formData.description) {
      toast.error("Title and description are required");
      return;
    }

    setSaving(true);
    try {
      const payload = {
        title: formData.title,
        description: formData.description,
        code: formData.code || null,
        discount: formData.discount || null,
        expiry_date: formData.expiry_date ? new Date(formData.expiry_date).toISOString() : null,
        is_active: formData.is_active,
        display_locations: formData.display_locations,
        theme_color: formData.theme_color,
      };

      if (editingPromotion) {
        const { error } = await supabase
          .from("promotions")
          .update(payload)
          .eq("id", editingPromotion.id);

        if (error) throw error;
        toast.success("Promotion updated successfully");
      } else {
        const { error } = await supabase
          .from("promotions")
          .insert(payload);

        if (error) throw error;
        toast.success("Promotion created successfully");
      }

      setDialogOpen(false);
      fetchPromotions();
    } catch (error) {
      console.error("Error saving promotion:", error);
      toast.error("Failed to save promotion");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!deletingPromotion) return;

    try {
      const { error } = await supabase
        .from("promotions")
        .delete()
        .eq("id", deletingPromotion.id);

      if (error) throw error;
      toast.success("Promotion deleted successfully");
      setDeleteDialogOpen(false);
      setDeletingPromotion(null);
      fetchPromotions();
    } catch (error) {
      console.error("Error deleting promotion:", error);
      toast.error("Failed to delete promotion");
    }
  };

  const toggleActive = async (promotion: Promotion) => {
    try {
      const { error } = await supabase
        .from("promotions")
        .update({ is_active: !promotion.is_active })
        .eq("id", promotion.id);

      if (error) throw error;
      toast.success(`Promotion ${promotion.is_active ? "disabled" : "enabled"}`);
      fetchPromotions();
    } catch (error) {
      console.error("Error toggling promotion:", error);
      toast.error("Failed to update promotion");
    }
  };

  const copyCode = async (code: string) => {
    try {
      await navigator.clipboard.writeText(code);
      toast.success("Code copied to clipboard");
    } catch {
      toast.error("Failed to copy code");
    }
  };

  const toggleLocation = (location: string) => {
    setFormData(prev => ({
      ...prev,
      display_locations: prev.display_locations.includes(location)
        ? prev.display_locations.filter(l => l !== location)
        : [...prev.display_locations, location],
    }));
  };

  const columns = [
    {
      header: "Status",
      accessor: "is_active" as keyof Promotion,
      cell: (promotion: Promotion) => (
        <Switch
          checked={promotion.is_active}
          onCheckedChange={() => toggleActive(promotion)}
        />
      ),
    },
    {
      header: "Title",
      accessor: "title" as keyof Promotion,
      cell: (promotion: Promotion) => (
        <div className="flex items-center gap-2">
          <div
            className={`w-3 h-3 rounded-full bg-${promotion.theme_color}-500`}
            style={{
              backgroundColor: 
                promotion.theme_color === "amber" ? "#f59e0b" :
                promotion.theme_color === "green" ? "#22c55e" :
                promotion.theme_color === "blue" ? "#3b82f6" :
                promotion.theme_color === "purple" ? "#a855f7" :
                promotion.theme_color === "red" ? "#ef4444" :
                promotion.theme_color === "pink" ? "#ec4899" : "#f59e0b"
            }}
          />
          <span className="font-medium">{promotion.title}</span>
        </div>
      ),
    },
    {
      header: "Code",
      accessor: "code" as keyof Promotion,
      cell: (promotion: Promotion) => 
        promotion.code ? (
          <div className="flex items-center gap-2">
            <code className="px-2 py-1 bg-muted rounded text-sm font-mono">
              {promotion.code}
            </code>
            <Button
              variant="ghost"
              size="sm"
              className="h-6 w-6 p-0"
              onClick={() => copyCode(promotion.code!)}
            >
              <Copy className="h-3 w-3" />
            </Button>
          </div>
        ) : (
          <span className="text-muted-foreground">—</span>
        ),
    },
    {
      header: "Discount",
      accessor: "discount" as keyof Promotion,
      cell: (promotion: Promotion) => 
        promotion.discount ? (
          <Badge variant="secondary">{promotion.discount}</Badge>
        ) : (
          <span className="text-muted-foreground">—</span>
        ),
    },
    {
      header: "Locations",
      accessor: "display_locations" as keyof Promotion,
      cell: (promotion: Promotion) => (
        <div className="flex flex-wrap gap-1">
          {promotion.display_locations?.map(loc => (
            <Badge key={loc} variant="outline" className="text-xs">
              {DISPLAY_LOCATIONS.find(l => l.value === loc)?.label || loc}
            </Badge>
          ))}
        </div>
      ),
    },
    {
      header: "Expires",
      accessor: "expiry_date" as keyof Promotion,
      cell: (promotion: Promotion) => 
        promotion.expiry_date ? (
          <span className={new Date(promotion.expiry_date) < new Date() ? "text-destructive" : ""}>
            {format(new Date(promotion.expiry_date), "MMM d, yyyy")}
          </span>
        ) : (
          <span className="text-muted-foreground">Never</span>
        ),
    },
    {
      header: "Actions",
      accessor: "id" as keyof Promotion,
      cell: (promotion: Promotion) => (
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => openEditDialog(promotion)}
          >
            <Pencil className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => {
              setDeletingPromotion(promotion);
              setDeleteDialogOpen(true);
            }}
          >
            <Trash2 className="h-4 w-4 text-destructive" />
          </Button>
        </div>
      ),
    },
  ];

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">Promotions</h1>
            <p className="text-muted-foreground">
              Manage promotional banners and discount codes
            </p>
          </div>
          <Button onClick={openCreateDialog}>
            <Plus className="h-4 w-4 mr-2" />
            Create Promotion
          </Button>
        </div>

        <DataTable
          columns={columns}
          data={promotions}
          isLoading={loading}
        />

        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogContent className="max-w-lg">
            <DialogHeader>
              <DialogTitle>
                {editingPromotion ? "Edit Promotion" : "Create Promotion"}
              </DialogTitle>
              <DialogDescription>
                {editingPromotion 
                  ? "Update the promotion details below."
                  : "Create a new promotional banner or discount."}
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="title">Title *</Label>
                <Input
                  id="title"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  placeholder="e.g., Black Friday Deal"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">Description *</Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="e.g., Get 20% off lifetime access!"
                  rows={2}
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="code">Promo Code</Label>
                  <Input
                    id="code"
                    value={formData.code}
                    onChange={(e) => setFormData({ ...formData, code: e.target.value.toUpperCase() })}
                    placeholder="e.g., BLACKFRIDAY"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="discount">Discount</Label>
                  <Input
                    id="discount"
                    value={formData.discount}
                    onChange={(e) => setFormData({ ...formData, discount: e.target.value })}
                    placeholder="e.g., 20%"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="expiry_date">Expiry Date</Label>
                  <Input
                    id="expiry_date"
                    type="datetime-local"
                    value={formData.expiry_date}
                    onChange={(e) => setFormData({ ...formData, expiry_date: e.target.value })}
                  />
                </div>

                <div className="space-y-2">
                  <Label>Theme Color</Label>
                  <Select
                    value={formData.theme_color}
                    onValueChange={(value) => setFormData({ ...formData, theme_color: value })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {THEME_COLORS.map(color => (
                        <SelectItem key={color.value} value={color.value}>
                          <div className="flex items-center gap-2">
                            <div className={`w-3 h-3 rounded-full ${color.className}`} />
                            {color.label}
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-2">
                <Label>Display Locations</Label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {DISPLAY_LOCATIONS.map(location => (
                    <div key={location.value} className="flex items-center space-x-2">
                      <Checkbox
                        id={location.value}
                        checked={formData.display_locations.includes(location.value)}
                        onCheckedChange={() => toggleLocation(location.value)}
                      />
                      <label
                        htmlFor={location.value}
                        className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                      >
                        {location.label}
                      </label>
                    </div>
                  ))}
                </div>
              </div>

              <div className="flex items-center space-x-2">
                <Switch
                  id="is_active"
                  checked={formData.is_active}
                  onCheckedChange={(checked) => setFormData({ ...formData, is_active: checked })}
                />
                <Label htmlFor="is_active">Active</Label>
              </div>

              {/* Preview */}
              {formData.title && (
                <div className="space-y-2">
                  <Label>Preview</Label>
                  <div 
                    className="rounded-lg border p-3"
                    style={{
                      backgroundColor: 
                        formData.theme_color === "amber" ? "rgba(245, 158, 11, 0.1)" :
                        formData.theme_color === "green" ? "rgba(34, 197, 94, 0.1)" :
                        formData.theme_color === "blue" ? "rgba(59, 130, 246, 0.1)" :
                        formData.theme_color === "purple" ? "rgba(168, 85, 247, 0.1)" :
                        formData.theme_color === "red" ? "rgba(239, 68, 68, 0.1)" :
                        formData.theme_color === "pink" ? "rgba(236, 72, 153, 0.1)" : "rgba(245, 158, 11, 0.1)"
                    }}
                  >
                    <div className="flex items-center gap-2">
                      <Sparkles 
                        className="w-4 h-4" 
                        style={{
                          color: 
                            formData.theme_color === "amber" ? "#f59e0b" :
                            formData.theme_color === "green" ? "#22c55e" :
                            formData.theme_color === "blue" ? "#3b82f6" :
                            formData.theme_color === "purple" ? "#a855f7" :
                            formData.theme_color === "red" ? "#ef4444" :
                            formData.theme_color === "pink" ? "#ec4899" : "#f59e0b"
                        }}
                      />
                      <span className="font-medium text-sm">{formData.title}</span>
                      {formData.discount && (
                        <Badge variant="secondary">{formData.discount}</Badge>
                      )}
                    </div>
                    <p className="text-sm text-muted-foreground mt-1">{formData.description}</p>
                    {formData.code && (
                      <code className="text-xs mt-2 inline-block px-2 py-1 bg-background rounded">
                        {formData.code}
                      </code>
                    )}
                  </div>
                </div>
              )}
            </div>

            <DialogFooter>
              <Button variant="outline" onClick={() => setDialogOpen(false)}>
                Cancel
              </Button>
              <Button onClick={handleSave} disabled={saving}>
                {saving ? "Saving..." : editingPromotion ? "Update" : "Create"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Delete Promotion</AlertDialogTitle>
              <AlertDialogDescription>
                Are you sure you want to delete "{deletingPromotion?.title}"? This action cannot be undone.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction onClick={handleDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
                Delete
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </AdminLayout>
  );
}
