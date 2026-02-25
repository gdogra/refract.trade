'use client'

import { useEffect, useState } from 'react'
import OptionsChain from '@/components/OptionsChain'

interface OptionsChainTableProps {
  symbol: string
  selectedExpiry: string
  onExpiryChange: (expiry: string) => void
  selectedStrike: number | null
  onStrikeSelect: (strike: number) => void
}

export default function OptionsChainTable({ 
  symbol, 
  selectedExpiry, 
  onExpiryChange, 
  selectedStrike, 
  onStrikeSelect 
}: OptionsChainTableProps) {
  // Use a key to force re-render when symbol changes
  // This ensures the OptionsChain component completely resets when switching symbols
  const [key, setKey] = useState(0)
  
  useEffect(() => {
    setKey(prev => prev + 1)
  }, [symbol])
  
  return (
    <OptionsChain 
      key={key}
      initialSymbol={symbol}
      initialExpiration={selectedExpiry}
      className="w-full"
    />
  )
}