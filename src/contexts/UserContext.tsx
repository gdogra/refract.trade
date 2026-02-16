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
  isLoggedIn: boolean
  login: (email: string, password: string) => Promise<boolean>
  logout: () => void
}

const UserContext = createContext<UserContextType | undefined>(undefined)

// Mock user data
const mockUser: User = {
  id: '1',
  firstName: 'John',
  lastName: 'Doe',
  email: 'john.doe@example.com',
  phone: '+1 (555) 123-4567',
  location: 'New York, NY',
  joinDate: '2023-01-15',
  accountType: 'Pro'
}

export function UserProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null)

  useEffect(() => {
    // Check if user is logged in (from localStorage)
    const savedUser = localStorage.getItem('user')
    if (savedUser) {
      setUser(JSON.parse(savedUser))
    } else {
      // Auto-login for demo purposes
      setUser(mockUser)
      localStorage.setItem('user', JSON.stringify(mockUser))
    }
  }, [])

  const login = async (email: string, password: string): Promise<boolean> => {
    // Mock login logic
    if (email === 'john.doe@example.com' && password === 'demo123') {
      setUser(mockUser)
      localStorage.setItem('user', JSON.stringify(mockUser))
      return true
    }
    return false
  }

  const logout = () => {
    setUser(null)
    localStorage.removeItem('user')
  }

  const value: UserContextType = {
    user,
    setUser,
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