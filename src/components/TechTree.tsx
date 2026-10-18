import React, { useEffect, useRef, useState } from 'react';

interface TechGroup {
    dir: string;
    color: string;
    items: string[];
}

// Renders the stack as `tree` output; rows type in once the block scrolls into view
const TechTree: React.FC<{ groups: TechGroup[] }> = ({ groups }) => {
    const ref = useRef<HTMLDivElement>(null);
    const [visible, setVisible] = useState(false);
    const total = groups.reduce((n, g) => n + g.items.length, 0);

    useEffect(() => {
        const el = ref.current;
        if (!el) return;
        const observer = new IntersectionObserver(([entry]) => {
            if (entry.isIntersecting) {
                setVisible(true);
                observer.disconnect();
            }
        }, { threshold: 0.2 });
        observer.observe(el);
        return () => observer.disconnect();
    }, []);

    let chipIndex = 0;

    return (
        <div ref={ref} className={`minimal-tree ${visible ? 'is-visible' : ''}`}>
            <div className="minimal-tree-prompt">
                <span style={{ color: '#98c379' }}>zahin@dev</span>
                <span style={{ color: '#5c6370' }}>:</span>
                <span style={{ color: '#61afef' }}>~/stack</span>
                <span style={{ color: '#5c6370' }}>$ </span>
                tree --by-category
            </div>
            {groups.map((group, g) => (
                <div
                    key={group.dir}
                    className="minimal-tree-row"
                    style={{ '--row': g, '--accent': group.color } as React.CSSProperties}
                >
                    <span className="minimal-tree-branch">{g === groups.length - 1 ? '└──' : '├──'}</span>
                    <span className="minimal-tree-dir">{group.dir}/</span>
                    <span className="minimal-tree-chips">
                        {group.items.map(item => (
                            <span
                                key={item}
                                className="minimal-tree-chip"
                                style={{ '--chip': chipIndex++ } as React.CSSProperties}
                            >
                                {item}
                            </span>
                        ))}
                    </span>
                </div>
            ))}
            <div className="minimal-tree-summary" style={{ '--row': groups.length } as React.CSSProperties}>
                {groups.length} directories, {total} tools<span className="minimal-tree-cursor">█</span>
            </div>
        </div>
    );
};

export default TechTree;
