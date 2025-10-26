import { NextResponse } from "next/server";
import clientPromise, { DB_NAME } from "@/lib/mongodb";

export async function GET(request: Request) {
  try {
    const cookieHeader = (request.headers.get("cookie") || "");
    const match = cookieHeader.split(";").map(s => s.trim()).find(s => s.startsWith("session_user="));
    if (!match) return NextResponse.json({});
    const username = match.split("=")[1];
  const client = await clientPromise;
  const db = client.db(DB_NAME);
  const user = await db.collection("users").findOne({ username });
  if (!user) return NextResponse.json({ username });
  return NextResponse.json({ username: user.username, name: user.name, email: user.email, role: user.role || 'user' });
  } catch (e) {
    return NextResponse.json({});
  }
}
