"use client";
import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

type Req = {
    _id: string;
    project: string;
    requester: string;
    site: string;
    requestType: string;
    requestDate: string;
    dueDate: string;
    status: string;
    acceptedBy?: string;
    managerFeedback?: string;
};

async function fetchAll(): Promise<Req[]> {
    const res = await fetch('/api/requests', { credentials: 'include' });
    if (!res.ok) throw new Error('Failed');
    return res.json();
}

export default function AdminRequestsPage() {
    const [data, setData] = useState<Req[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [acting, setActing] = useState<string | null>(null);
    const [currentUser, setCurrentUser] = useState<string | null>(null);
    const [role, setRole] = useState<string | null>(null);
    const [justRefreshed, setJustRefreshed] = useState(false);
    const router = useRouter();

    function load() {
        setLoading(true);
        fetchAll()
            .then(d => { setData(d); setError(null); })
            .catch(() => setError('Unable to load'))
            .finally(() => setLoading(false));
    }

    useEffect(() => {
        let mount = true;
        load();
        fetch('/api/auth/me', { credentials: 'include' })
            .then(r => r.ok ? r.json() : {})
            .then((j: any) => { if (mount && j && j.username){ setCurrentUser(j.username); setRole(j.role || null);} });
        return () => { mount = false; };
    }, []);

    // Client-side guard (defense in depth)
    useEffect(() => {
        if (role && role !== 'admin') {
            router.replace('/request-form/index');
        }
    }, [role, router]);

    async function act(id: string, action: 'approve' | 'reject') {
        if (acting) return;
        let feedback: string | undefined;
        if (action === 'reject') {
            feedback = prompt('Reason for rejection?', 'Rejected') || '';
            if (!feedback.trim()) { alert('Rejection feedback is required.'); return; }
        } else if (action === 'approve') {
            const approveInput = prompt('Provide approval note', 'Approved');
            if (!approveInput || !approveInput.trim()) { alert('Approval note is required.'); return; }
            feedback = approveInput;
        }
        try {
            setActing(id + action);
            const body: any = { status: action === 'approve' ? 'Approved' : 'Rejected' };
            if (feedback) body.managerFeedback = feedback.trim();
            const res = await fetch(`/api/requests/${id}`, { method: 'PATCH', credentials: 'include', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
            if (!res.ok) {
                // If 404 but server updated anyway (race), refetch silently
                if (res.status === 404) {
                    load();
                    setJustRefreshed(true);
                    setTimeout(() => setJustRefreshed(false), 3000);
                    return;
                }
                const j = await res.json().catch(() => ({}));
                alert(j.error || 'Action failed');
                return;
            }
            const updated = await res.json();
            setData(prev => prev.map(r => r._id === id ? updated : r));
        } catch {
            alert('Network error');
        } finally {
            setActing(null);
        }
    }

    const isLoggedIn = !!currentUser;

    if (role && role !== 'admin') {
        return <div className="text-black p-6">Redirecting...</div>;
    }

    return (
        <div className="text-black space-y-6">
            <div className="flex items-center gap-3">
                <h1 className="text-xl font-semibold">Admin Request Review</h1>
                <button onClick={load} className="text-sm bg-blue-600 hover:bg-blue-700 text-white px-3 py-1 rounded">Reload</button>
                <Link href="/request-form/index" className="ml-auto bg-purple-600/80 hover:bg-purple-700 text-white px-4 py-2 rounded text-sm font-medium shadow">Request Index</Link>
                <Link href="/request-form" className="bg-blue-700 hover:bg-blue-800 text-white px-4 py-2 rounded text-sm font-medium shadow">Dashboard</Link>
            </div>
            {justRefreshed && <div className="text-xs text-green-700">Data refreshed.</div>}
            {!isLoggedIn && (
                <div className="p-4 border rounded bg-yellow-50 text-sm">You are not logged in — actions disabled.</div>
            )}
            <div className="overflow-x-auto rounded-xl border border-gray-200 shadow-[0_3px_6px_rgba(0,0,0,0.12),0_10px_18px_-4px_rgba(0,0,0,0.18)] bg-white relative">
                <div className="pointer-events-none absolute inset-0 rounded-xl shadow-[inset_0_0_0_1px_rgba(255,255,255,0.6),inset_0_2px_6px_rgba(255,255,255,0.35)]" />
                <table className="w-full text-xs bg-white rounded-xl overflow-hidden">
                    <thead className="bg-blue-500 text-white text-[11px] uppercase tracking-wide">
                        <tr>
                            <th className="p-2 text-left">Project</th>
                            <th className="p-2 text-left">Requester</th>
                            <th className="p-2 text-left">Site</th>
                            <th className="p-2 text-left">Type</th>
                            <th className="p-2 text-left">Request Date</th>
                            <th className="p-2 text-left">Due</th>
                            <th className="p-2 text-left">Status</th>
                            <th className="p-2 text-left">Accepted By</th>
                            <th className="p-2 text-left">Manager Feedback</th>
                            <th className="p-2 text-left">Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {loading && (
                            <tr><td colSpan={10} className="p-6 text-center text-gray-500">Loading...</td></tr>
                        )}
                        {error && !loading && (
                            <tr><td colSpan={10} className="p-6 text-center text-red-600">{error}</td></tr>
                        )}
                        {!loading && !error && data.map(r => (
                            <tr key={r._id} className="border-t border-gray-100 even:bg-gray-50 hover:bg-blue-50 transition-colors">
                                <td className="p-2 font-medium text-gray-800">{r.project}</td>
                                <td className="p-2">{r.requester}</td>
                                <td className="p-2">{r.site}</td>
                                <td className="p-2 whitespace-nowrap">{r.requestType}</td>
                                <td className="p-2 whitespace-nowrap">{r.requestDate?.slice(0, 10)}</td>
                                <td className="p-2 whitespace-nowrap">{r.dueDate?.slice(0, 10)}</td>
                                <td className="p-2">
                                    <span className="px-2 py-1 rounded bg-gray-200 text-gray-800 font-semibold text-[10px] shadow-sm">{r.status}</span>
                                </td>
                                <td className="p-2">{r.acceptedBy || '-'}</td>
                                <td className="p-2 max-w-[180px] truncate" title={r.managerFeedback}>{r.managerFeedback || '-'}</td>
                                <td className="p-2 space-x-2">
                                    {r.status === 'Accepted' && (
                                        <>
                                            <button disabled={!isLoggedIn || acting !== null} onClick={() => act(r._id, 'approve')} className={`px-3 py-1 rounded text-[11px] text-white ${(!isLoggedIn) ? 'bg-indigo-400/50 cursor-not-allowed' : 'bg-indigo-600 hover:bg-indigo-700'} shadow`}>{acting === r._id + 'approve' ? '...' : 'Approve'}</button>
                                            <button disabled={!isLoggedIn || acting !== null} onClick={() => act(r._id, 'reject')} className={`px-3 py-1 rounded text-[11px] text-white ${(!isLoggedIn) ? 'bg-red-400/50 cursor-not-allowed' : 'bg-red-600 hover:bg-red-700'} shadow`}>{acting === r._id + 'reject' ? '...' : 'Reject'}</button>
                                        </>
                                    )}
                                    {r.status === 'Pending' && <span className="text-[10px] text-gray-400">Waiting for assignee</span>}
                                </td>
                            </tr>
                        ))}
                        {!loading && !error && data.length === 0 && (
                            <tr><td colSpan={10} className="p-6 text-center text-gray-500">No requests found</td></tr>
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
}
