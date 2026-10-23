import React from 'react';

// A small Markdown renderer for the blog: headings, paragraphs, lists, block
// quotes, fenced code, images, rules, and inline code / links / bold / italic.
// Enough for posts written by hand, without pulling in a dependency.

export interface Post {
    slug: string;
    title: string;
    subtitle?: string;
    date: string;
    tags: string[];
    project?: string;
    repo?: string;
    description?: string;
    cover?: string;
    meta: Record<string, string>;      // every front-matter field, for post-specific extras
    body: string;
}

// `---\nkey: value\n---` front matter, then the Markdown body.
export function parsePost(slug: string, raw: string): Post {
    const m = raw.match(/^---\n([\s\S]*?)\n---\n?/);
    const meta: Record<string, string> = {};
    if (m) {
        for (const line of m[1].split('\n')) {
            const i = line.indexOf(':');
            if (i > 0) meta[line.slice(0, i).trim()] = line.slice(i + 1).trim();
        }
    }
    return {
        slug,
        title: meta.title ?? slug,
        subtitle: meta.subtitle,
        date: meta.date ?? '',
        tags: (meta.tags ?? '').split(',').map((t) => t.trim()).filter(Boolean),
        project: meta.project,
        repo: meta.repo,
        description: meta.description,
        cover: meta.cover,
        meta,
        body: m ? raw.slice(m[0].length) : raw,
    };
}

export const slugify = (s: string) => s.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');

function inline(text: string, key = 0): React.ReactNode[] {
    const out: React.ReactNode[] = [];
    // code | image | link | bold | italic
    const re = /`([^`]+)`|!\[([^\]]*)\]\(([^)\s]+)\)|\[([^\]]+)\]\(([^)\s]+)\)|\*\*([^*]+)\*\*|\*([^*]+)\*/g;
    let last = 0, m: RegExpExecArray | null, k = key;
    while ((m = re.exec(text))) {
        if (m.index > last) out.push(text.slice(last, m.index));
        if (m[1] !== undefined) out.push(<code key={k++}>{m[1]}</code>);
        else if (m[3] !== undefined) out.push(<img key={k++} src={m[3]} alt={m[2]} loading="lazy" />);
        else if (m[5] !== undefined) {
            const external = /^https?:/.test(m[5]);
            out.push(
                <a key={k++} href={m[5]} {...(external ? { target: '_blank', rel: 'noopener noreferrer' } : {})}>
                    {inline(m[4], k * 100)}
                </a>,
            );
        } else if (m[6] !== undefined) out.push(<strong key={k++}>{inline(m[6], k * 100)}</strong>);
        else if (m[7] !== undefined) out.push(<em key={k++}>{inline(m[7], k * 100)}</em>);
        last = re.lastIndex;
    }
    if (last < text.length) out.push(text.slice(last));
    return out;
}

export interface Heading { id: string; text: string }

// Custom blocks: a line `::component-name` is handed to `components`.
export function renderMarkdown(
    src: string,
    components: Record<string, () => React.ReactNode> = {},
): { nodes: React.ReactNode[]; headings: Heading[] } {
    const lines = src.replace(/\r\n/g, '\n').split('\n');
    const nodes: React.ReactNode[] = [];
    const headings: Heading[] = [];
    let i = 0, key = 0;
    const isBlockStart = (l: string) =>
        /^(#{1,4} |```|> |[-*] |\d+\. |---$|::|!\[|\|)/.test(l) || l.trim() === '';

    while (i < lines.length) {
        const line = lines[i];
        if (line.trim() === '') { i++; continue; }

        if (line.startsWith('```')) {
            const lang = line.slice(3).trim();
            const code: string[] = [];
            i++;
            while (i < lines.length && !lines[i].startsWith('```')) code.push(lines[i++]);
            i++;
            nodes.push(
                <pre key={key++} className="post-code" data-lang={lang || undefined}>
                    <code>{code.join('\n')}</code>
                </pre>,
            );
            continue;
        }
        const h = line.match(/^(#{1,4}) (.*)$/);
        if (h) {
            const level = h[1].length + 1;              // # in a post is an h2: the page owns h1
            const id = slugify(h[2]);
            if (level === 2) headings.push({ id, text: h[2] });
            nodes.push(React.createElement(`h${Math.min(level, 5)}`, { key: key++, id }, inline(h[2])));
            i++;
            continue;
        }
        if (line.trim() === '---') { nodes.push(<hr key={key++} />); i++; continue; }
        // GitHub-style table: header row, |---| separator, body rows
        if (line.startsWith('|') && /^\|[\s:|-]+\|$/.test(lines[i + 1]?.trim() ?? '')) {
            const cells = (l: string) => l.trim().replace(/^\||\|$/g, '').split(/(?<!\\)\|/).map((c) => c.trim().replace(/\\\|/g, '|'));
            const head = cells(line);
            const rows: string[][] = [];
            i += 2;
            while (i < lines.length && lines[i].startsWith('|')) rows.push(cells(lines[i++]));
            nodes.push(
                <div key={key++} className="post-table">
                    <table>
                        <thead><tr>{head.map((c, j) => <th key={j}>{inline(c)}</th>)}</tr></thead>
                        <tbody>{rows.map((r, j) => <tr key={j}>{r.map((c, k) => <td key={k}>{inline(c)}</td>)}</tr>)}</tbody>
                    </table>
                </div>,
            );
            continue;
        }
        if (line.startsWith('::')) {
            const render = components[line.slice(2).trim()];
            if (render) nodes.push(<React.Fragment key={key++}>{render()}</React.Fragment>);
            i++;
            continue;
        }
        const img = line.match(/^!\[([^\]]*)\]\(([^)\s]+)\)$/);
        if (img) {
            nodes.push(
                <figure key={key++} className="post-figure">
                    <img src={img[2]} alt={img[1]} loading="lazy" />
                    {img[1] && <figcaption>{img[1]}</figcaption>}
                </figure>,
            );
            i++;
            continue;
        }
        if (line.startsWith('> ')) {
            const q: string[] = [];
            while (i < lines.length && lines[i].startsWith('> ')) q.push(lines[i++].slice(2));
            nodes.push(<blockquote key={key++}>{inline(q.join(' '))}</blockquote>);
            continue;
        }
        if (/^([-*]|\d+\.) /.test(line)) {
            const ordered = /^\d+\. /.test(line);
            const items: string[] = [];
            while (i < lines.length && /^([-*]|\d+\.) /.test(lines[i])) {
                items.push(lines[i].replace(/^([-*]|\d+\.) /, ''));
                i++;
                while (i < lines.length && /^ {2,}\S/.test(lines[i])) items[items.length - 1] += ' ' + lines[i++].trim();
            }
            const lis = items.map((t, j) => <li key={j}>{inline(t)}</li>);
            nodes.push(ordered ? <ol key={key++}>{lis}</ol> : <ul key={key++}>{lis}</ul>);
            continue;
        }
        const para: string[] = [];
        while (i < lines.length && !isBlockStart(lines[i])) para.push(lines[i++]);
        if (para.length === 0) para.push(lines[i++]);
        nodes.push(<p key={key++}>{inline(para.join(' '))}</p>);
    }
    return { nodes, headings };
}

export const readingTime = (body: string) => Math.max(1, Math.round(body.split(/\s+/).length / 220));
