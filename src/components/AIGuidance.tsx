import React, { useState, useEffect, useRef } from 'react';
import { MessageCircle, Send, Bot, User, Loader2, Sparkles } from 'lucide-react';
import { aiService, UserContext, AIGuidanceResponse, InteractiveButton } from '../services/aiService';

interface AIGuidanceProps {
  step: string;
  context: UserContext;
  className?: string;
  onBankSelected?: (bankId: string, bankData: any) => void;
  onBankSelectionStatusChange?: (isInProgress: boolean) => void;
  onGoalFormFill?: (formData: any) => void;
  componentId?: string;
}

interface ChatMessage {
  id: string;
  type: 'ai' | 'user';
  content: string;
  timestamp: Date;
  buttons?: InteractiveButton[];
}

const AIGuidance: React.FC<AIGuidanceProps> = ({ step, context, className = '', onBankSelected, onBankSelectionStatusChange, onGoalFormFill, componentId }) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [guidance, setGuidance] = useState<AIGuidanceResponse | null>(null);
  const [isLoadingGuidance, setIsLoadingGuidance] = useState(false);
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [userQuestion, setUserQuestion] = useState('');
  const [isLoadingResponse, setIsLoadingResponse] = useState(false);
  const [isBankSelectionInProgress, setIsBankSelectionInProgress] = useState(false);
  
  // Track current goal context to detect changes and reset conversation
  const [currentGoalContext, setCurrentGoalContext] = useState<string>('');

  // Function to create a unique context identifier
  const createContextId = (context: UserContext): string => {
    const goalContext = context.currentGoalContext;
    if (goalContext?.isEditingGoal && goalContext.goalBeingEdited) {
      return `editing-${goalContext.goalBeingEdited.id}`;
    }
    if (goalContext?.isCreatingNew && context.currentFormData?.goalCategory) {
      return `creating-${context.currentFormData.goalCategory}-${context.currentFormData.goalName || 'new'}`;
    }
    return 'overview';
  };

  // Reset conversation when goal context changes
  useEffect(() => {
    const newContextId = createContextId(context);
    if (newContextId !== currentGoalContext && currentGoalContext !== '') {
      console.log('Goal context changed, resetting conversation:', {
        from: currentGoalContext,
        to: newContextId
      });
      setChatMessages([]);
      setGuidance(null);
      if (isExpanded) {
        loadStepGuidance();
      }
    }
    setCurrentGoalContext(newContextId);
  }, [context.currentGoalContext, context.currentFormData?.goalCategory, context.currentFormData?.goalName]);

  // Function to convert URLs in text to clickable links
  const parseMessageWithLinks = (text: string) => {
    const urlRegex = /(https?:\/\/[^\s]+)/g;
    const parts = text.split(urlRegex);
    
    return parts.map((part, index) => {
      if (part.match(urlRegex)) {
        return (
          <a
            key={index}
            href={part}
            target="_blank"
            rel="noopener noreferrer"
            className="text-green-400 hover:text-green-300 underline break-all transition-colors"
          >
            {part}
          </a>
        );
      }
      return part;
    });
  };

  // Function to clean up JSON artifacts and empty code blocks from AI responses
  const cleanAIMessage = (message: string): string => {
    // Remove empty JSON code blocks
    let cleaned = message.replace(/```json\s*```/g, '').trim();
    
    // Remove any standalone empty JSON objects
    cleaned = cleaned.replace(/\{\s*\}/g, '').trim();
    
    // Remove any formFillData JSON objects that might be leftover
    cleaned = cleaned.replace(/\{[\s\S]*?"formFillData"[\s\S]*?\}/g, '').trim();
    
    // Clean up multiple consecutive newlines
    cleaned = cleaned.replace(/\n{3,}/g, '\n\n');
    
    // Remove trailing/leading whitespace
    return cleaned.trim();
  };
  
  // Store callbacks in refs to ensure they persist across re-renders
  const onBankSelectedRef = useRef(onBankSelected);
  const onBankSelectionStatusChangeRef = useRef(onBankSelectionStatusChange);
  
  // Ref for chat messages container to enable auto-scroll
  const chatMessagesRef = useRef<HTMLDivElement>(null);
  
  // Auto-scroll to start of last message when new messages are added
  const scrollToLastMessage = () => {
    if (chatMessagesRef.current && chatMessages.length > 0) {
      // Wait for next tick to ensure DOM is updated
      setTimeout(() => {
        if (chatMessagesRef.current) {
          const messageElements = chatMessagesRef.current.children;
          if (messageElements.length > 0) {
            // Get the last message element (excluding loading indicators)
            let lastMessageIndex = messageElements.length - 1;
            
            // If there's a loading response, the last message is the one before it
            if (isLoadingResponse && messageElements.length > 1) {
              lastMessageIndex = messageElements.length - 2;
            }
            
            const lastMessage = messageElements[lastMessageIndex] as HTMLElement;
            if (lastMessage) {
              // Calculate the position to scroll to (top of last message)
              const containerHeight = chatMessagesRef.current.clientHeight;
              const lastMessageTop = lastMessage.offsetTop;
              const lastMessageHeight = lastMessage.offsetHeight;
              
              // Scroll to show the start of the last message with some padding
              const scrollPosition = Math.max(0, lastMessageTop - 20); // 20px padding from top
              
              chatMessagesRef.current.scrollTop = scrollPosition;
            }
          }
        }
      }, 50); // Small delay to ensure DOM updates are complete
    }
  };
  
  // Update refs when props change
  useEffect(() => {
    onBankSelectedRef.current = onBankSelected;
    onBankSelectionStatusChangeRef.current = onBankSelectionStatusChange;
  }, [onBankSelected, onBankSelectionStatusChange]);

  // Auto-scroll when messages change
  useEffect(() => {
    scrollToLastMessage();
  }, [chatMessages, isLoadingResponse]);
  
  // Debug logging for onBankSelected prop
  useEffect(() => {
    console.log(`AIGuidance component [${componentId || step}] rendered/updated with:`, {
      step,
      onBankSelected: !!onBankSelected,
      onBankSelectedType: typeof onBankSelected,
      onBankSelectedRef: !!onBankSelectedRef.current,
      onBankSelectedRefType: typeof onBankSelectedRef.current,
      contextLocation: context?.location,
      isBankSelectionInProgress,
      componentId: componentId || 'default'
    });
  }, [step, onBankSelected, context?.location, isBankSelectionInProgress, componentId]);
  
  // Check for pending bank selection when component loads or step changes
  useEffect(() => {
    const checkPendingBankSelection = () => {
      try {
        const pendingSelectionStr = localStorage.getItem('pendingBankSelection');
        if (pendingSelectionStr && step === 'emergency-fund' && onBankSelectedRef.current) {
          const pendingSelection = JSON.parse(pendingSelectionStr);
          
          // Check if the pending selection is recent (within 5 minutes)
          const fiveMinutesAgo = Date.now() - (5 * 60 * 1000);
          if (pendingSelection.timestamp > fiveMinutesAgo) {
            console.log('Found pending bank selection, executing callback:', pendingSelection);
            
            // Execute the callback
            onBankSelectedRef.current(pendingSelection.bankId, pendingSelection.bankData);
            
            // Add a message to the chat
            const restoreMessage: ChatMessage = {
              id: Date.now().toString(),
              type: 'ai',
              content: `Your bank selection for ${pendingSelection.bankData.bankName} has been restored and applied to your emergency fund.`,
              timestamp: new Date()
            };
            setChatMessages(prev => [...prev, restoreMessage]);
            
            // Clear the pending selection
            localStorage.removeItem('pendingBankSelection');
          } else {
            // Clean up old pending selections
            localStorage.removeItem('pendingBankSelection');
          }
        }
      } catch (error) {
        console.error('Error checking pending bank selection:', error);
        localStorage.removeItem('pendingBankSelection');
      }
    };
    
    // Small delay to ensure component is fully loaded
    const timeoutId = setTimeout(checkPendingBankSelection, 1000);
    
    return () => clearTimeout(timeoutId);
  }, [step]);

  // Load initial step guidance when component mounts
  useEffect(() => {
    loadStepGuidance();
  }, []);

  // Refresh guidance when chat is expanded (user clicks the AI button)
  useEffect(() => {
    if (isExpanded) {
      loadStepGuidance();
    }
  }, [isExpanded]);

  const loadStepGuidance = async () => {
    setIsLoadingGuidance(true);
    try {
      const response = await aiService.getStepGuidance(step, context);
      setGuidance(response);
      
      // Add initial guidance as first AI message, or update existing guidance
      if (response.message) {
        // Clean up AI message
        const cleanedMessage = cleanAIMessage(response.message);
        
        const aiMessage: ChatMessage = {
          id: Date.now().toString(),
          type: 'ai',
          content: cleanedMessage,
          timestamp: new Date(),
          buttons: response.interactiveButtons
        };
        
        // If this is an update to existing guidance, replace the first message
        setChatMessages(prev => {
          if (prev.length > 0 && prev[0].type === 'ai') {
            return [aiMessage, ...prev.slice(1)];
          }
          return [aiMessage];
        });
      }
    } catch (error) {
      console.error('Failed to load AI guidance:', error);
    } finally {
      setIsLoadingGuidance(false);
    }
  };

  const handleSendQuestion = async () => {
    if (!userQuestion.trim() || isLoadingResponse) return;

    // Add user message
    const userMessage: ChatMessage = {
      id: Date.now().toString(),
      type: 'user',
      content: userQuestion,
      timestamp: new Date()
    };

    setChatMessages(prev => [...prev, userMessage]);
    setUserQuestion('');
    setIsLoadingResponse(true);

    try {
      // Prepare conversation history (exclude the current question which will be sent separately)
      const conversationHistory = chatMessages.map(msg => ({
        type: msg.type,
        content: msg.content
      }));

      const response = await aiService.askQuestion(userQuestion, context, conversationHistory);
      
      // Handle form fill data if provided
      if (response.formFillData && onGoalFormFill) {
        onGoalFormFill(response.formFillData);
      }
      
      // Clean up AI message
      const cleanedMessage = cleanAIMessage(response.message);
      
      // Add AI response
      const aiMessage: ChatMessage = {
        id: (Date.now() + 1).toString(),
        type: 'ai',
        content: cleanedMessage,
        timestamp: new Date()
      };

      setChatMessages(prev => [...prev, aiMessage]);
    } catch (error) {
      console.error('Failed to get AI response:', error);
      const errorMessage: ChatMessage = {
        id: (Date.now() + 1).toString(),
        type: 'ai',
        content: "I'm sorry, I couldn't process your question right now. Please try again.",
        timestamp: new Date()
      };
      setChatMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsLoadingResponse(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendQuestion();
    }
  };

  const handleButtonClick = async (button: InteractiveButton) => {
    // Bank selection is now handled by the dropdown on the page
    // This function is kept for future interactive features
    console.log('Interactive button clicked:', button);
  };

  if (!isExpanded) {
    return (
      <div className={`fixed bottom-4 lg:bottom-6 right-4 lg:right-6 z-50 ${className}`}>
        <div className="relative group">
          {/* Pulse ring animation */}
          <div className="absolute -inset-1 bg-green-400 rounded-full blur opacity-30 group-hover:opacity-50 animate-pulse"></div>
          
          <button
            onClick={() => setIsExpanded(true)}
            className="relative bg-green-500 hover:bg-green-600 text-theme-primary rounded-full p-3 lg:p-4 shadow-theme-xl transition-all duration-300 flex items-center gap-2 lg:gap-3 hover:scale-105 transform"
          >
            <div className="w-5 h-5 lg:w-6 lg:h-6 flex items-center justify-center">
              <Bot className="w-5 h-5 lg:w-6 lg:h-6" />
            </div>
            <span className="hidden sm:inline font-semibold text-sm lg:text-base">Your Money Coach</span>
            
            {/* Notification dot */}
            <div className="absolute -top-1 -right-1 w-3 h-3 bg-green-300 rounded-full border-2 border-theme-primary animate-bounce"></div>
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className={`fixed bottom-4 lg:bottom-6 right-4 lg:right-6 z-50 ${className}`}>
      <div className="backdrop-blur-xl bg-theme-card rounded-2xl shadow-theme-xl border border-theme w-80 sm:w-96 h-80 sm:h-96 flex flex-col ring-1 ring-theme/20 overflow-hidden">
        {/* Enhanced Header with Gradient */}
        <div className="bg-gradient-to-r from-green-500 to-green-600 text-white p-3 lg:p-4 rounded-t-2xl flex items-center justify-between relative overflow-hidden">
          {/* Animated background pattern */}
          <div className="absolute inset-0 bg-gradient-to-r from-green-400/20 to-green-500/20 animate-pulse"></div>
          
          <div className="flex items-center gap-2 lg:gap-3 relative z-10">
            <div className="w-7 h-7 lg:w-8 lg:h-8 bg-white/20 rounded-full flex items-center justify-center backdrop-blur-sm">
              <Bot className="w-4 h-4 lg:w-5 lg:h-5" />
            </div>
            <div>
              <span className="font-semibold text-sm lg:text-base">Your Money Coach</span>
              {isLoadingGuidance && (
                <div className="flex items-center gap-1">
                  <Loader2 className="w-3 h-3 animate-spin" />
                  <span className="text-xs text-green-50">Getting tips...</span>
                </div>
              )}
              {!isLoadingGuidance && (
                <div className="text-xs text-green-50 flex items-center gap-1">
                  <Sparkles className="w-3 h-3" />
                  Smart helper
                </div>
              )}
            </div>
          </div>
          
          <button
            onClick={() => setIsExpanded(false)}
            className="text-green-50 hover:text-white hover:bg-white/10 rounded-full p-1 transition-all duration-200 relative z-10"
          >
            <svg className="w-4 h-4 lg:w-5 lg:h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Enhanced Chat Messages */}
        <div ref={chatMessagesRef} className="flex-1 overflow-y-auto p-3 lg:p-4 space-y-3 lg:space-y-4 bg-theme-section">
          {isLoadingGuidance ? (
            <div className="flex items-center gap-2 lg:gap-3 text-theme-secondary bg-theme-tertiary rounded-xl p-2 lg:p-3 border border-theme">
              <div className="w-6 h-6 lg:w-8 lg:h-8 bg-green-500 rounded-full flex items-center justify-center">
                <Loader2 className="w-3 h-3 lg:w-4 lg:h-4 animate-spin text-white" />
              </div>
              <span className="text-xs lg:text-sm">Getting your tips...</span>
            </div>
          ) : (
            chatMessages.map((message, index) => (
              <div
                key={message.id}
                className={`flex gap-2 lg:gap-3 ${message.type === 'user' ? 'justify-end' : 'justify-start'} animate-slideIn`}
                style={{ animationDelay: `${index * 100}ms` }}
              >
                {message.type === 'ai' && (
                  <div className="w-6 h-6 lg:w-8 lg:h-8 bg-green-500 rounded-full flex items-center justify-center flex-shrink-0 shadow-theme">
                    <Bot className="w-3 h-3 lg:w-4 lg:h-4 text-white" />
                  </div>
                )}
                
                <div className="flex flex-col max-w-[240px] sm:max-w-[280px] min-w-0">
                  <div
                    className={`px-3 lg:px-4 py-2 lg:py-3 rounded-2xl shadow-theme-sm ${
                      message.type === 'user'
                        ? 'bg-gradient-to-br from-green-500 to-green-600 text-white rounded-br-md shadow-theme'
                        : 'bg-theme-card border border-theme text-theme-secondary rounded-bl-md backdrop-blur-sm'
                    }`}
                  >
                    <div className="text-xs lg:text-sm leading-relaxed whitespace-pre-wrap break-words overflow-wrap-anywhere">
                      {parseMessageWithLinks(message.content)}
                    </div>
                  </div>
                  
                  {/* Enhanced Interactive buttons for AI messages */}
                  {message.type === 'ai' && message.buttons && message.buttons.length > 0 && (
                    <div className="mt-2 lg:mt-3 space-y-2">
                      {message.buttons.map((button) => (
                        <button
                          key={button.id}
                          onClick={() => handleButtonClick(button)}
                          disabled={isLoadingResponse}
                          className="group relative w-full text-left p-3 lg:p-4 bg-theme-tertiary border-2 border-theme rounded-xl hover:border-green-400 hover:shadow-theme transition-all duration-200 hover:-translate-y-1 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:translate-y-0"
                        >
                          <div className="flex items-center justify-between mb-1 lg:mb-2">
                            <span className="text-green-300 font-semibold group-hover:text-green-200 transition-colors text-xs lg:text-sm">
                              {button.data.bankName}
                            </span>
                            <div className="bg-green-500 text-theme-primary text-xs px-2 py-1 rounded-full font-medium shadow-sm">
                              {button.data.interestRate}
                            </div>
                          </div>
                          
                          <div className="text-theme-secondary text-xs lg:text-sm mb-1 lg:mb-2 font-medium">{button.data.accountType}</div>
                          <div className="text-theme-muted text-xs leading-relaxed">{button.data.features}</div>
                          
                          {/* Hover effect overlay */}
                          <div className="absolute inset-0 bg-green-900/30 rounded-xl opacity-0 group-hover:opacity-100 transition-opacity duration-200 -z-10"></div>
                        </button>
                      ))}
                    </div>
                  )}
                </div>
                
                {message.type === 'user' && (
                  <div className="w-6 h-6 lg:w-8 lg:h-8 bg-theme-tertiary rounded-full flex items-center justify-center flex-shrink-0 shadow-theme">
                    <User className="w-3 h-3 lg:w-4 lg:h-4 text-theme-secondary" />
                  </div>
                )}
              </div>
            ))
          )}
          
          {isLoadingResponse && (
            <div className="flex gap-2 lg:gap-3 animate-slideIn">
              <div className="w-6 h-6 lg:w-8 lg:h-8 bg-green-500 rounded-full flex items-center justify-center flex-shrink-0 shadow-theme">
                <Bot className="w-3 h-3 lg:w-4 lg:h-4 text-white" />
              </div>
              <div className="bg-theme-card border border-theme px-3 lg:px-4 py-2 lg:py-3 rounded-2xl rounded-bl-md backdrop-blur-sm">
                <div className="flex items-center gap-2">
                  <Loader2 className="w-3 h-3 lg:w-4 lg:h-4 animate-spin text-green-400" />
                  <span className="text-xs lg:text-sm text-theme-secondary">Thinking...</span>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Enhanced Input */}
        <div className="p-3 lg:p-4 border-t border-theme bg-theme-secondary backdrop-blur-sm">
          <div className="flex gap-2">
            <input
              type="text"
              value={userQuestion}
              onChange={(e) => setUserQuestion(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="Ask me anything about saving money..."
              className="input-dark flex-1 px-3 lg:px-4 py-2 rounded-xl focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent text-xs lg:text-sm"
              disabled={isLoadingResponse}
            />
            <button
              onClick={handleSendQuestion}
              disabled={!userQuestion.trim() || isLoadingResponse}
              className="bg-green-500 hover:bg-green-600 text-theme-primary px-3 lg:px-4 py-2 rounded-xl transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed shadow-theme hover:shadow-theme-lg hover:scale-105 transform"
            >
              <Send className="w-3 h-3 lg:w-4 lg:h-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AIGuidance; 