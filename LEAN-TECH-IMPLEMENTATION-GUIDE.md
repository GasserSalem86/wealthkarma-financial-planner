# 🏦 **Lean Tech Integration Guide**
*Complete Implementation Reference for GCC Bank Connectivity*

## 📋 **Overview**

**Lean Tech** provides API access to GCC bank account data and payment initiation. This guide summarizes the key implementation details for integrating Lean into WealthKarma.

**Current Status:** Sandbox Implementation ✅  
**Target:** Production-Ready Code 🎯

---

## 🔐 **Authentication System**

### **OAuth 2.0 Flow**
Lean uses standard OAuth 2.0 with client credentials grant type.

#### **Required Credentials:**
- `LEAN_APPLICATION_ID` - Application identifier (UUID)
- `LEAN_CLIENT_SECRET` - Client secret (generate once, store securely)
- `LEAN_APP_TOKEN` - Application token for SDK calls

#### **Environment Endpoints:**
- **Sandbox**: `https://auth.sandbox.leantech.me`
- **Production**: `https://auth.leantech.me`

#### **API Base URLs:**
- **Sandbox**: `https://sandbox.leantech.me`
- **Production**: `https://api.leantech.me` (v1) or `https://api2.leantech.me` (OAuth)

### **Token Generation Implementation:**

```typescript
// Backend API Access Token
const getAPIAccessToken = async (): Promise<string> => {
  const response = await fetch(`${authUrl}/oauth2/token`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      'client_id': LEAN_APPLICATION_ID,
      'client_secret': LEAN_CLIENT_SECRET,
      'grant_type': 'client_credentials',
      'scope': 'api'
    })
  });
  
  const data = await response.json();
  return data.access_token; // JWT token, expires in 3599 seconds
};

// Customer SDK Access Token
const getCustomerToken = async (customerId: string): Promise<string> => {
  const response = await fetch(`${authUrl}/oauth2/token`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      'client_id': LEAN_APPLICATION_ID,
      'client_secret': LEAN_CLIENT_SECRET,
      'grant_type': 'client_credentials',
      'scope': `customer.${customerId}`
    })
  });
  
  const data = await response.json();
  return data.access_token;
};
```

---

## 👥 **Customer Management**

### **Creating a Customer**
Every user must have a Lean Customer resource before connecting banks.

```typescript
interface CreateCustomerRequest {
  app_user_id: string; // Your internal user identifier
}

interface CreateCustomerResponse {
  customer_id: string; // UUID - save this!
  app_user_id: string;
}

const createCustomer = async (appUserId: string): Promise<string> => {
  const token = await getAPIAccessToken();
  
  const response = await fetch(`${baseUrl}/customers/v1/`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`, // For OAuth
      // OR 'lean-app-token': LEAN_APP_TOKEN // For legacy
    },
    body: JSON.stringify({ app_user_id: appUserId })
  });
  
  const data = await response.json();
  return data.customer_id;
};
```

### **Key Implementation Notes:**
- `app_user_id` has unique constraint
- Can be different from your database user ID (e.g., `prod_usr_1246`)
- **Always save both `customer_id` and `app_user_id`** in your database
- One customer can have multiple connected bank entities

---

## 🏛️ **Bank Connection Flow**

### **Connection Process:**
1. Create customer (if not exists)
2. Generate customer-scoped access token
3. Initialize LinkSDK with token
4. User authenticates with their bank
5. Receive webhook with connection status
6. Store entity_id for future API calls

### **LinkSDK Integration:**

```typescript
// Frontend - Initialize Bank Connection
const initiateBankConnection = async (customerId: string, bankIdentifier: string) => {
  // Get customer token from your backend
  const customerToken = await getCustomerTokenFromBackend(customerId);
  
  // Initialize Lean LinkSDK
  Lean.Connect({
    app_token: LEAN_APP_TOKEN,
    access_token: customerToken,
    customer_id: customerId,
    permissions: ["accounts", "payments"],
    bank_identifier: bankIdentifier, // e.g., "ENBD_UAE"
    environment: "sandbox" // Change to "production" for live
  });
};
```

### **Webhook Response:**
```typescript
interface BankConnectionWebhook {
  entity_id: string; // Save this - needed for all future API calls
  bank_identifier: string;
  status: "CONNECTED" | "FAILED" | "PENDING";
  customer_id: string;
  accounts: Array<{
    account_id: string;
    account_type: string;
    balance: number;
    currency: string;
  }>;
}
```

---

## 📊 **Data Fetching**

### **Account Data Retrieval:**

```typescript
// Get account balances
const getAccountData = async (entityId: string): Promise<AccountData> => {
  const token = await getAPIAccessToken();
  
  const response = await fetch(`${baseUrl}/data/v2/accounts/${entityId}`, {
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    }
  });
  
  return response.json();
};

// Get transaction history
const getTransactions = async (entityId: string, accountId: string): Promise<Transaction[]> => {
  const token = await getAPIAccessToken();
  
  const response = await fetch(`${baseUrl}/data/v2/accounts/${entityId}/${accountId}/transactions`, {
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    }
  });
  
  return response.json();
};
```

---

## ⚡ **Asynchronous Handling**

### **Webhook Setup:**
Most Lean API calls are asynchronous. Set up webhook endpoint to receive responses.

```typescript
// Webhook endpoint handler
app.post('/webhooks/lean', (req, res) => {
  const { type, data } = req.body;
  
  switch (type) {
    case 'ACCOUNTS_DATA_READY':
      handleAccountsDataReady(data);
      break;
    case 'TRANSACTIONS_DATA_READY':
      handleTransactionsDataReady(data);
      break;
    case 'CONNECTION_STATUS_UPDATED':
      handleConnectionStatusUpdate(data);
      break;
  }
  
  // CRITICAL: Always respond with 200
  res.status(200).send('OK');
});
```

### **Webhook Security:**
- Verify webhook signatures using Lean's certificate chain
- Use HTTPS for webhook URLs
- Implement idempotency for webhook processing

---

## 🔄 **Reconnection Handling**

### **OTP Reconnects:**
Banks may require OTP verification for reconnections.

```typescript
interface ReconnectRequest {
  entity_id: string;
  otp?: string; // If OTP required
}

