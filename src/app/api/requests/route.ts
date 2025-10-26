import { NextResponse, NextRequest } from 'next/server';
import clientPromise, { DB_NAME } from '@/lib/mongodb';
import { RequestDoc } from '@/types/request';

// Ensure this route is always dynamic (no static caching) so new requests appear immediately
export const dynamic = 'force-dynamic';
export const revalidate = 0;

async function authOk(request: Request | NextRequest) {
    const cookieHeader = request.headers.get('cookie') || '';
    return cookieHeader.includes('session_user=');
}
export async function GET(request: NextRequest) {
    try {
        if (!(await authOk(request))) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }
        const client = await clientPromise;
        const db = client.db(DB_NAME);
        const items = await db
            .collection('requests')
            .find({}, { sort: { createdAt: -1 } })
            .toArray();
        const cleaned = items.map((r: any) => ({ ...r, _id: r._id?.toString() }));
        return NextResponse.json(cleaned);
    } catch (e) {
        console.error('GET /api/requests error', e);
        return NextResponse.json({ error: 'Failed to fetch requests' }, { status: 500 });
    }
}
export async function POST(request: NextRequest) {
    try {
        if (!(await authOk(request))) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }
        const body = (await request.json()) as Partial<RequestDoc>;

        // Basic validation for required fields used in list & filters
        const required: (keyof RequestDoc)[] = [
            'project',
            'requester',
            'site',
            'requestType',
            'requestDate',
            'dueDate',
            'status'
        ];
        const missing = required.filter(k => !body[k]);
        if (missing.length) {
            return NextResponse.json({ error: 'Missing required fields', missing }, { status: 400 });
        }
        const now = new Date().toISOString();
    const doc: RequestDoc = { ...(body as RequestDoc), createdAt: now };

        const client = await clientPromise;
        const db = client.db(DB_NAME);
    // Remove potential string _id before insertion to satisfy driver typing (ObjectId will be generated)
    const { _id: _discard, ...toInsert } = doc;
    const result = await db.collection('requests').insertOne(toInsert as any);
    return NextResponse.json({ ...toInsert, _id: result.insertedId.toString() }, { status: 201 });
    } catch (e) {
        console.error('POST /api/requests error', e);
        return NextResponse.json({ error: 'Failed to create request' }, { status: 500 });
    }
}
