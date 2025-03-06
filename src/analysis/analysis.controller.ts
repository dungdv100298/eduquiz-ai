import { Controller, Post, Body } from '@nestjs/common';
import { AnalysisService } from './analysis.service';
import { CreateAnalysisDto } from './dto/create-analysis.dto';
import { AnalysisResultDto } from './dto/analysis-result.dto';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';

@ApiTags('analysis')
@Controller('api')
export class AnalysisController {
  constructor(private readonly analysisService: AnalysisService) {}

  @Post('exam')
  @ApiOperation({ summary: 'Analyze exam results' })
  @ApiResponse({
    status: 201,
    description: 'The exam has been successfully analyzed',
    type: AnalysisResultDto,
  })
  async analyzeExam(
    @Body() createAnalysisDto: CreateAnalysisDto,
  ): Promise<AnalysisResultDto> {
    return this.analysisService.analyzeExam(createAnalysisDto);
  }
}
