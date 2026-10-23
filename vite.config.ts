import { defineConfig, type Plugin } from 'vite'
import react from '@vitejs/plugin-react'
import { readFileSync, readdirSync, mkdirSync, writeFileSync } from 'node:fs'
import { resolve } from 'node:path'

const POSTS_DIR = resolve(__dirname, 'src/blog/posts')
const SITE = 'https://zahin-tapadar.vercel.app'

const esc = (s: string) => s.replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;')

function readPosts() {
  return readdirSync(POSTS_DIR).filter((f) => f.endsWith('.md')).map((f) => {
    const raw = readFileSync(resolve(POSTS_DIR, f), 'utf8')
    const meta: Record<string, string> = {}
    for (const line of (raw.match(/^---\n([\s\S]*?)\n---/)?.[1] ?? '').split('\n')) {
      const i = line.indexOf(':')
      if (i > 0) meta[line.slice(0, i).trim()] = line.slice(i + 1).trim()
    }
    return { slug: f.replace(/\.md$/, ''), meta }
  })
}

// The blog is one page (blog/index.html) that reads the URL to pick a post.
// Static hosts (GitHub Pages, Vercel) need a real file at every URL, so the
// build writes blog/<slug>/index.html per post, with that post's title and
// link-preview tags baked in; the dev server rewrites the same URLs.
function blogPages(): Plugin {
  return {
    name: 'blog-pages',
    configureServer(server) {
      server.middlewares.use((req, _res, next) => {
        if (req.url && /^\/blog\/[^/.?]+\/?(\?.*)?$/.test(req.url)) req.url = '/blog/index.html'
        next()
      })
    },
    closeBundle() {
      const outDir = resolve(__dirname, 'dist')
      const shell = readFileSync(resolve(outDir, 'blog/index.html'), 'utf8')
      for (const { slug, meta } of readPosts()) {
        const title = `${meta.title ?? slug} — zahin`
        const desc = meta.description ?? meta.subtitle ?? ''
        const url = `${SITE}/blog/${slug}/`
        const tags = [
          `<title>${esc(title)}</title>`,
          `<meta name="description" content="${esc(desc)}" />`,
          `<link rel="canonical" href="${url}" />`,
          `<meta property="og:type" content="article" />`,
          `<meta property="og:title" content="${esc(meta.title ?? slug)}" />`,
          `<meta property="og:description" content="${esc(desc)}" />`,
          `<meta property="og:url" content="${url}" />`,
          meta.cover && `<meta property="og:image" content="${SITE}${meta.cover}" />`,
          `<meta name="twitter:card" content="${meta.cover ? 'summary_large_image' : 'summary'}" />`,
          meta.date && `<meta property="article:published_time" content="${meta.date}" />`,
        ].filter(Boolean).join('\n    ')
        const html = shell.replace(/<!--blog:meta-->[\s\S]*?<!--\/blog:meta-->/, tags)
        mkdirSync(resolve(outDir, 'blog', slug), { recursive: true })
        writeFileSync(resolve(outDir, 'blog', slug, 'index.html'), html)
      }
    },
  }
}

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), blogPages()],
  build: {
    rollupOptions: {
      input: {
        main: resolve(__dirname, 'index.html'),
        blog: resolve(__dirname, 'blog/index.html'),
      },
    },
  },
})
