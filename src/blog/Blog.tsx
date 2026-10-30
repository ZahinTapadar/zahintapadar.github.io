import React, { useEffect, useMemo, useRef, useState } from 'react';
import '../components/MinimalPortfolio.css';
import './Blog.css';
import TerminalPanel, { TermPrompt } from '../components/TerminalPanel';
import { posts, findPost } from './posts';
import { renderMarkdown, readingTime, type Post } from './markdown';
import { usePostStats } from './usePostStats';
import { StatsMeta, LikeButton } from './PostStats';
import Comments from './Comments';

const formatDate = (d: string) =>
    d ? new Date(d + 'T00:00:00').toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' }).toLowerCase() : '';

// A post's live demo, loaded only on request: demos can be heavy (a GPU ray
// tracer, a WebAssembly solver), and a reader scrolling past should not pay for
// them. Front matter: `project` (URL), `cover`, `demo_cmd`, `demo_note`.
const DemoEmbed: React.FC<{ post: Post }> = ({ post }) => {
    const [on, setOn] = useState(false);
    if (!post.project) return null;
    const cmd = post.meta.demo_cmd ?? `./${post.slug}`;
    return (
        <figure className="post-embed">
            {on ? (
                <iframe src={post.project} title={post.title} allow="fullscreen" loading="lazy" />
            ) : (
                <button className="post-embed-cover" onClick={() => setOn(true)}
                    style={post.cover ? { backgroundImage: `url(${post.cover})` } : undefined}>
                    <span className="post-embed-play">[ run {cmd} ]</span>
                    {post.meta.demo_note && <span className="post-embed-note">{post.meta.demo_note}</span>}
                </button>
            )}
            <figcaption>
                the real thing, running in your browser · <a href={post.project} target="_blank" rel="noopener noreferrer">open full screen ↗</a>
            </figcaption>
        </figure>
    );
};

// MathJax 3 (TeX in, SVG out), fetched only for posts that contain math.
// It typesets just the post body, so code blocks and the rest of the page are
// never scanned; until it finishes the TeX stays hidden (see Blog.css).
declare global {
    interface Window { MathJax?: { typesetPromise?: (els: Element[]) => Promise<void> } & Record<string, unknown> }
}
const MATHJAX_SRC = 'https://cdn.jsdelivr.net/npm/mathjax@3.2.2/es5/tex-svg.js';
let mathJaxLoading: Promise<void> | null = null;

function loadMathJax(): Promise<void> {
    if (!mathJaxLoading) {
        window.MathJax = {
            tex: { inlineMath: [['\\(', '\\)']], displayMath: [['\\[', '\\]']] },
            svg: { fontCache: 'global' },
            startup: { typeset: false },
        };
        mathJaxLoading = new Promise((resolve, reject) => {
            const script = document.createElement('script');
            script.src = MATHJAX_SRC;
            script.async = true;
            script.onload = () => resolve();
            script.onerror = () => reject(new Error('MathJax failed to load'));
            document.head.appendChild(script);
        });
    }
    return mathJaxLoading;
}

function useMath(ref: React.RefObject<HTMLElement | null>, enabled: boolean) {
    const [ready, setReady] = useState(!enabled);
    useEffect(() => {
        if (!enabled || !ref.current) return;
        const el = ref.current;
        loadMathJax()
            .then(() => window.MathJax?.typesetPromise?.([el]))
            .catch(() => { /* leave the TeX source visible */ })
            .finally(() => setReady(true));
    }, [ref, enabled]);
    return ready;
}

const Header: React.FC<{ path: string }> = ({ path }) => (
    <header className="minimal-header">
        <a href="/" className="blog-home">zahin</a>
        <span className="term-dim">{path}</span>
    </header>
);

