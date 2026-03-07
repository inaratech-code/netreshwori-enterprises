"use client";

import { useState, useEffect } from "react";
import dynamic from "next/dynamic";
import Link from "next/link";
import { Users, Eye, MessageSquare, Calendar, Package, Building2, Star, Plus, ImageIcon, Inbox } from "lucide-react";
import { collection, query, where, limit, getDocs, getDoc, doc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { getBrands } from "@/lib/admin/firestore";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";

const AdminDashboardCharts = dynamic(() => import("./AdminDashboardCharts"), { ssr: false });

interface Stats {
  totalProducts: number;
  totalBrands: number;
  totalVisitors: number;
  todayVisitors: number;
  totalViews: number;
  totalInquiries: number;
  featuredProducts: number;
}

interface ChartData {
  visitorsByDate: { date: string; count: number }[];
  busyHours: { hour: string; count: number }[];
  topProducts: { id: string; name: string; views: number }[];
}

export default function AdminDashboardPage() {
  const [stats, setStats] = useState<Stats>({
    totalProducts: 0,
    totalBrands: 0,
    totalVisitors: 0,
    todayVisitors: 0,
    totalViews: 0,
    totalInquiries: 0,
    featuredProducts: 0,
  });
  const [chartData, setChartData] = useState<ChartData>({
    visitorsByDate: [],
    busyHours: Array.from({ length: 24 }).map((_, i) => ({ hour: `${i}:00`, count: 0 })),
    topProducts: [],
  });
  const [loading, setLoading] = useState(true);
  const [chartsReady, setChartsReady] = useState(false);

  useEffect(() => {
    let cancelled = false;

    async function phase1QuickStats() {
      try {
        const [inquiriesSnapshot, productsSnapshot, brandsList] = await Promise.all([
          getDocs(query(collection(db, "inquiries"), limit(500))),
          getDocs(query(collection(db, "products"), limit(500))),
          getBrands(),
        ]);
        if (cancelled) return;
        let featuredCount = 0;
        productsSnapshot.forEach((d) => {
          if (d.data().featured) featuredCount++;
        });
        setStats((s) => ({
          ...s,
          totalProducts: productsSnapshot.size,
          totalBrands: brandsList.length,
          totalInquiries: inquiriesSnapshot.size,
          featuredProducts: featuredCount,
        }));
        setLoading(false);
      } catch (e) {
        if (!cancelled) setLoading(false);
        console.error(e);
      }
    }

    async function phase2Analytics() {
      try {
        const now = new Date();
        const thirtyDaysAgo = new Date();
        thirtyDaysAgo.setDate(now.getDate() - 30);
        const thirtyDaysAgoDateStr = thirtyDaysAgo.toISOString().split("T")[0];
        const todayDateStr = now.toISOString().split("T")[0];

        const eventsSnapshot = await getDocs(
          query(
            collection(db, "analytics_events"),
            where("date", ">=", thirtyDaysAgoDateStr),
            limit(2000)
          )
        );
        if (cancelled) return;

        let totalVisitors = 0;
        let todayVisitors = 0;
        let totalViews = 0;
        const visitorsMap: Record<string, number> = {};
        const hoursMap: Record<string, number> = {};
        const productViewsMap: Record<string, number> = {};

        for (let i = 29; i >= 0; i--) {
          const d = new Date();
          d.setDate(now.getDate() - i);
          visitorsMap[d.toISOString().split("T")[0]] = 0;
        }
        for (let i = 0; i < 24; i++) hoursMap[`${i}:00`] = 0;

        eventsSnapshot.forEach((docSnap) => {
          const data = docSnap.data();
          if (data.type === "page_view") {
            totalVisitors++;
            if (data.date === todayDateStr) todayVisitors++;
            if (visitorsMap[data.date] !== undefined) visitorsMap[data.date]++;
            hoursMap[`${data.hour}:00`]++;
          } else if (data.type === "product_view") {
            totalViews++;
            if (data.productId) productViewsMap[data.productId] = (productViewsMap[data.productId] || 0) + 1;
          }
        });

        const topProductEntries = Object.entries(productViewsMap)
          .sort((a, b) => b[1] - a[1])
          .slice(0, 5);
        let topProducts: { id: string; name: string; views: number }[] = [];
        if (topProductEntries.length > 0) {
          const productNames: Record<string, string> = {};
          await Promise.all(
            topProductEntries.map(([id]) =>
              getDoc(doc(db, "products", id)).then((snap) => {
                if (snap.exists()) productNames[id] = snap.data().name || "Unknown";
              })
            )
          );
          topProducts = topProductEntries.map(([id, views]) => ({
            id,
            name: productNames[id] || `Product ${id.slice(0, 6)}`,
            views,
          }));
        }

        if (cancelled) return;
        setStats((s) => ({
          ...s,
          totalVisitors,
          todayVisitors,
          totalViews,
        }));
        setChartData({
          visitorsByDate: Object.entries(visitorsMap).map(([date, count]) => ({ date, count })),
          busyHours: Object.entries(hoursMap).map(([hour, count]) => ({ hour, count })),
          topProducts,
        });
        setChartsReady(true);
      } catch (e) {
        if (!cancelled) setChartsReady(true);
        console.error(e);
      }
    }

    phase1QuickStats();
    phase2Analytics();
    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
        <p className="text-muted-foreground">Overview of your store and analytics.</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-6 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Total Products</CardTitle>
            <Package className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {loading ? <Skeleton className="h-8 w-16" /> : <p className="text-2xl font-bold">{stats.totalProducts}</p>}
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Total Brands</CardTitle>
            <Building2 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {loading ? <Skeleton className="h-8 w-16" /> : <p className="text-2xl font-bold">{stats.totalBrands}</p>}
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Visitors (30d)</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {loading ? <Skeleton className="h-8 w-16" /> : <p className="text-2xl font-bold">{stats.totalVisitors}</p>}
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Today</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {loading ? <Skeleton className="h-8 w-16" /> : <p className="text-2xl font-bold">{stats.todayVisitors}</p>}
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Product Views</CardTitle>
            <Eye className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {loading ? <Skeleton className="h-8 w-16" /> : <p className="text-2xl font-bold">{stats.totalViews}</p>}
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Inquiries</CardTitle>
            <MessageSquare className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {loading ? <Skeleton className="h-8 w-16" /> : <p className="text-2xl font-bold">{stats.totalInquiries}</p>}
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Star className="h-5 w-5" /> Featured Products
            </CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? <Skeleton className="h-9 w-12" /> : <p className="text-3xl font-bold">{stats.featuredProducts}</p>}
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Quick Actions</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-wrap gap-2">
              <Button asChild>
                <Link href="/admin/products">
                  <Plus className="h-4 w-4 mr-2" /> Add Product
                </Link>
              </Button>
              <Button variant="outline" asChild>
                <Link href="/admin/brands">
                  <Building2 className="h-4 w-4 mr-2" /> Add Brand
                </Link>
              </Button>
              <Button variant="outline" asChild>
                <Link href="/admin/media">
                  <ImageIcon className="h-4 w-4 mr-2" /> Upload Media
                </Link>
              </Button>
              <Button variant="outline" asChild>
                <Link href="/admin/inquiries">
                  <Inbox className="h-4 w-4 mr-2" /> View Inquiries
                </Link>
              </Button>
            </CardContent>
        </Card>
      </div>

      {!chartsReady ? (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <Card><CardContent className="h-80 p-6 space-y-4"><Skeleton className="h-full w-full rounded-lg" /></CardContent></Card>
          <Card><CardContent className="h-80 p-6 space-y-4"><Skeleton className="h-full w-full rounded-lg" /></CardContent></Card>
        </div>
      ) : (
        <AdminDashboardCharts chartData={chartData} />
      )}
    </div>
  );
}
