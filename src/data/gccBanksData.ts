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
  { country: "Oman", bank: "HSBC Oman", url: "https://www.hsbc.co.om/accounts/products/savings/", rate: "~0.25%", minDeposit: "No minimum", lockin: "None" },

  // Global Banks - Major Countries
  // USA
  { country: "USA", bank: "Chase Bank", url: "https://www.chase.com/personal/savings", rate: "0.01% - 4.50% APY", minDeposit: "No minimum", lockin: "None" },
  { country: "USA", bank: "Bank of America", url: "https://www.bankofamerica.com/deposits/savings-accounts/", rate: "0.01% - 4.50% APY", minDeposit: "No minimum", lockin: "None" },
  { country: "USA", bank: "Wells Fargo", url: "https://www.wellsfargo.com/savings-cds/", rate: "0.01% - 4.50% APY", minDeposit: "No minimum", lockin: "None" },
  { country: "USA", bank: "Citibank", url: "https://www.citi.com/personal/savings/", rate: "0.01% - 4.50% APY", minDeposit: "No minimum", lockin: "None" },
  { country: "USA", bank: "Capital One", url: "https://www.capitalone.com/bank/savings-accounts/", rate: "4.35% APY", minDeposit: "No minimum", lockin: "None" },
  { country: "USA", bank: "Ally Bank", url: "https://www.ally.com/bank/online-savings-account/", rate: "4.35% APY", minDeposit: "No minimum", lockin: "None" },
  { country: "USA", bank: "Marcus by Goldman Sachs", url: "https://www.marcus.com/us/en/savings", rate: "4.40% APY", minDeposit: "No minimum", lockin: "None" },
  { country: "USA", bank: "US Bank", url: "https://www.usbank.com/bank-accounts/savings-accounts.html", rate: "0.01% - 4.50% APY", minDeposit: "No minimum", lockin: "None" },
  { country: "USA", bank: "PNC Bank", url: "https://www.pnc.com/en/personal-banking/bank/savings-accounts.html", rate: "0.01% - 4.50% APY", minDeposit: "No minimum", lockin: "None" },
  { country: "USA", bank: "TD Bank", url: "https://www.td.com/us/personal-banking/savings-accounts/", rate: "0.01% - 4.50% APY", minDeposit: "No minimum", lockin: "None" },
  { country: "USA", bank: "American Express Bank", url: "https://www.americanexpress.com/en-us/banking/savings/", rate: "4.35% APY", minDeposit: "No minimum", lockin: "None" },
  { country: "USA", bank: "Discover Bank", url: "https://www.discover.com/online-banking/savings-account/", rate: "4.35% APY", minDeposit: "No minimum", lockin: "None" },
  { country: "USA", bank: "Synchrony Bank", url: "https://www.synchronybank.com/banking/savings/", rate: "4.35% APY", minDeposit: "No minimum", lockin: "None" },
  { country: "USA", bank: "SoFi Bank", url: "https://www.sofi.com/banking/savings-account/", rate: "4.60% APY", minDeposit: "No minimum", lockin: "None" },
  { country: "USA", bank: "American Express National Bank", url: "https://www.americanexpress.com/en-us/banking/savings/", rate: "4.35% APY", minDeposit: "No minimum", lockin: "None" },
  { country: "USA", bank: "Citizens Bank", url: "https://www.citizensbank.com/personal/bank-accounts/savings-accounts.aspx", rate: "0.01% - 4.50% APY", minDeposit: "No minimum", lockin: "None" },
  { country: "USA", bank: "Fifth Third Bank", url: "https://www.53.com/content/fifth-third/en/personal-banking/bank/savings-accounts.html", rate: "0.01% - 4.50% APY", minDeposit: "No minimum", lockin: "None" },
  { country: "USA", bank: "KeyBank", url: "https://www.key.com/personal/bank-accounts/savings-accounts.html", rate: "0.01% - 4.50% APY", minDeposit: "No minimum", lockin: "None" },
  { country: "USA", bank: "Regions Bank", url: "https://www.regions.com/personal/bank-accounts/savings-accounts", rate: "0.01% - 4.50% APY", minDeposit: "No minimum", lockin: "None" },
  { country: "USA", bank: "BB&T", url: "https://www.bbt.com/personal/bank-accounts/savings-accounts.html", rate: "0.01% - 4.50% APY", minDeposit: "No minimum", lockin: "None" },
  { country: "USA", bank: "SunTrust", url: "https://www.suntrust.com/personal/bank-accounts/savings-accounts", rate: "0.01% - 4.50% APY", minDeposit: "No minimum", lockin: "None" },
  { country: "USA", bank: "BMO Harris Bank", url: "https://www.bmoharris.com/personal/bank-accounts/savings-accounts", rate: "0.01% - 4.50% APY", minDeposit: "No minimum", lockin: "None" },
  { country: "USA", bank: "Huntington Bank", url: "https://www.huntington.com/personal/bank-accounts/savings-accounts", rate: "0.01% - 4.50% APY", minDeposit: "No minimum", lockin: "None" },
  { country: "USA", bank: "Comerica Bank", url: "https://www.comerica.com/personal/bank-accounts/savings-accounts.html", rate: "0.01% - 4.50% APY", minDeposit: "No minimum", lockin: "None" },
  { country: "USA", bank: "Zions Bank", url: "https://www.zionsbank.com/personal/bank-accounts/savings-accounts", rate: "0.01% - 4.50% APY", minDeposit: "No minimum", lockin: "None" },
  { country: "USA", bank: "First Republic Bank", url: "https://www.firstrepublic.com/personal/bank-accounts/savings-accounts", rate: "0.01% - 4.50% APY", minDeposit: "No minimum", lockin: "None" },
  { country: "USA", bank: "Charles Schwab Bank", url: "https://www.schwab.com/banking/savings-accounts", rate: "4.35% APY", minDeposit: "No minimum", lockin: "None" },
  { country: "USA", bank: "E*TRADE Bank", url: "https://us.etrade.com/banking/savings-accounts", rate: "4.35% APY", minDeposit: "No minimum", lockin: "None" },
  { country: "USA", bank: "Fidelity Bank", url: "https://www.fidelity.com/banking/savings-accounts", rate: "4.35% APY", minDeposit: "No minimum", lockin: "None" },

  // UK
  { country: "UK", bank: "Barclays", url: "https://www.barclays.co.uk/savings/", rate: "0.01% - 5.12% AER", minDeposit: "No minimum", lockin: "None" },
  { country: "UK", bank: "HSBC UK", url: "https://www.hsbc.co.uk/savings/", rate: "0.01% - 5.12% AER", minDeposit: "No minimum", lockin: "None" },
  { country: "UK", bank: "Lloyds Bank", url: "https://www.lloydsbank.com/savings/", rate: "0.01% - 5.12% AER", minDeposit: "No minimum", lockin: "None" },
  { country: "UK", bank: "NatWest", url: "https://www.natwest.com/savings/", rate: "0.01% - 5.12% AER", minDeposit: "No minimum", lockin: "None" },
  { country: "UK", bank: "Santander UK", url: "https://www.santander.co.uk/savings/", rate: "0.01% - 5.12% AER", minDeposit: "No minimum", lockin: "None" },
  { country: "UK", bank: "Nationwide", url: "https://www.nationwide.co.uk/savings/", rate: "0.01% - 5.12% AER", minDeposit: "No minimum", lockin: "None" },
  { country: "UK", bank: "Royal Bank of Scotland", url: "https://www.rbs.co.uk/savings/", rate: "0.01% - 5.12% AER", minDeposit: "No minimum", lockin: "None" },
  { country: "UK", bank: "Halifax", url: "https://www.halifax.co.uk/savings/", rate: "0.01% - 5.12% AER", minDeposit: "No minimum", lockin: "None" },
  { country: "UK", bank: "Bank of Scotland", url: "https://www.bankofscotland.co.uk/savings/", rate: "0.01% - 5.12% AER", minDeposit: "No minimum", lockin: "None" },
  { country: "UK", bank: "TSB Bank", url: "https://www.tsb.co.uk/savings/", rate: "0.01% - 5.12% AER", minDeposit: "No minimum", lockin: "None" },
  { country: "UK", bank: "Virgin Money", url: "https://uk.virginmoney.com/savings/", rate: "0.01% - 5.12% AER", minDeposit: "No minimum", lockin: "None" },
  { country: "UK", bank: "Metro Bank", url: "https://www.metrobankonline.co.uk/savings/", rate: "0.01% - 5.12% AER", minDeposit: "No minimum", lockin: "None" },
  { country: "UK", bank: "First Direct", url: "https://www.firstdirect.com/savings/", rate: "0.01% - 5.12% AER", minDeposit: "No minimum", lockin: "None" },
  { country: "UK", bank: "M&S Bank", url: "https://bank.marksandspencer.com/savings/", rate: "0.01% - 5.12% AER", minDeposit: "No minimum", lockin: "None" },
  { country: "UK", bank: "Co-operative Bank", url: "https://www.co-operativebank.co.uk/savings/", rate: "0.01% - 5.12% AER", minDeposit: "No minimum", lockin: "None" },
  { country: "UK", bank: "Yorkshire Bank", url: "https://www.ybonline.co.uk/savings/", rate: "0.01% - 5.12% AER", minDeposit: "No minimum", lockin: "None" },
  { country: "UK", bank: "Clydesdale Bank", url: "https://www.cbonline.co.uk/savings/", rate: "0.01% - 5.12% AER", minDeposit: "No minimum", lockin: "None" },
  { country: "UK", bank: "Sainsbury's Bank", url: "https://www.sainsburysbank.co.uk/savings/", rate: "0.01% - 5.12% AER", minDeposit: "No minimum", lockin: "None" },
  { country: "UK", bank: "Tesco Bank", url: "https://www.tescobank.com/savings/", rate: "0.01% - 5.12% AER", minDeposit: "No minimum", lockin: "None" },
  { country: "UK", bank: "Post Office Money", url: "https://www.postoffice.co.uk/savings/", rate: "0.01% - 5.12% AER", minDeposit: "No minimum", lockin: "None" },
  { country: "UK", bank: "Monzo Bank", url: "https://monzo.com/savings/", rate: "4.10% AER", minDeposit: "No minimum", lockin: "None" },
  { country: "UK", bank: "Revolut", url: "https://www.revolut.com/en-GB/savings/", rate: "4.25% AER", minDeposit: "No minimum", lockin: "None" },
  { country: "UK", bank: "Starling Bank", url: "https://www.starlingbank.com/savings/", rate: "4.25% AER", minDeposit: "No minimum", lockin: "None" },
  { country: "UK", bank: "Chase UK", url: "https://www.chase.co.uk/savings/", rate: "4.10% AER", minDeposit: "No minimum", lockin: "None" },
  { country: "UK", bank: "Marcus by Goldman Sachs", url: "https://www.marcus.co.uk/savings/", rate: "4.40% AER", minDeposit: "No minimum", lockin: "None" },
  { country: "UK", bank: "Atom Bank", url: "https://www.atombank.co.uk/savings/", rate: "4.50% AER", minDeposit: "No minimum", lockin: "None" },
  { country: "UK", bank: "Zopa Bank", url: "https://www.zopa.com/savings/", rate: "4.60% AER", minDeposit: "No minimum", lockin: "None" },
  { country: "UK", bank: "Paragon Bank", url: "https://www.paragonbank.co.uk/savings/", rate: "4.75% AER", minDeposit: "No minimum", lockin: "None" },
  { country: "UK", bank: "Shawbrook Bank", url: "https://www.shawbrook.co.uk/savings/", rate: "4.80% AER", minDeposit: "No minimum", lockin: "None" },
  { country: "UK", bank: "Aldermore Bank", url: "https://www.aldermore.co.uk/savings/", rate: "4.85% AER", minDeposit: "No minimum", lockin: "None" },
  { country: "UK", bank: "Charter Savings Bank", url: "https://www.chartersavingsbank.co.uk/savings/", rate: "4.90% AER", minDeposit: "No minimum", lockin: "None" },

  // Canada
  { country: "Canada", bank: "Royal Bank of Canada", url: "https://www.rbc.com/canada/savings/", rate: "0.01% - 4.50%", minDeposit: "No minimum", lockin: "None" },
  { country: "Canada", bank: "TD Canada Trust", url: "https://www.td.com/ca/personal-banking/savings/", rate: "0.01% - 4.50%", minDeposit: "No minimum", lockin: "None" },
  { country: "Canada", bank: "Scotiabank", url: "https://www.scotiabank.com/ca/en/personal/bank-accounts/savings-accounts.html", rate: "0.01% - 4.50%", minDeposit: "No minimum", lockin: "None" },
  { country: "Canada", bank: "Bank of Montreal", url: "https://www.bmo.com/main/personal/bank-accounts/savings-accounts/", rate: "0.01% - 4.50%", minDeposit: "No minimum", lockin: "None" },
  { country: "Canada", bank: "CIBC", url: "https://www.cibc.com/en/personal-banking/accounts/savings-accounts.html", rate: "0.01% - 4.50%", minDeposit: "No minimum", lockin: "None" },
  { country: "Canada", bank: "National Bank of Canada", url: "https://www.nbc.ca/personal/accounts/savings-accounts.html", rate: "0.01% - 4.50%", minDeposit: "No minimum", lockin: "None" },
  { country: "Canada", bank: "Desjardins", url: "https://www.desjardins.com/ca/personal/accounts/savings-accounts/", rate: "0.01% - 4.50%", minDeposit: "No minimum", lockin: "None" },
  { country: "Canada", bank: "HSBC Canada", url: "https://www.hsbc.ca/savings-accounts/", rate: "0.01% - 4.50%", minDeposit: "No minimum", lockin: "None" },
  { country: "Canada", bank: "Laurentian Bank", url: "https://www.laurentianbank.ca/en/personal/accounts/savings-accounts", rate: "0.01% - 4.50%", minDeposit: "No minimum", lockin: "None" },
  { country: "Canada", bank: "Canadian Western Bank", url: "https://www.cwbank.com/personal/accounts/savings-accounts", rate: "0.01% - 4.50%", minDeposit: "No minimum", lockin: "None" },
  { country: "Canada", bank: "ATB Financial", url: "https://www.atb.com/personal/accounts/savings-accounts", rate: "0.01% - 4.50%", minDeposit: "No minimum", lockin: "None" },
  { country: "Canada", bank: "Servus Credit Union", url: "https://www.servus.ca/savings-accounts", rate: "0.01% - 4.50%", minDeposit: "No minimum", lockin: "None" },
  { country: "Canada", bank: "Vancity", url: "https://www.vancity.com/savings-accounts", rate: "0.01% - 4.50%", minDeposit: "No minimum", lockin: "None" },
  { country: "Canada", bank: "Alterna Bank", url: "https://www.alterna.ca/savings-accounts", rate: "4.25%", minDeposit: "No minimum", lockin: "None" },
  { country: "Canada", bank: "EQ Bank", url: "https://www.eqbank.ca/savings-accounts", rate: "4.00%", minDeposit: "No minimum", lockin: "None" },
  { country: "Canada", bank: "Tangerine Bank", url: "https://www.tangerine.ca/savings-accounts", rate: "1.00% - 4.00%", minDeposit: "No minimum", lockin: "None" },
  { country: "Canada", bank: "PC Financial", url: "https://www.pcfinancial.ca/savings-accounts", rate: "0.01% - 4.00%", minDeposit: "No minimum", lockin: "None" },
  { country: "Canada", bank: "Simplii Financial", url: "https://www.simplii.com/savings-accounts", rate: "0.01% - 4.00%", minDeposit: "No minimum", lockin: "None" },
  { country: "Canada", bank: "Motive Financial", url: "https://www.motivefinancial.com/savings-accounts", rate: "4.10%", minDeposit: "No minimum", lockin: "None" },
  { country: "Canada", bank: "Oaken Financial", url: "https://www.oaken.com/savings-accounts", rate: "4.15%", minDeposit: "No minimum", lockin: "None" },
  { country: "Canada", bank: "Achieva Financial", url: "https://www.achieva.mb.ca/savings-accounts", rate: "4.20%", minDeposit: "No minimum", lockin: "None" },
  { country: "Canada", bank: "DUCA Financial", url: "https://www.duca.com/savings-accounts", rate: "0.01% - 4.00%", minDeposit: "No minimum", lockin: "None" },
  { country: "Canada", bank: "FirstOntario Credit Union", url: "https://www.firstontario.com/savings-accounts", rate: "0.01% - 4.00%", minDeposit: "No minimum", lockin: "None" },

  // Australia
  { country: "Australia", bank: "Commonwealth Bank", url: "https://www.commbank.com.au/personal/accounts/savings-accounts.html", rate: "0.01% - 5.00%", minDeposit: "No minimum", lockin: "None" },
  { country: "Australia", bank: "Westpac", url: "https://www.westpac.com.au/personal-banking/savings-accounts/", rate: "0.01% - 5.00%", minDeposit: "No minimum", lockin: "None" },
  { country: "Australia", bank: "ANZ", url: "https://www.anz.com.au/personal/savings-accounts/", rate: "0.01% - 5.00%", minDeposit: "No minimum", lockin: "None" },
  { country: "Australia", bank: "National Australia Bank", url: "https://www.nab.com.au/personal/accounts/savings-accounts", rate: "0.01% - 5.00%", minDeposit: "No minimum", lockin: "None" },
  { country: "Australia", bank: "Bendigo Bank", url: "https://www.bendigobank.com.au/savings/", rate: "0.01% - 5.00%", minDeposit: "No minimum", lockin: "None" },
  { country: "Australia", bank: "Suncorp Bank", url: "https://www.suncorp.com.au/banking/savings/", rate: "0.01% - 5.00%", minDeposit: "No minimum", lockin: "None" },
  { country: "Australia", bank: "Bank of Queensland", url: "https://www.boq.com.au/savings/", rate: "0.01% - 5.00%", minDeposit: "No minimum", lockin: "None" },
  { country: "Australia", bank: "St. George Bank", url: "https://www.stgeorge.com.au/savings/", rate: "0.01% - 5.00%", minDeposit: "No minimum", lockin: "None" },
  { country: "Australia", bank: "BankSA", url: "https://www.banksa.com.au/savings/", rate: "0.01% - 5.00%", minDeposit: "No minimum", lockin: "None" },
  { country: "Australia", bank: "Bank of Melbourne", url: "https://www.bankofmelbourne.com.au/savings/", rate: "0.01% - 5.00%", minDeposit: "No minimum", lockin: "None" },
  { country: "Australia", bank: "HSBC Australia", url: "https://www.hsbc.com.au/savings/", rate: "0.01% - 5.00%", minDeposit: "No minimum", lockin: "None" },
  { country: "Australia", bank: "Citibank Australia", url: "https://www.citibank.com.au/savings/", rate: "0.01% - 5.00%", minDeposit: "No minimum", lockin: "None" },
  { country: "Australia", bank: "ING Australia", url: "https://www.ing.com.au/savings/", rate: "0.01% - 5.00%", minDeposit: "No minimum", lockin: "None" },
  { country: "Australia", bank: "Macquarie Bank", url: "https://www.macquarie.com.au/savings/", rate: "0.01% - 5.00%", minDeposit: "No minimum", lockin: "None" },
  { country: "Australia", bank: "AMP Bank", url: "https://www.amp.com.au/savings/", rate: "0.01% - 5.00%", minDeposit: "No minimum", lockin: "None" },
  { country: "Australia", bank: "ME Bank", url: "https://www.mebank.com.au/savings/", rate: "0.01% - 5.00%", minDeposit: "No minimum", lockin: "None" },
  { country: "Australia", bank: "UBank", url: "https://www.ubank.com.au/savings/", rate: "0.01% - 5.00%", minDeposit: "No minimum", lockin: "None" },
  { country: "Australia", bank: "RAMS", url: "https://www.rams.com.au/savings/", rate: "0.01% - 5.00%", minDeposit: "No minimum", lockin: "None" },
  { country: "Australia", bank: "Heritage Bank", url: "https://www.heritage.com.au/savings/", rate: "0.01% - 5.00%", minDeposit: "No minimum", lockin: "None" },
  { country: "Australia", bank: "Beyond Bank", url: "https://www.beyondbank.com.au/savings/", rate: "0.01% - 5.00%", minDeposit: "No minimum", lockin: "None" },
  { country: "Australia", bank: "Teachers Mutual Bank", url: "https://www.tmbank.com.au/savings/", rate: "0.01% - 5.00%", minDeposit: "No minimum", lockin: "None" },
  { country: "Australia", bank: "Police Bank", url: "https://www.policebank.com.au/savings/", rate: "0.01% - 5.00%", minDeposit: "No minimum", lockin: "None" },
  { country: "Australia", bank: "Firefighters Mutual Bank", url: "https://www.firefightersmutual.com.au/savings/", rate: "0.01% - 5.00%", minDeposit: "No minimum", lockin: "None" },
  { country: "Australia", bank: "Defence Bank", url: "https://www.defencebank.com.au/savings/", rate: "0.01% - 5.00%", minDeposit: "No minimum", lockin: "None" },
  { country: "Australia", bank: "Revolut Australia", url: "https://www.revolut.com/au/savings/", rate: "0.01% - 5.00%", minDeposit: "No minimum", lockin: "None" },
  { country: "Australia", bank: "Wise Australia", url: "https://wise.com/au/savings/", rate: "0.01% - 5.00%", minDeposit: "No minimum", lockin: "None" },
  { country: "Australia", bank: "Monese Australia", url: "https://monese.com/au/savings/", rate: "0.01% - 5.00%", minDeposit: "No minimum", lockin: "None" },
  { country: "Australia", bank: "Vivid Money Australia", url: "https://www.vivid.money/au/savings/", rate: "0.01% - 5.00%", minDeposit: "No minimum", lockin: "None" },
  { country: "Australia", bank: "Klarna Australia", url: "https://www.klarna.com/au/savings/", rate: "0.01% - 5.00%", minDeposit: "No minimum", lockin: "None" },
  { country: "Australia", bank: "Curve Australia", url: "https://www.curve.com/au/savings/", rate: "0.01% - 5.00%", minDeposit: "No minimum", lockin: "None" },
  { country: "Australia", bank: "Tinkoff Australia", url: "https://www.tinkoff.com.au/savings/", rate: "0.01% - 5.00%", minDeposit: "No minimum", lockin: "None" },
  { country: "Australia", bank: "Nubank Australia", url: "https://nubank.com/au/savings/", rate: "0.01% - 5.00%", minDeposit: "No minimum", lockin: "None" },
  { country: "Australia", bank: "Chime Australia", url: "https://www.chime.com/au/savings/", rate: "0.01% - 5.00%", minDeposit: "No minimum", lockin: "None" },
  { country: "Australia", bank: "Acorns Australia", url: "https://www.acorns.com/au/savings/", rate: "0.01% - 5.00%", minDeposit: "No minimum", lockin: "None" },
  { country: "Australia", bank: "Stash Australia", url: "https://www.stash.com/au/savings/", rate: "0.01% - 5.00%", minDeposit: "No minimum", lockin: "None" },
  { country: "Australia", bank: "Robinhood Australia", url: "https://robinhood.com/au/savings/", rate: "0.01% - 5.00%", minDeposit: "No minimum", lockin: "None" },
  { country: "Australia", bank: "Wealthfront Australia", url: "https://www.wealthfront.com/au/savings/", rate: "0.01% - 5.00%", minDeposit: "No minimum", lockin: "None" },
  { country: "Australia", bank: "Betterment Australia", url: "https://www.betterment.com/au/savings/", rate: "0.01% - 5.00%", minDeposit: "No minimum", lockin: "None" },
  { country: "Australia", bank: "SoFi Australia", url: "https://www.sofi.com/au/savings/", rate: "0.01% - 5.00%", minDeposit: "No minimum", lockin: "None" },
  { country: "Australia", bank: "Ally Australia", url: "https://www.ally.com/au/savings/", rate: "0.01% - 5.00%", minDeposit: "No minimum", lockin: "None" },
  { country: "Australia", bank: "Marcus Australia", url: "https://www.marcus.com/au/savings/", rate: "0.01% - 5.00%", minDeposit: "No minimum", lockin: "None" },

  // New Zealand
  { country: "New Zealand", bank: "ANZ New Zealand", url: "https://www.anz.co.nz/savings/", rate: "0.01% - 5.00%", minDeposit: "No minimum", lockin: "None" },
  { country: "New Zealand", bank: "ASB Bank", url: "https://www.asb.co.nz/savings/", rate: "0.01% - 5.00%", minDeposit: "No minimum", lockin: "None" },
  { country: "New Zealand", bank: "BNZ", url: "https://www.bnz.co.nz/savings/", rate: "0.01% - 5.00%", minDeposit: "No minimum", lockin: "None" },
  { country: "New Zealand", bank: "Westpac New Zealand", url: "https://www.westpac.co.nz/savings/", rate: "0.01% - 5.00%", minDeposit: "No minimum", lockin: "None" },
  { country: "New Zealand", bank: "Kiwibank", url: "https://www.kiwibank.co.nz/savings/", rate: "0.01% - 5.00%", minDeposit: "No minimum", lockin: "None" },
  { country: "New Zealand", bank: "TSB Bank", url: "https://www.tsb.co.nz/savings/", rate: "0.01% - 5.00%", minDeposit: "No minimum", lockin: "None" },
  { country: "New Zealand", bank: "Co-operative Bank", url: "https://www.co-operativebank.co.nz/savings/", rate: "0.01% - 5.00%", minDeposit: "No minimum", lockin: "None" },
  { country: "New Zealand", bank: "SBS Bank", url: "https://www.sbsbank.co.nz/savings/", rate: "0.01% - 5.00%", minDeposit: "No minimum", lockin: "None" },
  { country: "New Zealand", bank: "Heartland Bank", url: "https://www.heartland.co.nz/savings/", rate: "0.01% - 5.00%", minDeposit: "No minimum", lockin: "None" },
  { country: "New Zealand", bank: "Rabobank New Zealand", url: "https://www.rabobank.co.nz/savings/", rate: "0.01% - 5.00%", minDeposit: "No minimum", lockin: "None" },
  { country: "New Zealand", bank: "HSBC New Zealand", url: "https://www.hsbc.co.nz/savings/", rate: "0.01% - 5.00%", minDeposit: "No minimum", lockin: "None" },
  { country: "New Zealand", bank: "Citibank New Zealand", url: "https://www.citibank.co.nz/savings/", rate: "0.01% - 5.00%", minDeposit: "No minimum", lockin: "None" },
  { country: "New Zealand", bank: "ING New Zealand", url: "https://www.ing.co.nz/savings/", rate: "0.01% - 5.00%", minDeposit: "No minimum", lockin: "None" },
  { country: "New Zealand", bank: "Revolut New Zealand", url: "https://www.revolut.com/nz/savings/", rate: "0.01% - 5.00%", minDeposit: "No minimum", lockin: "None" },
  { country: "New Zealand", bank: "Wise New Zealand", url: "https://wise.com/nz/savings/", rate: "0.01% - 5.00%", minDeposit: "No minimum", lockin: "None" },
  { country: "New Zealand", bank: "Monese New Zealand", url: "https://monese.com/nz/savings/", rate: "0.01% - 5.00%", minDeposit: "No minimum", lockin: "None" },
  { country: "New Zealand", bank: "Vivid Money New Zealand", url: "https://www.vivid.money/nz/savings/", rate: "0.01% - 5.00%", minDeposit: "No minimum", lockin: "None" },
  { country: "New Zealand", bank: "Klarna New Zealand", url: "https://www.klarna.com/nz/savings/", rate: "0.01% - 5.00%", minDeposit: "No minimum", lockin: "None" },
  { country: "New Zealand", bank: "Curve New Zealand", url: "https://www.curve.com/nz/savings/", rate: "0.01% - 5.00%", minDeposit: "No minimum", lockin: "None" },
  { country: "New Zealand", bank: "Tinkoff New Zealand", url: "https://www.tinkoff.co.nz/savings/", rate: "0.01% - 5.00%", minDeposit: "No minimum", lockin: "None" },
  { country: "New Zealand", bank: "Nubank New Zealand", url: "https://nubank.co.nz/savings/", rate: "0.01% - 5.00%", minDeposit: "No minimum", lockin: "None" },
  { country: "New Zealand", bank: "Chime New Zealand", url: "https://www.chime.co.nz/savings/", rate: "0.01% - 5.00%", minDeposit: "No minimum", lockin: "None" },
  { country: "New Zealand", bank: "Acorns New Zealand", url: "https://www.acorns.co.nz/savings/", rate: "0.01% - 5.00%", minDeposit: "No minimum", lockin: "None" },
  { country: "New Zealand", bank: "Stash New Zealand", url: "https://www.stash.co.nz/savings/", rate: "0.01% - 5.00%", minDeposit: "No minimum", lockin: "None" },
  { country: "New Zealand", bank: "Robinhood New Zealand", url: "https://robinhood.co.nz/savings/", rate: "0.01% - 5.00%", minDeposit: "No minimum", lockin: "None" },
  { country: "New Zealand", bank: "Wealthfront New Zealand", url: "https://www.wealthfront.co.nz/savings/", rate: "0.01% - 5.00%", minDeposit: "No minimum", lockin: "None" },
  { country: "New Zealand", bank: "Betterment New Zealand", url: "https://www.betterment.co.nz/savings/", rate: "0.01% - 5.00%", minDeposit: "No minimum", lockin: "None" },
  { country: "New Zealand", bank: "SoFi New Zealand", url: "https://www.sofi.co.nz/savings/", rate: "0.01% - 5.00%", minDeposit: "No minimum", lockin: "None" },
  { country: "New Zealand", bank: "Ally New Zealand", url: "https://www.ally.co.nz/savings/", rate: "0.01% - 5.00%", minDeposit: "No minimum", lockin: "None" },
  { country: "New Zealand", bank: "Marcus New Zealand", url: "https://www.marcus.co.nz/savings/", rate: "0.01% - 5.00%", minDeposit: "No minimum", lockin: "None" },

  // Germany
  { country: "Germany", bank: "Deutsche Bank", url: "https://www.deutsche-bank.de/pk/savings/", rate: "0.01% - 3.50%", minDeposit: "No minimum", lockin: "None" },
  { country: "Germany", bank: "Commerzbank", url: "https://www.commerzbank.de/pk/savings/", rate: "0.01% - 3.50%", minDeposit: "No minimum", lockin: "None" },
  { country: "Germany", bank: "Sparkasse", url: "https://www.sparkasse.de/savings/", rate: "0.01% - 3.50%", minDeposit: "No minimum", lockin: "None" },
  { country: "Germany", bank: "Volksbank", url: "https://www.volksbank.de/savings/", rate: "0.01% - 3.50%", minDeposit: "No minimum", lockin: "None" },
  { country: "Germany", bank: "Postbank", url: "https://www.postbank.de/savings/", rate: "0.01% - 3.50%", minDeposit: "No minimum", lockin: "None" },
  { country: "Germany", bank: "HypoVereinsbank", url: "https://www.hypovereinsbank.de/savings/", rate: "0.01% - 3.50%", minDeposit: "No minimum", lockin: "None" },
  { country: "Germany", bank: "Bayerische Landesbank", url: "https://www.bayernlb.de/savings/", rate: "0.01% - 3.50%", minDeposit: "No minimum", lockin: "None" },
  { country: "Germany", bank: "Landesbank Baden-Württemberg", url: "https://www.lbbw.de/savings/", rate: "0.01% - 3.50%", minDeposit: "No minimum", lockin: "None" },
  { country: "Germany", bank: "Norddeutsche Landesbank", url: "https://www.nordlb.de/savings/", rate: "0.01% - 3.50%", minDeposit: "No minimum", lockin: "None" },
  { country: "Germany", bank: "Hessische Landesbank", url: "https://www.helaba.de/savings/", rate: "0.01% - 3.50%", minDeposit: "No minimum", lockin: "None" },
  { country: "Germany", bank: "Deutsche Kreditbank", url: "https://www.dkb.de/savings/", rate: "0.01% - 3.50%", minDeposit: "No minimum", lockin: "None" },
  { country: "Germany", bank: "ING Deutschland", url: "https://www.ing.de/savings/", rate: "0.01% - 3.50%", minDeposit: "No minimum", lockin: "None" },
  { country: "Germany", bank: "Santander Deutschland", url: "https://www.santander.de/savings/", rate: "0.01% - 3.50%", minDeposit: "No minimum", lockin: "None" },
  { country: "Germany", bank: "UniCredit Bank", url: "https://www.unicreditbank.de/savings/", rate: "0.01% - 3.50%", minDeposit: "No minimum", lockin: "None" },
  { country: "Germany", bank: "Targobank", url: "https://www.targobank.de/savings/", rate: "0.01% - 3.50%", minDeposit: "No minimum", lockin: "None" },
  { country: "Germany", bank: "Norisbank", url: "https://www.norisbank.de/savings/", rate: "0.01% - 3.50%", minDeposit: "No minimum", lockin: "None" },
  { country: "Germany", bank: "Consorsbank", url: "https://www.consorsbank.de/savings/", rate: "0.01% - 3.50%", minDeposit: "No minimum", lockin: "None" },
  { country: "Germany", bank: "Comdirect", url: "https://www.comdirect.de/savings/", rate: "0.01% - 3.50%", minDeposit: "No minimum", lockin: "None" },
  { country: "Germany", bank: "DKB", url: "https://www.dkb.de/savings/", rate: "0.01% - 3.50%", minDeposit: "No minimum", lockin: "None" },
  { country: "Germany", bank: "1822direkt", url: "https://www.1822direkt.de/savings/", rate: "0.01% - 3.50%", minDeposit: "No minimum", lockin: "None" },
  { country: "Germany", bank: "Netbank", url: "https://www.netbank.de/savings/", rate: "0.01% - 3.50%", minDeposit: "No minimum", lockin: "None" },
  { country: "Germany", bank: "Wüstenrot Bank", url: "https://www.wuestenrot-bank.de/savings/", rate: "0.01% - 3.50%", minDeposit: "No minimum", lockin: "None" },
  { country: "Germany", bank: "Bausparkasse Schwäbisch Hall", url: "https://www.schwaebisch-hall.de/savings/", rate: "0.01% - 3.50%", minDeposit: "No minimum", lockin: "None" },

  // France
  { country: "France", bank: "BNP Paribas", url: "https://www.bnpparibas.fr/epargne/", rate: "0.01% - 3.00%", minDeposit: "No minimum", lockin: "None" },
  { country: "France", bank: "Crédit Agricole", url: "https://www.credit-agricole.fr/epargne/", rate: "0.01% - 3.00%", minDeposit: "No minimum", lockin: "None" },
  { country: "France", bank: "Société Générale", url: "https://www.societegenerale.fr/epargne/", rate: "0.01% - 3.00%", minDeposit: "No minimum", lockin: "None" },
  { country: "France", bank: "Crédit Mutuel", url: "https://www.creditmutuel.fr/epargne/", rate: "0.01% - 3.00%", minDeposit: "No minimum", lockin: "None" },
  { country: "France", bank: "Caisse d'Épargne", url: "https://www.caisse-epargne.fr/epargne/", rate: "0.01% - 3.00%", minDeposit: "No minimum", lockin: "None" },
  { country: "France", bank: "Banque Populaire", url: "https://www.banquepopulaire.fr/epargne/", rate: "0.01% - 3.00%", minDeposit: "No minimum", lockin: "None" },
  { country: "France", bank: "LCL", url: "https://www.lcl.fr/epargne/", rate: "0.01% - 3.00%", minDeposit: "No minimum", lockin: "None" },
  { country: "France", bank: "Crédit du Nord", url: "https://www.credit-du-nord.fr/epargne/", rate: "0.01% - 3.00%", minDeposit: "No minimum", lockin: "None" },
  { country: "France", bank: "HSBC France", url: "https://www.hsbc.fr/epargne/", rate: "0.01% - 3.00%", minDeposit: "No minimum", lockin: "None" },
  { country: "France", bank: "Crédit Lyonnais", url: "https://www.lcl.fr/epargne/", rate: "0.01% - 3.00%", minDeposit: "No minimum", lockin: "None" },
  { country: "France", bank: "Banque Postale", url: "https://www.lapostebank.fr/epargne/", rate: "0.01% - 3.00%", minDeposit: "No minimum", lockin: "None" },
  { country: "France", bank: "ING Direct France", url: "https://www.ingdirect.fr/epargne/", rate: "0.01% - 3.00%", minDeposit: "No minimum", lockin: "None" },
  { country: "France", bank: "Boursorama Banque", url: "https://www.boursorama.com/epargne/", rate: "0.01% - 3.00%", minDeposit: "No minimum", lockin: "None" },
  { country: "France", bank: "Hello Bank!", url: "https://www.hellobank.fr/epargne/", rate: "0.01% - 3.00%", minDeposit: "No minimum", lockin: "None" },
  { country: "France", bank: "Fortuneo", url: "https://www.fortuneo.fr/epargne/", rate: "0.01% - 3.00%", minDeposit: "No minimum", lockin: "None" },
  { country: "France", bank: "BforBank", url: "https://www.bforbank.com/epargne/", rate: "0.01% - 3.00%", minDeposit: "No minimum", lockin: "None" },
  { country: "France", bank: "Monabanq", url: "https://www.monabanq.com/epargne/", rate: "0.01% - 3.00%", minDeposit: "No minimum", lockin: "None" },
  { country: "France", bank: "Orange Bank", url: "https://www.orange-bank.fr/epargne/", rate: "0.01% - 3.00%", minDeposit: "No minimum", lockin: "None" },
  { country: "France", bank: "N26 France", url: "https://n26.com/fr-fr/epargne/", rate: "0.01% - 3.00%", minDeposit: "No minimum", lockin: "None" },
  { country: "France", bank: "Revolut France", url: "https://www.revolut.com/fr-fr/epargne/", rate: "0.01% - 3.00%", minDeposit: "No minimum", lockin: "None" },
  { country: "France", bank: "Lydia", url: "https://lydia.com/epargne/", rate: "0.01% - 3.00%", minDeposit: "No minimum", lockin: "None" },
  { country: "France", bank: "Qonto", url: "https://qonto.com/fr/epargne/", rate: "0.01% - 3.00%", minDeposit: "No minimum", lockin: "None" },
  { country: "France", bank: "Shine", url: "https://shine.fr/epargne/", rate: "0.01% - 3.00%", minDeposit: "No minimum", lockin: "None" },
  { country: "France", bank: "Anytime", url: "https://anytime.fr/epargne/", rate: "0.01% - 3.00%", minDeposit: "No minimum", lockin: "None" },

  // Italy
  { country: "Italy", bank: "UniCredit", url: "https://www.unicredit.it/risparmio/", rate: "0.01% - 3.00%", minDeposit: "No minimum", lockin: "None" },
  { country: "Italy", bank: "Intesa Sanpaolo", url: "https://www.intesasanpaolo.com/risparmio/", rate: "0.01% - 3.00%", minDeposit: "No minimum", lockin: "None" },
  { country: "Italy", bank: "Banca Monte dei Paschi di Siena", url: "https://www.mps.it/risparmio/", rate: "0.01% - 3.00%", minDeposit: "No minimum", lockin: "None" },
  { country: "Italy", bank: "Banco BPM", url: "https://www.banco-bpm.it/risparmio/", rate: "0.01% - 3.00%", minDeposit: "No minimum", lockin: "None" },
  { country: "Italy", bank: "Banca Popolare di Sondrio", url: "https://www.popso.it/risparmio/", rate: "0.01% - 3.00%", minDeposit: "No minimum", lockin: "None" },
  { country: "Italy", bank: "Credito Emiliano", url: "https://www.creval.it/risparmio/", rate: "0.01% - 3.00%", minDeposit: "No minimum", lockin: "None" },
  { country: "Italy", bank: "Banca Carige", url: "https://www.carige.it/risparmio/", rate: "0.01% - 3.00%", minDeposit: "No minimum", lockin: "None" },
  { country: "Italy", bank: "Banca Popolare di Vicenza", url: "https://www.bancapopolarevicenza.it/risparmio/", rate: "0.01% - 3.00%", minDeposit: "No minimum", lockin: "None" },
  { country: "Italy", bank: "Banca Popolare di Milano", url: "https://www.popolare.it/risparmio/", rate: "0.01% - 3.00%", minDeposit: "No minimum", lockin: "None" },
  { country: "Italy", bank: "Banca Popolare di Bergamo", url: "https://www.popolarebg.it/risparmio/", rate: "0.01% - 3.00%", minDeposit: "No minimum", lockin: "None" },
  { country: "Italy", bank: "Banca Popolare di Verona", url: "https://www.popolareverona.it/risparmio/", rate: "0.01% - 3.00%", minDeposit: "No minimum", lockin: "None" },
  { country: "Italy", bank: "Banca Popolare di Novara", url: "https://www.popolare-novara.it/risparmio/", rate: "0.01% - 3.00%", minDeposit: "No minimum", lockin: "None" },
  { country: "Italy", bank: "Banca Popolare di Sondrio", url: "https://www.popso.it/risparmio/", rate: "0.01% - 3.00%", minDeposit: "No minimum", lockin: "None" },
  { country: "Italy", bank: "Banca Popolare di Lodi", url: "https://www.popolarelodi.it/risparmio/", rate: "0.01% - 3.00%", minDeposit: "No minimum", lockin: "None" },
  { country: "Italy", bank: "Banca Popolare di Puglia e Basilicata", url: "https://www.popolarepuglia.it/risparmio/", rate: "0.01% - 3.00%", minDeposit: "No minimum", lockin: "None" },
  { country: "Italy", bank: "Banca Popolare di Bari", url: "https://www.popolarebari.it/risparmio/", rate: "0.01% - 3.00%", minDeposit: "No minimum", lockin: "None" },
  { country: "Italy", bank: "Banca Popolare di Sondrio", url: "https://www.popso.it/risparmio/", rate: "0.01% - 3.00%", minDeposit: "No minimum", lockin: "None" },
  { country: "Italy", bank: "Banca Popolare di Milano", url: "https://www.popolare.it/risparmio/", rate: "0.01% - 3.00%", minDeposit: "No minimum", lockin: "None" },
  { country: "Italy", bank: "Banca Popolare di Bergamo", url: "https://www.popolarebg.it/risparmio/", rate: "0.01% - 3.00%", minDeposit: "No minimum", lockin: "None" },
  { country: "Italy", bank: "Banca Popolare di Verona", url: "https://www.popolareverona.it/risparmio/", rate: "0.01% - 3.00%", minDeposit: "No minimum", lockin: "None" },
  { country: "Italy", bank: "Banca Popolare di Novara", url: "https://www.popolare-novara.it/risparmio/", rate: "0.01% - 3.00%", minDeposit: "No minimum", lockin: "None" },
  { country: "Italy", bank: "Banca Popolare di Sondrio", url: "https://www.popso.it/risparmio/", rate: "0.01% - 3.00%", minDeposit: "No minimum", lockin: "None" },
  { country: "Italy", bank: "Banca Popolare di Lodi", url: "https://www.popolarelodi.it/risparmio/", rate: "0.01% - 3.00%", minDeposit: "No minimum", lockin: "None" },
  { country: "Italy", bank: "Banca Popolare di Puglia e Basilicata", url: "https://www.popolarepuglia.it/risparmio/", rate: "0.01% - 3.00%", minDeposit: "No minimum", lockin: "None" },
  { country: "Italy", bank: "Banca Popolare di Bari", url: "https://www.popolarebari.it/risparmio/", rate: "0.01% - 3.00%", minDeposit: "No minimum", lockin: "None" },

  // Spain
  { country: "Spain", bank: "Santander España", url: "https://www.santander.es/ahorro/", rate: "0.01% - 3.00%", minDeposit: "No minimum", lockin: "None" },
  { country: "Spain", bank: "BBVA España", url: "https://www.bbva.es/ahorro/", rate: "0.01% - 3.00%", minDeposit: "No minimum", lockin: "None" },
  { country: "Spain", bank: "CaixaBank", url: "https://www.caixabank.es/ahorro/", rate: "0.01% - 3.00%", minDeposit: "No minimum", lockin: "None" },
  { country: "Spain", bank: "Bankia", url: "https://www.bankia.es/ahorro/", rate: "0.01% - 3.00%", minDeposit: "No minimum", lockin: "None" },
  { country: "Spain", bank: "Sabadell", url: "https://www.bancsabadell.com/ahorro/", rate: "0.01% - 3.00%", minDeposit: "No minimum", lockin: "None" },
  { country: "Spain", bank: "Bankinter", url: "https://www.bankinter.com/ahorro/", rate: "0.01% - 3.00%", minDeposit: "No minimum", lockin: "None" },
  { country: "Spain", bank: "ING España", url: "https://www.ing.es/ahorro/", rate: "0.01% - 3.00%", minDeposit: "No minimum", lockin: "None" },
  { country: "Spain", bank: "Openbank", url: "https://www.openbank.es/ahorro/", rate: "0.01% - 3.00%", minDeposit: "No minimum", lockin: "None" },
  { country: "Spain", bank: "EVO Banco", url: "https://www.evobanco.com/ahorro/", rate: "0.01% - 3.00%", minDeposit: "No minimum", lockin: "None" },
  { country: "Spain", bank: "N26 España", url: "https://n26.com/es-es/ahorro/", rate: "0.01% - 3.00%", minDeposit: "No minimum", lockin: "None" },
  { country: "Spain", bank: "Revolut España", url: "https://www.revolut.com/es-es/ahorro/", rate: "0.01% - 3.00%", minDeposit: "No minimum", lockin: "None" },
  { country: "Spain", bank: "Bnext", url: "https://bnext.es/ahorro/", rate: "0.01% - 3.00%", minDeposit: "No minimum", lockin: "None" },
  { country: "Spain", bank: "ImaginBank", url: "https://www.imaginbank.com/ahorro/", rate: "0.01% - 3.00%", minDeposit: "No minimum", lockin: "None" },
  { country: "Spain", bank: "Self Bank", url: "https://www.selfbank.es/ahorro/", rate: "0.01% - 3.00%", minDeposit: "No minimum", lockin: "None" },
  { country: "Spain", bank: "WiZink", url: "https://www.wizink.es/ahorro/", rate: "0.01% - 3.00%", minDeposit: "No minimum", lockin: "None" },
  { country: "Spain", bank: "Pibank", url: "https://www.pibank.es/ahorro/", rate: "0.01% - 3.00%", minDeposit: "No minimum", lockin: "None" },
  { country: "Spain", bank: "Fintonic", url: "https://www.fintonic.com/ahorro/", rate: "0.01% - 3.00%", minDeposit: "No minimum", lockin: "None" },
  { country: "Spain", bank: "Targo", url: "https://www.targo.es/ahorro/", rate: "0.01% - 3.00%", minDeposit: "No minimum", lockin: "None" },
  { country: "Spain", bank: "Bunq España", url: "https://www.bunq.com/es/ahorro/", rate: "0.01% - 3.00%", minDeposit: "No minimum", lockin: "None" },
  { country: "Spain", bank: "Klarna España", url: "https://www.klarna.com/es/ahorro/", rate: "0.01% - 3.00%", minDeposit: "No minimum", lockin: "None" },
  { country: "Spain", bank: "Vivid Money España", url: "https://www.vivid.money/es/ahorro/", rate: "0.01% - 3.00%", minDeposit: "No minimum", lockin: "None" },
  { country: "Spain", bank: "Monese España", url: "https://monese.com/es/ahorro/", rate: "0.01% - 3.00%", minDeposit: "No minimum", lockin: "None" },
  { country: "Spain", bank: "Wise España", url: "https://wise.com/es/ahorro/", rate: "0.01% - 3.00%", minDeposit: "No minimum", lockin: "None" },
  { country: "Spain", bank: "Curve España", url: "https://www.curve.com/es/ahorro/", rate: "0.01% - 3.00%", minDeposit: "No minimum", lockin: "None" },

  // Netherlands
  { country: "Netherlands", bank: "ING Nederland", url: "https://www.ing.nl/sparen/", rate: "0.01% - 3.00%", minDeposit: "No minimum", lockin: "None" },
  { country: "Netherlands", bank: "ABN AMRO", url: "https://www.abnamro.nl/sparen/", rate: "0.01% - 3.00%", minDeposit: "No minimum", lockin: "None" },
  { country: "Netherlands", bank: "Rabobank", url: "https://www.rabobank.nl/sparen/", rate: "0.01% - 3.00%", minDeposit: "No minimum", lockin: "None" },
  { country: "Netherlands", bank: "SNS Bank", url: "https://www.snsbank.nl/sparen/", rate: "0.01% - 3.00%", minDeposit: "No minimum", lockin: "None" },
  { country: "Netherlands", bank: "ASN Bank", url: "https://www.asnbank.nl/sparen/", rate: "0.01% - 3.00%", minDeposit: "No minimum", lockin: "None" },
  { country: "Netherlands", bank: "Triodos Bank", url: "https://www.triodos.nl/sparen/", rate: "0.01% - 3.00%", minDeposit: "No minimum", lockin: "None" },
  { country: "Netherlands", bank: "Bunq", url: "https://www.bunq.com/nl/sparen/", rate: "0.01% - 3.00%", minDeposit: "No minimum", lockin: "None" },
  { country: "Netherlands", bank: "N26 Nederland", url: "https://n26.com/nl-nl/sparen/", rate: "0.01% - 3.00%", minDeposit: "No minimum", lockin: "None" },
  { country: "Netherlands", bank: "Revolut Nederland", url: "https://www.revolut.com/nl-nl/sparen/", rate: "0.01% - 3.00%", minDeposit: "No minimum", lockin: "None" },
  { country: "Netherlands", bank: "Wise Nederland", url: "https://wise.com/nl/sparen/", rate: "0.01% - 3.00%", minDeposit: "No minimum", lockin: "None" },
  { country: "Netherlands", bank: "Monese Nederland", url: "https://monese.com/nl/sparen/", rate: "0.01% - 3.00%", minDeposit: "No minimum", lockin: "None" },
  { country: "Netherlands", bank: "Vivid Money Nederland", url: "https://www.vivid.money/nl/sparen/", rate: "0.01% - 3.00%", minDeposit: "No minimum", lockin: "None" },
  { country: "Netherlands", bank: "Klarna Nederland", url: "https://www.klarna.com/nl/sparen/", rate: "0.01% - 3.00%", minDeposit: "No minimum", lockin: "None" },
  { country: "Netherlands", bank: "Curve Nederland", url: "https://www.curve.com/nl/sparen/", rate: "0.01% - 3.00%", minDeposit: "No minimum", lockin: "None" },
  { country: "Netherlands", bank: "Tinkoff Nederland", url: "https://www.tinkoff.nl/sparen/", rate: "0.01% - 3.00%", minDeposit: "No minimum", lockin: "None" },
  { country: "Netherlands", bank: "Nubank Nederland", url: "https://nubank.com/nl/sparen/", rate: "0.01% - 3.00%", minDeposit: "No minimum", lockin: "None" },
  { country: "Netherlands", bank: "Chime Nederland", url: "https://www.chime.com/nl/sparen/", rate: "0.01% - 3.00%", minDeposit: "No minimum", lockin: "None" },
  { country: "Netherlands", bank: "Acorns Nederland", url: "https://www.acorns.com/nl/sparen/", rate: "0.01% - 3.00%", minDeposit: "No minimum", lockin: "None" },
  { country: "Netherlands", bank: "Stash Nederland", url: "https://www.stash.com/nl/sparen/", rate: "0.01% - 3.00%", minDeposit: "No minimum", lockin: "None" },
  { country: "Netherlands", bank: "Robinhood Nederland", url: "https://robinhood.com/nl/sparen/", rate: "0.01% - 3.00%", minDeposit: "No minimum", lockin: "None" },
  { country: "Netherlands", bank: "Wealthfront Nederland", url: "https://www.wealthfront.com/nl/sparen/", rate: "0.01% - 3.00%", minDeposit: "No minimum", lockin: "None" },
  { country: "Netherlands", bank: "Betterment Nederland", url: "https://www.betterment.com/nl/sparen/", rate: "0.01% - 3.00%", minDeposit: "No minimum", lockin: "None" },
  { country: "Netherlands", bank: "SoFi Nederland", url: "https://www.sofi.com/nl/sparen/", rate: "0.01% - 3.00%", minDeposit: "No minimum", lockin: "None" },
  { country: "Netherlands", bank: "Ally Nederland", url: "https://www.ally.com/nl/sparen/", rate: "0.01% - 3.00%", minDeposit: "No minimum", lockin: "None" },
  { country: "Netherlands", bank: "Marcus Nederland", url: "https://www.marcus.com/nl/sparen/", rate: "0.01% - 3.00%", minDeposit: "No minimum", lockin: "None" },

  // Singapore
  { country: "Singapore", bank: "DBS Bank", url: "https://www.dbs.com.sg/personal/savings/", rate: "0.01% - 3.50%", minDeposit: "No minimum", lockin: "None" },
  { country: "Singapore", bank: "OCBC Bank", url: "https://www.ocbc.com/personal-banking/savings-accounts", rate: "0.01% - 3.50%", minDeposit: "No minimum", lockin: "None" },
  { country: "Singapore", bank: "UOB", url: "https://www.uob.com.sg/personal/savings/", rate: "0.01% - 3.50%", minDeposit: "No minimum", lockin: "None" },
  { country: "Singapore", bank: "Standard Chartered Singapore", url: "https://www.sc.com/sg/savings/", rate: "0.01% - 3.50%", minDeposit: "No minimum", lockin: "None" },
  { country: "Singapore", bank: "Citibank Singapore", url: "https://www.citibank.com.sg/savings/", rate: "0.01% - 3.50%", minDeposit: "No minimum", lockin: "None" },
  { country: "Singapore", bank: "HSBC Singapore", url: "https://www.hsbc.com.sg/savings/", rate: "0.01% - 3.50%", minDeposit: "No minimum", lockin: "None" },
  { country: "Singapore", bank: "Maybank Singapore", url: "https://www.maybank2u.com.sg/savings/", rate: "0.01% - 3.50%", minDeposit: "No minimum", lockin: "None" },
  { country: "Singapore", bank: "CIMB Singapore", url: "https://www.cimb.com.sg/savings/", rate: "0.01% - 3.50%", minDeposit: "No minimum", lockin: "None" },
  { country: "Singapore", bank: "RHB Singapore", url: "https://www.rhbgroup.com.sg/savings/", rate: "0.01% - 3.50%", minDeposit: "No minimum", lockin: "None" },
  { country: "Singapore", bank: "Bank of China Singapore", url: "https://www.bankofchina.com/sg/savings/", rate: "0.01% - 3.50%", minDeposit: "No minimum", lockin: "None" },
  { country: "Singapore", bank: "ICBC Singapore", url: "https://www.icbc.com.sg/savings/", rate: "0.01% - 3.50%", minDeposit: "No minimum", lockin: "None" },
  { country: "Singapore", bank: "Bank of Tokyo-Mitsubishi UFJ", url: "https://www.bk.mufg.jp/sg/savings/", rate: "0.01% - 3.50%", minDeposit: "No minimum", lockin: "None" },
  { country: "Singapore", bank: "Sumitomo Mitsui Banking Corporation", url: "https://www.smbc.co.jp/sg/savings/", rate: "0.01% - 3.50%", minDeposit: "No minimum", lockin: "None" },
  { country: "Singapore", bank: "Mizuho Bank Singapore", url: "https://www.mizuhobank.co.jp/sg/savings/", rate: "0.01% - 3.50%", minDeposit: "No minimum", lockin: "None" },
  { country: "Singapore", bank: "Deutsche Bank Singapore", url: "https://www.db.com/sg/savings/", rate: "0.01% - 3.50%", minDeposit: "No minimum", lockin: "None" },
  { country: "Singapore", bank: "BNP Paribas Singapore", url: "https://www.bnpparibas.com/sg/savings/", rate: "0.01% - 3.50%", minDeposit: "No minimum", lockin: "None" },
  { country: "Singapore", bank: "Société Générale Singapore", url: "https://www.societegenerale.com/sg/savings/", rate: "0.01% - 3.50%", minDeposit: "No minimum", lockin: "None" },
  { country: "Singapore", bank: "Crédit Agricole Singapore", url: "https://www.credit-agricole.com/sg/savings/", rate: "0.01% - 3.50%", minDeposit: "No minimum", lockin: "None" },
  { country: "Singapore", bank: "ING Singapore", url: "https://www.ing.com/sg/savings/", rate: "0.01% - 3.50%", minDeposit: "No minimum", lockin: "None" },
  { country: "Singapore", bank: "Rabobank Singapore", url: "https://www.rabobank.com/sg/savings/", rate: "0.01% - 3.50%", minDeposit: "No minimum", lockin: "None" },
  { country: "Singapore", bank: "ABN AMRO Singapore", url: "https://www.abnamro.com/sg/savings/", rate: "0.01% - 3.50%", minDeposit: "No minimum", lockin: "None" },
  { country: "Singapore", bank: "Revolut Singapore", url: "https://www.revolut.com/sg/savings/", rate: "0.01% - 3.50%", minDeposit: "No minimum", lockin: "None" },
  { country: "Singapore", bank: "N26 Singapore", url: "https://n26.com/sg/savings/", rate: "0.01% - 3.50%", minDeposit: "No minimum", lockin: "None" },
  { country: "Singapore", bank: "Wise Singapore", url: "https://wise.com/sg/savings/", rate: "0.01% - 3.50%", minDeposit: "No minimum", lockin: "None" },
  { country: "Singapore", bank: "Monese Singapore", url: "https://monese.com/sg/savings/", rate: "0.01% - 3.50%", minDeposit: "No minimum", lockin: "None" },
  { country: "Singapore", bank: "Vivid Money Singapore", url: "https://www.vivid.money/sg/savings/", rate: "0.01% - 3.50%", minDeposit: "No minimum", lockin: "None" },
  { country: "Singapore", bank: "Klarna Singapore", url: "https://www.klarna.com/sg/savings/", rate: "0.01% - 3.50%", minDeposit: "No minimum", lockin: "None" },
  { country: "Singapore", bank: "Curve Singapore", url: "https://www.curve.com/sg/savings/", rate: "0.01% - 3.50%", minDeposit: "No minimum", lockin: "None" },
  { country: "Singapore", bank: "Tinkoff Singapore", url: "https://www.tinkoff.sg/savings/", rate: "0.01% - 3.50%", minDeposit: "No minimum", lockin: "None" },
  { country: "Singapore", bank: "Nubank Singapore", url: "https://nubank.com/sg/savings/", rate: "0.01% - 3.50%", minDeposit: "No minimum", lockin: "None" },
  { country: "Singapore", bank: "Chime Singapore", url: "https://www.chime.com/sg/savings/", rate: "0.01% - 3.50%", minDeposit: "No minimum", lockin: "None" },
  { country: "Singapore", bank: "Acorns Singapore", url: "https://www.acorns.com/sg/savings/", rate: "0.01% - 3.50%", minDeposit: "No minimum", lockin: "None" },
  { country: "Singapore", bank: "Stash Singapore", url: "https://www.stash.com/sg/savings/", rate: "0.01% - 3.50%", minDeposit: "No minimum", lockin: "None" },
  { country: "Singapore", bank: "Robinhood Singapore", url: "https://robinhood.com/sg/savings/", rate: "0.01% - 3.50%", minDeposit: "No minimum", lockin: "None" },
  { country: "Singapore", bank: "Wealthfront Singapore", url: "https://www.wealthfront.com/sg/savings/", rate: "0.01% - 3.50%", minDeposit: "No minimum", lockin: "None" },
  { country: "Singapore", bank: "Betterment Singapore", url: "https://www.betterment.com/sg/savings/", rate: "0.01% - 3.50%", minDeposit: "No minimum", lockin: "None" },
  { country: "Singapore", bank: "SoFi Singapore", url: "https://www.sofi.com/sg/savings/", rate: "0.01% - 3.50%", minDeposit: "No minimum", lockin: "None" },
  { country: "Singapore", bank: "Ally Singapore", url: "https://www.ally.com/sg/savings/", rate: "0.01% - 3.50%", minDeposit: "No minimum", lockin: "None" },
  { country: "Singapore", bank: "Marcus Singapore", url: "https://www.marcus.com/sg/savings/", rate: "0.01% - 3.50%", minDeposit: "No minimum", lockin: "None" },

  // Hong Kong
  { country: "Hong Kong", bank: "HSBC Hong Kong", url: "https://www.hsbc.com.hk/savings/", rate: "0.01% - 3.50%", minDeposit: "No minimum", lockin: "None" },
  { country: "Hong Kong", bank: "Bank of China Hong Kong", url: "https://www.bochk.com/savings/", rate: "0.01% - 3.50%", minDeposit: "No minimum", lockin: "None" },
  { country: "Hong Kong", bank: "Standard Chartered Hong Kong", url: "https://www.sc.com/hk/savings/", rate: "0.01% - 3.50%", minDeposit: "No minimum", lockin: "None" },
  { country: "Hong Kong", bank: "Hang Seng Bank", url: "https://www.hangseng.com/savings/", rate: "0.01% - 3.50%", minDeposit: "No minimum", lockin: "None" },
  { country: "Hong Kong", bank: "Bank of East Asia", url: "https://www.hkbea.com/savings/", rate: "0.01% - 3.50%", minDeposit: "No minimum", lockin: "None" },
  { country: "Hong Kong", bank: "Dah Sing Bank", url: "https://www.dahsing.com/savings/", rate: "0.01% - 3.50%", minDeposit: "No minimum", lockin: "None" },
  { country: "Hong Kong", bank: "Wing Lung Bank", url: "https://www.winglungbank.com/savings/", rate: "0.01% - 3.50%", minDeposit: "No minimum", lockin: "None" },
  { country: "Hong Kong", bank: "Shanghai Commercial Bank", url: "https://www.shacombank.com/savings/", rate: "0.01% - 3.50%", minDeposit: "No minimum", lockin: "None" },
  { country: "Hong Kong", bank: "Chong Hing Bank", url: "https://www.chbank.com/savings/", rate: "0.01% - 3.50%", minDeposit: "No minimum", lockin: "None" },
  { country: "Hong Kong", bank: "China Construction Bank Hong Kong", url: "https://www.asia.ccb.com/savings/", rate: "0.01% - 3.50%", minDeposit: "No minimum", lockin: "None" },
  { country: "Hong Kong", bank: "Industrial and Commercial Bank of China Hong Kong", url: "https://www.icbc.com.hk/savings/", rate: "0.01% - 3.50%", minDeposit: "No minimum", lockin: "None" },
  { country: "Hong Kong", bank: "Agricultural Bank of China Hong Kong", url: "https://www.abchina.com/hk/savings/", rate: "0.01% - 3.50%", minDeposit: "No minimum", lockin: "None" },
  { country: "Hong Kong", bank: "Bank of Communications Hong Kong", url: "https://www.bankcomm.com/hk/savings/", rate: "0.01% - 3.50%", minDeposit: "No minimum", lockin: "None" },
  { country: "Hong Kong", bank: "China Merchants Bank Hong Kong", url: "https://www.cmbchina.com/hk/savings/", rate: "0.01% - 3.50%", minDeposit: "No minimum", lockin: "None" },
  { country: "Hong Kong", bank: "Ping An Bank Hong Kong", url: "https://www.pingan.com/hk/savings/", rate: "0.01% - 3.50%", minDeposit: "No minimum", lockin: "None" },
  { country: "Hong Kong", bank: "China Minsheng Bank Hong Kong", url: "https://www.cmbc.com.cn/hk/savings/", rate: "0.01% - 3.50%", minDeposit: "No minimum", lockin: "None" },
  { country: "Hong Kong", bank: "China Everbright Bank Hong Kong", url: "https://www.cebbank.com/hk/savings/", rate: "0.01% - 3.50%", minDeposit: "No minimum", lockin: "None" },
  { country: "Hong Kong", bank: "China CITIC Bank Hong Kong", url: "https://www.citicbank.com/hk/savings/", rate: "0.01% - 3.50%", minDeposit: "No minimum", lockin: "None" },
  { country: "Hong Kong", bank: "China Guangfa Bank Hong Kong", url: "https://www.gdb.com.cn/hk/savings/", rate: "0.01% - 3.50%", minDeposit: "No minimum", lockin: "None" },
  { country: "Hong Kong", bank: "China Huarong Bank Hong Kong", url: "https://www.huarong.com.cn/hk/savings/", rate: "0.01% - 3.50%", minDeposit: "No minimum", lockin: "None" },
  { country: "Hong Kong", bank: "China Cinda Bank Hong Kong", url: "https://www.cinda.com.cn/hk/savings/", rate: "0.01% - 3.50%", minDeposit: "No minimum", lockin: "None" },
  { country: "Hong Kong", bank: "China Orient Bank Hong Kong", url: "https://www.coamc.com.cn/hk/savings/", rate: "0.01% - 3.50%", minDeposit: "No minimum", lockin: "None" },
  { country: "Hong Kong", bank: "China Great Wall Bank Hong Kong", url: "https://www.gwamcc.com/hk/savings/", rate: "0.01% - 3.50%", minDeposit: "No minimum", lockin: "None" },
  { country: "Hong Kong", bank: "China Galaxy Bank Hong Kong", url: "https://www.chinagalaxy.com/hk/savings/", rate: "0.01% - 3.50%", minDeposit: "No minimum", lockin: "None" },
  { country: "Hong Kong", bank: "China Securities Bank Hong Kong", url: "https://www.csc.com.cn/hk/savings/", rate: "0.01% - 3.50%", minDeposit: "No minimum", lockin: "None" },
  { country: "Hong Kong", bank: "China Investment Bank Hong Kong", url: "https://www.cic.com.cn/hk/savings/", rate: "0.01% - 3.50%", minDeposit: "No minimum", lockin: "None" },
  { country: "Hong Kong", bank: "China Development Bank Hong Kong", url: "https://www.cdb.com.cn/hk/savings/", rate: "0.01% - 3.50%", minDeposit: "No minimum", lockin: "None" },
  { country: "Hong Kong", bank: "China Export-Import Bank Hong Kong", url: "https://www.eximbank.gov.cn/hk/savings/", rate: "0.01% - 3.50%", minDeposit: "No minimum", lockin: "None" },
  { country: "Hong Kong", bank: "China Agricultural Development Bank Hong Kong", url: "https://www.adbc.com.cn/hk/savings/", rate: "0.01% - 3.50%", minDeposit: "No minimum", lockin: "None" },
  { country: "Hong Kong", bank: "China National Development Bank Hong Kong", url: "https://www.cdb.com.cn/hk/savings/", rate: "0.01% - 3.50%", minDeposit: "No minimum", lockin: "None" },

  // India
  { country: "India", bank: "State Bank of India", url: "https://www.sbi.co.in/web/personal-banking/accounts/savings-account", rate: "2.70% - 3.00%", minDeposit: "No minimum", lockin: "None" },
  { country: "India", bank: "HDFC Bank", url: "https://www.hdfcbank.com/personal/savings-accounts", rate: "2.70% - 3.00%", minDeposit: "No minimum", lockin: "None" },
  { country: "India", bank: "ICICI Bank", url: "https://www.icicibank.com/savings-account", rate: "2.70% - 3.00%", minDeposit: "No minimum", lockin: "None" },

  // Japan
  { country: "Japan", bank: "MUFG Bank", url: "https://www.bk.mufg.jp/english/", rate: "0.001% - 0.01%", minDeposit: "No minimum", lockin: "None" },
  { country: "Japan", bank: "Sumitomo Mitsui Banking Corporation", url: "https://www.smbc.co.jp/english/", rate: "0.001% - 0.01%", minDeposit: "No minimum", lockin: "None" },
  { country: "Japan", bank: "Mizuho Bank", url: "https://www.mizuhobank.co.jp/english/", rate: "0.001% - 0.01%", minDeposit: "No minimum", lockin: "None" },

  // South Korea
  { country: "South Korea", bank: "Shinhan Bank", url: "https://www.shinhan.com/eng/", rate: "0.01% - 3.00%", minDeposit: "No minimum", lockin: "None" },
  { country: "South Korea", bank: "KB Kookmin Bank", url: "https://www.kbstar.com/eng/", rate: "0.01% - 3.00%", minDeposit: "No minimum", lockin: "None" },
  { country: "South Korea", bank: "Woori Bank", url: "https://www.wooribank.com/eng/", rate: "0.01% - 3.00%", minDeposit: "No minimum", lockin: "None" },

  // China
  { country: "China", bank: "Industrial and Commercial Bank of China", url: "https://www.icbc.com.cn/icbc/", rate: "0.35% - 1.50%", minDeposit: "No minimum", lockin: "None" },
  { country: "China", bank: "China Construction Bank", url: "https://www.ccb.com/", rate: "0.35% - 1.50%", minDeposit: "No minimum", lockin: "None" },
  { country: "China", bank: "Bank of China", url: "https://www.boc.cn/", rate: "0.35% - 1.50%", minDeposit: "No minimum", lockin: "None" },

  // Brazil
  { country: "Brazil", bank: "Banco do Brasil", url: "https://www.bb.com.br/", rate: "0.50% - 8.00%", minDeposit: "No minimum", lockin: "None" },
  { country: "Brazil", bank: "Itaú Unibanco", url: "https://www.itau.com.br/", rate: "0.50% - 8.00%", minDeposit: "No minimum", lockin: "None" },
  { country: "Brazil", bank: "Bradesco", url: "https://www.bradesco.com.br/", rate: "0.50% - 8.00%", minDeposit: "No minimum", lockin: "None" },

  // Mexico
  { country: "Mexico", bank: "Banamex", url: "https://www.banamex.com/", rate: "0.01% - 4.00%", minDeposit: "No minimum", lockin: "None" },
  { country: "Mexico", bank: "Banorte", url: "https://www.banorte.com/", rate: "0.01% - 4.00%", minDeposit: "No minimum", lockin: "None" },
  { country: "Mexico", bank: "BBVA México", url: "https://www.bbva.mx/", rate: "0.01% - 4.00%", minDeposit: "No minimum", lockin: "None" },

  // South Africa
  { country: "South Africa", bank: "Standard Bank", url: "https://www.standardbank.co.za/", rate: "0.01% - 7.00%", minDeposit: "No minimum", lockin: "None" },
  { country: "South Africa", bank: "First National Bank", url: "https://www.fnb.co.za/", rate: "0.01% - 7.00%", minDeposit: "No minimum", lockin: "None" },
  { country: "South Africa", bank: "Nedbank", url: "https://www.nedbank.co.za/", rate: "0.01% - 7.00%", minDeposit: "No minimum", lockin: "None" },

  // Nigeria
  { country: "Nigeria", bank: "First Bank of Nigeria", url: "https://www.firstbanknigeria.com/", rate: "0.01% - 5.00%", minDeposit: "No minimum", lockin: "None" },
  { country: "Nigeria", bank: "Zenith Bank", url: "https://www.zenithbank.com/", rate: "0.01% - 5.00%", minDeposit: "No minimum", lockin: "None" },
  { country: "Nigeria", bank: "Guaranty Trust Bank", url: "https://www.gtbank.com/", rate: "0.01% - 5.00%", minDeposit: "No minimum", lockin: "None" },

  // Egypt
  { country: "Egypt", bank: "National Bank of Egypt", url: "https://www.nbe.com.eg/", rate: "0.01% - 15.00%", minDeposit: "No minimum", lockin: "None" },
  { country: "Egypt", bank: "Commercial International Bank", url: "https://www.cibeg.com/", rate: "0.01% - 15.00%", minDeposit: "No minimum", lockin: "None" },
  { country: "Egypt", bank: "Banque Misr", url: "https://www.banquemisr.com/", rate: "0.01% - 15.00%", minDeposit: "No minimum", lockin: "None" },

  // Turkey
  { country: "Turkey", bank: "Garanti BBVA", url: "https://www.garantibbva.com.tr/", rate: "0.01% - 40.00%", minDeposit: "No minimum", lockin: "None" },
  { country: "Turkey", bank: "İş Bank", url: "https://www.isbank.com.tr/", rate: "0.01% - 40.00%", minDeposit: "No minimum", lockin: "None" },
  { country: "Turkey", bank: "Yapı Kredi", url: "https://www.yapikredibank.com.tr/", rate: "0.01% - 40.00%", minDeposit: "No minimum", lockin: "None" },

  // Malaysia
  { country: "Malaysia", bank: "Maybank", url: "https://www.maybank.com/", rate: "0.01% - 3.50%", minDeposit: "No minimum", lockin: "None" },
  { country: "Malaysia", bank: "CIMB Bank", url: "https://www.cimb.com.my/", rate: "0.01% - 3.50%", minDeposit: "No minimum", lockin: "None" },
  { country: "Malaysia", bank: "Public Bank", url: "https://www.publicbank.com.my/", rate: "0.01% - 3.50%", minDeposit: "No minimum", lockin: "None" },

  // Thailand
  { country: "Thailand", bank: "Bangkok Bank", url: "https://www.bangkokbank.com/", rate: "0.01% - 2.50%", minDeposit: "No minimum", lockin: "None" },
  { country: "Thailand", bank: "Siam Commercial Bank", url: "https://www.scb.co.th/", rate: "0.01% - 2.50%", minDeposit: "No minimum", lockin: "None" },
  { country: "Thailand", bank: "Kasikorn Bank", url: "https://www.kasikornbank.com/", rate: "0.01% - 2.50%", minDeposit: "No minimum", lockin: "None" },

  // Philippines
  { country: "Philippines", bank: "BDO Unibank", url: "https://www.bdo.com.ph/", rate: "0.01% - 2.50%", minDeposit: "No minimum", lockin: "None" },
  { country: "Philippines", bank: "Bank of the Philippine Islands", url: "https://www.bpi.com.ph/", rate: "0.01% - 2.50%", minDeposit: "No minimum", lockin: "None" },
  { country: "Philippines", bank: "Metrobank", url: "https://www.metrobank.com.ph/", rate: "0.01% - 2.50%", minDeposit: "No minimum", lockin: "None" },

  // Indonesia
  { country: "Indonesia", bank: "Bank Central Asia", url: "https://www.bca.co.id/", rate: "0.01% - 5.00%", minDeposit: "No minimum", lockin: "None" },
  { country: "Indonesia", bank: "Bank Mandiri", url: "https://www.bankmandiri.co.id/", rate: "0.01% - 5.00%", minDeposit: "No minimum", lockin: "None" },
  { country: "Indonesia", bank: "Bank Rakyat Indonesia", url: "https://www.bri.co.id/", rate: "0.01% - 5.00%", minDeposit: "No minimum", lockin: "None" },

  // Vietnam
  { country: "Vietnam", bank: "Vietcombank", url: "https://www.vietcombank.com.vn/", rate: "0.01% - 6.00%", minDeposit: "No minimum", lockin: "None" },
  { country: "Vietnam", bank: "BIDV", url: "https://www.bidv.com.vn/", rate: "0.01% - 6.00%", minDeposit: "No minimum", lockin: "None" },
  { country: "Vietnam", bank: "Agribank", url: "https://www.agribank.com.vn/", rate: "0.01% - 6.00%", minDeposit: "No minimum", lockin: "None" }
  ];

