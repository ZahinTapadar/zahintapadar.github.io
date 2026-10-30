import React, { useEffect, useRef, useState } from 'react';
import './MinimalPortfolio.css';
import pfpImg from '../assets/pfp-cyberpunk.png';
import firstImg from '../assets/first.jpg';
import lastImg from '../assets/last.jpg';
import iconComputer from '../assets/exp.jpg';
import iconFolder from '../assets/project.jpg';
import iconStar from '../assets/icon_star.jpg';
import iconblog from '../assets/blog.png';
import endlineImg from '../assets/endline.png';
import techstackImg from '../assets/techstack.jpeg';
import playImg from '../assets/play.png';
import gothicImg from '../assets/edge.jpeg';
import lilyImg from '../assets/bgblr2.jpg';
import ContributionGraph from './ContributionGraph';
import TechTree from './TechTree';
import TerminalPanel, { TermPrompt } from './TerminalPanel';
import SideNav, { type NavItem } from './SideNav';
import StackOverflow from './games/StackOverflow';
import GarbageCollector from './games/GarbageCollector';
import { posts } from '../blog/posts';

interface MinimalPortfolioProps {
    onToggleMode: () => void;
}

interface Work { id: number; slug?: string; title: string; year: string; detail?: string; link: string; post?: string }

// The three current builds lead; everything older sits in a dimmed archive
const featured: Work[] = [
    { id: 11, slug: 'atlas', title: 'ATLAS', year: '2026', detail: 'macos time tracker, swift + claude', link: 'https://atlasmac.web.app/' },
    { id: 10, slug: 'schwarzschild-lab', title: 'Schwarzschild Lab', year: '2026', detail: 'black hole ray tracer, rust/wasm', link: 'https://zahintapadar.github.io/schwarzschild-lab/', post: '/blog/building-a-black-hole-simulator/' },
    { id: 9, slug: 'wortraum', title: 'wortraum', year: '2026', detail: 'wordle solver, lua + c + wasm', link: 'https://zahintapadar.github.io/wortraum/', post: '/blog/making-a-wordle-solver-that-actually-thinks/' },
];

const archive: Work[] = [
    { id: 7, title: 'ADB App Manager', year: '2026', link: 'https://github.com/ZahinTapadar/adb-app-manager' },
    { id: 8, title: 'Razer Mouse Manager for macOS', year: '2026', link: 'https://github.com/ZahinTapadar/DeathAdder-V2-X-Hyperspeed-macos' },
    { id: 1, title: 'BeautifyOllama', year: '2025', link: 'https://beautifyollama.vercel.app/' },
    { id: 2, title: 'Tech For Life', year: '2025', link: 'https://techforlife.vercel.app/' },
    { id: 3, title: 'BTR GOV', year: '2025', link: 'https://www.btripr.in/' },
    { id: 4, title: 'Personify', year: '2025', link: 'https://personify-iota.vercel.app/' },
    { id: 5, title: 'Quize', year: '2024', link: 'https://quize-mps.vercel.app/' },
    { id: 6, title: 'WebGeny', year: '2023', link: 'https://webgeny.pages.dev/' }
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
    { dir: 'systems', items: ['C', 'C++', 'Rust', 'WebAssembly'] },
    { dir: 'graphics', items: ['OpenGL', 'WebGL2', 'GLSL'] },
    { dir: 'languages', items: ['Python', 'Lua', 'LuaJIT', 'TypeScript'] },
    { dir: 'gamedev', items: ['Unity', 'LÖVE'] },
    { dir: 'web', items: ['React', 'Next.js', 'Astro', 'Svelte', 'Tailwind CSS', 'GSAP', 'Tauri'] },
    { dir: 'infra', items: ['Firebase', 'Vercel', 'GitHub Actions'] },
    { dir: 'tools', items: ['Neovim', 'IDA Pro', 'Ghidra'] }
];

const navItems: NavItem[] = [
    { id: 'about', label: 'about.txt' },
    {
        id: 'projects', label: 'projects/',
        children: [...featured.map((w) => ({ id: `project-${w.slug}`, label: w.slug!.split('-')[0] })), { id: 'archive', label: 'archive/' }],
    },
    { id: 'activity', label: 'activity' },
    { id: 'writing', label: 'blog/' },
    { id: 'experience', label: 'experience' },
    { id: 'stack', label: 'stack/' },
    { id: 'contact', label: 'contact' },
];

