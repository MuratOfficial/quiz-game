'use client';
import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { CodingQuestion } from '@/types';
import CodingQuestionForm from '@/components/CodingQuestionForm';
import JsonImportForm from '@/components/JsonImportForm';

export default function CodingQuestionsAdmin() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [codingQuestions, setCodingQuestions] = useState<CodingQuestion[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [activeView, setActiveView] = useState<'list' | 'create' | 'edit' | 'import'>('list');
  const [editingQuestion, setEditingQuestion] = useState<CodingQuestion | null>(null);

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/auth/signin');
    }
    if (status === 'authenticated' && !session?.user?.isAdmin) {
      router.push('/');
    }
  }, [status, session, router]);

  useEffect(() => {
    if (session?.user?.isAdmin) {
      fetchCodingQuestions();
    }
  }, [session]);

  const fetchCodingQuestions = async () => {
    try {
      const response = await fetch('/api/coding-questions');
      const data = await response.json();
      setCodingQuestions(data);
    } catch (error) {
      console.error('Error fetching coding questions:', error);
    } finally {
      setIsLoading(false);
    }
  };
/* eslint-disable  @typescript-eslint/no-explicit-any */
  const handleCreateQuestion = async (formData: any) => {
    try {
      const response = await fetch('/api/coding-questions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      if (response.ok) {
        setActiveView('list');
        fetchCodingQuestions();
      }
    } catch (error) {
      console.error('Error creating question:', error);
    }
  };
/* eslint-disable  @typescript-eslint/no-explicit-any */
  const handleUpdateQuestion = async (formData: any) => {
    if (!editingQuestion) return;

    try {
      const response = await fetch(`/api/coding-questions/${editingQuestion.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      if (response.ok) {
        setEditingQuestion(null);
        setActiveView('list');
        fetchCodingQuestions();
      }
    } catch (error) {
      console.error('Error updating question:', error);
    }
  };

  const handleDeleteQuestion = async (id: string) => {
    if (!confirm('Вы уверены, что хотите удалить эту задачу?')) return;

    try {
      const response = await fetch(`/api/coding-questions/${id}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        fetchCodingQuestions();
      }
    } catch (error) {
      console.error('Error deleting question:', error);
    }
  };
/* eslint-disable  @typescript-eslint/no-explicit-any */
  const handleJsonImport = (results: any[]) => {
    setActiveView('list');
    fetchCodingQuestions();
    alert(`Успешно импортировано ${results.length} задач`);
  };

  if (status === 'loading' || isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto"></div>
          <p className="mt-4 text-gray-600">Загрузка...</p>
        </div>
      </div>
    );
  }

  if (!session?.user?.isAdmin) {
    return null;
  }

  // Формы создания/редактирования
  if (activeView === 'create' || activeView === 'edit') {
    return (
      <div className="min-h-screen bg-gray-50 py-8">
        <CodingQuestionForm
          question={editingQuestion || undefined}
          onSubmit={editingQuestion ? handleUpdateQuestion : handleCreateQuestion}
          onCancel={() => {
            setActiveView('list');
            setEditingQuestion(null);
          }}
        />
      </div>
    );
  }

  // Форма импорта JSON
  if (activeView === 'import') {
    return (
      <div className="min-h-screen bg-gray-50 py-8">
        <JsonImportForm
          onImport={handleJsonImport}
          onCancel={() => setActiveView('list')}
        />
      </div>
    );
  }

  // Список задач
  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Coding задачи</h1>
            <p className="text-gray-600 mt-2">Управление задачами по программированию</p>
          </div>
          <div className="flex gap-3">
            <button
              onClick={() => setActiveView('import')}
              className="px-6 py-3 bg-purple-500 text-white rounded-lg hover:bg-purple-600"
            >
              📁 Импорт JSON
            </button>
            <button
              onClick={() => setActiveView('create')}
              className="px-6 py-3 bg-blue-500 text-white rounded-lg hover:bg-blue-600"
            >
              + Создать задачу
            </button>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow overflow-hidden">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Название
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Категория
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Сложность
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Очки
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Язык
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Тесты
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Действия
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {codingQuestions.map((question) => (
                <tr key={question.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-medium text-gray-900">{question.title}</div>
                    <div className="text-sm text-gray-500 truncate max-w-xs">
                      {question.description}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {question.category}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`px-2 py-1 text-xs rounded-full ${
                      question.difficulty === 'easy' ? 'bg-green-100 text-green-800' :
                      question.difficulty === 'medium' ? 'bg-yellow-100 text-yellow-800' :
                      'bg-red-100 text-red-800'
                    }`}>
                      {question.difficulty}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {question.points}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {question.language}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {question.testCases?.length || 0}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium space-x-2">
                    <button
                      onClick={() => {
                        setEditingQuestion(question);
                        setActiveView('edit');
                      }}
                      className="text-blue-600 hover:text-blue-900"
                    >
                      Редактировать
                    </button>
                    <button
                      onClick={() => handleDeleteQuestion(question.id)}
                      className="text-red-600 hover:text-red-900"
                    >
                      Удалить
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {codingQuestions.length === 0 && (
            <div className="text-center py-12">
              <p className="text-gray-500">Нет созданных задач</p>
              <button
                onClick={() => setActiveView('import')}
                className="mt-4 px-4 py-2 bg-purple-500 text-white rounded-lg hover:bg-purple-600"
              >
                Импортировать из JSON
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}