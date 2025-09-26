export interface User {
  id: number;
  username: string;
  password?: string;
  isAdmin: boolean;
}

export interface Player {
  id: number;
  username: string;
  score: number;
  isActive: boolean;
}

export interface Question {
  id: number;
  category: 'HTML' | 'CSS' | 'Информатика';
  color: string;
  points: number;
  type: 'multiple' | 'input';
  question: string;
  options?: string[];
  correctAnswer: string;
}

export interface GameState {
  isActive: boolean;
  currentQuestion: Question | null;
  playersAnswered: number[];
  answeredQuestions?: number[];
}

export interface Database {
  users: User[];
  players: Player[];
  questions: Question[];
  gameState: GameState;
}

// API Types
export interface AuthRequest {
  username: string;
  password: string;
}

export interface AuthResponse {
  success: boolean;
  user?: User | Player;
  error?: string;
}

export interface GameActionRequest {
  action: 'startGame' | 'nextQuestion' | 'submitAnswer' | 'endGame';
  data?: {
    playerId?: number;
    answer?: string;
  };
}

export interface QuestionRequest {
  category: 'HTML' | 'CSS' | 'Информатика';
  type: 'multiple' | 'input';
  question: string;
  options?: string[];
  correctAnswer: string;
  points: number;
}