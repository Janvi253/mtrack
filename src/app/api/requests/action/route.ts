import { NextRequest, NextResponse } from 'next/server';
import clientPromise, { DB_NAME } from '@/lib/mongodb';
import { verifyActionToken } from '@/lib/actionToken';
import { ObjectId } from 'mongodb';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export async function GET(request: NextRequest) {
  try {
    const url = new URL(request.url);
  const t = url.searchParams.get('t');
  const silent = url.searchParams.get('silent') === '1'; // backward compatibility
  const redirect = url.searchParams.get('redirect') === '1';
  const origin = url.origin;
    if (!t) return NextResponse.json({ error: 'Missing token' }, { status: 400 });
    const payload = verifyActionToken(t);
    if (!payload) return NextResponse.json({ error: 'Invalid or expired token' }, { status: 400 });
  const { rid, act, by } = payload as { rid: string; act: 'approve' | 'deny'; by?: string };
    if (!ObjectId.isValid(rid)) return NextResponse.json({ error: 'Bad id' }, { status: 400 });
    const client = await clientPromise;
    const db = client.db(DB_NAME);
    const col = db.collection('requests');
    const doc = await col.findOne({ _id: new ObjectId(rid) });
    if (!doc) return NextResponse.json({ error: 'Not found' }, { status: 404 });
    // Only allow token actions if current status is Accepted and not yet rejected/approved
    if (doc.status !== 'Accepted') {
      if (redirect) {
        return NextResponse.redirect(`${origin}/request-form/admin?action=none&rid=${rid}&status=${encodeURIComponent(doc.status)}`);
      }
      return NextResponse.json({ message: 'No action performed (status not Accepted)' });
    }
    if (act === 'approve') {
      const update = await col.findOneAndUpdate(
        { _id: new ObjectId(rid), status: 'Accepted' },
        { $set: { status: 'Approved', approvedDate: new Date().toISOString(), approvedBy: by || 'email-action' } },
        { returnDocument: 'after' }
      );
      if (silent) return new NextResponse(null, { status: 204 });
      if (redirect) {
        return NextResponse.redirect(`${origin}/request-form/admin?action=approved&rid=${rid}`);
      }
      const value = update?.value;
      return NextResponse.json({ action: 'approved', request: value ? { ...value, _id: value._id.toString() } : null });
    } else {
      const update = await col.findOneAndUpdate(
        { _id: new ObjectId(rid), status: 'Accepted' },
        { $set: { status: 'Rejected', managerFeedback: 'Rejected via email action' } },
        { returnDocument: 'after' }
      );
      if (silent) return new NextResponse(null, { status: 204 });
      if (redirect) {
        return NextResponse.redirect(`${origin}/request-form/admin?action=denied&rid=${rid}`);
      }
      const value = update?.value;
      return NextResponse.json({ action: 'denied', request: value ? { ...value, _id: value._id.toString() } : null });
    }
  } catch (e) {
    console.error('GET /api/requests/action error', e);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}
