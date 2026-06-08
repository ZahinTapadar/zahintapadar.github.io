import { useEffect, useState } from 'react';

import Navigation from './components/Navigation';
import Hero from './components/Hero';
import About from './components/About';
import WorkBento from './components/WorkBento';
import Experience from './components/Experience';
import TechStack from './components/TechStack';
import Footer from './components/Footer';
import MinimalPortfolio from './components/MinimalPortfolio';

function App() {
  const [isMinimalMode, setIsMinimalMode] = useState(() => {
    return localStorage.getItem('portfolioMode') === 'minimal';
  });

  const toggleMinimalMode = () => {
    setIsMinimalMode(prev => {
      const newMode = !prev;
      localStorage.setItem('portfolioMode', newMode ? 'minimal' : 'rich');
      return newMode;
    });
  };

  // Simple intersection observer for scroll animations
  useEffect(() => {
    if (isMinimalMode) return; // Disable observer in minimal mode

    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add('is-visible');
        }
      });
    }, { threshold: 0.1 });

    document.querySelectorAll('[data-animate]').forEach((el) => {
      observer.observe(el);
    });

    return () => {
      observer.disconnect();
    };
  }, [isMinimalMode]);

  if (isMinimalMode) {
    return <MinimalPortfolio onToggleMode={toggleMinimalMode} />;
  }

  return (
    <div className="app-container">
      <Navigation onToggleMode={toggleMinimalMode} />
      <main>
        <Hero />
        <About />
        <WorkBento />
        <Experience />
        <TechStack />
      </main>
      <Footer />
    </div>
  );
}

export default App;