const Divider: React.FC = () => (
    <div className="minimal-divider" aria-hidden="true">
        <img src={endlineImg} alt="" />
    </div>
);

const Artwork: React.FC<{ src: string; wide?: boolean }> = ({ src, wide }) => (
    <figure className={`minimal-artwork${wide ? ' is-wide' : ''}`} aria-hidden="true">
        <img src={src} alt="" loading="lazy" />
    </figure>
);

const SectionHead: React.FC<{ icon: string; title: string }> = ({ icon, title }) => (
    <div className="minimal-section-head">
        <img src={icon} alt="" className="minimal-heading-icon" />
        <h2>{title}</h2>
    </div>
);

const About: React.FC = () => (
    <section id="about" className="minimal-section" aria-labelledby="about-heading">
        <h2 id="about-heading" className="sr-only">about</h2>
        <TerminalPanel cmd="cat about.txt">
            <p className="term-text term-text-lead">hey, i'm zahin.</p>
            <p className="term-text">
                i'm a computer science student trying to get better at systems, algorithms, and low-level programming.
                basically, figuring out how things work under the hood while still building interfaces people can actually use.
            </p>
            <p className="term-text">
                lately i've been spending more time understanding mathematical modeling, performance optimization, and computational thinking.
            </p>
            <TermPrompt cmd="ls ~/links" />
            <div className="term-chips" style={{ alignItems: 'center' }}>
                {links.map((l, i) => (
                    <a key={l.label} href={l.href} target="_blank" rel="noopener noreferrer" className="term-chip term-chip-link" style={{ '--chip': i } as React.CSSProperties}>
                        {l.label} ↗
                    </a>
                ))}
                <a href="https://ring.seggs.lol" target="_blank" rel="noopener noreferrer" className="term-chip-img" style={{ '--chip': links.length } as React.CSSProperties}>
                    <img src="/threadlocked.png" alt="Part of the threadlocked webring" />
                </a>
            </div>
        </TerminalPanel>
    </section>
);

const Projects: React.FC = () => (
    <section id="projects" className="minimal-section">
        <SectionHead icon={iconFolder} title="projects" />
        <TerminalPanel cmd="ls ~/projects">
            {featured.map(work => (
                <div key={work.id} id={`project-${work.slug}`} className="term-feature">
                    <div className="term-feature-title">
                        <a href={work.link} target="_blank" rel="noopener noreferrer">{work.title}</a>
                        <span className="term-meta">{work.year}</span>
                    </div>
                    <div className="term-feature-detail">
                        {work.detail}
                        {work.post && <> · <a href={work.post}>devlog</a></>}
                    </div>
                </div>
            ))}
            <div id="archive"><TermPrompt cmd="ls ~/projects/archive" /></div>
            {archive.map(work => (
                <div key={work.id} className="term-ls-row term-archive">
                    <span className="term-meta">{work.year}</span>
                    <a href={work.link} target="_blank" rel="noopener noreferrer">{work.title}</a>
                </div>
            ))}
        </TerminalPanel>
    </section>
);

const Writing: React.FC = () => (
    <section id="writing" className="minimal-section">
        <SectionHead icon={iconblog} title="writing" />
        <TerminalPanel cmd="ls -t ~/blog">
            {posts.map(post => (
                <div key={post.slug} className="term-ls-row">
                    <span className="term-meta">{post.date.slice(0, 4)}</span>
                    <span>
                        <a href={`/blog/${post.slug}/`}>{post.title}</a>
                        {post.subtitle && <span className="minimal-role"> {post.subtitle}</span>}
                    </span>
                </div>
            ))}
        </TerminalPanel>
    </section>
);

const Experience: React.FC = () => (
    <section id="experience" className="minimal-section">
        <SectionHead icon={iconComputer} title="experience" />
        <TerminalPanel cmd="git log career">
            {expItems.map(item => (
                <div key={item.company} className="term-log-row">
                    <div>
                        <span className="term-meta">{item.year}</span>{' '}
                        <span className="minimal-project-title">{item.title}</span>{' '}
                        <a href={item.link} target="_blank" rel="noopener noreferrer">@{item.company}</a>
                    </div>
                    <div className="term-log-desc">{item.desc}</div>
                </div>
            ))}
        </TerminalPanel>
    </section>
);

const Stack: React.FC = () => (
    <section id="stack" className="minimal-section">
        <SectionHead icon={techstackImg} title="tech stack" />
        <TechTree groups={techGroups} />
    </section>
);

