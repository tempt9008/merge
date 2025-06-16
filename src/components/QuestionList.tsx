import { useState, useEffect } from 'react';
import { Pencil, Plus, Trash2, Copy } from 'lucide-react';
import { Switch } from '@headlessui/react';
import { supabase } from '../lib/supabase';
import { Question } from '../types';
import { QuestionDialog } from './QuestionDialog';
import { DeleteConfirmDialog } from './DeleteConfirmDialog';
import toast from 'react-hot-toast';

interface QuestionListProps {
  categoryId: string;
}

export default function QuestionList({ categoryId }: QuestionListProps) {
  const [questions, setQuestions] = useState<Question[]>([]);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [selectedQuestion, setSelectedQuestion] = useState<Question | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isDuplicating, setIsDuplicating] = useState(false);
  const [togglingQuestionIds, setTogglingQuestionIds] = useState<Set<string>>(new Set());

  useEffect(() => {
    if (categoryId) {
      fetchQuestions();
    }
  }, [categoryId]);

  const fetchQuestions = async () => {
    try {
      const { data, error } = await supabase
        .from('questions')
        .select('*')
        .eq('category_id', categoryId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setQuestions(data || []);
    } catch (error) {
      toast.error('Error loading questions');
      console.error('Error:', error);
    }
  };

  const handleCreateQuestion = async (questionData: Partial<Question>) => {
    try {
      const { data, error } = await supabase
        .from('questions')
        .insert([{ ...questionData, category_id: categoryId }])
        .select()
        .single();

      if (error) throw error;

      setQuestions([data, ...questions]);
      toast.success('Question created successfully');
      setIsCreateDialogOpen(false);
    } catch (error) {
      toast.error('Error creating question');
      console.error('Error:', error);
    }
  };

  const handleUpdateQuestion = async (questionData: Partial<Question>) => {
    if (!selectedQuestion) return;

    try {
      const { data, error } = await supabase
        .from('questions')
        .update({ 
          type: questionData.type,
          question: questionData.question,
          correct_answer: questionData.correct_answer,
          options: questionData.options,
          image_url: questionData.image_url,
          is_active: questionData.is_active ?? true
        })
        .eq('id', selectedQuestion.id)
        .select()
        .single();

      if (error) throw error;

      setQuestions(prev =>
        prev.map(q => (q.id === selectedQuestion.id ? data : q))
      );
      toast.success('Question updated successfully');
      setIsEditDialogOpen(false);
      setSelectedQuestion(null);
    } catch (error) {
      toast.error('Error updating question');
      console.error('Error:', error);
    }
  };

  const handleToggleStatus = async (question: Question) => {
    if (togglingQuestionIds.has(question.id)) return;

    try {
      setTogglingQuestionIds(prev => new Set(prev).add(question.id));
      
      const newStatus = !question.is_active;
      
      const { data, error } = await supabase
        .from('questions')
        .update({ is_active: newStatus })
        .eq('id', question.id)
        .select()
        .single();

      if (error) throw error;

      setQuestions(prev =>
        prev.map(q => (q.id === question.id ? data : q))
      );

      toast.success(
        `Question ${newStatus ? 'enabled' : 'disabled'} successfully`
      );
    } catch (error) {
      console.error('Error updating question status:', error);
      toast.error('Error updating question status');
    } finally {
      setTogglingQuestionIds(prev => {
        const newSet = new Set(prev);
        newSet.delete(question.id);
        return newSet;
      });
    }
  };

  const handleDeleteQuestion = async () => {
    if (!selectedQuestion || isDeleting) return;

    try {
      setIsDeleting(true);
      
      const { error } = await supabase
        .from('questions')
        .delete()
        .eq('id', selectedQuestion.id);

      if (error) {
        throw error;
      }

      setQuestions(questions.filter(q => q.id !== selectedQuestion.id));
      toast.success('Question deleted successfully');
    } catch (error) {
      console.error('Error deleting question:', error);
      toast.error('Error deleting question. Please try again.');
    } finally {
      setIsDeleting(false);
      setIsDeleteDialogOpen(false);
      setSelectedQuestion(null);
    }
  };

  const handleDuplicateQuestion = async (question: Question) => {
    if (isDuplicating) return;

    try {
      setIsDuplicating(true);
      
      const duplicateData = {
        category_id: categoryId,
        type: question.type,
        question: `${question.question} (Copy)`,
        correct_answer: question.correct_answer,
        options: question.options,
        image_url: question.image_url,
        is_active: question.is_active
      };

      const { data, error } = await supabase
        .from('questions')
        .insert([duplicateData])
        .select()
        .single();

      if (error) throw error;

      setQuestions([data, ...questions]);
      toast.success('Question duplicated successfully');
    } catch (error) {
      console.error('Error duplicating question:', error);
      toast.error('Error duplicating question. Please try again.');
    } finally {
      setIsDuplicating(false);
    }
  };

  return (
    <div>
      <div className="mb-6 flex justify-between items-center">
        <div>
          <h3 className="text-lg font-medium text-gray-900">Questions</h3>
          <p className="mt-1 text-sm text-gray-500">
            {questions.length} questions in this category
          </p>
        </div>
        <button
          onClick={() => setIsCreateDialogOpen(true)}
          className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
        >
          <Plus className="h-4 w-4 mr-2" />
          New Question
        </button>
      </div>

      <div className="space-y-4">
        {questions.map((question, index) => (
          <div
            key={question.id}
            className={`bg-white shadow-sm rounded-lg border ${
              question.is_active ? 'border-gray-200' : 'border-gray-200 bg-gray-50'
            } p-4`}
          >
            <div className="flex justify-between items-start">
              <div className="flex items-start space-x-3">
                <div className={`flex-shrink-0 w-7 h-7 rounded-full flex items-center justify-center ${
                  question.is_active ? 'bg-blue-100 text-blue-600' : 'bg-gray-100 text-gray-400'
                }`}>
                  <span className="font-medium text-sm">{index + 1}</span>
                </div>
                <div>
                  <h4 className={`text-base font-medium ${
                    question.is_active ? 'text-gray-900' : 'text-gray-500'
                  }`}
                  // Use dangerouslySetInnerHTML to render HTML from the WYSIWYG editor
                  dangerouslySetInnerHTML={{ __html: question.question }} 
                  />
                  {/* Removed the direct rendering: {question.question} */}
                  <p className="mt-1 text-sm text-gray-500">
                    Type: {question.type} | Answer: {question.correct_answer}
                  </p>
                </div>
              </div>
              <div className="flex items-center space-x-4">
                <Switch
                  checked={question.is_active}
                  onChange={() => handleToggleStatus(question)}
                  disabled={togglingQuestionIds.has(question.id)}
                  className={`${
                    question.is_active ? 'bg-blue-600' : 'bg-gray-200'
                  } relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 ${
                    togglingQuestionIds.has(question.id) ? 'opacity-50 cursor-not-allowed' : ''
                  }`}
                >
                  <span
                    className={`${
                      question.is_active ? 'translate-x-6' : 'translate-x-1'
                    } inline-block h-4 w-4 transform rounded-full bg-white transition-transform`}
                  />
                </Switch>
                <button
                  onClick={() => handleDuplicateQuestion(question)}
                  disabled={isDuplicating}
                  className="p-2 hover:bg-gray-100 rounded-full transition-colors"
                  title="Duplicate question"
                >
                  <Copy className="h-4 w-4 text-gray-500 hover:text-blue-600" />
                </button>
                <button
                  onClick={() => {
                    setSelectedQuestion(question);
                    setIsEditDialogOpen(true);
                  }}
                  className="p-2 hover:bg-gray-100 rounded-full transition-colors"
                >
                  <Pencil className="h-4 w-4 text-gray-500 hover:text-blue-600" />
                </button>
                <button
                  onClick={() => {
                    setSelectedQuestion(question);
                    setIsDeleteDialogOpen(true);
                  }}
                  className="p-2 hover:bg-gray-100 rounded-full transition-colors"
                >
                  <Trash2 className="h-4 w-4 text-gray-500 hover:text-red-600" />
                </button>
              </div>
            </div>
          </div>
        ))}

        {questions.length === 0 && (
          <div className="text-center py-12 text-gray-500">
            No questions found. Click "New Question" to create one.
          </div>
        )}
      </div>

      <QuestionDialog
        isOpen={isCreateDialogOpen}
        onClose={() => setIsCreateDialogOpen(false)}
        onSave={handleCreateQuestion}
        mode="create"
      />

      <QuestionDialog
        isOpen={isEditDialogOpen}
        onClose={() => {
          setIsEditDialogOpen(false);
          setSelectedQuestion(null);
        }}
        onSave={handleUpdateQuestion}
        mode="edit"
        question={selectedQuestion}
      />

      <DeleteConfirmDialog
        isOpen={isDeleteDialogOpen}
        onClose={() => {
          setIsDeleteDialogOpen(false);
          setSelectedQuestion(null);
        }}
        onConfirm={handleDeleteQuestion}
        title="Delete Question"
        message="Are you sure you want to delete this question? This action cannot be undone."
      />
    </div>
  );
}
