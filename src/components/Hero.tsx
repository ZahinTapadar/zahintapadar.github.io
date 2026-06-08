import { NeatBackground, heroGradientConfig } from './NeatBackground';
import './Hero.css';

const Hero = () => {
    return (
        <section className="hero-section">
            {/* Animated gradient background */}
            <div className="hero-gradient-bg">
                <NeatBackground config={heroGradientConfig} />
            </div>

            <div className="container" style={{ position: 'relative', zIndex: 1, padding: '0 var(--grid-margin)', height: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '1.5rem', pointerEvents: 'none' }}>
                <div data-animate style={{ textAlign: 'center', width: '100%' }}>
                    <h1 className="font-serif italic" style={{ fontSize: 'var(--font-size-display)', lineHeight: 1, color: 'var(--color-cream)', textShadow: '0 4px 24px rgba(0,0,0,0.15)', margin: '0' }}>
                        Zahin Tapadar
                    </h1>
                </div>

                <div data-animate style={{ textAlign: 'center', width: '100%' }}>
                    <h2 className="font-display" style={{ fontSize: 'var(--font-size-h1)', lineHeight: 0.9, letterSpacing: 'var(--tracking-tight)', color: 'rgba(242, 240, 233, 0.9)', textShadow: '0 4px 24px rgba(0,0,0,0.15)', margin: '0' }}>
                        Full Stack Developer
                    </h2>
                </div>
            </div>
        </section>
    );
};

export default Hero;
