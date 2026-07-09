import type { SessionUser } from "@/lib/session-client";

export type DemoUser = SessionUser & {
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
    name: "عميل تجريبي",
    email: "client@naioshlaw.com",
    password: "Client@123",
  },
];

export function toSessionUser(user: DemoUser): SessionUser {
  return {
    role: user.role,
    name: user.name,
    email: user.email,
  };
}
