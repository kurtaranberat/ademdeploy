import React, { useEffect, useRef, useState, useMemo, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, Cell, LineChart, Line, Legend,
  RadarChart, Radar, PolarGrid, PolarAngleAxis, PolarRadiusAxis,
} from 'recharts';

/* ─── sabitler ─────────────────────────────────────────────────────────────── */
const MONTHS = ['Oca','Şub','Mar','Nis','May','Haz','Tem','Ağu','Eyl','Eki','Kas','Ara'];
const MONTH_KEYS = ['January','February','March','April','May','June',
  'July','August','September','October','Nowember','December'];

function achColor(v) {
  if (!v && v !== 0) return '#1e293b';
  if (v >= 120) return '#059669';
  if (v >= 100) return '#10b981';
  if (v >= 80)  return '#f59e0b';
  if (v >= 60)  return '#ef4444';
  return '#7f1d1d';
}
function achLabel(v) {
  if (!v && v !== 0) return '—';
  if (v >= 120) return 'Mükemmel';
  if (v >= 100) return 'Hedef Üstü';
  if (v >= 80)  return 'Hedefe Yakın';
  if (v >= 60)  return 'Zayıf';
  return 'Kritik';
}

const Tip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  return (
    <div style={{ background:'#0d1526', border:'1px solid rgba(99,179,237,0.2)',
      borderRadius:10, padding:'10px 14px', fontSize:'0.78rem' }}>
      <p style={{ color:'#94a3b8', marginBottom:6 }}>{label}</p>
      {payload.map(p => (
        <p key={p.name} style={{ color:p.color||'#e2e8f0', fontWeight:700 }}>
          {p.name}: {p.value?.toLocaleString('tr-TR')}
        </p>
      ))}
    </div>
  );
};

