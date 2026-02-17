import { SetMetadata } from '@nestjs/common';
import { UserRole } from '../enums';

export const ROLES_KEY = 'roles';
/**
 * Roles decorator
 * Used to specify which roles can access a resource
 * @example @Roles(UserRole.ADMIN, UserRole.SUPERVISOR)
 */
export const Roles = (...roles: UserRole[]) => SetMetadata(ROLES_KEY, roles);
