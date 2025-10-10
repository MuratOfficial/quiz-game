
export interface User {
  id: string;
  username: string;
  password?: string;
  isAdmin: boolean;
}

export interface Player {
  id: string;
  username: string;
  score: number;
  isAdmin?:boolean;
  isActive: boolean;
  createdAt: Date;
}

export interface Question {
  id: string;
  category: 'HTML' | 'CSS' | 'Информатика';
  color: string;
  points: number;
  type: 'multiple' | 'input';
  question: string;
  options?: string[];
  correctAnswer: string;
}

export interface GameState {
  id: string;
  isActive: boolean;
  currentQuestion: string | null;
  playersAnswered: string[];
  answeredQuestions: string[];
}

export interface UserUpdateRequest {
  id: string;
  username?: string;
  password?: string;
  isAdmin?: boolean;
}

export interface BulkQuestionsRequest {
  questions: QuestionRequest[];
}

export interface UserWithStats extends User {
  gamesPlayed?: number;
  lastActive?: Date;
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
    playerId?: string;
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

export interface PlayerUpdateRequest {
  id: string;
  username?: string;
  score?: number;
  isActive?: boolean;
}

export interface AdminPlayer  {
  id: string;
  username: string;
  score: number;
  isAdmin?:boolean;
  isActive: boolean;
  createdAt: Date;
}

export interface CreatePlayerRequest {
  username: string;
  score?: number;
  isActive?: boolean;
}