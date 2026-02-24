'use client'

import { useState, useEffect } from 'react'
import * as React from 'react'
import { motion } from 'framer-motion'
import { Heart, MessageCircle, Share2, TrendingUp, TrendingDown, Eye, Star, Clock } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Badge } from '@/components/ui/badge'

interface CommunityPost {
  id: string
  user: {
    name: string
    avatar: string
    verified: boolean
    tier: 'free' | 'pro' | 'elite'
    followers: number
  }
  timestamp: Date
  content: string
  position?: {
    symbol: string
    type: 'call' | 'put' | 'stock'
    action: 'bought' | 'sold' | 'watching'
    price?: number
    quantity?: number
  }
  engagement: {
    likes: number
    comments: number
    shares: number
    liked: boolean
  }
  performance?: {
    returns: number
    timeframe: string
  }
  tags: string[]
}

// Generate more realistic and current posts
const generateMockPosts = (): CommunityPost[] => [
  {
    id: '1',
    user: {
      name: 'OptionsWizard',
      avatar: 'OW',
      verified: true,
      tier: 'elite',
      followers: 1247
    },
    timestamp: new Date(Date.now() - 1800000), // 30 min ago
    content: "🚀 NVDA breaking out above $145 resistance with massive volume. Added 0DTE calls at $147 strike. Risk management set at 50% loss. This is not financial advice - sharing my play.",
    position: {
      symbol: 'NVDA',
      type: 'call',
      action: 'bought',
      price: 147.00,
      quantity: 5
    },
    engagement: {
      likes: 87,
      comments: 23,
      shares: 12,
      liked: false
    },
    performance: {
      returns: 28.5,
      timeframe: '2h'
    },
    tags: ['0DTE', 'momentum', 'tech', 'breakout']
  },
  {
    id: '2',
    user: {
      name: 'VegaHunter',
      avatar: 'VH',
      verified: true,
      tier: 'pro',
      followers: 2156
    },
    timestamp: new Date(Date.now() - 3600000), // 1hr ago
    content: "VIX term structure showing backwardation - classic setup for vol crush plays. Selling TSLA iron condors 30 DTE, collecting $3.20 premium with $12 wide strikes. IV rank 85th percentile.",
    position: {
      symbol: 'TSLA',
      type: 'call',
      action: 'sold',
      price: 3.20,
      quantity: 10
    },
    engagement: {
      likes: 156,
      comments: 34,
      shares: 28,
      liked: true
    },
    performance: {
      returns: 15.7,
      timeframe: '5d'
    },
    tags: ['vix', 'volatility', 'iron-condor', 'tesla']
  },
  {
    id: '3',
    user: {
      name: 'ThetaGang',
      avatar: 'TG',
      verified: false,
      tier: 'pro',
      followers: 934
    },
    timestamp: new Date(Date.now() - 7200000), // 2hr ago
    content: "SPY put credit spreads printing money this week 💰 Sold the 480/475 spread for $1.85, now worth $0.40. Taking profits at 75% max gain as planned. Discipline pays!",
    position: {
      symbol: 'SPY',
      type: 'put',
      action: 'sold',
      price: 1.85,
      quantity: 25
    },
    engagement: {
      likes: 203,
      comments: 45,
      shares: 31,
      liked: false
    },
    performance: {
      returns: 78.4,
      timeframe: '3d'
    },
    tags: ['spy', 'credit-spread', 'theta', 'profit-taking']
  },
  {
    id: '4',
    user: {
      name: 'MarketSurfer',
      avatar: 'MS',
      verified: false,
      tier: 'free',
      followers: 287
    },
    timestamp: new Date(Date.now() - 10800000), // 3hr ago
    content: "Learning options the hard way... My AAPL calls expired worthless today 😅 $500 lesson on why I need to understand time decay better. Back to paper trading for a while!",
    position: {
      symbol: 'AAPL',
      type: 'call',
      action: 'bought',
      price: 2.45,
      quantity: 2
    },
    engagement: {
      likes: 67,
      comments: 28,
      shares: 5,
      liked: false
    },
    performance: {
      returns: -100,
      timeframe: '7d'
    },
    tags: ['aapl', 'learning', 'theta-decay', 'paper-trading']
  },
  {
    id: '5',
    user: {
      name: 'QuantTrader',
      avatar: 'QT',
      verified: true,
      tier: 'elite',
      followers: 3421
    },
    timestamp: new Date(Date.now() - 14400000), // 4hr ago
    content: "🔥 High conviction play: QQQ strangle before Fed announcement. Selling puts and calls around current price, expecting big move either direction. Vol is underpriced at 22 IV.",
    position: {
      symbol: 'QQQ',
      type: 'call',
      action: 'sold',
      price: 4.80,
      quantity: 20
    },
    engagement: {
      likes: 312,
      comments: 89,
      shares: 67,
      liked: true
    },
    performance: {
      returns: 45.2,
      timeframe: '1d'
    },
    tags: ['qqq', 'strangle', 'fed', 'volatility', 'high-conviction']
  },
  {
    id: '6',
    user: {
      name: 'RetailWarrior',
      avatar: 'RW',
      verified: false,
      tier: 'free',
      followers: 145
    },
    timestamp: new Date(Date.now() - 18000000), // 5hr ago
    content: "First successful wheel trade! AMD assignment at $135, been selling covered calls for 3 weeks. Just got called away at $140 for nice profit. Time to find the next wheel candidate.",
    position: {
      symbol: 'AMD',
      type: 'call',
      action: 'sold',
      price: 140.00,
      quantity: 1
    },
    engagement: {
      likes: 89,
      comments: 19,
      shares: 8,
      liked: false
    },
    performance: {
      returns: 12.8,
      timeframe: '21d'
    },
    tags: ['amd', 'wheel', 'assignment', 'covered-calls']
  }
]

