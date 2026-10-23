import React, { useEffect, useMemo, useState } from 'react';
import '../components/MinimalPortfolio.css';
import './Blog.css';
import TerminalPanel, { TermPrompt } from '../components/TerminalPanel';
import { posts, findPost } from './posts';
import { renderMarkdown, readingTime, type Post } from './markdown';

const formatDate = (d: string) =>
    d ? new Date(d + 'T00:00:00').toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' }).toLowerCase() : '';

// The live simulator, loaded only on request: it runs a full-screen GPU ray
// tracer, which a reader scrolling past should not pay for.
const SimulatorEmbed: React.FC<{ src: string }> = ({ src }) => {
    const [on, setOn] = useState(false);
    return (
        <figure className="post-embed">
            {on ? (
                <iframe src={src} title="Schwarzschild Lab" allow="fullscreen" loading="lazy" />
            ) : (
                <button className="post-embed-cover" onClick={() => setOn(true)}
                    style={{ backgroundImage: 'url(/blog/schwarzschild-lab/gargantua.webp)' }}>
                    <span className="post-embed-play">[ run ./schwarzschild-lab ]</span>
                    <span className="post-embed-note">loads a live WebGL2 ray tracer · drag to orbit, scroll to zoom</span>
                </button>
            )}
            <figcaption>
                the real thing, running in your browser · <a href={src} target="_blank" rel="noopener noreferrer">open full screen ↗</a>
            </figcaption>
        </figure>
    );
};

const Header: React.FC<{ path: string }> = ({ path }) => (
    <header className="minimal-header">
        <a href="/" className="blog-home">zahin</a>
        <span style={{ color: '#5c6370' }}>{path}</span>
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
                    <span style={{ color: '#e5c07b' }}>{formatDate(p.date)}</span>
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
        () => renderMarkdown(post.body, { simulator: () => post.project ? <SimulatorEmbed src={post.project} /> : null }),
        [post],
    );
    const i = posts.indexOf(post);
    const newer = posts[i - 1], older = posts[i + 1];

    return (
        <>
            <Header path={`~/blog/${post.slug}`} />
            <article className="post">
                <a href="/blog/" className="blog-back">cd ..</a>
                <h1 className="blog-title">{post.title}</h1>
                {post.subtitle && <p className="post-subtitle">{post.subtitle}</p>}
                <div className="post-meta">
                    <span style={{ color: '#e5c07b' }}>{formatDate(post.date)}</span>
                    <span>{readingTime(post.body)} min read</span>
                    {post.tags.map((t) => <span key={t} className="post-tag">#{t}</span>)}
                </div>
                {(post.project || post.repo) && (
                    <div className="term-chips post-links" style={{ '--accent': '#61afef' } as React.CSSProperties}>
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
                <div className="post-body">{nodes}</div>
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
