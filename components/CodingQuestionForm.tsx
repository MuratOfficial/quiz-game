// components/CodingQuestionForm.tsx
'use client';
import { CodingQuestion, Difficulty, Language, TestCase } from '@/types';
import { useState } from 'react';

interface CodingQuestionFormProps {
  question?: CodingQuestion;
  /* eslint-disable  @typescript-eslint/no-explicit-any */
  onSubmit: (data: any) => void;
  onCancel: () => void;
}

export default function CodingQuestionForm({ question, onSubmit, onCancel }: CodingQuestionFormProps) {
  const [formData, setFormData] = useState({
    title: question?.title || '',
    description: question?.description || '',
    initialCode: question?.initialCode || '// Напишите ваше решение здесь\n',
    language: (question?.language || 'javascript') as Language,
    difficulty: (question?.difficulty || 'medium') as Difficulty,
    points: question?.points || 10,
    category: question?.category || '',
    expectedOutput: question?.expectedOutput || '',
    requiresManualReview: question?.requiresManualReview || false,
  });

  const [testCases, setTestCases] = useState<TestCase[]>(
    question?.testCases || [
      { id: '1', input: '', expectedOutput: '', isHidden: false, codingQuestionId: '' }
    ]
  );

  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      await onSubmit({
        ...formData,
        testCases: testCases.map(tc => ({
          input: tc.input,
          expectedOutput: tc.expectedOutput,
          isHidden: tc.isHidden
        }))
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const addTestCase = () => {
    setTestCases([
      ...testCases,
      { 
        id: Date.now().toString(), 
        input: '', 
        expectedOutput: '', 
        isHidden: false, 
        codingQuestionId: '' 
      }
    ]);
  };

  const removeTestCase = (index: number) => {
    setTestCases(testCases.filter((_, i) => i !== index));
  };

  const updateTestCase = (index: number, field: string, value: string | boolean) => {
    const updatedTestCases = [...testCases];
    updatedTestCases[index] = { ...updatedTestCases[index], [field]: value };
    setTestCases(updatedTestCases);
  };

  // Обработчики с явным приведением типов
  const handleLanguageChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setFormData({ 
      ...formData, 
      language: e.target.value as Language 
    });
  };

  const handleDifficultyChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setFormData({ 
      ...formData, 
      difficulty: e.target.value as Difficulty 
    });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6 max-w-4xl mx-auto">
      <div className="bg-white p-6 rounded-lg shadow-lg">
        <h2 className="text-2xl font-bold mb-6">
          {question ? 'Редактировать задачу' : 'Создать новую задачу'}
        </h2>

        {/* Основная информация */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Название задачи *
            </label>
            <input
              type="text"
              required
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              className="w-full p-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Категория *
            </label>
            <input
              type="text"
              required
              value={formData.category}
              onChange={(e) => setFormData({ ...formData, category: e.target.value })}
              className="w-full p-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Сложность *
            </label>
            <select
              value={formData.difficulty}
              onChange={handleDifficultyChange}
              className="w-full p-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="easy">Легкая</option>
              <option value="medium">Средняя</option>
              <option value="hard">Сложная</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Очки *
            </label>
            <input
              type="number"
              required
              min="1"
              value={formData.points}
              onChange={(e) => setFormData({ ...formData, points: parseInt(e.target.value) })}
              className="w-full p-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Язык программирования *
            </label>
            <select
              value={formData.language}
              onChange={handleLanguageChange}
              className="w-full p-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="javascript">JavaScript</option>
              <option value="html-css">HTML/CSS</option>
              <option value="javascript-html-css">JavaScript + HTML/CSS</option>
            </select>
          </div>

          <div className="flex items-center">
            <input
              type="checkbox"
              checked={formData.requiresManualReview}
              onChange={(e) => setFormData({ ...formData, requiresManualReview: e.target.checked })}
              className="mr-2"
            />
            <label className="text-sm font-medium text-gray-700">
              Требует ручной проверки
            </label>
          </div>
        </div>

        {/* Описание задачи */}
        <div className="mb-6">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Описание задачи *
          </label>
          <textarea
            required
            rows={4}
            value={formData.description}
            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
            className="w-full p-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
            placeholder="Опишите задачу, что должен сделать пользователь..."
          />
        </div>

        {/* Начальный код */}
        <div className="mb-6">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Начальный код *
          </label>
          <textarea
            required
            rows={8}
            value={formData.initialCode}
            onChange={(e) => setFormData({ ...formData, initialCode: e.target.value })}
            className="w-full font-mono text-sm p-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
            spellCheck={false}
          />
        </div>

        {/* Ожидаемый вывод (опционально) */}
        <div className="mb-6">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Ожидаемый вывод (для автоматической проверки)
          </label>
          <textarea
            rows={3}
            value={formData.expectedOutput}
            onChange={(e) => setFormData({ ...formData, expectedOutput: e.target.value })}
            className="w-full p-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
            placeholder="Ожидаемый вывод программы (если применимо)..."
          />
        </div>

        {/* Тест кейсы */}
        <div className="mb-6">
          <div className="flex justify-between items-center mb-4">
            <label className="block text-sm font-medium text-gray-700">
              Тест кейсы *
            </label>
            <button
              type="button"
              onClick={addTestCase}
              className="px-3 py-1 bg-green-500 text-white rounded text-sm hover:bg-green-600"
            >
              + Добавить тест
            </button>
          </div>

          <div className="space-y-4">
            {testCases.map((testCase, index) => (
              <div key={testCase.id} className="p-4 border border-gray-200 rounded-lg">
                <div className="flex justify-between items-center mb-3">
                  <span className="font-medium">Тест {index + 1}</span>
                  <button
                    type="button"
                    onClick={() => removeTestCase(index)}
                    className="text-red-500 hover:text-red-700 text-sm"
                  >
                    Удалить
                  </button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-3">
                  <div>
                    <label className="block text-xs text-gray-500 mb-1">Входные данные</label>
                    <input
                      type="text"
                      value={testCase.input}
                      onChange={(e) => updateTestCase(index, 'input', e.target.value)}
                      className="w-full p-2 border border-gray-300 rounded-md text-sm"
                      placeholder="Входные данные..."
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-gray-500 mb-1">Ожидаемый вывод</label>
                    <input
                      type="text"
                      value={testCase.expectedOutput}
                      onChange={(e) => updateTestCase(index, 'expectedOutput', e.target.value)}
                      className="w-full p-2 border border-gray-300 rounded-md text-sm"
                      placeholder="Ожидаемый вывод..."
                    />
                  </div>
                </div>

                <div className="flex items-center">
                  <input
                    type="checkbox"
                    checked={testCase.isHidden}
                    onChange={(e) => updateTestCase(index, 'isHidden', e.target.checked)}
                    className="mr-2"
                  />
                  <label className="text-xs text-gray-500">
                    Скрытый тест (не показывать пользователю)
                  </label>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Кнопки действий */}
        <div className="flex justify-end space-x-4 pt-6 border-t">
          <button
            type="button"
            onClick={onCancel}
            className="px-6 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
          >
            Отмена
          </button>
          <button
            type="submit"
            disabled={isSubmitting}
            className="px-6 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 disabled:opacity-50"
          >
            {isSubmitting ? 'Сохранение...' : (question ? 'Обновить' : 'Создать')}
          </button>
        </div>
      </div>
    </form>
  );
}