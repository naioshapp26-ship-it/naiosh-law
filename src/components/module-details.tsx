import type { LegalModule } from "@/data/modules";

type Props = {
  item: LegalModule;
  role: "admin" | "client";
};

function ListBlock({ title, values }: { title: string; values: string[] }) {
  return (
    <section className="glass-card p-5">
      <h3 className="text-base font-black text-[#111]">{title}</h3>
      <ul className="mt-3 space-y-2 text-sm text-[#444]">
        {values.map((value) => (
          <li key={value} className="rounded-lg bg-[#fafafa] px-3 py-2">
            {value}
          </li>
        ))}
      </ul>
    </section>
  );
}

export function ModuleDetails({ item, role }: Props) {
  return (
    <div className="space-y-4">
      <section className="glass-card p-6">
        <h2 className="text-2xl font-black text-[#1a1a1a]">{item.title}</h2>
        <p className="mt-2 text-sm text-[#666]">{item.subtitle}</p>
      </section>
      <div className="grid gap-4 md:grid-cols-2">
        <ListBlock title="الشاشات" values={item.screens} />
        <ListBlock title="الوظائف" values={item.functions} />
        <ListBlock title="سير العمل" values={item.workflow} />
        <ListBlock title="العلاقات" values={item.relations} />
        <ListBlock title="قاعدة البيانات" values={item.dbTables} />
        <ListBlock title={`الصلاحيات (${role})`} values={item.permissions[role]} />
      </div>
    </div>
  );
}
