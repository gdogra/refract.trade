# Market Data Setup Guide

This app uses **free market data sources** to provide real stock prices and options information. The data may be delayed by 15-20 minutes, which is clearly indicated in the UI.

## Free Data Sources (No Setup Required)

### Yahoo Finance (Primary)
- **Cost**: Free
- **Setup**: No API key required
- **Features**: Stock quotes, basic options data
- **Delay**: 15-20 minutes
- **Rate Limits**: Generous (10+ requests/second)

## Optional Paid Data Sources

If you want additional data sources or potentially better reliability, you can add API keys for these services:

### Alpha Vantage (Free Tier)
1. Go to [Alpha Vantage](https://www.alphavantage.co/support/#api-key)
2. Register for a free account
3. Copy your API key
4. Add to `.env.local`:
   ```
   NEXT_PUBLIC_ALPHA_VANTAGE_API_KEY=your-api-key-here
   ```

**Free Tier Limits:**
- 25 requests per day
- 5 requests per minute

### Finnhub (Free Tier)
1. Go to [Finnhub](https://finnhub.io/register)
2. Register for a free account
3. Copy your API key
4. Add to `.env.local`:
   ```
   NEXT_PUBLIC_FINNHUB_API_KEY=your-api-key-here
   ```

**Free Tier Limits:**
- 60 calls per minute
- Stock quotes and basic company data

## Setup Instructions

1. **Clone and install dependencies**:
   ```bash
   npm install
   ```

2. **Copy environment template**:
   ```bash
   cp .env.example .env.local
   ```

3. **Start the app** (works with Yahoo Finance immediately):
   ```bash
   npm run dev
   ```

4. **Optional**: Add API keys for additional data sources to `.env.local`

## Data Quality and Disclaimers

### Yahoo Finance
- **Pros**: Free, no setup, reliable, covers most US stocks
- **Cons**: 15-20 minute delay, unofficial API
- **Best for**: Development, testing, basic analysis

### Alpha Vantage
- **Pros**: Official API, good documentation
- **Cons**: Low free tier limits (25 requests/day)
- **Best for**: Occasional lookups, small apps

### Finnhub
- **Pros**: Higher rate limits, official API
- **Cons**: Limited free tier features
- **Best for**: More frequent data updates

## Important Notes

1. **Data Delays**: All free sources have delays. This is clearly shown in the UI with timestamps and delay indicators.

2. **Rate Limiting**: The app automatically handles rate limits and caches data to minimize API calls.

3. **Fallback System**: If one data source fails, the app automatically tries the next available source.

4. **Trading Disclaimer**: This data is for informational purposes only. For actual trading, use your broker's real-time data feeds.

## Troubleshooting

### "No data available" errors
1. Check your internet connection
2. Verify the stock symbol is correct (US stocks only)
3. Market might be closed (data still available but delayed)

### Rate limit errors
1. Wait a few minutes for limits to reset
2. Add additional API keys to increase limits
3. Reduce the frequency of data refreshes

### Yahoo Finance errors
- Usually temporary - the app will retry automatically
- Yahoo sometimes blocks requests - adding official API keys as fallbacks helps

## Production Considerations

For production use, consider:

1. **Paid data feeds** for real-time data
2. **Multiple API keys** for redundancy  
3. **Caching strategies** to reduce API calls
4. **Legal compliance** with data provider terms
5. **User disclaimers** about data delays

## Legal Notice

Market data usage must comply with provider terms of service. This implementation is for educational and development purposes. Commercial use may require paid subscriptions and additional legal agreements with data providers.