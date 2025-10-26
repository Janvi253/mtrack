import crypto from 'crypto';

// Simple HMAC signed token with expiration encoded (epoch seconds) and payload (requestId + action).
// Format: base64url(json) + '.' + signature

const ENC = 'base64url';

interface ActionPayload {
    rid: string; // request id
    act: 'approve' | 'deny';
    exp: number; // epoch seconds
    by?: string; // admin username initiating via email (encoded)
}

function getSecret() {
    const s = process.env.ACTION_TOKEN_SECRET || process.env.SMTP_PASS || 'dev-secret';
    return s;
}

export function createActionToken(rid: string, act: 'approve' | 'deny', ttlSeconds = 60 * 60 * 24, by?: string) {
    const payload: ActionPayload = { rid, act, exp: Math.floor(Date.now() / 1000) + ttlSeconds };
    if (by) payload.by = by;
    const json = JSON.stringify(payload);
    const b = Buffer.from(json).toString(ENC);
    const sig = crypto.createHmac('sha256', getSecret()).update(b).digest(ENC);
    return `${b}.${sig}`;
}

export function verifyActionToken(token: string): ActionPayload | null {
    if (!token || !token.includes('.')) return null;
    const [b, sig] = token.split('.', 2);
    const expected = crypto.createHmac('sha256', getSecret()).update(b).digest(ENC);
    if (!crypto.timingSafeEqual(Buffer.from(sig), Buffer.from(expected))) return null;
    try {
        const json = Buffer.from(b, ENC as any).toString('utf8');
        const payload: ActionPayload = JSON.parse(json);
        if (payload.exp < Math.floor(Date.now() / 1000)) return null;
        return payload;
    } catch { return null; }
}
