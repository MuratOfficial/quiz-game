import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { AuthRequest, AuthResponse } from '@/types';

export async function POST(request: NextRequest): Promise<NextResponse<AuthResponse>> {
  try {
    const { username, password }: AuthRequest = await request.json();
    
    // Проверка администратора
    const adminUser = await prisma.user.findFirst({
      where: {
        username,
        password,
        isAdmin: true
      }
    });

    if (adminUser) {
      return NextResponse.json({ 
        success: true, 
        user: { 
          id: adminUser.id, 
          username: adminUser.username, 
          isAdmin: true 
        } 
      });
    }

    // Проверка/создание игрока
    let player = await prisma.player.findFirst({
      where: { username }
    });
    
    if (!player) {
      // Новый игрок
      player = await prisma.player.create({
        data: {
          username,
          score: 0,
          isActive: true
        }
      });
      
      return NextResponse.json({ 
        success: true, 
        user: player 
      });
    } else {
      // Активируем существующего игрока
      player = await prisma.player.update({
        where: { id: player.id },
        data: { isActive: true }
      });
      
      return NextResponse.json({ 
        success: true, 
        user: player 
      });
    }
  } catch (error) {
    console.error('Auth error:', error);
    return NextResponse.json({ 
      success: false, 
      error: 'Ошибка авторизации' 
    }, { status: 500 });
  }
}