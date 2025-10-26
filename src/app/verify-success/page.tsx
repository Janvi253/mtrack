"use client";
import React, { Suspense } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';

function VerifySuccessContent() {
  const sp = useSearchParams();
  const u = sp.get('u');
  return (
    <div className="max-w-md mx-auto mt-16 bg-white p-6 rounded shadow text-black space-y-4">
      <h1 className="text-xl font-semibold">Email Verified</h1>
      <p className="text-sm">{u ? <>Account <span className="font-semibold">{u}</span> has been verified.</> : 'Your email has been verified.'}</p>
      <p className="text-sm">You can now log in{u ? ' — if admin, you may access the admin panel.' : ''}</p>
      <div className="flex gap-3">
        <Link href="/login" className="bg-blue-700 hover:bg-blue-800 text-white px-4 py-2 rounded text-sm">User Login</Link>
        <Link href="/login-admin" className="bg-purple-700 hover:bg-purple-800 text-white px-4 py-2 rounded text-sm">Admin Login</Link>
      </div>
    </div>
  );
}

export default function VerifySuccessPage() {
  return (
    <Suspense fallback={
      <div className="max-w-md mx-auto mt-16 bg-white p-6 rounded shadow text-black">
        <p>Loading...</p>
      </div>
    }>
      <VerifySuccessContent />
    </Suspense>
  );
}
