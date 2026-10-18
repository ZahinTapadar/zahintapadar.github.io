import React, { useEffect, useState } from 'react';
import './MinimalPortfolio.css';
import pfpImg from '../assets/pfp-cyberpunk.png';
import firstImg from '../assets/first.jpg';
import lastImg from '../assets/last.jpg';
import iconComputer from '../assets/exp.jpg';
import iconFolder from '../assets/project.jpg';
import iconStar from '../assets/icon_star.jpg';
import mikuImg from '../assets/b&wmiku.jpeg';
import projectsImg from '../assets/projects.jpeg';
import endlineImg from '../assets/endline.png';
import startcleanImg from '../assets/startclean.png';
import techstackImg from '../assets/techstack.jpeg';
import playImg from '../assets/play.png';
import gothicImg from '../assets/edge.jpeg';
import lilyImg from '../assets/bgblr2.jpg';
import ContributionGraph from './ContributionGraph';
import TechTree from './TechTree';
import TerminalPanel, { TermPrompt } from './TerminalPanel';
import StackOverflow from './games/StackOverflow';
import GarbageCollector from './games/GarbageCollector';

interface MinimalPortfolioProps {
    onToggleMode: () => void;
}

const works: { id: number; title: string; year: string; roles: string; detail?: string; link: string }[] = [
    { id: 10, title: 'Schwarzschild Lab', year: '2026', roles: 'Built', detail: 'black hole ray tracer, rust/wasm', link: 'https://zahintapadar.github.io/schwarzschild-lab/' },
    { id: 9, title: 'Lua Wordle Solver', year: '2026', roles: 'Built', detail: 'lua + c minimax core', link: 'https://zahintapadar.github.io/Wordle-Algorithm/' },
    { id: 7, title: 'ADB App Manager', year: '2026', roles: 'Developed', link: 'https://github.com/ZahinTapadar/adb-app-manager' },
    { id: 8, title: 'Razer Mouse Manager for macOS', year: '2026', roles: 'Built', link: 'https://github.com/ZahinTapadar/DeathAdder-V2-X-Hyperspeed-macos' },
    { id: 1, title: 'BeautifyOllama', year: '2025', roles: 'Developed', link: 'https://beautifyollama.vercel.app/' },
    { id: 2, title: 'Tech For Life', year: '2025', roles: 'Developed', link: 'https://techforlife.vercel.app/' },
    { id: 3, title: 'BTR GOV', year: '2025', roles: 'Developed', link: 'https://www.btripr.in/' },
    { id: 4, title: 'Personify', year: '2025', roles: 'Developed', link: 'https://personify-iota.vercel.app/' },
    { id: 5, title: 'Quize', year: '2024', roles: 'Developed', link: 'https://quize-mps.vercel.app/' },
    { id: 6, title: 'WebGeny', year: '2023', roles: 'Developed', link: 'https://webgeny.pages.dev/' }
];

const expItems = [
    {
        year: '2025',
        title: 'Contractual Work',
        company: 'BTR IPR',
        link: 'https://www.btripr.in/',
        desc: 'Contractual work for BTR IPR.'
    },
    {
        year: '2024',
        title: 'Web Development Intern (Frontend)',
        company: 'DataGlimpse',
        link: 'https://www.linkedin.com/company/dataglimpse',
        desc: 'Completed a 2-month internship focusing on frontend development, building out interfaces, and optimizing web experiences.'
    }
];

const links = [
    { label: 'github', href: 'https://github.com/zahintapadar' },
    { label: 'linkedin', href: 'https://www.linkedin.com/in/zahin-tapadar-524640243/' },
    { label: 'email', href: 'mailto:zahintapadar@gmail.com' }
];

const techGroups = [
    { dir: 'systems', color: '#e06c75', items: ['C', 'C++', 'Rust', 'WebAssembly'] },
    { dir: 'graphics', color: '#d19a66', items: ['OpenGL', 'WebGL2', 'GLSL'] },
    { dir: 'languages', color: '#e5c07b', items: ['Python', 'Lua', 'LuaJIT', 'TypeScript'] },
    { dir: 'gamedev', color: '#c678dd', items: ['Unity', 'LÖVE'] },
    { dir: 'web', color: '#61afef', items: ['React', 'Next.js', 'Astro', 'Svelte', 'Tailwind CSS', 'GSAP', 'Tauri'] },
    { dir: 'infra', color: '#98c379', items: ['Firebase', 'Vercel', 'GitHub Actions'] },
    { dir: 'tools', color: '#56b6c2', items: ['Neovim', 'IDA Pro', 'Ghidra'] }
];

