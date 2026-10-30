import React, { useEffect, useRef } from 'react';

// Comments are GitHub Discussions on the public zahintapadar.github.io repo,
// rendered by giscus. Readers sign in with GitHub, so there is no spam to
// moderate here; threads are matched by URL path, so the Vercel and GitHub
// Pages copies of a post share one thread. The widget loads only when the
// reader gets near the end of the post.
const GISCUS = {
    'data-repo': 'ZahinTapadar/zahintapadar.github.io',
    'data-repo-id': 'R_kgDOVOnGtA',
    'data-category': 'Announcements',
    'data-category-id': 'DIC_kwDOVOnGtM4DKBwM',
    'data-mapping': 'pathname',
    'data-strict': '1',
    'data-reactions-enabled': '0',
    'data-emit-metadata': '0',
    'data-input-position': 'bottom',
    'data-theme': 'transparent_dark',
    'data-lang': 'en',
    'data-loading': 'lazy',
};

const Comments: React.FC = () => {
    const ref = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const host = ref.current;
        if (!host) return;
        const observer = new IntersectionObserver(([entry]) => {
            if (!entry.isIntersecting) return;
            observer.disconnect();
            const script = document.createElement('script');
            script.src = 'https://giscus.app/client.js';
            script.async = true;
            script.crossOrigin = 'anonymous';
            for (const [k, v] of Object.entries(GISCUS)) script.setAttribute(k, v);
            host.appendChild(script);
        }, { rootMargin: '600px 0px' });
        observer.observe(host);
        return () => observer.disconnect();
    }, []);

    return <div ref={ref} className="post-comments-thread" />;
};

export default Comments;
