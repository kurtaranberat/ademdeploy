import React, { useRef, useMemo, useState, Suspense } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { OrbitControls, Text, Html } from '@react-three/drei';
import { motion, AnimatePresence } from 'framer-motion';
import * as THREE from 'three';

// ── Renk yardımcıları ────────────────────────────────────────────────────────
function achToColor(v) {
  if (v === null || v === undefined) return new THREE.Color('#1e293b');
  if (v >= 120) return new THREE.Color('#059669');
  if (v >= 100) return new THREE.Color('#10b981');
  if (v >= 80)  return new THREE.Color('#f59e0b');
  if (v >= 60)  return new THREE.Color('#ef4444');
  return new THREE.Color('#7f1d1d');
}
function achHex(v) {
  if (v === null || v === undefined) return '#1e293b';
  if (v >= 120) return '#059669';
  if (v >= 100) return '#10b981';
  if (v >= 80)  return '#f59e0b';
  if (v >= 60)  return '#ef4444';
  return '#7f1d1d';
}

// ── Animasyonlu 3D bar ───────────────────────────────────────────────────────
function Bar3D({ x, z, targetHeight, color, label, value, unit, onClick, isSelected }) {
  const meshRef  = useRef();
  const glowRef  = useRef();
  const [hovered, setHovered] = useState(false);
  const [height,  setHeight]  = useState(0.01);

  useFrame((_, delta) => {
    const speed = 3;
    if (height < targetHeight) setHeight(h => Math.min(h + delta * speed, targetHeight));
    if (meshRef.current) {
      meshRef.current.position.y = height / 2;
      meshRef.current.scale.y    = height / Math.max(targetHeight, 0.01);
    }
    if (glowRef.current) {
      glowRef.current.material.opacity = hovered ? 0.35 : 0.12;
    }
  });

  const mat = useMemo(() => {
    const c = color.clone();
    if (hovered || isSelected) c.multiplyScalar(1.5);
    return c;
  }, [color, hovered, isSelected]);

  return (
    <group
      position={[x, 0, z]}
      onClick={e => { e.stopPropagation(); onClick(); }}
      onPointerOver={() => setHovered(true)}
      onPointerOut={() => setHovered(false)}
    >
      {/* Ana bar */}
      <mesh ref={meshRef} castShadow>
        <boxGeometry args={[0.75, targetHeight, 0.75]} />
        <meshStandardMaterial
          color={mat}
          metalness={0.4}
          roughness={0.3}
          emissive={mat}
          emissiveIntensity={hovered || isSelected ? 0.5 : 0.15}
        />
      </mesh>

      {/* Taban parıltısı */}
      <mesh ref={glowRef} position={[0, 0.01, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <planeGeometry args={[1.1, 1.1]} />
        <meshBasicMaterial color={color} transparent opacity={0.12} />
      </mesh>

      {/* Seçili halkası */}
      {isSelected && (
        <mesh position={[0, 0.02, 0]} rotation={[-Math.PI / 2, 0, 0]}>
          <ringGeometry args={[0.55, 0.7, 32]} />
          <meshBasicMaterial color={color} transparent opacity={0.8} />
        </mesh>
      )}

      {/* Zemin etiketi */}
      <Text
        position={[0, -0.25, 0]}
        fontSize={0.16}
        color="#475569"
        anchorX="center"
        anchorY="top"
        rotation={[-Math.PI / 2, 0, 0]}
        maxWidth={1.2}
      >
        {label}
      </Text>

      {/* Hover / seçili tooltip */}
      {(hovered || isSelected) && (
        <Html position={[0, targetHeight + 0.5, 0]} center distanceFactor={10}>
          <div style={{
            background: 'rgba(5,10,20,0.97)',
            border: `1px solid ${color.getStyle()}60`,
            borderRadius: 10,
            padding: '8px 14px',
            fontSize: '0.78rem',
            fontWeight: 700,
            color: '#e2e8f0',
            whiteSpace: 'nowrap',
            pointerEvents: 'none',
            boxShadow: `0 0 20px ${color.getStyle()}40`,
            fontFamily: 'Inter, sans-serif',
          }}>
            <div style={{ color: '#94a3b8', fontSize: '0.65rem', marginBottom: 3 }}>{label}</div>
            <div style={{ color: color.getStyle(), fontSize: '1rem' }}>
              {unit === '%' ? `%${value}` : value?.toLocaleString('tr-TR')}
            </div>
          </div>
        </Html>
      )}
    </group>
  );
}

// ── Zemin ────────────────────────────────────────────────────────────────────
function Floor() {
  return (
    <group>
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.02, 0]} receiveShadow>
        <planeGeometry args={[50, 50]} />
        <meshStandardMaterial color="#030810" metalness={0.05} roughness={0.95} />
      </mesh>
      <gridHelper args={[50, 50, '#0d1a2e', '#0d1a2e']} />
    </group>
  );
}