const MinimalPortfolio: React.FC<MinimalPortfolioProps> = ({ onToggleMode }) => {
    const [time, setTime] = useState(new Date().toLocaleTimeString());
    const [isPlayModalOpen, setIsPlayModalOpen] = useState(false);
    const [selectedGame, setSelectedGame] = useState<'none' | 'stack' | 'gc'>('none');

    useEffect(() => {
        const timer = setInterval(() => setTime(new Date().toLocaleTimeString()), 1000);
        return () => clearInterval(timer);
    }, []);

    return (
        <div className="minimal-portfolio">
            <div className="minimal-container">
                <header className="minimal-header">
                    <div>
                        <span style={{ color: '#5c6370' }}>EST. 2019</span>
                    </div>
                    <div style={{ color: '#5c6370' }}>
                        {time} | GMT+5:30
                    </div>
                </header>

                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '3rem' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem' }}>
                        <img
                            src={pfpImg}
                            alt="Profile"
                            style={{ width: '80px', height: '80px', borderRadius: '4px', objectFit: 'cover' }}
                        />
                        <div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                                <h1 style={{ fontSize: '2em', marginBottom: '0.2rem', marginTop: 0 }}>zahin</h1>
                                <img src={iconStar} alt="" style={{ width: '32px', height: '32px', objectFit: 'contain' }} />
                            </div>
                            <div style={{ color: '#5c6370', fontSize: '1.2em' }}>engineer</div>
                        </div>
                    </div>
                    <nav className="minimal-nav">
                        <button onClick={onToggleMode}>[rich_mode]</button>
                    </nav>
                </div>

                <ContributionGraph />

                <section className="minimal-section">
                    <div style={{ margin: '0 0 2rem 0', display: 'flex', justifyContent: 'center' }}>
                        <img
                            src={startcleanImg}
                            alt="Start Graphic"
                            style={{ width: '100%', maxWidth: '500px', objectFit: 'contain' }}
                        />
                    </div>
                    <TerminalPanel cmd="cat about.txt">
                        <p className="term-text" style={{ color: '#ffffff' }}>hey, i'm zahin.</p>
                        <p className="term-text">
                            i'm a computer science student trying to get better at <span className="term-hl" style={{ color: '#e06c75' }}>systems</span>, <span className="term-hl" style={{ color: '#e5c07b' }}>algorithms</span>, and <span className="term-hl" style={{ color: '#c678dd' }}>low-level programming</span>.
                            basically, figuring out how things work under the hood while still building interfaces people can actually use.
                        </p>
                        <p className="term-text">
                            lately i've been spending more time understanding mathematical modeling, performance optimization, and computational thinking.
                        </p>
                        <TermPrompt cmd="ls ~/links" />
                        <div className="term-chips" style={{ '--accent': '#61afef', alignItems: 'center' } as React.CSSProperties}>
                            {links.map((l, i) => (
                                <a key={l.label} href={l.href} target="_blank" rel="noopener noreferrer" className="term-chip term-chip-link" style={{ '--chip': i } as React.CSSProperties}>
                                    {l.label} ↗
                                </a>
                            ))}
                            <a href="https://ring.seggs.lol" target="_blank" rel="noopener noreferrer" className="term-chip-img" style={{ '--chip': links.length } as React.CSSProperties}>
                                <img src="/threadlocked.png" alt="Part of webring" style={{ height: '1.5rem', width: 'auto', display: 'block' }} />
                            </a>
                        </div>
                    </TerminalPanel>

                    <div style={{ margin: '2rem 0 0 0' }}>
                        <img
                            src={firstImg}
                            alt="Aesthetic scenery"
                            className="minimal-aesthetic-img"
                        />
                    </div>
                </section>

                <div style={{ display: 'flex', justifyContent: 'center', margin: '1rem 0' }}>
                    <img src={endlineImg} alt="Divider" style={{ width: '100%', maxWidth: '400px', objectFit: 'contain', mixBlendMode: 'screen' }} />
                </div>

                <section className="minimal-section">
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1rem', marginTop: '2rem' }}>
                        <img src={iconFolder} alt="" style={{ width: '40px', height: '40px', objectFit: 'contain' }} />
                        <h2 style={{ margin: 0 }}>projects</h2>
                    </div>
                    <div style={{ margin: '2rem 0', display: 'flex', justifyContent: 'center' }}>
                        <img
                            src={projectsImg}
                            alt="Projects Graphic"
                            className="minimal-aesthetic-img"
                            style={{ maxWidth: '400px' }}
                        />
                    </div>
                    <TerminalPanel cmd="ls ~/projects">
                        {works.map(work => (
                            <div key={work.id} className="term-ls-row">
                                <span style={{ color: '#e5c07b' }}>{work.year}</span>
                                <span>
                                    <a href={work.link} target="_blank" rel="noopener noreferrer" className="minimal-project-title">{work.title}</a>
                                    {work.detail && <span className="minimal-role"> {work.detail}</span>}
                                </span>
                            </div>
                        ))}
                    </TerminalPanel>
                </section>

                <div style={{ display: 'flex', justifyContent: 'center', margin: '1rem 0' }}>
                    <img src={endlineImg} alt="Divider" style={{ width: '100%', maxWidth: '400px', objectFit: 'contain', mixBlendMode: 'screen' }} />
                </div>

                <section className="minimal-section">
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1rem', marginTop: '2rem' }}>
                        <img src={iconComputer} alt="" style={{ width: '40px', height: '40px', objectFit: 'contain' }} />
                        <h2 style={{ margin: 0 }}>experience</h2>
                    </div>
                    <TerminalPanel cmd="git log career">
                        {expItems.map(item => (
                            <div key={item.company} className="term-log-row">
                                <div>
                                    <span style={{ color: '#e5c07b' }}>{item.year}</span>{' '}
                                    <span className="minimal-project-title">{item.title}</span>{' '}
                                    <a href={item.link} target="_blank" rel="noopener noreferrer">@{item.company}</a>
                                </div>
                                <div className="term-log-desc">{item.desc}</div>
                            </div>
                        ))}
                    </TerminalPanel>
                </section>

                <div style={{ display: 'flex', justifyContent: 'center', margin: '1rem 0' }}>
                    <img src={endlineImg} alt="Divider" style={{ width: '100%', maxWidth: '400px', objectFit: 'contain', mixBlendMode: 'screen' }} />
                </div>

                <div style={{ margin: '3rem 0', display: 'flex', justifyContent: 'center' }}>
                    <img
                        src={mikuImg}
                        alt="Aesthetic Graphic"
                        className="minimal-aesthetic-img"
                        style={{ maxWidth: '400px' }}
                    />
                </div>

                <section className="minimal-section">
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1rem', marginTop: '2rem' }}>
                        <img src={techstackImg} alt="" style={{ width: '40px', height: '40px', objectFit: 'contain' }} />
                        <h2 style={{ margin: 0 }}>tech stack</h2>
                    </div>
                    <TechTree groups={techGroups} />
                </section>

                <div style={{ display: 'flex', justifyContent: 'center', margin: '1rem 0' }}>
                    <img src={endlineImg} alt="Divider" style={{ width: '100%', maxWidth: '400px', objectFit: 'contain', mixBlendMode: 'screen' }} />
                </div>

                <section className="minimal-section" style={{ marginBottom: 0 }}>
                    <div style={{ margin: '0 0 2rem 0', display: 'flex', justifyContent: 'center' }}>
                        <img
                            src={lilyImg}
                            alt="Spider lily"
                            className="minimal-aesthetic-img"
                            style={{ maxWidth: '400px' }}
                        />
                    </div>
                    <TerminalPanel cmd="./contact">
                        <p className="term-text">
                            if you want to collaborate, discuss ideas, or just point out something i got wrong, feel free to reach out:
                        </p>
                        <a href="mailto:zahintapadar@gmail.com" className="term-chip term-chip-link" style={{ '--accent': '#98c379', '--chip': 0 } as React.CSSProperties}>
                            [email me] ↗
                        </a>
                    </TerminalPanel>

                    <div style={{ margin: '3rem 0' }}>
                        <img
                            src={lastImg}
                            alt="Aesthetic ending"
                            className="minimal-aesthetic-img"
                        />
                    </div>

                </section>
            </div>

            {/* Full-width ending: the artwork fades in from black right after the last picture */}
            <div className="minimal-eof" style={{ '--eof-bg': `url(${gothicImg})` } as React.CSSProperties}>
                <div className="minimal-eof-inner">
                    <p style={{ color: '#5c6370', fontStyle: 'italic', margin: 0 }}>
                        EOF
                    </p>

                    <div style={{ display: 'flex', justifyContent: 'center', margin: '4rem 0 0 0' }}>
                        <img
                            src={playImg}
                            alt="Play"
                            style={{ width: '60px', height: '60px', cursor: 'pointer', objectFit: 'contain', opacity: 0.8, transition: 'opacity 0.2s' }}
                            onClick={() => setIsPlayModalOpen(true)}
                            onMouseEnter={(e) => e.currentTarget.style.opacity = '1'}
                            onMouseLeave={(e) => e.currentTarget.style.opacity = '0.8'}
                        />
                    </div>
                </div>
            </div>

            {isPlayModalOpen && (
                <div className="minimal-play-modal-overlay">
                    <div className="minimal-play-modal">
                        <div className="minimal-play-header">
                            <h3>{selectedGame === 'none' ? 'select a game' : (selectedGame === 'stack' ? 'stack_overflow' : 'garbage_collector')}</h3>
                            <button onClick={() => { setIsPlayModalOpen(false); setSelectedGame('none'); }}>[close]</button>
                        </div>
                        <div className="minimal-play-content">
                            {selectedGame === 'none' ? (
                                <div className="minimal-play-options">
                                    <button onClick={() => setSelectedGame('stack')}>[stack_overflow]</button>
                                    <button onClick={() => setSelectedGame('gc')}>[garbage_collector]</button>
                                </div>
                            ) : selectedGame === 'stack' ? (
                                <StackOverflow />
                            ) : (
                                <GarbageCollector />
                            )}
                            {selectedGame !== 'none' && (
                                <div style={{ marginTop: '1rem', textAlign: 'center' }}>
                                    <button onClick={() => setSelectedGame('none')} style={{ background: 'none', border: 'none', color: '#61afef', cursor: 'pointer', fontFamily: 'inherit', textDecoration: 'underline' }}>[back]</button>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default MinimalPortfolio;
