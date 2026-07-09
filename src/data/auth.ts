import type { Role } from "@/lib/session-client";

export type DemoAccount = {
  role: Role;
  name: string;
  email: string;
};

export const demoAccounts: DemoAccount[] = [
  {
    role: "admin",
    name: "مدير النظام",
    email: "admin@naioshlaw.com",
  },
  {
    role: "client",
    name: "عميل تجريبي",
    email: "client@naioshlaw.com",
  },
];

