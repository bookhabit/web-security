import { Body, Controller, Get, Post, Req, UnauthorizedException } from '@nestjs/common';
import type { Request } from 'express';
import { JwtService } from '@nestjs/jwt';
import { PostsService } from './posts.service';
import { CreatePostDto } from './dto/create-post.dto';

@Controller('api/posts')
export class PostsController {
  constructor(
    private readonly postsService: PostsService,
    private readonly jwtService: JwtService,
  ) {}

  @Get()
  findAll() {
    return this.postsService.findAll();
  }

  @Post()
  create(@Body() dto: CreatePostDto, @Req() req: Request) {
    const authorId = this.resolveAuthorId(req);
    if (!authorId) throw new UnauthorizedException('로그인이 필요합니다.');
    return this.postsService.create(dto, authorId);
  }

  private resolveAuthorId(req: Request): string | null {
    // V1 / V4: Authorization Bearer 헤더
    const auth = req.headers['authorization'];
    if (auth?.startsWith('Bearer ')) {
      try {
        const token = auth.split(' ')[1];
        const p = this.jwtService.verify<{ sub: string }>(token, {
          secret: process.env.JWT_ACCESS_SECRET,
        });
        return p.sub;
      } catch { /* fall through */ }
    }
    // V3: at 쿠키
    const cookieToken = req.cookies?.['at'];
    if (cookieToken) {
      try {
        const p = this.jwtService.verify<{ sub: string }>(cookieToken, {
          secret: process.env.JWT_ACCESS_SECRET,
        });
        return p.sub;
      } catch { /* fall through */ }
    }
    // V2: 세션
    return (req as any).session?.userId ?? null;
  }
}
