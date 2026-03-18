import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Post } from '../../entities/post.entity';
import { CreatePostDto } from './dto/create-post.dto';

@Injectable()
export class PostsService {
  constructor(
    @InjectRepository(Post) private readonly postRepo: Repository<Post>,
  ) {}

  findAll() {
    return this.postRepo.find({
      select: {
        id: true,
        title: true,
        content: true, // ❌ 의도적 취약점: 필터 없이 raw content 반환
        authorId: true,
        createdAt: true,
      },
      order: { createdAt: 'DESC' },
    });
  }

  create(dto: CreatePostDto, authorId: string) {
    const post = this.postRepo.create({ ...dto, authorId });
    return this.postRepo.save(post);
  }
}
