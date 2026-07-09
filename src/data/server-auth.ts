import "server-only";

import type { SessionUser } from "@/data/auth";

type DemoCredential = SessionUser & {
  password: string;
};

const demoCredentials: DemoCredential[] = [
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

export function findDemoCredential(email: string, password: string) {
  const normalizedEmail = email.trim().toLowerCase();
  return demoCredentials.find(
    (user) => user.email.toLowerCase() === normalizedEmail && user.password === password
  );
}

export function findDemoCredentialByRole(role: SessionUser["role"]) {
  return demoCredentials.find((user) => user.role === role);
}
