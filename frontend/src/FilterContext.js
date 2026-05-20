import React, { createContext, useContext, useState } from 'react';

const MONTH_KEYS  = ['January','February','March','April','May','June',
  'July','August','September','October','Nowember','December'];
const MONTH_LABELS = ['Oca','Şub','Mar','Nis','May','Haz','Tem','Ağu','Eyl','Eki','Kas','Ara'];

export const FilterContext = createContext(null);

export function FilterProvider({ children }) {
  const [year,    setYear]    = useState('2025');
  const [month,   setMonth]   = useState('all');   // 'all' | 'January' | ...
  const [channel, setChannel] = useState('all');   // 'all' | 'B2C' | 'B2B'
  const [dealer,  setDealer]  = useState('all');   // 'all' | dealer code

  return (
    <FilterContext.Provider value={{
      year, setYear,
      month, setMonth,
      channel, setChannel,
      dealer, setDealer,
      MONTH_KEYS, MONTH_LABELS,
    }}>
      {children}
    </FilterContext.Provider>
  );
}

export const useFilter = () => useContext(FilterContext);
