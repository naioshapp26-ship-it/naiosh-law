export type DemoUser = {
  role: "admin" | "client";
  name: string;
  email: string;
};

export type SessionUser = DemoUser;

export const demoAccounts: DemoUser[] = [
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

export const sessionCookieName = "naiosh-law-session";
export const sessionStorageKey = "naiosh-law-session-user";
