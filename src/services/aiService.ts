import OpenAI from 'openai';

export interface UserContext {
  name?: string;
  nationality?: string;
  location?: string;
  monthlyIncome?: number;
  monthlyExpenses?: number;
  currency?: string;
  currentStep?: string;
  goals?: any[];
  // Family planning context
  planningType?: 'individual' | 'family';
  familySize?: number;
  // NEW: Retirement preferences
  retirementPreferences?: {
    budgetPriority: 'low-cost' | 'moderate' | 'comfortable';
    weatherPreference: 'warm' | 'temperate' | 'cool' | 'no-preference';
    lifestyleType: 'quiet-peaceful' | 'active-social' | 'cultural-urban' | 'beach-coastal';
  };
  emergencyFund?: {
    targetAmount?: number;
    currentAmount?: number;
    bufferMonths?: number;
    monthlyExpenses?: number;
    targetDate?: Date;
    monthlyContribution?: number;
  };
  currentFormData?: {
    goalName?: string;
    goalAmount?: number;
    goalCategory?: string;
    targetMonth?: number;
    targetYear?: number;
    paymentFrequency?: string;
    paymentPeriod?: number;
    isEditMode?: boolean;
    editingGoalId?: string;
  };
  currentGoalContext?: {
    isEditingGoal: boolean;
    goalBeingEdited?: {
      id: string;
      name: string;
      category: string;
      amount: number;
      targetDate: Date;
      requiredPMT: number;
    };
    isCreatingNew: boolean;
    activeGoalId?: string;
  };
}

export interface AIGuidanceResponse {
  message: string;
  suggestions?: string[];
  nextSteps?: string[];
  warning?: string;
  bankOptions?: BankOption[];
  selectedBank?: BankOption;
  interactiveButtons?: InteractiveButton[];
  formFillData?: {
    goalName?: string;
    goalAmount?: number;
    goalCategory?: string;
    targetMonth?: number;
    targetYear?: number;
    paymentFrequency?: string;
    paymentPeriod?: number;
  };
}

export interface BankOption {
  id: string;
  bankName: string;
  accountType: string;
  interestRate: string;
  returnRate: number; // Decimal format for calculations (e.g., 0.04 for 4%)
  features: string;
  website: string;
  mobileApp: string;
  minimumBalance?: string;
}

export interface InteractiveButton {
  id: string;
  label: string;
  value: string;
  type: 'bank-selection';
  data: BankOption;
}

export interface RetirementDestinationSuggestion {
  destination: string;
  country: string;
  estimatedMonthlyCost: number;
  costOfLivingRank: string; // e.g., "Low", "Medium", "High"
  highlights: string[];
  weather: string;
  healthcare: string;
  visaRequirements: string;
}

export interface RetirementPlanningResponse {
  message: string;
  destinationSuggestions?: RetirementDestinationSuggestion[];
  selectedDestination?: {
    name: string;
    estimatedMonthlyCost: number;
    breakdown: {
      housing: number;
      food: number;
      healthcare: number;
      transportation: number;
      entertainment: number;
      utilities: number;
      other: number;
    };
    comparisonToCurrentExpenses?: {
      currentMonthlyExpenses: number;
      projectedMonthlyExpenses: number;
      difference: number;
      percentageChange: number;
      explanation: string;
    };
  };
  interactiveButtons?: RetirementButton[];
}

export interface RetirementButton {
  id: string;
  label: string;
  value: string;
  type: 'destination-selection' | 'cost-estimation';
  data: any;
}

interface BankSearchCache {
  [country: string]: {
    data: string;
    timestamp: number;
  };
}

class AIService {
  private openai?: OpenAI;
  private apiKey: string;
  private rateLimitDelay: number = 1000; // 1 second delay between calls
  private lastCallTime: number = 0;
  private retryAttempts: number = 3;
  private rateLimitedUntil: number = 0; // Timestamp when rate limiting ends

  constructor() {
    // In production, this should come from environment variables
    this.apiKey = import.meta.env.VITE_OPENAI_API_KEY || '';
    
    if (!this.apiKey) {
      console.warn('OpenAI API key not found. AI features will be disabled.');
      return;
    }

    this.openai = new OpenAI({
      apiKey: this.apiKey,
      dangerouslyAllowBrowser: true // Only for development/demo
    });
  }

  private async rateLimitedCall<T>(apiCall: () => Promise<T>): Promise<T> {
    // Check if we're still rate limited
    if (Date.now() < this.rateLimitedUntil) {
      const waitTime = Math.ceil((this.rateLimitedUntil - Date.now()) / 1000);
      throw new Error(`Rate limited. Please wait ${waitTime} seconds before trying again.`);
    }

    // Ensure minimum delay between calls
    const timeSinceLastCall = Date.now() - this.lastCallTime;
    if (timeSinceLastCall < this.rateLimitDelay) {
      await new Promise(resolve => setTimeout(resolve, this.rateLimitDelay - timeSinceLastCall));
    }

    try {
      this.lastCallTime = Date.now();
      return await apiCall();
    } catch (error: any) {
      if (error?.status === 429) {
        // Rate limited - wait 5 minutes before allowing more calls
        this.rateLimitedUntil = Date.now() + (5 * 60 * 1000);
        console.warn('OpenAI API rate limit exceeded. Blocking calls for 5 minutes.');
        throw new Error('API rate limit exceeded. Please wait 5 minutes before trying again. Check your OpenAI billing and usage limits.');
      }
      throw error;
    }
  }

  private buildSystemPrompt(): string {
    return `You are an expert financial advisor specializing in helping global expats and international users with their financial planning.

Key considerations for global expats:
- Zero local income tax environment provides excellent wealth-building opportunities
- Temporary residency requires portable investment strategies
- Limited local investment options, offshore accounts often needed
- Currency considerations (local currency vs home country vs USD)
- End-of-service benefits instead of traditional pensions
- International school costs and education planning
- Repatriation planning for eventual return home

Your tone should be:
- FRIENDLY and APPROACHABLE - like a helpful money coach, not a formal advisor
- CONCISE and CONVERSATIONAL - brief but warm responses
- ASK-FIRST APPROACH - introduce yourself and ask how you can help rather than giving unsolicited advice
- Practical and specific when answering questions
- Aware of expat challenges and opportunities
- Culturally sensitive to different nationalities

IMPORTANT RESPONSE STRUCTURE for bank recommendations (when asked):
1. FIRST: Give your professional recommendation with reasoning based on their situation
2. THEN: Mention specific banks and rates that would work best for them
3. FINALLY: Direct them to "select your preferred bank from the dropdown above" rather than providing selection buttons

FORMATTING RULES:
- Write in plain text without any markdown formatting (no **bold**, *italics*, or other special characters)
- Keep responses to 3-4 short sentences maximum unless specifically asked for more detail
- When mentioning banks or savings accounts, use SPECIFIC bank names, account products, and current interest rates provided in the context
- Focus on actionable advice rather than general information
- Always end bank recommendations with a statement emphasizing user choice

Always provide specific, actionable advice relevant to their expat status.`;
  }

  private buildContextPrompt(context: UserContext): string {
    let contextPrompt = `User Context:\n`;
    
    if (context.name) {
      contextPrompt += `- Name: ${context.name}\n`;
    }
    if (context.nationality) {
      contextPrompt += `- Nationality: ${context.nationality}\n`;
    }
    if (context.location) {
      contextPrompt += `- Current Location: ${context.location}\n`;
    }
    if (context.monthlyIncome) {
      contextPrompt += `- Monthly Income: ${context.monthlyIncome.toLocaleString()} ${context.currency || 'USD'}\n`;
    }
    if (context.monthlyExpenses) {
      contextPrompt += `- Monthly Expenses: ${context.monthlyExpenses.toLocaleString()} ${context.currency || 'USD'}\n`;
    }
    if (context.currency) {
      contextPrompt += `- Currency: ${context.currency}\n`;
    }
    if (context.currentStep) {
      contextPrompt += `- Current Planning Step: ${context.currentStep}\n`;
    }
    
    // Add family planning context
    if (context.planningType) {
      contextPrompt += `- Planning Type: ${context.planningType}\n`;
      if (context.planningType === 'family' && context.familySize) {
        contextPrompt += `- Family Size: ${context.familySize} members\n`;
        contextPrompt += `- Context: Planning financial goals for a family household\n`;
      }
    }
    
    // Add existing goals information
    if (context.goals && context.goals.length > 0) {
      contextPrompt += `\nExisting Goals (${context.goals.length} total):\n`;
      const nonEmergencyGoals = context.goals.filter(goal => goal.id !== 'emergency-fund');
      
      if (nonEmergencyGoals.length > 0) {
        nonEmergencyGoals.forEach((goal, index) => {
          const targetDate = new Date(goal.targetDate);
          const formattedDate = targetDate.toLocaleDateString('en-US', { 
            month: 'short', 
            year: 'numeric' 
          });
          
          contextPrompt += `${index + 1}. ${goal.name} (${goal.category})\n`;
          contextPrompt += `   - Amount: ${goal.amount.toLocaleString()} ${context.currency || 'USD'}\n`;
          contextPrompt += `   - Target: ${formattedDate} (${Math.round(goal.horizonMonths / 12)} years)\n`;
          contextPrompt += `   - Required Monthly: ${goal.requiredPMT.toLocaleString()} ${context.currency || 'USD'}\n`;
          
          if (goal.paymentFrequency && goal.paymentFrequency !== 'Once') {
            contextPrompt += `   - Payment: ${goal.paymentFrequency}`;
            if (goal.paymentPeriod) {
              contextPrompt += ` over ${goal.paymentPeriod} years`;
            }
            contextPrompt += `\n`;
          }
        });
        
        // Calculate total monthly commitment
        const totalMonthlyCommitment = nonEmergencyGoals.reduce((sum, goal) => sum + goal.requiredPMT, 0);
        const incomePercentage = context.monthlyIncome ? ((totalMonthlyCommitment / context.monthlyIncome) * 100).toFixed(1) : 'N/A';
        
        contextPrompt += `\nGoal Portfolio Summary:\n`;
        contextPrompt += `- Total Monthly Commitment: ${totalMonthlyCommitment.toLocaleString()} ${context.currency || 'USD'}\n`;
        contextPrompt += `- Percentage of Income: ${incomePercentage}%\n`;
        
        // Categorize existing goals
        const goalCategories = nonEmergencyGoals.reduce((acc, goal) => {
          acc[goal.category] = (acc[goal.category] || 0) + 1;
          return acc;
        }, {} as Record<string, number>);
        
        const categorySummary = Object.entries(goalCategories)
          .map(([category, count]) => `${category} (${count})`)
          .join(', ');
        contextPrompt += `- Goal Categories: ${categorySummary}\n`;
      } else {
        contextPrompt += `- No financial goals set yet (excluding emergency fund)\n`;
      }
    } else {
      contextPrompt += `- No goals created yet\n`;
    }
    
    if (context.emergencyFund) {
      contextPrompt += `\nEmergency Fund Status:\n`;
      contextPrompt += `- Target: ${context.emergencyFund.targetAmount?.toLocaleString() || 'Not set'} ${context.currency || 'USD'}\n`;
      contextPrompt += `- Current: ${context.emergencyFund.currentAmount?.toLocaleString() || '0'} ${context.currency || 'USD'}\n`;
      contextPrompt += `- Buffer Months: ${context.emergencyFund.bufferMonths || 'Not set'}\n`;
      contextPrompt += `- Monthly Contribution: ${context.emergencyFund.monthlyContribution?.toLocaleString() || 'Not set'} ${context.currency || 'USD'}\n`;
    }

    return contextPrompt;
  }

