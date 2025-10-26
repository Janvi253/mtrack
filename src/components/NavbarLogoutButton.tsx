"use client";
import { useTransition } from 'react';

export default function LogoutButton() {
  const [pending, start] = useTransition();

  async function doLogout() {
    start(async () => {
      try {
  await fetch('/api/auth/logout', { method: 'POST', credentials: 'include' });
  window.dispatchEvent(new Event('auth-changed'));
  // Soft navigate
  window.location.assign('/login');
      } catch (e) {
        // silent fail – could add toast
        console.error('Logout failed', e);
      }
    });
  }

  return (
    <button
      onClick={doLogout}
      disabled={pending}
      title="Logout"
      aria-label="Logout"
      className="text-white px-2 py-1 rounded shadow-sm hover:bg-blue-800 cursor-pointer flex items-center justify-center disabled:opacity-50"
    >
      {pending ? (
        <svg className="h-5 w-5 animate-spin" viewBox="0 0 24 24" fill="none" stroke="currentColor">
          <circle cx="12" cy="12" r="10" strokeWidth="4" className="opacity-30" />
          <path d="M4 12a8 8 0 0 1 8-8" strokeWidth="4" strokeLinecap="round" className="opacity-90" />
        </svg>
      ) : (
        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 3H5a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h5" />
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 16l4-4-4-4" />
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 12H9" />
        </svg>
      )}
    </button>
  );
}
