import { getDb, initializeDb } from '@/lib/db';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { NextResponse } from 'next/server';

export async function POST(req) {
    await initializeDb(); // Ensure DB is ready
    const db = await getDb();

    const { email, password } = await req.json();

    if (!email || !password) {
        return NextResponse.json({ error: 'Email and password are required' }, { status: 400 });
    }

    const user = await db.get('SELECT * FROM users WHERE email = ?', email);
    if (!user || !(await bcrypt.compare(password, user.password_hash))) {
        return NextResponse.json({ error: 'Invalid credentials' }, { status: 401 });
    }

    const tenant = await db.get('SELECT slug FROM tenants WHERE id = ?', user.tenantId);

    const tokenPayload = {
        userId: user.id,
        email: user.email,
        role: user.role,
        tenantId: user.tenantId,
        tenantSlug: tenant.slug
    };

    const token = jwt.sign(tokenPayload, process.env.JWT_SECRET || 'fallback-secret', {
        expiresIn: '8h',
    });

    await db.close();
    return NextResponse.json({ token });
}