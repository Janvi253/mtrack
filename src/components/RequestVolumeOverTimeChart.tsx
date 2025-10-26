"use client";
import React, { useEffect, useMemo, useState } from 'react';
import { ResponsiveContainer, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip } from 'recharts';

interface RequestItem { requestDate?: string; createdAt?: string; }

// Helper to format YYYY-MM to short label
function monthLabel(ym: string) {
    const [y, m] = ym.split('-');
    const date = new Date(Number(y), Number(m) - 1, 1);
    return date.toLocaleString(undefined, { month: 'short', year: 'numeric' });
}

const RequestVolumeOverTimeChart: React.FC = () => {
    const [requests, setRequests] = useState<RequestItem[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        (async () => {
            try {
                const res = await fetch('/api/requests', { credentials: 'include' });
                if (!res.ok) throw new Error('Failed to load');
                const json = await res.json();
                setRequests(json || []);
            } catch (e) {
                setError((e as Error).message || 'Failed to load');
            } finally { setLoading(false); }
        })();
    }, []);

    const data = useMemo(() => {
        if (!requests.length) return [] as Array<{ month: string; label: string; count: number }>;
        const counts: Record<string, number> = {};
        for (const r of requests) {
            const dateStr = r.requestDate || r.createdAt; // fallback
            if (!dateStr) continue;
            const d = new Date(dateStr);
            if (isNaN(d.getTime())) continue;
            const ym = d.toISOString().slice(0, 7); // YYYY-MM
            counts[ym] = (counts[ym] || 0) + 1;
        }
        const months = Object.keys(counts).sort();
        return months.map(m => ({ month: m, label: monthLabel(m), count: counts[m] }));
    }, [requests]);

    if (loading) return <div className="h-full flex items-center justify-center text-xs text-gray-400">Loading...</div>;
    if (error) return <div className="h-full flex items-center justify-center text-xs text-red-500">{error}</div>;
    if (!data.length) return <div className="h-full flex items-center justify-center text-xs text-gray-400">No request data yet</div>;

    const max = Math.max(...data.map(d => d.count));
    return (
        <div className="h-full">
            <ResponsiveContainer width="100%" height="100%">
                <LineChart data={data} margin={{ top: 40, right: 10, bottom: 0, left: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                    <XAxis dataKey="label" angle={-35} textAnchor="end" height={60} interval={0} tick={{ fontSize: 10 }} />
                    <YAxis tick={{ fontSize: 10 }} domain={[0, max]} label={{ value: 'Count', angle: -90, position: 'insideLeft', style: { fontSize: 11 } }} />
                    <Tooltip formatter={(v: number | string) => [`${v} requests`, 'Requests']} />
                    <Line type="monotone" dataKey="count" stroke="#2563eb" strokeWidth={2} dot={{ r: 3 }} activeDot={{ r: 5 }} />
                </LineChart>
            </ResponsiveContainer>
        </div>
    );
};

export default RequestVolumeOverTimeChart;
