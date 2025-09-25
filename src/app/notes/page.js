"use client"; // This is a Client Component

import { jwtDecode } from 'jwt-decode';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';

// Cookie utilities
function getCookie(name) {
    const value = `; ${document.cookie}`;
    const parts = value.split(`; ${name}=`);
    if (parts.length === 2) return parts.pop().split(';').shift();
}

function deleteCookie(name) {
    document.cookie = name + '=; Path=/; Expires=Thu, 01 Jan 1970 00:00:01 GMT;';
}

export default function NotesPage() {
    const [notes, setNotes] = useState([]);
    const [title, setTitle] = useState('');
    const [content, setContent] = useState('');
    const [error, setError] = useState('');
    const [userInfo, setUserInfo] = useState(null);
    const router = useRouter();

    useEffect(() => {
        const token = getCookie('token');
        if (token) {
            setUserInfo(jwtDecode(token));
            fetchNotes();
        } else {
            router.push('/login');
        }
    }, [router]);

    const fetchNotes = async () => {
        const res = await fetch('/api/notes');
        if (res.ok) {
            const data = await res.json();
            setNotes(data.notes);
        } else {
            setError('Failed to fetch notes');
        }
    };

    const handleCreateNote = async (e) => {
        e.preventDefault();
        setError('');
        const res = await fetch('/api/notes', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ title, content }),
        });
        const data = await res.json();
        if (!res.ok) {
            setError(data.error || 'Failed to create note');
        } else {
            setTitle('');
            setContent('');
            fetchNotes();
        }
    };

    const handleDelete = async (id) => {
        await fetch(`/api/notes/${id}`, { method: 'DELETE' });
        fetchNotes();
    };

    const handleUpgrade = async () => {
        if (!userInfo) return;
        const res = await fetch(`/api/tenants/${userInfo.tenantSlug}/upgrade`, { method: 'POST' });
        if (!res.ok) {
            const data = await res.json();
            alert(data.error || "Upgrade failed");
        } else {
            alert('Upgrade successful!');
            setError('');
        }
    };

    const handleLogout = () => {
        deleteCookie('token');
        router.push('/login');
    };

    return (
        <div style={{ maxWidth: '800px', margin: '50px auto', padding: '20px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <h1>My Notes ({userInfo?.tenantSlug})</h1>
                <button onClick={handleLogout}>Logout</button>
            </div>
            <div style={{ padding: '20px', border: '1px solid #ccc', borderRadius: '8px', marginBottom: '20px' }}>
                <h3>Create New Note</h3>
                <form onSubmit={handleCreateNote}>
                    <input type="text" value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Note Title" required style={{ width: '100%', padding: '8px', marginBottom: '10px' }} />
                    <textarea value={content} onChange={(e) => setContent(e.target.value)} placeholder="Note Content" style={{ width: '100%', padding: '8px', height: '100px', marginBottom: '10px' }} />
                    <button type="submit">Add Note</button>
                </form>
                {error && <p style={{ color: 'red', marginTop: '10px' }}>{error}</p>}
            </div>
            {userInfo?.role === 'Admin' && <button onClick={handleUpgrade} style={{ marginBottom: '20px' }}>Upgrade to Pro</button>}
            <h2>Existing Notes</h2>
            {notes?.length > 0 ? (
                notes.map((note) => (
                    <div key={note.id} style={{ padding: '15px', border: '1px solid #eee', borderRadius: '4px', marginBottom: '10px' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                            <h3>{note.title}</h3>
                            <button onClick={() => handleDelete(note.id)} style={{ backgroundColor: '#ff4d4d', color: 'white' }}>Delete</button>
                        </div>
                        <p>{note.content}</p>
                        <small>Last updated: {new Date(note.updatedAt).toLocaleString()}</small>
                    </div>
                ))
            ) : (<p>No notes found. Create one above!</p>)}
        </div>
    );
}