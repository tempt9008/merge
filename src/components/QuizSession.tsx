import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { Question } from '../types';
import QuizQuestion from './QuizQuestion';
import QuizResults from './QuizResults';
import toast from 'react-hot-toast';
import { Loader2 } from 'lucide-react';

interface QuizSessionProps {
  categoryId: string;
}

export default function QuizSession({ categoryId }: QuizSessionProps) {
  const [questions, setQuestions] = useState<Question[]>([]);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [answers, setAnswers] = useState<{ [key: string]: string }>({});
  const [submittedQuestions, setSubmittedQuestions] = useState<Set<string>>(new Set());
  const [isLoading, setIsLoading] = useState(true);
  const [isComplete, setIsComplete] = useState(false);

  useEffect(() => {
    fetchQuestions();
  }, [categoryId]);

  const fetchQuestions = async () => {
    try {
      const { data, error } = await supabase
        .from('questions')
        .select('*')
        .eq('category_id', categoryId)
        .eq('is_active', true)
        .order('created_at');

      if (error) throw error;
      
      // Randomly select 10 questions or all if less than 10
      const shuffled = data.sort(() => 0.5 - Math.random());
      const selected = shuffled.slice(0, Math.min(50, shuffled.length));
      setQuestions(selected);
    } catch (error) {
      toast.error('Error loading questions');
      console.error('Error:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleAnswer = (questionId: string, answer: string) => {
    setAnswers((prev) => ({
      ...prev,
      [questionId]: answer,
    }));
  };

  const handleSubmitAnswer = (questionId: string) => {
    setSubmittedQuestions(prev => new Set([...prev, questionId]));
  };

  const handleNext = () => {
    if (currentQuestionIndex < questions.length - 1) {
      setCurrentQuestionIndex(currentQuestionIndex + 1);
    } else {
      setIsComplete(true);
    }
  };

  const calculateScore = () => {
    let correct = 0;
    questions.forEach((question) => {
      if (
        answers[question.id]?.toLowerCase() ===
        question.correct_answer.toLowerCase()
      ) {
        correct++;
      }
    });
    return {
      score: correct,
      total: questions.length,
    };
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
      </div>
    );
  }

  if (questions.length === 0) {
    return (
      <div className="text-center py-8">
        <p className="text-gray-600">No questions available in this category.</p>
      </div>
    );
  }

  if (isComplete) {
    return <QuizResults results={calculateScore()} />;
  }

  const currentQuestion = questions[currentQuestionIndex];
  const hasSubmitted = submittedQuestions.has(currentQuestion.id);

  return (
    <div className="max-w-2xl mx-auto p-4">
      <div className="mb-4 flex justify-between items-center">
        <div className="text-sm font-medium text-gray-600">
          Question {currentQuestionIndex + 1} of {questions.length}
        </div>
        <div className="h-2 flex-1 mx-4 bg-gray-200 rounded-full overflow-hidden">
          <div
            className="h-full bg-blue-600 transition-all duration-300"
            style={{
              width: `${((currentQuestionIndex + 1) / questions.length) * 100}%`,
            }}
          />
        </div>
      </div>

      <QuizQuestion
        question={currentQuestion}
        onAnswer={handleAnswer}
        onSubmit={() => handleSubmitAnswer(currentQuestion.id)}
        onNext={handleNext}
        answer={answers[currentQuestion.id] || ''}
        hasSubmitted={hasSubmitted}
        isLast={currentQuestionIndex === questions.length - 1}
      />
    </div>
  );
}
