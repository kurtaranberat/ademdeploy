import React, { useMemo } from 'react';
import { motion } from 'framer-motion';
import {
  RadarChart, Radar, PolarGrid, PolarAngleAxis, PolarRadiusAxis,
  ResponsiveContainer, ScatterChart, Scatter, XAxis, YAxis,
  CartesianGrid, Tooltip, BarChart, Bar, Cell, ReferenceLine,
} from 'recharts';

const MONTHS = ['January','February','March','April','May','June',
  'July','August','September','October','Nowember','December'];
const MONTH_SHORT = ['Oca','Şub','Mar','Nis','May','Haz','Tem','Ağu','Eyl','Eki','Kas','Ara'];

function achColor(v) {
  if (!v) return '#1e293b';
  if (v >= 120) return '#059669';
  if (v >= 100) return '#10b981';
  if (v >= 80)  return '#f59e0b';
  if (v >= 60)  return '#ef4444';
  return '#7f1d1d';
}

const Tip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  return (
    <div style={{ background:'#0d1526', border:'1px solid rgba(99,179,237,0.2)',
      borderRadius:10, padding:'10px 14px', fontSize:'0.78rem' }}>
      <p style={{ color:'#94a3b8', marginBottom:6 }}>{label}</p>
      {payload.map(p => (
        <p key={p.name} style={{ color: p.color||'#e2e8f0', fontWeight:700 }}>
          {p.name}: {typeof p.value === 'number' ? p.value.toLocaleString('tr-TR') : p.value}
        </p>
      ))}
    </div>
  );
};

// ── Veri analizinden otomatik çıkarımlar üret ────────────────────────────────
function generateInsights(dealers25, dealers24, modelsMonthly, vehicles) {
  const insights = [];

  if (!dealers25?.length) return insights;

  // 1) En iyi & en kötü bayi
  const sorted = [...dealers25].sort((a,b) => (b.achievement||0)-(a.achievement||0));
  const best  = sorted[0];
  const worst = sorted[sorted.length-1];
  const avg25 = Math.round(sorted.reduce((s,d)=>s+(d.achievement||0),0)/sorted.length);

  insights.push({
    type: 'success', icon: '🏆',
    title: 'En Yüksek Performans',
    text: `${best?.name} %${best?.achievement} gerçekleştirme ile lider. Hedefin ${Math.round((best?.achievement||0)/100*best?.target)} adet üzerinde satış yaptı.`,
    value: `%${best?.achievement}`,
  });

  insights.push({
    type: 'warning', icon: '⚠️',
    title: 'Gelişim Gerektiren Bayi',
    text: `${worst?.name} %${worst?.achievement} ile en düşük performansta. Ortalama (%${avg25}) ile arasında ${avg25-(worst?.achievement||0)} puanlık fark var.`,
    value: `%${worst?.achievement}`,
  });

  // 2) Hedef üstü bayi sayısı
  const over100 = dealers25.filter(d=>(d.achievement||0)>=100).length;
  const pct = Math.round((over100/dealers25.length)*100);
  insights.push({
    type: pct >= 60 ? 'success' : 'info', icon: '📊',
    title: 'Hedef Gerçekleştirme Oranı',
    text: `22 bayinin ${over100}'i (%${pct}) 2025 yılında hedefini aştı. ${dealers25.length-over100} bayi hedefin altında kaldı.`,
    value: `${over100}/22`,
  });

  // 3) 2024 vs 2025 karşılaştırma
  if (dealers24?.length) {
    const avg24 = Math.round(dealers24.reduce((s,d)=>s+(d.achievement||0),0)/dealers24.length);
    const diff  = avg25 - avg24;
    insights.push({
      type: diff >= 0 ? 'success' : 'warning', icon: diff >= 0 ? '📈' : '📉',
      title: '2024 → 2025 Değişim',
      text: `Ortalama hedef gerçekleştirme 2024'te %${avg24} iken 2025'te %${avg25} oldu. ${Math.abs(diff)} puanlık ${diff>=0?'artış':'düşüş'} yaşandı.`,
      value: `${diff>=0?'+':''}${diff}p`,
    });
  }

  // 4) En çok satan model
  if (modelsMonthly) {
    const totals = {};
    Object.values(modelsMonthly).forEach(m => {
      Object.entries(m.modelTotals||{}).forEach(([k,v]) => { totals[k]=(totals[k]||0)+v; });
    });
    const topModel = Object.entries(totals).sort((a,b)=>b[1]-a[1])[0];
    if (topModel) {
      const total = Object.values(totals).reduce((s,v)=>s+v,0);
      insights.push({
        type: 'info', icon: '🚗',
        title: 'En Çok Satan Model',
        text: `Model ${topModel[0]}, 2025 B2C satışlarının %${Math.round((topModel[1]/total)*100)}'ini oluşturuyor (${topModel[1]} adet). Portföyün bel kemiği.`,
        value: `Model ${topModel[0]}`,
      });
    }
  }

  // 5) Şehir konsantrasyonu
  if (vehicles?.cityDistribution) {
    const cities = Object.entries(vehicles.cityDistribution).sort((a,b)=>b[1]-a[1]);
    const top3   = cities.slice(0,3);
    const total  = Object.values(vehicles.cityDistribution).reduce((s,v)=>s+v,0);
    const top3pct= Math.round((top3.reduce((s,[,v])=>s+v,0)/total)*100);
    insights.push({
      type: 'info', icon: '🏙️',
      title: 'Coğrafi Konsantrasyon',
      text: `${top3.map(([c])=>c).join(', ')} şehirleri toplam satışların %${top3pct}'ini oluşturuyor. Coğrafi çeşitlendirme fırsatı mevcut.`,
      value: `%${top3pct}`,
    });
  }

  // 6) B2C vs B2B dengesi
  const totalB2C = dealers25.reduce((s,d)=>s+(d.b2c||0),0);
  const totalB2B = dealers25.reduce((s,d)=>s+(d.b2b||0),0);
  const b2cPct   = Math.round((totalB2C/(totalB2C+totalB2B||1))*100);
  insights.push({
    type: 'info', icon: '⚖️',
    title: 'B2C / B2B Dengesi',
    text: `Toplam satışların %${b2cPct}'i B2C, %${100-b2cPct}'i B2B kanalından geliyor. ${b2cPct>70?'B2C ağırlıklı yapı kurumsal satış potansiyeli sunuyor.':'Dengeli kanal dağılımı sağlıklı bir portföy göstergesi.'}`,
    value: `%${b2cPct} B2C`,
  });

  return insights;
}

