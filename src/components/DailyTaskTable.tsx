"use client";
import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

type Task = {
  _id?: string;
  project: string;
  mode: string;
  date: string;
  shift: string;
  description: string;
  code: string;
  status: string;
  dueDate: string;
  tool: string;
  ji: string;
  hours: string;
  remarks: string;
};

const todayStr = new Date().toISOString().split('T')[0];
const initialForm: Task = {
  project: "",
  mode: "WFO",
  date: todayStr,
  shift: "",
  description: "",
  code: "",
  status: "",
  dueDate: "",
  tool: "",
  ji: "",
  hours: "",
  remarks: "",
};

const PROJECT_OPTIONS = ["", "Project A", "Project B", "Project C"];
const MODE_OPTIONS = ["WFO", "Offline", "Online", "Hybrid"];
const SHIFT_OPTIONS = ["IST", "Morning", "Afternoon", "Night"];
const CODE_OPTIONS = ["", "FS", "BD", "QA", "DEV"];
const STATUS_OPTIONS = ["", "Open", "In Progress", "Blocked", "Done"];
const TOOL_OPTIONS = ["", "Tool X", "Tool Y", "Tool Z"];
const JI_OPTIONS = ["", "J", "I"];
// date and dueDate use native date inputs

const DailyTaskTable = () => {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [forms, setForms] = useState<Task[]>([initialForm]);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<Record<number, Partial<Record<keyof Task, string>>>>({});
  const [userName, setUserName] = useState<string | null>(null);
  const router = useRouter();

  function safeShowPicker(el: HTMLInputElement) {
    if (!el) return;
    const fn = (el as any).showPicker;
    if (typeof fn === 'function') {
      try { fn.call(el); } catch (e) { /* swallow NotAllowedError when not user-initiated */ }
    }
  }

  const MAX_WORDS = 60;
  function countWords(text: string) {
    const t = (text || "").trim();
    if (!t) return 0;
    return t.split(/\s+/).length;
  }
  function trimToWords(text: string, max: number) {
    const t = (text || "").trim();
    if (!t) return "";
    const words = t.split(/\s+/);
    if (words.length <= max) return text;
    return words.slice(0, max).join(" ");
  }

  function errorFor(row: number, field: keyof Task) {
    return !!(errors[row] && errors[row]![field]);
  }

  function validateForms() {
    const newErrors: Record<number, Partial<Record<keyof Task, string>>> = {};
    forms.forEach((f, idx) => {
      const rowErr: Partial<Record<keyof Task, string>> = {};
      if (!f.project || f.project.trim() === "") rowErr.project = "Required";
      if (!f.mode || f.mode.trim() === "") rowErr.mode = "Required";
      if (!f.date || f.date.trim() === "") rowErr.date = "Required";
      if (!f.description || f.description.trim() === "") rowErr.description = "Required";
      if (Object.keys(rowErr).length > 0) newErrors[idx] = rowErr;
    });
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  }

  useEffect(() => {
    fetchTasks();
    // fetch current user name
    fetch('/api/auth/me', { credentials: 'include' }).then(r => r.json()).then(j => { if (j?.name) setUserName(j.name); }).catch(() => { });
    // if an edit was requested from the assigned page, prefill the form
    try {
      const raw = localStorage.getItem("editingTask");
      if (raw) {
        const t = JSON.parse(raw);
        setForms([t]);
        localStorage.removeItem("editingTask");
      }
    } catch (e) { }
  }, []);

  async function fetchTasks() {
    const res = await fetch("/api/tasks", { credentials: 'include' });
    const data = await res.json();
    setTasks(data);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    await submitForms();
  }

  async function submitForms() {
    if (!validateForms()) return;
    setLoading(true);
    try {
      // For each form: POST for new tasks, PATCH for existing tasks (edit)
      // We'll collect created items so we can update local state
      const createdItems: any[] = [];
      await Promise.all(forms.map(async (f) => {
        if ((f as any)._id) {
          const { _id, ...rest } = f as any;
          const res = await fetch(`/api/tasks/${_id}`, {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(rest),
          });
          if (!res.ok) {
            const err = await res.json().catch(() => ({ error: 'Unknown error' }));
            throw new Error(`Failed to update task ${_id}: ${err.error || JSON.stringify(err)}`);
          }
        } else {
          const res = await fetch("/api/tasks", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(f),
          });
          if (res.ok) {
            const created = await res.json().catch(() => null);
            if (created) createdItems.push(created);
          }
        }
      }));
      // If we created items, append them to local tasks so UI is consistent
      if (createdItems.length > 0) {
        setTasks((prev) => [...prev, ...createdItems]);
      }
      setForms([initialForm]);
      await fetchTasks();
    } catch (err) {
      // handle error if needed
    } finally {
      setLoading(false);
    }
    // after successful submit, navigate to assigned work page to view it
    router.push("/daily-task");
  }

  async function handleEdit(id?: string) {
    if (!id) return;
    const t = tasks.find((x) => x._id === id);
    if (t) setForms([t as Task]);
  }

  async function handleDelete(id?: string) {
    if (!id) return;
    setLoading(true);
    try {
      await fetch(`/api/tasks/${id}`, { method: "DELETE" });
      await fetchTasks();
    } finally {
      setLoading(false);
    }
  }

  return (
  <div className="bg-white/85 backdrop-blur-sm rounded-3xl shadow-[0_6px_16px_rgba(0,0,0,0.14),0_18px_42px_-6px_rgba(0,0,0,0.22),0_2px_4px_rgba(0,0,0,0.06)] p-7 mt-10 text-black border border-gray-100 relative overflow-hidden transition-shadow">
      <div className="pointer-events-none absolute inset-0 rounded-3xl shadow-[inset_0_0_0_1px_rgba(255,255,255,0.6),inset_0_2px_6px_rgba(255,255,255,0.45)]" />
      <div className="mt-10 mb-10 text-center">
        <h1 className="text-2xl font-semibold text-blue-900">Welcome, {userName || 'user'}</h1>
        <div className="mt-3 flex justify-center">
          <div className="h-[3px] w-40 rounded-full bg-blue-900/30 relative overflow-hidden">
            <div className="absolute inset-y-0 left-1/2 -translate-x-1/2 w-16 bg-blue-700/60 rounded-full" />
          </div>
        </div>
      </div>
      <div className="overflow-x-auto">
        <form onSubmit={handleSubmit}>
          <table className="min-w-full text-xs table-auto rounded-2xl overflow-hidden shadow-[0_3px_8px_rgba(0,0,0,0.10),0_10px_28px_-4px_rgba(0,0,0,0.18)] border border-gray-100 bg-gradient-to-b from-[#FFFEFB] to-[#FFF9EE]">
            <thead className="bg-blue-400/95 backdrop-blur-sm text-gray-800 text-[11px] uppercase tracking-wide">
              <tr>
                <th className="px-3 py-2 text-left text-blue-950/80 font-semibold">PROJECT</th>
                <th className="px-3 py-2 text-left text-blue-950/80 font-semibold min-w-[110px] w-[110px]">MODE</th>
                <th className="px-3 py-2 text-left text-blue-950/80 font-semibold">DATE</th>
                <th className="px-3 py-2 text-left text-blue-950/80 font-semibold">SHIFT TIME</th>
                <th className="px-3 py-2 text-left text-blue-950/80 font-semibold">DESCRIPTION</th>
                <th className="px-3 py-2 text-left text-blue-950/80 font-semibold">CODE</th>
                <th className="px-3 py-2 text-left text-blue-950/80 font-semibold">STATUS</th>
                <th className="px-3 py-2 text-left text-blue-950/80 font-semibold">DUE DATE</th>
                <th className="px-3 py-2 text-left text-blue-950/80 font-semibold">TOOL USED</th>
                <th className="px-3 py-2 text-left text-blue-950/80 font-semibold">J/I</th>
                <th className="px-3 py-2 text-left text-blue-950/80 font-semibold">UTILIZED HR</th>
                <th className="px-3 py-2 text-left text-blue-950/80 font-semibold">REMARKS</th>
              </tr>
            </thead>
            <tbody>
              {/* input row for new task */}
              <tr className="bg-[#FFFCF4]/70 transition-colors border-b border-gray-100">
                <td className="px-2 py-1">
                  <select
                    className={`w-full border rounded px-2 py-1 text-xs bg-[#FFFCF4] focus:bg-[#FFF6E6] transition ${errorFor(0, 'project') ? 'border-red-500' : 'border-amber-200'}`}
                    value={forms[0].project}
                    onChange={e => {
                      const v = e.target.value;
                      setForms(forms.map((fm, i) => i === 0 ? { ...fm, project: v } : fm));
                      setErrors(prev => { const c = { ...prev }; if (c[0]) { delete c[0]!.project; if (Object.keys(c[0]!).length === 0) delete c[0]; } return c; });
                    }}
                    required
                  >
                    {PROJECT_OPTIONS.map(opt => <option key={opt} value={opt}>{opt || 'Select project'}</option>)}
                  </select>
                </td>
                <td className="px-2 py-1">
                  <select className={`w-full border rounded px-2 py-1 text-xs bg-[#FFFCF4] focus:bg-[#FFF6E6] transition min-w-[110px] ${errorFor(0, 'mode') ? 'border-red-500' : 'border-amber-200'}`} value={forms[0].mode} onChange={e => {
                    const v = e.target.value;
                    setForms(forms.map((fm, i) => i === 0 ? { ...fm, mode: v } : fm));
                    setErrors(prev => { const c = { ...prev }; if (c[0]) { delete c[0]!.mode; if (Object.keys(c[0]!).length === 0) delete c[0]; } return c; });
                  }} required>
                    {MODE_OPTIONS.map(opt => <option key={opt} value={opt}>{opt || 'Select mode'}</option>)}
                  </select>
                </td>
                <td className="px-2 py-1">
                  <input
                    type="date"
                    className={`w-full border rounded px-2 py-1 text-xs appearance-none date-input no-calendar ${errorFor(0, 'date') ? 'border-red-500' : ''}`}
                    value={forms[0].date}
                    onClick={e => safeShowPicker(e.currentTarget)}
                    onChange={e => { const v = e.target.value; setForms(forms.map((fm, i) => i === 0 ? { ...fm, date: v } : fm)); setErrors(prev => { const c = { ...prev }; if (c[0]) { delete c[0]!.date; if (Object.keys(c[0]!).length === 0) delete c[0]; } return c; }); }}
                    required
                  />
                </td>
                <td className="px-2 py-1">
                  <select className="w-full border rounded px-2 py-1 text-xs bg-[#FFFCF4] focus:bg-[#FFF6E6] border-amber-200" value={forms[0].shift} onChange={e => setForms(forms.map((fm, i) => i === 0 ? { ...fm, shift: e.target.value } : fm))}>
                    {SHIFT_OPTIONS.map(opt => <option key={opt} value={opt}>{opt || 'Select shift'}</option>)}
                  </select>
                </td>
                <td className="px-1 py-1">
                  <input
                    className={`w-full border rounded px-2 py-1 text-xs whitespace-normal break-words ${errorFor(0, 'description') ? 'border-red-500' : ''}`}
                    value={forms[0].description}
                    onChange={e => {
                      const v = e.target.value;
                      const trimmed = trimToWords(v, MAX_WORDS);
                      setForms(forms.map((fm, i) => i === 0 ? { ...fm, description: trimmed } : fm));
                      setErrors(prev => { const c = { ...prev }; if (c[0]) { delete c[0]!.description; if (Object.keys(c[0]!).length === 0) delete c[0]; } return c; });
                    }}
                    placeholder="Description"
                  />
                  <div className="text-center text-[10px] text-gray-500 mt-0.5">{Math.max(0, MAX_WORDS - countWords(forms[0].description))} words left</div>
                  {errors[0] && errors[0]!.description && <div className="text-[10px] text-red-600 mt-0.5">{errors[0]!.description}</div>}
                </td>
                <td className="px-1 py-1">
                  <select className="w-full border rounded px-2 py-1 text-xs bg-[#FFFCF4] focus:bg-[#FFF6E6] border-amber-200" value={forms[0].code} onChange={e => setForms(forms.map((fm, i) => i === 0 ? { ...fm, code: e.target.value } : fm))}>
                    {CODE_OPTIONS.map(opt => <option key={opt} value={opt}>{opt || 'Select code'}</option>)}
                  </select>
                </td>
                <td className="px-2 py-1">
                  <select className="w-full border rounded px-2 py-1 text-xs bg-[#FFFCF4] focus:bg-[#FFF6E6] border-amber-200" value={forms[0].status} onChange={e => setForms(forms.map((fm, i) => i === 0 ? { ...fm, status: e.target.value } : fm))}>
                    {STATUS_OPTIONS.map(opt => <option key={opt} value={opt}>{opt || 'Select status'}</option>)}
                  </select>
                </td>
                <td className="px-2 py-1">
                  <input
                    type="date"
                      className="w-full border rounded px-2 py-1 text-xs appearance-none date-input no-calendar"
                      value={forms[0].dueDate}
                      min={todayStr}
                      onClick={e => safeShowPicker(e.currentTarget)}
                      onChange={e => {
                        const v = e.target.value;
                        if (v && v < todayStr) return; // guard against manual typing of past date
                        setForms(forms.map((fm, i) => i === 0 ? { ...fm, dueDate: v } : fm));
                      }}
                  />
                </td>
                <td className="px-2 py-1">
                  <select className="w-full border rounded px-2 py-1 text-xs bg-[#FFFCF4] focus:bg-[#FFF6E6] border-amber-200" value={forms[0].tool} onChange={e => setForms(forms.map((fm, i) => i === 0 ? { ...fm, tool: e.target.value } : fm))}>
                    {TOOL_OPTIONS.map(opt => <option key={opt} value={opt}>{opt || 'Select tool'}</option>)}
                  </select>
                </td>
                <td className="px-2 py-1">
                  <select className="w-full border rounded px-2 py-1 text-xs bg-[#FFFCF4] focus:bg-[#FFF6E6] border-amber-200" value={forms[0].ji} onChange={e => setForms(forms.map((fm, i) => i === 0 ? { ...fm, ji: e.target.value } : fm))}>
                    {JI_OPTIONS.map(opt => <option key={opt} value={opt}>{opt || 'J/I'}</option>)}
                  </select>
                </td>
                <td className="px-2 py-1">
                  <input
                    type="number"
                    className="w-full border rounded px-2 py-1 text-xs"
                    value={forms[0].hours}
                    onChange={e => setForms(forms.map((fm, i) => i === 0 ? { ...fm, hours: e.target.value } : fm))}
                    placeholder="Hours"
                  />
                </td>
                <td className="px-2 py-1">
                  <input
                    className="w-full border rounded px-2 py-1 text-xs"
                    value={forms[0].remarks}
                    onChange={e => setForms(forms.map((fm, i) => i === 0 ? { ...fm, remarks: e.target.value } : fm))}
                    placeholder="Remarks"
                  />
                </td>

              </tr>

              {/* additional input rows for multiple assignments */}
              {forms.slice(1).map((fm, idx) => (
                <tr key={`extra-${idx}`} className="bg-[#FFFCF4]/70 transition-colors border-b last:border-b-0 border-gray-100">
                  <td className="px-2 py-1">
                    <select className={`w-full border rounded px-2 py-1 text-xs bg-[#FFFCF4] focus:bg-[#FFF6E6] transition ${errorFor(idx + 1, 'project') ? 'border-red-500' : 'border-amber-200'}`} value={fm.project} onChange={e => { const v = e.target.value; setForms(forms.map((f, i) => i === idx + 1 ? { ...f, project: v } : f)); setErrors(prev => { const c = { ...prev }; if (c[idx + 1]) { delete c[idx + 1]!.project; if (Object.keys(c[idx + 1]!).length === 0) delete c[idx + 1]; } return c; }); }}>
                      {PROJECT_OPTIONS.map(opt => <option key={opt} value={opt}>{opt || 'Select project'}</option>)}
                    </select>
                  </td>
                  <td className="px-2 py-1">
                    <select className={`w-full border rounded px-2 py-1 text-xs bg-[#FFFCF4] focus:bg-[#FFF6E6] transition min-w-[110px] ${errorFor(idx + 1, 'mode') ? 'border-red-500' : 'border-amber-200'}`} value={fm.mode} onChange={e => { const v = e.target.value; setForms(forms.map((f, i) => i === idx + 1 ? { ...f, mode: v } : f)); setErrors(prev => { const c = { ...prev }; if (c[idx + 1]) { delete c[idx + 1]!.mode; if (Object.keys(c[idx + 1]!).length === 0) delete c[idx + 1]; } return c; }); }}>
                      {MODE_OPTIONS.map(opt => <option key={opt} value={opt}>{opt || 'Select mode'}</option>)}
                    </select>
                  </td>
                  <td className="px-2 py-1">
                    <input type="date" className={`w-full border rounded px-2 py-1 text-xs appearance-none date-input no-calendar ${errorFor(idx + 1, 'date') ? 'border-red-500' : ''}`} value={fm.date} onChange={e => { const v = e.target.value; setForms(forms.map((f, i) => i === idx + 1 ? { ...f, date: v } : f)); setErrors(prev => { const c = { ...prev }; if (c[idx + 1]) { delete c[idx + 1]!.date; if (Object.keys(c[idx + 1]!).length === 0) delete c[idx + 1]; } return c; }); }} />
                  </td>
                  <td className="px-2 py-1">
                    <select className="w-full border rounded px-2 py-1 text-xs bg-[#FFFCF4] focus:bg-[#FFF6E6] border-amber-200" value={fm.shift} onChange={e => setForms(forms.map((f, i) => i === idx + 1 ? { ...f, shift: e.target.value } : f))}>
                      {SHIFT_OPTIONS.map(opt => <option key={opt} value={opt}>{opt || 'Select shift'}</option>)}
                    </select>
                  </td>
                  <td className="px-2 py-1">
                    <input className={`w-full border rounded px-2 py-1 text-xs whitespace-normal break-words ${errorFor(idx + 1, 'description') ? 'border-red-500' : ''}`} value={fm.description} onChange={e => {
                      const v = e.target.value;
                      const trimmed = trimToWords(v, MAX_WORDS);
                      setForms(forms.map((f, i) => i === idx + 1 ? { ...f, description: trimmed } : f));
                      setErrors(prev => { const c = { ...prev }; if (c[idx + 1]) { delete c[idx + 1]!.description; if (Object.keys(c[idx + 1]!).length === 0) delete c[idx + 1]; } return c; });
                    }} placeholder="Description" />
                    <div className="text-right text-[10px] text-gray-500 mt-0.5">{Math.max(0, MAX_WORDS - countWords(fm.description))} words left</div>
                    {errors[idx + 1] && errors[idx + 1]!.description && <div className="text-[10px] text-red-600 mt-0.5">{errors[idx + 1]!.description}</div>}
                  </td>
                  <td className="px-2 py-1">
                    <select className="w-full border rounded px-2 py-1 text-xs bg-[#FFFCF4] focus:bg-[#FFF6E6] border-amber-200" value={fm.code} onChange={e => setForms(forms.map((f, i) => i === idx + 1 ? { ...f, code: e.target.value } : f))}>
                      {CODE_OPTIONS.map(opt => <option key={opt} value={opt}>{opt || 'Select code'}</option>)}
                    </select>
                  </td>
                  <td className="px-2 py-1">
                    <select className="w-full border rounded px-2 py-1 text-xs bg-[#FFFCF4] focus:bg-[#FFF6E6] border-amber-200" value={fm.status} onChange={e => setForms(forms.map((f, i) => i === idx + 1 ? { ...f, status: e.target.value } : f))}>
                      {STATUS_OPTIONS.map(opt => <option key={opt} value={opt}>{opt || 'Select status'}</option>)}
                    </select>
                  </td>
                  <td className="px-2 py-1">
                    <input type="date" className="w-full border rounded px-2 py-1 text-xs appearance-none date-input no-calendar" value={fm.dueDate} min={todayStr} onClick={e => safeShowPicker(e.currentTarget)} onChange={e => { const v = e.target.value; if (v && v < todayStr) return; setForms(forms.map((f, i) => i === idx + 1 ? { ...f, dueDate: v } : f)); }} />
                  </td>
                  <td className="px-2 py-1">
                    <select className="w-full border rounded px-2 py-1 text-xs bg-[#FFFCF4] focus:bg-[#FFF6E6] border-amber-200" value={fm.tool} onChange={e => setForms(forms.map((f, i) => i === idx + 1 ? { ...f, tool: e.target.value } : f))}>
                      {TOOL_OPTIONS.map(opt => <option key={opt} value={opt}>{opt || 'Select tool'}</option>)}
                    </select>
                  </td>
                  <td className="px-2 py-1">
                    <select className="w-full border rounded px-2 py-1 text-xs bg-[#FFFCF4] focus:bg-[#FFF6E6] border-amber-200" value={fm.ji} onChange={e => setForms(forms.map((f, i) => i === idx + 1 ? { ...f, ji: e.target.value } : f))}>
                      {JI_OPTIONS.map(opt => <option key={opt} value={opt}>{opt || 'J/I'}</option>)}
                    </select>
                  </td>
                  <td className="px-2 py-1">
                    <input type="number" className="w-full border rounded px-2 py-1 text-xs" value={fm.hours} onChange={e => setForms(forms.map((f, i) => i === idx + 1 ? { ...f, hours: e.target.value } : f))} placeholder="Hours" />
                  </td>
                  <td className="px-2 py-1">
                    <input className="w-full border rounded px-2 py-1 text-xs" value={fm.remarks} onChange={e => setForms(forms.map((f, i) => i === idx + 1 ? { ...f, remarks: e.target.value } : f))} placeholder="Remarks" />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </form>

        <div className="flex justify-end items-center gap-1 mt-4">
          <button
            type="button"
            title="Add assignment"
            className="px-2.5 py-0.8 rounded-md bg-blue-600 text-white flex items-center justify-center shadow hover:bg-blue-700"
            onClick={() => setForms([...forms, { ...initialForm }])}
          >
            +
          </button>
          <button
            type="button"
            title="Remove assignment"
            className="px-2.5 py-0.8 rounded-md bg-blue-600 text-white flex items-center justify-center shadow hover:bg-blue-700"
            onClick={() => setForms(forms.length > 1 ? forms.slice(0, -1) : [initialForm])}
          >
            -
          </button>
        </div>

        <div className="flex justify-center mt-6">
          <button
            type="button"
            onClick={submitForms}
            className="bg-blue-700 text-white px-6 py-2 rounded shadow hover:bg-blue-800 transition"
            disabled={loading}
          >
            {loading ? "Submitting..." : "Submit"}
          </button>
        </div>
      </div>
    </div>
  );
};

export default DailyTaskTable;