  private getCountryFromLocation(location: string): string {
    // Comprehensive location to country mapping
    const locationMappings: { [key: string]: string } = {
      // Middle East
      'abu dhabi, uae': 'UAE', 'dubai, uae': 'UAE', 'sharjah, uae': 'UAE', 'ajman, uae': 'UAE', 'al ain, uae': 'UAE',
      'riyadh, saudi arabia': 'Saudi Arabia', 'jeddah, saudi arabia': 'Saudi Arabia', 'dammam, saudi arabia': 'Saudi Arabia', 'mecca, saudi arabia': 'Saudi Arabia', 'medina, saudi arabia': 'Saudi Arabia',
      'doha, qatar': 'Qatar', 'kuwait city, kuwait': 'Kuwait', 'manama, bahrain': 'Bahrain', 'muscat, oman': 'Oman',
      'amman, jordan': 'Jordan', 'baghdad, iraq': 'Iraq', 'beirut, lebanon': 'Lebanon', 'damascus, syria': 'Syria',
      'sana\'a, yemen': 'Yemen', 'jerusalem, israel': 'Israel', 'gaza city, palestine': 'Palestine', 'ramallah, palestine': 'Palestine',
      'tehran, iran': 'Iran', 'ankara, turkey': 'Turkey', 'istanbul, turkey': 'Turkey',

      // Africa
      'cairo, egypt': 'Egypt', 'alexandria, egypt': 'Egypt', 'lagos, nigeria': 'Nigeria', 'abuja, nigeria': 'Nigeria',
      'johannesburg, south africa': 'South Africa', 'cape town, south africa': 'South Africa', 'durban, south africa': 'South Africa',
      'nairobi, kenya': 'Kenya', 'mombasa, kenya': 'Kenya', 'casablanca, morocco': 'Morocco', 'rabat, morocco': 'Morocco',
      'accra, ghana': 'Ghana', 'kumasi, ghana': 'Ghana', 'addis ababa, ethiopia': 'Ethiopia', 'algiers, algeria': 'Algeria',
      'dakar, senegal': 'Senegal', 'tunis, tunisia': 'Tunisia', 'kampala, uganda': 'Uganda', 'harare, zimbabwe': 'Zimbabwe',
      'maputo, mozambique': 'Mozambique', 'luanda, angola': 'Angola', 'kinshasa, dr congo': 'DR Congo', 'brazzaville, republic of the congo': 'Republic of the Congo',
      'antananarivo, madagascar': 'Madagascar', 'tripoli, libya': 'Libya', 'khartoum, sudan': 'Sudan', 'gaborone, botswana': 'Botswana',
      'windhoek, namibia': 'Namibia', 'bamako, mali': 'Mali', 'ouagadougou, burkina faso': 'Burkina Faso', 'lusaka, zambia': 'Zambia',
      'abidjan, côte d\'ivoire': 'Côte d\'Ivoire', 'freetown, sierra leone': 'Sierra Leone', 'banjul, gambia': 'Gambia',
      'monrovia, liberia': 'Liberia', 'kigali, rwanda': 'Rwanda', 'lilongwe, malawi': 'Malawi', 'djibouti, djibouti': 'Djibouti',
      'nouakchott, mauritania': 'Mauritania', 'port louis, mauritius': 'Mauritius', 'victoria, seychelles': 'Seychelles',
      'moroni, comoros': 'Comoros', 'são tomé, são tomé and príncipe': 'São Tomé and Príncipe',

      // Asia
      'beijing, china': 'China', 'shanghai, china': 'China', 'shenzhen, china': 'China', 'hong kong, china': 'China', 'macau, china': 'China',
      'tokyo, japan': 'Japan', 'osaka, japan': 'Japan', 'seoul, south korea': 'South Korea', 'busan, south korea': 'South Korea',
      'pyongyang, north korea': 'North Korea', 'bangkok, thailand': 'Thailand', 'singapore': 'Singapore',
      'kuala lumpur, malaysia': 'Malaysia', 'penang, malaysia': 'Malaysia', 'jakarta, indonesia': 'Indonesia', 'surabaya, indonesia': 'Indonesia',
      'manila, philippines': 'Philippines', 'cebu, philippines': 'Philippines', 'mumbai, india': 'India', 'delhi, india': 'India',
      'bangalore, india': 'India', 'chennai, india': 'India', 'kolkata, india': 'India', 'islamabad, pakistan': 'Pakistan',
      'karachi, pakistan': 'Pakistan', 'dhaka, bangladesh': 'Bangladesh', 'kathmandu, nepal': 'Nepal', 'colombo, sri lanka': 'Sri Lanka',
      'hanoi, vietnam': 'Vietnam', 'ho chi minh city, vietnam': 'Vietnam', 'taipei, taiwan': 'Taiwan', 'ulaanbaatar, mongolia': 'Mongolia',
      'phnom penh, cambodia': 'Cambodia', 'vientiane, laos': 'Laos', 'yangon, myanmar': 'Myanmar', 'dili, timor-leste': 'Timor-Leste',
      'thimphu, bhutan': 'Bhutan', 'male, maldives': 'Maldives', 'tashkent, uzbekistan': 'Uzbekistan', 'bishkek, kyrgyzstan': 'Kyrgyzstan',
      'dushanbe, tajikistan': 'Tajikistan', 'ashgabat, turkmenistan': 'Turkmenistan', 'nur-sultan, kazakhstan': 'Kazakhstan',
      'yerevan, armenia': 'Armenia', 'baku, azerbaijan': 'Azerbaijan', 'tbilisi, georgia': 'Georgia',

      // Europe
      'london, uk': 'UK', 'manchester, uk': 'UK', 'birmingham, uk': 'UK', 'edinburgh, uk': 'UK', 'glasgow, uk': 'UK',
      'paris, france': 'France', 'marseille, france': 'France', 'lyon, france': 'France', 'berlin, germany': 'Germany',
      'munich, germany': 'Germany', 'frankfurt, germany': 'Germany', 'hamburg, germany': 'Germany', 'madrid, spain': 'Spain',
      'barcelona, spain': 'Spain', 'valencia, spain': 'Spain', 'rome, italy': 'Italy', 'milan, italy': 'Italy', 'naples, italy': 'Italy',
      'amsterdam, netherlands': 'Netherlands', 'rotterdam, netherlands': 'Netherlands', 'brussels, belgium': 'Belgium', 'antwerp, belgium': 'Belgium',
      'zurich, switzerland': 'Switzerland', 'geneva, switzerland': 'Switzerland', 'vienna, austria': 'Austria', 'salzburg, austria': 'Austria',
      'stockholm, sweden': 'Sweden', 'gothenburg, sweden': 'Sweden', 'copenhagen, denmark': 'Denmark', 'aarhus, denmark': 'Denmark',
      'oslo, norway': 'Norway', 'bergen, norway': 'Norway', 'dublin, ireland': 'Ireland', 'cork, ireland': 'Ireland',
      'lisbon, portugal': 'Portugal', 'porto, portugal': 'Portugal', 'prague, czech republic': 'Czech Republic', 'warsaw, poland': 'Poland',
      'budapest, hungary': 'Hungary', 'athens, greece': 'Greece', 'thessaloniki, greece': 'Greece', 'moscow, russia': 'Russia',
      'saint petersburg, russia': 'Russia', 'helsinki, finland': 'Finland', 'tallinn, estonia': 'Estonia', 'riga, latvia': 'Latvia',
      'vilnius, lithuania': 'Lithuania', 'bratislava, slovakia': 'Slovakia', 'ljubljana, slovenia': 'Slovenia', 'zagreb, croatia': 'Croatia',
      'belgrade, serbia': 'Serbia', 'sarajevo, bosnia and herzegovina': 'Bosnia and Herzegovina', 'podgorica, montenegro': 'Montenegro',
      'skopje, north macedonia': 'North Macedonia', 'sofia, bulgaria': 'Bulgaria', 'bucharest, romania': 'Romania',
      'chisinau, moldova': 'Moldova', 'kiev, ukraine': 'Ukraine', 'minsk, belarus': 'Belarus', 'luxembourg city, luxembourg': 'Luxembourg',
      'monaco': 'Monaco', 'san marino': 'San Marino', 'andorra la vella, andorra': 'Andorra', 'vaduz, liechtenstein': 'Liechtenstein',
      'valletta, malta': 'Malta', 'reykjavik, iceland': 'Iceland', 'tirana, albania': 'Albania',

      // North America
      'new york, usa': 'USA', 'los angeles, usa': 'USA', 'san francisco, usa': 'USA', 'chicago, usa': 'USA', 'houston, usa': 'USA',
      'miami, usa': 'USA', 'washington, d.c., usa': 'USA', 'boston, usa': 'USA', 'toronto, canada': 'Canada', 'vancouver, canada': 'Canada',
      'montreal, canada': 'Canada', 'ottawa, canada': 'Canada', 'calgary, canada': 'Canada', 'mexico city, mexico': 'Mexico',
      'guadalajara, mexico': 'Mexico', 'monterrey, mexico': 'Mexico', 'san juan, puerto rico': 'Puerto Rico', 'havana, cuba': 'Cuba',
      'kingston, jamaica': 'Jamaica', 'port-au-prince, haiti': 'Haiti', 'santo domingo, dominican republic': 'Dominican Republic',
      'panama city, panama': 'Panama', 'san jose, costa rica': 'Costa Rica', 'guatemala city, guatemala': 'Guatemala',
      'tegucigalpa, honduras': 'Honduras', 'san salvador, el salvador': 'El Salvador', 'managua, nicaragua': 'Nicaragua',
      'belmopan, belize': 'Belize',

      // South America
      'são paulo, brazil': 'Brazil', 'rio de janeiro, brazil': 'Brazil', 'brasília, brazil': 'Brazil',
      'buenos aires, argentina': 'Argentina', 'córdoba, argentina': 'Argentina', 'santiago, chile': 'Chile', 'valparaíso, chile': 'Chile',
      'bogotá, colombia': 'Colombia', 'medellín, colombia': 'Colombia', 'lima, peru': 'Peru', 'quito, ecuador': 'Ecuador',
      'caracas, venezuela': 'Venezuela', 'la paz, bolivia': 'Bolivia', 'asunción, paraguay': 'Paraguay', 'montevideo, uruguay': 'Uruguay',
      'georgetown, guyana': 'Guyana', 'paramaribo, suriname': 'Suriname',

      // Oceania
      'sydney, australia': 'Australia', 'melbourne, australia': 'Australia', 'brisbane, australia': 'Australia',
      'perth, australia': 'Australia', 'adelaide, australia': 'Australia', 'auckland, new zealand': 'New Zealand',
      'wellington, new zealand': 'New Zealand', 'christchurch, new zealand': 'New Zealand', 'suva, fiji': 'Fiji',
      'port moresby, papua new guinea': 'Papua New Guinea', 'apia, samoa': 'Samoa', 'nukuʻalofa, tonga': 'Tonga',
      'port vila, vanuatu': 'Vanuatu', 'honiara, solomon islands': 'Solomon Islands', 'funafuti, tuvalu': 'Tuvalu',
      'palikir, micronesia': 'Micronesia', 'majuro, marshall islands': 'Marshall Islands', 'yaren, nauru': 'Nauru',
      'tarawa, kiribati': 'Kiribati'
    };

    // Convert to lowercase and check direct mapping
    const lowerLocation = location.toLowerCase();
    
    // Check for direct city mapping
    if (locationMappings[lowerLocation]) {
      return locationMappings[lowerLocation];
    }
    
    // Try to extract country from comma-separated location (e.g., "Dubai, UAE")
    const parts = location.split(',').map(part => part.trim());
    if (parts.length > 1) {
      const lastPart = parts[parts.length - 1].toLowerCase();
      
      // Common country name mappings
      const countryMappings: { [key: string]: string } = {
        'uae': 'UAE', 'united arab emirates': 'UAE',
        'saudi arabia': 'Saudi Arabia', 'ksa': 'Saudi Arabia',
        'kuwait': 'Kuwait', 'qatar': 'Qatar', 'bahrain': 'Bahrain', 'oman': 'Oman',
        'jordan': 'Jordan', 'iraq': 'Iraq', 'lebanon': 'Lebanon', 'syria': 'Syria',
        'yemen': 'Yemen', 'israel': 'Israel', 'palestine': 'Palestine', 'iran': 'Iran', 'turkey': 'Turkey',
        'egypt': 'Egypt', 'nigeria': 'Nigeria', 'south africa': 'South Africa', 'kenya': 'Kenya',
        'morocco': 'Morocco', 'ghana': 'Ghana', 'ethiopia': 'Ethiopia', 'algeria': 'Algeria',
        'senegal': 'Senegal', 'tunisia': 'Tunisia', 'uganda': 'Uganda', 'zimbabwe': 'Zimbabwe',
        'mozambique': 'Mozambique', 'angola': 'Angola', 'dr congo': 'DR Congo', 'republic of the congo': 'Republic of the Congo',
        'madagascar': 'Madagascar', 'libya': 'Libya', 'sudan': 'Sudan', 'botswana': 'Botswana',
        'namibia': 'Namibia', 'mali': 'Mali', 'burkina faso': 'Burkina Faso', 'zambia': 'Zambia',
        'côte d\'ivoire': 'Côte d\'Ivoire', 'sierra leone': 'Sierra Leone', 'gambia': 'Gambia',
        'liberia': 'Liberia', 'rwanda': 'Rwanda', 'malawi': 'Malawi', 'djibouti': 'Djibouti',
        'mauritania': 'Mauritania', 'mauritius': 'Mauritius', 'seychelles': 'Seychelles',
        'comoros': 'Comoros', 'são tomé and príncipe': 'São Tomé and Príncipe',
        'china': 'China', 'japan': 'Japan', 'south korea': 'South Korea', 'north korea': 'North Korea',
        'thailand': 'Thailand', 'singapore': 'Singapore', 'malaysia': 'Malaysia', 'indonesia': 'Indonesia',
        'philippines': 'Philippines', 'india': 'India', 'pakistan': 'Pakistan', 'bangladesh': 'Bangladesh',
        'nepal': 'Nepal', 'sri lanka': 'Sri Lanka', 'vietnam': 'Vietnam', 'taiwan': 'Taiwan',
        'mongolia': 'Mongolia', 'cambodia': 'Cambodia', 'laos': 'Laos', 'myanmar': 'Myanmar',
        'timor-leste': 'Timor-Leste', 'bhutan': 'Bhutan', 'maldives': 'Maldives', 'uzbekistan': 'Uzbekistan',
        'kyrgyzstan': 'Kyrgyzstan', 'tajikistan': 'Tajikistan', 'turkmenistan': 'Turkmenistan',
        'kazakhstan': 'Kazakhstan', 'armenia': 'Armenia', 'azerbaijan': 'Azerbaijan', 'georgia': 'Georgia',
        'uk': 'UK', 'united kingdom': 'UK', 'france': 'France', 'germany': 'Germany', 'spain': 'Spain',
        'italy': 'Italy', 'netherlands': 'Netherlands', 'belgium': 'Belgium', 'switzerland': 'Switzerland',
        'austria': 'Austria', 'sweden': 'Sweden', 'denmark': 'Denmark', 'norway': 'Norway',
        'ireland': 'Ireland', 'portugal': 'Portugal', 'czech republic': 'Czech Republic', 'poland': 'Poland',
        'hungary': 'Hungary', 'greece': 'Greece', 'russia': 'Russia', 'finland': 'Finland',
        'estonia': 'Estonia', 'latvia': 'Latvia', 'lithuania': 'Lithuania', 'slovakia': 'Slovakia',
        'slovenia': 'Slovenia', 'croatia': 'Croatia', 'serbia': 'Serbia', 'bosnia and herzegovina': 'Bosnia and Herzegovina',
        'montenegro': 'Montenegro', 'north macedonia': 'North Macedonia', 'bulgaria': 'Bulgaria',
        'romania': 'Romania', 'moldova': 'Moldova', 'ukraine': 'Ukraine', 'belarus': 'Belarus',
        'luxembourg': 'Luxembourg', 'monaco': 'Monaco', 'san marino': 'San Marino', 'andorra': 'Andorra',
        'liechtenstein': 'Liechtenstein', 'malta': 'Malta', 'iceland': 'Iceland', 'albania': 'Albania',
        'usa': 'USA', 'united states': 'USA', 'canada': 'Canada', 'mexico': 'Mexico', 'puerto rico': 'Puerto Rico',
        'cuba': 'Cuba', 'jamaica': 'Jamaica', 'haiti': 'Haiti', 'dominican republic': 'Dominican Republic',
        'panama': 'Panama', 'costa rica': 'Costa Rica', 'guatemala': 'Guatemala', 'honduras': 'Honduras',
        'el salvador': 'El Salvador', 'nicaragua': 'Nicaragua', 'belize': 'Belize', 'brazil': 'Brazil',
        'argentina': 'Argentina', 'chile': 'Chile', 'colombia': 'Colombia', 'peru': 'Peru', 'ecuador': 'Ecuador',
        'venezuela': 'Venezuela', 'bolivia': 'Bolivia', 'paraguay': 'Paraguay', 'uruguay': 'Uruguay',
        'guyana': 'Guyana', 'suriname': 'Suriname', 'australia': 'Australia', 'new zealand': 'New Zealand',
        'fiji': 'Fiji', 'papua new guinea': 'Papua New Guinea', 'samoa': 'Samoa', 'tonga': 'Tonga',
        'vanuatu': 'Vanuatu', 'solomon islands': 'Solomon Islands', 'tuvalu': 'Tuvalu', 'micronesia': 'Micronesia',
        'marshall islands': 'Marshall Islands', 'nauru': 'Nauru', 'kiribati': 'Kiribati'
      };
      
      if (countryMappings[lastPart]) {
        return countryMappings[lastPart];
      }
    }
    
    // Check if location contains country name
    for (const [country, mappedCountry] of Object.entries(countryMappings)) {
      if (lowerLocation.includes(country)) {
        return mappedCountry;
      }
    }
    
    // If no match found, try to extract the last part as country
    if (parts.length > 1) {
      return parts[parts.length - 1].trim();
    }
    
    return location; // Return the original location if no mapping found
  }

