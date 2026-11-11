import React, { useState, useEffect, useMemo } from "react";
import {
  Pill,
  Plus,
  Edit2,
  Trash2,
  Search,
  Filter,
  AlertCircle,
  CheckCircle2,
  RefreshCw,
  Tag
} from "lucide-react";
import { adminApi } from "@/lib/api";
import DataTable from "@/components/DataTable";
import StatusBadge from "@/components/StatusBadge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from "@/components/ui/select";
import { toast } from "sonner";

export default function MedicinesPage() {
  const [medicines, setMedicines] = useState([]);
  const [categories, setCategories] = useState([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(true);

  // Filters
  const [categoryFilter, setCategoryFilter] = useState("ALL");
  const [prescriptionFilter, setPrescriptionFilter] = useState("ALL");
  const [searchQuery, setSearchQuery] = useState("");

  // Create / Edit modal state
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingMedicine, setEditingMedicine] = useState(null);
  const [saving, setSaving] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    brand: "",
    generic_name: "",
    category: "General",
    price: "",
    discount_price: "",
    stock: "50",
    requires_prescription: false,
    dosage_form: "Tablet",
    strength: "",
    manufacturer: ""
  });

  // Delete modal state
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [medicineToDelete, setMedicineToDelete] = useState(null);
  const [deleting, setDeleting] = useState(false);

  const fetchMedicines = async () => {
    try {
      setLoading(true);
      const res = await adminApi.getMedicines({
        page,
        limit: 10,
        category: categoryFilter !== "ALL" ? categoryFilter : undefined,
        prescription: prescriptionFilter !== "ALL" ? prescriptionFilter : undefined,
        search: searchQuery || undefined
      });
      setMedicines(res.medicines || []);
      setTotal(res.total || 0);
      setTotalPages(res.totalPages || 1);
      if (res.categories) setCategories(res.categories);
    } catch (err) {
      console.error("Fetch medicines error:", err);
      toast.error("Failed to load medicine catalog");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMedicines();
  }, [page, categoryFilter, prescriptionFilter, searchQuery]);

  const openCreateDialog = () => {
    setEditingMedicine(null);
    setFormData({
      name: "",
      brand: "",
      generic_name: "",
      category: "General",
      price: "",
      discount_price: "",
      stock: "50",
      requires_prescription: false,
      dosage_form: "Tablet",
      strength: "",
      manufacturer: ""
    });
    setDialogOpen(true);
  };

  const openEditDialog = (med) => {
    setEditingMedicine(med);
    setFormData({
      name: med.name || "",
      brand: med.brand || "",
      generic_name: med.generic_name || "",
      category: med.category || "General",
      price: String(med.price ?? ""),
      discount_price: med.discount_price ? String(med.discount_price) : "",
      stock: String(med.stock ?? 0),
      requires_prescription: Boolean(med.requires_prescription),
      dosage_form: med.dosage_form || "Tablet",
      strength: med.strength || "",
      manufacturer: med.manufacturer || ""
    });
    setDialogOpen(true);
  };

  const handleSaveMedicine = async (e) => {
    e.preventDefault();
    if (!formData.name || !formData.price) {
      toast.error("Medicine name and price are required");
      return;
    }

    try {
      setSaving(true);
      if (editingMedicine) {
        await adminApi.updateMedicine(editingMedicine._id, formData);
        toast.success("Medicine updated successfully");
      } else {
        await adminApi.createMedicine(formData);
        toast.success("Medicine added to catalog");
      }
      setDialogOpen(false);
      fetchMedicines();
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to save medicine");
    } finally {
      setSaving(false);
    }
  };

  const confirmDelete = (med) => {
    setMedicineToDelete(med);
    setDeleteConfirmOpen(true);
  };

  const handleDelete = async () => {
    if (!medicineToDelete) return;
    try {
      setDeleting(true);
      await adminApi.deleteMedicine(medicineToDelete._id);
      toast.success("Medicine removed from catalog");
      setDeleteConfirmOpen(false);
      fetchMedicines();
    } catch (err) {
      toast.error("Failed to delete medicine");
    } finally {
      setDeleting(false);
    }
  };

  const columns = useMemo(
    () => [
      {
        header: "Medicine & Brand",
        cell: ({ row }) => (
          <div>
            <div className="font-semibold text-xs text-foreground">{row.original.name}</div>
            <div className="text-[11px] text-muted-foreground">
              {row.original.brand ? `${row.original.brand} • ` : ""}
              {row.original.dosage_form || "Formulation"}
            </div>
          </div>
        )
      },
      {
        header: "Category",
        accessorKey: "category",
        cell: ({ row }) => (
          <span className="inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-md bg-muted text-muted-foreground font-medium">
            <Tag className="h-3 w-3" />
            {row.original.category || "General"}
          </span>
        )
      },
      {
        header: "Price / Discount",
        cell: ({ row }) => (
          <div className="text-xs tabular-nums">
            <span className="font-bold text-foreground">₹{row.original.price?.toFixed(2)}</span>
            {row.original.discount_price && (
              <span className="ml-1.5 text-[11px] text-emerald-600 dark:text-emerald-400 font-medium">
                (₹{row.original.discount_price.toFixed(2)})
              </span>
            )}
          </div>
        )
      },
      {
        header: "Stock Level",
        accessorKey: "stock",
        cell: ({ row }) => {
          const s = row.original.stock || 0;
          return (
            <div className="flex items-center gap-1.5">
              <span
                className={`text-xs font-semibold tabular-nums px-2 py-0.5 rounded ${
                  s <= 0
                    ? "bg-rose-500/10 text-rose-600 dark:text-rose-400"
                    : s < 15
                    ? "bg-amber-500/10 text-amber-600 dark:text-amber-400"
                    : "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400"
                }`}
              >
                {s} in stock
              </span>
            </div>
          );
        }
      },
      {
        header: "Rx Policy",
        accessorKey: "requires_prescription",
        cell: ({ row }) =>
          row.original.requires_prescription ? (
            <span className="text-[11px] font-bold text-rose-600 dark:text-rose-400 bg-rose-500/10 px-2 py-0.5 rounded border border-rose-500/20">
              Rx Required
            </span>
          ) : (
            <span className="text-[11px] text-muted-foreground bg-muted px-2 py-0.5 rounded">
              OTC
            </span>
          )
      },
      {
        id: "actions",
        header: "Actions",
        cell: ({ row }) => (
          <div className="flex items-center gap-1">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => openEditDialog(row.original)}
              className="h-7 w-7 text-muted-foreground hover:text-foreground"
              title="Edit medicine"
            >
              <Edit2 className="h-3.5 w-3.5" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => confirmDelete(row.original)}
              className="h-7 w-7 text-muted-foreground hover:text-destructive"
              title="Delete medicine"
            >
              <Trash2 className="h-3.5 w-3.5" />
            </Button>
          </div>
        )
      }
    ],
    []
  );

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-border">
        <div>
          <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-foreground">
            Medicine Catalog
          </h2>
          <p className="text-xs sm:text-sm text-muted-foreground mt-0.5">
            Administer pharmaceutical inventory, pricing, prescription policies, and stock levels.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={fetchMedicines}
            disabled={loading}
            className="h-8 px-2.5 text-xs gap-1.5"
          >
            <RefreshCw className={`h-3 w-3 ${loading ? "animate-spin text-primary" : ""}`} />
            Refresh
          </Button>

          <Button size="sm" onClick={openCreateDialog} className="h-8 px-3 text-xs gap-1.5 font-medium">
            <Plus className="h-3.5 w-3.5" />
            Add Medicine
          </Button>
        </div>
      </div>

      {/* Filter Row */}
      <div className="flex flex-wrap items-center gap-2.5">
        <Select value={categoryFilter} onValueChange={(val) => { setCategoryFilter(val); setPage(1); }}>
          <SelectTrigger className="w-[160px] h-8 text-xs">
            <SelectValue placeholder="All Categories" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="ALL">All Categories</SelectItem>
            {categories.map((c) => (
              <SelectItem key={c} value={c}>{c}</SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select value={prescriptionFilter} onValueChange={(val) => { setPrescriptionFilter(val); setPage(1); }}>
          <SelectTrigger className="w-[150px] h-8 text-xs">
            <SelectValue placeholder="All Types" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="ALL">All Types</SelectItem>
            <SelectItem value="true">Rx Required</SelectItem>
            <SelectItem value="false">Over The Counter</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* TanStack Medicines Table */}
      <DataTable
        columns={columns}
        data={medicines}
        loading={loading}
        page={page}
        pageCount={totalPages}
        onPageChange={setPage}
        searchQuery={searchQuery}
        onSearchChange={(q) => {
          setSearchQuery(q);
          setPage(1);
        }}
        searchPlaceholder="Search medicine, generic formula, brand..."
        exportFileName="medszop_catalog.csv"
      />

      {/* Create / Edit Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <form onSubmit={handleSaveMedicine}>
            <DialogHeader>
              <DialogTitle className="text-base font-bold flex items-center gap-2">
                <Pill className="h-4 w-4 text-primary" />
                {editingMedicine ? "Edit Medicine" : "Add New Medicine to Catalog"}
              </DialogTitle>
              <DialogDescription className="text-xs text-muted-foreground">
                Set clinical formulation, pricing, and stock metrics.
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-3.5 py-4 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <Label className="text-xs">Medicine Name *</Label>
                  <Input
                    required
                    placeholder="e.g. Paracetamol 500mg"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="h-8 text-xs"
                  />
                </div>
                <div className="space-y-1">
                  <Label className="text-xs">Brand Name</Label>
                  <Input
                    placeholder="e.g. Crocin, Dolo"
                    value={formData.brand}
                    onChange={(e) => setFormData({ ...formData, brand: e.target.value })}
                    className="h-8 text-xs"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <Label className="text-xs">Generic Formula</Label>
                  <Input
                    placeholder="e.g. Acetaminophen"
                    value={formData.generic_name}
                    onChange={(e) => setFormData({ ...formData, generic_name: e.target.value })}
                    className="h-8 text-xs"
                  />
                </div>
                <div className="space-y-1">
                  <Label className="text-xs">Category</Label>
                  <Input
                    placeholder="e.g. Pain Relief, Antibiotics"
                    value={formData.category}
                    onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                    className="h-8 text-xs"
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div className="space-y-1">
                  <Label className="text-xs">MRP Price (₹) *</Label>
                  <Input
                    required
                    type="number"
                    step="0.01"
                    placeholder="0.00"
                    value={formData.price}
                    onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                    className="h-8 text-xs"
                  />
                </div>
                <div className="space-y-1">
                  <Label className="text-xs">Discount Price (₹)</Label>
                  <Input
                    type="number"
                    step="0.01"
                    placeholder="Optional"
                    value={formData.discount_price}
                    onChange={(e) => setFormData({ ...formData, discount_price: e.target.value })}
                    className="h-8 text-xs"
                  />
                </div>
                <div className="space-y-1">
                  <Label className="text-xs">Initial Stock *</Label>
                  <Input
                    required
                    type="number"
                    value={formData.stock}
                    onChange={(e) => setFormData({ ...formData, stock: e.target.value })}
                    className="h-8 text-xs"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <Label className="text-xs">Form / Dosage</Label>
                  <Input
                    placeholder="e.g. Tablet, Syrup, Capsule"
                    value={formData.dosage_form}
                    onChange={(e) => setFormData({ ...formData, dosage_form: e.target.value })}
                    className="h-8 text-xs"
                  />
                </div>
                <div className="space-y-1">
                  <Label className="text-xs">Manufacturer</Label>
                  <Input
                    placeholder="e.g. Cipla, Sun Pharma"
                    value={formData.manufacturer}
                    onChange={(e) => setFormData({ ...formData, manufacturer: e.target.value })}
                    className="h-8 text-xs"
                  />
                </div>
              </div>

              <div className="flex items-center gap-2 pt-2">
                <input
                  type="checkbox"
                  id="rxCheckbox"
                  checked={formData.requires_prescription}
                  onChange={(e) => setFormData({ ...formData, requires_prescription: e.target.checked })}
                  className="rounded border-border text-primary focus:ring-primary h-4 w-4"
                />
                <label htmlFor="rxCheckbox" className="text-xs font-medium text-foreground cursor-pointer">
                  Requires Valid Doctor Prescription (Schedule H / H1 / X)
                </label>
              </div>
            </div>

            <DialogFooter className="gap-2 sm:gap-0">
              <Button type="button" variant="outline" size="sm" onClick={() => setDialogOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" size="sm" disabled={saving}>
                {saving ? "Saving..." : editingMedicine ? "Update Medicine" : "Create Medicine"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteConfirmOpen} onOpenChange={setDeleteConfirmOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="text-base font-bold text-destructive flex items-center gap-2">
              <AlertCircle className="h-5 w-5" />
              Remove Medicine from Catalog
            </DialogTitle>
            <DialogDescription className="text-xs text-muted-foreground">
              Are you sure you want to remove <span className="font-semibold text-foreground">{medicineToDelete?.name}</span>? This action is audited and irreversible.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-2 sm:gap-0 mt-4">
            <Button variant="outline" size="sm" onClick={() => setDeleteConfirmOpen(false)}>
              Cancel
            </Button>
            <Button variant="destructive" size="sm" onClick={handleDelete} disabled={deleting}>
              {deleting ? "Removing..." : "Confirm Removal"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

