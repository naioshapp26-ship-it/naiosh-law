import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/api-helpers";

export async function POST(request: Request) {
  const { error } = await requireAuth();
  if (error) return error;

  const body = await request.json();
  const { caseType, specializationId, stage, hours, baseAmount } = body;

  const rules = await prisma.feeRule.findMany({
    where: {
      active: true,
      ...(caseType ? { OR: [{ caseType: String(caseType) }, { caseType: null }] } : {}),
      ...(specializationId ? { OR: [{ specializationId: String(specializationId) }, { specializationId: null }] } : {}),
      ...(stage ? { OR: [{ stage: String(stage) }, { stage: null }] } : {}),
    },
    orderBy: { createdAt: "desc" },
  });

  const rule = rules[0];
  if (!rule) {
    return NextResponse.json({ error: "لا توجد قاعدة أتعاب مطابقة" }, { status: 404 });
  }

  let amount = 0;
  let method = "";

  if (rule.hourlyRate && hours) {
    amount = rule.hourlyRate * Number(hours);
    method = `ساعات (${hours}) × ${rule.hourlyRate}`;
  } else if (rule.fixedAmount) {
    amount = rule.fixedAmount;
    method = `مبلغ ثابت: ${rule.fixedAmount}`;
  } else if (rule.percentRate && baseAmount) {
    amount = (Number(baseAmount) * rule.percentRate) / 100;
    method = `نسبة ${rule.percentRate}% من ${baseAmount}`;
  }

  if (rule.minAmount && amount < rule.minAmount) amount = rule.minAmount;
  if (rule.maxAmount && amount > rule.maxAmount) amount = rule.maxAmount;

  return NextResponse.json({
    ruleName: rule.name,
    calculatedAmount: Math.round(amount),
    method,
    currency: "EGP",
    displayForClient: `الأتعاب المقدرة: ${Math.round(amount).toLocaleString("ar-EG")} ج.م`,
  });
}
