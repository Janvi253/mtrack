import DailyTaskTable from "../components/DailyTaskTable";
import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';

export default async function Home() {
  const cookieStore = await cookies();
  const sessionCookie = cookieStore.get('session_user');
  if (!sessionCookie) {
    redirect('/login');
  }
  return (
    <div className="flex flex-col items-center gap-8 relative min-h-[70vh] w-full">
      <DailyTaskTable />
      <a
        href="/request-form"
        className="fixed bottom-6 right-6 bg-blue-600 hover:bg-blue-700 text-white px-5 py-3 rounded-full shadow-lg transition-colors text-sm font-semibold flex items-center gap-2 group"
        title="Create / View Requests"
      >
        {/* Icon */}
        <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24">
          <path d="M12 5v14M5 12h14" />
        </svg>
        <span className="hidden sm:inline">Request Form</span>
      </a>
    </div>
  );
}
