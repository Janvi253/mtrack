"use client";
import React, { useEffect, useMemo, useState } from 'react';

export type RequestRecord = {
  _id: string;
  project: string;
  requester: string;
  site: string;
  requestType: string;
  requestDate: string;
  dueDate: string;
  status: 'Pending' | 'In Work' | 'Accepted' | 'Rejected' | 'Approved' | 'Completed' | 'Closed' | 'Overdue';
  approvedDate?: string;
  approvedBy?: string;
  acceptedBy?: string;
  delegatedTo?: string;
  delegatedCompleted?: string;
  managerFeedback?: string;
};

async function fetchRequests(): Promise<RequestRecord[]> {
  const res = await fetch('/api/requests', { credentials: 'include' });
  if (!res.ok) return [];
  return res.json();
}

const statusColors: Record<RequestRecord['status'], string> = {
  'Pending': 'bg-yellow-200 text-yellow-900',
  'In Work': 'bg-blue-200 text-blue-900',
  'Accepted': 'bg-green-200 text-green-900',
  'Rejected': 'bg-red-200 text-red-900',
  'Approved': 'bg-indigo-200 text-indigo-900',
  'Completed': 'bg-emerald-200 text-emerald-900',
  'Closed': 'bg-gray-300 text-gray-900',
  'Overdue': 'bg-red-300 text-red-900'
};

