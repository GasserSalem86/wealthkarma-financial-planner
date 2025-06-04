// Simple Supabase connection test
// Run this with: node test_supabase_connection.js

console.log('🔧 Supabase Connection Test');
console.log('============================');

// Check if this is running in Node.js (won't work since we need browser environment)
if (typeof window === 'undefined') {
  console.log('❌ This test needs to run in the browser environment');
  console.log('📋 Manual check required:');
  console.log('   1. Open browser DevTools');
  console.log('   2. Go to Application/Storage → Local Storage');
  console.log('   3. Check if VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY are set');
  console.log('   4. Expected URL: https://ysitlmkefkzkqwmopgoe.supabase.co');
  console.log('   5. Expected key should start with: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...');
  process.exit(1);
}

// This will work in browser console
console.log('🌐 Browser Environment Check:');
console.log('VITE_SUPABASE_URL:', import.meta?.env?.VITE_SUPABASE_URL || 'NOT FOUND');
console.log('VITE_SUPABASE_ANON_KEY present:', !!(import.meta?.env?.VITE_SUPABASE_ANON_KEY));

// Expected values
const expectedUrl = 'https://ysitlmkefkzkqwmopgoe.supabase.co';
const expectedKeyStart = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9';

console.log('\n✅ Expected Configuration:');
console.log('URL should be:', expectedUrl);
console.log('Key should start with:', expectedKeyStart + '...');

console.log('\n📋 If environment variables are missing:');
console.log('1. Create .env file in project root');
console.log('2. Add: VITE_SUPABASE_URL=' + expectedUrl);
console.log('3. Add: VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...[full key]');
console.log('4. Restart development server'); 