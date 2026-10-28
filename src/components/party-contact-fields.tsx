"use client";

import { COUNTRY_DIAL_CODES, COUNTRY_NAMES, citiesForCountry } from "@/lib/person-contact";
import type { PartyFields } from "@/lib/party-fields";

type Props = {
  value: PartyFields;
  onChange: (next: PartyFields) => void;
};

const dialOptions = COUNTRY_DIAL_CODES.map((c) => `${c.dialCode} (${c.country})`);

export function PartyContactFields({ value, onChange }: Props) {
  const set = <K extends keyof PartyFields>(key: K, v: PartyFields[K]) => {
    const next = { ...value, [key]: v };
    if (key === "firstPartyCountry" && !value.firstPartyDialCode) {
      const dial = COUNTRY_DIAL_CODES.find((c) => c.country === v)?.dialCode ?? "+20";
      next.firstPartyDialCode = `${dial} (${v})`;
    }
    if (key === "secondPartyCountry" && !value.secondPartyDialCode) {
      const dial = COUNTRY_DIAL_CODES.find((c) => c.country === v)?.dialCode ?? "+20";
      next.secondPartyDialCode = `${dial} (${v})`;
    }
    onChange(next);
  };

  return (
    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.85rem" }} className="party-grid">
      <PartyBlock
        title="طرف أول"
        name={value.firstParty}
        dial={value.firstPartyDialCode}
        phone={value.firstPartyPhone}
        country={value.firstPartyCountry}
        city={value.firstPartyCity}
        secDial={value.firstPartyPhoneSecondaryDialCode}
        secPhone={value.firstPartyPhoneSecondary}
        cityListId="first-party-cities"
        onName={(v) => set("firstParty", v)}
        onDial={(v) => set("firstPartyDialCode", v)}
        onPhone={(v) => set("firstPartyPhone", v)}
        onCountry={(v) => set("firstPartyCountry", v)}
        onCity={(v) => set("firstPartyCity", v)}
        onSecDial={(v) => set("firstPartyPhoneSecondaryDialCode", v)}
        onSecPhone={(v) => set("firstPartyPhoneSecondary", v)}
      />
      <PartyBlock
        title="طرف ثاني"
        name={value.secondParty}
        dial={value.secondPartyDialCode}
        phone={value.secondPartyPhone}
        country={value.secondPartyCountry}
        city={value.secondPartyCity}
        secDial={value.secondPartyPhoneSecondaryDialCode}
        secPhone={value.secondPartyPhoneSecondary}
        cityListId="second-party-cities"
        onName={(v) => set("secondParty", v)}
        onDial={(v) => set("secondPartyDialCode", v)}
        onPhone={(v) => set("secondPartyPhone", v)}
        onCountry={(v) => set("secondPartyCountry", v)}
        onCity={(v) => set("secondPartyCity", v)}
        onSecDial={(v) => set("secondPartyPhoneSecondaryDialCode", v)}
        onSecPhone={(v) => set("secondPartyPhoneSecondary", v)}
      />
      <style>{`@media (max-width: 600px) { .party-grid { grid-template-columns: 1fr !important; } .party-block { grid-column: 1 / -1 !important; } }`}</style>
    </div>
  );
}

function PartyBlock({
  title,
  name,
  dial,
  phone,
  country,
  city,
  secDial,
  secPhone,
  cityListId,
  onName,
  onDial,
  onPhone,
  onCountry,
  onCity,
  onSecDial,
  onSecPhone,
}: {
  title: string;
  name: string;
  dial: string;
  phone: string;
  country: string;
  city: string;
  secDial: string;
  secPhone: string;
  cityListId: string;
  onName: (v: string) => void;
  onDial: (v: string) => void;
  onPhone: (v: string) => void;
  onCountry: (v: string) => void;
  onCity: (v: string) => void;
  onSecDial: (v: string) => void;
  onSecPhone: (v: string) => void;
}) {
  return (
    <div
      className="party-block"
      style={{
        gridColumn: "1 / -1",
        display: "grid",
        gridTemplateColumns: "1fr 1fr",
        gap: "0.85rem",
        padding: "0.85rem",
        background: "#f8f9fb",
        borderRadius: 12,
      }}
    >
      <p style={{ gridColumn: "1 / -1", fontWeight: 800, color: "#101D32", margin: 0 }}>{title}</p>
      <div>
        <label className="input-label">
          الاسم <span style={{ color: "#101D32" }}>*</span>
        </label>
        <input className="input-field" required value={name} onChange={(e) => onName(e.target.value)} placeholder={`اسم ${title}`} />
      </div>
      <div>
        <label className="input-label">
          مفتاح الدولة <span style={{ color: "#101D32" }}>*</span>
        </label>
        <select className="input-field" required value={dial} onChange={(e) => onDial(e.target.value)}>
          <option value="">اختر...</option>
          {dialOptions.map((o) => (
            <option key={o} value={o}>
              {o}
            </option>
          ))}
        </select>
      </div>
      <div>
        <label className="input-label">
          رقم الجوال <span style={{ color: "#101D32" }}>*</span>
        </label>
        <input
          className="input-field"
          type="tel"
          required
          value={phone}
          onChange={(e) => onPhone(e.target.value)}
          placeholder="5XXXXXXXX"
        />
      </div>
      <div>
        <label className="input-label">
          الدولة <span style={{ color: "#101D32" }}>*</span>
        </label>
        <select className="input-field" required value={country} onChange={(e) => onCountry(e.target.value)}>
          <option value="">اختر...</option>
          {COUNTRY_NAMES.map((c) => (
            <option key={c} value={c}>
              {c}
            </option>
          ))}
        </select>
      </div>
      <div>
        <label className="input-label">
          المدينة <span style={{ color: "#101D32" }}>*</span>
        </label>
        <input
          className="input-field"
          list={cityListId}
          required
          value={city}
          onChange={(e) => onCity(e.target.value)}
          placeholder="المدينة (يُسمح بإدخال غير مدرج)"
        />
        <datalist id={cityListId}>
          {citiesForCountry(country).map((c) => (
            <option key={c} value={c} />
          ))}
        </datalist>
      </div>
      <div>
        <label className="input-label">مفتاح الجوال الإضافي</label>
        <select className="input-field" value={secDial} onChange={(e) => onSecDial(e.target.value)}>
          <option value="">اختياري...</option>
          {dialOptions.map((o) => (
            <option key={o} value={o}>
              {o}
            </option>
          ))}
        </select>
      </div>
      <div>
        <label className="input-label">رقم جوال إضافي</label>
        <input
          className="input-field"
          type="tel"
          value={secPhone}
          onChange={(e) => onSecPhone(e.target.value)}
          placeholder="اختياري — 5XXXXXXXX"
        />
      </div>
    </div>
  );
}
