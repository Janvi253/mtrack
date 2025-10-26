import { NextRequest, NextResponse } from 'next/server';
import clientPromise, { DB_NAME } from '@/lib/mongodb';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const token = searchParams.get('token');
    const u = searchParams.get('u');
    if (!token || !u) return NextResponse.json({ error: 'Invalid link' }, { status: 400 });
    const client = await clientPromise;
    const db = client.db(DB_NAME);
    const user = await db.collection('users').findOne({ username: u, emailVerificationToken: token });
    if (!user) return NextResponse.json({ error: 'Invalid or used token' }, { status: 400 });
    if (user.emailVerified) return NextResponse.json({ success: true, already: true });
    if (user.emailVerificationExpires && new Date(user.emailVerificationExpires) < new Date()) return NextResponse.json({ error: 'Token expired' }, { status: 400 });
    await db.collection('users').updateOne({ _id: user._id }, { $set: { emailVerified: true }, $unset: { emailVerificationToken: '', emailVerificationExpires: '' } });
    // Optionally redirect to a success page
    const successUrl = new URL('/verify-success', request.url);
    successUrl.searchParams.set('u', u);
    return NextResponse.redirect(successUrl);
  } catch (e) {
    console.error('VERIFY EMAIL ERROR', e);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}
