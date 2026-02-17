'use client'

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X, AlertTriangle, CheckCircle, TrendingUp, TrendingDown } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { orderService, type OrderRequest } from '@/lib/orderService'

interface OrderModalProps {
  isOpen: boolean
  onClose: () => void
  orderRequest: OrderRequest | null
  onOrderSubmitted?: (orderId: string) => void
}

export default function OrderModal({ isOpen, onClose, orderRequest, onOrderSubmitted }: OrderModalProps) {
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [orderResult, setOrderResult] = useState<{ success: boolean; orderId?: string; error?: string } | null>(null)
  const [editableQuantity, setEditableQuantity] = useState(1)
  const [editablePrice, setEditablePrice] = useState(0)

  // Update editable values when orderRequest changes
  useEffect(() => {
    if (orderRequest) {
      setEditableQuantity(orderRequest.quantity)
      setEditablePrice(orderRequest.price)
    }
  }, [orderRequest])

  const handleSubmitOrder = async () => {
    if (!orderRequest) return

    setIsSubmitting(true)
    
    try {
      // Create updated order request with editable values
      const updatedOrderRequest = {
        ...orderRequest,
        quantity: editableQuantity,
        price: editablePrice
      }
      
      const result = await orderService.submitOrder(updatedOrderRequest)
      setOrderResult(result)
      
      if (result.success && result.orderId) {
        onOrderSubmitted?.(result.orderId)
        
        // Auto-close after 3 seconds on success
        setTimeout(() => {
          onClose()
          setOrderResult(null)
        }, 3000)
      }
    } catch (error) {
      setOrderResult({ success: false, error: 'Network error occurred' })
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleClose = () => {
    onClose()
    setOrderResult(null)
  }

  if (!orderRequest) return null

  const totalCost = editablePrice * editableQuantity * 100
  const isCall = orderRequest.type === 'call'
  const isBuy = orderRequest.action === 'buy'

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          {/* Backdrop */}
          <motion.div
            className="absolute inset-0 bg-black bg-opacity-50"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={handleClose}
          />

          {/* Modal */}
          <motion.div
            className="relative bg-white dark:bg-gray-800 rounded-xl p-6 mx-4 max-w-md w-full shadow-xl border border-gray-200 dark:border-gray-700"
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            transition={{ duration: 0.2 }}
          >
            {/* Close Button */}
            <button
              onClick={handleClose}
              className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
            >
              <X className="h-5 w-5" />
            </button>

            {orderResult ? (
              // Order Result View
              <div className="text-center">
                {orderResult.success ? (
                  <div>
                    <div className="w-12 h-12 bg-green-100 dark:bg-green-900/20 rounded-full flex items-center justify-center mx-auto mb-4">
                      <CheckCircle className="h-6 w-6 text-green-600 dark:text-green-400" />
                    </div>
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                      Order Submitted Successfully!
                    </h3>
                    <p className="text-gray-600 dark:text-gray-400 mb-4">
                      Order ID: {orderResult.orderId}
                    </p>
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                      Your order is being processed and will be filled shortly.
                    </p>
                  </div>
                ) : (
                  <div>
                    <div className="w-12 h-12 bg-red-100 dark:bg-red-900/20 rounded-full flex items-center justify-center mx-auto mb-4">
                      <AlertTriangle className="h-6 w-6 text-red-600 dark:text-red-400" />
                    </div>
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                      Order Failed
                    </h3>
                    <p className="text-red-600 dark:text-red-400 mb-4">
                      {orderResult.error}
                    </p>
                    <Button onClick={handleClose} variant="ghost">
                      Try Again
                    </Button>
                  </div>
                )}
              </div>
            ) : (
              // Order Confirmation View
              <div>
                <div className="flex items-center space-x-3 mb-6">
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                    isCall ? 'bg-green-100 dark:bg-green-900/20' : 'bg-red-100 dark:bg-red-900/20'
                  }`}>
                    {isCall ? (
                      <TrendingUp className="h-5 w-5 text-green-600 dark:text-green-400" />
                    ) : (
                      <TrendingDown className="h-5 w-5 text-red-600 dark:text-red-400" />
                    )}
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                      Confirm Order
                    </h3>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      {isBuy ? 'Buy' : 'Sell'} {orderRequest.type.toUpperCase()} option
                    </p>
                  </div>
                </div>

                {/* Order Details */}
                <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4 mb-6">
                  <div className="space-y-3">
                    <div className="flex justify-between">
                      <span className="text-gray-600 dark:text-gray-400">Symbol</span>
                      <span className="font-semibold text-gray-900 dark:text-white">
                        {orderRequest.symbol}
                      </span>
                    </div>
                    
                    <div className="flex justify-between">
                      <span className="text-gray-600 dark:text-gray-400">Action</span>
                      <span className={`font-semibold ${
                        isBuy ? 'text-green-600' : 'text-red-600'
                      }`}>
                        {isBuy ? 'Buy' : 'Sell'}
                      </span>
                    </div>
                    
                    <div className="flex justify-between">
                      <span className="text-gray-600 dark:text-gray-400">Type</span>
                      <span className={`font-semibold ${
                        isCall ? 'text-green-600' : 'text-red-600'
                      }`}>
                        {orderRequest.type.toUpperCase()}
                      </span>
                    </div>
                    
                    <div className="flex justify-between">
                      <span className="text-gray-600 dark:text-gray-400">Strike</span>
                      <span className="font-semibold text-gray-900 dark:text-white">
                        ${orderRequest.strike.toFixed(2)}
                      </span>
                    </div>
                    
                    <div className="flex justify-between">
                      <span className="text-gray-600 dark:text-gray-400">Expiry</span>
                      <span className="font-semibold text-gray-900 dark:text-white">
                        {new Date(orderRequest.expiry).toLocaleDateString()}
                      </span>
                    </div>
                    
                    <div className="flex justify-between items-center">
                      <span className="text-gray-600 dark:text-gray-400">Quantity</span>
                      <div className="flex items-center space-x-2">
                        <button
                          onClick={() => setEditableQuantity(Math.max(1, editableQuantity - 1))}
                          className="w-6 h-6 rounded-full bg-gray-200 dark:bg-gray-600 flex items-center justify-center text-gray-600 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-500"
                          disabled={isSubmitting}
                        >
                          -
                        </button>
                        <input
                          type="number"
                          value={editableQuantity}
                          onChange={(e) => setEditableQuantity(Math.max(1, parseInt(e.target.value) || 1))}
                          className="w-16 text-center border border-gray-300 dark:border-gray-600 rounded px-2 py-1 bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm"
                          min="1"
                          disabled={isSubmitting}
                        />
                        <button
                          onClick={() => setEditableQuantity(editableQuantity + 1)}
                          className="w-6 h-6 rounded-full bg-gray-200 dark:bg-gray-600 flex items-center justify-center text-gray-600 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-500"
                          disabled={isSubmitting}
                        >
                          +
                        </button>
                        <span className="text-sm text-gray-500 dark:text-gray-400">
                          contract{editableQuantity !== 1 ? 's' : ''}
                        </span>
                      </div>
                    </div>
                    
                    <div className="flex justify-between items-center">
                      <span className="text-gray-600 dark:text-gray-400">Price per share</span>
                      <div className="flex items-center space-x-1">
                        <span className="text-gray-600 dark:text-gray-400">$</span>
                        <input
                          type="number"
                          value={editablePrice.toFixed(2)}
                          onChange={(e) => setEditablePrice(Math.max(0.01, parseFloat(e.target.value) || 0.01))}
                          className="w-20 text-right border border-gray-300 dark:border-gray-600 rounded px-2 py-1 bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm"
                          min="0.01"
                          step="0.01"
                          disabled={isSubmitting}
                        />
                      </div>
                    </div>
                    
                    <hr className="border-gray-300 dark:border-gray-600" />
                    
                    <div className="flex justify-between text-lg">
                      <span className="font-semibold text-gray-900 dark:text-white">Total Cost</span>
                      <span className="font-bold text-gray-900 dark:text-white">
                        ${totalCost.toFixed(2)}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Risk Warning */}
                <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-3 mb-6">
                  <div className="flex items-start space-x-2">
                    <AlertTriangle className="h-4 w-4 text-yellow-600 dark:text-yellow-400 mt-0.5 flex-shrink-0" />
                    <div className="text-sm text-yellow-800 dark:text-yellow-200">
                      <p className="font-medium mb-1">Risk Warning</p>
                      <p>
                        Options trading involves significant risk. You may lose your entire investment. 
                        Only trade with money you can afford to lose.
                      </p>
                    </div>
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="flex space-x-3">
                  <Button
                    onClick={handleClose}
                    variant="ghost"
                    className="flex-1 border border-gray-300 dark:border-gray-600"
                    disabled={isSubmitting}
                  >
                    Cancel
                  </Button>
                  <Button
                    onClick={handleSubmitOrder}
                    className={`flex-1 font-semibold py-3 px-4 border-2 transition-all ${
                      isBuy 
                        ? 'bg-green-600 hover:bg-green-700 border-green-600 hover:border-green-700 text-white shadow-lg' 
                        : 'bg-red-600 hover:bg-red-700 border-red-600 hover:border-red-700 text-white shadow-lg'
                    }`}
                    disabled={isSubmitting}
                  >
                    {isSubmitting ? 'Processing...' : `${orderRequest.action === 'buy' ? 'Buy' : 'Sell'} ${orderRequest.type.toUpperCase()}`}
                  </Button>
                </div>
              </div>
            )}
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  )
}