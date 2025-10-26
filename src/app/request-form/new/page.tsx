"use client";
import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

export default function NewRequestPage() {
  const router = useRouter();
  // High-level request meta
  const [meta, setMeta] = useState({
    documentNo: '', creationDate: '', createdBy: '', lastUpdate: '',
    revNo: '', requester: '', requestedActivity: '', requestDate: '', dueDate: '', inputsReceived: '', additionalInputs: ''
  });
  // Initialize document number & dates once on mount
  useEffect(() => {
    setMeta(prev => {
      const today = new Date();
      const iso = today.toISOString().slice(0,10);
      const rand4 = Math.floor(Math.random()*10000).toString().padStart(4,'0');
      const docNo = prev.documentNo || `DOC-${iso.replace(/-/g,'')}-${rand4}`;
      const rev = prev.revNo || 'R00';
      return { 
        ...prev, 
        documentNo: docNo, 
        revNo: rev, 
        creationDate: prev.creationDate || iso, 
        lastUpdate: prev.lastUpdate || iso,
        requestDate: prev.requestDate || iso
      };
    });
  }, []);
  // Fetch current user to pre-fill requester / createdBy once
  useEffect(() => {
    (async () => {
      try {
        const res = await fetch('/api/auth/me', { credentials: 'include' });
        if (!res.ok) return;
        const data = await res.json();
        if (data?.username) {
          setMeta(p => ({
            ...p,
            requester: p.requester || data.username,
            createdBy: p.createdBy || data.username
          }));
        }
      } catch { /* ignore */ }
    })();
  }, []);
  // Authority section
  const processOptions = [
    'DESIGN PROCESS',
    'CHANGE PROCESS',
    'AUTOMATION PROCESS',
    'PURCHASE PROCESS',
    'HR PROCESS',
    'IT PROCESS',
    'CAE/TESTING/VERIFICATION',
    'GMS'
  ];
  const [authority, setAuthority] = useState({
    processes: [] as string[], requestNumber: '', project: '', site: '', codebaseLink: '', expectedOutput: '', outsourcing: 'No', location: 'India', otherLocation: ''
  });
  // Generate request number once
  useEffect(()=>{
    setAuthority(prev => {
      if (prev.requestNumber) return prev;
      const ts = Date.now().toString(36).toUpperCase();
      const rand = Math.random().toString(36).slice(2,6).toUpperCase();
      return { ...prev, requestNumber: `REQ-${ts}-${rand}` };
    });
  }, []);
  // Tasks section removed
  const [submitting, setSubmitting] = useState(false);
  // Assignment
  const [users, setUsers] = useState<Array<{username:string; name:string; role:string}>>([]);
  const [delegatedTo, setDelegatedTo] = useState('');
  useEffect(()=>{
    (async () => {
      try {
        const res = await fetch('/api/users', { credentials: 'include' });
        if (!res.ok) return;
        const list = await res.json();
        setUsers(list);
      } catch {/* ignore */}
    })();
  }, []);

  function updateMeta<K extends keyof typeof meta>(k: K, v: (typeof meta)[K]) { 
    setMeta(p => ({ ...p, [k]: v, lastUpdate: new Date().toISOString().slice(0,10) })); 
  }
  function updateAuthority<K extends keyof typeof authority>(k: K, v: (typeof authority)[K]) { setAuthority(p => ({ ...p, [k]: v })); }
  function toggleProcess(proc: string) {
    setAuthority(p => p.processes.includes(proc)
      ? { ...p, processes: p.processes.filter(x => x !== proc) }
      : { ...p, processes: [...p.processes, proc] });
  }
  // Task handlers removed

  function validate(): string[] {
    const reqs: Array<[string, boolean]> = [
      ['Project', !!authority.project],
      ['Requester', !!meta.requester],
      ['Site', !!authority.site],
      ['Other Location', authority.location !== 'Others' || !!authority.otherLocation.trim()],
      ['At least one Process', authority.processes.length > 0],
      ['Request Date', !!meta.requestDate],
      ['Due Date', !!meta.dueDate]
    ];
    return reqs.filter(r => !r[1]).map(r => r[0]);
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (submitting) return;
    const missing = validate();
    if (missing.length) {
      alert('Please fill required fields: ' + missing.join(', '));
      return;
    }
    const effectiveLocation = authority.location === 'Others' && authority.otherLocation.trim() ? authority.otherLocation.trim() : authority.location;
    const payload = {
      project: authority.project,
      requester: meta.requester,
      site: authority.site,
      requestType: authority.processes[0] || 'GENERAL',
      requestDate: meta.requestDate,
      dueDate: meta.dueDate,
      status: 'Pending' as const,
      delegatedTo: delegatedTo || undefined,
      meta: {
        documentNo: meta.documentNo,
        creationDate: meta.creationDate,
        createdBy: meta.createdBy,
        lastUpdate: meta.lastUpdate,
        revNo: meta.revNo,
      },
      authority: { ...authority, displayLocation: effectiveLocation },
    };
    try {
      setSubmitting(true);
      const res = await fetch('/api/requests', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(payload)
      });
      if (!res.ok) {
        const j = await res.json().catch(()=>({}));
        const serverMissing = (j.missing && Array.isArray(j.missing) && j.missing.length) ? (' Missing: ' + j.missing.join(', ')) : '';
        alert((j.error || 'Failed to create request') + serverMissing);
        return;
      }
      router.push('/request-form/index');
    } catch {
      alert('Network error creating request');
    } finally {
      setSubmitting(false);
    }
  }

  const sectionTitle = (title: string) => (
    <div className="bg-blue-800 text-white text-xs font-semibold tracking-wide px-3 py-2 rounded-t">{title}</div>
  );

  const field = (label: string, children: React.ReactNode, className = '') => (
    <div className={`flex flex-col gap-1 ${className}`}>
      <label className="text-[11px] font-medium uppercase tracking-wide text-gray-700">{label}</label>
      {children}
    </div>
  );

  const inputClass = "border border-gray-300 rounded px-2 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400 bg-white";
  const cellClass = "p-2 border border-gray-300 bg-white";

  return (
    <div className="text-black px-4 py-8">
      <div className="mx-auto w-full max-w-3xl bg-white/95 shadow rounded-2xl p-6 border border-gray-200">
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-xl font-semibold tracking-wide">General Request Form</h1>
        <Link href="/request-form" className="bg-blue-700 hover:bg-blue-800 text-white px-4 py-2 rounded text-sm font-medium shadow">Back to Dashboard</Link>
      </div>
        <form onSubmit={submit} className="space-y-8">
        {/* Exact style header block */}
        <div className="border border-gray-300 rounded-lg overflow-hidden">
          <div className="grid md:grid-cols-12 text-[11px]">
            {/* Left wide title area */}
            <div className="md:col-span-7 border-b md:border-b-0 md:border-r border-gray-300 p-3 flex flex-col gap-2 bg-gray-50">
              <div className="font-semibold text-sm tracking-wide">U-Shin_QMS General Request Form <span className="block text-[10px] font-normal">(India Pvt. Ltd.)</span></div>
              <div className="flex items-center gap-2">
                <span className="font-semibold">Rev No.</span>
                <span className="h-6 inline-flex items-center px-2 text-xs rounded bg-gray-100 text-gray-700 select-none">{meta.revNo}</span>
              </div>
            </div>
            {/* Logo placeholder */}
            <div className="md:col-span-2 border-b md:border-b-0 md:border-r border-gray-300 flex items-center justify-center p-3 bg-white">
              <div className="text-[10px] text-gray-500 text-center">
                <span className="block font-medium">LOGO</span>
                <span className="block">(replace /public/logo.png)</span>
              </div>
            </div>
            {/* Meta fields right side */}
            <div className="md:col-span-3 grid grid-cols-2 border-gray-300">
              <div className="col-span-2 grid grid-cols-2">
                <div className="border-b border-r border-gray-300 bg-gray-50 p-2 font-semibold">Document No:</div>
                <div className="border-b border-gray-300 p-2">
                  <span className="h-6 inline-flex items-center text-xs text-gray-800 font-medium select-none">{meta.documentNo}</span>
                </div>
                <div className="border-b border-r border-gray-300 bg-gray-50 p-2 font-semibold">Creation Date</div>
                <div className="border-b border-gray-300 p-2">
                  <span className="h-6 inline-flex items-center text-xs text-gray-800 select-none">{meta.creationDate}</span>
                </div>
                <div className="border-b border-r border-gray-300 bg-gray-50 p-2 font-semibold">Created By</div>
                <div className="border-b border-gray-300 p-2">
                  <input className="w-full h-6 border border-gray-300 rounded px-1 text-xs" value={meta.createdBy} onChange={e=>updateMeta('createdBy', e.target.value)} />
                </div>
                <div className="border-r border-gray-300 bg-gray-50 p-2 font-semibold">Last Update</div>
                <div className="p-2">
                  <span className="h-6 inline-flex items-center text-xs text-gray-800 select-none">{meta.lastUpdate}</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Requester Section */}
        <div className="border rounded-lg overflow-hidden">
          {sectionTitle('TO BE FILLED BY OR ON BEHALF OF REQUESTOR')}
          <div className="grid md:grid-cols-3">
            <div className={cellClass}>{field('Date of Request', <input type="date" className={inputClass} value={meta.requestDate} onChange={e=>updateMeta('requestDate', e.target.value)} />)}</div>
            <div className={cellClass}>{field('Requester', <input className={inputClass} value={meta.requester} onChange={e=>updateMeta('requester', e.target.value)} />)}</div>
            <div className={cellClass}>{field('Requested Activity', <input className={inputClass} value={meta.requestedActivity} onChange={e=>updateMeta('requestedActivity', e.target.value)} />)}</div>
            <div className={cellClass}>{field('Due Date', <input type="date" className={inputClass} value={meta.dueDate} onChange={e=>updateMeta('dueDate', e.target.value)} />)}</div>
            <div className={cellClass + ' md:col-span-2'}>{field('Inputs Received', <input className={inputClass} value={meta.inputsReceived} onChange={e=>updateMeta('inputsReceived', e.target.value)} />)}</div>
            <div className={cellClass + ' md:col-span-3'}>{field('Additional Inputs / Reference', <textarea className={inputClass + ' h-20 resize-none'} value={meta.additionalInputs} onChange={e=>updateMeta('additionalInputs', e.target.value)} />)}</div>
          </div>
        </div>

        {/* Authority Section */}
        <div className="border rounded-lg overflow-hidden">
          {sectionTitle('TO BE FILLED BY REQUEST PROCESSING AUTHORITY')}
          <div className="p-3 space-y-4">
            <div>
              <label className="text-[11px] font-medium uppercase tracking-wide text-gray-700 block mb-1">Process</label>
              <div className="grid md:grid-cols-4 gap-2">
                {processOptions.map(p => {
                  const active = authority.processes.includes(p);
                  return (
                    <button type="button" key={p} onClick={()=>toggleProcess(p)} className={`text-[11px] border rounded px-2 py-1 text-left transition ${active ? 'bg-blue-600 text-white border-blue-600' : 'bg-white hover:bg-blue-50'}`}>{p}</button>
                  );
                })}
              </div>
              <p className="mt-1 text-[10px] text-gray-500">Select all applicable processes.</p>
            </div>
            <div className="grid md:grid-cols-4 gap-4">
              {field('Request Number', <span className="text-sm font-medium text-gray-800 select-none">{authority.requestNumber || '...'}</span>)}
              {field('Project', (
                <select className={inputClass} value={authority.project} onChange={e=>updateAuthority('project', e.target.value)}>
                  <option value="">Select Project</option>
                  <option value="BMW-XNF-SW">BMW-XNF-SW</option>
                  <option value="SW Competence-UA">SW Competence-UA</option>
                  <option value="Smart BU">Smart BU</option>
                  <option value="Internal">Internal</option>
                  <option value="R&D Initiative">R&D Initiative</option>
                  <option value="Customer Support">Customer Support</option>
                </select>
              ))}
              {field('Site', <input className={inputClass} value={authority.site} onChange={e=>updateAuthority('site', e.target.value)} />)}
              {field('Outsourcing Required', <select className={inputClass} value={authority.outsourcing} onChange={e=>updateAuthority('outsourcing', e.target.value)}><option>No</option><option>Yes</option></select>)}
              {field('Codebase / Redmine / Reference Task Link', <input className={inputClass} value={authority.codebaseLink} onChange={e=>updateAuthority('codebaseLink', e.target.value)} />, 'md:col-span-2')}
              {field('Expected Output', <textarea className={inputClass + ' h-20 resize-none'} value={authority.expectedOutput} onChange={e=>updateAuthority('expectedOutput', e.target.value)} />, 'md:col-span-2')}
              {field('Location', <div className="flex flex-col gap-2 text-sm">
                <div className="flex flex-wrap items-center gap-4">
                  {['India','Others'].map(loc => (
                    <label key={loc} className="flex items-center gap-1 cursor-pointer">
                      <input type="radio" name="location" value={loc} checked={authority.location===loc} onChange={e=>updateAuthority('location', e.target.value)} />
                      <span>{loc}</span>
                    </label>
                  ))}
                </div>
                {authority.location === 'Others' && (
                  <input
                    placeholder="Type country name"
                    className={inputClass + ' max-w-xs'}
                    value={authority.otherLocation}
                    onChange={e=>updateAuthority('otherLocation', e.target.value)}
                    required
                  />
                )}
              </div>)}
            </div>
          </div>
        </div>

        {/* Tasks section removed */}
        {/* Assignment Section */}
        <div className="border rounded-lg overflow-hidden">
          {sectionTitle('ASSIGNMENT')}
          <div className="p-3 space-y-3 text-sm">
            <p className="text-[11px] text-gray-600">Select a user to assign this request for initial acceptance.</p>
            <table className="w-full text-xs border">
              <thead>
                <tr className="bg-blue-900 text-white">
                  <th className="p-2 text-left">Assignee</th>
                  <th className="p-2 text-left">Role</th>
                </tr>
              </thead>
              <tbody>
                <tr className="border-t">
                  <td className="p-2">
                    <select value={delegatedTo} onChange={e=>setDelegatedTo(e.target.value)} className={inputClass + ' w-full'}>
                      <option value="">-- Unassigned --</option>
                      {users.filter(u=>u.role!=='admin').map(u => (
                        <option key={u.username} value={u.username}>{u.name} ({u.username})</option>
                      ))}
                    </select>
                  </td>
                  <td className="p-2">{delegatedTo ? (users.find(u=>u.username===delegatedTo)?.role || 'user') : '-'}</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        <div className="flex justify-end gap-3 pt-2">
          <Link href="/request-form" className="px-4 py-2 rounded border text-sm hover:bg-gray-50">Cancel</Link>
          <button disabled={submitting} className={`bg-green-600 hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed text-white px-6 py-2 rounded text-sm font-semibold`}>
            {submitting ? 'Submitting...' : 'Submit Request'}
          </button>
        </div>
        </form>
      </div>
    </div>
  );
}
