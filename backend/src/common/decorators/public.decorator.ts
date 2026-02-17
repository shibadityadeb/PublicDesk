import { SetMetadata } from '@nestjs/common';

export const IS_PUBLIC_KEY = 'isPublic';
/**
 * Public decorator
 * Marks an endpoint as publicly accessible (bypasses authentication)
 * @example @Public()
 */
export const Public = () => SetMetadata(IS_PUBLIC_KEY, true);
