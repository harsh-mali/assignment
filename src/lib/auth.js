import jwt from 'jsonwebtoken';
import { headers } from 'next/headers';

export async function getUserSession() {
    const headersList = headers();
    const authHeader = headersList.get('authorization');
    const token = authHeader?.split(' ')[1];

    if (!token) {
        return null;
    }

    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET || 'fallback-secret');
        return decoded;
    } catch (error) {
        return null;
    }
}