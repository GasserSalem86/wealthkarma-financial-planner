export interface Currency {
  code: string;
  symbol: string;
  name: string;
  region: 'Major' | 'GCC' | 'MENA';
}

export const CURRENCIES: Currency[] = [
  // Major currencies
  { code: 'USD', symbol: '$', name: 'US Dollar', region: 'Major' },
  { code: 'EUR', symbol: '€', name: 'Euro', region: 'Major' },
  { code: 'GBP', symbol: '£', name: 'British Pound', region: 'Major' },
  { code: 'JPY', symbol: '¥', name: 'Japanese Yen', region: 'Major' },
  
  // GCC currencies
  { code: 'AED', symbol: 'AED', name: 'UAE Dirham', region: 'GCC' },
  { code: 'SAR', symbol: 'SAR', name: 'Saudi Riyal', region: 'GCC' },
  { code: 'QAR', symbol: 'QAR', name: 'Qatari Riyal', region: 'GCC' },
  { code: 'KWD', symbol: 'KWD', name: 'Kuwaiti Dinar', region: 'GCC' },
  { code: 'OMR', symbol: 'OMR', name: 'Omani Rial', region: 'GCC' },
  { code: 'BHD', symbol: 'BHD', name: 'Bahraini Dinar', region: 'GCC' },
  
  // MENA currencies
  { code: 'EGP', symbol: 'EGP', name: 'Egyptian Pound', region: 'MENA' },
  { code: 'JOD', symbol: 'JOD', name: 'Jordanian Dinar', region: 'MENA' },
  { code: 'LBP', symbol: 'LBP', name: 'Lebanese Pound', region: 'MENA' },
];