/* ─── Leaflet harita ────────────────────────────────────────────────────────── */
function DealerMap({ dealers, dealersMonthly, filterMode, setFilterMode }) {
  const mapRef  = useRef(null);
  const mapObj  = useRef(null);
  const markers = useRef({});
  const [sel, setSel]         = useState(null);
  const [hovered, setHovered] = useState(null);
  const [search, setSearch]   = useState('');

  /* haritayı bir kez kur */
  useEffect(() => {
    if (!window.L || !mapRef.current || mapObj.current) return;
    const L = window.L;

    const map = L.map(mapRef.current, {
      center: [39.2, 35.5], zoom: 6,
      zoomControl: false,
      attributionControl: false,
    });

    /* Karanlık tema */
    L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png', {
      maxZoom: 19,
    }).addTo(map);

    /* Zoom kontrolü sağ-alt */
    L.control.zoom({ position: 'bottomright' }).addTo(map);

    mapObj.current = map;
    return () => { map.remove(); mapObj.current = null; markers.current = {}; };
  }, []);

  /* marker'ları güncelle */
  useEffect(() => {
    const L = window.L;
    if (!L || !mapObj.current) return;
    const map = mapObj.current;

    /* eskilerini temizle */
    Object.values(markers.current).forEach(m => m.remove());
    markers.current = {};

    dealers.forEach(d => {
      if (!d.lat || !d.lng) return;

      const ach   = d.achievement || 0;
      const color = achColor(ach);
      const size  = filterMode === 'b2c'
        ? Math.max(14, Math.min(36, 14 + (d.b2c || 0) / 15))
        : filterMode === 'target'
        ? Math.max(14, Math.min(36, 14 + (d.target || 0) / 12))
        : Math.max(14, Math.min(36, 14 + ach / 6));

      const icon = L.divIcon({
        className: '',
        html: `
          <div class="map-marker" style="
            width:${size*2}px; height:${size*2}px; border-radius:50%;
            background:${color}22; border:2.5px solid ${color};
            display:flex; align-items:center; justify-content:center;
            font-size:${size > 18 ? '9' : '7'}px; font-weight:800; color:white;
            font-family:Inter,sans-serif;
            box-shadow:0 0 ${size}px ${color}60, 0 0 ${size*2}px ${color}20;
            cursor:pointer; transition:all 0.2s; position:relative;
          ">
            <div style="
              width:${size*1.2}px; height:${size*1.2}px; border-radius:50%;
              background:${color}; display:flex; align-items:center;
              justify-content:center; font-size:${size > 18 ? '9' : '7'}px;
              font-weight:800; color:white;
            ">${ach ? '%'+ach : '?'}</div>
          </div>`,
        iconSize: [size*2, size*2],
        iconAnchor: [size, size],
      });

      const marker = L.marker([d.lat, d.lng], { icon }).addTo(map);

      marker.on('click', () => setSel(prev => prev?.name === d.name ? null : d));
      marker.on('mouseover', () => setHovered(d));
      marker.on('mouseout',  () => setHovered(null));

      markers.current[d.name] = marker;
    });
  }, [dealers, filterMode]);

  /* arama ile haritayı uç */
  useEffect(() => {
    if (!search || !mapObj.current) return;
    const found = dealers.find(d => d.name.toLowerCase().includes(search.toLowerCase()));
    if (found) {
      mapObj.current.flyTo([found.lat, found.lng], 10, { duration: 1.2 });
      setSel(found);
    }
  }, [search, dealers]);

  /* seçili bayinin aylık verisi */
  const selMonthly = useMemo(() => {
    if (!sel || !dealersMonthly) return [];
    const dm = dealersMonthly.find(d => d.name === sel.name);
    if (!dm) return [];
    return MONTH_KEYS.map((mk, i) => ({
      month: MONTHS[i],
      ach: dm.monthly?.[mk] || 0,
    }));
  }, [sel, dealersMonthly]);

  const filteredDealers = useMemo(() =>
    dealers.filter(d => d.name.toLowerCase().includes(search.toLowerCase())),
  [dealers, search]);

  return (
    <div style={{ display:'grid', gridTemplateColumns:'1fr 340px', gap:16, alignItems:'start' }}>

      {/* Sol: harita */}
      <div style={{ position:'relative' }}>

        {/* Arama + filtre araç çubuğu */}
        <div style={{
          display:'flex', gap:10, marginBottom:12, flexWrap:'wrap', alignItems:'center',
        }}>
          <div style={{ position:'relative', flex:'1 1 200px' }}>
            <span style={{ position:'absolute', left:12, top:'50%', transform:'translateY(-50%)', color:'#475569', fontSize:'0.85rem' }}>🔍</span>
            <input
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Bayi ara..."
              style={{
                width:'100%', padding:'8px 12px 8px 34px',
                background:'rgba(13,21,38,0.9)', border:'1px solid rgba(99,179,237,0.15)',
                borderRadius:10, color:'#e2e8f0', fontSize:'0.82rem',
                fontFamily:'Inter,sans-serif', outline:'none',
                boxSizing:'border-box',
              }}
            />
          </div>
          <div className="tab-group" style={{ marginBottom:0 }}>
            {[
              { id:'achievement', label:'Gerç. %' },
              { id:'b2c',         label:'B2C' },
              { id:'target',      label:'Hedef' },
            ].map(f => (
              <button key={f.id}
                className={`tab-btn ${filterMode===f.id?'active':''}`}
                onClick={() => setFilterMode(f.id)}
                style={{ padding:'6px 12px', fontSize:'0.75rem' }}
              >{f.label}</button>
            ))}
          </div>
        </div>

        {/* Harita */}
        <div ref={mapRef} style={{
          height:500, borderRadius:16, overflow:'hidden',
          border:'1px solid rgba(99,179,237,0.12)',
          boxShadow:'0 0 60px rgba(59,130,246,0.05)',
        }} />

        {/* Hover tooltip */}
        <AnimatePresence>
          {hovered && !sel && (
            <motion.div
              initial={{ opacity:0, y:6 }} animate={{ opacity:1, y:0 }} exit={{ opacity:0 }}
              style={{
                position:'absolute', top:80, left:16, zIndex:1000,
                background:'rgba(5,10,20,0.97)',
                border:`1px solid ${achColor(hovered.achievement)}40`,
                borderRadius:12, padding:'10px 16px', pointerEvents:'none',
                boxShadow:`0 0 20px ${achColor(hovered.achievement)}20`,
              }}
            >
              <div style={{ fontSize:'0.8rem', fontWeight:800, color:'#e2e8f0', marginBottom:4 }}>{hovered.name}</div>
              <div style={{ fontSize:'1.2rem', fontWeight:900, color: achColor(hovered.achievement) }}>
                %{hovered.achievement || 0}
              </div>
              <div style={{ fontSize:'0.65rem', color:'#475569', marginTop:2 }}>{achLabel(hovered.achievement)}</div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Renk skalası */}
        <div style={{
          position:'absolute', bottom:20, left:16, zIndex:1000,
          background:'rgba(5,10,20,0.92)', borderRadius:12,
          padding:'10px 14px', border:'1px solid rgba(99,179,237,0.1)',
        }}>
          <div style={{ fontSize:'0.6rem', color:'#475569', marginBottom:6, fontWeight:700, letterSpacing:'0.08em' }}>
            {filterMode === 'achievement' ? 'HEDEF GERÇ.' : filterMode === 'b2c' ? 'B2C SATIŞ' : 'HEDEF'}
          </div>
          {[['#059669','≥120% · Mükemmel'],['#10b981','100–119% · Hedef Üstü'],
            ['#f59e0b','80–99% · Hedefe Yakın'],['#ef4444','60–79% · Zayıf'],['#7f1d1d','<60% · Kritik']
          ].map(([c,l]) => (
            <div key={l} style={{ display:'flex', alignItems:'center', gap:7, marginBottom:4 }}>
              <div style={{ width:10, height:10, borderRadius:'50%', background:c, boxShadow:`0 0 6px ${c}` }} />
              <span style={{ fontSize:'0.65rem', color:'#94a3b8' }}>{l}</span>
            </div>
          ))}
          <div style={{ fontSize:'0.6rem', color:'#334155', marginTop:6, borderTop:'1px solid rgba(99,179,237,0.08)', paddingTop:6 }}>
            Daire boyutu = {filterMode === 'b2c' ? 'B2C satış' : filterMode === 'target' ? 'Hedef' : 'Gerç. %'}
          </div>
        </div>
      </div>

      {/* Sağ: panel */}
      <div style={{ display:'flex', flexDirection:'column', gap:12 }}>

        {/* Seçili bayi detay */}
        <AnimatePresence mode="wait">
          {sel ? (
            <motion.div
              key={sel.name}
              initial={{ opacity:0, x:20 }} animate={{ opacity:1, x:0 }} exit={{ opacity:0, x:20 }}
              className="card"
              style={{ borderLeft:`3px solid ${achColor(sel.achievement)}` }}
            >
              <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', marginBottom:12 }}>
                <div>
                  <div style={{ fontSize:'0.62rem', color:'#475569', marginBottom:2 }}>{sel.code || ''}</div>
                  <div style={{ fontSize:'0.95rem', fontWeight:800, color:'#e2e8f0' }}>{sel.name}</div>
                </div>
                <button onClick={() => setSel(null)}
                  style={{ background:'none', border:'none', color:'#475569', cursor:'pointer', fontSize:'1rem' }}>✕</button>
              </div>

              {/* Büyük metrik */}
              <div style={{ textAlign:'center', padding:'14px 0', marginBottom:14,
                background:'rgba(255,255,255,0.02)', borderRadius:10 }}>
                <div style={{ fontSize:'2.8rem', fontWeight:900, color: achColor(sel.achievement), lineHeight:1 }}>
                  %{sel.achievement || 0}
                </div>
                <div style={{ fontSize:'0.72rem', color:'#475569', marginTop:4 }}>
                  {achLabel(sel.achievement)} · Hedef Gerçekleştirme
                </div>
              </div>

              {/* Metrikler */}
              {[
                { l:'Hedef',    v:(sel.target||0).toLocaleString('tr-TR'), c:'#8b5cf6' },
                { l:'B2C',      v:(sel.b2c||0).toLocaleString('tr-TR'),    c:'#06b6d4' },
                { l:'B2B',      v:(sel.b2b||0).toLocaleString('tr-TR'),    c:'#3b82f6' },
              ].map(m => (
                <div key={m.l} style={{ display:'flex', justifyContent:'space-between',
                  padding:'7px 0', borderBottom:'1px solid rgba(99,179,237,0.06)' }}>
                  <span style={{ fontSize:'0.75rem', color:'#475569' }}>{m.l}</span>
                  <span style={{ fontSize:'0.82rem', fontWeight:700, color:m.c }}>{m.v}</span>
                </div>
              ))}

              {/* Aylık radar */}
              {selMonthly.length > 0 && (
                <div style={{ marginTop:14 }}>
                  <div style={{ fontSize:'0.65rem', color:'#475569', fontWeight:700, marginBottom:8, letterSpacing:'0.06em' }}>
                    AYLIK PERFORMANS
                  </div>
                  <ResponsiveContainer width="100%" height={180}>
                    <RadarChart data={selMonthly}>
                      <PolarGrid stroke="rgba(99,179,237,0.08)" />
                      <PolarAngleAxis dataKey="month" tick={{ fill:'#475569', fontSize:8 }} />
                      <PolarRadiusAxis angle={90} domain={[0,200]} tick={false} />
                      <Radar dataKey="ach" stroke={achColor(sel.achievement)}
                        fill={achColor(sel.achievement)} fillOpacity={0.2} strokeWidth={2} />
                    </RadarChart>
                  </ResponsiveContainer>
                </div>
              )}

              {/* Model dağılımı */}
              {sel.models && Object.values(sel.models).some(v => v > 0) && (
                <div style={{ marginTop:12 }}>
                  <div style={{ fontSize:'0.65rem', color:'#475569', fontWeight:700, marginBottom:8, letterSpacing:'0.06em' }}>
                    MODEL DAĞILIMI (B2C)
                  </div>
                  {Object.entries(sel.models).filter(([,v])=>v>0).map(([m,v]) => {
                    const pct = sel.b2c > 0 ? Math.round((v/sel.b2c)*100) : 0;
                    return (
                      <div key={m} style={{ marginBottom:6 }}>
                        <div style={{ display:'flex', justifyContent:'space-between', marginBottom:2 }}>
                          <span style={{ fontSize:'0.68rem', color:'#94a3b8' }}>Model {m}</span>
                          <span style={{ fontSize:'0.68rem', fontWeight:700, color:'#e2e8f0' }}>{v} <span style={{ color:'#475569' }}>(%{pct})</span></span>
                        </div>
                        <div style={{ height:4, background:'#0d1526', borderRadius:2 }}>
                          <motion.div
                            initial={{ width:0 }} animate={{ width:`${pct}%` }}
                            transition={{ duration:0.6, delay:0.1 }}
                            style={{ height:'100%', background:`linear-gradient(90deg,#3b82f6,#06b6d4)`, borderRadius:2 }}
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </motion.div>
          ) : (
            <motion.div key="empty" initial={{ opacity:0 }} animate={{ opacity:1 }} className="card"
              style={{ textAlign:'center', padding:'32px 20px' }}>
              <div style={{ fontSize:'2rem', marginBottom:10 }}>🗺️</div>
              <div style={{ fontSize:'0.82rem', color:'#475569' }}>Detay görmek için haritadaki bir bayiye tıkla</div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Bayi listesi */}
        <div className="card" style={{ maxHeight:280, overflowY:'auto' }}>
          <div style={{ fontSize:'0.65rem', color:'#475569', fontWeight:700, marginBottom:10, letterSpacing:'0.06em' }}>
            BAYİ LİSTESİ ({filteredDealers.length})
          </div>
          {filteredDealers
            .sort((a,b) => (b.achievement||0) - (a.achievement||0))
            .map(d => (
              <div key={d.name}
                onClick={() => { setSel(d); mapObj.current?.flyTo([d.lat, d.lng], 10, { duration:1 }); }}
                style={{
                  display:'flex', justifyContent:'space-between', alignItems:'center',
                  padding:'7px 8px', borderRadius:8, cursor:'pointer', marginBottom:2,
                  background: sel?.name === d.name ? 'rgba(59,130,246,0.1)' : 'transparent',
                  border: sel?.name === d.name ? '1px solid rgba(59,130,246,0.2)' : '1px solid transparent',
                  transition:'all 0.15s',
                }}
                onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,0.03)'}
                onMouseLeave={e => e.currentTarget.style.background = sel?.name === d.name ? 'rgba(59,130,246,0.1)' : 'transparent'}
              >
                <div style={{ display:'flex', alignItems:'center', gap:8 }}>
                  <div style={{ width:8, height:8, borderRadius:'50%', background: achColor(d.achievement), flexShrink:0 }} />
                  <span style={{ fontSize:'0.75rem', color:'#94a3b8' }}>{d.name}</span>
                </div>
                <span style={{ fontSize:'0.78rem', fontWeight:700, color: achColor(d.achievement) }}>
                  %{d.achievement || 0}
                </span>
              </div>
            ))}
        </div>
      </div>
    </div>
  );
}

/* ─── Ana bileşen ───────────────────────────────────────────────────────────── */
export default function MapSection({ dealerLocations, allSales, dealersMonthly25 }) {
  const [tab,        setTab]        = useState('map');
  const [filterMode, setFilterMode] = useState('achievement');

  /* Aylık trend */
  const monthlyTrend = useMemo(() => {
    if (!allSales?.monthly) return [];
    return MONTHS.map(m => ({
      month: m,
      '2024': allSales.monthly['2024']?.[m] || 0,
      '2025': allSales.monthly['2025']?.[m] || 0,
    }));
  }, [allSales]);

  /* Model karşılaştırma */
  const modelCompare = useMemo(() => {
    if (!allSales?.modelYear) return [];
    const models = new Set([
      ...Object.keys(allSales.modelYear['2024'] || {}),
      ...Object.keys(allSales.modelYear['2025'] || {}),
    ]);
    return [...models].map(m => ({
      name: m,
      '2024': allSales.modelYear['2024']?.[m] || 0,
      '2025': allSales.modelYear['2025']?.[m] || 0,
    })).sort((a,b) => (b['2025']+b['2024']) - (a['2025']+a['2024']));
  }, [allSales]);

  /* Şehir karşılaştırma */
  const cityCompare = useMemo(() => {
    if (!allSales?.cityYear) return [];
    const cities = new Set([
      ...Object.keys(allSales.cityYear['2024'] || {}),
      ...Object.keys(allSales.cityYear['2025'] || {}),
    ]);
    return [...cities].map(c => ({
      name: c,
      '2024': allSales.cityYear['2024']?.[c] || 0,
      '2025': allSales.cityYear['2025']?.[c] || 0,
    })).sort((a,b) => (b['2025']+b['2024']) - (a['2025']+a['2024'])).slice(0,10);
  }, [allSales]);

  /* Kanal karşılaştırma */
  const channelCompare = useMemo(() => {
    if (!allSales?.channelYear) return [];
    const channels = new Set([
      ...Object.keys(allSales.channelYear['2024'] || {}),
      ...Object.keys(allSales.channelYear['2025'] || {}),
    ]);
    return [...channels].map(c => ({
      name: c.length > 22 ? c.slice(0,20)+'…' : c,
      '2024': allSales.channelYear['2024']?.[c] || 0,
      '2025': allSales.channelYear['2025']?.[c] || 0,
    })).sort((a,b) => (b['2025']+b['2024']) - (a['2025']+a['2024']));
  }, [allSales]);

  const total24 = allSales?.totals?.['2024'] || 0;
  const total25 = allSales?.totals?.['2025'] || 0;
  const growth  = total24 > 0 ? (((total25-total24)/total24)*100).toFixed(1) : 0;

  return (
    <div style={{ padding:'0 24px' }}>
      <div style={{ maxWidth:1400, margin:'0 auto' }}>

        <motion.div initial={{ opacity:0, y:20 }} whileInView={{ opacity:1, y:0 }} viewport={{ once:true }}>
          <h2 className="section-title">Coğrafi Harita & 2024–2025 Karşılaştırma</h2>
          <p className="section-subtitle">Bayi konumları · aylık trend · model & şehir & kanal karşılaştırması</p>
        </motion.div>

        {/* KPI şeridi */}
        <motion.div
          initial={{ opacity:0, y:10 }} whileInView={{ opacity:1, y:0 }} viewport={{ once:true }}
          style={{ display:'flex', gap:12, marginBottom:24, flexWrap:'wrap' }}
        >
          {[
            { label:'2024 Toplam', value: total24.toLocaleString('tr-TR'), color:'#64748b' },
            { label:'2025 Toplam', value: total25.toLocaleString('tr-TR'), color:'#3b82f6' },
            { label:'Büyüme',      value: `${growth>0?'+':''}${growth}%`,  color: growth>=0?'#10b981':'#ef4444' },
            { label:'Bayi Sayısı', value: dealerLocations?.length || 0,    color:'#8b5cf6' },
          ].map(k => (
            <div key={k.label} style={{
              background:'rgba(13,21,38,0.8)', border:`1px solid ${k.color}25`,
              borderRadius:12, padding:'10px 20px', flex:'1 1 130px',
            }}>
              <div style={{ fontSize:'0.62rem', color:'#475569', fontWeight:600, textTransform:'uppercase', letterSpacing:'0.08em' }}>{k.label}</div>
              <div style={{ fontSize:'1.3rem', fontWeight:900, color:k.color, marginTop:2 }}>{k.value}</div>
            </div>
          ))}
        </motion.div>

        {/* Tab seçici */}
        <div className="tab-group">
          {[
            { id:'map',     label:'🗺️ Bayi Haritası' },
            { id:'monthly', label:'📅 Aylık Trend' },
            { id:'model',   label:'🚗 Model' },
            { id:'city',    label:'🏙️ Şehir' },
            { id:'channel', label:'📡 Kanal' },
          ].map(t => (
            <button key={t.id} className={`tab-btn ${tab===t.id?'active':''}`} onClick={() => setTab(t.id)}>{t.label}</button>
          ))}
        </div>

        <motion.div key={tab} initial={{ opacity:0, y:10 }} animate={{ opacity:1, y:0 }}>

          {tab === 'map' && dealerLocations && (
            <DealerMap
              dealers={dealerLocations}
              dealersMonthly={dealersMonthly25}
              filterMode={filterMode}
              setFilterMode={setFilterMode}
            />
          )}

          {tab === 'monthly' && (
            <div className="card">
              <h3 style={{ fontSize:'0.85rem', fontWeight:700, marginBottom:4, color:'#94a3b8' }}>Aylık Satış Trendi — 2024 vs 2025</h3>
              <p style={{ fontSize:'0.72rem', color:'#475569', marginBottom:20 }}>5.876 araç · her iki yılın aylık satış hacmi</p>
              <ResponsiveContainer width="100%" height={320}>
                <LineChart data={monthlyTrend} margin={{ top:5, right:20, left:-10, bottom:0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(99,179,237,0.06)" />
                  <XAxis dataKey="month" tick={{ fill:'#64748b', fontSize:11 }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fill:'#64748b', fontSize:11 }} axisLine={false} tickLine={false} />
                  <Tooltip content={<Tip />} />
                  <Legend wrapperStyle={{ fontSize:'0.75rem', color:'#64748b' }} />
                  <Line type="monotone" dataKey="2024" name="2024" stroke="#475569" strokeWidth={2} strokeDasharray="5 3" dot={{ r:4, fill:'#475569' }} />
                  <Line type="monotone" dataKey="2025" name="2025" stroke="#3b82f6" strokeWidth={3} dot={{ r:5, fill:'#3b82f6', stroke:'#0d1526', strokeWidth:2 }} activeDot={{ r:7 }} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          )}

          {tab === 'model' && (
            <div className="card">
              <h3 style={{ fontSize:'0.85rem', fontWeight:700, marginBottom:4, color:'#94a3b8' }}>Model Bazlı Satış — 2024 vs 2025</h3>
              <p style={{ fontSize:'0.72rem', color:'#475569', marginBottom:20 }}>Her modelin yıllık satış değişimi</p>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={modelCompare} margin={{ top:5, right:20, left:-10, bottom:0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(99,179,237,0.06)" />
                  <XAxis dataKey="name" tick={{ fill:'#64748b', fontSize:11 }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fill:'#64748b', fontSize:11 }} axisLine={false} tickLine={false} />
                  <Tooltip content={<Tip />} />
                  <Legend wrapperStyle={{ fontSize:'0.75rem', color:'#64748b' }} />
                  <Bar dataKey="2024" name="2024" fill="#334155" radius={[3,3,0,0]} />
                  <Bar dataKey="2025" name="2025" fill="#3b82f6" radius={[3,3,0,0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}

          {tab === 'city' && (
            <div className="card">
              <h3 style={{ fontSize:'0.85rem', fontWeight:700, marginBottom:4, color:'#94a3b8' }}>Şehir Bazlı Satış — 2024 vs 2025 (Top 10)</h3>
              <p style={{ fontSize:'0.72rem', color:'#475569', marginBottom:20 }}>Şehirlerin yıllık satış değişimi</p>
              <ResponsiveContainer width="100%" height={360}>
                <BarChart data={cityCompare} layout="vertical" margin={{ top:0, right:40, left:80, bottom:0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(99,179,237,0.06)" horizontal={false} />
                  <XAxis type="number" tick={{ fill:'#64748b', fontSize:10 }} axisLine={false} tickLine={false} />
                  <YAxis type="category" dataKey="name" tick={{ fill:'#94a3b8', fontSize:10 }} axisLine={false} tickLine={false} width={75} />
                  <Tooltip content={<Tip />} />
                  <Legend wrapperStyle={{ fontSize:'0.75rem', color:'#64748b' }} />
                  <Bar dataKey="2024" name="2024" fill="#334155" radius={[0,3,3,0]} />
                  <Bar dataKey="2025" name="2025" fill="#06b6d4" radius={[0,3,3,0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}

          {tab === 'channel' && (
            <div className="card">
              <h3 style={{ fontSize:'0.85rem', fontWeight:700, marginBottom:4, color:'#94a3b8' }}>Satış Kanalı — 2024 vs 2025</h3>
              <p style={{ fontSize:'0.72rem', color:'#475569', marginBottom:20 }}>Kanal bazlı satış hacmi değişimi</p>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={channelCompare} margin={{ top:5, right:20, left:-10, bottom:50 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(99,179,237,0.06)" />
                  <XAxis dataKey="name" tick={{ fill:'#64748b', fontSize:10 }} axisLine={false} tickLine={false} angle={-20} textAnchor="end" />
                  <YAxis tick={{ fill:'#64748b', fontSize:10 }} axisLine={false} tickLine={false} />
                  <Tooltip content={<Tip />} />
                  <Legend wrapperStyle={{ fontSize:'0.75rem', color:'#64748b' }} />
                  <Bar dataKey="2024" name="2024" fill="#334155" radius={[3,3,0,0]} />
                  <Bar dataKey="2025" name="2025" fill="#8b5cf6" radius={[3,3,0,0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}

        </motion.div>
      </div>
    </div>
  );
}
