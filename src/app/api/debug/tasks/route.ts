import { NextResponse } from "next/server";
import clientPromise, { DB_NAME } from "@/lib/mongodb";
import { WithId, Document } from "mongodb";

export async function GET() {
    try {
        const client = await clientPromise;
    const db = client.db(DB_NAME);
        const tasks = await db.collection("tasks").find({}).toArray();
        // convert ObjectId to string and also show a minimal raw marker
        const cleaned = tasks.map((t: WithId<Document>) => ({ ...t, _id: t._id?.toString(), _rawExists: !!t._id }));
        return NextResponse.json({ count: cleaned.length, tasks: cleaned });
    } catch (error) {
        return NextResponse.json({ error: "Failed to fetch debug tasks", e: (error as Error)?.message || String(error) }, { status: 500 });
    }
}
