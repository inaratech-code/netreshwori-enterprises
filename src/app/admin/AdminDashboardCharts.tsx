"use client";

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
import { Eye } from "lucide-react";

interface ChartData {
    visitorsByDate: { date: string; count: number }[];
    busyHours: { hour: string; count: number }[];
    topProducts: { id: string; name: string; views: number }[];
}

export default function AdminDashboardCharts({ chartData }: { chartData: ChartData }) {
    return (
        <>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mt-4">
                <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
                    <h2 className="text-lg font-bold text-slate-900 mb-6">Visitors (Last 30 Days)</h2>
                    <div className="h-72">
                        <ResponsiveContainer width="100%" height="100%">
                            <LineChart data={chartData.visitorsByDate}>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                                <XAxis dataKey="date" tick={{ fontSize: 12 }} tickMargin={10} minTickGap={30} stroke="#94a3b8" />
                                <YAxis tick={{ fontSize: 12 }} stroke="#94a3b8" />
                                <RechartsTooltip
                                    contentStyle={{ borderRadius: "12px", border: "none", boxShadow: "0 4px 6px -1px rgb(0 0 0 / 0.1)" }}
                                />
                                <Line type="monotone" dataKey="count" stroke="#3b82f6" strokeWidth={3} dot={false} activeDot={{ r: 6 }} />
                            </LineChart>
                        </ResponsiveContainer>
                    </div>
                </div>
                <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
                    <h2 className="text-lg font-bold text-slate-900 mb-6">Busy Hours (24H Format)</h2>
                    <div className="h-72">
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={chartData.busyHours}>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                                <XAxis dataKey="hour" tick={{ fontSize: 12 }} tickMargin={10} minTickGap={20} stroke="#94a3b8" />
                                <YAxis tick={{ fontSize: 12 }} stroke="#94a3b8" />
                                <RechartsTooltip
                                    cursor={{ fill: "#f1f5f9" }}
                                    contentStyle={{ borderRadius: "12px", border: "none", boxShadow: "0 4px 6px -1px rgb(0 0 0 / 0.1)" }}
                                />
                                <Bar dataKey="count" fill="#8b5cf6" radius={[4, 4, 0, 0]} />
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                </div>
            </div>
            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden mt-4">
                <div className="p-6 border-b border-slate-100">
                    <h2 className="text-lg font-bold text-slate-900">Top 5 Most Viewed Products</h2>
                </div>
                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="bg-slate-50 text-slate-500 text-sm">
                                <th className="p-4 font-medium">Product Name</th>
                                <th className="p-4 font-medium">Total Views</th>
                            </tr>
                        </thead>
                        <tbody>
                            {chartData.topProducts.length > 0 ? (
                                chartData.topProducts.map((product) => (
                                    <tr key={product.id} className="border-b border-slate-50 hover:bg-slate-50/50 transition-colors">
                                        <td className="p-4 text-slate-900 font-medium">{product.name}</td>
                                        <td className="p-4 text-slate-600">
                                            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-amber-50 text-amber-700 text-sm font-medium">
                                                <Eye className="w-3.5 h-3.5" />
                                                {product.views}
                                            </span>
                                        </td>
                                    </tr>
                                ))
                            ) : (
                                <tr>
                                    <td colSpan={2} className="p-8 text-center text-slate-500">
                                        No product views yet.
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </>
    );
}
