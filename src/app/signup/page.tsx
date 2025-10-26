"use client";
import React, { useState } from "react";

export default function SignupPage() {
    const [username, setUsername] = useState("");
    const [code, setCode] = useState("");
    const [name, setName] = useState("");
    const [email, setEmail] = useState("");
    const [emailError, setEmailError] = useState("");
    const [codeError, setCodeError] = useState("");
    const [infoMsg, setInfoMsg] = useState("");
    // devVerifyLink no longer displayed; verification required for all users.
    const [asAdmin, setAsAdmin] = useState(false);
    const [showCode, setShowCode] = useState(false);

    async function submit(e: React.FormEvent) {
        e.preventDefault();
        // client-side validation
        let hasError = false;
        setEmailError("");
        setCodeError("");
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email)) {
            setEmailError("Please enter a valid email address.");
            hasError = true;
        }
        const codeRegex = /^\d{4}$/;
        if (!codeRegex.test(code)) { setCodeError('User Code must be exactly 4 digits'); hasError = true; }
        if (hasError) return;

        const res = await fetch('/api/auth/signup', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ name, email, username, code, role: asAdmin ? 'admin' : 'user' }) });
        const j = await res.json();
        if (res.ok) {
            if (asAdmin) {
                setInfoMsg('Account created. Check your email to verify before logging in as admin.');
            } else {
                setInfoMsg('Account created. Email verification is required before you can log in.');
            }
        } else {
            alert(j.error || 'Signup failed');
        }
    }

    return (
        <div className="max-w-md mx-auto mt-12 bg-white p-6 rounded shadow">
            <h2 className="text-xl font-semibold mb-4 text-black">Sign up</h2>
            <form onSubmit={submit} className="space-y-3">
                <input className="w-full border px-2 py-1 text-black" value={name} onChange={e => setName(e.target.value)} placeholder="Full name" />
                <div>
                    <input className="w-full border px-2 py-1 text-black" value={email} onChange={e => { setEmail(e.target.value); setEmailError(""); }} placeholder="Email" />
                    {emailError && <div className="text-sm text-red-600 mt-1">{emailError}</div>}
                </div>
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
                            onChange={e => { setCode(e.target.value.replace(/[^0-9]/g, '')); setCodeError(''); }}
                            placeholder="User Code"
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
                    {codeError && <div className="text-sm text-red-600 mt-1">{codeError}</div>}
                </div>
                <div className="flex items-center gap-2 pt-1">
                    <input id="asAdmin" type="checkbox" className="h-4 w-4" checked={asAdmin} onChange={e => setAsAdmin(e.target.checked)} />
                    <label htmlFor="asAdmin" className="text-sm text-black select-none">Register as admin</label>
                </div>
                {infoMsg && <div className="text-xs text-green-700 bg-green-50 border border-green-200 rounded p-2 leading-relaxed">{infoMsg}</div>}
                <div className="flex gap-3 mt-2">
                    <button type="submit" className="bg-blue-700 text-white px-4 py-2 rounded">Create account</button>
                    <a href="/login" className="bg-blue-700 text-white px-4 py-2 rounded">Login</a>
                </div>
            </form>
        </div>
    );
}
