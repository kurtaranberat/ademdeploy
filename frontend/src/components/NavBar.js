import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';

const NAV_ITEMS = [
  { id: 'hero',     label: 'Ana Sayfa' },
  { id: 'overview', label: 'Genel Bakış' },
  { id: 'dealers',  label: 'Bayiler' },
  { id: 'models',   label: 'Modeller' },
  { id: 'vehicles', label: 'Araçlar' },
  { id: 'scene3d',  label: '3D Harita' },
  { id: 'map',      label: '🗺️ Konum' },
  { id: 'insights', label: '💡 Analiz' },
];

export default function NavBar({ activeSection, setActiveSection }) {
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 40);
    window.addEventListener('scroll', onScroll);
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  const scrollTo = (id) => {
    document.getElementById(id)?.scrollIntoView({ behavior: 'smooth' });
    setActiveSection(id);
  };

  return (
    <motion.nav
      className="navbar"
      initial={{ y: -60, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.6 }}
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        zIndex: 1000,
        padding: '12px 32px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        background: scrolled ? 'rgba(5,10,20,0.95)' : 'transparent',
        backdropFilter: scrolled ? 'blur(20px)' : 'none',
        borderBottom: scrolled ? '1px solid rgba(99,179,237,0.1)' : 'none',
        transition: 'all 0.3s',
        height: 52,
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
        <div style={{
          width: 32, height: 32, borderRadius: 8,
          background: 'linear-gradient(135deg, #3b82f6, #8b5cf6)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: 14, fontWeight: 900, color: 'white',
        }}>B</div>
        <span style={{ fontWeight: 800, fontSize: '1rem', letterSpacing: '-0.02em' }}>
          BRAND-A <span style={{ color: '#3b82f6' }}>Intelligence</span>
        </span>
      </div>

      <div style={{ display: 'flex', gap: 4 }}>
        {NAV_ITEMS.map(item => (
          <button
            key={item.id}
            onClick={() => scrollTo(item.id)}
            style={{
              padding: '6px 14px',
              borderRadius: 8,
              border: 'none',
              background: activeSection === item.id ? 'rgba(59,130,246,0.2)' : 'transparent',
              color: activeSection === item.id ? '#3b82f6' : '#64748b',
              fontSize: '0.8rem',
              fontWeight: 600,
              cursor: 'pointer',
              transition: 'all 0.2s',
              fontFamily: 'Inter, sans-serif',
            }}
          >
            {item.label}
          </button>
        ))}
      </div>
    </motion.nav>
  );
}
