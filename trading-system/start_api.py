#!/usr/bin/env python3
"""
Startup script for trading system API.
"""

import os
import sys

# Load environment variables from .env file
from pathlib import Path

def load_env():
    """Load environment variables from .env file."""
    env_file = Path(__file__).parent / '.env'
    if env_file.exists():
        with open(env_file) as f:
            for line in f:
                line = line.strip()
                if line and not line.startswith('#') and '=' in line:
                    key, value = line.split('=', 1)
                    os.environ[key] = value

# Load environment
load_env()

# Set Python path
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

# Import and run main
if __name__ == "__main__":
    import uvicorn
    
    # Check required environment variables
    required_vars = ['ALPACA_API_KEY', 'ALPACA_SECRET_KEY', 'TRADING_API_KEY']
    missing_vars = [var for var in required_vars if not os.getenv(var)]
    
    if missing_vars:
        print(f"❌ Missing required environment variables: {missing_vars}")
        print("Please check your .env file")
        exit(1)
    
    print("🚀 Starting Trading System API...")
    print(f"✅ Alpaca API Key: {os.getenv('ALPACA_API_KEY')[:8]}...")
    print(f"✅ Base URL: {os.getenv('ALPACA_BASE_URL')}")
    print(f"✅ Paper Trading: {os.getenv('PAPER_TRADING', 'true')}")
    
    # Run the server
    uvicorn.run(
        "api.main:app",
        host="0.0.0.0",
        port=8000,
        reload=False,  # Disable reload for production
        log_level="info"
    )