  async getStepGuidance(step: string, context: UserContext): Promise<AIGuidanceResponse> {
    if (!this.openai) {
      return {
        message: "AI guidance is currently unavailable. Please check your configuration.",
      };
    }

    try {
      // Check rate limiting first
      if (Date.now() < this.rateLimitedUntil) {
        return {
          message: "AI guidance is temporarily unavailable due to API limits. Please try again later or continue with the form manually.",
        };
      }

      const stepPrompts = {
        'welcome': 'Provide a warm welcome and overview of the financial planning process for this global expat.',
        'profile-setup': 'Help the user understand why their profile information is important for personalized financial planning.',
        'emergency-fund': 'Explain the importance of emergency funds for expats and provide guidance on building one.',
        'financial-goals': 'Help the user understand how to set and prioritize their financial goals.',
        'retirement-plan': 'Provide guidance on retirement planning considerations for expats.',
        'risk-&-returns': 'Explain investment risk and return concepts in simple terms.',
      };

      const messages: any[] = [
        { role: "system", content: this.buildSystemPrompt() }
      ];

      // Only add web search for emergency fund step to reduce API calls
      if (step === 'emergency-fund' && context.location) {
        const location = context.location || 'UAE';
        const country = this.getCountryFromLocation(location);
        
        try {
          console.log(`🌐 Getting live bank information for ${country} using web search...`);
          
          // Try live web search for bank information
          const searchPrompt = `Search for current 2024-2025 RETAIL bank savings account and time deposit interest rates in ${country}. Focus on personal/individual banking accounts suitable for emergency funds for expats, not corporate or investment banking. Return highest rates first.`;
          
          const response = await this.openai.responses.create({
            model: 'gpt-4o-mini',
            input: searchPrompt,
            tools: [{ type: "web_search_preview" }],
            temperature: 0.7
          });

          const bankInfo = response.output_text || 'Current banking information search was unsuccessful.';
          
          messages.push({
            role: "user", 
            content: `${this.buildContextPrompt(context)}

Current Live Bank Information for ${country}:
${bankInfo}

${stepPrompts[step as keyof typeof stepPrompts] || 'Please provide general financial guidance for this step.'}`
          });
          
        } catch (error) {
          console.warn('Live web search failed for step guidance:', error);
          // Use regular prompt without bank information
          messages.push({
            role: "user", 
            content: `${this.buildContextPrompt(context)}

${stepPrompts[step as keyof typeof stepPrompts] || 'Please provide general financial guidance for this step.'}`
          });
        }
      } else {
        messages.push({
          role: "user", 
          content: `${this.buildContextPrompt(context)}

${stepPrompts[step as keyof typeof stepPrompts] || 'Please provide general financial guidance for this step.'}`
        });
      }

      return await this.rateLimitedCall(async () => {
        const completion = await this.openai!.chat.completions.create({
          model: "gpt-4o-mini",
        messages,
        max_tokens: 500,
        temperature: 0.7,
      });

      const message = completion.choices[0]?.message?.content || "I'm sorry, I couldn't generate guidance at this time.";

      return {
        message: this.cleanMarkupFromResponse(message),
      };
      });

    } catch (error: any) {
      console.error('AI Service Error:', error);
      if (error.message?.includes('rate limit')) {
      return {
          message: "AI guidance is temporarily unavailable due to high demand. You can continue with the planning process manually, and AI features will be restored shortly.",
        };
      }
      return {
        message: "I'm having trouble connecting right now. Please continue with your planning, and try the AI guidance again later.",
      };
    }
  }

