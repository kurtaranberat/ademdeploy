import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { motion } from 'framer-motion';
import { FilterProvider } from './FilterContext';
import HeroSection from './components/HeroSection';
import OverviewSection from './components/OverviewSection';
import DealerSection from './components/DealerSection';
import ModelSection from './components/ModelSection';
import VehicleSection from './components/VehicleSection';
import Scene3D from './components/Scene3D';
import InsightsSection from './components/InsightsSection';
import MapSection from './components/MapSection';
import NavBar from './components/NavBar';
import GlobalFilter from './components/GlobalFilter';
import './App.css';

const API = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

export default function App() {
  const [data, setData] = useState({
    overview: null, dealersFull: null, dealersMonthly: null,
    modelsMonthly: null, vehicles: null, dealerLocations: null, allSales: null,
  });
  const [loading, setLoading] = useState(true);
  const [activeSection, setActiveSection] = useState('hero');

  useEffect(() => {
    const fetchAll = async () => {
      try {
        const [ov, df, dm, mm, veh, dloc, as_] = await Promise.all([
          axios.get(`${API}/overview`),
          axios.get(`${API}/dealers/full-year`),
          axios.get(`${API}/dealers/monthly`),
          axios.get(`${API}/models/monthly`),
          axios.get(`${API}/vehicles`),
          axios.get(`${API}/dealer-locations`),
          axios.get(`${API}/all-sales`),
        ]);
        setData({
          overview: ov.data, dealersFull: df.data, dealersMonthly: dm.data,
          modelsMonthly: mm.data, vehicles: veh.data,
          dealerLocations: dloc.data, allSales: as_.data,
        });
      } catch (err) {
        console.error('API error:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchAll();
  }, []);

  if (loading) return <LoadingScreen />;

  // Tüm bayiler (filtre dropdown için)
  const allDealers2025 = data.dealersFull?.['2025'] || [];
  const allDealers2024 = data.dealersFull?.['2024'] || [];

  return (
    <FilterProvider>
      <div className="app">
        <NavBar activeSection={activeSection} setActiveSection={setActiveSection} />
        <GlobalFilter dealers2025={allDealers2025} dealers2024={allDealers2024} />
        <main>
          <section id="hero"><HeroSection data={data} /></section>
          <section id="overview"><OverviewSection data={data.overview} allSales={data.allSales} /></section>
          <section id="dealers"><DealerSection dealersFull={data.dealersFull} dealersMonthly={data.dealersMonthly} /></section>
          <section id="models"><ModelSection modelsMonthly={data.modelsMonthly} dealersFull={data.dealersFull} /></section>
          <section id="vehicles"><VehicleSection vehicles={data.vehicles} allSales={data.allSales} /></section>
          <section id="scene3d"><Scene3D data={data} /></section>
          <section id="map"><MapSection dealerLocations={data.dealerLocations} allSales={data.allSales} dealersMonthly25={data.dealersMonthly?.['2025'] || []} /></section>
          <section id="insights"><InsightsSection data={data} /></section>
        </main>
      </div>
    </FilterProvider>
  );
}

function LoadingScreen() {
  return (
    <div className="loading-screen">
      <motion.div className="loading-orb"
        animate={{ scale: [1, 1.3, 1], opacity: [0.5, 1, 0.5] }}
        transition={{ duration: 2, repeat: Infinity }}
      />
      <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.5 }}>
        Veriler yükleniyor...
      </motion.p>
    </div>
  );
}
