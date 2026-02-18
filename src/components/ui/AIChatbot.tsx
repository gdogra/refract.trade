'use client'

import React, { useState, useRef, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { MessageCircle, X, Send, Bot, User, Sparkles } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { Card, CardContent, CardHeader } from '@/components/ui/Card'

interface ChatMessage {
  id: string
  type: 'user' | 'bot'
  content: string
  timestamp: Date
}

interface AIChatbotProps {
  className?: string
}

export default function AIChatbot({ className = '' }: AIChatbotProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: '1',
      type: 'bot',
      content: "👋 Hi! I'm your AI trading assistant. I can help you understand options trading, explain features, analyze strategies, or answer questions about the platform. What would you like to know?",
      timestamp: new Date()
    }
  ])
  const [inputMessage, setInputMessage] = useState('')
  const [isTyping, setIsTyping] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  useEffect(() => {
    if (isOpen && inputRef.current) {
      inputRef.current.focus()
    }
  }, [isOpen])

  const getAIResponse = async (userMessage: string): Promise<string> => {
    const responses = {
      'what': "I can help you with various aspects of options trading and our platform. Try asking about specific features, trading strategies, or risk management concepts.",
      'risk': "Risk management is crucial in options trading. Our platform offers:\n\n• Real-time portfolio Greeks monitoring\n• Worst-case scenario analysis\n• Automated position sizing\n• Stop-loss recommendations\n• Market regime analysis\n\nWould you like to know more about any specific risk management feature?",
      'strategy': "Our platform supports various options strategies:\n\n• Iron Condors (neutral market)\n• Credit Spreads (directional bias)\n• Strangles & Straddles (volatility plays)\n• Covered Calls (income generation)\n• Protective Puts (portfolio insurance)\n\nEach strategy comes with AI-powered entry/exit signals and risk analysis.",
      'ai': "Our AI features include:\n\n🧠 **Predictive Analytics**: Forecasts market movements and position adjustments\n📊 **Portfolio Optimization**: Suggests optimal position sizing and allocation\n⚡ **Real-time Alerts**: Proactive notifications before losses occur\n🎯 **Strategy Recommendations**: AI suggests best strategies based on market conditions\n📈 **Performance Analysis**: Tracks and improves your trading patterns",
      'analytics': "Our analytics dashboard provides:\n\n📊 **Portfolio Overview**: Real-time P&L and risk metrics\n🔍 **Opportunities Scanner**: AI-powered trade discovery\n🛡️ **Risk Analysis**: Worst-case scenario planning\n📈 **Performance Tracking**: Strategy-by-strategy breakdowns\n👁️ **Options Flow**: Institutional money movements\n⚡ **Volatility Intelligence**: IV surface analysis",
      'volatility': "Volatility analysis includes:\n\n• **IV Rank**: Where current volatility sits historically\n• **Surface Analysis**: 3D visualization of option prices\n• **Regime Detection**: Identifies low/high vol environments\n• **Mean Reversion Signals**: When volatility might normalize\n• **Earnings Impact**: How events affect option pricing",
      'help': "I can assist with:\n\n🎯 **Trading Strategies**: Explain and analyze options strategies\n📊 **Platform Features**: Guide you through our tools\n⚠️ **Risk Management**: Help you understand and manage risk\n📈 **Market Analysis**: Interpret market conditions\n🤖 **AI Features**: Explain how our AI assists your trading\n\nJust ask me anything about options trading or our platform!",
      'greeks': "The Greeks measure option price sensitivities:\n\n• **Delta**: Price sensitivity to underlying movement\n• **Gamma**: How Delta changes with price moves\n• **Theta**: Time decay - how options lose value daily\n• **Vega**: Volatility sensitivity\n• **Rho**: Interest rate sensitivity\n\nOur platform monitors all Greeks in real-time and alerts you when adjustments are needed."
    }

    const lowerMessage = userMessage.toLowerCase()
    
    for (const [keyword, response] of Object.entries(responses)) {
      if (lowerMessage.includes(keyword)) {
        return response
      }
    }

    return "That's a great question! While I don't have specific information about that topic, I can help with:\n\n• Options trading strategies and concepts\n• Platform features and navigation\n• Risk management techniques\n• Market analysis and volatility\n• AI features and analytics\n\nTry asking about any of these topics, or be more specific about what you'd like to learn!"
  }

  const handleSendMessage = async () => {
    if (!inputMessage.trim()) return

    const userMessage: ChatMessage = {
      id: Date.now().toString(),
      type: 'user',
      content: inputMessage,
      timestamp: new Date()
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
        content: aiResponse,
        timestamp: new Date()
      }
      
      setMessages(prev => [...prev, botMessage])
      setIsTyping(false)
    }, 1000 + Math.random() * 1000)
  }

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSendMessage()
    }
  }

  const quickQuestions = [
    "How do I manage risk?",
    "What trading strategies work best?",
    "How does the AI help me trade?",
    "Explain the analytics dashboard",
    "What are the Greeks?"
  ]

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

              {/* Quick Questions */}
              {messages.length === 1 && (
                <div className="px-4 py-2 border-t border-gray-200 dark:border-gray-700">
                  <p className="text-xs text-gray-600 dark:text-gray-400 mb-2">Quick questions:</p>
                  <div className="flex flex-wrap gap-1">
                    {quickQuestions.slice(0, 3).map((question) => (
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
                  <input
                    ref={inputRef}
                    type="text"
                    value={inputMessage}
                    onChange={(e) => setInputMessage(e.target.value)}
                    onKeyPress={handleKeyPress}
                    placeholder="Ask me anything about options trading..."
                    className="flex-1 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-sm
                             bg-white dark:bg-gray-700 text-gray-900 dark:text-white
                             focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                    disabled={isTyping}
                  />
                  <Button
                    onClick={handleSendMessage}
                    disabled={!inputMessage.trim() || isTyping}
                    size="sm"
                    className="bg-purple-600 hover:bg-purple-700 px-3"
                  >
                    <Send className="h-4 w-4" />
                  </Button>
                </div>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                  Press Enter to send
                </p>
              </div>
            </Card>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  )
}