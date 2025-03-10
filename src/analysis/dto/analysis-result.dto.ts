import { ApiProperty } from '@nestjs/swagger';

export class TopicAnalysis {
  @ApiProperty({
    description: 'Topic name',
    example: 'geometry',
  })
  topic: string;

  @ApiProperty({
    description: 'Number of questions in this topic',
    example: 5,
  })
  questionCount: number;

  @ApiProperty({
    description: 'Number of correct answers for this topic',
    example: 5,
  })
  correctCount: number;

  @ApiProperty({
    description: 'Number of wrong answers for this topic',
    example: 5,
  })
  wrongCount: number;

  @ApiProperty({
    description: 'Percentage of correct answers for this topic',
    example: 80,
  })
  correctPercentage: number;

  @ApiProperty({
    description: 'Percentage of incorrect answers for this topic',
    example: 20,
  })
  incorrectPercentage: number;
}

export class SummaryResult {
  @ApiProperty({
    description: 'Exam name',
    example: 'Math Midterm Exam',
  })
  examName: string;

  @ApiProperty({
    description: 'Subject of the exam',
    example: 'Math',
  })
  subject: string;

  @ApiProperty({
    description: 'Score of the exam',
    example: 8.5,
  })
  score: number;

  @ApiProperty({
    description: 'Time of the exam',
    example: 120,
  })
  time: number;
}

export class DetailExamResult {
  @ApiProperty({
    description: 'Rating of the exam',
    example: 'Good',
  })
  rating: string;

  @ApiProperty({
    description: 'Total questions',
    example: 10,
  })
  totalQuestions: number;

  @ApiProperty({
    description: 'Correct answers',
    example: 7,
  })
  correctAnswers: number;

  @ApiProperty({
    description: 'Wrong answers',
    example: 2,
  })
  wrongAnswers: number;

  @ApiProperty({
    description: 'Empty answers',
    example: 1,
  })
  emptyAnswers: number;
}

export class WorkingTimeAnalysis {
  @ApiProperty({
    description: 'Working time of the exam',
    example: 120,
  })
  workingTime: number;

  @ApiProperty({
    description: 'Average speed of the exam',
    example: 50,
  })
  averageSpeed: number;

  @ApiProperty({
    description: 'Number of questions answered % of the workingTime',
    example: 50,
  })
  timeSpent: number;
}

export class AnalysisResultDto {
  @ApiProperty({
    description: 'Summary of the exam',
    type: SummaryResult,
  })
  summary: SummaryResult;

  @ApiProperty({
    description: 'Detail of the exam',
    type: DetailExamResult,
  })
  detailExamResult: DetailExamResult;

  @ApiProperty({
    description: 'Detailed analysis by topic',
    type: [TopicAnalysis],
  })
  topicAnalysis: TopicAnalysis[];

  @ApiProperty({
    description: 'Working time analysis',
    type: WorkingTimeAnalysis,
  })
  workingTimeAnalysis: WorkingTimeAnalysis;

  @ApiProperty({
    description: 'Strengths of the user',
    example: ['calculus', 'trigonometry'],
  })
  strengths: string[];

  @ApiProperty({
    description: 'Weaknesses of the user',
    example: ['calculus', 'trigonometry'],
  })
  weaknesses: string[];

  @ApiProperty({
    description: 'AI-generated improvement suggestions based on score',
    example:
      'Focus on understanding the fundamental concepts of calculus before moving to advanced problems.',
  })
  improvementSuggestions: string;

  @ApiProperty({
    description: 'AI-generated improvement suggestions based on time',
    example:
      'Focus on understanding the fundamental concepts of calculus before moving to advanced problems.',
  })
  timeAnalysisSuggestions: string;

  @ApiProperty({
    description: 'Suggested study methods',
    example:
      'Practice more problem-solving in calculus with step-by-step solutions.',
  })
  studyMethodSuggestions: string;

  @ApiProperty({
    description: 'Suggestions for next exam',
    example:
      'Try a practice exam focusing on calculus and trigonometry to measure improvement.',
  })
  nextExamSuggestions: string;
}
