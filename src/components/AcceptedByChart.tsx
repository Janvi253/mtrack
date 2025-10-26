"use client";
import React, { useEffect, useMemo, useState } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

interface RequestItem { approvedBy?: string; status: string; }
interface UserItem { username: string; name: string; role: string; }

const AcceptedByChart: React.FC = () => {
    const [requests, setRequests] = useState<RequestItem[]>([]);
    const [users, setUsers] = useState<UserItem[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        (async () => {
            try {
                const [reqRes, userRes] = await Promise.all([
                    fetch('/api/requests', { credentials: 'include' }),
                    fetch('/api/users', { credentials: 'include' })
                ]);
                if (!reqRes.ok) throw new Error('Failed to load requests');
                if (!userRes.ok) throw new Error('Failed to load users');
                const reqJson = await reqRes.json();
                const userJson = await userRes.json();
                setRequests(reqJson);
                setUsers(userJson);
            } catch (e: any) {
                setError(e.message || 'Failed to load');
            } finally { setLoading(false); }
        })();
    }, []);

    const data = useMemo(() => {
        const adminMap = new Map(users.filter(u => u.role === 'admin').map(u => [u.username, u.name || u.username]));
        const counts: Record<string, number> = {};
        for (const r of requests) {
            if ((r.status === 'Approved' || r.status === 'Completed' || r.status === 'Closed') && r.approvedBy) {
                if (adminMap.has(r.approvedBy)) {
                    counts[r.approvedBy] = (counts[r.approvedBy] || 0) + 1;
                }
            }
        }
        const rows = Object.entries(counts).map(([username, value]) => ({ name: adminMap.get(username) || username, value }));
        rows.sort((a, b) => b.value - a.value);
        return rows;
    }, [requests, users]);

    if (loading) return <div className="h-full flex items-center justify-center text-xs text-gray-400">Loading...</div>;
    if (error) return <div className="h-full flex items-center justify-center text-xs text-red-500">{error}</div>;
    if (!data.length) return <div className="h-full flex items-center justify-center text-xs text-gray-400">No approved requests yet</div>;

    return (
        <div className="h-full">
            <ResponsiveContainer width="100%" height="100%">
                <BarChart data={data} margin={{ top: 10, right: 10, left: 0, bottom: 50 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                    <XAxis dataKey="name" interval={0} angle={-35} textAnchor="end" height={60} tick={{ fontSize: 10 }} />
                    <YAxis tick={{ fontSize: 10 }} />
                    <Tooltip formatter={(v: any) => [`${v} approvals`, 'Approved']} />
                    <Bar dataKey="value" name="Approved" fill="#3b82f6" radius={[4, 4, 0, 0]} />
                </BarChart>
            </ResponsiveContainer>
        </div>
    );
};

export default AcceptedByChart;
