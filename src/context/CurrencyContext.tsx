import React, { createContext, useContext, useState } from 'react';
import { Currency, CURRENCIES } from '../types/currencyTypes';

interface CurrencyContextType {
  currency: Currency;
  setCurrency: (currency: Currency) => void;
}

const CurrencyContext = createContext<CurrencyContextType | undefined>(undefined);

export const CurrencyProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [currency, setCurrency] = useState<Currency>(() => {
    // Try to load from localStorage first (from planner state)
    try {
      const saved = localStorage.getItem('planner-state');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed.userProfile?.currency) {
          const savedCurrency = CURRENCIES.find(c => c.code === parsed.userProfile.currency);
          if (savedCurrency) {
            return savedCurrency;
          }
        }
      }
    } catch (_) {
      // Ignore parsing errors
    }
    
    // Default to AED for GCC users
    return CURRENCIES.find(c => c.code === 'AED') || CURRENCIES[0];
  });

  return (
    <CurrencyContext.Provider value={{ currency, setCurrency }}>
      {children}
    </CurrencyContext.Provider>
  );
};

export const useCurrency = () => {
  const context = useContext(CurrencyContext);
  if (context === undefined) {
    throw new Error('useCurrency must be used within a CurrencyProvider');
  }
  return context;
};