  async askQuestion(question: string, context: UserContext, conversationHistory?: {type: 'user' | 'ai', content: string}[]): Promise<AIGuidanceResponse> {
    if (!this.openai) {
      return {
        message: "AI chat is currently unavailable. Please check your API configuration.",
      };
    }

    // Check if this is a form filling request for goals
    const formFillKeywords = ['fill', 'complete', 'set', 'suggest', 'recommend', 'goal', 'amount', 'estimate'];
    const questionLower = question.toLowerCase();
    const isFormFillRequest = formFillKeywords.some(keyword => questionLower.includes(keyword)) && context.currentStep === 'financial-goals';

    // Bank selection is now handled by the dropdown, not through chat

    try {
      // Handle form filling requests for goals
      if (isFormFillRequest) {
        const messages: any[] = [
          { role: "system", content: `You are a specialized goal planning expert for global expats. When users ask for goal recommendations or form filling, provide detailed, personalized advice based on their specific situation and existing goal portfolio.

CRITICAL INFLATION REQUIREMENT - MANDATORY:
🔥 ALL COST ESTIMATES MUST BE INFLATION-ADJUSTED 🔥
- Apply appropriate annual inflation rates to ALL cost projections
- Education: 4-6% annual inflation (higher for international programs)
- Travel: 3-4% annual inflation for flights, hotels, activities
- Property: 2-8% annual inflation depending on location and market
- Lifestyle/Gifts: 3-5% annual inflation for lifestyle costs
- ALWAYS provide inflation-adjusted amounts in goalAmount field
- Explain inflation impact in your response text

EXISTING GOALS AWARENESS:
- Always consider the user's existing goals when making new recommendations
- Avoid duplicate or overly similar goals unless specifically requested
- Check for portfolio balance across categories (Education, Travel, Home, Gift)
- Consider total monthly commitment and affordability
- Suggest timeline spacing to avoid goal conflicts
- Recommend complementary goals that fill gaps in their portfolio

EXPERTISE AREAS:
- Education costs in local and international markets (WITH INFLATION ADJUSTMENTS)
- Travel budgets for different destinations and trip types (WITH INFLATION ADJUSTMENTS)
- Property down payments across local and international markets (WITH INFLATION ADJUSTMENTS)
- Cultural gift-giving expectations and amounts (WITH INFLATION ADJUSTMENTS)
- Timeline planning based on life circumstances

RESPONSE FORMAT:
1. Provide detailed, conversational explanation of your recommendations
2. EXPLICITLY explain inflation calculations and assumptions used
3. Acknowledge their existing goals and how this new goal fits their portfolio
4. Ask any clarifying questions if needed
5. When ready to fill the form, end with a JSON object in this EXACT format:

CRITICAL NAMING GUIDELINES:
- Goal names must be SHORT and CONCISE (2-4 words maximum)
- Use simple, clear titles like "Master's Degree", "Europe Trip", "House Deposit", "Wedding Gift"
- Avoid long descriptive sentences or explanations in the goal name
- The goal name should be what appears in their savings tracker

{
  "formFillData": {
    "goalName": "Short, concise name (2-4 words max)",
    "goalAmount": number (in their currency),
    "goalCategory": "Education|Travel|Gift|Home", 
    "targetMonth": number (1-12),
    "targetYear": number,
    "paymentFrequency": "Once|Monthly|Quarterly|Biannual|Annual",
    "paymentPeriod": number (in YEARS - only for Education/Home categories, e.g., 4 for 4 years)
  }
}

USER CONTEXT:
- Name: ${context.name}
- Nationality: ${context.nationality} 
- Location: ${context.location}
- Monthly Income: ${context.monthlyIncome} ${context.currency}
- Currency: ${context.currency}
${context.planningType === 'family' ? `- Planning Type: Family planning for ${context.familySize} members
- Family Goal Adjustments: Consider family-appropriate amounts, education for children, larger housing needs, family travel costs` : '- Planning Type: Individual planning'}

BASE CALCULATIONS ON:
- Their income level and affordability (suggest 10-20% of monthly income for goal savings)
- Location-specific costs and market conditions WITH MANDATORY INFLATION ADJUSTMENTS
- Cultural and practical considerations for their nationality
- Realistic timelines based on goal type and urgency
- INFLATION-ADJUSTED FUTURE VALUES: Always calculate what things will cost at the target date, not today's prices

INFLATION CALCULATION EXAMPLES:
- Goal in 5 years with 4% inflation: Today's 100,000 becomes 121,665 (multiply by 1.04^5)
- Education goal in 8 years with 5% inflation: Today's 150,000 becomes 221,699 (multiply by 1.05^8)
- Travel goal in 3 years with 3% inflation: Today's 25,000 becomes 27,318 (multiply by 1.03^3)

PAYMENT PERIOD GUIDELINES:
- Only use paymentPeriod for Education and Home categories
- TARGET DATE = When the goal starts (when you need the money/when payments BEGIN)
- PAYMENT PERIOD = Duration of ongoing payments AFTER the target date
- PAYMENT FREQUENCY = How often payments are made during the payment period

Education Example: 
- Target Date: 2031 (when child starts university)
- Payment Period: 4 years (duration of university studies AFTER 2031)
- Payment Frequency: Biannual (payments every semester during those 4 years)
- Total Cost: 150,000 (spread over the 4-year payment period)

Home Example:
- Target Date: 2026 (when you buy the house)
- Payment Period: 25 years (mortgage duration AFTER purchase)
- Payment Frequency: Monthly (monthly mortgage payments for 25 years)

Travel/Gift: Always use "Once" frequency, no payment period needed (lump sum at target date)

CRITICAL DATE REQUIREMENTS:
- Current date is: ${new Date().toLocaleDateString()}
- Current month: ${new Date().getMonth() + 1}, Current year: ${new Date().getFullYear()}
- ALWAYS ensure targetMonth/targetYear combination creates a date that is CLEARLY in the future
- For goals in 2025, use month 6 or later to avoid edge cases
- For goals in 2026 or later, any month is acceptable
- NEVER use dates that could be interpreted as past dates due to timezone differences` }
        ];

        // Add conversation history if available
        if (conversationHistory && conversationHistory.length > 0) {
          conversationHistory.forEach(msg => {
          messages.push({
              role: msg.type === 'user' ? 'user' : 'assistant',
              content: msg.content
          });
          });
        }

        // Add current question
        messages.push({
          role: "user", 
          content: `User Request: ${question}

Current form state:
- Goal Name: ${context.currentFormData?.goalName || 'Empty'}
- Amount: ${context.currentFormData?.goalAmount || 'Empty'} 
- Category: ${context.currentFormData?.goalCategory || 'Empty'}
- Target Date: ${context.currentFormData?.targetMonth || 'Empty'}/${context.currentFormData?.targetYear || 'Empty'}

Please help with their goal planning request. Be specific and practical in your recommendations.`
        });

      const completion = await this.openai.chat.completions.create({
        model: "gpt-4o-mini",
        messages,
          max_tokens: 1500,
        temperature: 0.7,
      });

        const response = completion.choices[0]?.message?.content || "I'm sorry, I couldn't generate goal recommendations at this time.";
        
        // Try to extract form fill data from response
        let formFillData = undefined;
        try {
          const jsonMatch = response.match(/\{[\s\S]*"formFillData"[\s\S]*\}/);
          if (jsonMatch) {
            const parsedData = JSON.parse(jsonMatch[0]);
            formFillData = parsedData.formFillData;
          }
        } catch (parseError) {
          console.warn('Could not parse form fill data from AI response:', parseError);
        }

              // Clean up the response by removing JSON and markup
        const cleanedMessage = this.cleanMarkupFromResponse(
          response.replace(/\{[\s\S]*"formFillData"[\s\S]*\}/, '').trim()
        );

      return {
          message: cleanedMessage,
          formFillData
      };
      }

      // Check if question needs web search for goal-specific information
      const goalWebSearchKeywords = ['university cost', 'tuition fees', 'travel cost', 'property price', 'house price', 'flight cost', 'hotel price', 'study abroad', 'education cost'];
      const bankRateSearchKeywords = ['bank rate', 'interest rate', 'deposit rate', 'savings rate', 'time deposit', 'fixed deposit', 'current rates', 'live rates', 'comprehensive', 'retail bank'];
      const needsWebSearch = goalWebSearchKeywords.some(keyword => questionLower.includes(keyword)) || 
                            bankRateSearchKeywords.some(keyword => questionLower.includes(keyword));

      if (needsWebSearch && context.location) {
        const location = context.location || 'UAE';
        const country = this.getCountryFromLocation(location);
        
        try {
          // Method 1: Try new Responses API with web search tool (preferred)
          console.log('🌐 Using OpenAI Responses API with web search tool...');
          
          const searchPrompt = `User: ${context.name} from ${context.nationality} living in ${context.location}
Income: ${context.monthlyIncome} ${context.currency}
Currency: ${context.currency}

User Question: ${question}

Please search the web for current 2025 information to help answer their question. Focus on:
- Bank interest rates and deposit rates (if bank-related query)
- Education costs (tuition, living expenses, specific universities)
- Travel costs (flights, hotels, destination budgets)  
- Property prices (down payments, market conditions)
- Any other relevant cost information for their goal

For bank rate searches: Look for current January 2025 rates from official bank websites, financial news, and rate comparison sites.
For other searches: Provide specific, current data with realistic estimates in their currency (${context.currency}).

Include sources where possible and verify information is current and from 2025.`;

          const response = await this.openai.responses.create({
            model: 'gpt-4o-mini',
            input: searchPrompt,
            tools: [{ type: "web_search_preview" }],
            temperature: 0.7
          });

      return {
            message: response.output_text || "I'm sorry, I couldn't find current information at this time.",
      };

        } catch (responsesError) {
          console.warn('Responses API failed, trying Chat Completions with search model...', responsesError);
          
          try {
            // Method 2: Fallback to Chat Completions API with search model
            console.log('🔍 Using OpenAI Chat Completions with search model...');
            
            const messages: any[] = [
              { role: "system", content: `You are a specialized financial planning expert for global expats. Help users with education costs, travel planning, property purchases, bank rate searches, and other financial goals. Use web search to get current, accurate information.

For bank rate searches: Focus on current January 2025 interest rates from retail/personal banking products. Search official bank websites, financial news, and rate comparison sites.

For other queries: Provide current cost information and practical financial advice.` }
            ];

            // Add conversation history if available
            if (conversationHistory && conversationHistory.length > 0) {
              conversationHistory.forEach(msg => {
                messages.push({
                  role: msg.type === 'user' ? 'user' : 'assistant',
                  content: msg.content
                });
              });
            }

            // Add current question with context
            messages.push({ 
              role: "user", 
              content: `User: ${context.name} from ${context.nationality} living in ${context.location}
Income: ${context.monthlyIncome} ${context.currency}

Question: ${question}

Please search for current 2025 cost information to help with their goal planning. Provide specific estimates in ${context.currency} with realistic timelines and recommendations.`
            });

            const completion = await this.openai.chat.completions.create({
              model: 'gpt-4o-mini-search-preview',
              messages,
              max_tokens: 3000, // Increased from 2000 for comprehensive bank data
              temperature: 0.7,
            });

            const message = completion.choices[0]?.message?.content || "I'm sorry, I couldn't find current information at this time.";

      return {
              message: this.cleanMarkupFromResponse(message),
            };

          } catch (searchModelError) {
            console.warn('Search model failed, falling back to regular chat with cached data...', searchModelError);
            
            // Method 3: Final fallback - return error message for live-only system
        return {
              message: "I'm unable to get current cost information right now. Please try again in a moment or I can help with general goal planning based on typical costs.",
        };
      }
        }
      } else {
        // Regular chat for goal planning questions
        const systemPrompt = `You are a specialized goal planning coach for global expats. Help users plan specific financial goals through interactive conversations.

CRITICAL INFLATION REQUIREMENT:
🔥 ALWAYS FACTOR INFLATION INTO ALL COST DISCUSSIONS AND RECOMMENDATIONS 🔥
- Apply 3-5% annual inflation rate to all cost projections
- Education costs: 4-6% annual inflation
- Travel costs: 3-4% annual inflation  
- Property costs: 2-8% annual inflation (location-dependent)
- Lifestyle/Gift costs: 3-5% annual inflation
- ALWAYS mention inflation when discussing goal amounts or costs
- Explain how inflation affects purchasing power over time

${context.currentGoalContext?.isEditingGoal ? 
`CURRENT CONTEXT: You are helping the user with their "${context.currentGoalContext.goalBeingEdited?.name}" goal (${context.currentGoalContext.goalBeingEdited?.category}).
- Current Amount: ${context.currentGoalContext.goalBeingEdited?.amount?.toLocaleString()} ${context.currency || 'USD'}
- Target Date: ${context.currentGoalContext.goalBeingEdited?.targetDate ? new Date(context.currentGoalContext.goalBeingEdited.targetDate).toLocaleDateString() : 'Not set'}
- Monthly Required: ${context.currentGoalContext.goalBeingEdited?.requiredPMT?.toLocaleString()} ${context.currency || 'USD'}

Focus your advice on this specific goal. Consider if the current amount needs inflation adjustment for the target date.` :
context.currentGoalContext?.isCreatingNew ? 
`CURRENT CONTEXT: You are helping the user create a new ${context.currentFormData?.goalCategory || 'financial'} goal.
- Goal Name: ${context.currentFormData?.goalName || 'Not set yet'}
- Amount: ${context.currentFormData?.goalAmount ? context.currentFormData.goalAmount.toLocaleString() + ' ' + (context.currency || 'USD') : 'Not set yet'}
- Target: ${context.currentFormData?.targetMonth && context.currentFormData?.targetYear ? `${context.currentFormData.targetMonth}/${context.currentFormData.targetYear}` : 'Not set yet'}

Focus your advice on planning this new goal. Ensure all cost estimates are inflation-adjusted to the target date.` :
'CURRENT CONTEXT: You are in the general goals overview. Help them with their overall goal portfolio or guide them to work on specific goals. Always consider inflation when discussing existing or new goals.'
}

Your expertise includes:
- Education planning (university costs, school selection, timing) - ALWAYS apply 4-6% annual inflation

SPECIALIZED GUIDANCE FOR EDUCATION GOALS:

1. **Comprehensive Cost Breakdown WITH INFLATION**: Include ALL education-related costs inflation-adjusted to target date:
   - Tuition fees (with annual increases of 4-6%)
   - Living expenses, visa costs, travel, insurance (with 3-4% inflation)
   - Emergency buffer (10-15% of total inflation-adjusted amount)
2. **Payment Timeline Clarity**: Target date = when studies BEGIN, Payment period = duration of studies
3. **Local vs International Analysis**: Compare local universities, regional options, international programs (all inflation-adjusted)
4. **Scholarship Strategy**: Academic targets, extracurricular activities, competition participation plans
5. **Risk Mitigation**: Career interest changes, currency risks, backup plans
6. **Regular Reviews**: Annual adjustments for inflation, cost changes, interest evolution
- Travel planning (destination suggestions, budget estimation) - ALWAYS apply 3-4% annual inflation
- Home purchases (down payments, market research) - ALWAYS apply 2-8% annual property inflation
- Gift planning (cultural expectations, appropriate amounts) - ALWAYS apply 3-5% annual lifestyle inflation

Be conversational, ask follow-up questions, and provide specific, actionable advice based on their situation as a ${context.nationality} expat living in ${context.location} earning ${context.monthlyIncome} ${context.currency}${context.planningType === 'family' ? ` planning for a family of ${context.familySize} members` : ''}.

Focus on practical goal planning with mandatory inflation considerations, not investment advice or banking recommendations.`;

        const messages: any[] = [
          { role: "system", content: systemPrompt }
        ];

        // Add conversation history if available
        if (conversationHistory && conversationHistory.length > 0) {
          conversationHistory.forEach(msg => {
            messages.push({
              role: msg.type === 'user' ? 'user' : 'assistant',
              content: msg.content
            });
          });
        }

        // Add current question with context
        messages.push({
          role: "user", 
          content: `User Question: ${question}

Current situation:
- Name: ${context.name}
- Nationality: ${context.nationality}
- Location: ${context.location}  
- Monthly Income: ${context.monthlyIncome} ${context.currency}
- Planning Type: ${context.planningType || 'individual'}${context.planningType === 'family' ? ` (family of ${context.familySize} members)` : ''}
- Existing Goals: ${context.goals?.length || 0}

Provide helpful, specific guidance for their goal planning question. Ask follow-up questions to better understand their needs.`
        });

        const completion = await this.openai.chat.completions.create({
          model: "gpt-4o-mini",
          messages,
          max_tokens: 1200, // Increased from 800 for better responses
          temperature: 0.7,
        });

        const message = completion.choices[0]?.message?.content || "I'm sorry, I couldn't answer your question at this time.";

        return {
          message: this.cleanMarkupFromResponse(message),
        };
      }
    } catch (error) {
      console.error('AI Service Error:', error);
      return {
        message: "I'm having trouble connecting right now. Please try again in a moment.",
      };
    }
  }

