"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  Users, Search, ChevronLeft, ChevronRight,
  UserCheck, UserX, Shield, Mail, Phone, Calendar,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { usersApi } from "@/lib/api";
import { User, UserRole, UserStatus } from "@/types";
import { getStatusColor, formatDate } from "@/lib/utils";
import toast from "react-hot-toast";

const ROLE_OPTIONS = ["", ...Object.values(UserRole)];
const STATUS_OPTIONS = ["", ...Object.values(UserStatus)];

const ROLE_COLORS: Record<UserRole, string> = {
  [UserRole.SUPER_ADMIN]: "bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400",
  [UserRole.ADMIN]: "bg-orange-100 text-orange-800 dark:bg-orange-900/20 dark:text-orange-400",
  [UserRole.SUPERVISOR]: "bg-purple-100 text-purple-800 dark:bg-purple-900/20 dark:text-purple-400",
  [UserRole.OFFICER]: "bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-400",
  [UserRole.CITIZEN]: "bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300",
};

export default function UsersPage() {
  const queryClient = useQueryClient();
  const [search, setSearch] = useState("");
  const [filterRole, setFilterRole] = useState("");
  const [filterStatus, setFilterStatus] = useState("");
  const [page, setPage] = useState(1);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const LIMIT = 20;

  const { data, isLoading } = useQuery({
    queryKey: ["users", page, filterRole, filterStatus, search],
    queryFn: () =>
      usersApi.getAll({
        page,
        limit: LIMIT,
        role: filterRole || undefined,
        status: filterStatus || undefined,
        search: search || undefined,
      }),
  });

  const updateStatusMutation = useMutation({
    mutationFn: ({ id, status }: { id: string; status: UserStatus }) =>
      usersApi.updateStatus(id, status),
    onSuccess: (_, vars) => {
      toast.success(`User ${vars.status === UserStatus.ACTIVE ? "activated" : "suspended"}`);
      queryClient.invalidateQueries({ queryKey: ["users"] });
    },
    onError: (e: any) => toast.error(e.response?.data?.message || "Failed to update status"),
  });

  const updateRoleMutation = useMutation({
    mutationFn: ({ id, role }: { id: string; role: UserRole }) =>
      usersApi.updateRole(id, role),
    onSuccess: () => {
      toast.success("Role updated");
      queryClient.invalidateQueries({ queryKey: ["users"] });
      setSelectedUser(null);
    },
    onError: (e: any) => toast.error(e.response?.data?.message || "Failed to update role"),
  });

  const users: User[] = data?.data?.data?.data || [];
  const meta = data?.data?.data?.meta;
  const totalPages = meta?.totalPages ?? 1;

  const initials = (u: User) =>
    `${u.firstName[0] ?? ""}${u.lastName[0] ?? ""}`.toUpperCase();

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold">User Management</h1>
          <p className="text-muted-foreground text-sm">
            {meta?.total ?? 0} users registered
          </p>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3 mb-6">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search by name or email..."
            className="pl-9"
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1); }}
          />
        </div>
        <select
          className="border border-input rounded-lg px-3 py-2 bg-background text-sm focus:outline-none focus:ring-2 focus:ring-ring"
          value={filterRole}
          onChange={(e) => { setFilterRole(e.target.value); setPage(1); }}
        >
          <option value="">All Roles</option>
          {Object.values(UserRole).map((r) => (
            <option key={r} value={r}>{r}</option>
          ))}
        </select>
        <select
          className="border border-input rounded-lg px-3 py-2 bg-background text-sm focus:outline-none focus:ring-2 focus:ring-ring"
          value={filterStatus}
          onChange={(e) => { setFilterStatus(e.target.value); setPage(1); }}
        >
          <option value="">All Statuses</option>
          {Object.values(UserStatus).map((s) => (
            <option key={s} value={s}>{s}</option>
          ))}
        </select>
      </div>

      <Card>
        <CardContent className="p-0">
          {isLoading ? (
            <div className="p-4 space-y-3">
              {[1, 2, 3, 4, 5].map((i) => <Skeleton key={i} className="h-16" />)}
            </div>
          ) : users.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-muted-foreground">
              <Users className="h-16 w-16 opacity-30 mb-4" />
              <p className="text-sm">No users found</p>
            </div>
          ) : (
            <div className="divide-y divide-border">
              {users.map((user, i) => (
                <motion.div
                  key={user.id}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: i * 0.03 }}
                  className="flex items-center gap-4 p-4 hover:bg-muted/30 transition-colors"
                >
                  <Avatar className="h-10 w-10 flex-shrink-0">
                    <AvatarFallback className="text-sm font-semibold bg-primary/10 text-primary">
                      {initials(user)}
                    </AvatarFallback>
                  </Avatar>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <p className="text-sm font-semibold truncate">
                        {user.firstName} {user.lastName}
                      </p>
                      <Badge className={ROLE_COLORS[user.role]}>{user.role}</Badge>
                    </div>
                    <div className="flex items-center gap-4 mt-0.5">
                      <span className="text-xs text-muted-foreground flex items-center gap-1 truncate">
                        <Mail className="h-3 w-3 flex-shrink-0" />
                        {user.email}
                      </span>
                      {user.phone && (
                        <span className="text-xs text-muted-foreground hidden md:flex items-center gap-1">
                          <Phone className="h-3 w-3" />
                          {user.phone}
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="hidden md:flex items-center gap-1 text-xs text-muted-foreground">
                    <Calendar className="h-3 w-3" />
                    {formatDate(user.createdAt)}
                  </div>

                  <Badge className={getStatusColor(user.status)}>{user.status}</Badge>

                  <div className="flex items-center gap-1">
                    {user.status === UserStatus.ACTIVE ? (
                      <Button
                        size="sm"
                        variant="ghost"
                        className="text-destructive hover:text-destructive h-8 w-8 p-0"
                        title="Suspend user"
                        onClick={() =>
                          updateStatusMutation.mutate({ id: user.id, status: UserStatus.SUSPENDED })
                        }
                      >
                        <UserX className="h-4 w-4" />
                      </Button>
                    ) : (
                      <Button
                        size="sm"
                        variant="ghost"
                        className="text-green-600 hover:text-green-600 h-8 w-8 p-0"
                        title="Activate user"
                        onClick={() =>
                          updateStatusMutation.mutate({ id: user.id, status: UserStatus.ACTIVE })
                        }
                      >
                        <UserCheck className="h-4 w-4" />
                      </Button>
                    )}
                    <Button
                      size="sm"
                      variant="ghost"
                      className="h-8 w-8 p-0"
                      title="Change role"
                      onClick={() => setSelectedUser(user)}
                    >
                      <Shield className="h-4 w-4" />
                    </Button>
                  </div>
                </motion.div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between mt-4">
          <p className="text-sm text-muted-foreground">
            Page {page} of {totalPages} · {meta?.total} total
          </p>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              disabled={page === 1}
              onClick={() => setPage((p) => p - 1)}
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <Button
              variant="outline"
              size="sm"
              disabled={page === totalPages}
              onClick={() => setPage((p) => p + 1)}
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      )}

      {/* Change Role Modal */}
      {selectedUser && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <Card className="w-full max-w-sm">
            <CardHeader>
              <CardTitle className="text-base">Change Role</CardTitle>
              <p className="text-sm text-muted-foreground">
                {selectedUser.firstName} {selectedUser.lastName}
              </p>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="grid grid-cols-1 gap-2">
                {Object.values(UserRole).map((role) => (
                  <button
                    key={role}
                    onClick={() =>
                      updateRoleMutation.mutate({ id: selectedUser.id, role })
                    }
                    className={`w-full text-left px-4 py-3 rounded-lg border-2 text-sm font-medium transition-all hover:border-primary
                      ${selectedUser.role === role ? "border-primary bg-primary/5" : "border-border"}`}
                  >
                    <span className={`inline-block px-2 py-0.5 rounded text-xs mr-2 ${ROLE_COLORS[role]}`}>
                      {role}
                    </span>
                    {selectedUser.role === role && (
                      <span className="text-xs text-muted-foreground">(current)</span>
                    )}
                  </button>
                ))}
              </div>
              <Button
                variant="outline"
                className="w-full"
                onClick={() => setSelectedUser(null)}
              >
                Cancel
              </Button>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
