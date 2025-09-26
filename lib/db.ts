import fs from 'fs';
import path from 'path';
import { Database } from '@/types';

const dbPath = path.join(process.cwd(), 'data', 'db.json');

export function readDB(): Database {
  try {
    const data = fs.readFileSync(dbPath, 'utf8');
    return JSON.parse(data);
  } catch (error) {
    console.error('Error reading DB:', error);
    return {
      users: [],
      players: [],
      questions: [],
      gameState: { 
        isActive: false, 
        currentQuestion: null, 
        playersAnswered: [] 
      }
    };
  }
}

export function writeDB(data: Database): boolean {
  try {
    fs.writeFileSync(dbPath, JSON.stringify(data, null, 2));
    return true;
  } catch (error) {
    console.error('Error writing DB:', error);
    return false;
  }
}