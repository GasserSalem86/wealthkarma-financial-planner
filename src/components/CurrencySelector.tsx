import React, { useEffect } from 'react';

import { useCurrency } from '../context/CurrencyContext';
import { usePlanner } from '../context/PlannerContext';
import { CURRENCIES } from '../types/currencyTypes';

const CurrencySelector: React.FC = () => {
  const { currency, setCurrency } = useCurrency();
  const { state, dispatch } = usePlanner();

  // Sync CurrencyContext with user profile currency on mount
  useEffect(() => {
    if (state.userProfile.currency && state.userProfile.currency !== currency.code) {
      const selected = CURRENCIES.find(c => c.code === state.userProfile.currency);
      if (selected) {
        setCurrency(selected);
      }
    }
  }, [state.userProfile.currency, currency.code, setCurrency]);

  const handleCurrencyChange = (currencyCode: string) => {
    const selected = CURRENCIES.find(c => c.code === currencyCode);
    if (selected) {
      // Update CurrencyContext
      setCurrency(selected);
      
      // Update user profile in PlannerContext (this will automatically persist to localStorage)
      dispatch({
        type: 'SET_USER_PROFILE',
        payload: {
          ...state.userProfile,
          currency: currencyCode
        }
      });
    }
  };

  const currencyGroups = CURRENCIES.reduce((groups, curr) => {
    if (!groups[curr.region]) {
      groups[curr.region] = [];
    }
    groups[curr.region].push(curr);
    return groups;
  }, {} as Record<string, typeof CURRENCIES>);

  return (
    <div className="w-full max-w-xs">
      <label htmlFor="currency" className="block text-sm font-medium text-theme-secondary mb-1">
        Select Your Currency
      </label>
      <select
        id="currency"
        value={currency.code}
        onChange={(e) => {
          handleCurrencyChange(e.target.value);
        }}
        className="input-dark block w-full px-3 py-2 rounded-md shadow-sm focus:outline-none focus:ring-green-500 focus:border-green-500 sm:text-sm"
      >
        {Object.entries(currencyGroups).map(([region, currencies]) => (
          <optgroup key={region} label={region}>
            {currencies.map(curr => (
              <option key={curr.code} value={curr.code}>
                {curr.code} - {curr.name}
              </option>
            ))}
          </optgroup>
        ))}
      </select>
    </div>
  );
};

export default CurrencySelector;