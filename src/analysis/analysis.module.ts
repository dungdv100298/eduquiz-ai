import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AnalysisController } from './analysis.controller';
import { AnalysisService } from './analysis.service';
import { ExamAnalysis } from '../entities/exam-analysis.entity';

@Module({
  imports: [TypeOrmModule.forFeature([ExamAnalysis])],
  controllers: [AnalysisController],
  providers: [AnalysisService],
  exports: [AnalysisService],
})
export class AnalysisModule {} 