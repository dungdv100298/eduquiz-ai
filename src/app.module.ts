import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigModule } from '@nestjs/config';
// import { UsersModule } from './users/users.module';
// import { User } from './entities/user.entity';
import { AnalysisModule } from './analysis/analysis.module';
import { ExamAnalysis } from './entities/exam-analysis.entity';

@Module({
  imports: [
    ConfigModule.forRoot(),
    TypeOrmModule.forRoot({
      type: 'mysql',
      host: process.env.DATABASE_HOST || 'localhost',
      port: parseInt(process.env.DATABASE_PORT || '3306'),
      username: process.env.DATABASE_USERNAME || 'eduquiz',
      password: process.env.DATABASE_PASSWORD || 'eduquiz123',
      database: process.env.DATABASE_NAME || 'eduquiz',
      entities: [ExamAnalysis],
      synchronize: true, // Set to false in production
    }),
    // UsersModule,
    AnalysisModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
