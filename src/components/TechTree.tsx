import React from 'react';
import TerminalPanel from './TerminalPanel';

interface TechGroup {
    dir: string;
    color: string;
    items: string[];
}

// Renders the stack as `tree` output, one colour-coded directory per category
const TechTree: React.FC<{ groups: TechGroup[] }> = ({ groups }) => {
    let chipIndex = 0;

    return (
        <TerminalPanel cmd="tree" path="~/stack">
            {groups.map((group, g) => (
                <div key={group.dir} className="minimal-tree-row" style={{ '--accent': group.color } as React.CSSProperties}>
                    <span className="term-dim">{g === groups.length - 1 ? '└──' : '├──'}</span>
                    <span className="minimal-tree-dir">{group.dir}/</span>
                    <span className="term-chips">
                        {group.items.map(item => (
                            <span key={item} className="term-chip" style={{ '--chip': chipIndex++ } as React.CSSProperties}>
                                {item}
                            </span>
                        ))}
                    </span>
                </div>
            ))}
        </TerminalPanel>
    );
};

export default TechTree;
