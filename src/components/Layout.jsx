import React from 'react';
import { Link } from 'react-router-dom';
import DotGrid from './DotGrid';

const Layout = ({ children }) => {
  return (
    <>
      <DotGrid />
      <div style={{ position: 'relative', zIndex: 1 }}>
      <header style={{ backgroundColor: 'var(--color-header)', color: 'white', padding: '1.5rem 0', boxShadow: 'var(--shadow-md)', borderBottom: '4px solid var(--brand-yellow-warm)' }}>
        <div className="container" style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', textAlign: 'center' }}>
          <Link to="/" style={{ fontSize: '1.75rem', fontWeight: '800', letterSpacing: '-0.025em', marginBottom: '0.25rem', display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="m3 11 18-5v12L3 14v-3z" />
              <path d="M11.6 16.8a3 3 0 1 1-5.8-1.6" />
            </svg>
            FALA PARANÁ
            <svg width="32" height="32" viewBox="0 0 24 24" fill="none" style={{ opacity: 0.8, marginLeft: '-0.25rem' }}>
              <path d="M6 9L12 5" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />
              <path d="M6 12H14" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />
              <path d="M6 15L12 19" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />
            </svg>
          </Link>
          <span style={{ fontSize: '0.875rem', fontWeight: '500', opacity: '0.9', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Plataforma de Ouvidoria Inteligente</span>
        </div>
      </header>
      <main className="main-content container">
        {children}
      </main>
      <footer style={{ backgroundColor: 'transparent', padding: '2rem 0', textAlign: 'center', color: 'var(--color-text-subtle)', fontSize: '0.875rem' }}>
        <div className="container">
          <p>Fala Paraná &copy; {new Date().getFullYear()}</p>
        </div>
      </footer>
      </div>
    </>
  );
};

export default Layout;
