import { PrismaClient } from '@prisma/client'

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | null | undefined
}

// Enhanced Prisma client configuration for Netlify deployment
const createPrismaClient = () => {
  try {
    return new PrismaClient({
      log: process.env.NODE_ENV === 'development' ? ['query', 'error', 'warn'] : ['error'],
      datasources: {
        db: {
          url: process.env.DATABASE_URL
        }
      }
    })
  } catch (error) {
    console.error('Failed to create Prisma client:', error)
    // Return a mock client in case of initialization failure
    return null
  }
}

export const prisma = globalForPrisma.prisma ?? createPrismaClient()

if (process.env.NODE_ENV !== 'production') {
  globalForPrisma.prisma = prisma
}

// Graceful error handling for when Prisma client is not available
export const safeExecutePrisma = async <T>(
  operation: (client: PrismaClient) => Promise<T>,
  fallback: T
): Promise<T> => {
  if (!prisma || prisma === null) {
    console.warn('Prisma client not available, returning fallback')
    return fallback
  }
  
  try {
    return await operation(prisma as PrismaClient)
  } catch (error) {
    console.error('Prisma operation failed:', error)
    return fallback
  }
}