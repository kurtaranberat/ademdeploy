import React, { useMemo } from 'react';
import { motion } from 'framer-motion';
import {
  AreaChart, Area, BarChart, Bar, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, Legend, ReferenceLine, Cell,
  LineChart, Line,
} from 'recharts';
import { useFilter } from '../FilterContext';

const MONTH_KEYS   = ['January','February','March','April','May','June',
  'July','August','September','October','Nowember','December'];
const MONTH_LABELS = ['Oca','Şub','Mar','Nis','May','Haz','Tem','Ağu','Eyl','Eki','Kas','Ara'];

const Tip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  return (
    <div style={{ background:'#0d1526', border:'1px solid rgba(99,179,237,0.2)',
      borderRadius:10, padding:'10px 14px', fontSize:'0.8rem' }}>
      <p style={{ color:'#94a3b8', marginBottom:6 }}>{label}</p>
      {payload.map(p => (
        <p key={p.name} style={{ color:p.color, fontWeight:700 }}>
          {p.name}: {p.value?.toLocaleString('tr-TR')}
        </p>
      ))}
    </div>
  );
};

export default function OverviewSection({ data, allSales }) {
  const { month, MONTH_KEYS: MK, MONTH_LABELS: ML } = useFilter();
  if (!data) return null;
  const { monthly, ytd } = data;

  // Seçili aya göre filtrele
  const filteredMonthly = useMemo(() => {
    if (month === 'all') return monthly;
    const idx = MONTH_KEYS.indexOf(month);
    return idx >= 0 ? [monthly[idx]] : monthly;
  }, [monthly, month]);

  const chartData = filteredMonthly.map((m, i) => ({
    ...m,
    month: month === 'all' ? m.month : MONTH_LABELS[MONTH_KEYS.indexOf(month)],
    achievement: m.target > 0 ? Math.round((m.actual / m.target) * 100) : 0,
  }));

  const totalTarget = filteredMonthly.reduce((s, m) => s + m.target, 0);
  const totalActual = filteredMonthly.reduce((s, m) => s + m.actual, 0);
  const overallAch  = totalTarget > 0 ? Math.round((totalActual / totalTarget) * 100) : 0;

  // 2024 vs 2025 aylık karşılaştırma (allSales'den)
  const compareData = useMemo(() => {
    if (!allSales?.monthly) return [];
    return MONTH_LABELS.map((ml, i) => ({
      month: ml,
      '2024': allSales.monthly['2024']?.[ml] || 0,
      '2025': allSales.monthly['2025']?.[ml] || 0,
    }));
  }, [allSales]);

  const monthLabel = month === 'all' ? 'Tüm Yıl' : MONTH_LABELS[MONTH_KEYS.indexOf(month)];

  return (
    <div>
      <motion.div initial={{ opacity:0, y:20 }} whileInView={{ opacity:1, y:0 }} viewport={{ once:true }}>
        <h2 className="section-title">Genel Bakış</h2>
        <p className="section-subtitle">
          Marka geneli hedef & gerçekleşme analizi
          {month !== 'all' && <span style={{ color:'#3b82f6', marginLeft:8 }}>· {monthLabel}</span>}
        </p>
      </motion.div>

      {/* KPI */}
      <motion.div className="grid-4" initial={{ opacity:0, y:20 }} whileInView={{ opacity:1, y:0 }}
        viewport={{ once:true }} style={{ marginBottom:24 }}>
        {[
          { label:'2024 YTD Satış',    value: ytd['2024']?.toLocaleString('tr-TR'), color:'#3b82f6' },
          { label:'2025 YTD Satış',    value: ytd['2025']?.toLocaleString('tr-TR'), color:'#06b6d4' },
          { label:`Hedef (${monthLabel})`, value: totalTarget.toLocaleString('tr-TR'), color:'#8b5cf6' },
          { label:`Gerç. % (${monthLabel})`, value:`%${overallAch}`,
            color: overallAch >= 100 ? '#10b981' : overallAch >= 80 ? '#f59e0b' : '#ef4444' },
        ].map((kpi, i) => (
          <motion.div key={kpi.label} className="kpi-card"
            initial={{ opacity:0, y:20 }} whileInView={{ opacity:1, y:0 }}
            viewport={{ once:true }} transition={{ delay: i*0.08 }}>
            <div className="kpi-label">{kpi.label}</div>
            <div className="kpi-value" style={{ color:kpi.color }}>{kpi.value}</div>
            <div className="kpi-glow" style={{ background:kpi.color }} />
          </motion.div>
        ))}
      </motion.div>

      {/* Grafikler */}
      <div className="grid-2" style={{ gap:20 }}>
        <motion.div className="card" initial={{ opacity:0, x:-20 }} whileInView={{ opacity:1, x:0 }} viewport={{ once:true }}>
          <h3 style={{ fontSize:'0.85rem', fontWeight:700, marginBottom:16, color:'#94a3b8' }}>
            Hedef vs Gerçekleşme {month !== 'all' ? `— ${monthLabel}` : '(2024)'}
          </h3>
          <ResponsiveContainer width="100%" height={260}>
            <AreaChart data={chartData} margin={{ top:5, right:10, left:-10, bottom:0 }}>
              <defs>
                <linearGradient id="gT" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3}/>
                  <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                </linearGradient>
                <linearGradient id="gA" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#06b6d4" stopOpacity={0.3}/>
                  <stop offset="95%" stopColor="#06b6d4" stopOpacity={0}/>
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(99,179,237,0.06)" />
              <XAxis dataKey="month" tick={{ fill:'#64748b', fontSize:11 }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fill:'#64748b', fontSize:11 }} axisLine={false} tickLine={false} />
              <Tooltip content={<Tip />} />
              <Legend wrapperStyle={{ fontSize:'0.75rem', color:'#64748b' }} />
              <Area type="monotone" dataKey="target" name="Hedef" stroke="#3b82f6" strokeWidth={2} fill="url(#gT)" />
              <Area type="monotone" dataKey="actual" name="Gerçekleşme" stroke="#06b6d4" strokeWidth={2} fill="url(#gA)" />
            </AreaChart>
          </ResponsiveContainer>
        </motion.div>

        <motion.div className="card" initial={{ opacity:0, x:20 }} whileInView={{ opacity:1, x:0 }} viewport={{ once:true }}>
          <h3 style={{ fontSize:'0.85rem', fontWeight:700, marginBottom:16, color:'#94a3b8' }}>
            Hedef Gerçekleştirme % {month !== 'all' ? `— ${monthLabel}` : '(2024)'}
          </h3>
          <ResponsiveContainer width="100%" height={260}>
            <BarChart data={chartData} margin={{ top:5, right:10, left:-10, bottom:0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(99,179,237,0.06)" />
              <XAxis dataKey="month" tick={{ fill:'#64748b', fontSize:11 }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fill:'#64748b', fontSize:11 }} axisLine={false} tickLine={false} domain={[0, 160]} />
              <Tooltip content={<Tip />} />
              <ReferenceLine y={100} stroke="#10b981" strokeDasharray="4 4" strokeWidth={1.5}
                label={{ value:'%100', fill:'#10b981', fontSize:10 }} />
              <Bar dataKey="achievement" name="Gerç. %" radius={[4,4,0,0]}>
                {chartData.map((e, i) => (
                  <Cell key={i} fill={e.achievement >= 100 ? '#10b981' : e.achievement >= 80 ? '#f59e0b' : '#ef4444'} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </motion.div>
      </div>

      {/* 2024 vs 2025 aylık karşılaştırma */}
      {allSales && (
        <motion.div className="card" initial={{ opacity:0, y:20 }} whileInView={{ opacity:1, y:0 }}
          viewport={{ once:true }} style={{ marginTop:20 }}>
          <h3 style={{ fontSize:'0.85rem', fontWeight:700, marginBottom:16, color:'#94a3b8' }}>
            2024 vs 2025 Aylık Satış Karşılaştırması
          </h3>
          <ResponsiveContainer width="100%" height={240}>
            <LineChart data={compareData} margin={{ top:5, right:20, left:-10, bottom:0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(99,179,237,0.06)" />
              <XAxis dataKey="month" tick={{ fill:'#64748b', fontSize:11 }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fill:'#64748b', fontSize:11 }} axisLine={false} tickLine={false} />
              <Tooltip content={<Tip />} />
              <Legend wrapperStyle={{ fontSize:'0.75rem', color:'#64748b' }} />
              <Line type="monotone" dataKey="2024" name="2024" stroke="#475569" strokeWidth={2}
                strokeDasharray="5 3" dot={{ r:3, fill:'#475569' }} />
              <Line type="monotone" dataKey="2025" name="2025" stroke="#3b82f6" strokeWidth={3}
                dot={{ r:4, fill:'#3b82f6', stroke:'#0d1526', strokeWidth:2 }} activeDot={{ r:6 }} />
            </LineChart>
          </ResponsiveContainer>
        </motion.div>
      )}

      {/* Detay tablosu */}
      <motion.div className="card" initial={{ opacity:0, y:20 }} whileInView={{ opacity:1, y:0 }}
        viewport={{ once:true }} style={{ marginTop:20, overflowX:'auto' }}>
        <h3 style={{ fontSize:'0.85rem', fontWeight:700, marginBottom:16, color:'#94a3b8' }}>
          Detay Tablosu {month !== 'all' ? `— ${monthLabel}` : ''}
        </h3>
        <table style={{ width:'100%', borderCollapse:'collapse', fontSize:'0.82rem' }}>
          <thead>
            <tr style={{ borderBottom:'1px solid rgba(99,179,237,0.1)' }}>
              {['Ay','Hedef','Gerçekleşme','Fark','Gerç. %'].map(h => (
                <th key={h} style={{ padding:'8px 12px', textAlign:'left', color:'#64748b',
                  fontWeight:600, fontSize:'0.72rem', textTransform:'uppercase', letterSpacing:'0.05em' }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {chartData.map((row, i) => {
              const diff = row.actual - row.target;
              return (
                <tr key={row.month} style={{ borderBottom:'1px solid rgba(99,179,237,0.05)',
                  background: i%2===0 ? 'transparent' : 'rgba(255,255,255,0.01)' }}>
                  <td style={{ padding:'9px 12px', fontWeight:600 }}>{row.month}</td>
                  <td style={{ padding:'9px 12px', color:'#94a3b8' }}>{row.target.toLocaleString('tr-TR')}</td>
                  <td style={{ padding:'9px 12px', color:'#e2e8f0', fontWeight:600 }}>{row.actual.toLocaleString('tr-TR')}</td>
                  <td style={{ padding:'9px 12px', color: diff>=0?'#10b981':'#ef4444', fontWeight:600 }}>
                    {diff>=0?'+':''}{diff.toLocaleString('tr-TR')}
                  </td>
                  <td style={{ padding:'9px 12px' }}>
                    <span className={`ach-badge ${row.achievement>=100?'green':row.achievement>=80?'yellow':'red'}`}>
                      %{row.achievement}
                    </span>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </motion.div>
    </div>
  );
}
