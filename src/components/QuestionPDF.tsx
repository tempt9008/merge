import { Page, Text, Document, StyleSheet, View, Image } from '@react-pdf/renderer'; // Removed Font import
import Html from 'react-pdf-html'; // Import the Html component

// --- Removed Font Registration ---

// Define necessary interfaces
interface Question {
  id?: string;
  question: string;
  type: 'text' | 'multichoice' | 'truefalse' | 'image';
  options?: string[];
  correct_answer?: string;
  is_active: boolean;
  image_url?: string;
}

interface Category {
  categoryName: string;
  questions: Question[];
}

interface QuestionPDFProps {
  title: string;
  categorizedQuestions: Category[];
  includeAnswers?: boolean;
}

// Removed leftover TextSegment interface
const styles = StyleSheet.create({
  // Add base style for Html component if needed, or rely on inherited styles
  html: {
    fontFamily: 'Helvetica', // Reverted to standard name
    fontSize: 12,          // Base font size for HTML content
    lineHeight: 1.4,
  },
  // Add specific styles for HTML tags
  p: {
    marginBottom: 5,
    marginTop: 5,
  },
  strong: {
    fontFamily: 'Helvetica-Bold', // Reverted to standard name
  },
  b: {
    fontFamily: 'Helvetica-Bold', // Reverted to standard name
  },
  em: {
    fontFamily: 'Helvetica-Oblique', // Reverted to standard name
  },
  i: {
    fontFamily: 'Helvetica-Oblique', // Reverted to standard name
  },
  u: {
    textDecoration: 'underline',
  },
  h1: {
    fontFamily: 'Helvetica-Bold', // Reverted to standard name
    fontSize: 18,
    marginBottom: 8,
    marginTop: 10,
  },
  h2: {
    fontFamily: 'Helvetica-Bold', // Reverted to standard name
    fontSize: 16,
    marginBottom: 6,
    marginTop: 8,
  },
  ul: {
    marginTop: 5,
    marginBottom: 5,
    marginLeft: 10, // Indentation for lists
  },
  ol: {
    marginTop: 5,
    marginBottom: 5,
    marginLeft: 10, // Indentation for lists
  },
  li: {
    marginBottom: 3,
    // Note: react-pdf-html might handle list markers automatically or require custom rendering
  },
  blockquote: {
    fontFamily: 'Helvetica-Oblique', // Reverted to standard name
    marginLeft: 10,
    paddingLeft: 10,
    borderLeftWidth: 2,
    borderLeftColor: '#cccccc',
    color: '#555555',
    marginTop: 5,
    marginBottom: 5,
  },
  // Add other tags as needed (e.g., pre, code)

  page: {
    padding: 20,
    fontSize: 15, // Default page font size, can be overridden by html styles
    fontFamily: 'Helvetica', // Reverted to standard name
  },
  title: {
    fontSize: 18,
    marginBottom: 20,
    textAlign: 'center',
    fontFamily: 'Helvetica-Bold', // Reverted to standard name
  },
  categoryTitle: {
    fontSize: 16,
    marginTop: 15,
    marginBottom: 10,
    backgroundColor: '#f0f0f0',
    padding: 8,
    fontFamily: 'Helvetica-Bold', // Reverted to standard name
  },
  questionContainer: {
    marginBottom: 5,
    breakInside: 'avoid',
  },
  questionText: {
    // fontSize: 14, // Font size now controlled by styles.html or specific tag styles
    marginBottom: 5,
    // fontFamily: 'Helvetica', // Font family now controlled by styles.html or specific tag styles
    // lineHeight: 1.4, // Line height now controlled by styles.html or specific tag styles
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  questionNumber: {
    marginRight: 4,
    fontSize: 12, // Match base HTML font size
    fontFamily: 'Helvetica', // Reverted to standard name
    lineHeight: 1.4,
  },
  questionContent: {
    flex: 1,
    // Removed questionParagraph as Html component handles paragraphs
  },
  questionStatus: {
    fontSize: 10,
    marginBottom: 5,
    color: '#666666',
    fontFamily: 'Helvetica', // Reverted to standard name
  },
  imageContainer: {
    marginBottom: 5,
    maxHeight: 400,
    alignItems: 'center',
  },
  questionImage: {
    objectFit: 'contain',
    maxWidth: '90%',
    maxHeight: 240,
  },
  options: {
    marginLeft: 20,
    marginTop: 3,
  },
  option: {
    marginBottom: 3,
    fontSize: 12,
    lineHeight: 1.3,
    fontFamily: 'Helvetica', // Reverted to standard name
  },
  answerSection: {
    marginTop: 30,
    borderTopWidth: 1,
    borderTopColor: '#999',
    paddingTop: 20,
  },
  answerTitle: {
    fontSize: 16,
    marginBottom: 15,
    fontFamily: 'Helvetica-Bold', // Reverted to standard name
    textAlign: 'center',
  },
  categoryAnswers: {
    marginTop: 15,
    marginBottom: 20,
    pageBreakInside: 'avoid',
  },
  categoryAnswerTitle: {
    fontSize: 14,
    // fontWeight: 'bold', // react-pdf uses fontFamily for bold
    marginBottom: 8,
    fontFamily: 'Helvetica-Bold', // Reverted to standard name
    backgroundColor: '#f5f5f5',
    padding: 5,
  },
  answerKey: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 5,
  },
  answer: {
    width: '45%',
    marginBottom: 8,
    fontSize: 11,
    lineHeight: 1.4,
    fontFamily: 'Helvetica', // Reverted to standard name
    padding: 2,
  },
  answerLine: {
    marginBottom: 8,
    marginTop: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#999',
    borderBottomStyle: 'dotted',
  },
});