// Utility functions
export const getBanksByCountry = (country: string): BankAccount[] => {
  return gccSavingsAccounts.filter(bank => bank.country.toLowerCase() === country.toLowerCase());
};

export const getBanksByLocation = (location: string): BankAccount[] => {
  const countryMapping: { [key: string]: string } = {
    // GCC Countries
    'dubai': 'UAE', 'abu dhabi': 'UAE', 'sharjah': 'UAE', 'ajman': 'UAE', 'fujairah': 'UAE', 'ras al khaimah': 'UAE', 'umm al quwain': 'UAE',
    'riyadh': 'Saudi Arabia', 'jeddah': 'Saudi Arabia', 'dammam': 'Saudi Arabia', 'makkah': 'Saudi Arabia', 'medina': 'Saudi Arabia',
    'doha': 'Qatar', 'al wakrah': 'Qatar', 'al khor': 'Qatar',
    'kuwait city': 'Kuwait', 'salmiya': 'Kuwait', 'hawally': 'Kuwait',
    'manama': 'Bahrain', 'muharraq': 'Bahrain', 'riffa': 'Bahrain',
    'muscat': 'Oman', 'salalah': 'Oman', 'sohar': 'Oman',
    
    // USA
    'new york': 'USA', 'los angeles': 'USA', 'chicago': 'USA', 'houston': 'USA', 'phoenix': 'USA', 'philadelphia': 'USA', 'san antonio': 'USA',
    'san diego': 'USA', 'dallas': 'USA', 'san jose': 'USA', 'austin': 'USA', 'jacksonville': 'USA', 'fort worth': 'USA', 'columbus': 'USA',
    'charlotte': 'USA', 'san francisco': 'USA', 'indianapolis': 'USA', 'seattle': 'USA', 'denver': 'USA', 'washington': 'USA', 'boston': 'USA',
    'el paso': 'USA', 'nashville': 'USA', 'detroit': 'USA', 'oklahoma city': 'USA', 'portland': 'USA', 'las vegas': 'USA', 'memphis': 'USA',
    'louisville': 'USA', 'baltimore': 'USA', 'milwaukee': 'USA', 'albuquerque': 'USA', 'tucson': 'USA', 'fresno': 'USA', 'sacramento': 'USA',
    'atlanta': 'USA', 'kansas city': 'USA', 'long beach': 'USA', 'colorado springs': 'USA', 'raleigh': 'USA', 'miami': 'USA', 'virginia beach': 'USA',
    'omaha': 'USA', 'oakland': 'USA', 'minneapolis': 'USA', 'tulsa': 'USA', 'arlington': 'USA', 'tampa': 'USA', 'new orleans': 'USA',
    'wichita': 'USA', 'cleveland': 'USA', 'bakersfield': 'USA', 'aurora': 'USA', 'anaheim': 'USA', 'honolulu': 'USA', 'santa ana': 'USA',
    'corpus christi': 'USA', 'riverside': 'USA', 'lexington': 'USA', 'stockton': 'USA', 'henderson': 'USA', 'saint paul': 'USA', 'st. louis': 'USA',
    'st. petersburg': 'USA', 'cincinnati': 'USA', 'pittsburgh': 'USA', 'anchorage': 'USA', 'greensboro': 'USA', 'plano': 'USA', 'newark': 'USA',
    'lincoln': 'USA', 'orlando': 'USA', 'irvine': 'USA', 'durham': 'USA', 'chula vista': 'USA', 'toledo': 'USA', 'fort wayne': 'USA',
    'laredo': 'USA', 'chandler': 'USA', 'madison': 'USA', 'lubbock': 'USA', 'scottsdale': 'USA', 'reno': 'USA', 'glendale': 'USA',
    'hialeah': 'USA', 'garland': 'USA', 'chesapeake': 'USA', 'norfolk': 'USA', 'fremont': 'USA', 'gilbert': 'USA', 'baton rouge': 'USA',
    'richmond': 'USA', 'boise': 'USA', 'birmingham': 'USA', 'rochester': 'USA', 'des moines': 'USA', 'tacoma': 'USA',
    'modesto': 'USA', 'fontana': 'USA', 'oxnard': 'USA', 'moreno valley': 'USA', 'fayetteville': 'USA', 'huntington beach': 'USA', 'yonkers': 'USA',
    'glendale': 'USA', 'aurora': 'USA', 'montgomery': 'USA', 'grand rapids': 'USA', 'huntsville': 'USA', 'columbus': 'USA',
         'springfield': 'USA', 'santa clarita': 'USA', 'salinas': 'USA', 'salem': 'USA', 'corona': 'USA', 'eugene': 'USA', 'pasadena': 'USA',
     'fort collins': 'USA', 'sioux falls': 'USA', 'vallejo': 'USA', 'lancaster': 'USA', 'ann arbor': 'USA', 'aberdeen': 'USA',
     'palmdale': 'USA', 'macon': 'USA', 'sunnyvale': 'USA', 'pomona': 'USA', 'rockford': 'USA',
    
    // UK
    'london': 'UK', 'birmingham': 'UK', 'leeds': 'UK', 'glasgow': 'UK', 'sheffield': 'UK', 'bradford': 'UK', 'edinburgh': 'UK', 'liverpool': 'UK',
    'manchester': 'UK', 'bristol': 'UK', 'kirklees': 'UK', 'fife': 'UK', 'north lanarkshire': 'UK', 'wakefield': 'UK', 'cardiff': 'UK',
    'dudley': 'UK', 'wigan': 'UK', 'east riding': 'UK', 'south lanarkshire': 'UK', 'coventry': 'UK', 'belfast': 'UK', 'leicester': 'UK',
    'sunderland': 'UK', 'sandwell': 'UK', 'doncaster': 'UK', 'stockport': 'UK', 'sefton': 'UK', 'nottingham': 'UK', 'newcastle': 'UK',
    'kingston upon hull': 'UK', 'bolton': 'UK', 'walsall': 'UK', 'plymouth': 'UK', 'rotherham': 'UK', 'stoke': 'UK', 'wolverhampton': 'UK',
    
    // Canada
    'toronto': 'Canada', 'montreal': 'Canada', 'vancouver': 'Canada', 'calgary': 'Canada', 'edmonton': 'Canada', 'ottawa': 'Canada', 'winnipeg': 'Canada',
    'quebec': 'Canada', 'hamilton': 'Canada', 'kitchener': 'Canada', 'london': 'Canada', 'victoria': 'Canada', 'windsor': 'Canada', 'oshawa': 'Canada',
    'saskatoon': 'Canada', 'regina': 'Canada', 'st. john\'s': 'Canada', 'halifax': 'Canada', 'saint john': 'Canada', 'kelowna': 'Canada',
    
    // Australia
    'sydney': 'Australia', 'melbourne': 'Australia', 'brisbane': 'Australia', 'perth': 'Australia', 'adelaide': 'Australia', 'gold coast': 'Australia',
    'newcastle': 'Australia', 'canberra': 'Australia', 'sunshine coast': 'Australia', 'wollongong': 'Australia', 'hobart': 'Australia', 'geelong': 'Australia',
    'townsville': 'Australia', 'cairns': 'Australia', 'toowoomba': 'Australia', 'darwin': 'Australia', 'ballarat': 'Australia', 'bendigo': 'Australia',
    
    // Germany
    'berlin': 'Germany', 'hamburg': 'Germany', 'munich': 'Germany', 'cologne': 'Germany', 'frankfurt': 'Germany', 'stuttgart': 'Germany',
    'düsseldorf': 'Germany', 'leipzig': 'Germany', 'dortmund': 'Germany', 'essen': 'Germany', 'bremen': 'Germany', 'dresden': 'Germany',
    'hanover': 'Germany', 'nuremberg': 'Germany', 'duisburg': 'Germany', 'bochum': 'Germany', 'wuppertal': 'Germany', 'bielefeld': 'Germany',
    
    // France
    'paris': 'France', 'marseille': 'France', 'lyon': 'France', 'toulouse': 'France', 'nice': 'France', 'nantes': 'France', 'strasbourg': 'France',
    'montpellier': 'France', 'bordeaux': 'France', 'lille': 'France', 'rennes': 'France', 'reims': 'France', 'saint-étienne': 'France',
    'toulon': 'France', 'le havre': 'France', 'grenoble': 'France', 'dijon': 'France', 'angers': 'France', 'saint-denis': 'France',
    
    // Singapore
    'singapore': 'Singapore',
    
    // India
    'mumbai': 'India', 'delhi': 'India', 'bangalore': 'India', 'hyderabad': 'India', 'chennai': 'India', 'kolkata': 'India', 'pune': 'India',
    'ahmedabad': 'India', 'surat': 'India', 'jaipur': 'India', 'lucknow': 'India', 'kanpur': 'India', 'nagpur': 'India', 'indore': 'India',
    'thane': 'India', 'bhopal': 'India', 'visakhapatnam': 'India', 'patna': 'India', 'vadodara': 'India', 'ghaziabad': 'India', 'ludhiana': 'India',
    
    // Japan
    'tokyo': 'Japan', 'yokohama': 'Japan', 'osaka': 'Japan', 'nagoya': 'Japan', 'sapporo': 'Japan', 'fukuoka': 'Japan', 'kobe': 'Japan',
    'kyoto': 'Japan', 'kawasaki': 'Japan', 'saitama': 'Japan', 'hiroshima': 'Japan', 'sendai': 'Japan', 'chiba': 'Japan', 'kitakyushu': 'Japan',
    'sakai': 'Japan', 'niigata': 'Japan', 'hamamatsu': 'Japan', 'kumamoto': 'Japan', 'sagamihara': 'Japan', 'shizuoka': 'Japan', 'okayama': 'Japan',
    
    // South Korea
    'seoul': 'South Korea', 'busan': 'South Korea', 'incheon': 'South Korea', 'daegu': 'South Korea', 'daejeon': 'South Korea', 'gwangju': 'South Korea',
    'suwon': 'South Korea', 'ulsan': 'South Korea', 'changwon': 'South Korea', 'seongnam': 'South Korea', 'bucheon': 'South Korea', 'ansan': 'South Korea',
    'jeonju': 'South Korea', 'anyang': 'South Korea', 'pohang': 'South Korea', 'jeju': 'South Korea', 'cheongju': 'South Korea', 'gangneung': 'South Korea',
    
    // China
    'shanghai': 'China', 'beijing': 'China', 'guangzhou': 'China', 'shenzhen': 'China', 'tianjin': 'China', 'chongqing': 'China', 'chengdu': 'China',
    'nanjing': 'China', 'wuhan': 'China', 'xian': 'China', 'hangzhou': 'China', 'dongguan': 'China', 'foshan': 'China', 'shenyang': 'China',
    'qingdao': 'China', 'dalian': 'China', 'jinan': 'China', 'zhengzhou': 'China', 'kunming': 'China', 'changsha': 'China', 'ningbo': 'China',
    
    // Brazil
    'são paulo': 'Brazil', 'rio de janeiro': 'Brazil', 'brasília': 'Brazil', 'salvador': 'Brazil', 'fortaleza': 'Brazil', 'belo horizonte': 'Brazil',
    'manaus': 'Brazil', 'curitiba': 'Brazil', 'recife': 'Brazil', 'porto alegre': 'Brazil', 'belém': 'Brazil', 'goiânia': 'Brazil', 'guarulhos': 'Brazil',
    'campinas': 'Brazil', 'nova iguaçu': 'Brazil', 'são gonçalo': 'Brazil', 'maceió': 'Brazil', 'duque de caxias': 'Brazil', 'natal': 'Brazil',
    
    // Mexico
    'mexico city': 'Mexico', 'guadalajara': 'Mexico', 'monterrey': 'Mexico', 'puebla': 'Mexico', 'tijuana': 'Mexico', 'ciudad juárez': 'Mexico',
    'leon': 'Mexico', 'zapopan': 'Mexico', 'aguascalientes': 'Mexico', 'san luis potosí': 'Mexico', 'mérida': 'Mexico', 'querétaro': 'Mexico',
    'morelia': 'Mexico', 'hermosillo': 'Mexico', 'culiacán': 'Mexico', 'saltillo': 'Mexico', 'torreón': 'Mexico', 'chihuahua': 'Mexico',
    
    // South Africa
    'johannesburg': 'South Africa', 'cape town': 'South Africa', 'durban': 'South Africa', 'pretoria': 'South Africa', 'port elizabeth': 'South Africa',
    'bloemfontein': 'South Africa', 'kimberley': 'South Africa', 'east london': 'South Africa', 'nelspruit': 'South Africa', 'polokwane': 'South Africa',
    
    // Nigeria
    'lagos': 'Nigeria', 'kano': 'Nigeria', 'ibadan': 'Nigeria', 'kaduna': 'Nigeria', 'port harcourt': 'Nigeria', 'benin city': 'Nigeria',
    'maiduguri': 'Nigeria', 'zaria': 'Nigeria', 'abuja': 'Nigeria', 'jos': 'Nigeria', 'ilorin': 'Nigeria', 'new haven': 'Nigeria',
    
    // Egypt
    'cairo': 'Egypt', 'alexandria': 'Egypt', 'giza': 'Egypt', 'shubra el kheima': 'Egypt', 'port said': 'Egypt', 'suez': 'Egypt',
    'luxor': 'Egypt', 'aswan': 'Egypt', 'hurghada': 'Egypt', 'sharm el sheikh': 'Egypt', 'dahab': 'Egypt', 'siwa': 'Egypt',
    
    // Turkey
    'istanbul': 'Turkey', 'ankara': 'Turkey', 'izmir': 'Turkey', 'bursa': 'Turkey', 'antalya': 'Turkey', 'adana': 'Turkey',
    'gaziantep': 'Turkey', 'konya': 'Turkey', 'mersin': 'Turkey', 'diyarbakır': 'Turkey', 'samsun': 'Turkey', 'denizli': 'Turkey',
    
    // Malaysia
    'kuala lumpur': 'Malaysia', 'george town': 'Malaysia', 'ipoh': 'Malaysia', 'shah alam': 'Malaysia', 'johor bahru': 'Malaysia', 'melaka': 'Malaysia',
    'alor setar': 'Malaysia', 'miri': 'Malaysia', 'petaling jaya': 'Malaysia', 'kuching': 'Malaysia', 'kota kinabalu': 'Malaysia', 'sandakan': 'Malaysia',
    
    // Thailand
    'bangkok': 'Thailand', 'chiang mai': 'Thailand', 'pattaya': 'Thailand', 'phuket': 'Thailand', 'hat yai': 'Thailand', 'udon thani': 'Thailand',
    'nakhon ratchasima': 'Thailand', 'chiang rai': 'Thailand', 'surat thani': 'Thailand', 'nakhon si thammarat': 'Thailand', 'khon kaen': 'Thailand',
    
    // Philippines
    'manila': 'Philippines', 'quezon city': 'Philippines', 'davao city': 'Philippines', 'caloocan': 'Philippines', 'cebu city': 'Philippines',
    'zamboanga city': 'Philippines', 'antipolo': 'Philippines', 'pasig': 'Philippines', 'taguig': 'Philippines', 'valenzuela': 'Philippines',
    
    // Indonesia
    'jakarta': 'Indonesia', 'surabaya': 'Indonesia', 'bandung': 'Indonesia', 'medan': 'Indonesia', 'semarang': 'Indonesia', 'palembang': 'Indonesia',
    'makassar': 'Indonesia', 'tangerang': 'Indonesia', 'depok': 'Indonesia', 'batam': 'Indonesia', 'padang': 'Indonesia', 'malang': 'Indonesia',
    
    // Vietnam
    'ho chi minh city': 'Vietnam', 'hanoi': 'Vietnam', 'da nang': 'Vietnam', 'haiphong': 'Vietnam', 'can tho': 'Vietnam', 'buon ma thuot': 'Vietnam',
    'nha trang': 'Vietnam', 'vung tau': 'Vietnam', 'quy nhon': 'Vietnam', 'hai duong': 'Vietnam', 'nam dinh': 'Vietnam', 'thanh hoa': 'Vietnam'
  };

  const country = countryMapping[location.toLowerCase()];
  return country ? getBanksByCountry(country) : [];
}; 