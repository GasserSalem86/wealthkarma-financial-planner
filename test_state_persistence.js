// State Persistence Test
// Test that refreshing the page doesn't restart the planning flow

console.log('🧪 Testing State Persistence...');

// Test 1: Check if localStorage persists data
const testLocalStoragePersistence = () => {
  console.log('📱 Testing localStorage persistence...');
  
  // Check current localStorage state
  const plannerState = localStorage.getItem('planner-state');
  if (plannerState) {
    try {
      const parsed = JSON.parse(plannerState);
      console.log('✅ Found existing planner state:', {
        currentStep: parsed.currentStep,
        hasProfile: !!parsed.userProfile?.name,
        goalsCount: parsed.goals?.length || 0,
        budget: parsed.budget || 0,
        monthlyExpenses: parsed.monthlyExpenses || 0,
        hasLocation: !!parsed.userProfile?.location
      });
      
      // Check if state has meaningful progress
      const hasProgress = parsed.currentStep > 0 || 
                         parsed.userProfile?.name || 
                         parsed.goals?.length > 0 || 
                         parsed.monthlyExpenses > 0;
      
      if (hasProgress) {
        console.log('✅ State has progress - should NOT restart on refresh');
      } else {
        console.log('ℹ️ State is at initial values - fresh start expected');
      }
      
      return parsed;
    } catch (error) {
      console.error('❌ Failed to parse localStorage data:', error);
      return null;
    }
  } else {
    console.log('ℹ️ No localStorage data found - fresh start');
    return null;
  }
};

// Test 2: Simulate page refresh scenario
const simulatePageRefresh = () => {
  console.log('🔄 Simulating page refresh scenario...');
  
  // Check if user is authenticated
  const user = window.__SUPABASE_USER__ || null;
  const wasAuthenticated = sessionStorage.getItem('was-authenticated') === 'true';
  
  console.log('🔍 Authentication state:', {
    hasUser: !!user,
    wasAuthenticated,
    shouldClearState: !user && wasAuthenticated
  });
  
  if (!user && wasAuthenticated) {
    console.log('❌ User was authenticated but is now signed out - state should be cleared');
  } else if (!user && !wasAuthenticated) {
    console.log('✅ Anonymous user - state should be preserved');
  } else if (user) {
    console.log('✅ Authenticated user - state should be loaded from Supabase or preserved');
  }
};

// Test 3: Manual state preservation test
const testStatePreservation = () => {
  console.log('💾 Testing state preservation...');
  
  // Create a test state
  const testState = {
    currentStep: 2,
    monthlyExpenses: 5000,
    bufferMonths: 6,
    emergencyFundCreated: true,
    goals: [{
      id: 'test-goal',
      name: 'Test Goal',
      amount: 50000,
      category: 'Travel'
    }],
    budget: 2000,
    userProfile: {
      name: 'Test User',
      nationality: 'UAE',
      location: 'Dubai',
      monthlyIncome: 10000,
      currency: 'AED'
    },
    isLoading: false,
    isDataLoaded: true
  };
  
  // Save test state
  try {
    localStorage.setItem('test-planner-state', JSON.stringify(testState));
    console.log('✅ Saved test state to localStorage');
    
    // Read it back
    const retrieved = JSON.parse(localStorage.getItem('test-planner-state'));
    console.log('✅ Successfully retrieved test state:', {
      step: retrieved.currentStep,
      name: retrieved.userProfile?.name,
      goals: retrieved.goals?.length
    });
    
    // Clean up
    localStorage.removeItem('test-planner-state');
    console.log('🧹 Cleaned up test state');
    
    return true;
  } catch (error) {
    console.error('❌ State preservation test failed:', error);
    return false;
  }
};

// Test 4: Check PlannerContext behavior
const testPlannerContext = () => {
  console.log('🎯 Testing PlannerContext behavior...');
  
  // Check if PlannerContext is available
  if (window.React && window.__PLANNER_CONTEXT__) {
    const context = window.__PLANNER_CONTEXT__;
    console.log('✅ PlannerContext found:', {
      currentStep: context.state.currentStep,
      isLoading: context.state.isLoading,
      isDataLoaded: context.state.isDataLoaded
    });
  } else {
    console.log('ℹ️ PlannerContext not accessible from window - check in React DevTools');
  }
};

// Run all tests
console.log('🚀 Running state persistence tests...');
console.log('=====================================');

const currentState = testLocalStoragePersistence();
console.log('');

simulatePageRefresh();
console.log('');

const preservationWorks = testStatePreservation();
console.log('');

testPlannerContext();
console.log('');

console.log('📊 Test Summary:');
console.log('================');
console.log('Current state exists:', !!currentState);
console.log('Preservation mechanism works:', preservationWorks);
console.log('');

if (currentState && preservationWorks) {
  console.log('✅ State persistence should be working correctly');
  console.log('💡 If refreshing still restarts the flow, check:');
  console.log('   1. Browser console for errors during page load');
  console.log('   2. PlannerContext initialization in React DevTools');
  console.log('   3. Any authentication-related state clearing');
} else {
  console.log('❌ State persistence may have issues');
  console.log('💡 Check localStorage and PlannerContext implementation');
}

console.log('');
console.log('🔧 Manual test instructions:');
console.log('1. Fill out some form data (name, location, expenses)');
console.log('2. Progress to step 2 or 3 in the planning flow');
console.log('3. Refresh the page (F5 or Cmd+R)');
console.log('4. Check if you return to the same step with data intact'); 