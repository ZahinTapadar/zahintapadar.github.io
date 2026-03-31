import { useState, useCallback } from 'react';
import { SplineScene } from './SplineScene';
import './TechStack.css';

const techs = [
    'C', 'C++', 'Unity', 'OpenGL', 'Python', 'Lua', 'LuaJIT', 'LÖVE', 'React', 'Next.js', 'TypeScript', "Astro", "Svelte",
    'GSAP', 'Tailwind CSS', 'Firebase', 'Vercel'
];

const TechStack = () => {
    const [isLoaded, setIsLoaded] = useState(false);

    const onLoad = useCallback(() => {
        setIsLoaded(true);
    }, []);

    return (
        <section className="container section-padding tech-stack-section">

            {/* 3D Spline Scene Background (Right Side) */}
            <div className="tech-stack-scene-bg">
                <div style={{ opacity: isLoaded ? 1 : 0, transition: 'opacity 1s ease-in', width: '100%', height: '100%' }}>
                    <SplineScene
                        scene="https://prod.spline.design/rhErS-aeoYk7OZDC/scene.splinecode"
                        className="w-full h-full"
                        onLoad={onLoad}
                    />
                </div>
            </div>

            {/* Content (Left Side) */}
            <div className="tech-stack-content-container">
                <h2 className="font-heading" style={{ fontSize: 'var(--font-size-body)', fontWeight: 600, color: 'var(--color-charcoal)', marginBottom: '2rem' }}>Tech Stack</h2>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                    {techs.map((tech, idx) => (
                        <div key={idx} className="font-display" style={{
                            fontSize: 'clamp(2rem, 4vw, 3.5rem)',
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
