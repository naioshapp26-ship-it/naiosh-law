export type DemoUser = {
  role: "admin" | "client";
  name: string;
  email: string;
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
