import React, { useState, useMemo } from 'react';
import { motion } from 'framer-motion';
import {
  RadarChart, Radar, PolarGrid, PolarAngleAxis, PolarRadiusAxis,
  ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid,
  Tooltip, Cell, ReferenceLine,
} from 'recharts';
import { useFilter } from '../FilterContext';

const MONTHS      = ['January','February','March','April','May','June',
  'July','August','September','October','Nowember','December'];
const MONTH_SHORT = ['Oca','Şub','Mar','Nis','May','Haz','Tem','Ağu','Eyl','Eki','Kas','Ara'];

function achColor(v) {
  if (v===null||v===undefined) return '#1e293b';
  if (v>=120) return '#059669';
  if (v>=100) return '#10b981';
  if (v>=80)  return '#f59e0b';
  if (v>=60)  return '#ef4444';
  return '#7f1d1d';
}

const Tip = ({ active, payload, label }) => {
  if (!active||!payload?.length) return null;
  return (
    <div style={{ background:'#0d1526', border:'1px solid rgba(99,179,237,0.2)',
      borderRadius:10, padding:'10px 14px', fontSize:'0.8rem' }}>
      <p style={{ color:'#94a3b8', marginBottom:6 }}>{label}</p>
      {payload.map(p => (
        <p key={p.name} style={{ color:p.color||'#e2e8f0', fontWeight:700 }}>
          {p.name}: {typeof p.value==='number'
            ? (p.name.includes('%') ? `%${p.value}` : p.value.toLocaleString('tr-TR'))
            : p.value}
        </p>
      ))}
    </div>
  );
};

