import { useEffect, useState, useRef } from 'react';
import { Question } from '../types';
import { CheckCircle2, XCircle, ArrowRight } from 'lucide-react';

interface QuizQuestionProps {
  question: Question;
  onAnswer: (questionId: string, answer: string) => void;
  onSubmit: () => void;
  onNext: () => void;
  answer: string;
  hasSubmitted: boolean;
  isLast: boolean;
}

export default function QuizQuestion({
  question,
  onAnswer,
  onSubmit,
  onNext,
  answer,
  hasSubmitted,
  isLast,
}: QuizQuestionProps) {
  const [countdown, setCountdown] = useState<number | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    let timer: NodeJS.Timeout;

    if (hasSubmitted) {
      setCountdown(3);
      timer = setInterval(() => {
        setCountdown((prev) => {
          if (prev === null || prev <= 1) {
            clearInterval(timer);
            onNext();
            return null;
          }
          return prev - 1;
        });
      }, 1000);
    } else {
      // Focus the input field when it's available and not submitted
      if ((question.type === 'text' || question.type === 'image') && inputRef.current) {
        inputRef.current.focus();
      }
    }

    return () => {
      if (timer) clearInterval(timer);
    };
  }, [hasSubmitted, onNext, question.type]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!answer.trim()) return;
    onSubmit();
  };

  const isCorrect = answer.toLowerCase() === question.correct_answer.toLowerCase();

  const getOptionClass = (option: string) => {
    if (!hasSubmitted) {
      return `flex items-center p-4 rounded-lg border transition-all ${
        answer === option
          ? 'border-blue-500 bg-blue-50'
          : 'border-gray-200 hover:border-blue-500 hover:bg-blue-50'
      }`;
    }

    if (option.toLowerCase() === question.correct_answer.toLowerCase()) {
      return 'flex items-center p-4 rounded-lg border border-green-500 bg-green-50';
    }

    if (answer === option) {
      return 'flex items-center p-4 rounded-lg border border-red-500 bg-red-50';
    }

    return 'flex items-center p-4 rounded-lg border border-gray-200';
  };

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
      <div className="p-6">
        {/* Use dangerouslySetInnerHTML to render HTML from the WYSIWYG editor */}
        <h3 
          className="text-xl font-semibold text-gray-900 mb-4"
          dangerouslySetInnerHTML={{ __html: question.question }} 
        />
        {/* Removed direct rendering: {question.question} */}

        {question.image_url && (
          <img
            src={question.image_url}
            alt="Question"
            className="w-full h-64 object-cover rounded-lg mb-4"
          />
        )}

        <form onSubmit={handleSubmit}>
          {question.type === 'multichoice' && (
            <div className="space-y-2">
              {question.options?.map((option, index) => (
                <label
                  key={index}
                  className={getOptionClass(option)}
                >
                  <input
                    type="radio"
                    name="answer"
                    value={option}
                    checked={answer === option}
                    onChange={(e) => onAnswer(question.id, e.target.value)}
                    disabled={hasSubmitted}
                    className="mr-3 h-4 w-4 text-blue-600 border-gray-300 focus:ring-blue-500"
                  />
                  <span className="flex-grow">{option}</span>
                  {hasSubmitted && option.toLowerCase() === question.correct_answer.toLowerCase() && (
                    <CheckCircle2 className="h-5 w-5 text-green-600 ml-2" />
                  )}
                  {hasSubmitted && answer === option && option.toLowerCase() !== question.correct_answer.toLowerCase() && (
                    <XCircle className="h-5 w-5 text-red-600 ml-2" />
                  )}
                </label>
              ))}
            </div>
          )}

          {question.type === 'truefalse' && (
            <div className="space-y-2">
              {['True', 'False'].map((option) => (
                <label
                  key={option}
                  className={getOptionClass(option)}
                >
                  <input
                    type="radio"
                    name="answer"
                    value={option}
                    checked={answer.toLowerCase() === option.toLowerCase()}
                    onChange={(e) => onAnswer(question.id, e.target.value)}
                    disabled={hasSubmitted}
                    className="mr-3 h-4 w-4 text-blue-600 border-gray-300 focus:ring-blue-500"
                  />
                  <span className="flex-grow">{option}</span>
                  {hasSubmitted && option.toLowerCase() === question.correct_answer.toLowerCase() && (
                    <CheckCircle2 className="h-5 w-5 text-green-600 ml-2" />
                  )}
                  {hasSubmitted && answer.toLowerCase() === option.toLowerCase() && 
                    option.toLowerCase() !== question.correct_answer.toLowerCase() && (
                    <XCircle className="h-5 w-5 text-red-600 ml-2" />
                  )}
                </label>
              ))}
            </div>
          )}

          {(question.type === 'text' || question.type === 'image') && (
            <input
              ref={inputRef}
              type="text"
              value={answer}
              onChange={(e) => onAnswer(question.id, e.target.value)}
              disabled={hasSubmitted}
              placeholder="Type your answer..."
              className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          )}

          <div className="mt-6 flex justify-between items-center">
            {!hasSubmitted ? (
              <button
                type="submit"
                disabled={!answer.trim()}
                className={`px-6 py-2 rounded-lg font-medium ${
                  answer.trim()
                    ? 'bg-blue-600 text-white hover:bg-blue-700'
                    : 'bg-gray-100 text-gray-400 cursor-not-allowed'
                }`}
              >
                Check Answer
              </button>
            ) : (
              <div className="flex items-center space-x-2">
                {isCorrect ? (
                  <>
                    <CheckCircle2 className="h-5 w-5 text-green-600" />
                    <span className="text-green-600 font-medium">Correct!</span>
                  </>
                ) : (
                  <>
                    <XCircle className="h-5 w-5 text-red-600" />
                    <span className="text-red-600 font-medium">
                      Incorrect. The correct answer is: {question.correct_answer}
                    </span>
                  </>
                )}
              </div>
            )}

            {hasSubmitted && (
              <div className="flex items-center space-x-4">
                <div className="text-sm text-gray-500">
                  Next question in {countdown}s
                </div>
                <button
                  type="button"
                  onClick={onNext}
                  className="inline-flex items-center px-6 py-2 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700"
                >
                  {isLast ? 'Finish' : 'Next'}
                  <ArrowRight className="ml-2 h-4 w-4" />
                </button>
              </div>
            )}
          </div>
        </form>
      </div>
    </div>
  );
}
