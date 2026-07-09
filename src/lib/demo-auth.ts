import type { SessionRole, SessionUser } from "@/lib/session-shared";

type DemoAccount = SessionUser & {
  password: string;
};

const demoAccounts: DemoAccount[] = [
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

function toSessionUser(account: DemoAccount): SessionUser {
  return {
    role: account.role,
    name: account.name,
    email: account.email,
  };
}

export function authenticateDemoUser(email: string, password: string): SessionUser | null {
  const normalizedEmail = email.trim().toLowerCase();
  const account = demoAccounts.find(
    (item) => item.email.toLowerCase() === normalizedEmail && item.password === password
  );

  return account ? toSessionUser(account) : null;
}

export function getDemoUserByRole(role: SessionRole): SessionUser | null {
  const account = demoAccounts.find((item) => item.role === role);
  return account ? toSessionUser(account) : null;
}
