import { getUserSession } from '@/lib/auth';
import { getDb, initializeDb } from '@/lib/db'; // <-- Import initializeDb
import { NextResponse } from 'next/server';

export async function POST(req, { params }) {
    await initializeDb(); // <-- ADD THIS LINE
    const session = await getUserSession();
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    // Authorization checks
    if (session.role !== 'Admin') {
        return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }
    if (session.tenantSlug !== params.slug) {
        return NextResponse.json({ error: 'Tenant mismatch' }, { status: 403 });
    }

    const db = await getDb();
    await db.run("UPDATE tenants SET plan = 'pro' WHERE slug = ?", params.slug);
    await db.close();

    return NextResponse.json({ ok: true, plan: 'pro' });
}