"use client";
import React, { useEffect, useMemo, useState } from 'react';
import { ResponsiveContainer, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar, Tooltip, Legend } from 'recharts';

interface RequestItem { project?: string; }

// Baseline list derived from request form <select> options so even zero-count projects appear.
// Keep in sync with /request-form/new/page.tsx project select.
const BASELINE_PROJECTS = [
    'BMW-XNF-SW',
    'SW Competence-UA',
    'Smart BU',
    'Internal',
    'R&D Initiative',
    'Customer Support'
];

const RequestsByProjectChart: React.FC = () => {
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
            const key = (r.project || '').trim() || '(Unspecified)';
            counts[key] = (counts[key] || 0) + 1;
        }
        // Ensure every baseline project appears
        for (const p of BASELINE_PROJECTS) {
            if (!(p in counts)) counts[p] = 0;
        }
        // Also ensure '(Unspecified)' appears if there are requests without a project
        if (Object.keys(counts).every(k => k !== '(Unspecified)') && requests.some(r => !r.project)) {
            counts['(Unspecified)'] = 0; // explicit zero if none counted
        }
        return Object.entries(counts)
            .map(([project, count]) => ({ project, count }))
            .sort((a,b) => b.count - a.count || a.project.localeCompare(b.project));
    }, [requests]);

    if (loading) return <div className="h-full flex items-center justify-center text-xs text-gray-400">Loading...</div>;
    if (error) return <div className="h-full flex items-center justify-center text-xs text-red-500">{error}</div>;
        if (!data.length) {
                // Even with no requests, show a zero-only radar for baseline
                const emptyData = BASELINE_PROJECTS.map(p => ({ project: p, count: 0 }));
                return (
                    <div className="h-full">
                        <ResponsiveContainer width="100%" height="100%">
                            <RadarChart data={emptyData} margin={{ top: 70, right: 10, bottom: 10, left: 10 }}>
                                <PolarGrid stroke="#e5e7eb" />
                                <PolarAngleAxis dataKey="project" tick={{ fontSize: 10 }} />
                                <PolarRadiusAxis angle={90} domain={[0, 1]} tick={{ fontSize: 10 }} />
                                <Legend verticalAlign="top" align="center" wrapperStyle={{ fontSize: 11, top: 0 }} formatter={() => 'Project Requests'} />
                                <Radar name="Project Requests" dataKey="count" stroke="#2563eb" fill="#3b82f6" fillOpacity={0.4} />
                            </RadarChart>
                        </ResponsiveContainer>
                        <div className="mt-1 text-[10px] text-gray-400">No requests yet – showing configured project list.</div>
                    </div>
                );
        }

    // Determine max for radius axis
    const maxRaw = Math.max(...data.map(d => d.count));
    const max = Math.max(1, maxRaw); // ensure at least 1 for visible radius

    return (
        <div className="h-full">
            <ResponsiveContainer width="100%" height="100%">
                <RadarChart data={data} margin={{ top: 70, right: 10, bottom: 10, left: 10 }}>
                    <PolarGrid stroke="#e5e7eb" />
                    <PolarAngleAxis dataKey="project" tick={{ fontSize: 10 }} />
                    <PolarRadiusAxis angle={90} domain={[0, max]} tick={{ fontSize: 10 }} />
                    <Tooltip formatter={(v: number | string) => [`${v} requests`, 'Requests']} />
                    <Legend verticalAlign="top" align="center" wrapperStyle={{ fontSize: 11, top: 0 }} formatter={() => 'Project Requests'} />
                    <Radar name="Project Requests" dataKey="count" stroke="#2563eb" fill="#3b82f6" fillOpacity={0.55} />
                </RadarChart>
            </ResponsiveContainer>
        </div>
    );
};

export default RequestsByProjectChart;
