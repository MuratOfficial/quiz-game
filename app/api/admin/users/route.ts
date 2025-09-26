import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { UserUpdateRequest } from '@/types';

// GET - Получить всех пользователей
export async function GET() {
  try {
    const users = await prisma.user.findMany({
      select: {
        id: true,
        username: true,
        isAdmin: true,
        createdAt: true,
      },
      orderBy: { createdAt: 'desc' }
    });

    const players = await prisma.player.findMany({
      select: {
        id: true,
        username: true,
        score: true,
        isActive: true,
        createdAt: true,
      },
      orderBy: { score: 'desc' }
    });

    return NextResponse.json({
      success: true,
      data: {
        adminUsers: users,
        players: players,
      }
    });
  } catch (error) {
    console.error('Get users error:', error);
    return NextResponse.json(
      { success: false, error: 'Ошибка получения пользователей' },
      { status: 500 }
    );
  }
}

// PUT - Обновить пользователя
export async function PUT(request: NextRequest) {
  try {
    const userData: UserUpdateRequest = await request.json();
    
    // Проверяем, существует ли пользователь
    const existingUser = await prisma.user.findUnique({
      where: { id: userData.id }
    });

    if (!existingUser) {
      return NextResponse.json(
        { success: false, error: 'Пользователь не найден' },
        { status: 404 }
      );
    }

    // Подготавливаем данные для обновления
    /* eslint-disable  @typescript-eslint/no-explicit-any */
    const updateData: any = {};
    if (userData.username !== undefined) updateData.username = userData.username;
    if (userData.password !== undefined) updateData.password = userData.password;
    if (userData.isAdmin !== undefined) updateData.isAdmin = userData.isAdmin;

    const updatedUser = await prisma.user.update({
      where: { id: userData.id },
      data: updateData,
      select: {
        id: true,
        username: true,
        isAdmin: true,
        createdAt: true,
      }
    });

    return NextResponse.json({
      success: true,
      message: 'Пользователь успешно обновлен',
      user: updatedUser
    });
    /* eslint-disable  @typescript-eslint/no-explicit-any */
  } catch (error: any) {
    console.error('Update user error:', error);
    
    if (error.code === 'P2002') {
      return NextResponse.json(
        { success: false, error: 'Пользователь с таким именем уже существует' },
        { status: 400 }
      );
    }
    
    return NextResponse.json(
      { success: false, error: 'Ошибка обновления пользователя' },
      { status: 500 }
    );
  }
}

// DELETE - Удалить пользователя
export async function DELETE(request: NextRequest) {
  try {
    const { id } = await request.json();
    
    await prisma.user.delete({
      where: { id }
    });

    return NextResponse.json({
      success: true,
      message: 'Пользователь успешно удален'
    });
  } catch (error) {
    console.error('Delete user error:', error);
    return NextResponse.json(
      { success: false, error: 'Ошибка удаления пользователя' },
      { status: 500 }
    );
  }
}