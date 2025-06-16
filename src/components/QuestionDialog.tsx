import { Fragment, useRef, useState, useEffect } from 'react';
import { Dialog, Transition } from '@headlessui/react';
import { HelpCircle } from 'lucide-react';
import ReactQuill from 'react-quill';
import 'react-quill/dist/quill.snow.css'; // Import Quill styles
import { Question } from '../types';
import toast from 'react-hot-toast';

interface QuestionDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (questionData: Partial<Question>) => void;
  mode: 'create' | 'edit';
  question?: Question | null;
}

export function QuestionDialog({
  isOpen,
  onClose,
  onSave,
  mode,
  question,
}: QuestionDialogProps) {
  const [type, setType] = useState<Question['type']>('text');
  const [questionText, setQuestionText] = useState(''); // State for Quill content
  const [correctAnswer, setCorrectAnswer] = useState('');
  const [options, setOptions] = useState<string[]>(['', '', '', '']);
  const [imageUrl, setImageUrl] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const cancelButtonRef = useRef(null);

  useEffect(() => {
    if (isOpen) { // Reset or populate form when dialog opens
      if (mode === 'edit' && question) {
        setType(question.type);
        setQuestionText(question.question); // Set Quill content
        setCorrectAnswer(question.correct_answer);
        setOptions(question.options || ['', '', '', '']);
        setImageUrl(question.image_url || '');
      } else {
        resetForm();
      }
    }
  }, [mode, question, isOpen]); // Depend on isOpen

  const resetForm = () => {
    setType('text');
    setQuestionText(''); // Reset Quill content
    setCorrectAnswer('');
    setOptions(['', '', '', '']);
    setImageUrl('');
    // No need to reset isSubmitting here, handled in handleSubmit finally block
  };

  // Helper to strip HTML for validation
  const stripHtml = (html: string) => {
    const doc = new DOMParser().parseFromString(html, 'text/html');
    return doc.body.textContent || "";
  }

  const validateForm = (): boolean => {
    if (!stripHtml(questionText).trim()) { // Validate based on Quill content
      toast.error('Question text is required');
      return false;
    }

    if (!correctAnswer.trim()) {
      toast.error('Correct answer is required');
      return false;
    }

    if (type === 'multichoice') {
      const validOptions = options.filter(opt => opt.trim());
      if (validOptions.length < 2) {
        toast.error('Multiple choice questions require at least 2 options');
        return false;
      }
      if (!validOptions.includes(correctAnswer.trim())) {
        toast.error('Correct answer must be one of the options');
        return false;
      }
    }

    if (type === 'truefalse') {
      const normalizedAnswer = correctAnswer.toLowerCase();
      if (normalizedAnswer !== 'true' && normalizedAnswer !== 'false') {
        toast.error('True/False questions must have "true" or "false" as answer');
        return false;
      }
    }

    if (type === 'image' && !imageUrl.trim()) {
      toast.error('Image URL is required for image-based questions');
      return false;
    }

    return true;
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    if (!validateForm()) return;

    try {
      setIsSubmitting(true);
      const questionData: Partial<Question> = {
        type,
        question: questionText, // Use Quill content
        correct_answer: correctAnswer.trim(),
        options: type === 'multichoice' ? options.filter(opt => opt.trim()) : undefined,
        image_url: type === 'image' ? imageUrl.trim() : undefined,
        is_active: true,
      };

      await onSave(questionData);
      onClose();
      resetForm();
    } catch (error) {
      console.error('Error submitting question:', error);
      toast.error('Error saving question. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Transition.Root show={isOpen} as={Fragment}>
      <Dialog
        as="div"
        className="relative z-10"
        initialFocus={cancelButtonRef}
        onClose={onClose}
      >
        <Transition.Child
          as={Fragment}
          enter="ease-out duration-300"
          enterFrom="opacity-0"
          enterTo="opacity-100"
          leave="ease-in duration-200"
          leaveFrom="opacity-100"
          leaveTo="opacity-0"
        >
          <div className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity" />
        </Transition.Child>

        <div className="fixed inset-0 z-10 overflow-y-auto">
          <div className="flex min-h-full items-end justify-center p-4 text-center sm:items-center sm:p-0">
            <Transition.Child
              as={Fragment}
              enter="ease-out duration-300"
              enterFrom="opacity-0 translate-y-4 sm:translate-y-0 sm:scale-95"
              enterTo="opacity-100 translate-y-0 sm:scale-100"
              leave="ease-in duration-200"
              leaveFrom="opacity-100 translate-y-0 sm:scale-100"
              leaveTo="opacity-0 translate-y-4 sm:translate-y-0 sm:scale-95"
            >
              <Dialog.Panel className="relative transform overflow-hidden rounded-lg bg-white text-left shadow-xl transition-all sm:my-8 sm:w-full sm:max-w-lg">
                <form onSubmit={handleSubmit}>
                  <div className="bg-white px-4 pb-4 pt-5 sm:p-6 sm:pb-4">
                    <div className="sm:flex sm:items-start">
                      <div className="mx-auto flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-full bg-blue-100 sm:mx-0 sm:h-10 sm:w-10">
                        <HelpCircle className="h-6 w-6 text-blue-600" />
                      </div>
                      <div className="mt-3 text-center sm:ml-4 sm:mt-0 sm:text-left w-full">
                        <Dialog.Title
                          as="h3"
                          className="text-base font-semibold leading-6 text-gray-900"
                        >
                          {mode === 'create' ? 'Create Question' : 'Edit Question'}
                        </Dialog.Title>
                        <div className="mt-4 space-y-4">
                          <div>
                            <label className="block text-sm font-medium text-gray-700">
                              Question Type
                            </label>
                            <select
                              value={type}
                              onChange={(e) => setType(e.target.value as Question['type'])}
                              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                            >
                              <option value="text">Text Input</option>
                              <option value="truefalse">True/False</option>
                              <option value="multichoice">Multiple Choice</option>
                              <option value="image">Image-based</option>
                            </select>
                          </div>

                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                              Question Text
                            </label>
                            {/* Replace EditorContent with ReactQuill */}
                            <ReactQuill
                              theme="snow"
                              value={questionText}
                              onChange={setQuestionText}
                              className="mt-1 bg-white" // Added bg-white for better visibility in dark mode if applicable
                              modules={{
                                toolbar: [
                                  [{ 'header': [1, 2, false] }],
                                  ['bold', 'italic', 'underline','strike', 'blockquote'],
                                  [{'list': 'ordered'}, {'list': 'bullet'}, {'indent': '-1'}, {'indent': '+1'}],
                                  ['link', 'image'], // Add image button if needed
                                  ['clean']
                                ],
                              }}
                            />
                          </div>

                          {type === 'image' && (
                            <div>
                              <label className="block text-sm font-medium text-gray-700">
                                Image URL
                              </label>
                              <input
                                type="url"
                                value={imageUrl}
                                onChange={(e) => setImageUrl(e.target.value)}
                                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                                placeholder="Enter image URL"
                                required
                              />
                            </div>
                          )}

                          {type === 'multichoice' && (
                            <div>
                              <label className="block text-sm font-medium text-gray-700">
                                Options
                              </label>
                              <div className="mt-1 space-y-2">
                                {options.map((option, index) => (
                                  <input
                                    key={index}
                                    type="text"
                                    value={option}
                                    onChange={(e) => {
                                      const newOptions = [...options];
                                      newOptions[index] = e.target.value;
                                      setOptions(newOptions);
                                    }}
                                    className="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                                    placeholder={`Option ${index + 1}`}
                                  />
                                ))}
                              </div>
                            </div>
                          )}

                          <div>
                            <label className="block text-sm font-medium text-gray-700">
                              Correct Answer
                            </label>
                            {type === 'truefalse' ? (
                              <select
                                value={correctAnswer}
                                onChange={(e) => setCorrectAnswer(e.target.value)}
                                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                                required
                              >
                                <option value="">Select answer</option>
                                <option value="true">True</option>
                                <option value="false">False</option>
                              </select>
                            ) : (
                              <input
                                type="text"
                                value={correctAnswer}
                                onChange={(e) => setCorrectAnswer(e.target.value)}
                                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                                required
                              />
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                  <div className="bg-gray-50 px-4 py-3 sm:flex sm:flex-row-reverse sm:px-6">
                    <button
                      type="submit"
                      disabled={isSubmitting}
                      className={`inline-flex w-full justify-center rounded-md px-3 py-2 text-sm font-semibold text-white shadow-sm sm:ml-3 sm:w-auto ${
                        isSubmitting
                          ? 'bg-blue-400 cursor-not-allowed'
                          : 'bg-blue-600 hover:bg-blue-500'
                      }`}
                    >
                      {isSubmitting
                        ? 'Saving...'
                        : mode === 'create'
                        ? 'Create'
                        : 'Save'}
                    </button>
                    <button
                      type="button"
                      className="mt-3 inline-flex w-full justify-center rounded-md bg-white px-3 py-2 text-sm font-semibold text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 hover:bg-gray-50 sm:mt-0 sm:w-auto"
                      onClick={onClose}
                      ref={cancelButtonRef}
                      disabled={isSubmitting}
                    >
                      Cancel
                    </button>
                  </div>
                </form>
              </Dialog.Panel>
            </Transition.Child>
          </div>
        </div>
      </Dialog>
    </Transition.Root>
  );
}
