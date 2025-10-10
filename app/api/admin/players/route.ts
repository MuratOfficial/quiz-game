import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export interface PlayerUpdateRequest {
  id: string;
  username?: string;
  score?: number;
  isActive?: boolean;
}

// GET - Получить всех игроков с детальной информацией
export async function GET() {
  try {
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
      players
    });
  } catch (error) {
    console.error('Get players error:', error);
    return NextResponse.json(
      { success: false, error: 'Ошибка получения игроков' },
      { status: 500 }
    );
  }
}

// PUT - Обновить игрока
export async function PUT(request: NextRequest) {
  try {
    const playerData: PlayerUpdateRequest = await request.json();
    
    const existingPlayer = await prisma.player.findUnique({
      where: { id: playerData.id }
    });

    if (!existingPlayer) {
      return NextResponse.json(
        { success: false, error: 'Игрок не найден' },
        { status: 404 }
      );
    }
/* eslint-disable  @typescript-eslint/no-explicit-any */
    const updateData: any = {};
    if (playerData.username !== undefined) updateData.username = playerData.username;
    if (playerData.score !== undefined) updateData.score = playerData.score;
    if (playerData.isActive !== undefined) updateData.isActive = playerData.isActive;

    const updatedPlayer = await prisma.player.update({
      where: { id: playerData.id },
      data: updateData,
      select: {
        id: true,
        username: true,
        score: true,
        isActive: true,
        createdAt: true,
      }
    });

    return NextResponse.json({
      success: true,
      message: 'Игрок успешно обновлен',
      player: updatedPlayer
    });
    /* eslint-disable  @typescript-eslint/no-explicit-any */
  } catch (error: any) {
    console.error('Update player error:', error);
    
    if (error.code === 'P2002') {
      return NextResponse.json(
        { success: false, error: 'Игрок с таким именем уже существует' },
        { status: 400 }
      );
    }
    
    return NextResponse.json(
      { success: false, error: 'Ошибка обновления игрока' },
      { status: 500 }
    );
  }
}

// DELETE - Удалить игрока
export async function DELETE(request: NextRequest) {
  try {
    const { id } = await request.json();
    
    await prisma.player.delete({
      where: { id }
    });

    return NextResponse.json({
      success: true,
      message: 'Игрок успешно удален'
    });
  } catch (error) {
    console.error('Delete player error:', error);
    return NextResponse.json(
      { success: false, error: 'Ошибка удаления игрока' },
      { status: 500 }
    );
  }
}

// POST - Создать нового игрока
export async function POST(request: NextRequest) {
  try {
    const { username, score, isActive } = await request.json();
    
    if (!username) {
      return NextResponse.json(
        { success: false, error: 'Имя пользователя обязательно' },
        { status: 400 }
      );
    }

    const newPlayer = await prisma.player.create({
      data: {
        username,
        score: score || 0,
        isActive: isActive !== undefined ? isActive : true,
      },
      select: {
        id: true,
        username: true,
        score: true,
        isActive: true,
        createdAt: true,
      }
    });

    return NextResponse.json({
      success: true,
      message: 'Игрок успешно создан',
      player: newPlayer
    });
    /* eslint-disable  @typescript-eslint/no-explicit-any */
  } catch (error: any) {
    console.error('Create player error:', error);
    
    if (error.code === 'P2002') {
      return NextResponse.json(
        { success: false, error: 'Игрок с таким именем уже существует' },
        { status: 400 }
      );
    }
    
    return NextResponse.json(
      { success: false, error: 'Ошибка создания игрока' },
      { status: 500 }
    );
  }
}