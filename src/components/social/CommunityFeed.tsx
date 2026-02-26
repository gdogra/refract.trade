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
    tier: 'trial'
    followers: number
    trialDaysLeft?: number
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
    commented: boolean
    shared: boolean
  }
  performance?: {
    returns: number
    timeframe: string
  }
  tags: string[]
}

// Real community posts will be fetched from authenticated users only
// No fake posts or mock trading data allowed

// Fetch real community posts from authenticated users
const fetchRealCommunityPosts = async (): Promise<CommunityPost[]> => {
  try {
    // This would connect to your real user database
    const response = await fetch('/api/community/posts')
    if (!response.ok) {
      throw new Error('Failed to fetch community posts')
    }
    const data = await response.json()
    return data.posts || []
  } catch (error) {
    console.error('Failed to fetch real community posts:', error)
    return []
  }
}

// No mock posts - return empty array until real implementation
const generateMockPosts = (): CommunityPost[] => []

export default function CommunityFeed() {
  const [allPosts, setAllPosts] = useState<CommunityPost[]>([])
  const [loading, setLoading] = useState(true)
  
  // Load real posts on component mount
  useEffect(() => {
    const loadRealPosts = async () => {
      try {
        const realPosts = await fetchRealCommunityPosts()
        setAllPosts(realPosts)
      } catch (error) {
        console.error('Failed to load community posts:', error)
        setAllPosts([])
      } finally {
        setLoading(false)
      }
    }
    
    loadRealPosts()
  }, [])
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
  const [showComments, setShowComments] = useState<string | null>(null)
  const [showShareModal, setShowShareModal] = useState<string | null>(null)
  const [usedAdditionalPosts, setUsedAdditionalPosts] = useState<number>(0)
  
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

  const handleComment = (postId: string) => {
    setPosts(prev => prev.map(post => 
      post.id === postId 
        ? {
            ...post,
            engagement: {
              ...post.engagement,
              commented: true,
              comments: post.engagement.comments + 1
            }
          }
        : post
    ))
    setShowComments(postId === showComments ? null : postId)
  }

  const handleShare = (postId: string) => {
    setPosts(prev => prev.map(post => 
      post.id === postId 
        ? {
            ...post,
            engagement: {
              ...post.engagement,
              shared: true,
              shares: post.engagement.shares + 1
            }
          }
        : post
    ))
    setShowShareModal(postId)
    // Auto-close share modal after animation
    setTimeout(() => setShowShareModal(null), 2000)
  }

  const getTierColor = (tier: string) => {
    switch (tier) {
      case 'trial': return 'text-blue-500 border-blue-500'
      default: return 'text-gray-500 border-gray-500'
    }
  }

  const getTierLabel = (user: any) => {
    if (user.tier === 'trial' && user.trialDaysLeft) {
      return `Trial (${user.trialDaysLeft}d)`
    }
    return user.tier
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
                        {getTierLabel(post.user)}
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
                {post.tags?.length || 0 > 0 && (
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
                    
                    <button 
                      onClick={() => handleComment(post.id)}
                      className={`flex items-center space-x-1 text-sm transition-colors ${
                        post.engagement.commented ? 'text-blue-500' : 'text-gray-500 hover:text-blue-500'
                      }`}
                      title="Comment on this post"
                    >
                      <MessageCircle className={`h-4 w-4 ${post.engagement.commented ? 'fill-current' : ''}`} />
                      <span>{post.engagement.comments}</span>
                    </button>
                    
                    <button 
                      onClick={() => handleShare(post.id)}
                      className={`flex items-center space-x-1 text-sm transition-colors relative ${
                        post.engagement.shared ? 'text-green-500' : 'text-gray-500 hover:text-green-500'
                      }`}
                      title="Share this post"
                    >
                      <Share2 className={`h-4 w-4 ${post.engagement.shared ? 'fill-current' : ''}`} />
                      <span>{post.engagement.shares}</span>
                      {showShareModal === post.id && (
                        <motion.div
                          initial={{ scale: 0.5, opacity: 0 }}
                          animate={{ scale: 1, opacity: 1 }}
                          exit={{ scale: 0.5, opacity: 0 }}
                          className="absolute -top-8 left-0 bg-green-500 text-white text-xs px-2 py-1 rounded whitespace-nowrap"
                        >
                          Shared! 🚀
                        </motion.div>
                      )}
                    </button>
                  </div>

                  <button className="flex items-center space-x-1 text-xs text-gray-500 hover:text-gray-700 dark:hover:text-gray-300">
                    <Eye className="h-3 w-3" />
                    <span>View Details</span>
                  </button>
                </div>

                {/* Comments Section */}
                {showComments === post.id && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    className="border-t border-gray-100 dark:border-gray-800 pt-3 mt-3"
                  >
                    <div className="space-y-3">
                      <div className="flex space-x-2">
                        <div className="w-6 h-6 bg-gradient-to-br from-green-500 to-blue-600 rounded-full flex items-center justify-center text-white text-xs">
                          YU
                        </div>
                        <div className="flex-1">
                          <div className="text-sm text-gray-900 dark:text-white">
                            <span className="font-medium">You:</span> Great analysis! What's your exit strategy if IV drops?
                          </div>
                          <div className="text-xs text-gray-500">Just now</div>
                        </div>
                      </div>
                      <div className="flex space-x-2">
                        <input
                          type="text"
                          placeholder="Write a comment..."
                          className="flex-1 text-sm border border-gray-200 dark:border-gray-700 rounded-lg px-3 py-2 bg-white dark:bg-gray-800"
                          onKeyDown={(e) => {
                            if (e.key === 'Enter' && e.currentTarget.value.trim()) {
                              e.currentTarget.value = ''
                              // Comment added via handleComment already
                            }
                          }}
                        />
                        <Button size="sm" variant="outline">Post</Button>
                      </div>
                    </div>
                  </motion.div>
                )}
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </div>

      {/* Empty State */}
      {posts?.length || 0 === 0 && (
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
      {posts?.length || 0 > 0 && (
        <div className="text-center py-4">
          <Button 
            variant="outline" 
            className="w-full"
            onClick={async () => {
              // Load more real posts from API
              try {
                const morePosts = await fetchRealCommunityPosts()
                if (morePosts?.length || 0 > allPosts?.length || 0) {
                  setAllPosts(morePosts)
                }
              } catch (error) {
                console.error('Failed to load more posts:', error)
              }
            }}
            disabled={loading}
            title="Load more community posts from real users"
          >
            {loading ? 'Loading...' : 'Load More Posts'}
          </Button>
        </div>
      )}
    </div>
  )
}