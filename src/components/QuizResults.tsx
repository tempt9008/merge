import { useNavigate } from 'react-router-dom';
import Confetti from 'react-confetti';
import { Trophy, RotateCcw } from 'lucide-react';

interface QuizResultsProps {
  results: {
    score: number;
    total: number;
  };
}

export default function QuizResults({ results }: QuizResultsProps) {
  const navigate = useNavigate();
  const percentage = Math.round((results.score / results.total) * 100);
  const showConfetti = percentage >= 70;

  const getGrade = () => {
    if (percentage >= 90) return { text: 'Excellent!', color: 'text-green-600' };
    if (percentage >= 70) return { text: 'Great Job!', color: 'text-blue-600' };
    if (percentage >= 50) return { text: 'Good Try!', color: 'text-yellow-600' };
    return { text: 'Keep Practicing!', color: 'text-red-600' };
  };

  const grade = getGrade();

  return (
    <div className="max-w-md mx-auto p-8 bg-white rounded-xl shadow-sm border border-gray-200">
      {showConfetti && <Confetti numberOfPieces={200} recycle={false} />}
      
      <div className="text-center">
        <div className="mx-auto w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mb-4">
          <Trophy className="h-8 w-8 text-blue-600" />
        </div>
        
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Quiz Complete!</h2>
        <p className={`text-xl font-semibold ${grade.color} mb-6`}>
          {grade.text}
        </p>

        <div className="flex justify-center items-center space-x-2 mb-8">
          <div className="text-4xl font-bold text-gray-900">{results.score}</div>
          <div className="text-xl text-gray-600">/ {results.total}</div>
        </div>

        <div className="mb-8">
          <div className="w-full h-4 bg-gray-200 rounded-full overflow-hidden">
            <div
              className="h-full bg-blue-600 transition-all duration-1000"
              style={{ width: `${percentage}%` }}
            />
          </div>
          <div className="mt-2 text-sm text-gray-600">
            {percentage}% Correct
          </div>
        </div>

        <button
          onClick={() => navigate(0)}
          className="w-full mb-4 inline-flex items-center justify-center px-6 py-3 border border-transparent text-base font-medium rounded-lg text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
        >
          <RotateCcw className="mr-2 h-5 w-5" />
          Try Again
        </button>
      </div>
    </div>
  );
}