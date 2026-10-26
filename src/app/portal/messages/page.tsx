"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { PortalShell } from "@/components/portal/portal-shell";

export default function PortalMessagesPage() {
  const [demo, setDemo] = useState(false);

  useEffect(() => {
    fetch("/api/portal/profile", { credentials: "include" })
      .then((r) => r.json())
      .then((p) => setDemo(Boolean(p.profile?.isDemo)));
  }, []);

  return (
    <PortalShell title="الرسائل" demoBanner={demo}>
      <section className="portal-card">
        <h2>صندوق الرسائل مع المكتب / المحامي المصرح</h2>
        <div className="portal-empty">
          لا رسائل حالياً. للتواصل السريع يمكنك{" "}
          <Link href="/portal/requests">إنشاء طلب استشارة</Link> وسيظهر لدى الموظف المختص ضمن سير العمل.
        </div>
        <p style={{ color: "#526071", fontWeight: 600 }}>
          المراسلات معزولة بحسابك — لا تُعرض اتصالات عملاء آخرين.
        </p>
      </section>
    </PortalShell>
  );
}
