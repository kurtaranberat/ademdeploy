import React from 'react';
import { motion } from 'framer-motion';
import { useFilter } from '../FilterContext';

export default function GlobalFilter({ dealers2025, dealers2024 }) {
  const {
    year, setYear, month, setMonth,
    channel, setChannel, dealer, setDealer,
    MONTH_KEYS, MONTH_LABELS,
  } = useFilter();

  const dealers = year === '2025' ? dealers2025 : dealers2024;

  const btnStyle = (active) => ({
    padding: '4px 13px', borderRadius: 7, border: '1px solid',
    borderColor: active ? '#3b82f6' : 'rgba(99,179,237,0.15)',
    background: active ? 'rgba(59,130,246,0.18)' : 'transparent',
    color: active ? '#60a5fa' : '#64748b',
    fontSize: '0.75rem', fontWeight: 600, cursor: 'pointer',
    fontFamily: 'Inter, sans-serif', transition: 'all 0.15s',
    whiteSpace: 'nowrap',
  });

  const selectStyle = {
    background: 'rgba(13,21,38,0.9)', border: '1px solid rgba(99,179,237,0.15)',
    color: '#94a3b8', borderRadius: 7, padding: '4px 10px',
    fontSize: '0.75rem', cursor: 'pointer', fontFamily: 'Inter, sans-serif', outline: 'none',
  };

  const divider = <div style={{ width: 1, height: 18, background: 'rgba(99,179,237,0.1)', flexShrink: 0 }} />;

  const hasFilter = year !== '2025' || month !== 'all' || channel !== 'all' || dealer !== 'all';

  return (
    <motion.div
      initial={{ opacity: 0, y: -8 }}
      animate={{ opacity: 1, y: 0 }}
      style={{
        position: 'sticky', top: 52, zIndex: 900,
        background: 'rgba(5,10,20,0.95)',
        backdropFilter: 'blur(24px)',
        borderBottom: '1px solid rgba(99,179,237,0.07)',
        padding: '8px 32px',
        display: 'flex', alignItems: 'center', gap: 16, flexWrap: 'wrap',
      }}
    >
      {/* Başlık */}
      <span style={{ fontSize: '0.62rem', color: '#334155', fontWeight: 700,
        letterSpacing: '0.1em', textTransform: 'uppercase', flexShrink: 0 }}>
        🎛️ Filtreler
      </span>

      {/* YIL */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
        <span style={{ fontSize: '0.62rem', color: '#475569', fontWeight: 700, letterSpacing: '0.06em' }}>YIL</span>
        <div style={{ display: 'flex', gap: 3 }}>
          {['2024', '2025'].map(y => (
            <button key={y} style={btnStyle(year === y)}
              onClick={() => { setYear(y); setMonth('all'); setDealer('all'); }}>
              {y}
            </button>
          ))}
        </div>
      </div>

      {divider}

      {/* AY */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
        <span style={{ fontSize: '0.62rem', color: '#475569', fontWeight: 700, letterSpacing: '0.06em' }}>AY</span>
        <select value={month} onChange={e => setMonth(e.target.value)} style={selectStyle}>
          <option value="all">Tüm Yıl</option>
          {MONTH_KEYS.map((mk, i) => (
            <option key={mk} value={mk}>{MONTH_LABELS[i]}</option>
          ))}
        </select>
      </div>

      {divider}

      {/* KANAL */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
        <span style={{ fontSize: '0.62rem', color: '#475569', fontWeight: 700, letterSpacing: '0.06em' }}>KANAL</span>
        <div style={{ display: 'flex', gap: 3 }}>
          {[['all', 'Tümü'], ['B2C', 'B2C'], ['B2B', 'B2B']].map(([v, l]) => (
            <button key={v} style={btnStyle(channel === v)} onClick={() => setChannel(v)}>{l}</button>
          ))}
        </div>
      </div>

      {divider}

      {/* BAYİ */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
        <span style={{ fontSize: '0.62rem', color: '#475569', fontWeight: 700, letterSpacing: '0.06em' }}>BAYİ</span>
        <select value={dealer} onChange={e => setDealer(e.target.value)} style={selectStyle}>
          <option value="all">Tüm Bayiler</option>
          {dealers.map(d => (
            <option key={d.code} value={d.code}>{d.name}</option>
          ))}
        </select>
      </div>

      {/* Aktif filtre etiketleri */}
      {hasFilter && (
        <>
          {divider}
          <div style={{ display: 'flex', gap: 5, flexWrap: 'wrap', alignItems: 'center' }}>
            {year !== '2025' && <Tag label={year} color="#8b5cf6" />}
            {month !== 'all' && <Tag label={MONTH_LABELS[MONTH_KEYS.indexOf(month)]} color="#06b6d4" />}
            {channel !== 'all' && <Tag label={channel} color="#10b981" />}
            {dealer !== 'all' && <Tag label={dealers.find(d => d.code === dealer)?.name || dealer} color="#f59e0b" />}
          </div>
          <button
            onClick={() => { setYear('2025'); setMonth('all'); setChannel('all'); setDealer('all'); }}
            style={{
              padding: '4px 10px', borderRadius: 7,
              border: '1px solid rgba(239,68,68,0.3)',
              background: 'rgba(239,68,68,0.08)',
              color: '#ef4444', fontSize: '0.7rem', fontWeight: 600,
              cursor: 'pointer', fontFamily: 'Inter, sans-serif',
            }}
          >✕ Sıfırla</button>
        </>
      )}
    </motion.div>
  );
}

function Tag({ label, color }) {
  return (
    <span style={{
      padding: '2px 8px', borderRadius: 20,
      background: `${color}15`, border: `1px solid ${color}35`,
      color, fontSize: '0.67rem', fontWeight: 700,
    }}>{label}</span>
  );
}
