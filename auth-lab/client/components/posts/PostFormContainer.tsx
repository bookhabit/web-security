'use client';

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useState } from 'react';
import { createPostSchema, CreatePostInput } from '@/schemas/post.schema';
import { useCreatePostMutation } from '@/hooks/mutations/useCreatePostMutation';
import { PostFormView } from './view/PostFormView';

export function PostFormContainer() {
  const [serverError, setServerError] = useState<string | null>(null);

  const { register, handleSubmit, setValue, reset, formState: { errors } } =
    useForm<CreatePostInput>({
      resolver: zodResolver(createPostSchema),
    });

  const { mutate, isPending } = useCreatePostMutation();

  const onSubmit = (data: CreatePostInput) => {
    setServerError(null);
    mutate(data, {
      onSuccess: () => reset(),
      onError: (err: unknown) => {
        const axiosErr = err as { response?: { data?: { message?: string } } };
        setServerError(axiosErr?.response?.data?.message ?? '게시글 등록에 실패했습니다.');
      },
    });
  };

  const handlePreset = (title: string, content: string) => {
    setValue('title', title);
    setValue('content', content);
  };

  return (
    <PostFormView
      register={register}
      handleSubmit={handleSubmit(onSubmit)}
      errors={errors}
      isPending={isPending}
      serverError={serverError}
      onPreset={handlePreset}
    />
  );
}
