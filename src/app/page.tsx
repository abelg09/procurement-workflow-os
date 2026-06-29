"use client";

import Image from "next/image";
import {
  Activity,
  AlertCircle,
  ArrowRightLeft,
  Bell,
  Bot,
  Check,
  CheckCircle2,
  CircleDollarSign,
  ClipboardList,
  Clock,
  Download,
  ExternalLink,
  FileSpreadsheet,
  FileText,
  Filter,
  History,
  LayoutDashboard,
  LogOut,
  PackageCheck,
  Plus,
  RefreshCcw,
  Search,
  Send,
  Shield,
  ShoppingCart,
  SlidersHorizontal,
  Truck,
  Upload,
  UserCog,
  XCircle,
} from "lucide-react";
import { FormEvent, MouseEventHandler, ReactNode, useEffect, useId, useMemo, useRef, useState } from "react";
import type { User as SupabaseAuthUser } from "@supabase/supabase-js";
import {
  AuditLog,
  AttachmentReference,
  CURRENCIES,
  DELIVERY_STATUSES,
  DEPARTMENTS,
  DEFAULT_PROJECT_OPTIONS,
  FINANCE_APPROVAL_EMAIL,
  InvoiceDetails,
  LogisticsDetails,
  NotificationRecord,
  OVERDUE_REQUEST_HOURS,
  PAYMENT_TERMS,
  PROCURE_APPROVAL_EMAIL,
  PRIORITIES,
  ProcurementLineItem,
  ProcurementRequest,
  ProcurementRequestDraft,
  ProcurementState,
  RequestStatus,
  ROLES,
  Role,
  STATUSES,
  UserProfile,
  WORKFLOW_STAGES,
  applyLaunchCleanup,
  answerProcurementQuestion,
  createDailyReminderNotifications,
  getAssigneeName,
  getDepartmentReviewRole,
  getMetrics,
  getPendingAction,
  getPersonalRequests,
  getRoleDisplayName,
  getRequestItemCount,
  getRequestLineItems,
  getRequestTotalAed,
  getStageIndex,
  getStuckRequests,
  getUserBlockedTasks,
  getUserById,
  getVisibleRequests,
  initialState,
  isApprovalStatus,
  isClosed,
  isDeclined,
  isRequestOverdue,
  isUserBlockedTask,
  makeId,
  markNotificationRead,
  nowIso,
  nextRequestId,
  parseState,
  roundMoney,
  serializeState,
  submitProcurementRequest,
  transitionRequest,
} from "@/lib/procurement";
import { getSupabaseBrowserClient } from "@/lib/supabase";

const STORAGE_KEY = "procurement-workflow-state-v1";
const FX_CACHE_KEY = "procurement-fx-rates-v1";
const FX_RATE_SOURCE = "Frankfurter v2";
const FX_RATE_ENDPOINT = "https://api.frankfurter.dev/v2/rates";
const BULK_TEMPLATE_HEADERS = [
  "item_name",
  "item_description",
  "product_link",
  "quantity",
  "unit_price",
  "currency",
  "vendor_name",
];
const BULK_SUPPORTED_CURRENCIES = CURRENCIES.filter((currency) => currency !== "Other");
const hasGithubPagesCustomDomain = Boolean(process.env.NEXT_PUBLIC_GITHUB_PAGES_CUSTOM_DOMAIN);
const configuredPublicBasePath =
  process.env.NEXT_PUBLIC_GITHUB_PAGES === "true" && !hasGithubPagesCustomDomain
    ? "/procurement-workflow-os"
    : (process.env.NEXT_PUBLIC_SITE_BASE_PATH ?? "");
const PUBLIC_BASE_PATH =
  configuredPublicBasePath === "/" ? "" : configuredPublicBasePath.replace(/\/$/, "");
const hasSupabaseClientConfig = Boolean(
  process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
);
const allowedEmailDomains = (process.env.NEXT_PUBLIC_ALLOWED_EMAIL_DOMAINS || "sulmi.ai")
  .split(",")
  .map((domain) => domain.trim().toLowerCase())
  .filter(Boolean);
const adminEmails = (process.env.NEXT_PUBLIC_ADMIN_EMAILS || "")
  .split(",")
  .map((email) => email.trim().toLowerCase())
  .filter(Boolean);
const isGithubPagesBuild = process.env.NEXT_PUBLIC_GITHUB_PAGES === "true";
const LIVE_STATE_ROW_ID = "default";

type View =
  | "dashboard"
  | "work-queue"
  | "company-dashboard"
  | "new-request"
  | "notifications"
  | "admin";
type AuthStatus = "checking" | "signed-out" | "signed-in" | "blocked" | "missing-config" | "local-dev";
type LiveSyncStatus = "idle" | "loading" | "ready" | "error";

type SignedInUser = {
  id: string;
  email: string;
  name: string;
  avatarUrl?: string;
};

type FxRateResult = {
  rate: number;
  date: string;
  source: string;
  cached: boolean;
};

type BulkImportRow = {
  itemName: string;
  itemDescription: string;
  productUrl: string;
  quantity: number;
  unitPrice: number;
  currency: string;
  vendorName: string;
};

type BulkWorkbookRow = Record<string, unknown> & {
  __rowNumber?: number;
};

const BULK_FIELD_ALIASES = {
  itemName: ["item_name", "item name", "item", "product", "product name"],
  itemDescription: [
    "item_description",
    "item description",
    "description",
    "item details",
    "details",
  ],
  productUrl: [
    "product_link",
    "product link",
    "product_url",
    "product url",
    "item_link",
    "item link",
    "item_url",
    "item url",
    "link",
    "links",
    "url",
    "urls",
    "website",
    "web link",
    "source",
    "source link",
    "product links",
    "item links",
    "amazon_link",
    "amazon link",
  ],
  quantity: ["quantity", "qty", "qnty"],
  unitPrice: [
    "unit_price",
    "unit price",
    "unit cost",
    "price",
    "rate",
    "cost",
  ],
  currency: ["currency", "curr"],
  vendorName: ["vendor_name", "vendor name", "vendor", "supplier", "supplier name"],
};

const statusClass: Record<string, string> = {
  Pending: "border-amber-200 bg-amber-50 text-amber-800",
  Approved: "border-emerald-200 bg-emerald-50 text-emerald-800",
  Declined: "border-red-200 bg-red-50 text-red-800",
  "In progress": "border-blue-200 bg-blue-50 text-blue-800",
  Completed: "border-green-300 bg-green-800 text-white",
  "Auto approved": "border-purple-200 bg-purple-50 text-purple-800",
};

const statusTone = (status: RequestStatus) => {
  if (status === "Completed") return "Completed";
  if (status === "Rashid Auto Approved") return "Auto approved";
  if (isDeclined(status)) return "Declined";
  if (isApprovalStatus(status)) return "Pending";
  if (
    [
      "Edlyn Confirmation",
      "Edlyn Clarification Requested",
      "Purchase in Progress",
      "Invoice Uploaded",
      "Aileen Finance Review",
      "Invoice Cleared",
      "Edlyn Order Confirmation",
      "Delivery Tracking",
      "Order Confirmed",
      "Item Received",
    ].includes(status)
  ) {
    return "In progress";
  }
  return "Approved";
};

const displayStatus = (status: RequestStatus) => {
  const labels: Partial<Record<RequestStatus, string>> = {
    "Edlyn Confirmation": "Procure Confirmation",
    "Edlyn Clarification Requested": "Procure Clarification Requested",
    "Aileen Finance Review": "Finance Review",
    "Edlyn Order Confirmation": "Procure Order Confirmation",
    "Rashid Declined": "Rejected",
  };

  return labels[status] ?? status;
};

const formatDateTime = (value: string) =>
  new Intl.DateTimeFormat("en-AE", {
    dateStyle: "medium",
    timeStyle: "short",
    timeZone: "Asia/Dubai",
  }).format(new Date(value));

const formatDate = (value: string) =>
  new Intl.DateTimeFormat("en-AE", {
    dateStyle: "medium",
    timeZone: "Asia/Dubai",
  }).format(new Date(value));

const money = (amount: number, currency = "AED") =>
  `${currency} ${new Intl.NumberFormat("en-AE", {
    maximumFractionDigits: 2,
    minimumFractionDigits: Number.isInteger(amount) ? 0 : 2,
  }).format(amount)}`;

const classNames = (...values: Array<string | false | null | undefined>) =>
  values.filter(Boolean).join(" ");

const isAllowedEmail = (email: string) => {
  const domain = email.toLowerCase().split("@")[1] ?? "";
  return allowedEmailDomains.includes(domain);
};

const signedInUserFromSupabase = (user: SupabaseAuthUser): SignedInUser | null => {
  const email = user.email?.toLowerCase();

  if (!email) {
    return null;
  }

  const metadata = user.user_metadata as {
    avatar_url?: string;
    full_name?: string;
    name?: string;
  };

  return {
    id: user.id,
    email,
    name: metadata.full_name || metadata.name || email.split("@")[0] || "Employee",
    avatarUrl: metadata.avatar_url,
  };
};

const profileIdForSignedInUser = (user: SignedInUser) => `google-${user.id}`;

const roleFromSignedInUser = (user: SignedInUser): Role => {
  if (adminEmails.includes(user.email)) {
    return "Admin";
  }

  if (user.email === PROCURE_APPROVAL_EMAIL.toLowerCase()) {
    return "Edlyn";
  }

  if (user.email === FINANCE_APPROVAL_EMAIL.toLowerCase()) {
    return "Aileen";
  }

  const identity = `${user.email} ${user.name}`.toLowerCase();

  if (identity.includes("mona")) return "Mona";
  if (identity.includes("rashid")) return "Rashid";
  if (identity.includes("majed") || identity.includes("masjid")) return "Dr. Majed";
  if (identity.includes("amro") || identity.includes("aamro") || identity.includes("mandil")) {
    return "Amro";
  }

  return "Employee";
};

const getSignedInProfile = (
  state: ProcurementState,
  user: SignedInUser,
): UserProfile => {
  const inferredRole = roleFromSignedInUser(user);
  const displayName =
    inferredRole === "Edlyn" || inferredRole === "Aileen"
      ? getRoleDisplayName(inferredRole)
      : user.name;
  const roleProfile =
    inferredRole !== "Employee"
      ? state.users.find((profile) => profile.role === inferredRole)
      : null;

  if (roleProfile) {
    return {
      ...roleProfile,
      name: displayName,
      email: user.email,
      role: inferredRole,
      active: true,
    };
  }

  const existing = state.users.find(
    (profile) => profile.email.toLowerCase() === user.email,
  );

  if (existing) {
    if (existing.role !== inferredRole) {
      return {
        ...existing,
        name: displayName,
        role: inferredRole,
      };
    }

    return existing;
  }

  return {
    id: profileIdForSignedInUser(user),
    name: displayName,
    email: user.email,
    role: inferredRole,
    department: "Operations",
    active: true,
  };
};

const stateWithSignedInProfile = (
  state: ProcurementState,
  user: SignedInUser,
) => {
  const profile = getSignedInProfile(state, user);
  const hasProfile = state.users.some((candidate) => candidate.id === profile.id);

  return hasProfile
    ? {
        ...state,
        users: state.users.map((candidate) =>
          candidate.id === profile.id ? profile : candidate,
        ),
      }
    : {
        ...state,
        users: [...state.users, profile],
      };
};

const panelClass =
  "rounded-xl border border-slate-200/80 bg-white shadow-[0_1px_2px_rgba(15,23,42,0.05)]";
const insetPanelClass = "rounded-xl border border-slate-200 bg-slate-50/70";

const dubaiDateKey = () => {
  const parts = new Intl.DateTimeFormat("en", {
    day: "2-digit",
    month: "2-digit",
    timeZone: "Asia/Dubai",
    year: "numeric",
  }).formatToParts(new Date());
  const get = (type: Intl.DateTimeFormatPartTypes) =>
    parts.find((part) => part.type === type)?.value ?? "";

  return `${get("year")}-${get("month")}-${get("day")}`;
};

const defaultRequiredByDate = () => {
  const date = new Date();
  date.setDate(date.getDate() + 5);
  return date.toISOString().slice(0, 10);
};

const fxCacheKey = (currency: string, date: string) =>
  `${currency.toUpperCase()}-${date}`;

function readFxCache(): Record<string, FxRateResult> {
  if (typeof window === "undefined") return {};

  try {
    return JSON.parse(window.localStorage.getItem(FX_CACHE_KEY) ?? "{}");
  } catch {
    return {};
  }
}

function writeFxCache(cache: Record<string, FxRateResult>) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(FX_CACHE_KEY, JSON.stringify(cache));
}

async function getFxRateToAed(currency: string): Promise<FxRateResult> {
  const normalized = currency.toUpperCase().trim();
  const date = dubaiDateKey();

  if (normalized === "AED") {
    return {
      rate: 1,
      date,
      source: "AED base currency",
      cached: false,
    };
  }

  const cache = readFxCache();
  const cacheKey = fxCacheKey(normalized, date);

  try {
    const response = await fetch(
      `${FX_RATE_ENDPOINT}?base=${encodeURIComponent(normalized)}&quotes=AED`,
    );
    if (!response.ok) {
      throw new Error(`FX service returned ${response.status}`);
    }
    const payload = (await response.json()) as Array<{
      date?: string;
      rate?: number;
    }>;
    const rate = Number(payload[0]?.rate);
    if (!Number.isFinite(rate) || rate <= 0) {
      throw new Error(`No AED rate returned for ${normalized}`);
    }

    const result = {
      rate,
      date: payload[0]?.date ?? date,
      source: FX_RATE_SOURCE,
      cached: false,
    };
    writeFxCache({
      ...cache,
      [cacheKey]: result,
    });
    return result;
  } catch {
    const cached = cache[cacheKey];
    if (cached) {
      return {
        ...cached,
        cached: true,
      };
    }
    throw new Error(
      `Could not convert ${normalized} to AED. Check the connection and try again.`,
    );
  }
}

function normaliseHeader(value: string) {
  return value.trim().toLowerCase().replace(/[^a-z0-9]+/g, "_").replace(/^_|_$/g, "");
}

const normalizedAliases = (aliases: string[]) => aliases.map((alias) => normaliseHeader(alias));

function parseNumber(value: unknown) {
  const parsed = Number(String(value ?? "").replaceAll(",", "").trim());
  return Number.isFinite(parsed) ? parsed : NaN;
}

function normaliseOptionalUrl(value: unknown) {
  const rawValue = String(value ?? "").trim();
  if (!rawValue) return "";

  const withoutWhitespace = rawValue.replace(/\s+/g, "");
  const withProtocol = /^[a-z][a-z\d+.-]*:\/\//i.test(withoutWhitespace)
    ? withoutWhitespace
    : `https://${withoutWhitespace}`;

  try {
    const url = new URL(withProtocol);
    if (!url.hostname.includes(".") && url.hostname !== "localhost") {
      return "";
    }
    return url.protocol === "http:" || url.protocol === "https:" ? url.toString() : "";
  } catch {
    return "";
  }
}

function rowHasValue(values: unknown[]) {
  return values.some((value) => String(value ?? "").trim() !== "");
}

function headerHasAlias(headers: string[], aliases: string[]) {
  const options = normalizedAliases(aliases);
  return headers.some((header) => options.includes(header));
}

function isBulkHeaderRow(values: unknown[]) {
  const headers = values.map((value) => normaliseHeader(String(value ?? "")));
  return (
    headerHasAlias(headers, BULK_FIELD_ALIASES.itemName) &&
    headerHasAlias(headers, BULK_FIELD_ALIASES.itemDescription) &&
    headerHasAlias(headers, BULK_FIELD_ALIASES.quantity) &&
    headerHasAlias(headers, BULK_FIELD_ALIASES.unitPrice) &&
    headerHasAlias(headers, BULK_FIELD_ALIASES.currency)
  );
}

async function parseBulkWorkbook(file: File) {
  const XLSX = await import("xlsx");
  const workbook = XLSX.read(await file.arrayBuffer(), { type: "array" });
  const worksheet = workbook.Sheets[workbook.SheetNames[0]];
  if (!worksheet) {
    throw new Error("The uploaded file does not contain a worksheet.");
  }

  const sheetRows = XLSX.utils.sheet_to_json<unknown[]>(worksheet, {
    blankrows: false,
    defval: "",
    header: 1,
  });

  const headerIndex = sheetRows.findIndex((row) => rowHasValue(row) && isBulkHeaderRow(row));
  if (headerIndex < 0) {
    throw new Error(
      "Could not find bulk item headers. Use columns: item_name, item_description, product_link, quantity, unit_price, currency, vendor_name.",
    );
  }

  const headers = sheetRows[headerIndex].map((value, index) => {
    const header = String(value ?? "").trim();
    return header || `column_${index + 1}`;
  });
  const productLinkHeaders = new Set(normalizedAliases(BULK_FIELD_ALIASES.productUrl));
  const hyperlinkSourceHeaders = new Set([
    ...normalizedAliases(BULK_FIELD_ALIASES.itemName),
    ...normalizedAliases(BULK_FIELD_ALIASES.itemDescription),
    ...normalizedAliases(BULK_FIELD_ALIASES.productUrl),
  ]);
  const rows = sheetRows
    .slice(headerIndex + 1)
    .map((values, index): BulkWorkbookRow => {
      const worksheetRowIndex = headerIndex + index + 1;
      let rowProductLink = "";
      const row = Object.fromEntries(
        headers.map((header, cellIndex) => {
          const normalizedHeader = normaliseHeader(header);
          const cellAddress = XLSX.utils.encode_cell({
            c: cellIndex,
            r: worksheetRowIndex,
          });
          const cell = worksheet[cellAddress] as
            | { l?: { Target?: string; target?: string } }
            | undefined;
          const cellTarget = cell?.l?.Target || cell?.l?.target || "";
          if (cellTarget && hyperlinkSourceHeaders.has(normalizedHeader) && !rowProductLink) {
            rowProductLink = cellTarget;
          }
          const linkedTarget = productLinkHeaders.has(normalizedHeader) ? cellTarget : "";

          return [header, linkedTarget || (values[cellIndex] ?? "")];
        }),
      ) as BulkWorkbookRow;
      const productLinkHeader = headers.find((header) =>
        productLinkHeaders.has(normaliseHeader(header)),
      );
      if (rowProductLink && productLinkHeader && !String(row[productLinkHeader] ?? "").trim()) {
        row[productLinkHeader] = rowProductLink;
      }
      if (rowProductLink && !productLinkHeader) {
        row.product_link = rowProductLink;
      }
      row.__rowNumber = headerIndex + index + 2;
      return row;
    })
    .filter((row) =>
      Object.entries(row).some(
        ([key, value]) => key !== "__rowNumber" && String(value ?? "").trim() !== "",
      ),
    );

  return rows;
}

