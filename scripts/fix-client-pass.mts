import bcrypt from "bcryptjs";
import { prisma } from "../src/lib/prisma";

const hash = await bcrypt.hash("Client@123", 10);
const u = await prisma.user.upsert({
  where: { email: "client@naioshlaw.com" },
  update: { password: hash, role: "client", name: "عميل تجريبي" },
  create: { email: "client@naioshlaw.com", password: hash, role: "client", name: "عميل تجريبي" },
});
console.log("ok", u.email, u.role);
await prisma.$disconnect();
