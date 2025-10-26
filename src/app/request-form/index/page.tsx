"use client";
import React from 'react';
import Link from 'next/link';
import RequestIndexTable from '../../../components/RequestIndexTable';

export default function RequestIndexPage() {
  return (
    <div className="text-black">
      <div className="flex items-center gap-3 mb-6">
        <Link href="/request-form/new" className="bg-blue-700 hover:bg-blue-800 text-white px-4 py-2 rounded text-sm font-medium shadow">Request +</Link>
        <Link href="/request-form/index" className="bg-purple-600/80 hover:bg-purple-700 text-white px-4 py-2 rounded text-sm font-medium shadow">Request Index</Link>
  {/* Admin Review button removed per requirement */}
        <Link href="/request-form" className="ml-auto bg-blue-700 hover:bg-blue-800 text-white px-4 py-2 rounded text-sm font-medium shadow">Back to Dashboard</Link>
      </div>
      <RequestIndexTable />
    </div>
  );
}
