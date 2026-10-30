import React, { useEffect, useState } from 'react';

export interface NavItem {
    id: string;
    label: string;
    children?: { id: string; label: string }[];
}

// The page as a directory listing: a fixed `tree` in the left gutter that
// follows the section being read, with a rail showing how far down you are.
const SideNav: React.FC<{ items: NavItem[] }> = ({ items }) => {
    const [active, setActive] = useState(items[0]?.id);
    const [progress, setProgress] = useState(0);

    useEffect(() => {
        // A section is "current" once its top passes the upper third of the screen
        const ids = items.map((i) => i.id);
        let frame = 0;
        const update = () => {
            frame = 0;
            const line = window.innerHeight / 3;
            let current = ids[0];
            for (const id of ids) {
                const el = document.getElementById(id);
                if (el && el.getBoundingClientRect().top <= line) current = id;
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
    }, [items]);

    return (
        <nav className="side-nav" aria-label="sections">
            <div className="side-nav-rail" aria-hidden="true">
                <span style={{ transform: `scaleY(${progress})` }} />
            </div>
            <div className="side-nav-root">~/zahin</div>
            <ul>
                {items.map((item, i) => {
                    const last = i === items.length - 1;
                    return (
                        <li key={item.id}>
                            <a href={`#${item.id}`} className={item.id === active ? 'is-active' : undefined} aria-current={item.id === active ? 'location' : undefined}>
                                <span className="side-nav-branch" aria-hidden="true">{last ? '└── ' : '├── '}</span>
                                {item.label}
                            </a>
                            {item.children && (
                                <ul>
                                    {item.children.map((child, j) => (
                                        <li key={child.id}>
                                            <a href={`#${child.id}`} className="side-nav-child">
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
        </nav>
    );
};

export default SideNav;
