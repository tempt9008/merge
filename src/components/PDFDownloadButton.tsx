import { useState } from 'react';
import { FileDown, Loader2 } from 'lucide-react';
import { pdf } from '../lib/pdf-worker';
import { QuestionPDF } from './QuestionPDF';
import { Question } from '../types';
import { supabase } from '../lib/supabase';
import toast from 'react-hot-toast';

interface PDFDownloadButtonProps {
  title: string;
  questions: Question[];
  includeAnswers?: boolean;
  onlyActive?: boolean;
}

// Fisher-Yates shuffle algorithm
const shuffleArray = <T,>(array: T[]): T[] => {
  const shuffled = [...array];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
};

interface CategoryQuestions {
  categoryName: string;
  questions: Question[];
}

export default function PDFDownloadButton({
  title,
  questions,
  includeAnswers = true,
  onlyActive = false,
}: PDFDownloadButtonProps) {
  const [isGenerating, setIsGenerating] = useState(false);

  const organizeQuestionsByCategory = async (questions: Question[]): Promise<CategoryQuestions[]> => {
    // Get unique category IDs
    const categoryIds = [...new Set(questions.map(q => q.category_id))];

    // Fetch category names
    const { data: categories } = await supabase
      .from('categories')
      .select('id, name')
      .in('id', categoryIds);

    const categoryMap = new Map(categories?.map(c => [c.id, c.name]) || []);

    // Group questions by category
    const groupedQuestions = questions.reduce((acc, question) => {
      const categoryName = categoryMap.get(question.category_id) || 'Uncategorized';
      if (!acc[categoryName]) {
        acc[categoryName] = [];
      }
      acc[categoryName].push(question);
      return acc;
    }, {} as Record<string, Question[]>);

    // Convert to array and shuffle questions within each category
    return Object.entries(groupedQuestions).map(([categoryName, questions]) => ({
      categoryName,
      questions: shuffleArray(questions),
    }));
  };

  const handleDownload = async () => {
    try {
      setIsGenerating(true);
      toast.loading('Preparing PDF...', { id: 'pdf-generation' });

      // Filter questions based on active status if needed
      const filteredQuestions = onlyActive 
        ? questions.filter(q => q.is_active)
        : questions;

      if (filteredQuestions.length === 0) {
        toast.dismiss('pdf-generation');
        toast.error('No questions available for PDF generation');
        return;
      }

      // Organize questions by category
      const organizedQuestions = await organizeQuestionsByCategory(filteredQuestions);

      // Check for image questions
      const imageQuestions = filteredQuestions.filter(q => q.type === 'image' && q.image_url);
      if (imageQuestions.length > 0) {
        toast.loading('Processing images...', { id: 'image-processing' });
        
        // Pre-cache images
        await Promise.all(
          imageQuestions.map(async (q) => {
            if (q.image_url) {
              try {
                const response = await fetch(q.image_url);
                if (!response.ok) throw new Error('Failed to load image');
                await response.blob();
              } catch (error) {
                console.error('Error loading image:', error);
                q.image_url = undefined;
              }
            }
          })
        );
      }

      const blob = await pdf(
        <QuestionPDF
          title={title}
          categorizedQuestions={organizedQuestions}
          includeAnswers={includeAnswers}
        />
      ).toBlob();
      
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `${title.toLowerCase().replace(/\s+/g, '-')}-questions.pdf`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
      
      toast.dismiss('pdf-generation');
      toast.dismiss('image-processing');
      toast.success('PDF generated successfully');
    } catch (error) {
      console.error('Error generating PDF:', error);
      toast.dismiss('pdf-generation');
      toast.dismiss('image-processing');
      toast.error('Error generating PDF. Please try again.');
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <button
      onClick={handleDownload}
      disabled={isGenerating || questions.length === 0}
      className="p-2 hover:bg-gray-100 rounded-full transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
      title={questions.length === 0 ? 'No questions available' : 'Download PDF'}
    >
      {isGenerating ? (
        <Loader2 className="h-5 w-5 animate-spin text-gray-500" />
      ) : (
        <FileDown className="h-5 w-5 text-gray-500 hover:text-blue-600" />
      )}
    </button>
  );
}
