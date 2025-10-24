
'use client';
import { CodingQuestion, CodingSubmission, TestResultsJson } from '@/types';
import { useState } from 'react';
interface CodingEditorProps {
  question: CodingQuestion;
  playerId: string;
  onSubmit: (submission: CodingSubmission) => void;
}

export default function CodingEditor({ question, playerId, onSubmit }: CodingEditorProps) {
  const [code, setCode] = useState(question.initialCode);
  const [output, setOutput] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isRunning, setIsRunning] = useState(false);
  const [testResults, setTestResults] = useState<TestResultsJson | null>(null);

  const handleRunCode = async () => {
    setIsRunning(true);
    setOutput('');
    
    try {
      // Подготавливаем тест кейсы для выполнения
      const visibleTestCases = question.testCases
        .filter(tc => !tc.isHidden)
        .map(tc => ({
          input: tc.input.split(',').map((item: string) => {
            const trimmed = item.trim();
            // Пытаемся преобразовать в число если возможно
            if (!isNaN(Number(trimmed))) return Number(trimmed);
            // Пытаемся преобразовать в массив если это JSON
            try {
              return JSON.parse(trimmed);
            } catch {
              return trimmed;
            }
          })
        }));

      const response = await fetch('/api/code/execute', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          code, 
          language: question.language,
          testCases: visibleTestCases
        }),
      });
      
      const result = await response.json();
      
      if (result.error) {
        setOutput(`Ошибка: ${result.error}`);
      } else {
        setOutput(result.output || 'Код выполнен успешно, но нет вывода');
      }
    } catch (error) {
      setOutput('Ошибка выполнения кода');
      console.error('Execution error:', error);
    } finally {
      setIsRunning(false);
    }
  };

  const handleSubmit = async () => {
    setIsSubmitting(true);
    try {
      const response = await fetch('/api/coding-submissions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          codingQuestionId: question.id,
          playerId,
          code,
          language: question.language,
        }),
      });
      
      if (!response.ok) {
        throw new Error('Submission failed');
      }
      
      const submission: CodingSubmission = await response.json();
      onSubmit(submission);
    } catch (error) {
      console.error('Submission error:', error);
      setOutput('Ошибка отправки решения');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="flex flex-col h-full space-y-4">
      {/* Описание задачи */}
      <div className="bg-white p-4 rounded-lg shadow">
        <h2 className="text-xl font-bold text-gray-900 mb-2">{question.title}</h2>
        <p className="text-gray-700 mb-4">{question.description}</p>
        <div className="flex gap-2">
          <span className={`px-2 py-1 rounded text-xs font-medium ${
            question.difficulty === 'easy' ? 'bg-green-100 text-green-800' :
            question.difficulty === 'medium' ? 'bg-yellow-100 text-yellow-800' :
            'bg-red-100 text-red-800'
          }`}>
            {question.difficulty}
          </span>
          <span className="px-2 py-1 bg-blue-100 text-blue-800 rounded text-xs font-medium">
            {question.points} очков
          </span>
          <span className="px-2 py-1 bg-gray-100 text-gray-800 rounded text-xs font-medium">
            {question.category}
          </span>
        </div>
      </div>

      <div className="flex-1 grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Редактор кода */}
        <div className="flex flex-col">
          <label className="text-sm font-medium mb-2">Редактор кода</label>
          <textarea
            value={code}
            onChange={(e) => setCode(e.target.value)}
            className="flex-1 font-mono text-sm p-4 border border-gray-300 rounded-lg resize-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            spellCheck={false}
            rows={15}
            placeholder="Напишите ваш код здесь..."
          />
        </div>
        
        {/* Вывод и результаты */}
        <div className="flex flex-col">
          <label className="text-sm font-medium mb-2">Результат выполнения</label>
          <div className="flex-1 border border-gray-300 rounded-lg overflow-hidden flex flex-col">
            {testResults && (
              <div className="p-4 border-b bg-gray-50">
                <h4 className="font-medium mb-2">
                  Результаты тестов: {testResults.passed}/{testResults.total} пройдено
                </h4>
                <div className="space-y-2">
                  {testResults.details.map((detail, index) => (
                    <div key={index} className={`p-2 rounded text-sm ${
                      detail.passed ? 'bg-green-50 border border-green-200' : 'bg-red-50 border border-red-200'
                    }`}>
                      <div className="flex justify-between items-center">
                        <span className="font-medium">Тест {index + 1}</span>
                        <span className={detail.passed ? 'text-green-600' : 'text-red-600'}>
                          {detail.passed ? '✓' : '✗'}
                        </span>
                      </div>
                      {!detail.passed && !detail.isHidden && (
                        <div className="mt-1 text-xs space-y-1">
                          <div>Вход: {detail.input}</div>
                          <div>Ожидалось: {detail.expectedOutput}</div>
                          <div>Получено: {detail.actualOutput}</div>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}
            
            <div className="flex-1 p-4 bg-gray-900 text-green-400 font-mono text-sm overflow-auto">
              <pre className="whitespace-pre-wrap">{output || 'Запустите код чтобы увидеть результат...'}</pre>
            </div>
          </div>
        </div>
      </div>

      {/* Примеры тестов (только видимые) */}
      {question.testCases.filter(tc => !tc.isHidden).length > 0 && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
          <h4 className="font-medium text-yellow-800 mb-2">Примеры тестов:</h4>
          <div className="space-y-2">
            {question.testCases
              .filter(tc => !tc.isHidden)
              .map((testCase, index) => (
                <div key={index} className="text-sm text-yellow-700">
                  <span className="font-medium">Вход:</span> {testCase.input} → 
                  <span className="font-medium"> Ожидаемый вывод:</span> {testCase.expectedOutput}
                </div>
              ))}
          </div>
        </div>
      )}
      
      {/* Кнопки управления */}
      <div className="flex gap-3 justify-end">
        <button
          onClick={handleRunCode}
          disabled={isRunning || isSubmitting}
          className="px-6 py-2 bg-blue-500 text-white rounded-lg font-medium hover:bg-blue-600 disabled:opacity-50 transition-colors"
        >
          {isRunning ? 'Выполнение...' : 'Запустить код'}
        </button>
        
        <button
          onClick={handleSubmit}
          disabled={isSubmitting || isRunning}
          className="px-6 py-2 bg-green-500 text-white rounded-lg font-medium hover:bg-green-600 disabled:opacity-50 transition-colors"
        >
          {isSubmitting ? 'Отправка...' : 'Отправить решение'}
        </button>
      </div>
    </div>
  );
}