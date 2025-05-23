import { NextRequest, NextResponse } from 'next/server';
import { auth } from "@/auth";
import { PrismaClient, Prisma } from '@prisma/client';
import { z } from 'zod';
import { checkNeedsRestock } from '@/lib/utils/pantryUtils';

const prisma = new PrismaClient();

// Zod schema for pantry item update
const pantryItemUpdateSchema = z.object({
  name: z.string().min(1, { message: "Item name is required" }).optional(),
  quantity: z.string().optional(),
  unit: z.string().optional().nullable(),
  category: z.string().optional(),
  usuallyHaveOnHand: z.boolean().optional(),
  currentAmount: z.string().optional(),
  minimumAmount: z.string().optional().nullable(),
  expirationDate: z.string().optional().nullable().transform(val => val ? new Date(val) : null),
  notifyWhenLow: z.boolean().optional()
});

// GET - Get a specific pantry item
export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { id } = params;
    
    // Fetch pantry item
    const pantryItem = await prisma.pantryItem.findUnique({
      where: {
        id,
      }
    });
    
    // Verify the item exists and belongs to the user
    if (!pantryItem || pantryItem.userId !== session.user.id) {
      return NextResponse.json(
        { error: 'Pantry item not found or you do not have access to it' },
        { status: 404 }
      );
    }
    
    return NextResponse.json(pantryItem);
    
  } catch (error) {
    console.error('Failed to fetch pantry item:', error);
    
    return NextResponse.json(
      { 
        error: 'Failed to fetch pantry item', 
        message: error instanceof Error ? error.message : 'Unknown error' 
      },
      { status: 500 }
    );
  }
}

// PUT - Update a pantry item
export async function PUT(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { id } = params;
    
    // Verify the item exists and belongs to the user
    const existingItem = await prisma.pantryItem.findUnique({
      where: {
        id,
      }
    });
    
    if (!existingItem || existingItem.userId !== session.user.id) {
      return NextResponse.json(
        { error: 'Pantry item not found or you do not have access to it' },
        { status: 404 }
      );
    }
    
    // Parse and validate request body
    const rawData = await request.json();
    const validationResult = pantryItemUpdateSchema.safeParse(rawData);
    
    if (!validationResult.success) {
      return NextResponse.json(
        { 
          error: 'Validation error', 
          details: validationResult.error.format()
        },
        { status: 400 }
      );
    }
    
    const updateData = validationResult.data;
    
    // Check if the item needs restocking based on updated values
    const currentAmount = updateData.currentAmount !== undefined ? updateData.currentAmount : existingItem.currentAmount;
    const minimumAmount = updateData.minimumAmount !== undefined ? updateData.minimumAmount : existingItem.minimumAmount;
    
    // Only update needsRestock if relevant values have changed
    let needsRestock = existingItem.needsRestock;
    if (updateData.currentAmount !== undefined || updateData.minimumAmount !== undefined) {
      needsRestock = minimumAmount
        ? checkNeedsRestock({
            ...existingItem,
            currentAmount,
            minimumAmount
          })
        : false;
    }
    
    // Update the pantry item
    const updatedItem = await prisma.pantryItem.update({
      where: {
        id,
      },
      data: {
        ...updateData,
        needsRestock
      }
    }).catch((error) => {
      if (error instanceof Prisma.PrismaClientKnownRequestError) {
        console.error('Database error when updating pantry item:', error);
        throw new Error(`Database error: ${error.message}`);
      }
      throw error;
    });
    
    return NextResponse.json({
      message: 'Pantry item updated successfully',
      item: updatedItem
    });
    
  } catch (error) {
    console.error('Failed to update pantry item:', error);
    
    // Provide different error responses based on the error type
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { 
          error: 'Invalid request data',
          details: error.format() 
        },
        { status: 400 }
      );
    }
    
    return NextResponse.json(
      { error: 'Failed to update pantry item', message: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}

// DELETE - Delete a pantry item
export async function DELETE(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { id } = params;
    
    // Verify the item exists and belongs to the user
    const existingItem = await prisma.pantryItem.findUnique({
      where: {
        id,
      }
    });
    
    if (!existingItem || existingItem.userId !== session.user.id) {
      return NextResponse.json(
        { error: 'Pantry item not found or you do not have access to it' },
        { status: 404 }
      );
    }
    
    // Delete the pantry item
    await prisma.pantryItem.delete({
      where: {
        id,
      }
    }).catch((error) => {
      if (error instanceof Prisma.PrismaClientKnownRequestError) {
        console.error('Database error when deleting pantry item:', error);
        throw new Error(`Database error: ${error.message}`);
      }
      throw error;
    });
    
    return NextResponse.json({
      message: 'Pantry item deleted successfully'
    });
    
  } catch (error) {
    console.error('Failed to delete pantry item:', error);
    
    return NextResponse.json(
      { error: 'Failed to delete pantry item', message: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}