// Removed the custom parseHtml function and QuestionText component

export const QuestionPDF = ({
  title,
  categorizedQuestions,
  includeAnswers = true
}: QuestionPDFProps) => (
  <Document>
    {/* Questions Page */}
    <Page size="A4" style={styles.page}>
      <Text style={styles.title}>{title}</Text>

      {categorizedQuestions.map((category: Category, categoryIndex: number) => (
        <View key={categoryIndex}>
          <Text style={styles.categoryTitle}>{category.categoryName}</Text>
          {category.questions.map((question: Question, index: number) => (
            <View key={`${categoryIndex}-${index}`} style={styles.questionContainer}>
              {!question.is_active && (
                <Text style={styles.questionStatus}>(Inactive Question)</Text>
              )}
              <View style={styles.questionText}>
                <Text style={styles.questionNumber}>{index + 1}. </Text>
                {/* Use the Html component to render question content */}
                <View style={styles.questionContent}>
                  {/* Pass the extended stylesheet to the Html component */}
                  <Html stylesheet={styles} style={styles.html}>
                    {question.question}
                  </Html>
                </View>
              </View>

              {question.type === 'image' && question.image_url && (
                <View style={styles.imageContainer}>
                  <Image
                    src={question.image_url}
                    style={styles.questionImage}
                    cache={false} // Consider setting cache={true} if images don't change often
                  />
                </View>
              )}

              {question.type === 'text' && (
                <View style={styles.answerLine} />
              )}

              {question.type === 'multichoice' && question.options && (
                <View style={styles.options}>
                  {question.options.map((option: string, optIndex: number) => (
                    <Text key={optIndex} style={styles.option}>
                      {String.fromCharCode(97 + optIndex)}. {option}
                    </Text>
                  ))}
                </View>
              )}

              {question.type === 'truefalse' && (
                <View style={styles.options}>
                  <Text style={styles.option}>a. True</Text>
                  <Text style={styles.option}>b. False</Text>
                </View>
              )}

              {question.type === 'image' && (
                <View style={styles.answerLine} />
              )}
            </View>
          ))}
        </View>
      ))}
    </Page>

    {/* Answer Key Page */}
    {includeAnswers && categorizedQuestions.length > 0 && (
      <Page size="A4" style={styles.page}>
        <Text style={styles.answerTitle}>Answer Key</Text>
        {categorizedQuestions.map((category: Category, categoryIndex: number) => (
          <View key={`answers-${categoryIndex}`} style={styles.categoryAnswers}>
            <Text style={styles.categoryAnswerTitle}>{category.categoryName}</Text>
            <View style={styles.answerKey}>
              {category.questions.map((question: Question, index: number) => (
                <Text key={`${categoryIndex}-${index}`} style={styles.answer}>
                  {index + 1}. {question.correct_answer}
                  {!question.is_active ? ' (Inactive)' : ''}
                </Text>
              ))}
            </View>
          </View>
        ))}
      </Page>
    )}
  </Document>
);