export default function RequestIndexTable() {
  const [delegatedFilter, setDelegatedFilter] = useState<string>('All Delegates');
  const [statuses, setStatuses] = useState<RequestRecord['status'][]>([]);
  const [from, setFrom] = useState('');
  const [to, setTo] = useState('');
  const [search, setSearch] = useState('');
  const [data, setData] = useState<RequestRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentUser, setCurrentUser] = useState<string | null>(null);
  const [role, setRole] = useState<string | null>(null);
  const [actingId, setActingId] = useState<string | null>(null);

  function load() {
    setLoading(true);
    fetchRequests()
      .then(d => { setData(d); setError(null); })
      .catch(()=> setError('Failed to load requests'))
      .finally(()=> setLoading(false));
  }

  useEffect(() => { load(); }, []);
  useEffect(() => {
    (async () => {
      try {
        const res = await fetch('/api/auth/me', { credentials: 'include' });
        if (!res.ok) return;
        const j = await res.json();
        if (j?.username) { setCurrentUser(j.username); setRole(j.role || 'user'); }
      } catch {/* ignore */}
    })();
  }, []);

  function toggleStatus(s: RequestRecord['status']) {
    setStatuses(prev => prev.includes(s) ? prev.filter(x => x !== s) : [...prev, s]);
  }

  const filtered = useMemo(() => {
    return data.filter(r => {
      if (delegatedFilter !== 'All Delegates' && r.delegatedTo !== delegatedFilter) return false;
      if (statuses.length && !statuses.includes(r.status)) return false;
      if (from && r.requestDate < from) return false;
      if (to && r.requestDate > to) return false;
      if (search && !(`${r.project} ${r.requester} ${r._id}`.toLowerCase().includes(search.toLowerCase()))) return false;
      return true;
    });
  }, [data, delegatedFilter, statuses, from, to, search]);

  const delegates = Array.from(new Set(['All Delegates', ...data.map(m => m.delegatedTo || '').filter(Boolean)]));

  async function act(id: string, status: string) {
    if (actingId) return;
    try {
      setActingId(id+status);
      let body: any = { status };
      if (status === 'Rejected') {
        const reason = prompt('Reason for rejection?', 'Rejected');
        if (!reason || !reason.trim()) { setActingId(null); return; }
        body.managerFeedback = reason.trim();
      }
      const res = await fetch(`/api/requests/${id}`, { method: 'PATCH', credentials: 'include', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
      if (!res.ok) { const j = await res.json().catch(()=>({})); alert(j.error || 'Action failed'); return; }
      const updated = await res.json();
      setData(prev => prev.map(r => r._id === id ? updated : r));
    } catch { alert('Network error'); } finally { setActingId(null); }
  }

  const isAssignee = (r: RequestRecord) => currentUser && r.delegatedTo === currentUser;
  const canAcceptReject = (r: RequestRecord) => r.status === 'Pending' && isAssignee(r);
  const canMarkComplete = (r: RequestRecord) => r.status === 'Approved' && isAssignee(r);

  return (
    <div className="space-y-3">
      {/* Filters (container simplified) */}
      <div className="text-sm">
        <div className="flex flex-wrap gap-4 items-end">
          <div className="flex flex-col">
            <label className="text-[11px] font-medium uppercase tracking-wide">Delegated To</label>
            <select value={delegatedFilter} onChange={e=>setDelegatedFilter(e.target.value)} className="border rounded px-2 py-1 text-sm bg-white focus:bg-blue-50 border-amber-200 transition">
              {delegates.map(d => <option key={d}>{d}</option>)}
            </select>
          </div>
          <div className="flex flex-col min-w-[220px]">
            <label className="text-[11px] font-medium uppercase tracking-wide mb-1">Status</label>
            <div className="flex flex-wrap gap-1">
              {Object.keys(statusColors).map(s => {
                const stat = s as RequestRecord['status'];
                const active = statuses.includes(stat);
                return (
                  <button type="button" key={s} onClick={()=>toggleStatus(stat)} className={`text-[11px] border px-2 py-1 rounded transition ${active ? 'bg-blue-700 text-white border-blue-700 shadow' : 'bg-white/80 hover:bg-blue-50 border-amber-200'}`}>{s}</button>
                );
              })}
            </div>
          </div>
          <div className="flex flex-col">
            <label className="text-[11px] font-medium uppercase tracking-wide">From</label>
            <input type="date" value={from} onChange={e=>setFrom(e.target.value)} className="border rounded px-2 py-1 text-sm bg-white focus:bg-blue-50 border-amber-200 transition" />
          </div>
          <div className="flex flex-col">
            <label className="text-[11px] font-medium uppercase tracking-wide">To</label>
            <input type="date" value={to} onChange={e=>setTo(e.target.value)} className="border rounded px-2 py-1 text-sm bg-white focus:bg-blue-50 border-amber-200 transition" />
          </div>
            <div className="flex flex-col">
              <label className="text-[11px] font-medium uppercase tracking-wide">Search</label>
              <input placeholder="Project / Requester / ID" value={search} onChange={e=>setSearch(e.target.value)} className="border rounded px-2 py-1 text-sm bg-white focus:bg-blue-50 border-amber-200 transition" />
            </div>
            <button type="button" onClick={()=>{setStatuses([]);setFrom('');setTo('');setDelegatedFilter('All Delegates');setSearch('');}} className="ml-auto bg-amber-200/70 hover:bg-amber-300 text-xs px-3 py-1 rounded shadow-inner">Clear</button>
            <button type="button" onClick={load} className="bg-blue-700 hover:bg-blue-800 text-white text-xs px-3 py-1 rounded shadow">Refresh</button>
        </div>
      </div>

      {/* Table */}
      <div className="overflow-x-auto min-h-[240px] rounded-xl border border-gray-200 shadow-[0_3px_6px_rgba(0,0,0,0.12),0_10px_18px_-4px_rgba(0,0,0,0.18)] bg-white relative">
        <div className="pointer-events-none absolute inset-0 rounded-xl shadow-[inset_0_0_0_1px_rgba(255,255,255,0.6),inset_0_2px_6px_rgba(255,255,255,0.35)]" />
        {loading && (
          <div className="absolute inset-0 flex items-center justify-center text-sm text-gray-500">Loading requests...</div>
        )}
        {error && !loading && (
          <div className="absolute inset-0 flex items-center justify-center text-sm text-red-600">{error}</div>
        )}
        <table className="w-full text-xs bg-white rounded-xl overflow-hidden">
          <thead className="bg-blue-500 text-white text-[11px] uppercase tracking-wide">
            <tr>
              <th className="p-2 text-left">Project</th>
              <th className="p-2 text-left">Requester</th>
              <th className="p-2 text-left">Site</th>
              <th className="p-2 text-left">Request Type</th>
              <th className="p-2 text-left">Request Date</th>
              <th className="p-2 text-left">Due Date</th>
              <th className="p-2 text-left">Status</th>
              <th className="p-2 text-left">Closed Date</th>
              <th className="p-2 text-left">Approve Date</th>
              <th className="p-2 text-left">Approved By</th>
              <th className="p-2 text-left">Accepted/Rejected</th>
              <th className="p-2 text-left">Delegated Completed</th>
              <th className="p-2 text-left">Manager Feedback</th>
              <th className="p-2 text-left">Action</th>
            </tr>
          </thead>
          <tbody>
            {!loading && !error && filtered.map(r => {
              const closedDate = r.status === 'Completed' || r.status === 'Closed' ? r.approvedDate || r.dueDate : '';
              return (
                <tr key={r._id} className="border-t border-gray-100 even:bg-gray-50 hover:bg-blue-50 transition-colors">
                  <td className="p-2 font-medium text-gray-800">{r.project}</td>
                  <td className="p-2">{r.requester}</td>
                  <td className="p-2">{r.site}</td>
                  <td className="p-2 whitespace-nowrap">{r.requestType}</td>
                  <td className="p-2 whitespace-nowrap">{r.requestDate ? new Date(r.requestDate).toLocaleDateString() : '-'}</td>
                  <td className="p-2 whitespace-nowrap">{r.dueDate ? new Date(r.dueDate).toLocaleDateString() : '-'}</td>
                  <td className="p-2"><span className={`px-2 py-1 rounded text-[10px] font-semibold shadow-sm ${statusColors[r.status] || 'bg-gray-200 text-gray-800'}`}>{r.status}</span></td>
                  <td className="p-2 whitespace-nowrap">{closedDate && new Date(closedDate).toLocaleDateString()}</td>
                  <td className="p-2 whitespace-nowrap">{r.approvedDate && new Date(r.approvedDate).toLocaleDateString()}</td>
                  <td className="p-2 whitespace-nowrap">{r.approvedBy || '-'}</td>
                  <td className="p-2 whitespace-nowrap">{r.acceptedBy || '-'}</td>
                  <td className="p-2 whitespace-nowrap">{r.delegatedCompleted || '-'}</td>
                  <td className="p-2 whitespace-nowrap">{r.managerFeedback || '-'}</td>
                  <td className="p-2 space-x-1">
                    {canAcceptReject(r) && (
                      <>
                        <button disabled={!!actingId} onClick={()=>act(r._id,'Accepted')} className={`px-3 py-1 rounded text-[11px] text-white ${actingId===r._id+'Accepted' ? 'bg-green-400' : 'bg-green-600 hover:bg-green-700'} shadow`}>{actingId===r._id+'Accepted' ? '...' : 'Accept'}</button>
                        <button disabled={!!actingId} onClick={()=>act(r._id,'Rejected')} className={`px-3 py-1 rounded text-[11px] text-white ${actingId===r._id+'Rejected' ? 'bg-red-400' : 'bg-red-600 hover:bg-red-700'} shadow`}>{actingId===r._id+'Rejected' ? '...' : 'Reject'}</button>
                      </>
                    )}
                    {canMarkComplete(r) && (
                      <button disabled={!!actingId} onClick={()=>act(r._id,'Completed')} className={`px-3 py-1 rounded text-[11px] text-white ${actingId===r._id+'Completed' ? 'bg-blue-400' : 'bg-blue-600 hover:bg-blue-700'} shadow`}>{actingId===r._id+'Completed' ? '...' : (r.status==='Completed' ? 'Completed' : 'Mark Complete')}</button>
                    )}
                    {(!canAcceptReject(r) && !canMarkComplete(r)) && <span className="text-[10px] text-gray-400">-</span>}
                  </td>
                </tr>
              );
            })}
            {!loading && !error && filtered.length === 0 && (
              <tr>
                <td colSpan={14} className="text-center py-6 text-gray-500">No data available</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
