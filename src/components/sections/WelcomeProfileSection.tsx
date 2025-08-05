import React, { useState, useEffect } from 'react';
import { usePlanner } from '../../context/PlannerContext';
import { useCurrency } from '../../context/CurrencyContext';
import { CURRENCIES } from '../../types/currencyTypes';
import { formatCurrency } from '../../utils/calculations';
import { PlanningType } from '../../types/plannerTypes';
import Button from '../ui/Button';
import Card, { CardHeader, CardTitle, CardContent, CardFooter } from '../ui/Card';
import AIGuidance from '../AIGuidance';
import { Bot, Target, TrendingUp, DollarSign, Shield, Sparkles, Brain, Zap, PiggyBank, Users, User } from 'lucide-react';

interface WelcomeProfileSectionProps {
  onNext: () => void;
}

const WelcomeProfileSection: React.FC<WelcomeProfileSectionProps> = ({ onNext }) => {
  const { state, dispatch } = usePlanner();
  const { currency, setCurrency } = useCurrency();

  // Local state for form
  const [name, setName] = useState(state.userProfile.name || '');
  const [planningType, setPlanningType] = useState<PlanningType>(state.userProfile.planningType || 'individual');
  const [familySize, setFamilySize] = useState(state.userProfile.familySize || 2);
  const [nationality, setNationality] = useState(state.userProfile.nationality || '');
  const [location, setLocation] = useState(state.userProfile.location || '');
  const [selectedCurrency, setSelectedCurrency] = useState(state.userProfile.currency || 'USD');
  const [monthlyIncome, setMonthlyIncome] = useState(state.userProfile.monthlyIncome || 0);
  const [monthlyExpenses, setMonthlyExpenses] = useState(state.monthlyExpenses || 0);
  const [currentSavings, setCurrentSavings] = useState(state.userProfile.currentSavings || 0);

  // Calculate monthly savings
  const monthlySavings = Math.max(0, (monthlyIncome || 0) - (monthlyExpenses || 0));
  const hasBothIncomeAndExpenses = monthlyIncome > 0 && monthlyExpenses > 0;

  // Dynamic labels based on planning type
  const incomeLabel = planningType === 'family' ? 'Total Household Income (Monthly)' : 'Monthly Income';
  const expenseLabel = planningType === 'family' ? 'Total Household Expenses (Monthly)' : 'Monthly Expenses';
  
  // Enhanced validation logic for planning type and family size
  const isFormValid = name && 
    nationality && 
    location && 
    selectedCurrency && 
    monthlyIncome > 0 && 
    monthlyExpenses > 0 &&
    (planningType === 'individual' || (planningType === 'family' && familySize >= 2));

  // Options
  // List of all countries as nationalities (UN member states + common demonyms)
  // --- NATIONALITIES: All UN member states, demonyms, and major territories, deduped and consistent ---
  const nationalityOptions = [
    'Afghan', 'Albanian', 'Algerian', 'American', 'Andorran', 'Angolan', 'Antiguan and Barbudan', 'Argentine', 'Armenian', 'Australian', 'Austrian', 'Azerbaijani',
    'Bahamian', 'Bahraini', 'Bangladeshi', 'Barbadian', 'Belarusian', 'Belgian', 'Belizean', 'Beninese', 'Bhutanese', 'Bolivian', 'Bosnian and Herzegovinian', 'Botswanan', 'Brazilian', 'Bruneian', 'Bulgarian', 'Burkinabé', 'Burmese', 'Burundian',
    'Cabo Verdean', 'Cambodian', 'Cameroonian', 'Canadian', 'Central African', 'Chadian', 'Chilean', 'Chinese', 'Colombian', 'Comorian', 'Congolese (Congo-Brazzaville)', 'Congolese (Congo-Kinshasa)', 'Costa Rican', 'Croatian', 'Cuban', 'Cypriot', 'Czech',
    'Danish', 'Djiboutian', 'Dominican', 'Dominican (Dominican Republic)', 'Ecuadorian', 'Egyptian', 'Salvadoran', 'Equatorial Guinean', 'Eritrean', 'Estonian', 'Eswatini', 'Ethiopian',
    'Fijian', 'Finnish', 'French', 'Gabonese', 'Gambian', 'Georgian', 'German', 'Ghanaian', 'Greek', 'Grenadian', 'Guatemalan', 'Guinean', 'Bissau-Guinean', 'Guyanese',
    'Haitian', 'Honduran', 'Hungarian', 'Icelander', 'Indian', 'Indonesian', 'Iranian', 'Iraqi', 'Irish', 'Israeli', 'Italian', 'Ivorian',
    'Jamaican', 'Japanese', 'Jordanian', 'Kazakh', 'Kenyan', 'Kiribati', 'Kuwaiti', 'Kyrgyz',
    'Lao', 'Latvian', 'Lebanese', 'Basotho', 'Liberian', 'Libyan', 'Liechtensteiner', 'Lithuanian', 'Luxembourgish',
    'Malagasy', 'Malawian', 'Malaysian', 'Maldivian', 'Malian', 'Maltese', 'Marshallese', 'Mauritanian', 'Mauritian', 'Mexican', 'Micronesian', 'Moldovan', 'Monégasque', 'Mongolian', 'Montenegrin', 'Moroccan', 'Mozambican',
    'Namibian', 'Nauruan', 'Nepalese', 'Dutch', 'New Zealander', 'Nicaraguan', 'Nigerien', 'Nigerian', 'North Korean', 'North Macedonian', 'Norwegian',
    'Omani', 'Pakistani', 'Palauan', 'Palestinian', 'Panamanian', 'Papua New Guinean', 'Paraguayan', 'Peruvian', 'Filipino', 'Polish', 'Portuguese',
    'Qatari', 'Romanian', 'Russian', 'Rwandan', 'Kittitian and Nevisian', 'Saint Lucian', 'Saint Vincentian', 'Samoan', 'San Marinese', 'Sao Tomean', 'Saudi', 'Senegalese', 'Serbian', 'Seychellois', 'Sierra Leonean', 'Singaporean', 'Slovak', 'Slovenian', 'Solomon Islander', 'Somali', 'South African', 'South Korean', 'South Sudanese', 'Spanish', 'Sri Lankan', 'Sudanese', 'Surinamese', 'Swazi', 'Swedish', 'Swiss', 'Syrian',
    'Taiwanese', 'Tajik', 'Tanzanian', 'Thai', 'Timorese', 'Togolese', 'Tongan', 'Trinidadian and Tobagonian', 'Tunisian', 'Turkish', 'Turkmen', 'Tuvaluan',
    'Ugandan', 'Ukrainian', 'Emirati', 'British', 'Uruguayan', 'Uzbek',
    'Vanuatuan', 'Vatican', 'Venezuelan', 'Vietnamese', 'Yemeni', 'Zambian', 'Zimbabwean',
    // Territories and other
    'Hong Konger', 'Macanese', 'Puerto Rican', 'Kosovar', 'Palestinian', 'Gibraltarian', 'Greenlander', 'Faroese', 'Other'
  ];

  // --- LOCATIONS: Major cities and capitals for all countries, deduped and consistent ---
  const locationOptions = [
    // Middle East
    'Abu Dhabi, UAE', 'Dubai, UAE', 'Sharjah, UAE', 'Ajman, UAE', 'Al Ain, UAE', 'Riyadh, Saudi Arabia', 'Jeddah, Saudi Arabia', 'Dammam, Saudi Arabia', 'Mecca, Saudi Arabia', 'Medina, Saudi Arabia', 'Doha, Qatar', 'Kuwait City, Kuwait', 'Manama, Bahrain', 'Muscat, Oman', 'Amman, Jordan', 'Baghdad, Iraq', 'Beirut, Lebanon', 'Damascus, Syria', 'Sana\'a, Yemen', 'Jerusalem, Israel', 'Gaza City, Palestine', 'Ramallah, Palestine', 'Tehran, Iran', 'Ankara, Turkey', 'Istanbul, Turkey',

    // Africa
    'Cairo, Egypt', 'Alexandria, Egypt', 'Lagos, Nigeria', 'Abuja, Nigeria', 'Johannesburg, South Africa', 'Cape Town, South Africa', 'Durban, South Africa', 'Nairobi, Kenya', 'Mombasa, Kenya', 'Casablanca, Morocco', 'Rabat, Morocco', 'Accra, Ghana', 'Kumasi, Ghana', 'Addis Ababa, Ethiopia', 'Algiers, Algeria', 'Dakar, Senegal', 'Tunis, Tunisia', 'Kampala, Uganda', 'Harare, Zimbabwe', 'Maputo, Mozambique', 'Luanda, Angola', 'Kinshasa, DR Congo', 'Brazzaville, Republic of the Congo', 'Antananarivo, Madagascar', 'Tripoli, Libya', 'Khartoum, Sudan', 'Gaborone, Botswana', 'Windhoek, Namibia', 'Bamako, Mali', 'Ouagadougou, Burkina Faso', 'Lusaka, Zambia', 'Abidjan, Côte d\'Ivoire', 'Freetown, Sierra Leone', 'Banjul, Gambia', 'Monrovia, Liberia', 'Kigali, Rwanda', 'Lilongwe, Malawi', 'Djibouti, Djibouti', 'Nouakchott, Mauritania', 'Port Louis, Mauritius', 'Victoria, Seychelles', 'Moroni, Comoros', 'São Tomé, São Tomé and Príncipe',

    // Asia
    'Beijing, China', 'Shanghai, China', 'Shenzhen, China', 'Hong Kong, China', 'Macau, China', 'Tokyo, Japan', 'Osaka, Japan', 'Seoul, South Korea', 'Busan, South Korea', 'Pyongyang, North Korea', 'Bangkok, Thailand', 'Singapore', 'Kuala Lumpur, Malaysia', 'Penang, Malaysia', 'Jakarta, Indonesia', 'Surabaya, Indonesia', 'Manila, Philippines', 'Cebu, Philippines', 'Mumbai, India', 'Delhi, India', 'Bangalore, India', 'Chennai, India', 'Kolkata, India', 'Islamabad, Pakistan', 'Karachi, Pakistan', 'Dhaka, Bangladesh', 'Kathmandu, Nepal', 'Colombo, Sri Lanka', 'Hanoi, Vietnam', 'Ho Chi Minh City, Vietnam', 'Taipei, Taiwan', 'Ulaanbaatar, Mongolia', 'Phnom Penh, Cambodia', 'Vientiane, Laos', 'Yangon, Myanmar', 'Dili, Timor-Leste', 'Thimphu, Bhutan', 'Male, Maldives', 'Tashkent, Uzbekistan', 'Bishkek, Kyrgyzstan', 'Dushanbe, Tajikistan', 'Ashgabat, Turkmenistan', 'Nur-Sultan, Kazakhstan', 'Yerevan, Armenia', 'Baku, Azerbaijan', 'Tbilisi, Georgia',

    // Europe
    'London, UK', 'Manchester, UK', 'Birmingham, UK', 'Edinburgh, UK', 'Glasgow, UK', 'Paris, France', 'Marseille, France', 'Lyon, France', 'Berlin, Germany', 'Munich, Germany', 'Frankfurt, Germany', 'Hamburg, Germany', 'Madrid, Spain', 'Barcelona, Spain', 'Valencia, Spain', 'Rome, Italy', 'Milan, Italy', 'Naples, Italy', 'Amsterdam, Netherlands', 'Rotterdam, Netherlands', 'Brussels, Belgium', 'Antwerp, Belgium', 'Zurich, Switzerland', 'Geneva, Switzerland', 'Vienna, Austria', 'Salzburg, Austria', 'Stockholm, Sweden', 'Gothenburg, Sweden', 'Copenhagen, Denmark', 'Aarhus, Denmark', 'Oslo, Norway', 'Bergen, Norway', 'Dublin, Ireland', 'Cork, Ireland', 'Lisbon, Portugal', 'Porto, Portugal', 'Prague, Czech Republic', 'Warsaw, Poland', 'Budapest, Hungary', 'Athens, Greece', 'Thessaloniki, Greece', 'Moscow, Russia', 'Saint Petersburg, Russia', 'Helsinki, Finland', 'Tallinn, Estonia', 'Riga, Latvia', 'Vilnius, Lithuania', 'Bratislava, Slovakia', 'Ljubljana, Slovenia', 'Zagreb, Croatia', 'Belgrade, Serbia', 'Sarajevo, Bosnia and Herzegovina', 'Podgorica, Montenegro', 'Skopje, North Macedonia', 'Sofia, Bulgaria', 'Bucharest, Romania', 'Chisinau, Moldova', 'Kiev, Ukraine', 'Minsk, Belarus', 'Luxembourg City, Luxembourg', 'Monaco', 'San Marino', 'Andorra la Vella, Andorra', 'Vaduz, Liechtenstein', 'Valletta, Malta', 'Reykjavik, Iceland', 'Tirana, Albania',

    // North America
    'New York, USA', 'Los Angeles, USA', 'San Francisco, USA', 'Chicago, USA', 'Houston, USA', 'Miami, USA', 'Washington, D.C., USA', 'Boston, USA', 'Toronto, Canada', 'Vancouver, Canada', 'Montreal, Canada', 'Ottawa, Canada', 'Calgary, Canada', 'Mexico City, Mexico', 'Guadalajara, Mexico', 'Monterrey, Mexico', 'San Juan, Puerto Rico', 'Havana, Cuba', 'Kingston, Jamaica', 'Port-au-Prince, Haiti', 'Santo Domingo, Dominican Republic', 'Panama City, Panama', 'San Jose, Costa Rica', 'Guatemala City, Guatemala', 'Tegucigalpa, Honduras', 'San Salvador, El Salvador', 'Managua, Nicaragua', 'Belmopan, Belize',

    // South America
    'São Paulo, Brazil', 'Rio de Janeiro, Brazil', 'Brasília, Brazil', 'Buenos Aires, Argentina', 'Córdoba, Argentina', 'Santiago, Chile', 'Valparaíso, Chile', 'Bogotá, Colombia', 'Medellín, Colombia', 'Lima, Peru', 'Quito, Ecuador', 'Caracas, Venezuela', 'La Paz, Bolivia', 'Asunción, Paraguay', 'Montevideo, Uruguay', 'Georgetown, Guyana', 'Paramaribo, Suriname',

    // Oceania
    'Sydney, Australia', 'Melbourne, Australia', 'Brisbane, Australia', 'Perth, Australia', 'Adelaide, Australia', 'Auckland, New Zealand', 'Wellington, New Zealand', 'Christchurch, New Zealand', 'Suva, Fiji', 'Port Moresby, Papua New Guinea', 'Apia, Samoa', 'Nukuʻalofa, Tonga', 'Port Vila, Vanuatu', 'Honiara, Solomon Islands', 'Funafuti, Tuvalu', 'Palikir, Micronesia', 'Majuro, Marshall Islands', 'Yaren, Nauru', 'Tarawa, Kiribati',

    // Other/General
    'Other'
  ];

  // Use organized currencies from currencyTypes.ts
  const currencyGroups = CURRENCIES.reduce((groups, curr) => {
    if (!groups[curr.region]) {
      groups[curr.region] = [];
    }
    groups[curr.region].push(curr);
    return groups;
  }, {} as Record<string, typeof CURRENCIES>);

  // Handle currency change to sync both contexts
  const handleCurrencyChange = (currencyCode: string) => {
    setSelectedCurrency(currencyCode);
    
    // Update CurrencyContext to sync with sidebar selector
    const selected = CURRENCIES.find(c => c.code === currencyCode);
    if (selected) {
      setCurrency(selected);
    }
  };

  // Update state when form values change
  useEffect(() => {
    dispatch({ 
      type: 'SET_USER_PROFILE', 
      payload: { 
        name,
        planningType,
        familySize: planningType === 'family' ? familySize : undefined,
        nationality: nationality || undefined, 
        location: location || undefined,
        monthlyIncome: monthlyIncome || undefined,
        currentSavings: currentSavings || undefined,
        currency: selectedCurrency || undefined
      } 
    });
    
    if (monthlyExpenses > 0) {
      dispatch({ type: 'SET_MONTHLY_EXPENSES', payload: monthlyExpenses });
    }
  }, [name, planningType, familySize, nationality, location, selectedCurrency, monthlyIncome, monthlyExpenses, currentSavings, dispatch]);

  const handleContinue = () => {
    // Ensure all data is saved before proceeding
    dispatch({ 
      type: 'SET_USER_PROFILE', 
      payload: { 
        name, 
        planningType,
        familySize: planningType === 'family' ? familySize : undefined,
        nationality, 
        location, 
        monthlyIncome, 
        currentSavings,
        currency: selectedCurrency 
      } 
    });
    dispatch({ type: 'SET_MONTHLY_EXPENSES', payload: monthlyExpenses });
    onNext();
  };

  return (
    <div className="container mx-auto max-w-4xl px-4 lg:px-0">
      {/* Welcome Header */}
      <div className="text-center mb-6 lg:mb-8">
        <div className="inline-flex items-center gap-2 bg-gradient-to-r from-green-500/20 to-orange-500/20 border border-green-500/30 rounded-full px-3 lg:px-4 py-2 mb-3 lg:mb-4">
          <Sparkles className="w-3 h-3 lg:w-4 lg:h-4 text-green-400" />
          <span className="text-xs lg:text-sm font-semibold text-green-300">WealthKarma AI Financial Planner</span>
          <Brain className="w-3 h-3 lg:w-4 lg:h-4 text-orange-400" />
        </div>
        <h1 className="text-2xl lg:text-4xl xl:text-5xl font-bold text-theme-light mb-3 lg:mb-4">
          Plan Your Financial Future
        </h1>
        <p className="text-base lg:text-xl text-theme-secondary max-w-3xl mx-auto px-4 lg:px-0">
          I'm your personal AI financial advisor, specialized in helping you build wealth and plan for the future. 
          Let's start by getting to know you and your financial situation.
        </p>
      </div>

      {/* Your AI Journey */}
      <Card className="mb-6 lg:mb-8 border-green-500/30 hover-lift">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg lg:text-xl">
            <Brain className="w-5 h-5 lg:w-6 lg:h-6 text-green-400" />
            What to Expect from Your AI Financial Advisor
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 lg:gap-6">
            <div className="text-center group">
              <div className="w-10 h-10 lg:w-12 lg:h-12 bg-gradient-to-br from-orange-500/20 to-orange-600/20 rounded-full flex items-center justify-center mx-auto mb-2 lg:mb-3 group-hover:scale-110 transition-transform border border-orange-500/30">
                <Shield className="w-5 h-5 lg:w-6 lg:h-6 text-orange-400" />
              </div>
              <h3 className="font-semibold mb-1 lg:mb-2 text-theme-light text-sm lg:text-base">Smart Emergency Planning</h3>
              <p className="text-xs lg:text-sm text-theme-secondary leading-relaxed">
                AI-recommended emergency fund size and best local banks for your situation
              </p>
            </div>
            
            <div className="text-center group">
              <div className="w-10 h-10 lg:w-12 lg:h-12 bg-gradient-to-br from-yellow-500/20 to-yellow-600/20 rounded-full flex items-center justify-center mx-auto mb-2 lg:mb-3 group-hover:scale-110 transition-transform border border-yellow-500/30">
                <Target className="w-5 h-5 lg:w-6 lg:h-6 text-yellow-400" />
              </div>
              <h3 className="font-semibold mb-1 lg:mb-2 text-theme-light text-sm lg:text-base">Personalized Goals</h3>
              <p className="text-xs lg:text-sm text-theme-secondary leading-relaxed">
                Common expat goals with realistic timelines based on your profile
              </p>
            </div>
            
            <div className="text-center group">
              <div className="w-10 h-10 lg:w-12 lg:h-12 bg-gradient-to-br from-green-500/20 to-green-600/20 rounded-full flex items-center justify-center mx-auto mb-2 lg:mb-3 group-hover:scale-110 transition-transform border border-green-500/30">
                <TrendingUp className="w-5 h-5 lg:w-6 lg:h-6 text-green-400" />
              </div>
              <h3 className="font-semibold mb-1 lg:mb-2 text-theme-light text-sm lg:text-base">Investment Strategy</h3>
              <p className="text-xs lg:text-sm text-theme-secondary leading-relaxed">
                Risk assessment and platform recommendations for international investing
              </p>
            </div>
            
            <div className="text-center group">
              <div className="w-10 h-10 lg:w-12 lg:h-12 bg-gradient-to-br from-purple-500/20 to-purple-600/20 rounded-full flex items-center justify-center mx-auto mb-2 lg:mb-3 group-hover:scale-110 transition-transform border border-purple-500/30">
                <Zap className="w-5 h-5 lg:w-6 lg:h-6 text-purple-400" />
              </div>
              <h3 className="font-semibold mb-1 lg:mb-2 text-theme-light text-sm lg:text-base">Action Plan</h3>
              <p className="text-xs lg:text-sm text-theme-secondary leading-relaxed">
                Step-by-step implementation guide with ongoing coaching and adjustments
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Profile Collection */}
      <Card className="mb-6 lg:mb-8 border-green-500/30">
        <CardHeader>
          <CardTitle className="text-lg lg:text-xl">Tell Me About Yourself</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4 lg:space-y-6">
            {/* Name */}
            <div>
              <label className="block text-sm font-medium text-theme-secondary mb-1 lg:mb-2">
                What should I call you?
              </label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Your first name"
                className="input-dark w-full px-3 lg:px-4 py-3 lg:py-2 rounded-lg text-base lg:text-sm focus:ring-2 focus:ring-green-500 focus:border-transparent transition-colors"
              />
            </div>

            {/* Planning Type */}
            <div>
              <label className="block text-sm font-medium text-theme-secondary mb-1 lg:mb-2">
                Planning Type
              </label>
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-3 mb-3">
                <button
                  type="button"
                  onClick={() => setPlanningType('individual')}
                  className={`p-4 rounded-lg border-2 transition-all text-left ${
                    planningType === 'individual'
                      ? 'border-green-500 bg-green-500/10'
                      : 'border-theme-border bg-theme-card hover:border-green-500/50'
                  }`}
                >
                  <div className="flex items-center gap-3 mb-2">
                    <User className={`w-5 h-5 ${planningType === 'individual' ? 'text-green-400' : 'text-theme-secondary'}`} />
                    <span className={`font-semibold ${planningType === 'individual' ? 'text-green-300' : 'text-theme-light'}`}>
                      Individual Planning
                    </span>
                  </div>
                  <p className="text-sm text-theme-secondary">
                    Planning for yourself only. Enter your personal income and expenses.
                  </p>
                </button>
                
                <button
                  type="button"
                  onClick={() => setPlanningType('family')}
                  className={`p-4 rounded-lg border-2 transition-all text-left ${
                    planningType === 'family'
                      ? 'border-green-500 bg-green-500/10'
                      : 'border-theme-border bg-theme-card hover:border-green-500/50'
                  }`}
                >
                  <div className="flex items-center gap-3 mb-2">
                    <Users className={`w-5 h-5 ${planningType === 'family' ? 'text-green-400' : 'text-theme-secondary'}`} />
                    <span className={`font-semibold ${planningType === 'family' ? 'text-green-300' : 'text-theme-light'}`}>
                      Family Planning
                    </span>
                  </div>
                  <p className="text-sm text-theme-secondary">
                    Planning for your household. Enter combined family income and expenses.
                  </p>
                </button>
              </div>
            </div>

            {/* Family Size */}
            {planningType === 'family' && (
              <div>
                <label className="block text-sm font-medium text-theme-secondary mb-1 lg:mb-2">
                  Family Size
                </label>
                <input
                  type="number"
                  value={familySize}
                  onChange={(e) => setFamilySize(Number(e.target.value))}
                  placeholder="e.g., 4"
                  className="input-dark w-full px-3 lg:px-4 py-3 lg:py-2 rounded-lg text-base lg:text-sm focus:ring-2 focus:ring-green-500 focus:border-transparent transition-colors"
                />
              </div>
            )}

            {/* Nationality and Location */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-theme-secondary mb-1 lg:mb-2">
                  Nationality
                </label>
                <select
                  value={nationality}
                  onChange={(e) => setNationality(e.target.value)}
                  className="input-dark w-full rounded-lg px-3 lg:px-4 py-3 lg:py-2 text-base lg:text-sm focus:ring-2 focus:ring-green-500 focus:border-transparent transition-colors"
                >
                  <option value="">Select your nationality</option>
                  {nationalityOptions.map(nat => (
                    <option key={nat} value={nat}>{nat}</option>
                  ))}
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-theme-secondary mb-1 lg:mb-2">
                  Current Location
                </label>
                <select
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                  className="input-dark w-full rounded-lg px-3 lg:px-4 py-3 lg:py-2 text-base lg:text-sm focus:ring-2 focus:ring-green-500 focus:border-transparent transition-colors"
                >
                  <option value="">Select your location</option>
                  {locationOptions.map(loc => (
                    <option key={loc} value={loc}>{loc}</option>
                  ))}
                </select>
              </div>
            </div>

            {/* Currency and Income */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <div>
                <label className="block text-sm font-medium text-theme-secondary mb-1 lg:mb-2">
                  Preferred Currency
              </label>
              <select
                value={selectedCurrency}
                onChange={(e) => handleCurrencyChange(e.target.value)}
                  className="input-dark w-full rounded-lg px-3 lg:px-4 py-3 lg:py-2 text-base lg:text-sm focus:ring-2 focus:ring-green-500 focus:border-transparent transition-colors"
              >
                  <option value="">Select currency</option>
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

              <div>
                <label className="block text-sm font-medium text-theme-secondary mb-1 lg:mb-2">
                  {incomeLabel} ({selectedCurrency || 'USD'})
                </label>
                  <input
                    type="number"
                  value={monthlyIncome || ''}
                    onChange={(e) => setMonthlyIncome(Number(e.target.value))}
                  placeholder="e.g., 15000"
                  className="input-dark w-full px-3 lg:px-4 py-3 lg:py-2 rounded-lg text-base lg:text-sm focus:ring-2 focus:ring-green-500 focus:border-transparent transition-colors"
                  />
                </div>
              </div>
              
            {/* Monthly Expenses */}
              <div>
              <label className="block text-sm font-medium text-theme-secondary mb-1 lg:mb-2">
                {expenseLabel} ({selectedCurrency || 'USD'})
                </label>
                  <input
                    type="number"
                value={monthlyExpenses || ''}
                    onChange={(e) => setMonthlyExpenses(Number(e.target.value))}
                placeholder="e.g., 8000"
                className="input-dark w-full px-3 lg:px-4 py-3 lg:py-2 rounded-lg text-base lg:text-sm focus:ring-2 focus:ring-green-500 focus:border-transparent transition-colors"
              />
              <p className="text-sm text-theme-muted mt-1">
                Include rent, food, transportation, utilities, and other regular expenses
                </p>
              </div>

            {/* Current Savings */}
            <div>
              <label className="block text-sm font-medium text-theme-secondary mb-1 lg:mb-2">
                Current Savings ({selectedCurrency || 'USD'})
              </label>
              <input
                type="number"
                value={currentSavings || ''}
                onChange={(e) => setCurrentSavings(Number(e.target.value))}
                placeholder="e.g., 5000"
                className="input-dark w-full px-3 lg:px-4 py-3 lg:py-2 rounded-lg text-base lg:text-sm focus:ring-2 focus:ring-green-500 focus:border-transparent transition-colors"
              />
              <p className="text-sm text-theme-muted mt-1">
                Total amount you currently have saved (bank accounts, cash, etc). This will be applied to your goals starting with emergency fund.
              </p>
              
              {/* Current Savings Impact Preview */}
              {currentSavings > 0 && hasBothIncomeAndExpenses && (
                <div className="mt-3 p-3 bg-theme-card border border-green-500/30 rounded-lg">
                  <div className="flex items-center gap-2 mb-2">
                    <PiggyBank className="w-4 h-4 text-green-400" />
                    <span className="text-sm font-medium text-green-300">Current Savings Impact</span>
                  </div>
                  <p className="text-xs text-theme-secondary">
                    Your {formatCurrency(currentSavings, { code: selectedCurrency || 'USD' } as any)} in savings will be automatically applied to your emergency fund first, then to other goals, reducing your monthly savings requirements.
                  </p>
                </div>
              )}
              </div>

            {/* Monthly Savings Display */}
            {hasBothIncomeAndExpenses && (
              <div className={`border rounded-lg p-3 lg:p-4 ${
                monthlySavings > 0 
                  ? 'bg-theme-card border-green-500/30' 
                  : 'bg-theme-card border-red-500/30'
              }`}>
                <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-3 sm:gap-0">
                  <div className="flex items-center gap-2 lg:gap-3">
                    <div className={`w-8 h-8 lg:w-10 lg:h-10 rounded-full flex items-center justify-center ${
                      monthlySavings > 0 
                        ? 'bg-green-500/20 border border-green-500/30' 
                        : 'bg-red-500/20 border border-red-500/30'
                    }`}>
                      <PiggyBank className={`w-4 h-4 lg:w-5 lg:h-5 ${
                        monthlySavings > 0 ? 'text-green-400' : 'text-red-400'
                      }`} />
                    </div>
                    <div>
                      <label className={`block text-sm font-medium ${
                        monthlySavings > 0 ? 'text-green-300' : 'text-red-300'
                      }`}>
                        {planningType === 'family' ? 'Monthly Family Savings Available' : 'Monthly Savings Available'}
                      </label>
                      <p className={`text-xs ${
                        monthlySavings > 0 ? 'text-theme-secondary' : 'text-red-200'
                      }`}>
                        {monthlySavings > 0 
                          ? planningType === 'family' 
                            ? `Combined household savings for your family's emergency fund and financial goals`
                            : 'This amount will be used for your emergency fund and financial goals'
                          : planningType === 'family'
                          ? 'Your household expenses exceed income - consider adjusting your family budget'
                          : 'Your expenses exceed your income - consider adjusting your budget'
                        }
                      </p>
                    </div>
                  </div>
                  <div className="text-left sm:text-right">
                    <span className={`text-xl lg:text-2xl font-bold ${
                      monthlySavings > 0 ? 'text-green-400' : 'text-red-400'
                    }`}>
                      {formatCurrency(monthlySavings, currency)}
                    </span>
                    <div className={`text-xs ${
                      monthlySavings > 0 ? 'text-theme-muted' : 'text-red-300'
                    }`}>
                      {monthlySavings > 0 
                        ? `${((monthlySavings / monthlyIncome) * 100).toFixed(0)}% of income`
                        : 'Budget deficit'
                      }
                    </div>
                  </div>
                </div>
                
                {monthlySavings > 0 && (
                  <div className="mt-3 pt-3 border-t border-green-500/20">
                    <div className="flex items-center gap-2 text-green-300 text-sm">
                      <Brain className="w-3 h-3 lg:w-4 lg:h-4" />
                      <span className="font-medium">AI Insight:</span>
                    </div>
                    <p className="text-theme-secondary text-xs lg:text-sm mt-1 leading-relaxed">
                      {monthlySavings >= monthlyIncome * 0.2 
                        ? planningType === 'family'
                          ? "Excellent! Your family is saving 20%+ of household income. This gives you great flexibility for multiple family financial goals."
                          : "Excellent! You're saving 20%+ of your income. This gives you great flexibility for multiple financial goals."
                        : monthlySavings >= monthlyIncome * 0.1
                        ? planningType === 'family'
                          ? "Good family savings rate! You can comfortably build an emergency fund and work towards other family goals."
                          : "Good savings rate! You can comfortably build an emergency fund and work towards other goals."
                        : planningType === 'family'
                        ? "Consider reviewing your family expenses to increase your household savings rate for faster goal achievement."
                        : "Consider reviewing your expenses to increase your savings rate for faster goal achievement."
                      }
                    </p>
                  </div>
                )}
              </div>
            )}
          </div>
        </CardContent>
        <CardFooter>
            <Button 
              onClick={handleContinue}
              disabled={!isFormValid}
              variant="primary"
              fullWidth
              size="lg"
            >
            Continue to Emergency Fund Planning →
            </Button>
        </CardFooter>
      </Card>
      
      {/* AI Guidance - Only show on welcome/profile step */}
      {(name && state.currentStep === 0) && (
        <AIGuidance 
          step="profile-setup"
          context={{
            name,
            nationality,
            location,
            monthlyIncome,
            monthlyExpenses,
            currency: selectedCurrency,
            currentStep: 'profile-setup'
          }}
        />
      )}
    </div>
  );
};

export default WelcomeProfileSection; 