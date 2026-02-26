'use client'

import React, { useState, useRef, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { MessageCircle, X, Send, Bot, User, Sparkles, TrendingUp, AlertTriangle, Calculator, Brain, Mic, MicOff } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { Card, CardContent, CardHeader } from '@/components/ui/Card'

interface ChatMessage {
  id: string
  type: 'user' | 'bot'
  content: string
  timestamp: Date
  isTyping?: boolean
  context?: {
    symbol?: string
    position?: any
    marketData?: any
  }
  actions?: Array<{
    label: string
    action: string
    data?: any
  }>
}

interface AIContext {
  currentSymbol?: string
  currentPosition?: any
  portfolioValue?: number
  marketCondition?: 'bullish' | 'bearish' | 'neutral' | 'volatile'
  riskLevel?: 'low' | 'medium' | 'high'
  tradingSession?: 'pre-market' | 'market' | 'after-hours'
}

interface AIChatbotProps {
  className?: string
  context?: AIContext
  onAction?: (action: string, data?: any) => void
}

export default function AIChatbot({ className = '', context = {}, onAction }: AIChatbotProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: '1',
      type: 'bot',
      content: getContextualGreeting(context),
      timestamp: new Date(),
      actions: [
        { label: 'Analyze Portfolio', action: 'analyze_portfolio' },
        { label: 'Market Overview', action: 'market_overview' },
        { label: 'Risk Check', action: 'risk_check' }
      ]
    }
  ])
  const [inputMessage, setInputMessage] = useState('')
  const [isTyping, setIsTyping] = useState(false)
  const [isListening, setIsListening] = useState(false)
  const [conversationMode, setConversationMode] = useState<'casual' | 'technical' | 'educational'>('casual')
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)
  const recognitionRef = useRef<any>(null)

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  function getContextualGreeting(context: AIContext): string {
    const timeOfDay = new Date().getHours()
    let greeting = timeOfDay < 12 ? '🌅 Good morning!' : timeOfDay < 17 ? '☀️ Good afternoon!' : '🌙 Good evening!'
    
    let contextMessage = "I'm your AI trading assistant."
    
    if (context.currentSymbol) {
      contextMessage += ` I see you're looking at ${context.currentSymbol}.`
    }
    
    if (context.riskLevel === 'high') {
      contextMessage += ' ⚠️ I notice your portfolio risk is elevated. Want me to analyze it?'
    } else if (context.marketCondition === 'volatile') {
      contextMessage += ' 📊 Markets are volatile today. Need help adjusting your positions?'
    }
    
    return `${greeting} ${contextMessage} How can I help you trade smarter today?`
  }

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  useEffect(() => {
    if (isOpen && inputRef.current) {
      inputRef.current.focus()
    }
  }, [isOpen])

  const getAIResponse = async (userMessage: string): Promise<{ content: string, actions?: Array<{label: string, action: string, data?: any}> }> => {
    const lowerMessage = userMessage.toLowerCase()
    
    // Contextual responses based on current state
    if (context.currentSymbol && (lowerMessage.includes('analyze') || lowerMessage.includes(context.currentSymbol.toLowerCase()))) {
      return {
        content: `📊 **${context.currentSymbol} Analysis**\n\n• Current Price: $${(Math.random() * 200 + 100).toFixed(2)}\n• IV Rank: ${(Math.random() * 100).toFixed(0)}th percentile\n• Options Flow: Mostly bullish\n• Next Earnings: ${Math.floor(Math.random() * 30)} days\n\n**AI Recommendation**: Consider covered calls or cash-secured puts based on your outlook.`,
        actions: [
          { label: 'View Options Chain', action: 'view_options_chain', data: { symbol: context.currentSymbol } },
          { label: 'Strategy Builder', action: 'open_strategy_builder', data: { symbol: context.currentSymbol } }
        ]
      }
    }
    
    const responses: Record<string, { content: string, actions?: Array<{label: string, action: string, data?: any}> }> = {
      'portfolio': {
        content: `📈 **Portfolio Analysis**\n\nTotal Value: $${context.portfolioValue?.toLocaleString() || '125,430'}\nRisk Level: ${context.riskLevel || 'Medium'}\nCurrent Delta: +12.5\nTheta Decay: -$45/day\n\n${context.riskLevel === 'high' ? '⚠️ **Risk Alert**: Consider reducing position sizes or adding hedges.' : '✅ **Healthy Portfolio**: Well-balanced risk exposure.'}`,
        actions: [
          { label: 'Risk Dashboard', action: 'open_risk_dashboard' },
          { label: 'Position Optimizer', action: 'optimize_positions' },
          { label: 'Add Hedge', action: 'suggest_hedge' }
        ]
      },
      'risk': {
        content: "🛡️ **Advanced Risk Management**\n\n• **Real-time Greeks Monitoring**: Track Delta, Gamma, Theta, Vega\n• **Stress Testing**: See how positions perform in market crashes\n• **Correlation Analysis**: Identify concentrated risks\n• **Liquidity Scoring**: Ensure you can exit when needed\n• **Options Flow Alerts**: Track institutional movements\n\nOur AI continuously monitors 127 risk factors across your portfolio.",
        actions: [
          { label: 'Run Stress Test', action: 'stress_test' },
          { label: 'Risk Heatmap', action: 'risk_heatmap' },
          { label: 'Set Alerts', action: 'setup_alerts' }
        ]
      },
      'earnings': {
        content: "📅 **Earnings Intelligence**\n\n• **Volatility Predictor**: AI forecasts IV crush probability\n• **Historical Patterns**: How stock moved post-earnings\n• **Options Flow**: Unusual activity before announcements\n• **Strategy Recommendations**: Best plays for earnings\n\nNext week: AAPL (Mon), TSLA (Wed), META (Thu)",
        actions: [
          { label: 'Earnings Calendar', action: 'earnings_calendar' },
          { label: 'IV Crush Scanner', action: 'iv_scanner' },
          { label: 'Earnings Strategies', action: 'earnings_strategies' }
        ]
      },
      'market': {
        content: `🌍 **Market Intelligence**\n\nCondition: ${context.marketCondition || 'Neutral'}\nVIX Level: ${(Math.random() * 30 + 10).toFixed(1)}\nSector Rotation: Tech → Value\nOptions Flow: Defensive\n\n**Key Levels**: SPY 480 support, 485 resistance\n**AI Outlook**: Expect continued volatility through month-end.`,
        actions: [
          { label: 'Market Dashboard', action: 'market_dashboard' },
          { label: 'Options Flow', action: 'options_flow' },
          { label: 'Volatility Map', action: 'volatility_map' }
        ]
      },
      'strategy': {
        content: "🎯 **Smart Strategy Selection**\n\nBased on current market conditions:\n\n• **High IV Environment**: Iron Condors, Credit Spreads\n• **Low IV Environment**: Straddles, Calendar Spreads\n• **Trending Markets**: Covered Calls, Cash-Secured Puts\n• **Volatile Markets**: Iron Butterflies, Protective Collars\n\nOur AI analyzes 50+ market factors to recommend optimal strategies.",
        actions: [
          { label: 'Strategy Builder', action: 'strategy_builder' },
          { label: 'Backtest Ideas', action: 'backtest_strategies' },
          { label: 'Paper Trade', action: 'paper_trade' }
        ]
      },
      'ai': {
        content: "🤖 **Advanced AI Features**\n\n• **Predictive Analytics**: 72% accuracy on price movements\n• **Sentiment Analysis**: Social media & news impact\n• **Options Flow Detection**: Institutional money tracking\n• **Risk Prediction**: Early warning system\n• **Performance Attribution**: What's working and why\n\nYour AI Score: 8.5/10 (Excellent risk management)",
        actions: [
          { label: 'AI Dashboard', action: 'ai_dashboard' },
          { label: 'Predictions', action: 'view_predictions' },
          { label: 'Performance AI', action: 'performance_ai' }
        ]
      }
    }
    
    for (const [keyword, response] of Object.entries(responses)) {
      if (lowerMessage.includes(keyword)) {
        return response
      }
    }

    // Fallback with contextual suggestions
    return {
      content: `💡 I can help you with many trading topics! Based on current market conditions, you might be interested in:\n\n• Portfolio risk analysis (your current risk: ${context.riskLevel || 'medium'})\n• ${context.currentSymbol || 'SPY'} options strategies\n• Market volatility insights\n• Earnings plays and IV crush protection\n\nWhat would you like to explore?`,
      actions: [
        { label: 'Quick Risk Check', action: 'risk_check' },
        { label: 'Market Update', action: 'market_update' },
        { label: 'Strategy Ideas', action: 'strategy_ideas' }
      ]
    }
  }

  const handleSendMessage = async () => {
    if (!inputMessage.trim()) return

    const userMessage: ChatMessage = {
      id: Date.now().toString(),
      type: 'user',
      content: inputMessage,
      timestamp: new Date(),
      context: {
        symbol: context.currentSymbol,
        position: context.currentPosition
      }
    }

    setMessages(prev => [...prev, userMessage])
    setInputMessage('')
    setIsTyping(true)

    // Simulate AI thinking time
    setTimeout(async () => {
      const aiResponse = await getAIResponse(inputMessage)
      const botMessage: ChatMessage = {
        id: (Date.now() + 1).toString(),
        type: 'bot',
        content: aiResponse.content,
        timestamp: new Date(),
        actions: aiResponse.actions
      }
      
      setMessages(prev => [...prev, botMessage])
      setIsTyping(false)
    }, 800 + Math.random() * 1200)
  }

  const handleAction = (action: string, data?: any) => {
    if (onAction) {
      onAction(action, data)
    }
    
    // Add confirmation message
    const confirmationMessage: ChatMessage = {
      id: Date.now().toString(),
      type: 'bot',
      content: `✅ Opening ${action.replace('_', ' ')}...`,
      timestamp: new Date()
    }
    setMessages(prev => [...prev, confirmationMessage])
  }

  const startVoiceInput = () => {
    if ('webkitSpeechRecognition' in window) {
      const recognition = new (window as any).webkitSpeechRecognition()
      recognitionRef.current = recognition
      
      recognition.continuous = false
      recognition.interimResults = false
      recognition.lang = 'en-US'
      
      recognition.onstart = () => setIsListening(true)
      recognition.onend = () => setIsListening(false)
      recognition.onerror = () => setIsListening(false)
      
      recognition.onresult = (event: any) => {
        const transcript = event.results[0][0].transcript
        setInputMessage(transcript)
        setTimeout(() => handleSendMessage(), 500)
      }
      
      recognition.start()
    }
  }

  const stopVoiceInput = () => {
    if (recognitionRef.current) {
      recognitionRef.current.stop()
    }
    setIsListening(false)
  }

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSendMessage()
    }
  }

  const getContextualQuestions = () => {
    const base = [
      "Analyze my portfolio risk",
      "Show me today's market intelligence",
      "What strategies work now?"
    ]
    
    if (context.currentSymbol) {
      base.unshift(`Analyze ${context.currentSymbol}`)
    }
    
    if (context.riskLevel === 'high') {
      base.unshift('Help reduce my risk')
    }
    
    return base.slice(0, 3)
  }

  return (
    <>
      {/* Chat Toggle Button */}
      <motion.div
        className={`fixed bottom-6 right-6 z-50 ${className}`}
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        transition={{ delay: 1, type: "spring", stiffness: 260, damping: 20 }}
      >
        <Button
          onClick={() => setIsOpen(!isOpen)}
          className="h-14 w-14 rounded-full bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 shadow-lg"
        >
          <AnimatePresence mode="wait">
            {isOpen ? (
              <motion.div
                key="close"
                initial={{ rotate: -90, opacity: 0 }}
                animate={{ rotate: 0, opacity: 1 }}
                exit={{ rotate: 90, opacity: 0 }}
                transition={{ duration: 0.2 }}
              >
                <X className="h-6 w-6" />
              </motion.div>
            ) : (
              <motion.div
                key="chat"
                initial={{ rotate: 90, opacity: 0 }}
                animate={{ rotate: 0, opacity: 1 }}
                exit={{ rotate: -90, opacity: 0 }}
                transition={{ duration: 0.2 }}
              >
                <MessageCircle className="h-6 w-6" />
              </motion.div>
            )}
          </AnimatePresence>
        </Button>
      </motion.div>

      {/* Chat Window */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, scale: 0.8, y: 100 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.8, y: 100 }}
            transition={{ type: "spring", stiffness: 300, damping: 30 }}
            className="fixed bottom-24 right-6 z-50 w-96 h-[500px] max-w-[calc(100vw-3rem)]"
          >
            <Card className="h-full flex flex-col bg-white dark:bg-gray-800 shadow-2xl border-0">
              <CardHeader className="bg-gradient-to-r from-purple-600 to-blue-600 text-white rounded-t-lg p-4">
                <div className="flex items-center space-x-3">
                  <div className="relative">
                    <Bot className="h-8 w-8" />
                    <div className="absolute -top-1 -right-1 h-3 w-3 bg-green-500 rounded-full animate-pulse" />
                  </div>
                  <div>
                    <h3 className="font-semibold">AI Trading Assistant</h3>
                    <p className="text-sm opacity-90">Always here to help</p>
                  </div>
                  <Sparkles className="h-4 w-4 ml-auto" />
                </div>
              </CardHeader>

              {/* Messages */}
              <div className="flex-1 overflow-y-auto p-4 space-y-3">
                {messages.map((message) => (
                  <motion.div
                    key={message.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className={`flex ${message.type === 'user' ? 'justify-end' : 'justify-start'}`}
                  >
                    <div className={`max-w-[80%] p-3 rounded-lg ${
                      message.type === 'user' 
                        ? 'bg-purple-600 text-white' 
                        : 'bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-white'
                    }`}>
                      <div className="flex items-start space-x-2">
                        {message.type === 'bot' && (
                          <Bot className="h-4 w-4 mt-0.5 text-purple-600 dark:text-purple-400 flex-shrink-0" />
                        )}
                        <div className="text-sm whitespace-pre-line flex-1">
                          {message.content}
                        </div>
                        {message.type === 'user' && (
                          <User className="h-4 w-4 mt-0.5 flex-shrink-0" />
                        )}
                      </div>
                    </div>
                  </motion.div>
                ))}
                
                {isTyping && (
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="flex justify-start"
                  >
                    <div className="bg-gray-100 dark:bg-gray-700 p-3 rounded-lg flex items-center space-x-2">
                      <Bot className="h-4 w-4 text-purple-600 dark:text-purple-400" />
                      <div className="flex space-x-1">
                        <div className="w-2 h-2 bg-gray-500 rounded-full animate-bounce" style={{animationDelay: '0ms'}} />
                        <div className="w-2 h-2 bg-gray-500 rounded-full animate-bounce" style={{animationDelay: '150ms'}} />
                        <div className="w-2 h-2 bg-gray-500 rounded-full animate-bounce" style={{animationDelay: '300ms'}} />
                      </div>
                    </div>
                  </motion.div>
                )}
                
                <div ref={messagesEndRef} />
              </div>

              {/* Action Buttons for Bot Messages */}
              {messages.map(message => (
                message.type === 'bot' && message.actions && (
                  <motion.div
                    key={`actions-${message.id}`}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="px-4 pb-2"
                  >
                    <div className="flex flex-wrap gap-1">
                      {message.actions.map((action, idx) => (
                        <Button
                          key={`${message.id}-${idx}`}
                          size="sm"
                          variant="outline"
                          onClick={() => handleAction(action.action, action.data)}
                          className="text-xs h-6 px-2 bg-purple-50 hover:bg-purple-100 text-purple-700 border-purple-200"
                        >
                          {action.label}
                        </Button>
                      ))}
                    </div>
                  </motion.div>
                )
              ))}

              {/* Quick Questions */}
              {(messages?.length || 0) === 1 && (
                <div className="px-4 py-2 border-t border-gray-200 dark:border-gray-700">
                  <p className="text-xs text-gray-600 dark:text-gray-400 mb-2">Quick actions:</p>
                  <div className="flex flex-wrap gap-1">
                    {getContextualQuestions().map((question) => (
                      <Button
                        key={question}
                        size="sm"
                        variant="outline"
                        onClick={() => {
                          setInputMessage(question)
                          handleSendMessage()
                        }}
                        className="text-xs h-6 px-2"
                      >
                        {question}
                      </Button>
                    ))}
                  </div>
                </div>
              )}

              {/* Input Area */}
              <div className="p-4 border-t border-gray-200 dark:border-gray-700">
                <div className="flex space-x-2">
                  <div className="flex-1 relative">
                    <input
                      ref={inputRef}
                      type="text"
                      value={inputMessage}
                      onChange={(e) => setInputMessage(e.target.value)}
                      onKeyPress={handleKeyPress}
                      placeholder={isListening ? "Listening..." : "Ask me anything about options trading..."}
                      className="w-full px-3 py-2 pr-10 border border-gray-300 dark:border-gray-600 rounded-lg text-sm
                               bg-white dark:bg-gray-700 text-gray-900 dark:text-white
                               focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                      disabled={isTyping || isListening}
                    />
                    {/* Voice Input Button */}
                    <button
                      onClick={isListening ? stopVoiceInput : startVoiceInput}
                      className={`absolute right-2 top-1/2 -translate-y-1/2 p-1 rounded-md transition-colors ${
                        isListening ? 'text-red-500 hover:bg-red-50' : 'text-gray-400 hover:text-purple-500 hover:bg-purple-50'
                      }`}
                      title={isListening ? 'Stop listening' : 'Voice input'}
                    >
                      {isListening ? <MicOff className="h-4 w-4" /> : <Mic className="h-4 w-4" />}
                    </button>
                  </div>
                  <Button
                    onClick={handleSendMessage}
                    disabled={!inputMessage.trim() || isTyping}
                    size="sm"
                    className="bg-purple-600 hover:bg-purple-700 px-3"
                  >
                    <Send className="h-4 w-4" />
                  </Button>
                </div>
                <div className="flex justify-between items-center mt-1">
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    {isListening ? '🎤 Listening...' : 'Press Enter to send or 🎤 for voice'}
                  </p>
                  <div className="flex space-x-1">
                    {(['casual', 'technical', 'educational'] as const).map(mode => (
                      <button
                        key={mode}
                        onClick={() => setConversationMode(mode)}
                        className={`text-xs px-2 py-1 rounded transition-colors ${
                          conversationMode === mode
                            ? 'bg-purple-100 text-purple-700'
                            : 'text-gray-400 hover:text-gray-600'
                        }`}
                        title={`Switch to ${mode} mode`}
                      >
                        {mode.charAt(0).toUpperCase()}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </Card>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  )
}