const Contact: React.FC = () => (
    <section id="contact" className="minimal-section" aria-labelledby="contact-heading">
        <h2 id="contact-heading" className="sr-only">contact</h2>
        <TerminalPanel cmd="./contact">
            <p className="term-text">
                if you want to collaborate, discuss ideas, or just point out something i got wrong, feel free to reach out:
            </p>
            <a href="mailto:zahintapadar@gmail.com" className="term-chip term-chip-link" style={{ '--chip': 0 } as React.CSSProperties}>
                [email me] ↗
            </a>
        </TerminalPanel>
    </section>
);

const MinimalPortfolio: React.FC<MinimalPortfolioProps> = ({ onToggleMode }) => {
    const [time, setTime] = useState(new Date().toLocaleTimeString());
    const [isPlayModalOpen, setIsPlayModalOpen] = useState(false);
    const [selectedGame, setSelectedGame] = useState<'none' | 'stack' | 'gc'>('none');
    const playRef = useRef<HTMLButtonElement>(null);
    const closeRef = useRef<HTMLButtonElement>(null);

    useEffect(() => {
        const timer = setInterval(() => setTime(new Date().toLocaleTimeString()), 1000);
        return () => clearInterval(timer);
    }, []);

    const closeGames = () => {
        setIsPlayModalOpen(false);
        setSelectedGame('none');
        playRef.current?.focus();
    };

    // The game window behaves like a dialog: focus moves in, Esc closes, focus returns to PLAY
    useEffect(() => {
        if (!isPlayModalOpen) return;
        closeRef.current?.focus();
        const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') closeGames(); };
        window.addEventListener('keydown', onKey);
        return () => window.removeEventListener('keydown', onKey);
    }, [isPlayModalOpen]);

    return (
        <div className="minimal-portfolio">
            <SideNav items={navItems} />
            <div className="minimal-container">
                <header className="minimal-header">
                    <span>EST. 2019</span>
                    <span>{time} | GMT+5:30</span>
                </header>

                <div className="minimal-identity">
                    <div className="minimal-identity-main">
                        <img src={pfpImg} alt="" className="minimal-avatar" />
                        <div>
                            <div className="minimal-name-row">
                                <h1>Zahin</h1>
                                <img src={iconStar} alt="" className="minimal-heading-icon minimal-name-icon" />
                            </div>
                            <div className="minimal-handle">PenguinKat</div>
                            <div className="minimal-role-line">cs student · systems, graphics &amp; low-level</div>
                        </div>
                    </div>
                    <nav className="minimal-nav" aria-label="site">
                        <a href="/blog/">[blog]</a>
                        <button onClick={onToggleMode} title="switch to the full visual portfolio">[rich_mode]</button>
                    </nav>
                </div>

                {/* Panels carry the page; three artworks are the only pauses */}
                <About />
                <Artwork src={firstImg} wide />
                <Projects />
                <Divider />
                <ContributionGraph />
                <Divider />
                <Writing />
                <Artwork src={lilyImg} />
                <Experience />
                <Divider />
                <Stack />
                <Divider />
                <Contact />

                <Artwork src={lastImg} wide />
            </div>

            {/* Full-width ending: the artwork fades in from black right after the last picture */}
            <div className="minimal-eof" style={{ '--eof-bg': `url(${gothicImg})` } as React.CSSProperties}>
                <div className="minimal-eof-inner">
                    <p className="minimal-eof-mark">EOF</p>
                    <button ref={playRef} className="minimal-play-btn" onClick={() => setIsPlayModalOpen(true)} aria-label="Play a game">
                        <img src={playImg} alt="" />
                    </button>
                </div>
            </div>

            {isPlayModalOpen && (
                <div className="minimal-play-modal-overlay" onClick={(e) => { if (e.target === e.currentTarget) closeGames(); }}>
                    <div className="minimal-play-modal" role="dialog" aria-modal="true" aria-labelledby="play-title">
                        <div className="minimal-play-header">
                            <h3 id="play-title">{selectedGame === 'none' ? 'select a game' : (selectedGame === 'stack' ? 'stack_overflow' : 'garbage_collector')}</h3>
                            <button ref={closeRef} onClick={closeGames}>[close]</button>
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
                                <button className="minimal-play-back" onClick={() => setSelectedGame('none')}>[back]</button>
                            )}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default MinimalPortfolio;
