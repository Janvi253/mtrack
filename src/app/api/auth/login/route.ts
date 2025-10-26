import { NextResponse } from "next/server";
import clientPromise, { DB_NAME } from "@/lib/mongodb";
import bcrypt from "bcryptjs";

export async function POST(request: Request) {
  const body = await request.json();
  const { username, code, password } = body;
  const passOrCode = code || password; // allow legacy clients briefly
  if (!username || !passOrCode) return NextResponse.json({ error: "Missing fields" }, { status: 400 });
  const client = await clientPromise;
  const db = client.db(DB_NAME);
  const u: any = await db.collection("users").findOne({ username });
  if (!u) return NextResponse.json({ error: "Invalid credentials" }, { status: 401 });
  if (!u.emailVerified) return NextResponse.json({ error: 'Email not verified. Please check your inbox.' }, { status: 403 });
  // Support legacy documents with password field or new code field
  const hashed = u.code || u.password || "";
  const ok = await bcrypt.compare(passOrCode, hashed);
  if (!ok) return NextResponse.json({ error: "Invalid credentials" }, { status: 401 });
  const res = NextResponse.json({ success: true, username });
  res.cookies.set("session_user", username, { httpOnly: false, path: "/" });
  return res;
}