export default function CommunityFeed() {
  const [allPosts] = useState<CommunityPost[]>(generateMockPosts())
  const [filter, setFilter] = useState<'all' | 'following' | 'trending'>('all')
  const [followedUsers] = useState<Set<string>>(new Set(['OptionsWizard', 'VegaHunter', 'QuantTrader']))
  
  // Filter posts based on selected tab
  const filteredPosts = React.useMemo(() => {
    switch (filter) {
      case 'following':
        return allPosts.filter(post => followedUsers.has(post.user.name))
      case 'trending':
        // Sort by engagement score: likes + comments * 2 + shares * 3
        return [...allPosts].sort((a, b) => {
          const scoreA = a.engagement.likes + (a.engagement.comments * 2) + (a.engagement.shares * 3)
          const scoreB = b.engagement.likes + (b.engagement.comments * 2) + (b.engagement.shares * 3)
          return scoreB - scoreA
        }).slice(0, 4) // Show top 4 trending
      default:
        return allPosts.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime())
    }
  }, [filter, allPosts, followedUsers])

  const [posts, setPosts] = useState<CommunityPost[]>(filteredPosts)
  
  // Update posts when filter changes
  React.useEffect(() => {
    setPosts(filteredPosts)
  }, [filteredPosts])

  const handleLike = (postId: string) => {
    setPosts(prev => prev.map(post => 
      post.id === postId 
        ? {
            ...post,
            engagement: {
              ...post.engagement,
              liked: !post.engagement.liked,
              likes: post.engagement.liked ? post.engagement.likes - 1 : post.engagement.likes + 1
            }
          }
        : post
    ))
  }

  const getTierColor = (tier: string) => {
    switch (tier) {
      case 'elite': return 'text-purple-500 border-purple-500'
      case 'pro': return 'text-blue-500 border-blue-500'
      default: return 'text-gray-500 border-gray-500'
    }
  }

  const formatTimeAgo = (date: Date) => {
    const now = new Date()
    const diffMs = now.getTime() - date.getTime()
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60))
    
    if (diffHours < 1) return `${Math.floor(diffMs / (1000 * 60))}m`
    if (diffHours < 24) return `${diffHours}h`
    return `${Math.floor(diffHours / 24)}d`
  }

  return (
    <div className="max-w-2xl mx-auto space-y-4">
      {/* Filter Tabs */}
      <div className="flex space-x-1 bg-gray-100 dark:bg-gray-800 rounded-lg p-1">
        {(['all', 'following', 'trending'] as const).map((tab) => (
          <button
            key={tab}
            onClick={() => setFilter(tab)}
            className={`flex-1 py-2 px-3 rounded-md text-sm font-medium transition-colors relative ${
              filter === tab
                ? 'bg-white dark:bg-gray-700 text-gray-900 dark:text-white shadow-sm'
                : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
            }`}
          >
            {tab === 'following' && (
              <span className="mr-1">👥</span>
            )}
            {tab === 'trending' && (
              <span className="mr-1">🔥</span>
            )}
            {tab.charAt(0).toUpperCase() + tab.slice(1)}
            {tab === 'following' && (
              <span className="ml-1 text-xs bg-blue-500 text-white rounded-full px-1.5 py-0.5">
                {followedUsers.size}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* Filter Info */}
      {filter !== 'all' && (
        <div className="text-sm text-gray-600 dark:text-gray-400 flex items-center space-x-2">
          {filter === 'following' && (
            <>
              <span>📋 Showing posts from {followedUsers.size} followed traders</span>
            </>
          )}
          {filter === 'trending' && (
            <>
              <span>🚀 Top performing posts by engagement</span>
            </>
          )}
        </div>
      )}

      {/* Posts Feed */}
      <div className="space-y-3">
        {posts.map((post, index) => (
          <motion.div
            key={post.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: index * 0.1 }}
          >
            <Card className="hover:shadow-md transition-shadow border-gray-100 dark:border-gray-800">
              <CardContent className="p-4">
                {/* Post Header */}
                <div className="flex items-start space-x-3 mb-3">
                  <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white text-sm font-medium">
                    {post.user.avatar}
                  </div>
                  
                  <div className="flex-1">
                    <div className="flex items-center space-x-2">
                      <span className="font-medium text-gray-900 dark:text-white">
                        {post.user.name}
                      </span>
                      {post.user.verified && (
                        <div className="w-4 h-4 bg-blue-500 rounded-full flex items-center justify-center">
                          <Star className="h-2 w-2 text-white" />
                        </div>
                      )}
                      <Badge variant="outline" className={`text-xs ${getTierColor(post.user.tier)}`}>
                        {post.user.tier}
                      </Badge>
                    </div>
                    <div className="flex items-center space-x-2 text-xs text-gray-500 dark:text-gray-400">
                      <span>{post.user.followers} followers</span>
                      <span>•</span>
                      <span>{formatTimeAgo(post.timestamp)} ago</span>
                    </div>
                  </div>

                  {post.performance && (
                    <div className="text-right">
                      <div className={`text-sm font-medium ${
                        post.performance.returns >= 0 ? 'text-green-600' : 'text-red-600'
                      }`}>
                        {post.performance.returns >= 0 ? '+' : ''}{post.performance.returns.toFixed(1)}%
                      </div>
                      <div className="text-xs text-gray-500 dark:text-gray-400">
                        {post.performance.timeframe}
                      </div>
                    </div>
                  )}
                </div>

                {/* Post Content */}
                <div className="mb-3">
                  <p className="text-gray-900 dark:text-white leading-relaxed">
                    {post.content}
                  </p>
                </div>

                {/* Position Display */}
                {post.position && (
                  <div className="mb-3 p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        <div className="font-mono font-bold text-lg text-gray-900 dark:text-white">
                          {post.position.symbol}
                        </div>
                        <div className="flex items-center space-x-1">
                          {post.position.type === 'call' ? 
                            <TrendingUp className="h-4 w-4 text-green-500" /> :
                            <TrendingDown className="h-4 w-4 text-red-500" />
                          }
                          <span className="text-sm text-gray-600 dark:text-gray-400 capitalize">
                            {post.position.action} {post.position.type}
                          </span>
                        </div>
                      </div>
                      {post.position.price && (
                        <div className="text-right">
                          <div className="font-medium">${post.position.price}</div>
                          {post.position.quantity && (
                            <div className="text-xs text-gray-500">{post.position.quantity} contracts</div>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* Tags */}
                {post.tags.length > 0 && (
                  <div className="mb-3">
                    <div className="flex flex-wrap gap-1">
                      {post.tags.map(tag => (
                        <Badge
                          key={tag}
                          variant="outline"
                          className="text-xs text-blue-600 border-blue-200 dark:text-blue-400 dark:border-blue-800"
                        >
                          #{tag}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}

                {/* Engagement */}
                <div className="flex items-center justify-between pt-3 border-t border-gray-100 dark:border-gray-800">
                  <div className="flex items-center space-x-4">
                    <button
                      onClick={() => handleLike(post.id)}
                      className={`flex items-center space-x-1 text-sm transition-colors ${
                        post.engagement.liked ? 'text-red-500' : 'text-gray-500 hover:text-red-500'
                      }`}
                    >
                      <Heart className={`h-4 w-4 ${post.engagement.liked ? 'fill-current' : ''}`} />
                      <span>{post.engagement.likes}</span>
                    </button>
                    
                    <button className="flex items-center space-x-1 text-sm text-gray-500 hover:text-blue-500 transition-colors">
                      <MessageCircle className="h-4 w-4" />
                      <span>{post.engagement.comments}</span>
                    </button>
                    
                    <button className="flex items-center space-x-1 text-sm text-gray-500 hover:text-green-500 transition-colors">
                      <Share2 className="h-4 w-4" />
                      <span>{post.engagement.shares}</span>
                    </button>
                  </div>

                  <button className="flex items-center space-x-1 text-xs text-gray-500 hover:text-gray-700 dark:hover:text-gray-300">
                    <Eye className="h-3 w-3" />
                    <span>View Details</span>
                  </button>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </div>

      {/* Empty State */}
      {posts.length === 0 && (
        <div className="text-center py-12">
          <div className="text-gray-400 mb-4">
            {filter === 'following' ? '👥' : filter === 'trending' ? '📈' : '📱'}
          </div>
          <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
            {filter === 'following' ? 'No posts from followed users' : 
             filter === 'trending' ? 'No trending posts yet' : 'No posts available'}
          </h3>
          <p className="text-gray-500 dark:text-gray-400 mb-4">
            {filter === 'following' ? 'Follow some traders to see their posts here' :
             filter === 'trending' ? 'Check back later for trending content' : 'Be the first to share a trade!'}
          </p>
          {filter === 'following' && (
            <Button 
              variant="outline" 
              onClick={() => setFilter('all')}
              className="mt-2"
            >
              Browse All Posts
            </Button>
          )}
        </div>
      )}

      {/* Load More */}
      {posts.length > 0 && (
        <div className="text-center py-4">
          <Button 
            variant="outline" 
            className="w-full"
            onClick={() => {
              // Simulate loading more posts
              const morePost = {
                id: `${Date.now()}`,
                user: {
                  name: 'TradeNewbie',
                  avatar: 'TN',
                  verified: false,
                  tier: 'free' as const,
                  followers: 42
                },
                timestamp: new Date(Date.now() - 21600000),
                content: "Just started learning options trading! Any advice for a beginner? Looking at covered calls on my MSFT shares.",
                engagement: {
                  likes: 12,
                  comments: 8,
                  shares: 1,
                  liked: false
                },
                tags: ['beginner', 'covered-calls', 'msft']
              }
              setPosts(prev => [...prev, morePost])
            }}
          >
            Load More Posts
          </Button>
        </div>
      )}
    </div>
  )
}