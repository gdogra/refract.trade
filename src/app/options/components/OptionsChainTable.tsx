'use client'

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
  return (
    <OptionsChain 
      initialSymbol={symbol}
      initialExpiration={selectedExpiry}
      className="w-full"
    />
  )
}