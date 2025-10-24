
'use client';
import { useState } from 'react';
import HtmlPreview from './HtmlPreview';
import { CodingQuestion, CodingSubmission, TestResultsJson } from '@/types';

interface CodingEditorProps {
  question: CodingQuestion;
  playerId: string;
  onSubmit: (submission: CodingSubmission) => void;
}

export default function CodingEditorWithPreview({ question, playerId, onSubmit }: CodingEditorProps) {
  const [code, setCode] = useState(question.initialCode);
  const [output, setOutput] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isRunning, setIsRunning] = useState(false);
  const [previewHtml, setPreviewHtml] = useState('');
  const [viewMode, setViewMode] = useState<'split' | 'editor' | 'preview'>('split');
  const [testResults, setTestResults] = useState<TestResultsJson | null>(null);

  const generatePreviewHtml = () => {
    if (question.language === 'javascript') {
      return `
<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <title>JavaScript Preview</title>
    <style>
        body { 
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; 
            padding: 20px; 
            background: #f8f9fa;
        }
        .container {
            max-width: 800px;
            margin: 0 auto;
            background: white;
            padding: 20px;
            border-radius: 8px;
            box-shadow: 0 2px 10px rgba(0,0,0,0.1);
        }
        .output-item {
            background: #e9ecef;
            padding: 10px;
            margin: 8px 0;
            border-radius: 4px;
            border-left: 4px solid #007bff;
        }
        .error {
            background: #f8d7da;
            border-left-color: #dc3545;
            color: #721c24;
        }
    </style>
</head>
<body>
    <div class="container">
        <h3 style="color: #495057; margin-bottom: 20px;">📊 Результат выполнения JavaScript кода:</h3>
        <div id="output"></div>
    </div>
    <script>
        const outputDiv = document.getElementById('output');
        const originalLog = console.log;
        
        console.log = function(...args) {
            const message = args.map(arg => 
                typeof arg === 'object' ? JSON.stringify(arg, null, 2) : String(arg)
            ).join(' ');
            
            const messageDiv = document.createElement('div');
            messageDiv.className = 'output-item';
            messageDiv.innerHTML = '<strong>▶</strong> ' + message;
            outputDiv.appendChild(messageDiv);
            
            originalLog.apply(console, args);
        };
        
        console.error = function(...args) {
            const message = args.map(arg => 
                typeof arg === 'object' ? JSON.stringify(arg, null, 2) : String(arg)
            ).join(' ');
            
            const messageDiv = document.createElement('div');
            messageDiv.className = 'output-item error';
            messageDiv.innerHTML = '<strong>❌</strong> ' + message;
            outputDiv.appendChild(messageDiv);
        };
        
        try {
            ${code}
        } catch (error) {
            const errorDiv = document.createElement('div');
            errorDiv.className = 'output-item error';
            errorDiv.innerHTML = '<strong>💥 Ошибка выполнения:</strong> ' + error.message;
            outputDiv.appendChild(errorDiv);
        }
    </script>
</body>
</html>`;
    }
    return code;
  };

  const handlePreview = () => {
    const html = generatePreviewHtml();
    setPreviewHtml(html);
    setViewMode('preview');
  };

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

      {/* Переключатель режимов просмотра */}
      <div className="flex gap-2 bg-white p-2 rounded-lg shadow-sm">
        <button
          onClick={() => setViewMode('split')}
          className={`px-4 py-2 rounded-md text-sm font-medium ${
            viewMode === 'split' 
              ? 'bg-blue-500 text-white' 
              : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
          }`}
        >
          📐 Разделенный вид
        </button>
        <button
          onClick={() => setViewMode('editor')}
          className={`px-4 py-2 rounded-md text-sm font-medium ${
            viewMode === 'editor' 
              ? 'bg-blue-500 text-white' 
              : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
          }`}
        >
          📝 Только редактор
        </button>
        <button
          onClick={handlePreview}
          disabled={!code.trim()}
          className={`px-4 py-2 rounded-md text-sm font-medium ${
            viewMode === 'preview' 
              ? 'bg-blue-500 text-white' 
              : 'bg-gray-100 text-gray-700 hover:bg-gray-200 disabled:opacity-50'
          }`}
        >
          👁️ Только превью
        </button>
      </div>

      <div className={`flex-1 gap-4 ${
        viewMode === 'split' ? 'grid grid-cols-1 lg:grid-cols-2' :
        viewMode === 'editor' ? 'grid grid-cols-1' :
        'grid grid-cols-1'
      }`}>
        {/* Редактор кода */}
        {(viewMode === 'split' || viewMode === 'editor') && (
          <div className="flex flex-col">
            <label className="text-sm font-medium mb-2">Редактор кода</label>
            <textarea
              value={code}
              onChange={(e) => setCode(e.target.value)}
              className="flex-1 font-mono text-sm p-4 border border-gray-300 rounded-lg resize-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              spellCheck={false}
              rows={15}
            />
          </div>
        )}
        
        {/* Превью или вывод */}
        {(viewMode === 'split' || viewMode === 'preview') && (
          question.language.includes('html') ? (
            <HtmlPreview 
              htmlContent={previewHtml || generatePreviewHtml()} 
              className="h-full"
            />
          ) : (
            <div className="flex flex-col">
              <label className="text-sm font-medium mb-2">Результат выполнения</label>
              <div className="flex-1 p-4 bg-gray-900 text-green-400 font-mono text-sm rounded-lg overflow-auto">
                <pre className="whitespace-pre-wrap">{output || 'Запустите код...'}</pre>
              </div>
            </div>
          )
        )}
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