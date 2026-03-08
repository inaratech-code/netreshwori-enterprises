"use client";

import { useState, useEffect, useRef } from "react";
import { Building2, Plus, Edit2, Trash2, Search, Loader2 } from "lucide-react";
import toast from "react-hot-toast";
import { useAdminCache } from "../AdminCacheContext";
import { getBrands, createBrand, updateBrand, deleteBrand, getProductCountsByBrandIds } from "@/lib/admin/firestore";
import { uploadFile, brandLogoPath } from "@/lib/admin/storage";
import type { Brand } from "@/lib/admin/types";
import { DEALERSHIP_PARTNERS } from "@/data/partners";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";

export default function AdminBrandsPage() {
  const cache = useAdminCache();
  const [brands, setBrands] = useState<Brand[]>(() => cache.get<Brand[]>("brands") ?? []);
  const [loading, setLoading] = useState(!cache.get<Brand[]>("brands"));
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [uploading, setUploading] = useState(false);
  const [productCounts, setProductCounts] = useState<Record<string, number>>({});
  const initialLoad = useRef(true);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [form, setForm] = useState<Partial<Brand>>({
    id: "",
    name: "",
    logo: "",
    description: "",
    status: "active",
  });

  useEffect(() => {
    if (!initialLoad.current) return;
    initialLoad.current = false;
    fetchBrands(!cache.get<Brand[]>("brands"));
  // eslint-disable-next-line react-hooks/exhaustive-deps -- intentional mount-only with cache
  }, []);

  const fetchBrands = async (showLoading = true) => {
    if (showLoading) setLoading(true);
    try {
      let list = await getBrands();
      const inconBrand = list.find((b) => b.name.toLowerCase().trim() === "incon ceremic");
      if (inconBrand) {
        await deleteBrand(inconBrand.id);
        list = list.filter((b) => b.id !== inconBrand.id);
        cache.invalidate("brands");
      }
      setBrands(list);
      cache.set("brands", list);
      if (list.length > 0) {
        const counts = await getProductCountsByBrandIds(list.map((b) => b.id));
        setProductCounts(counts);
      } else {
        setProductCounts({});
      }
    } catch {
      toast.error("Failed to load brands");
    } finally {
      setLoading(false);
    }
  };

  const handleLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    try {
      const url = await uploadFile(brandLogoPath(file.name), file);
      setForm((prev) => ({ ...prev, logo: url }));
      toast.success("Logo uploaded");
    } catch {
      toast.error("Upload failed");
    } finally {
      setUploading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name?.trim()) {
      toast.error("Brand name is required");
      return;
    }
    const partnerLogo = DEALERSHIP_PARTNERS.find(
      (p) => p.name.toLowerCase().trim() === form.name?.toLowerCase().trim()
    )?.logo;
    const logoToSave = form.logo || partnerLogo || "";
    const toastId = toast.loading(form.id ? "Updating..." : "Creating...");
    try {
      if (form.id) {
        await updateBrand(form.id, {
          name: form.name.trim(),
          logo: logoToSave,
          description: form.description || "",
          status: form.status || "active",
        });
        toast.success("Brand updated", { id: toastId });
      } else {
        await createBrand({
          name: form.name.trim(),
          logo: logoToSave,
          description: form.description || "",
          status: form.status || "active",
        });
        toast.success("Brand created", { id: toastId });
      }
      cache.invalidate("brands");
      fetchBrands(false);
      resetForm();
      setIsModalOpen(false);
    } catch {
      toast.error("Failed to save", { id: toastId });
    }
  };

  const handleDelete = async () => {
    if (!deleteId) return;
    const toastId = toast.loading("Deleting...");
    try {
      await deleteBrand(deleteId);
      toast.success("Brand deleted", { id: toastId });
      cache.invalidate("brands");
      fetchBrands(false);
      setDeleteId(null);
    } catch {
      toast.error("Failed to delete", { id: toastId });
    }
  };

  const resetForm = () => {
    setForm({
      id: "",
      name: "",
      logo: "",
      description: "",
      status: "active",
    });
  };

  const filtered = brands.filter(
    (b) =>
      b.name.toLowerCase().trim() !== "incon ceremic" &&
      (b.name.toLowerCase().includes(search.toLowerCase()) ||
        (b.description || "").toLowerCase().includes(search.toLowerCase()))
  );

  const existingBrandNames = new Set(brands.map((b) => b.name.toLowerCase().trim()));
  const partnersNotInBrands = DEALERSHIP_PARTNERS.filter(
    (p) => !existingBrandNames.has(p.name.toLowerCase().trim())
  );

  /** For display: use name and logo from partners folder when this brand matches a partner. */
  const getDisplayBrand = (brand: Brand) => {
    const partner = DEALERSHIP_PARTNERS.find(
      (p) => p.name.toLowerCase().trim() === brand.name.toLowerCase().trim()
    );
    return {
      name: partner?.name ?? brand.name,
      logo: partner?.logo ?? brand.logo,
    };
  };

  const addPartnerAsBrand = async (partner: { name: string; logo: string }) => {
    const toastId = toast.loading("Adding brand...");
    try {
      await createBrand({
        name: partner.name,
        logo: partner.logo,
        description: "",
        status: "active",
      });
      toast.success("Brand added", { id: toastId });
      cache.invalidate("brands");
      fetchBrands(false);
    } catch {
      toast.error("Failed to add brand", { id: toastId });
    }
  };

  const fillFormFromPartner = (partner: { name: string; logo: string }) => {
    setForm((prev) => ({ ...prev, name: partner.name, logo: partner.logo }));
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Brands</h1>
        <p className="text-muted-foreground">Manage tile brands and logos.</p>
      </div>

      {partnersNotInBrands.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Partners (from folder)</CardTitle>
            <p className="text-sm text-muted-foreground">
              Add these as brands using name and logo from <code className="text-xs bg-muted px-1 rounded">public/partners</code>.
            </p>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-3">
              {partnersNotInBrands.map((partner) => (
                <div
                  key={partner.name}
                  className="flex items-center gap-3 rounded-lg border p-3 bg-muted/30"
                >
                  {/* eslint-disable-next-line @next/next/no-img-element -- partner logo from public/partners */}
                  <img
                    src={partner.logo}
                    alt={partner.name}
                    className="h-10 w-10 object-contain rounded border bg-white"
                  />
                  <span className="font-medium text-sm">{partner.name}</span>
                  <Button
                    size="sm"
                    onClick={() => addPartnerAsBrand(partner)}
                  >
                    <Plus className="h-4 w-4 mr-1" /> Add as brand
                  </Button>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <div className="flex items-center gap-4 flex-1">
            <div className="relative flex-1 max-w-sm">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search brands..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-9"
              />
            </div>
            <Button onClick={() => { resetForm(); setIsModalOpen(true); }}>
              <Plus className="h-4 w-4 mr-2" />
              Add Brand
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Logo</TableHead>
                  <TableHead>Name</TableHead>
                  <TableHead>Products</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="w-[120px]">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.map((brand) => {
                  const display = getDisplayBrand(brand);
                  return (
                    <TableRow key={brand.id}>
                    <TableCell>
                      {display.logo ? (
                        // eslint-disable-next-line @next/next/no-img-element -- from partners folder or Firebase
                        <img
                          src={display.logo}
                          alt={display.name}
                          className="h-12 w-12 object-contain rounded border"
                        />
                      ) : (
                        <div className="h-12 w-12 rounded border bg-muted flex items-center justify-center">
                          <Building2 className="h-6 w-6 text-muted-foreground" />
                        </div>
                      )}
                    </TableCell>
                    <TableCell className="font-medium">{display.name}</TableCell>
                    <TableCell className="text-muted-foreground tabular-nums">
                      {productCounts[brand.id] ?? 0}
                    </TableCell>
                    <TableCell>
                      <Badge variant={brand.status === "active" ? "default" : "secondary"}>
                        {brand.status}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-2">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => {
                            setForm({ ...brand });
                            setIsModalOpen(true);
                          }}
                        >
                          <Edit2 className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="text-destructive hover:text-destructive"
                          onClick={() => setDeleteId(brand.id)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          )}
          {!loading && filtered.length === 0 && (
            <p className="text-center py-8 text-muted-foreground">No brands found.</p>
          )}
        </CardContent>
      </Card>

      {/* Add/Edit Modal – black & white only */}
      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent className="sm:max-w-md border-border bg-card text-card-foreground">
          <DialogHeader>
            <DialogTitle className="text-card-foreground">{form.id ? "Edit Brand" : "Add Brand"}</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            {!form.id && (
              <div className="space-y-2">
                <Label className="text-foreground">Use name & logo from partner</Label>
                <select
                  className="w-full border border-border rounded-md px-3 py-2 text-sm bg-background text-foreground"
                  value=""
                  onChange={(e) => {
                    const name = e.target.value;
                    const partner = DEALERSHIP_PARTNERS.find((p) => p.name === name);
                    if (partner) fillFormFromPartner(partner);
                  }}
                >
                  <option value="">— Select partner —</option>
                  {DEALERSHIP_PARTNERS.map((p) => (
                    <option key={p.name} value={p.name}>{p.name}</option>
                  ))}
                </select>
              </div>
            )}
            {(() => {
              const partnerForForm = DEALERSHIP_PARTNERS.find(
                (p) => p.name.toLowerCase().trim() === (form.name ?? "").toLowerCase().trim()
              );
              const displayLogo = form.logo || partnerForForm?.logo;
              return (
            <div className="space-y-2">
              <Label className="text-foreground">Logo</Label>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={handleLogoUpload}
              />
              <div className="flex items-center gap-4">
                {displayLogo ? (
                  // eslint-disable-next-line @next/next/no-img-element -- from form or partners folder
                  <img src={displayLogo} alt="" className="h-20 w-20 object-contain rounded border" />
                ) : (
                  <div className="h-20 w-20 rounded border bg-muted flex items-center justify-center">
                    <Building2 className="h-10 w-10 text-muted-foreground" />
                  </div>
                )}
                <Button
                  type="button"
                  variant="outline"
                  disabled={uploading}
                  onClick={() => fileInputRef.current?.click()}
                  className="border-border text-foreground hover:bg-muted hover:text-foreground"
                >
                  {uploading ? <Loader2 className="h-4 w-4 animate-spin" /> : "Upload"}
                </Button>
              </div>
            </div>
            );
            })()}
            <div className="space-y-2">
              <Label htmlFor="brand-name" className="text-foreground">Brand Name *</Label>
              <Input
                id="brand-name"
                value={form.name ?? ""}
                onChange={(e) => setForm((p) => ({ ...p, name: e.target.value }))}
                placeholder="e.g. Kajaria"
                className="border-border bg-background text-foreground placeholder:text-muted-foreground"
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="brand-desc" className="text-foreground">Description</Label>
              <Textarea
                id="brand-desc"
                value={form.description ?? ""}
                onChange={(e) => setForm((p) => ({ ...p, description: e.target.value }))}
                placeholder="Short description"
                rows={3}
                className="border-border bg-background text-foreground placeholder:text-muted-foreground"
              />
            </div>
            <div className="flex gap-2">
              <Label className="text-foreground">Status</Label>
              <select
                value={form.status ?? "active"}
                onChange={(e) => setForm((p) => ({ ...p, status: e.target.value as "active" | "inactive" }))}
                className="border border-border rounded-md px-3 py-2 text-sm bg-background text-foreground"
              >
                <option value="active">Active</option>
                <option value="inactive">Inactive</option>
              </select>
            </div>
            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => setIsModalOpen(false)}
                className="border-border text-foreground hover:bg-muted hover:text-foreground"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                className="bg-foreground text-primary-foreground hover:bg-foreground/90"
              >
                {form.id ? "Update" : "Create"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Delete confirmation – black & white only */}
      <Dialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
        <DialogContent className="border-border bg-card text-card-foreground">
          <DialogHeader>
            <DialogTitle className="text-card-foreground">Delete Brand</DialogTitle>
            <p className="text-sm text-muted-foreground">
              This cannot be undone. Products linked to this brand will keep the reference.
            </p>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setDeleteId(null)}
              className="border-border text-foreground hover:bg-muted hover:text-foreground"
            >
              Cancel
            </Button>
            <Button
              onClick={handleDelete}
              className="bg-foreground text-primary-foreground hover:bg-foreground/90"
            >
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
