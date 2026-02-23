const About = () => {
    return (
        <section id="about" className="container section-padding">
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4rem', justifyContent: 'space-between' }}>

                {/* Main About Text */}
                <div style={{ flex: '1 1 500px', maxWidth: '750px' }}>
                    <p className="font-heading" style={{ fontSize: 'var(--font-size-h3)', lineHeight: '1.4', marginBottom: '2rem', fontWeight: 500, color: 'var(--color-charcoal)' }}>
                        <span className="font-serif italic" style={{ color: 'var(--color-clay)', fontSize: '1.1em' }}>Computer Science student</span> focused on building systems and tools with strong mathematical foundations and problem-solving depth.
                    </p>
                    <p className="font-sans" style={{ fontSize: 'var(--font-size-body)', color: 'var(--color-text-secondary)', marginBottom: '1.5rem', lineHeight: '1.6' }}>
                        Interested in algorithms, software engineering, operating systems, and low-level understanding of how technology works beneath abstraction layers.
                    </p>
                    <p className="font-sans" style={{ fontSize: 'var(--font-size-body)', color: 'var(--color-text-secondary)', marginBottom: '1.5rem', lineHeight: '1.6' }}>
                        Preparing for competitive engineering pathways while developing independent projects in programming and computational thinking.
                    </p>
                    <p className="font-sans" style={{ fontSize: 'var(--font-size-body)', color: 'var(--color-text-secondary)', marginBottom: '1.5rem', lineHeight: '1.6' }}>
                        Currently exploring classical literature, psychological thrillers, identity-driven narratives, and dark fantasy as parallel intellectual pursuits.
                    </p>
                    <p className="font-sans" style={{ fontSize: 'var(--font-size-body)', color: 'var(--color-text-secondary)' }}>
                        Based in India.
                    </p>
                </div>

                {/* Sidelist / Stats */}
                <div style={{ flex: '0 1 250px', display: 'flex', flexDirection: 'column', gap: '2.5rem', fontSize: 'var(--font-size-small)', color: 'var(--color-text-secondary)' }}>
                    <div>
                        <div className="font-heading" style={{ color: 'var(--color-charcoal)', marginBottom: '0.75rem', textTransform: 'uppercase', letterSpacing: 'var(--tracking-wide)', fontWeight: 600 }}>
                            ↗ Expertise
                        </div>
                        <div className="font-mono" style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                            <span>Algorithms & Data Structures</span>
                            <span>Mathematical Modeling</span>
                            <span>Systems Programming</span>
                            <span>Full-Stack Development</span>
                            <span>Problem Solving & Optimization</span>
                        </div>
                    </div>

                    <div>
                        <div className="font-heading" style={{ color: 'var(--color-charcoal)', marginBottom: '0.75rem', textTransform: 'uppercase', letterSpacing: 'var(--tracking-wide)', fontWeight: 600 }}>
                            ↗ Experience
                        </div>
                        <div className="font-mono" style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                            <span>2 Months Internship</span>
                            <span>Independent Project Development</span>
                        </div>
                    </div>

                    <div>
                        <div className="font-heading" style={{ color: 'var(--color-charcoal)', marginBottom: '0.75rem', textTransform: 'uppercase', letterSpacing: 'var(--tracking-wide)', fontWeight: 600 }}>
                            ↗ Based In
                        </div>
                        <div className="font-mono">India / On-site</div>
                    </div>
                </div>

            </div>
        </section>
    );
};

export default About;
