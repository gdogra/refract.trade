/**
 * CSV Import Service
 * Handles importing positions from various brokers with validation and transformation
 */

export interface CSVImportResult {
  success: boolean
  totalRows: number
  importedRows: number
  errors: ImportError[]
  warnings: ImportWarning[]
  positions: ImportedPosition[]
  summary: ImportSummary
}

export interface ImportError {
  row: number
  field?: string
  message: string
  value?: string
  severity: 'error' | 'warning'
}

export interface ImportWarning {
  row: number
  field: string
  message: string
  suggestedValue?: string
}

export interface ImportedPosition {
  symbol: string
  type: 'call' | 'put'
  strike: number
  expiry: Date
  quantity: number
  entryPrice: number
  entryDate: Date
  notes?: string
  broker?: string
  accountId?: string
  originalData?: Record<string, any>
}

export interface ImportSummary {
  totalValue: number
  positionsByType: {
    calls: number
    puts: number
  }
  positionsByExpiry: Record<string, number>
  uniqueSymbols: number
  brokerTypes: string[]
}

export interface BrokerMapping {
  name: string
  fields: {
    symbol: string | string[]
    type: string | string[]
    strike: string | string[]
    expiry: string | string[]
    quantity: string | string[]
    entryPrice: string | string[]
    entryDate: string | string[]
    [key: string]: string | string[]
  }
  transforms?: {
    [field: string]: (value: any, row: any) => any
  }
  validators?: {
    [field: string]: (value: any) => string | null
  }
}

// Predefined broker mappings
export const BROKER_MAPPINGS: Record<string, BrokerMapping> = {
  'interactive_brokers': {
    name: 'Interactive Brokers',
    fields: {
      symbol: ['Symbol', 'UnderlyingSymbol', 'Underlying Symbol'],
      type: ['C/P', 'Right', 'Call/Put'],
      strike: ['Strike', 'Strike Price'],
      expiry: ['Expiry', 'Expiration Date', 'Exp Date'],
      quantity: ['Quantity', 'Pos', 'Position'],
      entryPrice: ['Avg Price', 'Price', 'Average Price'],
      entryDate: ['Date/Time', 'Trade Date', 'Date']
    },
    transforms: {
      type: (value: any) => {
        const val = String(value).toUpperCase()
        if (val.includes('C') || val.includes('CALL')) return 'call'
        if (val.includes('P') || val.includes('PUT')) return 'put'
        return value
      },
      expiry: (value: any) => {
        // Handle various date formats
        if (typeof value === 'string') {
          // Handle formats like "20240315" or "240315"
          if (/^\d{6,8}$/.test(value)) {
            const year = value.length === 8 ? value.slice(0, 4) : '20' + value.slice(0, 2)
            const month = value.slice(-4, -2)
            const day = value.slice(-2)
            return new Date(`${year}-${month}-${day}`)
          }
        }
        return new Date(value)
      }
    }
  },
  
  'schwab': {
    name: 'Charles Schwab',
    fields: {
      symbol: ['Symbol', 'Root Symbol'],
      type: ['Type', 'Option Type'],
      strike: ['Strike Price', 'Strike'],
      expiry: ['Expiration Date', 'Exp Date'],
      quantity: ['Quantity', 'Shares'],
      entryPrice: ['Price', 'Execution Price'],
      entryDate: ['Date', 'Trade Date']
    },
    transforms: {
      type: (value: any) => {
        const val = String(value).toLowerCase()
        if (val.includes('call')) return 'call'
        if (val.includes('put')) return 'put'
        return value
      }
    }
  },
  
  'tastytrade': {
    name: 'tastytrade',
    fields: {
      symbol: ['Underlying Symbol', 'Symbol'],
      type: ['Call/Put', 'Type'],
      strike: ['Strike Price'],
      expiry: ['Exp Date', 'Expiration'],
      quantity: ['Quantity'],
      entryPrice: ['Avg Fill Price', 'Fill Price'],
      entryDate: ['Date']
    },
    transforms: {
      type: (value: any) => String(value).toLowerCase()
    }
  },
  
  'robinhood': {
    name: 'Robinhood',
    fields: {
      symbol: ['symbol', 'underlying_symbol'],
      type: ['type', 'option_type'],
      strike: ['strike_price'],
      expiry: ['expiration_date'],
      quantity: ['quantity'],
      entryPrice: ['price', 'average_price'],
      entryDate: ['created_at', 'date']
    },
    transforms: {
      type: (value: any) => String(value).toLowerCase(),
      quantity: (value: any, row: any) => {
        // Robinhood might have separate buy/sell indicators
        const side = row.side || row.direction || ''
        const qty = Number(value) || 0
        return side.toLowerCase().includes('sell') ? -qty : qty
      }
    }
  },

  'generic': {
    name: 'Generic',
    fields: {
      symbol: ['symbol', 'ticker', 'underlying'],
      type: ['type', 'option_type', 'call_put'],
      strike: ['strike', 'strike_price'],
      expiry: ['expiry', 'expiration', 'exp_date'],
      quantity: ['quantity', 'qty', 'contracts'],
      entryPrice: ['price', 'entry_price', 'cost'],
      entryDate: ['date', 'entry_date', 'trade_date']
    }
  }
}

