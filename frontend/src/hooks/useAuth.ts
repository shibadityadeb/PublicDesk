import { useAuthStore } from "@/store/auth.store";
import { UserRole } from "@/types";

export function useAuth() {
  const { user, isAuthenticated, accessToken } = useAuthStore();

  const hasRole = (...roles: UserRole[]) =>
    !!user && roles.includes(user.role);

  return {
    user,
    isAuthenticated,
    accessToken,
    isCitizen: hasRole(UserRole.CITIZEN),
    isOfficer: hasRole(UserRole.OFFICER),
    isSupervisor: hasRole(UserRole.SUPERVISOR),
    isAdmin: hasRole(UserRole.ADMIN, UserRole.SUPER_ADMIN),
    isSuperAdmin: hasRole(UserRole.SUPER_ADMIN),
    isStaff: hasRole(
      UserRole.OFFICER,
      UserRole.SUPERVISOR,
      UserRole.ADMIN,
      UserRole.SUPER_ADMIN,
    ),
    hasRole,
  };
}
