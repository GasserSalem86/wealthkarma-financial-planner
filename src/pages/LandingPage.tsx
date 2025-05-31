import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Target, TrendingUp, Shield, DollarSign, CheckCircle, Star, ArrowRight, Play, 
  Sparkles, Brain, Zap, Calculator, PieChart, Calendar, Download, Users, 
  Globe, Award, Clock, ChevronRight, BarChart3, Wallet, CreditCard, 
  Building, MapPin, Phone, Mail, ExternalLink, ArrowDown, MousePointer
} from 'lucide-react';
import ThemeToggle from '../components/ui/ThemeToggle';

const LandingPage: React.FC = () => {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [isEmailCaptured, setIsEmailCaptured] = useState(false);
  const [currentTestimonial, setCurrentTestimonial] = useState(0);
  const [isVisible, setIsVisible] = useState(false);

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
      text: "Finally, financial advice that understands expat life! WealthKarma helped me plan for my kids' education while building my emergency fund.",
      rating: 5
    },
    {
      name: "Ahmed K.",
      location: "Doha, Qatar",
      role: "Software Engineer",
      text: "The AI guidance is incredible. It adapted my plan when I got a promotion and helped me optimize my savings across UAE and Qatar banks.",
      rating: 5
    },
    {
      name: "Priya R.",
      location: "Riyadh, Saudi Arabia",
      role: "Finance Director",
      text: "I've tried other financial apps, but none understood the complexities of expat financial planning like WealthKarma does.",
      rating: 5
    }
  ];

  const features = [
    {
      icon: Brain,
      title: "AI-Powered Planning",
      description: "Smart algorithms that understand GCC expat challenges and create personalized roadmaps",
      color: "from-purple-500 to-purple-600"
    },
    {
      icon: Globe,
      title: "Multi-Currency Support",
      description: "Plan across AED, SAR, QAR, KWD, BHD, and OMR with real-time exchange considerations",
      color: "from-blue-500 to-blue-600"
    },
    {
      icon: Building,
      title: "GCC Bank Integration",
      description: "Real recommendations for ADCB, Emirates NBD, QNB, SABB, and 50+ regional banks",
      color: "from-green-500 to-green-600"
    },
    {
      icon: Calendar,
      title: "60-Month Roadmap",
      description: "Complete timeline with monthly actions, milestones, and progress tracking",
      color: "from-orange-500 to-orange-600"
    },
    {
      icon: Shield,
      title: "Visa-Aware Planning",
      description: "Plans that adapt to visa renewals, job changes, and expat life transitions",
      color: "from-red-500 to-red-600"
    },
    {
      icon: PieChart,
      title: "Investment Guidance",
      description: "Phase-based investment strategies from conservative to growth, tailored to your timeline",
      color: "from-yellow-500 to-yellow-600"
    }
  ];

  const stats = [
    { number: "3,247+", label: "Expats Planned", icon: Users },
    { number: "$127M+", label: "Goals Tracked", icon: Target },
    { number: "15 min", label: "Average Setup", icon: Clock },
    { number: "4.9/5", label: "User Rating", icon: Star }
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
              <div className="text-xs text-theme-muted font-medium">AI Financial Planner</div>
            </div>
          </div>
          <nav className="hidden md:flex items-center gap-6">
            <a href="#features" className="text-theme-secondary hover:text-theme-success transition-colors">Features</a>
            <a href="#how-it-works" className="text-theme-secondary hover:text-theme-success transition-colors">How It Works</a>
            <a href="#testimonials" className="text-theme-secondary hover:text-theme-success transition-colors">Reviews</a>
            
            <ThemeToggle showLabel={false} />
            
            <button 
              onClick={handleStartPlanning}
              className="bg-gradient-to-r from-green-500 to-orange-500 hover:from-green-600 hover:to-orange-600 text-gray-900 px-6 py-2 rounded-lg font-semibold transition-all duration-200 shadow-lg hover:shadow-xl transform hover:scale-105"
            >
              Start Free Plan
            </button>
          </nav>
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative pt-20 pb-32 overflow-hidden">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className={`transition-all duration-1000 ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'}`}>
            
            {/* AI Badge - Centered */}
            <div className="text-center mb-8">
              <div className="inline-flex items-center gap-2 bg-gradient-to-r from-theme-success/20 to-orange-500/20 border border-theme-success/30 rounded-full px-6 py-3 mb-6 backdrop-blur-sm">
                <Brain className="w-5 h-5 text-theme-success" />
                <span className="text-sm font-semibold text-theme-success">AI-Powered Financial Planning</span>
                <Zap className="w-5 h-5 text-orange-400 animate-pulse" />
              </div>
            </div>

            <div className="grid lg:grid-cols-2 gap-12 items-center">
              {/* Left Column - Hero Content */}
              <div className="text-center lg:text-left">
                <h1 className="heading-display mb-6 text-center lg:text-left">
                  Your Complete
                  <span className="heading-gradient block">
                    Financial Future
                  </span>
                  <span className="text-3xl md:text-4xl lg:text-5xl text-theme-secondary">in 15 Minutes</span>
                </h1>
                
                <p className="text-xl text-theme-secondary mb-8 max-w-2xl mx-auto lg:mx-0 leading-relaxed text-center lg:text-left">
                  Get a personalized 60-month roadmap to achieve your financial goals, 
                  with AI guidance tailored specifically for <span className="text-theme-success font-semibold">GCC expats</span>. 
                  No generic advice - just your complete plan.
                </p>

                {/* Trust Indicators - Responsive alignment */}
                <div className="flex justify-center lg:justify-start items-center gap-4 lg:gap-6 mb-8 flex-wrap">
                  <div className="flex items-center gap-2 text-theme-secondary">
                    <CheckCircle className="w-5 h-5 text-theme-success flex-shrink-0" />
                    <span className="text-sm lg:text-base">No signup required</span>
                  </div>
                  <div className="flex items-center gap-2 text-theme-secondary">
                    <CheckCircle className="w-5 h-5 text-theme-success flex-shrink-0" />
                    <span className="text-sm lg:text-base">Complete in 15 minutes</span>
                  </div>
                  <div className="flex items-center gap-2 text-theme-secondary">
                    <CheckCircle className="w-5 h-5 text-theme-success flex-shrink-0" />
                    <span className="text-sm lg:text-base">Export and keep forever</span>
                  </div>
                </div>

                {/* CTA Buttons - Better alignment */}
                <div className="flex flex-col sm:flex-row gap-4 justify-center lg:justify-start items-center mb-8">
                  <button 
                    onClick={handleStartPlanning}
                    className="group bg-gradient-to-r from-green-500 to-orange-500 hover:from-green-600 hover:to-orange-600 text-gray-900 px-8 py-4 rounded-xl text-lg font-semibold transition-all duration-300 shadow-lg hover:shadow-2xl transform hover:scale-105 flex items-center gap-3 w-full sm:w-auto justify-center"
                  >
                    Start Your Free Financial Plan
                    <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                  </button>
                  
                  <button className="flex items-center gap-2 text-theme-secondary hover:text-theme-success transition-colors group justify-center">
                    <Play className="w-5 h-5 group-hover:scale-110 transition-transform" />
                    Watch 2-min demo
                  </button>
                </div>

                {/* Stats Row - Better spacing and alignment */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
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

              {/* Right Column - Interactive Demo/Preview */}
              <div className="relative flex justify-center lg:justify-end">
                <div className="bg-theme-card border border-theme rounded-2xl p-6 shadow-theme-xl backdrop-blur-sm w-full max-w-md">
                  <div className="flex items-center gap-3 mb-6">
                    <div className="w-3 h-3 bg-red-500 rounded-full"></div>
                    <div className="w-3 h-3 bg-yellow-500 rounded-full"></div>
                    <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                    <span className="text-theme-muted text-sm ml-2">WealthKarma Financial Planner</span>
                  </div>
                  
                  {/* Mock App Interface */}
                  <div className="space-y-4">
                    <div className="bg-gradient-to-r from-theme-success/10 to-orange-500/10 border border-theme-success/20 rounded-lg p-4">
                      <div className="flex items-center gap-3 mb-3">
                        <Target className="w-5 h-5 text-theme-success" />
                        <span className="text-theme-light font-semibold">Emergency Fund</span>
                        <span className="text-theme-success text-sm">✓ Complete</span>
                      </div>
                      <div className="w-full bg-theme-tertiary rounded-full h-2">
                        <div className="bg-gradient-to-r from-green-500 to-green-400 h-2 rounded-full w-full"></div>
                      </div>
                      <div className="text-sm text-theme-secondary mt-2">AED 45,000 • 6 months expenses</div>
                    </div>
                    
                    <div className="bg-gradient-to-r from-blue-500/10 to-purple-500/10 border border-blue-500/20 rounded-lg p-4">
                      <div className="flex items-center gap-3 mb-3">
                        <PieChart className="w-5 h-5 text-blue-400" />
                        <span className="text-theme-light font-semibold">Home Down Payment</span>
                        <span className="text-blue-400 text-sm">68% Complete</span>
                      </div>
                      <div className="w-full bg-theme-tertiary rounded-full h-2">
                        <div className="bg-gradient-to-r from-blue-500 to-blue-400 h-2 rounded-full w-2/3"></div>
                      </div>
                      <div className="text-sm text-theme-secondary mt-2">AED 340,000 / AED 500,000</div>
                    </div>
                    
                    <div className="bg-gradient-to-r from-purple-500/10 to-pink-500/10 border border-purple-500/20 rounded-lg p-4">
                      <div className="flex items-center gap-3 mb-3">
                        <Calendar className="w-5 h-5 text-purple-400" />
                        <span className="text-theme-light font-semibold">Kids Education</span>
                        <span className="text-purple-400 text-sm">32% Complete</span>
                      </div>
                      <div className="w-full bg-theme-tertiary rounded-full h-2">
                        <div className="bg-gradient-to-r from-purple-500 to-purple-400 h-2 rounded-full w-1/3"></div>
                      </div>
                      <div className="text-sm text-theme-secondary mt-2">AED 96,000 / AED 300,000</div>
                    </div>
                  </div>
                  
                  <div className="mt-6 p-4 bg-gradient-to-r from-theme-success/5 to-orange-500/5 border border-theme-success/20 rounded-lg">
                    <div className="flex items-center gap-2 mb-2">
                      <Brain className="w-4 h-4 text-theme-success" />
                      <span className="text-theme-success font-semibold text-sm">AI Recommendation</span>
                    </div>
                    <p className="text-theme-secondary text-sm">
                      "Consider increasing your home fund by AED 500/month. You could reach your goal 3 months earlier!"
                    </p>
                  </div>
                </div>
                
                {/* Floating Elements */}
                <div className="absolute -top-4 -right-4 bg-green-500 text-white p-3 rounded-full shadow-lg animate-bounce">
                  <Calculator className="w-6 h-6" />
                </div>
                <div className="absolute -bottom-4 -left-4 bg-orange-500 text-white p-3 rounded-full shadow-lg animate-pulse">
                  <BarChart3 className="w-6 h-6" />
                </div>
              </div>
            </div>
          </div>
        </div>
        
        {/* Scroll Indicator - Centered */}
        <div className="absolute bottom-8 left-1/2 transform -translate-x-1/2 animate-bounce">
          <ArrowDown className="w-6 h-6 text-theme-muted" />
        </div>
      </section>

      {/* Social Proof Section */}
      <section id="testimonials" className="py-16 bg-theme-section backdrop-blur-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="heading-h2 mb-4">
              Trusted by 3,000+ GCC Expats
            </h2>
            <div className="flex justify-center items-center gap-1 mb-4">
              {[1,2,3,4,5].map(i => (
                <Star key={i} className="w-6 h-6 fill-yellow-400 text-yellow-400" />
              ))}
              <span className="ml-2 heading-stat text-theme-light">4.9/5</span>
              <span className="ml-2 text-theme-muted">from 847 reviews</span>
            </div>
          </div>
          
          <div className="max-w-4xl mx-auto">
            <div className="bg-theme-card border border-theme rounded-2xl p-8 shadow-theme-xl backdrop-blur-sm">
              <div className="text-center">
                <div className="flex justify-center items-center gap-1 mb-4">
                  {[1,2,3,4,5].map(i => (
                    <Star key={i} className="w-5 h-5 fill-yellow-400 text-yellow-400" />
                  ))}
                </div>
                <blockquote className="text-xl text-theme-secondary mb-6 leading-relaxed max-w-3xl mx-auto">
                  "{testimonials[currentTestimonial].text}"
                </blockquote>
                <div className="flex items-center justify-center gap-4">
                  <div className="w-12 h-12 bg-gradient-to-br from-green-500 to-orange-500 rounded-full flex items-center justify-center text-white font-bold">
                    {testimonials[currentTestimonial].name.charAt(0)}
                  </div>
                  <div className="text-left">
                    <div className="font-semibold text-theme-light">{testimonials[currentTestimonial].name}</div>
                    <div className="text-theme-muted text-sm">{testimonials[currentTestimonial].role}</div>
                    <div className="text-theme-success text-sm flex items-center gap-1">
                      <MapPin className="w-3 h-3" />
                      {testimonials[currentTestimonial].location}
                    </div>
                  </div>
                </div>
              </div>
            </div>
            
            {/* Testimonial Indicators - Centered */}
            <div className="flex justify-center gap-2 mt-6">
              {testimonials.map((_, index) => (
                <button
                  key={index}
                  onClick={() => setCurrentTestimonial(index)}
                  className={`w-3 h-3 rounded-full transition-all ${
                    index === currentTestimonial ? 'bg-theme-success' : 'bg-theme-tertiary'
                  }`}
                />
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="heading-h1 mb-4">
              Why WealthKarma Works for GCC Expats
            </h2>
            <p className="text-xl text-theme-secondary max-w-3xl mx-auto">
              Built specifically for the unique challenges and opportunities of expat life in the Gulf
            </p>
          </div>
          
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {features.map((feature, index) => (
              <div key={index} className="group bg-theme-card border border-theme rounded-2xl p-6 shadow-theme hover:shadow-theme-xl transition-all duration-300 hover:scale-105 backdrop-blur-sm text-center">
                <div className={`w-16 h-16 bg-gradient-to-br ${feature.color} rounded-xl flex items-center justify-center mx-auto mb-4 group-hover:scale-110 transition-transform shadow-lg`}>
                  <feature.icon className="w-8 h-8 text-white" />
                </div>
                <h3 className="heading-h3-sm mb-3">{feature.title}</h3>
                <p className="text-theme-secondary leading-relaxed">
                  {feature.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section id="how-it-works" className="py-20 bg-theme-section backdrop-blur-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="heading-h1 mb-4">
              How It Works
            </h2>
            <p className="text-xl text-theme-secondary">
              Get your complete financial plan in three simple steps
            </p>
          </div>
          
          <div className="max-w-5xl mx-auto">
            <div className="grid md:grid-cols-3 gap-8">
              <div className="text-center group">
                <div className="relative mb-6">
                  <div className="w-20 h-20 bg-gradient-to-br from-green-500 to-green-600 text-white rounded-full flex items-center justify-center mx-auto font-bold text-2xl shadow-lg group-hover:scale-110 transition-transform">
                    1
                  </div>
                  {/* Connecting Line */}
                  <div className="hidden md:block absolute top-10 left-full w-full h-0.5 bg-gradient-to-r from-green-500 to-orange-500"></div>
                </div>
                <h3 className="heading-h3-sm mb-4">Tell Us About You</h3>
                <p className="text-theme-secondary leading-relaxed max-w-sm mx-auto">
                  Share your nationality, location, income, and goals. Our smart form makes it quick and easy.
                </p>
                <div className="mt-4 text-sm text-theme-success font-semibold">⏱️ Takes 5 minutes</div>
              </div>

              <div className="text-center group">
                <div className="relative mb-6">
                  <div className="w-20 h-20 bg-gradient-to-br from-orange-500 to-orange-600 text-white rounded-full flex items-center justify-center mx-auto font-bold text-2xl shadow-lg group-hover:scale-110 transition-transform">
                    2
                  </div>
                  {/* Connecting Line */}
                  <div className="hidden md:block absolute top-10 left-full w-full h-0.5 bg-gradient-to-r from-orange-500 to-purple-500"></div>
                </div>
                <h3 className="heading-h3-sm mb-4">AI Creates Your Plan</h3>
                <p className="text-theme-secondary leading-relaxed max-w-sm mx-auto">
                  Our AI analyzes your situation and builds a complete 60-month financial roadmap with monthly actions.
                </p>
                <div className="mt-4 text-sm text-orange-400 font-semibold">🤖 AI-powered in 10 minutes</div>
              </div>

              <div className="text-center group">
                <div className="relative mb-6">
                  <div className="w-20 h-20 bg-gradient-to-br from-purple-500 to-purple-600 text-white rounded-full flex items-center justify-center mx-auto font-bold text-2xl shadow-lg group-hover:scale-110 transition-transform">
                    3
                  </div>
                </div>
                <h3 className="heading-h3-sm mb-4">Start Achieving Goals</h3>
                <p className="text-theme-secondary leading-relaxed max-w-sm mx-auto">
                  Download your plan or continue with AI coaching to track progress and optimize your strategy.
                </p>
                <div className="mt-4 text-sm text-purple-400 font-semibold">🎯 Start immediately</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Pricing Section */}
      <section className="py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="heading-h1 mb-4">
              Start Free, Upgrade When Ready
            </h2>
            <p className="text-xl text-theme-secondary">
              Get your complete financial plan at no cost, then choose ongoing AI coaching
            </p>
          </div>
          
          <div className="max-w-4xl mx-auto grid md:grid-cols-2 gap-8">
            {/* Free Plan */}
            <div className="bg-theme-card border border-theme rounded-2xl p-8 shadow-theme-lg backdrop-blur-sm">
              <div className="text-center mb-6">
                <h3 className="heading-h3-sm mb-2">Complete Financial Plan</h3>
                <p className="text-theme-secondary">Everything you need to get started</p>
              </div>
              
              <div className="text-center mb-8">
                <span className="heading-stat-xl text-theme-success font-bold">FREE</span>
                <p className="text-theme-secondary mt-2">No credit card required</p>
              </div>

              <ul className="space-y-4 mb-8">
                <li className="flex items-start gap-3">
                  <CheckCircle className="w-5 h-5 text-theme-success flex-shrink-0 mt-0.5" />
                  <span className="text-theme-secondary">Complete 60-month financial roadmap</span>
                </li>
                <li className="flex items-start gap-3">
                  <CheckCircle className="w-5 h-5 text-theme-success flex-shrink-0 mt-0.5" />
                  <span className="text-theme-secondary">Emergency fund + 3 major goals planning</span>
                </li>
                <li className="flex items-start gap-3">
                  <CheckCircle className="w-5 h-5 text-theme-success flex-shrink-0 mt-0.5" />
                  <span className="text-theme-secondary">GCC bank recommendations</span>
                </li>
                <li className="flex items-start gap-3">
                  <CheckCircle className="w-5 h-5 text-theme-success flex-shrink-0 mt-0.5" />
                  <span className="text-theme-secondary">Excel tracker with 4 worksheets</span>
                </li>
                <li className="flex items-start gap-3">
                  <CheckCircle className="w-5 h-5 text-theme-success flex-shrink-0 mt-0.5" />
                  <span className="text-theme-secondary">Implementation guide</span>
                </li>
              </ul>

              <button 
                onClick={handleStartPlanning}
                className="w-full bg-gradient-to-r from-green-500 to-orange-500 hover:from-green-600 hover:to-orange-600 text-gray-900 py-4 rounded-xl font-semibold text-lg transition-all duration-200 shadow-lg hover:shadow-xl transform hover:scale-105"
              >
                Start Your Free Plan Now
              </button>
            </div>

            {/* Premium Plan */}
            <div className="bg-gradient-to-br from-theme-success/10 to-orange-500/10 backdrop-blur-sm rounded-2xl border-2 border-theme-success/30 p-8 shadow-theme-xl relative">
              <div className="absolute -top-4 left-1/2 transform -translate-x-1/2 bg-gradient-to-r from-green-500 to-orange-500 text-gray-900 px-6 py-2 rounded-full text-sm font-semibold">
                Most Popular
              </div>
              
              <div className="text-center mb-6">
                <h3 className="heading-h3-sm mb-2">AI Coaching & Live Tracking</h3>
                <p className="text-theme-secondary">Ongoing optimization and support</p>
              </div>
              
              <div className="text-center mb-8">
                <span className="heading-stat-xl text-theme-light">$9.99</span>
                <span className="text-theme-secondary">/month</span>
                <p className="text-theme-secondary mt-2">30-day free trial</p>
              </div>

              <ul className="space-y-4 mb-8">
                <li className="flex items-start gap-3">
                  <CheckCircle className="w-5 h-5 text-theme-success flex-shrink-0 mt-0.5" />
                  <span className="text-theme-secondary">Everything in Free Plan</span>
                </li>
                <li className="flex items-start gap-3">
                  <CheckCircle className="w-5 h-5 text-theme-success flex-shrink-0 mt-0.5" />
                  <span className="text-theme-secondary">Live progress tracking dashboard</span>
                </li>
                <li className="flex items-start gap-3">
                  <CheckCircle className="w-5 h-5 text-theme-success flex-shrink-0 mt-0.5" />
                  <span className="text-theme-secondary">AI monthly coaching & optimization</span>
                </li>
                <li className="flex items-start gap-3">
                  <CheckCircle className="w-5 h-5 text-theme-success flex-shrink-0 mt-0.5" />
                  <span className="text-theme-secondary">Plan adapts to life changes</span>
                </li>
                <li className="flex items-start gap-3">
                  <CheckCircle className="w-5 h-5 text-theme-success flex-shrink-0 mt-0.5" />
                  <span className="text-theme-secondary">Achievement celebrations</span>
                </li>
              </ul>

              <button 
                onClick={handleStartPlanning}
                className="w-full bg-gradient-to-r from-green-500 to-orange-500 hover:from-green-600 hover:to-orange-600 text-gray-900 py-4 rounded-xl font-semibold text-lg transition-all duration-200 shadow-lg hover:shadow-xl transform hover:scale-105"
              >
                Start Free Trial
              </button>
              
              <p className="text-sm text-theme-muted text-center mt-4">
                Cancel anytime • No long-term commitment
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Final CTA */}
      <section className="py-20 bg-gradient-to-r from-theme-success/10 to-orange-500/10 backdrop-blur-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="heading-h1 mb-6">
            Ready to Take Control of Your Financial Future?
          </h2>
          <p className="text-xl text-theme-secondary mb-8 max-w-3xl mx-auto">
            Join thousands of GCC expats who've already built their financial roadmap. 
            Start your journey today - completely free, no strings attached.
          </p>
          
          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
            <button 
              onClick={handleStartPlanning}
              className="group bg-gradient-to-r from-green-500 to-orange-500 hover:from-green-600 hover:to-orange-600 text-gray-900 px-8 py-4 rounded-xl text-lg font-semibold transition-all duration-300 shadow-lg hover:shadow-2xl transform hover:scale-105 flex items-center gap-3 w-full sm:w-auto justify-center"
            >
              Start Your Free Financial Plan
              <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
            </button>
            
            <div className="text-theme-muted text-sm text-center">
              ✓ No signup required • ✓ 15 minutes to complete • ✓ Export and keep forever
            </div>
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
                  <div className="text-xs text-theme-muted">AI Financial Planner</div>
                </div>
              </div>
              <p className="text-theme-muted mb-4 max-w-md">
                AI-powered financial planning designed specifically for GCC expats. 
                Build your complete financial roadmap in 15 minutes.
              </p>
              <div className="flex gap-4">
                <div className="flex items-center gap-2 text-theme-muted">
                  <MapPin className="w-4 h-4" />
                  <span className="text-sm">Serving UAE, Saudi, Qatar, Kuwait, Bahrain, Oman</span>
                </div>
              </div>
            </div>
            
            <div>
              <h4 className="heading-h6 mb-4">Product</h4>
              <ul className="space-y-2 text-theme-muted">
                <li><a href="#features" className="hover:text-theme-success transition-colors">Features</a></li>
                <li><a href="#how-it-works" className="hover:text-theme-success transition-colors">How It Works</a></li>
                <li><a href="#testimonials" className="hover:text-theme-success transition-colors">Reviews</a></li>
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