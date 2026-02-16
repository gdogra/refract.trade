'use client'

import { motion } from 'framer-motion'
import { BookOpen, Play, Clock, Star, TrendingUp, Shield, Target, Lightbulb } from 'lucide-react'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'

export default function Learn() {
  const handleStartCourse = (courseTitle: string) => {
    const courseMap: Record<string, string> = {
      'Options Trading Fundamentals': 'options-fundamentals',
      'Advanced Strategies': 'advanced-strategies',
      'Risk Management': 'risk-management',
      'Technical Analysis': 'technical-analysis'
    }
    
    const courseId = courseMap[courseTitle]
    if (courseId) {
      window.location.href = `/learn/courses/${courseId}`
    } else {
      alert(`Course "${courseTitle}" is coming soon!`)
    }
  }

  const courses = [
    {
      id: 1,
      title: 'Options Trading Fundamentals',
      description: 'Learn the basics of options trading, including calls, puts, and key concepts.',
      duration: '2 hours',
      difficulty: 'Beginner',
      rating: 4.8,
      lessons: 12,
      icon: BookOpen,
      color: 'bg-blue-500'
    },
    {
      id: 2,
      title: 'Advanced Strategies',
      description: 'Master complex strategies like spreads, straddles, and iron condors.',
      duration: '3 hours',
      difficulty: 'Advanced',
      rating: 4.9,
      lessons: 18,
      icon: TrendingUp,
      color: 'bg-purple-500'
    },
    {
      id: 3,
      title: 'Risk Management',
      description: 'Essential risk management techniques to protect your capital.',
      duration: '1.5 hours',
      difficulty: 'Intermediate',
      rating: 4.7,
      lessons: 10,
      icon: Shield,
      color: 'bg-green-500'
    },
    {
      id: 4,
      title: 'Technical Analysis',
      description: 'Use charts and indicators to make better trading decisions.',
      duration: '2.5 hours',
      difficulty: 'Intermediate',
      rating: 4.6,
      lessons: 15,
      icon: Target,
      color: 'bg-orange-500'
    }
  ]

  const quickTips = [
    {
      title: 'Start Small',
      description: 'Begin with paper trading or small positions to learn without risk.',
      icon: Target
    },
    {
      title: 'Understand Greeks',
      description: 'Delta, gamma, theta, and vega are crucial for options pricing.',
      icon: Lightbulb
    },
    {
      title: 'Risk Management',
      description: 'Never risk more than you can afford to lose on any single trade.',
      icon: Shield
    }
  ]

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <motion.div 
          className="mb-8"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Learning Center</h1>
          <p className="text-gray-600 dark:text-gray-400 mt-2">
            Master options trading with our comprehensive courses and resources
          </p>
        </motion.div>

        {/* Quick Tips */}
        <motion.div
          className="mb-8"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.1 }}
        >
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Lightbulb className="h-5 w-5 text-yellow-500" />
                <span>Quick Tips</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {quickTips.map((tip, index) => {
                  const IconComponent = tip.icon
                  return (
                    <motion.div
                      key={tip.title}
                      className="flex items-start space-x-3 p-4 bg-gray-50 dark:bg-gray-700 rounded-lg"
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.3, delay: 0.2 + index * 0.1 }}
                    >
                      <IconComponent className="h-5 w-5 text-blue-500 mt-0.5 flex-shrink-0" />
                      <div>
                        <h4 className="font-medium text-gray-900 dark:text-white text-sm">{tip.title}</h4>
                        <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">{tip.description}</p>
                      </div>
                    </motion.div>
                  )
                })}
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Courses Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 gap-6">
          {courses.map((course, index) => {
            const IconComponent = course.icon
            
            return (
              <motion.div
                key={course.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.3 + index * 0.1 }}
              >
                <Card className="h-full hover:shadow-lg transition-shadow">
                  <CardContent className="p-6">
                    <div className="flex items-start space-x-4">
                      <div className={`${course.color} rounded-lg p-3 flex-shrink-0`}>
                        <IconComponent className="h-6 w-6 text-white" />
                      </div>
                      <div className="flex-1">
                        <h3 className="font-semibold text-gray-900 dark:text-white mb-2">
                          {course.title}
                        </h3>
                        <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
                          {course.description}
                        </p>
                        
                        <div className="flex items-center space-x-4 text-xs text-gray-500 dark:text-gray-400 mb-4">
                          <div className="flex items-center space-x-1">
                            <Clock className="h-3 w-3" />
                            <span>{course.duration}</span>
                          </div>
                          <div className="flex items-center space-x-1">
                            <Play className="h-3 w-3" />
                            <span>{course.lessons} lessons</span>
                          </div>
                          <div className="flex items-center space-x-1">
                            <Star className="h-3 w-3" />
                            <span>{course.rating}</span>
                          </div>
                        </div>

                        <div className="flex items-center justify-between">
                          <span className={`px-2 py-1 text-xs rounded-full ${
                            course.difficulty === 'Beginner' ? 'bg-green-100 text-green-700' :
                            course.difficulty === 'Intermediate' ? 'bg-yellow-100 text-yellow-700' :
                            'bg-red-100 text-red-700'
                          }`}>
                            {course.difficulty}
                          </span>
                          
                          <Button 
                            size="sm" 
                            variant="ghost"
                            onClick={() => handleStartCourse(course.title)}
                          >
                            Start Course
                          </Button>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            )
          })}
        </div>

        {/* Featured Resources */}
        <motion.div
          className="mt-8"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.8 }}
        >
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <BookOpen className="h-5 w-5 text-blue-500" />
                <span>Featured Resources</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="text-center">
                  <div className="w-16 h-16 bg-blue-100 dark:bg-blue-900 rounded-full flex items-center justify-center mx-auto mb-3">
                    <BookOpen className="h-8 w-8 text-blue-600 dark:text-blue-400" />
                  </div>
                  <h4 className="font-medium text-gray-900 dark:text-white mb-2">Trading Guide</h4>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    Comprehensive PDF guide covering all aspects of options trading
                  </p>
                </div>
                
                <div className="text-center">
                  <div className="w-16 h-16 bg-green-100 dark:bg-green-900 rounded-full flex items-center justify-center mx-auto mb-3">
                    <Play className="h-8 w-8 text-green-600 dark:text-green-400" />
                  </div>
                  <h4 className="font-medium text-gray-900 dark:text-white mb-2">Video Tutorials</h4>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    Step-by-step video walkthroughs of common strategies
                  </p>
                </div>
                
                <div className="text-center">
                  <div className="w-16 h-16 bg-purple-100 dark:bg-purple-900 rounded-full flex items-center justify-center mx-auto mb-3">
                    <TrendingUp className="h-8 w-8 text-purple-600 dark:text-purple-400" />
                  </div>
                  <h4 className="font-medium text-gray-900 dark:text-white mb-2">Market Analysis</h4>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    Weekly market analysis and trading opportunities
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Coming Soon Notice */}
        <motion.div 
          className="mt-8 text-center"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.5, delay: 1.0 }}
        >
          <div className="inline-flex items-center px-4 py-2 rounded-lg bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200">
            <BookOpen className="h-4 w-4 mr-2" />
            <span className="text-sm font-medium">More courses and interactive content coming soon</span>
          </div>
        </motion.div>
      </div>
    </div>
  )
}