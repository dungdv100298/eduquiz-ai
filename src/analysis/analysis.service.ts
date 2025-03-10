/* eslint-disable @typescript-eslint/no-unsafe-return */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */

import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ExamAnalysis } from '../entities/exam-analysis.entity';
import { CreateAnalysisDto, QuestionLabel } from './dto/create-analysis.dto';
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
    // create topic analysis
    const topicAnalysis = this.calculateTopicAnalysis(
      createAnalysisDto.questionLabels,
    );
    const averageSpeed =
      createAnalysisDto.time / createAnalysisDto.totalQuestions;

    const timeSpent =
      createAnalysisDto.workingTime / createAnalysisDto.totalQuestions;

    // Identify strengths and weaknesses
    const strengths = topicAnalysis
      .filter((topic) => topic.correctPercentage >= 80)
      .map((topic) => topic.topic);

    const weaknesses = topicAnalysis
      .filter((topic) => topic.correctPercentage < 50)
      .map((topic) => topic.topic);

    // // Generate AI suggestions
    const aiSuggestions = await this.generateAISuggestions(
      createAnalysisDto.subject,
      createAnalysisDto.score,
      averageSpeed,
      timeSpent,
      strengths,
      weaknesses,
      topicAnalysis,
      createAnalysisDto.language as 'vi' | 'en',
    );

    // Create analysis result
    const analysisResult: AnalysisResultDto = {
      summary: {
        examName: createAnalysisDto.examContent,
        subject: createAnalysisDto.subject,
        score: createAnalysisDto.score,
        time: createAnalysisDto.time,
      },
      detailExamResult: {
        totalQuestions: createAnalysisDto.totalQuestions,
        emptyAnswers: createAnalysisDto.emptyAnswers,
        correctAnswers: createAnalysisDto.correctAnswers,
        wrongAnswers: createAnalysisDto.wrongAnswers,
        rating: createAnalysisDto.rating,
      },
      topicAnalysis,
      workingTimeAnalysis: {
        workingTime: createAnalysisDto.workingTime,
        averageSpeed,
        timeSpent,
      },
      strengths,
      weaknesses,
      improvementSuggestions: aiSuggestions.improvementSuggestions,
      timeAnalysisSuggestions: aiSuggestions.timeAnalysisSuggestions,
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

  calculateTopicAnalysis(questionLabels: QuestionLabel[]): TopicAnalysis[] {
    const topicStatsMap = new Map();

    // Process each question
    questionLabels.forEach((question) => {
      const { label, isCorrect } = question;

      if (!topicStatsMap.has(label)) {
        topicStatsMap.set(label, {
          topic: label,
          questionCount: 0,
          correctCount: 0,
          wrongCount: 0,
          correctPercentage: 0,
          incorrectPercentage: 0,
        });
      }

      const stats = topicStatsMap.get(label);
      stats.questionCount++;

      if (isCorrect) {
        stats.correctCount++;
      } else {
        stats.wrongCount++;
      }
    });

    const result: TopicAnalysis[] = Array.from(topicStatsMap.values()).map(
      (stats) => {
        return {
          ...stats,
          correctPercentage: (stats.correctCount / stats.questionCount) * 100,
          incorrectPercentage: (stats.wrongCount / stats.questionCount) * 100,
        };
      },
    );

    return result;
  }

  private async generateAISuggestions(
    subject: string,
    score: number,
    averageSpeed: number,
    timeSpent: number,
    strengths: string[],
    weaknesses: string[],
    topicAnalysis: TopicAnalysis[],
    language: 'vi' | 'en',
  ): Promise<{
    improvementSuggestions: string;
    timeAnalysisSuggestions: string;
    studyMethodSuggestions: string;
    nextExamSuggestions: string;
  }> {
    try {
      // Xác định ngôn ngữ cho prompt
      const languageText = language === 'vi' ? 'tiếng Việt' : 'English';
      const promptIntro =
        language === 'vi'
          ? `Với vai trò là trợ lý AI giáo dục, hãy đưa ra các khuyến nghị học tập cá nhân hóa dựa trên phân tích bài kiểm tra sau đây (trả lời bằng ${languageText}):`
          : `As an educational AI assistant, provide personalized learning recommendations based on the following exam analysis (answer in ${languageText}):`;

      const strengthsLabel =
        language === 'vi'
          ? 'Điểm mạnh (các chủ đề >80% đúng)'
          : 'Strengths (topics with >80% correct)';
      const weaknessesLabel =
        language === 'vi'
          ? 'Điểm yếu (các chủ đề <50% đúng)'
          : 'Weaknesses (topics with <50% correct)';
      const subjectLabel = language === 'vi' ? 'Môn học' : 'Subject';
      const scoreLabel = language === 'vi' ? 'Điểm tổng thể' : 'Overall Score';
      const averageSpeedLabel =
        language === 'vi'
          ? 'Tốc độ trung bình mỗi câu'
          : 'Average Speed per question';
      const timeSpentLabel =
        language === 'vi' ? 'Thời gian làm mỗi câu' : 'Time Spent per question';
      const topicBreakdownLabel =
        language === 'vi' ? 'Phân tích theo chủ đề' : 'Topic breakdown';
      const correctLabel = language === 'vi' ? 'đúng' : 'correct';
      const questionsLabel = language === 'vi' ? 'câu hỏi' : 'questions';

      const performanceType =
        score < 5
          ? language === 'vi'
            ? 'Thấp (Gợi ý tài liệu, bài tập hoặc khóa học để ôn tập)'
            : 'Low (suggest materials, exercises or courses to review)'
          : score < 8
            ? language === 'vi'
              ? 'Trung bình (Gợi ý luyện thêm các chủ đề yếu để nâng cao năng lực)'
              : 'Medium (Suggested materials, exercises or courses to review)'
            : language === 'vi'
              ? 'Cao (Gợi ý giữ nguyên phong độ để đạt kết quả tốt )'
              : 'High (Tips to keep up the good form)';

      const recommendationsIntro =
        language === 'vi'
          ? 'Vui lòng đưa ra 4 khuyến nghị riêng biệt:'
          : 'Please provide four separate recommendations:';

      const improvementSuggestionsLabel =
        language === 'vi'
          ? `1. Đề xuất cải thiện dựa trên điểm số (cụ thể cho hiệu suất ${performanceType})`
          : `1. Improvement suggestions based on the score (specific to ${performanceType} performance)`;

      const timeAnalysisLabel =
        language === 'vi'
          ? `2. Đánh giá về thời gian làm bài (tốc độ trung bình: ${averageSpeed.toFixed(1)} giây/câu, tổng thời gian: ${timeSpent} giây)`
          : `2. Time analysis (average speed: ${averageSpeed.toFixed(1)} seconds/question, total time: ${timeSpent} seconds)`;

      const studyMethodSuggestionsLabel =
        language === 'vi'
          ? '3. Đề xuất phương pháp học tập cho các chủ đề yếu'
          : '3. Study method suggestions for the weak topics';

      const nextExamSuggestionsLabel =
        language === 'vi'
          ? '4. Khuyến nghị về loại bài kiểm tra hoặc thực hành nên thử tiếp theo'
          : '4. Recommendations for what type of exam or practice to try next';

      // Thêm hướng dẫn chi tiết cho phân tích thời gian
      const timeAnalysisGuidance =
        language === 'vi'
          ? `Khi phân tích thời gian, hãy xem xét các yếu tố sau:
          - Nếu tốc độ nhanh mà điểm thấp: Người dùng có thể đang vội vàng và cần tập trung hơn
          - Nếu tốc độ chậm mà điểm cao: Người dùng cần cải thiện tốc độ để hoàn thành bài thi đúng thời gian
          - Nếu tốc độ chậm mà điểm thấp: Người dùng cần luyện tập thêm để cải thiện cả tốc độ và kiến thức`
          : `When analyzing time, consider the following factors:
          - If speed is fast but score is low: User may be rushing and needs to focus more
          - If speed is slow but score is high: User needs to improve speed to complete exams on time
          - If speed is slow and score is low: User needs more practice to improve both speed and knowledge`;

      const prompt = `
        ${promptIntro}
        
        ${subjectLabel}: ${subject}
        ${scoreLabel}: ${score.toFixed(1)}/10
        ${averageSpeedLabel}: ${averageSpeed.toFixed(1)} ${language === 'vi' ? 'giây/câu' : 'seconds/question'}
        ${timeSpentLabel}: ${timeSpent.toFixed(1)} ${language === 'vi' ? 'giây' : 'seconds'}
        ${strengthsLabel}: ${strengths.join(', ') || (language === 'vi' ? 'Không có' : 'None')}
        ${weaknessesLabel}: ${weaknesses.join(', ') || (language === 'vi' ? 'Không có' : 'None')}
        
        ${topicBreakdownLabel}:
        ${topicAnalysis.map((t) => `- ${t.topic}: ${t.correctPercentage}% ${correctLabel} (${t.questionCount} ${questionsLabel})`).join('\n')}
        
        ${recommendationsIntro}
        ${improvementSuggestionsLabel}
        ${timeAnalysisLabel}
        ${timeAnalysisGuidance}
        ${studyMethodSuggestionsLabel}
        ${nextExamSuggestionsLabel}
      `;
      const result = await this.model.generateContent(prompt);
      const response = result.response;
      const text = response.text();
      // Parse the AI response - this is simplified and would need more robust parsing in production
      const sections = text.split(/\d\.\s+/);

      // Fallback messages based on language
      const fallbackImprovement =
        language === 'vi'
          ? 'Tập trung vào việc hiểu các khái niệm cơ bản của các chủ đề yếu.'
          : 'Focus on understanding the fundamental concepts of weak topics.';

      const fallbackTimeAnalysis =
        language === 'vi'
          ? score < 5 && averageSpeed < 30
            ? 'Bạn đang làm bài quá nhanh so với mức độ hiểu biết. Hãy dành thêm thời gian để suy nghĩ kỹ trước khi trả lời.'
            : score >= 8 && averageSpeed > 60
              ? 'Bạn làm bài khá chậm mặc dù kết quả tốt. Hãy luyện tập để cải thiện tốc độ mà vẫn giữ được độ chính xác.'
              : 'Hãy cân bằng giữa tốc độ và độ chính xác. Luyện tập thường xuyên sẽ giúp bạn cải thiện cả hai yếu tố.'
          : score < 5 && averageSpeed < 30
            ? 'You are answering too quickly for your level of understanding. Take more time to think carefully before answering.'
            : score >= 8 && averageSpeed > 60
              ? 'You work quite slowly despite good results. Practice to improve your speed while maintaining accuracy.'
              : 'Balance speed and accuracy. Regular practice will help you improve both factors.';

      const fallbackStudyMethod =
        language === 'vi'
          ? 'Thực hành với nhiều loại bài tập khác nhau và xem xét kỹ lưỡng các lỗi sai.'
          : 'Practice with varied problem types and review mistakes carefully.';

      const fallbackNextExam =
        language === 'vi'
          ? 'Thử một bài kiểm tra tập trung vào các lĩnh vực yếu của bạn để đo lường sự tiến bộ.'
          : 'Try a practice exam focusing on your weak areas to measure improvement.';

      return {
        improvementSuggestions: sections[1]?.trim() || fallbackImprovement,
        timeAnalysisSuggestions: sections[2]?.trim() || fallbackTimeAnalysis,
        studyMethodSuggestions: sections[3]?.trim() || fallbackStudyMethod,
        nextExamSuggestions: sections[4]?.trim() || fallbackNextExam,
      };
    } catch (error) {
      console.error('Error generating AI suggestions:', error);

      // Fallback suggestions if AI fails, based on language
      if (language === 'vi') {
        const timeAnalysisFallback =
          score < 5 && timeSpent < averageSpeed
            ? 'Bạn đang làm bài quá nhanh so với mức độ hiểu biết. Hãy dành thêm thời gian để suy nghĩ kỹ trước khi trả lời.'
            : score >= 8 && timeSpent > averageSpeed
              ? 'Bạn làm bài khá chậm mặc dù kết quả tốt. Hãy luyện tập để cải thiện tốc độ mà vẫn giữ được độ chính xác.'
              : 'Hãy cân bằng giữa tốc độ và độ chính xác. Luyện tập thường xuyên sẽ giúp bạn cải thiện cả hai yếu tố.';

        return {
          improvementSuggestions:
            score < 5
              ? 'Tập trung vào việc nắm vững các khái niệm cơ bản trước khi chuyển sang các chủ đề nâng cao.'
              : score < 8
                ? 'Tiếp tục luyện tập các chủ đề yếu để cải thiện hiệu suất tổng thể của bạn.'
                : 'Duy trì thói quen học tập và xem xét khám phá tài liệu nâng cao hơn.',
          timeAnalysisSuggestions: timeAnalysisFallback,
          studyMethodSuggestions:
            'Sử dụng kết hợp sách giáo khoa, hướng dẫn video và bài tập thực hành. Xem xét kỹ lưỡng các lỗi sai để hiểu rõ bạn đã sai ở đâu.',
          nextExamSuggestions:
            'Thử một bài kiểm tra tập trung cụ thể vào các lĩnh vực yếu của bạn để đo lường sự tiến bộ.',
        };
      } else {
        const timeAnalysisFallback =
          score < 5 && timeSpent < averageSpeed
            ? 'You are answering too quickly for your level of understanding. Take more time to think carefully before answering.'
            : score >= 8 && timeSpent > averageSpeed
              ? 'You work quite slowly despite good results. Practice to improve your speed while maintaining accuracy.'
              : 'Balance speed and accuracy. Regular practice will help you improve both factors.';

        return {
          improvementSuggestions:
            score < 5
              ? 'Focus on mastering the basic concepts before moving to advanced topics.'
              : score < 8
                ? 'Continue practicing the weak topics to improve your overall performance.'
                : 'Maintain your study habits and consider exploring more advanced material.',
          timeAnalysisSuggestions: timeAnalysisFallback,
          studyMethodSuggestions:
            'Use a combination of textbooks, video tutorials, and practice problems. Review mistakes carefully to understand where you went wrong.',
          nextExamSuggestions:
            'Try a practice exam that focuses specifically on your weak areas to measure your improvement.',
        };
      }
    }
  }
}
