import type { SessionUser } from "@/lib/session";

type DemoCredential = SessionUser & {
  password: string;
};

export const demoCredentials: DemoCredential[] = [
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

export function getDemoUserByCredentials(email: string, password: string): SessionUser | null {
  const match = demoCredentials.find((user) => user.email === email && user.password === password);
  if (!match) return null;
  return { role: match.role, name: match.name, email: match.email };
}

export function getDemoUserByRole(role: SessionUser["role"]): SessionUser | null {
  const match = demoCredentials.find((user) => user.role === role);
  if (!match) return null;
  return { role: match.role, name: match.name, email: match.email };
}
