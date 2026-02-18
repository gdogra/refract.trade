'use client'

import { useState } from 'react'
import { motion } from 'framer-motion'
import { ArrowRight, TrendingUp, Shield, Brain, Target, Users, BarChart3, CheckCircle, Star, Award, Zap } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card'
import { Badge } from '@/components/ui/badge'

const testimonials = [
  {
    name: "Sarah M.",
    title: "Portfolio Manager",
    tier: "Elite",
    quote: "Reduced my portfolio risk by 40% while maintaining returns. The AI insights are game-changing.",
    returns: "+127% this year",
    avatar: "SM"
  },
  {
    name: "Mike Chen", 
    title: "Day Trader",
    tier: "Pro",
    quote: "Finally, options analysis that makes sense. Went from losing money to consistent profits.",
    returns: "+89% last 6 months", 
    avatar: "MC"
  },
  {
    name: "David K.",
    title: "Investment Advisor",
    tier: "Enterprise",
    quote: "Institutional-grade analytics at retail prices. Essential for our client portfolios.",
    returns: "+156% avg client return",
    avatar: "DK"
  }
]

const features = [
  {
    icon: Brain,
    title: "AI-Powered Analysis",
    description: "Get institutional-grade insights with plain-English explanations for every trade"
  },
  {
    icon: Shield, 
    title: "Risk-First Design",
    description: "Every recommendation includes comprehensive risk analysis and portfolio impact"
  },
  {
    icon: Target,
    title: "Portfolio-Aware Strategies",
    description: "Context-driven recommendations based on your existing positions and risk budget"
  },
  {
    icon: BarChart3,
    title: "Real-Time Analytics",
    description: "Live Greeks, volatility surfaces, and probability modeling at your fingertips"
  },
  {
    icon: Users,
    title: "Community Intelligence", 
    description: "Learn from successful traders and share insights in our verified community"
  },
  {
    icon: Zap,
    title: "Automated Monitoring",
    description: "24/7 position monitoring with intelligent alerts for risk and opportunities"
  }
]

const pricingTiers = [
  {
    name: "Free",
    price: 0,
    period: "forever",
    description: "Perfect for getting started",
    features: [
      "3 AI recommendations daily",
      "Basic options chains (15min delay)",
      "Portfolio tracking",
      "Community access", 
      "Educational content",
      "Paper trading"
    ],
    cta: "Start Free",
    popular: false
  },
  {
    name: "Pro", 
    price: 39,
    period: "month",
    description: "Advanced analytics for active traders",
    features: [
      "Unlimited AI recommendations",
      "Real-time options data",
      "Advanced risk analytics",
      "Strategy builder & backtesting",
      "Portfolio optimization",
      "Custom alerts & monitoring",
      "API access (1K calls/month)"
    ],
    cta: "Start Pro Trial",
    popular: true
  },
  {
    name: "Elite",
    price: 149, 
    period: "month",
    description: "Institutional-grade intelligence",
    features: [
      "Everything in Pro",
      "Volatility surface analysis", 
      "Risk scenario modeling",
      "Multi-account support",
      "API access (10K calls/month)",
      "Priority support",
      "White-glove onboarding"
    ],
    cta: "Go Elite",
    popular: false
  }
]

