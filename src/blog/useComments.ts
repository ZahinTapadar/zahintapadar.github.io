import { useCallback, useEffect, useState } from 'react';
import { connect } from './usePostStats';

// Anonymous comments at posts/{slug}/comments: { name, body, createdAt }.
// firestore.rules enforce the shape and length; this hook adds a per-browser
// cooldown so a stuck finger or a lazy script can't flood a thread.

export interface Comment {
    id: string;
    name: string;
    body: string;
    createdAt: Date | null;
}

export const NAME_MAX = 40;
export const BODY_MAX = 2000;
const COOLDOWN_MS = 30_000;
const LAST_POST_KEY = 'comment:last-post';

const lastPost = () => { try { return Number(localStorage.getItem(LAST_POST_KEY)) || 0; } catch { return 0; } };
const markPosted = () => { try { localStorage.setItem(LAST_POST_KEY, String(Date.now())); } catch { /* storage blocked */ } };

export type LoadState = 'loading' | 'ready' | 'unavailable';

async function fetchComments(slug: string): Promise<Comment[]> {
    const conn = connect();
    if (!conn) throw new Error('not configured');
    const { fs, db } = await conn;
    const q = fs.query(fs.collection(db, 'posts', slug, 'comments'), fs.orderBy('createdAt', 'asc'), fs.limit(300));
    const snap = await fs.getDocs(q);
    return snap.docs.map((d) => ({
        id: d.id,
        name: String(d.get('name') ?? ''),
        body: String(d.get('body') ?? ''),
        createdAt: d.get('createdAt')?.toDate?.() ?? null,
    }));
}

export function useComments(slug: string) {
    const [comments, setComments] = useState<Comment[]>([]);
    const [state, setState] = useState<LoadState>(() => (connect() ? 'loading' : 'unavailable'));

    useEffect(() => {
        if (!connect()) return;
        let cancelled = false;
        fetchComments(slug)
            .then((list) => { if (!cancelled) { setComments(list); setState('ready'); } })
            .catch(() => { if (!cancelled) setState('unavailable'); });
        return () => { cancelled = true; };
    }, [slug]);

    // Resolves to an error message, or null on success
    const post = useCallback(async (name: string, body: string): Promise<string | null> => {
        const conn = connect();
        if (!conn) return 'Comments are not available right now.';
        const wait = COOLDOWN_MS - (Date.now() - lastPost());
        if (wait > 0) return `Please wait ${Math.ceil(wait / 1000)}s before posting again.`;
        const cleanName = name.trim().slice(0, NAME_MAX);
        const cleanBody = body.trim().slice(0, BODY_MAX);
        if (!cleanBody) return 'Write something first.';
        try {
            const { fs, db } = await conn;
            await fs.addDoc(fs.collection(db, 'posts', slug, 'comments'), {
                name: cleanName,
                body: cleanBody,
                createdAt: fs.serverTimestamp(),
            });
            markPosted();
            setComments(await fetchComments(slug).catch(() => comments));
            return null;
        } catch {
            return 'Your comment could not be posted. Try again in a moment.';
        }
    }, [slug, comments]);

    return { comments, state, post };
}
