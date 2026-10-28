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
      <div>
        <label className="input-label">
          طرف أول <span style={{ color: "#101D32" }}>*</span>
        </label>
        <input
          className="input-field"
          required
          value={value.firstParty}
          onChange={(e) => set("firstParty", e.target.value)}
          placeholder="اسم الطرف الأول"
        />
      </div>
      <div>
        <label className="input-label">
          مفتاح جوال الطرف الأول <span style={{ color: "#101D32" }}>*</span>
        </label>
        <select
          className="input-field"
          required
          value={value.firstPartyDialCode}
          onChange={(e) => set("firstPartyDialCode", e.target.value)}
        >
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
          رقم جوال الطرف الأول <span style={{ color: "#101D32" }}>*</span>
        </label>
        <input
          className="input-field"
          type="tel"
          required
          value={value.firstPartyPhone}
          onChange={(e) => set("firstPartyPhone", e.target.value)}
          placeholder="5XXXXXXXX"
        />
      </div>
      <div>
        <label className="input-label">
          دولة الطرف الأول <span style={{ color: "#101D32" }}>*</span>
        </label>
        <select
          className="input-field"
          required
          value={value.firstPartyCountry}
          onChange={(e) => set("firstPartyCountry", e.target.value)}
        >
          <option value="">اختر...</option>
          {COUNTRY_NAMES.map((c) => (
            <option key={c} value={c}>
              {c}
            </option>
          ))}
        </select>
      </div>
      <div style={{ gridColumn: "1 / -1" }}>
        <label className="input-label">
          مدينة الطرف الأول <span style={{ color: "#101D32" }}>*</span>
        </label>
        <input
          className="input-field"
          list="first-party-cities"
          required
          value={value.firstPartyCity}
          onChange={(e) => set("firstPartyCity", e.target.value)}
          placeholder="المدينة (يُسمح بإدخال غير مدرج)"
        />
        <datalist id="first-party-cities">
          {citiesForCountry(value.firstPartyCountry).map((c) => (
            <option key={c} value={c} />
          ))}
        </datalist>
      </div>

      <div>
        <label className="input-label">
          طرف ثاني <span style={{ color: "#101D32" }}>*</span>
        </label>
        <input
          className="input-field"
          required
          value={value.secondParty}
          onChange={(e) => set("secondParty", e.target.value)}
          placeholder="اسم الطرف الثاني"
        />
      </div>
      <div>
        <label className="input-label">
          مفتاح جوال الطرف الثاني <span style={{ color: "#101D32" }}>*</span>
        </label>
        <select
          className="input-field"
          required
          value={value.secondPartyDialCode}
          onChange={(e) => set("secondPartyDialCode", e.target.value)}
        >
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
          رقم جوال الطرف الثاني <span style={{ color: "#101D32" }}>*</span>
        </label>
        <input
          className="input-field"
          type="tel"
          required
          value={value.secondPartyPhone}
          onChange={(e) => set("secondPartyPhone", e.target.value)}
          placeholder="5XXXXXXXX"
        />
      </div>
      <div>
        <label className="input-label">
          دولة الطرف الثاني <span style={{ color: "#101D32" }}>*</span>
        </label>
        <select
          className="input-field"
          required
          value={value.secondPartyCountry}
          onChange={(e) => set("secondPartyCountry", e.target.value)}
        >
          <option value="">اختر...</option>
          {COUNTRY_NAMES.map((c) => (
            <option key={c} value={c}>
              {c}
            </option>
          ))}
        </select>
      </div>
      <div style={{ gridColumn: "1 / -1" }}>
        <label className="input-label">
          مدينة الطرف الثاني <span style={{ color: "#101D32" }}>*</span>
        </label>
        <input
          className="input-field"
          list="second-party-cities"
          required
          value={value.secondPartyCity}
          onChange={(e) => set("secondPartyCity", e.target.value)}
          placeholder="المدينة (يُسمح بإدخال غير مدرج)"
        />
        <datalist id="second-party-cities">
          {citiesForCountry(value.secondPartyCountry).map((c) => (
            <option key={c} value={c} />
          ))}
        </datalist>
      </div>
      <style>{`@media (max-width: 600px) { .party-grid { grid-template-columns: 1fr !important; } }`}</style>
    </div>
  );
}
