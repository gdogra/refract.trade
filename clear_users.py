#!/usr/bin/env python3
"""
Script to clear users from the database for testing.
"""
import os
from pathlib import Path

# Load environment variables from .env.local file
def load_env():
    env_file = Path(__file__).parent / '.env.local'
    if env_file.exists():
        with open(env_file) as f:
            for line in f:
                line = line.strip()
                if line and not line.startswith('#') and '=' in line:
                    key, value = line.split('=', 1)
                    # Remove quotes from values
                    value = value.strip('"')
                    os.environ[key] = value

load_env()

try:
    import psycopg2
    from psycopg2 import sql
except ImportError:
    print("psycopg2 not installed. Installing...")
    os.system("pip install psycopg2-binary")
    import psycopg2
    from psycopg2 import sql

def clear_users():
    """Clear all users from the database."""
    db_url = os.getenv('DATABASE_URL')
    if not db_url:
        print("❌ DATABASE_URL not found in environment")
        return False
    
    try:
        # Parse the database URL
        import urllib.parse
        parsed = urllib.parse.urlparse(db_url)
        
        print(f"Connecting to database: {parsed.hostname}:{parsed.port}/{parsed.path[1:]}")
        
        # Connect to database
        conn = psycopg2.connect(
            host=parsed.hostname,
            port=parsed.port,
            database=parsed.path[1:],
            user=parsed.username,
            password=parsed.password
        )
        
        cursor = conn.cursor()
        
        # Check current users
        cursor.execute("SELECT COUNT(*) FROM users;")
        user_count = cursor.fetchone()[0]
        print(f"📊 Current users in database: {user_count}")
        
        if user_count > 0:
            # Show existing users
            cursor.execute("SELECT id, name, email, email_verified, created_at FROM users ORDER BY created_at;")
            users = cursor.fetchall()
            
            print("\n📋 Current users:")
            for user in users:
                print(f"  - ID: {user[0]}, Name: {user[1]}, Email: {user[2]}, Verified: {user[3]}, Created: {user[4]}")
            
            # Clear users
            print(f"\n🗑️  Removing {user_count} users...")
            cursor.execute("DELETE FROM users;")
            conn.commit()
            
            print("✅ All users removed successfully!")
        else:
            print("✅ Database is already empty (no users found)")
        
        cursor.close()
        conn.close()
        return True
        
    except Exception as e:
        print(f"❌ Database error: {e}")
        return False

if __name__ == "__main__":
    print("🧹 Clearing users from database...")
    success = clear_users()
    if success:
        print("\n✅ Database cleared. Ready for testing signup workflow!")
    else:
        print("\n❌ Failed to clear database. Please check database connection.")