class CSVImportService {
  private brokerMappings = BROKER_MAPPINGS

  /**
   * Parse CSV text and return structured data
   */
  parseCSV(csvText: string, hasHeaders: boolean = true): any[] {
    const lines = csvText.trim().split('\n')
    if (lines.length === 0) return []

    const headers = hasHeaders ? this.parseCSVLine(lines[0]) : []
    const startRow = hasHeaders ? 1 : 0

    const data: any[] = []
    
    for (let i = startRow; i < lines.length; i++) {
      const values = this.parseCSVLine(lines[i])
      if (values.length === 0) continue // Skip empty lines

      if (hasHeaders) {
        const row: any = {}
        headers.forEach((header, index) => {
          row[header.trim()] = values[index]?.trim() || ''
        })
        data.push(row)
      } else {
        data.push(values)
      }
    }

    return data
  }

  /**
   * Parse a single CSV line handling quotes and commas
   */
  private parseCSVLine(line: string): string[] {
    const values: string[] = []
    let current = ''
    let inQuotes = false
    
    for (let i = 0; i < line.length; i++) {
      const char = line[i]
      
      if (char === '"') {
        if (inQuotes && line[i + 1] === '"') {
          // Escaped quote
          current += '"'
          i++ // Skip next quote
        } else {
          // Toggle quote mode
          inQuotes = !inQuotes
        }
      } else if (char === ',' && !inQuotes) {
        // Field separator
        values.push(current)
        current = ''
      } else {
        current += char
      }
    }
    
    values.push(current) // Last field
    return values
  }

  /**
   * Detect broker type from CSV headers
   */
  detectBroker(headers: string[]): string {
    const headerSet = new Set(headers.map(h => h.toLowerCase().trim()))
    
    // Score each broker mapping
    const scores: Record<string, number> = {}
    
    for (const [brokerId, mapping] of Object.entries(this.brokerMappings)) {
      let score = 0
      
      for (const fieldMappings of Object.values(mapping.fields)) {
        const mappings = Array.isArray(fieldMappings) ? fieldMappings : [fieldMappings]
        
        for (const field of mappings) {
          if (headerSet.has(field.toLowerCase())) {
            score += 1
            break // Only count once per field
          }
        }
      }
      
      scores[brokerId] = score
    }
    
    // Return broker with highest score, fallback to generic
    const bestBroker = Object.entries(scores).reduce((best, [broker, score]) => 
      score > best.score ? { broker, score } : best,
      { broker: 'generic', score: 0 }
    )
    
    return bestBroker.broker
  }

