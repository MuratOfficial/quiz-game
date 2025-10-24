
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

  codingSubmissions?: CodingSubmission[];
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
  currentCodingQuestion?: string;
  playersAnswered: string[];
  answeredQuestions: string[];
  answeredCodingQuestions: string[];
  createdAt: Date;
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

// types/coding.ts

// Простые интерфейсы без методов для JSON-совместимости
export interface TestCase {
  id: string;
  codingQuestionId: string;
  input: string;
  expectedOutput: string;
  isHidden: boolean;
}

export interface TestResultDetail {
  testCaseId: string;
  input: string;
  expectedOutput: string;
  actualOutput: string;
  passed: boolean;
  isHidden: boolean;
}

// JSON-совместимый тип для testResults
export type TestResultsJson = {
  passed: number;
  total: number;
  details: Array<{
    testCaseId: string;
    input: string;
    expectedOutput: string;
    actualOutput: string;
    passed: boolean;
    isHidden: boolean;
  }>;
};

// Основной интерфейс для сабмишена
export interface CodingSubmission {
  id: string;
  codingQuestionId: string;
  playerId: string;
  code: string;
  language: string;
  testResults?: TestResultsJson; // Используем JSON-совместимый тип
  output?: string;
  isCorrect?: boolean;
  score?: number;
  status: 'pending' | 'approved' | 'rejected';
  reviewFeedback?: string;
  reviewedBy?: string;
  createdAt: Date;
  
  // Relations (optional)
  codingQuestion?: CodingQuestion;
  player?: Player;
}

export type Language = 'javascript' | 'html-css' | 'javascript-html-css';
export type Difficulty = 'easy' | 'medium' | 'hard';

export interface CodingQuestion {
  id: string;
  title: string;
  description: string;
  initialCode: string;
  language: Language;
  difficulty: Difficulty;
  points: number;
  category: string;
  testCases: TestCase[];
  expectedOutput?: string;
  requiresManualReview: boolean;
  createdAt: Date;
  updatedAt: Date;
  codingSubmissions?: CodingSubmission[];
}

export interface Player {
  id: string;
  username: string;
  score: number;
  isActive: boolean;
  createdAt: Date;
  
  // Relations (optional)
  codingSubmissions?: CodingSubmission[];
}

export interface CreateCodingQuestionRequest {
  title: string;
  description: string;
  initialCode: string;
  language: 'javascript' | 'html-css' | 'javascript-html-css';
  difficulty: 'easy' | 'medium' | 'hard';
  points: number;
  category: string;
  testCases: Omit<TestCase, 'id' | 'codingQuestionId'>[];
  expectedOutput?: string;
  requiresManualReview?: boolean;
}

// Запрос на отправку решения
export interface SubmitSolutionRequest {
  codingQuestionId: string;
  playerId: string;
  code: string;
  language: string;
}

// Ответ после отправки решения
export interface SubmitSolutionResponse {
  submission: CodingSubmission;
  message: string;
  correct?: boolean;
  score?: number;
}

// Запрос на проверку решения админом
export interface ReviewSubmissionRequest {
  status: 'approved' | 'rejected';
  feedback?: string;
}
