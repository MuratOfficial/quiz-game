import { NextRequest, NextResponse } from 'next/server';
import { readDB, writeDB } from '@/lib/db';
import { AuthRequest, AuthResponse, User, Player } from '@/types';

export async function POST(request: NextRequest): Promise<NextResponse<AuthResponse>> {
  try {
    const { username, password }: AuthRequest = await request.json();
    const db = readDB();

    // Проверка администратора
    const adminUser = db.users.find((user: User) => 
      user.username === username && user.password === password && user.isAdmin
    );

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
    let player = db.players.find((p: Player) => p.username === username);
    
    if (!player) {
      // Новый игрок
      const newPlayer: Player = {
        id: Date.now(),
        username,
        score: 0,
        isActive: true
      };
      db.players.push(newPlayer);
      writeDB(db);
      return NextResponse.json({ 
        success: true, 
        user: newPlayer 
      });
    } else {
      // Существующий игрок
      player.isActive = true;
      writeDB(db);
      return NextResponse.json({ 
        success: true, 
        user: player 
      });
    }
  } catch (error) {
    return NextResponse.json({ 
      success: false, 
      error: 'Ошибка авторизации' 
    }, { status: 500 });
  }
}