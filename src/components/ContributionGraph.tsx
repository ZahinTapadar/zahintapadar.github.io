import React, { useEffect, useRef, useState } from 'react';
import TerminalPanel, { TermPrompt } from './TerminalPanel';

const GITHUB_USER = 'zahintapadar';

interface Day {
    date: string;
    count: number;
    level: number;
}

// Notable open-source contributions, most recent first
const contributions = [
    {
        repo: 'cortex-command-community/Cortex-Command-Community-Project',
        stars: '332',
        date: 'Oct 2026',
        what: 'native ARM64 macOS build, RakNet fixes for modern GCC',
        link: 'https://github.com/cortex-command-community/Cortex-Command-Community-Project/pulls?q=author%3AZahinTapadar'
    },
    {
        repo: 'PDFCraftTool/pdfcraft',
        stars: '9.4k',
        date: 'May 2026',
        what: 'Tauri v2 desktop shell, CI/CD and automated release pipeline',
        link: 'https://github.com/PDFCraftTool/pdfcraft/pulls?q=author%3AZahinTapadar'
    },
    {
        repo: 'neo773/macgamingdb',
        stars: '',
        date: 'Mar 2026',
        what: 'editable reviews, CrossOver 26.0 and A18 Pro device support',
        link: 'https://github.com/neo773/macgamingdb/pulls?q=author%3AZahinTapadar'
    }
];

const MONTHS = ['jan', 'feb', 'mar', 'apr', 'may', 'jun', 'jul', 'aug', 'sep', 'oct', 'nov', 'dec'];

const ContributionGraph: React.FC = () => {
    const [days, setDays] = useState<Day[] | null>(null);
    const [total, setTotal] = useState<number | null>(null);
    const [failed, setFailed] = useState(false);
    const scrollRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        fetch(`https://github-contributions-api.jogruber.de/v4/${GITHUB_USER}?y=last`)
            .then(res => {
                if (!res.ok) throw new Error(String(res.status));
                return res.json();
            })
            .then(data => {
                setDays(data.contributions);
                setTotal(data.total.lastYear);
            })
            .catch(() => setFailed(true));
    }, []);

    // On narrow screens, start scrolled to the most recent weeks
    useEffect(() => {
        if (days && scrollRef.current) {
            scrollRef.current.scrollLeft = scrollRef.current.scrollWidth;
        }
    }, [days]);

    // Pad the start so the first column begins on Sunday, then chunk into weeks
    const weeks: (Day | null)[][] = [];
    if (days && days.length) {
        const padded: (Day | null)[] = [
            ...Array(new Date(days[0].date).getUTCDay()).fill(null),
            ...days
        ];
        for (let i = 0; i < padded.length; i += 7) weeks.push(padded.slice(i, i + 7));
    }

    return (
        <section id="activity" className="minimal-section" aria-labelledby="activity-heading">
            <h2 id="activity-heading" className="sr-only">github activity</h2>
            <TerminalPanel cmd="gh contributions">
                <div className="minimal-contrib-header">
                    <a href={`https://github.com/${GITHUB_USER}`} target="_blank" rel="noopener noreferrer">github.com/{GITHUB_USER}</a>
                    <span className="term-meta">
                        {total !== null ? `${total} contributions in the last year` : failed ? 'graph unavailable' : 'loading...'}
                    </span>
                </div>

                {/* The total above is the readable summary; the grid itself is visual only */}
                <div aria-hidden="true">
                    <div className="minimal-contrib-scroll" ref={scrollRef}>
                        <div className="minimal-contrib-grid">
                            {weeks.map((week, w) => {
                                // Label the week in which a new month starts
                                const first = week.find(d => d && new Date(d.date).getUTCDate() === 1);
                                return (
                                    <div key={w} className="minimal-contrib-week">
                                        <span className="minimal-contrib-month">
                                            {first ? MONTHS[new Date(first.date).getUTCMonth()] : ''}
                                        </span>
                                        {week.map((day, d) => day ? (
                                            <span
                                                key={d}
                                                className={`minimal-contrib-cell level-${day.level}`}
                                                style={{ '--i': w } as React.CSSProperties}
                                                title={`${day.count} contribution${day.count === 1 ? '' : 's'} on ${day.date}`}
                                            />
                                        ) : (
                                            <span key={d} className="minimal-contrib-cell empty" />
                                        ))}
                                    </div>
                                );
                            })}
                        </div>
                    </div>

                    <div className="minimal-contrib-legend">
                        <span>less</span>
                        {[0, 1, 2, 3, 4].map(l => <span key={l} className={`minimal-contrib-cell level-${l}`} />)}
                        <span>more</span>
                    </div>
                </div>

                <TermPrompt cmd="gh pr list --merged" />

                {contributions.map(c => (
                    <div key={c.repo} className="minimal-project" style={{ marginBottom: '0.75rem' }}>
                        <div className="minimal-project-header">
                            <a href={c.link} target="_blank" rel="noopener noreferrer">{c.repo}</a>
                            <span className="term-meta">{c.date}</span>
                        </div>
                        <div className="minimal-role">
                            {c.stars && <span>★ {c.stars} </span>}
                            ({c.what})
                        </div>
                    </div>
                ))}
            </TerminalPanel>
        </section>
    );
};

export default ContributionGraph;
