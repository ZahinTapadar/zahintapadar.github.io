import React, { useEffect, useState } from 'react';
import './MinimalPortfolio.css';
import pfpImg from '../assets/pfp.jpg';
import firstImg from '../assets/first.jpg';
import lastImg from '../assets/last.jpg';
import iconComputer from '../assets/exp.jpg';
import iconFolder from '../assets/project.jpg';
import iconStar from '../assets/icon_star.jpg';
import graphicId from '../assets/graphic_id.jpg';
import projectsImg from '../assets/projects.jpeg';
import endlineImg from '../assets/endline.png';
import startcleanImg from '../assets/startclean.png';
import techstackImg from '../assets/techstack.jpeg';
import playImg from '../assets/play.png';

interface MinimalPortfolioProps {
    onToggleMode: () => void;
}

const works = [
    { id: 7, title: 'ADB App Manager', year: '2026', roles: 'Developed', link: '#' },
    { id: 1, title: 'BeautifyOllama', year: '2025', roles: 'Developed', link: 'https://beautifyollama.vercel.app/' },
    { id: 2, title: 'Tech For Life', year: '2025', roles: 'Developed', link: 'https://techforlife.vercel.app/' },
    { id: 3, title: 'BTR GOV', year: '2025', roles: 'Developed', link: 'https://www.btripr.in/' },
    { id: 4, title: 'Personify', year: '2025', roles: 'Developed', link: 'https://personify-iota.vercel.app/' },
    { id: 5, title: 'Quize', year: '2024', roles: 'Developed', link: 'https://quize-mps.vercel.app/' },
    { id: 6, title: 'WebGeny', year: '2023', roles: 'Developed', link: 'https://webgeny.pages.dev/' },
    { id: 8, title: 'Razer Mouse Manager for macOS', year: '2026', roles: 'Built', link: 'https://github.com/ZahinTapadar/DeathAdder-V2-X-Hyperspeed-macos' }
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

const techs = [
    'C', 'C++', 'Unity', 'OpenGL', 'Python', 'Lua', 'LuaJIT', 'LÖVE', 'React', 'Next.js', 'TypeScript', "Astro", "Svelte",
    'GSAP', 'Tailwind CSS', 'Firebase', 'Vercel'
];

const MinimalPortfolio: React.FC<MinimalPortfolioProps> = ({ onToggleMode }) => {
    const [time, setTime] = useState(new Date().toLocaleTimeString());
    const [isPlayModalOpen, setIsPlayModalOpen] = useState(false);
    const [selectedGame, setSelectedGame] = useState<'none' | 'dino' | 'flappy'>('none');

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

                <section className="minimal-section">
                    <div style={{ margin: '0 0 2rem 0', display: 'flex', justifyContent: 'center' }}>
                        <img 
                            src={startcleanImg} 
                            alt="Start Graphic" 
                            style={{ width: '100%', maxWidth: '500px', objectFit: 'contain' }}
                        />
                    </div>
                    <p>hey, i'm zahin.</p>
                    <p>
                        i'm a computer science student trying to get better at systems, algorithms, and low-level programming.
                        basically, figuring out how things work under the hood while still building interfaces people can actually use.
                    </p>
                    <p>
                        lately i've been spending more time understanding mathematical modeling, performance optimization, and computational thinking.
                    </p>

                    <div style={{ margin: '2rem 0' }}>
                        <img 
                            src={firstImg} 
                            alt="Aesthetic scenery" 
                            className="minimal-aesthetic-img"
                        />
                    </div>
                    
                    <div className="minimal-socials" style={{ alignItems: 'center' }}>
                        <a href="https://github.com/zahintapadar" target="_blank" rel="noopener noreferrer">Github</a>
                        <a href="https://www.linkedin.com/in/zahin-tapadar-524640243/" target="_blank" rel="noopener noreferrer">LinkedIn</a>
                        <a href="https://ring.seggs.lol" target="_blank" rel="noopener noreferrer" style={{ display: 'inline-flex', alignItems: 'center' }}>
                            <img src="/threadlocked.png" alt="Part of webring" style={{ height: '1.5rem', width: 'auto' }} />
                        </a>
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
                    {works.map(work => (
                        <div key={work.id} className="minimal-project">
                            <div className="minimal-project-header">
                                <a href={work.link} target="_blank" rel="noopener noreferrer" className="minimal-project-title">{work.title}</a>
                                <span className="minimal-project-year">[{work.year}]</span>
                            </div>
                            <div className="minimal-role">({work.roles})</div>
                        </div>
                    ))}
                </section>

                <div style={{ display: 'flex', justifyContent: 'center', margin: '1rem 0' }}>
                    <img src={endlineImg} alt="Divider" style={{ width: '100%', maxWidth: '400px', objectFit: 'contain', mixBlendMode: 'screen' }} />
                </div>

                <section className="minimal-section">
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1rem', marginTop: '2rem' }}>
                        <img src={iconComputer} alt="" style={{ width: '40px', height: '40px', objectFit: 'contain' }} />
                        <h2 style={{ margin: 0 }}>experience</h2>
                    </div>
                    {expItems.map((item, idx) => (
                        <div key={idx} className="minimal-experience-item">
                            <div className="minimal-project-header">
                                <span className="minimal-project-title">{item.title}</span>
                                <span className="minimal-project-year">[{item.year}]</span>
                            </div>
                            <div style={{ marginBottom: '0.5rem' }}>
                                <a href={item.link} target="_blank" rel="noopener noreferrer">@{item.company}</a>
                            </div>
                            <p style={{ color: '#abb2bf' }}>{item.desc}</p>
                        </div>
                    ))}
                </section>

                <div style={{ display: 'flex', justifyContent: 'center', margin: '1rem 0' }}>
                    <img src={endlineImg} alt="Divider" style={{ width: '100%', maxWidth: '400px', objectFit: 'contain', mixBlendMode: 'screen' }} />
                </div>

                <div style={{ margin: '3rem 0', display: 'flex', justifyContent: 'center' }}>
                    <img 
                        src={graphicId} 
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
                    <div className="minimal-tech-list">
                        {techs.map((tech, idx) => (
                            <span key={idx}>{tech}{idx < techs.length - 1 ? ' /' : ''}</span>
                        ))}
                    </div>
                </section>

                <div style={{ display: 'flex', justifyContent: 'center', margin: '1rem 0' }}>
                    <img src={endlineImg} alt="Divider" style={{ width: '100%', maxWidth: '400px', objectFit: 'contain', mixBlendMode: 'screen' }} />
                </div>

                <section className="minimal-section" style={{ paddingBottom: '4rem' }}>
                    <p>
                        if you want to collaborate, discuss ideas, or just point out something i got wrong, feel free to reach out: <a href="mailto:zahintapadar@gmail.com">[email me]</a>
                    </p>

                    <div style={{ margin: '3rem 0' }}>
                        <img 
                            src={lastImg} 
                            alt="Aesthetic ending" 
                            className="minimal-aesthetic-img"
                        />
                    </div>

                    <p style={{ color: '#5c6370', fontStyle: 'italic', marginTop: '2rem' }}>
                        EOF
                    </p>

                    <div style={{ display: 'flex', justifyContent: 'center', margin: '4rem 0 2rem 0' }}>
                        <img 
                            src={playImg} 
                            alt="Play" 
                            style={{ width: '60px', height: '60px', cursor: 'pointer', objectFit: 'contain', opacity: 0.8, transition: 'opacity 0.2s' }}
                            onClick={() => setIsPlayModalOpen(true)}
                            onMouseEnter={(e) => e.currentTarget.style.opacity = '1'}
                            onMouseLeave={(e) => e.currentTarget.style.opacity = '0.8'}
                        />
                    </div>
                </section>
            </div>

            {isPlayModalOpen && (
                <div className="minimal-play-modal-overlay">
                    <div className="minimal-play-modal">
                        <div className="minimal-play-header">
                            <h3>{selectedGame === 'none' ? 'select a game' : (selectedGame === 'dino' ? 't-rex runner' : 'flappy bird')}</h3>
                            <button onClick={() => { setIsPlayModalOpen(false); setSelectedGame('none'); }}>[close]</button>
                        </div>
                        <div className="minimal-play-content">
                            {selectedGame === 'none' ? (
                                <div className="minimal-play-options">
                                    <button onClick={() => setSelectedGame('dino')}>[play_dino]</button>
                                    <button onClick={() => setSelectedGame('flappy')}>[play_flappy_bird]</button>
                                </div>
                            ) : selectedGame === 'dino' ? (
                                <iframe src="https://offline-dino-game.firebaseapp.com/" width="100%" height="400px" frameBorder="0" style={{ borderRadius: '4px' }}></iframe>
                            ) : (
                                <iframe src="https://nebezb.com/floppybird/" width="100%" height="400px" frameBorder="0" style={{ borderRadius: '4px' }}></iframe>
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
