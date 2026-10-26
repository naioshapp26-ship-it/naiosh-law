export type DemoUser = {
  role: "admin" | "client";
  name: string;
  email: string;
};

/** Public demo account labels only — passwords are never exposed to the browser. */
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

export const sessionKey = "naiosh-law-session";
