import type { SessionUser } from "@/lib/auth-session";

export type { SessionUser };

export type DemoLoginProfile = SessionUser & {
  label: string;
};

export const demoLoginProfiles: DemoLoginProfile[] = [
  {
    role: "admin",
    label: "مدير النظام",
    name: "مدير النظام",
    email: "admin@naioshlaw.com",
  },
  {
    role: "client",
    label: "عميل تجريبي",
    name: "عميل تجريبي",
    email: "client@naioshlaw.com",
  },
];

export const sessionKey = "naiosh-law-session";
