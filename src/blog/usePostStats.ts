import { useCallback, useEffect, useRef, useState } from 'react';
import { firebaseConfig } from './firebase-config';

// Views and thumbs-ups live in Firestore at posts/{slug}. The SDK is only
// fetched on post pages, and only when a Firebase project is configured.
type Firestore = typeof import('firebase/firestore/lite');
let firestore: Promise<{ fs: Firestore; db: ReturnType<Firestore['getFirestore']> }> | null = null;

function connect() {
    if (!firestore && firebaseConfig) {
        const config = firebaseConfig;
        firestore = Promise.all([import('firebase/app'), import('firebase/firestore/lite')]).then(([app, fs]) => ({
            fs,
            db: fs.getFirestore(app.initializeApp(config)),
        }));
    }
    return firestore;
}

// One view write per post per page load, shared by every mount, so a read
// that follows it always sees the new count
const viewWrites = new Map<string, Promise<unknown>>();

// Per-browser memory so a refresh is not a new view and a like can be undone
const remember = {
    get: (key: string) => { try { return localStorage.getItem(key); } catch { return null; } },
    set: (key: string, value: string | null) => {
        try { if (value === null) localStorage.removeItem(key); else localStorage.setItem(key, value); } catch { /* storage blocked */ }
    },
    seen: (key: string) => { try { return sessionStorage.getItem(key) !== null; } catch { return false; } },
    markSeen: (key: string) => { try { sessionStorage.setItem(key, '1'); } catch { /* storage blocked */ } },
};

export interface PostStats {
    enabled: boolean;
    views: number | null;
    likes: number | null;
    liked: boolean;
    toggleLike: () => void;
}

export function usePostStats(slug: string): PostStats {
    const [views, setViews] = useState<number | null>(null);
    const [likes, setLikes] = useState<number | null>(null);
    const [liked, setLiked] = useState(() => remember.get(`liked:${slug}`) === '1');
    const busy = useRef(false);

    useEffect(() => {
        const conn = connect();
        if (!conn) return;
        let cancelled = false;
        conn.then(async ({ fs, db }) => {
            const ref = fs.doc(db, 'posts', slug);
            if (!viewWrites.has(slug)) {
                viewWrites.set(slug, remember.seen(`viewed:${slug}`)
                    ? Promise.resolve()
                    : fs.setDoc(ref, { views: fs.increment(1) }, { merge: true }).then(() => remember.markSeen(`viewed:${slug}`)).catch(() => {}));
            }
            await viewWrites.get(slug);
            const snap = await fs.getDoc(ref);
            if (cancelled) return;
            setViews(snap.get('views') ?? 0);
            setLikes(snap.get('likes') ?? 0);
        }).catch(() => { /* offline or blocked: counters stay hidden */ });
        return () => { cancelled = true; };
    }, [slug]);

    const toggleLike = useCallback(() => {
        const conn = connect();
        if (!conn || busy.current || likes === null) return;
        busy.current = true;
        const next = !liked;
        setLiked(next);
        setLikes((n) => (n ?? 0) + (next ? 1 : -1));
        remember.set(`liked:${slug}`, next ? '1' : null);
        conn.then(({ fs, db }) => fs.setDoc(fs.doc(db, 'posts', slug), { likes: fs.increment(next ? 1 : -1) }, { merge: true }))
            .catch(() => {
                // Roll back if the write was refused
                setLiked(!next);
                setLikes((n) => (n ?? 0) + (next ? -1 : 1));
                remember.set(`liked:${slug}`, next ? null : '1');
            })
            .finally(() => { busy.current = false; });
    }, [liked, likes, slug]);

    return { enabled: firebaseConfig !== null, views, likes, liked, toggleLike };
}
