import React, { useState, useMemo } from 'react';
import { motion } from 'framer-motion';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, LineChart, Line, Legend, Cell,
  PieChart, Pie, Sector,
} from 'recharts';
import { useFilter } from '../FilterContext';

const MONTHS      = ['January','February','March','April','May','June',
  'July','August','September','October','Nowember','December'];
const MONTH_SHORT = ['Oca','Şub','Mar','Nis','May','Haz','Tem','Ağu','Eyl','Eki','Kas','Ara'];

const MODEL_COLORS = {
  A1: '#3b82f6', A2: '#06b6d4', A3: '#8b5cf6',
  B1: '#10b981', B2: '#f59e0b', C: '#ef4444', D: '#ec4899', Other: '#64748b',
};

const CustomTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  return (
    <div style={{ background: '#0d1526', border: '1px solid rgba(99,179,237,0.2)', borderRadius: 10, padding: '10px 14px', fontSize: '0.8rem' }}>
      <p style={{ color: '#94a3b8', marginBottom: 6 }}>{label}</p>
      {payload.map(p => (
        <p key={p.name} style={{ color: p.color || '#e2e8f0', fontWeight: 700 }}>
          {p.name}: {p.value?.toLocaleString('tr-TR')}
        </p>
      ))}
    </div>
  );
};

const renderActiveShape = (props) => {
  const { cx, cy, innerRadius, outerRadius, startAngle, endAngle, fill, payload, percent, value } = props;
  return (
    <g>
      <text x={cx} y={cy - 10} textAnchor="middle" fill="#e2e8f0" fontSize={16} fontWeight={800}>{payload.name}</text>
      <text x={cx} y={cy + 14} textAnchor="middle" fill="#64748b" fontSize={12}>{value} adet</text>
      <text x={cx} y={cy + 32} textAnchor="middle" fill="#3b82f6" fontSize={12} fontWeight={700}>%{(percent * 100).toFixed(1)}</text>
      <Sector cx={cx} cy={cy} innerRadius={innerRadius} outerRadius={outerRadius + 8} startAngle={startAngle} endAngle={endAngle} fill={fill} />
      <Sector cx={cx} cy={cy} innerRadius={outerRadius + 12} outerRadius={outerRadius + 16} startAngle={startAngle} endAngle={endAngle} fill={fill} />
    </g>
  );
};

