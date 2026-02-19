export interface BrokerConfig {
  broker: 'tastytrade' | 'ibkr' | 'schwab' | 'etrade'
  apiKey?: string
  apiSecret?: string
  accountId?: string
}

export interface OrderRequest {
  symbol: string
  legs: OrderLeg[]
  orderType: 'market' | 'limit'
  limitPrice?: number
  timeInForce: 'day' | 'gtc'
}

export interface OrderLeg {
  action: 'buy' | 'sell'
  type: 'call' | 'put' | 'stock'
  strike?: number
  expiration?: string
  quantity: number
  price?: number
}

export interface BrokerConnection {
  id: string
  userId: string
  broker: string
  accountId: string
  accessToken: string
  refreshToken?: string
  status: 'connected' | 'disconnected' | 'error'
  lastSync?: Date
  paperAccount: boolean
  syncPositions: boolean
  enableOneClick: boolean
  createdAt: Date
  updatedAt: Date
}

export async function connectBroker(
  userId: string,
  config: BrokerConfig
): Promise<BrokerConnection> {
  const authUrl = getBrokerAuthUrl(config.broker)
  
  // Mock connection creation - in production, use real OAuth flow
  const connection: BrokerConnection = {
    id: `conn_${Date.now()}`,
    userId,
    broker: config.broker,
    accountId: config.accountId || 'pending',
    accessToken: '', // Will be filled after OAuth
    status: 'connected',
    paperAccount: false,
    syncPositions: true,
    enableOneClick: false,
    createdAt: new Date(),
    updatedAt: new Date()
  }

  return connection
}

export async function sendOrderToBroker(
  userId: string,
  broker: string,
  order: OrderRequest
): Promise<{ success: boolean; orderId?: string; error?: string }> {
  // Mock broker connection check
  const connections = await getBrokerConnections(userId)
  const connection = connections.find(c => c.broker === broker && c.status === 'connected')

  if (!connection) {
    throw new Error('Broker not connected')
  }

  // Route to appropriate broker API
  switch (broker) {
    case 'tastytrade':
      return sendToTastytrade(connection, order)
    case 'ibkr':
      return sendToIBKR(connection, order)
    case 'schwab':
      return sendToSchwab(connection, order)
    case 'etrade':
      return sendToETrade(connection, order)
    default:
      throw new Error('Unsupported broker')
  }
}

async function sendToTastytrade(
  connection: BrokerConnection,
  order: OrderRequest
): Promise<{ success: boolean; orderId?: string; error?: string }> {
  const apiUrl = `https://api.tastytrade.com/accounts/${connection.accountId}/orders`
  
  const tastytradeOrder = {
    time_in_force: order.timeInForce.toUpperCase(),
    order_type: order.orderType.toUpperCase(),
    legs: order.legs.map(leg => ({
      instrument_type: leg.type === 'stock' ? 'Equity' : 'Equity Option',
      symbol: leg.type === 'stock' ? order.symbol : buildOptionSymbol(order.symbol, leg),
      action: leg.action === 'buy' ? 'Buy to Open' : 'Sell to Open',
      quantity: leg.quantity,
    })),
    price: order.limitPrice,
  }

  try {
    // Mock successful order - in production, make real API call
    const mockOrderId = `TT_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
    
    console.log('Would send to tastytrade:', tastytradeOrder)
    
    return { 
      success: true, 
      orderId: mockOrderId 
    }
  } catch (error) {
    return { 
      success: false, 
      error: 'Failed to send order to tastytrade' 
    }
  }
}

async function sendToIBKR(
  connection: BrokerConnection,
  order: OrderRequest
): Promise<{ success: boolean; orderId?: string; error?: string }> {
  // Mock IBKR integration
  const mockOrderId = `IBKR_${Date.now()}`
  console.log('Would send to IBKR:', order)
  return { success: true, orderId: mockOrderId }
}

async function sendToSchwab(
  connection: BrokerConnection,
  order: OrderRequest
): Promise<{ success: boolean; orderId?: string; error?: string }> {
  // Mock Schwab integration  
  const mockOrderId = `SCHW_${Date.now()}`
  console.log('Would send to Schwab:', order)
  return { success: true, orderId: mockOrderId }
}

async function sendToETrade(
  connection: BrokerConnection,
  order: OrderRequest
): Promise<{ success: boolean; orderId?: string; error?: string }> {
  // Mock E*TRADE integration
  const mockOrderId = `ETRD_${Date.now()}`
  console.log('Would send to E*TRADE:', order)
  return { success: true, orderId: mockOrderId }
}

function getBrokerAuthUrl(broker: string): string {
  const redirectUri = encodeURIComponent(`${process.env.NEXTAUTH_URL}/api/broker/callback`)
  
  switch (broker) {
    case 'tastytrade':
      return `https://signin.tastytrade.com/oauth/authorize?response_type=code&client_id=${process.env.TASTYTRADE_CLIENT_ID}&redirect_uri=${redirectUri}&scope=read_account,trade`
    case 'ibkr':
      return `https://api.ibkr.com/oauth2/authorize?response_type=code&client_id=${process.env.IBKR_CLIENT_ID}&redirect_uri=${redirectUri}`
    case 'schwab':
      return `https://api.schwab.com/oauth/authorize?response_type=code&client_id=${process.env.SCHWAB_CLIENT_ID}&redirect_uri=${redirectUri}`
    case 'etrade':
      return `https://api.etrade.com/oauth/authorize?response_type=code&client_id=${process.env.ETRADE_CLIENT_ID}&redirect_uri=${redirectUri}`
    default:
      throw new Error('Unsupported broker')
  }
}

function buildOptionSymbol(underlying: string, leg: OrderLeg): string {
  if (leg.type === 'stock') return underlying
  
  // Build standard option symbol format: AAPL240315C00150000
  const exp = leg.expiration?.replace(/-/g, '').slice(2) // YYMMDD
  const callPut = leg.type === 'call' ? 'C' : 'P'
  const strike = (leg.strike! * 1000).toString().padStart(8, '0')
  
  return `${underlying}${exp}${callPut}${strike}`
}

export async function getBrokerConnections(userId: string): Promise<BrokerConnection[]> {
  // Mock connections - in production, fetch from database
  return [
    {
      id: 'conn_1',
      userId,
      broker: 'tastytrade',
      accountId: '5YZ12345',
      accessToken: 'encrypted_token',
      status: 'connected',
      lastSync: new Date(),
      paperAccount: false,
      syncPositions: true,
      enableOneClick: true,
      createdAt: new Date(),
      updatedAt: new Date()
    }
  ]
}

export async function syncBrokerPositions(connection: BrokerConnection): Promise<void> {
  console.log(`Syncing positions from ${connection.broker} account ${connection.accountId}`)
  // In production: Fetch positions from broker API and update database
}

export async function disconnectBroker(connectionId: string): Promise<void> {
  console.log(`Disconnecting broker connection ${connectionId}`)
  // In production: Revoke tokens and update database
}