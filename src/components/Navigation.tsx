import { useEffect, useState, useCallback, useRef } from 'react';

interface NavigationProps {
    onToggleMode?: () => void;
}

const Navigation: React.FC<NavigationProps> = ({ onToggleMode }) => {
    const [scrolled, setScrolled] = useState(false);
    const scrolledRef = useRef(false);

    const handleScroll = useCallback(() => {
        const isScrolled = window.scrollY > 100;
        if (isScrolled !== scrolledRef.current) {
            scrolledRef.current = isScrolled;
            setScrolled(isScrolled);
        }
    }, []);

    useEffect(() => {
        window.addEventListener('scroll', handleScroll, { passive: true });
        return () => window.removeEventListener('scroll', handleScroll);
    }, [handleScroll]);

    const handleScrollTo = (e: React.MouseEvent<HTMLAnchorElement>, id: string) => {
        e.preventDefault();
        const element = document.getElementById(id);
        if (element) {
            element.scrollIntoView({ behavior: 'smooth' });
        }
    };

    return (
        <nav className={`nav-island ${scrolled ? 'scrolled' : ''}`}>
            <div className="nav-island__logo">PORTFOLIO</div>
            <div className="nav-island__links">
                <a href="#work" onClick={(e) => handleScrollTo(e, 'work')}>Work</a>
                <a href="#experience" onClick={(e) => handleScrollTo(e, 'experience')}>Experience</a>
                <a href="/blog/">Blog</a>
                {onToggleMode && (
                    <button
                        onClick={onToggleMode}
                        style={{
                            background: 'none',
                            border: 'none',
                            fontFamily: 'inherit',
                            fontSize: 'inherit',
                            textTransform: 'inherit',
                            letterSpacing: 'inherit',
                            fontWeight: 'inherit',
                            color: 'inherit',
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '0.4rem',
                            padding: 0
                        }}
                    >
                        Mode
                    </button>
                )}
            </div>
        </nav>
    );
};

export default Navigation;
