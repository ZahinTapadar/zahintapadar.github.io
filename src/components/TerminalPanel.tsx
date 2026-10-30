import React, { useEffect, useRef, useState } from 'react';

export const TermPrompt: React.FC<{ cmd: string; path?: string }> = ({ cmd, path = '~' }) => (
    <div className="term-prompt">
        <span className="term-prompt-user">zahin@dev</span>
        <span className="term-dim">:</span>
        <span className="term-prompt-path">{path}</span>
        <span className="term-dim">$ </span>
        {cmd}
    </div>
);

interface TerminalPanelProps {
    cmd: string;
    path?: string;
    className?: string;
    children: React.ReactNode;
}

// A boxed "terminal session": a prompt, then each child types in as its own row
// once the panel scrolls into view.
const TerminalPanel: React.FC<TerminalPanelProps> = ({ cmd, path, className = '', children }) => {
    const ref = useRef<HTMLDivElement>(null);
    const [visible, setVisible] = useState(false);
    const rows = React.Children.toArray(children);

    useEffect(() => {
        const el = ref.current;
        if (!el) return;
        const observer = new IntersectionObserver(([entry]) => {
            if (entry.isIntersecting) {
                setVisible(true);
                observer.disconnect();
            }
        }, { threshold: 0.15 });
        observer.observe(el);
        return () => observer.disconnect();
    }, []);

    return (
        <div ref={ref} className={`term-panel ${visible ? 'is-visible' : ''} ${className}`}>
            <TermPrompt cmd={cmd} path={path} />
            {rows.map((row, i) => (
                <div key={i} className="term-row" style={{ '--row': i } as React.CSSProperties}>
                    {row}
                </div>
            ))}
        </div>
    );
};

export default TerminalPanel;