  /**
   * Import positions from CSV data
   */
  async importPositions(
    csvText: string,
    brokerType?: string,
    customMapping?: Partial<BrokerMapping>
  ): Promise<CSVImportResult> {
    const errors: ImportError[] = []
    const warnings: ImportWarning[] = []
    const positions: ImportedPosition[] = []
    
    try {
      // Parse CSV
      const rawData = this.parseCSV(csvText, true)
      if (rawData.length === 0) {
        return {
          success: false,
          totalRows: 0,
          importedRows: 0,
          errors: [{ row: 0, message: 'No data found in CSV', severity: 'error' }],
          warnings: [],
          positions: [],
          summary: this.createEmptySummary()
        }
      }

      // Detect broker if not specified
      const headers = Object.keys(rawData[0])
      const detectedBroker = brokerType || this.detectBroker(headers)
      let mapping = this.brokerMappings[detectedBroker] || this.brokerMappings.generic
      
      // Apply custom mapping if provided
      if (customMapping) {
        mapping = {
          ...mapping,
          fields: { ...mapping.fields, ...customMapping.fields },
          transforms: { ...mapping.transforms, ...customMapping.transforms }
        }
      }

      // Process each row
      for (let i = 0; i < rawData.length; i++) {
        const row = rawData[i]
        const rowNum = i + 2 // +2 because of header and 0-based index
        
        try {
          const position = this.processRow(row, mapping, rowNum, errors, warnings)
          if (position) {
            position.broker = mapping.name
            positions.push(position)
          }
        } catch (error) {
          errors.push({
            row: rowNum,
            message: error instanceof Error ? error.message : 'Failed to process row',
            severity: 'error'
          })
        }
      }

      // Generate summary
      const summary = this.generateSummary(positions)
      
      return {
        success: errors.filter(e => e.severity === 'error').length === 0,
        totalRows: rawData.length,
        importedRows: positions.length,
        errors,
        warnings,
        positions,
        summary
      }

    } catch (error) {
      return {
        success: false,
        totalRows: 0,
        importedRows: 0,
        errors: [{
          row: 0,
          message: error instanceof Error ? error.message : 'Import failed',
          severity: 'error'
        }],
        warnings: [],
        positions: [],
        summary: this.createEmptySummary()
      }
    }
  }

