import { createClient } from 'jsr:@supabase/supabase-js@2';
import "jsr:@supabase/functions-js/edge-runtime.d.ts";
Deno.serve(async (req)=>{
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, {
      status: 200,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'POST, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Lean-Signature'
      }
    });
  }
  if (req.method !== 'POST') {
    return new Response(JSON.stringify({
      error: 'Method not allowed'
    }), {
      status: 405,
      headers: {
        'Content-Type': 'application/json'
      }
    });
  }
  try {
    console.log('🔗 Webhook received from Lean Tech');
    // Initialize Supabase client with service role key (bypasses RLS)
    const supabaseUrl = Deno.env.get('SUPABASE_URL');
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
    if (!supabaseUrl || !supabaseKey) {
      console.error('❌ Missing Supabase credentials');
      return new Response(JSON.stringify({
        error: 'Server configuration error'
      }), {
        status: 500,
        headers: {
          'Content-Type': 'application/json'
        }
      });
    }
    const supabaseClient = createClient(supabaseUrl, supabaseKey);
    // Parse webhook payload
    const payload = await req.json();
    console.log('📦 Webhook payload:', payload);
    // Verify webhook signature (optional but recommended)
    const signature = req.headers.get('X-Lean-Signature');
    if (!signature) {
      console.warn('⚠️ No signature provided for webhook');
    }
    // Process different webhook types
    switch(payload.type){
      case 'CONNECTION_SUCCESS':
        await handleConnectionSuccess(supabaseClient, payload);
        break;
      case 'CONNECTION_UPDATE':
        await handleConnectionUpdate(supabaseClient, payload);
        break;
      case 'ACCOUNT_BALANCE_UPDATE':
        await handleBalanceUpdate(supabaseClient, payload);
        break;
      case 'CONNECTION_ERROR':
        await handleConnectionError(supabaseClient, payload);
        break;
      default:
        console.log('❓ Unhandled webhook type:', payload.type);
    }
    return new Response(JSON.stringify({
      success: true,
      message: `Processed ${payload.type} webhook`
    }), {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*'
      }
    });
  } catch (error) {
    console.error('❌ Webhook processing error:', error);
    return new Response(JSON.stringify({
      error: 'Internal server error',
      details: error.message
    }), {
      status: 500,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*'
      }
    });
  }
});
// Handle successful connection
async function handleConnectionSuccess(supabase, payload) {
  console.log('✅ Processing CONNECTION_SUCCESS webhook');
  const { connection_id, account } = payload.data;
  if (!connection_id || !account) {
    console.error('❌ Invalid connection success payload');
    return;
  }
  try {
    // Find account by lean_entity_id (connection_id)
    const { data: existingAccount } = await supabase.from('connected_accounts').select('*').eq('lean_entity_id', connection_id).single();
    if (existingAccount) {
      console.log('📝 Updating existing account with connection success');
      await supabase.from('connected_accounts').update({
        connection_status: 'active',
        last_balance_update: new Date().toISOString(),
        updated_at: new Date().toISOString()
      }).eq('lean_entity_id', connection_id);
      console.log('✅ Connection success processed');
    } else {
      console.warn('⚠️ No matching account found for connection_id:', connection_id);
    }
  } catch (error) {
    console.error('❌ Error in handleConnectionSuccess:', error);
  }
}
// Handle connection updates
async function handleConnectionUpdate(supabase, payload) {
  console.log('🔄 Processing CONNECTION_UPDATE webhook');
  const { connection_id, status } = payload.data;
  if (!connection_id) {
    console.error('❌ Invalid connection update payload');
    return;
  }
  try {
    await supabase.from('connected_accounts').update({
      connection_status: status === 'active' ? 'active' : 'inactive',
      last_sync_attempt: new Date().toISOString(),
      updated_at: new Date().toISOString()
    }).eq('lean_entity_id', connection_id);
    console.log('✅ Connection update processed');
  } catch (error) {
    console.error('❌ Error in handleConnectionUpdate:', error);
  }
}
// Handle balance updates - THIS IS THE KEY FUNCTION
async function handleBalanceUpdate(supabase, payload) {
  console.log('💰 Processing ACCOUNT_BALANCE_UPDATE webhook');
  const { connection_id, account } = payload.data;
  if (!connection_id || !account || !account.account_id) {
    console.error('❌ Invalid balance update payload:', payload.data);
    return;
  }
  try {
    console.log(`🔍 Looking for account: ${account.account_id}`);
    // Find account by lean_account_id
    const { data: existingAccount, error: findError } = await supabase.from('connected_accounts').select('*').eq('lean_account_id', account.account_id).single();
    if (findError) {
      console.error('❌ Error finding account:', findError);
      return;
    }
    if (existingAccount) {
      console.log(`💾 Updating balance: ${existingAccount.balance} → ${account.balance}`);
      // Update the balance
      const { error: updateError } = await supabase.from('connected_accounts').update({
        balance: account.balance,
        currency: account.currency || existingAccount.currency,
        last_balance_update: new Date().toISOString(),
        updated_at: new Date().toISOString()
      }).eq('lean_account_id', account.account_id);
      if (updateError) {
        console.error('❌ Error updating balance:', updateError);
        return;
      }
      console.log('✅ Balance updated successfully!');
      // Create balance history record
      await supabase.from('balance_history').insert({
        account_id: existingAccount.id,
        previous_balance: existingAccount.balance,
        new_balance: account.balance,
        change_type: 'sync',
        source: 'lean_webhook',
        notes: 'Balance updated via Lean Tech webhook'
      });
      console.log('📊 Balance history recorded');
    } else {
      console.warn('⚠️ No matching account found for account_id:', account.account_id);
    }
  } catch (error) {
    console.error('❌ Error in handleBalanceUpdate:', error);
  }
}
// Handle connection errors
async function handleConnectionError(supabase, payload) {
  console.log('❌ Processing CONNECTION_ERROR webhook');
  const { connection_id, error_code, error_message } = payload.data;
  if (!connection_id) {
    console.error('❌ Invalid connection error payload');
    return;
  }
  try {
    await supabase.from('connected_accounts').update({
      connection_status: 'error',
      last_sync_attempt: new Date().toISOString(),
      updated_at: new Date().toISOString()
    }).eq('lean_entity_id', connection_id);
    // Log the error in bank_sync_events
    await supabase.from('bank_sync_events').insert({
      sync_type: 'webhook',
      sync_status: 'failed',
      error_code: error_code,
      error_message: error_message,
      started_at: new Date().toISOString(),
      completed_at: new Date().toISOString()
    });
    console.log('✅ Connection error processed');
  } catch (error) {
    console.error('❌ Error in handleConnectionError:', error);
  }
}
