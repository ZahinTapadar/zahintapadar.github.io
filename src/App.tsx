import { useEffect } from 'react';
import Lenis from 'lenis';
import 'lenis/dist/lenis.css';

import Navigation from './components/Navigation';
import Hero from './components/Hero';
import About from './components/About';
import WorkBento from './components/WorkBento';
import Experience from './components/Experience';
import TechStack from './components/TechStack';
import Footer from './components/Footer';

function App() {
  // Simple intersection observer for scroll animations
  useEffect(() => {
    // Initialize Lenis for smooth/momentum scrolling
    const lenis = new Lenis({
      autoRaf: true,
    });
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
      lenis.destroy();
    };
  }, []);

  return (
    <div className="app-container">
      <Navigation />
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
