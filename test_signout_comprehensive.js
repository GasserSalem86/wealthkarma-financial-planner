// Comprehensive sign-out debugging script
// Run this in the browser console to debug the sign-out issue

console.log('🔍 COMPREHENSIVE SIGN-OUT DEBUG TEST');

// Function to check all storage states
const checkAllStorage = () => {
  console.log('\n📊 COMPLETE STORAGE CHECK:');
  
  // Check localStorage
  console.log('📱 localStorage:');
  const plannerState = localStorage.getItem('planner-state');
  if (plannerState) {
    try {
      const parsed = JSON.parse(plannerState);
      console.log('  - planner-state EXISTS:', {
        hasUserProfile: !!parsed.userProfile?.name,
        userName: parsed.userProfile?.name || 'None',
        goalsCount: parsed.goals?.length || 0,
        currentStep: parsed.currentStep || 0,
        budget: parsed.budget || 0
      });
    } catch (e) {
      console.log('  - planner-state CORRUPT');
    }
  } else {
    console.log('  - planner-state: EMPTY ✅');
  }
  
  // Check other localStorage keys
  const otherLocalStorage = Object.keys(localStorage).filter(key => 
    key.includes('planner') || key.includes('financial') || key.includes('supabase')
  );
  if (otherLocalStorage.length > 0) {
    console.log('  - Other keys:', otherLocalStorage);
  }
  
  // Check sessionStorage
  console.log('💾 sessionStorage:');
  const sessionKeys = {
    wasAuthenticated: sessionStorage.getItem('was-authenticated'),
    lastDataLoad: sessionStorage.getItem('last_data_load'),
    cleanupInProgress: sessionStorage.getItem('cleanup-in-progress'),
    tempUserData: sessionStorage.getItem('temp_user_data')
  };
  
  Object.entries(sessionKeys).forEach(([key, value]) => {
    if (value) {
      console.log(`  - ${key}: ${value}`);
    }
  });
  
  // Check for failure markers
  const failureMarkers = Object.keys(sessionStorage).filter(key => 
    key.startsWith('load_failures_')
  );
  if (failureMarkers.length > 0) {
    console.log('  - Failure markers:', failureMarkers);
  }
  
  if (Object.values(sessionKeys).every(v => !v) && failureMarkers.length === 0) {
    console.log('  - sessionStorage: CLEAN ✅');
  }
};

// Function to simulate the problematic flow
const simulateProblematicFlow = async () => {
  console.log('\n🎭 SIMULATING PROBLEMATIC FLOW:');
  
  // Step 1: Add some data as if user was using planner
  console.log('\n1️⃣ Adding test data (simulating user activity)...');
  const testData = {
    currentStep: 2,
    monthlyExpenses: 5000,
    goals: [{
      id: '1',
      name: 'Test Goal',
      amount: 50000
    }],
    budget: 2000,
    userProfile: {
      name: 'Test User',
      location: 'Dubai'
    },
    isLoading: false,
    isDataLoaded: true
  };
  
  localStorage.setItem('planner-state', JSON.stringify(testData));
  sessionStorage.setItem('was-authenticated', 'true');
  console.log('✅ Test data added');
  checkAllStorage();
  
  // Step 2: Simulate sign-out
  console.log('\n2️⃣ Simulating sign-out...');
  
  // Manual cleanup (what should happen in AuthContext)
  sessionStorage.removeItem('temp_user_data');
  localStorage.removeItem('last-save-timestamp');
  
  // Clear supabase-related items
  Object.keys(localStorage).forEach(key => {
    if (key.startsWith('supabase') || key.includes('auth')) {
      localStorage.removeItem(key);
    }
  });
  
  Object.keys(sessionStorage).forEach(key => {
    if (key.startsWith('supabase') || key.includes('auth')) {
      sessionStorage.removeItem(key);
    }
  });
  
  console.log('✅ Auth cleanup completed');
  
  // Step 3: Check if PlannerContext cleanup would trigger
  console.log('\n3️⃣ Checking if PlannerContext cleanup would trigger...');
  const wasAuthenticated = sessionStorage.getItem('was-authenticated') === 'true';
  console.log('was-authenticated flag:', wasAuthenticated);
  
  if (wasAuthenticated) {
    console.log('🔄 PlannerContext cleanup SHOULD trigger');
    
    // Simulate PlannerContext cleanup
    sessionStorage.setItem('cleanup-in-progress', 'true');
    sessionStorage.removeItem('was-authenticated');
    sessionStorage.removeItem('last_data_load');
    
    // Clear failure markers
    Object.keys(sessionStorage).forEach(key => {
      if (key.startsWith('load_failures_')) {
        sessionStorage.removeItem(key);
      }
    });
    
    // Clear localStorage
    localStorage.removeItem('planner-state');
    
    console.log('✅ PlannerContext cleanup simulated');
  } else {
    console.log('❌ PlannerContext cleanup would NOT trigger');
  }
  
  checkAllStorage();
  
  // Step 4: Simulate returning to planner
  console.log('\n4️⃣ Simulating return to planner...');
  
  // Check what would happen on init
  const savedState = localStorage.getItem('planner-state');
  if (savedState) {
    console.log('❌ PROBLEM: localStorage still has data when returning to planner');
    try {
      const parsed = JSON.parse(savedState);
      console.log('Data that would be loaded:', {
        userName: parsed.userProfile?.name,
        goalsCount: parsed.goals?.length,
        currentStep: parsed.currentStep
      });
    } catch (e) {
      console.log('Data is corrupt');
    }
  } else {
    console.log('✅ SUCCESS: No data would be loaded - clean start');
  }
  
  // Clear the cleanup flag (after 300ms normally)
  setTimeout(() => {
    sessionStorage.removeItem('cleanup-in-progress');
    console.log('🏁 Cleanup process would complete');
    checkAllStorage();
  }, 100);
};

// Function to test the race condition
const testRaceCondition = () => {
  console.log('\n⚡ TESTING RACE CONDITION:');
  
  // Simulate data existing
  const testData = { userProfile: { name: 'Test' }, currentStep: 1 };
  localStorage.setItem('planner-state', JSON.stringify(testData));
  sessionStorage.setItem('was-authenticated', 'true');
  
  console.log('Initial state set');
  
  // Simulate what happens if user navigates away during sign-out
  console.log('Simulating navigation during sign-out...');
  
  // Clear auth but leave was-authenticated briefly
  console.log('Auth cleared but was-authenticated still true:', 
    sessionStorage.getItem('was-authenticated'));
  
  // Now clear was-authenticated (what would happen in cleanup)
  sessionStorage.removeItem('was-authenticated');
  
  // Check if data is still there
  const remainingData = localStorage.getItem('planner-state');
  if (remainingData) {
    console.log('❌ RACE CONDITION: Data still exists after auth cleared');
  } else {
    console.log('✅ No race condition detected');
  }
};

// Export functions
window.debugSignOutIssue = {
  checkAllStorage,
  simulateProblematicFlow,
  testRaceCondition
};

console.log('\n📋 Available functions:');
console.log('• window.debugSignOutIssue.checkAllStorage()');
console.log('• window.debugSignOutIssue.simulateProblematicFlow()');
console.log('• window.debugSignOutIssue.testRaceCondition()');
console.log('\n🚀 Run window.debugSignOutIssue.simulateProblematicFlow() to test the full flow!');

// Auto-run initial check
checkAllStorage(); 