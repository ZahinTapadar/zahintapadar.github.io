import React, { useState } from 'react';
import { useComments, NAME_MAX, BODY_MAX } from './useComments';

const formatWhen = (d: Date | null) =>
    d ? d.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' }).toLowerCase() : 'just now';

// Anonymous comments: no account, an optional name, plain text only
const Comments: React.FC<{ slug: string }> = ({ slug }) => {
    const { comments, state, post } = useComments(slug);
    const [name, setName] = useState('');
    const [body, setBody] = useState('');
    const [trap, setTrap] = useState('');
    const [sending, setSending] = useState(false);
    const [message, setMessage] = useState<{ text: string; error: boolean } | null>(null);

    const submit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (sending) return;
        // Bots fill every field; people never see this one
        if (trap) { setBody(''); setMessage({ text: 'Thanks, your comment is posted.', error: false }); return; }
        setSending(true);
        setMessage(null);
        const error = await post(name, body);
        setSending(false);
        if (error) setMessage({ text: error, error: true });
        else {
            setBody('');
            setMessage({ text: 'Thanks, your comment is posted.', error: false });
        }
    };

    if (state === 'unavailable') {
        return <p className="post-comments-note">comments couldn't load right now.</p>;
    }

    return (
        <div className="post-comments-thread">
            {state === 'loading' ? (
                <p className="post-comments-note">loading comments…</p>
            ) : comments.length === 0 ? (
                <p className="post-comments-note">no comments yet. be the first.</p>
            ) : (
                <ol className="post-comment-list">
                    {comments.map((c) => (
                        <li key={c.id} className="post-comment">
                            <div className="post-comment-head">
                                <span className={c.name ? 'post-comment-name' : 'post-comment-name is-anon'}>{c.name || 'anonymous'}</span>
                                <span className="term-meta">{formatWhen(c.createdAt)}</span>
                            </div>
                            <p className="post-comment-body">{c.body}</p>
                        </li>
                    ))}
                </ol>
            )}

            <form className="post-comment-form" onSubmit={submit}>
                <label className="post-comment-field">
                    <span>name <span className="term-dim">(optional)</span></span>
                    <input value={name} onChange={(e) => setName(e.target.value)} maxLength={NAME_MAX} placeholder="anonymous" autoComplete="nickname" />
                </label>
                <label className="post-comment-field">
                    <span>comment</span>
                    <textarea value={body} onChange={(e) => setBody(e.target.value)} maxLength={BODY_MAX} rows={4} required />
                </label>
                <label className="post-comment-trap" aria-hidden="true">
                    website
                    <input tabIndex={-1} autoComplete="off" value={trap} onChange={(e) => setTrap(e.target.value)} />
                </label>
                <div className="post-comment-actions">
                    <button type="submit" className="post-like" disabled={sending || !body.trim()}>
                        {sending ? 'posting…' : 'post comment'}
                    </button>
                    <span className="term-meta">{body.length}/{BODY_MAX}</span>
                </div>
                <p className={`post-comment-status${message?.error ? ' is-error' : ''}`} role="status" aria-live="polite">
                    {message?.text}
                </p>
            </form>
        </div>
    );
};

export default Comments;
