import { getUserSession } from '@/lib/auth';
import { getDb, initializeDb } from '@/lib/db'; // <-- Import initializeDb
import { NextResponse } from 'next/server';

export async function GET() {
    await initializeDb(); // <-- ADD THIS LINE
    const session = await getUserSession();
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const db = await getDb();
    const notes = await db.all('SELECT * FROM notes WHERE tenantId = ? ORDER BY createdAt DESC', session.tenantId);
    await db.close();

    return NextResponse.json({ notes });
}

export async function POST(req) {
    await initializeDb(); // <-- ADD THIS LINE
    const session = await getUserSession();
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { title, content } = await req.json();
    if (!title) return NextResponse.json({ error: 'Title is required' }, { status: 400 });

    const db = await getDb();
    // ... rest of the function is the same
    const tenant = await db.get('SELECT plan FROM tenants WHERE id = ?', session.tenantId);
    if (tenant.plan === 'free') {
        const noteCount = await db.get('SELECT COUNT(id) as count FROM notes WHERE tenantId = ?', session.tenantId);
        if (noteCount.count >= 3) {
            await db.close();
            return NextResponse.json({ error: 'Free plan note limit reached' }, { status: 403 });
        }
    }
    const result = await db.run(
        'INSERT INTO notes (title, content, tenantId) VALUES (?, ?, ?)',
        title, content || '', session.tenantId
    );
    const newNote = await db.get('SELECT * FROM notes WHERE id = ?', result.lastID);
    await db.close();
    return NextResponse.json({ note: newNote }, { status: 201 });
}