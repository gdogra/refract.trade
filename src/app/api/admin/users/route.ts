import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

// GET - Fetch all users for admin
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession()
    
    if (!session?.user?.id) {
      return NextResponse.json({
        success: false,
        error: 'Authentication required'
      }, { status: 401 })
    }
    
    // Verify admin status
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { isAdmin: true }
    })
    
    if (!user?.isAdmin) {
      return NextResponse.json({
        success: false,
        error: 'Admin access required'
      }, { status: 403 })
    }
    
    // Get URL parameters for filtering and pagination
    const url = new URL(request.url)
    const search = url.searchParams.get('search') || ''
    const status = url.searchParams.get('status') || 'all'
    const limit = parseInt(url.searchParams.get('limit') || '50')
    const offset = parseInt(url.searchParams.get('offset') || '0')
    
    // Build where clause
    const where: any = {}
    
    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { email: { contains: search, mode: 'insensitive' } }
      ]
    }
    
    if (status === 'active') {
      where.updatedAt = {
        gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) // Last 30 days
      }
    } else if (status === 'inactive') {
      where.updatedAt = {
        lt: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)
      }
    } else if (status === 'admin') {
      where.isAdmin = true
    }
    
    // Get users with counts
    const [users, totalCount] = await Promise.all([
      prisma.user.findMany({
        where,
        select: {
          id: true,
          name: true,
          email: true,
          image: true,
          isAdmin: true,
          createdAt: true,
          updatedAt: true,
          _count: {
            select: {
              feedback: true,
              notes: true
            }
          }
        },
        orderBy: { createdAt: 'desc' },
        take: limit,
        skip: offset
      }),
      prisma.user.count({ where })
    ])
    
    return NextResponse.json({
      success: true,
      data: {
        users,
        pagination: {
          total: totalCount,
          limit,
          offset,
          hasMore: offset + limit < totalCount
        }
      }
    })
    
  } catch (error) {
    console.error('Admin users fetch error:', error)
    
    return NextResponse.json({
      success: false,
      error: 'Failed to fetch users'
    }, { status: 500 })
  }
}

// PATCH - Update user (admin status, notes, etc.)
export async function PATCH(request: NextRequest) {
  try {
    const session = await getServerSession()
    
    if (!session?.user?.id) {
      return NextResponse.json({
        success: false,
        error: 'Authentication required'
      }, { status: 401 })
    }
    
    // Verify admin status
    const admin = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { isAdmin: true }
    })
    
    if (!admin?.isAdmin) {
      return NextResponse.json({
        success: false,
        error: 'Admin access required'
      }, { status: 403 })
    }
    
    const body = await request.json()
    const { userId, isAdmin, note } = body
    
    if (!userId) {
      return NextResponse.json({
        success: false,
        error: 'User ID required'
      }, { status: 400 })
    }
    
    // Prevent self-demotion
    if (userId === session.user.id && isAdmin === false) {
      return NextResponse.json({
        success: false,
        error: 'Cannot remove admin status from yourself'
      }, { status: 400 })
    }
    
    // Update user
    const updateData: any = {}
    if (typeof isAdmin === 'boolean') {
      updateData.isAdmin = isAdmin
    }
    
    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: updateData,
      select: {
        id: true,
        name: true,
        email: true,
        isAdmin: true,
        createdAt: true,
        updatedAt: true
      }
    })
    
    // Add note if provided
    if (note?.trim()) {
      await prisma.userNote.create({
        data: {
          userId,
          adminId: session.user.id,
          note: note.trim(),
          type: isAdmin !== undefined ? 'admin_update' : 'general'
        }
      })
    }
    
    // Log admin action
    await prisma.adminAction.create({
      data: {
        adminId: session.user.id,
        action: 'user_updated',
        details: {
          userId,
          changes: updateData,
          note: note?.trim() || null
        }
      }
    })
    
    return NextResponse.json({
      success: true,
      data: updatedUser
    })
    
  } catch (error) {
    console.error('Admin user update error:', error)
    
    return NextResponse.json({
      success: false,
      error: 'Failed to update user'
    }, { status: 500 })
  }
}

// DELETE - Delete user account
export async function DELETE(request: NextRequest) {
  try {
    const session = await getServerSession()
    
    if (!session?.user?.id) {
      return NextResponse.json({
        success: false,
        error: 'Authentication required'
      }, { status: 401 })
    }
    
    // Verify admin status
    const admin = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { isAdmin: true }
    })
    
    if (!admin?.isAdmin) {
      return NextResponse.json({
        success: false,
        error: 'Admin access required'
      }, { status: 403 })
    }
    
    const { searchParams } = new URL(request.url)
    const userId = searchParams.get('userId')
    
    if (!userId) {
      return NextResponse.json({
        success: false,
        error: 'User ID required'
      }, { status: 400 })
    }
    
    // Prevent self-deletion
    if (userId === session.user.id) {
      return NextResponse.json({
        success: false,
        error: 'Cannot delete your own account'
      }, { status: 400 })
    }
    
    // Get user details for logging
    const userToDelete = await prisma.user.findUnique({
      where: { id: userId },
      select: { email: true, name: true }
    })
    
    if (!userToDelete) {
      return NextResponse.json({
        success: false,
        error: 'User not found'
      }, { status: 404 })
    }
    
    // Delete user and related data (cascade handled by Prisma)
    await prisma.user.delete({
      where: { id: userId }
    })
    
    // Log admin action
    await prisma.adminAction.create({
      data: {
        adminId: session.user.id,
        action: 'user_deleted',
        details: {
          deletedUserId: userId,
          deletedUserEmail: userToDelete.email,
          deletedUserName: userToDelete.name
        }
      }
    })
    
    return NextResponse.json({
      success: true,
      message: 'User deleted successfully'
    })
    
  } catch (error) {
    console.error('Admin user delete error:', error)
    
    return NextResponse.json({
      success: false,
      error: 'Failed to delete user'
    }, { status: 500 })
  }
}