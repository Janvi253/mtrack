"use client";
import React, { useEffect, useMemo, useState } from 'react';

type TimeRow = {
    id: string;
    project: string;
    code: string;
    description: string;
    assignee: string; // optional future use
    hours: Record<string, number>; // date ISO -> hours
};

const sampleProjects: Omit<TimeRow, 'hours'>[] = [
    { id: 'p1', project: 'Software UA', code: '2C', description: 'BMW sensor fusion requirements - software and hardware', assignee: 'JB' },
    { id: 'p2', project: 'Software UA', code: '3J', description: 'R_R_NFC_481 - SW#4 - Review of Unit Test Spec', assignee: 'JB' },
    { id: 'p3', project: 'Software UA', code: '22', description: 'BMW sensor fusion', assignee: 'JC' },
];

type RangeKey = 'THIS_WEEK' | 'THIS_MONTH' | 'LAST_MONTH';

function startOfWeek(d = new Date()) {
    const date = new Date(d);
    const day = date.getDay(); // 0 Sun ... 6 Sat
    const diff = (day === 0 ? -6 : 1) - day; // Monday start
    date.setDate(date.getDate() + diff);
    date.setHours(0, 0, 0, 0);
    return date;
}

function formatISO(date: Date) { return date.toISOString().slice(0, 10); }

function getDateRange(range: RangeKey): string[] {
    const out: string[] = [];
    const today = new Date();
    if (range === 'THIS_WEEK') {
        const start = startOfWeek(today);
        for (let i = 0; i < 7; i++) { const d = new Date(start); d.setDate(start.getDate() + i); out.push(formatISO(d)); }
    } else if (range === 'THIS_MONTH') {
        const start = new Date(today.getFullYear(), today.getMonth(), 1);
        const end = new Date(today.getFullYear(), today.getMonth() + 1, 0);
        for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) out.push(formatISO(new Date(d)));
    } else if (range === 'LAST_MONTH') {
        const start = new Date(today.getFullYear(), today.getMonth() - 1, 1);
        const end = new Date(today.getFullYear(), today.getMonth(), 0);
        for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) out.push(formatISO(new Date(d)));
    }
    return out;
}

export default function TimeSheetPage() {
    const [range, setRange] = useState<RangeKey>('THIS_WEEK');
    const [dates, setDates] = useState<string[]>(getDateRange('THIS_WEEK'));
    const [rows, setRows] = useState<TimeRow[]>(() => sampleProjects.map(p => ({ ...p, hours: {} })));

    useEffect(() => { setDates(getDateRange(range)); }, [range]);

    function updateHour(rowId: string, date: string, value: string) {
        const num = Number(value);
        if (value !== '' && (isNaN(num) || num < 0)) return; // ignore invalid
        setRows(prev => prev.map(r => r.id === rowId ? { ...r, hours: { ...r.hours, [date]: value === '' ? 0 : num } } : r));
    }

    const perRowTotals = useMemo(() => rows.map(r => Object.values(r.hours).reduce((a, b) => a + (b || 0), 0)), [rows]);
    const grandTotal = perRowTotals.reduce((a, b) => a + b, 0);
    const perAssignee: Record<string, number> = useMemo(() => {
        const agg: Record<string, number> = {};
        rows.forEach((r, i) => { const t = perRowTotals[i]; agg[r.assignee] = (agg[r.assignee] || 0) + t; });
        return agg;
    }, [rows, perRowTotals]);

    function downloadCSV() {
        const header = ['PROJECT', 'CODE', 'DESCRIPTION', 'ASSIGNEE', ...dates, 'TOTAL'];
        const lines = [header.join(',')];
        rows.forEach((r, i) => {
            const line = [r.project, r.code, '"' + r.description.replace(/"/g, '""') + '"', r.assignee, ...dates.map(d => r.hours[d] ?? ''), perRowTotals[i]].join(',');
            lines.push(line);
        });
        const blob = new Blob([lines.join('\n')], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'timesheet_' + range + '.csv';
        a.click();
        URL.revokeObjectURL(url);
    }

    return (
        <div className="max-w-6xl mx-auto mt-8 space-y-6 text-black">
            <h1 className="text-2xl font-semibold text-center">Time Sheet</h1>
            <div className="bg-white border rounded-lg shadow p-4 overflow-x-auto">
                <table className="w-full text-xs border-collapse">
                    <thead>
                        <tr className="bg-blue-900 text-white">
                            <th className="p-2 text-left">PROJECT</th>
                            <th className="p-2 text-left">CODE</th>
                            <th className="p-2 text-left">DESCRIPTION</th>
                            <th className="p-2 text-left">A#</th>
                            {dates.map(d => <th key={d} className="p-2 text-center whitespace-nowrap">{d}</th>)}
                            <th className="p-2 text-center">TOTAL</th>
                        </tr>
                    </thead>
                    <tbody>
                        {rows.map((r, ri) => (
                            <tr key={r.id} className="border-t even:bg-gray-50">
                                <td className="p-2 font-medium whitespace-nowrap">{r.project}</td>
                                <td className="p-2">{r.code}</td>
                                <td className="p-2 min-w-[220px]">{r.description}</td>
                                <td className="p-2">{r.assignee}</td>
                                {dates.map(d => (
                                    <td key={d} className="p-1 w-14 text-center">
                                        <input
                                            className="w-full border rounded px-1 py-0.5 text-xs text-center focus:outline-none focus:ring-1 focus:ring-blue-500"
                                            value={r.hours[d] ?? ''}
                                            onChange={e => updateHour(r.id, d, e.target.value)}
                                            placeholder="0"
                                        />
                                    </td>
                                ))}
                                <td className="p-2 font-semibold text-center">{perRowTotals[ri]}</td>
                            </tr>
                        ))}
                    </tbody>
                </table>
                <div className="flex flex-wrap gap-4 items-center mt-4">
                    <label className="text-sm flex items-center gap-2">Select Month Range
                        <select value={range} onChange={e => setRange(e.target.value as RangeKey)} className="border rounded px-2 py-1 text-sm">
                            <option value="THIS_WEEK">This Week</option>
                            <option value="THIS_MONTH">This Month</option>
                            <option value="LAST_MONTH">Last Month</option>
                        </select>
                    </label>
                    <button onClick={downloadCSV} className="bg-blue-700 hover:bg-blue-800 text-white px-4 py-2 rounded text-sm">Download Excel</button>
                </div>
            </div>

            <div className="flex justify-end">
                <div className="bg-white border rounded p-4 text-xs leading-relaxed shadow w-56">
                    <div className="font-semibold text-sm mb-1">Total Hours Logged: <span className="text-red-600">{grandTotal}</span></div>
                    {Object.entries(perAssignee).map(([assignee, hrs]) => (
                        <div key={assignee}>{assignee}: {hrs} hrs</div>
                    ))}
                </div>
            </div>
        </div>
    );
}