// ── Parçacıklar ──────────────────────────────────────────────────────────────
function Particles({ count = 300 }) {
  const positions = useMemo(() => {
    const arr = new Float32Array(count * 3);
    for (let i = 0; i < count; i++) {
      arr[i * 3]     = (Math.random() - 0.5) * 40;
      arr[i * 3 + 1] = Math.random() * 15;
      arr[i * 3 + 2] = (Math.random() - 0.5) * 40;
    }
    return arr;
  }, [count]);

  const ref = useRef();
  useFrame(s => { if (ref.current) ref.current.rotation.y = s.clock.elapsedTime * 0.015; });

  return (
    <points ref={ref}>
      <bufferGeometry>
        <bufferAttribute attach="attributes-position" count={count} array={positions} itemSize={3} />
      </bufferGeometry>
      <pointsMaterial size={0.04} color="#3b82f6" transparent opacity={0.35} sizeAttenuation />
    </points>
  );
}

// ── Sahne içeriği ────────────────────────────────────────────────────────────
function SceneContent({ dealers, mode, onSelect }) {
  const [selected, setSelected] = useState(null);

  const maxB2C    = useMemo(() => Math.max(...dealers.map(d => d.b2c    || 0), 1), [dealers]);
  const maxTarget = useMemo(() => Math.max(...dealers.map(d => d.target || 0), 1), [dealers]);

  const bars = useMemo(() => {
    if (!dealers?.length) return [];
    const cols = Math.ceil(Math.sqrt(dealers.length));
    return dealers.map((d, i) => {
      const col = i % cols;
      const row = Math.floor(i / cols);
      const x   = (col - cols / 2 + 0.5) * 1.5;
      const z   = (row - Math.ceil(dealers.length / cols) / 2 + 0.5) * 1.5;

      let value, height, unit;
      if (mode === 'achievement') {
        value  = d.achievement || 0;
        height = Math.max(0.08, (value / 150) * 4);
        unit   = '%';
      } else if (mode === 'b2c') {
        value  = d.b2c || 0;
        height = Math.max(0.08, (value / maxB2C) * 4);
        unit   = 'adet';
      } else {
        value  = d.target || 0;
        height = Math.max(0.08, (value / maxTarget) * 4);
        unit   = 'adet';
      }

      return {
        ...d, x, z, height, value, unit,
        color: mode === 'achievement'
          ? achToColor(value)
          : new THREE.Color(mode === 'b2c' ? '#06b6d4' : '#8b5cf6'),
        label: d.name.replace('DEALER ', 'D'),
      };
    });
  }, [dealers, mode, maxB2C, maxTarget]);

  const handleClick = (bar) => {
    const next = selected === bar.code ? null : bar.code;
    setSelected(next);
    onSelect(next ? bar : null);
  };

  return (
    <>
      <Floor />
      <Particles />
      {bars.map(bar => (
        <Bar3D
          key={bar.code}
          x={bar.x} z={bar.z}
          targetHeight={bar.height}
          color={bar.color}
          label={bar.label}
          value={bar.value}
          unit={bar.unit}
          isSelected={selected === bar.code}
          onClick={() => handleClick(bar)}
        />
      ))}
      <Text position={[0, 0.05, -7]} fontSize={0.28} color="#1e3a5f" anchorX="center">
        BRAND-A · Bayi Performans Haritası
      </Text>
    </>
  );
}

