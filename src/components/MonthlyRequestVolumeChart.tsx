"use client";
import React, { useEffect, useState, useMemo } from 'react';
import {
    BarChart,
    Bar,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    Legend,
    ResponsiveContainer,
} from 'recharts';

interface RequestDoc {
    _id: string;
    createdAt?: string;
}

interface DayDatum {
    date: string; // ISO date (yyyy-mm-dd)
    label: string; // e.g. Jul 1
    count: number;
}

const DATE_FORMAT_OPTIONS: Intl.DateTimeFormatOptions = { month: 'short', day: 'numeric' };

export default function MonthlyRequestVolumeChart() {
    const [data, setData] = useState<DayDatum[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | undefined>();

    useEffect(() => {
        let active = true;
        async function load() {
            try {
                const res = await fetch('/api/requests');
                if (!res.ok) throw new Error('Failed to load');
                const raw: RequestDoc[] = await res.json();

                // Build baseline for last 30 days (including today)
                const today = new Date();
                const baseline: Record<string, DayDatum> = {};
                for (let i = 29; i >= 0; i--) {
                    const d = new Date(today);
                    d.setDate(d.getDate() - i);
                    const iso = d.toISOString().slice(0, 10);
                    baseline[iso] = {
                        date: iso,
                        label: d.toLocaleDateString(undefined, DATE_FORMAT_OPTIONS),
                        count: 0,
                    };
                }

                raw.forEach(r => {
                    if (!r.createdAt) return;
                    const created = new Date(r.createdAt);
                    // Only include if within last 30 days window
                    const diffDays = (today.getTime() - created.getTime()) / (1000 * 60 * 60 * 24);
                    if (diffDays <= 29 && diffDays >= 0) {
                        const iso = created.toISOString().slice(0, 10);
                        if (baseline[iso]) baseline[iso].count += 1;
                    }
                });

                const out = Object.values(baseline);
                if (active) {
                    setData(out);
                    setLoading(false);
                }
            } catch (e: any) {
                if (active) {
                    setError(e.message || 'Error');
                    setLoading(false);
                }
            }
        }
        load();
        return () => { active = false; };
    }, []);

    const maxY = useMemo(() => {
        return Math.max(5, ...data.map(d => d.count));
    }, [data]);

    if (loading) {
        return <div className="flex items-center justify-center h-full text-xs text-gray-400">Loading...</div>;
    }
    if (error) {
        return <div className="flex items-center justify-center h-full text-xs text-red-500">{error}</div>;
    }

    // If all zero, show friendly message
    const allZero = data.every(d => d.count === 0);
    if (allZero) {
        return <div className="flex items-center justify-center h-full text-xs text-gray-400">No requests in last 30 days</div>;
    }

    return (
        <div className="h-full">
            <ResponsiveContainer width="100%" height="100%">
                <BarChart data={data} margin={{ top: 40, right: 4, left: 0, bottom: 10 }} barCategoryGap={2}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} />
                    <XAxis dataKey="label" angle={-35} textAnchor="end" interval={3} height={40} tick={{ fontSize: 10 }} />
                    <YAxis allowDecimals={false} domain={[0, maxY]} tick={{ fontSize: 10 }} width={28} />
                    <Tooltip cursor={{ fill: 'rgba(0,0,0,0.05)' }} />
                    <Legend
                        verticalAlign="top"
                        align="center"
                        wrapperStyle={{ top: 0, fontSize: 11 }}
                        iconSize={12}
                        formatter={() => 'Requests per Day'}
                    />
                    <Bar dataKey="count" name="Requests per Day" fill="#d97706" radius={[2, 2, 0, 0]} barSize={10} />
                </BarChart>
            </ResponsiveContainer>
        </div>
    );
}
