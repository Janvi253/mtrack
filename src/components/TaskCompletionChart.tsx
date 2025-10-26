"use client";
import React, { useEffect, useState } from 'react';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts';

type KPIData = {
  total: number;
  completed: number;
  inProgress: number;
  onTime: number;
  overdue: number;
  completionRate: number;
  overdueRate: number;
  chartData: Array<{
    name: string;
    value: number;
    color: string;
  }>;
};

const TaskCompletionChart = () => {
  const [data, setData] = useState<KPIData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchKPIs();
  }, []);

  const fetchKPIs = async () => {
    try {
      setLoading(true);
      console.log('Fetching KPI data...');
      const response = await fetch('/api/tasks/kpis', { credentials: 'include' });
      console.log('Response status:', response.status);
      if (!response.ok) {
        throw new Error(`Failed to fetch KPI data: ${response.status}`);
      }
      const kpiData = await response.json();
      console.log('KPI data received:', kpiData);
      setData(kpiData);
    } catch (err) {
      console.error('Error fetching KPI data:', err);
      setError(err instanceof Error ? err.message : 'Failed to load data');
    } finally {
      setLoading(false);
    }
  };

  // Percentage labels removed per user request (previous custom label renderer deleted)

  if (loading) {
    return (
      <div className="h-64 flex items-center justify-center">
        <div className="text-gray-400 text-xs">Loading chart...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="h-64 flex flex-col items-center justify-center">
        <div className="text-red-400 text-xs mb-2">Error: {error}</div>
        <div className="text-xs text-gray-500">Check browser console for details</div>
      </div>
    );
  }

  if (!data || data.total === 0) {
    return (
      <div className="h-64 flex flex-col items-center justify-center">
        <div className="text-gray-400 text-xs mb-4">No task data available</div>
        <div className="grid grid-cols-2 gap-2 text-xs">
          <div className="bg-green-50 rounded px-2 py-1 text-center">
            <div className="font-semibold text-green-800">0</div>
            <div className="text-green-600">On Time</div>
          </div>
          <div className="bg-red-50 rounded px-2 py-1 text-center">
            <div className="font-semibold text-red-800">0</div>
            <div className="text-red-600">Overdue</div>
          </div>
        </div>
      </div>
    );
  }

  // Ensure we always have data for the chart, even if it's all zeros
  const chartData = data.chartData.length > 0 ? data.chartData : [
    { name: 'On Time', value: data.onTime || 0, color: '#22c55e' },
    { name: 'Overdue', value: data.overdue || 0, color: '#ef4444' }
  ].filter(item => item.value > 0);

  return (
    <div className="flex flex-col h-full">
      {/* Chart container given explicit height so legend is always visible even inside fixed card */}
      <div className="h-40">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={chartData}
              cx="50%"
              cy="50%"
              labelLine={false}
              /* Label removed */
              outerRadius={60}
              fill="#8884d8"
              dataKey="value"
            >
              {chartData.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={entry.color} />
              ))}
            </Pie>
            <Tooltip 
              formatter={(value: number) => [`${value} tasks`, 'Count']}
              labelStyle={{ fontSize: '12px' }}
              contentStyle={{ fontSize: '11px', borderRadius: '6px' }}
            />
          </PieChart>
        </ResponsiveContainer>
      </div>
      
      {/* Legend (On Time, Overdue) */}
      <div className="mt-3 flex flex-wrap gap-4 text-[10px] leading-tight">
        <div className="flex items-center gap-1 select-none">
          <span className="inline-block h-1.5 w-6 rounded-sm" style={{ background: '#22c55e' }} />
          <span className="font-medium tracking-wide text-green-600">On Time</span>
        </div>
        <div className="flex items-center gap-1 select-none">
          <span className="inline-block h-1.5 w-6 rounded-sm" style={{ background: '#ef4444' }} />
          <span className="font-medium tracking-wide text-red-600">Overdue</span>
        </div>
      </div>
    </div>
  );
};

export default TaskCompletionChart;