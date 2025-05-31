export interface BankAccount {
  country: string;
  bank: string;
  url: string;
  rate: string;
  minDeposit: string;
  lockin: string;
}

export const gccSavingsAccounts: BankAccount[] = [
  { country: "UAE", bank: "Abu Dhabi Commercial Bank (ADCB)", url: "https://www.adcb.com/en/personal/accounts/current-savings-account/active-saver-account", rate: "Up to 5% (Super Saver)", minDeposit: "AED 0 to open; AED 5,000 to avoid fee", lockin: "None" },
  { country: "UAE", bank: "Abu Dhabi Islamic Bank (ADIB)", url: "https://www.adib.ae/en/personal/customer-profit-rates", rate: "Smart Account ~0.66% (expected profit)", minDeposit: "No minimum balance", lockin: "None" },
  { country: "UAE", bank: "Ajman Bank", url: "https://www.ajmanbank.ae/site/savings-accounts.html", rate: "AED 0.20% p.a. (profit)", minDeposit: "AED 5,000 to earn profit", lockin: "None" },
  { country: "UAE", bank: "Al Hilal Bank", url: "https://www.alhilalbank.ae/en/personal/accounts/profit-rates/profit-rates", rate: "Declared profit April 2025 ≈0.12%", minDeposit: "AED 5,000 (salary transfer waives)", lockin: "None" },
  { country: "UAE", bank: "Commercial Bank International (CBI)", url: "https://www.cbiuae.com/en/personal/products-and-services/savings/saver-account/", rate: "0.50 – 1.75% (tiered)", minDeposit: "AED 10,000 for interest", lockin: "None" },
  { country: "UAE", bank: "Commercial Bank of Dubai (CBD)", url: "https://www.cbd.ae/personal/accounts/savings-and-deposits", rate: "Up to 1.25%", minDeposit: "AED 3,000 minimum balance", lockin: "None" },
  { country: "UAE", bank: "Dubai Islamic Bank (DIB)", url: "https://www.dib.ae/personal/accounts/saving-accounts/al-islami-savings-account", rate: "Variable (profit quarterly, ~0.18%)", minDeposit: "AED 1,000 for profit", lockin: "Max 1 withdrawal/month for profit" },
  { country: "UAE", bank: "Emirates Islamic Bank", url: "https://www.emiratesislamic.ae/en/personal-banking/accounts/savings-account/kunooz-savings-account", rate: "Prize-based (profit ~0.10%)", minDeposit: "AED 3,000 for profit", lockin: "None" },
  { country: "UAE", bank: "Emirates NBD", url: "https://www.emiratesnbd.com/en/accounts/savings-accounts/tiered-savings-accounts", rate: "0.25 – 0.50% (tiered)", minDeposit: "AED 10,000 to earn interest", lockin: "None" },
  { country: "UAE", bank: "First Abu Dhabi Bank (FAB)", url: "https://www.bankfab.com/en-ae/personal/accounts/savings-accounts/new-savings-account-customer", rate: "Up to 4.50% (promo)", minDeposit: "No minimum balance", lockin: "None" },
  { country: "UAE", bank: "HSBC UAE", url: "https://www.hsbc.ae/savings-accounts/", rate: "3.30% bonus (promo to 31 Jul 2025)", minDeposit: "No minimum (Regular Saver requires monthly standing order)", lockin: "None" },
  { country: "UAE", bank: "Mashreq Neo", url: "https://www.mashreq.com/en/uae/neo/accounts/savings-accounts/neo-plus-account/", rate: "Up to 4.5%", minDeposit: "AED 35,000 for max rate", lockin: "Max 1 withdrawal/month for full rate" },
  { country: "UAE", bank: "National Bank of Fujairah (NBF)", url: "https://nbf.ae/personal/accounts-services/max-saver-account/", rate: "2.00 – 2.50% (AED)", minDeposit: "No minimum balance", lockin: "1 free withdrawal/month" },
  { country: "UAE", bank: "National Bank of Umm Al Qaiwain (NBQ)", url: "https://nbq.ae/personal/accounts/savings-account", rate: "Not published (interest-bearing)", minDeposit: "AED 500 to open", lockin: "None" },
  { country: "UAE", bank: "RAKBANK", url: "https://rakbank.ae/wps/portal/retail-banking/accounts/savings-accounts/rakbooster-saver", rate: "0.25 – 0.75% + promos", minDeposit: "AED 3,000 after 3 months", lockin: "None" },
  { country: "UAE", bank: "Sharjah Islamic Bank (SIB)", url: "https://www.sib.ae/en/Savings", rate: "Profit ~0.4063%", minDeposit: "No minimum balance", lockin: "None" },
  { country: "UAE", bank: "Standard Chartered UAE", url: "https://www.sc.com/ae/save/savers-account/", rate: "Up to 2.00%", minDeposit: "AED 3,000 initial deposit", lockin: "None" },
  { country: "UAE", bank: "United Arab Bank (UAB)", url: "https://www.uab.ae/en/personal/accounts/savings-account", rate: "Not published (interest-bearing)", minDeposit: "AED 3,000 minimum balance", lockin: "None" },
  { country: "UAE", bank: "Citibank UAE", url: "https://www.citibank.ae/uae/citigold/saving-account-citigold.do", rate: "Not published (tiered)", minDeposit: "AED 35,000 for Citigold", lockin: "None" },
  { country: "UAE", bank: "Al Masraf (Arab Bank for Investment & Foreign Trade)", url: "https://almasraf.ae/personal/Account-Types", rate: "Not published", minDeposit: "AED 3,000", lockin: "None" },
  { country: "UAE", bank: "Bank of Baroda UAE", url: "https://www.bankofbarodauae.ae/savings-bank-account", rate: "Not published", minDeposit: "AED 1,000", lockin: "None" },
  { country: "UAE", bank: "Liv. by Emirates NBD", url: "https://www.liv.me/en/save", rate: "3.00% on goal accounts (promo)", minDeposit: "No minimum", lockin: "None" },
  { country: "UAE", bank: "Wio Bank", url: "https://www.wio.io/en/personal/spaces", rate: "3.75 – 4.75% (spaces)", minDeposit: "AED 0 (AED 35k for highest tier)", lockin: "1–3 month fixed options" },
  { country: "UAE", bank: "Habib Bank AG Zurich (HBZ)", url: "https://www.habibbank.com/uae/personal.html", rate: "Not published", minDeposit: "AED 3,000", lockin: "None" },

  // Saudi Arabia
  { country: "Saudi Arabia", bank: "Alinma Bank", url: "https://www.alinma.com/en/retail/saving-investment/saving-account", rate: "2.00 – 2.70% (tiered expected)", minDeposit: "No minimum (SAR 1 to earn)", lockin: "None" },
  { country: "Saudi Arabia", bank: "Al Rajhi Bank", url: "https://www.alrajhibank.com.sa/en/Personal/Accounts/Saving-Accounts", rate: "Profit-sharing (variable, ~0.1%)", minDeposit: "No minimum", lockin: "None" },
  { country: "Saudi Arabia", bank: "Arab National Bank (ANB)", url: "https://anb.com.sa/en/personal/accounts/savings", rate: "Not disclosed (profit-sharing)", minDeposit: "No minimum", lockin: "None" },
  { country: "Saudi Arabia", bank: "Banque Saudi Fransi (BSF)", url: "https://www.alfransi.com.sa/english/personal/savings", rate: "0.10%", minDeposit: "No minimum", lockin: "None" },
  { country: "Saudi Arabia", bank: "Bank Albilad", url: "https://www.bankalbilad.com/en/personal/accounts/pages/saving-account.aspx", rate: "4.23% (1 year) – 4.70% (2 year)", minDeposit: "SAR 1,000 to open", lockin: "1–2 year term (limited withdrawals)" },
  { country: "Saudi Arabia", bank: "Bank AlJazira", url: "https://www.baj.com.sa/en-us/personalbanking/accounts/savingaccount", rate: "≈2.0% expected profit", minDeposit: "No minimum", lockin: "None" },
  { country: "Saudi Arabia", bank: "Gulf International Bank – meem", url: "https://meem.com/en-sa/products/savings-account", rate: "Up to 3.0%", minDeposit: "No minimum", lockin: "None" },
  { country: "Saudi Arabia", bank: "Saudi Awwal Bank (SAB)", url: "https://www.sab.com/en/personal/accounts/islamic-savings-account", rate: "~0.10% expected profit", minDeposit: "SAR 5,000 average", lockin: "None" },
  { country: "Saudi Arabia", bank: "Saudi Investment Bank (SAIB)", url: "https://www.saib.com.sa/en/personal/bank-accounts/e-save-account", rate: "0.10%", minDeposit: "SAR 5,000 average", lockin: "None" },
  { country: "Saudi Arabia", bank: "Riyad Bank", url: "https://www.riyadbank.com/en/personal/accounts/savings-account", rate: "Not disclosed (profit-sharing)", minDeposit: "No minimum", lockin: "None" },
  { country: "Saudi Arabia", bank: "Saudi National Bank (SNB)", url: "https://www.alahli.com/en-us/personal/accounts/pages/quds.aspx", rate: "Not disclosed", minDeposit: "No minimum", lockin: "None" },

  // Kuwait
  { country: "Kuwait", bank: "National Bank of Kuwait (NBK)", url: "https://www.nbk.com/kuwait/personal/accounts/savings-account.html", rate: "0.0625%", minDeposit: "KD 100 to open", lockin: "None" },
  { country: "Kuwait", bank: "Gulf Bank", url: "https://www.e-gulfbank.com/en/personal/accounts/savings-accounts/e-savings", rate: "Rate not disclosed (competitive)", minDeposit: "No minimum", lockin: "None" },
  { country: "Kuwait", bank: "Kuwait Finance House (KFH)", url: "https://www.kfh.com/en/home/personal/accounts/savings-account.html", rate: "Profit-sharing (variable)", minDeposit: "No minimum", lockin: "None" },
  { country: "Kuwait", bank: "Boubyan Bank", url: "https://boubyan.com/en/personal/accounts/savings-account/", rate: "Profit-sharing", minDeposit: "No minimum", lockin: "None" },
  { country: "Kuwait", bank: "Warba Bank", url: "https://www.warbabank.com/en/personal/accounts/investment-savings-account", rate: "Up to 1.25% expected", minDeposit: "No minimum", lockin: "None" },
  { country: "Kuwait", bank: "Commercial Bank of Kuwait (CBK)", url: "https://www.cbk.com/personal/accounts/savings-account", rate: "~0.125%", minDeposit: "No minimum", lockin: "None" },
  { country: "Kuwait", bank: "Burgan Bank", url: "https://www.burgan.com/en/personal/accounts/saver-account", rate: "~0.0625%", minDeposit: "No minimum", lockin: "None" },
  { country: "Kuwait", bank: "Ahli Bank of Kuwait (ABK)", url: "https://abk.eahli.com/en/personal/accounts/savings-account", rate: "~0.125%", minDeposit: "No minimum", lockin: "None" },
  { country: "Kuwait", bank: "Kuwait International Bank (KIB)", url: "https://kib.com.kw/en/accounts/savings", rate: "Profit-sharing", minDeposit: "No minimum", lockin: "None" },
  { country: "Kuwait", bank: "Ahli United Bank – Kuwait", url: "https://www.ahliunited.com.kw/en/personal/accounts/saver", rate: "Profit-sharing", minDeposit: "No minimum", lockin: "None" },

  // Qatar
  { country: "Qatar", bank: "Qatar National Bank (QNB) – e-Savings", url: "https://www.qnb.com/sites/qnb/qnbglobal/page/en/esavings", rate: "1.50 – 1.90% (tiered)", minDeposit: "No minimum", lockin: "None" },
  { country: "Qatar", bank: "QNB – Saving Plus", url: "https://www.qnb.com/sites/qnb/qnbglobal/page/en/savingplus", rate: "0.25 – 1.45%", minDeposit: "QAR 5,000 for higher rate", lockin: "None" },
  { country: "Qatar", bank: "Qatar Islamic Bank (QIB)", url: "https://www.qib.com.qa/en/personal/accounts/savings-account", rate: "Profit-sharing (variable)", minDeposit: "No minimum", lockin: "None" },
  { country: "Qatar", bank: "Commercial Bank of Qatar (CBQ)", url: "https://www.cbq.qa/EN/Personal/Pages/Savings-Accounts.aspx", rate: "~0.75%", minDeposit: "No minimum", lockin: "None" },
  { country: "Qatar", bank: "Doha Bank", url: "https://www.dohabank.com/ways-to-bank/accounts/savings-account/", rate: "~0.25 – 0.50%", minDeposit: "No minimum", lockin: "None" },
  { country: "Qatar", bank: "Masraf Al Rayan", url: "https://www.alrayan.com/en/personal/accounts/savings", rate: "Profit-sharing", minDeposit: "No minimum", lockin: "None" },
  { country: "Qatar", bank: "Dukhan Bank", url: "https://www.dukhanbank.com/retail-banking/accounts/savings-account", rate: "Profit-sharing", minDeposit: "No minimum", lockin: "None" },
  { country: "Qatar", bank: "Ahli Bank Qatar", url: "https://www.ahlibank.com.qa/en/personal/accounts/savings", rate: "~0.50%", minDeposit: "No minimum", lockin: "None" },

  // Bahrain
  { country: "Bahrain", bank: "National Bank of Bahrain (NBB)", url: "https://www.nbbonline.com/personal/accounts/express-saver", rate: "Variable (contact bank)", minDeposit: "No minimum", lockin: "None" },
  { country: "Bahrain", bank: "Bank of Bahrain & Kuwait (BBK)", url: "https://www.bbkonline.com/personal/accounts/super-saver", rate: "Rate not stated", minDeposit: "No minimum", lockin: "None" },
  { country: "Bahrain", bank: "Ahli United Bank (AUB)", url: "https://www.ahliunited.com/personal/bahrain/savings-account", rate: "~0.25%", minDeposit: "No minimum", lockin: "None" },
  { country: "Bahrain", bank: "Bahrain Islamic Bank (BisB)", url: "https://www.bisb.com/en/personal/accounts/savings", rate: "Profit-sharing", minDeposit: "No minimum", lockin: "None" },
  { country: "Bahrain", bank: "Al Salam Bank", url: "https://www.alsalambank.com/en/personal/accounts/savings-schemes", rate: "Profit-sharing", minDeposit: "No minimum", lockin: "None" },
  { country: "Bahrain", bank: "Khaleeji Commercial Bank (KHCB)", url: "https://www.khcbonline.com/personal-banking/account/saving-account", rate: "Profit-sharing", minDeposit: "No minimum", lockin: "None" },
  { country: "Bahrain", bank: "Ithmaar Bank", url: "https://www.ithmaarbank.com/en/personal/accounts/savings", rate: "Profit-sharing + prizes", minDeposit: "No minimum", lockin: "None" },
  { country: "Bahrain", bank: "Standard Chartered Bahrain", url: "https://www.sc.com/bh/save/savings-account/", rate: "~0.25%", minDeposit: "No minimum", lockin: "None" },
  { country: "Bahrain", bank: "HSBC Bahrain", url: "https://www.hsbc.com.bh/accounts/products/savings/", rate: "~0.25%", minDeposit: "No minimum", lockin: "None" },

  // Oman
  { country: "Oman", bank: "Bank Muscat", url: "https://www.bankmuscat.com/en/accounts/Pages/savings.aspx", rate: "~0.50% + prize draws", minDeposit: "No minimum (OMR 100 for prizes)", lockin: "None" },
  { country: "Oman", bank: "National Bank of Oman (NBO)", url: "https://www.nbo.om/en/Personal-Banking/Accounts/Pages/SavingsAccounts.aspx", rate: "~0.25%", minDeposit: "No minimum", lockin: "None" },
  { country: "Oman", bank: "Bank Dhofar", url: "https://www.bankdhofar.com/en-us/pages/Accounts.aspx", rate: "~0.25%", minDeposit: "No minimum", lockin: "None" },
  { country: "Oman", bank: "Sohar International", url: "https://soharinternational.com/en-us/personal/accounts/saving-accounts/", rate: "~0.30%", minDeposit: "No minimum", lockin: "None" },
  { country: "Oman", bank: "Oman Arab Bank (OAB)", url: "https://www.oman-arabbank.com/personal/accounts/savings-account/", rate: "~0.25%", minDeposit: "No minimum", lockin: "None" },
  { country: "Oman", bank: "Ahli Bank Oman", url: "https://www.ahlibank.om/en/personal/accounts/savings-account", rate: "~0.25%", minDeposit: "No minimum", lockin: "None" },
  { country: "Oman", bank: "Bank Nizwa", url: "https://www.banknizwa.om/personal/accounts/savings-account", rate: "Profit-sharing", minDeposit: "No minimum", lockin: "None" },
  { country: "Oman", bank: "HSBC Oman", url: "https://www.hsbc.co.om/accounts/products/savings/", rate: "~0.25%", minDeposit: "No minimum", lockin: "None" }
  ];

// Utility functions
export const getBanksByCountry = (country: string): BankAccount[] => {
  return gccSavingsAccounts.filter(bank => bank.country.toLowerCase() === country.toLowerCase());
};

export const getBanksByLocation = (location: string): BankAccount[] => {
  const countryMapping: { [key: string]: string } = {
    'dubai': 'UAE',
    'abu dhabi': 'UAE',
    'sharjah': 'UAE',
    'riyadh': 'Saudi Arabia',
    'jeddah': 'Saudi Arabia',
    'dammam': 'Saudi Arabia',
    'doha': 'Qatar',
    'kuwait city': 'Kuwait',
    'manama': 'Bahrain',
    'muscat': 'Oman'
  };

  const country = countryMapping[location.toLowerCase()];
  return country ? getBanksByCountry(country) : [];
}; 