import AssignedTasksClient from "@/components/AssignedTasksClient";
import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'
import { ReadonlyRequestCookies } from 'next/dist/server/web/spec-extension/adapters/request-cookies';

export default async function AssignedTasksPage() {
  const cookieStore: ReadonlyRequestCookies = await cookies();
  const session = cookieStore.get('session_user');
  if (!session) redirect('/login');
  return <AssignedTasksClient />;
}
