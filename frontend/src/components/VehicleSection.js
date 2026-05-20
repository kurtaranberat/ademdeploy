import React, { useState, useMemo } from 'react';
import { motion } from 'framer-motion';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, PieChart, Pie, Cell, LineChart, Line, Legend,
} from 'recharts';
import { useFilter } from '../FilterContext';

const COLORS = ['#3b82f6','#06b6d4','#8b5cf6','#10b981','#f59e0b','#ef4444','#ec4899','#14b8a6','#f97316','#a855f7'];

const Tip = ({ active, payload, label }) => {
  if (!active||!payload?.length) return null;
  return (
    <div style={{ background:'#0d1526', border:'1px solid rgba(99,179,237,0.2)',
      borderRadius:10, padding:'10px 14px', fontSize:'0.8rem' }}>
      <p style={{ color:'#94a3b8', marginBottom:6 }}>{label}</p>
      {payload.map(p => (
        <p key={p.name} style={{ color:p.color||'#e2e8f0', fontWeight:700 }}>
          {p.name}: {p.value?.toLocaleString('tr-TR')}
        </p>
      ))}
    </div>
  );
};

export default function VehicleSection({ vehicles, allSales }) {
  const { month, channel, MONTH_KEYS, MONTH_LABELS } = useFilter();
  const [activeTab, setActiveTab] = useState('channel');

  if (!vehicles) return null;

  // Ay filtresi: allSales'den seçili aya ait veriyi çek
  const monthIdx   = month === 'all' ? -1 : MONTH_KEYS.indexOf(month);
  const monthLabel = month === 'all' ? '' : MONTH_LABELS[monthIdx];

  // Kanal filtresi için etiket eşleştirme
  const channelFilter = channel === 'B2C' ? 'b2c' : channel === 'B2B' ? 'b2b' : 'all';

  // Aylık trend — allSales varsa 2024+2025, yoksa vehicles
  const monthlyTrend = useMemo(() => {
    if (allSales?.monthly) {
      return MONTH_LABELS.map((ml) => ({
        month: ml,
        '2024': allSales.monthly['2024']?.[ml] || 0,
        '2025': allSales.monthly['2025']?.[ml] || 0,
      }));
    }
    return Object.entries(vehicles.monthlySalesTrend || {})
      .sort((a,b) => a[0].localeCompare(b[0]))
      .map(([m, count]) => ({ month: m.slice(5), '2025': count }));
  }, [allSales, vehicles]);

  const channelData = Object.entries(vehicles.channelDistribution)
    .sort((a,b) => b[1]-a[1])
    .map(([name, value], i) => ({ name, value, fill: COLORS[i%COLORS.length] }));

  const modelData = Object.entries(vehicles.modelDistribution)
    .sort((a,b) => b[1]-a[1])
    .map(([name, value], i) => ({ name, value, fill: COLORS[i%COLORS.length] }));

  const cityData = Object.entries(vehicles.cityDistribution)
    .sort((a,b) => b[1]-a[1]).slice(0,12)
    .map(([name, value], i) => ({ name, value, fill: COLORS[i%COLORS.length] }));

  const dealerData = Object.entries(vehicles.dealerSalesCount)
    .sort((a,b) => b[1]-a[1])
    .map(([name, value], i) => ({ name: name.replace('DEALER ','D'), value, fill: COLORS[i%COLORS.length] }));

  const colorTypeData = Object.entries(vehicles.colorTypeDistribution)
    .map(([name, value], i) => ({ name, value, fill: COLORS[i] }));

  const modelYearData = Object.entries(vehicles.modelYearDistribution)
    .sort((a,b) => a[0].localeCompare(b[0]))
    .map(([year, count]) => ({ year, count }));

  const tabs = [
    { id:'channel', label:'📡 Kanal' },
    { id:'model',   label:'🚗 Model' },
    { id:'city',    label:'🏙️ Şehir' },
    { id:'dealer',  label:'🏪 Bayi' },
    { id:'trend',   label:'📈 Trend' },
  ];

  return (
    <div>
      <motion.div initial={{ opacity:0, y:20 }} whileInView={{ opacity:1, y:0 }} viewport={{ once:true }}>
        <h2 className="section-title">Araç Satış Analizi</h2>
        <p className="section-subtitle">
          2025 satılan araç detayları · kanal · model · şehir
          {month !== 'all' && <span style={{ color:'#3b82f6', marginLeft:8 }}>· {monthLabel}</span>}
          {channel !== 'all' && <span style={{ color:'#10b981', marginLeft:8 }}>· {channel}</span>}
        </p>
      </motion.div>

      {/* KPI */}
      <motion.div className="grid-4" initial={{ opacity:0, y:20 }} whileInView={{ opacity:1, y:0 }}
        viewport={{ once:true }} style={{ marginBottom:24 }}>
        {[
          { label:'Toplam Araç',   value: vehicles.totalVehicles?.toLocaleString('tr-TR'), color:'#3b82f6' },
          { label:'Satış Kanalı',  value: Object.keys(vehicles.channelDistribution).length, color:'#06b6d4' },
          { label:'Farklı Model',  value: Object.keys(vehicles.modelDistribution).length,   color:'#8b5cf6' },
          { label:'Şehir Sayısı',  value: Object.keys(vehicles.cityDistribution).length,    color:'#10b981' },
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

      <div className="tab-group">
        {tabs.map(t => (
          <button key={t.id} className={`tab-btn ${activeTab===t.id?'active':''}`}
            onClick={() => setActiveTab(t.id)}>{t.label}</button>
        ))}
      </div>

      <motion.div key={activeTab} initial={{ opacity:0, y:10 }} animate={{ opacity:1, y:0 }}>

        {activeTab === 'channel' && (
          <div className="grid-2" style={{ gap:20 }}>
            <div className="card">
              <h3 style={{ fontSize:'0.85rem', fontWeight:700, marginBottom:16, color:'#94a3b8' }}>Satış Kanalı Dağılımı</h3>
              <ResponsiveContainer width="100%" height={280}>
                <PieChart>
                  <Pie data={channelData} cx="50%" cy="50%" outerRadius={100} dataKey="value"
                    label={({ name, percent }) => `${name} %${(percent*100).toFixed(0)}`} labelLine={false}>
                    {channelData.map((e,i) => <Cell key={i} fill={e.fill} />)}
                  </Pie>
                  <Tooltip content={<Tip />} />
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div className="card">
              <h3 style={{ fontSize:'0.85rem', fontWeight:700, marginBottom:16, color:'#94a3b8' }}>Renk Tipi & Model Yılı</h3>
              <div style={{ marginBottom:20 }}>
                <p style={{ fontSize:'0.72rem', color:'#64748b', marginBottom:8 }}>Renk Tipi</p>
                <div style={{ display:'flex', gap:10 }}>
                  {colorTypeData.map(d => (
                    <div key={d.name} style={{ flex:1, background:'var(--surface2)', borderRadius:10, padding:'12px', textAlign:'center' }}>
                      <div style={{ fontSize:'1.4rem', fontWeight:800, color:d.fill }}>{d.value}</div>
                      <div style={{ fontSize:'0.68rem', color:'#64748b', marginTop:4 }}>{d.name}</div>
                    </div>
                  ))}
                </div>
              </div>
              <p style={{ fontSize:'0.72rem', color:'#64748b', marginBottom:8 }}>Model Yılı Dağılımı</p>
              <ResponsiveContainer width="100%" height={140}>
                <BarChart data={modelYearData} margin={{ top:0, right:0, left:-20, bottom:0 }}>
                  <XAxis dataKey="year" tick={{ fill:'#64748b', fontSize:11 }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fill:'#64748b', fontSize:10 }} axisLine={false} tickLine={false} />
                  <Tooltip content={<Tip />} />
                  <Bar dataKey="count" name="Araç" radius={[4,4,0,0]}>
                    {modelYearData.map((_,i) => <Cell key={i} fill={COLORS[i%COLORS.length]} />)}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        )}

        {activeTab === 'model' && (
          <div className="card">
            <h3 style={{ fontSize:'0.85rem', fontWeight:700, marginBottom:16, color:'#94a3b8' }}>Model Bazlı Satış Adedi</h3>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={modelData} margin={{ top:5, right:10, left:-10, bottom:0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(99,179,237,0.06)" />
                <XAxis dataKey="name" tick={{ fill:'#64748b', fontSize:11 }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fill:'#64748b', fontSize:11 }} axisLine={false} tickLine={false} />
                <Tooltip content={<Tip />} />
                <Bar dataKey="value" name="Araç" radius={[4,4,0,0]}>
                  {modelData.map((e,i) => <Cell key={i} fill={e.fill} />)}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}

        {activeTab === 'city' && (
          <div className="card">
            <h3 style={{ fontSize:'0.85rem', fontWeight:700, marginBottom:16, color:'#94a3b8' }}>Şehir Bazlı Satış (Top 12)</h3>
            <ResponsiveContainer width="100%" height={360}>
              <BarChart data={cityData} layout="vertical" margin={{ top:0, right:40, left:80, bottom:0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(99,179,237,0.06)" horizontal={false} />
                <XAxis type="number" tick={{ fill:'#64748b', fontSize:11 }} axisLine={false} tickLine={false} />
                <YAxis type="category" dataKey="name" tick={{ fill:'#94a3b8', fontSize:11 }} axisLine={false} tickLine={false} width={75} />
                <Tooltip content={<Tip />} />
                <Bar dataKey="value" name="Araç" radius={[0,4,4,0]}>
                  {cityData.map((e,i) => <Cell key={i} fill={e.fill} />)}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}

        {activeTab === 'dealer' && (
          <div className="card">
            <h3 style={{ fontSize:'0.85rem', fontWeight:700, marginBottom:16, color:'#94a3b8' }}>Bayi Bazlı Satış Adedi</h3>
            <ResponsiveContainer width="100%" height={360}>
              <BarChart data={dealerData} layout="vertical" margin={{ top:0, right:40, left:60, bottom:0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(99,179,237,0.06)" horizontal={false} />
                <XAxis type="number" tick={{ fill:'#64748b', fontSize:11 }} axisLine={false} tickLine={false} />
                <YAxis type="category" dataKey="name" tick={{ fill:'#94a3b8', fontSize:11 }} axisLine={false} tickLine={false} width={55} />
                <Tooltip content={<Tip />} />
                <Bar dataKey="value" name="Araç" radius={[0,4,4,0]}>
                  {dealerData.map((e,i) => <Cell key={i} fill={e.fill} />)}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}

        {activeTab === 'trend' && (
          <div className="card">
            <h3 style={{ fontSize:'0.85rem', fontWeight:700, marginBottom:6, color:'#94a3b8' }}>
              Aylık Satış Trendi {allSales ? '— 2024 vs 2025' : '(2025)'}
            </h3>
            <p style={{ fontSize:'0.72rem', color:'#475569', marginBottom:16 }}>
              {allSales ? '5.876 araç · iki yıl karşılaştırması' : 'Aylık satış hacmi'}
            </p>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={monthlyTrend} margin={{ top:5, right:20, left:-10, bottom:0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(99,179,237,0.06)" />
                <XAxis dataKey="month" tick={{ fill:'#64748b', fontSize:11 }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fill:'#64748b', fontSize:11 }} axisLine={false} tickLine={false} />
                <Tooltip content={<Tip />} />
                <Legend wrapperStyle={{ fontSize:'0.75rem', color:'#64748b' }} />
                {allSales ? (
                  <>
                    <Line type="monotone" dataKey="2024" name="2024" stroke="#475569" strokeWidth={2}
                      strokeDasharray="5 3" dot={{ r:3, fill:'#475569' }} />
                    <Line type="monotone" dataKey="2025" name="2025" stroke="#3b82f6" strokeWidth={3}
                      dot={{ r:4, fill:'#3b82f6', stroke:'#0d1526', strokeWidth:2 }} activeDot={{ r:6 }} />
                  </>
                ) : (
                  <Line type="monotone" dataKey="2025" name="Satış" stroke="#3b82f6" strokeWidth={3}
                    dot={{ r:5, fill:'#3b82f6', stroke:'#0d1526', strokeWidth:2 }} activeDot={{ r:7 }} />
                )}
              </LineChart>
            </ResponsiveContainer>
          </div>
        )}

      </motion.div>
    </div>
  );
}


