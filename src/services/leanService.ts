/**
 * Simple Lean Tech Service
 * Does one thing well: connect to banks and fetch real balances
 */

interface LeanAccount {
  account_id: string;
  name: string;
  type: string;
  currency_code: string;
  account_number: string;
  balance?: number;
}

interface LeanCustomer {
  customer_id: string;
  app_user_id: string;
}

interface LeanEntity {
  id: string;
  customer_id: string;
  bank_identifier: string;
}

class SimpleLeanService {
  private baseURL = 'https://sandbox.leantech.me';
  private authURL = 'https://auth.sandbox.leantech.me';
  private tokenCache = new Map<string, { token: string; expiry: number }>();

  // Get OAuth token
  private async getToken(scope: string = 'api'): Promise<string> {
    const cacheKey = scope;
    const cached = this.tokenCache.get(cacheKey);
    
    if (cached && cached.expiry > Date.now()) {
      return cached.token;
    }

    console.log(`🔑 Getting OAuth token for scope: ${scope}`);
    
    const response = await fetch(`${this.authURL}/oauth2/token`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: new URLSearchParams({
        grant_type: 'client_credentials',
        client_id: import.meta.env.VITE_LEAN_CLIENT_ID,
        client_secret: import.meta.env.VITE_LEAN_CLIENT_SECRET,
        scope: scope,
      }),
      });

      if (!response.ok) {
      throw new Error(`OAuth failed: ${response.status}`);
      }

      const data = await response.json();
    const token = data.access_token;
    const expiry = Date.now() + (data.expires_in * 1000) - 60000; // 1 min buffer
    
    this.tokenCache.set(cacheKey, { token, expiry });
    console.log(`✅ OAuth token obtained for scope: ${scope}`);
    
