'use client'

import { useState } from 'react'
import { motion } from 'framer-motion'
import { useParams, useRouter } from 'next/navigation'
import { ChevronLeft, ChevronRight, Play, CheckCircle, Clock, BookOpen } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card'

const courses = {
  'options-fundamentals': {
    title: 'Options Trading Fundamentals',
    description: 'Learn the basics of options trading, including calls, puts, and key concepts.',
    duration: '2 hours',
    difficulty: 'Beginner',
    lessons: [
      {
        id: 1,
        title: 'What Are Options?',
        duration: '12 min',
        content: `
          <h2>What Are Options?</h2>
          
          <p>Options are financial contracts that give you the <strong>right, but not the obligation</strong>, to buy or sell an underlying asset (like a stock) at a specific price on or before a certain date.</p>
          
          <h3>Key Components</h3>
          <ul>
            <li><strong>Strike Price:</strong> The price at which you can buy/sell the asset</li>
            <li><strong>Expiration Date:</strong> When the option expires</li>
            <li><strong>Premium:</strong> The cost to purchase the option</li>
            <li><strong>Underlying Asset:</strong> The stock or security the option is based on</li>
          </ul>
          
          <h3>Why Trade Options?</h3>
          <ul>
            <li><strong>Leverage:</strong> Control more shares with less capital</li>
            <li><strong>Limited Risk:</strong> Know your maximum loss upfront</li>
            <li><strong>Flexibility:</strong> Profit in any market direction</li>
            <li><strong>Income Generation:</strong> Collect premiums from selling options</li>
          </ul>
          
          <div class="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg mt-4">
            <h4>💡 Key Takeaway</h4>
            <p>Think of options like insurance policies - you pay a premium for the right to buy or sell at a specific price, but you're not required to use it.</p>
          </div>
        `
      },
      {
        id: 2,
        title: 'Call Options Explained',
        duration: '15 min',
        content: `
          <h2>Call Options Explained</h2>
          
          <p>A <strong>call option</strong> gives you the right to <strong>buy</strong> a stock at a specific price (strike price) before or on the expiration date.</p>
          
          <h3>When to Buy Calls</h3>
          <ul>
            <li>You expect the stock price to rise</li>
            <li>You want to control more shares with less money</li>
            <li>You want limited downside risk</li>
          </ul>
          
          <h3>Example: AAPL Call Option</h3>
          <div class="bg-gray-50 dark:bg-gray-800 p-4 rounded-lg">
            <p><strong>Current AAPL Price:</strong> $190</p>
            <p><strong>Call Option:</strong> $195 strike, expires in 30 days</p>
            <p><strong>Premium:</strong> $3.00 per share ($300 for 1 contract)</p>
          </div>
          
          <h3>Profit/Loss Scenarios</h3>
          <ul>
            <li><strong>AAPL goes to $200:</strong> Profit = ($200 - $195 - $3) × 100 = $200</li>
            <li><strong>AAPL stays at $190:</strong> Loss = $300 (premium paid)</li>
            <li><strong>AAPL goes to $197:</strong> Breakeven = $195 + $3 = $198</li>
          </ul>
          
          <div class="bg-green-50 dark:bg-green-900/20 p-4 rounded-lg mt-4">
            <h4>✅ Remember</h4>
            <p>Your maximum loss when buying calls is limited to the premium you paid. Your profit potential is unlimited as the stock can rise indefinitely.</p>
          </div>
        `
      },
      {
        id: 3,
        title: 'Put Options Explained',
        duration: '15 min',
        content: `
          <h2>Put Options Explained</h2>
          
          <p>A <strong>put option</strong> gives you the right to <strong>sell</strong> a stock at a specific price (strike price) before or on the expiration date.</p>
          
          <h3>When to Buy Puts</h3>
          <ul>
            <li>You expect the stock price to fall</li>
            <li>You want to protect existing stock positions</li>
            <li>You want to profit from declining markets</li>
          </ul>
          
          <h3>Example: TSLA Put Option</h3>
          <div class="bg-gray-50 dark:bg-gray-800 p-4 rounded-lg">
            <p><strong>Current TSLA Price:</strong> $250</p>
            <p><strong>Put Option:</strong> $245 strike, expires in 30 days</p>
            <p><strong>Premium:</strong> $4.00 per share ($400 for 1 contract)</p>
          </div>
          
          <h3>Profit/Loss Scenarios</h3>
          <ul>
            <li><strong>TSLA drops to $230:</strong> Profit = ($245 - $230 - $4) × 100 = $1,100</li>
            <li><strong>TSLA stays at $250:</strong> Loss = $400 (premium paid)</li>
            <li><strong>Breakeven:</strong> $245 - $4 = $241</li>
          </ul>
          
          <div class="bg-red-50 dark:bg-red-900/20 p-4 rounded-lg mt-4">
            <h4>⚠️ Important</h4>
            <p>Puts have limited profit potential (stock can only go to $0) but provide excellent downside protection for your portfolio.</p>
          </div>
        `
      },
      {
        id: 4,
        title: 'The Greeks: Delta',
        duration: '18 min',
        content: `
          <h2>Understanding Delta</h2>
          
          <p><strong>Delta</strong> measures how much an option's price changes when the underlying stock price moves by $1.</p>
          
          <h3>Delta Values</h3>
          <ul>
            <li><strong>Call Options:</strong> Delta ranges from 0 to 1</li>
            <li><strong>Put Options:</strong> Delta ranges from -1 to 0</li>
            <li><strong>At-the-Money (ATM):</strong> Delta ≈ 0.50 for calls, -0.50 for puts</li>
            <li><strong>In-the-Money (ITM):</strong> Higher delta (closer to 1 or -1)</li>
            <li><strong>Out-of-the-Money (OTM):</strong> Lower delta (closer to 0)</li>
          </ul>
          
          <h3>Practical Examples</h3>
          
          <div class="bg-gray-50 dark:bg-gray-800 p-4 rounded-lg mb-4">
            <h4>Call Option with Delta = 0.60</h4>
            <p>If the stock goes up $1, the option price increases by $0.60</p>
            <p>If the stock goes down $1, the option price decreases by $0.60</p>
          </div>
          
          <div class="bg-gray-50 dark:bg-gray-800 p-4 rounded-lg mb-4">
            <h4>Put Option with Delta = -0.40</h4>
            <p>If the stock goes up $1, the option price decreases by $0.40</p>
            <p>If the stock goes down $1, the option price increases by $0.40</p>
          </div>
          
          <h3>Delta as Probability</h3>
          <p>Delta also represents the approximate probability that the option will expire in-the-money:</p>
          <ul>
            <li>Delta of 0.70 ≈ 70% chance of expiring ITM</li>
            <li>Delta of 0.30 ≈ 30% chance of expiring ITM</li>
          </ul>
          
          <div class="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg mt-4">
            <h4>🎯 Pro Tip</h4>
            <p>Use delta to size your positions. If you want $100 exposure to a stock move, buy options with combined delta of 1.0.</p>
          </div>
        `
      }
    ]
  },
  'advanced-strategies': {
    title: 'Advanced Options Strategies',
    description: 'Master complex strategies like spreads, straddles, and iron condors.',
    duration: '3 hours',
    difficulty: 'Advanced',
    lessons: [
      {
        id: 1,
        title: 'Bull Call Spreads',
        duration: '20 min',
        content: `
          <h2>Bull Call Spreads</h2>
          
          <p>A bull call spread is a <strong>limited risk, limited reward</strong> strategy that profits when you expect moderate upward movement in a stock.</p>
          
          <h3>How to Construct</h3>
          <ol>
            <li><strong>Buy</strong> a call option (lower strike)</li>
            <li><strong>Sell</strong> a call option (higher strike)</li>
            <li>Both options have the same expiration date</li>
          </ol>
          
          <h3>Example: AAPL Bull Call Spread</h3>
          <div class="bg-gray-50 dark:bg-gray-800 p-4 rounded-lg">
            <p><strong>Current AAPL Price:</strong> $190</p>
            <p><strong>Buy:</strong> $190 call for $5.00</p>
            <p><strong>Sell:</strong> $200 call for $2.00</p>
            <p><strong>Net Cost:</strong> $5.00 - $2.00 = $3.00 per share</p>
          </div>
          
          <h3>Risk/Reward Profile</h3>
          <ul>
            <li><strong>Maximum Loss:</strong> Net premium paid ($300)</li>
            <li><strong>Maximum Profit:</strong> Strike difference - net premium = $10 - $3 = $700</li>
            <li><strong>Breakeven:</strong> Lower strike + net premium = $190 + $3 = $193</li>
          </ul>
          
          <div class="bg-green-50 dark:bg-green-900/20 p-4 rounded-lg mt-4">
            <h4>✅ Best When</h4>
            <ul>
              <li>You're moderately bullish on the stock</li>
              <li>You want to reduce the cost of buying calls</li>
              <li>You expect limited upside movement</li>
            </ul>
          </div>
        `
      }
    ]
  }
}

