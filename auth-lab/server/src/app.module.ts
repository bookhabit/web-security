import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { User } from './entities/user.entity';
import { Post } from './entities/post.entity';
import { SeedService } from './seed/seed.service';
import { PostsModule } from './modules/posts/posts.module';
import { PointsModule } from './modules/points/points.module';
import { UsersModule } from './modules/users/users.module';

@Module({
  imports: [
    // ── 환경변수 ────────────────────────────────────────────────
    ConfigModule.forRoot({ isGlobal: true }),

    // ── TypeORM ─────────────────────────────────────────────────
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        type: 'postgres',
        host: config.get('DB_HOST', 'localhost'),
        port: config.get<number>('DB_PORT', 5432),
        username: config.get('DB_USER', 'authlab'),
        password: config.get('DB_PASS', 'authlab1234'),
        database: config.get('DB_NAME', 'authlab'),
        entities: [User, Post],
        synchronize: true, // 개발 환경 전용
        logging: false,
      }),
    }),

    // Seed용 Repository 등록
    TypeOrmModule.forFeature([User, Post]),

    // ── 기능 모듈 ────────────────────────────────────────────────
    PostsModule,
    PointsModule,
    UsersModule,
  ],
  providers: [SeedService],
})
export class AppModule {}
