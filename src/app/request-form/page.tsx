"use client";
import React from 'react';
import Link from 'next/link';
import TaskCompletionChart from '@/components/TaskCompletionChart';
import RequestStatusChart from '@/components/RequestStatusChart';
import RequestsByCountryMap from '@/components/RequestsByCountryMap';
import AcceptedByChart from '@/components/AcceptedByChart';
import RequestsByProjectChart from '@/components/RequestsByProjectChart';
import RequestTypeChart from '@/components/RequestTypeChart';
import RequestVolumeOverTimeChart from '@/components/RequestVolumeOverTimeChart';
import MonthlyRequestVolumeChart from '@/components/MonthlyRequestVolumeChart';

// Dashboard style page that shows summary cards and top action buttons
export default function RequestDashboardPage() {
    return (
        <div className="text-black">
            {/* Top action bar */}
            <div className="flex items-center gap-3 mb-6">
                <Link href="/request-form/new" className="bg-blue-700 hover:bg-blue-800 text-white px-4 py-2 rounded text-sm font-medium shadow">Request +</Link>
                <Link href="/request-form/index" className="bg-purple-600/80 hover:bg-purple-700 text-white px-4 py-2 rounded text-sm font-medium shadow">Request Index</Link>
            </div>

            {/* Grid of placeholder analytics cards (restored) */}
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                {/* Task Completion KPIs - Real Chart */}
                <div className="bg-white rounded-lg shadow p-4 h-64 flex flex-col">
                    <h2 className="text-sm font-semibold mb-2 text-gray-700">Task Completion KPIs</h2>
                    <div className="flex-1">
                        <TaskCompletionChart />
                    </div>
                </div>
                <div className="bg-white rounded-lg shadow p-4 h-64 flex flex-col">
                    <h2 className="text-sm font-semibold mb-2 text-gray-700">Request Status</h2>
                    <div className="flex-1 min-h-0">
                        <RequestStatusChart />
                    </div>
                </div>
                
                {/* Other placeholder cards */}
                <div className="bg-white rounded-lg shadow p-4 h-64 flex flex-col">
                    <h2 className="text-sm font-semibold mb-2 text-gray-700">Requests by Country</h2>
                    <div className="flex-1 min-h-0">
                        <RequestsByCountryMap />
                    </div>
                </div>
                {/* Accepted By (ApprovedBy data) */}
                <div className="bg-white rounded-lg shadow p-4 h-64 flex flex-col">
                    <h2 className="text-sm font-semibold mb-2 text-gray-700">Accepted By</h2>
                    <div className="flex-1 min-h-0">
                        <AcceptedByChart />
                    </div>
                </div>
                {/* Remaining placeholders */}
                <div className="bg-white rounded-lg shadow p-4 h-64 flex flex-col">
                    <h2 className="text-sm font-semibold mb-2 text-gray-700">Requests by Project</h2>
                    <div className="flex-1 min-h-0">
                        <RequestsByProjectChart />
                    </div>
                </div>
                                <div className="bg-white rounded-lg shadow p-4 h-64 flex flex-col">
                                    <h2 className="text-sm font-semibold mb-2 text-gray-700">Request Volume Over Time</h2>
                                    <div className="flex-1 min-h-0">
                                        <RequestVolumeOverTimeChart />
                                    </div>
                                </div>
                                <div className="bg-white rounded-lg shadow p-4 h-64 flex flex-col">
                                    <h2 className="text-sm font-semibold mb-2 text-gray-700">Request Type</h2>
                                    <div className="flex-1 min-h-0">
                                        <RequestTypeChart />
                                    </div>
                                </div>
                {/* Monthly Request Volume (Last 30 Days) */}
                <div className="bg-white rounded-lg shadow p-4 h-64 flex flex-col">
                    <h2 className="text-sm font-semibold mb-2 text-gray-700">Monthly Request Volume</h2>
                    <div className="flex-1 min-h-0">
                        <MonthlyRequestVolumeChart />
                    </div>
                </div>
                {/* Request Status Donut */}
            </div>
        </div>
    );
}
