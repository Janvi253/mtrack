import { NextRequest, NextResponse } from 'next/server';
import clientPromise, { DB_NAME } from '@/lib/mongodb';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

async function authOk(request: Request | NextRequest) {
  const cookieHeader = request.headers.get('cookie') || '';
  return cookieHeader.includes('session_user=');
}

export async function GET(request: NextRequest) {
  try {
    if (!(await authOk(request))) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    const client = await clientPromise;
    const db = client.db(DB_NAME);
    const users = await db.collection('users').find({}, { projection: { _id: 0, username: 1, name: 1, role: 1 } }).toArray();
    return NextResponse.json(users.map(u => ({ username: u.username, name: u.name || u.username, role: u.role || 'user' })));
  } catch (e) {
    return NextResponse.json({ error: 'Failed to load users' }, { status: 500 });
  }
}
