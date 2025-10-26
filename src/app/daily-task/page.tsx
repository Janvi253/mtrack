import AssignedTasksClient from "@/components/AssignedTasksClient";
import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'

export default function AssignedTasksPage() {
  const cookieStore: any = cookies();
  const session = typeof cookieStore.get === 'function' ? cookieStore.get('session_user') : cookieStore['session_user'];
  if (!session) redirect('/login');
  return <AssignedTasksClient />;
}
