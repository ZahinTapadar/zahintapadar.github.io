const Footer = () => {
    return (
        <footer className="section-padding" style={{ backgroundColor: 'var(--color-moss)', color: 'var(--color-cream)', marginTop: '4rem', overflow: 'hidden' }}>
            <div className="container" style={{ textAlign: 'center', position: 'relative' }}>
                <div style={{ marginBottom: '8rem', paddingTop: '4rem' }}>
                    <div className="font-heading" style={{ fontSize: 'var(--font-size-h3)', color: 'rgba(242, 240, 233, 0.7)', textTransform: 'uppercase', letterSpacing: 'var(--tracking-wide)', marginBottom: '1.5rem', fontWeight: 600 }} data-animate>
                        Let's Work Together
                    </div>
                    <a href="https://www.linkedin.com/in/zahin-tapadar-524640243/" target="_blank" rel="noopener noreferrer" className="font-display" style={{
                        fontSize: 'var(--font-size-display)',
                        lineHeight: 'var(--line-height-display)',
                        letterSpacing: 'var(--tracking-tight)',
                        textTransform: 'uppercase',
                        display: 'block',
                        transition: 'color 0.3s ease',
                        color: 'var(--color-cream)',
                        wordBreak: 'break-word'
                    }}
                        onMouseEnter={(e) => e.currentTarget.style.color = 'var(--color-clay)'}
                        onMouseLeave={(e) => e.currentTarget.style.color = 'var(--color-cream)'}
                        data-animate>
                        Get In Touch
                    </a>
                </div>

                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', borderTop: '1px solid rgba(242, 240, 233, 0.2)', paddingTop: '2rem', flexWrap: 'wrap', gap: '1rem' }}>
                    <div className="font-heading" style={{ fontSize: '1.25rem', fontWeight: 700, letterSpacing: 'var(--tracking-wide)', textTransform: 'uppercase' }}>Portfolio ✱</div>
                    <div className="font-mono" style={{ textAlign: 'right', fontSize: 'var(--font-size-small)', color: 'rgba(242, 240, 233, 0.7)', flex: '1 1 auto', minWidth: '150px' }}>
                        <div style={{ marginBottom: '0.25rem' }}>© 2026 Zahin Tapadar</div>
                        <div style={{ display: 'flex', gap: '1rem', marginTop: '0.5rem', justifyContent: 'flex-end', flexWrap: 'wrap' }}>
                            <a href="https://github.com/zahintapadar" target="_blank" rel="noopener noreferrer" style={{ transition: 'color 0.2s', textDecoration: 'underline' }} onMouseEnter={(e) => e.currentTarget.style.color = 'var(--color-clay)'} onMouseLeave={(e) => e.currentTarget.style.color = ''}>Github</a>
                            <a href="https://www.linkedin.com/in/zahin-tapadar-524640243/" target="_blank" rel="noopener noreferrer" style={{ transition: 'color 0.2s', textDecoration: 'underline' }} onMouseEnter={(e) => e.currentTarget.style.color = 'var(--color-clay)'} onMouseLeave={(e) => e.currentTarget.style.color = ''}>LinkedIn</a>
                        </div>
                    </div>
                </div>
            </div>
        </footer>
    );
};

export default Footer;
