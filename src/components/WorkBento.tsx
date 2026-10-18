import './WorkBento.css';

// Project image imports
import personifyImg from '../assets/personifymac.webp';
import ollamaImg from '../assets/ollamamac.webp';
import techForLifeImg from '../assets/telmac.webp';
import btrImg from '../assets/btr-logo.png';
import quizeImg from '../assets/quizemac.webp';
import webGenyImg from '../assets/webgenymac.webp';
import adbAppManagerImg from '../assets/adbappmanager.webp';
import razerManagerImg from '../assets/razermanager.webp';
import schwarzschildImg from '../assets/schwarzschildlab.webp';

const works = [
    { id: 10, title: 'Schwarzschild Lab', year: '2026', roles: [{ name: 'Role', value: 'Built' }], image: schwarzschildImg, link: 'https://zahintapadar.github.io/schwarzschild-lab/' },
    { id: 7, title: 'ADB App Manager', year: '2026', roles: [{ name: 'Role', value: 'Developed' }], image: adbAppManagerImg, link: 'https://github.com/ZahinTapadar/adb-app-manager' },
    { id: 8, title: 'Razer Mouse Manager for macOS', year: '2026', roles: [{ name: 'Experience', value: 'Built' }], image: razerManagerImg, link: 'https://github.com/ZahinTapadar/DeathAdder-V2-X-Hyperspeed-macos' },
    { id: 1, title: 'BeautifyOllama', year: '2025', roles: [{ name: 'Role', value: 'Developed' }], image: ollamaImg, link: 'https://beautifyollama.vercel.app/' },
    { id: 2, title: 'Tech For Life', year: '2025', roles: [{ name: 'Role', value: 'Developed' }], image: techForLifeImg, link: 'https://techforlife.vercel.app/' },
    { id: 3, title: 'BTR GOV', year: '2025', roles: [{ name: 'Role', value: 'Developed' }], image: btrImg, link: 'https://www.btripr.in/' },
    { id: 4, title: 'Personify', year: '2025', roles: [{ name: 'Role', value: 'Developed' }], image: personifyImg, link: 'https://personify-iota.vercel.app/' },
    { id: 5, title: 'Quize', year: '2024', roles: [{ name: 'Role', value: 'Developed' }], image: quizeImg, link: 'https://quize-mps.vercel.app/' },
    { id: 6, title: 'WebGeny', year: '2023', roles: [{ name: 'Role', value: 'Developed' }], image: webGenyImg, link: 'https://webgeny.pages.dev/' }
];

const WorkBento = () => {
    return (
        <section id="work" className="container section-padding">
            <div style={{ marginBottom: '4rem', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
                <h2 className="font-heading" style={{ fontSize: 'var(--font-size-h2)', letterSpacing: 'var(--tracking-tight)', color: 'var(--color-charcoal)' }}>Projects</h2>
                <div className="font-mono" style={{ fontSize: 'var(--font-size-small)', color: 'var(--color-text-secondary)', textAlign: 'right', textTransform: 'uppercase' }}>
                    Selected Works
                </div>
            </div>

            <div className="bento-grid">
                {works.map((work) => (
                    <div key={work.id} className="bento-item" data-animate>
                        <a href={work.link} target="_blank" rel="noopener noreferrer" style={{ display: 'block' }}>
                            <div className="bento-image-card">
                                <img
                                    src={work.image}
                                    alt={work.title}
                                    loading="lazy"
                                    decoding="async"
                                    className="bento-image"
                                />
                            </div>
                        </a>

                        <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
                            <div className="font-mono" style={{ fontSize: 'var(--font-size-small)', display: 'flex', justifyContent: 'space-between', marginBottom: '0.25rem' }}>
                                <span style={{ color: 'var(--color-text-secondary)' }}>{work.year}</span>
                            </div>
                            <h3 className="bento-title font-heading" style={{ fontSize: 'var(--font-size-h3)', color: 'var(--color-charcoal)', fontWeight: 600 }}>
                                <a href={work.link} target="_blank" rel="noopener noreferrer" style={{ textDecoration: 'none', color: 'inherit', transition: 'color 0.2s', display: 'inline-flex', alignItems: 'center', gap: '0.5rem' }} onMouseEnter={(e) => e.currentTarget.style.color = 'var(--color-clay)'} onMouseLeave={(e) => e.currentTarget.style.color = 'inherit'}>
                                    {work.title}
                                    <span style={{ fontSize: '0.7em', paddingBottom: '0.1em' }}>↗</span>
                                </a>
                            </h3>

                            <div className="bento-roles">
                                {work.roles.map((r, i) => (
                                    <div key={i} className="bento-role-row font-mono" style={{ fontSize: 'var(--font-size-small)' }}>
                                        <span style={{ color: 'var(--color-text-secondary)' }}>{r.name}</span>
                                        <span style={{ color: 'var(--color-charcoal)', fontWeight: 500 }}>{r.value}</span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                ))}
            </div>
        </section>
    );
};

export default WorkBento;
