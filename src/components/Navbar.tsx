"use client";
import React, { useEffect, useState, useCallback } from 'react';
import Link from 'next/link';
import LogoutButton from './NavbarLogoutButton';
// If you add a real logo file place it at /public/logo.png (or .svg) and adjust width/height.
// Using next/image provides optimization; fallback to <img> would also work if needed.
import Image from 'next/image';

export default function Navbar() {
  const [isAuthed, setIsAuthed] = useState<boolean>(false);

  const refreshAuth = useCallback(async () => {
    try {
      // Lightweight auth check: attempt /api/auth/me if exists, else read cookie via document
      const res = await fetch('/api/auth/me', { credentials: 'include' });
      if (res.ok) {
        const j = await res.json();
        setIsAuthed(!!j?.username);
      } else {
        // fallback cookie sniff (not SSR secure but fine client-side)
        setIsAuthed(document.cookie.includes('session_user='));
      }
    } catch {
      setIsAuthed(document.cookie.includes('session_user='));
    }
  }, []);

  useEffect(() => { refreshAuth(); }, [refreshAuth]);
  useEffect(() => {
    function handler() { refreshAuth(); }
    window.addEventListener('auth-changed', handler);
    return () => window.removeEventListener('auth-changed', handler);
  }, [refreshAuth]);

  const [showCode, setShowCode] = useState(false);
  const open = () => setShowCode(true);
  const close = () => setShowCode(false);

  useEffect(() => {
    if (showCode) {
      const prev = document.body.style.overflow;
      document.body.style.overflow = 'hidden';
      return () => { document.body.style.overflow = prev; };
    }
  }, [showCode]);

  useEffect(() => {
    if (!showCode) return;
    function onKey(e: KeyboardEvent) { if (e.key === 'Escape') close(); }
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [showCode]);

  return (
    <>
      <nav className="bg-blue-900 text-white px-6 py-3 flex items-center justify-between shadow-md rounded-b-lg">
        <div className="flex items-center gap-3">
          <Link href="/" className="flex items-center group" aria-label="Go to home">
            <Image
              src="/logo.png"
              alt="MinebeaMitsumi Logo"
              width={180}
              height={55}
              priority
              unoptimized
              className="h-12 w-auto px-3 py-2 rounded-lg shadow-sm ring-1 ring-white/20 bg-white backdrop-blur-sm object-contain group-hover:scale-[1.05] transition-transform"
            />
            <span className="sr-only">MinebeaMitsumi</span>
          </Link>
        </div>
        <div className="flex gap-4 items-center font-medium text-base">
          <Link href="/" className="hover:underline underline-offset-4">Home</Link>
          <Link href="/daily-task" className="hover:underline underline-offset-4">Daily Task</Link>
          <Link href="/time-sheet" className="hover:underline underline-offset-4">Time Sheet</Link>
          <button type="button" onClick={open} className="hover:underline underline-offset-4 focus:outline-none">Code</button>
          {isAuthed ? (
            <LogoutButton />
          ) : (
            <Link href="/login" className="ml-2 bg-blue-700 text-white px-3 py-1 rounded shadow-sm hover:bg-blue-800">Login</Link>
          )}
        </div>
      </nav>

      {showCode && (
        <div className="fixed inset-0 z-[200] bg-black/70 backdrop-blur-md animate-fade-in flex" role="dialog" aria-modal="true">
          <div className="relative w-full h-full" onClick={close}>
            <Image
              src="/code-preview.png"
              alt="Code reference"
              fill
              className="object-cover md:object-cover select-none"
              draggable={false}
              onClick={e => e.stopPropagation()}
            />
            <button
              onClick={close}
              aria-label="Close"
              className="absolute top-4 right-4 h-10 w-10 flex items-center justify-center rounded-full bg-white/15 hover:bg-white/30 text-white backdrop-blur-sm border border-white/30 shadow-lg transition"
            >
              ✕
            </button>
          </div>
        </div>
      )}

      <style jsx global>{`
        @keyframes fade-in { from { opacity: 0 } to { opacity: 1 } }
        .animate-fade-in { animation: fade-in .25s ease-out; }
      `}</style>
    </>
  );
}
