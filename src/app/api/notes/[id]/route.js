import { getUserSession } from '@/lib/auth';
import { getDb, initializeDb } from '@/lib/db'; // <-- Import initializeDb
import { NextResponse } from 'next/server';

async function checkNoteAccess(noteId, tenantId) {
    const db = await getDb();
    const note = await db.get('SELECT * FROM notes WHERE id = ? AND tenantId = ?', noteId, tenantId);
    await db.close();
    return note;
}

export async function GET(req, { params }) {
    await initializeDb(); // <-- ADD THIS LINE
    const session = await getUserSession();
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const note = await checkNoteAccess(params.id, session.tenantId);
    if (!note) return NextResponse.json({ error: 'Note not found or access denied' }, { status: 404 });

    return NextResponse.json({ note });
}

export async function DELETE(req, { params }) {
    await initializeDb(); // <-- ADD THIS LINE
    const session = await getUserSession();
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    // We call initializeDb before this, so the checkNoteAccess will now find the DB
    const note = await checkNoteAccess(params.id, session.tenantId);
    if (!note) return NextResponse.json({ error: 'Note not found or access denied' }, { status: 404 });

    const db = await getDb();
    await db.run('DELETE FROM notes WHERE id = ?', params.id);
    await db.close();

    return new NextResponse(null, { status: 204 });
}