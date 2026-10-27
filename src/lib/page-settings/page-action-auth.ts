import type { UserRole } from "@/generated/prisma/client";
import { resolvePageSettings } from "@/lib/page-settings/server";
import { NextResponse } from "next/server";

export type PageAction = "create" | "edit" | "delete" | "export" | "view";

export {
  GENERIC_MODULE_KEYS,
  isGenericModuleKey,
  type GenericModuleKey,
} from "@/lib/page-settings/generic-modules";

const ACTION_TO_PERM: Record<PageAction, string> = {
  create: "canCreateRoles",
  edit: "canEditRoles",
  delete: "canDeleteRoles",
  export: "canExportRoles",
  view: "canViewRoles",
};

const ACTION_TO_FLAG: Record<PageAction, string> = {
  create: "allowCreate",
  edit: "allowEdit",
  delete: "allowDelete",
  export: "allowExport",
  view: "allowView",
};

/**
 * Server-side enforcement of page-settings permissions.
 * UI hiding alone is not enough — APIs must call this.
 */
export async function assertPageAction(opts: {
  pageKey: string;
  action: PageAction;
  role: UserRole;
  userId?: string | null;
}): Promise<{ ok: true } | { ok: false; response: NextResponse }> {
  const resolved = await resolvePageSettings({
    pageKey: opts.pageKey,
    role: opts.role,
    userId: opts.userId,
  });
  const values = resolved.values as {
    actions?: Record<string, boolean>;
    permissions?: Record<string, string[]>;
  };

  const flag = ACTION_TO_FLAG[opts.action];
  if (values.actions && values.actions[flag] === false) {
    return {
      ok: false,
      response: NextResponse.json(
        { error: `الإجراء «${opts.action}» متوقف من إعدادات الصفحة` },
        { status: 403 }
      ),
    };
  }

  const permKey = ACTION_TO_PERM[opts.action];
  const roles = values.permissions?.[permKey];
  if (Array.isArray(roles) && roles.length > 0 && !roles.includes(opts.role)) {
    return {
      ok: false,
      response: NextResponse.json(
        { error: `صلاحية غير كافية للإجراء «${opts.action}» على هذه الصفحة` },
        { status: 403 }
      ),
    };
  }

  return { ok: true };
}
