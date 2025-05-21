import { NextRequest, NextResponse } from 'next/server';
import { getServerSessionWrapper } from '@/lib/auth/session';
import authOptions from '@/lib/auth/authOptions';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

interface Params {
  params: {
    id: string;
  };
}

// POST - Add an item to a shopping list
export async function POST(request: NextRequest, { params }: Params) {
  try {
    const session = await getServerSessionWrapper();
    
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    const data = await request.json();
    const { name, quantity, unit, category } = data;
    
    if (!name) {
      return NextResponse.json(
        { error: 'Name is required' },
        { status: 400 }
      );
    }
    
    // Verify shopping list exists and belongs to user
    const shoppingList = await prisma.shoppingList.findFirst({
      where: {
        id: params.id,
        userId: session.user.id,
      },
    });
    
    if (!shoppingList) {
      return NextResponse.json({ error: 'Shopping list not found' }, { status: 404 });
    }
    
    // Add the item
    const newItem = await prisma.shoppingListItem.create({
      data: {
        shoppingListId: params.id,
        name,
        quantity: quantity || '1',
        unit: unit || null,
        category: category || 'other',
      },
    });
    
    return NextResponse.json({
      message: 'Item added successfully',
      item: newItem,
    });
    
  } catch (error) {
    console.error('Failed to add item:', error);
    return NextResponse.json(
      { error: 'Failed to add item to shopping list' },
      { status: 500 }
    );
  }
}

// PUT - Update items in a shopping list (check/uncheck)
export async function PUT(request: NextRequest, { params }: Params) {
  try {
    const session = await getServerSessionWrapper();
    
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    const data = await request.json();
    const { items } = data;
    
    if (!items || !Array.isArray(items)) {
      return NextResponse.json(
        { error: 'Invalid request format' },
        { status: 400 }
      );
    }
    
    // Verify shopping list exists and belongs to user
    const shoppingList = await prisma.shoppingList.findFirst({
      where: {
        id: params.id,
        userId: session.user.id,
      },
    });
    
    if (!shoppingList) {
      return NextResponse.json({ error: 'Shopping list not found' }, { status: 404 });
    }
    
    // Update items
    const updates = await Promise.all(
      items.map(async (item: { id: string; checked?: boolean }) => {
        return prisma.shoppingListItem.update({
          where: { id: item.id },
          data: { checked: item.checked },
        });
      })
    );
    
    return NextResponse.json({
      message: 'Items updated successfully',
      items: updates,
    });
    
  } catch (error) {
    console.error('Failed to update items:', error);
    return NextResponse.json(
      { error: 'Failed to update items' },
      { status: 500 }
    );
  }
}