// ── Ana bileşen ──────────────────────────────────────────────────────────────
export default function InsightsSection({ data }) {
  const dealers25      = data.dealersFull?.['2025'] || [];
  const dealers24      = data.dealersFull?.['2024'] || [];
  const modelsMonthly  = data.modelsMonthly;
  const vehicles       = data.vehicles;
  const dealersMonthly = data.dealersMonthly?.['2025'] || [];

  const insights = useMemo(
    () => generateInsights(dealers25, dealers24, modelsMonthly, vehicles),
    [dealers25, dealers24, modelsMonthly, vehicles]
  );

  // Scatter: Hedef vs Gerçekleşme (2025)
  const scatterData = dealers25.map(d => ({
    name: d.name,
    x: d.target || 0,
    y: d.b2c    || 0,
    z: d.achievement || 0,
  }));

  // Radar: aylık ortalama gerçekleşme
  const radarData = MONTHS.map((m, i) => {
    const vals = dealersMonthly.map(d => d.monthly?.[m]).filter(v => v !== null && v !== undefined);
    const avg  = vals.length ? Math.round(vals.reduce((s,v)=>s+v,0)/vals.length) : 0;
    return { month: MONTH_SHORT[i], avg };
  });

  // Bar: bayi sıralaması (2025)
  const rankData = [...dealers25]
    .sort((a,b)=>(b.achievement||0)-(a.achievement||0))
    .map(d => ({ name: d.name.replace('DEALER ','D'), ach: d.achievement||0 }));

  // Aylık trend karşılaştırma (2024 vs 2025)
  const trendCompare = MONTHS.map((m, i) => {
    const vals25 = dealersMonthly.map(d=>d.monthly?.[m]).filter(v=>v!=null);
    const avg25  = vals25.length ? Math.round(vals25.reduce((s,v)=>s+v,0)/vals25.length) : 0;
    const dm24   = data.dealersMonthly?.['2024'] || [];
    const vals24 = dm24.map(d=>d.monthly?.[m]).filter(v=>v!=null);
    const avg24  = vals24.length ? Math.round(vals24.reduce((s,v)=>s+v,0)/vals24.length) : 0;
    return { month: MONTH_SHORT[i], '2025': avg25, '2024': avg24 };
  });

  const typeColor = { success:'#10b981', warning:'#f59e0b', info:'#3b82f6' };

  return (
    <div style={{ padding:'0 24px' }}>
      <div style={{ maxWidth:1400, margin:'0 auto' }}>

        <motion.div initial={{ opacity:0, y:20 }} whileInView={{ opacity:1, y:0 }} viewport={{ once:true }}>
          <h2 className="section-title">Analiz & Çıkarımlar</h2>
          <p className="section-subtitle">Verilerden otomatik üretilen içgörüler · ilişkiler · öneriler</p>
        </motion.div>

        {/* Insight kartları */}
        <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill,minmax(300px,1fr))', gap:16, marginBottom:32 }}>
          {insights.map((ins, i) => (
            <motion.div
              key={i}
              className="card"
              initial={{ opacity:0, y:20 }}
              whileInView={{ opacity:1, y:0 }}
              viewport={{ once:true }}
              transition={{ delay: i*0.07 }}
              style={{ borderLeft:`3px solid ${typeColor[ins.type]}`, position:'relative', overflow:'hidden' }}
            >
              <div style={{ position:'absolute', top:16, right:16, fontSize:'1.6rem', opacity:0.15 }}>{ins.icon}</div>
              <div style={{ display:'flex', alignItems:'center', gap:8, marginBottom:8 }}>
                <span style={{ fontSize:'1.1rem' }}>{ins.icon}</span>
                <span style={{ fontSize:'0.75rem', fontWeight:700, color: typeColor[ins.type], textTransform:'uppercase', letterSpacing:'0.06em' }}>{ins.title}</span>
              </div>
              <p style={{ fontSize:'0.82rem', color:'#94a3b8', lineHeight:1.6, marginBottom:10 }}>{ins.text}</p>
              <div style={{ fontSize:'1.4rem', fontWeight:900, color: typeColor[ins.type] }}>{ins.value}</div>
            </motion.div>
          ))}
        </div>

        {/* Grafikler */}
        <div className="grid-2" style={{ gap:20, marginBottom:20 }}>

          {/* Scatter: Hedef vs B2C */}
          <motion.div className="card" initial={{ opacity:0, x:-20 }} whileInView={{ opacity:1, x:0 }} viewport={{ once:true }}>
            <h3 style={{ fontSize:'0.85rem', fontWeight:700, marginBottom:6, color:'#94a3b8' }}>Hedef ↔ B2C Satış İlişkisi (2025)</h3>
            <p style={{ fontSize:'0.72rem', color:'#475569', marginBottom:16 }}>Yüksek hedefli bayilerin B2C performansı nasıl?</p>
            <ResponsiveContainer width="100%" height={260}>
              <ScatterChart margin={{ top:5, right:20, left:-10, bottom:5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(99,179,237,0.06)" />
                <XAxis dataKey="x" name="Hedef" tick={{ fill:'#64748b', fontSize:10 }} axisLine={false} tickLine={false} label={{ value:'Hedef', position:'insideBottom', offset:-2, fill:'#475569', fontSize:10 }} />
                <YAxis dataKey="y" name="B2C"   tick={{ fill:'#64748b', fontSize:10 }} axisLine={false} tickLine={false} label={{ value:'B2C', angle:-90, position:'insideLeft', fill:'#475569', fontSize:10 }} />
                <Tooltip cursor={{ strokeDasharray:'3 3' }} content={({ active, payload }) => {
                  if (!active || !payload?.length) return null;
                  const d = payload[0].payload;
                  return (
                    <div style={{ background:'#0d1526', border:'1px solid rgba(99,179,237,0.2)', borderRadius:10, padding:'10px 14px', fontSize:'0.78rem' }}>
                      <p style={{ color:'#e2e8f0', fontWeight:700, marginBottom:4 }}>{d.name}</p>
                      <p style={{ color:'#8b5cf6' }}>Hedef: {d.x}</p>
                      <p style={{ color:'#06b6d4' }}>B2C: {d.y}</p>
                      <p style={{ color: achColor(d.z) }}>Gerç: %{d.z}</p>
                    </div>
                  );
                }} />
                <Scatter data={scatterData} fill="#3b82f6">
                  {scatterData.map((d, i) => (
                    <Cell key={i} fill={achColor(d.z)} fillOpacity={0.85} />
                  ))}
                </Scatter>
              </ScatterChart>
            </ResponsiveContainer>
          </motion.div>

          {/* Radar: aylık ortalama */}
          <motion.div className="card" initial={{ opacity:0, x:20 }} whileInView={{ opacity:1, x:0 }} viewport={{ once:true }}>
            <h3 style={{ fontSize:'0.85rem', fontWeight:700, marginBottom:6, color:'#94a3b8' }}>Aylık Ortalama Gerçekleştirme (2025)</h3>
            <p style={{ fontSize:'0.72rem', color:'#475569', marginBottom:16 }}>Hangi aylar güçlü, hangileri zayıf?</p>
            <ResponsiveContainer width="100%" height={260}>
              <RadarChart data={radarData}>
                <PolarGrid stroke="rgba(99,179,237,0.08)" />
                <PolarAngleAxis dataKey="month" tick={{ fill:'#64748b', fontSize:10 }} />
                <PolarRadiusAxis angle={90} domain={[0,180]} tick={{ fill:'#475569', fontSize:8 }} />
                <Radar name="Ort. Gerç. %" dataKey="avg" stroke="#3b82f6" fill="#3b82f6" fillOpacity={0.2} strokeWidth={2} />
                <Tooltip content={<Tip />} />
              </RadarChart>
            </ResponsiveContainer>
          </motion.div>
        </div>

        <div className="grid-2" style={{ gap:20, marginBottom:20 }}>

          {/* Bar: bayi sıralaması */}
          <motion.div className="card" initial={{ opacity:0, y:20 }} whileInView={{ opacity:1, y:0 }} viewport={{ once:true }}>
            <h3 style={{ fontSize:'0.85rem', fontWeight:700, marginBottom:6, color:'#94a3b8' }}>Bayi Performans Sıralaması (2025)</h3>
            <p style={{ fontSize:'0.72rem', color:'#475569', marginBottom:16 }}>%100 referans çizgisi ile karşılaştırma</p>
            <ResponsiveContainer width="100%" height={320}>
              <BarChart data={rankData} layout="vertical" margin={{ top:0, right:40, left:55, bottom:0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(99,179,237,0.06)" horizontal={false} />
                <XAxis type="number" domain={[0,180]} tick={{ fill:'#64748b', fontSize:10 }} axisLine={false} tickLine={false} />
                <YAxis type="category" dataKey="name" tick={{ fill:'#94a3b8', fontSize:10 }} axisLine={false} tickLine={false} width={50} />
                <Tooltip content={<Tip />} />
                <ReferenceLine x={100} stroke="#10b981" strokeDasharray="4 4" strokeWidth={1.5} />
                <Bar dataKey="ach" name="Gerç. %" radius={[0,4,4,0]}>
                  {rankData.map((d,i) => <Cell key={i} fill={achColor(d.ach)} />)}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </motion.div>

          {/* Bar: 2024 vs 2025 aylık karşılaştırma */}
          <motion.div className="card" initial={{ opacity:0, y:20 }} whileInView={{ opacity:1, y:0 }} viewport={{ once:true }}>
            <h3 style={{ fontSize:'0.85rem', fontWeight:700, marginBottom:6, color:'#94a3b8' }}>2024 vs 2025 Aylık Ortalama</h3>
            <p style={{ fontSize:'0.72rem', color:'#475569', marginBottom:16 }}>Yıllık performans değişimi ay ay</p>
            <ResponsiveContainer width="100%" height={320}>
              <BarChart data={trendCompare} margin={{ top:5, right:10, left:-10, bottom:0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(99,179,237,0.06)" />
                <XAxis dataKey="month" tick={{ fill:'#64748b', fontSize:10 }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fill:'#64748b', fontSize:10 }} axisLine={false} tickLine={false} domain={[0,200]} />
                <Tooltip content={<Tip />} />
                <ReferenceLine y={100} stroke="#475569" strokeDasharray="4 4" />
                <Bar dataKey="2024" name="2024" fill="#334155" radius={[3,3,0,0]} />
                <Bar dataKey="2025" name="2025" fill="#3b82f6" radius={[3,3,0,0]} />
              </BarChart>
            </ResponsiveContainer>
            <div style={{ display:'flex', gap:16, justifyContent:'center', marginTop:10 }}>
              <div style={{ display:'flex', alignItems:'center', gap:6 }}>
                <div style={{ width:12, height:12, borderRadius:2, background:'#334155' }} />
                <span style={{ fontSize:'0.72rem', color:'#64748b' }}>2024</span>
              </div>
              <div style={{ display:'flex', alignItems:'center', gap:6 }}>
                <div style={{ width:12, height:12, borderRadius:2, background:'#3b82f6' }} />
                <span style={{ fontSize:'0.72rem', color:'#64748b' }}>2025</span>
              </div>
            </div>
          </motion.div>
        </div>

      </div>
    </div>
  );
}
