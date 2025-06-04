// Test script for data persistence debugging
// Copy and paste this into the browser console on your dashboard

console.log('🧪 Starting data persistence debug test...');

// Test 1: Check if user is authenticated
const testAuthentication = async () => {
  console.log('🔐 Testing authentication...');
  try {
    const { supabase } = await import('/src/lib/supabase.ts');
    const { data: { user }, error } = await supabase.auth.getUser();
    
    if (error) {
      console.error('❌ Auth error:', error);
      return false;
    }
    
    if (user) {
      console.log('✅ User authenticated:', user.email, 'ID:', user.id);
      return user;
    } else {
      console.log('❌ No user found');
      return false;
    }
  } catch (error) {
    console.error('❌ Error checking auth:', error);
    return false;
  }
};

// Test 2: Check localStorage data
const testLocalStorageData = () => {
  console.log('💾 Testing localStorage data...');
  try {
    const plannerState = localStorage.getItem('planner-state');
    if (plannerState) {
      const parsed = JSON.parse(plannerState);
      console.log('✅ Found localStorage data:', {
        goals: parsed.goals?.length || 0,
        hasProfile: !!parsed.userProfile?.name,
        budget: parsed.budget || 0,
        hasExpenses: parsed.monthlyExpenses > 0
      });
      return parsed;
    } else {
      console.log('ℹ️ No localStorage data found');
      return null;
    }
  } catch (error) {
    console.error('❌ Error reading localStorage:', error);
    return null;
  }
};

// Test 3: Test manual data save
const testDataSave = async (user, plannerState) => {
  if (!user || !plannerState) {
    console.log('⚠️ Skipping save test - missing user or data');
    return;
  }
  
  console.log('💾 Testing manual data save...');
  try {
    const { plannerPersistence } = await import('/src/services/plannerPersistence.ts');
    const result = await plannerPersistence.savePlanningData(user.id, plannerState);
    
    if (result.success) {
      console.log('✅ Data save successful!');
    } else {
      console.error('❌ Data save failed:', result.error);
    }
    
    return result;
  } catch (error) {
    console.error('❌ Error during save test:', error);
    return { success: false, error: error.message };
  }
};

// Test 4: Test data loading
const testDataLoad = async (user) => {
  if (!user) {
    console.log('⚠️ Skipping load test - no user');
    return;
  }
  
  console.log('📥 Testing data load...');
  try {
    const { plannerPersistence } = await import('/src/services/plannerPersistence.ts');
    const result = await plannerPersistence.loadPlanningData(user.id);
    
    if (result.success) {
      console.log('✅ Data load successful:', {
        hasData: !!result.data,
        goals: result.data?.goals?.length || 0,
        hasProfile: !!result.data?.userProfile?.name,
        budget: result.data?.budget || 0
      });
    } else {
      console.error('❌ Data load failed:', result.error);
    }
    
    return result;
  } catch (error) {
    console.error('❌ Error during load test:', error);
    return { success: false, error: error.message };
  }
};

// Test 5: Test database connectivity
const testDatabaseConnection = async (user) => {
  if (!user) {
    console.log('⚠️ Skipping database test - no user');
    return;
  }
  
  console.log('🗄️ Testing database connectivity...');
  try {
    const { supabase } = await import('/src/lib/supabase.ts');
    
    // Test profile table
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('id, email, full_name')
      .eq('id', user.id)
      .single();
    
    if (profileError) {
      console.error('❌ Profile query error:', profileError);
    } else {
      console.log('✅ Profile found:', profile);
    }
    
    // Test goals table
    const { data: goals, error: goalsError } = await supabase
      .from('goals')
      .select('id, name, amount')
      .eq('user_id', user.id);
    
    if (goalsError) {
      console.error('❌ Goals query error:', goalsError);
    } else {
      console.log('✅ Goals found:', goals?.length || 0);
    }
    
    return {
      profileExists: !!profile,
      goalsCount: goals?.length || 0,
      hasErrors: !!(profileError || goalsError)
    };
    
  } catch (error) {
    console.error('❌ Database connection error:', error);
    return { hasErrors: true, error: error.message };
  }
};

// Run all tests
const runAllTests = async () => {
  console.log('🚀 Running all data persistence tests...\n');
  
  const user = await testAuthentication();
  console.log('\n');
  
  const localData = testLocalStorageData();
  console.log('\n');
  
  const dbStatus = await testDatabaseConnection(user);
  console.log('\n');
  
  const loadResult = await testDataLoad(user);
  console.log('\n');
  
  if (localData && user) {
    const saveResult = await testDataSave(user, localData);
    console.log('\n');
  }
  
  console.log('🏁 Tests completed!\n');
  console.log('Summary:', {
    authenticated: !!user,
    hasLocalData: !!localData,
    databaseWorking: dbStatus && !dbStatus.hasErrors,
    profileExists: dbStatus?.profileExists,
    goalsInDB: dbStatus?.goalsCount || 0
  });
};

// Auto-run tests
runAllTests();

// Export functions for manual use
window.dataPersistenceTest = {
  testAuthentication,
  testLocalStorageData,
  testDataSave,
  testDataLoad,
  testDatabaseConnection,
  runAllTests
};

console.log('📋 Test functions available: window.dataPersistenceTest'); 