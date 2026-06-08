import { NeatBackground, techStackGradientConfig } from './NeatBackground';
import './TechStack.css';

const techs = [
    'C', 'C++', 'Unity', 'OpenGL', 'Python', 'Lua', 'LuaJIT', 'LÖVE', 'React', 'Next.js', 'TypeScript', "Astro", "Svelte",
    'GSAP', 'Tailwind CSS', 'Firebase', 'Vercel'
];

const TechStack = () => {
    return (
        <section className="section-padding tech-stack-section">
            {/* Animated gradient background — full bleed */}
            <div className="tech-stack-gradient-bg">
                <NeatBackground config={techStackGradientConfig} />
            </div>

            <div className="container tech-stack-content-container">
                <h2 className="font-heading" style={{ fontSize: 'var(--font-size-body)', fontWeight: 600, color: 'var(--color-charcoal)', marginBottom: '2rem' }}>Tech Stack</h2>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                    {techs.map((tech, idx) => (
                        <div key={idx} className="font-display tech-item" style={{
                            fontSize: 'clamp(3rem, 6vw, 5.5rem)',
                            letterSpacing: 'var(--tracking-tight)',
                            lineHeight: 1.1,
                            textTransform: 'uppercase',
                            color: 'var(--color-charcoal)'
                        }} data-animate>
                            {tech}
                        </div>
                    ))}
                </div>
            </div>
        </section>
    );
};

export default TechStack;
