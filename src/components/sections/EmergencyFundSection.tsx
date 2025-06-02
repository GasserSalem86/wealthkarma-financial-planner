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
        <h2 className="text-2xl lg:text-3xl font-bold text-theme-light mb-4 lg:mb-6">✅ Your Emergency Fund Plan</h2>
        
        <Card className="mb-6 lg:mb-8 border-green-500/30 bg-green-500/5">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-green-600">
              <span className="text-xl lg:text-2xl">🛡️</span>
              Emergency Fund Summary
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {/* Key metrics */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-theme-secondary text-sm">Coverage:</span>
                    <span className="font-medium text-theme-primary">{existing.bufferMonths ?? 3} months expenses</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-theme-secondary text-sm">Monthly Expenses:</span>
                    <span className="font-medium text-theme-primary">{formatCurrency(existing.amount / (existing.bufferMonths ?? 1), currency)}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-theme-secondary text-sm">Target Date:</span>
                    <span className="font-medium text-theme-primary">
                      {monthOptions[existing.targetDate.getMonth()]} {existing.targetDate.getFullYear()}
                    </span>
                  </div>
                </div>
                
                <div className="space-y-3">
                  <div className="flex justify-between items-center border-b border-green-500/30 pb-2">
                    <span className="font-semibold text-theme-primary text-sm">Total Required:</span>
                    <span className="font-bold text-xl text-green-600">{formatCurrency(existing.amount, currency)}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <div>
                      <span className="text-theme-secondary text-sm">Monthly Savings:</span>
                      <div className="text-xs text-theme-muted">
                        {existing.selectedBank ? `${(existing.selectedBank.returnRate * 100).toFixed(1)}% p.a. - ${existing.selectedBank.bankName}` : '1% p.a.'}
                      </div>
                    </div>
                    <span className="font-bold text-lg text-green-600">
                      {formatCurrency(existing.requiredPMT, currency)}
                    </span>
                  </div>
                </div>
              </div>

              {/* Bank information */}
              {existing.selectedBank ? (
                <div className="bg-theme-section border border-green-500/30 rounded-lg p-3 mt-4">
                  <div className="text-sm text-green-600 space-y-1">
                    <div><strong>Selected Bank:</strong> {existing.selectedBank.bankName} - {existing.selectedBank.accountType}</div>
                    <div><strong>Interest Rate:</strong> {existing.selectedBank.interestRate}</div>
                    <div><strong>Features:</strong> {existing.selectedBank.features}</div>
                    {existing.selectedBank.features.includes('Manual check required') && (
                      <div className="mt-2 p-2 bg-theme-card border border-green-500/30 rounded">
                        <div className="text-xs">
                          <strong>🔗 Visit Bank Website:</strong> 
                          <a 
                            href={existing.selectedBank.website} 
                            target="_blank" 
                            rel="noopener noreferrer"
                            className="ml-1 text-theme-primary hover:text-theme-secondary underline break-all"
                          >
                            {existing.selectedBank.website} →
                          </a>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              ) : (
                <div className="bg-theme-card border border-blue-500/30 rounded-lg p-3 mt-4">
                  <div className="text-sm text-blue-600">
                    <strong>💡 Optimize Your Returns!</strong> Your plan currently uses a basic 1% interest rate. You could reduce your monthly savings significantly by selecting a high-yield bank account offering 2-5% p.a.
                  </div>
                </div>
              )}

              {/* Next steps reminder */}
              <div className="bg-theme-section border border-green-500/30 rounded-lg p-3">
                <h4 className="font-semibold text-green-600 mb-2 text-sm">🚀 Implementation Steps:</h4>
                <ol className="space-y-1 list-decimal list-inside text-xs text-theme-secondary">
                  <li>Open a dedicated emergency fund account{existing.selectedBank ? ` with ${existing.selectedBank.bankName}` : ''}</li>
                  <li>Set up automatic monthly transfers of {formatCurrency(existing.requiredPMT, currency)}</li>
                  <li>Keep the account easily accessible but separate from daily spending</li>
                  <li>Review and adjust quarterly if your expenses change</li>
                </ol>
              </div>
            </div>
          </CardContent>
          <CardFooter>
            <div className="flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-4 w-full">
              <Button variant="outline" onClick={() => setIsEditing(true)} fullWidth className="text-sm lg:text-base py-3 lg:py-2 border-green-500 text-green-600 hover:bg-green-500/10">
                ✏️ Update Plan
              </Button>
              <Button onClick={onNext} fullWidth className="text-sm lg:text-base py-3 lg:py-2 bg-green-600 hover:bg-green-700">
                ✅ Continue to Goals
              </Button>
            </div>
          </CardFooter>
        </Card>
        
        {/* AI Money Coach */}
        {(state.userProfile.nationality && state.userProfile.location) && (
          <div className="mt-6">
            <AIGuidance 
              step="emergency-fund" 
              context={aiContext}
              componentId="emergency-fund-ai-coach"
            />
          </div>
        )}
      </div>
    );
  }

  // Creation / editing view
  return (
    <div className="container mx-auto max-w-3xl px-4 lg:px-0">
      <h2 className="text-2xl lg:text-3xl font-bold text-theme-light mb-3 lg:mb-4">
        {existing ? (isEditing ? 'Update Your Emergency Fund' : 'Emergency Fund') : "Build Your Emergency Fund"}
      </h2>

      {/* Progress indicator for new users */}
      {!existing && (
        <div className="mb-6 lg:mb-8">
          <div className="flex items-center justify-between text-xs text-theme-muted mb-2">
            <span>Step 1: Why</span>
            <span>Step 2: How Much</span>
            <span>Step 3: By When</span>
            <span>Step 4: Where</span>
          </div>
          <div className="h-2 bg-theme-tertiary rounded-full overflow-hidden">
            <div className="h-full bg-gradient-to-r from-blue-500 to-green-500 rounded-full transition-all duration-500" 
                 style={{ width: '100%' }}>
            </div>
          </div>
        </div>
      )}
      
      <div className="space-y-6 lg:space-y-8">
        
        {/* STEP 1: WHY - Explain the purpose */}
        <Card className="border-blue-500/30">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-blue-600 text-lg lg:text-xl">
              <span className="flex items-center justify-center w-8 h-8 bg-blue-600 text-white rounded-full text-sm font-bold">1</span>
              Why Do You Need an Emergency Fund?
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4 text-theme-secondary">
              <p className="text-sm lg:text-base leading-relaxed">
                An emergency fund is your financial safety net for unexpected expenses. As a GCC expat, you face unique risks that make this especially critical.
              </p>
              
              {/* Expat-specific risks */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="bg-theme-section p-3 rounded-lg border border-red-500/30">
                  <h4 className="font-semibold text-red-600 mb-2 text-sm">⚠️ Expat Risks</h4>
                  <ul className="text-xs space-y-1">
                    <li>• Visa cancellation (30 days to leave)</li>
                    <li>• Limited local family support</li>
                    <li>• Repatriation costs</li>
                    <li>• Banking restrictions when unemployed</li>
                  </ul>
                </div>
                <div className="bg-theme-section p-3 rounded-lg border border-amber-500/30">
                  <h4 className="font-semibold text-amber-600 mb-2 text-sm">💰 Common Emergencies</h4>
                  <ul className="text-xs space-y-1">
                    <li>• Job loss or salary delays</li>
                    <li>• Medical emergencies</li>
                    <li>• Car repairs or accidents</li>
                    <li>• Family emergencies back home</li>
                  </ul>
                </div>
              </div>
              
              <div className="bg-green-500/10 border border-green-500/30 rounded-lg p-3">
                <p className="text-green-600 text-sm">
                  <strong>💡 Bottom Line:</strong> Your emergency fund gives you peace of mind and financial security to handle unexpected situations without derailing your long-term goals.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* STEP 2: HOW MUCH - Choose buffer months */}
        <Card className="border-emerald-500/30">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-emerald-600 text-lg lg:text-xl">
              <span className="flex items-center justify-center w-8 h-8 bg-emerald-600 text-white rounded-full text-sm font-bold">2</span>
              How Much Should You Save?
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              
              {/* Monthly expenses display */}
              <div className={`border rounded-lg p-3 lg:p-4 ${hasValidExpenses ? 'bg-theme-section border-blue-500/30' : 'bg-red-500/10 border-red-500/30'}`}>
                <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-2 sm:gap-0">
                  <div>
                    <label className={`block text-sm font-medium mb-1 ${hasValidExpenses ? 'text-theme-primary' : 'text-red-600'}`}>
                      Your Monthly Living Expenses
                    </label>
                    <p className={`text-xs ${hasValidExpenses ? 'text-theme-secondary' : 'text-red-500'}`}>
                      {hasValidExpenses 
                        ? 'From your profile: rent, utilities, food, transport, insurance, loans'
                        : 'Please complete your profile first to calculate your emergency fund'
                      }
                    </p>
                  </div>
                  <div className="text-left sm:text-right">
                    <span className={`text-lg lg:text-xl font-bold ${hasValidExpenses ? 'text-theme-primary' : 'text-red-600'}`}>
                      {hasValidExpenses ? formatCurrency(expenses, currency) : 'Not set'}
                    </span>
                  </div>
                </div>
              </div>

              {hasValidExpenses && (
                <>
                  <div>
                    <p className="text-sm text-theme-secondary mb-3">
                      Choose how many months of expenses you want to cover. We recommend 6 months for expats due to the unique risks you face.
                    </p>
                    
                    {/* Buffer months selection */}
                    <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
                      {[
                        { months: 3, label: '3 Months', desc: 'Minimum', recommended: false, risk: 'Higher Risk' },
                        { months: 4, label: '4 Months', desc: 'Basic', recommended: false, risk: 'Moderate Risk' },
                        { months: 5, label: '5 Months', desc: 'Better', recommended: false, risk: 'Lower Risk' },
                        { months: 6, label: '6 Months', desc: 'Recommended', recommended: true, risk: 'Safest for Expats' }
                      ].map(option => (
                        <button
                          key={option.months}
                          onClick={() => setBufferMonths(option.months)}
                          className={`p-3 lg:p-4 rounded-lg border-2 text-center transition-all duration-200 ${
                            bufferMonths === option.months 
                              ? 'bg-emerald-600 text-white border-emerald-600 shadow-lg transform scale-105' 
                              : option.recommended
                                ? 'bg-theme-section border-emerald-500/50 text-emerald-600 hover:bg-emerald-500/10 hover:border-emerald-500'
                                : 'bg-theme-tertiary border-theme text-theme-secondary hover:bg-theme-section hover:border-theme-hover'
                          }`}
                        >
                          <div className="font-bold text-sm lg:text-base">{option.label}</div>
                          <div className="text-xs mt-1 opacity-90">{option.desc}</div>
                          <div className="text-xs mt-1 font-medium">
                            {formatCurrency(expenses * option.months, currency)}
                          </div>
                          {option.recommended && bufferMonths !== option.months && (
                            <div className="text-xs mt-1 font-bold text-emerald-600">⭐ Best Choice</div>
                          )}
                          {bufferMonths === option.months && (
                            <div className="text-xs mt-1 font-bold">✓ Selected</div>
                          )}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Contextual advice based on selection */}
                  <div className="mt-4">
                    {bufferMonths === 3 && (
                      <div className="bg-amber-500/10 border border-amber-500/30 rounded-lg p-3">
                        <p className="text-amber-600 text-sm">
                          <strong>⚠️ Consider More:</strong> 3 months might be tight for expats. If you lose your job, you have only 30 days to find new employment or leave the country.
                        </p>
                      </div>
                    )}
                    {bufferMonths === 6 && (
                      <div className="bg-green-500/10 border border-green-500/30 rounded-lg p-3">
                        <p className="text-green-600 text-sm">
                          <strong>✅ Excellent Choice!</strong> 6 months gives you solid protection against expat-specific risks and time to find quality employment.
                        </p>
                      </div>
                    )}
                    {bufferMonths > 6 && (
                      <div className="bg-blue-500/10 border border-blue-500/30 rounded-lg p-3">
                        <p className="text-blue-600 text-sm">
                          <strong>💪 Conservative Approach:</strong> You're building a very strong safety net. Consider if this much emergency savings might delay other financial goals.
                        </p>
                      </div>
                    )}
                  </div>
                </>
              )}
            </div>
          </CardContent>
        </Card>

        {/* STEP 3: BY WHEN - Set realistic target date */}
        {hasValidExpenses && (
          <Card className="border-purple-500/30">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-purple-600 text-lg lg:text-xl">
                <span className="flex items-center justify-center w-8 h-8 bg-purple-600 text-white rounded-full text-sm font-bold">3</span>
                By When Should You Complete It?
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <p className="text-sm text-theme-secondary">
                  Your emergency fund should be prioritized and built as quickly as possible. Based on your income capacity, here's a realistic timeline:
                </p>
                
                {/* Smart timeline calculation */}
                {state.userProfile.monthlyIncome && (
                  <div className="bg-theme-section border border-blue-500/30 rounded-lg p-4">
                    <div className="space-y-3">
                      <div className="flex justify-between text-sm">
                        <span className="text-theme-secondary">Monthly Income:</span>
                        <span className="font-medium text-theme-primary">{formatCurrency(state.userProfile.monthlyIncome, currency)}</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-theme-secondary">Monthly Expenses:</span>
                        <span className="font-medium text-theme-primary">{formatCurrency(expenses, currency)}</span>
                      </div>
                      <div className="flex justify-between text-sm border-t border-theme pt-2">
                        <span className="text-theme-secondary">Available for Savings:</span>
                        <span className="font-bold text-green-600">{formatCurrency(state.userProfile.monthlyIncome - expenses, currency)}</span>
                      </div>
                      
                      {/* Timeline suggestions */}
                      <div className="mt-4">
                        <p className="text-xs text-theme-muted mb-2">Suggested timelines (allocating different % of available savings to emergency fund) - Click to select:</p>
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                          {[50, 70, 90].map(percentage => {
                            const monthlySavings = (state.userProfile.monthlyIncome! - expenses) * (percentage / 100);
                            const months = Math.ceil(amount / monthlySavings);
                            const isRealistic = months <= 12 && monthlySavings > 0;
                            const suggestedDate = new Date(today.getFullYear(), today.getMonth() + months, 1);
                            const isCurrentlySelected = Math.abs(horizonMonths - months) <= 1; // Allow 1 month tolerance
                            
                            const handleTimelineSelect = () => {
                              if (isRealistic && monthlySavings > 0) {
                                setTargetMonth(suggestedDate.getMonth() + 1);
                                setTargetYear(suggestedDate.getFullYear());
                              }
                            };
                            
                            return (
                              <button
                                key={percentage}
                                onClick={handleTimelineSelect}
                                disabled={!isRealistic || monthlySavings <= 0}
                                className={`text-center p-2 rounded border text-xs transition-all duration-200 ${
                                  isCurrentlySelected
                                    ? 'border-green-500 bg-green-500/20 shadow-md transform scale-105'
                                    : percentage === 70 
                                      ? 'border-green-500 bg-green-500/10 hover:bg-green-500/15 hover:scale-102' 
                                      : 'border-theme bg-theme-section hover:bg-theme-tertiary hover:scale-102'
                                } ${
                                  !isRealistic || monthlySavings <= 0 
                                    ? 'opacity-50 cursor-not-allowed' 
                                    : 'cursor-pointer'
                                }`}
                              >
                                <div className="font-bold">{percentage}% allocation</div>
                                <div className={`${
                                  isCurrentlySelected 
                                    ? 'text-green-700 font-medium' 
                                    : percentage === 70 
                                      ? 'text-green-600' 
                                      : 'text-theme-secondary'
                                }`}>
                                  {formatCurrency(monthlySavings, currency)}/month
                                </div>
                                <div className={`font-medium ${
                                  isCurrentlySelected 
                                    ? 'text-green-700' 
                                    : percentage === 70 
                                      ? 'text-green-600' 
                                      : 'text-theme-secondary'
                                }`}>
                                  {isRealistic ? `${months} months` : '12+ months'}
                                </div>
                                <div className="text-xs mt-1">
                                  {isCurrentlySelected && '✓ Selected'}
                                  {!isCurrentlySelected && percentage === 70 && '⭐ Recommended'}
                                  {!isCurrentlySelected && percentage !== 70 && isRealistic && 'Click to select'}
                                </div>
                                {isRealistic && (
                                  <div className="text-xs text-theme-muted mt-1">
                                    Target: {suggestedDate.toLocaleDateString('en-US', { month: 'short', year: 'numeric' })}
                                  </div>
                                )}
                              </button>
                            );
                          })}
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* Target date selection */}
                <div>
                  <label className="block text-sm font-medium text-theme-secondary mb-3">
                    Set Your Target Completion Date
                  </label>
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-3 lg:gap-4">
                    <div>
                      <label className="block text-xs font-medium mb-1 text-theme-muted">Target Month</label>
                      <select
                        value={targetMonth}
                        onChange={e => setTargetMonth(Number(e.target.value))}
                        className="w-full px-3 py-2 lg:py-3 text-sm lg:text-base border border-theme bg-theme-card text-theme-primary rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      >
                        {monthOptions.map((month, index) => (
                          <option key={month} value={index + 1}>{month}</option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="block text-xs font-medium mb-1 text-theme-muted">Target Year</label>
                      <select
                        value={targetYear}
                        onChange={e => setTargetYear(Number(e.target.value))}
                        className="w-full px-3 py-2 lg:py-3 text-sm lg:text-base border border-theme bg-theme-card text-theme-primary rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      >
                        {yearOptions.map(year => (
                          <option key={year} value={year}>{year}</option>
                        ))}
                      </select>
                    </div>
                  </div>
                  
                  {/* Timeline feedback */}
                  <div className="mt-3 p-3 bg-theme-section border border-blue-500/30 rounded-lg">
                    <div className="flex justify-between items-center text-sm">
                      <span className="text-theme-secondary">Time to complete:</span>
                      <span className="font-bold text-blue-600">{horizonMonths} months</span>
                    </div>
                    <div className="flex justify-between items-center text-sm mt-1">
                      <span className="text-theme-secondary">Required monthly savings:</span>
                      <span className="font-bold text-lg text-theme-primary">{formatCurrency(requiredPMT, currency)}</span>
                    </div>
                    {horizonMonths <= 6 && (
                      <div className="mt-2 text-xs text-green-600">
                        ✅ Excellent timeline! Building your safety net quickly is wise.
                      </div>
                    )}
                    {horizonMonths > 12 && (
                      <div className="mt-2 text-xs text-amber-600">
                        ⚠️ Consider a shorter timeline - emergency funds should be prioritized.
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* STEP 4: WHERE - Choose where to keep the money */}
        {hasValidExpenses && (
          <Card className="border-indigo-500/30">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-indigo-600 text-lg lg:text-xl">
                <span className="flex items-center justify-center w-8 h-8 bg-indigo-600 text-white rounded-full text-sm font-bold">4</span>
                Where Should You Keep Your Emergency Fund?
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="bg-theme-section border border-amber-500/30 rounded-lg p-4">
                  <h4 className="font-semibold text-amber-600 mb-2">⚠️ Important: Don't Keep It In Your Current Account</h4>
                  <p className="text-sm text-theme-secondary">
                    Your emergency fund should be easily accessible but separate from your daily spending account. This prevents you from accidentally spending it while still allowing quick access in true emergencies.
                  </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="bg-green-500/10 border border-green-500/30 rounded-lg p-3">
                    <h4 className="font-semibold text-green-600 mb-2 text-sm">✅ Best Options</h4>
                    <ul className="text-xs space-y-1 text-theme-secondary">
                      <li>• High-yield savings account (2-5% p.a.)</li>
                      <li>• 3-6 month time deposits</li>
                      <li>• Money market accounts</li>
                      <li>• Government-insured accounts</li>
                    </ul>
                  </div>
                  <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-3">
                    <h4 className="font-semibold text-red-600 mb-2 text-sm">❌ Avoid These</h4>
                    <ul className="text-xs space-y-1 text-theme-secondary">
                      <li>• Your main checking/current account</li>
                      <li>• Stock market investments</li>
                      <li>• Long-term fixed deposits (1+ years)</li>
                      <li>• Cryptocurrency or volatile assets</li>
                    </ul>
                  </div>
                </div>

                {/* Bank selection */}
                <div>
                  <label className="block text-sm font-medium text-theme-secondary mb-3">
                    Choose a Bank for Your Emergency Fund
                  </label>
                  <p className="text-xs text-theme-muted mb-3">
                    Select a high-yield savings account or time deposit that offers good interest rates while keeping your money accessible. We've found the best options in your country:
                  </p>

                  {bankDataLoading && (
                    <div className="mb-4 p-3 bg-theme-section border border-blue-500/30 rounded-lg">
                      <div className="flex items-center gap-3">
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-500"></div>
                        <div className="flex-1">
                          <div className="text-sm text-blue-600 font-medium">
                            {searchProgress?.status || 'Loading bank data...'}
                          </div>
                          {searchProgress && (
                            <div className="text-xs text-theme-muted mt-1">
                              Progress: {searchProgress.current}/{searchProgress.total} batches completed
                            </div>
                          )}
                        </div>
                        <button
                          onClick={stopSearch}
                          className="px-3 py-1 text-xs bg-red-500 text-white rounded hover:bg-red-600 transition-colors"
                        >
                          Stop
                        </button>
                      </div>
                    </div>
                  )}

                  {/* Bank dropdown */}
                  <div className="space-y-3">
                    <select
                      value={selectedBank?.id || ''}
                      onChange={handleBankChange}
                      className="w-full px-3 py-3 text-sm lg:text-base border border-theme bg-theme-card text-theme-primary rounded-md focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                      disabled={bankDataLoading}
                    >
                      <option value="">Select a bank for better interest rates...</option>
                      {finalAvailableBanks.length > 0 && (
                        <>
                          {/* Live Data Savings Accounts - Highest Rates First */}
                          <optgroup label="💰 Savings Accounts - Live Rates (🌐) - Highest First">
                            {finalAvailableBanks
                              .filter(bank => bank.accountType.includes('Savings Account') && bank.features.includes('Live web data'))
                              .map((bank, index) => {
                                const isValidOption = bank.id && bank.id.trim() !== '' && bank.bankName && bank.interestRate;
                                if (!isValidOption) return null;
                                return (
                                  <option key={`savings-live-${bank.id}-${index}`} value={bank.id}>
                                    🌐 {bank.bankName} - {bank.interestRate} ({(bank.returnRate * 100).toFixed(2)}% p.a.)
                                  </option>
                                );
                              })}
                          </optgroup>
                          
                          {/* Manual Check Savings Accounts */}
                          <optgroup label="💰 Savings Accounts - Check Website (🔗) - Est. Highest First">
                            {finalAvailableBanks
                              .filter(bank => bank.accountType.includes('Savings Account') && bank.features.includes('Manual check required'))
                              .map((bank, index) => {
                                const isValidOption = bank.id && bank.id.trim() !== '' && bank.bankName && bank.interestRate;
                                if (!isValidOption) return null;
                                return (
                                  <option key={`savings-manual-${bank.id}-${index}`} value={bank.id}>
                                    🔗 {bank.bankName} - {bank.interestRate} (Est. {(bank.returnRate * 100).toFixed(2)}% p.a.)
                                  </option>
                                );
                              })}
                          </optgroup>
                          
                          {/* Live Data Time Deposits */}
                          <optgroup label="🏦 Time Deposits - Live Rates (🌐) - Highest First">
                            {finalAvailableBanks
                              .filter(bank => bank.accountType.includes('Time Deposit') && bank.features.includes('Live web data'))
                              .map((bank, index) => {
                                const isValidOption = bank.id && bank.id.trim() !== '' && bank.bankName && bank.interestRate;
                                if (!isValidOption) return null;
                                return (
                                  <option key={`time-live-${bank.id}-${index}`} value={bank.id}>
                                    🌐 {bank.bankName} - {bank.interestRate} ({(bank.returnRate * 100).toFixed(2)}% p.a.)
                                  </option>
                                );
                              })}
                          </optgroup>
                          
                          {/* Manual Check Time Deposits */}
                          <optgroup label="🏦 Time Deposits - Check Website (🔗) - Est. Highest First">
                            {finalAvailableBanks
                              .filter(bank => bank.accountType.includes('Time Deposit') && bank.features.includes('Manual check required'))
                              .map((bank, index) => {
                                const isValidOption = bank.id && bank.id.trim() !== '' && bank.bankName && bank.interestRate;
                                if (!isValidOption) return null;
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

                    {/* Selected bank details */}
                    {selectedBank && (
                      <div className="p-4 bg-green-500/10 border border-green-500/30 rounded-lg">
                        <div className="font-semibold text-green-600 mb-2">✅ Selected: {selectedBank.bankName}</div>
                        <div className="space-y-1 text-sm text-theme-secondary">
                          <div><strong>Account Type:</strong> {selectedBank.accountType}</div>
                          <div><strong>Interest Rate:</strong> {selectedBank.interestRate}</div>
                          <div><strong>Features:</strong> {selectedBank.features}</div>
                        </div>
                        {selectedBank.features.includes('Manual check required') && (
                          <div className="mt-3 p-2 bg-theme-card border border-green-500/30 rounded">
                            <div className="text-xs text-green-600">
                              <strong>🔗 Visit Bank Website:</strong> 
                              <a 
                                href={selectedBank.website} 
                                target="_blank" 
                                rel="noopener noreferrer"
                                className="ml-1 text-theme-primary hover:text-theme-secondary underline break-all"
                              >
                                {selectedBank.website} →
                              </a>
                            </div>
                          </div>
                        )}
                      </div>
                    )}

                    {/* Bank optimization tip */}
                    {!selectedBank && finalAvailableBanks.length > 0 && (
                      <div className="bg-blue-500/10 border border-blue-500/30 rounded-lg p-3">
                        <div className="text-sm text-blue-600">
                          <strong>💡 Optimize Your Returns!</strong> Your calculation uses a basic 1% interest rate. Selecting a bank above offering 2-5% p.a. could reduce your monthly savings requirement by up to 20%!
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Summary and Action */}
        {hasValidExpenses && (
          <Card className="border-green-500/30 bg-green-500/5">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-green-600 text-lg lg:text-xl">
                <span className="text-xl lg:text-2xl">🎯</span>
                Your Emergency Fund Plan
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span className="text-theme-secondary">Target Amount:</span>
                      <span className="font-bold text-green-600">{formatCurrency(amount, currency)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-theme-secondary">Coverage:</span>
                      <span className="font-medium text-theme-primary">{bufferMonths} months expenses</span>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span className="text-theme-secondary">Timeline:</span>
                      <span className="font-medium text-theme-primary">{horizonMonths} months</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-theme-secondary">Monthly Savings:</span>
                      <span className="font-bold text-lg text-theme-primary">{formatCurrency(requiredPMT, currency)}</span>
                    </div>
                  </div>
                </div>
                
                {selectedBank && (
                  <div className="border-t border-green-500/30 pt-3">
                    <div className="text-sm text-green-600">
                      <strong>📊 With {selectedBank.bankName}:</strong> Earning {(bankReturnRate * 100).toFixed(1)}% p.a. interest
                    </div>
                  </div>
                )}

                <div className="bg-theme-section border border-green-500/30 rounded-lg p-3">
                  <h4 className="font-semibold text-green-600 mb-2 text-sm">🚀 Next Steps After Creating Your Plan:</h4>
                  <ol className="space-y-1 list-decimal list-inside text-xs text-theme-secondary">
                    <li>Open a dedicated emergency fund account with your selected bank</li>
                    <li>Set up automatic monthly transfers of {formatCurrency(requiredPMT, currency)}</li>
                    <li>Keep the account easily accessible but separate from daily spending</li>
                    <li>Review and adjust quarterly if your expenses change</li>
                  </ol>
                </div>
              </div>
            </CardContent>
            <CardFooter>
              <Button onClick={handleSave} fullWidth className="text-sm lg:text-base py-3 lg:py-4 bg-green-600 hover:bg-green-700">
                {existing 
                  ? '✅ Update My Emergency Fund Plan' 
                  : '🎯 Create My Emergency Fund Plan'
                }
              </Button>
            </CardFooter>
          </Card>
        )}

        {/* Profile completion reminder */}
        {!hasValidExpenses && (
          <Card className="border-red-500/30 bg-red-500/5">
            <CardContent>
              <div className="text-center py-6">
                <div className="text-4xl mb-3">📋</div>
                <h3 className="text-lg font-semibold text-red-600 mb-2">Complete Your Profile First</h3>
                <p className="text-sm text-theme-secondary mb-4">
                  To calculate your emergency fund, we need to know your monthly expenses. Please go back and complete your profile information.
                </p>
                <Button variant="outline" onClick={() => window.history.back()} className="border-red-500 text-red-600 hover:bg-red-500/10">
                  ← Complete Profile
                </Button>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
      
      {/* AI Money Coach - Show when user has valid profile data */}
      {(state.userProfile.nationality && state.userProfile.location) && (
        <div className="mt-8">
          <AIGuidance 
            step="emergency-fund" 
            context={aiContext}
            componentId="emergency-fund-ai-coach"
          />
        </div>
      )}
    </div>
  );
};

export default EmergencyFundSection;