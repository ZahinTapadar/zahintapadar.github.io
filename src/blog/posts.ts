import { parsePost, type Post } from './markdown';

// Every Markdown file in ./posts is a post; its file name is the URL slug
// (/blog/<slug>/). vite.config.ts reads the same folder to emit one static
// page per post, so new posts need no other wiring.
const files = import.meta.glob('./posts/*.md', { query: '?raw', import: 'default', eager: true }) as Record<string, string>;

export const posts: Post[] = Object.entries(files)
    .map(([path, raw]) => parsePost(path.replace(/^.*\/(.*)\.md$/, '$1'), raw))
    .sort((a, b) => b.date.localeCompare(a.date) || b.slug.localeCompare(a.slug));   // stable order for same-day posts

export const findPost = (slug: string) => posts.find((p) => p.slug === slug);
