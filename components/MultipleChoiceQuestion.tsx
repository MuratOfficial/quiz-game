// components/MultipleChoiceQuestion.tsx
'use client';
import { useState, useEffect } from 'react';
import { Question } from '@/types';

interface MultipleChoiceQuestionProps {
  question: Question;
  onSubmit: (answer: string) => void;
  timeLimit?: number;
}

export default function MultipleChoiceQuestion({ 
  question, 
  onSubmit,
  timeLimit 
}: MultipleChoiceQuestionProps) {
  const [selectedAnswer, setSelectedAnswer] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    setSelectedAnswer('');
  }, [question]);

  const handleSubmit = async () => {
    if (!selectedAnswer) return;
    
    setIsSubmitting(true);
    await onSubmit(selectedAnswer);
    setIsSubmitting(false);
  };

  return (
    <div className="space-y-6">
      {/* Заголовок вопроса */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <span className={`px-3 py-1 rounded-full text-sm font-medium ${question.color}`}>
            {question.category}
          </span>
          <span className="px-3 py-1 bg-yellow-100 text-yellow-800 rounded-full text-sm font-medium">
            {question.points} очков
          </span>
        </div>
        
        {timeLimit && (
          <div className="text-lg font-semibold text-gray-700">
            {Math.floor(timeLimit / 60)}:{(timeLimit % 60).toString().padStart(2, '0')}
          </div>
        )}
      </div>

      {/* Текст вопроса */}
      <div>
        <h2 className="text-2xl font-bold text-gray-900 leading-relaxed">
          {question.question}
        </h2>
      </div>

      {/* Варианты ответов */}
      <div className="space-y-3">
        {question.options?.map((option, index) => {
          const letter = String.fromCharCode(65 + index); // A, B, C, D
          return (
            <button
              key={index}
              onClick={() => setSelectedAnswer(option)}
              disabled={isSubmitting}
              className={`w-full text-left p-4 rounded-lg border-2 transition-all duration-200 ${
                selectedAnswer === option
                  ? 'border-blue-500 bg-blue-50 ring-2 ring-blue-200'
                  : 'border-gray-200 bg-white hover:border-gray-300 hover:bg-gray-50'
              } ${isSubmitting ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
            >
              <div className="flex items-center space-x-4">
                <div className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center font-semibold ${
                  selectedAnswer === option
                    ? 'bg-blue-500 text-white'
                    : 'bg-gray-100 text-gray-600'
                }`}>
                  {letter}
                </div>
                <span className="text-lg text-gray-900">{option}</span>
              </div>
            </button>
          );
        })}
      </div>

      {/* Кнопка отправки */}
      <div className="flex justify-end pt-4">
        <button
          onClick={handleSubmit}
          disabled={!selectedAnswer || isSubmitting}
          className="px-8 py-3 bg-blue-500 text-white rounded-lg font-semibold hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-200"
        >
          {isSubmitting ? 'Отправка...' : 'Ответить'}
        </button>
      </div>
    </div>
  );
}