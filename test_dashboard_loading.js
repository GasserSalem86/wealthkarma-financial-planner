/**
 * Dashboard Loading Diagnostic Tool
 * 
 * Run this in browser console on production dashboard to debug loading issues
 * 
 * Expected flow after fixes:
 * 1. User authenticated with session ✅
 * 2. Loading data from Supabase ✅  
 * 3. Using REST API fallback ✅
 * 4. Data loaded successfully ✅
 * 5. Loading state cleared ✅
 * 6. Dashboard renders ✅
 */

console.log('🩺 Dashboard Loading Diagnostic Tool');
console.log('====================================');

// Function to check current state
const checkCurrentState = () => {
  console.log('\n🔍 Current State Check:');
  
  // Check authentication
  const user = window.__SUPABASE_USER__ || 'Not available';
  console.log('👤 User:', user?.email || 'No user');
  
  // Check planner state from localStorage
  const plannerState = localStorage.getItem('planner-state');
  if (plannerState) {
    try {
      const parsed = JSON.parse(plannerState);
      console.log('📱 localStorage state:', {
        hasUserProfile: !!parsed.userProfile?.name,
        goalsCount: parsed.goals?.length || 0,
        budget: parsed.budget || 0,
        isLoading: parsed.isLoading,
        isDataLoaded: parsed.isDataLoaded,
        currentStep: parsed.currentStep
      });
    } catch (e) {
      console.error('❌ Error parsing localStorage:', e);
    }
  } else {
    console.log('📱 No localStorage data found');
  }
  
  // Check session storage
  const wasAuthenticated = sessionStorage.getItem('was-authenticated');
  const lastDataLoad = sessionStorage.getItem('last_data_load');
  console.log('💾 Session Storage:', {
    wasAuthenticated,
    lastDataLoad: lastDataLoad ? new Date(parseInt(lastDataLoad)).toLocaleString() : 'Never',
    timeSinceLoad: lastDataLoad ? (Date.now() - parseInt(lastDataLoad)) / 1000 + 's' : 'N/A'
  });
};

// Function to manually trigger data load
const manualLoad = async () => {
  console.log('\n🔄 Manual Load Test:');
  
  try {
    // Get current user
    const { data: { user }, error } = await supabase.auth.getUser();
    if (error || !user) {
      console.error('❌ No authenticated user found');
      return;
    }
    
    console.log('👤 Found user:', user.email);
    
    // Get current session
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      console.error('❌ No session found');
      return;
    }
    
    console.log('🔑 Session found with access token');
    
    // Import and test the persistence service
    const { plannerPersistence } = await import('/src/services/plannerPersistence.ts');
    console.log('📦 Imported plannerPersistence service');
    
    // Try to load data
    console.log('🎯 Starting data load...');
    const result = await plannerPersistence.loadPlanningData(user.id, session.access_token);
    
    console.log('📋 Load result:', {
      success: result.success,
      hasData: !!result.data,
      dataKeys: result.data ? Object.keys(result.data) : [],
      error: result.error
    });
    
    if (result.success && result.data) {
      console.log('✅ Manual load successful!');
      console.log('📊 Data summary:', {
        userProfile: !!result.data.userProfile,
        profileName: result.data.userProfile?.name,
        goalsCount: result.data.goals?.length || 0,
        budget: result.data.budget,
        hasAllocations: !!result.data.allocations
      });
    } else {
      console.warn('⚠️ Manual load failed or returned no data');
    }
    
  } catch (error) {
    console.error('❌ Manual load error:', error);
  }
};

// Function to clear stuck state
const clearStuckState = () => {
  console.log('\n🧹 Clearing Stuck State:');
  
  // Clear localStorage
  localStorage.removeItem('planner-state');
  console.log('✅ Cleared localStorage');
  
  // Clear session markers
  sessionStorage.removeItem('last_data_load');
  console.log('✅ Cleared session markers');
  
  // Reload page
  console.log('🔄 Reloading page...');
  setTimeout(() => window.location.reload(), 1000);
};

// Function to check Supabase connectivity
const testSupabaseConnection = async () => {
  console.log('\n🔌 Testing Supabase Connection:');
  
  try {
    // Test basic connection
    const { data, error } = await supabase.from('profiles').select('id').limit(1);
    
    if (error) {
      console.warn('⚠️ Supabase client error:', error.message);
      
      // Try REST API as fallback
      console.log('🌐 Testing REST API fallback...');
      const supabaseUrl = 'https://ysitlmkefkzkqwmopgoe.supabase.co';
      const anonKey = window.__SUPABASE_ANON_KEY__ || 'Not available';
      
      const response = await fetch(`${supabaseUrl}/rest/v1/profiles?select=id&limit=1`, {
        headers: {
          'apikey': anonKey,
          'Authorization': `Bearer ${anonKey}`,
          'Content-Type': 'application/json'
        }
      });
      
      console.log('🌐 REST API response:', {
        status: response.status,
        ok: response.ok,
        statusText: response.statusText
      });
      
    } else {
      console.log('✅ Supabase client working:', {
        connected: true,
        testDataCount: data?.length || 0
      });
    }
    
  } catch (error) {
    console.error('❌ Connection test failed:', error);
  }
};

// Auto-run diagnostics
console.log('\n🚀 Running automatic diagnostics...');
checkCurrentState();

// Make functions available globally for manual use
window.dashboardDiagnostic = {
  checkState: checkCurrentState,
  manualLoad: manualLoad,
  clearStuck: clearStuckState,
  testConnection: testSupabaseConnection
};

console.log('\n🛠️ Available Commands:');
console.log('- dashboardDiagnostic.checkState() - Check current state');
console.log('- dashboardDiagnostic.manualLoad() - Manually trigger data load');  
console.log('- dashboardDiagnostic.clearStuck() - Clear stuck state and reload');
console.log('- dashboardDiagnostic.testConnection() - Test Supabase connection');

console.log('\n💡 Quick Fix: If dashboard is stuck loading, run:');
console.log('dashboardDiagnostic.clearStuck()'); 