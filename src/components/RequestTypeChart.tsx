"use client";
import React, { useEffect, useMemo, useState } from 'react';
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend } from 'recharts';

interface RequestItem { requestType?: string; }

// Baseline list (mirrors process options in form) so zero-count types still render.
const BASELINE_TYPES = [
    'DESIGN PROCESS',
    'CHANGE PROCESS',
    'AUTOMATION PROCESS',
    'PURCHASE PROCESS',
    'HR PROCESS',
    'IT PROCESS',
    'CAE/TESTING/VERIFICATION',
    'GMS'
];

const RequestTypeChart: React.FC = () => {
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
        const counts: Record<string, number> = {};
        for (const r of requests) {
            const key = (r.requestType || '').trim().toUpperCase();
            if (!key) continue;
            counts[key] = (counts[key] || 0) + 1;
        }
        for (const t of BASELINE_TYPES) {
            if (!(t in counts)) counts[t] = 0;
        }
        return Object.entries(counts)
            .map(([type, count]) => ({ type, count }))
            .sort((a, b) => b.count - a.count || a.type.localeCompare(b.type));
    }, [requests]);

    if (loading) return <div className="h-full flex items-center justify-center text-xs text-gray-400">Loading...</div>;
    if (error) return <div className="h-full flex items-center justify-center text-xs text-red-500">{error}</div>;
    if (!data.length) return <div className="h-full flex items-center justify-center text-xs text-gray-400">No request data</div>;

    const max = Math.max(...data.map(d => d.count));
    return (
        <div className="h-full">
            <ResponsiveContainer width="100%" height="100%">
                <BarChart data={data} margin={{ top: 20, right: 10, left: 0, bottom: 25 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                    <XAxis dataKey="type" interval={0} angle={-35} textAnchor="end" height={70} tick={{ fontSize: 10 }} />
                    <YAxis domain={[0, max]} tick={{ fontSize: 10 }} label={{ value: 'Count', angle: -90, position: 'insideLeft', style: { fontSize: 11 } }} />
                    <Tooltip formatter={(v: number | string) => [`${v} requests`, 'Requests']} />
                    <Legend verticalAlign="top" align="center" wrapperStyle={{ fontSize: 11, top: 0 }} formatter={() => 'Request Types'} />
                    <Bar dataKey="count" name="Request Types" fill="#2563eb" radius={[4, 4, 0, 0]} />
                </BarChart>
            </ResponsiveContainer>
        </div>
    );
};

export default RequestTypeChart;
