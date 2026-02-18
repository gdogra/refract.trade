'use client'

import { useState, useEffect } from 'react'
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

const mockPosts: CommunityPost[] = [
  {
    id: '1',
    user: {
      name: 'OptionsWizard',
      avatar: 'OW',
      verified: true,
      tier: 'elite',
      followers: 1247
    },
    timestamp: new Date(Date.now() - 3600000),
    content: "NVDA showing strong momentum above $140. Bought calls for earnings play. The technical setup is textbook with volume confirmation.",
    position: {
      symbol: 'NVDA',
      type: 'call',
      action: 'bought',
      price: 142.50,
      quantity: 10
    },
    engagement: {
      likes: 23,
      comments: 7,
      shares: 3,
      liked: false
    },
    performance: {
      returns: 12.3,
      timeframe: '7d'
    },
    tags: ['earnings', 'bullish', 'tech']
  },
  {
    id: '2',
    user: {
      name: 'TechAnalyst',
      avatar: 'TA',
      verified: false,
      tier: 'pro',
      followers: 823
    },
    timestamp: new Date(Date.now() - 7200000),
    content: "Market showing signs of weakness. VIX climbing and put/call ratio spiking. Defensive positioning recommended.",
    engagement: {
      likes: 45,
      comments: 12,
      shares: 8,
      liked: true
    },
    tags: ['market', 'vix', 'defensive']
  },
  {
    id: '3',
    user: {
      name: 'RetailTrader',
      avatar: 'RT',
      verified: false,
      tier: 'free',
      followers: 156
    },
    timestamp: new Date(Date.now() - 10800000),
    content: "First time trying iron condors on SPY. The risk/reward seems attractive with IV rank at 40th percentile.",
    position: {
      symbol: 'SPY',
      type: 'call',
      action: 'bought'
    },
    engagement: {
      likes: 18,
      comments: 5,
      shares: 2,
      liked: false
    },
    tags: ['spy', 'iron-condor', 'neutral']
  }
]

export default function CommunityFeed() {
  const [posts, setPosts] = useState<CommunityPost[]>(mockPosts)
  const [filter, setFilter] = useState<'all' | 'following' | 'trending'>('all')

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
            className={`flex-1 py-2 px-3 rounded-md text-sm font-medium transition-colors ${
              filter === tab
                ? 'bg-white dark:bg-gray-700 text-gray-900 dark:text-white shadow-sm'
                : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
            }`}
          >
            {tab.charAt(0).toUpperCase() + tab.slice(1)}
          </button>
        ))}
      </div>

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

      {/* Load More */}
      <div className="text-center py-4">
        <Button variant="outline" className="w-full">
          Load More Posts
        </Button>
      </div>
    </div>
  )
}