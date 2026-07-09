import type { SessionRole } from "@/lib/session-shared";
import { sessionStorageKey } from "@/lib/session-shared";

export type DemoUser = {
  role: SessionRole;
  name: string;
  email: string;
};

export const demoUsers: DemoUser[] = [
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

export const sessionKey = sessionStorageKey;
