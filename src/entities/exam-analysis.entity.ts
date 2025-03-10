import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';

@Entity()
export class ExamAnalysis {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  subject: string;

  @Column()
  rating: string;

  @Column()
  totalQuestions: number;

  @Column()
  emptyAnswers: number;

  @Column()
  correctAnswers: number;

  @Column()
  wrongAnswers: number;

  @Column('json')
  questionLabels: { questionNumber: number; label: string }[];

  @Column('json')
  analysisResult: {
    topicAnalysis: {
      topic: string;
      questionCount: number;
      correctPercentage: number;
      incorrectPercentage: number;
    }[];
    strengths: string[];
    weaknesses: string[];
    suggestedTopics: string[];
    improvementSuggestions: string;
    studyMethodSuggestions: string;
    nextExamSuggestions: string;
    timeAnalysisSuggestions: string;
  };

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