export default function ModelSection({ modelsMonthly, dealersFull }) {
  const { month, MONTH_KEYS, MONTH_LABELS } = useFilter();
  const [activeIndex, setActiveIndex] = useState(0);

  // Global ay filtresi: seçili ay varsa onu default yap
  const [selectedMonth, setSelectedMonth] = useState('March');
  const effectiveMonth = month !== 'all' ? month : selectedMonth;

  if (!modelsMonthly) return null;

  // Build trend data: for each month, model totals
  const trendData = MONTHS.map((m, i) => {
    const md = modelsMonthly[m];
    if (!md) return null;
    return {
      month: MONTH_SHORT[i],
      ...md.modelTotals,
      total: md.b2cActual || 0,
      achievement: md.b2cAchievement || 0,
    };
  }).filter(Boolean);

  // Pie data for selected month
  const monthData = modelsMonthly[effectiveMonth];
  const pieData = monthData
    ? Object.entries(monthData.modelTotals)
        .filter(([, v]) => v > 0)
        .map(([k, v]) => ({ name: `Model ${k}`, value: v, color: MODEL_COLORS[k] || '#64748b' }))
    : [];

  // Full year 2025 model totals
  const dealers2025 = dealersFull?.['2025'] || [];
  const fullYearModels = {};
  dealers2025.forEach(d => {
    if (d.models) {
      Object.entries(d.models).forEach(([m, v]) => {
        fullYearModels[m] = (fullYearModels[m] || 0) + v;
      });
    }
  });
  const fullYearPie = Object.entries(fullYearModels)
    .filter(([, v]) => v > 0)
    .map(([k, v]) => ({ name: `Model ${k}`, value: v, color: MODEL_COLORS[k] || '#64748b' }));

  return (
    <div>
      <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}>
        <h2 className="section-title">Model Analizi</h2>
        <p className="section-subtitle">2025 yılı model bazlı B2C satış dağılımı ve aylık trend</p>
      </motion.div>

      {/* KPI row */}
      <motion.div
        className="grid-4"
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        style={{ marginBottom: 24 }}
      >
        {Object.entries(fullYearModels).map(([model, count], i) => (
          <motion.div
            key={model}
            className="kpi-card"
            initial={{ opacity: 0, scale: 0.9 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            transition={{ delay: i * 0.06 }}
            style={{ borderColor: `${MODEL_COLORS[model]}30` }}
          >
            <div className="kpi-label">Model {model}</div>
            <div className="kpi-value" style={{ color: MODEL_COLORS[model] || '#e2e8f0' }}>{count.toLocaleString('tr-TR')}</div>
            <div className="kpi-sub">B2C satış (2025)</div>
            <div className="kpi-glow" style={{ background: MODEL_COLORS[model] }} />
          </motion.div>
        ))}
      </motion.div>

      <div className="grid-2" style={{ gap: 20, marginBottom: 20 }}>
        {/* Trend line chart */}
        <motion.div
          className="card"
          initial={{ opacity: 0, x: -20 }}
          whileInView={{ opacity: 1, x: 0 }}
          viewport={{ once: true }}
        >
          <h3 style={{ fontSize: '0.85rem', fontWeight: 700, marginBottom: 20, color: '#94a3b8' }}>
            Aylık Model Satış Trendi (2025 B2C)
          </h3>
          <ResponsiveContainer width="100%" height={280}>
            <LineChart data={trendData} margin={{ top: 5, right: 10, left: -10, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(99,179,237,0.06)" />
              <XAxis dataKey="month" tick={{ fill: '#64748b', fontSize: 11 }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fill: '#64748b', fontSize: 11 }} axisLine={false} tickLine={false} />
              <Tooltip content={<CustomTooltip />} />
              <Legend wrapperStyle={{ fontSize: '0.72rem', color: '#64748b' }} />
              {['A1', 'A2', 'A3', 'B1', 'Other'].map(m => (
                <Line
                  key={m}
                  type="monotone"
                  dataKey={m}
                  name={`Model ${m}`}
                  stroke={MODEL_COLORS[m]}
                  strokeWidth={2}
                  dot={{ r: 3, fill: MODEL_COLORS[m] }}
                  activeDot={{ r: 5 }}
                />
              ))}
            </LineChart>
          </ResponsiveContainer>
        </motion.div>

        {/* Pie chart */}
        <motion.div
          className="card"
          initial={{ opacity: 0, x: 20 }}
          whileInView={{ opacity: 1, x: 0 }}
          viewport={{ once: true }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
            <h3 style={{ fontSize: '0.85rem', fontWeight: 700, color: '#94a3b8' }}>
              Model Dağılımı — {MONTH_SHORT[MONTHS.indexOf(effectiveMonth)] || effectiveMonth}
            </h3>
            {month === 'all' && (
            <select
              value={selectedMonth}
              onChange={e => setSelectedMonth(e.target.value)}
              style={{
                background: 'var(--surface2)', border: '1px solid var(--border)',
                color: '#94a3b8', borderRadius: 8, padding: '4px 10px',
                fontSize: '0.75rem', cursor: 'pointer', fontFamily: 'Inter, sans-serif',
              }}
            >
              {MONTHS.map((m, i) => (
                <option key={m} value={m}>{MONTH_SHORT[i]}</option>
              ))}
            </select>
            )}
          </div>
          <ResponsiveContainer width="100%" height={260}>
            <PieChart>
              <Pie
                activeIndex={activeIndex}
                activeShape={renderActiveShape}
                data={pieData}
                cx="50%"
                cy="50%"
                innerRadius={70}
                outerRadius={100}
                dataKey="value"
                onMouseEnter={(_, index) => setActiveIndex(index)}
              >
                {pieData.map((entry, i) => (
                  <Cell key={i} fill={entry.color} />
                ))}
              </Pie>
            </PieChart>
          </ResponsiveContainer>
          {monthData && (
            <div style={{ display: 'flex', justifyContent: 'center', gap: 8, flexWrap: 'wrap', marginTop: 8 }}>
              <span style={{ fontSize: '0.75rem', color: '#64748b' }}>
                Hedef: <strong style={{ color: '#e2e8f0' }}>{monthData.b2cTarget}</strong>
              </span>
              <span style={{ fontSize: '0.75rem', color: '#64748b' }}>
                Gerç.: <strong style={{ color: '#10b981' }}>{monthData.b2cActual}</strong>
              </span>
              <span style={{ fontSize: '0.75rem', color: '#64748b' }}>
                Oran: <strong style={{ color: '#3b82f6' }}>%{monthData.b2cAchievement}</strong>
              </span>
            </div>
          )}
        </motion.div>
      </div>

      {/* Stacked bar */}
      <motion.div
        className="card"
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
      >
        <h3 style={{ fontSize: '0.85rem', fontWeight: 700, marginBottom: 20, color: '#94a3b8' }}>
          Aylık Model Bazlı Yığılmış Satış (2025 B2C)
        </h3>
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={trendData} margin={{ top: 5, right: 10, left: -10, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(99,179,237,0.06)" />
            <XAxis dataKey="month" tick={{ fill: '#64748b', fontSize: 11 }} axisLine={false} tickLine={false} />
            <YAxis tick={{ fill: '#64748b', fontSize: 11 }} axisLine={false} tickLine={false} />
            <Tooltip content={<CustomTooltip />} />
            <Legend wrapperStyle={{ fontSize: '0.72rem', color: '#64748b' }} />
            {['A1', 'A2', 'A3', 'B1', 'Other'].map(m => (
              <Bar key={m} dataKey={m} name={`Model ${m}`} stackId="a" fill={MODEL_COLORS[m]} />
            ))}
          </BarChart>
        </ResponsiveContainer>
      </motion.div>
    </div>
  );
}
