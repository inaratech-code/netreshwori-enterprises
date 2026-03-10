"use client";

import { useState, useEffect } from "react";
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as RechartsTooltip,
  ResponsiveContainer,
} from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Eye, Users } from "lucide-react";
import toast from "react-hot-toast";

function getDateRange(days: number) {
  const to = new Date();
  const from = new Date();
  from.setDate(from.getDate() - days);
  return {
    from: from.toISOString().split("T")[0],
    to: to.toISOString().split("T")[0],
  };
}

export default function AdminAnalyticsPage() {
  const [visitorsByDate, setVisitorsByDate] = useState<{ date: string; count: number }[]>([]);
  const [busyHours, setBusyHours] = useState<{ hour: string; count: number }[]>([]);
  const [topProducts, setTopProducts] = useState<{ id: string; name: string; views: number }[]>([]);
  const [totalVisitors, setTotalVisitors] = useState(0);
  const [totalViews, setTotalViews] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      setLoading(true);
      try {
        const { getAnalyticsEvents, getProduct } = await import("@/lib/admin/firestore");
        const { from, to } = getDateRange(30);
        const events = await getAnalyticsEvents(from, to);
        const visitorsMap: Record<string, number> = {};
        const hoursMap: Record<string, number> = {};
        let totalV = 0;
        let totalPv = 0;
        const productViews: Record<string, number> = {};

        for (let i = 29; i >= 0; i--) {
          const d = new Date();
          d.setDate(d.getDate() - i);
          visitorsMap[d.toISOString().split("T")[0]] = 0;
        }
        for (let i = 0; i < 24; i++) {
          hoursMap[`${i}:00`] = 0;
        }

        const dateStr = (e: { date?: unknown }) => (typeof e.date === "string" ? e.date : "");
        const hourNum = (e: { hour?: unknown }) =>
          typeof e.hour === "number" && e.hour >= 0 && e.hour < 24 ? e.hour : null;

        events.forEach((e) => {
          if (e.type === "page_view") {
            totalV++;
            const d = dateStr(e);
            if (d && visitorsMap[d] !== undefined) visitorsMap[d]++;
            const h = hourNum(e);
            if (h !== null) hoursMap[`${h}:00`]++;
          } else if (e.type === "product_view") {
            totalPv++;
            if (e.productId) productViews[e.productId] = (productViews[e.productId] || 0) + 1;
          }
        });

        setTotalVisitors(totalV);
        setTotalViews(totalPv);
        setVisitorsByDate(
          Object.entries(visitorsMap)
            .map(([date, count]) => ({ date, count }))
            .sort((a, b) => a.date.localeCompare(b.date))
            .map(({ date, count }) => ({ date: date.slice(5), count }))
        );
        setBusyHours(
          Object.entries(hoursMap)
            .map(([hour, count]) => ({ hour, count }))
            .sort((a, b) => parseInt(a.hour, 10) - parseInt(b.hour, 10))
        );

        const top = Object.entries(productViews)
          .sort((a, b) => b[1] - a[1])
          .slice(0, 10);
        const withNames = await Promise.all(
          top.map(async ([id, views]) => {
            const p = await getProduct(id);
            return { id, name: p?.name ?? id.slice(0, 8), views };
          })
        );
        setTopProducts(withNames);
      } catch (e) {
        console.error(e);
        toast.error("Analytics unavailable (permissions).");
        setVisitorsByDate([]);
        setBusyHours([]);
        setTopProducts([]);
        setTotalVisitors(0);
        setTotalViews(0);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Analytics</h1>
        <p className="text-muted-foreground">Website traffic and product views (last 30 days).</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Total Visitors</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{loading ? "—" : totalVisitors}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Product Views</CardTitle>
            <Eye className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{loading ? "—" : totalViews}</p>
          </CardContent>
        </Card>
      </div>

      {loading ? (
        <Card><CardContent className="h-72 flex items-center justify-center">Loading...</CardContent></Card>
      ) : (
        <>
          <Card>
            <CardHeader>
              <CardTitle>Visitors by Day</CardTitle>
              <p className="text-sm text-muted-foreground">Last 30 days</p>
            </CardHeader>
            <CardContent>
              <div className="h-72">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={visitorsByDate}>
                    <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                    <XAxis dataKey="date" tick={{ fontSize: 12 }} />
                    <YAxis tick={{ fontSize: 12 }} />
                    <RechartsTooltip />
                    <Line type="monotone" dataKey="count" stroke="hsl(var(--primary))" strokeWidth={2} dot={false} />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Busy Hours</CardTitle>
              <p className="text-sm text-muted-foreground">Visits by hour (24h)</p>
            </CardHeader>
            <CardContent>
              <div className="h-72">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={busyHours}>
                    <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                    <XAxis dataKey="hour" tick={{ fontSize: 12 }} />
                    <YAxis tick={{ fontSize: 12 }} />
                    <RechartsTooltip />
                    <Bar dataKey="count" fill="hsl(var(--chart-2))" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Top Viewed Products</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {topProducts.length === 0 ? (
                  <p className="text-muted-foreground py-4">No product views yet.</p>
                ) : (
                  topProducts.map((p) => (
                    <div
                      key={p.id}
                      className="flex items-center justify-between py-2 border-b border-border last:border-0"
                    >
                      <span className="font-medium">{p.name}</span>
                      <span className="text-muted-foreground flex items-center gap-1">
                        <Eye className="h-4 w-4" /> {p.views}
                      </span>
                    </div>
                  ))
                )}
              </div>
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
}
