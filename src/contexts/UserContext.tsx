'use client'

import React, { createContext, useContext, useState, useEffect } from 'react'

interface User {
  id: string
  firstName: string
  lastName: string
  email: string
  phone: string
  location: string
  joinDate: string
  accountType: 'Basic' | 'Pro' | 'Premium'
  avatar?: string
}

interface UserContextType {
  user: User | null
  setUser: (user: User | null) => void
  updateUser: (userData: Partial<User>) => void
  isLoggedIn: boolean
  login: (email: string, password: string) => Promise<boolean>
  logout: () => void
}

const UserContext = createContext<UserContextType | undefined>(undefined)

// Create a more personalized mock user
const getDefaultUser = (): User => {
  // Only access localStorage in browser environment
  if (typeof window !== 'undefined') {
    const savedCustomUser = localStorage.getItem('customUserData')
    if (savedCustomUser) {
      return JSON.parse(savedCustomUser)
    }
  }
  
  return {
    id: '1',
    firstName: 'Alex',
    lastName: 'Chen',
    email: 'alex.chen@email.com',
    phone: '+1 (555) 987-6543',
    location: 'San Francisco, CA',
    joinDate: new Date().toISOString().split('T')[0], // Today's date
    accountType: 'Pro'
  }
}

export function UserProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null)

  useEffect(() => {
    // Check if user is logged in (from localStorage)
    const savedUser = localStorage.getItem('user')
    if (savedUser) {
      setUser(JSON.parse(savedUser))
    } else {
      // Auto-login for demo purposes with personalized user
      const defaultUser = getDefaultUser()
      setUser(defaultUser)
      localStorage.setItem('user', JSON.stringify(defaultUser))
    }
  }, [])

  const login = async (email: string, password: string): Promise<boolean> => {
    // Mock login logic - accept multiple emails for demo
    const validLogins = [
      'john.doe@example.com',
      'alex.chen@email.com',
      'demo@refract.trade'
    ]
    
    if (validLogins.includes(email) && password === 'demo123') {
      const defaultUser = getDefaultUser()
      setUser(defaultUser)
      localStorage.setItem('user', JSON.stringify(defaultUser))
      return true
    }
    return false
  }

  const updateUser = (userData: Partial<User>) => {
    if (user) {
      const updatedUser = { ...user, ...userData }
      setUser(updatedUser)
      localStorage.setItem('user', JSON.stringify(updatedUser))
      localStorage.setItem('customUserData', JSON.stringify(updatedUser))
    }
  }

  const logout = () => {
    setUser(null)
    localStorage.removeItem('user')
    // Keep customUserData for next login
  }

  const value: UserContextType = {
    user,
    setUser,
    updateUser,
    isLoggedIn: !!user,
    login,
    logout
  }

  return (
    <UserContext.Provider value={value}>
      {children}
    </UserContext.Provider>
  )
}

export function useUser() {
  const context = useContext(UserContext)
  if (context === undefined) {
    throw new Error('useUser must be used within a UserProvider')
  }
  return context
}