import { NextResponse } from "next/server";
import clientPromise, { DB_NAME } from "@/lib/mongodb";
import { ObjectId } from "mongodb";

export async function PATCH(request: Request, { params }: { params: { id: string } }) {
    try {
        const cookieHeader = request.headers.get('cookie') || '';
        if (!cookieHeader.includes('session_user=')) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const body = await request.json();
        const client = await clientPromise;
    const db = client.db(DB_NAME);
        const { id: rawId } = await params as { id: string };
        const id = typeof rawId === "string" ? rawId.trim() : String(rawId);
        if (!id) return NextResponse.json({ error: "Missing id" }, { status: 400 });
        try {
            console.log('[api/tasks/[id]/PATCH] update id:', id, 'body:', body);
            const result = await db.collection("tasks").updateOne({ _id: new ObjectId(id) }, { $set: body });
            console.log('[api/tasks/[id]/PATCH] updateOne result:', result);
        } catch {
            return NextResponse.json({ error: "Invalid id or update failed", id }, { status: 400 });
        }
        return NextResponse.json({ success: true });
    } catch {
        return NextResponse.json({ error: "Failed to update task" }, { status: 500 });
    }
}

export async function DELETE(request: Request, { params }: { params: { id: string } }) {
    try {
        const cookieHeader = request.headers.get('cookie') || '';
        if (!cookieHeader.includes('session_user=')) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }
        const client = await clientPromise;
    const db = client.db(DB_NAME);
        const { id: rawId } = await params as { id: string };
        const id = typeof rawId === "string" ? rawId.trim() : String(rawId);
        if (!id) return NextResponse.json({ error: "Missing id" }, { status: 400 });
        let result;
        try {
            console.log('[api/tasks/[id]/DELETE] received id:', id);
            // Check if document exists before delete
            let exists = null;
            try {
                exists = await db.collection("tasks").findOne({ _id: new ObjectId(id) });
                console.log('[api/tasks/[id]/DELETE] found before delete:', !!exists);
            } catch (err) {
                console.error('[api/tasks/[id]/DELETE] error in findOne:', (err as Error).message || err);
            }
            result = await db.collection("tasks").deleteOne({ _id: new ObjectId(id) });
            console.log('[api/tasks/[id]/DELETE] deleteOne result:', result);
        } catch (err) {
            console.error('[api/tasks/[id]/DELETE] delete exception:', (err as Error).message || err);
            return NextResponse.json({ error: "Invalid id or delete failed", id, err: (err as Error).message || String(err) }, { status: 400 });
        }
        return NextResponse.json({ deletedCount: result.deletedCount, id });
    } catch {
        return NextResponse.json({ error: "Failed to delete task" }, { status: 500 });
    }
}
