// Debug script to test signout functionality
// Run this in the browser console when on the dashboard page

console.log('🔍 Starting signout debug test...');

// Check if Supabase is properly configured
const checkSupabaseConfig = () => {
  console.log('📊 Checking Supabase configuration...');
  
  // Check environment variables
  const supabaseUrl = import.meta.env?.VITE_SUPABASE_URL;
  const supabaseKey = import.meta.env?.VITE_SUPABASE_ANON_KEY;
  
  console.log('🔗 Supabase URL:', supabaseUrl ? '✅ Set' : '❌ Missing');
  console.log('🔑 Supabase Key:', supabaseKey ? '✅ Set' : '❌ Missing');
  
  if (!supabaseUrl || !supabaseKey) {
    console.error('❌ Missing Supabase environment variables!');
    return false;
  }
  
  return true;
};

// Test the auth context
const testAuthContext = () => {
  console.log('🔐 Testing auth context...');
  
  // Try to access the auth context from window (if available)
  const authContext = window.__AUTH_CONTEXT__;
  if (authContext) {
    console.log('✅ Auth context found');
    console.log('👤 Current user:', authContext.user ? 'Logged in' : 'Not logged in');
  } else {
    console.log('⚠️ Auth context not accessible from window');
  }
};

// Test signout manually
const testManualSignout = async () => {
  console.log('🚪 Testing manual signout...');
  
  try {
    // Try to import supabase directly
    const { supabase } = await import('/src/lib/supabase.ts');
    
    console.log('📦 Supabase client imported successfully');
    
    // Test signout
    const result = await supabase.auth.signOut();
    
    if (result.error) {
      console.error('❌ Signout failed:', result.error);
    } else {
      console.log('✅ Signout successful');
    }
    
    return result;
  } catch (error) {
    console.error('❌ Error testing signout:', error);
    return { error };
  }
};

// Run all tests
const runDebugTests = async () => {
  console.log('🧪 Running all debug tests...');
  
  checkSupabaseConfig();
  testAuthContext();
  await testManualSignout();
  
  console.log('🏁 Debug tests completed');
};

// Auto-run tests
runDebugTests();

// Export functions for manual testing
window.debugSignout = {
  checkSupabaseConfig,
  testAuthContext,
  testManualSignout,
  runDebugTests
};

console.log('📋 Debug functions available: window.debugSignout'); 