export type DemoUser = {
  role: "admin" | "client";
  name: string;
  email: string;
  password: string;
};

export type UserRole =
  | "admin"
  | "lawyer"
  | "consultant"
  | "judge"
  | "client"
  | "industrial_agent"
  | "employee";

export const demoAccounts: DemoUser[] = [
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

export type SessionUser = {
  role: UserRole;
  name: string;
  email: string;
};

export const sessionStorageKey = "naiosh-law-session-user";
