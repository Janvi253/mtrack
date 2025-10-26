import { NextResponse } from "next/server";
import clientPromise, { DB_NAME } from "@/lib/mongodb";
import bcrypt from "bcryptjs";
import crypto from 'crypto';
import { sendVerificationEmail } from '@/lib/email';

export async function POST(request: Request) {
    const body = await request.json();
    const { name, email, username, code: codeInput, password, role } = body;
    const normalizedRole = role && typeof role === 'string' ? role.toLowerCase() : undefined;
    // Accept either legacy password field or new code field, prefer code
    const code = codeInput || password; // migrate client not yet updated
    if (!name || !email || !username || !code) return NextResponse.json({ error: "Missing fields" }, { status: 400 });
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) return NextResponse.json({ error: "Invalid email" }, { status: 400 });
    // New requirement: 4 digit numeric code only
    const codeRegex = /^\d{4}$/;
    if (!codeRegex.test(code)) return NextResponse.json({ error: "Code must be exactly 4 digits" }, { status: 400 });
    const client = await clientPromise;
    const db = client.db(DB_NAME);
    const existing = await db.collection("users").findOne({ username });
    if (existing) return NextResponse.json({ error: "User exists" }, { status: 400 });
    const hash = await bcrypt.hash(code, 10);
    const finalRole = normalizedRole === 'admin' ? 'admin' : 'user';
    const token = crypto.randomBytes(32).toString('hex');
    const expires = new Date(Date.now() + 1000*60*60*24); // 24h
    const doc = { name, email, username, code: hash, role: finalRole, createdAt: new Date(), emailVerified: false, emailVerificationToken: token, emailVerificationExpires: expires };
    await db.collection("users").insertOne(doc);
    // Attempt to send email (best effort)
    const baseUrl = process.env.APP_BASE_URL || 'http://localhost:3000';
    let devLink: string | undefined;
    try {
        const r = await sendVerificationEmail({ to: email, username, token, baseUrl, isAdmin: finalRole === 'admin' });
        if (r.simulated) devLink = r.verifyLink;
    } catch (e) {
        console.error('Verification email failed', e);
    }
    return NextResponse.json({ success: true, role: finalRole, verification: true, devLink });
}