export default function LandingPage() {
  const [email, setEmail] = useState('')

  const handleSignup = () => {
    // Track conversion
    if (typeof window !== 'undefined' && 'gtag' in window) {
      (window as any).gtag('event', 'signup_attempt', {
        event_category: 'engagement',
        event_label: 'hero_cta'
      })
    }
    
    // Redirect to signup
    window.location.href = '/auth/signup'
  }

  return (
    <div className="min-h-screen bg-white dark:bg-gray-900">
      {/* Hero Section */}
      <section className="relative overflow-hidden bg-gradient-to-br from-blue-50 to-purple-50 dark:from-blue-900/20 dark:to-purple-900/20">
        <div className="max-w-7xl mx-auto px-4 py-20">
          <motion.div 
            className="text-center max-w-4xl mx-auto"
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
          >
            <Badge className="bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200 mb-6">
              Used by 50,000+ active traders
            </Badge>
            
            <h1 className="text-5xl md:text-6xl font-bold text-gray-900 dark:text-white mb-6">
              Trade Options With
              <span className="bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent block">
                Institutional Intelligence
              </span>
              Not Guesswork
            </h1>
            
            <p className="text-xl text-gray-600 dark:text-gray-300 mb-8 max-w-2xl mx-auto">
              Discover, evaluate, and manage options trades with risk-aware AI used by serious traders. 
              Get portfolio-aware recommendations with institutional-grade analytics.
            </p>
            
            <div className="flex flex-col sm:flex-row gap-4 justify-center mb-8">
              <Button 
                size="lg"
                onClick={handleSignup}
                className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white px-8 py-4 text-lg"
              >
                Start Free — No Credit Card
                <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
              
              <Button 
                size="lg" 
                variant="outline"
                onClick={() => document.getElementById('top-trades')?.scrollIntoView({ behavior: 'smooth' })}
                className="px-8 py-4 text-lg border-2"
              >
                See Today's Top Low-Risk Trades
              </Button>
            </div>
            
            <div className="flex items-center justify-center space-x-6 text-sm text-gray-500 dark:text-gray-400">
              <div className="flex items-center space-x-1">
                <CheckCircle className="h-4 w-4 text-green-500" />
                <span>No installation required</span>
              </div>
              <div className="flex items-center space-x-1">
                <CheckCircle className="h-4 w-4 text-green-500" />
                <span>Works with any broker</span>
              </div>
              <div className="flex items-center space-x-1">
                <CheckCircle className="h-4 w-4 text-green-500" />
                <span>Free forever plan</span>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Problem Section */}
      <section className="py-20 bg-gray-50 dark:bg-gray-800">
        <div className="max-w-6xl mx-auto px-4">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="text-center mb-16"
          >
            <h2 className="text-4xl font-bold text-gray-900 dark:text-white mb-6">
              Why Most Options Traders Lose Money
            </h2>
            <p className="text-xl text-gray-600 dark:text-gray-300 max-w-3xl mx-auto">
              Options are complex, most platforms only execute trades, risk is poorly understood, 
              and retail traders lack professional tools.
            </p>
          </motion.div>

          <div className="grid md:grid-cols-2 gap-12 items-center">
            <motion.div
              initial={{ opacity: 0, x: -30 }}
              whileInView={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.6 }}
            >
              <div className="space-y-6">
                <div className="flex items-start space-x-4">
                  <div className="w-8 h-8 bg-red-100 dark:bg-red-900 rounded-full flex items-center justify-center flex-shrink-0">
                    <span className="text-red-600 dark:text-red-400 font-bold">1</span>
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                      Complex Calculations
                    </h3>
                    <p className="text-gray-600 dark:text-gray-300">
                      Greeks, volatility, time decay — the math is overwhelming without professional tools
                    </p>
                  </div>
                </div>
                
                <div className="flex items-start space-x-4">
                  <div className="w-8 h-8 bg-red-100 dark:bg-red-900 rounded-full flex items-center justify-center flex-shrink-0">
                    <span className="text-red-600 dark:text-red-400 font-bold">2</span>
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                      Execution-Only Platforms
                    </h3>
                    <p className="text-gray-600 dark:text-gray-300">
                      Brokers help you execute but don't help you decide what to trade or when
                    </p>
                  </div>
                </div>
                
                <div className="flex items-start space-x-4">
                  <div className="w-8 h-8 bg-red-100 dark:bg-red-900 rounded-full flex items-center justify-center flex-shrink-0">
                    <span className="text-red-600 dark:text-red-400 font-bold">3</span>
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                      Hidden Risk Exposure
                    </h3>
                    <p className="text-gray-600 dark:text-gray-300">
                      Portfolio-level risk is invisible until it's too late — correlation kills
                    </p>
                  </div>
                </div>
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, x: 30 }}
              whileInView={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.6 }}
              className="relative"
            >
              <div className="bg-white dark:bg-gray-900 p-8 rounded-2xl shadow-xl">
                <div className="text-red-500 text-center mb-4">
                  <TrendingDown className="h-12 w-12 mx-auto" />
                </div>
                <div className="text-center">
                  <div className="text-3xl font-bold text-gray-900 dark:text-white mb-2">90%</div>
                  <p className="text-gray-600 dark:text-gray-300">of options expire worthless</p>
                </div>
                <div className="mt-6 text-center">
                  <div className="text-2xl font-bold text-red-500 mb-2">-$12,000</div>
                  <p className="text-sm text-gray-500">Average annual loss per retail options trader</p>
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Solution Section */}
      <section className="py-20">
        <div className="max-w-6xl mx-auto px-4">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="text-center mb-16"
          >
            <h2 className="text-4xl font-bold text-gray-900 dark:text-white mb-6">
              The Intelligent Operating System for Options Trading
            </h2>
            <p className="text-xl text-gray-600 dark:text-gray-300 max-w-3xl mx-auto">
              Refract.trade gives you the same analytical edge used by hedge funds and institutions, 
              delivered through an intuitive interface designed for self-directed traders.
            </p>
          </motion.div>

          <div className="grid md:grid-cols-3 gap-8">
            {features.map((feature, index) => (
              <motion.div
                key={feature.title}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: index * 0.1 }}
              >
                <Card className="h-full border-gray-200 dark:border-gray-700 hover:shadow-lg transition-shadow">
                  <CardHeader className="text-center pb-4">
                    <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg flex items-center justify-center mx-auto mb-4">
                      <feature.icon className="h-6 w-6 text-white" />
                    </div>
                    <CardTitle className="text-xl font-semibold">{feature.title}</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-gray-600 dark:text-gray-300 text-center">
                      {feature.description}
                    </p>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Top Trades Section */}
      <section id="top-trades" className="py-20 bg-gray-50 dark:bg-gray-800">
        <div className="max-w-6xl mx-auto px-4">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="text-center mb-12"
          >
            <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-4">
              Today's Top Low-Risk Opportunities
            </h2>
            <p className="text-lg text-gray-600 dark:text-gray-300">
              AI-curated options plays with favorable risk/reward profiles
            </p>
          </motion.div>

          <div className="grid md:grid-cols-3 gap-6">
            {[
              { 
                symbol: "AAPL", 
                type: "Call", 
                strike: 195, 
                exp: "Mar 21", 
                premium: 3.40,
                probability: 72,
                maxReturn: 147,
                reason: "Bullish momentum above resistance, earnings beat expected"
              },
              { 
                symbol: "SPY", 
                type: "Put", 
                strike: 510, 
                exp: "Feb 28", 
                premium: 2.10,
                probability: 68,
                maxReturn: 238,
                reason: "Market hedging opportunity, VIX elevated, technical support"
              },
              { 
                symbol: "NVDA", 
                type: "Call", 
                strike: 140, 
                exp: "Mar 14", 
                premium: 4.80,
                probability: 75,
                maxReturn: 192,
                reason: "AI sector strength, institutional accumulation, breakout pattern"
              }
            ].map((trade, index) => (
              <motion.div
                key={trade.symbol}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: index * 0.1 }}
              >
                <Card className="border-gray-200 dark:border-gray-700">
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center space-x-3">
                        <div className="text-2xl font-bold text-gray-900 dark:text-white">
                          {trade.symbol}
                        </div>
                        <Badge className={trade.type === 'Call' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}>
                          {trade.type}
                        </Badge>
                      </div>
                      <div className="text-right">
                        <div className="text-lg font-semibold text-gray-900 dark:text-white">
                          ${trade.strike}
                        </div>
                        <div className="text-sm text-gray-500">{trade.exp}</div>
                      </div>
                    </div>
                    
                    <div className="grid grid-cols-2 gap-4 mb-4">
                      <div className="text-center">
                        <div className="text-sm text-gray-500 dark:text-gray-400">Premium</div>
                        <div className="text-lg font-semibold text-gray-900 dark:text-white">
                          ${trade.premium}
                        </div>
                      </div>
                      <div className="text-center">
                        <div className="text-sm text-gray-500 dark:text-gray-400">Max Return</div>
                        <div className="text-lg font-semibold text-green-600">
                          +{trade.maxReturn}%
                        </div>
                      </div>
                    </div>
                    
                    <div className="mb-4">
                      <div className="flex items-center justify-between text-sm mb-2">
                        <span className="text-gray-500 dark:text-gray-400">Probability of Profit</span>
                        <span className="text-gray-900 dark:text-white font-medium">{trade.probability}%</span>
                      </div>
                      <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                        <motion.div 
                          className="bg-gradient-to-r from-green-500 to-emerald-500 h-2 rounded-full"
                          initial={{ width: 0 }}
                          whileInView={{ width: `${trade.probability}%` }}
                          transition={{ duration: 1, delay: 0.5 }}
                        />
                      </div>
                    </div>
                    
                    <p className="text-sm text-gray-600 dark:text-gray-300 mb-4">
                      {trade.reason}
                    </p>
                    
                    <Button 
                      variant="outline" 
                      size="sm" 
                      className="w-full"
                      onClick={() => window.open('/auth/signup', '_blank')}
                    >
                      View Full Analysis
                    </Button>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
          
          <div className="text-center mt-8">
            <Button 
              size="lg"
              onClick={handleSignup}
              className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-4"
            >
              Get All Recommendations Free
              <ArrowRight className="ml-2 h-5 w-5" />
            </Button>
          </div>
        </div>
      </section>

      {/* Social Proof Section */}
      <section className="py-20">
        <div className="max-w-6xl mx-auto px-4">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="text-center mb-16"
          >
            <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-4">
              Trusted by Successful Traders
            </h2>
            <p className="text-lg text-gray-600 dark:text-gray-300">
              See how Refract.trade is transforming trading results
            </p>
          </motion.div>

          <div className="grid md:grid-cols-3 gap-8">
            {testimonials.map((testimonial, index) => (
              <motion.div
                key={testimonial.name}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: index * 0.1 }}
              >
                <Card className="h-full border-gray-200 dark:border-gray-700">
                  <CardContent className="p-6">
                    <div className="flex items-center space-x-3 mb-4">
                      <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white font-semibold">
                        {testimonial.avatar}
                      </div>
                      <div>
                        <div className="font-semibold text-gray-900 dark:text-white">
                          {testimonial.name}
                        </div>
                        <div className="text-sm text-gray-500 dark:text-gray-400 flex items-center space-x-2">
                          <span>{testimonial.title}</span>
                          <Badge className="bg-purple-100 text-purple-800 text-xs">
                            {testimonial.tier}
                          </Badge>
                        </div>
                      </div>
                    </div>
                    
                    <blockquote className="text-gray-700 dark:text-gray-300 mb-4">
                      "{testimonial.quote}"
                    </blockquote>
                    
                    <div className="text-center p-3 bg-green-50 dark:bg-green-900/20 rounded-lg">
                      <div className="text-lg font-bold text-green-600 dark:text-green-400">
                        {testimonial.returns}
                      </div>
                      <div className="text-xs text-gray-500 dark:text-gray-400">
                        Performance
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
          
          <div className="text-center mt-12">
            <div className="flex justify-center items-center space-x-8 text-gray-500 dark:text-gray-400">
              <div className="flex items-center space-x-2">
                <Award className="h-5 w-5" />
                <span>Featured in TechCrunch</span>
              </div>
              <div className="flex items-center space-x-2">
                <Star className="h-5 w-5" />
                <span>4.8/5 on Product Hunt</span>
              </div>
              <div className="flex items-center space-x-2">
                <Users className="h-5 w-5" />
                <span>50,000+ active users</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Pricing Section */}
      <section className="py-20 bg-gray-50 dark:bg-gray-800">
        <div className="max-w-6xl mx-auto px-4">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="text-center mb-16"
          >
            <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-4">
              Choose Your Trading Intelligence Level
            </h2>
            <p className="text-lg text-gray-600 dark:text-gray-300">
              Start free, upgrade when you need more power
            </p>
          </motion.div>

          <div className="grid md:grid-cols-3 gap-8">
            {pricingTiers.map((tier, index) => (
              <motion.div
                key={tier.name}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: index * 0.1 }}
                className="relative"
              >
                {tier.popular && (
                  <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
                    <Badge className="bg-gradient-to-r from-blue-600 to-purple-600 text-white px-3 py-1">
                      Most Popular
                    </Badge>
                  </div>
                )}
                
                <Card className={`h-full ${tier.popular ? 'ring-2 ring-blue-500 shadow-lg' : 'border-gray-200 dark:border-gray-700'}`}>
                  <CardHeader className="text-center pb-6">
                    <CardTitle className="text-2xl font-bold text-gray-900 dark:text-white">
                      {tier.name}
                    </CardTitle>
                    <div className="text-center">
                      <div className="text-4xl font-bold text-gray-900 dark:text-white">
                        ${tier.price}
                        <span className="text-lg font-normal text-gray-500 dark:text-gray-400">
                          /{tier.period}
                        </span>
                      </div>
                      <p className="text-gray-600 dark:text-gray-300 mt-2">
                        {tier.description}
                      </p>
                    </div>
                  </CardHeader>
                  
                  <CardContent className="space-y-4">
                    <ul className="space-y-3">
                      {tier.features.map((feature, idx) => (
                        <li key={idx} className="flex items-start space-x-2">
                          <CheckCircle className="h-4 w-4 text-green-500 mt-0.5 flex-shrink-0" />
                          <span className="text-sm text-gray-600 dark:text-gray-300">{feature}</span>
                        </li>
                      ))}
                    </ul>
                    
                    <Button 
                      className={`w-full mt-6 ${
                        tier.popular 
                          ? 'bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white'
                          : 'bg-gray-900 dark:bg-gray-700 hover:bg-gray-800 text-white'
                      }`}
                      onClick={handleSignup}
                    >
                      {tier.cta}
                    </Button>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
          
          <div className="text-center mt-12">
            <p className="text-gray-500 dark:text-gray-400 mb-4">
              Need custom solutions for your institution?
            </p>
            <Button variant="outline" size="lg">
              Contact Sales for Enterprise Pricing
            </Button>
          </div>
        </div>
      </section>

      {/* Final CTA Section */}
      <section className="py-20 bg-gradient-to-br from-blue-900 to-purple-900">
        <div className="max-w-4xl mx-auto px-4 text-center">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
          >
            <h2 className="text-4xl font-bold text-white mb-6">
              Upgrade Your Trading Intelligence
            </h2>
            <p className="text-xl text-blue-100 mb-8">
              Join thousands of traders who've transformed their results with institutional-grade analytics
            </p>
            
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button 
                size="lg"
                onClick={handleSignup}
                className="bg-white text-blue-900 hover:bg-gray-100 px-8 py-4 text-lg font-semibold"
              >
                Start Free Account
                <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
              
              <Button 
                size="lg"
                variant="outline"
                className="border-2 border-white text-white hover:bg-white hover:text-blue-900 px-8 py-4 text-lg"
                onClick={() => window.open('/demo', '_blank')}
              >
                Watch 2-Minute Demo
              </Button>
            </div>
            
            <div className="flex items-center justify-center space-x-6 mt-8 text-sm text-blue-200">
              <div className="flex items-center space-x-1">
                <CheckCircle className="h-4 w-4" />
                <span>Free forever plan</span>
              </div>
              <div className="flex items-center space-x-1">
                <CheckCircle className="h-4 w-4" />
                <span>Cancel anytime</span>
              </div>
              <div className="flex items-center space-x-1">
                <CheckCircle className="h-4 w-4" />
                <span>30-day money-back guarantee</span>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Legal Footer */}
      <footer className="bg-gray-900 dark:bg-black py-12">
        <div className="max-w-6xl mx-auto px-4">
          <div className="grid md:grid-cols-4 gap-8">
            <div className="md:col-span-2">
              <div className="text-2xl font-bold text-white mb-4">Refract.trade</div>
              <p className="text-gray-400 text-sm leading-relaxed">
                The intelligent operating system for self-directed options trading. 
                Institutional-grade analytics made accessible for retail traders.
              </p>
            </div>
            
            <div>
              <h3 className="text-white font-semibold mb-3">Product</h3>
              <ul className="space-y-2 text-sm text-gray-400">
                <li><a href="/features" className="hover:text-white">Features</a></li>
                <li><a href="/pricing" className="hover:text-white">Pricing</a></li>
                <li><a href="/api" className="hover:text-white">API</a></li>
                <li><a href="/integrations" className="hover:text-white">Integrations</a></li>
              </ul>
            </div>
            
            <div>
              <h3 className="text-white font-semibold mb-3">Legal</h3>
              <ul className="space-y-2 text-sm text-gray-400">
                <li><a href="/privacy" className="hover:text-white">Privacy Policy</a></li>
                <li><a href="/terms" className="hover:text-white">Terms of Service</a></li>
                <li><a href="/disclaimers" className="hover:text-white">Risk Disclaimers</a></li>
                <li><a href="/compliance" className="hover:text-white">Compliance</a></li>
              </ul>
            </div>
          </div>
          
          <div className="border-t border-gray-800 mt-8 pt-8">
            <div className="text-center text-sm text-gray-500">
              <p className="mb-2">
                <strong>Important Disclaimers:</strong> This information is for educational purposes only and does not constitute financial advice. 
                Options trading involves substantial risk and is not suitable for all investors. 
                Past performance does not guarantee future results.
              </p>
              <p>
                © 2024 Refract.trade. All rights reserved. | 
                Securities offered through partner broker-dealers, members FINRA/SIPC.
              </p>
            </div>
          </div>
        </div>
      </footer>
    </div>
  )
}