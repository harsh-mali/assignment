"use client";

import { jwtDecode } from 'jwt-decode';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';

function getCookie(name) {
    const value = `; ${document.cookie}`;
    const parts = value.split(`; ${name}=`);
    if (parts.length === 2) return parts.pop().split(';').shift();
}

function deleteCookie(name) {
    document.cookie = name + '=; Path=/; Expires=Thu, 01 Jan 1970 00:00:01 GMT;';
}

const TrashIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
        <path fillRule="evenodd" d="M8.75 1A2.75 2.75 0 006 3.75v.443c-.795.077-1.58.22-2.365.468a.75.75 0 10.23 1.482l.149-.022.841 10.518A2.75 2.75 0 007.596 19h4.807a2.75 2.75 0 002.742-2.576l.84-10.518.149.022a.75.75 0 10.23-1.482A41.03 41.03 0 0014 4.193v-.443A2.75 2.75 0 0011.25 1h-2.5zM10 4c.84 0 1.673.025 2.5.075V3.75c0-.69-.56-1.25-1.25-1.25h-2.5c-.69 0-1.25.56-1.25 1.25v.325C8.327 4.025 9.16 4 10 4zM8.58 7.72a.75.75 0 00-1.5.06l.3 7.5a.75.75 0 101.5-.06l-.3-7.5zm4.34.06a.75.75 0 10-1.5-.06l-.3 7.5a.75.75 0 101.5.06l.3-7.5z" clipRule="evenodd" />
    </svg>
);


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
            alert('Upgrade successful! You now have unlimited notes.');
            setError('');
        }
    };

    const handleLogout = () => {
        deleteCookie('token');
        router.push('/login');
    };

    return (
        <div className="container">
            <header className="notes-header">
                <h2>{userInfo?.tenantSlug} Workspace</h2>
                <button onClick={handleLogout} className="btn btn-secondary">Logout</button>
            </header>

            <div style={{ marginBottom: '3rem' }}>
                <form onSubmit={handleCreateNote}>
                    <div className="form-group">
                        <input
                            type="text"
                            value={title}
                            onChange={(e) => setTitle(e.target.value)}
                            placeholder="New Note Title"
                            required
                            className="form-input"
                        />
                    </div>
                    <div className="form-group">
                        <textarea
                            value={content}
                            onChange={(e) => setContent(e.target.value)}
                            placeholder="Start writing..."
                            className="form-input"
                        />
                    </div>
                    <button type="submit" className="btn btn-primary">Create Note</button>
                </form>
                {error && <p className="error-message">{error}</p>}
            </div>

            {userInfo?.role === 'Admin' && (
                <div style={{ textAlign: 'center', margin: '3rem 0' }}>
                    <button onClick={handleUpgrade} className="btn btn-secondary">Upgrade to Pro Plan</button>
                </div>
            )}

            <h2>Notes</h2>
            {notes?.length > 0 ? (
                notes.map((note) => (
                    <div key={note.id} className="note-card">
                        <div className="note-card-header">
                            <h3>{note.title}</h3>
                            <button onClick={() => handleDelete(note.id)} className="btn btn-icon">
                                <TrashIcon />
                            </button>
                        </div>
                        <p>{note.content}</p>
                        <small>Last updated: {new Date(note.updatedAt).toLocaleString()}</small>
                    </div>
                ))
            ) : (<p style={{ textAlign: 'center', color: 'var(--text-secondary)', padding: '2rem 0' }}>Your notes will appear here.</p>)}
        </div>
    );
}