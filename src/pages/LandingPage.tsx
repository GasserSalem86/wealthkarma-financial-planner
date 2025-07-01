import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Target, TrendingUp, Shield, DollarSign, CheckCircle, Star, ArrowRight, Play, 
  Sparkles, Brain, Zap, Calculator, PieChart, Calendar, Download, Users, 
  Globe, Award, Clock, ChevronRight, BarChart3, Wallet, CreditCard, 
  Building, MapPin, Phone, Mail, ExternalLink, ArrowDown, MousePointer, Menu, X,
  Heart, Lightbulb, Smile, AlertCircle, FileText, TrendingDown
} from 'lucide-react';
import ThemeToggle from '../components/ui/ThemeToggle';

const LandingPage: React.FC = () => {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [isEmailCaptured, setIsEmailCaptured] = useState(false);
  const [currentTestimonial, setCurrentTestimonial] = useState(0);
  const [isVisible, setIsVisible] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  useEffect(() => {
    setIsVisible(true);
    
    // Rotate testimonials
    const interval = setInterval(() => {
      setCurrentTestimonial((prev) => (prev + 1) % testimonials.length);
    }, 5000);
    
    return () => clearInterval(interval);
  }, []);

  const handleStartPlanning = () => {
    // Track conversion event
    if (window.gtag) {
      window.gtag('event', 'start_planning_clicked', {
        source: 'hero_cta'
      });
    }
    navigate('/plan');
  };

  const handleEmailCapture = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) return;
    
    // TODO: Integrate with Customer.io or email service
    console.log('Email captured:', email);
    setIsEmailCaptured(true);
    
    // Track email capture
    if (window.gtag) {
      window.gtag('event', 'email_captured', {
        source: 'hero_form'
      });
    }
  };

  const testimonials = [
    {
      name: "Sarah M.",
      location: "Dubai, UAE",
      role: "Marketing Manager",
      text: "Now I'm saving AED 4,200/month toward my house fund and AED 1,800 for retirement. For the first time, I know exactly where my money is going and why.",
      rating: 5,
      transformation: "From Lost to Confident",
      result: "Saving AED 6K/month systematically"
    },
    {
      name: "Ahmed K.",
      location: "Doha, Qatar",
      role: "Software Engineer",
      text: "Went from 6 different savings accounts to a simple 3-bucket system. My emergency fund is complete and I'm on track to buy property 2 years early.",
      rating: 5,
      transformation: "From Overwhelmed to Organized",
      result: "Property goal moved up 2 years"
    },
    {
      name: "Priya R.",
      location: "Riyadh, Saudi Arabia",
      role: "Finance Director",
      text: "My plan showed I was over-saving for retirement and under-saving for my kids' education. Now I have the perfect balance and peace of mind.",
      rating: 5,
      transformation: "From Guilty to Excited",
      result: "Optimized allocation across 4 goals"
    }
  ];

  const features = [
    {
      icon: Target,
      title: "Put Real Numbers to Your Dreams",
      description: "Finally know exactly how much you need for that house, your kids' education, and retirement - with a plan that actually works",
      color: "from-purple-500 to-purple-600",
      benefit: "No more guessing or wishful thinking"
    },
    {
      icon: Lightbulb,
      title: "We'll Explain Everything Along the Way",
      description: "No more financial jargon. We break down every recommendation so you understand the 'why' behind every decision",
      color: "from-blue-500 to-blue-600",
      benefit: "Feel confident in every choice you make"
    },
    {
      icon: Calendar,
      title: "Your Step-by-Step Monthly Roadmap",
      description: "Know exactly what to do each month. No more wondering 'what should I save for first?' We'll prioritize everything for you",
      color: "from-green-500 to-green-600",
      benefit: "Turn confusion into clear action"
    },
    {
      icon: BarChart3,
      title: "Compare Your Best Options",
      description: "Should you go with ADCB or Emirates NBD? Fixed deposit or mutual fund? We'll show you the best choices for YOUR situation",
      color: "from-orange-500 to-orange-600",
      benefit: "Make smart choices without the research"
    },
    {
      icon: TrendingUp,
      title: "Stay 3 Steps Ahead of Life Changes",
      description: "Got a promotion? Kid on the way? Job change? Your plan adapts instantly so you're always prepared, never scrambling",
      color: "from-red-500 to-red-600",
      benefit: "Sleep better knowing you're prepared"
    },
    {
      icon: Heart,
      title: "Built for Real Life, Not Perfect Life",
      description: "Plans that work even when life gets messy. No judgment, just practical solutions that fit your actual situation",
      color: "from-pink-500 to-pink-600",
      benefit: "Finally, a plan you can actually follow"
    }
  ];

  const stats = [
    { number: "3,247+", label: "Plans Created", icon: Users },
    { number: "AED 890K", label: "Average Dream Fund Goal", icon: Target },
    { number: "15 min", label: "To Complete Plan", icon: Clock },
    { number: "4.9/5", label: "Success Rating", icon: Star }
  ];

  const painPoints = [
    {
      problem: "Everyone else seems to have it figured out",
      truth: "73% of expats have no financial plan",
      icon: Users
    },
    {
      problem: "It's too complicated for someone like me",
      truth: "The basics work for 90% of people",
      icon: Brain
    },
    {
      problem: "I should have started years ago",
      truth: "The best time to start is now, wherever you are",
      icon: Clock
    },
    {
      problem: "I don't have enough money to invest",
      truth: "You can start planning with any income level",
      icon: DollarSign
    }
  ];

  const userTypes = [
    {
      emoji: "👋",
      title: "Never invested before?",
      description: "Perfect! We start from the very beginning and explain everything in plain English. No shame, no judgment - just clear guidance.",
      cta: "Start Your Journey"
    },
    {
      emoji: "💪",
      title: "Tired of juggling spreadsheets?",
      description: "We get it. You're smart but exhausted. Let us do the heavy lifting while you focus on executing, not calculating.",
      cta: "Get Your Life Back"
    }
  ];

  return (
    <div className="min-h-screen overflow-hidden bg-theme-primary">
      {/* Animated Background Elements */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-theme-success/5 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-orange-500/5 rounded-full blur-3xl animate-pulse delay-1000"></div>
        <div className="absolute top-3/4 left-1/2 w-64 h-64 bg-purple-500/5 rounded-full blur-3xl animate-pulse delay-2000"></div>
      </div>

      {/* Header */}
      <header className="relative z-50 border-b border-theme backdrop-blur-sm bg-theme-header">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex justify-between items-center">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-br from-green-500 to-orange-500 rounded-xl flex items-center justify-center shadow-lg">
              <Sparkles className="w-6 h-6 text-white" />
            </div>
            <div>
              <span className="heading-gradient">
                WealthKarma
              </span>
              <div className="text-xs text-theme-muted font-medium">Your Financial Confidence Partner</div>
            </div>
          </div>
          
          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center gap-6">
            <a href="#how-we-help" className="text-theme-secondary hover:text-theme-success transition-colors">How We Help</a>
            <a href="#how-it-works" className="text-theme-secondary hover:text-theme-success transition-colors">How It Works</a>
            <a href="#testimonials" className="text-theme-secondary hover:text-theme-success transition-colors">Success Stories</a>
            
            <ThemeToggle showLabel={false} />
            
            <a 
              href="/login"
              className="text-theme-secondary hover:text-theme-success transition-colors font-medium"
            >
              Login
            </a>
            
            <button 
              onClick={handleStartPlanning}
              className="bg-gradient-to-r from-green-500 to-orange-500 hover:from-green-600 hover:to-orange-600 text-gray-900 px-6 py-2 rounded-lg font-semibold transition-all duration-200 shadow-lg hover:shadow-xl transform hover:scale-105"
            >
              Get My Confidence-Building Plan
            </button>
          </nav>

          {/* Mobile Menu Button */}
          <button 
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            className="md:hidden p-2 text-theme-secondary hover:text-theme-success transition-colors"
          >
            {isMobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>

        {/* Mobile Navigation */}
        {isMobileMenuOpen && (
          <div className="md:hidden absolute top-full left-0 right-0 bg-theme-card border-b border-theme shadow-theme-lg backdrop-blur-sm">
            <nav className="px-4 py-6 space-y-4">
              <a 
                href="#how-we-help" 
                className="block text-theme-secondary hover:text-theme-success transition-colors py-2"
                onClick={() => setIsMobileMenuOpen(false)}
              >
                How We Help
              </a>
              <a 
                href="#how-it-works" 
                className="block text-theme-secondary hover:text-theme-success transition-colors py-2"
                onClick={() => setIsMobileMenuOpen(false)}
              >
                How It Works
              </a>
              <a 
                href="#testimonials" 
                className="block text-theme-secondary hover:text-theme-success transition-colors py-2"
                onClick={() => setIsMobileMenuOpen(false)}
              >
                Success Stories
              </a>
              <a 
                href="/login" 
                className="block text-theme-secondary hover:text-theme-success transition-colors py-2 font-medium"
                onClick={() => setIsMobileMenuOpen(false)}
              >
                Login
              </a>
              <button 
                onClick={() => {
                  handleStartPlanning();
                  setIsMobileMenuOpen(false);
                }}
                className="w-full bg-gradient-to-r from-green-500 to-orange-500 hover:from-green-600 hover:to-orange-600 text-gray-900 px-6 py-3 rounded-lg font-semibold transition-all duration-200 shadow-lg"
              >
                Create My Plan Now - Free
              </button>
              <div className="pt-2">
                <ThemeToggle showLabel={true} />
              </div>
            </nav>
          </div>
        )}
      </header>

      {/* Hero Section */}
      <section className="relative pt-20 pb-32 overflow-hidden">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className={`transition-all duration-1000 ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'}`}>
            
            {/* Confidence Badge */}
            <div className="text-center mb-8">
              <div className="inline-flex items-center gap-2 bg-gradient-to-r from-theme-success/20 to-orange-500/20 border border-theme-success/30 rounded-full px-6 py-3 mb-6 backdrop-blur-sm">
                <Heart className="w-5 h-5 text-theme-success" />
                <span className="text-sm font-semibold text-theme-success">We've Got Your Back</span>
                <Smile className="w-5 h-5 text-orange-400" />
              </div>
            </div>

            <div className="grid lg:grid-cols-2 gap-12 items-center">
              {/* Left Column - Hero Content */}
              <div className="text-center lg:text-left">
                <h1 className="heading-display mb-6 text-center lg:text-left">
                  Your Complete Financial Plan
                  <span className="heading-gradient block">In 15 Minutes</span>
                  <span className="text-2xl md:text-3xl lg:text-4xl text-theme-secondary">No experience needed. Judgment-free.</span>
                </h1>
                
                <p className="text-xl text-theme-secondary mb-8 max-w-2xl mx-auto lg:mx-0 leading-relaxed text-center lg:text-left">
                  Get your personalized roadmap for home, family, and retirement - plus exactly what to do each month to achieve it.
                </p>

                {/* User Type Cards - Simplified */}
                <div className="grid md:grid-cols-2 gap-4 mb-8">
                  <div className="bg-theme-card border border-theme rounded-xl p-4 text-center backdrop-blur-sm">
                    <div className="text-2xl mb-2">👋</div>
                    <h3 className="font-semibold text-theme-light mb-2">Never invested before?</h3>
                    <p className="text-sm text-theme-secondary">We explain everything in simple English. No judgment.</p>
                  </div>
                  <div className="bg-theme-card border border-theme rounded-xl p-4 text-center backdrop-blur-sm">
                    <div className="text-2xl mb-2">💪</div>
                    <h3 className="font-semibold text-theme-light mb-2">Tired of spreadsheets?</h3>
                    <p className="text-sm text-theme-secondary">Let us do the heavy lifting. Get your life back.</p>
                  </div>
                </div>

                {/* Main CTA */}
                <div className="mb-8">
                  <button 
                    onClick={handleStartPlanning}
                    className="group bg-gradient-to-r from-green-500 to-orange-500 hover:from-green-600 hover:to-orange-600 text-gray-900 px-8 py-4 rounded-xl text-lg font-semibold transition-all duration-300 shadow-lg hover:shadow-2xl transform hover:scale-105 flex items-center gap-3 w-full sm:w-auto justify-center mx-auto lg:mx-0"
                  >
                    Create My Plan Now - Free
                    <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                  </button>
                  
                  {/* Trust indicators enhanced */}
                  <div className="flex flex-col sm:flex-row justify-center lg:justify-start items-center gap-4 mt-4 text-sm text-theme-muted">
                    <div className="flex items-center gap-4">
                      <span>✓ No signup required</span>
                      <span>✓ 15 minutes to complete</span>
                      <span>✓ Download & keep forever</span>
                    </div>
                    <div className="flex items-center gap-2 text-xs bg-green-500/10 border border-green-500/20 rounded-full px-3 py-1">
                      <Shield className="w-3 h-3 text-green-400" />
                      <span className="text-green-400">Bank-level security</span>
                    </div>
                  </div>
                </div>

                {/* Social Proof - Condensed */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  {stats.map((stat, index) => (
                    <div key={index} className="text-center lg:text-left">
                      <div className="flex items-center justify-center lg:justify-start gap-2 mb-1">
                        <stat.icon className="w-4 h-4 text-theme-success flex-shrink-0" />
                        <span className="heading-stat text-theme-light">{stat.number}</span>
                      </div>
                      <div className="text-sm text-theme-muted">{stat.label}</div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Right Column - Demo Preview - Simplified */}
              <div className="relative flex justify-center lg:justify-end">
                <div className="bg-theme-card border border-theme rounded-2xl p-6 shadow-theme-xl backdrop-blur-sm w-full max-w-md">
                  <div className="flex items-center gap-3 mb-6">
                    <div className="w-3 h-3 bg-red-500 rounded-full"></div>
                    <div className="w-3 h-3 bg-yellow-500 rounded-full"></div>
                    <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                    <span className="text-theme-muted text-sm ml-2">Your Plan Preview</span>
                  </div>
                  
                  <div className="space-y-4">
                    <div className="bg-gradient-to-r from-theme-success/10 to-orange-500/10 border border-theme-success/20 rounded-lg p-4">
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2">
                          <Shield className="w-4 h-4 text-theme-success" />
                          <span className="text-theme-light font-medium">Emergency Fund</span>
                        </div>
                        <span className="text-theme-success text-sm">✓ Protected</span>
                      </div>
                      <div className="w-full bg-theme-tertiary rounded-full h-2">
                        <div className="bg-gradient-to-r from-green-500 to-green-400 h-2 rounded-full w-full"></div>
                      </div>
                      <div className="text-sm text-theme-secondary mt-2">AED 45,000 • 6 months covered</div>
                    </div>
                    
                    <div className="bg-gradient-to-r from-blue-500/10 to-purple-500/10 border border-blue-500/20 rounded-lg p-4">
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2">
                          <Building className="w-4 h-4 text-blue-400" />
                          <span className="text-theme-light font-medium">Dream Home</span>
                        </div>
                        <span className="text-blue-400 text-sm">68% There</span>
                      </div>
                      <div className="w-full bg-theme-tertiary rounded-full h-2">
                        <div className="bg-gradient-to-r from-blue-500 to-blue-400 h-2 rounded-full w-2/3"></div>
                      </div>
                      <div className="text-sm text-theme-secondary mt-2">AED 340K / AED 500K</div>
                    </div>
                    
                    <div className="bg-gradient-to-r from-purple-500/10 to-pink-500/10 border border-purple-500/20 rounded-lg p-4">
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2">
                          <Users className="w-4 h-4 text-purple-400" />
                          <span className="text-theme-light font-medium">Kids' Future</span>
                        </div>
                        <span className="text-purple-400 text-sm">On Track</span>
                      </div>
                      <div className="w-full bg-theme-tertiary rounded-full h-2">
                        <div className="bg-gradient-to-r from-purple-500 to-purple-400 h-2 rounded-full w-1/3"></div>
                      </div>
                      <div className="text-sm text-theme-secondary mt-2">AED 96K saved</div>
                    </div>
                  </div>
                  
                  <div className="mt-6 p-4 bg-gradient-to-r from-theme-success/5 to-orange-500/5 border border-theme-success/20 rounded-lg">
                    <div className="flex items-center gap-2 mb-2">
                      <Heart className="w-4 h-4 text-theme-success" />
                      <span className="text-theme-success font-semibold text-sm">You're Ahead of Schedule!</span>
                    </div>
                    <p className="text-theme-secondary text-sm">
                      Consider celebrating - you've earned it!
                    </p>
                  </div>
                </div>
                
                {/* Floating Elements */}
                <div className="absolute -top-4 -right-4 bg-green-500 text-white p-3 rounded-full shadow-lg animate-bounce">
                  <Smile className="w-6 h-6" />
                </div>
                <div className="absolute -bottom-4 -left-4 bg-orange-500 text-white p-3 rounded-full shadow-lg animate-pulse">
                  <Heart className="w-6 h-6" />
                </div>
              </div>
            </div>
          </div>
        </div>
        
        {/* Scroll Indicator */}
        <div className="absolute bottom-8 left-1/2 transform -translate-x-1/2 animate-bounce">
          <ArrowDown className="w-6 h-6 text-theme-muted" />
        </div>
      </section>

      {/* What You Get - Clear Value */}
      <section className="py-16 bg-theme-section backdrop-blur-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="heading-h2 mb-4">What You'll Get in 15 Minutes</h2>
            <p className="text-xl text-theme-secondary">A complete financial plan you can start using today</p>
            </div>
          
          <div className="max-w-5xl mx-auto grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="bg-theme-card border border-theme rounded-xl p-6 text-center backdrop-blur-sm">
              <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-blue-600 rounded-lg flex items-center justify-center mx-auto mb-4">
                <FileText className="w-6 h-6 text-white" />
              </div>
              <h3 className="font-semibold text-theme-light mb-2">Complete PDF Plan</h3>
              <p className="text-theme-secondary text-sm">
                30-page personalized roadmap with exact amounts, timelines, and action steps
              </p>
          </div>
          
            <div className="bg-theme-card border border-theme rounded-xl p-6 text-center backdrop-blur-sm">
              <div className="w-12 h-12 bg-gradient-to-br from-green-500 to-green-600 rounded-lg flex items-center justify-center mx-auto mb-4">
                <Building className="w-6 h-6 text-white" />
              </div>
              <h3 className="font-semibold text-theme-light mb-2">Bank Recommendations</h3>
              <p className="text-theme-secondary text-sm">
                Specific accounts to open with current rates and fees comparison
              </p>
            </div>

            <div className="bg-theme-card border border-theme rounded-xl p-6 text-center backdrop-blur-sm">
              <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-purple-600 rounded-lg flex items-center justify-center mx-auto mb-4">
                <Calendar className="w-6 h-6 text-white" />
              </div>
              <h3 className="font-semibold text-theme-light mb-2">Monthly Tracker</h3>
              <p className="text-theme-secondary text-sm">
                Excel template with automated progress tracking and milestone alerts
              </p>
            </div>

            <div className="bg-theme-card border border-theme rounded-xl p-6 text-center backdrop-blur-sm">
              <div className="w-12 h-12 bg-gradient-to-br from-orange-500 to-orange-600 rounded-lg flex items-center justify-center mx-auto mb-4">
                <Shield className="w-6 h-6 text-white" />
              </div>
              <h3 className="font-semibold text-theme-light mb-2">Scenario Planning</h3>
              <p className="text-theme-secondary text-sm">
                What-if analysis for job change, visa expiry, family expansion
              </p>
            </div>
          </div>

          <div className="text-center mt-12">
            <div className="bg-gradient-to-r from-theme-success/10 to-orange-500/10 border border-theme-success/30 rounded-xl p-6 max-w-3xl mx-auto">
              <h3 className="text-lg font-bold text-theme-light mb-3">
                Worth AED 2,500+ if you hired a financial advisor
              </h3>
              <p className="text-theme-secondary mb-4">
                Get the same quality plan in 15 minutes, completely free
              </p>
              <button 
                onClick={handleStartPlanning}
                className="bg-gradient-to-r from-green-500 to-orange-500 hover:from-green-600 hover:to-orange-600 text-gray-900 px-8 py-4 rounded-xl font-semibold text-lg transition-all duration-300 shadow-lg hover:shadow-xl transform hover:scale-105"
              >
                Create My Plan Now - Free
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* You're Not Alone - Streamlined */}
      <section className="py-16 bg-theme-section backdrop-blur-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="heading-h2 mb-4">Why Money Planning Feels Impossible</h2>
            <p className="text-xl text-theme-secondary">Let's be honest about the real barriers</p>
          </div>
          
          <div className="grid md:grid-cols-2 gap-6 max-w-4xl mx-auto mb-12">
            <div className="bg-theme-card border border-theme rounded-xl p-6 backdrop-blur-sm">
              <div className="flex items-center gap-3 mb-3">
                <AlertCircle className="w-6 h-6 text-red-400" />
                <h3 className="font-semibold text-red-400">"Everyone else has it figured out"</h3>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle className="w-4 h-4 text-theme-success" />
                <span className="text-theme-secondary text-sm"><strong>Reality:</strong> 73% of expats have no plan</span>
              </div>
            </div>

            <div className="bg-theme-card border border-theme rounded-xl p-6 backdrop-blur-sm">
              <div className="flex items-center gap-3 mb-3">
                <AlertCircle className="w-6 h-6 text-red-400" />
                <h3 className="font-semibold text-red-400">"It's too complicated for me"</h3>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle className="w-4 h-4 text-theme-success" />
                <span className="text-theme-secondary text-sm"><strong>Reality:</strong> The basics work for 90% of people</span>
              </div>
            </div>

            <div className="bg-theme-card border border-theme rounded-xl p-6 backdrop-blur-sm">
              <div className="flex items-center gap-3 mb-3">
                <AlertCircle className="w-6 h-6 text-red-400" />
                <h3 className="font-semibold text-red-400">"I should have started years ago"</h3>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle className="w-4 h-4 text-theme-success" />
                <span className="text-theme-secondary text-sm"><strong>Reality:</strong> Best time to start is now</span>
              </div>
            </div>

            <div className="bg-theme-card border border-theme rounded-xl p-6 backdrop-blur-sm">
              <div className="flex items-center gap-3 mb-3">
                <AlertCircle className="w-6 h-6 text-red-400" />
                <h3 className="font-semibold text-red-400">"I don't have enough money"</h3>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle className="w-4 h-4 text-theme-success" />
                <span className="text-theme-secondary text-sm"><strong>Reality:</strong> You can start with any income</span>
              </div>
            </div>
          </div>
          
              <div className="text-center">
            <div className="bg-gradient-to-r from-theme-success/10 to-orange-500/10 border border-theme-success/30 rounded-2xl p-8 max-w-3xl mx-auto">
              <h3 className="text-2xl font-bold text-theme-light mb-4">
                You're Not Behind. You're Just Getting Started.
              </h3>
              <p className="text-theme-secondary mb-6">
                Every expert was once a beginner. Today could be your starting point.
              </p>
              <button 
                onClick={handleStartPlanning}
                className="bg-gradient-to-r from-green-500 to-orange-500 hover:from-green-600 hover:to-orange-600 text-gray-900 px-8 py-4 rounded-xl font-semibold text-lg transition-all duration-300 shadow-lg hover:shadow-xl transform hover:scale-105"
              >
                Create My Plan Now - Free
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* Common Fears - Simplified */}
      <section className="py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="heading-h2 mb-4">"But What If..." - We've Got Answers</h2>
            <p className="text-xl text-theme-secondary">Your biggest fears, solved</p>
          </div>
          
          <div className="grid md:grid-cols-2 gap-6 max-w-5xl mx-auto mb-12">
            <div className="bg-theme-card border border-theme rounded-xl p-6 backdrop-blur-sm">
              <div className="flex items-center gap-3 mb-3">
                <AlertCircle className="w-5 h-5 text-red-400" />
                <h3 className="font-semibold text-red-400">"Should I save for a house or retirement first?"</h3>
              </div>
              <div className="flex items-start gap-2">
                <Lightbulb className="w-4 h-4 text-theme-success mt-1 flex-shrink-0" />
                <span className="text-theme-secondary text-sm">We prioritize based on your age and timeline. No more guessing.</span>
              </div>
            </div>

            <div className="bg-theme-card border border-theme rounded-xl p-6 backdrop-blur-sm">
              <div className="flex items-center gap-3 mb-3">
                <AlertCircle className="w-5 h-5 text-red-400" />
                <h3 className="font-semibold text-red-400">"What if I make the wrong choice?"</h3>
              </div>
              <div className="flex items-start gap-2">
                <Shield className="w-4 h-4 text-theme-success mt-1 flex-shrink-0" />
                <span className="text-theme-secondary text-sm">We only recommend proven, low-risk strategies. Safety first.</span>
              </div>
            </div>

            <div className="bg-theme-card border border-theme rounded-xl p-6 backdrop-blur-sm">
              <div className="flex items-center gap-3 mb-3">
                <AlertCircle className="w-5 h-5 text-red-400" />
                <h3 className="font-semibold text-red-400">"What if my visa isn't renewed?"</h3>
              </div>
              <div className="flex items-start gap-2">
                <Target className="w-4 h-4 text-theme-success mt-1 flex-shrink-0" />
                <span className="text-theme-secondary text-sm">Your plan includes multiple scenarios. You're prepared.</span>
              </div>
            </div>

            <div className="bg-theme-card border border-theme rounded-xl p-6 backdrop-blur-sm">
              <div className="flex items-center gap-3 mb-3">
                <AlertCircle className="w-5 h-5 text-red-400" />
                <h3 className="font-semibold text-red-400">"I don't understand the jargon"</h3>
              </div>
              <div className="flex items-start gap-2">
                <Heart className="w-4 h-4 text-theme-success mt-1 flex-shrink-0" />
                <span className="text-theme-secondary text-sm">We explain everything in simple English. No confusion.</span>
              </div>
            </div>
          </div>
          
          <div className="text-center">
            <div className="bg-gradient-to-r from-theme-success/10 to-orange-500/10 border border-theme-success/30 rounded-2xl p-8 max-w-3xl mx-auto">
              <h3 className="text-2xl font-bold text-theme-light mb-4">
                The Real Risk Is Staying Where You Are
              </h3>
              <p className="text-theme-secondary mb-6">
                We'll hold your hand through every step. No more feeling lost about money.
              </p>
              <button 
                onClick={handleStartPlanning}
                className="bg-gradient-to-r from-green-500 to-orange-500 hover:from-green-600 hover:to-orange-600 text-gray-900 px-8 py-4 rounded-xl font-semibold text-lg transition-all duration-300 shadow-lg hover:shadow-xl transform hover:scale-105"
              >
                Create My Plan Now - Free
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* Social Proof Section - Condensed */}
      <section id="testimonials" className="py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="heading-h2 mb-4">Real Transformations</h2>
                <div className="flex justify-center items-center gap-1 mb-4">
                  {[1,2,3,4,5].map(i => (
                    <Star key={i} className="w-5 h-5 fill-yellow-400 text-yellow-400" />
                  ))}
              <span className="ml-2 heading-stat text-theme-light">4.9/5</span>
              <span className="ml-2 text-theme-muted text-sm">"Life changing"</span>
                </div>
          </div>
          
          <div className="max-w-3xl mx-auto">
            <div className="bg-theme-card border border-theme rounded-2xl p-6 shadow-theme-xl backdrop-blur-sm">
              <div className="text-center mb-4">
                <div className="inline-flex items-center gap-2 bg-gradient-to-r from-theme-success/20 to-orange-500/20 border border-theme-success/30 rounded-full px-3 py-1 mb-3">
                  <Heart className="w-3 h-3 text-theme-success" />
                  <span className="text-xs font-semibold text-theme-success">
                    {testimonials[currentTestimonial].transformation}
                  </span>
                </div>
              </div>
              
              <blockquote className="text-lg text-theme-secondary text-center mb-4 leading-relaxed">
                  "{testimonials[currentTestimonial].text}"
                </blockquote>
              
              <div className="flex justify-center items-center gap-1 mb-3">
                {[1,2,3,4,5].map(i => (
                  <Star key={i} className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                ))}
                  </div>
              
              <div className="text-center">
                <div className="font-semibold text-theme-light text-sm">
                  {testimonials[currentTestimonial].name}
                    </div>
                <div className="text-theme-muted text-xs mb-2">
                  {testimonials[currentTestimonial].role} • {testimonials[currentTestimonial].location}
                  </div>
                <div className="text-xs bg-theme-success/10 border border-theme-success/20 rounded-full px-3 py-1 inline-block">
                  <span className="text-theme-success font-semibold">Result: {testimonials[currentTestimonial].result}</span>
              </div>
            </div>
            
              {/* Testimonial Navigation */}
              <div className="flex justify-center gap-2 mt-4">
              {testimonials.map((_, index) => (
                <button
                  key={index}
                  onClick={() => setCurrentTestimonial(index)}
                    className={`w-2 h-2 rounded-full transition-colors ${
                      currentTestimonial === index ? 'bg-theme-success' : 'bg-theme-tertiary'
                  }`}
                />
              ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* How We Help - Streamlined */}
      <section id="how-we-help" className="py-20 bg-theme-section backdrop-blur-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="heading-h1 mb-4">How We Turn Stress Into Confidence</h2>
            <p className="text-xl text-theme-secondary">Real solutions for real problems</p>
          </div>
          
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            <div className="group bg-theme-card border border-theme rounded-2xl p-6 shadow-theme hover:shadow-theme-xl transition-all duration-300 backdrop-blur-sm text-center">
              <div className="w-16 h-16 bg-gradient-to-br from-purple-500 to-purple-600 rounded-xl flex items-center justify-center mx-auto mb-4 group-hover:scale-110 transition-transform shadow-lg">
                <Target className="w-8 h-8 text-white" />
                </div>
              <h3 className="heading-h3-sm mb-3">Your Exact Numbers</h3>
              <p className="text-theme-secondary leading-relaxed mb-4">
                Know precisely: AED 450K house fund by 2027, AED 85K/year retirement income, AED 120K education fund
              </p>
              <div className="text-sm text-theme-success font-semibold">Specific amounts & timelines</div>
              </div>

            <div className="group bg-theme-card border border-theme rounded-2xl p-6 shadow-theme hover:shadow-theme-xl transition-all duration-300 backdrop-blur-sm text-center">
              <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl flex items-center justify-center mx-auto mb-4 group-hover:scale-110 transition-transform shadow-lg">
                <Lightbulb className="w-8 h-8 text-white" />
              </div>
              <h3 className="heading-h3-sm mb-3">We Explain Everything</h3>
              <p className="text-theme-secondary leading-relaxed mb-4">
                Understand the 'why' behind every recommendation. No jargon.
              </p>
              <div className="text-sm text-theme-success font-semibold">Feel confident in every choice</div>
            </div>

            <div className="group bg-theme-card border border-theme rounded-2xl p-6 shadow-theme hover:shadow-theme-xl transition-all duration-300 backdrop-blur-sm text-center">
              <div className="w-16 h-16 bg-gradient-to-br from-green-500 to-green-600 rounded-xl flex items-center justify-center mx-auto mb-4 group-hover:scale-110 transition-transform shadow-lg">
                <Calendar className="w-8 h-8 text-white" />
              </div>
              <h3 className="heading-h3-sm mb-3">Monthly Action Plan</h3>
              <p className="text-theme-secondary leading-relaxed mb-4">
                "Save AED 3,200 this month: AED 2,000 to ADCB house fund, AED 800 to retirement, AED 400 emergency"
              </p>
              <div className="text-sm text-theme-success font-semibold">Clear monthly priorities</div>
            </div>

            <div className="group bg-theme-card border border-theme rounded-2xl p-6 shadow-theme hover:shadow-theme-xl transition-all duration-300 backdrop-blur-sm text-center">
              <div className="w-16 h-16 bg-gradient-to-br from-orange-500 to-orange-600 rounded-xl flex items-center justify-center mx-auto mb-4 group-hover:scale-110 transition-transform shadow-lg">
                <BarChart3 className="w-8 h-8 text-white" />
              </div>
              <h3 className="heading-h3-sm mb-3">Best Banks & Investments</h3>
              <p className="text-theme-secondary leading-relaxed mb-4">
                "ADCB Term Deposit 4.2% for emergency fund, Emirates NBD property loan 3.8%, HSBC global index fund"
              </p>
              <div className="text-sm text-theme-success font-semibold">Personalized recommendations</div>
            </div>

            <div className="group bg-theme-card border border-theme rounded-2xl p-6 shadow-theme hover:shadow-theme-xl transition-all duration-300 backdrop-blur-sm text-center">
              <div className="w-16 h-16 bg-gradient-to-br from-red-500 to-red-600 rounded-xl flex items-center justify-center mx-auto mb-4 group-hover:scale-110 transition-transform shadow-lg">
                <TrendingUp className="w-8 h-8 text-white" />
              </div>
              <h3 className="heading-h3-sm mb-3">Stay Ahead of Changes</h3>
              <p className="text-theme-secondary leading-relaxed mb-4">
                Plan adapts to promotions, kids, job changes instantly.
              </p>
              <div className="text-sm text-theme-success font-semibold">Always prepared</div>
            </div>

            <div className="group bg-theme-card border border-theme rounded-2xl p-6 shadow-theme hover:shadow-theme-xl transition-all duration-300 backdrop-blur-sm text-center">
              <div className="w-16 h-16 bg-gradient-to-br from-pink-500 to-pink-600 rounded-xl flex items-center justify-center mx-auto mb-4 group-hover:scale-110 transition-transform shadow-lg">
                <Heart className="w-8 h-8 text-white" />
              </div>
              <h3 className="heading-h3-sm mb-3">Built for Real Life</h3>
              <p className="text-theme-secondary leading-relaxed mb-4">
                Plans that work when life gets messy. No judgment.
              </p>
              <div className="text-sm text-theme-success font-semibold">A plan you can follow</div>
            </div>
          </div>
        </div>
      </section>

      {/* How It Works - Simplified */}
      <section id="how-it-works" className="py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="heading-h1 mb-4">From Lost to Confident in 3 Steps</h2>
            <p className="text-xl text-theme-secondary">Simple. Fast. No overwhelm.</p>
          </div>
          
          <div className="max-w-4xl mx-auto">
            <div className="grid md:grid-cols-3 gap-8 mb-16">
              <div className="text-center group">
                <div className="relative mb-6">
                  <div className="w-16 h-16 bg-gradient-to-br from-green-500 to-green-600 text-white rounded-full flex items-center justify-center mx-auto font-bold text-xl shadow-lg group-hover:scale-110 transition-transform">
                    1
                  </div>
                  <div className="hidden md:block absolute top-8 left-full w-full h-0.5 bg-gradient-to-r from-green-500 to-orange-500"></div>
                </div>
                <h3 className="heading-h3-sm mb-3">Tell Us Your Goals</h3>
                <p className="text-theme-secondary max-w-xs mx-auto mb-3">
                  Share your dreams and fears. No wrong answers.
                </p>
                <div className="text-sm text-theme-success font-semibold">⏱️ 5 minutes</div>
              </div>

              <div className="text-center group">
                <div className="relative mb-6">
                  <div className="w-16 h-16 bg-gradient-to-br from-orange-500 to-orange-600 text-white rounded-full flex items-center justify-center mx-auto font-bold text-xl shadow-lg group-hover:scale-110 transition-transform">
                    2
                  </div>
                  <div className="hidden md:block absolute top-8 left-full w-full h-0.5 bg-gradient-to-r from-orange-500 to-purple-500"></div>
                </div>
                <h3 className="heading-h3-sm mb-3">We Build Your Plan</h3>
                <p className="text-theme-secondary max-w-xs mx-auto mb-3">
                  AI creates a doable roadmap for YOUR life.
                </p>
                <div className="text-sm text-orange-400 font-semibold">🤖 10 minutes</div>
              </div>

              <div className="text-center group">
                <div className="relative mb-6">
                  <div className="w-16 h-16 bg-gradient-to-br from-purple-500 to-purple-600 text-white rounded-full flex items-center justify-center mx-auto font-bold text-xl shadow-lg group-hover:scale-110 transition-transform">
                    3
                  </div>
                </div>
                <h3 className="heading-h3-sm mb-3">You Execute</h3>
                <p className="text-theme-secondary max-w-xs mx-auto mb-3">
                  Follow simple monthly actions. We guide you.
                </p>
                <div className="text-sm text-purple-400 font-semibold">🎯 Start today</div>
              </div>
            </div>
          </div>
          
          {/* Power User Section - Condensed */}
          <div className="bg-gradient-to-r from-theme-success/10 to-orange-500/10 border border-theme-success/20 rounded-2xl p-8 text-center max-w-4xl mx-auto">
            <h3 className="text-xl font-bold text-theme-light mb-4">
              For Excel Warriors: Get Your Life Back
            </h3>
            <div className="grid md:grid-cols-2 gap-4">
              <div className="flex items-center gap-3">
                <CheckCircle className="w-4 h-4 text-theme-success flex-shrink-0" />
                <span className="text-theme-secondary text-sm">All analysis done instantly</span>
              </div>
              <div className="flex items-center gap-3">
                <CheckCircle className="w-4 h-4 text-theme-success flex-shrink-0" />
                <span className="text-theme-secondary text-sm">No spreadsheet headaches</span>
              </div>
              <div className="flex items-center gap-3">
                <CheckCircle className="w-4 h-4 text-theme-success flex-shrink-0" />
                <span className="text-theme-secondary text-sm">Professional recommendations</span>
              </div>
              <div className="flex items-center gap-3">
                <CheckCircle className="w-4 h-4 text-theme-success flex-shrink-0" />
                <span className="text-theme-secondary text-sm">Export everything</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Urgency Section - Condensed */}
      <section className="py-16 bg-theme-section backdrop-blur-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <h2 className="heading-h2 mb-8">The Cost of Waiting</h2>
            
            <div className="grid md:grid-cols-2 gap-6 max-w-4xl mx-auto mb-8">
              <div className="bg-red-500/10 border border-red-500/20 rounded-xl p-6">
                <h3 className="text-lg font-bold text-red-400 mb-3 flex items-center gap-2">
                  <TrendingDown className="w-5 h-5" />
                  Delaying 1 Year Costs You:
                </h3>
                <ul className="space-y-2 text-theme-secondary text-left text-sm">
                  <li>• <strong>AED 18,000</strong> in potential savings growth</li>
                  <li>• <strong>12 months</strong> closer to retirement with same fund</li>
                  <li>• <strong>AED 45,000</strong> house prices increased ~8%</li>
                  <li>• <strong>365 nights</strong> of money stress</li>
                </ul>
              </div>
              
              <div className="bg-green-500/10 border border-green-500/20 rounded-xl p-6">
                <h3 className="text-lg font-bold text-green-400 mb-3 flex items-center gap-2">
                  <TrendingUp className="w-5 h-5" />
                  Starting Today Gets You:
                </h3>
                <ul className="space-y-2 text-theme-secondary text-left text-sm">
                  <li>• <strong>AED 127,000</strong> average additional savings over 10 years</li>
                  <li>• <strong>2.3 years earlier</strong> retirement on average</li>
                  <li>• <strong>85% reduction</strong> in financial stress (user survey)</li>
                  <li>• <strong>Peace of mind</strong> starting tonight</li>
                </ul>
              </div>
            </div>
            
            <div className="bg-gradient-to-r from-theme-success/10 to-orange-500/10 border border-theme-success/30 rounded-2xl p-8 max-w-3xl mx-auto">
              <h3 className="text-xl font-bold text-theme-light mb-4">
                The Best Time to Start Is Now
              </h3>
              <p className="text-theme-secondary mb-6">
                Join 847 people who started this week.
              </p>
              <button 
                onClick={handleStartPlanning}
                className="bg-gradient-to-r from-green-500 to-orange-500 hover:from-green-600 hover:to-orange-600 text-gray-900 px-8 py-4 rounded-xl font-semibold text-lg transition-all duration-300 shadow-lg hover:shadow-xl transform hover:scale-105"
              >
                Create My Plan Now - Free
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* FAQ Section */}
      <section className="py-20 bg-theme-section backdrop-blur-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="heading-h1 mb-4">Common Questions</h2>
            <p className="text-xl text-theme-secondary">Everything you need to know before starting</p>
          </div>
          
          <div className="max-w-4xl mx-auto grid md:grid-cols-2 gap-8">
            <div className="space-y-6">
              <div className="bg-theme-card border border-theme rounded-xl p-6 backdrop-blur-sm">
                <h3 className="font-semibold text-theme-light mb-3 flex items-center gap-2">
                  <AlertCircle className="w-5 h-5 text-theme-success" />
                  Is my financial data secure?
                </h3>
                <p className="text-theme-secondary text-sm">
                  Yes. We use bank-level encryption and never store sensitive account details. Your data is processed locally and encrypted during transmission.
                </p>
              </div>

              <div className="bg-theme-card border border-theme rounded-xl p-6 backdrop-blur-sm">
                <h3 className="font-semibold text-theme-light mb-3 flex items-center gap-2">
                  <Clock className="w-5 h-5 text-theme-success" />
                  How accurate are the recommendations?
                </h3>
                <p className="text-theme-secondary text-sm">
                  Our AI analyzes current GCC market rates, inflation data, and regional regulations to provide accurate projections updated monthly.
                </p>
              </div>

              <div className="bg-theme-card border border-theme rounded-xl p-6 backdrop-blur-sm">
                <h3 className="font-semibold text-theme-light mb-3 flex items-center gap-2">
                  <Users className="w-5 h-5 text-theme-success" />
                  What if my visa expires?
                </h3>
                <p className="text-theme-secondary text-sm">
                  Your plan includes multiple scenarios including visa renewal, job change, and repatriation. We help you stay prepared for any situation.
                </p>
              </div>
            </div>

            <div className="space-y-6">
              <div className="bg-theme-card border border-theme rounded-xl p-6 backdrop-blur-sm">
                <h3 className="font-semibold text-theme-light mb-3 flex items-center gap-2">
                  <DollarSign className="w-5 h-5 text-theme-success" />
                  Do I need a minimum income?
                </h3>
                <p className="text-theme-secondary text-sm">
                  No minimum required. Our plans work for any income level - from fresh graduates to senior executives. We optimize for YOUR situation.
                </p>
              </div>

              <div className="bg-theme-card border border-theme rounded-xl p-6 backdrop-blur-sm">
                <h3 className="font-semibold text-theme-light mb-3 flex items-center gap-2">
                  <Building className="w-5 h-5 text-theme-success" />
                  Which banks do you recommend?
                </h3>
                <p className="text-theme-secondary text-sm">
                  We compare all major GCC banks (ADCB, Emirates NBD, FAB, etc.) and recommend the best options based on your specific needs and location.
                </p>
              </div>

              <div className="bg-theme-card border border-theme rounded-xl p-6 backdrop-blur-sm">
                <h3 className="font-semibold text-theme-light mb-3 flex items-center gap-2">
                  <FileText className="w-5 h-5 text-theme-success" />
                  What exactly do I get?
                </h3>
                <p className="text-theme-secondary text-sm">
                  A complete PDF roadmap with specific amounts to save, recommended accounts/investments, monthly action steps, and progress tracking tools.
                </p>
              </div>
            </div>
          </div>

          <div className="text-center mt-12">
            <div className="bg-gradient-to-r from-theme-success/10 to-orange-500/10 border border-theme-success/30 rounded-2xl p-6 max-w-3xl mx-auto">
              <h3 className="text-lg font-bold text-theme-light mb-3">Still have questions?</h3>
              <p className="text-theme-secondary mb-4">
                Get personalized answers during your 15-minute plan creation - completely free.
              </p>
              <button 
                onClick={handleStartPlanning}
                className="bg-gradient-to-r from-green-500 to-orange-500 hover:from-green-600 hover:to-orange-600 text-gray-900 px-6 py-3 rounded-xl font-semibold transition-all duration-300 shadow-lg hover:shadow-xl transform hover:scale-105"
              >
                Start My Plan & Get Answers
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* Pricing Section - Reframed */}
      <section className="py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="heading-h1 mb-4">
              Start Free, Feel Confident Immediately
            </h2>
            <p className="text-xl text-theme-secondary">
              Get your confidence-building plan at no cost, then choose ongoing support
            </p>
          </div>
          
          <div className="max-w-4xl mx-auto grid md:grid-cols-2 gap-8">
            {/* Free Plan - Reframed */}
            <div className="bg-theme-card border border-theme rounded-2xl p-8 shadow-theme-lg backdrop-blur-sm">
              <div className="text-center mb-6">
                <h3 className="heading-h3-sm mb-2">Your Complete Confidence Plan</h3>
                <p className="text-theme-secondary">Everything you need to stop feeling lost</p>
              </div>
              
              <div className="text-center mb-8">
                <span className="heading-stat-xl text-theme-success font-bold">FREE</span>
                <p className="text-theme-secondary mt-2">No credit card, no catch</p>
              </div>

              <ul className="space-y-4 mb-8">
                <li className="flex items-start gap-3">
                  <CheckCircle className="w-5 h-5 text-theme-success flex-shrink-0 mt-0.5" />
                  <span className="text-theme-secondary">Your complete financial roadmap with real numbers</span>
                </li>
                <li className="flex items-start gap-3">
                  <CheckCircle className="w-5 h-5 text-theme-success flex-shrink-0 mt-0.5" />
                  <span className="text-theme-secondary">Emergency fund + 3 major life goals planned</span>
                </li>
                <li className="flex items-start gap-3">
                  <CheckCircle className="w-5 h-5 text-theme-success flex-shrink-0 mt-0.5" />
                  <span className="text-theme-secondary">Best bank and investment options for YOU</span>
                </li>
                <li className="flex items-start gap-3">
                  <CheckCircle className="w-5 h-5 text-theme-success flex-shrink-0 mt-0.5" />
                  <span className="text-theme-secondary">Excel tracker to keep you on track</span>
                </li>
                <li className="flex items-start gap-3">
                  <CheckCircle className="w-5 h-5 text-theme-success flex-shrink-0 mt-0.5" />
                  <span className="text-theme-secondary">Step-by-step action guide</span>
                </li>
              </ul>

              <button 
                onClick={handleStartPlanning}
                className="w-full bg-gradient-to-r from-green-500 to-orange-500 hover:from-green-600 hover:to-orange-600 text-gray-900 py-4 rounded-xl font-semibold text-lg transition-all duration-200 shadow-lg hover:shadow-xl transform hover:scale-105"
              >
                Create My Plan Now - Free
              </button>
            </div>

            {/* Premium Plan - Reframed */}
            <div className="bg-gradient-to-br from-theme-success/10 to-orange-500/10 backdrop-blur-sm rounded-2xl border-2 border-theme-success/30 p-8 shadow-theme-xl relative">
              <div className="absolute -top-4 left-1/2 transform -translate-x-1/2 bg-gradient-to-r from-green-500 to-orange-500 text-gray-900 px-6 py-2 rounded-full text-sm font-semibold">
                For Peace of Mind
              </div>
              
              <div className="text-center mb-6">
                <h3 className="heading-h3-sm mb-2">Ongoing Confidence & Support</h3>
                <p className="text-theme-secondary">We'll be with you every step of the way</p>
              </div>
              
              <div className="text-center mb-8">
                <span className="heading-stat-xl text-theme-light">$9.99</span>
                <span className="text-theme-secondary">/month</span>
                <p className="text-theme-secondary mt-2">30-day free trial</p>
              </div>

              <ul className="space-y-4 mb-8">
                <li className="flex items-start gap-3">
                  <CheckCircle className="w-5 h-5 text-theme-success flex-shrink-0 mt-0.5" />
                  <span className="text-theme-secondary">Everything in your Free Plan</span>
                </li>
                <li className="flex items-start gap-3">
                  <CheckCircle className="w-5 h-5 text-theme-success flex-shrink-0 mt-0.5" />
                  <span className="text-theme-secondary">Live dashboard to track your progress</span>
                </li>
                <li className="flex items-start gap-3">
                  <CheckCircle className="w-5 h-5 text-theme-success flex-shrink-0 mt-0.5" />
                  <span className="text-theme-secondary">Monthly AI coaching & plan updates</span>
                </li>
                <li className="flex items-start gap-3">
                  <CheckCircle className="w-5 h-5 text-theme-success flex-shrink-0 mt-0.5" />
                  <span className="text-theme-secondary">Plan automatically adapts to life changes</span>
                </li>
                <li className="flex items-start gap-3">
                  <CheckCircle className="w-5 h-5 text-theme-success flex-shrink-0 mt-0.5" />
                  <span className="text-theme-secondary">Celebrate achievements with us</span>
                </li>
              </ul>

              <button 
                onClick={handleStartPlanning}
                className="w-full bg-gradient-to-r from-green-500 to-orange-500 hover:from-green-600 hover:to-orange-600 text-gray-900 py-4 rounded-xl font-semibold text-lg transition-all duration-200 shadow-lg hover:shadow-xl transform hover:scale-105"
              >
                Try Premium Free
              </button>
              
              <p className="text-sm text-theme-muted text-center mt-4">
                Cancel anytime • No judgment, just support
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Final CTA - Empowering */}
      <section className="py-20 bg-gradient-to-r from-theme-success/10 to-orange-500/10 backdrop-blur-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="heading-h1 mb-6">
            Ready to Stop Feeling Lost and Start Feeling Confident?
          </h2>
          <p className="text-xl text-theme-secondary mb-8 max-w-3xl mx-auto">
            Join thousands of people who've gone from money stress to money confidence. 
            Your transformation starts today - completely free, completely judgment-free.
          </p>
          
          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
            <button 
              onClick={handleStartPlanning}
              className="group bg-gradient-to-r from-green-500 to-orange-500 hover:from-green-600 hover:to-orange-600 text-gray-900 px-8 py-4 rounded-xl text-lg font-semibold transition-all duration-300 shadow-lg hover:shadow-2xl transform hover:scale-105 flex items-center gap-3 w-full sm:w-auto justify-center"
            >
                Create My Plan Now - Free
              <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
            </button>
            
            <div className="text-theme-muted text-sm text-center">
              ✓ No signup required • ✓ 15 minutes to complete • ✓ Keep your plan forever
            </div>
          </div>

          {/* Final encouragement */}
          <div className="mt-8 bg-gradient-to-r from-theme-success/5 to-orange-500/5 border border-theme-success/20 rounded-xl p-6 max-w-2xl mx-auto">
            <p className="text-theme-secondary">
              <span className="text-theme-success font-semibold">"I wish I had started sooner."</span>
              {" "}- Said by 94% of our users. Don't be the person wishing you started today.
            </p>
          </div>

          {/* Login for existing users */}
          <div className="mt-6 text-center">
            <p className="text-theme-muted">
              Already have an account?{' '}
              <a 
                href="/login" 
                className="text-green-500 hover:text-green-600 font-medium hover:underline"
              >
                Sign in to your dashboard
              </a>
            </p>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-theme-section text-theme-primary py-12 border-t border-theme">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid md:grid-cols-4 gap-8 mb-8">
            <div className="md:col-span-2">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 bg-gradient-to-br from-green-500 to-orange-500 rounded-xl flex items-center justify-center shadow-lg">
                  <Sparkles className="w-6 h-6 text-white" />
                </div>
                <div>
                  <span className="heading-gradient">
                    WealthKarma
                  </span>
                  <div className="text-xs text-theme-muted">Your Financial Confidence Partner</div>
                </div>
              </div>
              <p className="text-theme-muted mb-4 max-w-md">
                Turn money stress into money confidence. We're here to guide you from 
                "I have no idea what I'm doing" to "I've got this figured out" - completely judgment-free.
              </p>
              <div className="space-y-3">
                <div className="flex items-center gap-2 text-theme-muted">
                  <MapPin className="w-4 h-4" />
                  <span className="text-sm">Serving UAE, Saudi, Qatar, Kuwait, Bahrain, Oman</span>
                </div>
                <div className="flex flex-wrap items-center gap-4">
                  <div className="flex items-center gap-2 text-xs bg-green-500/10 border border-green-500/20 rounded-full px-3 py-1">
                    <Shield className="w-3 h-3 text-green-400" />
                    <span className="text-green-400">256-bit SSL Encryption</span>
                  </div>
                  <div className="flex items-center gap-2 text-xs bg-blue-500/10 border border-blue-500/20 rounded-full px-3 py-1">
                    <CheckCircle className="w-3 h-3 text-blue-400" />
                    <span className="text-blue-400">GDPR Compliant</span>
                  </div>
                  <div className="flex items-center gap-2 text-xs bg-purple-500/10 border border-purple-500/20 rounded-full px-3 py-1">
                    <Globe className="w-3 h-3 text-purple-400" />
                    <span className="text-purple-400">ISO 27001 Standards</span>
                  </div>
                </div>
              </div>
            </div>
            
            <div>
              <h4 className="heading-h6 mb-4">Product</h4>
              <ul className="space-y-2 text-theme-muted">
                <li><a href="#how-we-help" className="hover:text-theme-success transition-colors">How We Help</a></li>
                <li><a href="#how-it-works" className="hover:text-theme-success transition-colors">How It Works</a></li>
                <li><a href="#testimonials" className="hover:text-theme-success transition-colors">Success Stories</a></li>
                <li><button onClick={handleStartPlanning} className="hover:text-theme-success transition-colors">Start Planning</button></li>
              </ul>
            </div>
            
            <div>
              <h4 className="heading-h6 mb-4">Support</h4>
              <ul className="space-y-2 text-theme-muted">
                <li><a href="/help" className="hover:text-theme-success transition-colors">Help Center</a></li>
                <li><a href="/contact" className="hover:text-theme-success transition-colors">Contact Us</a></li>
                <li><a href="/privacy" className="hover:text-theme-success transition-colors">Privacy Policy</a></li>
                <li><a href="/terms" className="hover:text-theme-success transition-colors">Terms of Service</a></li>
              </ul>
            </div>
          </div>
          
          <div className="border-t border-theme pt-8 text-center text-theme-muted">
            <p>&copy; 2024 WealthKarma. All rights reserved. Made with ❤️ for GCC expats.</p>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default LandingPage; 