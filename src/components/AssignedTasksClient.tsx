"use client";
import React, { useEffect, useState } from "react";
import * as XLSX from 'xlsx';
import { useRouter } from "next/navigation";

type Task = {
  _id?: string;
  project: string;
  mode?: string;
  date?: string;
  shift?: string;
  description: string;
  code?: string;
  status: string;
  dueDate?: string;
  tool?: string;
  ji?: string;
  hours?: string;
  remarks?: string;
};

export default function AssignedTasksClient() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  useEffect(() => {
    fetchTasks();
  }, []);

  function downloadTasksAsXLSX() {
    if (!tasks || tasks.length === 0) {
      alert('No tasks to download');
      return;
    }
    const sheetData = tasks.map(t => ({
      PROJECT: t.project || '',
      MODE: t.mode || '',
      DATE: t.date || '',
      SHIFT: t.shift || '',
      DESCRIPTION: t.description || '',
      CODE: t.code || '',
      STATUS: t.status || '',
      "DUE DATE": t.dueDate || '',
      TOOL: t.tool || '',
      "J/I": t.ji || '',
      HOURS: t.hours || '',
      REMARKS: t.remarks || ''
    }));
    const ws = XLSX.utils.json_to_sheet(sheetData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Tasks');
    const now = new Date();
    const stamp = `${now.getFullYear()}-${String(now.getMonth()+1).padStart(2,'0')}-${String(now.getDate()).padStart(2,'0')}`;
    XLSX.writeFile(wb, `tasks-${stamp}.xlsx`);
  }

  async function fetchTasks() {
    const res = await fetch("/api/tasks", { credentials: 'include' });
    const data = await res.json();
    setTasks(Array.isArray(data) ? data : []);
  }

  function editTask(t: Task) {
    try {
      localStorage.setItem("editingTask", JSON.stringify(t));
      router.push("/");
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    } catch (e) {
      // Ignore localStorage errors
    }
  }

  async function deleteTask(id?: string) {
    if (!id) {
      alert("Invalid task id");
      return;
    }
    setLoading(true);
    try {
      const encodedId = encodeURIComponent((id || "").toString().trim());
      const res = await fetch(`/api/tasks/${encodedId}`, { method: "DELETE", credentials: 'include' });
      let body: Record<string, unknown> = {};
      try {
        body = await res.json().catch(() => ({}));
      } catch {
        body = { text: await res.text().catch(() => "") };
      }
      if (!res.ok || body.deletedCount !== 1) {
        console.error("Delete failed", body);
        alert("Failed to delete task on server");
        return;
      }
      setTasks((prev) => prev.filter((t) => t._id !== id));
      await fetchTasks();
    } catch (error) {
      console.error(error);
      alert("Failed to delete task");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="bg-white/85 backdrop-blur-sm rounded-3xl shadow-[0_6px_16px_rgba(0,0,0,0.14),0_18px_42px_-6px_rgba(0,0,0,0.22),0_2px_4px_rgba(0,0,0,0.06)] p-7 mt-10 text-black border border-gray-100 relative overflow-hidden transition-shadow">
      <div className="pointer-events-none absolute inset-0 rounded-3xl shadow-[inset_0_0_0_1px_rgba(255,255,255,0.6),inset_0_2px_6px_rgba(255,255,255,0.45)]" />
      <div className="mt-4 mb-8 text-center">
        <h2 className="text-xl font-semibold text-blue-900">Daily Tasks</h2>
        <div className="mt-3 flex justify-center">
          <div className="h-[3px] w-40 rounded-full bg-blue-900/30 relative overflow-hidden">
            <div className="absolute inset-y-0 left-1/2 -translate-x-1/2 w-16 bg-blue-700/60 rounded-full" />
          </div>
        </div>
      </div>
      {tasks.length === 0 ? (
        <div className="py-12 text-center text-gray-600">No tasks assigned</div>
      ) : (
        <div className="overflow-x-auto">
          <table className="min-w-full text-xs table-auto rounded-2xl overflow-hidden shadow-[0_3px_8px_rgba(0,0,0,0.10),0_10px_28px_-4px_rgba(0,0,0,0.18)] border border-gray-100 bg-gradient-to-b from-[#FFFEFB] to-[#FFF9EE]">
            <thead className="bg-blue-400/95 backdrop-blur-sm text-gray-800 text-[11px] uppercase tracking-wide">
              <tr>
                <th className="px-3 py-2 text-left text-blue-950/80 font-semibold">PROJECT</th>
                <th className="px-3 py-2 text-left text-blue-950/80 font-semibold min-w-[110px] w-[110px]">MODE</th>
                <th className="px-3 py-2 text-left text-blue-950/80 font-semibold">DATE</th>
                <th className="px-3 py-2 text-left text-blue-950/80 font-semibold">SHIFT</th>
                <th className="px-3 py-2 text-left text-blue-950/80 font-semibold">DESCRIPTION</th>
                <th className="px-3 py-2 text-left text-blue-950/80 font-semibold">CODE</th>
                <th className="px-3 py-2 text-left text-blue-950/80 font-semibold">STATUS</th>
                <th className="px-3 py-2 text-left text-blue-950/80 font-semibold">DUE DATE</th>
                <th className="px-3 py-2 text-left text-blue-950/80 font-semibold">TOOL</th>
                <th className="px-3 py-2 text-left text-blue-950/80 font-semibold">J/I</th>
                <th className="px-3 py-2 text-left text-blue-950/80 font-semibold">HOURS</th>
                <th className="px-3 py-2 text-left text-blue-950/80 font-semibold">REMARKS</th>
                <th className="px-3 py-2 text-left text-blue-950/80 font-semibold">ACTION</th>
              </tr>
            </thead>
            <tbody>
              {tasks.map((t, i) => (
                <tr key={t._id ? `${t._id}-${i}` : `task-${i}`} className="bg-[#FFFCF4]/70 border-b last:border-b-0 border-gray-100">
                  <td className="px-3 py-2 align-top">{t.project || ""}</td>
                  <td className="px-3 py-2 align-top">{t.mode || ""}</td>
                  <td className="px-3 py-2 align-top">{t.date || ""}</td>
                  <td className="px-3 py-2 align-top">{t.shift || ""}</td>
                  <td className="px-3 py-2 align-top text-left whitespace-pre-wrap break-words">{t.description || ""}</td>
                  <td className="px-3 py-2 align-top">{t.code || ""}</td>
                  <td className="px-3 py-2 align-top">{t.status || ""}</td>
                  <td className="px-3 py-2 align-top">{t.dueDate || ""}</td>
                  <td className="px-3 py-2 align-top">{t.tool || ""}</td>
                  <td className="px-3 py-2 align-top">{t.ji || ""}</td>
                  <td className="px-3 py-2 align-top">{t.hours || ""}</td>
                  <td className="px-3 py-2 align-top">{t.remarks || ""}</td>
                  <td className="px-3 py-2 align-top">
                    <div className="flex flex-col gap-1">
                      <button
                        type="button"
                        onClick={() => editTask(t)}
                        disabled={loading}
                        className="bg-blue-600/90 text-white px-3 py-1 rounded shadow hover:bg-blue-700 transition text-[11px] disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        Edit
                      </button>
                      <button
                        type="button"
                        onClick={() => deleteTask(t._id)}
                        disabled={loading}
                        className="bg-red-600/90 text-white px-3 py-1 rounded shadow hover:bg-red-700 transition text-[11px] disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        Delete
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      <div className="flex justify-center mt-8">
        <button
          type="button"
          onClick={downloadTasksAsXLSX}
          disabled={!tasks || tasks.length === 0}
          className="bg-blue-700 text-white px-6 py-2 rounded shadow hover:bg-blue-800 transition text-sm disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:bg-blue-700"
        >
          Download Excel
        </button>
      </div>
    </div>
  );
}