// ── Seçili bayi detay paneli ─────────────────────────────────────────────────
function DealerDetailPanel({ dealer, year, onClose }) {
  if (!dealer) return null;
  const ach = dealer.achievement || 0;
  const color = achHex(ach);

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, x: 30 }}
        animate={{ opacity: 1, x: 0 }}
        exit={{ opacity: 0, x: 30 }}
        style={{
          position: 'absolute', top: 16, right: 16, width: 240,
          background: 'rgba(5,10,20,0.97)',
          border: `1px solid ${color}40`,
          borderRadius: 16, padding: '18px 20px',
          boxShadow: `0 0 40px ${color}20`,
          zIndex: 10, fontFamily: 'Inter, sans-serif',
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 14 }}>
          <div>
            <div style={{ fontSize: '0.65rem', color: '#475569', marginBottom: 2 }}>{dealer.code}</div>
            <div style={{ fontSize: '0.9rem', fontWeight: 800, color: '#e2e8f0' }}>{dealer.name}</div>
          </div>
          <button onClick={onClose} style={{ background: 'none', border: 'none', color: '#475569', cursor: 'pointer', fontSize: '1rem', padding: 0 }}>✕</button>
        </div>

        {/* Ana metrik */}
        <div style={{ textAlign: 'center', padding: '12px 0', marginBottom: 14, borderTop: '1px solid rgba(99,179,237,0.08)', borderBottom: '1px solid rgba(99,179,237,0.08)' }}>
          <div style={{ fontSize: '2.4rem', fontWeight: 900, color, lineHeight: 1 }}>%{ach}</div>
          <div style={{ fontSize: '0.65rem', color: '#475569', marginTop: 4 }}>Hedef Gerçekleştirme</div>
        </div>

        {/* Metrikler */}
        {[
          { label: 'Hedef',    value: dealer.target?.toLocaleString('tr-TR'), color: '#8b5cf6' },
          { label: 'B2C',      value: dealer.b2c?.toLocaleString('tr-TR'),    color: '#06b6d4' },
          { label: 'B2B',      value: dealer.b2b?.toLocaleString('tr-TR'),    color: '#3b82f6' },
        ].map(m => (
          <div key={m.label} style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
            <span style={{ fontSize: '0.72rem', color: '#475569' }}>{m.label}</span>
            <span style={{ fontSize: '0.78rem', fontWeight: 700, color: m.color }}>{m.value || '—'}</span>
          </div>
        ))}

        {/* Model dağılımı (2025) */}
        {year === '2025' && dealer.models && (
          <div style={{ marginTop: 12, borderTop: '1px solid rgba(99,179,237,0.08)', paddingTop: 12 }}>
            <div style={{ fontSize: '0.65rem', color: '#475569', marginBottom: 8, fontWeight: 600 }}>MODEL DAĞILIMI</div>
            {Object.entries(dealer.models).filter(([, v]) => v > 0).map(([m, v]) => {
              const pct = dealer.b2c > 0 ? Math.round((v / dealer.b2c) * 100) : 0;
              return (
                <div key={m} style={{ marginBottom: 6 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 2 }}>
                    <span style={{ fontSize: '0.68rem', color: '#94a3b8' }}>Model {m}</span>
                    <span style={{ fontSize: '0.68rem', fontWeight: 700, color: '#e2e8f0' }}>{v} <span style={{ color: '#475569' }}>(%{pct})</span></span>
                  </div>
                  <div style={{ height: 4, background: '#0d1526', borderRadius: 2 }}>
                    <div style={{ height: '100%', width: `${pct}%`, background: 'linear-gradient(90deg,#3b82f6,#06b6d4)', borderRadius: 2, transition: 'width 0.6s' }} />
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </motion.div>
    </AnimatePresence>
  );
}

// ── Ana export ───────────────────────────────────────────────────────────────
export default function Scene3D({ data }) {
  const [year,     setYear]     = useState('2025');
  const [mode,     setMode]     = useState('achievement');
  const [selected, setSelected] = useState(null);

  const dealers = data.dealersFull?.[year] || [];

  // Özet istatistikler
  const stats = useMemo(() => {
    if (!dealers.length) return {};
    const achs = dealers.map(d => d.achievement || 0).filter(v => v > 0);
    const avg  = Math.round(achs.reduce((s, v) => s + v, 0) / achs.length);
    const best = [...dealers].sort((a, b) => (b.achievement || 0) - (a.achievement || 0))[0];
    const worst= [...dealers].sort((a, b) => (a.achievement || 0) - (b.achievement || 0))[0];
    const over100 = dealers.filter(d => (d.achievement || 0) >= 100).length;
    return { avg, best, worst, over100, total: dealers.length };
  }, [dealers]);

  return (
    <div style={{ padding: '0 24px' }}>
      <div style={{ maxWidth: 1400, margin: '0 auto' }}>

        <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}>
          <h2 className="section-title">3D Performans Haritası</h2>
          <p className="section-subtitle">Bayileri üç boyutlu olarak karşılaştır · döndür · yakınlaştır · tıkla</p>
        </motion.div>

        {/* Özet KPI şeridi */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          style={{ display: 'flex', gap: 12, marginBottom: 20, flexWrap: 'wrap' }}
        >
          {[
            { label: 'Ort. Gerç.', value: `%${stats.avg}`,        color: achHex(stats.avg) },
            { label: 'En İyi',     value: stats.best?.name?.replace('DEALER ','D'), color: '#10b981' },
            { label: 'Hedef Üstü',value: `${stats.over100}/${stats.total}`, color: '#3b82f6' },
            { label: 'En Düşük',  value: stats.worst?.name?.replace('DEALER ','D'), color: '#ef4444' },
          ].map(s => (
            <div key={s.label} style={{
              background: 'rgba(13,21,38,0.8)', border: `1px solid ${s.color}25`,
              borderRadius: 12, padding: '10px 18px', flex: '1 1 140px',
            }}>
              <div style={{ fontSize: '0.65rem', color: '#475569', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.08em' }}>{s.label}</div>
              <div style={{ fontSize: '1.1rem', fontWeight: 800, color: s.color, marginTop: 2 }}>{s.value}</div>
            </div>
          ))}
        </motion.div>

        {/* Kontroller */}
        <div style={{ display: 'flex', gap: 12, marginBottom: 16, flexWrap: 'wrap' }}>
          <div className="tab-group" style={{ marginBottom: 0 }}>
            {['2024', '2025'].map(y => (
              <button key={y} className={`tab-btn ${year === y ? 'active' : ''}`} onClick={() => { setYear(y); setSelected(null); }}>{y}</button>
            ))}
          </div>
          <div className="tab-group" style={{ marginBottom: 0 }}>
            {[
              { id: 'achievement', label: '🎯 Hedef Gerç. %' },
              { id: 'b2c',         label: '🚗 B2C Satış' },
              { id: 'target',      label: '📊 Hedef' },
            ].map(m => (
              <button key={m.id} className={`tab-btn ${mode === m.id ? 'active' : ''}`} onClick={() => setMode(m.id)}>{m.label}</button>
            ))}
          </div>
        </div>

        {/* 3D Canvas */}
        <motion.div
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          style={{
            height: 560, borderRadius: 20, overflow: 'hidden', position: 'relative',
            border: '1px solid rgba(99,179,237,0.1)',
            background: 'linear-gradient(180deg, #030810 0%, #060f1e 100%)',
          }}
        >
          <Canvas shadows camera={{ position: [10, 10, 14], fov: 48 }} gl={{ antialias: true }}>
            <color attach="background" args={['#030810']} />
            <fog attach="fog" args={['#030810', 25, 55]} />
            <ambientLight intensity={0.25} />
            <directionalLight position={[12, 18, 10]} intensity={1.2} castShadow shadow-mapSize={[2048, 2048]} />
            <pointLight position={[-8, 6, -8]} intensity={0.6} color="#3b82f6" />
            <pointLight position={[8, 6, 8]}  intensity={0.4} color="#8b5cf6" />
            <pointLight position={[0, 10, 0]} intensity={0.3} color="#06b6d4" />
            <Suspense fallback={null}>
              <SceneContent dealers={dealers} mode={mode} onSelect={setSelected} />
            </Suspense>
            <OrbitControls
              enablePan enableZoom enableRotate
              minDistance={4} maxDistance={35}
              maxPolarAngle={Math.PI / 2.05}
              dampingFactor={0.08} enableDamping
            />
          </Canvas>

          {/* Seçili bayi paneli */}
          <DealerDetailPanel dealer={selected} year={year} onClose={() => setSelected(null)} />

          {/* Köşe ipuçları */}
          <div style={{ position: 'absolute', bottom: 14, left: 16, display: 'flex', gap: 14, flexWrap: 'wrap' }}>
            {['🖱️ Döndür', '⚲ Yakınlaştır', '⇥ Kaydır', '👆 Tıkla: Detay'].map(t => (
              <span key={t} style={{ fontSize: '0.68rem', color: '#334155', background: 'rgba(5,10,20,0.7)', padding: '3px 8px', borderRadius: 6 }}>{t}</span>
            ))}
          </div>
        </motion.div>

        {/* Renk skalası */}
        {mode === 'achievement' && (
          <div style={{ display: 'flex', gap: 10, marginTop: 14, flexWrap: 'wrap', justifyContent: 'center' }}>
            {[
              { color: '#059669', label: '≥120%' },
              { color: '#10b981', label: '100–119%' },
              { color: '#f59e0b', label: '80–99%' },
              { color: '#ef4444', label: '60–79%' },
              { color: '#7f1d1d', label: '<60%' },
            ].map(l => (
              <div key={l.label} style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                <div style={{ width: 10, height: 10, borderRadius: 2, background: l.color }} />
                <span style={{ fontSize: '0.7rem', color: '#64748b' }}>{l.label}</span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
