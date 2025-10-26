"use client";
import React, { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import LogoutButton from "./NavbarLogoutButton";
import Image from "next/image";

interface Props {
  isAuthed: boolean;
}

const NavbarClient: React.FC<Props> = ({ isAuthed }) => {
  const [showCode, setShowCode] = useState(false);

  const open = useCallback(() => setShowCode(true), []);
  const close = useCallback(() => setShowCode(false), []);

  // Lock body scroll when overlay open
  useEffect(() => {
    if (showCode) {
      const prev = document.body.style.overflow;
      document.body.style.overflow = 'hidden';
      return () => { document.body.style.overflow = prev; };
    }
  }, [showCode]);

  // ESC key handler
  useEffect(() => {
    if (!showCode) return;
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') close();
    }
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [showCode, close]);

  return (
    <>
      <nav className="bg-blue-900 text-white px-6 py-3 flex items-center justify-between shadow-md rounded-b-lg">
        <div className="flex items-center gap-3">
          <span className="font-bold text-lg tracking-wide">MinebeaMitsumi</span>
          <span className="ml-2 text-xs bg-blue-700 px-2 py-0.5 rounded">Passion to Create Value through Difference</span>
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
              className="object-cover md:object-cover select-none" /* object-cover forces full width coverage */
              draggable={false}
              onClick={e => e.stopPropagation()} /* prevent closing when clicking the image itself */
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
};

export default NavbarClient;
