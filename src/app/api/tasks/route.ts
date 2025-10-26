import { NextResponse } from "next/server";
import clientPromise, { DB_NAME } from "@/lib/mongodb";

export async function GET(request: Request) {
  try {
    const cookieHeader = request.headers.get('cookie') || '';
    if (!cookieHeader.includes('session_user=')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

  const client = await clientPromise;
  const db = client.db(DB_NAME);
    const tasks = await db.collection('tasks').find({}).toArray();
    // convert ObjectId to string for transport
    const cleaned = tasks.map((t: any) => ({ ...t, _id: t._id?.toString() }));
    return NextResponse.json(cleaned);
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch tasks' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const cookieHeader = request.headers.get('cookie') || '';
    if (!cookieHeader.includes('session_user=')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
  const client = await clientPromise;
  const db = client.db(DB_NAME);
    const result = await db.collection('tasks').insertOne(body);
    const created = { ...body, _id: result.insertedId.toString() };
    return NextResponse.json(created);
  } catch (error) {
    return NextResponse.json({ error: 'Failed to add task' }, { status: 500 });
  }
}
