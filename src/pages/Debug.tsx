import { useState, useEffect } from 'react';
import { plannerPersistence } from '../services/plannerPersistence';
import { supabase } from '../lib/supabase';

const Debug = () => {
  const [debugInfo, setDebugInfo] = useState<any>({});
  const [isLoading, setIsLoading] = useState(true);
  const [testResults, setTestResults] = useState<any>({});

  useEffect(() => {
    runDebugChecks();
  }, []);

  const runDebugChecks = async () => {
    const info: any = {};
    
    try {
      // 1. Check localStorage
      console.log('🔍 Checking localStorage...');
      const plannerState = localStorage.getItem('planner-state');
      
      if (plannerState) {
        try {
          const parsed = JSON.parse(plannerState);
          info.localStorage = {
            exists: true,
            data: parsed,
            summary: {
              goals: parsed.goals?.length || 0,
              userName: parsed.userProfile?.name || 'None',
              expenses: parsed.monthlyExpenses || 0,
              budget: parsed.budget || 0,
              step: parsed.currentStep || 0
            },
            hasMeaningfulData: parsed.goals?.length > 0 || 
                             parsed.userProfile?.name || 
                             parsed.monthlyExpenses > 0
          };
        } catch (e) {
          info.localStorage = { exists: true, error: 'Failed to parse JSON', raw: plannerState };
        }
      } else {
        info.localStorage = { exists: false };
      }

      // 2. Check authentication
      console.log('👤 Checking authentication...');
      const { data: { user }, error: authError } = await supabase.auth.getUser();
      
      if (authError || !user) {
        info.auth = { authenticated: false, error: authError?.message };
      } else {
        info.auth = { 
          authenticated: true, 
          userId: user.id, 
          email: user.email 
        };

        // 3. Test load functionality
        console.log('📥 Testing load...');
        try {
          const loadResult = await plannerPersistence.loadPlanningData(user.id);
          info.loadTest = {
            success: loadResult.success,
            data: loadResult.data,
            error: loadResult.error
          };
        } catch (e) {
          info.loadTest = { 
            success: false, 
            error: e instanceof Error ? e.message : 'Unknown error' 
          };
        }
      }

      setDebugInfo(info);
    } catch (error) {
      console.error('Debug error:', error);
      setDebugInfo({ error: error instanceof Error ? error.message : 'Unknown error' });
    } finally {
      setIsLoading(false);
    }
  };

  const testManualSave = async () => {
    setIsLoading(true);
    const results: any = {};
    
    try {
      // Check authentication first
      const { data: { user }, error: authError } = await supabase.auth.getUser();
      
      if (authError || !user) {
        results.error = 'Not authenticated';
        setTestResults(results);
        setIsLoading(false);
        return;
      }

      console.log('🧪 Testing manual save...');
      
      // Test data
      const testData = {
        userProfile: {
          name: 'Test User',
          nationality: 'Test',
          location: 'Test City',
          monthlyIncome: 10000,
          currency: 'AED'
        },
        monthlyExpenses: 5000,
        goals: [{
          id: 'test-' + Date.now(),
          name: 'Test Goal',
          category: 'Home',
          targetDate: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000),
          amount: 100000,
          horizonMonths: 12,
          profile: 'Balanced',
          requiredPMT: 8000,
          paymentFrequency: 'monthly',
          paymentPeriod: 'monthly',
          customRates: {},
          monthlyAllocations: [],
          bufferMonths: 3,
          selectedBank: null,
          returnPhases: []
        }],
        budget: 3000,
        fundingStyle: 'hybrid',
        currentStep: 4,
        emergencyFundCreated: true,
        bufferMonths: 3,
        selectedPhase: 1,
        allocations: []
      };
      
      // Try to save
      console.log('🔄 Attempting to save test data...');
      const saveResult = await plannerPersistence.savePlanningData(user.id, testData);
      results.save = saveResult;
      
      if (saveResult.success) {
        // Test load
        console.log('🔄 Testing load after save...');
        const loadResult = await plannerPersistence.loadPlanningData(user.id);
        results.load = loadResult;
      }
      
    } catch (error) {
      results.error = error instanceof Error ? error.message : 'Unknown error';
    }
    
    setTestResults(results);
    setIsLoading(false);
  };

  const saveLocalStorageData = async () => {
    setIsLoading(true);
    const results: any = {};
    
    try {
      // Check authentication
      const { data: { user }, error: authError } = await supabase.auth.getUser();
      
      if (authError || !user) {
        results.error = 'Not authenticated';
        setTestResults(results);
        setIsLoading(false);
        return;
      }

      // Get localStorage data
      const plannerState = localStorage.getItem('planner-state');
      if (!plannerState) {
        results.error = 'No data in localStorage to save';
        setTestResults(results);
        setIsLoading(false);
        return;
      }

      const parsedData = JSON.parse(plannerState);
      console.log('💾 Saving your actual localStorage data...');
      
      const saveResult = await plannerPersistence.savePlanningData(user.id, parsedData);
      results.save = saveResult;
      
      if (saveResult.success) {
        // Test load
        const loadResult = await plannerPersistence.loadPlanningData(user.id);
        results.load = loadResult;
        
        // Clear localStorage since data is now saved
        localStorage.removeItem('planner-state');
        results.localStorageCleared = true;
      }
      
    } catch (error) {
      results.error = error instanceof Error ? error.message : 'Unknown error';
    }
    
    setTestResults(results);
    setIsLoading(false);
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-4">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold mb-6 text-gray-900 dark:text-white">
          🔍 Debug Information
        </h1>
        
        {isLoading && (
          <div className="bg-blue-50 dark:bg-blue-900 p-4 rounded-lg mb-6">
            <p className="text-blue-800 dark:text-blue-200">Loading debug information...</p>
          </div>
        )}

        {/* Debug Info */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6 mb-6">
          <h2 className="text-xl font-semibold mb-4 text-gray-900 dark:text-white">Debug Results</h2>
          <pre className="bg-gray-100 dark:bg-gray-700 p-4 rounded text-sm overflow-x-auto text-gray-800 dark:text-gray-200">
            {JSON.stringify(debugInfo, null, 2)}
          </pre>
        </div>

        {/* Action Buttons */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <button
            onClick={testManualSave}
            disabled={isLoading}
            className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg disabled:opacity-50"
          >
            🧪 Test Manual Save
          </button>
          
          <button
            onClick={saveLocalStorageData}
            disabled={isLoading || !debugInfo.localStorage?.exists}
            className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg disabled:opacity-50"
          >
            💾 Save Your Data
          </button>
          
          <button
            onClick={runDebugChecks}
            disabled={isLoading}
            className="bg-gray-600 hover:bg-gray-700 text-white px-4 py-2 rounded-lg disabled:opacity-50"
          >
            🔄 Refresh Debug
          </button>
        </div>

        {/* Test Results */}
        {Object.keys(testResults).length > 0 && (
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
            <h2 className="text-xl font-semibold mb-4 text-gray-900 dark:text-white">Test Results</h2>
            <pre className="bg-gray-100 dark:bg-gray-700 p-4 rounded text-sm overflow-x-auto text-gray-800 dark:text-gray-200">
              {JSON.stringify(testResults, null, 2)}
            </pre>
          </div>
        )}

        {/* Instructions */}
        <div className="bg-yellow-50 dark:bg-yellow-900 p-4 rounded-lg">
          <h3 className="font-semibold text-yellow-800 dark:text-yellow-200 mb-2">What to look for:</h3>
          <ul className="text-yellow-700 dark:text-yellow-300 text-sm space-y-1">
            <li>• <strong>localStorage.exists:</strong> Should be true if you entered data</li>
            <li>• <strong>localStorage.hasMeaningfulData:</strong> Should be true for signup to save</li>
            <li>• <strong>auth.authenticated:</strong> Should be true if signed in</li>
            <li>• <strong>loadTest.success:</strong> Shows if loading works</li>
            <li>• If you have data but it wasn't saved, click "💾 Save Your Data"</li>
          </ul>
        </div>
      </div>
    </div>
  );
};

export default Debug; 