export default function DealerSection({ dealersFull, dealersMonthly }) {
  const { year, setYear, month, dealer, setDealer, channel, MONTH_KEYS, MONTH_LABELS } = useFilter();
  const [view, setView] = useState('heatmap');

  const allDealers = dealersFull?.[year] || [];
  const allMonthly = dealersMonthly?.[year] || [];

  // Bayi filtresi
  const dealers = useMemo(() =>
    dealer === 'all' ? allDealers : allDealers.filter(d => d.code === dealer),
  [allDealers, dealer]);

  const monthly = useMemo(() =>
    dealer === 'all' ? allMonthly : allMonthly.filter(d => d.code === dealer),
  [allMonthly, dealer]);

  // Kanal filtresi (b2c/b2b)
  const dealersFiltered = useMemo(() => {
    if (channel === 'all') return dealers;
    return dealers.map(d => ({
      ...d,
      achievement: channel === 'B2C'
        ? (d.target > 0 ? Math.round((d.b2c / d.target) * 100) : 0)
        : (d.target > 0 ? Math.round((d.b2b / d.target) * 100) : 0),
    }));
  }, [dealers, channel]);

  // Ay filtresi — ısı haritasında tek ay vurgula
  const activeMonthIdx = month === 'all' ? -1 : MONTH_KEYS.indexOf(month);

  const selectedDealer = dealer !== 'all' ? dealersFiltered[0] : null;
  const selectedMonthly = monthly.find(d => d.code === selectedDealer?.code);

  const radarData = selectedMonthly
    ? MONTHS.map((m, i) => ({ month: MONTH_SHORT[i], value: selectedMonthly.monthly[m] || 0 }))
    : [];

  const sorted = [...dealersFiltered].sort((a,b) => (b.achievement||0)-(a.achievement||0));

  const barData = sorted.map(d => ({
    name: d.name.replace('DEALER ','D'),
    achievement: d.achievement || 0,
    b2c: d.b2c || 0,
    target: d.target || 0,
  }));

  // Seçili ay için tek sütun göster
  const singleMonthData = activeMonthIdx >= 0
    ? monthly.map(d => ({
        name: d.name.replace('DEALER ','D'),
        ach: d.monthly?.[MONTH_KEYS[activeMonthIdx]] || 0,
      })).sort((a,b) => b.ach - a.ach)
    : null;

  const monthLabel = month === 'all' ? '' : MONTH_LABELS[activeMonthIdx];

  return (
    <div>
      <motion.div initial={{ opacity:0, y:20 }} whileInView={{ opacity:1, y:0 }} viewport={{ once:true }}>
        <h2 className="section-title">Bayi Performansı</h2>
        <p className="section-subtitle">
          {dealers.length} bayi · hedef gerçekleştirme · ısı haritası
          {month !== 'all' && <span style={{ color:'#3b82f6', marginLeft:8 }}>· {monthLabel}</span>}
          {channel !== 'all' && <span style={{ color:'#10b981', marginLeft:8 }}>· {channel}</span>}
        </p>
      </motion.div>

      {/* Yıl + görünüm seçici (global filtre yılı override) */}
      <div style={{ display:'flex', gap:10, marginBottom:20, flexWrap:'wrap', alignItems:'center' }}>
        <div className="tab-group" style={{ marginBottom:0 }}>
          {['2024','2025'].map(y => (
            <button key={y} className={`tab-btn ${year===y?'active':''}`} onClick={() => setYear(y)}>{y}</button>
          ))}
        </div>
        <div className="tab-group" style={{ marginBottom:0 }}>
          {[
            { id:'heatmap', label:'🌡️ Isı Haritası' },
            { id:'bar',     label:'📊 Sıralama' },
            { id:'detail',  label:'🔍 Detay' },
          ].map(v => (
            <button key={v.id} className={`tab-btn ${view===v.id?'active':''}`} onClick={() => setView(v.id)}>{v.label}</button>
          ))}
        </div>
      </div>

      {/* KPI şeridi */}
      <div style={{ display:'flex', gap:12, marginBottom:20, flexWrap:'wrap' }}>
        {[
          { label:'Ort. Gerç.', value:`%${Math.round(dealersFiltered.reduce((s,d)=>s+(d.achievement||0),0)/Math.max(dealersFiltered.length,1))}`,
            color:'#3b82f6' },
          { label:'Hedef Üstü', value:`${dealersFiltered.filter(d=>(d.achievement||0)>=100).length}/${dealersFiltered.length}`,
            color:'#10b981' },
          { label:'En İyi', value: sorted[0]?.name?.replace('DEALER ','D') || '—', color:'#059669' },
          { label:'En Düşük', value: sorted[sorted.length-1]?.name?.replace('DEALER ','D') || '—', color:'#ef4444' },
        ].map(k => (
          <div key={k.label} style={{ background:'rgba(13,21,38,0.8)', border:`1px solid ${k.color}20`,
            borderRadius:10, padding:'8px 16px', flex:'1 1 120px' }}>
            <div style={{ fontSize:'0.62rem', color:'#475569', fontWeight:600, textTransform:'uppercase', letterSpacing:'0.07em' }}>{k.label}</div>
            <div style={{ fontSize:'1rem', fontWeight:800, color:k.color, marginTop:2 }}>{k.value}</div>
          </div>
        ))}
      </div>

      {/* ISI HARİTASI */}
      {view === 'heatmap' && (
        <motion.div initial={{ opacity:0 }} animate={{ opacity:1 }} className="card" style={{ overflowX:'auto' }}>
          <h3 style={{ fontSize:'0.82rem', fontWeight:700, marginBottom:14, color:'#94a3b8' }}>
            Aylık Hedef Gerçekleştirme — {year}
            {month !== 'all' && <span style={{ color:'#3b82f6', marginLeft:8 }}>({monthLabel} vurgulu)</span>}
          </h3>
          <div style={{ minWidth:720 }}>
            {/* Header */}
            <div style={{ display:'grid', gridTemplateColumns:'140px repeat(12,1fr) 80px', gap:3, marginBottom:4 }}>
              <div />
              {MONTH_SHORT.map((m, i) => (
                <div key={m} style={{
                  fontSize:'0.62rem', color: activeMonthIdx===i ? '#3b82f6' : '#64748b',
                  textAlign:'center', fontWeight: activeMonthIdx===i ? 800 : 600,
                }}>{m}</div>
              ))}
              <div style={{ fontSize:'0.62rem', color:'#64748b', textAlign:'center', fontWeight:600 }}>Yıllık</div>
            </div>
            {/* Satırlar */}
            {monthly.map((d, ri) => (
              <motion.div key={d.code}
                initial={{ opacity:0, x:-10 }} whileInView={{ opacity:1, x:0 }}
                viewport={{ once:true }} transition={{ delay: ri*0.02 }}
                style={{ display:'grid', gridTemplateColumns:'140px repeat(12,1fr) 80px',
                  gap:3, marginBottom:3, cursor:'pointer' }}
                onClick={() => { setDealer(d.code); setView('detail'); }}
              >
                <div style={{ fontSize:'0.7rem', color:'#94a3b8', display:'flex', alignItems:'center',
                  paddingRight:8, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>
                  {d.name}
                </div>
                {MONTHS.map((mk, mi) => {
                  const val = d.monthly[mk];
                  const isActive = activeMonthIdx === mi;
                  return (
                    <div key={mk}
                      title={`${d.name} - ${MONTH_SHORT[mi]}: ${val!==null?'%'+val:'-'}`}
                      style={{
                        height:26, borderRadius:4,
                        background: achColor(val),
                        opacity: activeMonthIdx >= 0 && !isActive ? 0.35 : 1,
                        border: isActive ? '2px solid rgba(255,255,255,0.4)' : '2px solid transparent',
                        display:'flex', alignItems:'center', justifyContent:'center',
                        fontSize:'0.58rem', fontWeight:700,
                        color: val!==null ? 'rgba(255,255,255,0.9)' : '#334155',
                        transition:'all 0.15s',
                      }}
                      onMouseEnter={e => e.currentTarget.style.transform='scale(1.15)'}
                      onMouseLeave={e => e.currentTarget.style.transform='scale(1)'}
                    >
                      {val!==null ? val : '—'}
                    </div>
                  );
                })}
                <div style={{
                  height:26, borderRadius:4, background: achColor(d.fullYear),
                  display:'flex', alignItems:'center', justifyContent:'center',
                  fontSize:'0.62rem', fontWeight:800, color:'rgba(255,255,255,0.95)',
                  border:'1px solid rgba(255,255,255,0.1)',
                }}>
                  {d.fullYear!==null ? `%${d.fullYear}` : '—'}
                </div>
              </motion.div>
            ))}
          </div>
          {/* Legend */}
          <div style={{ display:'flex', gap:10, marginTop:14, flexWrap:'wrap', alignItems:'center' }}>
            <span style={{ fontSize:'0.68rem', color:'#64748b' }}>Renk:</span>
            {[['#059669','≥120%'],['#10b981','100–119%'],['#f59e0b','80–99%'],['#ef4444','60–79%'],['#7f1d1d','<60%']].map(([c,l]) => (
              <div key={l} style={{ display:'flex', alignItems:'center', gap:4 }}>
                <div style={{ width:10, height:10, borderRadius:2, background:c }} />
                <span style={{ fontSize:'0.68rem', color:'#94a3b8' }}>{l}</span>
              </div>
            ))}
          </div>
        </motion.div>
      )}

      {/* SIRALAMA */}
      {view === 'bar' && (
        <motion.div initial={{ opacity:0 }} animate={{ opacity:1 }} className="card">
          <h3 style={{ fontSize:'0.82rem', fontWeight:700, marginBottom:16, color:'#94a3b8' }}>
            {month !== 'all' ? `${monthLabel} Ayı` : 'Yıllık'} Bayi Sıralaması — {year}
            {channel !== 'all' && ` (${channel})`}
          </h3>
          <ResponsiveContainer width="100%" height={Math.max(300, barData.length * 28)}>
            <BarChart data={month !== 'all' && singleMonthData ? singleMonthData : barData}
              layout="vertical" margin={{ top:0, right:50, left:60, bottom:0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(99,179,237,0.06)" horizontal={false} />
              <XAxis type="number" tick={{ fill:'#64748b', fontSize:10 }} axisLine={false} tickLine={false} domain={[0,200]} />
              <YAxis type="category" dataKey="name" tick={{ fill:'#94a3b8', fontSize:10 }} axisLine={false} tickLine={false} width={55} />
              <Tooltip content={<Tip />} />
              <ReferenceLine x={100} stroke="#10b981" strokeDasharray="4 4" strokeWidth={1.5} />
              <Bar dataKey={month !== 'all' && singleMonthData ? 'ach' : 'achievement'}
                name="Gerç. %" radius={[0,4,4,0]}>
                {(month !== 'all' && singleMonthData ? singleMonthData : barData).map((e, i) => (
                  <Cell key={i} fill={achColor(e.achievement ?? e.ach)} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </motion.div>
      )}

      {/* DETAY */}
      {view === 'detail' && (
        <motion.div initial={{ opacity:0 }} animate={{ opacity:1 }}>
          {/* Bayi seçici */}
          <div style={{ display:'flex', gap:6, flexWrap:'wrap', marginBottom:16 }}>
            {allDealers.map(d => (
              <button key={d.code} onClick={() => setDealer(d.code === dealer ? 'all' : d.code)}
                style={{
                  padding:'5px 11px', borderRadius:8, border:'1px solid',
                  borderColor: dealer===d.code ? '#3b82f6' : 'rgba(99,179,237,0.15)',
                  background: dealer===d.code ? 'rgba(59,130,246,0.15)' : 'transparent',
                  color: dealer===d.code ? '#3b82f6' : '#64748b',
                  fontSize:'0.73rem', fontWeight:600, cursor:'pointer',
                  fontFamily:'Inter,sans-serif', transition:'all 0.15s',
                }}>
                {d.name}
              </button>
            ))}
          </div>

          {selectedDealer && (
            <div className="grid-2" style={{ gap:20 }}>
              <div className="card">
                <h3 style={{ fontSize:'0.95rem', fontWeight:800, marginBottom:4 }}>{selectedDealer.name}</h3>
                <p style={{ fontSize:'0.72rem', color:'#64748b', marginBottom:16 }}>{selectedDealer.code}</p>
                <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:10 }}>
                  {[
                    { label:'Hedef',    value: selectedDealer.target?.toLocaleString('tr-TR'), color:'#8b5cf6' },
                    { label:'B2C',      value: selectedDealer.b2c?.toLocaleString('tr-TR'),    color:'#06b6d4' },
                    { label:'B2B',      value: selectedDealer.b2b?.toLocaleString('tr-TR'),    color:'#3b82f6' },
                    { label:'Gerç. %',  value:`%${selectedDealer.achievement||0}`,
                      color: achColor(selectedDealer.achievement) },
                  ].map(kpi => (
                    <div key={kpi.label} style={{ background:'var(--surface2)', borderRadius:10, padding:'12px 14px' }}>
                      <div style={{ fontSize:'0.68rem', color:'#64748b', marginBottom:4 }}>{kpi.label}</div>
                      <div style={{ fontSize:'1.3rem', fontWeight:800, color:kpi.color }}>{kpi.value}</div>
                    </div>
                  ))}
                </div>
                {year==='2025' && selectedDealer.models && (
                  <div style={{ marginTop:16 }}>
                    <p style={{ fontSize:'0.72rem', color:'#64748b', marginBottom:8, fontWeight:600 }}>Model Dağılımı (B2C)</p>
                    {Object.entries(selectedDealer.models).map(([m, cnt]) => {
                      const pct = selectedDealer.b2c > 0 ? Math.round((cnt/selectedDealer.b2c)*100) : 0;
                      return (
                        <div key={m} style={{ marginBottom:7 }}>
                          <div style={{ display:'flex', justifyContent:'space-between', marginBottom:2 }}>
                            <span style={{ fontSize:'0.72rem', color:'#94a3b8' }}>Model {m}</span>
                            <span style={{ fontSize:'0.72rem', fontWeight:700, color:'#e2e8f0' }}>{cnt} <span style={{ color:'#475569' }}>(%{pct})</span></span>
                          </div>
                          <div className="progress-bar">
                            <motion.div className="progress-fill"
                              initial={{ width:0 }} animate={{ width:`${pct}%` }}
                              style={{ background:'linear-gradient(90deg,#3b82f6,#06b6d4)' }} />
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
              <div className="card">
                <h3 style={{ fontSize:'0.82rem', fontWeight:700, marginBottom:14, color:'#94a3b8' }}>
                  Aylık Performans Radar
                  {month !== 'all' && <span style={{ color:'#3b82f6', marginLeft:6 }}>({monthLabel} vurgulu)</span>}
                </h3>
                <ResponsiveContainer width="100%" height={280}>
                  <RadarChart data={radarData}>
                    <PolarGrid stroke="rgba(99,179,237,0.1)" />
                    <PolarAngleAxis dataKey="month" tick={{ fill:'#64748b', fontSize:10 }} />
                    <PolarRadiusAxis angle={90} domain={[0,200]} tick={{ fill:'#64748b', fontSize:8 }} />
                    <Radar name="Gerç. %" dataKey="value" stroke="#3b82f6" fill="#3b82f6" fillOpacity={0.2} strokeWidth={2} />
                  </RadarChart>
                </ResponsiveContainer>
                {/* Seçili ay vurgusu */}
                {month !== 'all' && selectedMonthly && (
                  <div style={{ textAlign:'center', marginTop:8 }}>
                    <span style={{ fontSize:'0.72rem', color:'#475569' }}>{monthLabel}: </span>
                    <span style={{ fontSize:'1.1rem', fontWeight:800,
                      color: achColor(selectedMonthly.monthly?.[MONTH_KEYS[activeMonthIdx]]) }}>
                      %{selectedMonthly.monthly?.[MONTH_KEYS[activeMonthIdx]] || 0}
                    </span>
                  </div>
                )}
              </div>
            </div>
          )}
        </motion.div>
      )}
    </div>
  );
}