function getBulkField(normalized: Record<string, unknown>, aliases: string[]) {
  const aliasKeys = normalizedAliases(aliases);
  for (const key of aliasKeys) {
    if (Object.prototype.hasOwnProperty.call(normalized, key)) {
      return normalized[key];
    }
  }
  return "";
}

function mapBulkRows(rows: BulkWorkbookRow[]) {
  return rows.map((row, index): BulkImportRow => {
    const normalized = Object.fromEntries(
      Object.entries(row)
        .filter(([key]) => key !== "__rowNumber")
        .map(([key, value]) => [normaliseHeader(key), value]),
    );
    const quantity = parseNumber(getBulkField(normalized, BULK_FIELD_ALIASES.quantity));
    const unitPrice = parseNumber(getBulkField(normalized, BULK_FIELD_ALIASES.unitPrice));
    const currency = String(getBulkField(normalized, BULK_FIELD_ALIASES.currency) ?? "")
      .trim()
      .toUpperCase();
    const itemName = String(getBulkField(normalized, BULK_FIELD_ALIASES.itemName) ?? "").trim();
    const itemDescription = String(
      getBulkField(normalized, BULK_FIELD_ALIASES.itemDescription) ?? "",
    ).trim();
    const rawProductUrl = getBulkField(normalized, BULK_FIELD_ALIASES.productUrl);
    const productUrl = normaliseOptionalUrl(rawProductUrl);
    const vendorName = String(getBulkField(normalized, BULK_FIELD_ALIASES.vendorName) ?? "").trim();
    const rowNumber = row.__rowNumber ?? index + 2;

    if (!itemName) {
      throw new Error(`Row ${rowNumber}: item name is required.`);
    }
    if (!itemDescription) {
      throw new Error(`Row ${rowNumber}: item description is required.`);
    }
    if (!Number.isFinite(quantity) || quantity <= 0) {
      throw new Error(`Row ${rowNumber}: quantity must be greater than 0.`);
    }
    if (!Number.isFinite(unitPrice) || unitPrice <= 0) {
      throw new Error(`Row ${rowNumber}: unit price must be greater than 0.`);
    }
    if (!BULK_SUPPORTED_CURRENCIES.includes(currency as (typeof BULK_SUPPORTED_CURRENCIES)[number])) {
      throw new Error(
        `Row ${rowNumber}: currency must be one of ${BULK_SUPPORTED_CURRENCIES.join(", ")}.`,
      );
    }
    if (String(rawProductUrl ?? "").trim() && !productUrl) {
      throw new Error(`Row ${rowNumber}: product link must be a valid http or https URL.`);
    }

    return {
      itemName,
      itemDescription,
      productUrl,
      quantity,
      unitPrice,
      currency,
      vendorName,
    };
  });
}

async function convertRowsToLineItems(rows: BulkImportRow[]) {
  const lineItems: ProcurementLineItem[] = [];

  for (const row of rows) {
    const fx = await getFxRateToAed(row.currency);
    const originalTotal = roundMoney(row.quantity * row.unitPrice);
    lineItems.push({
      id: makeId("item"),
      itemName: row.itemName,
      itemDescription: row.itemDescription,
      productUrl: row.productUrl,
      quantity: row.quantity,
      unitPrice: roundMoney(row.unitPrice),
      currency: row.currency,
      originalTotal,
      fxRateToAed: fx.rate,
      aedTotal: roundMoney(originalTotal * fx.rate),
      vendorName: row.vendorName,
      exchangeRateDate: fx.date,
      exchangeRateSource: fx.cached ? `${fx.source} cached` : fx.source,
    });
  }

  return lineItems;
}

function IconButton({
  children,
  icon,
  variant = "primary",
  type = "button",
  onClick,
  disabled,
  title,
}: {
  children: ReactNode;
  icon: ReactNode;
  variant?: "primary" | "secondary" | "danger" | "ghost" | "success";
  type?: "button" | "submit";
  onClick?: MouseEventHandler<HTMLButtonElement>;
  disabled?: boolean;
  title?: string;
}) {
  const variants = {
    primary: "bg-blue-600 text-white shadow-sm shadow-blue-600/20 hover:bg-blue-700",
    secondary:
      "border border-slate-200 bg-white text-slate-700 shadow-sm hover:border-slate-300 hover:bg-slate-50",
    danger: "bg-red-600 text-white shadow-sm shadow-red-600/20 hover:bg-red-700",
    ghost: "text-slate-600 hover:bg-slate-100",
    success: "bg-emerald-600 text-white shadow-sm shadow-emerald-600/20 hover:bg-emerald-700",
  };

  return (
    <button
      className={classNames(
        "box-border inline-flex min-h-10 w-full max-w-full items-center justify-center gap-2 rounded-lg px-3.5 text-center text-sm font-semibold leading-5 transition disabled:opacity-50 sm:w-auto",
        variants[variant],
      )}
      disabled={disabled}
      onClick={onClick}
      title={title}
      type={type}
    >
      <span className="shrink-0">{icon}</span>
      <span className="min-w-0 whitespace-normal">{children}</span>
    </button>
  );
}

function StatusBadge({ status }: { status: RequestStatus }) {
  const tone = statusTone(status);
  const label = displayStatus(status);
  return (
    <span
      className={classNames(
        "inline-flex max-w-full items-center justify-center whitespace-normal rounded-full border px-2.5 py-1 text-center text-xs font-semibold leading-4",
        statusClass[tone],
      )}
    >
      {label}
    </span>
  );
}

