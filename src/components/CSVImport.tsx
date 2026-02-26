'use client'

import { useState, useRef, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  Upload, 
  FileText, 
  X, 
  Check, 
  AlertTriangle, 
  Download,
  Eye,
  Settings,
  ChevronDown,
  ChevronUp,
  Info,
  Loader2,
  CheckCircle,
  XCircle
} from 'lucide-react'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { 
  csvImportService, 
  BROKER_MAPPINGS,
  type CSVImportResult,
  type ImportError,
  type ImportedPosition,
  formatImportResults
} from '@/lib/csvImport'
import { cn, formatCurrency } from '@/lib/utils'
import { toast } from 'react-hot-toast'

interface CSVImportProps {
  isOpen: boolean
  onClose: () => void
  onImportComplete: (positions: ImportedPosition[]) => void
  className?: string
}

export default function CSVImport({ isOpen, onClose, onImportComplete, className }: CSVImportProps) {
  const [step, setStep] = useState<'upload' | 'preview' | 'configure' | 'results'>('upload')
  const [csvFile, setCSVFile] = useState<File | null>(null)
  const [csvText, setCSVText] = useState<string>('')
  const [selectedBroker, setSelectedBroker] = useState<string>('')
  const [importResult, setImportResult] = useState<CSVImportResult | null>(null)
  const [isProcessing, setIsProcessing] = useState(false)
  const [showErrors, setShowErrors] = useState(false)
  const [showPreview, setShowPreview] = useState(false)
  
  const fileInputRef = useRef<HTMLInputElement>(null)
  const dragCounterRef = useRef(0)
  const [isDragging, setIsDragging] = useState(false)

  // Reset state
  const resetState = () => {
    setStep('upload')
    setCSVFile(null)
    setCSVText('')
    setSelectedBroker('')
    setImportResult(null)
    setIsProcessing(false)
    setShowErrors(false)
    setShowPreview(false)
    dragCounterRef.current = 0
    setIsDragging(false)
  }

  // Handle file selection
  const handleFileSelect = useCallback(async (file: File) => {
    if (!file.name.toLowerCase().endsWith('.csv')) {
      toast.error('Please select a CSV file')
      return
    }

    if (file.size > 10 * 1024 * 1024) { // 10MB limit
      toast.error('File size must be less than 10MB')
      return
    }

    setCSVFile(file)
    
    try {
      const text = await file.text()
      setCSVText(text)
      
      // Validate and detect broker
      const validation = csvImportService.validateCSVStructure(text)
      
      if (!validation.isValid) {
        toast.error('CSV validation failed')
        setImportResult({
          success: false,
          totalRows: 0,
          importedRows: 0,
          errors: validation.errors.map(error => ({
            row: 0,
            message: error,
            severity: 'error' as const
          })),
          warnings: [],
          positions: [],
          summary: {
            totalValue: 0,
            positionsByType: { calls: 0, puts: 0 },
            positionsByExpiry: {},
            uniqueSymbols: 0,
            brokerTypes: []
          }
        })
        setStep('results')
        return
      }

      if (validation.detectedBroker) {
        setSelectedBroker(validation.detectedBroker)
      }

      setStep('preview')
      toast.success('CSV loaded successfully!')
      
    } catch (error) {
      toast.error('Failed to read CSV file')
      console.error('File read error:', error)
    }
  }, [])

  // Handle drag and drop
  const handleDragEnter = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    dragCounterRef.current++
    setIsDragging(true)
  }, [])

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    dragCounterRef.current--
    if (dragCounterRef.current === 0) {
      setIsDragging(false)
    }
  }, [])

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault()
  }, [])

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    dragCounterRef.current = 0
    setIsDragging(false)

    const files = Array.from(e.dataTransfer.files)
    if (files?.length || 0 > 0) {
      handleFileSelect(files[0])
    }
  }, [handleFileSelect])

  // Process CSV import
  const handleImport = async () => {
    if (!csvText) return

    setIsProcessing(true)
    
    try {
      const result = await csvImportService.importPositions(csvText, selectedBroker || undefined)
      setImportResult(result)
      setStep('results')
      
      if (result.success && result.positions?.length || 0 > 0) {
        toast.success(formatImportResults(result))
      } else {
        toast.error('Import failed - please check errors below')
      }
      
    } catch (error) {
      toast.error('Import processing failed')
      console.error('Import error:', error)
    } finally {
      setIsProcessing(false)
    }
  }

  // Complete import and close
  const handleComplete = () => {
    if (importResult?.positions) {
      onImportComplete(importResult.positions)
    }
    onClose()
    resetState()
  }

  // Download sample CSV
  const handleDownloadSample = (brokerType: string) => {
    const csv = csvImportService.generateSampleCSV(brokerType)
    const blob = new Blob([csv], { type: 'text/csv' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `sample_${brokerType}.csv`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
    
    toast.success('Sample CSV downloaded')
  }

  // Parse CSV preview data
  const previewData = csvText ? csvImportService.parseCSV(csvText, true).slice(0, 5) : []
  const previewHeaders = previewData?.length || 0 > 0 ? Object.keys(previewData[0]) : []

  if (!isOpen) return null

  return (
    <motion.div
      className={cn("fixed inset-0 z-50 flex items-center justify-center p-4", className)}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
    >
      {/* Backdrop */}
      <motion.div
        className="absolute inset-0 bg-black bg-opacity-50"
        onClick={onClose}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
      />

      {/* Modal */}
      <motion.div
        className="relative bg-white dark:bg-gray-900 rounded-xl shadow-xl border border-gray-200 dark:border-gray-700 w-full max-w-4xl max-h-[90vh] overflow-hidden"
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 20 }}
        transition={{ duration: 0.2 }}
      >
        {/* Header */}
        <div className="border-b border-gray-200 dark:border-gray-700 p-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-blue-600 rounded-lg flex items-center justify-center">
                <Upload className="h-5 w-5 text-white" />
              </div>
              <div>
                <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
                  Import Positions from CSV
                </h2>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Import your options positions from broker CSV exports
                </p>
              </div>
            </div>
            <Button variant="ghost" size="sm" onClick={() => { onClose(); resetState(); }}>
              <X className="h-5 w-5" />
            </Button>
          </div>

          {/* Progress Steps */}
          <div className="flex items-center space-x-4 mt-6">
            {['upload', 'preview', 'results'].map((stepName, index) => (
              <div key={stepName} className="flex items-center space-x-2">
                <div className={cn(
                  "w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium",
                  step === stepName ? 'bg-blue-600 text-white' :
                  ['upload', 'preview', 'results'].indexOf(step) > index ? 'bg-green-600 text-white' :
                  'bg-gray-200 dark:bg-gray-700 text-gray-600 dark:text-gray-400'
                )}>
                  {['upload', 'preview', 'results'].indexOf(step) > index ? (
                    <Check className="h-4 w-4" />
                  ) : (
                    index + 1
                  )}
                </div>
                <span className={cn(
                  "text-sm font-medium capitalize",
                  step === stepName ? 'text-blue-600' : 'text-gray-600 dark:text-gray-400'
                )}>
                  {stepName}
                </span>
                {index < 2 && (
                  <ChevronDown className="h-4 w-4 text-gray-400 rotate-[-90deg]" />
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto">
          <AnimatePresence mode="wait">
            {step === 'upload' && (
              <motion.div
                key="upload"
                className="p-6 space-y-6"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
              >
                {/* Upload Area */}
                <div
                  className={cn(
                    "border-2 border-dashed rounded-lg p-12 text-center transition-colors",
                    isDragging ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/10' :
                    'border-gray-300 dark:border-gray-600 hover:border-gray-400'
                  )}
                  onDragEnter={handleDragEnter}
                  onDragLeave={handleDragLeave}
                  onDragOver={handleDragOver}
                  onDrop={handleDrop}
                >
                  <Upload className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                    Drop your CSV file here
                  </h3>
                  <p className="text-gray-600 dark:text-gray-400 mb-4">
                    or click to browse and select your file
                  </p>
                  <Button onClick={() => fileInputRef.current?.click()}>
                    <FileText className="h-4 w-4 mr-2" />
                    Select CSV File
                  </Button>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept=".csv"
                    className="hidden"
                    onChange={(e) => {
                      const file = e.target.files?.[0]
                      if (file) handleFileSelect(file)
                    }}
                  />
                </div>

                {/* Supported Brokers */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center space-x-2">
                      <Settings className="h-5 w-5" />
                      <span>Supported Brokers</span>
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {Object.entries(BROKER_MAPPINGS).map(([key, mapping]) => (
                        <div key={key} className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                          <span className="font-medium text-gray-900 dark:text-white">
                            {mapping.name}
                          </span>
                          <Button 
                            variant="ghost" 
                            size="sm"
                            onClick={() => handleDownloadSample(key)}
                          >
                            <Download className="h-4 w-4 mr-2" />
                            Sample
                          </Button>
                        </div>
                      ))}
                    </div>
                    <div className="mt-4 p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                      <div className="flex items-start space-x-2">
                        <Info className="h-4 w-4 text-blue-600 dark:text-blue-400 mt-0.5 flex-shrink-0" />
                        <div className="text-sm text-blue-800 dark:text-blue-200">
                          <p className="font-medium mb-1">Tips for successful import:</p>
                          <ul className="space-y-1 text-blue-700 dark:text-blue-300">
                            <li>• Ensure your CSV includes symbol, option type, strike, expiry, and quantity columns</li>
                            <li>• Date formats should be YYYY-MM-DD or MM/DD/YYYY</li>
                            <li>• Option types should be "call"/"put" or "C"/"P"</li>
                            <li>• Use negative quantities for short positions</li>
                          </ul>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            )}

            {step === 'preview' && (
              <motion.div
                key="preview"
                className="p-6 space-y-6"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
              >
                {/* File Info */}
                <Card>
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        <FileText className="h-8 w-8 text-blue-600" />
                        <div>
                          <h3 className="font-semibold text-gray-900 dark:text-white">
                            {csvFile?.name}
                          </h3>
                          <p className="text-sm text-gray-600 dark:text-gray-400">
                            {(csvFile?.size || 0) < 1024 ? `${csvFile?.size} bytes` :
                             (csvFile?.size || 0) < 1024 * 1024 ? `${Math.round((csvFile?.size || 0) / 1024)} KB` :
                             `${Math.round((csvFile?.size || 0) / (1024 * 1024))} MB`} • {previewData?.length || 0} rows
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Button 
                          variant="ghost" 
                          size="sm"
                          onClick={() => setShowPreview(!showPreview)}
                        >
                          <Eye className="h-4 w-4 mr-2" />
                          {showPreview ? 'Hide' : 'Show'} Preview
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Data Preview */}
                {showPreview && previewData?.length || 0 > 0 && (
                  <Card>
                    <CardHeader>
                      <CardTitle>Data Preview (First 5 rows)</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="overflow-x-auto">
                        <table className="w-full text-sm">
                          <thead>
                            <tr className="border-b">
                              {previewHeaders.map((header, index) => (
                                <th key={index} className="text-left py-2 px-3 font-medium text-gray-600 dark:text-gray-400">
                                  {header}
                                </th>
                              ))}
                            </tr>
                          </thead>
                          <tbody>
                            {previewData.map((row, rowIndex) => (
                              <tr key={rowIndex} className="border-b border-gray-100 dark:border-gray-800">
                                {previewHeaders.map((header, cellIndex) => (
                                  <td key={cellIndex} className="py-2 px-3 text-gray-900 dark:text-white">
                                    {String(row[header]).slice(0, 50)}
                                    {String(row[header])?.length || 0 > 50 && '...'}
                                  </td>
                                ))}
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </CardContent>
                  </Card>
                )}

                {/* Broker Selection */}
                <Card>
                  <CardHeader>
                    <CardTitle>Broker Detection</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                          Select your broker
                        </label>
                        <select
                          value={selectedBroker}
                          onChange={(e) => setSelectedBroker(e.target.value)}
                          className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                        >
                          <option value="">Auto-detect</option>
                          {Object.entries(BROKER_MAPPINGS).map(([key, mapping]) => (
                            <option key={key} value={key}>
                              {mapping.name}
                            </option>
                          ))}
                        </select>
                      </div>
                      
                      {selectedBroker && (
                        <div className="p-3 bg-green-50 dark:bg-green-900/20 rounded-lg">
                          <p className="text-sm text-green-800 dark:text-green-200">
                            Using {BROKER_MAPPINGS[selectedBroker].name} mapping for column interpretation.
                          </p>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            )}

            {step === 'results' && (
              <motion.div
                key="results"
                className="p-6 space-y-6"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
              >
                {importResult && (
                  <>
                    {/* Results Summary */}
                    <Card className={cn(
                      "border-2",
                      importResult.success ? "border-green-200 bg-green-50 dark:bg-green-900/10" :
                      "border-red-200 bg-red-50 dark:bg-red-900/10"
                    )}>
                      <CardContent className="p-6">
                        <div className="flex items-start space-x-4">
                          <div className={cn(
                            "w-12 h-12 rounded-full flex items-center justify-center",
                            importResult.success ? "bg-green-600" : "bg-red-600"
                          )}>
                            {importResult.success ? (
                              <CheckCircle className="h-6 w-6 text-white" />
                            ) : (
                              <XCircle className="h-6 w-6 text-white" />
                            )}
                          </div>
                          
                          <div className="flex-1">
                            <h3 className={cn(
                              "text-lg font-semibold mb-2",
                              importResult.success ? "text-green-900 dark:text-green-200" :
                              "text-red-900 dark:text-red-200"
                            )}>
                              {importResult.success ? 'Import Successful!' : 'Import Failed'}
                            </h3>
                            
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                              <div>
                                <p className="text-2xl font-bold text-gray-900 dark:text-white">
                                  {importResult.totalRows}
                                </p>
                                <p className="text-xs text-gray-600 dark:text-gray-400">
                                  Total Rows
                                </p>
                              </div>
                              
                              <div>
                                <p className="text-2xl font-bold text-green-600">
                                  {importResult.importedRows}
                                </p>
                                <p className="text-xs text-gray-600 dark:text-gray-400">
                                  Imported
                                </p>
                              </div>
                              
                              <div>
                                <p className="text-2xl font-bold text-red-600">
                                  {importResult.errors.filter(e => e.severity === 'error')?.length || 0}
                                </p>
                                <p className="text-xs text-gray-600 dark:text-gray-400">
                                  Errors
                                </p>
                              </div>
                              
                              <div>
                                <p className="text-2xl font-bold text-yellow-600">
                                  {importResult.warnings?.length || 0}
                                </p>
                                <p className="text-xs text-gray-600 dark:text-gray-400">
                                  Warnings
                                </p>
                              </div>
                            </div>

                            {importResult.summary.totalValue > 0 && (
                              <div className="mt-4 p-3 bg-blue-100 dark:bg-blue-900/20 rounded-lg">
                                <p className="text-sm text-blue-800 dark:text-blue-200">
                                  <strong>Portfolio Value:</strong> {formatCurrency(importResult.summary.totalValue)} • 
                                  <strong> Symbols:</strong> {importResult.summary.uniqueSymbols} • 
                                  <strong> Calls:</strong> {importResult.summary.positionsByType.calls} • 
                                  <strong> Puts:</strong> {importResult.summary.positionsByType.puts}
                                </p>
                              </div>
                            )}
                          </div>
                        </div>
                      </CardContent>
                    </Card>

                    {/* Errors and Warnings */}
                    {(importResult.errors?.length || 0 > 0 || importResult.warnings?.length || 0 > 0) && (
                      <Card>
                        <CardHeader>
                          <div className="flex items-center justify-between">
                            <CardTitle className="flex items-center space-x-2">
                              <AlertTriangle className="h-5 w-5 text-orange-600" />
                              <span>Issues Found</span>
                            </CardTitle>
                            <Button 
                              variant="ghost" 
                              size="sm"
                              onClick={() => setShowErrors(!showErrors)}
                            >
                              {showErrors ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                              {showErrors ? 'Hide' : 'Show'} Details
                            </Button>
                          </div>
                        </CardHeader>
                        
                        {showErrors && (
                          <CardContent>
                            <div className="space-y-3 max-h-60 overflow-y-auto">
                              {importResult.errors.map((error, index) => (
                                <div 
                                  key={index}
                                  className={cn(
                                    "p-3 rounded-lg border-l-4",
                                    error.severity === 'error' ? 
                                      "bg-red-50 dark:bg-red-900/10 border-red-500" :
                                      "bg-yellow-50 dark:bg-yellow-900/10 border-yellow-500"
                                  )}
                                >
                                  <div className="flex items-start space-x-2">
                                    <span className={cn(
                                      "text-xs px-2 py-1 rounded font-medium",
                                      error.severity === 'error' ? 
                                        "bg-red-100 text-red-800" :
                                        "bg-yellow-100 text-yellow-800"
                                    )}>
                                      Row {error.row}
                                    </span>
                                    <div className="flex-1">
                                      <p className={cn(
                                        "text-sm font-medium",
                                        error.severity === 'error' ? 
                                          "text-red-800 dark:text-red-200" :
                                          "text-yellow-800 dark:text-yellow-200"
                                      )}>
                                        {error.field && `${error.field}: `}{error.message}
                                      </p>
                                      {error.value && (
                                        <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">
                                          Value: "{error.value}"
                                        </p>
                                      )}
                                    </div>
                                  </div>
                                </div>
                              ))}
                            </div>
                          </CardContent>
                        )}
                      </Card>
                    )}
                  </>
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Footer */}
        <div className="border-t border-gray-200 dark:border-gray-700 p-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              {step !== 'upload' && (
                <Button 
                  variant="ghost" 
                  onClick={() => {
                    if (step === 'preview') setStep('upload')
                    else if (step === 'results') setStep('preview')
                  }}
                >
                  Back
                </Button>
              )}
            </div>
            
            <div className="flex items-center space-x-3">
              {step === 'upload' && (
                <Button variant="ghost" onClick={() => { onClose(); resetState(); }}>
                  Cancel
                </Button>
              )}
              
              {step === 'preview' && (
                <Button 
                  onClick={handleImport}
                  disabled={!csvText || isProcessing}
                >
                  {isProcessing ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Processing...
                    </>
                  ) : (
                    'Import Positions'
                  )}
                </Button>
              )}
              
              {step === 'results' && (
                <div className="flex space-x-3">
                  <Button 
                    variant="ghost" 
                    onClick={() => { onClose(); resetState(); }}
                  >
                    Close
                  </Button>
                  {importResult?.success && importResult.positions?.length || 0 > 0 && (
                    <Button onClick={handleComplete}>
                      Add to Portfolio
                    </Button>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      </motion.div>
    </motion.div>
  )
}