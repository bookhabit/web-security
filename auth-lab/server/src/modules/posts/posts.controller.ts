import { Body, Controller, Get, Post, Req } from '@nestjs/common';
import type { Request } from 'express';
import { PostsService } from './posts.service';
import { CreatePostDto } from './dto/create-post.dto';

@Controller('api/posts')
export class PostsController {
  constructor(private readonly postsService: PostsService) {}

  @Get()
  findAll() {
    return this.postsService.findAll();
  }

  @Post()
  create(@Body() dto: CreatePostDto, @Req() req: Request) {
    // authorId는 요청자 세션/JWT에서 추출 (각 버전 가드에서 주입)
    const authorId = (req as any).user?.sub ?? (req as any).session?.userId;
    return this.postsService.create(dto, authorId);
  }
}
