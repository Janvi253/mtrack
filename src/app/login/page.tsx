"use client";
import React, { useState } from "react";
import { useRouter } from "next/navigation";

export default function LoginPage() {
    const [username, setUsername] = useState("");
    const [code, setCode] = useState("");
    const [codeError, setCodeError] = useState("");
    const router = useRouter();
    const [showCode, setShowCode] = useState(false);

    async function submit(e: React.FormEvent) {
        e.preventDefault();
    setCodeError("");
    if (!/^\d{4}$/.test(code)) { setCodeError('User Code must be exactly 4 digits'); return; }
    const res = await fetch('/api/auth/login', { method: 'POST', credentials: 'include', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ username, code }) });
        const j = await res.json();
        if (res.ok) {
            window.dispatchEvent(new Event('auth-changed'));
            router.push('/');
        } else {
            alert(j.error || 'Login failed');
        }
    }

    return (
        <div className="max-w-md mx-auto mt-12 bg-white p-6 rounded shadow">
            <h2 className="text-xl font-semibold mb-4 text-black">Login</h2>
            <form onSubmit={submit} className="space-y-3">
                <input className="w-full border px-2 py-1 text-black" value={username} onChange={e => setUsername(e.target.value)} placeholder="Username" />
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
                            onChange={e => { setCode(e.target.value.replace(/[^0-9]/g,'')); setCodeError(''); }}
                            placeholder="User Code (4 digits)"
                        />
                        <button
                          type="button"
                          onClick={() => setShowCode(s => !s)}
                          className="absolute inset-y-0 right-0 px-3 text-xs text-blue-700 hover:underline"
                          tabIndex={-1}
                        >
                          {showCode ? 'Hide' : 'Show'}
                        </button>
                    </div>
                    {codeError && <div className="text-xs text-red-600 mt-1">{codeError}</div>}
                </div>
                <a
                    href="/login-admin"
                    className="bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded transition text-sm tracking-wide inline-flex"
                >
                    Login as Admin
                </a>
                <div className="flex gap-3 flex-wrap">
                    <button className="bg-blue-700 text-white px-4 py-2 rounded">Login</button>
                    <a href="/signup" className="bg-blue-700 text-white px-4 py-2 rounded">Sign up</a>
                </div>
            </form>
        </div>
    );
}
