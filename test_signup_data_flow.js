// Signup Data Flow Test
// Open browser DevTools Console and paste this script to debug

console.log('🔍 SIGNUP DATA FLOW DEBUGGER');
console.log('==============================');

// 1. Check if there's data in localStorage
console.log('\n📋 1. Checking localStorage for planner data...');
const plannerState = localStorage.getItem('planner-state');
if (plannerState) {
  try {
    const parsed = JSON.parse(plannerState);
    console.log('✅ Found planner data in localStorage:');
    console.log('   - Goals:', parsed.goals?.length || 0);
    console.log('   - User name:', parsed.userProfile?.name || 'None');
    console.log('   - Monthly expenses:', parsed.monthlyExpenses || 0);
    console.log('   - Budget:', parsed.budget || 0);
    console.log('   - Current step:', parsed.currentStep || 0);
    
    // Check if there's meaningful data
    const hasData = parsed.goals?.length > 0 || 
                   parsed.userProfile?.name || 
                   parsed.monthlyExpenses > 0;
    console.log('   - Has meaningful data:', hasData);
    
    if (hasData) {
      console.log('✅ This data SHOULD be saved during signup');
    } else {
      console.log('⚠️ No meaningful data to save - signup save will be skipped');
    }
  } catch (e) {
    console.error('❌ Error parsing localStorage data:', e);
  }
} else {
  console.log('❌ No planner-state found in localStorage');
  console.log('💡 This means no data was generated or it was already cleared');
}

// 2. Check current authentication status
console.log('\n👤 2. Checking authentication status...');
// Note: This will only work if Supabase is available
if (typeof window !== 'undefined' && window.location.hostname === 'localhost') {
  console.log('🌐 Running on localhost - check Network tab for REST API calls during signup');
  console.log('🔍 Look for these patterns during signup:');
  console.log('   - POST to /rest/v1/profiles');
  console.log('   - POST to /rest/v1/goals');
  console.log('   - POST to /rest/v1/financial_plans');
  console.log('   - Response status should be 200 or 201');
}

// 3. Manual save test (only run when authenticated)
console.log('\n🧪 3. Manual Save Test Function:');
console.log('After you sign up, run: testManualSave()');

window.testManualSave = async function() {
  try {
    console.log('🧪 Testing manual save...');
    
    // Check authentication
    const { supabase } = await import('./src/lib/supabase.js');
    const { data: { user }, error } = await supabase.auth.getUser();
    
    if (error || !user) {
      console.error('❌ Not authenticated:', error);
      return;
    }
    
    console.log('✅ Authenticated as:', user.email);
    
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
    const { plannerPersistence } = await import('./src/services/plannerPersistence.js');
    console.log('🔄 Attempting to save test data...');
    const result = await plannerPersistence.savePlanningData(user.id, testData);
    
    if (result.success) {
      console.log('✅ Manual save successful!');
      console.log('🔄 Now testing load...');
      const loadResult = await plannerPersistence.loadPlanningData(user.id);
      if (loadResult.success && loadResult.data) {
        console.log('✅ Manual load successful:', loadResult.data);
      } else {
        console.error('❌ Manual load failed:', loadResult.error);
      }
    } else {
      console.error('❌ Manual save failed:', result.error);
    }
    
  } catch (error) {
    console.error('❌ Manual test error:', error);
  }
};

console.log('\n📋 NEXT STEPS:');
console.log('1. If no localStorage data: Create a financial plan first');
console.log('2. Then try signing up again');
console.log('3. Watch console logs for "💾 Starting immediate data save" messages');
console.log('4. Check Network tab for REST API calls');
console.log('5. After signup, run testManualSave() to verify save/load works'); 