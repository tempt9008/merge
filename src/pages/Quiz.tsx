import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Play } from 'lucide-react';
import QuizSession from '../components/QuizSession';
import CategorySelector from '../components/CategorySelector';

export default function Quiz() {
  const [stage, setStage] = useState<'intro' | 'selection' | 'quiz'>('intro');
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);

  const handleCategorySelect = (categoryId: string) => {
    setSelectedCategory(categoryId);
    setStage('quiz');
  };

  if (stage === 'quiz' && selectedCategory) {
    return <QuizSession categoryId={selectedCategory} />;
  }

  if (stage === 'selection') {
    return <CategorySelector onSelect={handleCategorySelect} />;
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-slate-50 p-4">
      <div className="max-w-xl w-full space-y-8 text-center">
        <h1 className="text-4xl font-bold text-gray-900">Welcome to the Quiz!</h1>
        <p className="text-xl text-gray-600">
          Test your knowledge with our interactive quiz system. Select a category
          and answer 10 questions to test your knowledge.
        </p>
        <div className="space-y-4">
          <button
            onClick={() => setStage('selection')}
            className="w-full inline-flex items-center justify-center px-8 py-3 text-lg font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
          >
            <Play className="mr-2 h-5 w-5" />
            Start Quiz
          </button>
          <Link
            to="/login"
            className="block text-sm text-gray-600 hover:text-gray-900"
          >
            Admin Login
          </Link>
        </div>
      </div>
    </div>
  );
}