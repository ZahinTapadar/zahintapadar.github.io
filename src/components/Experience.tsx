const expItems = [
    {
        year: '2024',
        title: 'Web Development Intern (Frontend)',
        company: 'DataGlimpse',
        link: 'https://www.linkedin.com/company/dataglimpse?originalSubdomain=in',
        desc: 'Completed a 2-month internship focusing on frontend development, building out interfaces, and optimizing web experiences.'
    }
];

const Experience = () => {
    return (
        <section id="experience" className="container section-padding">
            <h2 className="font-heading" style={{ fontSize: 'var(--font-size-h2)', marginBottom: '4rem', color: 'var(--color-charcoal)' }}>Experience</h2>
            <div style={{ display: 'flex', flexDirection: 'column' }}>
                {expItems.map((item, idx) => (
                    <div key={idx} style={{
                        display: 'flex',
                        flexWrap: 'wrap',
                        borderTop: idx === 0 ? '1px solid var(--color-border)' : 'none',
                        borderBottom: '1px solid var(--color-border)',
                        paddingTop: '3rem',
                        paddingBottom: '3rem',
                        gap: '2rem'
                    }} data-animate>

                        <div className="font-mono" style={{ flex: '1 1 150px', fontSize: 'var(--font-size-small)', color: 'var(--color-text-secondary)', marginTop: '0.2rem' }}>
                            {item.year}
                        </div>

                        <div style={{ flex: '2 1 250px' }}>
                            <div className="font-heading" style={{ fontSize: 'var(--font-size-body)', fontWeight: 600, marginBottom: '0.25rem', color: 'var(--color-charcoal)' }}>{item.title}</div>
                            <div className="font-sans" style={{ fontSize: 'var(--font-size-small)' }}>
                                <a href={item.link} target="_blank" rel="noopener noreferrer" style={{ color: 'var(--color-clay)', textDecoration: 'none', transition: 'opacity 0.2s ease', display: 'inline-flex', alignItems: 'center', gap: '0.3rem' }} onMouseEnter={(e) => e.currentTarget.style.opacity = '0.7'} onMouseLeave={(e) => e.currentTarget.style.opacity = '1'}>
                                    {item.company}
                                    <span style={{ fontSize: '0.8em' }}>↗</span>
                                </a>
                            </div>
                        </div>

                        <div className="font-sans" style={{ flex: '3 1 350px', fontSize: 'var(--font-size-small)', color: 'var(--color-text-secondary)', lineHeight: 1.6 }}>
                            {item.desc}
                        </div>

                    </div>
                ))}
            </div>
        </section>
    );
};

export default Experience;
