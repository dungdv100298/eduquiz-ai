import { ApiProperty } from '@nestjs/swagger';
import { IsArray, IsEnum, IsInt, IsNotEmpty, IsString, Min, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';

export enum Rating {
  WEAK = 'weak',
  AVERAGE = 'average',
  GOOD = 'good',
  EXCELLENT = 'excellent',
  OUTSTANDING = 'outstanding',
}

export class QuestionLabel {
  @ApiProperty({ description: 'Question number', example: 1 })
  @IsInt()
  @Min(1)
  questionNumber: number;

  @ApiProperty({ description: 'Topic label for the question', example: 'geometry' })
  @IsString()
  @IsNotEmpty()
  label: string;
}

export class CreateAnalysisDto {
  @ApiProperty({ description: 'Exam content or title', example: 'Math Midterm Exam' })
  @IsString()
  @IsNotEmpty()
  examContent: string;

  @ApiProperty({ description: 'Subject of the exam', example: 'Mathematics' })
  @IsString()
  @IsNotEmpty()
  subject: string;

  @ApiProperty({ 
    description: 'Rating of the exam result', 
    enum: Rating,
    example: Rating.GOOD 
  })
  @IsEnum(Rating)
  rating: Rating;

  @ApiProperty({ description: 'Total number of questions in the exam', example: 30 })
  @IsInt()
  @Min(1)
  totalQuestions: number;

  @ApiProperty({ description: 'Number of questions left unanswered', example: 2 })
  @IsInt()
  @Min(0)
  emptyAnswers: number;

  @ApiProperty({ description: 'Number of correctly answered questions', example: 20 })
  @IsInt()
  @Min(0)
  correctAnswers: number;

  @ApiProperty({ description: 'Number of incorrectly answered questions', example: 8 })
  @IsInt()
  @Min(0)
  wrongAnswers: number;

  @ApiProperty({ 
    description: 'Labels for each question in the exam',
    type: [QuestionLabel],
    example: [
      { questionNumber: 1, label: 'geometry' },
      { questionNumber: 2, label: 'algebra' }
    ]
  })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => QuestionLabel)
  questionLabels: QuestionLabel[];
} 