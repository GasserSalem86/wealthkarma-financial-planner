// Test script to verify sign-out state cleanup
// Run this in the browser console to test the sign-out behavior

console.log('🧪 Testing Sign-Out State Cleanup...');

// Function to check current state
const checkCurrentState = () => {
  console.log('\n🔍 Current State Check:');
  
  // Check localStorage
  const plannerState = localStorage.getItem('planner-state');
  if (plannerState) {
    try {
      const parsed = JSON.parse(plannerState);
      console.log('📱 localStorage state found:', {
        hasUserProfile: !!parsed.userProfile?.name,
        userName: parsed.userProfile?.name || 'None',
        goalsCount: parsed.goals?.length || 0,
        currentStep: parsed.currentStep || 0,
        monthlyExpenses: parsed.monthlyExpenses || 0,
        budget: parsed.budget || 0
      });
      return true;
    } catch (e) {
      console.error('❌ Error parsing localStorage:', e);
      return false;
    }
  } else {
    console.log('✅ No localStorage data found (this is correct after sign-out)');
    return false;
  }
};

// Function to simulate having data before sign-out
const simulateUserData = () => {
  console.log('\n📝 Simulating user data...');
  
  const testData = {
    currentStep: 3,
    monthlyExpenses: 8000,
    bufferMonths: 6,
    emergencyFundCreated: true,
    goals: [
      {
        id: '1',
        name: 'Emergency Fund',
        amount: 48000,
        category: 'Emergency'
      },
      {
        id: '2', 
        name: 'Vacation to Europe',
        amount: 25000,
        category: 'Travel'
      }
    ],
    budget: 3500,
    userProfile: {
      name: 'Test User',
      nationality: 'UAE',
      location: 'Dubai',
      monthlyIncome: 15000,
      currency: 'AED'
    },
    isLoading: false,
    isDataLoaded: true
  };
  
  localStorage.setItem('planner-state', JSON.stringify(testData));
  sessionStorage.setItem('was-authenticated', 'true');
  
  console.log('✅ Simulated user data saved to localStorage');
  checkCurrentState();
};

// Function to simulate sign-out
const simulateSignOut = async () => {
  console.log('\n🚪 Simulating sign-out...');
  
  try {
    // Import and use the actual signOut function if available
    if (window.__AUTH_CONTEXT__ && window.__AUTH_CONTEXT__.signOut) {
      console.log('🔄 Using real signOut function...');
      await window.__AUTH_CONTEXT__.signOut();
    } else {
      console.log('🔄 Manually clearing auth state...');
      
      // Manually clear auth-related storage
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
      
      // Trigger the PlannerContext cleanup by clearing auth markers
      sessionStorage.removeItem('was-authenticated');
      
      console.log('✅ Manual auth cleanup completed');
    }
    
    // Wait a moment for cleanup effects to run
    setTimeout(() => {
      console.log('\n⏱️ Checking state after 500ms delay...');
      const hasDataAfterSignOut = checkCurrentState();
      
      if (hasDataAfterSignOut) {
        console.log('❌ ISSUE: Data still exists after sign-out!');
        console.log('🔧 This suggests the fix needs improvement');
      } else {
        console.log('✅ SUCCESS: Data properly cleared after sign-out');
      }
    }, 500);
    
  } catch (error) {
    console.error('❌ Error during sign-out simulation:', error);
  }
};

// Function to run full test
const runFullTest = async () => {
  console.log('🚀 Running Full Sign-Out Test...');
  
  // Step 1: Check initial state
  console.log('\n1️⃣ Checking initial state...');
  checkCurrentState();
  
  // Step 2: Simulate user data
  console.log('\n2️⃣ Simulating user data...');
  simulateUserData();
  
  // Step 3: Wait a moment
  console.log('\n3️⃣ Waiting 1 second...');
  await new Promise(resolve => setTimeout(resolve, 1000));
  
  // Step 4: Simulate sign-out
  console.log('\n4️⃣ Simulating sign-out...');
  await simulateSignOut();
  
  console.log('\n🏁 Test completed. Check the results above.');
};

// Export functions for manual testing
window.testSignOutCleanup = {
  checkCurrentState,
  simulateUserData, 
  simulateSignOut,
  runFullTest
};

console.log('📋 Test functions available:');
console.log('• window.testSignOutCleanup.checkCurrentState()');
console.log('• window.testSignOutCleanup.simulateUserData()');
console.log('• window.testSignOutCleanup.simulateSignOut()');
console.log('• window.testSignOutCleanup.runFullTest()');
console.log('\n💡 Run window.testSignOutCleanup.runFullTest() to test everything!'); 