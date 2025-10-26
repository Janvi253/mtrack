"use client";
import React, { useEffect, useState } from 'react';
import { PieChart, Pie, Cell, ResponsiveContainer } from 'recharts';

interface StatusDatum { name: string; value: number; color: string; }
interface RequestItem { status?: string }

// Visualization limited to six core workflow statuses (exclude Rejected & Overdue per user request)
const ORDER: StatusDatum[] = [
    { name: 'Accepted', value: 0, color: '#f97316' }, // orange
    { name: 'Pending', value: 0, color: '#22c55e' }, // green
    { name: 'Approved', value: 0, color: '#ef4444' }, // red
    { name: 'Completed', value: 0, color: '#8b5cf6' }, // purple
    { name: 'In Work', value: 0, color: '#3b82f6' }, // blue
    { name: 'Closed', value: 0, color: '#ea580c' }, // dark orange
];

const RequestStatusChart = () => {
    const [data, setData] = useState<StatusDatum[]>(ORDER);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => { fetchAndAggregate(); }, []);

    async function fetchAndAggregate() {
        try {
            setLoading(true);
            const res = await fetch('/api/requests', { credentials: 'include' });
            if (!res.ok) throw new Error(`Failed (${res.status})`);
            const items: RequestItem[] = await res.json();
            const counts: Record<string, number> = ORDER.reduce((acc, s) => { acc[s.name] = 0; return acc; }, {} as Record<string, number>);
            for (const r of items) {
                const s = (r.status || 'Pending');
                if (counts[s] !== undefined) counts[s] += 1; // ignore statuses not in visualization
            }
            const mapped = ORDER.map(o => ({ ...o, value: counts[o.name] || 0 }));
            setData(mapped);
        } catch (e: any) {
            setError(e.message || 'Failed to load');
        } finally { setLoading(false); }
    }

    // If only a few statuses have values we still show those; legend always shows all.
    const pieData = data.filter(d => d.value > 0);

    return (
        <div className="relative h-full w-full flex flex-col">
            {/* Fixed chart height to reserve space for legend even in constrained card */}
            <div className="h-40">
                {loading ? (
                    <div className="h-full flex items-center justify-center text-xs text-gray-400">Loading...</div>
                ) : error ? (
                    <div className="h-full flex items-center justify-center text-xs text-red-500">{error}</div>
                ) : pieData.length === 0 ? (
                    <div className="h-full flex items-center justify-center text-xs text-gray-400">No data</div>
                ) : (
                    <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                            <Pie
                                data={pieData}
                                dataKey="value"
                                nameKey="name"
                                innerRadius={40}
                                outerRadius={65}
                                paddingAngle={2}
                                stroke="#ffffff"
                                strokeWidth={2}
                                isAnimationActive={false}
                            >
                                {pieData.map((entry) => (
                                    <Cell key={entry.name} fill={entry.color} />
                                ))}
                            </Pie>
                        </PieChart>
                    </ResponsiveContainer>
                )}
            </div>
            {/* Legend / Tags */}
            <div className="mt-3 flex flex-wrap gap-3 text-[10px] leading-tight">
                {data.map(s => (
                    <div key={s.name} className="flex items-center gap-1 select-none">
                        <span className="inline-block h-1.5 w-6 rounded-sm" style={{ background: s.color }} />
                        <span className="font-medium tracking-wide" style={{ color: s.color }}>{s.name}</span>
                    </div>
                ))}
            </div>
        </div>
    );
};

export default RequestStatusChart;
