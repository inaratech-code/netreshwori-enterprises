"use client";

import { useState, useEffect } from "react";
import { Save, Loader2, Store, Type } from "lucide-react";
import toast from "react-hot-toast";
import type { Settings } from "@/lib/admin/types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

const defaultSettings: Settings = {
  businessName: "Netreshwori Enterprises",
  phone: "+9779864320452",
  whatsapp: "+9779864320452",
  email: "contact@netreshwori.com",
  address: "Kathmandu, Nepal",
  heroTitle: "Premium Tiles for Your Dream Space",
  heroSubtitle: "Discover our exclusive collection of high-quality tiles and sanitary ware.",
  googleMapLink: "",
  facebook: "",
  instagram: "",
};

export default function SettingsPage() {
  const [formData, setFormData] = useState<Settings>(defaultSettings);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    async function load() {
      try {
        const { getSettings } = await import("@/lib/admin/firestore");
        const data = await getSettings();
        if (data) setFormData({ ...defaultSettings, ...data });
      } catch {
        toast.error("Failed to load settings");
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      const { setSettings } = await import("@/lib/admin/firestore");
      await setSettings(formData);
      toast.success("Settings saved");
    } catch {
      toast.error("Failed to save");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-10 w-10 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Settings</h1>
        <p className="text-muted-foreground">Business details and website content.</p>
      </div>

      <form onSubmit={handleSave} className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Store className="h-5 w-5" /> Business Details
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="md:col-span-2 space-y-2">
                <Label htmlFor="businessName">Business Name</Label>
                <Input id="businessName" name="businessName" value={formData.businessName} onChange={handleChange} required />
              </div>
              <div className="space-y-2">
                <Label htmlFor="phone">Phone</Label>
                <Input id="phone" name="phone" value={formData.phone} onChange={handleChange} required />
              </div>
              <div className="space-y-2">
                <Label htmlFor="whatsapp">WhatsApp</Label>
                <Input id="whatsapp" name="whatsapp" value={formData.whatsapp} onChange={handleChange} required />
              </div>
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input id="email" name="email" type="email" value={formData.email} onChange={handleChange} required />
              </div>
              <div className="md:col-span-2 space-y-2">
                <Label htmlFor="address">Address</Label>
                <Input id="address" name="address" value={formData.address} onChange={handleChange} required />
              </div>
              <div className="md:col-span-2 space-y-2">
                <Label htmlFor="googleMapLink">Google Map Link</Label>
                <Input id="googleMapLink" name="googleMapLink" value={formData.googleMapLink ?? ""} onChange={handleChange} placeholder="https://maps.google.com/..." />
              </div>
              <div className="space-y-2">
                <Label htmlFor="facebook">Facebook URL</Label>
                <Input id="facebook" name="facebook" value={formData.facebook ?? ""} onChange={handleChange} placeholder="https://facebook.com/..." />
              </div>
              <div className="space-y-2">
                <Label htmlFor="instagram">Instagram URL</Label>
                <Input id="instagram" name="instagram" value={formData.instagram ?? ""} onChange={handleChange} placeholder="https://instagram.com/..." />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Type className="h-5 w-5" /> Website Content
            </CardTitle>
            <p className="text-sm text-muted-foreground">Hero section on the homepage.</p>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="heroTitle">Hero Title</Label>
              <Input id="heroTitle" name="heroTitle" value={formData.heroTitle} onChange={handleChange} required />
            </div>
            <div className="space-y-2">
              <Label htmlFor="heroSubtitle">Hero Subtitle</Label>
              <Textarea id="heroSubtitle" name="heroSubtitle" value={formData.heroSubtitle} onChange={handleChange} rows={3} required />
            </div>
          </CardContent>
        </Card>

        <div className="flex justify-end">
          <Button type="submit" disabled={saving}>
            {saving ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Save className="h-4 w-4 mr-2" />}
            Save Settings
          </Button>
        </div>
      </form>
    </div>
  );
}