  /**
   * Process a single row into a position
   */
  private processRow(
    row: any,
    mapping: BrokerMapping,
    rowNum: number,
    errors: ImportError[],
    warnings: ImportWarning[]
  ): ImportedPosition | null {
    const position: Partial<ImportedPosition> = {
      originalData: { ...row }
    }

    // Extract and validate each field
    for (const [fieldName, fieldMappings] of Object.entries(mapping.fields)) {
      const mappings = Array.isArray(fieldMappings) ? fieldMappings : [fieldMappings]
      let value: any = undefined
      
      // Find first matching field
      for (const mapping of mappings) {
        if (row[mapping] !== undefined && row[mapping] !== '') {
          value = row[mapping]
          break
        }
      }
      
      // Apply transforms
      if (value !== undefined && mapping.transforms?.[fieldName]) {
        try {
          value = mapping.transforms[fieldName](value, row)
        } catch (error) {
          warnings.push({
            row: rowNum,
            field: fieldName,
            message: `Transform failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
            suggestedValue: String(value)
          })
        }
      }
      
      // Validate and convert
      const validationResult = this.validateAndConvertField(fieldName, value, rowNum)
      if (validationResult.error) {
        errors.push({
          row: rowNum,
          field: fieldName,
          message: validationResult.error,
          value: String(value),
          severity: validationResult.required ? 'error' : 'warning'
        })
        
        if (validationResult.required) {
          return null // Skip this row
        }
      }
      
      if (validationResult.value !== undefined) {
        (position as any)[fieldName] = validationResult.value
      }
    }

    // Final validation
    const requiredFields = ['symbol', 'type', 'strike', 'expiry', 'quantity']
    for (const field of requiredFields) {
      if ((position as any)[field] === undefined) {
        errors.push({
          row: rowNum,
          field,
          message: `Required field "${field}" is missing or invalid`,
          severity: 'error'
        })
        return null
      }
    }

    // Set defaults
    if (!position.entryPrice) position.entryPrice = 0
    if (!position.entryDate) position.entryDate = new Date()

    return position as ImportedPosition
  }

  /**
   * Validate and convert a field value
   */
  private validateAndConvertField(
    fieldName: string,
    value: any,
    rowNum: number
  ): { value?: any; error?: string; required?: boolean } {
    if (value === undefined || value === null || value === '') {
      return { required: ['symbol', 'type', 'strike', 'expiry', 'quantity'].includes(fieldName) }
    }

    try {
      switch (fieldName) {
        case 'symbol':
          const symbol = String(value).trim().toUpperCase()
          if (!/^[A-Z]{1,5}$/.test(symbol)) {
            return { error: 'Invalid symbol format (should be 1-5 letters)' }
          }
          return { value: symbol }

        case 'type':
          const type = String(value).toLowerCase().trim()
          if (type === 'call' || type === 'c') return { value: 'call' }
          if (type === 'put' || type === 'p') return { value: 'put' }
          return { error: 'Type must be "call" or "put"' }

        case 'strike':
          const strike = Number(value)
          if (isNaN(strike) || strike <= 0) {
            return { error: 'Strike must be a positive number' }
          }
          return { value: strike }

        case 'expiry':
          let expiry: Date
          if (value instanceof Date) {
            expiry = value
          } else {
            expiry = new Date(value)
          }
          
          if (isNaN(expiry.getTime())) {
            return { error: 'Invalid expiry date format' }
          }
          
          if (expiry <= new Date()) {
            return { error: 'Expiry date must be in the future' }
          }
          
          return { value: expiry }

        case 'quantity':
          const quantity = Number(value)
          if (isNaN(quantity) || quantity === 0) {
            return { error: 'Quantity must be a non-zero number' }
          }
          return { value: Math.round(quantity) }

        case 'entryPrice':
          const price = Number(value)
          if (isNaN(price) || price < 0) {
            return { error: 'Entry price must be a non-negative number' }
          }
          return { value: price }

        case 'entryDate':
          let entryDate: Date
          if (value instanceof Date) {
            entryDate = value
          } else {
            entryDate = new Date(value)
          }
          
          if (isNaN(entryDate.getTime())) {
            return { error: 'Invalid entry date format' }
          }
          
          return { value: entryDate }

        default:
          return { value: String(value).trim() }
      }
    } catch (error) {
      return { error: `Conversion failed: ${error instanceof Error ? error.message : 'Unknown error'}` }
    }
  }

  /**
   * Generate import summary
   */
  private generateSummary(positions: ImportedPosition[]): ImportSummary {
    const summary: ImportSummary = {
      totalValue: 0,
      positionsByType: { calls: 0, puts: 0 },
      positionsByExpiry: {},
      uniqueSymbols: 0,
      brokerTypes: []
    }

    const symbols = new Set<string>()
    const brokers = new Set<string>()

    for (const position of positions) {
      // Total value
      summary.totalValue += Math.abs(position.entryPrice * position.quantity * 100)

      // Count by type
      if (position.type === 'call') {
        summary.positionsByType.calls++
      } else {
        summary.positionsByType.puts++
      }

      // Count by expiry month
      const expiryKey = position.expiry.toISOString().slice(0, 7) // YYYY-MM
      summary.positionsByExpiry[expiryKey] = (summary.positionsByExpiry[expiryKey] || 0) + 1

      // Unique symbols
      symbols.add(position.symbol)

      // Broker types
      if (position.broker) {
        brokers.add(position.broker)
      }
    }

    summary.uniqueSymbols = symbols.size
    summary.brokerTypes = Array.from(brokers)

    return summary
  }

  /**
   * Create empty summary
   */
  private createEmptySummary(): ImportSummary {
    return {
      totalValue: 0,
      positionsByType: { calls: 0, puts: 0 },
      positionsByExpiry: {},
      uniqueSymbols: 0,
      brokerTypes: []
    }
  }

  /**
   * Generate sample CSV for a broker
   */
  generateSampleCSV(brokerType: string): string {
    const mapping = this.brokerMappings[brokerType] || this.brokerMappings.generic
    
    // Generate headers
    const headers: string[] = []
    for (const fieldMappings of Object.values(mapping.fields)) {
      const firstMapping = Array.isArray(fieldMappings) ? fieldMappings[0] : fieldMappings
      headers.push(firstMapping)
    }

    // Generate sample rows
    const sampleRows = [
      {
        symbol: 'AAPL',
        type: 'call',
        strike: 190,
        expiry: '2024-03-15',
        quantity: 5,
        entryPrice: 3.50,
        entryDate: '2024-02-01'
      },
      {
        symbol: 'TSLA',
        type: 'put',
        strike: 240,
        expiry: '2024-03-01',
        quantity: -3,
        entryPrice: 5.80,
        entryDate: '2024-01-15'
      }
    ]

    // Convert to CSV format
    let csv = headers.join(',') + '\n'
    
    for (const row of sampleRows) {
      const values = headers.map(header => {
        const fieldName = this.getFieldNameForHeader(header, mapping)
        const value = (row as any)[fieldName] || ''
        
        // Apply reverse transforms if needed
        if (fieldName === 'type' && brokerType === 'interactive_brokers') {
          return value === 'call' ? 'C' : 'P'
        }
        
        return String(value)
      })
      
      csv += values.map(v => v.includes(',') ? `"${v}"` : v).join(',') + '\n'
    }

    return csv
  }

  /**
   * Get field name from header using mapping
   */
  private getFieldNameForHeader(header: string, mapping: BrokerMapping): string {
    for (const [fieldName, fieldMappings] of Object.entries(mapping.fields)) {
      const mappings = Array.isArray(fieldMappings) ? fieldMappings : [fieldMappings]
      if (mappings.includes(header)) {
        return fieldName
      }
    }
    return 'unknown'
  }

  /**
   * Validate CSV structure before import
   */
  validateCSVStructure(csvText: string): {
    isValid: boolean
    errors: string[]
    suggestions: string[]
    detectedBroker?: string
  } {
    const errors: string[] = []
    const suggestions: string[] = []

    try {
      const data = this.parseCSV(csvText, true)
      
      if (data.length === 0) {
        errors.push('CSV file appears to be empty')
        return { isValid: false, errors, suggestions }
      }

      const headers = Object.keys(data[0])
      if (headers.length === 0) {
        errors.push('No headers detected in CSV')
        return { isValid: false, errors, suggestions }
      }

      const detectedBroker = this.detectBroker(headers)
      const mapping = this.brokerMappings[detectedBroker] || this.brokerMappings.generic

      // Check for required fields
      const requiredFields = ['symbol', 'type', 'strike', 'expiry', 'quantity']
      const missingFields = []

      for (const field of requiredFields) {
        const fieldMappings = Array.isArray(mapping.fields[field]) 
          ? mapping.fields[field] as string[]
          : [mapping.fields[field] as string]
        
        const hasField = fieldMappings.some(mapping => 
          headers.some(header => header.toLowerCase() === mapping.toLowerCase())
        )

        if (!hasField) {
          missingFields.push(field)
        }
      }

      if (missingFields.length > 0) {
        errors.push(`Missing required fields: ${missingFields.join(', ')}`)
        suggestions.push('Ensure your CSV contains columns for symbol, option type, strike price, expiry date, and quantity')
      }

      // Check data quality
      const sampleSize = Math.min(5, data.length)
      for (let i = 0; i < sampleSize; i++) {
        const row = data[i]
        
        // Check for mostly empty rows
        const nonEmptyValues = Object.values(row).filter(v => v && String(v).trim() !== '').length
        if (nonEmptyValues < headers.length * 0.3) {
          suggestions.push(`Row ${i + 2} appears to have mostly empty values`)
        }
      }

      return {
        isValid: errors.length === 0,
        errors,
        suggestions,
        detectedBroker
      }

    } catch (error) {
      errors.push(`Failed to parse CSV: ${error instanceof Error ? error.message : 'Unknown error'}`)
      return { isValid: false, errors, suggestions }
    }
  }
}

// Export singleton instance
export const csvImportService = new CSVImportService()

// Helper functions
export function formatImportResults(result: CSVImportResult): string {
  const parts = []
  
  if (result.success) {
    parts.push(`✅ Successfully imported ${result.importedRows} of ${result.totalRows} positions`)
  } else {
    parts.push(`❌ Import failed: ${result.errors.filter(e => e.severity === 'error').length} errors found`)
  }
  
  if (result.warnings.length > 0) {
    parts.push(`⚠️  ${result.warnings.length} warnings`)
  }
  
  if (result.summary.totalValue > 0) {
    parts.push(`💰 Total portfolio value: $${result.summary.totalValue.toLocaleString()}`)
  }
  
  return parts.join(' • ')
}