  // Method to get bank options for a specific country
  private getBankOptionsForCountry(country: string): BankOption[] {
    console.log('getBankOptionsForCountry called with:', country);
    
    const bankOptionsMap: { [key: string]: BankOption[] } = {
      'Kuwait': [
        {
          id: 'nbk-super',
          bankName: 'NBK',
          accountType: 'Super Account',
          interestRate: '0.15% APY',
          returnRate: 0.0015,
          features: 'High liquidity, min. KD 500, max 3 withdrawals/month',
          website: 'https://www.nbk.com/kuwait',
          mobileApp: 'NBK Mobile Banking'
        },
        {
          id: 'nbk-time',
          bankName: 'NBK',
          accountType: 'Time Deposits',
          interestRate: '4.25-4.5% APY',
          returnRate: 0.04375,
          features: 'Best returns, 3-24 months',
          website: 'https://www.nbk.com/kuwait',
          mobileApp: 'NBK Mobile Banking'
        },
        {
          id: 'gulf-esavings',
          bankName: 'Gulf Bank Kuwait',
          accountType: 'e-Savings Account',
          interestRate: '0.125% APY',
          returnRate: 0.00125,
          features: 'Fully digital access',
          website: 'https://www.e-gulfbank.com',
          mobileApp: 'Gulf Bank Mobile'
        },
        {
          id: 'gulf-time',
          bankName: 'Gulf Bank Kuwait',
          accountType: 'Time Deposits',
          interestRate: '4.0-4.25% APY',
          returnRate: 0.04125,
          features: 'Good returns, 1-24 months',
          website: 'https://www.e-gulfbank.com',
          mobileApp: 'Gulf Bank Mobile'
        },
        {
          id: 'boubyan-savings',
          bankName: 'Boubyan Bank',
          accountType: 'Savings Account',
          interestRate: 'Competitive Islamic rates',
          returnRate: 0.035,
          features: 'Islamic banking, Sharia-compliant',
          website: 'https://www.boubyan.com',
          mobileApp: 'Boubyan Mobile'
        },
        {
          id: 'boubyan-investment',
          bankName: 'Boubyan Bank',
          accountType: 'Time Investment',
          interestRate: '3.75-4.4% APY',
          returnRate: 0.04075,
          features: 'Islamic returns, Sharia-compliant',
          website: 'https://www.boubyan.com',
          mobileApp: 'Boubyan Mobile'
        }
      ],
      'UAE': [
        {
          id: 'enbd-savings',
          bankName: 'Emirates NBD',
          accountType: 'Savings Account',
          interestRate: 'up to 0.6% APY',
          returnRate: 0.006,
          features: 'min. AED 3,000',
          website: 'https://www.emiratesnbd.com',
          mobileApp: 'Emirates NBD Mobile'
        },
        {
          id: 'enbd-time',
          bankName: 'Emirates NBD',
          accountType: 'Time Deposits',
          interestRate: '4.4-4.7% APY',
          returnRate: 0.0455,
          features: 'Best returns, 3-24 months',
          website: 'https://www.emiratesnbd.com',
          mobileApp: 'Emirates NBD Mobile'
        },
        {
          id: 'adcb-plus',
          bankName: 'ADCB',
          accountType: 'Savings Plus',
          interestRate: 'up to 1.7% APY',
          returnRate: 0.017,
          features: 'Best flexible rate, tiered rates',
          website: 'https://www.adcb.com',
          mobileApp: 'ADCB Mobile'
        },
        {
          id: 'adcb-time',
          bankName: 'ADCB',
          accountType: 'Time Deposits',
          interestRate: '4.5-4.9% APY',
          returnRate: 0.047,
          features: 'Highest returns, 6-24 months',
          website: 'https://www.adcb.com',
          mobileApp: 'ADCB Mobile'
        },
        {
          id: 'fab-savings',
          bankName: 'FAB',
          accountType: 'Savings Account',
          interestRate: 'up to 1.4% APY',
          returnRate: 0.014,
          features: 'Good rate, min. AED 3,000',
          website: 'https://www.bankfab.com',
          mobileApp: 'FAB Mobile'
        },
        {
          id: 'fab-fixed',
          bankName: 'FAB',
          accountType: 'Fixed Deposits',
          interestRate: '4.3-4.6% APY',
          returnRate: 0.045,
          features: 'Good returns, 3-24 months',
          website: 'https://www.bankfab.com',
          mobileApp: 'FAB Mobile'
        },
        {
          id: 'hsbc-uae-premier',
          bankName: 'HSBC UAE',
          accountType: 'Premier Savings',
          interestRate: 'up to 1.2% APY',
          returnRate: 0.012,
          features: 'International banking',
          website: 'https://www.hsbc.ae',
          mobileApp: 'HSBC UAE'
        },
        {
          id: 'hsbc-uae-fixed',
          bankName: 'HSBC UAE',
          accountType: 'Fixed Deposits',
          interestRate: '4.2-4.5% APY',
          returnRate: 0.0435,
          features: 'Reliable returns',
          website: 'https://www.hsbc.ae',
          mobileApp: 'HSBC UAE'
        }
      ],
      'Saudi Arabia': [
        {
          id: 'rajhi-savings',
          bankName: 'Al Rajhi Bank',
          accountType: 'Savings Account',
          interestRate: 'Competitive Islamic rates',
          returnRate: 0.035,
          features: 'Sharia-compliant banking',
          website: 'https://www.alrajhibank.com.sa',
          mobileApp: 'Al Rajhi Mobile'
        },
        {
          id: 'rajhi-term',
          bankName: 'Al Rajhi Bank',
          accountType: 'Term Investments',
          interestRate: '4.4-5.3% APY',
          returnRate: 0.049,
          features: 'Best Islamic returns, 3-24 months',
          website: 'https://www.alrajhibank.com.sa',
          mobileApp: 'Al Rajhi Mobile'
        },
        {
          id: 'sabb-savings',
          bankName: 'SABB',
          accountType: 'Savings Account',
          interestRate: '1.2% APY',
          returnRate: 0.012,
          features: 'Flexible access, min. SAR 1,000',
          website: 'https://www.sabb.com',
          mobileApp: 'SABB Mobile'
        },
        {
          id: 'sabb-time',
          bankName: 'SABB',
          accountType: 'Time Deposits',
          interestRate: '4.7-5.2% APY',
          returnRate: 0.049,
          features: 'Highest conventional returns, 6-24 months',
          website: 'https://www.sabb.com',
          mobileApp: 'SABB Mobile'
        },
        {
          id: 'riyad-plus',
          bankName: 'Riyad Bank',
          accountType: 'Savings Plus',
          interestRate: '1.4% APY',
          returnRate: 0.014,
          features: 'Best flexible rate, tiered rates',
          website: 'https://www.riyadbank.com',
          mobileApp: 'Riyad Mobile'
        },
        {
          id: 'riyad-time',
          bankName: 'Riyad Bank',
          accountType: 'Time Deposits',
          interestRate: '4.5-5.0% APY',
          returnRate: 0.0475,
          features: 'Good returns, 3-24 months',
          website: 'https://www.riyadbank.com',
          mobileApp: 'Riyad Mobile'
        }
      ],
      'Qatar': [
        {
          id: 'qnb-savings',
          bankName: 'QNB',
          accountType: 'Savings Account',
          interestRate: 'Competitive rates',
          returnRate: 0.035,
          features: 'National bank, min. QAR 1,000',
          website: 'https://www.qnb.com',
          mobileApp: 'QNB Mobile'
        },
        {
          id: 'qnb-time',
          bankName: 'QNB',
          accountType: 'Time Deposits',
          interestRate: '4.4-4.8% APY',
          returnRate: 0.046,
          features: 'Good returns, 3-24 months',
          website: 'https://www.qnb.com',
          mobileApp: 'QNB Mobile'
        },
        {
          id: 'hsbc-qatar-premier',
          bankName: 'HSBC Qatar',
          accountType: 'Premier Savings',
          interestRate: '1.2% APY',
          returnRate: 0.012,
          features: 'International banking, min. QAR 5,000',
          website: 'https://www.hsbc.com.qa',
          mobileApp: 'HSBC Qatar'
        },
        {
          id: 'hsbc-qatar-fixed',
          bankName: 'HSBC Qatar',
          accountType: 'Fixed Deposits',
          interestRate: '4.5-5.0% APY',
          returnRate: 0.0475,
          features: 'Best returns, 6-24 months',
          website: 'https://www.hsbc.com.qa',
          mobileApp: 'HSBC Qatar'
        }
      ],
      'Bahrain': [
        {
          id: 'nbb-savings',
          bankName: 'NBB',
          accountType: 'Savings Account',
          interestRate: 'Competitive rates',
          returnRate: 0.035,
          features: 'National bank, min. BHD 100',
          website: 'https://www.nbbonline.com',
          mobileApp: 'NBB Mobile'
        },
        {
          id: 'nbb-time',
          bankName: 'NBB',
          accountType: 'Time Deposits',
          interestRate: '4.2-4.6% APY',
          returnRate: 0.044,
          features: 'Good returns, 3-24 months',
          website: 'https://www.nbbonline.com',
          mobileApp: 'NBB Mobile'
        },
        {
          id: 'hsbc-bahrain-premier',
          bankName: 'HSBC Bahrain',
          accountType: 'Premier Savings',
          interestRate: '1.2% APY',
          returnRate: 0.012,
          features: 'Best flexible rate',
          website: 'https://www.hsbc.com.bh',
          mobileApp: 'HSBC Bahrain'
        },
        {
          id: 'hsbc-bahrain-fixed',
          bankName: 'HSBC Bahrain',
          accountType: 'Fixed Deposits',
          interestRate: '4.4-4.8% APY',
          returnRate: 0.046,
          features: 'Highest returns',
          website: 'https://www.hsbc.com.bh',
          mobileApp: 'HSBC Bahrain'
        }
      ],
      'Oman': [
        {
          id: 'bankmuscat-savings',
          bankName: 'Bank Muscat',
          accountType: 'Savings Account',
          interestRate: 'Competitive rates',
          returnRate: 0.035,
          features: 'National bank, min. OMR 100',
          website: 'https://www.bankmuscat.com',
          mobileApp: 'BankMuscat Mobile'
        },
        {
          id: 'bankmuscat-time',
          bankName: 'Bank Muscat',
          accountType: 'Time Deposits',
          interestRate: '4.0-4.4% APY',
          returnRate: 0.042,
          features: 'Good returns, 3-24 months',
          website: 'https://www.bankmuscat.com',
          mobileApp: 'BankMuscat Mobile'
        },
        {
          id: 'hsbc-oman-premier',
          bankName: 'HSBC Oman',
          accountType: 'Premier Savings',
          interestRate: '1.1% APY',
          returnRate: 0.011,
          features: 'International banking',
          website: 'https://www.hsbc.com.om',
          mobileApp: 'HSBC Oman'
        },
        {
          id: 'hsbc-oman-fixed',
          bankName: 'HSBC Oman',
          accountType: 'Fixed Deposits',
          interestRate: '4.2-4.6% APY',
          returnRate: 0.044,
          features: 'Best returns',
          website: 'https://www.hsbc.com.om',
          mobileApp: 'HSBC Oman'
        }
      ]
      // Add other countries as needed...
    };

    const result = bankOptionsMap[country] || [];
    console.log('getBankOptionsForCountry returning:', result.length, 'options for', country);
    return result;
  }