const handleReconnect = async (entityId: string, otp?: string): Promise<void> => {
  const token = await getAPIAccessToken();
  
  const response = await fetch(`${baseUrl}/entities/v1/${entityId}/reconnect`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ otp })
  });
  
  // Check response for OTP requirement or success
  const result = await response.json();
  if (result.status === 'OTP_REQUIRED') {
    // Prompt user for OTP and retry
  }
};
```

---

## 🧪 **Sandbox vs Production**

### **Environment Configuration:**

```typescript
const config = {
  sandbox: {
    authUrl: 'https://auth.sandbox.leantech.me',
    baseUrl: 'https://sandbox.leantech.me',
    oauth2BaseUrl: 'https://api2.sandbox.leantech.me', // If using OAuth
    environment: 'sandbox'
  },
  production: {
    authUrl: 'https://auth.leantech.me',
    baseUrl: 'https://api.leantech.me',
    oauth2BaseUrl: 'https://api2.leantech.me',
    environment: 'production'
  }
};

const currentConfig = process.env.NODE_ENV === 'production' 
  ? config.production 
  : config.sandbox;
```

### **Sandbox Testing:**
- Use mock data, no real bank connections
- Test all flows without sensitive data
- Use test bank identifiers provided by Lean

### **Production Readiness:**
- Set up mTLS certificates for production
- Configure real webhook URLs with SSL
- Update environment variables
- Test with real bank credentials in staging

---

## 🔧 **Integration with Current WealthKarma Code**

### **Updates Needed in `leanService.ts`:**

```typescript
// Update existing service to use proper OAuth
class LeanService {
  private config: LeanConfig;
  private accessToken: string | null = null;
  private tokenExpiry: Date | null = null;

  // Add proper OAuth token management
  private async getAccessToken(): Promise<string | null> {
    if (this.accessToken && this.tokenExpiry && this.tokenExpiry > new Date()) {
      return this.accessToken;
    }

    // Implement token refresh logic from guide above
    return this.refreshAccessToken();
  }

  // Update bank connection to use customer tokens
  async initiateBankConnection(institutionId: string, userId: string): Promise<LeanConnectionResponse> {
    // 1. Create/get customer
    const customerId = await this.getOrCreateCustomer(userId);
    
    // 2. Generate customer token
    const customerToken = await this.getCustomerToken(customerId);
    
    // 3. Return connection info for LinkSDK
    return {
      connectionId: customerId,
      authUrl: null, // Let frontend handle LinkSDK
      customerToken,
      status: 'pending'
    };
  }
}
```

### **Database Schema Updates:**
```sql
-- Add Lean-specific columns to connected_accounts table
ALTER TABLE connected_accounts ADD COLUMN lean_customer_id VARCHAR;
ALTER TABLE connected_accounts ADD COLUMN lean_entity_id VARCHAR;
ALTER TABLE connected_accounts ADD COLUMN connection_token TEXT;
ALTER TABLE connected_accounts ADD COLUMN last_sync_status VARCHAR DEFAULT 'pending';
```

---

## ⚠️ **Security Best Practices**

### **Client Secret Management:**
- Store in secure vault/key management system
- Never expose in frontend code
- Generate tokens only on backend
- Rotate secrets regularly
- Revoke immediately if compromised

### **Token Handling:**
- Cache API tokens for efficiency (3599s expiry)
- Generate customer tokens per session
- Use HTTPS for all communications
- Implement proper error handling

### **Data Protection:**
- Never log sensitive bank data
- Encrypt stored account information
- Implement proper audit trails
- Follow PCI DSS guidelines

---

## 🚀 **Implementation Checklist**

### **Phase 1: Sandbox Setup** ✅
- [x] Lean developer account created
- [x] Application configured with webhook URL
- [x] Client credentials obtained
- [x] Basic service implementation

### **Phase 2: Production Readiness** ⏳
- [ ] Update `leanService.ts` with proper OAuth
- [ ] Implement customer management
- [ ] Add webhook handling to backend
- [ ] Set up proper error handling and reconnection
- [ ] Add database schema for Lean data

### **Phase 3: Production Deployment** ⏳
- [ ] Generate production certificates
- [ ] Configure production webhook endpoints
- [ ] Update environment variables
- [ ] Test with real bank accounts
- [ ] Monitor and optimize performance

---

## 📞 **Support & Resources**

- **Developer Portal**: [https://dev.leantech.me](https://dev.leantech.me)
- **Documentation**: [https://docs.leantech.me](https://docs.leantech.me)
- **System Status**: Available in developer portal
- **Webhook Testing**: Use RequestCatcher for development

---

**Last Updated:** Current Date  
**Environment:** Sandbox (Production Ready)  
**Integration Status:** Phase 1 Complete, Phase 2 Pending  
**Next Step:** Update OAuth implementation in leanService.ts 