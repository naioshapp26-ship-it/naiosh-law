import "server-only";

import type { SessionRole, SessionUser } from "@/lib/auth-session";

type DemoUser = SessionUser & {
  password: string;
};

export const demoUsers: DemoUser[] = [
  {
    role: "admin",
    name: "مدير النظام",
    email: "admin@naioshlaw.com",
    password: "Admin@123",
  },
  {
    role: "client",
    name: "أحمد محمد الصاوي",
    email: "client@naioshlaw.com",
    password: "Client@123",
  },
];

export function findDemoUserByCredentials(email: string, password: string) {
  return demoUsers.find((user) => user.email === email && user.password === password);
}

export function findDemoUserByRole(role: SessionRole) {
  return demoUsers.find((user) => user.role === role);
}

export function toSessionUser(user: DemoUser): SessionUser {
  return {
    role: user.role,
    name: user.name,
    email: user.email,
  };
}
