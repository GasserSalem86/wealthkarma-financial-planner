# AI Financial Advisor Setup

## Overview
The Financial Goals Planner now includes an AI-powered financial advisor that provides personalized guidance for GCC expats. The AI assistant helps users through each step of the planning process and can answer questions about their financial plan.

## ⚡ **Cost-Optimized AI Models (January 2025)**

### **Current Model Configuration:**
- **Primary Model**: `gpt-4o-mini` ($0.15 input / $0.60 output per 1M tokens)
- **Web Search**: `gpt-4o-mini-search-preview` ($0.15 input / $0.60 output per 1M tokens)
- **Search Tool Calls**: $27.50 per 1k calls (medium context)

### **Cost Savings Achieved:**
- **90-95% cost reduction** vs previous gpt-4 usage
- **From**: ~$0.20-0.26 per interaction **To**: ~$0.001-0.003 per interaction
- **Monthly costs**: Reduced from $500-1000+ to $20-50 with heavy usage

### **Performance Benefits:**
✅ **Better or equal quality** compared to older gpt-4 models
✅ **Faster response times** with mini models
✅ **Latest capabilities** with 4o-mini architecture
✅ **Same functionality** for all use cases

## Features
- **Step-by-step guidance**: AI provides contextual advice based on the current planning step
- **GCC expat expertise**: Specialized knowledge of expat financial planning challenges and opportunities
- **Interactive chat**: Ask questions and get immediate, personalized responses
- **Context-aware**: AI knows your nationality, location, income, and goals
- **Live web search**: Current bank rates, education costs, travel prices, property values

## Setup Instructions

### 1. Get OpenAI API Key
1. Visit [OpenAI Platform](https://platform.openai.com/api-keys)
2. Create an account or sign in
3. Generate a new API key
4. Copy the key (starts with `sk-`)

### 2. Configure Environment Variables
Create a `.env` file in the root directory:

```bash
# OpenAI API Key for AI Financial Advisor features
VITE_OPENAI_API_KEY=your_openai_api_key_here
```

**Important Security Note**: 
- This setup is for development/demo purposes only
- In production, API calls should go through your backend server
- Never commit API keys to version control

### 3. Restart Development Server
```bash
npm run dev
```

## Usage

### AI Chat Assistant
1. Complete the Emergency Fund step (including nationality and location)
2. Look for the blue "AI Financial Advisor" button in the bottom right
3. Click to open the chat interface
4. The AI will provide initial guidance for your current step
5. Ask questions about your financial plan

### Example Questions
- "Should I invest in UAE stocks as a German expat?"
- "What's the best emergency fund size for my situation?"
- "How should I prepare for repatriation?"
- "What investment platforms work best for my nationality?"

## AI Capabilities

### Step-by-Step Guidance
- **Emergency Fund**: Account recommendations, timeline advice
- **Goals**: Common expat goals, realistic amounts and timelines
- **Risk & Returns**: Expat-specific risk considerations, platform recommendations
- **Budget**: Optimization strategies, lifestyle balance

### Expat-Specific Knowledge
- Zero tax environment opportunities
- Visa/residency considerations
- Currency and repatriation planning
- International investment platforms
- End-of-service benefit strategies

## Troubleshooting

### AI Features Not Working
1. Check that `VITE_OPENAI_API_KEY` is set correctly
2. Verify API key is valid and has credits
3. Check browser console for errors
4. Restart development server

### Chat Not Appearing
1. Complete nationality and location fields in Emergency Fund step
2. Ensure you're on a valid step (0-3)
3. Check that the component is rendering (no JavaScript errors)

### Limited Responses
- Free OpenAI accounts have usage limits
- Consider upgrading to paid plan for heavy usage
- Monitor your usage on OpenAI dashboard

## Development Notes

### File Structure
```
src/
├── services/
│   └── aiService.ts          # OpenAI integration
├── components/
│   └── AIGuidance.tsx        # Chat interface
└── context/
    └── PlannerContext.tsx    # Extended with user profile
```

### Customization
- Modify prompts in `aiService.ts` for different expertise areas
- Adjust UI in `AIGuidance.tsx` for different chat experience
- Extend user profile fields for more context

## Cost Considerations
- GPT-4 API costs approximately $0.03-0.06 per message
- Consider implementing usage limits for production
- Monitor costs through OpenAI dashboard 