const PostIndex: React.FC = () => (
    <>
        <Header path="~/blog" />
        <h1 className="blog-title">blog</h1>
        <p className="blog-lede">devlogs and notes from things i'm building. mostly graphics, systems and the maths underneath.</p>
        <TerminalPanel cmd="ls -t ~/blog">
            {posts.map((p) => (
                <a key={p.slug} href={`/blog/${p.slug}/`} className="blog-index-row">
                    <span className="term-meta">{formatDate(p.date)}</span>
                    <span>
                        <span className="minimal-project-title">{p.title}</span>
                        {p.subtitle && <span className="minimal-role"> — {p.subtitle}</span>}
                        <span className="blog-index-tags">{p.tags.map((t) => `#${t}`).join(' ')}</span>
                    </span>
                </a>
            ))}
        </TerminalPanel>
    </>
);

const PostView: React.FC<{ post: Post }> = ({ post }) => {
    const { nodes, headings } = useMemo(
        () => renderMarkdown(post.body, { demo: () => <DemoEmbed post={post} />, simulator: () => <DemoEmbed post={post} /> }),
        [post],
    );
    const i = posts.indexOf(post);
    const newer = posts[i - 1], older = posts[i + 1];
    const stats = usePostStats(post.slug);
    const bodyRef = useRef<HTMLDivElement>(null);
    const mathReady = useMath(bodyRef, post.body.includes('$'));

    return (
        <>
            <Header path={`~/blog/${post.slug}`} />
            <article className="post">
                <a href="/blog/" className="blog-back">cd ..</a>
                <h1 className="blog-title">{post.title}</h1>
                {post.subtitle && <p className="post-subtitle">{post.subtitle}</p>}
                <div className="post-meta">
                    <span className="term-meta">{formatDate(post.date)}</span>
                    <span>{readingTime(post.body)} min read</span>
                    <StatsMeta stats={stats} />
                    {post.tags.map((t) => <span key={t} className="post-tag">#{t}</span>)}
                </div>
                {(post.project || post.repo) && (
                    <div className="term-chips post-links">
                        {post.project && <a className="term-chip term-chip-link" href={post.project} target="_blank" rel="noopener noreferrer">live demo ↗</a>}
                        {post.repo && <a className="term-chip term-chip-link" href={post.repo} target="_blank" rel="noopener noreferrer">source ↗</a>}
                    </div>
                )}
                {headings.length > 2 && (
                    <nav className="post-toc">
                        <TermPrompt cmd="grep '^#' post.md" />
                        <ol>{headings.map((h) => <li key={h.id}><a href={`#${h.id}`}>{h.text}</a></li>)}</ol>
                    </nav>
                )}
                <div ref={bodyRef} className={`post-body${mathReady ? ' math-ready' : ''}`}>{nodes}</div>
                <section className="post-responses" aria-labelledby="comments-heading">
                    <LikeButton stats={stats} />
                    <h2 id="comments-heading" className="post-comments-title">comments</h2>
                    <p className="post-comments-note">sign in with GitHub to comment</p>
                    <Comments />
                </section>
            </article>
            <footer className="post-footer">
                <div>{newer && <a href={`/blog/${newer.slug}/`}>← {newer.title}</a>}</div>
                <div>{older && <a href={`/blog/${older.slug}/`}>{older.title} →</a>}</div>
            </footer>
            <p className="blog-eof">EOF · <a href="/blog/">more posts</a> · <a href="/">portfolio</a></p>
        </>
    );
};

const Blog: React.FC = () => {
    const slug = location.pathname.replace(/^\/blog\/?/, '').replace(/\/$/, '');
    const post = slug ? findPost(slug) : undefined;

    useEffect(() => {
        document.title = post ? `${post.title} — zahin` : slug ? 'not found — zahin' : 'blog — zahin';
        if (location.hash) document.getElementById(location.hash.slice(1))?.scrollIntoView();
    }, [post, slug]);

    return (
        <div className="minimal-portfolio blog">
            <div className="minimal-container">
                {!slug ? <PostIndex /> : post ? <PostView post={post} /> : (
                    <>
                        <Header path={`~/blog/${slug}`} />
                        <TerminalPanel cmd={`cat ${slug}.md`}>
                            <p className="term-text">cat: {slug}.md: No such file or directory</p>
                            <a href="/blog/">cd ~/blog</a>
                        </TerminalPanel>
                    </>
                )}
            </div>
        </div>
    );
};

export default Blog;
