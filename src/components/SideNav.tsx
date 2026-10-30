import React, { useEffect, useMemo, useRef, useState } from 'react';

export interface NavItem {
    id: string;
    label: string;
    children?: { id: string; label: string }[];
}

interface SideNavProps {
    items: NavItem[];
    root: string;
    side?: 'left' | 'right';
    // Only expand the branch being read (for long outlines)
    collapse?: boolean;
    label?: string;
}

// The page as a directory listing: a fixed `tree` in the gutter that follows
// the section being read, with a rail showing how far down you are.
const SideNav: React.FC<SideNavProps> = ({ items, root, side = 'left', collapse = false, label = 'sections' }) => {
    // Every anchor in document order, with the top-level item it belongs to
    const anchors = useMemo(
        () => items.flatMap((item) => [{ id: item.id, top: item.id }, ...(item.children ?? []).map((c) => ({ id: c.id, top: item.id }))]),
        [items],
    );
    const [active, setActive] = useState(anchors[0]);
    const [progress, setProgress] = useState(0);
    const bodyRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        // An anchor is "current" once its top passes the upper third of the screen
        let frame = 0;
        const update = () => {
            frame = 0;
            const line = window.innerHeight / 3;
            let current = anchors[0];
            for (const a of anchors) {
                const el = document.getElementById(a.id);
                if (el && el.getBoundingClientRect().top <= line) current = a;
            }
            setActive(current);
            const max = document.documentElement.scrollHeight - window.innerHeight;
            setProgress(max > 0 ? Math.min(1, window.scrollY / max) : 0);
        };
        const onScroll = () => { if (!frame) frame = requestAnimationFrame(update); };
        update();
        window.addEventListener('scroll', onScroll, { passive: true });
        window.addEventListener('resize', onScroll);
        return () => {
            window.removeEventListener('scroll', onScroll);
            window.removeEventListener('resize', onScroll);
            cancelAnimationFrame(frame);
        };
    }, [anchors]);

    // When the outline is taller than the screen it scrolls on its own; keep
    // the current entry inside the visible part
    useEffect(() => {
        const body = bodyRef.current;
        const el = body?.querySelector<HTMLElement>('[aria-current="location"]');
        if (!body || !el || body.scrollHeight <= body.clientHeight) return;
        const top = el.offsetTop, margin = body.clientHeight / 4;
        if (top < body.scrollTop + margin || top > body.scrollTop + body.clientHeight - margin) {
            body.scrollTo({ top: top - body.clientHeight / 3 });
        }
    }, [active]);

    return (
        <nav className={`side-nav is-${side}`} aria-label={label}>
            <div className="side-nav-rail" aria-hidden="true">
                <span style={{ transform: `scaleY(${progress})` }} />
            </div>
            <div className="side-nav-body" ref={bodyRef}>
                <div className="side-nav-root" title={root}>{root}</div>
                <ul>
                    {items.map((item, i) => {
                        const last = i === items.length - 1;
                        const isTop = active?.top === item.id;
                        const showChildren = item.children && item.children.length > 0 && (!collapse || isTop);
                        return (
                            <li key={item.id}>
                                <a href={`#${item.id}`} title={item.label} className={isTop ? 'is-active' : undefined} aria-current={active?.id === item.id ? 'location' : undefined}>
                                    <span className="side-nav-branch" aria-hidden="true">{last ? '└── ' : '├── '}</span>
                                    {item.label}
                                </a>
                                {showChildren && (
                                    <ul>
                                        {item.children!.map((child, j) => (
                                            <li key={child.id}>
                                                <a
                                                    href={`#${child.id}`}
                                                    title={child.label}
                                                    className={`side-nav-child${active?.id === child.id ? ' is-current' : ''}`}
                                                    aria-current={active?.id === child.id ? 'location' : undefined}
                                                >
                                                    <span className="side-nav-branch" aria-hidden="true">
                                                        {last ? '    ' : '│   '}{j === item.children!.length - 1 ? '└── ' : '├── '}
                                                    </span>
                                                    {child.label}
                                                </a>
                                            </li>
                                        ))}
                                    </ul>
                                )}
                            </li>
                        );
                    })}
                </ul>
            </div>
        </nav>
    );
};

export default SideNav;
