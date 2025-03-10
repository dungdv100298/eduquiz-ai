import { ApiProperty } from '@nestjs/swagger';
import {
  IsArray,
  IsBoolean,
  IsEnum,
  IsInt,
  IsNotEmpty,
  IsNumber,
  IsString,
  Min,
  ValidateNested,
} from 'class-validator';
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

  @ApiProperty({
    description: 'Topic label for the question',
    example: 'geometry',
  })
  @IsString()
  @IsNotEmpty()
  label: string;

  @ApiProperty({
    description: 'Is the question correct',
    example: true,
  })
  @IsBoolean()
  @IsNotEmpty()
  isCorrect: boolean;
}

export class CreateAnalysisDto {
  @ApiProperty({
    description: 'Exam content or title',
    example: 'Math Midterm Exam',
  })
  @IsString()
  @IsNotEmpty()
  examContent: string;

  @ApiProperty({ description: 'Subject of the exam', example: 'Mathematics' })
  @IsString()
  @IsNotEmpty()
  subject: string;

  @ApiProperty({
    description: 'Time of the exam',
    example: 120 * 60,
  })
  @IsNumber()
  @Min(0)
  time: number;

  @ApiProperty({
    description: 'Working time of the exam',
    example: 100 * 60,
  })
  @IsNumber()
  @Min(0)
  workingTime: number;

  @ApiProperty({
    description: 'Score of the exam',
    example: 8.5,
  })
  @IsNumber()
  @Min(0)
  score: number;

  @ApiProperty({
    description: 'Rating of the exam result',
    enum: Rating,
    example: Rating.GOOD,
  })
  @IsEnum(Rating)
  rating: Rating;

  @ApiProperty({
    description: 'Total number of questions in the exam',
    example: 30,
  })
  @IsInt()
  @Min(1)
  totalQuestions: number;

  @ApiProperty({
    description: 'Number of questions left unanswered',
    example: 2,
  })
  @IsInt()
  @Min(0)
  emptyAnswers: number;

  @ApiProperty({
    description: 'Number of correctly answered questions',
    example: 20,
  })
  @IsInt()
  @Min(0)
  correctAnswers: number;

  @ApiProperty({
    description: 'Number of incorrectly answered questions',
    example: 8,
  })
  @IsInt()
  @Min(0)
  wrongAnswers: number;

  @ApiProperty({
    description: 'Labels for each question in the exam',
    type: [QuestionLabel],
    example: [
      { questionNumber: 1, label: 'geometry', isCorrect: true },
      { questionNumber: 2, label: 'algebra', isCorrect: false },
    ],
  })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => QuestionLabel)
  questionLabels: QuestionLabel[];

  @ApiProperty({
    description: 'Language of the exam',
    example: 'vi',
  })
  @IsString()
  language: string;
}
