
'use client';
import { Difficulty, Language } from '@/types';
import { useState } from 'react';

interface JsonImportFormProps {
    /* eslint-disable  @typescript-eslint/no-explicit-any */
  onImport: (questions: any[]) => void;
  onCancel: () => void;
}

interface JsonQuestion {
  title: string;
  description: string;
  initialCode: string;
  language: Language;
  difficulty: Difficulty;
  points: number;
  category: string;
  expectedOutput?: string;
  requiresManualReview?: boolean;
  testCases: Array<{
    input: string;
    expectedOutput: string;
    isHidden?: boolean;
  }>;
}

export default function JsonImportForm({ onImport, onCancel }: JsonImportFormProps) {
  const [jsonInput, setJsonInput] = useState('');
  const [isValidating, setIsValidating] = useState(false);
  const [validationError, setValidationError] = useState('');
  const [previewQuestions, setPreviewQuestions] = useState<JsonQuestion[]>([]);

  const validateJson = (jsonString: string): JsonQuestion[] => {
    try {
      const parsed = JSON.parse(jsonString);
      
      // Проверяем, что это массив
      if (!Array.isArray(parsed)) {
        throw new Error('JSON должен быть массивом вопросов');
      }

      // Валидируем каждый вопрос
      const validatedQuestions: JsonQuestion[] = parsed.map((question, index) => {
        if (!question.title) throw new Error(`Вопрос ${index + 1}: отсутствует title`);
        if (!question.description) throw new Error(`Вопрос ${index + 1}: отсутствует description`);
        if (!question.initialCode) throw new Error(`Вопрос ${index + 1}: отсутствует initialCode`);
        if (!question.language) throw new Error(`Вопрос ${index + 1}: отсутствует language`);
        if (!question.difficulty) throw new Error(`Вопрос ${index + 1}: отсутствует difficulty`);
        if (!question.points) throw new Error(`Вопрос ${index + 1}: отсутствует points`);
        if (!question.category) throw new Error(`Вопрос ${index + 1}: отсутствует category`);
        
        // Валидация языка
        const validLanguages: Language[] = ['javascript', 'html-css', 'javascript-html-css'];
        if (!validLanguages.includes(question.language)) {
          throw new Error(`Вопрос ${index + 1}: неверный language. Допустимые значения: ${validLanguages.join(', ')}`);
        }

        // Валидация сложности
        const validDifficulties: Difficulty[] = ['easy', 'medium', 'hard'];
        if (!validDifficulties.includes(question.difficulty)) {
          throw new Error(`Вопрос ${index + 1}: неверный difficulty. Допустимые значения: ${validDifficulties.join(', ')}`);
        }

        // Валидация тест кейсов
        if (!question.testCases || !Array.isArray(question.testCases) || question.testCases.length === 0) {
          throw new Error(`Вопрос ${index + 1}: необходим хотя бы один testCase`);
        }
/* eslint-disable  @typescript-eslint/no-explicit-any */
        question.testCases.forEach((testCase: any, testIndex: number) => {
          if (!testCase.input) throw new Error(`Вопрос ${index + 1}, тест ${testIndex + 1}: отсутствует input`);
          if (!testCase.expectedOutput) throw new Error(`Вопрос ${index + 1}, тест ${testIndex + 1}: отсутствует expectedOutput`);
        });

        return {
          ...question,
          points: Number(question.points),
          requiresManualReview: Boolean(question.requiresManualReview),
          /* eslint-disable  @typescript-eslint/no-explicit-any */
          testCases: question.testCases.map((tc: any) => ({
            input: String(tc.input),
            expectedOutput: String(tc.expectedOutput),
            isHidden: Boolean(tc.isHidden)
          }))
        };
      });

      return validatedQuestions;
      /* eslint-disable  @typescript-eslint/no-explicit-any */
    } catch (error: any) {
      throw new Error(`Ошибка валидации JSON: ${error.message}`);
    }
  };

  const handleValidate = () => {
    setIsValidating(true);
    setValidationError('');
    setPreviewQuestions([]);

    try {
      const questions = validateJson(jsonInput);
      setPreviewQuestions(questions);
      /* eslint-disable  @typescript-eslint/no-explicit-any */
    } catch (error: any) {
      setValidationError(error.message);
    } finally {
      setIsValidating(false);
    }
  };

  const handleImport = async () => {
    if (previewQuestions.length === 0) {
      setValidationError('Сначала проверьте JSON');
      return;
    }

    try {
      // Импортируем каждый вопрос
      const results = [];
      for (const question of previewQuestions) {
        const response = await fetch('/api/coding-questions', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(question),
        });

        if (!response.ok) {
          const error = await response.json();
          throw new Error(`Ошибка при импорте вопроса "${question.title}": ${error.error}`);
        }

        results.push(await response.json());
      }

      onImport(results);
      /* eslint-disable  @typescript-eslint/no-explicit-any */
    } catch (error: any) {
      setValidationError(error.message);
    }
  };

  const loadExample = () => {
    const example = `[
  {
    "title": "Сумма двух чисел",
    "description": "Напишите функцию sum, которая принимает два числа и возвращает их сумму.",
    "initialCode": "function sum(a, b) {\\n  // Напишите ваш код здесь\\n}",
    "language": "javascript",
    "difficulty": "easy",
    "points": 5,
    "category": "Основы JavaScript",
    "requiresManualReview": false,
    "testCases": [
      {
        "input": "2, 3",
        "expectedOutput": "5",
        "isHidden": false
      },
      {
        "input": "-1, 1",
        "expectedOutput": "0",
        "isHidden": false
      },
      {
        "input": "10, -5",
        "expectedOutput": "5",
        "isHidden": true
      }
    ]
  },
  {
    "title": "Проверка четности",
    "description": "Напишите функцию isEven, которая принимает число и возвращает true если число четное, и false если нечетное.",
    "initialCode": "function isEven(number) {\\n  // Напишите ваш код здесь\\n}",
    "language": "javascript",
    "difficulty": "easy",
    "points": 5,
    "category": "Условия",
    "requiresManualReview": false,
    "testCases": [
      {
        "input": "4",
        "expectedOutput": "true",
        "isHidden": false
      },
      {
        "input": "7",
        "expectedOutput": "false",
        "isHidden": false
      },
      {
        "input": "0",
        "expectedOutput": "true",
        "isHidden": true
      }
    ]
  }
]`;
    setJsonInput(example);
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      <div className="bg-white p-6 rounded-lg shadow-lg">
        <h2 className="text-2xl font-bold mb-6">Импорт задач через JSON</h2>

        {/* Инструкции */}
        <div className="mb-6 p-4 bg-blue-50 rounded-lg">
          <h3 className="font-semibold text-blue-800 mb-2">Формат JSON:</h3>
          <ul className="text-sm text-blue-700 space-y-1 list-disc list-inside">
            <li>JSON должен быть массивом объектов</li>
            <li>Каждый объект представляет одну задачу</li>
            <li>Обязательные поля: title, description, initialCode, language, difficulty, points, category, testCases</li>
            <li>language: javascript, html-css, javascript-html-css</li>
            <li>difficulty: easy, medium, hard</li>
            <li>testCases должен содержать массив объектов с input и expectedOutput</li>
          </ul>
          <button
            type="button"
            onClick={loadExample}
            className="mt-3 px-4 py-2 bg-blue-500 text-white rounded text-sm hover:bg-blue-600"
          >
            Загрузить пример
          </button>
        </div>

        {/* Поле ввода JSON */}
        <div className="mb-6">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            JSON данные:
          </label>
          <textarea
            value={jsonInput}
            onChange={(e) => setJsonInput(e.target.value)}
            rows={15}
            className="w-full font-mono text-sm p-4 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
            placeholder="Вставьте JSON массив с задачами..."
            spellCheck={false}
          />
        </div>

        {/* Кнопки валидации */}
        <div className="flex gap-3 mb-6">
          <button
            onClick={handleValidate}
            disabled={!jsonInput.trim() || isValidating}
            className="px-6 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 disabled:opacity-50"
          >
            {isValidating ? 'Проверка...' : 'Проверить JSON'}
          </button>
          
          {previewQuestions.length > 0 && (
            <button
              onClick={handleImport}
              className="px-6 py-2 bg-green-500 text-white rounded-md hover:bg-green-600"
            >
              Импортировать ({previewQuestions.length})
            </button>
          )}
        </div>

        {/* Сообщения об ошибках */}
        {validationError && (
          <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
            <h4 className="font-medium text-red-800 mb-2">Ошибка:</h4>
            <pre className="text-sm text-red-700 whitespace-pre-wrap">{validationError}</pre>
          </div>
        )}

        {/* Предпросмотр */}
        {previewQuestions.length > 0 && (
          <div className="border-t pt-6">
            <h3 className="text-lg font-semibold mb-4">
              Предпросмотр ({previewQuestions.length} задач)
            </h3>
            <div className="space-y-4 max-h-96 overflow-y-auto">
              {previewQuestions.map((question, index) => (
                <div key={index} className="p-4 border border-gray-200 rounded-lg">
                  <div className="flex justify-between items-start mb-2">
                    <h4 className="font-medium text-gray-900">{question.title}</h4>
                    <div className="flex gap-2">
                      <span className={`px-2 py-1 text-xs rounded-full ${
                        question.difficulty === 'easy' ? 'bg-green-100 text-green-800' :
                        question.difficulty === 'medium' ? 'bg-yellow-100 text-yellow-800' :
                        'bg-red-100 text-red-800'
                      }`}>
                        {question.difficulty}
                      </span>
                      <span className="px-2 py-1 bg-blue-100 text-blue-800 rounded text-xs">
                        {question.points} очков
                      </span>
                    </div>
                  </div>
                  <p className="text-sm text-gray-600 mb-2">{question.description}</p>
                  <div className="text-xs text-gray-500">
                    <span>Язык: {question.language}</span>
                    <span className="mx-2">•</span>
                    <span>Категория: {question.category}</span>
                    <span className="mx-2">•</span>
                    <span>Тестов: {question.testCases.length}</span>
                    {question.requiresManualReview && (
                      <>
                        <span className="mx-2">•</span>
                        <span className="text-orange-600">Ручная проверка</span>
                      </>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Кнопки действий */}
        <div className="flex justify-end space-x-4 pt-6 border-t">
          <button
            type="button"
            onClick={onCancel}
            className="px-6 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
          >
            Отмена
          </button>
        </div>
      </div>
    </div>
  );
}