import { useCallback, useState } from 'react';
import { SplineScene } from './SplineScene';
import './Hero.css';

const Hero = () => {
    const [isLoaded, setIsLoaded] = useState(false);

    const onLoad = useCallback(() => {
        setIsLoaded(true);
    }, []);

    return (
        <section className="hero-section">
            <div className="hero-spline-placeholder" style={{ opacity: isLoaded ? 1 : 0, transition: 'opacity 1s ease-in' }}>
                <SplineScene
                    scene="https://prod.spline.design/F2yQSqyINnxTYu8k/scene.splinecode"
                    className="w-full h-full"
                    onLoad={onLoad}
                />
            </div>

            <div className="container" style={{ position: 'relative', zIndex: 1, padding: '0 var(--grid-margin)', height: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '1.5rem', pointerEvents: 'none' }}>
                <div data-animate style={{ textAlign: 'center', width: '100%' }}>
                    <h1 className="font-serif italic" style={{ fontSize: 'var(--font-size-display)', lineHeight: 1, color: '#FE716D', textShadow: '0 4px 12px rgba(0,0,0,0.1)', margin: '0' }}>
                        Zahin Tapadar
                    </h1>
                </div>

                <div data-animate style={{ textAlign: 'center', width: '100%' }}>
                    <h2 className="font-display" style={{ fontSize: 'var(--font-size-h1)', lineHeight: 0.9, letterSpacing: 'var(--tracking-tight)', color: '#FF7D52', textShadow: '0 4px 12px rgba(0,0,0,0.1)', margin: '0' }}>
                        Full Stack Developer
                    </h2>
                </div>
            </div>
        </section>
    );
};

export default Hero;