  // Helper function to clean JSON response from markdown formatting
  private cleanMarkupFromResponse(responseText: string): string {
    // Remove common markdown and markup patterns
    let cleanText = responseText
      // Remove code blocks first (including JSON in code blocks)
      .replace(/```[\s\S]*?```/g, '')
      .replace(/^```.*$/gm, '')
      // Remove JSON objects completely (most important for user experience)
      .replace(/\{[\s\S]*?\}/g, '')
      // Remove markdown headers (# ## ###)
      .replace(/^#{1,6}\s+(.+)$/gm, '$1')
      // Remove bold/italic markdown (**text** and *text*)
      .replace(/\*\*([^*]+)\*\*/g, '$1')
      .replace(/\*([^*]+)\*/g, '$1')
      // Remove backticks (`code`)
      .replace(/`([^`]+)`/g, '$1')
      .replace(/``+/g, '')
      // Remove HTML tags
      .replace(/<[^>]*>/g, '')
      // Remove comment-style markup (// text)
      .replace(/^\/\/\s*(.+)$/gm, '$1')
      // Remove any remaining JSON-like patterns and orphaned characters
      .replace(/^\s*"[^"]*":\s*[^,\n}]+[,}]?\s*$/gm, '')
      .replace(/^\s*[{}]\s*$/gm, '')
      .replace(/^\s*[,;]\s*$/gm, '')
      // Remove excess whitespace and clean up
      .replace(/\n{3,}/g, '\n\n')
      .replace(/^\s*\n+/g, '')
      .replace(/\n\s*\n\s*\n/g, '\n\n')
      .trim();
    
    return cleanText;
  }

  private cleanJsonResponse(responseText: string): string {
    // Remove markdown code blocks if present
    const jsonMatch = responseText.match(/```(?:json)?\s*([\s\S]*?)\s*```/);
    if (jsonMatch) {
      return jsonMatch[1].trim();
    }
    
    // If no code blocks, return the response as-is (it might already be clean JSON)
    return responseText.trim();
  }

  // Comprehensive Retirement Planning Method (Single AI Call)
  async getComprehensiveRetirementPlan(context: UserContext): Promise<RetirementPlanningResponse> {
    if (!this.openai) {
      return {
        message: "I'm sorry, AI features are not available right now. Please try setting your retirement destination manually."
      };
    }

    try {
      // Calculate current expenses for retirement planning (2 adults for families)
      const retirementExpenses = context.monthlyExpenses ? 
        (context.planningType === 'family' && context.familySize && context.familySize > 2 
          ? Math.round(context.monthlyExpenses * (2 / context.familySize)) // Scale down to 2 adults
          : context.monthlyExpenses
        ) : undefined;

      // Build family context
      const familyContext = context.planningType === 'family' ? `

FAMILY PLANNING CONTEXT:
- Planning Type: Family retirement planning
- Current Family Size: ${context.familySize || 'Not specified'} people
- Retirement Planning For: 2 adults (adjusted from family expenses)
- Current Family Monthly Expenses: ${context.monthlyExpenses || 'Not specified'} ${context.currency || ''}
- Adjusted Retirement Expenses (2 adults): ${retirementExpenses || 'Not specified'} ${context.currency || ''} per month

IMPORTANT: Base all cost estimates on the adjusted retirement expenses for 2 adults, not the full family size.` : '';

      // Build preferences context
      const preferencesContext = context.retirementPreferences ? `

RETIREMENT PREFERENCES:
- Budget Priority: ${context.retirementPreferences.budgetPriority} (${
        context.retirementPreferences.budgetPriority === 'low-cost' ? 'Focus on affordable, low-cost destinations that stretch retirement savings' :
        context.retirementPreferences.budgetPriority === 'moderate' ? 'Balanced approach - comfortable lifestyle without excessive costs' :
        'Premium comfort and quality of life, budget is flexible'
      })
- Climate Preference: ${context.retirementPreferences.weatherPreference} (${
        context.retirementPreferences.weatherPreference === 'warm' ? 'Tropical, year-round warm weather preferred' :
        context.retirementPreferences.weatherPreference === 'temperate' ? 'Mediterranean climate with mild seasons preferred' :
        context.retirementPreferences.weatherPreference === 'cool' ? 'Cooler temperatures and crisp air preferred' :
        'Climate is not a deciding factor'
      })
- Lifestyle Type: ${context.retirementPreferences.lifestyleType} (${
        context.retirementPreferences.lifestyleType === 'quiet-peaceful' ? 'Prefer tranquil, relaxed environment close to nature' :
        context.retirementPreferences.lifestyleType === 'active-social' ? 'Want vibrant expat communities and active social life' :
        context.retirementPreferences.lifestyleType === 'cultural-urban' ? 'Prefer cities with museums, arts, and urban amenities' :
        'Beach and coastal living with marine activities preferred'
      })

IMPORTANT: Use these preferences to heavily influence your destination selection and recommendations.` : '';

      const prompt = `As a comprehensive retirement planning expert for global expats, provide both destination suggestions AND detailed cost breakdown for the user's top choice. This will be a complete retirement planning analysis in one response.

User Profile:
- Name: ${context.name || 'Valued client'}
- Current Location: ${context.location || 'Global'}
- Nationality: ${context.nationality || 'Unknown'}
- Monthly Income: ${context.monthlyIncome || 'Not specified'} ${context.currency || ''}
- Current Monthly Expenses: ${context.monthlyExpenses || 'Not specified'} ${context.currency || ''}
- Retirement Planning Expenses: ${retirementExpenses || context.monthlyExpenses || 'Not specified'} ${context.currency || ''} (for 2 adults)
- Preferred Currency: ${context.currency || 'USD'}${familyContext}${preferencesContext}

COMPREHENSIVE ANALYSIS REQUIREMENTS:

PART 1: DESTINATION SUGGESTIONS
- Suggest 5 destinations including the user's home country (${context.nationality || 'their home country'}) as the first option
- For each destination, provide cost estimates based on their current expense baseline (${retirementExpenses || context.monthlyExpenses || 'not provided'} ${context.currency || ''})
- Adjust costs for cost-of-living differences between their current location and each destination
- For family planning: calculate all costs for 2 adults only
- ${context.retirementPreferences ? 'Prioritize destinations that SPECIFICALLY match their stated preferences' : 'Choose diverse, expat-friendly destinations'}

PART 2: DETAILED BREAKDOWN FOR TOP RECOMMENDATION
- Provide a comprehensive cost breakdown for your #1 recommended destination (considering their preferences and financial situation)
- Include detailed expense categories with cost-of-living adjustments
- Compare to their current expenses with percentage changes and explanations
- Consider retirement lifestyle changes (reduced work/child costs, increased healthcare/leisure)

EXPENSE-BASED COST CALCULATION INSTRUCTIONS:
- Use the user's current expense level (${retirementExpenses || context.monthlyExpenses || 'not provided'} ${context.currency || ''}) as the baseline
- Adjust costs based on cost-of-living differences between ${context.location || 'Global'} and each destination
- For family planning: costs should reflect 2 adults only, regardless of current family size
- Provide realistic cost estimates that align with their current spending patterns

IMPORTANT CURRENCY INSTRUCTIONS:
- All cost estimates must be provided in ${context.currency || 'USD'}
- Use current exchange rates for accurate conversions
- For reference: 1 USD ≈ 3.67 AED, 3.75 SAR, 0.30 KWD, 3.64 QAR, 0.38 BHD, 0.38 OMR

Address the user by their name (${context.name || 'you'})${context.retirementPreferences ? ' and reference their specific preferences' : ''} in your response.

CRITICAL: Return ONLY a raw JSON object without any markdown formatting or code blocks. Use this exact structure:
{
  "message": "Personalized introduction message${context.retirementPreferences ? ' that mentions their specific preferences and' : ''} explaining the comprehensive analysis based on their current expenses${familyContext ? ' (adjusted for 2 adults)' : ''}",
  "destinations": [
    {
      "destination": "City, Country",
      "country": "Country",
      "estimatedMonthlyCost": 1500,
      "costOfLivingRank": "Low",
      "highlights": ["Highlight${context.retirementPreferences ? ' that matches their preferences' : ''}", "Cost comparison to current expenses", "Retirement-specific benefit"],
      "weather": "Weather description${context.retirementPreferences ? ' that relates to their preference' : ''}",
      "healthcare": "Healthcare description", 
      "visaRequirements": "Visa info"
    }
  ],
  "recommendedDestination": {
    "name": "Your top recommended destination name",
    "estimatedMonthlyCost": 1500,
    "breakdown": {
      "housing": 800,
      "food": 300, 
      "healthcare": 150,
      "transportation": 100,
      "entertainment": 100,
      "utilities": 50,
      "other": 100
    },
    "comparisonToCurrentExpenses": {
      "currentMonthlyExpenses": ${retirementExpenses || context.monthlyExpenses || 0},
      "projectedMonthlyExpenses": 1500,
      "difference": -200,
      "percentageChange": -12.5,
      "explanation": "Your retirement costs would be lower/higher than current expenses because..."
    },
    "whyRecommended": "Explanation of why this is your top choice based on their preferences, financial situation, and retirement goals",
    "tips": ["Tip based on local cost optimization", "Tip based on their expense patterns", "Retirement-specific cost tip"]
  }
}`;

      const completion = await this.openai.chat.completions.create({
        model: 'gpt-4o-mini',
        messages: [
          { role: 'system', content: `You are a comprehensive retirement planning expert for global expats. Always include the user's home country as the first destination option. Address the user by their actual name when provided. CRITICAL: Always provide all cost estimates in the user's chosen currency using accurate conversions. 

EXPENSE CALCULATION PRIORITY: Base all cost estimates on the user's current expense baseline and adjust for cost-of-living differences between locations. For family planning, calculate costs for 2 adults only. Make realistic adjustments for retirement lifestyle changes.

${context.retirementPreferences ? 'When user preferences are provided, prioritize destinations that specifically match their budget, climate, and lifestyle preferences. Your top recommendation should be the best match for their stated preferences. ' : ''}

COMPREHENSIVE APPROACH: Provide both destination options AND detailed breakdown for your top recommendation in one unified response. Ensure cost consistency between the destination suggestions and the detailed breakdown.

IMPORTANT: Return ONLY raw JSON without markdown code blocks or formatting.` },
          { role: 'user', content: prompt }
        ],
        temperature: 0.7
      });

      const responseText = completion.choices[0]?.message?.content;
      if (!responseText) {
        throw new Error('No response received');
      }

      // Clean the response before parsing
      const cleanedResponse = this.cleanJsonResponse(responseText);
      const parsedResponse = JSON.parse(cleanedResponse);
      
      const interactiveButtons: RetirementButton[] = parsedResponse.destinations?.map((dest: any, index: number) => ({
        id: `destination-${index}`,
        label: `${dest.destination} - ${dest.estimatedMonthlyCost} ${context.currency || 'USD'}/month`,
        value: dest.destination,
        type: 'destination-selection' as const,
        data: dest
      })) || [];

      return {
        message: parsedResponse.message,
        destinationSuggestions: parsedResponse.destinations,
        selectedDestination: parsedResponse.recommendedDestination,
        interactiveButtons
      };

    } catch (error) {
      console.error('Error getting comprehensive retirement plan:', error);
      return {
        message: "I'm having trouble getting your retirement plan right now. You can manually enter your preferred retirement destination and estimated monthly costs.",
        destinationSuggestions: this.getFallbackDestinations(context.nationality, context.currency)
      };
    }
  }

  private getFallbackDestinations(nationality?: string, currency?: string): RetirementDestinationSuggestion[] {
    const homeCountry = nationality || 'Your Home Country';
    const homeCity = nationality === 'UAE' ? 'UAE' :
                    nationality === 'Saudi Arabia' ? 'Saudi Arabia' :
                    nationality === 'Kuwait' ? 'Kuwait' :
                    nationality === 'Qatar' ? 'Qatar' :
                    nationality === 'Bahrain' ? 'Bahrain' :
                    nationality === 'Oman' ? 'Oman' :
                    homeCountry;
    
    // Adjust costs based on currency (rough conversion factors for estimates)
    const currencyMultiplier = currency === 'AED' ? 3.67 :
                              currency === 'SAR' ? 3.75 :
                              currency === 'KWD' ? 0.30 :
                              currency === 'QAR' ? 3.64 :
                              currency === 'BHD' ? 0.38 :
                              currency === 'OMR' ? 0.38 :
                              1; // Default to USD
    
    return [
      {
        destination: homeCity,
        country: homeCountry,
        estimatedMonthlyCost: Math.round(2000 * currencyMultiplier),
        costOfLivingRank: "Medium" as const,
        highlights: [
          "Familiarity with language and culture", 
          "Close to family and friends", 
          "No visa requirements as citizen"
        ],
        weather: "Familiar climate and seasons",
        healthcare: "Access to local healthcare system with citizenship benefits",
        visaRequirements: "No visa required - you're a citizen!"
      },
      {
        destination: "Lisbon, Portugal",
        country: "Portugal",
        estimatedMonthlyCost: Math.round(1800 * currencyMultiplier),
        costOfLivingRank: "Medium" as const,
        highlights: ["Golden Visa program", "Great weather year-round", "Excellent healthcare"],
        weather: "Mediterranean climate, mild winters",
        healthcare: "High-quality public healthcare system",
        visaRequirements: "Golden Visa available for investment"
      },
      {
        destination: "Kuala Lumpur, Malaysia",
        country: "Malaysia",
        estimatedMonthlyCost: Math.round(1200 * currencyMultiplier),
        costOfLivingRank: "Low" as const,
        highlights: ["Malaysia My Second Home program", "Low cost of living", "English widely spoken"],
        weather: "Tropical climate, warm year-round",
        healthcare: "Modern private healthcare at affordable rates",
        visaRequirements: "MM2H visa program for retirees"
      },
      {
        destination: "Dubai, UAE",
        country: "UAE",
        estimatedMonthlyCost: Math.round(2500 * currencyMultiplier),
        costOfLivingRank: "High" as const,
        highlights: ["No income tax", "World-class infrastructure", "Familiar for GCC expats"],
        weather: "Desert climate, hot summers, mild winters",
        healthcare: "Excellent private healthcare facilities",
        visaRequirements: "Retirement visa available for qualifying investors"
      },
      {
        destination: "Antalya, Turkey",
        country: "Turkey",
        estimatedMonthlyCost: Math.round(1000 * currencyMultiplier),
        costOfLivingRank: "Low" as const,
        highlights: ["Very low cost of living", "Beautiful Mediterranean coast", "Rich history and culture"],
        weather: "Mediterranean climate with hot summers",
        healthcare: "Good private healthcare options",
        visaRequirements: "Residence permit available through property purchase"
      }
    ];
  }
}

export const aiService = new AIService(); 