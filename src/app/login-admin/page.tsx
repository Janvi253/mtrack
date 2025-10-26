"use client";
import React, { useState } from "react";
import { useRouter } from "next/navigation";

export default function AdminLoginPage() {
    const [username, setUsername] = useState("");
    const [code, setCode] = useState("");
    const [codeError, setCodeError] = useState<string | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [loading, setLoading] = useState(false);
    const router = useRouter();
    const [showCode, setShowCode] = useState(false);

    async function submit(e: React.FormEvent) {
        e.preventDefault();
        setError(null);
        setLoading(true);
        try {
            setCodeError(null);
            if (!/^\d{4}$/.test(code)) { setCodeError('Code must be 4 digits'); setLoading(false); return; }
            const res = await fetch('/api/auth/admin-login', { method: 'POST', credentials: 'include', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ username, code }) });
            const j = await res.json();
            if (res.ok) {
                window.dispatchEvent(new Event('auth-changed'));
                router.push('/request-form/admin');
            } else {
                setError(j.error || 'Login failed');
            }
        } catch (err: any) {
            setError('Request failed');
        } finally {
            setLoading(false);
        }
    }

    return (
        <div className="max-w-md mx-auto mt-12 bg-white p-6 rounded shadow">
            <h2 className="text-xl font-semibold mb-4 text-black">Admin Login</h2>
            <form onSubmit={submit} className="space-y-3">
                <input className="w-full border px-2 py-1 text-black" value={username} onChange={e => setUsername(e.target.value)} placeholder="Admin Username" />
                <div>
                    <div className="relative">
                        <input
                            inputMode="numeric"
                            type={showCode ? 'text' : 'password'}
                            pattern="[0-9]{4}"
                            minLength={4}
                            maxLength={4}
                            required
                            title="Enter exactly 4 digits"
                            className="w-full border px-2 py-1 text-black tracking-widest pr-16"
                            value={code}
                            onChange={e => { setCode(e.target.value.replace(/[^0-9]/g,'')); setCodeError(null); }}
                            placeholder="Admin User Code (4 digits)"
                        />
                        <button
                          type="button"
                          onClick={() => setShowCode(s => !s)}
                          className="absolute inset-y-0 right-0 px-3 text-xs text-purple-700 hover:underline"
                          tabIndex={-1}
                        >
                          {showCode ? 'Hide' : 'Show'}
                        </button>
                    </div>
                    {codeError && <div className="text-xs text-red-600 mt-1">{codeError}</div>}
                </div>
                {error && <div className="text-red-600 text-sm">{error}</div>}
                <div className="flex gap-3 flex-wrap">
                    <button disabled={loading} className="bg-purple-700 text-white px-4 py-2 rounded disabled:opacity-60 disabled:cursor-not-allowed">{loading ? 'Logging in...' : 'Login as Admin'}</button>
                    <a href="/signup" className="text-sm bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded">Admin Sign up</a>
                    <a href="/login" className="text-sm bg-blue-700 text-white px-4 py-2 rounded">User login</a>
                </div>
            </form>
        </div>
    );
}
