import React, { useState, useEffect, useCallback, useRef } from 'react';
import { usePlanner } from '../../context/PlannerContext';
import { useCurrency } from '../../context/CurrencyContext';
import Button from '../ui/Button';
import Card, { CardHeader, CardTitle, CardContent, CardFooter } from '../ui/Card';
import { formatCurrency, calculateRequiredPMT, monthDiff } from '../../utils/calculations';
import { BankOption, aiService } from '../../services/aiService';
import { gccSavingsAccounts, getBanksByCountry, getBanksByLocation, BankAccount } from '../../data/gccBanksData';
import AIGuidance from '../AIGuidance';

interface EmergencyFundSectionProps {
  onNext: () => void;
}

const EmergencyFundSection: React.FC<EmergencyFundSectionProps> = ({ onNext }) => {
  const { state, dispatch } = usePlanner();
  const { currency } = useCurrency();

  // Find existing emergency fund goal by id
  const existing = state.goals.find(g => g.id === 'emergency-fund');

  // Default values
  const today = new Date();
  const defaultBuf = existing?.bufferMonths ?? 3;
  const profileExpenses = state.monthlyExpenses || 0;
  const defaultDate = existing?.targetDate ?? new Date(today.getFullYear(), today.getMonth(), 1);

  // Local state
  const [bufferMonths, setBufferMonths] = useState<number>(defaultBuf);
  const [targetMonth, setTargetMonth] = useState<number>(defaultDate.getMonth() + 1);
  const [targetYear, setTargetYear] = useState<number>(defaultDate.getFullYear());
  const [isEditing, setIsEditing] = useState<boolean>(!existing);
  const [selectedBank, setSelectedBank] = useState<any>(null);
  const [bankDataLoading, setBankDataLoading] = useState<boolean>(false);
  const [bankDataError, setBankDataError] = useState<string | null>(null);
  const [realTimeBankData, setRealTimeBankData] = useState<BankOption[]>([]);
  const [searchProgress, setSearchProgress] = useState<{current: number, total: number, status: string} | null>(null);
  const [searchAbortController, setSearchAbortController] = useState<AbortController | null>(null);
  
  // Store state and dispatch in refs for stable callbacks
  const stateRef = useRef(state);
  const dispatchRef = useRef(dispatch);
  
  // Update refs when props change
  useEffect(() => {
    stateRef.current = state;
    dispatchRef.current = dispatch;
  }, [state, dispatch]);
  
  // Load existing selectedBank if available
  useEffect(() => {
    if (existing && existing.selectedBank) {
      setSelectedBank(existing.selectedBank);
    }
  }, [existing]);
  
  // Cache for bank data with 24-hour expiry
  const BANK_DATA_CACHE_KEY = 'bank_data_cache';
  const CACHE_EXPIRY_HOURS = 24;

  const getCachedBankData = (country: string): BankOption[] | null => {
    try {
      const cached = localStorage.getItem(`${BANK_DATA_CACHE_KEY}_${country}`);
      if (!cached) return null;
      
      const data = JSON.parse(cached);
      const now = new Date().getTime();
      const cacheTime = new Date(data.timestamp).getTime();
      const hoursDiff = (now - cacheTime) / (1000 * 60 * 60);
      
      if (hoursDiff < CACHE_EXPIRY_HOURS) {
        console.log(`📦 Using cached bank data for ${country} (${hoursDiff.toFixed(1)} hours old)`);
        return data.bankData;
      } else {
        console.log(`⏰ Cache expired for ${country} (${hoursDiff.toFixed(1)} hours old)`);
        localStorage.removeItem(`${BANK_DATA_CACHE_KEY}_${country}`);
        return null;
      }
    } catch (error) {
      console.error('Error reading bank data cache:', error);
      return null;
    }
  };

  const setCachedBankData = (country: string, bankData: BankOption[]): void => {
    try {
      const cacheData = {
        timestamp: new Date().toISOString(),
        bankData: bankData,
        country: country
      };
      localStorage.setItem(`${BANK_DATA_CACHE_KEY}_${country}`, JSON.stringify(cacheData));
      console.log(`💾 Cached bank data for ${country} with ${bankData.length} entries`);
    } catch (error) {
      console.error('Error saving bank data cache:', error);
    }
  };

  // Filter for retail banks only (exclude investment banks, private banking, etc.)
  const filterRetailBanks = (banks: BankAccount[]): BankAccount[] => {
    const retailBankPatterns = [
      // Include major retail banks
      'National Bank', 'Commercial Bank', 'Islamic Bank', 'Emirates NBD', 'FAB', 'ADCB', 'HSBC',
      'Standard Chartered', 'Mashreq', 'RAKBANK', 'CBD', 'NBF', 'Alinma', 'Al Rajhi', 'Riyad Bank',
      'QNB', 'BBK', 'Bank Muscat', 'Gulf Bank', 'Boubyan', 'Warba', 'Burgan', 'NBK', 'DIB', 'ADIB',
      'Wio Bank', 'Liv.', 'meem', 'Bank Albilad', 'Bank AlJazira', 'Saudi Awwal', 'SAIB', 'SNB',
      'QIB', 'CBQ', 'Doha Bank', 'Masraf Al Rayan', 'Dukhan Bank', 'Ahli Bank', 'NBB', 'BisB',
      'Al Salam Bank', 'KHCB', 'Ithmaar Bank', 'NBO', 'Bank Dhofar', 'Sohar International',
      'OAB', 'Bank Nizwa'
    ];
    
    // Exclude investment/private banks
    const excludePatterns = [
      'Investment', 'Private Banking', 'Wealth Management', 'Al Masraf', 'Habib Bank AG Zurich',
      'Bank of Baroda', 'Citibank' // Keep Citi for now but could exclude if needed
    ];
    
    return banks.filter(bank => {
      const bankName = bank.bank.toLowerCase();
      
      // Exclude investment/private banks
      if (excludePatterns.some(pattern => bankName.includes(pattern.toLowerCase()))) {
        return false;
      }
      
      // Include if matches retail bank patterns
      return retailBankPatterns.some(pattern => 
        bankName.includes(pattern.toLowerCase()) || 
        bank.bank.includes(pattern)
      );
    });
  };

  // Sort banks by interest rate (highest first)
  const sortBanksByRate = (bankOptions: BankOption[]): BankOption[] => {
    return [...bankOptions].sort((a, b) => {
      // Sort by return rate descending (highest first)
      return b.returnRate - a.returnRate;
    });
  };

  // Manual stop search function
  const stopSearch = () => {
    if (searchAbortController) {
      searchAbortController.abort();
      setSearchProgress(null);
      setBankDataLoading(false);
      console.log('🛑 User stopped the search early');
    }
  };

  // OpenAI Web Search for Live Bank Data
  const fetchRealTimeBankData = async (country: string): Promise<BankOption[]> => {
    setBankDataLoading(true);
    setBankDataError(null);
    
    // Create abort controller for this search
    const abortController = new AbortController();
    setSearchAbortController(abortController);
    
    // Check cache first
    const cachedData = getCachedBankData(country);
    if (cachedData && cachedData.length > 0) {
      setBankDataLoading(false);
      setSearchAbortController(null);
      return cachedData;
    }
    
    try {
      // Get static bank list as reference for web search only
      const allStaticBanks = getBanksByCountry(country);
      const staticBanks = filterRetailBanks(allStaticBanks);
      
      if (staticBanks.length === 0) {
        throw new Error(`No retail banks found for ${country}`);
      }

      console.log(`🚀 Starting comprehensive web search for ${staticBanks.length} retail banks in ${country} (filtered from ${allStaticBanks.length} total banks)`);
      
      // Create batches for more comprehensive search
      const batchSize = 3; // Reduced from 5 for even better coverage per batch
      const bankBatches = [];
      for (let i = 0; i < staticBanks.length; i += batchSize) {
        bankBatches.push(staticBanks.slice(i, i + batchSize));
      }
      
      const allLiveResults: BankOption[] = [];
      const timeoutMinutes = 3; // 3-minute timeout
      const startTime = Date.now();
      let searchAborted = false;
      
      // Initialize progress tracking
      setSearchProgress({
        current: 0,
        total: bankBatches.length,
        status: `Starting deep search for ${staticBanks.length} banks in ${bankBatches.length} batches... (Max ${timeoutMinutes} min)`
      });
      
      // Search each batch with longer delays for better results
      for (let batchIndex = 0; batchIndex < bankBatches.length; batchIndex++) {
        // Check if search was aborted
        if (abortController.signal.aborted) {
          console.log('🛑 Search aborted by user');
          searchAborted = true;
          break;
        }

        // Check timeout
        const elapsedMinutes = (Date.now() - startTime) / (1000 * 60);
        if (elapsedMinutes > timeoutMinutes) {
          console.log(`⏰ Search timeout reached after ${elapsedMinutes.toFixed(1)} minutes`);
          setSearchProgress({
            current: batchIndex,
            total: bankBatches.length,
            status: `⏰ Timeout reached (${timeoutMinutes} min) - Using ${allLiveResults.length} results found so far`
          });
          searchAborted = true;
          break;
        }

        const batch = bankBatches[batchIndex];
        const remainingTime = timeoutMinutes - elapsedMinutes;
        
        // Update progress
        setSearchProgress({
          current: batchIndex + 1,
          total: bankBatches.length,
          status: `Deep searching batch ${batchIndex + 1}/${bankBatches.length} (${batch.map(b => b.bank).join(', ')}) - ${remainingTime.toFixed(1)} min left`
        });
        
        const webSearchPrompt = `COMPREHENSIVE RETAIL BANK RATE SEARCH for ${country} - CURRENT 2025 RATES

Please search the web thoroughly for CURRENT January 2025 interest rates from these ${batch.length} RETAIL BANKS (focusing on individual/personal banking, not corporate/investment banking):

${batch.map((bank, index) => `${index + 1}. ${bank.bank}
   Website: ${bank.url}
   Search keywords: "${bank.bank} personal savings interest rates 2025", "${bank.bank} time deposit rates current", "${bank.bank} individual banking rates January 2025"
   Look for: Personal savings accounts, individual time deposits, retail banking rates
   
   SEARCH DEEP: Check multiple pages on their website including:
   - Personal banking section
   - Savings account pages  
   - Time deposit/fixed deposit pages
   - Interest rate disclosure pages
   - Current promotions page`).join('\n\n')}

SEARCH REQUIREMENTS:
1. Focus ONLY on RETAIL/PERSONAL banking products (not corporate or investment banking)
2. Find CURRENT 2025 rates for individual customers - NOT 2024 or older rates
3. Use web search to find the most recent rate information available online
4. Look for both savings accounts AND time deposits for personal banking
5. Include minimum deposit requirements for individuals
6. Note any special features or requirements for retail customers
7. Check for promotional rates for personal accounts from 2025
8. PRIORITIZE banks with highest interest rates
9. TAKE YOUR TIME - This is a comprehensive web search, not a quick lookup
10. Search multiple sources including bank websites, financial news, rate comparison sites
11. Verify rates are current and from 2025

RESPONSE FORMAT - Return comprehensive JSON ordered by HIGHEST RATES FIRST:
[{
  "bankName": "Exact Bank Name",
  "savingsAccount": {
    "rate": "X.XX% p.a.",
    "minDeposit": "Amount with currency",
    "features": "Any special conditions for retail customers"
  },
  "timeDeposit": {
    "rate": "X.XX% p.a.",
    "term": "6-Month/12-Month/etc",
    "minDeposit": "Amount with currency for individuals",
    "features": "Lock-in period, early withdrawal penalties for retail"
  },
  "source": "Website URL or source where current rates were found",
  "lastUpdated": "Date if available - must be 2025 or very recent",
  "specialOffers": "Any current promotions for individual customers"
}]

IMPORTANT: 
- Only include CURRENT 2025 retail/personal banking rates (exclude corporate/investment banking)
- Use web search to find the most up-to-date information available
- Order results by HIGHEST interest rates first
- Only include banks where you found actual current retail rate information from 2025
- Take time for a thorough web search - quality over speed
- Verify information is current and not from 2024 or earlier years`;

        try {
          console.log(`🔍 Deep comprehensive search batch ${batchIndex + 1}/${bankBatches.length} with ${batch.length} banks - allowing extra time`);
          
          // Update progress to show we're actively searching
          setSearchProgress({
            current: batchIndex + 1,
            total: bankBatches.length,
            status: `🔍 Actively searching ${batch.map(b => b.bank).join(', ')} - AI is browsing bank websites... (${remainingTime.toFixed(1)} min left)`
          });
          
          const searchResponse = await aiService.askQuestion(webSearchPrompt, {
            location: country,
            currentStep: `deep-comprehensive-search-batch-${batchIndex + 1}`
          });

          if (searchResponse.message && searchResponse.message.length > 100) {
            const batchResults = await parseWebSearchResults(searchResponse.message, batch);
            allLiveResults.push(...batchResults);
            console.log(`✅ Batch ${batchIndex + 1} found ${batchResults.length} live rates`);
            
            // Update progress with results and show progressive results
            setSearchProgress({
              current: batchIndex + 1,
              total: bankBatches.length,
              status: `✅ Batch ${batchIndex + 1} complete: Found ${batchResults.length} rates (${allLiveResults.length} total so far) - ${remainingTime.toFixed(1)} min left`
            });

            // Progressive results: Update the bank list immediately with current results
            if (allLiveResults.length > 0) {
              const progressiveBankList = createProgressiveBankList(staticBanks, allLiveResults, batchIndex + 1, bankBatches.length);
              setRealTimeBankData(progressiveBankList);
            }
          } else {
            console.warn(`⚠️ Batch ${batchIndex + 1} returned insufficient data`);
            setSearchProgress({
              current: batchIndex + 1,
              total: bankBatches.length,
              status: `⚠️ Batch ${batchIndex + 1} complete: No rates found (${allLiveResults.length} total so far) - ${remainingTime.toFixed(1)} min left`
            });
          }
          
          // Longer delay between batch requests for better results
          if (batchIndex < bankBatches.length - 1) {
            const remainingBatches = bankBatches.length - batchIndex - 1;
            const estimatedMinutes = Math.ceil((remainingBatches * 6) / 60); // Updated for 6-second delays
            
            setSearchProgress({
              current: batchIndex + 1,
              total: bankBatches.length,
              status: `⏳ Waiting 6 seconds for AI to process next batch... (~${Math.min(estimatedMinutes, remainingTime).toFixed(1)} min remaining)`
            });
            
            await new Promise(resolve => setTimeout(resolve, 6000)); // Increased from 3000ms to 6000ms
          }
        } catch (batchError) {
          console.warn(`❌ Batch ${batchIndex + 1} search failed:`, batchError);
          setSearchProgress({
            current: batchIndex + 1,
            total: bankBatches.length,
            status: `❌ Batch ${batchIndex + 1} failed: ${(batchError as Error)?.message || 'Unknown error'} - Continuing... (${remainingTime.toFixed(1)} min left)`
          });
          
          // Even on error, wait before next batch
          if (batchIndex < bankBatches.length - 1) {
            await new Promise(resolve => setTimeout(resolve, 3000));
          }
        }
      }
      
      // Clear progress when done
      setSearchProgress(null);

      // Final comprehensive bank list creation
      const finalBankList = createProgressiveBankList(staticBanks, allLiveResults, bankBatches.length, bankBatches.length);

      if (searchAborted) {
        const reason = abortController.signal.aborted ? 'stopped by user' : `timeout after ${timeoutMinutes} minutes`;
        console.log(`⏰ Search completed early (${reason}): ${allLiveResults.length} live rates + ${finalBankList.length - allLiveResults.length} manual check options`);
        setBankDataError(`Search ${reason}. Found ${allLiveResults.length} live rates. Remaining banks available for manual check.`);
      } else {
        console.log(`✅ Created comprehensive retail bank list: ${allLiveResults.length} live rates + ${finalBankList.length - allLiveResults.length} manual check options, sorted by highest rates first`);
        setBankDataError(null);
      }
      
      // Cache the successful result
      setCachedBankData(country, finalBankList);
      return finalBankList;

    } catch (error) {
      console.error('❌ Error in fetchRealTimeBankData:', error);
      console.error('Error type:', error?.constructor?.name);
      console.error('Error message:', (error as Error)?.message);
      
      setBankDataError('Unable to fetch live rates. Using manual check options.');
      
      // Create manual check fallback and cache it
      const fallbackBanks = getBanksByCountry(country);
      const manualFallback = createManualCheckFallback(fallbackBanks);
      setCachedBankData(country, manualFallback);
      
      return manualFallback;
    } finally {
      setBankDataLoading(false);
      setSearchAbortController(null);
    }
  };

  // Helper function to create progressive bank list with partial results
  const createProgressiveBankList = (staticBanks: BankAccount[], liveResults: BankOption[], completedBatches: number, totalBatches: number): BankOption[] => {
    const comprehensiveBankList: BankOption[] = [];
    const processedBanks = new Set<string>(); // Track which banks we've already processed
    
    staticBanks.forEach(bank => {
      const bankKey = bank.bank.toLowerCase().replace(/\s+/g, '-');
      
      // Improved bank name matching - check multiple variations
      const liveData = liveResults.filter(live => {
        const liveBankName = live.bankName.toLowerCase();
        const staticBankName = bank.bank.toLowerCase();
        
        // Check for exact matches, partial matches, and common abbreviations
        return (
          liveBankName.includes(staticBankName) ||
          staticBankName.includes(liveBankName) ||
          // Handle common abbreviations
          (staticBankName.includes('emirates nbd') && liveBankName.includes('enbd')) ||
          (staticBankName.includes('first abu dhabi') && liveBankName.includes('fab')) ||
          (staticBankName.includes('abu dhabi commercial') && liveBankName.includes('adcb')) ||
          (staticBankName.includes('national bank of kuwait') && liveBankName.includes('nbk')) ||
          (staticBankName.includes('qatar national bank') && liveBankName.includes('qnb')) ||
          // Remove common suffixes for matching
          liveBankName.replace(/\s+(bank|group|limited|ltd|pjsc)$/g, '').includes(staticBankName.replace(/\s+(bank|group|limited|ltd|pjsc)$/g, ''))
        );
      });
      
      if (liveData.length > 0) {
        // Add live data results and mark bank as processed
        liveData.forEach(liveBank => {
          if (!processedBanks.has(liveBank.id)) {
            comprehensiveBankList.push(liveBank);
            processedBanks.add(liveBank.id);
          }
        });
      } else {
        // Only add manual check options if we haven't processed this bank yet
        const savingsId = `${bankKey}-savings-manual`;
        const timeId = `${bankKey}-time-manual`;
        
        if (!processedBanks.has(savingsId)) {
          comprehensiveBankList.push({
            id: savingsId,
            bankName: bank.bank,
            accountType: 'Savings Account (Retail Banking)',
            interestRate: completedBatches < totalBatches ? 'Search in progress...' : 'Check website for current rates',
            returnRate: 0.025,
            features: completedBatches < totalBatches 
              ? `Search in progress (${completedBatches}/${totalBatches} batches complete) | 🔍 Live search ongoing`
              : `Visit website for current retail rates | 🔗 Manual check required`,
            website: bank.url,
            mobileApp: `${bank.bank} Mobile App`
          });
          processedBanks.add(savingsId);
        }
        
        if (!processedBanks.has(timeId)) {
          comprehensiveBankList.push({
            id: timeId,
            bankName: bank.bank,
            accountType: '6-Month Time Deposit (Retail Banking)',
            interestRate: completedBatches < totalBatches ? 'Search in progress...' : 'Check website for current rates',
            returnRate: 0.04,
            features: completedBatches < totalBatches 
              ? `Search in progress (${completedBatches}/${totalBatches} batches complete) | 🔍 Live search ongoing`
              : `Visit website for current retail rates | 🔗 Manual check required`,
            website: bank.url,
            mobileApp: `${bank.bank} Mobile App`
          });
          processedBanks.add(timeId);
        }
      }
    });

    // Additional deduplication pass - remove any duplicates by bank name + account type
    const deduplicatedList: BankOption[] = [];
    const seenCombinations = new Set<string>();
    
    comprehensiveBankList.forEach(bank => {
      const combination = `${bank.bankName.toLowerCase()}-${bank.accountType.toLowerCase()}`;
      if (!seenCombinations.has(combination)) {
        deduplicatedList.push(bank);
        seenCombinations.add(combination);
      }
    });

    // Sort by interest rate (highest first)
    return sortBanksByRate(deduplicatedList);
  };

  // Helper function to create manual check fallback
  const createManualCheckFallback = (banks: BankAccount[]): BankOption[] => {
    const retailBanks = filterRetailBanks(banks);
    const manualFallback: BankOption[] = [];
    
    retailBanks.forEach(bank => {
      manualFallback.push({
        id: `${bank.bank.toLowerCase().replace(/\s+/g, '-')}-savings-manual`,
        bankName: bank.bank,
        accountType: 'Savings Account (Retail Banking)',
        interestRate: 'Check website for current rates',
        returnRate: 0.025,
        features: `Visit website for current retail rates | 🔗 Manual check required`,
        website: bank.url,
        mobileApp: `${bank.bank} Mobile App`
      });
      
      manualFallback.push({
        id: `${bank.bank.toLowerCase().replace(/\s+/g, '-')}-time-manual`,
        bankName: bank.bank,
        accountType: '6-Month Time Deposit (Retail Banking)',
        interestRate: 'Check website for current rates',
        returnRate: 0.04,
        features: `Visit website for current retail rates | 🔗 Manual check required`,
        website: bank.url,
        mobileApp: `${bank.bank} Mobile App`
      });
    });
    
    // Sort by estimated return rate (highest first)
    return sortBanksByRate(manualFallback);
  };

  // Parse Web Search Results into Bank Options
  const parseWebSearchResults = async (searchResults: string, originalBanks: BankAccount[]): Promise<BankOption[]> => {
    try {
      console.log('🔍 Parsing comprehensive search results...');
      
      // Try to extract JSON from the search results
      let bankData: any[] = [];
      
      // Look for JSON arrays in the response
      const jsonMatches = searchResults.match(/\[[\s\S]*?\]/g);
      if (jsonMatches && jsonMatches.length > 0) {
        // Try each JSON match until we find valid data
        for (const jsonMatch of jsonMatches) {
          try {
            const parsed = JSON.parse(jsonMatch);
            if (Array.isArray(parsed) && parsed.length > 0) {
              bankData = parsed;
              console.log(`✅ Successfully parsed JSON with ${bankData.length} bank entries`);
              break;
            }
          } catch (parseError) {
            console.warn('Failed to parse JSON match, trying next...');
          }
        }
      }

      // If no structured data, use AI to analyze the search results
      if (bankData.length === 0) {
        console.log('🤖 No direct JSON found, using AI analysis...');
        
        const analysisPrompt = `Extract bank interest rate data from this comprehensive search result:

${searchResults}

Convert any bank rate information found into this exact JSON format:
[{
  "bankName": "Exact Bank Name",
  "savingsAccount": {"rate": "X.XX% p.a.", "minDeposit": "amount", "features": "details"},
  "timeDeposit": {"rate": "X.XX% p.a.", "term": "6-Month", "minDeposit": "amount", "features": "details"}
}]

Include ALL banks mentioned with ANY rate information. Return only the JSON array.`;

        const analysisResponse = await aiService.askQuestion(analysisPrompt, {
          currentStep: 'comprehensive-analysis-parsing'
        });

        const analysisJsons = analysisResponse.message.match(/\[[\s\S]*?\]/g);
        if (analysisJsons && analysisJsons.length > 0) {
          for (const json of analysisJsons) {
            try {
              const parsed = JSON.parse(json);
              if (Array.isArray(parsed) && parsed.length > 0) {
                bankData = parsed;
                console.log(`✅ AI analysis extracted ${bankData.length} bank entries`);
                break;
              }
            } catch (error) {
              console.warn('Failed to parse AI analysis result');
            }
          }
        }
      }

      // Convert to BankOption format with enhanced data
      const bankOptions: BankOption[] = [];
      
      bankData.forEach((bank: any, bankIndex: number) => {
        const originalBank = originalBanks.find(b => 
          b.bank.toLowerCase().includes(bank.bankName.toLowerCase()) ||
          bank.bankName.toLowerCase().includes(b.bank.toLowerCase())
        );

        // Create unique base ID for this bank
        const baseId = bank.bankName.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');

        // Add savings account if found
        if (bank.savingsAccount && bank.savingsAccount.rate) {
          const features = [
            bank.savingsAccount.features || 'Current savings rate',
            bank.specialOffers ? `Special: ${bank.specialOffers}` : '',
            bank.source ? `Source: ${bank.source}` : '',
            '🌐 Live web data'
          ].filter(Boolean).join(' | ');

          const savingsId = `${baseId}-savings-live-${bankIndex}`;
          bankOptions.push({
            id: savingsId,
            bankName: bank.bankName,
            accountType: 'Savings Account (Retail Banking)',
            interestRate: bank.savingsAccount.rate,
            returnRate: extractReturnRate(bank.savingsAccount.rate),
            features: features,
            website: originalBank?.url || '',
            mobileApp: `${bank.bankName} Mobile App`
          });
          
          console.log(`✅ Created savings option: ${savingsId} for ${bank.bankName}`);
        }

        // Add time deposit if found
        if (bank.timeDeposit && bank.timeDeposit.rate) {
          const features = [
            bank.timeDeposit.features || `${bank.timeDeposit.term || '6-month'} term`,
            bank.timeDeposit.minDeposit ? `Min: ${bank.timeDeposit.minDeposit}` : '',
            bank.specialOffers ? `Special: ${bank.specialOffers}` : '',
            bank.source ? `Source: ${bank.source}` : '',
            '🌐 Live web data'
          ].filter(Boolean).join(' | ');

          const timeId = `${baseId}-time-live-${bankIndex}`;
          bankOptions.push({
            id: timeId,
            bankName: bank.bankName,
            accountType: `${bank.timeDeposit.term || '6-Month'} Time Deposit (Retail Banking)`,
            interestRate: bank.timeDeposit.rate,
            returnRate: extractReturnRate(bank.timeDeposit.rate),
            features: features,
            website: originalBank?.url || '',
            mobileApp: `${bank.bankName} Mobile App`
          });
          
          console.log(`✅ Created time deposit option: ${timeId} for ${bank.bankName}`);
        }
      });

      console.log(`✅ Final parsing result: ${bankOptions.length} bank options created with unique IDs`);
      return bankOptions;

    } catch (error) {
      console.error('❌ Failed to parse comprehensive search results:', error);
      return [];
    }
  };

  // Helper function to extract return rate from interest rate string
  const extractReturnRate = (rateString: string): number => {
    const match = rateString.match(/(\d+\.?\d*)/);
    return match ? parseFloat(match[1]) / 100 : 0.01; // Default to 1%
  };

  const getCountryFromLocation = (location: string): string => {
    const locationMappings: { [key: string]: string } = {
      // UAE cities
      'dubai': 'UAE',
      'abu dhabi': 'UAE', 
      'sharjah': 'UAE',
      'ajman': 'UAE',
      
      // Saudi Arabia cities
      'riyadh': 'Saudi Arabia',
      'jeddah': 'Saudi Arabia',
      'mecca': 'Saudi Arabia',
      'dammam': 'Saudi Arabia',
      
      // Kuwait
      'kuwait city': 'Kuwait',
      'hawalli': 'Kuwait',
      
      // Qatar
      'doha': 'Qatar',
      
      // Bahrain
      'manama': 'Bahrain',
      
      // Oman
      'muscat': 'Oman',
    };

    // Convert to lowercase and check direct mapping
    const lowerLocation = location.toLowerCase();
    
    // Check for direct city mapping
    if (locationMappings[lowerLocation]) {
      return locationMappings[lowerLocation];
    }
    
    // Check if location contains country name
    if (lowerLocation.includes('uae') || lowerLocation.includes('emirates')) {
      return 'UAE';
    }
    if (lowerLocation.includes('saudi') || lowerLocation.includes('ksa')) {
      return 'Saudi Arabia';
    }
    if (lowerLocation.includes('kuwait')) {
      return 'Kuwait';
    }
    if (lowerLocation.includes('qatar')) {
      return 'Qatar';
    }
    if (lowerLocation.includes('bahrain')) {
      return 'Bahrain';
    }
    if (lowerLocation.includes('oman')) {
      return 'Oman';
    }
    
    // Try to extract country from comma-separated location (e.g., "Dubai, UAE")
    const parts = location.split(',').map(part => part.trim());
    if (parts.length > 1) {
      const lastPart = parts[parts.length - 1].toLowerCase();
      if (lastPart === 'uae' || lastPart === 'united arab emirates') return 'UAE';
      if (lastPart === 'saudi arabia' || lastPart === 'ksa') return 'Saudi Arabia';
      if (lastPart === 'kuwait') return 'Kuwait';
      if (lastPart === 'qatar') return 'Qatar';
      if (lastPart === 'bahrain') return 'Bahrain';
      if (lastPart === 'oman') return 'Oman';
    }
    
    return 'UAE'; // Default fallback
  };

  // Get available banks for user's location
  const userCountry = getCountryFromLocation(state.userProfile.location || 'UAE');
  const totalRetailBanks = filterRetailBanks(getBanksByCountry(userCountry)).length;
  
  // Fetch real-time bank data when country changes
  useEffect(() => {
    const fetchBankData = async () => {
      if (userCountry) {
        try {
          const realTimeData = await fetchRealTimeBankData(userCountry);
          setRealTimeBankData(realTimeData);
          
          // Validate and clear selected bank if it doesn't exist in new bank list
          if (selectedBank && realTimeData.length > 0) {
            const bankExists = realTimeData.some(bank => bank.id === selectedBank.id);
            if (!bankExists) {
              console.log(`🧹 Clearing invalid selected bank: "${selectedBank.id}" not found in ${userCountry} banks`);
              setSelectedBank(null);
              
              // Also update the goal to remove the invalid bank selection
              if (existing && existing.selectedBank) {
                const updatedGoal = { ...existing, selectedBank: null };
                dispatchRef.current({ type: 'UPDATE_GOAL', payload: updatedGoal });
              }
            }
          }
        } catch (error) {
          console.error('Failed to fetch bank data:', error);
          // Create manual fallback as last resort
          const staticBanks = getBanksByCountry(userCountry);
          const fallback = createManualCheckFallback(staticBanks);
          setRealTimeBankData(fallback);
          setBankDataError('Error loading bank data. Using manual check options.');
          
          // Clear selected bank on error as well
          if (selectedBank) {
            console.log(`🧹 Clearing selected bank due to fetch error`);
            setSelectedBank(null);
          }
        }
      }
    };

    fetchBankData();
  }, [userCountry]); // Remove selectedBank from dependencies to prevent loops

  // Use real-time data (which includes cached data)
  const finalAvailableBanks = realTimeBankData;
  
  // Additional validation effect to ensure selected bank exists in current list
  useEffect(() => {
    if (selectedBank && finalAvailableBanks.length > 0) {
      const bankExists = finalAvailableBanks.some(bank => bank.id === selectedBank.id);
      if (!bankExists) {
        console.log(`🔧 Selected bank validation failed: "${selectedBank.id}" not in current bank list`);
        console.log('Available bank IDs:', finalAvailableBanks.map(b => b.id));
        setSelectedBank(null);
        
        // Show user-friendly message
        setBankDataError(`Previously selected bank is not available in ${userCountry}. Please select a new bank.`);
      } else {
        // Clear any previous validation errors
        if (bankDataError && bankDataError.includes('Previously selected bank')) {
          setBankDataError(null);
        }
      }
    }
  }, [selectedBank, finalAvailableBanks, userCountry, bankDataError]);

  // Get cache info for debug
  const getCacheInfo = (country: string) => {
    try {
      const cached = localStorage.getItem(`${BANK_DATA_CACHE_KEY}_${country}`);
      if (!cached) return 'No cache';
      
      const data = JSON.parse(cached);
      const now = new Date().getTime();
      const cacheTime = new Date(data.timestamp).getTime();
      const hoursDiff = (now - cacheTime) / (1000 * 60 * 60);
      
      return `Cached ${hoursDiff.toFixed(1)}h ago`;
    } catch {
      return 'Cache error';
    }
  };
  
  // Use monthly expenses from profile
  const expenses = profileExpenses;
  
  // Check if monthly expenses is available
  const hasValidExpenses = expenses > 0;

  // Recompute these whenever inputs change
  const targetDate = new Date(targetYear, targetMonth - 1, 1);
  const horizonMonths = Math.max(1, monthDiff(today, targetDate)); // Ensure at least 1 month
  const amount = Math.max(0, expenses * bufferMonths); // Ensure non-negative amount
  // Use selected bank's return rate if available, otherwise default to 1%
  const bankReturnRate = Math.max(0.001, selectedBank?.returnRate || 0.01); // Minimum 0.1% rate
  
  let returnPhases, requiredPMT;
  try {
    returnPhases = [{ length: horizonMonths, rate: bankReturnRate }];
    requiredPMT = calculateRequiredPMT(amount, returnPhases, horizonMonths);
    console.log('Calculations successful:', { returnPhases, requiredPMT, horizonMonths, amount });
  } catch (error) {
    console.error('Calculation error:', error);
    returnPhases = [{ length: 1, rate: 0.01 }];
    requiredPMT = amount; // fallback
  }

  // Options
  const monthOptions = [
    'January','February','March','April','May','June',
    'July','August','September','October','November','December'
  ];
  const yearOptions = Array.from({ length: 6 }, (_, i) => today.getFullYear() + i);

  // Handlers
  const handleSave = () => {
    if (!hasValidExpenses) {
      alert('Please complete your profile with monthly expenses before creating a safety net.');
      return;
    }
    
    try {
      const goal = {
        id: 'emergency-fund',
        name: 'Safety Net',
        category: 'Home' as const,
        amount: Number(amount) || 0,
        bufferMonths: Number(bufferMonths) || 3,
        targetDate: new Date(targetDate),
        horizonMonths: Number(horizonMonths) || 1,
        profile: 'Conservative' as const,
        returnPhases: returnPhases || [{ length: 1, rate: 0.01 }],
        requiredPMT: Number(requiredPMT) || 0,
        selectedBank: selectedBank || null
      };
      
      // Validate goal object
      if (!goal.id || !goal.name || !goal.targetDate || goal.amount <= 0) {
        throw new Error('Invalid goal object: missing required fields or invalid amount');
      }
      
      if (existing) {
        dispatch({ type: 'UPDATE_GOAL', payload: goal });
      } else {
        dispatch({ type: 'ADD_GOAL', payload: goal });
      }
      
      setIsEditing(false);
      
      if (typeof onNext === 'function') {
        onNext();
      } else {
        console.error('onNext is not a function:', onNext);
      }
    } catch (error) {
      console.error('Error in handleSave:', error);
      alert(`Error saving emergency fund: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  };

  const handleBankChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const bankId = e.target.value;
    console.log(`🏦 Bank selection attempted: "${bankId}"`);
    
    if (!bankId) {
      setSelectedBank(null);
      setBankDataError(null); // Clear any validation errors
      console.log('❌ No bank ID provided, clearing selection');
      return;
    }
    
    console.log(`🔍 Searching for bank with ID: "${bankId}" in ${finalAvailableBanks.length} available banks`);
    console.log('Available bank IDs:', finalAvailableBanks.map(b => b.id));
    
    const bank = finalAvailableBanks.find(b => b.id === bankId);
    if (bank) {
      setSelectedBank(bank);
      setBankDataError(null); // Clear any validation errors
      console.log('✅ Bank selected successfully:', {
        id: bank.id,
        name: bank.bankName,
        type: bank.accountType,
        rate: bank.interestRate,
        returnRate: bank.returnRate
      });
    } else {
      console.log('❌ Bank not found with ID:', bankId);
      console.log('Available banks:', finalAvailableBanks.map(b => ({ id: b.id, name: b.bankName, type: b.accountType })));
      setBankDataError(`Selected bank not found. Please choose from available options.`);
    }
  };

  // Manual refresh function to bypass cache
  const refreshBankData = async () => {
    if (!userCountry) return;
    
    // Clear cache for this country
    localStorage.removeItem(`${BANK_DATA_CACHE_KEY}_${userCountry}`);
    console.log(`🗑️ Cleared cache for ${userCountry}`);
    
    // Fetch fresh data
    setBankDataLoading(true);
    try {
      const freshData = await fetchRealTimeBankData(userCountry);
      setRealTimeBankData(freshData);
    } catch (error) {
      console.error('Failed to refresh bank data:', error);
      setBankDataError('Failed to refresh bank data. Using existing data.');
    }
  };

  // Create AI context for the money coach
  const aiContext = {
    name: state.userProfile.name,
    nationality: state.userProfile.nationality,
    location: state.userProfile.location,
    monthlyIncome: state.userProfile.monthlyIncome || 0,
    monthlyExpenses: state.monthlyExpenses || 0,
    currency: currency.code,
    currentStep: 'emergency-fund',
    emergencyFund: {
      targetAmount: amount,
      currentAmount: 0,
      bufferMonths: bufferMonths,
      monthlyExpenses: expenses,
      targetDate: targetDate,
      monthlyContribution: requiredPMT
    }
  };

  // View when exists and not editing
  if (existing && !isEditing) {
    return (
      <div className="container mx-auto max-w-3xl px-4 lg:px-0">
        <h2 className="text-2xl lg:text-3xl font-bold text-theme-light mb-4 lg:mb-6">Your Safety Net</h2>
        <Card className="mb-6 lg:mb-8">
          <CardContent>
            <div className="space-y-3 lg:space-y-4">
              <div className="flex flex-col sm:flex-row sm:justify-between gap-1 sm:gap-0">
                <span className="text-theme-secondary text-sm lg:text-base">Buffer Months:</span>
                <span className="text-theme-light font-medium text-sm lg:text-base">{existing.bufferMonths ?? 3} months</span>
              </div>
              <div className="flex flex-col sm:flex-row sm:justify-between gap-1 sm:gap-0">
                <span className="text-theme-secondary text-sm lg:text-base">Monthly Expenses:</span>
                <span className="text-theme-light font-medium text-sm lg:text-base">{formatCurrency(existing.amount / (existing.bufferMonths ?? 1), currency)}</span>
              </div>
              <div className="flex flex-col sm:flex-row sm:justify-between gap-1 sm:gap-0">
                <span className="text-theme-secondary text-sm lg:text-base">Target Date:</span>
                <span className="text-theme-light font-medium text-sm lg:text-base">
                  {monthOptions[existing.targetDate.getMonth()]} {existing.targetDate.getFullYear()}
                </span>
              </div>
              <div className="flex flex-col sm:flex-row sm:justify-between border-t border-theme pt-3 gap-1 sm:gap-0">
                <span className="text-theme-light font-semibold text-sm lg:text-base">Total Required:</span>
                <span className="text-theme-light font-bold text-lg lg:text-xl">{formatCurrency(existing.amount, currency)}</span>
              </div>
              <div className="flex flex-col sm:flex-row sm:justify-between pt-2 gap-2 sm:gap-0">
                <div className="flex-1">
                  <span className="text-theme-secondary text-sm lg:text-base">Monthly Savings:</span>
                  <div className="text-xs text-theme-muted">
                    {selectedBank ? `${(bankReturnRate * 100).toFixed(1)}% p.a. - ${selectedBank.bankName}` : '1% p.a.'}
                  </div>
                </div>
                <div className="text-left sm:text-right">
                  <span className="text-green-400 font-bold text-lg lg:text-xl">
                    {formatCurrency(existing.requiredPMT, currency)}
                  </span>
                  {existing.selectedBank && (
                    <div className="text-xs text-theme-muted mt-1">
                      ({(existing.selectedBank.returnRate * 100).toFixed(1)}% p.a. - {existing.selectedBank.bankName})
                    </div>
                  )}
                </div>
              </div>
              {!existing.selectedBank && (
                <div className="bg-theme-card border border-blue-500/30 rounded-lg p-3 mt-3 lg:mt-4 shadow-theme-sm">
                  <div className="text-xs lg:text-sm text-blue-300">
                    <strong>💡 Get Better Rates!</strong> Your safety net is currently using a 1% interest rate. Select a local bank below offering 3-5% p.a., which could reduce your monthly savings significantly!
                  </div>
                </div>
              )}
              {existing.selectedBank && (
                <div className="bg-theme-card border border-green-500/30 rounded-lg p-3 mt-3 lg:mt-4 shadow-theme-sm">
                  <div className="text-xs lg:text-sm text-green-300 space-y-1">
                    <div><strong>Selected Bank:</strong> {existing.selectedBank.bankName} - {existing.selectedBank.accountType}</div>
                    <div><strong>Interest Rate:</strong> {existing.selectedBank.interestRate}</div>
                    <div><strong>Features:</strong> {existing.selectedBank.features}</div>
                  </div>
                </div>
              )}
            </div>
          </CardContent>
          <CardFooter>
            <div className="flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-4 w-full">
              <Button variant="outline" onClick={() => setIsEditing(true)} fullWidth className="text-sm lg:text-base py-3 lg:py-2">Edit</Button>
              <Button onClick={onNext} fullWidth className="text-sm lg:text-base py-3 lg:py-2">Continue to Goals</Button>
            </div>
          </CardFooter>
        </Card>
      </div>
    );
  }

  // Creation / editing view
  return (
    <div className="container mx-auto max-w-3xl px-4 lg:px-0">
      <h2 className="text-2xl lg:text-3xl font-bold text-theme-light mb-3 lg:mb-4">
        {existing ? (isEditing ? 'Edit Safety Net' : 'Safety Net') : "Let's Start with Your Safety Net"}
      </h2>

      {/* Educational Section - Only show when creating new emergency fund */}
      {!existing && (
        <div className="space-y-3 lg:space-y-4 mb-4 lg:mb-6">
          {/* What is a Safety Net & Why Expats Need More */}
          <Card className="border-blue-500/30 bg-theme-card">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-theme-primary text-lg lg:text-xl">
                <span className="text-xl lg:text-2xl">🛡️</span>
                Emergency Fund for GCC Expats
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3 text-theme-secondary">
                <p className="leading-relaxed text-sm lg:text-base">
                  Money set aside for unexpected expenses. As an expat, you need 3-6 months of living expenses due to unique risks like visa cancellation (30 days to leave) and limited local support.
                </p>
                <div className="grid grid-cols-3 gap-2 lg:gap-3">
                  <div className="bg-theme-tertiary rounded p-2 lg:p-3 border border-blue-500/30 text-center shadow-theme-sm">
                    <div className="text-base lg:text-lg font-bold text-blue-500 mb-1">3 Months</div>
                    <div className="text-xs text-theme-muted">Minimum for stable jobs</div>
                  </div>
                  <div className="bg-theme-tertiary rounded p-2 lg:p-3 border-2 border-green-500 text-center shadow-theme">
                    <div className="text-base lg:text-lg font-bold text-green-500 mb-1">6 Months</div>
                    <div className="text-xs font-semibold text-theme-secondary">Recommended for expats</div>
                  </div>
                  <div className="bg-theme-tertiary rounded p-2 lg:p-3 border border-blue-500/30 text-center shadow-theme-sm">
                    <div className="text-base lg:text-lg font-bold text-blue-500 mb-1">9+ Months</div>
                    <div className="text-xs text-theme-muted">Conservative approach</div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Quick Guide */}
          <Card className="border-green-500/30 bg-theme-card">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-green-600 text-lg lg:text-xl">
                <span className="text-xl lg:text-2xl">🎯</span>
                Quick Setup Guide
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-3 lg:gap-4 text-theme-secondary">
                <div>
                  <h4 className="font-semibold mb-2 text-theme-primary text-sm lg:text-base">✅ For emergencies:</h4>
                  <div className="text-xs lg:text-sm space-y-1">
                    <div>• Job loss, medical bills</div>
                    <div>• Car/home repairs</div>
                    <div>• Repatriation costs</div>
                  </div>
                </div>
                <div>
                  <h4 className="font-semibold mb-2 text-theme-primary text-sm lg:text-base">🏦 Where to keep it:</h4>
                  <div className="text-xs lg:text-sm space-y-1">
                    <div>• High-yield savings (2-5% p.a.)</div>
                    <div>• Easily accessible, separate account</div>
                    <div>• Government insured/guaranteed</div>
                  </div>
                </div>
              </div>
              <div className="mt-3 p-2 lg:p-3 bg-theme-section rounded border border-green-500/30 shadow-theme-sm">
                <div className="text-xs lg:text-sm text-green-600">
                  <strong>💡 Expat Tip:</strong> Keep some funds in home currency for flights and repatriation costs.
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
      
      <Card className="mb-6 lg:mb-8">
        <CardHeader><CardTitle className="text-lg lg:text-xl">Emergency fund calculator</CardTitle></CardHeader>
        <CardContent>
          <div className="space-y-4 lg:space-y-6">

            {/* Monthly expenses display */}
            <div className={`border rounded-lg p-3 lg:p-4 shadow-theme-sm ${hasValidExpenses ? 'bg-theme-section border-blue-500/30' : 'bg-theme-section border-red-500/30'}`}>
              <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-2 sm:gap-0">
            <div>
                  <label className={`block text-sm font-medium mb-1 ${hasValidExpenses ? 'text-blue-600' : 'text-red-600'}`}>
                    Monthly Living Expenses (from your profile)
              </label>
                  <p className={`text-xs ${hasValidExpenses ? 'text-theme-secondary' : 'text-red-500'}`}>
                    {hasValidExpenses 
                      ? 'Includes rent, utilities, food, transport, insurance, loans.'
                      : 'Not set - please complete your profile first.'
                    }
                  </p>
                </div>
                <div className="text-left sm:text-right">
                  <span className={`text-base lg:text-lg font-bold ${hasValidExpenses ? 'text-blue-600' : 'text-red-600'}`}>
                    {hasValidExpenses ? formatCurrency(expenses, currency) : 'Not set'}
                </span>
                </div>
              </div>
            </div>

            {/* Buffer months */}
            <div>
              <label className="block text-sm font-medium text-theme-secondary mb-2">
                Buffer Months (3-6 months recommended for expats)
              </label>
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-2">
                {[
                  { months: 3, label: '3 mo', desc: 'Minimum', recommended: false },
                  { months: 4, label: '4 mo', desc: 'Conservative', recommended: false },
                  { months: 5, label: '5 mo', desc: 'Safer', recommended: false },
                  { months: 6, label: '6 mo', desc: 'Recommended', recommended: true }
                ].map(option => (
                  <button
                    key={option.months}
                    onClick={() => setBufferMonths(option.months)}
                    className={`p-2 lg:p-3 rounded-lg border-2 text-center transition-all shadow-theme-sm hover:shadow-theme ${
                      bufferMonths === option.months 
                        ? 'bg-blue-600 text-white border-blue-600 shadow-theme-lg' 
                        : option.recommended
                          ? 'bg-theme-section border-green-500/50 text-green-600 hover:bg-theme-tertiary hover:border-green-500'
                          : 'bg-theme-tertiary border-theme text-theme-secondary hover:bg-theme-section hover:border-theme-hover'
                    }`}
                  >
                    <div className="font-semibold text-sm lg:text-base">{option.label}</div>
                    <div className="text-xs mt-1">{option.desc}</div>
                    {option.recommended && bufferMonths !== option.months && (
                      <div className="text-xs mt-1 font-medium">✨ Best for expats</div>
                    )}
                  </button>
                ))}
              </div>
              {bufferMonths === 3 && (
                <div className="mt-2 p-2 bg-theme-section border border-amber-500/30 rounded text-xs text-amber-600 shadow-theme-sm">
                  ⚠️ Consider 6 months for better expat protection
                </div>
              )}
              {bufferMonths === 6 && (
                <div className="mt-2 p-2 bg-theme-section border border-green-500/30 rounded text-xs text-green-600 shadow-theme-sm">
                  ✅ Excellent choice for expats!
                </div>
              )}
              {bufferMonths > 6 && (
                <div className="mt-2 p-2 bg-theme-section border border-blue-500/30 rounded text-xs text-blue-600 shadow-theme-sm">
                  💪 Conservative approach
                </div>
              )}
            </div>

            {/* Target date */}
            <div>
              <label className="block text-sm font-medium text-theme-secondary mb-2">
                Target Completion Date (6-12 months recommended)
              </label>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-3 lg:gap-4">
              <div>
                  <label className="block text-xs font-medium mb-1 text-theme-muted">Target Month</label>
                <select
                  value={targetMonth}
                  onChange={e => setTargetMonth(Number(e.target.value))}
                    className="input-dark w-full rounded px-3 py-3 lg:py-2 text-base lg:text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors"
                >
                  {monthOptions.map((m,i) => (
                    <option key={m} value={i+1}>{m}</option>
                  ))}
                </select>
              </div>
              <div>
                  <label className="block text-xs font-medium mb-1 text-theme-muted">Target Year</label>
                <select
                  value={targetYear}
                  onChange={e => setTargetYear(Number(e.target.value))}
                    className="input-dark w-full rounded px-3 py-3 lg:py-2 text-base lg:text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors"
                >
                  {yearOptions.map(y => (
                    <option key={y} value={y}>{y}</option>
                  ))}
                </select>
              </div>
              </div>
              {horizonMonths <= 6 && (
                <div className="mt-2 p-2 bg-theme-section border border-green-500/30 rounded text-xs text-green-600 shadow-theme-sm">
                  🚀 Great timeline for quick protection
                </div>
              )}
              {horizonMonths > 12 && (
                <div className="mt-2 p-2 bg-theme-section border border-amber-500/30 rounded text-xs text-amber-600 shadow-theme-sm">
                  ⏰ Consider faster timeline for urgent protection
                </div>
              )}
              {horizonMonths >= 7 && horizonMonths <= 12 && (
                <div className="mt-2 p-2 bg-theme-section border border-blue-500/30 rounded text-xs text-blue-600 shadow-theme-sm">
                  👍 Good balance of time and savings
                </div>
              )}
            </div>

            {/* Comprehensive Search Progress */}
            {hasValidExpenses && searchProgress && (
              <div className="mb-4 p-3 lg:p-4 bg-theme-section border border-blue-500/30 rounded-lg shadow-theme">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-2 lg:mb-3 gap-2 sm:gap-0">
                  <div className="font-semibold text-theme-primary text-sm lg:text-base">🔍 Deep Bank Rate Search</div>
                  <div className="flex flex-col sm:flex-row sm:items-center gap-2">
                    <div className="text-theme-secondary text-xs lg:text-sm">
                      {searchProgress.current}/{searchProgress.total} batches
                    </div>
                    <button
                      onClick={stopSearch}
                      className="px-2 py-1 bg-orange-600 hover:bg-orange-700 text-white rounded text-xs font-medium shadow-theme-sm w-full sm:w-auto"
                    >
                      🛑 Stop Search
                    </button>
                  </div>
                </div>
                <div className="w-full bg-theme-card rounded-full h-2 mb-2 shadow-inner">
                  <div 
                    className="bg-blue-500 h-2 rounded-full transition-all duration-300"
                    style={{ width: `${(searchProgress.current / searchProgress.total) * 100}%` }}
                  ></div>
                </div>
                <div className="text-theme-secondary text-xs mb-2">{searchProgress.status}</div>
                <div className="text-theme-primary text-xs bg-theme-card p-2 lg:p-3 rounded border border-blue-500/20 shadow-theme-sm">
                  <strong>🎯 Smart Search System:</strong> We search in batches with a 3-minute timeout to get comprehensive results while ensuring you're not waiting forever. You can stop early and use the results found so far plus manual check options for remaining banks.
                </div>
              </div>
            )}

            {/* Cache Status for Users */}
            {hasValidExpenses && finalAvailableBanks.length > 0 && !bankDataLoading && (
              <div className="mb-3 p-2 lg:p-3 bg-theme-section border border-green-500/30 rounded text-xs shadow-theme-sm">
                <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-2 sm:gap-0">
                  <div className="flex-1">
                    <div className="font-semibold text-theme-primary mb-1">📊 Data Freshness</div>
                    <div className="text-theme-secondary text-xs lg:text-sm">
                      {getCacheInfo(userCountry).includes('Cached') 
                        ? `${getCacheInfo(userCountry)} - Data stays consistent for 24 hours`
                        : 'Fresh data just fetched - Will remain stable for 24 hours'
                      }
                    </div>
                  </div>
                  <button
                    onClick={refreshBankData}
                    disabled={bankDataLoading}
                    className="px-2 py-1 bg-green-600 hover:bg-green-700 text-white rounded text-xs disabled:opacity-50 disabled:cursor-not-allowed shadow-theme-sm w-full sm:w-auto"
                  >
                    🔄 Refresh
                  </button>
                </div>
              </div>
            )}

            {/* Bank Selection Dropdown - Always show if valid expenses */}
            {hasValidExpenses && (
              <div>
                <label className="block text-sm font-medium text-theme-secondary mb-1">
                  Choose Bank Account ({userCountry} Retail Banks - Top {totalRetailBanks} Banks Listed by Highest Rates)
                  {bankDataLoading && (
                    <span className="block sm:inline sm:ml-2 text-xs text-theme-light mt-1 sm:mt-0">
                      🔄 Fetching latest rates...
                    </span>
                  )}
                </label>
                <p className="text-xs text-theme-muted mb-3">
                  {bankDataLoading 
                    ? 'Deep-searching current retail banking rates from bank websites (this may take 2-3 minutes for comprehensive results)...'
                    : finalAvailableBanks.length > 0
                      ? '✅ Retail banks only: Live rates (🌐) + Manual check options (🔗) - Sorted by highest rates first'
                      : '⏳ Loading retail bank data...'
                  }
                </p>
                
                {/* Show loading or empty state */}
                {finalAvailableBanks.length === 0 && !bankDataLoading && (
                  <div className="mb-3 p-3 lg:p-4 bg-theme-card border border-orange-500/30 rounded text-sm">
                    <div className="font-semibold text-orange-300 mb-2">🔄 Comprehensive Bank Data Search</div>
                    <div className="text-theme-secondary text-xs lg:text-sm">
                      We're conducting thorough searches across {totalRetailBanks} retail banks in {userCountry}. This includes deep searches of bank websites for the most current rates. The process takes 2-3 minutes but ensures you get the best available rates.
                    </div>
                  </div>
                )}
                
                {/* Simple Status */}
                {!bankDataLoading && finalAvailableBanks.length > 0 && (
                  <div className="mb-3 p-2 bg-theme-section border border-green-500/30 rounded text-xs shadow-theme-sm">
                    <div className="text-theme-primary font-medium">
                      ✅ {finalAvailableBanks.length} retail banks available - sorted by highest rates first
                    </div>
                  </div>
                )}
                
                {/* Account Type Guidance */}
                <div className="mb-3 p-3 bg-theme-section border border-blue-500/30 rounded text-xs shadow-theme-sm">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <div>
                      <div className="font-semibold text-theme-primary mb-1">💰 Savings Accounts</div>
                      <div className="text-theme-secondary text-xs lg:text-sm">
                        • Instant access to funds<br/>
                        • Perfect for emergency funds<br/>
                        • Lower rates but maximum flexibility
                      </div>
                    </div>
                    <div>
                      <div className="font-semibold text-theme-primary mb-1">🏦 Time Deposits</div>
                      <div className="text-theme-secondary text-xs lg:text-sm">
                        • Higher interest rates<br/>
                        • Funds locked for specific period<br/>
                        • Consider for part of emergency fund
                      </div>
                    </div>
                  </div>
                </div>

                {bankDataError && (
                  <div className="mb-3 p-2 bg-theme-card border border-amber-500/30 rounded text-xs text-amber-300">
                    ⚠️ {bankDataError}
                  </div>
                )}
                <select
                  value={selectedBank?.id || ''}
                  onChange={(e) => {
                    console.log('🔥 DROPDOWN CHANGE EVENT:', {
                      value: e.target.value,
                      selectedIndex: e.target.selectedIndex,
                      optionText: e.target.options[e.target.selectedIndex]?.text,
                      totalOptions: e.target.options.length
                    });
                    handleBankChange(e);
                  }}
                  disabled={bankDataLoading || finalAvailableBanks.length === 0}
                  className={`input-dark w-full rounded px-3 py-3 lg:py-2 text-base lg:text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors ${
                    (bankDataLoading || finalAvailableBanks.length === 0) ? 'opacity-50 cursor-not-allowed' : ''
                  }`}
                >
                  <option value="">
                    {bankDataLoading 
                      ? 'Loading comprehensive bank data...' 
                      : finalAvailableBanks.length === 0
                        ? 'Preparing bank list...'
                        : 'Select a bank option...'
                    }
                  </option>
                  
                  {finalAvailableBanks.length > 0 && (
                    <>
                      {/* Live Data Savings Accounts - Highest Rates First */}
                      <optgroup label="💰 Savings Accounts - Live Rates (🌐) - Highest First">
                        {finalAvailableBanks
                          .filter(bank => bank.accountType.includes('Savings Account') && bank.features.includes('Live web data'))
                          .map((bank, index) => {
                            // Validate the option before rendering
                            const isValidOption = bank.id && bank.id.trim() !== '' && bank.bankName && bank.interestRate;
                            console.log(`🔍 Rendering savings live option ${index}:`, { 
                              id: bank.id, 
                              name: bank.bankName, 
                              valid: isValidOption,
                              rate: bank.interestRate 
                            });
                            
                            if (!isValidOption) {
                              console.warn('❌ Invalid savings live option:', bank);
                              return null;
                            }
                            
                            return (
                              <option key={`savings-live-${bank.id}-${index}`} value={bank.id}>
                                🌐 {bank.bankName} - {bank.interestRate} ({(bank.returnRate * 100).toFixed(2)}% p.a.)
                              </option>
                            );
                          })}
                      </optgroup>
                      
                      {/* Manual Check Savings Accounts - Sorted by Estimated Rate */}
                      <optgroup label="💰 Savings Accounts - Check Website (🔗) - Est. Highest First">
                        {finalAvailableBanks
                          .filter(bank => bank.accountType.includes('Savings Account') && bank.features.includes('Manual check required'))
                          .map((bank, index) => {
                            // Validate the option before rendering
                            const isValidOption = bank.id && bank.id.trim() !== '' && bank.bankName && bank.interestRate;
                            console.log(`🔍 Rendering savings manual option ${index}:`, { 
                              id: bank.id, 
                              name: bank.bankName, 
                              valid: isValidOption,
                              rate: bank.interestRate 
                            });
                            
                            if (!isValidOption) {
                              console.warn('❌ Invalid savings manual option:', bank);
                              return null;
                            }
                            
                            return (
                              <option key={`savings-manual-${bank.id}-${index}`} value={bank.id}>
                                🔗 {bank.bankName} - {bank.interestRate} (Est. {(bank.returnRate * 100).toFixed(2)}% p.a.)
                              </option>
                            );
                          })}
                      </optgroup>
                      
                      {/* Live Data Time Deposits - Highest Rates First */}
                      <optgroup label="🏦 Time Deposits - Live Rates (🌐) - Highest First">
                        {finalAvailableBanks
                          .filter(bank => bank.accountType.includes('Time Deposit') && bank.features.includes('Live web data'))
                          .map((bank, index) => {
                            // Validate the option before rendering
                            const isValidOption = bank.id && bank.id.trim() !== '' && bank.bankName && bank.interestRate;
                            console.log(`🔍 Rendering time live option ${index}:`, { 
                              id: bank.id, 
                              name: bank.bankName, 
                              valid: isValidOption,
                              rate: bank.interestRate 
                            });
                            
                            if (!isValidOption) {
                              console.warn('❌ Invalid time live option:', bank);
                              return null;
                            }
                            
                            return (
                              <option key={`time-live-${bank.id}-${index}`} value={bank.id}>
                                🌐 {bank.bankName} - {bank.interestRate} ({(bank.returnRate * 100).toFixed(2)}% p.a.)
                              </option>
                            );
                          })}
                      </optgroup>
                      
                      {/* Manual Check Time Deposits - Sorted by Estimated Rate */}
                      <optgroup label="🏦 Time Deposits - Check Website (🔗) - Est. Highest First">
                        {finalAvailableBanks
                          .filter(bank => bank.accountType.includes('Time Deposit') && bank.features.includes('Manual check required'))
                          .map((bank, index) => {
                            // Validate the option before rendering
                            const isValidOption = bank.id && bank.id.trim() !== '' && bank.bankName && bank.interestRate;
                            console.log(`🔍 Rendering time manual option ${index}:`, { 
                              id: bank.id, 
                              name: bank.bankName, 
                              valid: isValidOption,
                              rate: bank.interestRate 
                            });
                            
                            if (!isValidOption) {
                              console.warn('❌ Invalid time manual option:', bank);
                              return null;
                            }
                            
                            return (
                              <option key={`time-manual-${bank.id}-${index}`} value={bank.id}>
                                🔗 {bank.bankName} - {bank.interestRate} (Est. {(bank.returnRate * 100).toFixed(2)}% p.a.)
                              </option>
                            );
                          })}
                      </optgroup>
                    </>
                  )}
                </select>
                {selectedBank && (
                  <div className="mt-2 lg:mt-3 p-3 bg-theme-section border border-green-500/30 rounded text-xs lg:text-sm text-green-600 shadow-theme-sm">
                    <div className="font-semibold mb-1">Selected: {selectedBank.bankName} - {selectedBank.accountType}</div>
                    <div className="mb-1"><strong>Interest Rate:</strong> {selectedBank.interestRate}</div>
                    <div className="mb-2 lg:mb-0"><strong>Features:</strong> {selectedBank.features}</div>
                    {selectedBank.features.includes('Manual check required') && (
                      <div className="mt-2 p-2 bg-theme-card border border-green-500/30 rounded shadow-theme-sm">
                        <div className="text-xs text-green-600">
                          <strong>🔗 Visit Bank Website:</strong> 
                          <a 
                            href={selectedBank.website} 
                            target="_blank" 
                            rel="noopener noreferrer"
                            className="ml-1 text-theme-primary hover:text-theme-secondary underline transition-colors break-all"
                          >
                            {selectedBank.website} →
                          </a>
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}

          </div>
        </CardContent>
        <CardFooter>
          <div className="space-y-4 w-full">
            {/* Summary calculation */}
            <div className="border-t pt-4">
              <h4 className="font-semibold text-theme-secondary mb-3 text-sm lg:text-base">Your Safety Net Plan:</h4>
              <div className="space-y-2">
                <div className="flex flex-col sm:flex-row sm:justify-between gap-1 sm:gap-0">
                  <span className="text-theme-secondary text-sm lg:text-base">Monthly expenses:</span>
                  <span className="font-medium text-theme-light text-sm lg:text-base">{formatCurrency(expenses, currency)}</span>
                </div>
                <div className="flex flex-col sm:flex-row sm:justify-between gap-1 sm:gap-0">
                  <span className="text-theme-secondary text-sm lg:text-base">Buffer months:</span>
                  <span className="font-medium text-theme-light text-sm lg:text-base">{bufferMonths} months</span>
                </div>
                <div className="flex flex-col sm:flex-row sm:justify-between border-t border-theme pt-2 gap-1 sm:gap-0">
                  <span className="font-semibold text-theme-light text-sm lg:text-base">Total safety net needed:</span>
                  <span className="font-bold text-lg lg:text-xl text-theme-light">{formatCurrency(amount, currency)}</span>
                </div>
                <div className="flex flex-col sm:flex-row sm:justify-between gap-1 sm:gap-0">
                  <span className="text-theme-secondary text-sm lg:text-base">Timeline to complete:</span>
                  <span className="font-medium text-theme-light text-sm lg:text-base">{horizonMonths} months</span>
                </div>
                <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center bg-theme-section p-3 rounded border border-green-500/30 shadow-theme-sm gap-2 sm:gap-0">
                  <div>
                    <span className="font-semibold text-theme-primary text-sm lg:text-base">Monthly savings needed:</span>
                    <div className="text-xs text-theme-secondary">
                      {selectedBank ? `${(bankReturnRate * 100).toFixed(1)}% p.a. - ${selectedBank.bankName}` : '1% p.a. (basic rate)'}
                    </div>
                  </div>
                  <span className="text-green-600 font-bold text-xl lg:text-2xl">
                    {formatCurrency(requiredPMT, currency)}
                  </span>
                </div>
              </div>
            </div>

            {/* Bank selection guidance */}
            {!selectedBank && hasValidExpenses && finalAvailableBanks.length > 0 && (
              <div className="bg-theme-section border border-blue-500/30 rounded-lg p-3 lg:p-4 shadow-theme-sm">
                <div className="flex flex-col sm:flex-row sm:items-start gap-3">
                  <span className="text-2xl flex-shrink-0">💡</span>
                  <div className="flex-1">
                    <div className="font-semibold text-theme-primary mb-1 text-sm lg:text-base">Optimize Your Savings Rate!</div>
                    <div className="text-sm text-theme-secondary">
                      Your calculation uses a basic 1% interest rate. Select a local bank above offering 2-5% p.a., which could reduce your monthly savings by up to 20%!
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Action guidance */}
            {hasValidExpenses && (
              <div className="bg-theme-section border border-indigo-500/30 rounded-lg p-3 lg:p-4 shadow-theme-sm">
                <div className="text-sm text-theme-secondary">
                  <div className="font-semibold mb-2 text-theme-primary text-sm lg:text-base">🎯 Next Steps After Creating Your Safety Net:</div>
                  <ol className="space-y-1 list-decimal list-inside text-xs lg:text-sm">
                    <li>Open a dedicated emergency fund account (separate from checking)</li>
                    <li>Set up automatic transfers of {formatCurrency(requiredPMT, currency)} monthly</li>
                    <li>Keep funds easily accessible but not too tempting to spend</li>
                    <li>Review and adjust quarterly based on expense changes</li>
                  </ol>
                </div>
              </div>
            )}

            <Button onClick={handleSave} fullWidth disabled={!hasValidExpenses} className="text-sm lg:text-base py-3 lg:py-4">
              {existing 
                ? 'Update Safety Net Plan' 
                : 'Create My Safety Net Plan'
              }
            </Button>
          </div>
        </CardFooter>
      </Card>
      
      {/* AI Money Coach - Show when user has valid profile data */}
      {(state.userProfile.nationality && state.userProfile.location) && (
      <AIGuidance 
        step="emergency-fund" 
          context={aiContext}
          componentId="emergency-fund-ai-coach"
        />
      )}
    </div>
  );
};

export default EmergencyFundSection;