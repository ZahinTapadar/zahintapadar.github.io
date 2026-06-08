import { useEffect, useState, useCallback, useRef } from 'react';

const Navigation = () => {
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
                <a href="https://sysblogs.vercel.app/">Blog</a>
            </div>
        </nav>
    );
};

export default Navigation;
