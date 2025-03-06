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

export class AnalysisResultDto {
  @ApiProperty({
    description: 'Detailed analysis by topic',
    type: [TopicAnalysis],
  })
  topicAnalysis: TopicAnalysis[];

  @ApiProperty({
    description: 'Topics with high correct answer rate (>80%)',
    example: ['geometry', 'statistics'],
  })
  strengths: string[];

  @ApiProperty({
    description: 'Topics with low correct answer rate (<50%)',
    example: ['calculus', 'trigonometry'],
  })
  weaknesses: string[];

  @ApiProperty({
    description: 'Topics suggested for further study',
    example: ['calculus', 'trigonometry'],
  })
  suggestedTopics: string[];

  @ApiProperty({
    description: 'AI-generated improvement suggestions based on score',
    example: 'Focus on understanding the fundamental concepts of calculus before moving to advanced problems.',
  })
  improvementSuggestions: string;

  @ApiProperty({
    description: 'Suggested study methods',
    example: 'Practice more problem-solving in calculus with step-by-step solutions.',
  })
  studyMethodSuggestions: string;

  @ApiProperty({
    description: 'Suggestions for next exam',
    example: 'Try a practice exam focusing on calculus and trigonometry to measure improvement.',
  })
  nextExamSuggestions: string;
} 