import { NextRequest, NextResponse } from 'next/server';
import clientPromise, { DB_NAME } from '@/lib/mongodb';
import { ObjectId, WithId, Document } from 'mongodb';
import { RequestStatus } from '@/types/request';
import { sendRequestAcceptedEmail } from '@/lib/email';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

async function authOk(request: Request | NextRequest) {
  const cookieHeader = request.headers.get('cookie') || '';
  return cookieHeader.includes('session_user=');
}

interface RouteContext {
  params: Promise<{ id: string }> | { id: string };
}

// Standard Next.js App Router dynamic route handler signature. Some Next.js runtimes surface a warning
// if params is accessed synchronously; we safely support both by allowing either direct object or promise.
// Final canonical form: second arg may be a promise; await it then extract params
export async function PATCH(request: NextRequest, context: RouteContext) {
  try {
    if (!(await authOk(request))) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    const resolved = await context.params; // if context is already an object, await is a no-op
    const id = resolved.id;
    if (!id) return NextResponse.json({ error: 'Missing id param' }, { status: 400 });
    if (!ObjectId.isValid(id)) return NextResponse.json({ error: 'Invalid id' }, { status: 400 });
    const body = await request.json();
    const cookieHeader = request.headers.get('cookie') || '';
    const currentUser = cookieHeader.split(';').map(s=>s.trim()).find(s=>s.startsWith('session_user='))?.split('=')[1];
    const isAdmin = cookieHeader.includes('session_admin=');

    const client = await clientPromise;
    const db = client.db(DB_NAME);
    const col = db.collection('requests');
    const existing = await col.findOne({ _id: new ObjectId(id) });
    if (!existing) return NextResponse.json({ error: 'Not found' }, { status: 404 });

    const nextStatus: RequestStatus | undefined = body.status;
    if (!nextStatus) return NextResponse.json({ error: 'No status specified' }, { status: 400 });
    const valid: RequestStatus[] = ['Pending','In Work','Accepted','Rejected','Approved','Completed','Closed','Overdue'];
    if (!valid.includes(nextStatus)) return NextResponse.json({ error: 'Invalid status' }, { status: 400 });

    const currentStatus: RequestStatus = existing.status as RequestStatus;
    const delegatedTo = (existing as WithId<Document> & { delegatedTo?: string }).delegatedTo;
    const actingIsAssignee = currentUser && delegatedTo && currentUser === delegatedTo;
    const allowed: Record<string, unknown> = {};

    function deny() { return NextResponse.json({ error: 'Transition not allowed' }, { status: 403 }); }

    if (currentStatus === 'Pending') {
      if (nextStatus === 'Accepted') {
        if (!actingIsAssignee) return deny();
        allowed.status = 'Accepted';
        allowed.acceptedBy = currentUser;
      } else if (nextStatus === 'Rejected') {
        if (!actingIsAssignee && !isAdmin) return deny();
        allowed.status = 'Rejected';
        allowed.managerFeedback = body.managerFeedback || 'Rejected';
      } else return deny();
    } else if (currentStatus === 'Accepted') {
      if (nextStatus === 'Approved') {
        if (!isAdmin) return deny();
        allowed.status = 'Approved';
        allowed.approvedDate = new Date().toISOString();
        allowed.approvedBy = currentUser || 'admin';
      } else if (nextStatus === 'Rejected') {
        if (!isAdmin) return deny();
        allowed.status = 'Rejected';
        allowed.managerFeedback = body.managerFeedback || 'Rejected';
      } else return deny();
    } else if (currentStatus === 'Approved') {
      if (nextStatus === 'Completed') {
        if (!actingIsAssignee) return deny();
        allowed.status = 'Completed';
      } else return deny();
    } else {
      return deny();
    }

    const result = await col.findOneAndUpdate(
      { _id: new ObjectId(id) },
      { $set: allowed },
      { returnDocument: 'after' }
    );
    let value = result?.value;
    if (!value) {
      // Some environments may not return the updated doc (older server/version); fetch manually
      value = await col.findOne({ _id: new ObjectId(id) });
      if (!value) return NextResponse.json({ error: 'Not found' }, { status: 404 });
    }
    const doc = { ...value, _id: value._id.toString() };

    // Fire-and-forget email if transitioned to Accepted
    if (allowed.status === 'Accepted') {
      (async () => {
        try {
          // Determine an admin email. Simplest approach: first admin user.
          const adminUser = await db.collection('users').findOne({ role: 'admin' }) as { email?: string; username?: string } | null;
          const adminEmail = adminUser?.email || process.env.FALLBACK_ADMIN_EMAIL;
          if (adminEmail) {
            await sendRequestAcceptedEmail({
              baseUrl: process.env.BASE_URL || process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000',
              adminEmail,
              requestId: doc._id as string,
              project: (existing as WithId<Document> & { project?: string }).project || 'Request',
              requester: (existing as WithId<Document> & { requester?: string }).requester || 'Unknown',
              acceptedBy: currentUser || 'assignee',
              adminUsername: adminUser?.username || adminUser?.email?.split('@')[0]
            });
          } else {
            console.log('[ACCEPT EMAIL] No admin email available');
          }
        } catch (e) {
          console.error('Failed to send acceptance email', e);
        }
      })();
    }
    return NextResponse.json(doc);
  } catch (e) {
    console.error('PATCH /api/requests/[id] error', e);
    return NextResponse.json({ error: 'Failed to update request' }, { status: 500 });
  }
}