    return token;
  }

  // Get or create customer
  async getCustomer(appUserId: string): Promise<LeanCustomer> {
    console.log(`👤 Getting customer for user: ${appUserId}`);
    
    try {
      // Try to get existing customer
      const token = await this.getToken();
      const response = await fetch(`${this.baseURL}/customers/v1/?app_user_id=${appUserId}`, {
        headers: { 'Authorization': `Bearer ${token}` },
      });

      console.log(`🔍 Customer lookup response status: ${response.status}`);
      
      if (response.ok) {
      const data = await response.json();
        console.log(`📋 Found ${data.data?.length || 0} customers in system`);
        
        // Look for customer in data array by app_user_id
        if (data.data && Array.isArray(data.data)) {
          const customer = data.data.find((c: LeanCustomer) => c.app_user_id === appUserId);
          if (customer) {
            console.log(`✅ Found existing customer: ${customer.customer_id} for user: ${appUserId}`);
            return customer;
          } else {
            console.log(`⚠️ Customer with app_user_id ${appUserId} not found in ${data.data.length} customers`);
          }
        } else {
          console.log(`⚠️ No data array found in response`);
        }
      }

      // Create new customer
      console.log(`🆕 Creating new customer for user: ${appUserId}`);
      const createResponse = await fetch(`${this.baseURL}/customers/v1/`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ app_user_id: appUserId }),
      });

      console.log(`🏗️ Create customer response status: ${createResponse.status}`);

      if (createResponse.status === 409) {
        // Customer already exists, try to fetch again with a different approach
        console.log(`🔄 Customer exists (409), retrying lookup...`);
        
        // Wait a moment and try again
        await new Promise(resolve => setTimeout(resolve, 100));
        
        const retryResponse = await fetch(`${this.baseURL}/customers/v1/?app_user_id=${appUserId}`, {
          headers: { 'Authorization': `Bearer ${token}` },
        });
        
        if (retryResponse.ok) {
          const retryData = await retryResponse.json();
          console.log(`🔄 Retry: Found ${retryData.data?.length || 0} customers in system`);
          
          // Look for customer in retry data array by app_user_id
          if (retryData.data && Array.isArray(retryData.data)) {
            const customer = retryData.data.find((c: LeanCustomer) => c.app_user_id === appUserId);
            if (customer) {
              console.log(`✅ Found existing customer on retry: ${customer.customer_id} for user: ${appUserId}`);
              return customer;
            } else {
              console.log(`⚠️ Retry: Customer with app_user_id ${appUserId} not found in ${retryData.data.length} customers`);
            }
          } else {
            console.log(`⚠️ Retry: No data array found in response`);
          }
        }
        
        // If still not found, customer exists but we can't access it
        throw new Error(`Customer exists but cannot be retrieved. Please check permissions.`);
      }

      if (!createResponse.ok) {
        const errorText = await createResponse.text();
        console.error(`❌ Create customer failed:`, errorText);
        throw new Error(`Create customer failed: ${createResponse.status} - ${errorText}`);
      }

      const newCustomer = await createResponse.json();
      console.log(`✅ Created new customer: ${newCustomer.customer_id}`);
      return newCustomer;
      
    } catch (error) {
      console.error('❌ Customer error:', error);
      throw error;
    }
  }

  // Get customer entities (bank connections)
  async getEntities(customerId: string): Promise<LeanEntity[]> {
    console.log(`🏦 Getting entities for customer: ${customerId}`);
    
    const token = await this.getToken(`customer.${customerId}`);
    const response = await fetch(`${this.baseURL}/customers/v1/${customerId}/entities`, {
      headers: { 'Authorization': `Bearer ${token}` },
    });

    if (!response.ok) {
      console.log(`ℹ️ No entities found (${response.status})`);
      return [];
    }

    const entities = await response.json();
    console.log(`✅ Found ${entities.length} entities`);
    return entities;
  }

  // Get accounts for an entity
  async getAccounts(entityId: string): Promise<LeanAccount[]> {
    console.log(`📊 Getting accounts for entity: ${entityId}`);
    
    const token = await this.getToken();
    const response = await fetch(`${this.baseURL}/data/v1/accounts`, {
      method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
      },
      body: JSON.stringify({ entity_id: entityId })
    });

    if (!response.ok) {
      throw new Error(`Get accounts failed: ${response.status}`);
    }

    const data = await response.json();
    const accounts = data.payload?.accounts || [];
    console.log(`✅ Found ${accounts.length} accounts`);
    return accounts;
  }

  // Get balance for an account
  async getBalance(entityId: string, accountId: string): Promise<number> {
    console.log(`💰 Getting balance for account: ${accountId}`);
    
    const token = await this.getToken();
    const response = await fetch(`${this.baseURL}/data/v1/balance`, {
        method: 'POST',
        headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ 
        entity_id: entityId,
        account_id: accountId 
        })
      });

    if (response.ok) {
      const data = await response.json();
      if (data.payload?.balance) {
        const balance = parseFloat(data.payload.balance);
        console.log(`✅ Balance: ${balance} ${data.payload.currency_code}`);
        return balance;
      }
    }
    
    console.log(`⚠️ Could not get balance for account: ${accountId}`);
    return 0;
  }

  // Get accounts with their balances
  async getAccountsWithBalances(entityId: string): Promise<LeanAccount[]> {
    console.log(`🏦 Getting accounts with balances for entity: ${entityId}`);
    
    const accounts = await this.getAccounts(entityId);
    const accountsWithBalances: LeanAccount[] = [];

    for (const account of accounts) {
      try {
        const balance = await this.getBalance(entityId, account.account_id);
        accountsWithBalances.push({
          ...account,
          balance
        });
      } catch (error) {
        console.warn(`⚠️ Failed to get balance for ${account.account_id}:`, error);
        accountsWithBalances.push({
          ...account,
          balance: 0
        });
      }
    }

    return accountsWithBalances;
  }

  // Delete an entity from Lean Tech system (with proper sequence)
  async deleteEntity(customerId: string, entityId: string): Promise<boolean> {
    console.log(`🗑️ Deleting entity ${entityId} for customer ${customerId}`);
    
    try {
      // Step 1: First try to get all accounts for this entity
      console.log('1️⃣ Getting accounts to check entity state...');
      try {
        const accounts = await this.getAccounts(entityId);
        console.log(`📊 Found ${accounts.length} accounts for entity ${entityId}`);
        
        if (accounts.length > 0) {
          console.log('⚠️ Entity has active accounts - this might be why deletion is failing');
          console.log('💡 Lean Tech may require accounts to be disconnected first');
        }
      } catch (accountError) {
        console.log('ℹ️ Could not retrieve accounts (entity may already be disconnected)');
      }

      // Step 2: Attempt entity deletion
      console.log('2️⃣ Attempting entity deletion from Lean Tech...');
      const token = await this.getToken();
      const response = await fetch(`${this.baseURL}/customers/v1/${customerId}/entities/${entityId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          reason: 'USER_REQUESTED'
        })
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error(`❌ Delete entity failed: ${response.status} - ${response.statusText}`);
        console.error(`❌ Error response body:`, errorText);
        
        // Provide specific guidance for 400 errors
        if (response.status === 400) {
          console.error('💡 400 Error Likely Causes:');
          console.error('   • Entity has active accounts that need to be disconnected first');
          console.error('   • Entity is in a state that doesn\'t allow deletion');
          console.error('   • Invalid entity ID or customer ID');
          console.error('   • Entity may have pending transactions or active sessions');
        }
        
        return false;
      }

      console.log(`✅ Successfully deleted entity ${entityId} from Lean Tech`);
      return true;
      
    } catch (error) {
      console.error('❌ Delete entity error:', error);
      return false;
    }
  }

  // Connect bank (simplified)
  async connectBank(appUserId: string, onSuccess: (result: any) => void, onError: (error: any) => void) {
    console.log(`🔗 Connecting bank for user: ${appUserId}`);
    
    try {
      console.log('1️⃣ Getting customer data...');
      const customer = await this.getCustomer(appUserId);
      console.log('2️⃣ Getting customer-specific token...');
      const customerToken = await this.getToken(`customer.${customer.customer_id}`);
      console.log('✅ Customer token obtained:', customerToken ? 'Yes' : 'No');
      
      // Load LinkSDK
      console.log('3️⃣ Loading Lean SDK...');
      await this.loadLinkSDK();
      
      console.log('4️⃣ Verifying environment configuration...');
      console.log('🔧 Environment check:', {
        lean_client_id_set: !!import.meta.env.VITE_LEAN_CLIENT_ID,
        lean_client_secret_set: !!import.meta.env.VITE_LEAN_CLIENT_SECRET,
        lean_app_token_set: !!import.meta.env.VITE_LEAN_APP_TOKEN,
        lean_app_token_length: import.meta.env.VITE_LEAN_APP_TOKEN?.length || 0,
        service_configured: this.isConfigured()
      });
      
      // Clear any existing callbacks first
      delete window.leanSDKSuccess;
      delete window.leanSDKError;
      
      // Use FIXED callback names that Lean SDK expects reliably
      const successCallbackName = 'leanSDKSuccess';
      const errorCallbackName = 'leanSDKError';
      
      // Add polling mechanism to check for connection success
      let isCallbackTriggered = false;
      const pollInterval = setInterval(async () => {
        if (isCallbackTriggered) {
          clearInterval(pollInterval);
          return;
    }

    try {
          // Check if new entities appeared (indicating successful connection)
          console.log('🔍 Polling for new bank entities...');
          const updatedEntities = await this.getEntities(customer.customer_id);
          
          if (updatedEntities.length > 0) {
            console.log('🎉 SUCCESS: New bank entity detected via polling!');
            console.log(`📊 Found ${updatedEntities.length} entities - connection succeeded!`);
            
            isCallbackTriggered = true;
            clearTimeout(timeoutId);
            clearInterval(pollInterval);
            
            // Clean up callbacks
            delete (window as any)[successCallbackName];
            delete (window as any)[errorCallbackName];
            
            // Trigger success with entity data
            onSuccess({ entities: updatedEntities });
            return;
          }
        } catch (pollError) {
          console.log('📊 Polling check - no new entities yet');
        }
      }, 3000); // Check every 3 seconds
      
      // Set up timeout to prevent hanging
      const timeoutId = setTimeout(() => {
        if (isCallbackTriggered) return;
        
        console.error('⏰ Lean SDK connection timed out after 60 seconds');
        isCallbackTriggered = true;
        clearInterval(pollInterval);
        
        // Clean up callbacks
        delete (window as any)[successCallbackName];
        delete (window as any)[errorCallbackName];
        
        // Check one more time for entities before giving up
        this.getEntities(customer.customer_id).then(finalEntities => {
          if (finalEntities.length > 0) {
            console.log('🎉 LATE SUCCESS: Found entities on final check!');
            onSuccess({ entities: finalEntities });
          } else {
            onError(new Error('Connection timed out. If the bank connection screen appeared, please try "Connect Bank" again to see your accounts.'));
          }
        }).catch(() => {
          onError(new Error('Connection timed out. If the bank connection screen appeared, please try "Connect Bank" again to see your accounts.'));
        });
      }, 60000); // Increased to 60 seconds
      
      // Set up global callbacks with proper error handling
      (window as any)[successCallbackName] = (result: any) => {
        console.log('🎉 Lean SDK Success callback triggered:', result);
        if (isCallbackTriggered) return;
        
        isCallbackTriggered = true;
        clearTimeout(timeoutId);
        clearInterval(pollInterval);
        
        // Clean up callbacks
        delete (window as any)[successCallbackName];
        delete (window as any)[errorCallbackName];
        onSuccess(result);
      };
      
      (window as any)[errorCallbackName] = (error: any) => {
        console.error('❌ Lean SDK Error callback triggered:', error);
        if (isCallbackTriggered) return;
        
        isCallbackTriggered = true;
        clearTimeout(timeoutId);
        clearInterval(pollInterval);
        
        // Clean up callbacks
        delete (window as any)[successCallbackName];
        delete (window as any)[errorCallbackName];
        onError(error);
      };
      
      console.log('🔗 Initiating Lean SDK connection...');
      console.log('📋 Connection config:', {
        customer_id: customer.customer_id,
        has_access_token: !!customerToken,
        access_token_preview: customerToken ? `${customerToken.substring(0, 20)}...` : 'none',
        success_callback: successCallbackName,
        error_callback: errorCallbackName,
        app_token_configured: !!import.meta.env.VITE_LEAN_APP_TOKEN,
        lean_sdk_available: !!window.Lean
      });
      
      // Verify Lean SDK is properly loaded
      if (!window.Lean) {
        throw new Error('Lean SDK not loaded properly');
      }
      
      // Verify connect method exists
      if (typeof window.Lean.connect !== 'function') {
        throw new Error('Lean SDK connect method not available');
      }
      
      const connectionConfig = {
        app_token: import.meta.env.VITE_LEAN_APP_TOKEN,
        customer_id: customer.customer_id,
        permissions: ['identity', 'accounts', 'balance', 'transactions'],
        sandbox: true,
        access_token: customerToken,
        success: successCallbackName,
        error: errorCallbackName,
      };
      
      console.log('🚀 Calling window.Lean.connect() with config...');
      console.log('📋 Final config check:', {
        config_valid: !!connectionConfig,
        app_token_length: connectionConfig.app_token?.length || 0,
        app_token_preview: connectionConfig.app_token ? `${connectionConfig.app_token.substring(0, 10)}...` : 'None',
        customer_id_format: connectionConfig.customer_id?.includes('-') ? 'UUID' : 'Other',
        access_token_length: connectionConfig.access_token?.length || 0,
        callbacks_set: !!(connectionConfig.success && connectionConfig.error),
        success_callback_name: connectionConfig.success,
        error_callback_name: connectionConfig.error,
        sandbox_mode: connectionConfig.sandbox,
        permissions: connectionConfig.permissions
      });
      
      // Check if callbacks are actually set on window
      console.log('🔍 Callback verification:', {
        success_callback_exists: typeof (window as any)[connectionConfig.success] === 'function',
        error_callback_exists: typeof (window as any)[connectionConfig.error] === 'function'
      });
      
      try {
        // Connect with unique callback names
        console.log('🚀 About to call window.Lean.connect()...');
        console.log('🎯 Current DOM status before connection:');
        console.log('   • Modal elements with z-[60]:', document.querySelectorAll('[class*="z-[60]"]').length);
        console.log('   • Fixed positioned elements:', document.querySelectorAll('[style*="position: fixed"]').length);
        console.log('   • Body children count:', document.body.children.length);
        
        window.Lean.connect(connectionConfig);
        console.log('✅ Lean SDK connection initiated successfully');
        console.log('⏳ Waiting for Lean SDK to create iframe...');
        
        // Instead of waiting for callbacks, replicate the working "second attempt" logic
        // Wait a reasonable time for user to complete connection, then check for entities
        setTimeout(async () => {
          try {
            console.log('🔍 Checking for entities after connection attempt (replicating working flow)...');
            const entities = await this.getEntities(customer.customer_id);
            
            if (entities.length > 0) {
              console.log('🎉 SUCCESS: Found entities after connection - replicating working second-attempt logic!');
              console.log(`📊 Found ${entities.length} entities`);
              
              if (!isCallbackTriggered) {
                isCallbackTriggered = true;
                clearTimeout(timeoutId);
                clearInterval(pollInterval);
                
                // Clean up callbacks
                delete (window as any)[successCallbackName];
                delete (window as any)[errorCallbackName];
                
                // Use the same success pattern as the working second attempt
                onSuccess({ entities });
              }
            } else {
              console.log('📊 No entities found yet, continuing to wait...');
            }
    } catch (error) {
            console.log('📊 Entity check failed, continuing to wait...', error);
          }
        }, 15000); // Check after 15 seconds - gives user time to complete connection
        
        // Add a test to see if popup opened
                 setTimeout(() => {
           console.log('🔍 Checking for Lean SDK popup after 2 seconds...');
           // Look for Lean SDK elements in DOM
           const leanElements = document.querySelectorAll('[class*="lean"], [id*="lean"], iframe[src*="lean"]');
           console.log(`📱 Found ${leanElements.length} potential Lean SDK elements in DOM`);
           
           if (leanElements.length === 0) {
             console.warn('⚠️ No Lean SDK UI elements found - popup may not have opened');
             console.warn('💡 This could indicate:');
             console.warn('   • Popup blocker is active');
             console.warn('   • Invalid app token');
             console.warn('   • Sandbox environment issue');
             console.warn('   • Browser security restrictions');
           } else {
             console.log('✅ Lean SDK UI elements detected');
             leanElements.forEach((el, i) => {
               console.log(`   ${i + 1}. ${el.tagName} with classes: ${el.className}`);
               
               // Check iframe visibility and positioning
               if (el.tagName === 'IFRAME') {
                 const iframe = el as HTMLIFrameElement;
                 const rect = iframe.getBoundingClientRect();
                 const computedStyle = window.getComputedStyle(iframe);
                 
                 const iframeDetails = {
                   src: iframe.src,
                   visible: computedStyle.visibility !== 'hidden' && computedStyle.display !== 'none',
                   opacity: computedStyle.opacity,
                   zIndex: computedStyle.zIndex,
                   position: computedStyle.position,
                   dimensions: `${rect.width}x${rect.height}`,
                   coordinates: `(${rect.left}, ${rect.top})`,
                   inViewport: rect.top >= 0 && rect.left >= 0 && 
                              rect.bottom <= window.innerHeight && 
                              rect.right <= window.innerWidth
                 };
                 console.log(`🔍 IFRAME ${i + 1} details:`, iframeDetails);
                 
                 // Log each property individually for easier debugging
                 console.log(`📐 IFRAME src: ${iframeDetails.src}`);
                 console.log(`👁️ IFRAME visible: ${iframeDetails.visible}`);
                 console.log(`🔢 IFRAME opacity: ${iframeDetails.opacity}`);
                 console.log(`🏗️ IFRAME z-index: ${iframeDetails.zIndex}`);
                 console.log(`📍 IFRAME position: ${iframeDetails.position}`);
                 console.log(`📏 IFRAME dimensions: ${iframeDetails.dimensions}`);
                 console.log(`📌 IFRAME coordinates: ${iframeDetails.coordinates}`);
                 console.log(`🖼️ IFRAME in viewport: ${iframeDetails.inViewport}`);
                 
                 // Try to make iframe more visible if it's hidden
                 console.log('🔧 Applying visibility fixes to iframe...');
                 
                 // CRITICAL: Use an extremely high z-index to ensure iframe is above ALL modal layers
                 // Our app modals use z-[60], so we need to be much higher
                 console.log('🔧 Setting MAXIMUM z-index for iframe visibility...');
                 iframe.style.zIndex = '2147483647'; // Maximum possible z-index value
                 
                 // Force iframe outside any modal containers by appending to body if needed
                 if (iframe.parentElement !== document.body) {
                   console.log('🔧 Moving iframe to document body to escape modal containers...');
                   document.body.appendChild(iframe);
                 }
                 
                 // Force fixed positioning relative to viewport, not any parent containers
                 iframe.style.position = 'fixed';
                 iframe.style.top = '0';
                 iframe.style.left = '0';
                 iframe.style.width = '100vw';
                 iframe.style.height = '100vh';
                 
                 // Override any potential CSS that might hide the iframe
                 iframe.style.visibility = 'visible !important';
                 iframe.style.display = 'block !important';
                 iframe.style.opacity = '1 !important';
                 iframe.style.pointerEvents = 'auto !important';
                 iframe.style.transform = 'none !important';
                 iframe.style.clip = 'auto !important';
                 iframe.style.clipPath = 'none !important';
                 
                 // Ensure no parent styles can affect this
                 iframe.style.margin = '0 !important';
                 iframe.style.padding = '0 !important';
                 
                 // Add visible styling for debugging
                 iframe.style.border = '5px solid #ff0000 !important';
                 iframe.style.backgroundColor = 'rgba(255, 255, 255, 0.95) !important';
                 iframe.style.boxShadow = '0 0 50px rgba(255, 0, 0, 0.5) !important';
                 
                 // Log parent container info to debug modal interference
                 let parent = iframe.parentElement;
                 const parentChain = [];
                 while (parent && parent !== document.body) {
                   const parentStyle = window.getComputedStyle(parent);
                   parentChain.push({
                     tagName: parent.tagName,
                     className: parent.className,
                     zIndex: parentStyle.zIndex,
                     position: parentStyle.position,
                     overflow: parentStyle.overflow
                   });
                   parent = parent.parentElement;
                 }
                 console.log('🏗️ Iframe parent chain:', parentChain);
                 
                 console.log('🎯 Applied MAXIMUM visibility fixes - iframe should now be FULLY visible above all modals!');
                 console.log('📱 Iframe should cover entire screen with red border and slight transparency');
                 
                 // Add click handler to help with debugging
                 iframe.addEventListener('click', (e) => {
                   console.log('🖱️ User clicked on Lean SDK iframe', e);
                 }, { passive: true });
               }
             });
           }
         }, 2000);
        
        // Test callbacks manually after 5 seconds
        setTimeout(() => {
          console.log('🧪 Testing callback accessibility...');
          const successCb = (window as any)[connectionConfig.success];
          const errorCb = (window as any)[connectionConfig.error];
          
          if (typeof successCb === 'function') {
            console.log('✅ Success callback is accessible');
          } else {
            console.error('❌ Success callback not found on window object');
          }
          
          if (typeof errorCb === 'function') {
            console.log('✅ Error callback is accessible');
          } else {
            console.error('❌ Error callback not found on window object');
          }
        }, 5000);
        
      } catch (connectError) {
        console.error('❌ Error calling window.Lean.connect():', connectError);
        throw new Error(`Failed to initiate Lean SDK connection: ${connectError}`);
      }
      
    } catch (error) {
      console.error('❌ Connect bank error:', error);
      onError(error);
    }
  }

  // Force iframe visibility with maximum overrides
  private forceIframeVisibility(iframe: HTMLIFrameElement, index: number = 0): void {
    console.log(`🔧 Emergency iframe fix #${index + 1} - applying maximum visibility overrides...`);
    
    // CRITICAL: Use maximum z-index
    iframe.style.zIndex = '2147483647';
    
    // Force iframe outside any modal containers by appending to body if needed
    if (iframe.parentElement !== document.body) {
      console.log('🔧 Moving iframe to document body to escape modal containers...');
      document.body.appendChild(iframe);
    }
    
    // Force full screen positioning
    iframe.style.position = 'fixed';
    iframe.style.top = '0';
    iframe.style.left = '0';
    iframe.style.width = '100vw';
    iframe.style.height = '100vh';
    
    // Override everything with !important
    iframe.style.visibility = 'visible !important';
    iframe.style.display = 'block !important';
    iframe.style.opacity = '1 !important';
    iframe.style.pointerEvents = 'auto !important';
    iframe.style.transform = 'none !important';
    iframe.style.clip = 'auto !important';
    iframe.style.clipPath = 'none !important';
    iframe.style.margin = '0 !important';
    iframe.style.padding = '0 !important';
    
    // Make it extremely visible for debugging
    iframe.style.border = '10px solid #ff0000 !important';
    iframe.style.backgroundColor = 'rgba(255, 255, 255, 0.95) !important';
    iframe.style.boxShadow = '0 0 100px rgba(255, 0, 0, 0.8) !important';
    
    console.log('💥 Emergency iframe visibility applied - should be impossible to miss!');
  }

  // Load LinkSDK
  private loadLinkSDK(): Promise<void> {
    return new Promise((resolve, reject) => {
      if (window.Lean) {
        console.log('✅ Lean SDK already loaded');
        resolve();
        return;
      }

      console.log('📥 Loading Lean SDK from CDN...');
      const script = document.createElement('script');
      script.src = 'https://cdn.leantech.me/link/loader/prod/ae/latest/lean-link-loader.min.js';
      
      script.onload = () => {
        console.log('✅ Lean SDK script loaded successfully');
        
        // Give the SDK a moment to initialize
        setTimeout(() => {
          if (window.Lean) {
            console.log('✅ Lean SDK object available after initialization');
            console.log('🔧 Lean SDK methods:', Object.keys(window.Lean || {}));
          } else {
            console.error('❌ Lean SDK script loaded but window.Lean not available');
            reject(new Error('Lean SDK script loaded but not properly initialized'));
            return;
          }
          resolve();
        }, 100); // Give 100ms for initialization
      };
      
      script.onerror = (error) => {
        console.error('❌ Failed to load Lean SDK script:', error);
        reject(new Error('Failed to load LinkSDK'));
      };
      
      console.log('📡 Appending Lean SDK script to document head...');
      document.head.appendChild(script);
    });
  }

  // Configuration check
  isConfigured(): boolean {
    return !!(
      import.meta.env.VITE_LEAN_CLIENT_ID &&
      import.meta.env.VITE_LEAN_CLIENT_SECRET &&
      import.meta.env.VITE_LEAN_APP_TOKEN
    );
  }
}

// Global types for LinkSDK
declare global {
  interface Window {
    Lean: {
      connect: (config: any) => void;
    };
    leanSDKSuccess?: (result: any) => void;
    leanSDKError?: (error: any) => void;
  }
}

export const leanService = new SimpleLeanService();
export default leanService; 