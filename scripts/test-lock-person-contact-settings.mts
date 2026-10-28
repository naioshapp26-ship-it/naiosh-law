/**
 * Verify page-settings lock: phone/country/city stay in requiredFields,
 * cannot appear in hiddenOptionalFields, and defaults/registry agree.
 */
import { getPageDefinition } from "../src/lib/page-settings/registry.ts";
import {
  PERSON_CONTACT_LOCKED_SETTING_KEYS,
  withPersonContactLockedRequired,
} from "../src/lib/page-settings/defaults.ts";
import { validateAndNormalizeValues } from "../src/lib/page-settings/server.ts";

const LOCKED = [...PERSON_CONTACT_LOCKED_SETTING_KEYS];

function assert(cond: unknown, msg: string) {
  if (!cond) throw new Error(msg);
}

const pages = [
  "case-management",
  "clients-management",
  "court-sessions",
  "legal-accounting",
] as const;

for (const pageKey of pages) {
  const def = getPageDefinition(pageKey);
  assert(def, `${pageKey}: missing definition`);
  const fieldsTab = def!.tabs.find((t) => t.id === "fields");
  assert(fieldsTab, `${pageKey}: missing fields tab`);
  const reqField = fieldsTab!.fields.find((f) => f.path === "fields.requiredFields");
  const hideField = fieldsTab!.fields.find(
    (f) => f.path === "fields.hiddenOptionalFields"
  );
  assert(reqField, `${pageKey}: missing requiredFields`);
  assert(hideField, `${pageKey}: missing hiddenOptionalFields`);

  const available = new Set((reqField!.options ?? []).map((o) => o.value));
  for (const k of LOCKED) {
    assert(available.has(k), `${pageKey}: ${k} must be in required field options`);
    assert(
      (reqField!.lockedValues ?? []).includes(k),
      `${pageKey}: ${k} must be in lockedValues`
    );
    assert(
      (reqField!.defaultValue as string[]).includes(k),
      `${pageKey}: ${k} must be default-required`
    );
    assert(
      !(hideField!.options ?? []).some((o) => o.value === k),
      `${pageKey}: ${k} must NOT appear in hideable options`
    );
  }

  // Simulate hostile save: try to un-require + hide contact fields
  const hostile = validateAndNormalizeValues(pageKey, {
    fields: {
      requiredFields: ["caseNo", "status"].filter((k) => available.has(k)),
      hiddenOptionalFields: [...LOCKED, "court"].filter(
        (k) => available.has(k) || k === "court"
      ),
    },
  });
  assert(hostile.ok, `${pageKey}: normalize failed: ${!hostile.ok ? hostile.error : ""}`);
  if (hostile.ok) {
    const fields = hostile.values.fields as {
      requiredFields: string[];
      hiddenOptionalFields: string[];
    };
    for (const k of LOCKED) {
      assert(
        fields.requiredFields.includes(k),
        `${pageKey}: after hostile save, ${k} missing from required`
      );
      assert(
        !fields.hiddenOptionalFields.includes(k),
        `${pageKey}: after hostile save, ${k} still hideable`
      );
    }
  }
}

// Helper unit check
{
  const r = withPersonContactLockedRequired({
    fieldOptions: [
      { value: "name", label: "الاسم" },
      { value: "phone", label: "جوال" },
      { value: "country", label: "دولة" },
      { value: "city", label: "مدينة" },
    ],
    defaultRequired: ["name"],
    lockedRequired: ["name"],
  });
  assert(r.lockedRequired.includes("phone"), "helper locks phone");
  assert(r.lockedRequired.includes("country"), "helper locks country");
  assert(r.lockedRequired.includes("city"), "helper locks city");
  assert(r.defaultRequired.includes("phone"), "helper defaults phone");
}

console.log(
  JSON.stringify(
    {
      ok: true,
      lockedKeys: LOCKED,
      pagesChecked: pages,
    },
    null,
    2
  )
);