export default function CoursePage() {
  const params = useParams()
  const router = useRouter()
  const courseId = params.courseId as string
  const [currentLesson, setCurrentLesson] = useState(1)
  const [completedLessons, setCompletedLessons] = useState<number[]>([])

  const course = courses[courseId as keyof typeof courses]

  if (!course) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">Course Not Found</h1>
          <Button onClick={() => router.push('/learn')}>Back to Learning Center</Button>
        </div>
      </div>
    )
  }

  const currentLessonData = course.lessons.find(lesson => lesson.id === currentLesson)

  const handleNextLesson = () => {
    if (currentLesson < course.lessons.length) {
      if (!completedLessons.includes(currentLesson)) {
        setCompletedLessons([...completedLessons, currentLesson])
      }
      setCurrentLesson(currentLesson + 1)
    }
  }

  const handlePrevLesson = () => {
    if (currentLesson > 1) {
      setCurrentLesson(currentLesson - 1)
    }
  }

  const handleCompleteLesson = () => {
    if (!completedLessons.includes(currentLesson)) {
      setCompletedLessons([...completedLessons, currentLesson])
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="flex items-center space-x-4 mb-8">
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={() => router.push('/learn')}
            className="flex items-center space-x-2"
          >
            <ChevronLeft className="h-4 w-4" />
            <span>Back to Courses</span>
          </Button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          {/* Course Navigation Sidebar */}
          <div className="lg:col-span-1">
            <Card className="sticky top-6">
              <CardHeader>
                <CardTitle className="text-lg">{course.title}</CardTitle>
                <div className="flex items-center space-x-4 text-sm text-gray-600 dark:text-gray-400">
                  <div className="flex items-center space-x-1">
                    <Clock className="h-3 w-3" />
                    <span>{course.duration}</span>
                  </div>
                  <div className="flex items-center space-x-1">
                    <BookOpen className="h-3 w-3" />
                    <span>{course.lessons.length} lessons</span>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {course.lessons.map((lesson, index) => (
                    <motion.button
                      key={lesson.id}
                      onClick={() => setCurrentLesson(lesson.id)}
                      className={`w-full text-left p-3 rounded-lg transition-colors ${
                        currentLesson === lesson.id
                          ? 'bg-brand-500 text-white'
                          : 'hover:bg-gray-100 dark:hover:bg-gray-700'
                      }`}
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex-1">
                          <div className="flex items-center space-x-2">
                            {completedLessons.includes(lesson.id) ? (
                              <CheckCircle className="h-4 w-4 text-green-500" />
                            ) : (
                              <Play className="h-4 w-4" />
                            )}
                            <span className="text-sm font-medium">
                              {lesson.title}
                            </span>
                          </div>
                          <div className="text-xs opacity-75 mt-1">
                            {lesson.duration}
                          </div>
                        </div>
                      </div>
                    </motion.button>
                  ))}
                </div>

                {/* Progress Bar */}
                <div className="mt-6">
                  <div className="flex items-center justify-between text-sm text-gray-600 dark:text-gray-400 mb-2">
                    <span>Progress</span>
                    <span>{Math.round((completedLessons.length / course.lessons.length) * 100)}%</span>
                  </div>
                  <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                    <div 
                      className="bg-brand-500 h-2 rounded-full transition-all duration-300"
                      style={{ width: `${(completedLessons.length / course.lessons.length) * 100}%` }}
                    />
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Main Content */}
          <div className="lg:col-span-3">
            <Card>
              <CardContent className="p-8">
                {currentLessonData && (
                  <motion.div
                    key={currentLesson}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.3 }}
                  >
                    <div className="flex items-center justify-between mb-6">
                      <div>
                        <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
                          Lesson {currentLessonData.id}: {currentLessonData.title}
                        </h1>
                        <div className="flex items-center space-x-2 text-gray-600 dark:text-gray-400">
                          <Clock className="h-4 w-4" />
                          <span>{currentLessonData.duration}</span>
                        </div>
                      </div>
                      {!completedLessons.includes(currentLesson) && (
                        <Button 
                          onClick={handleCompleteLesson}
                          variant="ghost" 
                          size="sm"
                          className="text-green-600 hover:text-green-700"
                        >
                          Mark Complete
                        </Button>
                      )}
                    </div>

                    <div 
                      className="prose prose-gray dark:prose-invert max-w-none"
                      dangerouslySetInnerHTML={{ __html: currentLessonData.content }}
                    />

                    <div className="flex items-center justify-between mt-8 pt-6 border-t border-gray-200 dark:border-gray-700">
                      <Button 
                        onClick={handlePrevLesson}
                        disabled={currentLesson === 1}
                        variant="ghost"
                        className="flex items-center space-x-2"
                      >
                        <ChevronLeft className="h-4 w-4" />
                        <span>Previous</span>
                      </Button>

                      <div className="text-sm text-gray-500 dark:text-gray-400">
                        Lesson {currentLesson} of {course.lessons.length}
                      </div>

                      <Button 
                        onClick={handleNextLesson}
                        disabled={currentLesson === course.lessons.length}
                        className="flex items-center space-x-2"
                      >
                        <span>Next</span>
                        <ChevronRight className="h-4 w-4" />
                      </Button>
                    </div>
                  </motion.div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  )
}