function SignInScreen({
  authError,
  authStatus,
  canUseLocalWorkspace,
  liveSyncStatus,
  onSignIn,
  onSignOut,
  onUseLocalWorkspace,
}: {
  authError: string;
  authStatus: AuthStatus;
  canUseLocalWorkspace: boolean;
  liveSyncStatus: LiveSyncStatus;
  onSignIn: () => void;
  onSignOut: () => void;
  onUseLocalWorkspace: () => void;
}) {
  const isChecking = authStatus === "checking";
  const isBlocked = authStatus === "blocked";
  const isMissingConfig = authStatus === "missing-config";
  const allowedDomainText = allowedEmailDomains.map((domain) => `@${domain}`).join(", ");

  return (
    <main className="grid min-h-screen place-items-center bg-[#f6f8fb] px-4 py-8 text-slate-900">
      <section className="w-full max-w-[calc(100vw-2rem)] rounded-xl border border-slate-200/80 bg-white p-6 shadow-[0_12px_40px_rgba(15,23,42,0.08)] sm:max-w-xl sm:p-8">
        <div className="flex items-center gap-4">
          <div className="flex h-14 w-40 shrink-0 items-center justify-center rounded-xl bg-black px-4">
            <Image
              alt="SULMI"
              className="h-9 w-full object-contain"
              height={36}
              src={`${PUBLIC_BASE_PATH}/sulmi-logo.svg`}
              unoptimized
              width={130}
            />
          </div>
        </div>

        <div className="mt-8">
          <div className="inline-flex items-center gap-2 rounded-md border border-blue-100 bg-blue-50 px-3 py-1 text-xs font-semibold text-blue-800">
            <Shield className="h-4 w-4" />
            Sulmi employee access only
          </div>
          <h1 className="mt-4 text-2xl font-bold tracking-tight text-slate-950">
            Sign in to Procurement Workflow OS
          </h1>
          <p className="mt-2 text-sm leading-6 text-slate-600">
            Employees must sign in with their Sulmi Google account to submit procurement
            requests and track only their own request status.
          </p>
        </div>

        <div className="mt-6 rounded-xl border border-slate-200 bg-slate-50 p-4 text-sm text-slate-700">
          <p className="font-semibold text-slate-950">Allowed Google accounts</p>
          <p className="mt-1">{allowedDomainText || "Configured Sulmi domains only"}</p>
          {adminEmails.length > 0 ? (
            <p className="mt-2 text-xs text-slate-500">
              Admin bootstrap: {adminEmails.join(", ")}
            </p>
          ) : null}
        </div>

        {authError ? (
          <div className="mt-4 rounded-xl border border-red-200 bg-red-50 p-3 text-sm font-medium text-red-800">
            {authError}
          </div>
        ) : null}

        {isBlocked ? (
          <div className="mt-4 rounded-xl border border-amber-200 bg-amber-50 p-3 text-sm text-amber-900">
            This Google account is not part of the configured Sulmi domain. Sign out and use
            your company Google account.
          </div>
        ) : null}

        {isMissingConfig ? (
          <div className="mt-4 rounded-xl border border-amber-200 bg-amber-50 p-3 text-sm text-amber-900">
            Google sign-in is not configured yet. Add Supabase Google OAuth credentials and
            set `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, and
            `NEXT_PUBLIC_ALLOWED_EMAIL_DOMAINS`.
          </div>
        ) : null}

        <div className="mt-6 grid gap-3 sm:grid-cols-2">
          <IconButton
            disabled={isChecking || isMissingConfig}
            icon={<Shield className="h-4 w-4" />}
            onClick={onSignIn}
          >
            {isChecking ? "Checking session..." : "Sign in with Google"}
          </IconButton>
          {isBlocked ? (
            <IconButton
              icon={<LogOut className="h-4 w-4" />}
              onClick={onSignOut}
              variant="secondary"
            >
              Sign out
            </IconButton>
          ) : null}
          {canUseLocalWorkspace ? (
            <IconButton
              icon={<Shield className="h-4 w-4" />}
              onClick={onUseLocalWorkspace}
              variant="secondary"
            >
              Local admin workspace
            </IconButton>
          ) : null}
        </div>
        {liveSyncStatus === "ready" ? (
          <p className="mt-4 text-xs font-semibold text-emerald-700">
            Live Supabase workspace connected.
          </p>
        ) : null}
      </section>
    </main>
  );
}

function Field({
  label,
  children,
  htmlFor,
  required,
}: {
  label: string;
  children: ReactNode;
  htmlFor?: string;
  required?: boolean;
}) {
  const labelContent = (
    <span>
      {label}
      {required ? <span className="text-red-600"> *</span> : null}
    </span>
  );

  if (htmlFor) {
    return (
      <div className="grid gap-1.5 text-sm font-medium text-slate-700">
        <label htmlFor={htmlFor}>{labelContent}</label>
        {children}
      </div>
    );
  }

  return (
    <label className="grid gap-1.5 text-sm font-medium text-slate-700">
      {labelContent}
      {children}
    </label>
  );
}

function inputClass() {
  return "box-border min-h-11 w-full min-w-0 rounded-lg border border-slate-200 bg-white px-3.5 text-sm text-slate-950 outline-none transition placeholder:text-slate-400 focus:border-blue-500 focus:ring-4 focus:ring-blue-100/80";
}

function TextInput(props: React.InputHTMLAttributes<HTMLInputElement>) {
  return <input {...props} className={classNames(inputClass(), props.className)} />;
}

function TextArea(props: React.TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return (
    <textarea
      {...props}
      className={classNames(
        inputClass(),
        "min-h-24 resize-y py-2 leading-6",
        props.className,
      )}
    />
  );
}

function SelectInput(props: React.SelectHTMLAttributes<HTMLSelectElement>) {
  return <select {...props} className={classNames(inputClass(), props.className)} />;
}

function DashboardMetric({
  label,
  value,
  icon,
  tone,
}: {
  label: string;
  value: string | number;
  icon: ReactNode;
  tone: string;
}) {
  return (
    <div className={classNames(panelClass, "min-w-0 p-5")}>
      <div className="flex items-center justify-between gap-3">
        <p className="min-w-0 text-sm font-semibold text-slate-500">{label}</p>
        <span className={classNames("rounded-xl p-2.5", tone)}>{icon}</span>
      </div>
      <p className="mt-4 text-3xl font-bold tracking-tight text-slate-950">{value}</p>
    </div>
  );
}

function WorkflowTracker({ request }: { request: ProcurementRequest }) {
  const currentIndex = getStageIndex(request.stage);
  const declined = isDeclined(request.status);

  return (
    <div className="grid min-w-0 grid-cols-2 gap-3 md:grid-cols-5">
      {WORKFLOW_STAGES.map((stage, index) => {
        const complete = request.status === "Completed" || index < currentIndex;
        const current = index === currentIndex;
        const autoApproved =
          request.status === "Rashid Auto Approved" && stage.key === "rashid";

        return (
          <div
            className={classNames(
              "min-h-24 min-w-0 rounded-xl border bg-white p-3.5 shadow-[0_1px_2px_rgba(15,23,42,0.04)]",
              complete ? "border-emerald-200 bg-emerald-50/40" : "border-slate-200",
              current && !declined ? "border-blue-200 ring-4 ring-blue-100/80" : "",
              current && declined ? "border-red-300 ring-4 ring-red-100" : "",
              autoApproved ? "border-purple-200 bg-purple-50" : "",
            )}
            key={stage.key}
          >
            <div className="flex items-center gap-2">
              <span
                className={classNames(
                  "grid h-7 w-7 shrink-0 place-items-center rounded-full text-xs font-bold",
                  complete ? "bg-emerald-700 text-white" : "bg-slate-100 text-slate-600",
                  current && !declined ? "bg-blue-700 text-white" : "",
                  current && declined ? "bg-red-700 text-white" : "",
                  autoApproved ? "bg-purple-700 text-white" : "",
                )}
              >
                {complete ? <Check className="h-4 w-4" /> : stage.id}
              </span>
              <span className="text-xs font-semibold uppercase text-slate-500">
                Stage {stage.id}
              </span>
            </div>
            <p className="mt-3 break-words text-sm font-bold leading-5 text-slate-950">
              {stage.label}
            </p>
            <p className="mt-1 text-xs text-slate-500">{stage.ownerLabel ?? stage.ownerRole}</p>
          </div>
        );
      })}
    </div>
  );
}

function buildAttachmentReferences(files: FileList | null, type: AttachmentReference["type"]) {
  if (!files) return [];
  return Array.from(files).map((file) => ({
    id: makeId("file"),
    name: file.name,
    type,
    path: `procurement-files/${type}/${file.name}`,
    uploadedAt: nowIso(),
  }));
}

function RequestForm({
  currentUser,
  projectOptions,
  onSubmit,
}: {
  currentUser: UserProfile;
  projectOptions: string[];
  onSubmit: (draft: ProcurementRequestDraft) => string | void;
}) {
  const availableProjects =
    projectOptions.length > 0 ? projectOptions : [...DEFAULT_PROJECT_OPTIONS];
  const [employeeName, setEmployeeName] = useState(
    currentUser.name === "Admin" ? "" : currentUser.name,
  );
  const [department, setDepartment] = useState(
    DEPARTMENTS.includes(currentUser.department as (typeof DEPARTMENTS)[number])
      ? currentUser.department
      : "Operations",
  );
  const [project, setProject] = useState(availableProjects[0] ?? "Beta");
  const [itemName, setItemName] = useState("");
  const [itemDescription, setItemDescription] = useState("");
  const [productLink, setProductLink] = useState("");
  const [quantity, setQuantity] = useState(1);
  const [estimatedAmount, setEstimatedAmount] = useState("");
  const [currency, setCurrency] = useState<(typeof CURRENCIES)[number]>("AED");
  const [customCurrency, setCustomCurrency] = useState("");
  const [vendorName, setVendorName] = useState("");
  const [reasonForPurchase, setReasonForPurchase] = useState("");
  const [priority, setPriority] = useState<(typeof PRIORITIES)[number]>("Normal");
  const [requiredByDate, setRequiredByDate] = useState(defaultRequiredByDate);
  const [attachments, setAttachments] = useState<AttachmentReference[]>([]);
  const [vendorContact, setVendorContact] = useState("");
  const [vendorCompany, setVendorCompany] = useState("");
  const [trnNumber, setTrnNumber] = useState("");
  const [tradeLicense, setTradeLicense] = useState("");
  const [bankDetails, setBankDetails] = useState("");
  const [vatRegistration, setVatRegistration] = useState("");
  const [ownerDocument, setOwnerDocument] = useState("");
  const [websiteLink, setWebsiteLink] = useState("");
  const [eBrochureLink, setEBrochureLink] = useState("");
  const [businessLocation, setBusinessLocation] = useState("");
  const [formError, setFormError] = useState("");
  const [successMessage, setSuccessMessage] = useState("");
  const [entryMode, setEntryMode] = useState<"single" | "bulk">("single");
  const [bulkLineItems, setBulkLineItems] = useState<ProcurementLineItem[]>([]);
  const [bulkFileName, setBulkFileName] = useState("");
  const [bulkImportMessage, setBulkImportMessage] = useState("");
  const [bulkImporting, setBulkImporting] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const isBulkMode = entryMode === "bulk";
  const hasBulkLineItems = isBulkMode && bulkLineItems.length > 0;
  const selectedProject = availableProjects.includes(project)
    ? project
    : availableProjects[0] ?? "Beta";
  const bulkTotalAed = useMemo(
    () => roundMoney(bulkLineItems.reduce((total, item) => total + item.aedTotal, 0)),
    [bulkLineItems],
  );

  const downloadBulkTemplate = () => {
    const rows = [
      BULK_TEMPLATE_HEADERS.join(","),
      "Laptop stand,Adjustable laptop stand for operations desk,https://example.com/laptop-stand,2,95,AED,OfficeLine",
      "Wireless mouse,USB-C wireless mouse,https://example.com/wireless-mouse,3,25,USD,TechGate Supplies",
    ];
    downloadBlob(
      rows.join("\n"),
      "procurement-bulk-template.csv",
      "text/csv;charset=utf-8",
    );
  };

  const handleBulkUpload = async (file: File | undefined) => {
    if (!file) return;

    setEntryMode("bulk");
    setBulkImporting(true);
    setFormError("");
    setSuccessMessage("");
    setBulkFileName(file.name);
    setBulkImportMessage("");

    try {
      const rows = await parseBulkWorkbook(file);
      if (rows.length === 0) {
        throw new Error("The uploaded file contains headers but no item rows.");
      }
      const mappedRows = mapBulkRows(rows);
      if (mappedRows.length === 0) {
        throw new Error("The uploaded file contains no valid item rows.");
      }
      const converted = await convertRowsToLineItems(mappedRows);
      setBulkLineItems(converted);
      setBulkImportMessage(
        `${converted.length} line item(s) loaded from ${file.name}. Total converted value is ${money(
          converted.reduce((total, item) => total + item.aedTotal, 0),
          "AED",
        )}.`,
      );
    } catch (error) {
      setBulkLineItems([]);
      setFormError(error instanceof Error ? error.message : "Could not import the file.");
    } finally {
      setBulkImporting(false);
    }
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const amountValue = Number(estimatedAmount);
    const quantityValue = Number(quantity);
    const dueDate = requiredByDate ? new Date(`${requiredByDate}T00:00:00`) : null;
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    setSuccessMessage("");

    try {
      setSubmitting(true);

      if (!employeeName.trim()) {
        throw new Error("Employee name is required.");
      }
      if (isBulkMode && !hasBulkLineItems) {
        throw new Error("Upload at least one bulk item or switch back to Single item.");
      }
      if (!hasBulkLineItems && !itemName.trim()) {
        throw new Error("Item name is required.");
      }
      if (!hasBulkLineItems && (!Number.isFinite(quantityValue) || quantityValue < 1)) {
        throw new Error("Quantity must be at least 1.");
      }
      if (!hasBulkLineItems && (!Number.isFinite(amountValue) || amountValue <= 0)) {
        throw new Error("Enter an estimated amount greater than 0.");
      }
      if (!hasBulkLineItems && !itemDescription.trim()) {
        throw new Error("Item description is required.");
      }
      if (!hasBulkLineItems && currency === "Other" && !customCurrency.trim()) {
        throw new Error("Enter the currency when selecting Other.");
      }
      const normalizedProductLink = hasBulkLineItems ? "" : normaliseOptionalUrl(productLink);
      if (!hasBulkLineItems && productLink.trim() && !normalizedProductLink) {
        throw new Error("Product link must be a valid website URL.");
      }
      if (!reasonForPurchase.trim()) {
        throw new Error("Reason for purchase is required.");
      }
      if (!dueDate || Number.isNaN(dueDate.getTime())) {
        throw new Error("Required by date is required.");
      }
      if (dueDate < today) {
        throw new Error("Required by date cannot be in the past.");
      }

      const selectedCurrency =
        currency === "Other" ? customCurrency.trim().toUpperCase() : currency;
      const lineItems = hasBulkLineItems
        ? bulkLineItems
        : await convertRowsToLineItems([
            {
              itemName,
              itemDescription,
              productUrl: normalizedProductLink,
              quantity: quantityValue,
              unitPrice: amountValue / quantityValue,
              currency: selectedCurrency,
              vendorName,
            },
          ]);
      const totalAed = roundMoney(
        lineItems.reduce((total, item) => total + item.aedTotal, 0),
      );
      const totalQuantity = lineItems.reduce((total, item) => total + item.quantity, 0);
      const requestId = onSubmit({
        employeeName,
        department,
        project: selectedProject,
        itemName: hasBulkLineItems
          ? `Bulk upload (${lineItems.length} items)`
          : itemName,
        itemDescription: hasBulkLineItems
          ? `Bulk procurement upload containing ${lineItems.length} item(s).`
          : itemDescription,
        quantity: hasBulkLineItems ? totalQuantity : quantityValue,
        estimatedAmount: hasBulkLineItems ? totalAed : amountValue,
        estimatedAmountAed: totalAed,
        currency: hasBulkLineItems ? "AED" : selectedCurrency,
        exchangeRateDate: lineItems[0]?.exchangeRateDate ?? dubaiDateKey(),
        exchangeRateSource: Array.from(
          new Set(lineItems.map((item) => item.exchangeRateSource)),
        ).join(", "),
        lineItems,
        vendorName:
          vendorName ||
          Array.from(new Set(lineItems.map((item) => item.vendorName).filter(Boolean))).join(
            ", ",
          ),
        reasonForPurchase,
        priority,
        requiredByDate,
        attachments,
        vendor: {
          contactPerson: vendorContact,
          companyName: vendorCompany || vendorName,
          trnNumber,
          tradeLicense,
          bankDetails,
          vatRegistration,
          ownerDocument,
          websiteLink,
          eBrochureLink,
          businessLocation,
        },
      });
      setFormError("");
      setSuccessMessage(
        `${requestId ?? "Request"} submitted to Mona for first review. Total AED ${totalAed.toFixed(2)}.`,
      );
      setItemName("");
      setProject(availableProjects[0] ?? "Beta");
      setItemDescription("");
      setProductLink("");
      setQuantity(1);
      setEstimatedAmount("");
      setCurrency("AED");
      setCustomCurrency("");
      setVendorName("");
      setReasonForPurchase("");
      setPriority("Normal");
      setRequiredByDate(defaultRequiredByDate());
      setAttachments([]);
      setEntryMode("single");
      setBulkLineItems([]);
      setBulkFileName("");
      setBulkImportMessage("");
      setVendorContact("");
      setVendorCompany("");
      setTrnNumber("");
      setTradeLicense("");
      setBankDetails("");
      setVatRegistration("");
      setOwnerDocument("");
      setWebsiteLink("");
      setEBrochureLink("");
      setBusinessLocation("");
    } catch (error) {
      setFormError(error instanceof Error ? error.message : "Could not submit the request.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <form className="grid min-w-0 gap-5 sm:gap-6" onSubmit={handleSubmit}>
      {formError ? (
        <div className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm font-medium text-red-800">
          {formError}
        </div>
      ) : null}
      {successMessage ? (
        <div className="rounded-lg border border-emerald-200 bg-emerald-50 p-3 text-sm font-medium text-emerald-800">
          {successMessage}
        </div>
      ) : null}
      <section className={classNames(panelClass, "min-w-0 p-4 sm:p-5")}>
        <div className="mb-5 flex items-center gap-2">
          <ClipboardList className="h-5 w-5 text-blue-700" />
          <h2 className="text-lg font-bold text-slate-950">Procurement request</h2>
        </div>
        <div className="grid min-w-0 gap-4 md:grid-cols-2 xl:grid-cols-3">
          <Field label="Employee name" required>
            <TextInput value={employeeName} onChange={(event) => setEmployeeName(event.target.value)} required />
          </Field>
          <Field label="Department" required>
            <SelectInput value={department} onChange={(event) => setDepartment(event.target.value)} required>
              {DEPARTMENTS.map((item) => (
                <option key={item}>{item}</option>
              ))}
            </SelectInput>
          </Field>
          <Field label="Project" required>
            <SelectInput
              value={selectedProject}
              onChange={(event) => setProject(event.target.value)}
              required
            >
              {availableProjects.map((item) => (
                <option key={item}>{item}</option>
              ))}
            </SelectInput>
          </Field>
          <div className="md:col-span-2 xl:col-span-3">
            <div className={classNames(insetPanelClass, "flex flex-col gap-3 p-3 sm:flex-row sm:items-center sm:justify-between")}>
              <p className="text-sm font-bold text-slate-950">Request items</p>
              <div className="grid grid-cols-2 gap-2 rounded-md bg-white p-1 shadow-sm">
                <button
                  className={classNames(
                    "inline-flex min-h-9 items-center justify-center gap-2 rounded px-3 text-sm font-semibold transition",
                    !isBulkMode
                      ? "bg-blue-600 text-white shadow-sm"
                      : "text-slate-600 hover:bg-slate-100",
                  )}
                  onClick={() => {
                    setEntryMode("single");
                    setBulkLineItems([]);
                    setBulkFileName("");
                    setBulkImportMessage("");
                  }}
                  type="button"
                >
                  <PackageCheck className="h-4 w-4" />
                  Single item
                </button>
                <button
                  className={classNames(
                    "inline-flex min-h-9 items-center justify-center gap-2 rounded px-3 text-sm font-semibold transition",
                    isBulkMode
                      ? "bg-blue-600 text-white shadow-sm"
                      : "text-slate-600 hover:bg-slate-100",
                  )}
                  onClick={() => setEntryMode("bulk")}
                  type="button"
                >
                  <FileSpreadsheet className="h-4 w-4" />
                  Bulk upload
                </button>
              </div>
            </div>
          </div>
          {isBulkMode ? (
            <div className="md:col-span-2 xl:col-span-3">
              <div className="rounded-xl border border-blue-100 bg-blue-50 p-4">
                <p className="text-sm font-bold text-slate-950">Bulk item request</p>
                <p className="mt-1 text-sm text-slate-600">
                  {hasBulkLineItems
                    ? `${bulkLineItems.length} item(s), total converted value ${money(
                        bulkTotalAed,
                        "AED",
                      )}`
                    : bulkFileName
                      ? `Last selected file: ${bulkFileName}`
                    : "No bulk file loaded yet."}
                </p>
              </div>
            </div>
          ) : (
            <>
              <Field label="Item name" required>
                <TextInput
                  value={itemName}
                  onChange={(event) => setItemName(event.target.value)}
                  required
                />
              </Field>
              <Field label="Quantity" required>
                <TextInput
                  min={1}
                  type="number"
                  value={quantity}
                  onChange={(event) => setQuantity(Number(event.target.value))}
                  required
                />
              </Field>
              <Field label="Estimated amount" required>
                <TextInput
                  inputMode="decimal"
                  min={0}
                  pattern="[0-9]*[.]?[0-9]*"
                  placeholder="Enter amount"
                  type="text"
                  value={estimatedAmount}
                  onChange={(event) =>
                    setEstimatedAmount(event.target.value.replace(/[^\d.]/g, ""))
                  }
                  required
                />
              </Field>
              <Field label="Currency" required>
                <SelectInput
                  value={currency}
                  onChange={(event) => setCurrency(event.target.value as typeof currency)}
                  required
                >
                  {CURRENCIES.map((item) => (
                    <option key={item}>{item}</option>
                  ))}
                </SelectInput>
              </Field>
              {currency === "Other" ? (
                <Field label="Other currency" required>
                  <TextInput
                    maxLength={12}
                    placeholder="Enter currency"
                    value={customCurrency}
                    onChange={(event) => setCustomCurrency(event.target.value.toUpperCase())}
                    required
                  />
                </Field>
              ) : null}
              <Field label="Vendor name">
                <TextInput value={vendorName} onChange={(event) => setVendorName(event.target.value)} />
              </Field>
              <Field label="Product link">
                <TextInput
                  inputMode="url"
                  placeholder="Paste product URL"
                  type="text"
                  value={productLink}
                  onChange={(event) => setProductLink(event.target.value)}
                />
              </Field>
            </>
          )}
          <Field label="Priority">
            <SelectInput value={priority} onChange={(event) => setPriority(event.target.value as typeof priority)}>
              {PRIORITIES.map((item) => (
                <option key={item}>{item}</option>
              ))}
            </SelectInput>
          </Field>
          <Field label="Required by date" required>
            <TextInput
              type="date"
              value={requiredByDate}
              onChange={(event) => setRequiredByDate(event.target.value)}
              required
            />
          </Field>
          {!isBulkMode ? (
            <div className="md:col-span-2 xl:col-span-3">
              <Field label="Item description" required>
                <TextArea
                  value={itemDescription}
                  onChange={(event) => setItemDescription(event.target.value)}
                  required
                />
              </Field>
            </div>
          ) : null}
          <div className="md:col-span-2 xl:col-span-3">
            <Field label="Reason for purchase" required>
              <TextArea value={reasonForPurchase} onChange={(event) => setReasonForPurchase(event.target.value)} required />
            </Field>
          </div>
          {isBulkMode ? (
            <div className="md:col-span-2 xl:col-span-3">
              <div className={classNames(insetPanelClass, "min-w-0 p-3 sm:p-4")}>
                <div className="flex min-w-0 flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
                  <div className="min-w-0">
                    <h3 className="text-sm font-bold text-slate-950">Bulk item upload</h3>
                    <p className="mt-1 text-sm text-slate-500">
                      Upload CSV or Excel rows with item_name, item_description,
                      optional product_link, quantity, unit_price, currency, and optional vendor_name.
                    </p>
                  </div>
                  <div className="grid gap-2 sm:flex sm:flex-wrap">
                    <IconButton
                      icon={<Download className="h-4 w-4" />}
                      onClick={downloadBulkTemplate}
                      variant="secondary"
                    >
                      Download template
                    </IconButton>
                    {hasBulkLineItems ? (
                      <IconButton
                        icon={<XCircle className="h-4 w-4" />}
                        onClick={() => {
                          setBulkLineItems([]);
                          setBulkFileName("");
                          setBulkImportMessage("");
                        }}
                        variant="ghost"
                      >
                        Clear items
                      </IconButton>
                    ) : null}
                  </div>
                </div>

                <div className="mt-4">
                  <input
                    accept=".csv,.xlsx,.xls"
                    className={inputClass()}
                    disabled={bulkImporting || submitting}
                    type="file"
                    onChange={(event) => {
                      void handleBulkUpload(event.target.files?.[0]);
                      event.currentTarget.value = "";
                    }}
                  />
                </div>

                {bulkFileName ? (
                  <p className="mt-2 text-xs font-semibold text-slate-500">
                    Selected file: {bulkFileName}
                  </p>
                ) : null}

                {bulkImporting ? (
                  <p className="mt-3 text-sm font-medium text-blue-700">
                    Importing rows and converting to AED...
                  </p>
                ) : null}

                {bulkImportMessage ? (
                  <p className="mt-3 text-sm font-medium text-emerald-700">
                    {bulkImportMessage}
                  </p>
                ) : null}

                {hasBulkLineItems ? (
                  <>
                    <div className="mt-4 grid gap-3 md:hidden">
                      {bulkLineItems.map((item, index) => (
                        <div
                          className="rounded-xl border border-slate-200 bg-white p-3"
                          key={item.id}
                        >
                          <div className="flex items-start justify-between gap-3">
                            <div className="min-w-0">
                              <p className="text-xs font-semibold uppercase text-slate-500">
                                Item {index + 1}
                              </p>
                              <p className="mt-1 font-semibold text-slate-950">
                                {item.itemName}
                              </p>
                            </div>
                            <span className="shrink-0 text-sm font-bold text-slate-950">
                              {money(item.aedTotal, "AED")}
                            </span>
                          </div>
                          <p className="mt-2 text-sm text-slate-600">
                            {item.itemDescription}
                          </p>
                          <div className="mt-3 grid grid-cols-2 gap-2 text-sm">
                            <Detail label="Qty" value={String(item.quantity)} />
                            <Detail
                              label="Unit price"
                              value={money(item.unitPrice, item.currency)}
                            />
                            <Detail
                              label="Original total"
                              value={money(item.originalTotal, item.currency)}
                            />
                            <Detail label="FX to AED" value={item.fxRateToAed.toFixed(4)} />
                            <div className="col-span-2">
                              <Detail label="Vendor" value={item.vendorName || "Not provided"} />
                            </div>
                            <div className="col-span-2">
                              <LineItemLink productUrl={item.productUrl} />
                            </div>
                          </div>
                        </div>
                      ))}
                      <div className={classNames(insetPanelClass, "p-3 text-sm font-bold text-slate-950")}>
                        Total converted value: {money(bulkTotalAed, "AED")}
                      </div>
                    </div>
                    <div className="mt-4 hidden overflow-x-auto rounded-xl border border-slate-200 bg-white md:block">
                      <table className="w-full min-w-[980px] text-left text-sm">
                    <thead className="bg-slate-50 text-xs uppercase text-slate-500">
                      <tr>
                        <th className="px-3 py-2">No.</th>
                        <th className="px-3 py-2">Item</th>
                        <th className="px-3 py-2">Qty</th>
                        <th className="px-3 py-2">Unit price</th>
                        <th className="px-3 py-2">Original total</th>
                        <th className="px-3 py-2">Product link</th>
                        <th className="px-3 py-2">FX to AED</th>
                        <th className="px-3 py-2">AED total</th>
                        <th className="px-3 py-2">Vendor</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {bulkLineItems.map((item, index) => (
                        <tr key={item.id}>
                          <td className="px-3 py-2 font-semibold text-slate-600">
                            Item {index + 1}
                          </td>
                          <td className="px-3 py-2">
                            <p className="font-semibold text-slate-950">{item.itemName}</p>
                            <p className="mt-1 line-clamp-1 text-xs text-slate-500">
                              {item.itemDescription}
                            </p>
                          </td>
                          <td className="px-3 py-2">{item.quantity}</td>
                          <td className="px-3 py-2">{money(item.unitPrice, item.currency)}</td>
                          <td className="px-3 py-2">{money(item.originalTotal, item.currency)}</td>
                          <td className="px-3 py-2">
                            <LineItemLink productUrl={item.productUrl} compact />
                          </td>
                          <td className="px-3 py-2">
                            {item.fxRateToAed.toFixed(4)}
                            <p className="text-xs text-slate-500">{item.exchangeRateDate}</p>
                          </td>
                          <td className="px-3 py-2 font-semibold">
                            {money(item.aedTotal, "AED")}
                          </td>
                          <td className="px-3 py-2">{item.vendorName || "Not provided"}</td>
                        </tr>
                      ))}
                    </tbody>
                    <tfoot className="bg-slate-50">
                      <tr>
                        <td className="px-3 py-2 font-bold text-slate-950" colSpan={7}>
                          Total converted value
                        </td>
                        <td className="px-3 py-2 font-bold text-slate-950">
                          {money(bulkTotalAed, "AED")}
                        </td>
                        <td />
                      </tr>
                    </tfoot>
                      </table>
                    </div>
                  </>
                ) : null}
              </div>
            </div>
          ) : null}
          <div className="md:col-span-2 xl:col-span-3">
            <Field label="Attachments">
              <input
                className={inputClass()}
                multiple
                type="file"
                onChange={(event) =>
                  setAttachments(buildAttachmentReferences(event.target.files, "request"))
                }
              />
            </Field>
          </div>
        </div>
      </section>

      <section className={classNames(panelClass, "min-w-0 p-4 sm:p-5")}>
        <div className="mb-5 flex items-center gap-2">
          <FileText className="h-5 w-5 text-emerald-700" />
          <h2 className="text-lg font-bold text-slate-950">Vendor details</h2>
        </div>
        <div className="grid min-w-0 gap-4 md:grid-cols-2 xl:grid-cols-3">
          <Field label="Contact person">
            <TextInput value={vendorContact} onChange={(event) => setVendorContact(event.target.value)} />
          </Field>
          <Field label="Company name">
            <TextInput value={vendorCompany} onChange={(event) => setVendorCompany(event.target.value)} />
          </Field>
          <Field label="TRN number">
            <TextInput value={trnNumber} onChange={(event) => setTrnNumber(event.target.value)} />
          </Field>
          <Field label="Trade license">
            <TextInput value={tradeLicense} onChange={(event) => setTradeLicense(event.target.value)} />
          </Field>
          <Field label="VAT registration">
            <TextInput value={vatRegistration} onChange={(event) => setVatRegistration(event.target.value)} />
          </Field>
          <Field label="Owner document">
            <TextInput value={ownerDocument} onChange={(event) => setOwnerDocument(event.target.value)} />
          </Field>
          <Field label="Website link">
            <TextInput value={websiteLink} onChange={(event) => setWebsiteLink(event.target.value)} />
          </Field>
          <Field label="E-brochure link or upload">
            <TextInput value={eBrochureLink} onChange={(event) => setEBrochureLink(event.target.value)} />
          </Field>
          <Field label="Business location">
            <TextInput value={businessLocation} onChange={(event) => setBusinessLocation(event.target.value)} />
          </Field>
          <div className="md:col-span-2 xl:col-span-3">
            <Field label="Bank details">
              <TextArea value={bankDetails} onChange={(event) => setBankDetails(event.target.value)} />
            </Field>
          </div>
        </div>
      </section>

      <div className="flex justify-stretch sm:justify-end">
        <IconButton
          disabled={bulkImporting || submitting}
          icon={<Plus className="h-4 w-4" />}
          type="submit"
        >
          {submitting ? "Submitting..." : "Submit to Mona"}
        </IconButton>
      </div>
    </form>
  );
}

function RequestsTable({
  requests,
  users,
  selectedRequestId,
  onSelect,
  currentUser,
  title = "All procurement requests",
  description = "Search, filter, and open requests to view stage actions.",
  showAssigneeFilter = true,
  hideFinancials = false,
}: {
  requests: ProcurementRequest[];
  users: UserProfile[];
  selectedRequestId?: string;
  onSelect: (id: string) => void;
  currentUser?: UserProfile;
  title?: string;
  description?: string;
  showAssigneeFilter?: boolean;
  hideFinancials?: boolean;
}) {
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("All");
  const [assignee, setAssignee] = useState("All");
  const [department, setDepartment] = useState("All");
  const [project, setProject] = useState("All");
  const [stage, setStage] = useState("All");
  const [minAmount, setMinAmount] = useState("");
  const [maxAmount, setMaxAmount] = useState("");
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");

  const departments = Array.from(new Set(requests.map((request) => request.department))).sort();
  const projects = Array.from(new Set(requests.map((request) => request.project))).sort();

  const filtered = requests.filter((request) => {
    const haystack = [
      request.id,
      request.employeeName,
      request.project,
      request.itemName,
      request.vendorName,
      ...getRequestLineItems(request).flatMap((item) => [
        item.itemName,
        item.vendorName,
        item.productUrl ?? "",
      ]),
    ]
      .join(" ")
      .toLowerCase();
    const amount = getRequestTotalAed(request);
    return (
      haystack.includes(search.toLowerCase()) &&
      (status === "All" || request.status === status) &&
      (assignee === "All" || request.assigneeId === assignee) &&
      (department === "All" || request.department === department) &&
      (project === "All" || request.project === project) &&
      (stage === "All" || request.stage === stage) &&
      (hideFinancials || !minAmount || amount >= Number(minAmount)) &&
      (hideFinancials || !maxAmount || amount <= Number(maxAmount)) &&
      (!fromDate || request.createdAt.slice(0, 10) >= fromDate) &&
      (!toDate || request.createdAt.slice(0, 10) <= toDate)
    );
  });

  const renderFilterControls = () => (
    <>
      <SelectInput value={status} onChange={(event) => setStatus(event.target.value)}>
        <option>All</option>
        {STATUSES.map((item) => (
          <option key={item} value={item}>
            {displayStatus(item)}
          </option>
        ))}
      </SelectInput>
      {showAssigneeFilter ? (
        <SelectInput value={assignee} onChange={(event) => setAssignee(event.target.value)}>
          <option value="All">All assignees</option>
          {users.map((user) => (
            <option key={user.id} value={user.id}>
              {user.name}
            </option>
          ))}
        </SelectInput>
      ) : null}
      <SelectInput value={department} onChange={(event) => setDepartment(event.target.value)}>
        <option>All</option>
        {departments.map((item) => (
          <option key={item}>{item}</option>
        ))}
      </SelectInput>
      <SelectInput value={project} onChange={(event) => setProject(event.target.value)}>
        <option value="All">All projects</option>
        {projects.map((item) => (
          <option key={item}>{item}</option>
        ))}
      </SelectInput>
      <SelectInput value={stage} onChange={(event) => setStage(event.target.value)}>
        <option value="All">All stages</option>
        {WORKFLOW_STAGES.map((item) => (
          <option key={item.key} value={item.key}>
            {item.label}
          </option>
        ))}
      </SelectInput>
      {!hideFinancials ? (
        <>
          <TextInput
            placeholder="Min amount"
            type="number"
            value={minAmount}
            onChange={(event) => setMinAmount(event.target.value)}
          />
          <TextInput
            placeholder="Max amount"
            type="number"
            value={maxAmount}
            onChange={(event) => setMaxAmount(event.target.value)}
          />
        </>
      ) : null}
      <TextInput
        type="date"
        value={fromDate}
        onChange={(event) => setFromDate(event.target.value)}
      />
      <TextInput
        type="date"
        value={toDate}
        onChange={(event) => setToDate(event.target.value)}
      />
    </>
  );

  return (
    <section className={classNames(panelClass, "min-w-0 overflow-hidden")}>
      <div className="border-b border-slate-200/80 p-5">
        <div className="flex flex-col gap-3 xl:flex-row xl:items-center xl:justify-between">
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <LayoutDashboard className="h-5 w-5 text-blue-700" />
              <h2 className="text-lg font-bold text-slate-950">{title}</h2>
            </div>
            <p className="mt-1 text-sm text-slate-500">
              {description}
            </p>
          </div>
          <div className="relative w-full xl:w-96">
            <Search className="pointer-events-none absolute left-3 top-3 h-4 w-4 text-slate-400" />
            <TextInput
              className="pl-9"
              placeholder="Search ID, employee, project, item, vendor"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
            />
          </div>
        </div>

        <details className="mt-4 rounded-xl border border-slate-200 bg-slate-50 p-3 md:hidden">
          <summary className="flex cursor-pointer list-none items-center justify-between gap-3 text-sm font-semibold text-slate-700">
            <span className="inline-flex items-center gap-2">
              <Filter className="h-4 w-4 text-blue-700" />
              Filters
            </span>
            <span className="text-xs text-slate-500">{filtered.length} shown</span>
          </summary>
          <div className="mt-3 grid gap-3">{renderFilterControls()}</div>
        </details>

        <div className="mt-4 hidden gap-3 md:grid md:grid-cols-2 xl:grid-cols-4 2xl:grid-cols-8">
          {renderFilterControls()}
        </div>
      </div>

      <div className="grid min-w-0 gap-3 p-3 md:hidden">
        {filtered.length === 0 ? (
          <div className={classNames(insetPanelClass, "p-4 text-center text-sm text-slate-500")}>
            No procurement requests match the current filters.
          </div>
        ) : (
          filtered.map((request) => {
            const blocked = currentUser ? isUserBlockedTask(request, currentUser) : false;
            const overdue = isRequestOverdue(request);
            const needsAttention = blocked || overdue;

            return (
              <button
                className={classNames(
                  "box-border min-w-0 w-full rounded-xl border p-3 text-left transition",
                  needsAttention
                    ? selectedRequestId === request.id
                      ? "border-red-300 bg-red-100"
                      : "border-red-200 bg-red-50"
                    : selectedRequestId === request.id
                      ? "border-blue-200 bg-blue-50"
                      : "border-slate-200 bg-white",
                )}
                key={`mobile-${request.id}`}
                onClick={() => onSelect(request.id)}
                type="button"
              >
                <div className="flex flex-col gap-2 min-[420px]:flex-row min-[420px]:items-start min-[420px]:justify-between">
                  <div className="min-w-0">
                    <p className="font-bold text-slate-950">{request.id}</p>
                    <p className="mt-1 truncate text-sm text-slate-500">
                      {request.employeeName} - {request.itemName}
                    </p>
                  </div>
                  <span className="min-w-0 min-[420px]:shrink-0">
                    <StatusBadge status={request.status} />
                  </span>
                </div>
                {overdue ? (
                  <div className="mt-2 inline-flex rounded-md border border-red-200 bg-white/70 px-2 py-1 text-xs font-semibold text-red-800">
                    Over {OVERDUE_REQUEST_HOURS}h without update
                  </div>
                ) : null}
                <div className="mt-3 grid gap-2 text-sm text-slate-600">
                  <div className="flex justify-between gap-3">
                    <span className="text-slate-500">Stage</span>
                    <span className="min-w-0 break-words text-right font-medium text-slate-800">
                      {WORKFLOW_STAGES.find((item) => item.key === request.stage)?.label}
                    </span>
                  </div>
                  <div className="flex justify-between gap-3">
                    <span className="text-slate-500">Assignee</span>
                    <span className="min-w-0 break-words text-right font-medium text-slate-800">
                      {getAssigneeName(request, users)}
                    </span>
                  </div>
                  <div className="flex justify-between gap-3">
                    <span className="text-slate-500">Project</span>
                    <span className="min-w-0 break-words text-right font-medium text-slate-800">
                      {request.project}
                    </span>
                  </div>
                  {!hideFinancials ? (
                    <div className="flex justify-between gap-3">
                      <span className="text-slate-500">Total AED</span>
                      <span className="min-w-0 break-words text-right font-semibold text-slate-900">
                        {money(getRequestTotalAed(request), "AED")}
                      </span>
                    </div>
                  ) : null}
                  <div className="flex justify-between gap-3">
                    <span className="text-slate-500">Invoice</span>
                    <span className="min-w-0 break-words text-right font-medium text-slate-800">
                      {request.invoice?.invoiceNumber ?? "Pending"}
                    </span>
                  </div>
                  <div className="rounded-lg bg-slate-50 p-2 text-slate-700">
                    {getPendingAction(request)}
                  </div>
                  <p className="text-xs text-slate-500">
                    Last updated {formatDateTime(request.updatedAt)}
                  </p>
                </div>
              </button>
            );
          })
        )}
      </div>

      <div className="hidden overflow-x-auto md:block">
        <table className={classNames("w-full border-collapse text-left text-sm", hideFinancials ? "min-w-[1080px]" : "min-w-[1220px]")}>
          <thead className="bg-slate-50/80 text-xs uppercase tracking-wide text-slate-500">
            <tr>
              <th className="px-4 py-3">Request</th>
              <th className="px-4 py-3">Project</th>
              <th className="px-4 py-3">Stage</th>
              <th className="px-4 py-3">Assignee</th>
              {!hideFinancials ? <th className="px-4 py-3">Total AED</th> : null}
              <th className="px-4 py-3">Status</th>
              <th className="px-4 py-3">Invoice</th>
              <th className="px-4 py-3">Pending action</th>
              <th className="px-4 py-3">Last updated</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {filtered.length === 0 ? (
              <tr>
                <td className="px-4 py-8 text-center text-sm text-slate-500" colSpan={hideFinancials ? 8 : 9}>
                  No procurement requests match the current filters.
                </td>
              </tr>
            ) : (
              filtered.map((request) => {
                const blocked = currentUser ? isUserBlockedTask(request, currentUser) : false;
                const overdue = isRequestOverdue(request);
                const needsAttention = blocked || overdue;

                return (
                <tr
                  className={classNames(
                    "cursor-pointer transition hover:bg-blue-50/60",
                    needsAttention
                      ? selectedRequestId === request.id
                        ? "bg-red-100 hover:bg-red-100"
                        : "bg-red-50 hover:bg-red-100"
                      : selectedRequestId === request.id
                        ? "bg-blue-50"
                        : "bg-white",
                  )}
                  key={request.id}
                  onClick={() => onSelect(request.id)}
                >
                  <td className="px-4 py-3">
                    <p className="font-bold text-slate-950">{request.id}</p>
                    <p className="mt-1 max-w-52 truncate text-slate-500">
                      {request.employeeName} - {request.itemName}
                    </p>
                    {overdue ? (
                      <p className="mt-1 text-xs font-semibold text-red-700">
                        Over {OVERDUE_REQUEST_HOURS}h without update
                      </p>
                    ) : null}
                  </td>
                  <td className="px-4 py-3">{request.project}</td>
                  <td className="px-4 py-3">
                    {WORKFLOW_STAGES.find((item) => item.key === request.stage)?.label}
                  </td>
                  <td className="px-4 py-3">{getAssigneeName(request, users)}</td>
                  {!hideFinancials ? (
                    <td className="px-4 py-3 font-semibold">
                    {money(getRequestTotalAed(request), "AED")}
                    <p className="mt-1 text-xs font-normal text-slate-500">
                      {getRequestItemCount(request)} item(s)
                    </p>
                  </td>
                  ) : null}
                  <td className="px-4 py-3">
                    <StatusBadge status={request.status} />
                  </td>
                  <td className="px-4 py-3">
                    {request.invoice ? (
                      <span className="text-emerald-700">{request.invoice.invoiceNumber}</span>
                    ) : (
                      <span className="text-amber-700">Pending</span>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    <span className={classNames("line-clamp-2 max-w-72", needsAttention ? "font-semibold text-red-800" : "text-slate-600")}>
                      {getPendingAction(request)}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-slate-500">
                    {formatDateTime(request.updatedAt)}
                  </td>
                </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </section>
  );
}

function ActionPanel({
  request,
  currentUser,
  state,
  onTransition,
}: {
  request: ProcurementRequest;
  currentUser: UserProfile;
  state: ProcurementState;
  onTransition: (requestId: string, action: Parameters<typeof transitionRequest>[3]) => void;
}) {
  const fieldPrefix = useId();
  const [comment, setComment] = useState("");
  const [declineReason, setDeclineReason] = useState("");
  const [invoiceNumber, setInvoiceNumber] = useState(request.invoice?.invoiceNumber ?? "");
  const [invoiceAmount, setInvoiceAmount] = useState(
    request.invoice?.invoiceAmount ?? getRequestTotalAed(request),
  );
  const [invoiceDate, setInvoiceDate] = useState(request.invoice?.invoiceDate ?? dubaiDateKey());
  const [invoiceFile, setInvoiceFile] = useState(request.invoice?.uploadedInvoiceFile ?? "");
  const [paymentTerms, setPaymentTerms] = useState<(typeof PAYMENT_TERMS)[number]>(
    request.invoice?.paymentTerms ?? "COD",
  );
  const [financeNotes, setFinanceNotes] = useState(request.invoice?.financeNotes ?? "");
  const [deliveryStatus, setDeliveryStatus] = useState<LogisticsDetails["deliveryStatus"]>(
    request.logistics?.deliveryStatus ?? "Order placed",
  );
  const [deliveryProvider, setDeliveryProvider] = useState(request.logistics?.provider ?? "");
  const [trackingNumber, setTrackingNumber] = useState(request.logistics?.trackingNumber ?? "");
  const [expectedDeliveryDate, setExpectedDeliveryDate] = useState(
    request.logistics?.expectedDeliveryDate ?? "",
  );
  const [lastCheckpoint, setLastCheckpoint] = useState(request.logistics?.lastCheckpoint ?? "");
  const [deliveryNotes, setDeliveryNotes] = useState(request.logistics?.notes ?? "");
  const actionNoteId = `${fieldPrefix}-action-note`;
  const declineReasonId = `${fieldPrefix}-decline-reason`;
  const invoiceNumberId = `${fieldPrefix}-invoice-number`;
  const invoiceAmountId = `${fieldPrefix}-invoice-amount`;
  const invoiceDateId = `${fieldPrefix}-invoice-date`;
  const paymentTermsId = `${fieldPrefix}-payment-terms`;
  const invoiceFileId = `${fieldPrefix}-invoice-file`;
  const financeNotesId = `${fieldPrefix}-finance-notes`;
  const deliveryStatusId = `${fieldPrefix}-delivery-status`;
  const deliveryProviderId = `${fieldPrefix}-delivery-provider`;
  const trackingNumberId = `${fieldPrefix}-tracking-number`;
  const expectedDeliveryDateId = `${fieldPrefix}-expected-delivery-date`;
  const lastCheckpointId = `${fieldPrefix}-last-checkpoint`;
  const deliveryNotesId = `${fieldPrefix}-delivery-notes`;

  const role = currentUser.role;
  const departmentReviewRole = getDepartmentReviewRole(request.department);
  const clearText = () => {
    setComment("");
    setDeclineReason("");
  };
  const canUse = (neededRole: Role) => role === neededRole;

  const invoicePayload = (): InvoiceDetails => ({
    invoiceNumber: invoiceNumber || `${request.id}-INV`,
    invoiceAmount,
    invoiceDate: invoiceDate || dubaiDateKey(),
    vendor: request.vendorName || request.vendor.companyName,
    uploadedInvoiceFile: invoiceFile || `${request.id.toLowerCase()}-invoice.pdf`,
    paymentTerms,
    financeNotes,
  });
  const logisticsPayload = (): LogisticsDetails => ({
    deliveryStatus,
    provider: deliveryProvider,
    trackingNumber,
    expectedDeliveryDate,
    lastCheckpoint,
    notes: deliveryNotes,
  });
  const logisticsFields = (
    <div className="grid gap-3">
      <Field label="Delivery status" htmlFor={deliveryStatusId}>
        <SelectInput
          id={deliveryStatusId}
          value={deliveryStatus}
          onChange={(event) =>
            setDeliveryStatus(event.target.value as LogisticsDetails["deliveryStatus"])
          }
        >
          {DELIVERY_STATUSES.map((status) => (
            <option key={status}>{status}</option>
          ))}
        </SelectInput>
      </Field>
      <Field label="Logistics provider" htmlFor={deliveryProviderId}>
        <TextInput
          id={deliveryProviderId}
          placeholder="Enter provider name"
          value={deliveryProvider}
          onChange={(event) => setDeliveryProvider(event.target.value)}
        />
      </Field>
      <Field label="Tracking number" htmlFor={trackingNumberId}>
        <TextInput
          id={trackingNumberId}
          placeholder="Enter tracking number"
          value={trackingNumber}
          onChange={(event) => setTrackingNumber(event.target.value)}
        />
      </Field>
      <Field label="Expected delivery date" htmlFor={expectedDeliveryDateId}>
        <TextInput
          id={expectedDeliveryDateId}
          type="date"
          value={expectedDeliveryDate}
          onInput={(event) => setExpectedDeliveryDate(event.currentTarget.value)}
          onChange={(event) => setExpectedDeliveryDate(event.target.value)}
        />
      </Field>
      <Field label="Last checkpoint" htmlFor={lastCheckpointId}>
        <TextInput
          id={lastCheckpointId}
          placeholder="Enter latest delivery update"
          value={lastCheckpoint}
          onChange={(event) => setLastCheckpoint(event.target.value)}
        />
      </Field>
      <Field label="Delivery notes" htmlFor={deliveryNotesId}>
        <TextArea
          id={deliveryNotesId}
          placeholder="Add delivery notes"
          value={deliveryNotes}
          onChange={(event) => setDeliveryNotes(event.target.value)}
        />
      </Field>
    </div>
  );

  return (
    <div className={classNames(panelClass, "min-w-0 p-4 sm:p-5")}>
      <div className="flex items-center gap-2">
        <SlidersHorizontal className="h-5 w-5 text-blue-700" />
        <h3 className="text-base font-bold text-slate-950">Stage actions</h3>
      </div>
      <p className="mt-2 text-sm text-slate-500">{getPendingAction(request)}</p>

      <div className="mt-4 grid gap-3">
        <Field label="Action note / clarification message" htmlFor={actionNoteId}>
          <TextArea
            id={actionNoteId}
            placeholder="Write a comment, clarification message, or internal note"
            value={comment}
            onChange={(event) => setComment(event.target.value)}
          />
        </Field>

        {request.status === "Mona Review" && canUse("Mona") ? (
          <div className="grid gap-2 sm:flex sm:flex-wrap">
            <IconButton
              icon={<CheckCircle2 className="h-4 w-4" />}
              onClick={() => {
                onTransition(request.id, { type: "mona-approve", comment });
                clearText();
              }}
              variant="success"
            >
              Approve
            </IconButton>
            <IconButton
              disabled={!comment.trim()}
              icon={<AlertCircle className="h-4 w-4" />}
              onClick={() => {
                onTransition(request.id, { type: "mona-clarify", comment });
                clearText();
              }}
              variant="secondary"
            >
              Send back
            </IconButton>
          </div>
        ) : null}

        {request.status === "Rashid Review" && canUse("Rashid") ? (
          <div className="grid gap-3">
            <Field label="Decline reason" htmlFor={declineReasonId} required>
              <TextArea
                id={declineReasonId}
                placeholder="Required when declining"
                value={declineReason}
                onChange={(event) => setDeclineReason(event.target.value)}
              />
            </Field>
            <div className="grid gap-2 sm:flex sm:flex-wrap">
              <IconButton
                icon={<CheckCircle2 className="h-4 w-4" />}
                onClick={() => {
                  onTransition(request.id, { type: "rashid-approve", comment });
                  clearText();
                }}
                variant="success"
              >
                Approve
              </IconButton>
              <IconButton
                disabled={!declineReason.trim()}
                icon={<XCircle className="h-4 w-4" />}
                onClick={() => {
                  onTransition(request.id, {
                    type: "rashid-decline",
                    declineReason,
                  });
                  clearText();
                }}
                variant="danger"
              >
                Decline
              </IconButton>
            </div>
          </div>
        ) : null}

        {["Dr. Majed Review", "Amro Review", "Rashid Auto Approved"].includes(request.status) &&
        departmentReviewRole &&
        request.stage === "dr-majed" &&
        canUse(departmentReviewRole) ? (
          <div className="grid gap-3">
            <div className="rounded-xl border border-blue-100 bg-blue-50 p-3 text-sm text-blue-900">
              {departmentReviewRole} reviews this department request. Approval decisions remain
              with Rashid.
            </div>
            <IconButton
              icon={<CheckCircle2 className="h-4 w-4" />}
              onClick={() => {
                onTransition(request.id, { type: "department-review", comment });
                clearText();
              }}
              variant="success"
            >
              Complete review
            </IconButton>
          </div>
        ) : null}

        {((request.status === "Edlyn Confirmation") ||
          (request.status === "Rashid Auto Approved" && request.stage === "edlyn")) &&
        canUse("Edlyn") ? (
          <div className="grid gap-2 sm:flex sm:flex-wrap">
            <IconButton
              icon={<ShoppingCart className="h-4 w-4" />}
              onClick={() => {
                onTransition(request.id, { type: "edlyn-confirm", comment });
                clearText();
              }}
            >
              Confirm item details
            </IconButton>
            <IconButton
              disabled={!comment.trim()}
              icon={<AlertCircle className="h-4 w-4" />}
              onClick={() => {
                onTransition(request.id, {
                  type: "edlyn-request-clarification",
                  comment,
                });
                clearText();
              }}
              variant="secondary"
            >
              Request clarification
            </IconButton>
          </div>
        ) : null}

        {request.status === "Purchase in Progress" && canUse("Edlyn") ? (
          <div className={classNames(insetPanelClass, "grid gap-3 p-3")}>
            <div className="grid gap-3">
              <Field label="Invoice number" htmlFor={invoiceNumberId}>
                <TextInput id={invoiceNumberId} placeholder="INV-001" value={invoiceNumber} onChange={(event) => setInvoiceNumber(event.target.value)} />
              </Field>
              <Field label="Invoice amount" htmlFor={invoiceAmountId}>
                <TextInput id={invoiceAmountId} type="number" value={invoiceAmount} onChange={(event) => setInvoiceAmount(Number(event.target.value))} />
              </Field>
              <Field label="Invoice date" htmlFor={invoiceDateId}>
                <TextInput
                  id={invoiceDateId}
                  type="date"
                  value={invoiceDate}
                  onInput={(event) => setInvoiceDate(event.currentTarget.value)}
                  onChange={(event) => setInvoiceDate(event.target.value)}
                />
              </Field>
              <Field label="Payment terms" htmlFor={paymentTermsId}>
                <SelectInput id={paymentTermsId} value={paymentTerms} onChange={(event) => setPaymentTerms(event.target.value as typeof paymentTerms)}>
                  {PAYMENT_TERMS.map((term) => (
                    <option key={term}>{term}</option>
                  ))}
                </SelectInput>
              </Field>
              <Field label="Uploaded invoice file name" htmlFor={invoiceFileId}>
                <TextInput
                  id={invoiceFileId}
                  placeholder="invoice-pr-001.pdf"
                  value={invoiceFile}
                  onChange={(event) => setInvoiceFile(event.target.value)}
                />
              </Field>
            </div>
            <div className="grid gap-2 sm:flex sm:flex-wrap">
              <IconButton
                icon={<Upload className="h-4 w-4" />}
                onClick={() => {
                  onTransition(request.id, {
                    type: "edlyn-upload-invoice",
                    invoice: invoicePayload(),
                    comment,
                  });
                  clearText();
                }}
              >
                Upload invoice
              </IconButton>
              <IconButton
                disabled={!comment.trim()}
                icon={<AlertCircle className="h-4 w-4" />}
                onClick={() => {
                  onTransition(request.id, {
                    type: "edlyn-request-clarification",
                    comment,
                  });
                  clearText();
                }}
                variant="secondary"
              >
                Request clarification
              </IconButton>
            </div>
          </div>
        ) : null}

        {request.status === "Aileen Finance Review" && canUse("Aileen") ? (
          <div className="grid gap-3">
            <Field label="Finance notes" htmlFor={financeNotesId}>
              <TextArea
                id={financeNotesId}
                placeholder="Add finance documentation notes"
                value={financeNotes}
                onChange={(event) => setFinanceNotes(event.target.value)}
              />
            </Field>
            <IconButton
              icon={<CircleDollarSign className="h-4 w-4" />}
              onClick={() => {
                onTransition(request.id, {
                  type: "aileen-clear-invoice",
                  financeNotes,
                });
                setFinanceNotes("");
              }}
              variant="success"
            >
              Clear invoice
            </IconButton>
          </div>
        ) : null}

        {["Invoice Cleared", "Edlyn Order Confirmation"].includes(request.status) &&
        canUse("Edlyn") ? (
          <div className={classNames(insetPanelClass, "grid gap-3 p-3")}>
            {request.invoice?.financeNotes ? (
              <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-3 text-sm text-emerald-900">
                <p className="font-semibold">Finance note</p>
                <p className="mt-1 whitespace-pre-line">{request.invoice.financeNotes}</p>
              </div>
            ) : null}
            {logisticsFields}
            <IconButton
              icon={<Send className="h-4 w-4" />}
              onClick={() => {
                onTransition(request.id, {
                  type: "edlyn-start-delivery-tracking",
                  logistics: logisticsPayload(),
                  comment,
                });
                clearText();
              }}
            >
              Confirm order and track delivery
            </IconButton>
          </div>
        ) : null}

        {request.status === "Delivery Tracking" && canUse("Edlyn") ? (
          <div className={classNames(insetPanelClass, "grid gap-3 p-3")}>
            {logisticsFields}
            <div className="grid gap-2 sm:flex sm:flex-wrap">
              <IconButton
                icon={<Truck className="h-4 w-4" />}
                onClick={() =>
                  onTransition(request.id, {
                    type: "edlyn-update-logistics",
                    logistics: logisticsPayload(),
                    comment,
                  })
                }
                variant="secondary"
              >
                Update logistics
              </IconButton>
              <IconButton
                icon={<PackageCheck className="h-4 w-4" />}
                onClick={() => onTransition(request.id, { type: "edlyn-receive-item", comment })}
                variant="success"
              >
                Mark item received
              </IconButton>
            </div>
          </div>
        ) : null}

        {request.status === "Order Confirmed" && canUse("Edlyn") ? (
          <IconButton
            icon={<PackageCheck className="h-4 w-4" />}
            onClick={() => onTransition(request.id, { type: "edlyn-receive-item", comment })}
            variant="success"
          >
            Mark item received
          </IconButton>
        ) : null}

        {request.status === "Item Received" && canUse("Aileen") ? (
          <IconButton
            icon={<CheckCircle2 className="h-4 w-4" />}
            onClick={() => onTransition(request.id, { type: "aileen-close", comment })}
            variant="success"
          >
            Close case
          </IconButton>
        ) : null}

        {role === "Admin" ? (
          <div className="rounded-xl border border-dashed border-slate-300 p-3 text-sm text-slate-600">
            Admin can view the full request and reassign it from the Admin view.
          </div>
        ) : null}

        {!isClosed(request.status) &&
        !(
          (request.status === "Mona Review" && canUse("Mona")) ||
          (request.status === "Rashid Review" && canUse("Rashid")) ||
          (["Dr. Majed Review", "Amro Review", "Rashid Auto Approved"].includes(
            request.status,
          ) &&
            departmentReviewRole &&
            request.stage === "dr-majed" &&
            canUse(departmentReviewRole)) ||
          (["Edlyn Confirmation", "Purchase in Progress", "Invoice Cleared", "Edlyn Order Confirmation", "Delivery Tracking", "Order Confirmed"].includes(
            request.status,
          ) &&
            canUse("Edlyn")) ||
          (request.status === "Rashid Auto Approved" &&
            request.stage === "edlyn" &&
            canUse("Edlyn")) ||
          (["Aileen Finance Review", "Item Received"].includes(request.status) &&
            canUse("Aileen"))
        ) ? (
          <div className={classNames(insetPanelClass, "p-3 text-sm text-slate-600")}>
            Switch to the assigned role to complete this pending action. Current assignee:{" "}
            <strong>{getAssigneeName(request, state.users)}</strong>.
          </div>
        ) : null}
      </div>
    </div>
  );
}

function RequestDetails({
  request,
  state,
  currentUser,
  onTransition,
}: {
  request?: ProcurementRequest;
  state: ProcurementState;
  currentUser: UserProfile;
  onTransition: (requestId: string, action: Parameters<typeof transitionRequest>[3]) => void;
}) {
  if (!request) {
    return (
      <section className={classNames(panelClass, "min-w-0 p-8 text-center text-slate-500")}>
        Select a request to see workflow details.
      </section>
    );
  }

  const logs = state.auditLogs.filter((log) => log.requestId === request.id);
  const latestDecline = logs.find((log) => log.declineReason);
  const lineItems = getRequestLineItems(request);

  return (
    <section className="grid min-w-0 gap-5">
      <div className={classNames(panelClass, "min-w-0 p-4 sm:p-5")}>
        <div className="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <h2 className="text-xl font-bold text-slate-950 sm:text-2xl">{request.id}</h2>
              <StatusBadge status={request.status} />
            </div>
            <p className="mt-2 text-sm text-slate-500">
              {request.employeeName} requested {request.itemName} for{" "}
              {request.department} / {request.project}.
            </p>
          </div>
          <div className="grid gap-1 text-sm text-slate-600 xl:text-right">
            <span>
              Assigned to <strong>{getAssigneeName(request, state.users)}</strong>
            </span>
            <span>Last updated {formatDateTime(request.updatedAt)}</span>
          </div>
        </div>

        <div className="mt-5">
          <WorkflowTracker request={request} />
        </div>
      </div>

      <div className="grid min-w-0 gap-5 xl:grid-cols-[minmax(0,1.35fr)_minmax(280px,0.65fr)]">
        <div className="grid min-w-0 gap-5">
          <div className={classNames(panelClass, "min-w-0 p-4 sm:p-5")}>
            <h3 className="text-base font-bold text-slate-950">Request details</h3>
            <div className="mt-4 grid gap-4 md:grid-cols-2">
              <Detail label="Item" value={request.itemName} />
              <Detail label="Line items" value={String(lineItems.length)} />
              <Detail label="Project" value={request.project} />
              <Detail label="Request amount" value={money(request.estimatedAmount, request.currency)} />
              <Detail label="Total AED" value={money(getRequestTotalAed(request), "AED")} />
              <Detail label="Priority" value={request.priority} />
              <Detail label="Required by" value={formatDate(request.requiredByDate)} />
              <Detail label="Vendor" value={request.vendorName || "Optional"} />
              <Detail label="FX source" value={request.exchangeRateSource || "Not provided"} />
              <div className="md:col-span-2">
                <Detail label="Description" value={request.itemDescription} />
              </div>
              <div className="md:col-span-2">
                <Detail label="Reason" value={request.reasonForPurchase} />
              </div>
            </div>
          </div>

          <div className={classNames(panelClass, "min-w-0 p-4 sm:p-5")}>
            <h3 className="text-base font-bold text-slate-950">Line items</h3>
            <div className="mt-4 grid gap-3 md:hidden">
              {lineItems.map((item, index) => (
                <div className={classNames(insetPanelClass, "p-3")} key={item.id}>
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="text-xs font-semibold uppercase text-slate-500">
                        Item {index + 1}
                      </p>
                      <p className="mt-1 font-semibold text-slate-950">{item.itemName}</p>
                    </div>
                    <span className="shrink-0 text-sm font-bold text-slate-950">
                      {money(item.aedTotal, "AED")}
                    </span>
                  </div>
                  <p className="mt-2 text-sm text-slate-600">{item.itemDescription}</p>
                  <div className="mt-3 grid grid-cols-2 gap-2 text-sm">
                    <Detail label="Qty" value={String(item.quantity)} />
                    <Detail label="Unit price" value={money(item.unitPrice, item.currency)} />
                    <Detail label="Original total" value={money(item.originalTotal, item.currency)} />
                    <Detail label="FX to AED" value={item.fxRateToAed.toFixed(4)} />
                    <div className="col-span-2">
                      <Detail label="Vendor" value={item.vendorName || "Not provided"} />
                    </div>
                    <div className="col-span-2">
                      <LineItemLink productUrl={item.productUrl} />
                    </div>
                  </div>
                </div>
              ))}
            </div>
            <div className="mt-4 hidden overflow-x-auto rounded-xl border border-slate-200 md:block">
              <table className="w-full min-w-[1040px] text-left text-sm">
                <thead className="bg-slate-50 text-xs uppercase text-slate-500">
                  <tr>
                    <th className="px-3 py-2">No.</th>
                    <th className="px-3 py-2">Item</th>
                    <th className="px-3 py-2">Qty</th>
                    <th className="px-3 py-2">Unit price</th>
                    <th className="px-3 py-2">Original total</th>
                    <th className="px-3 py-2">Product link</th>
                    <th className="px-3 py-2">FX to AED</th>
                    <th className="px-3 py-2">AED total</th>
                    <th className="px-3 py-2">Vendor</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {lineItems.map((item, index) => (
                    <tr key={item.id}>
                      <td className="px-3 py-2 font-semibold text-slate-600">
                        Item {index + 1}
                      </td>
                      <td className="px-3 py-2">
                        <p className="font-semibold text-slate-950">{item.itemName}</p>
                        <p className="mt-1 line-clamp-1 text-xs text-slate-500">
                          {item.itemDescription}
                        </p>
                      </td>
                      <td className="px-3 py-2">{item.quantity}</td>
                      <td className="px-3 py-2">{money(item.unitPrice, item.currency)}</td>
                      <td className="px-3 py-2">{money(item.originalTotal, item.currency)}</td>
                      <td className="px-3 py-2">
                        <LineItemLink productUrl={item.productUrl} compact />
                      </td>
                      <td className="px-3 py-2">
                        {item.fxRateToAed.toFixed(4)}
                        <p className="text-xs text-slate-500">{item.exchangeRateDate}</p>
                      </td>
                      <td className="px-3 py-2 font-semibold">
                        {money(item.aedTotal, "AED")}
                      </td>
                      <td className="px-3 py-2">{item.vendorName || "Not provided"}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          <div className="grid min-w-0 gap-5 lg:grid-cols-3">
            <div className={classNames(panelClass, "min-w-0 p-4 sm:p-5")}>
              <h3 className="text-base font-bold text-slate-950">Vendor profile</h3>
              <div className="mt-4 grid gap-3 text-sm">
                <Detail label="Contact person" value={request.vendor.contactPerson || "Not provided"} />
                <Detail label="Company" value={request.vendor.companyName || request.vendorName || "Not provided"} />
                <Detail label="TRN" value={request.vendor.trnNumber || "Not provided"} />
                <Detail label="Trade license" value={request.vendor.tradeLicense || "Not provided"} />
                <Detail label="VAT registration" value={request.vendor.vatRegistration || "Not provided"} />
                <Detail label="Bank details" value={request.vendor.bankDetails || "Not provided"} />
                <Detail label="Location" value={request.vendor.businessLocation || "Not provided"} />
              </div>
            </div>

            <div className={classNames(panelClass, "min-w-0 p-4 sm:p-5")}>
              <h3 className="text-base font-bold text-slate-950">Invoice documentation</h3>
              {request.invoice ? (
                <div className="mt-4 grid gap-3 text-sm">
                  <Detail label="Invoice number" value={request.invoice.invoiceNumber} />
                  <Detail label="Amount" value={money(request.invoice.invoiceAmount, "AED")} />
                  <Detail label="Invoice date" value={formatDate(request.invoice.invoiceDate)} />
                  <Detail label="Payment terms" value={request.invoice.paymentTerms} />
                  <Detail label="Uploaded file" value={request.invoice.uploadedInvoiceFile} />
                  <Detail label="Finance notes" value={request.invoice.financeNotes || "No notes"} />
                </div>
              ) : (
                <div className="mt-4 rounded-xl border border-amber-200 bg-amber-50 p-3 text-sm text-amber-800">
                  Invoice is pending upload by Procure.
                </div>
              )}
            </div>

            <div className={classNames(panelClass, "min-w-0 p-4 sm:p-5")}>
              <h3 className="text-base font-bold text-slate-950">Logistics tracking</h3>
              {request.logistics ? (
                <div className="mt-4 grid gap-3 text-sm">
                  <Detail label="Delivery status" value={request.logistics.deliveryStatus} />
                  <Detail label="Provider" value={request.logistics.provider || "Not provided"} />
                  <Detail label="Tracking number" value={request.logistics.trackingNumber || "Not provided"} />
                  <Detail label="Expected delivery" value={request.logistics.expectedDeliveryDate ? formatDate(request.logistics.expectedDeliveryDate) : "Not provided"} />
                  <Detail label="Last checkpoint" value={request.logistics.lastCheckpoint || "Not provided"} />
                  <Detail label="Notes" value={request.logistics.notes || "No notes"} />
                </div>
              ) : (
                <div className={classNames(insetPanelClass, "mt-4 p-3 text-sm text-slate-600")}>
                  Delivery tracking starts after finance clears the invoice.
                </div>
              )}
            </div>
          </div>

          {latestDecline ? (
            <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-900">
              <strong>Decline reason:</strong> {latestDecline.declineReason}
            </div>
          ) : null}
        </div>

        <ActionPanel
          currentUser={currentUser}
          key={`${request.id}-${request.status}-${request.updatedAt}-${currentUser.id}`}
          onTransition={onTransition}
          request={request}
          state={state}
        />
      </div>

      <AuditTrail logs={logs} />
    </section>
  );
}

function Detail({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-xs font-semibold uppercase text-slate-500">{label}</p>
      <p className="mt-1 break-words text-sm text-slate-900">{value}</p>
    </div>
  );
}

function LineItemLink({
  productUrl,
  compact = false,
}: {
  productUrl?: string;
  compact?: boolean;
}) {
  if (!productUrl) {
    return compact ? (
      <span className="text-slate-400">Not provided</span>
    ) : (
      <Detail label="Product link" value="Not provided" />
    );
  }

  return (
    <div>
      {compact ? null : (
        <p className="text-xs font-semibold uppercase text-slate-500">Product link</p>
      )}
      <a
        className="mt-1 inline-flex max-w-full items-center gap-1 rounded-md border border-blue-100 bg-blue-50 px-2 py-1 text-sm font-semibold text-blue-700 hover:border-blue-200 hover:bg-blue-100"
        href={productUrl}
        rel="noopener noreferrer"
        target="_blank"
        title={productUrl}
      >
        <ExternalLink className="h-3.5 w-3.5 shrink-0" />
        <span className="truncate">{compact ? "Open link" : productUrl}</span>
      </a>
    </div>
  );
}

function AuditTrail({ logs }: { logs: AuditLog[] }) {
  return (
    <div className={classNames(panelClass, "min-w-0 p-4 sm:p-5")}>
      <div className="flex items-center gap-2">
        <History className="h-5 w-5 text-slate-700" />
        <h3 className="text-base font-bold text-slate-950">Audit trail</h3>
      </div>
      <div className="mt-4 grid gap-3">
        {logs.length === 0 ? (
          <p className="text-sm text-slate-500">No audit entries yet.</p>
        ) : (
          logs.map((log) => (
            <div className="rounded-xl border border-slate-200 bg-slate-50/60 p-3" key={log.id}>
              <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
                <p className="font-semibold text-slate-950">{log.action}</p>
                <p className="text-xs text-slate-500">{formatDateTime(log.dateTime)}</p>
              </div>
              <p className="mt-1 text-sm text-slate-600">
                {log.userName}: {displayStatus(log.previousStatus)} to {displayStatus(log.newStatus)}
              </p>
              {log.assignedPerson ? (
                <p className="mt-1 text-xs text-slate-500">Assigned person: {log.assignedPerson}</p>
              ) : null}
              {log.comment ? <p className="mt-2 text-sm text-slate-700">{log.comment}</p> : null}
              {log.declineReason ? (
                <p className="mt-2 text-sm text-red-700">Reason: {log.declineReason}</p>
              ) : null}
              {log.uploadedInvoiceReference ? (
                <p className="mt-2 text-sm text-blue-700">
                  Invoice: {log.uploadedInvoiceReference}
                </p>
              ) : null}
            </div>
          ))
        )}
      </div>
    </div>
  );
}

function NotificationsCenter({
  currentUser,
  state,
  onOpenRequest,
  onRead,
  onRunReminder,
}: {
  currentUser: UserProfile;
  state: ProcurementState;
  onOpenRequest: (requestId: string | null | undefined, notificationId: string) => void;
  onRead: (id: string) => void;
  onRunReminder: () => void;
}) {
  const notifications = state.notifications.filter(
    (notification) => notification.userId === currentUser.id,
  );

  return (
    <section className={classNames(panelClass, "overflow-hidden")}>
      <div className="flex flex-col gap-3 border-b border-slate-200 p-5 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="flex items-center gap-2">
            <Bell className="h-5 w-5 text-blue-700" />
            <h2 className="text-lg font-bold text-slate-950">Notification center</h2>
          </div>
          <p className="mt-1 text-sm text-slate-500">
            Internal alerts now, with Asana, email, and Slack hooks prepared later.
          </p>
        </div>
        <IconButton
          icon={<Clock className="h-4 w-4" />}
          onClick={onRunReminder}
          variant="secondary"
        >
          Run 3 PM reminders
        </IconButton>
      </div>
      <div className="grid gap-3 p-5">
        {notifications.length === 0 ? (
          <p className="text-sm text-slate-500">No notifications yet.</p>
        ) : (
          notifications.map((notification) => (
            <NotificationItem
              key={notification.id}
              notification={notification}
              users={state.users}
              onOpenRequest={onOpenRequest}
              onRead={onRead}
            />
          ))
        )}
      </div>
    </section>
  );
}

function NotificationItem({
  notification,
  users,
  onOpenRequest,
  onRead,
}: {
  notification: NotificationRecord;
  users: UserProfile[];
  onOpenRequest: (requestId: string | null | undefined, notificationId: string) => void;
  onRead: (id: string) => void;
}) {
  const openNotification = () =>
    onOpenRequest(notification.requestId, notification.id);

  return (
    <div
      aria-label={notification.requestId ? `Open ${notification.requestId}` : "Open dashboard"}
      className={classNames(
        "rounded-xl border p-4 text-left transition hover:border-blue-300 hover:bg-blue-50/70 focus:outline-none focus:ring-2 focus:ring-blue-500",
        notification.read ? "border-slate-200 bg-white" : "border-blue-200 bg-blue-50",
      )}
      onClick={openNotification}
      onKeyDown={(event) => {
        if (event.key === "Enter" || event.key === " ") {
          event.preventDefault();
          openNotification();
        }
      }}
      role="button"
      tabIndex={0}
    >
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <p className="font-semibold text-slate-950">{notification.title}</p>
          <p className="mt-1 text-sm text-slate-600">{notification.body}</p>
          <p className="mt-2 text-xs text-slate-500">
            {notification.requestId ?? "Dashboard"} -{" "}
            {getUserById(users, notification.userId)?.name ?? "Unknown"} -{" "}
            {formatDateTime(notification.createdAt)}
          </p>
        </div>
        {!notification.read ? (
          <IconButton
            icon={<Check className="h-4 w-4" />}
            onClick={(event) => {
              event.stopPropagation();
              onRead(notification.id);
            }}
            variant="secondary"
          >
            Mark read
          </IconButton>
        ) : null}
      </div>
    </div>
  );
}

function rowsForExport(state: ProcurementState) {
  return state.requests.map((request) => ({
    ID: request.id,
    Employee: request.employeeName,
    Department: request.department,
    Project: request.project,
    Item: request.itemName,
    Vendor: request.vendorName,
    "Request amount": request.estimatedAmount,
    Currency: request.currency,
    "Total AED": getRequestTotalAed(request),
    "Line items": getRequestItemCount(request),
    "FX source": request.exchangeRateSource,
    "FX date": request.exchangeRateDate,
    Status: displayStatus(request.status),
    Stage: WORKFLOW_STAGES.find((stage) => stage.key === request.stage)?.label,
    Assignee: getAssigneeName(request, state.users),
    Invoice: request.invoice?.invoiceNumber ?? "Pending",
    "Delivery status": request.logistics?.deliveryStatus ?? "Not started",
    "Logistics provider": request.logistics?.provider ?? "",
    "Tracking number": request.logistics?.trackingNumber ?? "",
    "Expected delivery": request.logistics?.expectedDeliveryDate ?? "",
    "Pending action": getPendingAction(request),
    "Last updated": formatDateTime(request.updatedAt),
  }));
}

function lineItemRowsForExport(state: ProcurementState) {
  return state.requests.flatMap((request) =>
    getRequestLineItems(request).map((item, index) => ({
      "Request ID": request.id,
      "Line #": index + 1,
      Employee: request.employeeName,
      Department: request.department,
      Project: request.project,
      Item: item.itemName,
      Description: item.itemDescription,
      Quantity: item.quantity,
      "Unit price": item.unitPrice,
      Currency: item.currency,
      "Original total": item.originalTotal,
      "Product link": item.productUrl ?? "",
      "FX to AED": item.fxRateToAed,
      "AED total": item.aedTotal,
      Vendor: item.vendorName,
      "FX source": item.exchangeRateSource,
      "FX date": item.exchangeRateDate,
    })),
  );
}

function downloadBlob(content: BlobPart, filename: string, type: string) {
  const blob = new Blob([content], { type });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  link.click();
  URL.revokeObjectURL(url);
}

function SystemReadiness({
  hasSupabaseConfig,
  onClearWorkspace,
}: {
  hasSupabaseConfig: boolean;
  onClearWorkspace: () => void;
}) {
  const items = [
    {
      label: "Database",
      value: hasSupabaseConfig ? "Supabase configured" : "Browser workspace active",
      detail: hasSupabaseConfig
        ? "Requests can be wired to the Supabase project."
        : "Requests are stored in this browser until Supabase credentials are connected.",
      ready: hasSupabaseConfig,
    },
    {
      label: "Authentication",
      value: hasSupabaseConfig ? "Supabase Auth ready" : "Role workspace mode",
      detail: hasSupabaseConfig
        ? "Role records are prepared for Supabase Auth profiles."
        : "Use the active account selector while running this static build.",
      ready: hasSupabaseConfig,
    },
    {
      label: "Reminders",
      value: "3 PM reminder route prepared",
      detail: "Daily reminder delivery is available when hosted with server routes or Supabase schedules.",
      ready: true,
    },
  ];

  return (
    <div className={classNames(panelClass, "p-5")}>
      <div className="flex flex-col gap-3 xl:flex-row xl:items-start xl:justify-between">
        <div>
          <div className="flex items-center gap-2">
            <Shield className="h-5 w-5 text-blue-700" />
            <h3 className="text-base font-bold text-slate-950">System readiness</h3>
          </div>
          <p className="mt-1 text-sm text-slate-500">
            Operational checks for moving this workflow from browser storage into a hosted Supabase deployment.
          </p>
        </div>
        <IconButton
          icon={<RefreshCcw className="h-4 w-4" />}
          onClick={onClearWorkspace}
          variant="secondary"
        >
          Clear browser workspace
        </IconButton>
      </div>
      <div className="mt-4 grid gap-3 lg:grid-cols-3">
        {items.map((item) => (
          <div
            className={classNames(insetPanelClass, "p-4")}
            key={item.label}
          >
            <div className="flex items-center justify-between gap-3">
              <p className="text-xs font-semibold uppercase text-slate-500">
                {item.label}
              </p>
              <span
                className={classNames(
                  "rounded-md px-2 py-1 text-xs font-semibold",
                  item.ready
                    ? "bg-emerald-100 text-emerald-800"
                    : "bg-amber-100 text-amber-800",
                )}
              >
                {item.ready ? "Ready" : "Action needed"}
              </span>
            </div>
            <p className="mt-3 text-sm font-bold text-slate-950">{item.value}</p>
            <p className="mt-1 text-sm leading-6 text-slate-600">{item.detail}</p>
          </div>
        ))}
      </div>
    </div>
  );
}

function AdminPanel({
  state,
  setState,
  hasSupabaseConfig,
  onClearWorkspace,
}: {
  state: ProcurementState;
  setState: (updater: (state: ProcurementState) => ProcurementState) => void;
  hasSupabaseConfig: boolean;
  onClearWorkspace: () => void;
}) {
  const [requestId, setRequestId] = useState(state.requests[0]?.id ?? "");
  const [assigneeId, setAssigneeId] = useState(state.users[0]?.id ?? "");
  const [comment, setComment] = useState("");
  const [newProjectName, setNewProjectName] = useState("");

  const exportCsv = () => {
    const rows = rowsForExport(state);
    const headers = Object.keys(rows[0] ?? { ID: "" });
    const csv = [
      headers.join(","),
      ...rows.map((row) =>
        headers
          .map((header) => `"${String(row[header as keyof typeof row] ?? "").replaceAll('"', '""')}"`)
          .join(","),
      ),
    ].join("\n");
    downloadBlob(csv, "procurement-report.csv", "text/csv;charset=utf-8");
  };

  const exportExcel = async () => {
    const XLSX = await import("xlsx");
    const worksheet = XLSX.utils.json_to_sheet(rowsForExport(state));
    const itemWorksheet = XLSX.utils.json_to_sheet(lineItemRowsForExport(state));
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Procurement");
    XLSX.utils.book_append_sheet(workbook, itemWorksheet, "Line Items");
    XLSX.writeFile(workbook, "procurement-report.xlsx");
  };

  const updateUser = (userId: string, updates: Partial<UserProfile>) => {
    setState((current) => ({
      ...current,
      users: current.users.map((user) =>
        user.id === userId ? { ...user, ...updates } : user,
      ),
    }));
  };
  const addProjectOption = () => {
    const projectName = newProjectName.trim();

    if (!projectName) {
      return;
    }

    setState((current) => {
      const alreadyExists = current.projectOptions.some(
        (option) => option.toLowerCase() === projectName.toLowerCase(),
      );

      if (alreadyExists) {
        return current;
      }

      return {
        ...current,
        projectOptions: [...current.projectOptions, projectName],
      };
    });
    setNewProjectName("");
  };
  const removeProjectOption = (projectName: string) => {
    setState((current) => {
      if (current.projectOptions.length <= 1) {
        return current;
      }

      return {
        ...current,
        projectOptions: current.projectOptions.filter(
          (option) => option !== projectName,
        ),
      };
    });
  };

  return (
    <section className="grid min-w-0 gap-5">
      <SystemReadiness
        hasSupabaseConfig={hasSupabaseConfig}
        onClearWorkspace={onClearWorkspace}
      />

      <div className={classNames(panelClass, "min-w-0 p-4 sm:p-5")}>
        <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <Shield className="h-5 w-5 text-blue-700" />
              <h2 className="text-lg font-bold text-slate-950">Admin controls</h2>
            </div>
            <p className="mt-1 text-sm text-slate-500">
              Manage roles, export reports, view audit logs, and manually reassign work.
            </p>
          </div>
          <div className="grid gap-2 sm:flex sm:flex-wrap">
            <IconButton icon={<Download className="h-4 w-4" />} onClick={exportCsv} variant="secondary">
              CSV
            </IconButton>
            <IconButton icon={<FileSpreadsheet className="h-4 w-4" />} onClick={exportExcel} variant="secondary">
              Excel
            </IconButton>
          </div>
        </div>
      </div>

      <div className="grid min-w-0 gap-5 xl:grid-cols-2">
        <div className={classNames(panelClass, "min-w-0 p-4 sm:p-5")}>
          <div className="flex items-center gap-2">
            <UserCog className="h-5 w-5 text-slate-700" />
            <h3 className="text-base font-bold text-slate-950">Users and roles</h3>
          </div>
          <div className="mt-4 overflow-x-auto">
            <table className="w-full min-w-[640px] text-left text-sm">
              <thead className="text-xs uppercase text-slate-500">
                <tr>
                  <th className="py-2">User</th>
                  <th className="py-2">Role</th>
                  <th className="py-2">Department</th>
                  <th className="py-2">Active</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {state.users.map((user) => (
                  <tr key={user.id}>
                    <td className="py-3">
                      <p className="font-semibold text-slate-950">{user.name}</p>
                      <p className="text-xs text-slate-500">{user.email}</p>
                    </td>
                    <td className="py-3">
                      <SelectInput
                        value={user.role}
                        onChange={(event) =>
                          updateUser(user.id, { role: event.target.value as Role })
                        }
                      >
                        {ROLES.map((role) => (
                          <option key={role} value={role}>
                            {getRoleDisplayName(role)}
                          </option>
                        ))}
                      </SelectInput>
                    </td>
                    <td className="py-3">{user.department}</td>
                    <td className="py-3">
                      <input
                        checked={user.active}
                        className="h-4 w-4 accent-blue-700"
                        type="checkbox"
                        onChange={(event) => updateUser(user.id, { active: event.target.checked })}
                      />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <div className={classNames(panelClass, "min-w-0 p-4 sm:p-5")}>
          <div className="flex items-center gap-2">
            <SlidersHorizontal className="h-5 w-5 text-slate-700" />
            <h3 className="text-base font-bold text-slate-950">Project dropdown</h3>
          </div>
          <p className="mt-1 text-sm text-slate-500">
            These options appear on the procurement request form.
          </p>
          <div className="mt-4 flex flex-wrap gap-2">
            {state.projectOptions.map((projectName) => (
              <span
                className="inline-flex items-center gap-2 rounded-md border border-slate-200 bg-slate-50 px-3 py-2 text-sm font-semibold text-slate-700"
                key={projectName}
              >
                {projectName}
                <button
                  aria-label={`Remove ${projectName}`}
                  className="rounded text-slate-400 hover:text-red-600 disabled:cursor-not-allowed disabled:opacity-40"
                  disabled={state.projectOptions.length <= 1}
                  onClick={() => removeProjectOption(projectName)}
                  type="button"
                >
                  <XCircle className="h-4 w-4" />
                </button>
              </span>
            ))}
          </div>
          <div className="mt-4 grid gap-2 sm:grid-cols-[minmax(0,1fr)_auto]">
            <TextInput
              placeholder="Add project name"
              value={newProjectName}
              onChange={(event) => setNewProjectName(event.target.value)}
            />
            <IconButton
              disabled={!newProjectName.trim()}
              icon={<Plus className="h-4 w-4" />}
              onClick={addProjectOption}
              variant="secondary"
            >
              Add project
            </IconButton>
          </div>
        </div>

        <div className={classNames(panelClass, "min-w-0 p-4 sm:p-5")}>
          <div className="flex items-center gap-2">
            <ArrowRightLeft className="h-5 w-5 text-slate-700" />
            <h3 className="text-base font-bold text-slate-950">Manual reassignment</h3>
          </div>
          <div className="mt-4 grid gap-3">
            <SelectInput value={requestId} onChange={(event) => setRequestId(event.target.value)}>
              {state.requests.map((request) => (
                <option key={request.id} value={request.id}>
                  {request.id} - {request.itemName}
                </option>
              ))}
            </SelectInput>
            <SelectInput value={assigneeId} onChange={(event) => setAssigneeId(event.target.value)}>
              {state.users.map((user) => (
                <option key={user.id} value={user.id}>
                  {user.name} ({getRoleDisplayName(user.role)})
                </option>
              ))}
            </SelectInput>
            <TextArea placeholder="Reassignment reason" value={comment} onChange={(event) => setComment(event.target.value)} />
            <IconButton
              icon={<ArrowRightLeft className="h-4 w-4" />}
              onClick={() => {
                setState((current) =>
                  transitionRequest(current, requestId, "user-admin", {
                    type: "admin-reassign",
                    assigneeId,
                    comment,
                  }),
                );
                setComment("");
              }}
            >
              Reassign request
            </IconButton>
          </div>
        </div>
      </div>

      <AuditTrail logs={state.auditLogs} />
    </section>
  );
}

function ProcurementAssistant({
  state,
  setState,
  currentUser,
}: {
  state: ProcurementState;
  setState: (updater: (state: ProcurementState) => ProcurementState) => void;
  currentUser: UserProfile;
}) {
  const [question, setQuestion] = useState("");
  const messages = state.chatbotMessages.filter((message) => message.userId === currentUser.id);

  const ask = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const trimmed = question.trim();
    if (!trimmed) return;
    const answer = answerProcurementQuestion(trimmed, state, currentUser);
    const dateTime = nowIso();
    setState((current) => ({
      ...current,
      chatbotMessages: [
        ...current.chatbotMessages,
        {
          id: makeId("chat"),
          userId: currentUser.id,
          role: "user",
          content: trimmed,
          createdAt: dateTime,
        },
        {
          id: makeId("chat"),
          userId: currentUser.id,
          role: "assistant",
          content: answer,
          createdAt: dateTime,
        },
      ],
    }));
    setQuestion("");
  };

  const prompt = (value: string) => {
    setQuestion(value);
  };

  return (
    <aside className={classNames(panelClass, "min-w-0 overflow-hidden")}>
      <div className="border-b border-slate-200 p-4">
        <div className="flex items-center gap-2">
          <Bot className="h-5 w-5 text-purple-700" />
          <h2 className="text-base font-bold text-slate-950">Procurement Assistant</h2>
        </div>
        <p className="mt-1 text-sm text-slate-500">
          Procurement data answers for status, approvals, invoices, and requests over 24 hours.
        </p>
      </div>
      <div className="grid max-h-[460px] gap-3 overflow-y-auto p-4">
        {messages.length === 0 ? (
          <div className="rounded-xl border border-purple-100 bg-purple-50 p-3 text-sm text-purple-900">
            Ask: Which stage is request PR-102 in?
          </div>
        ) : (
          messages.map((message) => (
            <div
              className={classNames(
                "rounded-lg p-3 text-sm leading-6",
                message.role === "user"
                  ? "ml-8 bg-slate-900 text-white"
                  : "mr-8 border border-slate-200 bg-slate-50 text-slate-700",
              )}
              key={message.id}
            >
              <p className="whitespace-pre-line">{message.content}</p>
            </div>
          ))
        )}
      </div>
      <div className="flex gap-2 overflow-x-auto border-t border-slate-200 p-3">
        {[
          "Which requests are pending with Rashid?",
          "Which requests are pending with Amro?",
          "Which invoices are pending with Finance?",
          `Show me requests over ${OVERDUE_REQUEST_HOURS} hours.`,
          "Show all completed requests this month.",
        ].map((item) => (
          <button
            className="shrink-0 rounded-md border border-slate-200 px-2 py-1 text-xs font-medium text-slate-600 hover:bg-slate-50"
            key={item}
            onClick={() => prompt(item)}
            type="button"
          >
            {item}
          </button>
        ))}
      </div>
      <form className="grid gap-2 border-t border-slate-200 p-3 sm:grid-cols-[minmax(0,1fr)_auto]" onSubmit={ask}>
        <TextInput
          aria-label="Ask Procurement Assistant"
          className="min-w-0"
          placeholder="Ask about PR-102, invoices, approvals"
          value={question}
          onChange={(event) => setQuestion(event.target.value)}
        />
        <IconButton icon={<Send className="h-4 w-4" />} type="submit">
          Ask
        </IconButton>
      </form>
    </aside>
  );
}

function EmployeeRequestStatus({
  request,
  state,
  currentUser,
  onTransition,
}: {
  request?: ProcurementRequest;
  state: ProcurementState;
  currentUser: UserProfile;
  onTransition: (requestId: string, action: Parameters<typeof transitionRequest>[3]) => void;
}) {
  const [clarification, setClarification] = useState("");

  if (!request) {
    return (
      <section className={classNames(panelClass, "min-w-0 p-6 text-sm text-slate-500")}>
        Select a request to view its current status.
      </section>
    );
  }

  const edlynClarification = state.auditLogs
    .filter(
      (log) =>
        log.requestId === request.id &&
        ["Edlyn requested clarification", "Procure requested clarification"].includes(log.action) &&
        Boolean(log.comment?.trim()),
    )
    .sort((a, b) => new Date(b.dateTime).getTime() - new Date(a.dateTime).getTime())[0];
  const rashidRejection = state.auditLogs
    .filter(
      (log) =>
        log.requestId === request.id &&
        log.newStatus === "Rashid Declined" &&
        Boolean(log.declineReason?.trim()),
    )
    .sort((a, b) => new Date(b.dateTime).getTime() - new Date(a.dateTime).getTime())[0];

  return (
    <section className={classNames(panelClass, "min-w-0 p-4 sm:p-5")}>
      <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <h2 className="text-xl font-bold text-slate-950">{request.id}</h2>
            <StatusBadge status={request.status} />
          </div>
          <p className="mt-2 text-sm text-slate-500">
            {request.itemName} for {request.employeeName} in {request.department} / {request.project}
          </p>
        </div>
        <div className="grid gap-1 text-sm text-slate-600 lg:text-right">
          <span>
            Current owner: <strong>{getAssigneeName(request, state.users)}</strong>
          </span>
          <span>Last updated {formatDateTime(request.updatedAt)}</span>
        </div>
      </div>

      <div className="mt-5">
        <WorkflowTracker request={request} />
      </div>

      <div className="mt-5 grid min-w-0 gap-4 md:grid-cols-2 xl:grid-cols-4">
        <Detail label="Items" value={String(getRequestItemCount(request))} />
        <Detail label="Project" value={request.project} />
        <Detail label="Invoice" value={request.invoice?.invoiceNumber ?? "Pending"} />
        <Detail label="Required by" value={formatDate(request.requiredByDate)} />
        <Detail label="Pending action" value={getPendingAction(request)} />
      </div>

      {request.status === "Rashid Declined" ? (
        <div className="mt-5 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-900">
          <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
            <p className="font-semibold">Request rejected by Rashid</p>
            {rashidRejection ? (
              <p className="text-xs text-red-700">{formatDateTime(rashidRejection.dateTime)}</p>
            ) : null}
          </div>
          <p className="mt-2 whitespace-pre-line">
            {rashidRejection?.declineReason || "No rejection reason was recorded."}
          </p>
        </div>
      ) : null}

      {request.status === "Edlyn Clarification Requested" &&
      request.assigneeId === currentUser.id ? (
        <div className="mt-5 grid gap-3 rounded-xl border border-red-200 bg-red-50 p-4">
          <div>
            <p className="font-semibold text-red-950">Clarification needed by Procure</p>
            <p className="mt-1 text-sm text-red-800">
              Answer the item or price question here. The request will return directly to Procure.
            </p>
          </div>
          {edlynClarification?.comment ? (
            <div className="rounded-xl border border-red-200 bg-white p-3">
              <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
                <p className="text-sm font-semibold text-red-950">Message from Procure</p>
                <p className="text-xs text-red-700">
                  {formatDateTime(edlynClarification.dateTime)}
                </p>
              </div>
              <p className="mt-2 whitespace-pre-line text-sm text-slate-800">
                {edlynClarification.comment}
              </p>
            </div>
          ) : (
            <div className="rounded-xl border border-red-200 bg-white p-3 text-sm text-red-800">
              No written clarification note was found for this request.
            </div>
          )}
          <TextArea
            placeholder="Write your clarification for Procure"
            value={clarification}
            onChange={(event) => setClarification(event.target.value)}
          />
          <IconButton
            disabled={!clarification.trim()}
            icon={<Send className="h-4 w-4" />}
            onClick={() => {
              onTransition(request.id, {
                type: "employee-submit-edlyn-clarification",
                comment: clarification,
              });
              setClarification("");
            }}
          >
            Submit clarification
          </IconButton>
        </div>
      ) : null}
    </section>
  );
}

function EmployeePortal({
  state,
  currentUser,
  selectedRequestId,
  setSelectedRequestId,
  setState,
}: {
  state: ProcurementState;
  currentUser: UserProfile;
  selectedRequestId?: string;
  setSelectedRequestId: (id: string) => void;
  setState: (updater: (state: ProcurementState) => ProcurementState) => void;
}) {
  const employeeRequests = useMemo(
    () => getPersonalRequests(state, currentUser),
    [state, currentUser],
  );
  const selectedRequest =
    employeeRequests.find((request) => request.id === selectedRequestId) ??
    employeeRequests[0];

  return (
    <div className="grid min-w-0 gap-5">
      <section className={classNames(panelClass, "min-w-0 p-4 sm:p-5")}>
        <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
          <div className="min-w-0">
            <h2 className="text-xl font-bold text-slate-950">My procurement portal</h2>
            <p className="mt-1 text-sm text-slate-500">
              Submit a new request and track only your own procurement status.
            </p>
          </div>
          <div className="min-w-0 rounded-md border border-slate-200 bg-slate-50 px-3 py-2 text-sm font-semibold text-slate-700">
            {currentUser.name} - {getRoleDisplayName(currentUser.role)}
          </div>
        </div>
      </section>

      <RequestForm
        currentUser={currentUser}
        projectOptions={state.projectOptions}
        onSubmit={(draft) => {
          const nextId = nextRequestId(state.requests);
          setState((current) =>
            submitProcurementRequest(current, draft, currentUser.id),
          );
          setSelectedRequestId(nextId);
          return nextId;
        }}
      />

      <RequestsTable
        currentUser={currentUser}
        description="Private status view for requests submitted from your employee account."
        hideFinancials
        onSelect={setSelectedRequestId}
        requests={employeeRequests}
        selectedRequestId={selectedRequest?.id}
        showAssigneeFilter={false}
        title="My procurement status"
        users={state.users}
      />

      <EmployeeRequestStatus
        currentUser={currentUser}
        onTransition={(requestId, action) =>
          setState((current) => transitionRequest(current, requestId, currentUser.id, action))
        }
        request={selectedRequest}
        state={state}
      />
    </div>
  );
}

function Dashboard({
  state,
  currentUser,
  selectedRequestId,
  setSelectedRequestId,
  setState,
}: {
  state: ProcurementState;
  currentUser: UserProfile;
  selectedRequestId?: string;
  setSelectedRequestId: (id: string) => void;
  setState: (updater: (state: ProcurementState) => ProcurementState) => void;
}) {
  const visibleRequests = useMemo(
    () => getVisibleRequests(state, currentUser),
    [state, currentUser],
  );
  const selectedRequest =
    visibleRequests.find((request) => request.id === selectedRequestId) ??
    visibleRequests[0];
  const metrics = getMetrics(currentUser.role === "Admin" ? state.requests : visibleRequests);
  const blockedTasks = getUserBlockedTasks(state.requests, currentUser);
  const watchlistRequests = blockedTasks.length > 0 ? blockedTasks : getStuckRequests(state.requests);
  const showingPersonalBlockages = blockedTasks.length > 0;

  const metricCards = [
    {
      label: "Total requests",
      value: metrics.total,
      icon: <ClipboardList className="h-4 w-4" />,
      tone: "bg-slate-100 text-slate-700",
    },
    {
      label: "Pending approvals/reviews",
      value: metrics.pendingApprovals,
      icon: <Clock className="h-4 w-4" />,
      tone: "bg-amber-100 text-amber-700",
    },
    {
      label: "Approved requests",
      value: metrics.approved,
      icon: <CheckCircle2 className="h-4 w-4" />,
      tone: "bg-emerald-100 text-emerald-700",
    },
    {
      label: "Declined requests",
      value: metrics.declined,
      icon: <XCircle className="h-4 w-4" />,
      tone: "bg-red-100 text-red-700",
    },
    {
      label: "Completed",
      value: metrics.completed,
      icon: <PackageCheck className="h-4 w-4" />,
      tone: "bg-green-100 text-green-800",
    },
    {
      label: "Pending invoice",
      value: metrics.pendingInvoice,
      icon: <FileText className="h-4 w-4" />,
      tone: "bg-blue-100 text-blue-700",
    },
    {
      label: "Pending item receipt",
      value: metrics.pendingItemReceipt,
      icon: <ShoppingCart className="h-4 w-4" />,
      tone: "bg-cyan-100 text-cyan-800",
    },
    {
      label: "Average processing",
      value: `${metrics.averageProcessingTime.toFixed(1)}d`,
      icon: <Activity className="h-4 w-4" />,
      tone: "bg-purple-100 text-purple-700",
    },
    {
      label: `Over ${OVERDUE_REQUEST_HOURS} hours`,
      value: metrics.stuck,
      icon: <AlertCircle className="h-4 w-4" />,
      tone: "bg-orange-100 text-orange-700",
    },
  ];

  return (
    <div className="grid min-w-0 gap-5">
      <div className="grid min-w-0 gap-3 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-5">
        {metricCards.map((card) => (
          <DashboardMetric key={card.label} {...card} />
        ))}
      </div>

      <div className="grid min-w-0 gap-5 2xl:grid-cols-[minmax(0,1fr)_420px]">
        <div className="grid min-w-0 gap-5">
          <RequestsTable
            currentUser={currentUser}
            onSelect={setSelectedRequestId}
            requests={visibleRequests}
            selectedRequestId={selectedRequest?.id}
            users={state.users}
          />
          <RequestDetails
            currentUser={currentUser}
            onTransition={(requestId, action) =>
              setState((current) => transitionRequest(current, requestId, currentUser.id, action))
            }
            request={selectedRequest}
            state={state}
          />
        </div>
        <div className="grid min-w-0 gap-5 content-start">
          <ProcurementAssistant
            currentUser={currentUser}
            setState={setState}
            state={state}
          />
          <section className={classNames(panelClass, "min-w-0 p-4")}>
            <div className="flex items-center gap-2">
              <Filter className="h-5 w-5 text-slate-700" />
              <h2 className="text-base font-bold text-slate-950">Watchlist</h2>
            </div>
            <div className="mt-3 grid gap-2">
              {watchlistRequests.length === 0 ? (
                <div className="rounded-md border border-slate-200 bg-slate-50 p-3 text-sm text-slate-600">
                  No overdue tasks assigned to you.
                </div>
              ) : null}
              {watchlistRequests.map((request) => (
                <button
                  className={classNames(
                    "rounded-md border p-3 text-left text-sm",
                    showingPersonalBlockages
                      ? "border-red-200 bg-red-50 text-red-900"
                      : "border-orange-200 bg-orange-50 text-orange-900",
                  )}
                  key={request.id}
                  onClick={() => setSelectedRequestId(request.id)}
                  type="button"
                >
                  <strong>{request.id}</strong> has been over {OVERDUE_REQUEST_HOURS}h since{" "}
                  {formatDateTime(request.updatedAt)}
                  <span className="mt-1 block text-xs">
                    {showingPersonalBlockages ? "Overdue on you" : getAssigneeName(request, state.users)} -{" "}
                    {getPendingAction(request)}
                  </span>
                </button>
              ))}
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}

export default function Home() {
  const supabaseClient = useMemo(() => getSupabaseBrowserClient(), []);
  const [state, setState] = useState<ProcurementState>(initialState);
  const [browserStateLoaded, setBrowserStateLoaded] = useState(false);
  const [currentUserId, setCurrentUserId] = useState("user-admin");
  const [view, setView] = useState<View>("dashboard");
  const [selectedRequestId, setSelectedRequestId] = useState("PR-102");
  const [authStatus, setAuthStatus] = useState<AuthStatus>(
    hasSupabaseClientConfig ? "checking" : "missing-config",
  );
  const [authUser, setAuthUser] = useState<SignedInUser | null>(null);
  const [authError, setAuthError] = useState("");
  const [liveSyncStatus, setLiveSyncStatus] = useState<LiveSyncStatus>("idle");
  const [liveSyncError, setLiveSyncError] = useState("");
  const latestStateRef = useRef(state);

  useEffect(() => {
    if (typeof window === "undefined") return;
    let cancelled = false;
    window.queueMicrotask(() => {
      if (cancelled) return;
      setState(parseState(window.localStorage.getItem(STORAGE_KEY)));
      setBrowserStateLoaded(true);
    });
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (typeof window !== "undefined" && browserStateLoaded) {
      window.localStorage.setItem(STORAGE_KEY, serializeState(state));
    }
  }, [browserStateLoaded, state]);

  useEffect(() => {
    latestStateRef.current = state;
  }, [state]);

  useEffect(() => {
    if (!supabaseClient) {
      return;
    }

    let active = true;
    const handleAuthUser = (user: SupabaseAuthUser | null) => {
      if (!active) return;
      const signedInUser = user ? signedInUserFromSupabase(user) : null;

      setAuthUser(signedInUser);
      setAuthError("");

      if (!signedInUser) {
        setAuthStatus("signed-out");
        return;
      }

      if (!isAllowedEmail(signedInUser.email)) {
        setAuthStatus("blocked");
        setAuthError(`Use a Sulmi Google account (${allowedEmailDomains.map((domain) => `@${domain}`).join(", ")}).`);
        return;
      }

      setAuthStatus("signed-in");
    };

    void supabaseClient.auth.getSession().then(({ data }) => {
      handleAuthUser(data.session?.user ?? null);
    });
    const {
      data: { subscription },
    } = supabaseClient.auth.onAuthStateChange((_event, session) => {
      handleAuthUser(session?.user ?? null);
    });

    return () => {
      active = false;
      subscription.unsubscribe();
    };
  }, [supabaseClient]);

  useEffect(() => {
    if (authStatus !== "signed-in" || !authUser || !browserStateLoaded) {
      return;
    }

    const profile = getSignedInProfile(state, authUser);

    if (state.users.some((user) => user.id === profile.id)) {
      return;
    }

    let cancelled = false;
    window.queueMicrotask(() => {
      if (cancelled) return;
      setState((current) => {
        const currentProfile = getSignedInProfile(current, authUser);

        if (current.users.some((user) => user.id === currentProfile.id)) {
          return current;
        }

        return {
          ...current,
          users: [...current.users, currentProfile],
        };
      });
    });

    return () => {
      cancelled = true;
    };
  }, [authStatus, authUser, browserStateLoaded, state, state.users]);

  useEffect(() => {
    if (
      !supabaseClient ||
      authStatus !== "signed-in" ||
      !authUser ||
      !browserStateLoaded
    ) {
      return;
    }

    let cancelled = false;
    window.queueMicrotask(() => {
      if (cancelled) return;
      setLiveSyncStatus("loading");
      setLiveSyncError("");

      void (async () => {
        const { data, error } = await supabaseClient
          .from("procurement_app_state")
          .select("state")
          .eq("id", LIVE_STATE_ROW_ID)
          .maybeSingle();

        if (cancelled) return;

        if (error) {
          setLiveSyncStatus("error");
          setLiveSyncError(
            "Supabase workspace table is not ready. Apply supabase/schema.sql and refresh.",
          );
          return;
        }

        const remoteState = data?.state
          ? parseState(JSON.stringify(data.state))
          : latestStateRef.current;
        const profileHydratedState = stateWithSignedInProfile(remoteState, authUser);
        const hydratedState = applyLaunchCleanup(profileHydratedState);
        const cleanupApplied =
          hydratedState.maintenance?.launchCleanupVersion !==
          profileHydratedState.maintenance?.launchCleanupVersion;

        setState(hydratedState);

        if (!data?.state || cleanupApplied) {
          await supabaseClient.from("procurement_app_state").upsert({
            id: LIVE_STATE_ROW_ID,
            state: hydratedState,
            updated_by: authUser.id,
            updated_at: nowIso(),
          });
        }

        if (!cancelled) {
          setLiveSyncStatus("ready");
        }
      })();
    });

    return () => {
      cancelled = true;
    };
  }, [authStatus, authUser, browserStateLoaded, supabaseClient]);

  useEffect(() => {
    if (
      !supabaseClient ||
      authStatus !== "signed-in" ||
      !authUser ||
      liveSyncStatus !== "ready"
    ) {
      return;
    }

    const timeoutId = window.setTimeout(() => {
      void supabaseClient
        .from("procurement_app_state")
        .upsert({
          id: LIVE_STATE_ROW_ID,
          state,
          updated_by: authUser.id,
          updated_at: nowIso(),
        })
        .then(({ error }) => {
          if (error) {
            setLiveSyncStatus("error");
            setLiveSyncError(error.message);
          }
        });
    }, 500);

    return () => {
      window.clearTimeout(timeoutId);
    };
  }, [authStatus, authUser, liveSyncStatus, state, supabaseClient]);

  const signedInProfile =
    authStatus === "signed-in" && authUser
      ? getSignedInProfile(state, authUser)
      : null;
  const currentUser =
    signedInProfile ??
    state.users.find((user) => user.id === currentUserId) ??
    state.users[0];
  const isEmployee = currentUser.role === "Employee";
  const hasWorkflowRole = !["Employee", "Admin"].includes(currentUser.role);
  const usesPersonalDashboard =
    isEmployee || authStatus === "signed-in";
  const canSwitchRoles = authStatus === "local-dev";
  const isSignedIn = authStatus === "signed-in" || authStatus === "local-dev";
  const canUseLocalWorkspace = !isGithubPagesBuild && authStatus === "missing-config";
  const unread = state.notifications.filter(
    (notification) => !notification.read && notification.userId === currentUser.id,
  ).length;

  const signInWithGoogle = async () => {
    setAuthError("");

    if (!supabaseClient) {
      setAuthStatus("missing-config");
      setAuthError("Google sign-in needs Supabase Auth configuration first.");
      return;
    }

    const redirectTo =
      typeof window === "undefined"
        ? undefined
        : `${window.location.origin}${PUBLIC_BASE_PATH || ""}/`;
    const { error } = await supabaseClient.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo,
        queryParams: {
          hd: allowedEmailDomains[0] ?? "",
        },
      },
    });

    if (error) {
      setAuthError(error.message);
    }
  };

  const signOut = async () => {
    if (supabaseClient) {
      await supabaseClient.auth.signOut();
    }
    setAuthUser(null);
    setAuthStatus(supabaseClient ? "signed-out" : "missing-config");
    setAuthError("");
    setLiveSyncStatus("idle");
    setLiveSyncError("");
    setCurrentUserId("user-admin");
    setView("dashboard");
  };

  const navItems: Array<{ id: View; label: string; icon: ReactNode; hidden?: boolean }> =
    isEmployee
      ? [
          {
            id: "dashboard",
            label: "Employee portal",
            icon: <ClipboardList className="h-4 w-4" />,
          },
          { id: "notifications", label: "Notifications", icon: <Bell className="h-4 w-4" /> },
        ]
      : [
          {
            id: "dashboard",
            label: usesPersonalDashboard ? "My requests" : "Dashboard",
            icon: usesPersonalDashboard ? (
              <ClipboardList className="h-4 w-4" />
            ) : (
              <LayoutDashboard className="h-4 w-4" />
            ),
          },
          ...(hasWorkflowRole
            ? [
                {
                  id: "work-queue" as View,
                  label: "Work queue",
                  icon: <LayoutDashboard className="h-4 w-4" />,
                },
              ]
            : []),
          ...(currentUser.role === "Admin"
            ? [
                {
                  id: "company-dashboard" as View,
                  label: "Company dashboard",
                  icon: <LayoutDashboard className="h-4 w-4" />,
                },
              ]
            : []),
          { id: "new-request", label: "New request", icon: <Plus className="h-4 w-4" /> },
          { id: "notifications", label: "Notifications", icon: <Bell className="h-4 w-4" /> },
          {
            id: "admin",
            label: "Admin",
            icon: <Shield className="h-4 w-4" />,
            hidden: currentUser.role !== "Admin",
          },
        ];
  const visibleNavItems = navItems.filter((item) => !item.hidden);
  const viewCopy: Record<View, { title: string; subtitle: string }> = {
    dashboard: usesPersonalDashboard
      ? {
          title: "My procurement",
          subtitle: "Submit requests and track only your own procurement status.",
        }
      : {
          title: "Dashboard",
          subtitle: "Procurement performance, requests, approvals, and closures.",
        },
    "work-queue": {
      title: `${getRoleDisplayName(currentUser.role)} work queue`,
      subtitle: "Approvals, reviews, and procurement tasks assigned to your role.",
    },
    "company-dashboard": {
      title: "Company dashboard",
      subtitle: "Company-wide procurement performance, approvals, and closures.",
    },
    "new-request": {
      title: "New procurement request",
      subtitle: "Create a request for Mona review.",
    },
    notifications: {
      title: "Notifications",
      subtitle: "Internal alerts, reminders, and workflow updates.",
    },
    admin: {
      title: "Admin controls",
      subtitle: "Users, reassignment, exports, and audit visibility.",
    },
  };
  const activeView =
    currentUser.role === "Employee" &&
    (view === "new-request" ||
      view === "admin" ||
      view === "company-dashboard" ||
      view === "work-queue")
      ? "dashboard"
      : view;
  const currentViewCopy = viewCopy[activeView];

  const clearBrowserWorkspace = () => {
    if (
      !window.confirm(
        "Clear browser workspace data and reload the starter procurement records?",
      )
    ) {
      return;
    }
    setState(initialState);
    setSelectedRequestId("PR-102");
    window.localStorage.removeItem(STORAGE_KEY);
  };

  if (!isSignedIn) {
    return (
      <SignInScreen
        authError={authError}
        authStatus={authStatus}
        canUseLocalWorkspace={canUseLocalWorkspace}
        liveSyncStatus={liveSyncStatus}
        onSignIn={() => {
          void signInWithGoogle();
        }}
        onSignOut={() => {
          void signOut();
        }}
        onUseLocalWorkspace={() => {
          setAuthStatus("local-dev");
          setCurrentUserId("user-admin");
          setView("dashboard");
        }}
      />
    );
  }

  return (
    <main className="min-h-screen bg-[#f6f8fb] text-slate-900">
      <aside className="fixed inset-y-0 left-0 z-30 hidden w-72 flex-col border-r border-slate-200/80 bg-white lg:flex">
        <div className="flex h-[76px] items-center gap-3 border-b border-slate-200/80 px-5">
          <div className="flex h-11 w-32 shrink-0 items-center justify-center rounded-xl bg-black px-4 shadow-sm">
            <Image
              alt="SULMI"
              className="h-8 w-full object-contain"
              height={36}
              src={`${PUBLIC_BASE_PATH}/sulmi-logo.svg`}
              unoptimized
              width={130}
            />
          </div>
        </div>

        <div className="border-b border-slate-200/80 p-4">
          {!canSwitchRoles ? (
            <div className="grid gap-2">
              <div className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm font-semibold text-slate-700">
                {currentUser.name} - {getRoleDisplayName(currentUser.role)}
              </div>
              {authStatus === "signed-in" ? (
                <IconButton
                  icon={<LogOut className="h-4 w-4" />}
                  onClick={() => {
                    void signOut();
                  }}
                  variant="secondary"
                >
                  Sign out
                </IconButton>
              ) : null}
            </div>
          ) : (
            <div className="grid gap-1">
              <span className="text-xs font-semibold uppercase tracking-wide text-slate-400">
                Active account
              </span>
              <SelectInput
                aria-label="Signed in user"
                value={currentUser.id}
                onChange={(event) => {
                  const nextUser = state.users.find(
                    (user) => user.id === event.target.value,
                  );
                  setCurrentUserId(event.target.value);
                  if (nextUser?.role === "Employee") {
                    setView("dashboard");
                  }
                }}
              >
                {state.users.map((user) => (
                  <option key={user.id} value={user.id}>
                    {user.name} - {getRoleDisplayName(user.role)}
                  </option>
                ))}
              </SelectInput>
            </div>
          )}
        </div>

        <nav className="grid gap-1 p-3">
          {visibleNavItems.map((item) => (
            <button
              className={classNames(
                "inline-flex min-h-11 items-center gap-3 rounded-xl px-3 text-left text-sm font-semibold transition",
                activeView === item.id
                  ? "bg-blue-600 text-white shadow-sm shadow-blue-600/20"
                  : "text-slate-500 hover:bg-slate-50 hover:text-slate-900",
              )}
              key={item.id}
              onClick={() => setView(item.id)}
              type="button"
            >
              <span className="grid h-8 w-8 place-items-center rounded-lg bg-white/10">
                {item.icon}
              </span>
              <span className="min-w-0 flex-1">{item.label}</span>
              {item.id === "notifications" && unread ? (
                <span className="grid h-5 min-w-5 place-items-center rounded-full bg-red-500 px-1 text-xs text-white">
                  {unread}
                </span>
              ) : null}
            </button>
          ))}
        </nav>
      </aside>

      <div className="min-w-0 lg:pl-72">
        <header className="sticky top-0 z-20 border-b border-slate-200/80 bg-white/95 backdrop-blur">
          <div className="mx-auto flex max-w-[1680px] flex-col gap-3 px-3 py-3 sm:px-5 lg:h-[76px] lg:flex-row lg:items-center lg:justify-between lg:px-7 lg:py-0">
            <div className="flex min-w-0 items-center gap-3 lg:hidden">
              <div className="flex h-10 w-28 shrink-0 items-center justify-center rounded-xl bg-black px-3 shadow-sm">
                <Image
                  alt="SULMI"
                  className="h-7 w-full object-contain"
                  height={36}
                  src={`${PUBLIC_BASE_PATH}/sulmi-logo.svg`}
                  unoptimized
                  width={130}
                />
              </div>
              <div className="min-w-0">
                <h1 className="text-lg font-bold leading-tight text-slate-950">Procurement Workflow OS</h1>
                <p className="text-xs text-slate-500">Requests, approvals, purchasing, invoices, and closure</p>
              </div>
            </div>

            <div className="hidden min-w-0 lg:block">
              <h1 className="text-2xl font-bold tracking-tight text-slate-950">
                {currentViewCopy.title}
              </h1>
              <p className="mt-0.5 text-sm text-slate-500">
                {currentViewCopy.subtitle}
              </p>
            </div>

            <div className="flex min-w-0 flex-col gap-3 sm:flex-row sm:items-center">
              {!isEmployee && activeView !== "new-request" ? (
                <div className="hidden lg:block">
                  <IconButton
                    icon={<Plus className="h-4 w-4" />}
                    onClick={() => setView("new-request")}
                  >
                    New request
                  </IconButton>
                </div>
              ) : null}
              {!isEmployee ? (
                <button
                  className="relative hidden h-11 w-11 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-600 shadow-sm transition hover:bg-slate-50 lg:inline-flex"
                  onClick={() => setView("notifications")}
                  type="button"
                >
                  <Bell className="h-4 w-4" />
                  {unread ? (
                    <span className="absolute -right-1 -top-1 grid h-5 min-w-5 place-items-center rounded-full bg-red-500 px-1 text-xs font-bold text-white">
                      {unread}
                    </span>
                  ) : null}
                </button>
              ) : null}
              <div className="hidden items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-2 shadow-sm lg:flex">
                <span className="grid h-8 w-8 place-items-center rounded-full bg-blue-600 text-xs font-bold text-white">
                  {currentUser.name
                    .split(" ")
                    .map((part) => part[0])
                    .slice(0, 2)
                    .join("")}
                </span>
                <div className="min-w-0">
                  <p className="truncate text-sm font-semibold text-slate-900">{currentUser.name}</p>
                  <p className="text-xs text-slate-500">{getRoleDisplayName(currentUser.role)}</p>
                </div>
              </div>
              {authStatus === "signed-in" ? (
                <div className="hidden lg:block">
                  <IconButton
                    icon={<LogOut className="h-4 w-4" />}
                    onClick={() => {
                      void signOut();
                    }}
                    variant="secondary"
                  >
                    Sign out
                  </IconButton>
                </div>
              ) : null}
              <div className="min-w-0 lg:hidden">
                {!canSwitchRoles ? (
                  <div className="flex min-w-0 items-center gap-2">
                    <div className="min-w-0 flex-1 rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm font-semibold text-slate-700">
                      <span className="block truncate">{currentUser.name}</span>
                      <span className="block truncate text-xs font-medium text-slate-500">
                        {getRoleDisplayName(currentUser.role)}
                      </span>
                    </div>
                    {authStatus === "signed-in" ? (
                      <button
                        aria-label="Sign out"
                        className="grid h-11 w-11 shrink-0 place-items-center rounded-xl border border-slate-200 bg-white text-slate-600 shadow-sm transition hover:bg-slate-50"
                        onClick={() => {
                          void signOut();
                        }}
                        type="button"
                      >
                        <LogOut className="h-4 w-4" />
                      </button>
                    ) : null}
                  </div>
                ) : (
                  <SelectInput
                    aria-label="Signed in user"
                    value={currentUser.id}
                    onChange={(event) => {
                      const nextUser = state.users.find(
                        (user) => user.id === event.target.value,
                      );
                      setCurrentUserId(event.target.value);
                      if (nextUser?.role === "Employee") {
                        setView("dashboard");
                      }
                    }}
                  >
                    {state.users.map((user) => (
                      <option key={user.id} value={user.id}>
                        {user.name} - {getRoleDisplayName(user.role)}
                      </option>
                    ))}
                  </SelectInput>
                )}
              </div>
            </div>
          </div>

          <nav className="mx-auto flex max-w-[1680px] gap-2 overflow-x-auto px-3 pb-3 sm:px-5 lg:hidden">
            {visibleNavItems.map((item) => (
              <button
                className={classNames(
                  "inline-flex min-h-10 min-w-0 shrink-0 items-center justify-center gap-2 rounded-xl px-3 text-sm font-semibold transition",
                  activeView === item.id
                    ? "bg-blue-600 text-white shadow-sm shadow-blue-600/20"
                    : "bg-white text-slate-600 shadow-sm hover:bg-slate-50",
                )}
                key={item.id}
                onClick={() => setView(item.id)}
                type="button"
              >
                {item.icon}
                <span>{item.label}</span>
                {item.id === "notifications" && unread ? (
                  <span className="grid h-5 min-w-5 place-items-center rounded-full bg-red-500 px-1 text-xs text-white">
                    {unread}
                  </span>
                ) : null}
              </button>
            ))}
          </nav>
        </header>

        <div className="mx-auto grid max-w-[1680px] gap-5 px-3 py-4 sm:px-5 sm:py-5 lg:px-7 lg:py-7">
          {authStatus === "signed-in" && liveSyncStatus === "loading" ? (
            <div className="rounded-xl border border-blue-200 bg-blue-50 p-3 text-sm font-medium text-blue-800">
              Connecting to the live Supabase workspace...
            </div>
          ) : null}
          {authStatus === "signed-in" && liveSyncStatus === "error" ? (
            <div className="rounded-xl border border-red-200 bg-red-50 p-3 text-sm font-medium text-red-800">
              Live Supabase sync failed: {liveSyncError || "check Supabase schema and permissions."}
            </div>
          ) : null}
          {activeView === "dashboard" ? (
            usesPersonalDashboard ? (
              <EmployeePortal
                currentUser={currentUser}
                selectedRequestId={selectedRequestId}
                setSelectedRequestId={setSelectedRequestId}
                setState={setState}
                state={state}
              />
            ) : (
              <Dashboard
                currentUser={currentUser}
                selectedRequestId={selectedRequestId}
                setSelectedRequestId={setSelectedRequestId}
                setState={setState}
                state={state}
              />
            )
          ) : null}

          {activeView === "work-queue" && hasWorkflowRole ? (
            <Dashboard
              currentUser={currentUser}
              selectedRequestId={selectedRequestId}
              setSelectedRequestId={setSelectedRequestId}
              setState={setState}
              state={state}
            />
          ) : null}

          {activeView === "company-dashboard" && currentUser.role === "Admin" ? (
            <Dashboard
              currentUser={currentUser}
              selectedRequestId={selectedRequestId}
              setSelectedRequestId={setSelectedRequestId}
              setState={setState}
              state={state}
            />
          ) : null}

        {activeView === "new-request" ? (
          <RequestForm
            currentUser={currentUser}
            projectOptions={state.projectOptions}
            onSubmit={(draft) => {
              const nextId = nextRequestId(state.requests);
              setState((current) =>
                submitProcurementRequest(current, draft, currentUser.id),
              );
              setSelectedRequestId(nextId);
              setView("dashboard");
              return nextId;
            }}
          />
        ) : null}

        {activeView === "notifications" ? (
          <NotificationsCenter
            currentUser={currentUser}
            onOpenRequest={(requestId, notificationId) => {
              if (requestId) {
                setSelectedRequestId(requestId);
              }
              setState((current) => markNotificationRead(current, notificationId));
              setView("dashboard");
            }}
            onRead={(id) => setState((current) => markNotificationRead(current, id))}
            onRunReminder={() =>
              setState((current) => createDailyReminderNotifications(current))
            }
            state={state}
          />
        ) : null}

        {activeView === "admin" && currentUser.role === "Admin" ? (
          <AdminPanel
            hasSupabaseConfig={hasSupabaseClientConfig}
            onClearWorkspace={clearBrowserWorkspace}
            setState={setState}
            state={state}
          />
        ) : null}
        </div>
      </div>
    </main>
  );
}
