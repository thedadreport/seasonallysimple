import { NextRequest, NextResponse } from 'next/server';
import { getServerSessionWrapper } from '@/lib/auth/session';
import { authOptions } from '@/lib/auth/authOptions';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

interface Params {
  params: {
    id: string;
  };
}

// GET - Get a specific shopping list by ID
export async function GET(request: NextRequest, { params }: Params) {
  try {
    const session = await getServerSessionWrapper();
    
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    const shoppingList = await prisma.shoppingList.findFirst({
      where: {
        id: params.id,
        userId: session.user.id,
      },
      include: {
        mealPlan: true,
        items: {
          orderBy: {
            category: 'asc',
          },
        },
      },
    });
    
    if (!shoppingList) {
      return NextResponse.json({ error: 'Shopping list not found' }, { status: 404 });
    }
    
    return NextResponse.json(shoppingList);
    
  } catch (error) {
    console.error('Failed to fetch shopping list:', error);
    return NextResponse.json(
      { error: 'Failed to fetch shopping list' },
      { status: 500 }
    );
  }
}

// PUT - Update a shopping list
export async function PUT(request: NextRequest, { params }: Params) {
  try {
    const session = await getServerSessionWrapper();
    
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    const data = await request.json();
    const { name } = data;
    
    // Check if the shopping list exists and belongs to the user
    const existingList = await prisma.shoppingList.findFirst({
      where: {
        id: params.id,
        userId: session.user.id,
      },
    });
    
    if (!existingList) {
      return NextResponse.json({ error: 'Shopping list not found' }, { status: 404 });
    }
    
    // Update the shopping list
    const updatedList = await prisma.shoppingList.update({
      where: {
        id: params.id,
      },
      data: {
        name: name || existingList.name,
      },
    });
    
    return NextResponse.json({
      message: 'Shopping list updated successfully',
      shoppingList: updatedList,
    });
    
  } catch (error) {
    console.error('Failed to update shopping list:', error);
    return NextResponse.json(
      { error: 'Failed to update shopping list' },
      { status: 500 }
    );
  }
}

// DELETE - Delete a shopping list
export async function DELETE(request: NextRequest, { params }: Params) {
  try {
    const session = await getServerSessionWrapper();
    
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    // Check if the shopping list exists and belongs to the user
    const existingList = await prisma.shoppingList.findFirst({
      where: {
        id: params.id,
        userId: session.user.id,
      },
    });
    
    if (!existingList) {
      return NextResponse.json({ error: 'Shopping list not found' }, { status: 404 });
    }
    
    // Delete the shopping list (cascade delete will remove items)
    await prisma.shoppingList.delete({
      where: {
        id: params.id,
      },
    });
    
    return NextResponse.json({
      message: 'Shopping list deleted successfully',
    });
    
  } catch (error) {
    console.error('Failed to delete shopping list:', error);
    return NextResponse.json(
      { error: 'Failed to delete shopping list' },
      { status: 500 }
    );
  }
}