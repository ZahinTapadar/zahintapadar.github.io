import React from 'react';
import TerminalPanel from './TerminalPanel';

interface TechGroup {
    dir: string;
    items: string[];
}

// Renders the stack as `tree` output: directories in the accent, entries neutral
const TechTree: React.FC<{ groups: TechGroup[] }> = ({ groups }) => {
    let chipIndex = 0;

    return (
        <TerminalPanel cmd="tree" path="~/stack">
            {groups.map((group, g) => (
                <div key={group.dir} className="minimal-tree-row">
                    <span className="term-dim">{g === groups.length - 1 ? '└──' : '├──'}</span>
                    <span className="minimal-tree-dir">{group.dir}/</span>
                    <span className="term-chips">
                        {group.items.map(item => (
                            <span key={item} className="term-chip term-chip-plain" style={{ '--chip': chipIndex++ } as React.CSSProperties}>
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
