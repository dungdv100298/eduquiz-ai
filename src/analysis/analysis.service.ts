/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
/* eslint-disable @typescript-eslint/no-unsafe-call */
import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ExamAnalysis } from '../entities/exam-analysis.entity';
import { CreateAnalysisDto } from './dto/create-analysis.dto';
import { AnalysisResultDto, TopicAnalysis } from './dto/analysis-result.dto';
import { GoogleGenerativeAI } from '@google/generative-ai';

@Injectable()
export class AnalysisService {
  private genAI: GoogleGenerativeAI;
  private model: ReturnType<GoogleGenerativeAI['getGenerativeModel']>;

  constructor(
    @InjectRepository(ExamAnalysis)
    private examAnalysisRepository: Repository<ExamAnalysis>,
  ) {
    // Initialize Google Generative AI
    this.genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || '');
    this.model = this.genAI.getGenerativeModel({ model: 'gemini-1.5-pro' });
  }

  async analyzeExam(
    createAnalysisDto: CreateAnalysisDto,
  ): Promise<AnalysisResultDto> {
    // Group questions by topic
    const topicMap = new Map<
      string,
      {
        total: number;
        correct: number;
        incorrect: number;
        empty: number;
        questions: number[];
      }
    >();

    // Calculate total questions per topic and correct/incorrect counts
    createAnalysisDto.questionLabels.forEach((question, index) => {
      const topic = question.label;
      const questionNumber = question.questionNumber;

      if (!topicMap.has(topic)) {
        topicMap.set(topic, {
          total: 0,
          correct: 0,
          incorrect: 0,
          empty: 0,
          questions: [],
        });
      }

      const topicData = topicMap.get(topic);
      topicData.total += 1;
      topicData.questions.push(questionNumber);

      // We don't have per-question correctness in the DTO, so we'll estimate based on overall stats
      // This is a simplification - in a real app, you'd want per-question correctness data
    });

    // Calculate estimated correct/incorrect per topic based on overall stats
    const totalCorrectRatio =
      createAnalysisDto.correctAnswers / createAnalysisDto.totalQuestions;
    const totalWrongRatio =
      createAnalysisDto.wrongAnswers / createAnalysisDto.totalQuestions;
    const totalEmptyRatio =
      createAnalysisDto.emptyAnswers / createAnalysisDto.totalQuestions;

    // Apply these ratios to each topic (simplified approach)
    topicMap.forEach((data) => {
      data.correct = Math.round(data.total * totalCorrectRatio);
      data.incorrect = Math.round(data.total * totalWrongRatio);
      data.empty = Math.round(data.total * totalEmptyRatio);

      // Adjust if rounding caused inconsistencies
      const sum = data.correct + data.incorrect + data.empty;
      if (sum > data.total) {
        data.incorrect -= sum - data.total;
      } else if (sum < data.total) {
        data.correct += data.total - sum;
      }
    });

    // Create topic analysis
    const topicAnalysis: TopicAnalysis[] = Array.from(topicMap.entries()).map(
      ([topic, data]) => {
        return {
          topic,
          questionCount: data.total,
          correctPercentage: Math.round((data.correct / data.total) * 100),
          incorrectPercentage: Math.round(
            ((data.incorrect + data.empty) / data.total) * 100,
          ),
        };
      },
    );

    // Identify strengths and weaknesses
    const strengths = topicAnalysis
      .filter((topic) => topic.correctPercentage >= 80)
      .map((topic) => topic.topic);

    const weaknesses = topicAnalysis
      .filter((topic) => topic.correctPercentage < 50)
      .map((topic) => topic.topic);

    const suggestedTopics = [...weaknesses];

    // Calculate overall score (0-10 scale)
    const score =
      (createAnalysisDto.correctAnswers / createAnalysisDto.totalQuestions) *
      10;

    // Generate AI suggestions
    const aiSuggestions = await this.generateAISuggestions(
      createAnalysisDto.subject,
      score,
      strengths,
      weaknesses,
      topicAnalysis,
    );

    // Create analysis result
    const analysisResult: AnalysisResultDto = {
      topicAnalysis,
      strengths,
      weaknesses,
      suggestedTopics,
      improvementSuggestions: aiSuggestions.improvementSuggestions,
      studyMethodSuggestions: aiSuggestions.studyMethodSuggestions,
      nextExamSuggestions: aiSuggestions.nextExamSuggestions,
    };

    // Save analysis to database
    const examAnalysis = this.examAnalysisRepository.create({
      subject: createAnalysisDto.subject,
      rating: createAnalysisDto.rating,
      totalQuestions: createAnalysisDto.totalQuestions,
      emptyAnswers: createAnalysisDto.emptyAnswers,
      correctAnswers: createAnalysisDto.correctAnswers,
      wrongAnswers: createAnalysisDto.wrongAnswers,
      questionLabels: createAnalysisDto.questionLabels,
      analysisResult,
    });

    await this.examAnalysisRepository.save(examAnalysis);

    return analysisResult;
  }

  private async generateAISuggestions(
    subject: string,
    score: number,
    strengths: string[],
    weaknesses: string[],
    topicAnalysis: TopicAnalysis[],
  ): Promise<{
    improvementSuggestions: string;
    studyMethodSuggestions: string;
    nextExamSuggestions: string;
  }> {
    try {
      const prompt = `
        As an educational AI assistant, provide personalized learning recommendations based on the following exam analysis:
        
        Subject: ${subject}
        Overall Score: ${score.toFixed(1)}/10
        Strengths (topics with >80% correct): ${strengths.join(', ') || 'None'}
        Weaknesses (topics with <50% correct): ${weaknesses.join(', ') || 'None'}
        
        Topic breakdown:
        ${topicAnalysis.map((t) => `- ${t.topic}: ${t.correctPercentage}% correct (${t.questionCount} questions)`).join('\n')}
        
        Please provide three separate recommendations:
        1. Improvement suggestions based on the score (specific to ${score < 5 ? 'low' : score < 8 ? 'medium' : 'high'} performance)
        2. Study method suggestions for the weak topics
        3. Recommendations for what type of exam or practice to try next
      `;

      const result = await this.model.generateContent(prompt);
      console.log(result);
      const response = result.response;
      const text = response.text();

      // Parse the AI response - this is simplified and would need more robust parsing in production
      const sections = text.split(/\d\.\s+/);
      return {
        improvementSuggestions:
          sections[1]?.trim() ||
          'Focus on understanding the fundamental concepts of weak topics.',
        studyMethodSuggestions:
          sections[2]?.trim() ||
          'Practice with varied problem types and review mistakes carefully.',
        nextExamSuggestions:
          sections[3]?.trim() ||
          'Try a practice exam focusing on your weak areas to measure improvement.',
      };
    } catch (error) {
      console.log('cccc');
      console.error('Error generating AI suggestions:', error);
      // Fallback suggestions if AI fails
      return {
        improvementSuggestions:
          score < 5
            ? 'Focus on mastering the basic concepts before moving to advanced topics.'
            : score < 8
              ? 'Continue practicing the weak topics to improve your overall performance.'
              : 'Maintain your study habits and consider exploring more advanced material.',
        studyMethodSuggestions:
          'Use a combination of textbooks, video tutorials, and practice problems. Review mistakes carefully to understand where you went wrong.',
        nextExamSuggestions:
          'Try a practice exam that focuses specifically on your weak areas to measure your improvement.',
      };
    }
  }
}
