export const ROLES = [
  "Employee",
  "Mona",
  "Rashid",
  "Dr. Majed",
  "Amro",
  "Edlyn",
  "Aileen",
  "Admin",
] as const;

export type Role = (typeof ROLES)[number];

export const PROCURE_APPROVAL_EMAIL = "Procure@sulmi.ai";
export const FINANCE_APPROVAL_EMAIL = "finance@sulmi.ai";
export const OVERDUE_REQUEST_HOURS = 24;
export const LAUNCH_CLEANUP_VERSION = "team-launch-2026-06-26";
export const LAUNCH_CLEANUP_CUTOFF_ISO = "2026-06-26T08:30:00.000Z";
export const DAILY_REMINDER_ROLES = [
  "Mona",
  "Rashid",
  "Dr. Majed",
  "Amro",
  "Edlyn",
  "Aileen",
] as const satisfies readonly Role[];

export const ROLE_DISPLAY_NAMES: Record<Role, string> = {
  Employee: "Employee",
  Mona: "Mona",
  Rashid: "Rashid",
  "Dr. Majed": "Dr. Majed",
  Amro: "Amro",
  Edlyn: "Procure",
  Aileen: "Finance",
  Admin: "Admin",
};

export function getRoleDisplayName(role: Role) {
  return ROLE_DISPLAY_NAMES[role];
}

export const STATUSES = [
  "Draft",
  "Submitted",
  "Mona Review",
  "Rashid Review",
  "Rashid Auto Approved",
  "Rashid Declined",
  "Dr. Majed Review",
  "Amro Review",
  "Department Declined",
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
  "Cancellation Requested",
  "Cancelled",
  "Completed",
  "Sent Back for Clarification",
] as const;

export type RequestStatus = (typeof STATUSES)[number];

export type WorkflowStage =
  | "mona"
  | "rashid"
  | "dr-majed"
  | "edlyn"
  | "aileen";

export const WORKFLOW_STAGES: Array<{
  id: number;
  key: WorkflowStage;
  label: string;
  ownerRole: Role;
  ownerLabel?: string;
}> = [
  { id: 1, key: "mona", label: "Mona Review", ownerRole: "Mona" },
  {
    id: 2,
    key: "dr-majed",
    label: "Department Review",
    ownerRole: "Dr. Majed",
    ownerLabel: "Dr. Majed / Mona / Amro",
  },
  { id: 3, key: "rashid", label: "Rashid Approval", ownerRole: "Rashid" },
  {
    id: 4,
    key: "edlyn",
    label: "Procure Purchase and Item Confirmation",
    ownerRole: "Edlyn",
    ownerLabel: "Procure",
  },
  {
    id: 5,
    key: "aileen",
    label: "Finance Documentation",
    ownerRole: "Aileen",
    ownerLabel: "Finance",
  },
];

export const PAYMENT_TERMS = [
  "COD",
  "15 days credit",
  "30 days credit",
  "60 days credit",
  "90 days credit",
  "Bank transfer",
  "LC",
] as const;

export type PaymentTerm = (typeof PAYMENT_TERMS)[number];

export const PRIORITIES = ["Low", "Normal", "High", "Urgent"] as const;
export type Priority = (typeof PRIORITIES)[number];

export const DEPARTMENTS = [
  "Marketing",
  "Operations",
  "Engineering",
  "Sales",
  "Finance",
  "HR",
] as const;

export type Department = (typeof DEPARTMENTS)[number];

export const DEFAULT_PROJECT_OPTIONS = ["Beta", "Alpha", "Sira"] as const;

export const CURRENCIES = ["AED", "USD", "EUR", "GBP", "SAR", "INR", "Other"] as const;
export type Currency = (typeof CURRENCIES)[number];

export const DELIVERY_STATUSES = [
  "Not started",
  "Order placed",
  "In transit",
  "Out for delivery",
  "Delivered",
  "Delayed",
] as const;

export type DeliveryStatus = (typeof DELIVERY_STATUSES)[number];

export const LINE_ITEM_STATUSES = [
  "Pending",
  "Processing",
  "On hold",
  "Purchased",
  "Invoice uploaded",
  "Delivered",
  "Cancelled",
] as const;

export type LineItemStatus = (typeof LINE_ITEM_STATUSES)[number];

export const INVOICE_STATUSES = ["Pending Finance", "Cleared", "Replaced"] as const;
export type InvoiceStatus = (typeof INVOICE_STATUSES)[number];

type DepartmentReviewRole = "Dr. Majed" | "Mona" | "Amro";

const DR_MAJED_REVIEW_DEPARTMENTS = ["Operations", "Engineering"];
const MONA_REVIEW_DEPARTMENTS = ["Marketing"];
const AMRO_REVIEW_DEPARTMENTS = ["Sales"];

export function getDepartmentReviewRole(department: string): DepartmentReviewRole | null {
  if (DR_MAJED_REVIEW_DEPARTMENTS.includes(department)) {
    return "Dr. Majed";
  }

  if (MONA_REVIEW_DEPARTMENTS.includes(department)) {
    return "Mona";
  }

  if (AMRO_REVIEW_DEPARTMENTS.includes(department)) {
    return "Amro";
  }

  return null;
}

export function getDepartmentReviewStatus(
  department: string,
): "Dr. Majed Review" | "Mona Review" | "Amro Review" | null {
  const reviewRole = getDepartmentReviewRole(department);

  if (reviewRole === "Dr. Majed") return "Dr. Majed Review";
  if (reviewRole === "Mona") return "Mona Review";
  if (reviewRole === "Amro") return "Amro Review";

  return null;
}

export type UserProfile = {
  id: string;
  name: string;
  email: string;
  role: Role;
  department: string;
  active: boolean;
  slackUserId?: string;
  notificationsEnabled?: boolean;
  emailNotificationsEnabled?: boolean;
  slackNotificationsEnabled?: boolean;
  reminderNotificationsEnabled?: boolean;
};

export type AttachmentReference = {
  id: string;
  name: string;
  type: "request" | "vendor" | "invoice";
  path: string;
  uploadedAt: string;
};

export type VendorDetails = {
  contactPerson: string;
  companyName: string;
  trnNumber: string;
  tradeLicense: string;
  bankDetails: string;
  vatRegistration: string;
  ownerDocument: string;
  websiteLink: string;
  eBrochureLink: string;
  businessLocation: string;
};

export type InvoiceDetails = {
  id?: string;
  invoiceNumber: string;
  invoiceAmount: number;
  invoiceDate: string;
  vendor: string;
  lineItemIds?: string[];
  status?: InvoiceStatus;
  uploadedInvoiceFile: string;
  uploadedInvoiceFileSize?: number;
  uploadedInvoiceFileType?: string;
  uploadedInvoiceUploadedAt?: string;
  uploadedInvoiceStorageBucket?: string;
  uploadedInvoiceStoragePath?: string;
  uploadedInvoiceDataUrl?: string;
  paymentTerms: PaymentTerm;
  financeNotes: string;
  clearedAt?: string;
  replacedAt?: string;
  replacedById?: string;
};

export type LogisticsDetails = {
  deliveryStatus: DeliveryStatus;
  provider: string;
  trackingNumber: string;
  expectedDeliveryDate: string;
  lastCheckpoint: string;
  notes: string;
  updatedAt?: string;
};

export type ProcurementLineItem = {
  id: string;
  itemName: string;
  itemDescription: string;
  productUrl?: string;
  status?: LineItemStatus;
  holdReason?: string;
  invoiceIds?: string[];
  processedAt?: string;
  deliveredAt?: string;
  quantity: number;
  unitPrice: number;
  currency: string;
  originalTotal: number;
  fxRateToAed: number;
  aedTotal: number;
  vendorName: string;
  exchangeRateDate: string;
  exchangeRateSource: string;
};

export type LineItemClarification = {
  lineItemId: string;
  comment: string;
  createdAt: string;
  createdBy: string;
  createdByName: string;
};

export type ProcurementRequest = {
  id: string;
  employeeName: string;
  department: string;
  project: string;
  itemName: string;
  itemDescription: string;
  quantity: number;
  estimatedAmount: number;
  currency: string;
  vendorName: string;
  reasonForPurchase: string;
  priority: Priority;
  requiredByDate: string;
  attachments: AttachmentReference[];
  vendor: VendorDetails;
  lineItems: ProcurementLineItem[];
  estimatedAmountAed: number;
  exchangeRateSource: string;
  exchangeRateDate: string;
  invoice?: InvoiceDetails;
  invoices?: InvoiceDetails[];
  status: RequestStatus;
  stage: WorkflowStage;
  assigneeId: string;
  submittedById: string;
  previousResponsibleId?: string;
  edlynClarificationReturnStatus?: "Edlyn Confirmation" | "Purchase in Progress";
  procurePriceReviewReturnStatus?: "Edlyn Confirmation" | "Purchase in Progress";
  lineItemClarifications?: LineItemClarification[];
  logistics?: LogisticsDetails;
  cancellationReason?: string;
  cancelledAt?: string;
  cancelledById?: string;
  orderConfirmedAt?: string;
  itemReceivedAt?: string;
  completedAt?: string;
  createdAt: string;
  updatedAt: string;
};

export type AuditLog = {
  id: string;
  requestId: string;
  userId: string;
  userName: string;
  action: string;
  dateTime: string;
  previousStatus: RequestStatus;
  newStatus: RequestStatus;
  comment?: string;
  declineReason?: string;
  uploadedInvoiceReference?: string;
  assignedPerson?: string;
};

export type NotificationRecord = {
  id: string;
  userId: string;
  requestId?: string | null;
  title: string;
  body: string;
  type:
    | "assigned"
    | "approved"
    | "declined"
    | "invoice"
    | "finance"
    | "order"
    | "received"
    | "closed"
    | "reminder"
    | "system";
  read: boolean;
  createdAt: string;
};

export type OutboundNotificationChannel = "email" | "slack";
export type OutboundNotificationStatus = "queued" | "sent" | "failed" | "skipped";

export type OutboundNotificationLog = {
  id: string;
  notificationId: string;
  userId: string;
  requestId?: string | null;
  channel: OutboundNotificationChannel;
  eventType: NotificationRecord["type"];
  title: string;
  body: string;
  requesterName?: string;
  itemName?: string;
  totalAed?: number;
  project?: string;
  department?: string;
  stageLabel?: string;
  pendingAction?: string;
  status: OutboundNotificationStatus;
  attempts: number;
  createdAt: string;
  updatedAt: string;
  sentAt?: string;
  error?: string;
  providerMessageId?: string;
};

export type ChatbotMessage = {
  id: string;
  userId: string;
  role: "user" | "assistant";
  content: string;
  createdAt: string;
};

export type ProcurementState = {
  users: UserProfile[];
  requests: ProcurementRequest[];
  auditLogs: AuditLog[];
  notifications: NotificationRecord[];
  outboundNotifications: OutboundNotificationLog[];
  chatbotMessages: ChatbotMessage[];
  projectOptions: string[];
  maintenance?: {
    launchCleanupVersion?: string;
    launchCleanupAt?: string;
    launchCleanupRemovedRequests?: number;
  };
};

function latestTimestampValue(value?: string) {
  const time = value ? new Date(value).getTime() : 0;
  return Number.isFinite(time) ? time : 0;
}

function mergeUniqueById<T extends { id: string }>(
  remoteItems: T[],
  localItems: T[],
  chooseItem?: (remoteItem: T, localItem: T) => T,
) {
  const merged = new Map<string, T>();

  remoteItems.forEach((item) => {
    merged.set(item.id, item);
  });

  localItems.forEach((item) => {
    const existing = merged.get(item.id);
    merged.set(item.id, existing && chooseItem ? chooseItem(existing, item) : item);
  });

  return Array.from(merged.values());
}

function compareByDateDesc<T>(getDate: (item: T) => string | undefined) {
  return (left: T, right: T) =>
    latestTimestampValue(getDate(right)) - latestTimestampValue(getDate(left));
}

function chooseLatestRequest(
  remoteRequest: ProcurementRequest,
  localRequest: ProcurementRequest,
) {
  const remoteUpdatedAt = latestTimestampValue(remoteRequest.updatedAt);
  const localUpdatedAt = latestTimestampValue(localRequest.updatedAt);

  return localUpdatedAt >= remoteUpdatedAt ? localRequest : remoteRequest;
}

function isSameRequestIdentity(
  remoteRequest: ProcurementRequest,
  localRequest: ProcurementRequest,
) {
  return (
    remoteRequest.createdAt === localRequest.createdAt &&
    remoteRequest.submittedById === localRequest.submittedById
  );
}

function nextAvailableRequestId(usedIds: Set<string>) {
  let highest = 100;
  usedIds.forEach((id) => {
    const numeric = Number(id.replace("PR-", ""));
    if (Number.isFinite(numeric)) {
      highest = Math.max(highest, numeric);
    }
  });

  let next = highest + 1;
  let candidate = `PR-${next}`;
  while (usedIds.has(candidate)) {
    next += 1;
    candidate = `PR-${next}`;
  }
  usedIds.add(candidate);
  return candidate;
}

function mergeRequestsWithCollisionRecovery(
  remoteRequests: ProcurementRequest[],
  localRequests: ProcurementRequest[],
) {
  const merged = new Map<string, ProcurementRequest>();
  const usedIds = new Set<string>();
  const requestIdRemaps = new Map<string, string>();

  remoteRequests.forEach((request) => {
    merged.set(request.id, request);
    usedIds.add(request.id);
  });

  localRequests.forEach((request) => {
    const existing = merged.get(request.id);

    if (!existing) {
      merged.set(request.id, request);
      usedIds.add(request.id);
      return;
    }

    if (isSameRequestIdentity(existing, request)) {
      merged.set(request.id, chooseLatestRequest(existing, request));
      return;
    }

    const recoveredId = nextAvailableRequestId(usedIds);
    requestIdRemaps.set(request.id, recoveredId);
    merged.set(recoveredId, {
      ...request,
      id: recoveredId,
    });
  });

  return {
    requests: Array.from(merged.values()).sort(compareByDateDesc((request) => request.createdAt)),
    requestIdRemaps,
  };
}

function remapRequestReference<T extends { requestId?: string | null }>(
  items: T[],
  requestIdRemaps: Map<string, string>,
) {
  if (requestIdRemaps.size === 0) {
    return items;
  }

  return items.map((item) => {
    const requestId = item.requestId ? requestIdRemaps.get(item.requestId) : undefined;
    return requestId ? { ...item, requestId } : item;
  });
}

export function mergeProcurementStates(
  remoteState: ProcurementState,
  localState: ProcurementState,
): ProcurementState {
  const mergedRequests = mergeRequestsWithCollisionRecovery(
    remoteState.requests,
    localState.requests,
  );
  const localAuditLogs = remapRequestReference(
    localState.auditLogs,
    mergedRequests.requestIdRemaps,
  );
  const localNotifications = remapRequestReference(
    localState.notifications,
    mergedRequests.requestIdRemaps,
  );
  const localOutboundNotifications = remapRequestReference(
    localState.outboundNotifications ?? [],
    mergedRequests.requestIdRemaps,
  );

  return {
    ...remoteState,
    ...localState,
    users: mergeUniqueById(remoteState.users, localState.users),
    requests: mergedRequests.requests,
    auditLogs: mergeUniqueById(remoteState.auditLogs, localAuditLogs).sort(
      compareByDateDesc((auditLog) => auditLog.dateTime),
    ),
    notifications: mergeUniqueById(
      remoteState.notifications,
      localNotifications,
    ).sort(compareByDateDesc((notification) => notification.createdAt)),
    outboundNotifications: mergeUniqueById(
      remoteState.outboundNotifications ?? [],
      localOutboundNotifications,
      (remoteItem, localItem) =>
        latestTimestampValue(localItem.updatedAt) >= latestTimestampValue(remoteItem.updatedAt)
          ? localItem
          : remoteItem,
    ).sort(compareByDateDesc((notification) => notification.createdAt)),
    chatbotMessages: mergeUniqueById(
      remoteState.chatbotMessages,
      localState.chatbotMessages,
    ).sort(compareByDateDesc((message) => message.createdAt)),
    projectOptions: Array.from(
      new Set([
        ...localState.projectOptions,
        ...remoteState.projectOptions,
        ...DEFAULT_PROJECT_OPTIONS,
      ]),
    ),
    maintenance: {
      ...remoteState.maintenance,
      ...localState.maintenance,
    },
  };
}

export type RequestFieldPatch = Partial<
  Pick<
    ProcurementRequest,
    | "employeeName"
    | "department"
    | "project"
    | "itemName"
    | "itemDescription"
    | "quantity"
    | "estimatedAmount"
    | "currency"
    | "vendorName"
    | "reasonForPurchase"
    | "priority"
    | "requiredByDate"
  >
>;

export type DailyReminderEmail = {
  userId: string;
  name: string;
  role: Role;
  roleLabel: string;
  email: string;
  slackUserId?: string;
  notificationsEnabled: boolean;
  emailNotificationsEnabled: boolean;
  slackNotificationsEnabled: boolean;
  activeCount: number;
  overdueCount: number;
  activeRequestIds: string[];
  overdueRequestIds: string[];
  subject: string;
  text: string;
  html: string;
};

export type ProcurementRequestDraft = Omit<
  ProcurementRequest,
  | "id"
  | "status"
  | "stage"
  | "assigneeId"
  | "submittedById"
  | "previousResponsibleId"
  | "orderConfirmedAt"
  | "itemReceivedAt"
  | "completedAt"
  | "createdAt"
  | "updatedAt"
>;

export type WorkflowAction =
  | { type: "mona-approve"; comment?: string }
  | { type: "mona-clarify"; comment: string }
  | { type: "employee-resubmit-mona-clarification"; comment?: string; lineItems: ProcurementLineItem[] }
  | { type: "rashid-approve"; comment?: string }
  | { type: "rashid-decline"; declineReason: string }
  | { type: "dr-review"; comment?: string }
  | { type: "department-review"; comment?: string }
  | { type: "department-decline"; declineReason: string }
  | { type: "dr-majed-update-request"; comment?: string; fields: RequestFieldPatch; lineItems: ProcurementLineItem[] }
  | { type: "edlyn-confirm"; comment?: string; lineItems?: ProcurementLineItem[] }
  | {
      type: "edlyn-request-clarification";
      comment?: string;
      lineItemClarifications?: Array<{ lineItemId: string; comment: string }>;
    }
  | { type: "employee-submit-edlyn-clarification"; comment?: string; lineItems?: ProcurementLineItem[] }
  | {
      type: "edlyn-update-researched-prices";
      comment?: string;
      lineItems: ProcurementLineItem[];
      lineItemClarifications?: Array<{ lineItemId: string; comment: string }>;
    }
  | {
      type: "edlyn-update-line-items";
      comment?: string;
      lineItems: ProcurementLineItem[];
      lineItemClarifications?: Array<{ lineItemId: string; comment: string }>;
    }
  | { type: "edlyn-upload-invoice"; invoice: InvoiceDetails; comment?: string }
  | { type: "aileen-clear-invoice"; invoiceId?: string; financeNotes?: string }
  | { type: "edlyn-confirm-order"; comment?: string }
  | { type: "edlyn-start-delivery-tracking"; logistics?: LogisticsDetails; comment?: string }
  | { type: "edlyn-update-logistics"; logistics: LogisticsDetails; comment?: string }
  | { type: "edlyn-receive-item"; comment?: string }
  | { type: "employee-cancel-request"; cancellationReason: string }
  | { type: "edlyn-confirm-cancellation"; comment?: string }
  | { type: "staff-cancel-request"; cancellationReason: string }
  | { type: "aileen-close"; comment?: string }
  | { type: "admin-reassign"; assigneeId: string; comment?: string };

const emptyVendor: VendorDetails = {
  contactPerson: "",
  companyName: "",
  trnNumber: "",
  tradeLicense: "",
  bankDetails: "",
  vatRegistration: "",
  ownerDocument: "",
  websiteLink: "",
  eBrochureLink: "",
  businessLocation: "",
};

const emptyLogistics: LogisticsDetails = {
  deliveryStatus: "Not started",
  provider: "",
  trackingNumber: "",
  expectedDeliveryDate: "",
  lastCheckpoint: "",
  notes: "",
};

const AED_EXCHANGE_RATE_SOURCE = "AED base currency";
const DEFAULT_EXCHANGE_RATE_DATE = "2026-06-15";

export function roundMoney(value: number) {
  return Math.round((value + Number.EPSILON) * 100) / 100;
}

function isLineItemStatus(value: unknown): value is LineItemStatus {
  return LINE_ITEM_STATUSES.includes(value as LineItemStatus);
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}

function textValue(value: unknown, fallback = "") {
  return typeof value === "string" ? value : fallback;
}

function finiteNumberValue(value: unknown, fallback = 0) {
  const numberValue = typeof value === "number" ? value : Number(value);
  return Number.isFinite(numberValue) ? numberValue : fallback;
}

function defaultLineItemStatusForRequest(request: ProcurementRequest): LineItemStatus {
  if (request.status === "Completed" || request.status === "Item Received") {
    return "Delivered";
  }

  if (request.status === "Cancelled" || isDeclined(request.status)) {
    return "Cancelled";
  }

  if (request.invoice || (Array.isArray(request.invoices) && request.invoices.length > 0)) {
    return "Invoice uploaded";
  }

  if (
    [
      "Purchase in Progress",
      "Invoice Cleared",
      "Edlyn Order Confirmation",
      "Delivery Tracking",
      "Order Confirmed",
    ].includes(request.status)
  ) {
    return "Processing";
  }

  return "Pending";
}

function normalizeLineItem(
  item: unknown,
  fallbackStatus: LineItemStatus,
  fallbackId: string,
): ProcurementLineItem | null {
  if (!isRecord(item)) {
    return null;
  }

  const itemName = textValue(item.itemName).trim();
  const itemDescription = textValue(item.itemDescription).trim();
  if (!itemName && !itemDescription) {
    return null;
  }

  const quantity = Math.max(finiteNumberValue(item.quantity, 1), 1);
  const unitPrice = finiteNumberValue(item.unitPrice, 0);
  const originalTotal = finiteNumberValue(item.originalTotal, unitPrice * quantity);
  const aedTotal = finiteNumberValue(item.aedTotal, originalTotal);
  const currency = textValue(item.currency, "AED").trim() || "AED";
  const invoiceIds = Array.isArray(item.invoiceIds)
    ? item.invoiceIds.map(String).filter(Boolean)
    : undefined;

  return {
    id: textValue(item.id, fallbackId).trim() || fallbackId,
    itemName: itemName || "Untitled item",
    itemDescription,
    productUrl: textValue(item.productUrl),
    status: isLineItemStatus(item.status) ? item.status : fallbackStatus,
    holdReason: textValue(item.holdReason),
    processedAt: textValue(item.processedAt) || undefined,
    deliveredAt: textValue(item.deliveredAt) || undefined,
    quantity,
    unitPrice: roundMoney(unitPrice),
    currency,
    originalTotal: roundMoney(originalTotal),
    fxRateToAed: finiteNumberValue(item.fxRateToAed, currency === "AED" ? 1 : 0),
    aedTotal: roundMoney(aedTotal),
    vendorName: textValue(item.vendorName),
    exchangeRateDate: textValue(item.exchangeRateDate, DEFAULT_EXCHANGE_RATE_DATE),
    exchangeRateSource: textValue(
      item.exchangeRateSource,
      currency === "AED" ? AED_EXCHANGE_RATE_SOURCE : "Imported amount",
    ),
    invoiceIds,
  };
}

function isInvoiceStatus(value: unknown): value is InvoiceStatus {
  return INVOICE_STATUSES.includes(value as InvoiceStatus);
}

function normalizeInvoiceDetails(
  invoice: unknown,
  fallbackId: string,
  fallbackLineItemIds: string[] = [],
): InvoiceDetails | null {
  if (!isRecord(invoice)) {
    return null;
  }

  const invoiceNumber = textValue(invoice.invoiceNumber).trim();
  const uploadedInvoiceFile = textValue(invoice.uploadedInvoiceFile).trim();
  const invoiceAmount = finiteNumberValue(invoice.invoiceAmount, 0);
  if (!invoiceNumber && !uploadedInvoiceFile && invoiceAmount <= 0) {
    return null;
  }

  const lineItemIds = Array.isArray(invoice.lineItemIds)
    ? invoice.lineItemIds.map(String).filter(Boolean)
    : fallbackLineItemIds;
  const paymentTerms = PAYMENT_TERMS.includes(invoice.paymentTerms as PaymentTerm)
    ? (invoice.paymentTerms as PaymentTerm)
    : "COD";

  return {
    id: textValue(invoice.id, fallbackId).trim() || fallbackId,
    invoiceNumber: invoiceNumber || fallbackId,
    invoiceAmount: roundMoney(invoiceAmount),
    invoiceDate: textValue(invoice.invoiceDate, DEFAULT_EXCHANGE_RATE_DATE),
    vendor: textValue(invoice.vendor),
    lineItemIds,
    status: isInvoiceStatus(invoice.status)
      ? invoice.status
      : invoice.clearedAt
        ? "Cleared"
        : "Pending Finance",
    uploadedInvoiceFile,
    uploadedInvoiceFileSize: finiteNumberValue(invoice.uploadedInvoiceFileSize, 0) || undefined,
    uploadedInvoiceFileType: textValue(invoice.uploadedInvoiceFileType) || undefined,
    uploadedInvoiceUploadedAt: textValue(invoice.uploadedInvoiceUploadedAt) || undefined,
    uploadedInvoiceStorageBucket: textValue(invoice.uploadedInvoiceStorageBucket) || undefined,
    uploadedInvoiceStoragePath: textValue(invoice.uploadedInvoiceStoragePath) || undefined,
    uploadedInvoiceDataUrl: textValue(invoice.uploadedInvoiceDataUrl) || undefined,
    paymentTerms,
    financeNotes: textValue(invoice.financeNotes),
    clearedAt: textValue(invoice.clearedAt) || undefined,
    replacedAt: textValue(invoice.replacedAt) || undefined,
    replacedById: textValue(invoice.replacedById) || undefined,
  };
}

export function getRequestLineItems(request: ProcurementRequest) {
  const fallbackStatus = defaultLineItemStatusForRequest(request);

  if (Array.isArray(request.lineItems) && request.lineItems.length > 0) {
    const lineItems = request.lineItems
      .map((item, index) =>
        normalizeLineItem(item, fallbackStatus, `${request.id.toLowerCase()}-item-${index + 1}`),
      )
      .filter((item): item is ProcurementLineItem => Boolean(item));

    if (lineItems.length > 0) {
      return lineItems;
    }
  }

  const quantity = Number.isFinite(request.quantity) && request.quantity > 0 ? request.quantity : 1;
  const currency = request.currency || "AED";
  const originalTotal = roundMoney(Number(request.estimatedAmount || 0));
  const aedTotal = roundMoney(
    Number.isFinite(request.estimatedAmountAed)
      ? request.estimatedAmountAed
      : currency === "AED"
        ? originalTotal
        : originalTotal,
  );

  return [
    {
      id: `${request.id.toLowerCase()}-item-1`,
      itemName: request.itemName,
      itemDescription: request.itemDescription,
      productUrl: "",
      quantity,
      unitPrice: roundMoney(originalTotal / quantity),
      currency,
      originalTotal,
      fxRateToAed:
        originalTotal > 0 ? roundMoney(aedTotal / originalTotal) : 1,
      aedTotal,
      vendorName: request.vendorName,
      exchangeRateDate:
        request.exchangeRateDate || DEFAULT_EXCHANGE_RATE_DATE,
      exchangeRateSource:
        request.exchangeRateSource ||
        (currency === "AED" ? AED_EXCHANGE_RATE_SOURCE : "Legacy amount"),
      status: fallbackStatus,
      holdReason: "",
    },
  ];
}

export function getRequestInvoices(request: ProcurementRequest) {
  const lineItemIds = getRequestLineItems(request).map((item) => item.id);
  const invoices = Array.isArray(request.invoices)
    ? request.invoices
    : request.invoice
      ? [request.invoice]
      : [];

  return invoices
    .filter((invoice) => invoice && invoice.status !== "Replaced")
    .map((invoice, index) =>
      normalizeInvoiceDetails(
        invoice,
        `${request.id.toLowerCase()}-invoice-${index + 1}`,
        lineItemIds,
      ),
    )
    .filter((invoice): invoice is InvoiceDetails => Boolean(invoice));
}

export function getPendingFinanceInvoices(request: ProcurementRequest) {
  return getRequestInvoices(request).filter((invoice) => !invoice.clearedAt);
}

export function getInvoiceSummary(request: ProcurementRequest) {
  const invoices = getRequestInvoices(request);
  if (invoices.length === 0) {
    return "Pending";
  }

  if (invoices.length === 1) {
    return invoices[0]?.invoiceNumber ?? "Pending";
  }

  const pendingCount = invoices.filter((invoice) => !invoice.clearedAt).length;
  return `${invoices.length} invoices${pendingCount > 0 ? ` (${pendingCount} pending)` : ""}`;
}

export function getRequestTotalAed(request: ProcurementRequest) {
  if (Number.isFinite(request.estimatedAmountAed)) {
    return roundMoney(request.estimatedAmountAed);
  }

  return roundMoney(
    getRequestLineItems(request).reduce((total, item) => total + item.aedTotal, 0),
  );
}

export function getRequestItemCount(request: ProcurementRequest) {
  return getRequestLineItems(request).length;
}

export function normalizeRequestFinancials(
  request: ProcurementRequest & { project?: string },
): ProcurementRequest {
  const lineItems = getRequestLineItems(request);
  const invoiceLineItemIds = lineItems.map((item) => item.id);
  const invoices = (Array.isArray(request.invoices)
    ? request.invoices
    : request.invoice
      ? [request.invoice]
      : []
  )
    .map((invoice, index) =>
      normalizeInvoiceDetails(
        invoice,
        `${request.id.toLowerCase()}-invoice-${index + 1}`,
        invoiceLineItemIds,
      ),
    )
    .filter((invoice): invoice is InvoiceDetails => Boolean(invoice));
  const estimatedAmountAed = roundMoney(
    lineItems.reduce((total, item) => total + item.aedTotal, 0),
  );
  const logistics = request.logistics
    ? {
        ...emptyLogistics,
        ...request.logistics,
      }
    : undefined;
  const edlynClarificationReturnStatus: ProcurementRequest["edlynClarificationReturnStatus"] =
    request.edlynClarificationReturnStatus === "Purchase in Progress"
      ? "Purchase in Progress"
      : request.edlynClarificationReturnStatus === "Edlyn Confirmation"
        ? "Edlyn Confirmation"
        : undefined;
  const lineItemIds = new Set(lineItems.map((item) => item.id));
  const lineItemClarifications = Array.isArray(request.lineItemClarifications)
    ? request.lineItemClarifications
        .map((item) => ({
          lineItemId: String(item.lineItemId ?? ""),
          comment: String(item.comment ?? "").trim(),
          createdAt: item.createdAt || request.updatedAt || nowIso(),
          createdBy: item.createdBy || request.previousResponsibleId || "",
          createdByName: item.createdByName || "Procure",
        }))
        .filter((item) => lineItemIds.has(item.lineItemId) && Boolean(item.comment))
    : undefined;

  return {
    ...request,
    project: request.project || DEFAULT_PROJECT_OPTIONS[0],
    lineItems,
    invoices: invoices.length > 0 ? invoices : undefined,
    invoice: invoices[0] ?? request.invoice,
    estimatedAmountAed,
    logistics,
    edlynClarificationReturnStatus,
    lineItemClarifications:
      lineItemClarifications && lineItemClarifications.length > 0
        ? lineItemClarifications
        : undefined,
    exchangeRateSource:
      request.exchangeRateSource ||
      lineItems[0]?.exchangeRateSource ||
      AED_EXCHANGE_RATE_SOURCE,
    exchangeRateDate:
      request.exchangeRateDate ||
      lineItems[0]?.exchangeRateDate ||
      DEFAULT_EXCHANGE_RATE_DATE,
  };
}

export const seedUsers: UserProfile[] = [
  {
    id: "user-employee",
    name: "Abel Gonsalves",
    email: "layla.hassan@example.com",
    role: "Employee",
    department: "Operations",
    active: true,
  },
  {
    id: "user-mona",
    name: "Mona",
    email: "mona@example.com",
    role: "Mona",
    department: "Procurement",
    active: true,
  },
  {
    id: "user-rashid",
    name: "Rashid",
    email: "rashid@example.com",
    role: "Rashid",
    department: "Management",
    active: true,
  },
  {
    id: "user-dr-majed",
    name: "Dr. Majed",
    email: "dr.majed@example.com",
    role: "Dr. Majed",
    department: "Executive Office",
    active: true,
  },
  {
    id: "user-amro",
    name: "Amro",
    email: "Aamro.mandil@sulmi.ai",
    role: "Amro",
    department: "Commercial",
    active: true,
  },
  {
    id: "user-edlyn",
    name: "Procure",
    email: PROCURE_APPROVAL_EMAIL,
    role: "Edlyn",
    department: "Procurement",
    active: true,
  },
  {
    id: "user-aileen",
    name: "Finance",
    email: FINANCE_APPROVAL_EMAIL,
    role: "Aileen",
    department: "Finance",
    active: true,
  },
  {
    id: "user-admin",
    name: "Admin",
    email: "admin@example.com",
    role: "Admin",
    department: "Systems",
    active: true,
  },
];

const roleUser = (role: Role, users: UserProfile[] = seedUsers) => {
  const user = users.find((candidate) => candidate.role === role);
  if (!user) {
    throw new Error(`Missing seeded user for ${role}`);
  }
  return user;
};

const mona = roleUser("Mona");
const rashid = roleUser("Rashid");
const drMajed = roleUser("Dr. Majed");
const edlyn = roleUser("Edlyn");
const aileen = roleUser("Aileen");
const employee = roleUser("Employee");

export const seedRequests: ProcurementRequest[] = ([
  {
    id: "PR-101",
    employeeName: "Abel Gonsalves",
    department: "Operations",
    project: "Beta",
    itemName: "Ergonomic office chairs",
    itemDescription: "Four mesh-back ergonomic chairs for the operations room.",
    quantity: 4,
    estimatedAmount: 2200,
    currency: "AED",
    vendorName: "Workspace Gulf",
    reasonForPurchase: "Replace damaged seating used by the scheduling team.",
    priority: "Normal",
    requiredByDate: "2026-06-20",
    attachments: [],
    vendor: {
      ...emptyVendor,
      contactPerson: "Nadia Khan",
      companyName: "Workspace Gulf",
      trnNumber: "100245819300003",
      websiteLink: "https://workspace.example.com",
      businessLocation: "Dubai Investment Park",
    },
    invoice: {
      invoiceNumber: "INV-9001",
      invoiceAmount: 2160,
      invoiceDate: "2026-06-10",
      vendor: "Workspace Gulf",
      uploadedInvoiceFile: "invoice-pr-101.pdf",
      paymentTerms: "30 days credit",
      financeNotes: "Booked under operations furniture budget.",
      clearedAt: "2026-06-11T12:15:00.000Z",
    },
    status: "Completed",
    stage: "aileen",
    assigneeId: aileen.id,
    submittedById: employee.id,
    previousResponsibleId: edlyn.id,
    logistics: {
      deliveryStatus: "Delivered",
      provider: "Workspace Gulf delivery",
      trackingNumber: "WG-PR101",
      expectedDeliveryDate: "2026-06-13",
      lastCheckpoint: "Delivered to operations room",
      notes: "Received and checked by operations.",
      updatedAt: "2026-06-13T08:45:00.000Z",
    },
    orderConfirmedAt: "2026-06-11T13:30:00.000Z",
    itemReceivedAt: "2026-06-13T08:45:00.000Z",
    completedAt: "2026-06-13T09:10:00.000Z",
    createdAt: "2026-06-08T07:10:00.000Z",
    updatedAt: "2026-06-13T09:10:00.000Z",
  },
  {
    id: "PR-102",
    employeeName: "Abel Gonsalves",
    department: "Operations",
    project: "Alpha",
    itemName: "Barcode scanner",
    itemDescription: "Wireless scanner for inventory receiving counter.",
    quantity: 2,
    estimatedAmount: 1250,
    currency: "AED",
    vendorName: "TechGate Supplies",
    reasonForPurchase: "Speed up incoming stock checks and reduce entry errors.",
    priority: "High",
    requiredByDate: "2026-06-18",
    attachments: [],
    vendor: {
      ...emptyVendor,
      contactPerson: "Imran Shah",
      companyName: "TechGate Supplies",
      trnNumber: "100398711200003",
      bankDetails: "Emirates NBD, AE070331234567890123456",
      businessLocation: "Al Quoz, Dubai",
    },
    status: "Dr. Majed Review",
    stage: "dr-majed",
    assigneeId: drMajed.id,
    submittedById: employee.id,
    previousResponsibleId: rashid.id,
    createdAt: "2026-06-10T06:45:00.000Z",
    updatedAt: "2026-06-12T09:20:00.000Z",
  },
  {
    id: "PR-103",
    employeeName: "Bilal G",
    department: "Engineering",
    project: "Sira",
    itemName: "Laptop docking stations",
    itemDescription: "USB-C docks for hybrid desks.",
    quantity: 3,
    estimatedAmount: 780,
    currency: "AED",
    vendorName: "ByteLine Trading",
    reasonForPurchase: "Support shared workstations for visiting staff.",
    priority: "Normal",
    requiredByDate: "2026-06-24",
    attachments: [],
    vendor: {
      ...emptyVendor,
      contactPerson: "Nour Salem",
      companyName: "ByteLine Trading",
      websiteLink: "https://byteline.example.com",
      businessLocation: "Business Bay",
    },
    status: "Rashid Review",
    stage: "rashid",
    assigneeId: rashid.id,
    submittedById: employee.id,
    previousResponsibleId: mona.id,
    createdAt: "2026-06-14T06:15:00.000Z",
    updatedAt: "2026-06-14T09:00:00.000Z",
  },
  {
    id: "PR-104",
    employeeName: "Mariam Noor",
    department: "Operations",
    project: "Beta",
    itemName: "Pantry water filters",
    itemDescription: "Replacement cartridges and fittings for pantry filtration.",
    quantity: 6,
    estimatedAmount: 240,
    currency: "AED",
    vendorName: "AquaPro",
    reasonForPurchase: "Scheduled maintenance for pantry water quality.",
    priority: "Low",
    requiredByDate: "2026-06-19",
    attachments: [],
    vendor: {
      ...emptyVendor,
      contactPerson: "Sameer Iqbal",
      companyName: "AquaPro",
      businessLocation: "Sharjah Industrial Area",
    },
    status: "Purchase in Progress",
    stage: "edlyn",
    assigneeId: edlyn.id,
    submittedById: employee.id,
    previousResponsibleId: drMajed.id,
    createdAt: "2026-06-12T05:30:00.000Z",
    updatedAt: "2026-06-14T11:10:00.000Z",
  },
  {
    id: "PR-105",
    employeeName: "Fatima Ali",
    department: "Finance",
    project: "Alpha",
    itemName: "Cheque printer toner",
    itemDescription: "MICR toner cartridge for finance printer.",
    quantity: 1,
    estimatedAmount: 420,
    currency: "AED",
    vendorName: "OfficeLine",
    reasonForPurchase: "Maintain cheque printing continuity.",
    priority: "Urgent",
    requiredByDate: "2026-06-16",
    attachments: [],
    vendor: {
      ...emptyVendor,
      contactPerson: "George Mathew",
      companyName: "OfficeLine",
      vatRegistration: "VAT-448201",
      businessLocation: "Deira",
    },
    invoice: {
      invoiceNumber: "OL-2104",
      invoiceAmount: 418,
      invoiceDate: "2026-06-14",
      vendor: "OfficeLine",
      uploadedInvoiceFile: "ol-2104.pdf",
      paymentTerms: "COD",
      financeNotes: "",
    },
    status: "Aileen Finance Review",
    stage: "aileen",
    assigneeId: aileen.id,
    submittedById: employee.id,
    previousResponsibleId: edlyn.id,
    createdAt: "2026-06-11T08:05:00.000Z",
    updatedAt: "2026-06-14T13:45:00.000Z",
  },
  {
    id: "PR-106",
    employeeName: "Abel Gonsalves",
    department: "Operations",
    project: "Sira",
    itemName: "Whiteboard markers",
    itemDescription: "Assorted marker packs for meeting rooms.",
    quantity: 10,
    estimatedAmount: 180,
    currency: "AED",
    vendorName: "QuickOffice",
    reasonForPurchase: "Meeting room supplies are depleted.",
    priority: "Normal",
    requiredByDate: "2026-06-17",
    attachments: [],
    vendor: {
      ...emptyVendor,
      contactPerson: "Rita Dias",
      companyName: "QuickOffice",
      businessLocation: "Dubai Silicon Oasis",
    },
    status: "Mona Review",
    stage: "mona",
    assigneeId: mona.id,
    submittedById: employee.id,
    createdAt: "2026-06-15T05:30:00.000Z",
    updatedAt: "2026-06-15T05:30:00.000Z",
  },
  {
    id: "PR-107",
    employeeName: "Hassan Saeed",
    department: "Marketing",
    project: "Beta",
    itemName: "Event display stand",
    itemDescription: "Portable display frame for conference booth.",
    quantity: 1,
    estimatedAmount: 1500,
    currency: "AED",
    vendorName: "BrandWorks",
    reasonForPurchase: "Requested for an event that was later cancelled.",
    priority: "Low",
    requiredByDate: "2026-06-25",
    attachments: [],
    vendor: {
      ...emptyVendor,
      contactPerson: "Leena Joseph",
      companyName: "BrandWorks",
      businessLocation: "JLT",
    },
    status: "Rashid Declined",
    stage: "rashid",
    assigneeId: mona.id,
    submittedById: employee.id,
    previousResponsibleId: mona.id,
    createdAt: "2026-06-09T10:30:00.000Z",
    updatedAt: "2026-06-10T07:35:00.000Z",
  },
] as unknown as ProcurementRequest[]).map(normalizeRequestFinancials);

export const seedAuditLogs: AuditLog[] = [
  {
    id: "audit-101-1",
    requestId: "PR-101",
    userId: employee.id,
    userName: employee.name,
    action: "Submitted request",
    dateTime: "2026-06-08T07:10:00.000Z",
    previousStatus: "Draft",
    newStatus: "Mona Review",
    assignedPerson: "Mona",
  },
  {
    id: "audit-102-1",
    requestId: "PR-102",
    userId: mona.id,
    userName: mona.name,
    action: "Mona approved request",
    dateTime: "2026-06-11T08:10:00.000Z",
    previousStatus: "Mona Review",
    newStatus: "Rashid Review",
    assignedPerson: "Rashid",
  },
  {
    id: "audit-102-2",
    requestId: "PR-102",
    userId: rashid.id,
    userName: rashid.name,
    action: "Rashid approved request",
    dateTime: "2026-06-12T09:20:00.000Z",
    previousStatus: "Rashid Review",
    newStatus: "Dr. Majed Review",
    assignedPerson: "Dr. Majed",
  },
  {
    id: "audit-105-1",
    requestId: "PR-105",
    userId: edlyn.id,
    userName: edlyn.name,
    action: "Uploaded invoice",
    dateTime: "2026-06-14T13:45:00.000Z",
    previousStatus: "Purchase in Progress",
    newStatus: "Aileen Finance Review",
    uploadedInvoiceReference: "ol-2104.pdf",
    assignedPerson: "Finance",
  },
  {
    id: "audit-107-1",
    requestId: "PR-107",
    userId: rashid.id,
    userName: rashid.name,
    action: "Rashid declined request",
    dateTime: "2026-06-10T07:35:00.000Z",
    previousStatus: "Rashid Review",
    newStatus: "Rashid Declined",
    declineReason: "Event budget is frozen after cancellation.",
    assignedPerson: "Mona",
  },
];

export const seedNotifications: NotificationRecord[] = [
  {
    id: "notice-1",
    userId: rashid.id,
    requestId: "PR-103",
    title: "Approval pending",
    body: "PR-103 is waiting for Rashid approval.",
    type: "assigned",
    read: false,
    createdAt: "2026-06-14T09:00:00.000Z",
  },
  {
    id: "notice-2",
    userId: drMajed.id,
    requestId: "PR-102",
    title: "Review pending",
    body: "PR-102 is waiting for Dr. Majed review.",
    type: "assigned",
    read: false,
    createdAt: "2026-06-12T09:20:00.000Z",
  },
  {
    id: "notice-3",
    userId: aileen.id,
    requestId: "PR-105",
    title: "Invoice uploaded",
    body: "Invoice OL-2104 was uploaded and is ready for finance documentation.",
    type: "invoice",
    read: false,
    createdAt: "2026-06-14T13:45:00.000Z",
  },
];

export const initialState: ProcurementState = {
  users: seedUsers,
  requests: [],
  auditLogs: [],
  notifications: [],
  outboundNotifications: [],
  chatbotMessages: [],
  projectOptions: [...DEFAULT_PROJECT_OPTIONS],
};

export function getUserById(users: UserProfile[], id: string) {
  return users.find((user) => user.id === id);
}

export function getUserByRole(users: UserProfile[], role: Role) {
  return users.find((user) => user.role === role);
}

export function getAssigneeName(request: ProcurementRequest, users: UserProfile[]) {
  return getUserById(users, request.assigneeId)?.name ?? "Unassigned";
}

export function getStageIndex(stage: WorkflowStage) {
  return WORKFLOW_STAGES.findIndex((candidate) => candidate.key === stage);
}

export function isDeclined(status: RequestStatus) {
  return (
    status === "Rashid Declined" ||
    status === "Department Declined" ||
    status === "Sent Back for Clarification"
  );
}

export function isClosed(status: RequestStatus) {
  return status === "Completed" || status === "Cancelled" || isDeclined(status);
}

export function isRequesterCancellable(status: RequestStatus) {
  return ![
    "Cancellation Requested",
    "Cancelled",
    "Completed",
    "Item Received",
  ].includes(status);
}

export function isInvoiceFinancePending(request: ProcurementRequest) {
  return getPendingFinanceInvoices(request).length > 0 && !isClosed(request.status);
}

export function isRequestOverdue(
  request: ProcurementRequest,
  referenceDate = new Date(),
) {
  if (isClosed(request.status)) {
    return false;
  }

  return (
    referenceDate.getTime() - new Date(request.updatedAt).getTime() >
    OVERDUE_REQUEST_HOURS * 60 * 60 * 1000
  );
}

export function isApprovalStatus(status: RequestStatus) {
  return (
    status === "Mona Review" ||
    status === "Rashid Review" ||
    status === "Rashid Auto Approved" ||
    status === "Dr. Majed Review" ||
    status === "Amro Review"
  );
}

export function isApprovedStatus(status: RequestStatus) {
  return [
    "Rashid Auto Approved",
    "Edlyn Confirmation",
    "Purchase in Progress",
    "Invoice Uploaded",
    "Aileen Finance Review",
    "Invoice Cleared",
    "Edlyn Order Confirmation",
    "Delivery Tracking",
    "Order Confirmed",
    "Item Received",
    "Completed",
  ].includes(status);
}

export function getPendingAction(request: ProcurementRequest) {
  switch (request.status) {
    case "Mona Review":
      if (request.stage === "dr-majed") {
        return "Mona to approve or decline department review";
      }
      return "Mona to approve or request clarification";
    case "Rashid Review":
      return "Rashid to approve or decline";
    case "Dr. Majed Review":
      return "Dr. Majed to approve, decline, or modify request";
    case "Amro Review":
      return "Amro to approve or decline department review";
    case "Rashid Auto Approved":
      if (request.stage === "edlyn") {
        return "Procure to confirm item details";
      }
      return `${getDepartmentReviewRole(request.department) ?? "Department reviewer"} to review and forward to Procure`;
    case "Edlyn Confirmation":
      return "Procure to confirm item details";
    case "Edlyn Clarification Requested":
      return "Employee to answer Procure clarification";
    case "Purchase in Progress":
      if (getRequestInvoices(request).length > 0) {
        const pendingInvoices = getPendingFinanceInvoices(request).length;
        const financeAction =
          pendingInvoices > 0
            ? `; Finance to clear ${pendingInvoices} invoice${pendingInvoices === 1 ? "" : "s"}`
            : "";

        return request.orderConfirmedAt || request.logistics
          ? `Procure to update delivery${financeAction}`
          : `Procure to confirm the order and start delivery tracking${financeAction}`;
      }
      return "Procure to purchase, request clarification, or upload invoice";
    case "Aileen Finance Review":
    case "Invoice Uploaded":
      return "Finance to document and clear invoice";
    case "Invoice Cleared":
    case "Edlyn Order Confirmation":
      return "Procure to confirm the order and start delivery tracking";
    case "Delivery Tracking":
      return "Procure to update logistics or mark item received";
    case "Order Confirmed":
      return "Procure to mark item received";
    case "Item Received":
      return getPendingFinanceInvoices(request).length > 0
        ? "Finance to clear pending invoices, then close the case"
        : "Finance to close the case";
    case "Cancellation Requested":
      return "Procure to cancel the order immediately";
    case "Cancelled":
      return "Request cancelled";
    case "Completed":
      return "No pending action";
    case "Rashid Declined":
      return "Rejected by Rashid; employee notified";
    case "Department Declined":
      return "Rejected by department reviewer; employee notified";
    case "Sent Back for Clarification":
      return "Employee to clarify request";
    default:
      return "Submit request";
  }
}

export function nextRequestId(requests: ProcurementRequest[]) {
  const highest = requests.reduce((max, request) => {
    const numeric = Number(request.id.replace("PR-", ""));
    return Number.isFinite(numeric) ? Math.max(max, numeric) : max;
  }, 100);
  return `PR-${highest + 1}`;
}

export function makeId(prefix: string) {
  return `${prefix}-${Math.random().toString(36).slice(2, 10)}`;
}

export function nowIso() {
  return new Date().toISOString();
}

export function isUserNotificationEnabled(user: UserProfile) {
  return user.notificationsEnabled !== false;
}

export function isUserEmailNotificationEnabled(user: UserProfile) {
  return isUserNotificationEnabled(user) && user.emailNotificationsEnabled !== false;
}

export function isUserSlackNotificationEnabled(user: UserProfile) {
  return isUserNotificationEnabled(user) && user.slackNotificationsEnabled !== false;
}

export function isUserReminderNotificationEnabled(user: UserProfile) {
  return isUserNotificationEnabled(user) && user.reminderNotificationsEnabled !== false;
}

function getStageLabel(stage: WorkflowStage) {
  return WORKFLOW_STAGES.find((candidate) => candidate.key === stage)?.label ?? stage;
}

function shouldQueueExternalNotification(notification: NotificationRecord) {
  return notification.type !== "reminder";
}

function outboundBodyForNotification(
  notification: NotificationRecord,
  request: ProcurementRequest | undefined,
) {
  if (!request) {
    return notification.body;
  }

  const details = [
    notification.body,
    "",
    `Requested by: ${request.employeeName}`,
    `Item: ${request.itemName}`,
    `Amount: AED ${getRequestTotalAed(request).toLocaleString(undefined, {
      maximumFractionDigits: 2,
      minimumFractionDigits: 0,
    })}`,
    `Project: ${request.project}`,
    `Department: ${request.department}`,
    `Stage: ${getStageLabel(request.stage)}`,
    `Pending action: ${getPendingAction(request)}`,
  ];

  return details.join("\n");
}

function queueOutboundNotificationsForNewInternalNotifications(
  state: ProcurementState,
  existingNotificationIds: Set<string>,
  dateTime: string,
) {
  const existingDeliveryKeys = new Set(
    (state.outboundNotifications ?? []).map((delivery) => `${delivery.notificationId}:${delivery.channel}`),
  );
  const queuedDeliveries = [...(state.outboundNotifications ?? [])];

  state.notifications
    .filter(
      (notification) =>
        !existingNotificationIds.has(notification.id) &&
        shouldQueueExternalNotification(notification),
    )
    .forEach((notification) => {
      const user = getUserById(state.users, notification.userId);
      const request = notification.requestId
        ? state.requests.find((candidate) => candidate.id === notification.requestId)
        : undefined;

      if (!user || !isUserNotificationEnabled(user)) {
        return;
      }

      const channels: OutboundNotificationChannel[] = [];
      if (isUserEmailNotificationEnabled(user)) {
        channels.push("email");
      }
      if (isUserSlackNotificationEnabled(user)) {
        channels.push("slack");
      }

      channels.forEach((channel) => {
        const deliveryKey = `${notification.id}:${channel}`;
        if (existingDeliveryKeys.has(deliveryKey)) {
          return;
        }

        existingDeliveryKeys.add(deliveryKey);
        queuedDeliveries.push({
          id: makeId(`outbound-${channel}`),
          notificationId: notification.id,
          userId: user.id,
          requestId: notification.requestId,
          channel,
          eventType: notification.type,
          title: notification.title,
          body: outboundBodyForNotification(notification, request),
          requesterName: request?.employeeName,
          itemName: request?.itemName,
          totalAed: request ? getRequestTotalAed(request) : undefined,
          project: request?.project,
          department: request?.department,
          stageLabel: request ? getStageLabel(request.stage) : undefined,
          pendingAction: request ? getPendingAction(request) : undefined,
          status: "queued",
          attempts: 0,
          createdAt: dateTime,
          updatedAt: dateTime,
        });
      });
    });

  state.outboundNotifications = queuedDeliveries;
}

export function getQueuedOutboundNotificationCount(state: ProcurementState) {
  return (state.outboundNotifications ?? []).filter(
    (delivery) => delivery.status === "queued",
  ).length;
}

function mergeLogistics(
  current: LogisticsDetails | undefined,
  updates: Partial<LogisticsDetails> | undefined,
  dateTime: string,
): LogisticsDetails {
  return {
    ...emptyLogistics,
    ...current,
    ...updates,
    updatedAt: dateTime,
  };
}

function addNotification(
  notifications: NotificationRecord[],
  input: Omit<NotificationRecord, "id" | "read" | "createdAt">,
  dateTime: string,
) {
  notifications.push({
    ...input,
    id: makeId("notice"),
    read: false,
    createdAt: dateTime,
  });
}

function addAudit(
  auditLogs: AuditLog[],
  request: ProcurementRequest,
  actor: UserProfile,
  previousStatus: RequestStatus,
  action: string,
  dateTime: string,
  options: Partial<Omit<AuditLog, "id" | "requestId" | "userId" | "userName" | "action" | "dateTime" | "previousStatus" | "newStatus">> = {},
) {
  auditLogs.unshift({
    id: makeId("audit"),
    requestId: request.id,
    userId: actor.id,
    userName: actor.name,
    action,
    dateTime,
    previousStatus,
    newStatus: request.status,
    ...options,
  });
}

function requireRoleUser(users: UserProfile[], role: Role) {
  const user = getUserByRole(users, role);
  if (!user) {
    throw new Error(`No active ${role} user found`);
  }
  return user;
}

type WorkflowRoute = {
  role: Role;
  status: RequestStatus;
  stage: WorkflowStage;
  title: string;
  body: string;
};

const SELF_APPROVAL_ROLES: Role[] = ["Mona", "Dr. Majed", "Amro"];
const SKIPPABLE_REVIEW_ROLES: Role[] = ["Mona", "Dr. Majed", "Amro", "Rashid"];

function isSelfApprovalRole(role: Role) {
  return SELF_APPROVAL_ROLES.includes(role);
}

function isSkippableReviewRole(role: Role) {
  return SKIPPABLE_REVIEW_ROLES.includes(role);
}

function getAvailableUserByRole(users: UserProfile[], role: Role) {
  return users.find((user) => user.role === role && user.active);
}

function shouldSkipRoute(users: UserProfile[], route: WorkflowRoute) {
  return isSkippableReviewRole(route.role) && !getAvailableUserByRole(users, route.role);
}

function routeAfterSkippedReview(request: ProcurementRequest, route: WorkflowRoute) {
  if (route.stage === "dr-majed") {
    return getPostDepartmentReviewRoute(request);
  }

  if (route.stage === "rashid") {
    return getPostRashidRoute(request);
  }

  return route;
}

function resolveAvailableRoute(
  request: ProcurementRequest,
  users: UserProfile[],
  route: WorkflowRoute,
) {
  let resolved = route;
  const skippedRoles: Role[] = [];
  const seenStages = new Set<string>();

  while (shouldSkipRoute(users, resolved) && !seenStages.has(`${resolved.stage}-${resolved.role}`)) {
    seenStages.add(`${resolved.stage}-${resolved.role}`);
    skippedRoles.push(resolved.role);
    const nextRoute = routeAfterSkippedReview(request, resolved);

    if (nextRoute === resolved) {
      break;
    }

    resolved = nextRoute;
  }

  return { route: resolved, skippedRoles };
}

function skippedRolesComment(skippedRoles: Role[]) {
  if (skippedRoles.length === 0) return "";

  return `Skipped ${skippedRoles.map(getRoleDisplayName).join(", ")} because marked on leave.`;
}

function getPostMonaRoute(request: ProcurementRequest): WorkflowRoute {
  const reviewRole = getDepartmentReviewRole(request.department);

  if (reviewRole) {
    const reviewStatus = getDepartmentReviewStatus(request.department) ?? "Dr. Majed Review";
    return {
      role: reviewRole,
      status: reviewStatus,
      stage: "dr-majed",
      title: "Department review required",
      body: `${request.id} is ready for ${reviewRole} department review.`,
    };
  }

  return getPostDepartmentReviewRoute(request);
}

function getPostDepartmentReviewRoute(request: ProcurementRequest): WorkflowRoute {
  const totalAed = getRequestTotalAed(request);

  if (totalAed >= 300) {
    return {
      role: "Rashid",
      status: "Rashid Review",
      stage: "rashid",
      title: "Approval required",
      body: `${request.id} is ready for Rashid approval.`,
    };
  }

  return {
    role: "Edlyn",
    status: "Rashid Auto Approved",
    stage: "edlyn",
    title: "Auto-approved purchase task",
    body: `${request.id} is below AED 300 and is ready for Procure item confirmation.`,
  };
}

function getPostRashidRoute(request: ProcurementRequest): WorkflowRoute {
  return {
    role: "Edlyn",
    status: request.procurePriceReviewReturnStatus ?? "Edlyn Confirmation",
    stage: "edlyn",
    title: "Purchase task assigned",
    body: `${request.id} is ready for Procure item confirmation.`,
  };
}

function applyLineItemUpdate(editable: ProcurementRequest, lineItems: ProcurementLineItem[]) {
  const normalizedLineItems = lineItems.map((item) => ({
    ...item,
    productUrl: item.productUrl ?? "",
  }));
  const totalAed = roundMoney(
    normalizedLineItems.reduce((total, item) => total + item.aedTotal, 0),
  );
  const totalQuantity = normalizedLineItems.reduce((total, item) => total + item.quantity, 0);
  const vendorName =
    Array.from(new Set(normalizedLineItems.map((item) => item.vendorName).filter(Boolean))).join(
      ", ",
    ) || editable.vendorName;

  editable.lineItems = normalizedLineItems;
  editable.estimatedAmountAed = totalAed;
  editable.quantity = totalQuantity;
  editable.exchangeRateDate =
    normalizedLineItems[0]?.exchangeRateDate ?? DEFAULT_EXCHANGE_RATE_DATE;
  editable.exchangeRateSource =
    Array.from(new Set(normalizedLineItems.map((item) => item.exchangeRateSource))).join(", ") ||
    editable.exchangeRateSource;
  editable.vendorName = vendorName;
  editable.vendor = {
    ...editable.vendor,
    companyName: vendorName || editable.vendor.companyName,
  };

  if (normalizedLineItems.length === 1) {
    const [item] = normalizedLineItems;
    editable.itemName = item.itemName;
    editable.itemDescription = item.itemDescription;
    editable.estimatedAmount = item.originalTotal;
    editable.currency = item.currency;
  } else {
    editable.itemName = `Bulk upload (${normalizedLineItems.length} items)`;
    editable.itemDescription = `Bulk procurement upload containing ${normalizedLineItems.length} item(s).`;
    editable.estimatedAmount = totalAed;
    editable.currency = "AED";
  }
}

function setRequestInvoices(editable: ProcurementRequest, invoices: InvoiceDetails[]) {
  const activeInvoices = invoices
    .map((invoice, index) =>
      normalizeInvoiceDetails(
        invoice,
        `${editable.id.toLowerCase()}-invoice-${index + 1}`,
        getRequestLineItems(editable).map((item) => item.id),
      ),
    )
    .filter((invoice): invoice is InvoiceDetails => Boolean(invoice))
    .filter((invoice) => invoice.status !== "Replaced");

  editable.invoices = activeInvoices.length > 0 ? activeInvoices : undefined;
  editable.invoice = activeInvoices[0] ?? undefined;
}

function upsertRequestInvoice(
  editable: ProcurementRequest,
  invoice: InvoiceDetails,
  dateTime: string,
) {
  const lineItems = getRequestLineItems(editable);
  const validLineItemIds = new Set(lineItems.map((item) => item.id));
  let lineItemIds =
    Array.isArray(invoice.lineItemIds) && invoice.lineItemIds.length > 0
      ? invoice.lineItemIds.filter((lineItemId) => validLineItemIds.has(lineItemId))
      : lineItems
          .filter((item) => item.status !== "Cancelled")
          .map((item) => item.id);
  if (lineItemIds.length === 0) {
    lineItemIds = lineItems.filter((item) => item.status !== "Cancelled").map((item) => item.id);
  }
  const normalizedInvoice = normalizeInvoiceDetails(
    {
      ...invoice,
      lineItemIds,
      status: invoice.clearedAt ? "Cleared" : "Pending Finance",
    },
    makeId("invoice"),
    lineItemIds,
  );
  if (!normalizedInvoice) {
    throw new Error("Invoice details are incomplete.");
  }
  const existingInvoices = getRequestInvoices(editable);
  const existingIndex = existingInvoices.findIndex(
    (candidate) => candidate.id === normalizedInvoice.id,
  );
  const nextInvoices =
    existingIndex >= 0
      ? existingInvoices.map((candidate) =>
          candidate.id === normalizedInvoice.id
            ? {
                ...normalizedInvoice,
                financeNotes: normalizedInvoice.financeNotes || candidate.financeNotes,
              }
            : candidate,
        )
      : [normalizedInvoice, ...existingInvoices];
  const invoiceId = normalizedInvoice.id ?? makeId("invoice");
  const updatedLineItems = lineItems.map((item) => {
    if (!lineItemIds.includes(item.id)) {
      return item;
    }

    return {
      ...item,
      status: "Invoice uploaded" as LineItemStatus,
      invoiceIds: Array.from(new Set([...(item.invoiceIds ?? []), invoiceId])),
      processedAt: item.processedAt ?? dateTime,
    };
  });

  setRequestInvoices(editable, nextInvoices);
  applyLineItemUpdate(editable, updatedLineItems);

  return {
    invoice: normalizedInvoice,
    replaced: existingIndex >= 0,
    lineItemIds,
  };
}

export function submitProcurementRequest(
  state: ProcurementState,
  draft: ProcurementRequestDraft,
  submittedById: string,
) {
  const dateTime = nowIso();
  const monaUser = getUserByRole(state.users, "Mona");
  const monaAvailable = Boolean(monaUser?.active);
  const actor = getUserById(state.users, submittedById) ?? monaUser;

  if (!actor || !monaUser) {
    return state;
  }

  const request: ProcurementRequest = normalizeRequestFinancials({
    ...draft,
    id: nextRequestId(state.requests),
    status: "Mona Review",
    stage: "mona",
    assigneeId: monaUser.id,
    submittedById,
    createdAt: dateTime,
    updatedAt: dateTime,
  });

  const nextState: ProcurementState = {
    ...state,
    requests: [request, ...state.requests],
    auditLogs: [...state.auditLogs],
    notifications: [...state.notifications],
    outboundNotifications: [...(state.outboundNotifications ?? [])],
    chatbotMessages: state.chatbotMessages,
  };
  const existingNotificationIds = new Set(state.notifications.map((notification) => notification.id));

  addAudit(nextState.auditLogs, request, actor, "Draft", "Submitted request", dateTime, {
    assignedPerson: monaUser.name,
  });

  const applyRoute = (route: WorkflowRoute) => {
    const resolved = resolveAvailableRoute(request, state.users, route);
    const assignee =
      getAvailableUserByRole(state.users, resolved.route.role) ??
      getUserByRole(state.users, resolved.route.role);

    if (!assignee) {
      return undefined;
    }

    request.status = resolved.route.status;
    request.stage = resolved.route.stage;
    request.assigneeId = assignee.id;
    addNotification(
      nextState.notifications,
      {
        userId: assignee.id,
        requestId: request.id,
        title: resolved.route.title,
        body: resolved.route.body,
        type: resolved.route.status === "Rashid Auto Approved" ? "approved" : "assigned",
      },
      dateTime,
    );
    return { assignee, skippedRoles: resolved.skippedRoles };
  };

  if (actor.role === "Mona" || !monaAvailable) {
    const previousStatus = request.status;
    let route = getPostMonaRoute(request);
    let auditAction = actor.role === "Mona" ? "Mona self-approved own request" : "Mona skipped because on leave";
    request.previousResponsibleId = actor.id;

    if (route.role === actor.role && isSelfApprovalRole(route.role)) {
      request.status = route.status;
      request.stage = route.stage;
      request.assigneeId = actor.id;
      addAudit(
        nextState.auditLogs,
        request,
        actor,
        previousStatus,
        `${actor.name} self-approved own department review`,
        dateTime,
        { assignedPerson: actor.name },
      );
      route = getPostDepartmentReviewRoute(request);
      auditAction =
        actor.role === "Mona"
          ? "Mona self-approved own request and department review"
          : `Mona skipped because on leave; ${actor.name} self-approved own department review`;
    }

    const routed = applyRoute(route);
    if (!routed) {
      queueOutboundNotificationsForNewInternalNotifications(
        nextState,
        existingNotificationIds,
        dateTime,
      );
      return nextState;
    }
    const skipComment = skippedRolesComment([
      ...(monaAvailable ? [] : ["Mona" as Role]),
      ...routed.skippedRoles,
    ]);
    addAudit(
      nextState.auditLogs,
      request,
      actor,
      previousStatus,
      auditAction,
      dateTime,
      {
        assignedPerson: routed.assignee.name,
        comment: skipComment || undefined,
      },
    );
  } else {
    addNotification(
      nextState.notifications,
      {
        userId: monaUser.id,
        requestId: request.id,
        title: "New procurement request",
        body: `${request.id} from ${request.employeeName} is ready for Mona review.`,
        type: "assigned",
      },
      dateTime,
    );
  }

  queueOutboundNotificationsForNewInternalNotifications(
    nextState,
    existingNotificationIds,
    dateTime,
  );

  return nextState;
}

export function transitionRequest(
  state: ProcurementState,
  requestId: string,
  actorId: string,
  workflowAction: WorkflowAction,
) {
  const request = state.requests.find((candidate) => candidate.id === requestId);
  const actor = getUserById(state.users, actorId);

  if (!request || !actor) {
    return state;
  }

  const dateTime = nowIso();
  const nextRequests = state.requests.map((candidate) => ({
    ...candidate,
    invoices: candidate.invoices?.map((invoice) => ({ ...invoice })),
    invoice: candidate.invoice ? { ...candidate.invoice } : candidate.invoice,
    logistics: candidate.logistics ? { ...candidate.logistics } : candidate.logistics,
  }));
  const editable = nextRequests.find((candidate) => candidate.id === requestId);

  if (!editable) {
    return state;
  }

  const nextState: ProcurementState = {
    ...state,
    requests: nextRequests,
    auditLogs: [...state.auditLogs],
    notifications: [...state.notifications],
    outboundNotifications: [...(state.outboundNotifications ?? [])],
    chatbotMessages: state.chatbotMessages,
  };
  const existingNotificationIds = new Set(state.notifications.map((notification) => notification.id));

  const previousStatus = editable.status;
  let actionLabel = "Updated request";
  let comment: string | undefined;
  let declineReason: string | undefined;
  let uploadedInvoiceReference: string | undefined;

  const canAct = (statuses: RequestStatus[], role: Role) => {
    const assignee = getUserById(nextState.users, editable.assigneeId);

    return (
      statuses.includes(editable.status) &&
      actor.role === role &&
      (editable.assigneeId === actor.id || assignee?.role === role)
    );
  };
  const canProcureWorkOnPurchase = () =>
    actor.role === "Edlyn" &&
    !isClosed(editable.status) &&
    [
      "Edlyn Confirmation",
      "Rashid Auto Approved",
      "Purchase in Progress",
      "Invoice Uploaded",
      "Aileen Finance Review",
      "Invoice Cleared",
      "Edlyn Order Confirmation",
      "Delivery Tracking",
      "Order Confirmed",
    ].includes(editable.status);
  const hasText = (value?: string) => Boolean(value?.trim());

  const assignTo = (role: Role, options: { notify?: boolean } = {}) => {
    const assignee = requireRoleUser(state.users, role);
    editable.assigneeId = assignee.id;
    if (options.notify !== false) {
      addNotification(
        nextState.notifications,
        {
          userId: assignee.id,
          requestId,
          title: "Task assigned",
          body: `${editable.id} is now assigned to ${assignee.name}.`,
          type: "assigned",
        },
        dateTime,
      );
    }
    return assignee;
  };
  const applyRoute = (route: WorkflowRoute, type: NotificationRecord["type"] = "assigned") => {
    const resolved = resolveAvailableRoute(editable, state.users, route);
    const assignee = assignTo(resolved.route.role, { notify: false });
    editable.status = resolved.route.status;
    editable.stage = resolved.route.stage;
    addNotification(
      nextState.notifications,
      {
        userId: assignee.id,
        requestId,
        title: resolved.route.title,
        body: resolved.route.body,
        type: resolved.route.status === "Rashid Auto Approved" ? "approved" : type,
      },
      dateTime,
    );
    const skipComment = skippedRolesComment(resolved.skippedRoles);
    if (skipComment) {
      comment = [comment, skipComment].filter(Boolean).join("\n");
    }
    return assignee;
  };
  const applyPostMonaRoute = () => {
    let route = getPostMonaRoute(editable);
    const requester = getUserById(state.users, editable.submittedById);

    if (
      requester &&
      route.stage === "dr-majed" &&
      route.role === requester.role &&
      isSelfApprovalRole(route.role)
    ) {
      const selfPreviousStatus = editable.status;
      editable.status = route.status;
      editable.stage = route.stage;
      editable.assigneeId = requester.id;
      editable.previousResponsibleId = requester.id;
      addAudit(
        nextState.auditLogs,
        editable,
        requester,
        selfPreviousStatus,
        `${requester.name} self-approved own department review`,
        dateTime,
        { assignedPerson: requester.name },
      );
      route = getPostDepartmentReviewRoute(editable);
    }

    return applyRoute(route, route.status === "Rashid Auto Approved" ? "approved" : "assigned");
  };
  const applyPostDepartmentReviewRoute = () => {
    const route = getPostDepartmentReviewRoute(editable);
    return applyRoute(route, route.status === "Rashid Auto Approved" ? "approved" : "assigned");
  };

  switch (workflowAction.type) {
    case "employee-cancel-request": {
      if (
        !isPersonalRequestForUser(editable, actor) ||
        !isRequesterCancellable(editable.status) ||
        !hasText(workflowAction.cancellationReason)
      ) {
        return state;
      }

      const cancellationReason = workflowAction.cancellationReason.trim();
      const currentAssignee = getUserById(state.users, editable.assigneeId);
      const hasReachedProcure =
        editable.stage === "edlyn" ||
        editable.stage === "aileen" ||
        Boolean(editable.invoice) ||
        Boolean(editable.orderConfirmedAt) ||
        Boolean(editable.logistics);

      editable.previousResponsibleId = actor.id;
      editable.cancellationReason = cancellationReason;
      editable.cancelledById = actor.id;
      comment = cancellationReason;

      if (hasReachedProcure) {
        const procureUser = assignTo("Edlyn", { notify: false });
        editable.status = "Cancellation Requested";
        editable.stage = "edlyn";
        actionLabel = "Requester requested cancellation";
        addNotification(
          nextState.notifications,
          {
            userId: procureUser.id,
            requestId,
            title: "Urgent cancellation requested",
            body: `${editable.id} was cancelled by ${actor.name}. Cancel the order immediately. Reason: ${cancellationReason}`,
            type: "system",
          },
          dateTime,
        );

        if (editable.invoice) {
          const financeUser = getUserByRole(state.users, "Aileen");
          if (financeUser) {
            addNotification(
              nextState.notifications,
              {
                userId: financeUser.id,
                requestId,
                title: "Cancellation requested",
                body: `${editable.id} has a cancellation request while invoice documentation may be in progress.`,
                type: "system",
              },
              dateTime,
            );
          }
        }
      } else {
        editable.status = "Cancelled";
        editable.assigneeId = actor.id;
        editable.cancelledAt = dateTime;
        actionLabel = "Requester cancelled request";

        if (currentAssignee && currentAssignee.id !== actor.id) {
          addNotification(
            nextState.notifications,
            {
              userId: currentAssignee.id,
              requestId,
              title: "Request cancelled",
              body: `${editable.id} was cancelled by ${actor.name}. Reason: ${cancellationReason}`,
              type: "system",
            },
            dateTime,
          );
        }
      }
      break;
    }
    case "staff-cancel-request": {
      if (
        actor.role === "Employee" ||
        isClosed(editable.status) ||
        !hasText(workflowAction.cancellationReason)
      ) {
        return state;
      }

      const cancellationReason = workflowAction.cancellationReason.trim();
      const currentAssignee = getUserById(state.users, editable.assigneeId);

      editable.status = "Cancelled";
      editable.assigneeId = actor.id;
      editable.previousResponsibleId = actor.id;
      editable.cancelledAt = dateTime;
      editable.cancelledById = actor.id;
      editable.cancellationReason = cancellationReason;
      actionLabel = "Staff cancelled request";
      comment = cancellationReason;

      if (editable.submittedById !== actor.id) {
        addNotification(
          nextState.notifications,
          {
            userId: editable.submittedById,
            requestId,
            title: "Request cancelled",
            body: `${editable.id} was cancelled by ${actor.name}. Reason: ${cancellationReason}`,
            type: "closed",
          },
          dateTime,
        );
      }

      if (currentAssignee && currentAssignee.id !== actor.id && currentAssignee.id !== editable.submittedById) {
        addNotification(
          nextState.notifications,
          {
            userId: currentAssignee.id,
            requestId,
            title: "Request cancelled",
            body: `${editable.id} was cancelled by ${actor.name}. Reason: ${cancellationReason}`,
            type: "system",
          },
          dateTime,
        );
      }
      break;
    }
    case "mona-approve": {
      if (!canAct(["Mona Review"], "Mona") || editable.stage !== "mona") {
        return state;
      }
      comment = workflowAction.comment;
      const assignee = applyPostMonaRoute();
      editable.previousResponsibleId = actor.id;
      actionLabel =
        editable.status === "Rashid Auto Approved"
          ? "Mona approved request; Rashid auto approved below AED 300"
          : "Mona approved request";
      if (editable.status === "Rashid Auto Approved") {
        comment =
          comment ??
          `Total converted value is AED ${getRequestTotalAed(editable).toFixed(2)}, so Rashid approval was skipped.`;
      }
      if (assignee.id === actor.id) {
        editable.previousResponsibleId = actor.id;
      }
      break;
    }
    case "mona-clarify": {
      if (!canAct(["Mona Review"], "Mona") || !hasText(workflowAction.comment)) {
        return state;
      }
      editable.status = "Sent Back for Clarification";
      editable.stage = "mona";
      editable.assigneeId = editable.submittedById;
      actionLabel = "Sent back for clarification";
      comment = workflowAction.comment;
      addNotification(
        nextState.notifications,
        {
          userId: editable.submittedById,
          requestId,
          title: "Clarification required",
          body: `${editable.id} needs clarification before it can continue.`,
          type: "system",
        },
        dateTime,
      );
      break;
    }
    case "employee-resubmit-mona-clarification": {
      if (
        editable.status !== "Sent Back for Clarification" ||
        actor.id !== editable.submittedById ||
        workflowAction.lineItems.length === 0
      ) {
        return state;
      }

      const lineItems = workflowAction.lineItems.map((item) => ({
        ...item,
        productUrl: item.productUrl ?? "",
      }));
      const totalAed = roundMoney(
        lineItems.reduce((total, item) => total + item.aedTotal, 0),
      );
      const totalQuantity = lineItems.reduce((total, item) => total + item.quantity, 0);
      const vendorName =
        Array.from(new Set(lineItems.map((item) => item.vendorName).filter(Boolean))).join(
          ", ",
        ) || editable.vendorName;
      const assignee = assignTo("Mona", { notify: false });

      editable.lineItems = lineItems;
      editable.estimatedAmountAed = totalAed;
      editable.quantity = totalQuantity;
      editable.exchangeRateDate = lineItems[0]?.exchangeRateDate ?? DEFAULT_EXCHANGE_RATE_DATE;
      editable.exchangeRateSource =
        Array.from(new Set(lineItems.map((item) => item.exchangeRateSource))).join(", ") ||
        editable.exchangeRateSource;
      editable.vendorName = vendorName;
      editable.vendor = {
        ...editable.vendor,
        companyName: vendorName || editable.vendor.companyName,
      };

      if (lineItems.length === 1) {
        const [item] = lineItems;
        editable.itemName = item.itemName;
        editable.itemDescription = item.itemDescription;
        editable.estimatedAmount = item.originalTotal;
        editable.currency = item.currency;
      } else {
        editable.itemName = `Bulk upload (${lineItems.length} items)`;
        editable.itemDescription = `Bulk procurement upload containing ${lineItems.length} item(s).`;
        editable.estimatedAmount = totalAed;
        editable.currency = "AED";
      }

      editable.status = "Mona Review";
      editable.stage = "mona";
      editable.previousResponsibleId = actor.id;
      actionLabel = "Employee updated request and resubmitted";
      comment = hasText(workflowAction.comment)
        ? workflowAction.comment
        : "Updated request details.";
      addNotification(
        nextState.notifications,
        {
          userId: assignee.id,
          requestId,
          title: "Clarification received",
          body: `${editable.id} was updated by ${actor.name} and is back for Mona review.`,
          type: "system",
        },
        dateTime,
      );
      break;
    }
    case "rashid-approve": {
      if (!canAct(["Rashid Review"], "Rashid")) {
        return state;
      }
      const route = getPostRashidRoute(editable);
      applyRoute(route, "assigned");
      editable.previousResponsibleId = actor.id;
      delete editable.procurePriceReviewReturnStatus;
      actionLabel = "Rashid approved request";
      comment = workflowAction.comment;
      break;
    }
    case "rashid-decline": {
      if (!canAct(["Rashid Review"], "Rashid") || !hasText(workflowAction.declineReason)) {
        return state;
      }
      editable.status = "Rashid Declined";
      editable.stage = "rashid";
      editable.assigneeId = editable.submittedById;
      editable.previousResponsibleId = actor.id;
      actionLabel = "Rashid rejected request";
      declineReason = workflowAction.declineReason;
      addNotification(
        nextState.notifications,
        {
          userId: editable.submittedById,
          requestId,
          title: "Request rejected",
          body: `${editable.id} was rejected by Rashid. Reason: ${declineReason}`,
          type: "declined",
        },
        dateTime,
      );
      break;
    }
    case "dr-review":
    case "department-review": {
      const reviewRole = getDepartmentReviewRole(editable.department);
      const reviewStatus = getDepartmentReviewStatus(editable.department);
      const reviewStatuses: RequestStatus[] = reviewStatus
        ? [reviewStatus, "Rashid Auto Approved"]
        : ["Rashid Auto Approved"];

      if (!reviewRole || editable.stage !== "dr-majed" || !canAct(reviewStatuses, reviewRole)) {
        return state;
      }
      const assignee = applyPostDepartmentReviewRoute();
      editable.previousResponsibleId = actor.id;
      actionLabel = `${actor.name} completed department review`;
      comment = workflowAction.comment;
      if (editable.status === "Rashid Auto Approved") {
        comment =
          comment ??
          `Total converted value is AED ${getRequestTotalAed(editable).toFixed(2)}, so Rashid approval was skipped.`;
      }
      if (assignee.id === actor.id) {
        editable.previousResponsibleId = actor.id;
      }
      break;
    }
    case "department-decline": {
      const reviewRole = getDepartmentReviewRole(editable.department);
      const reviewStatus = getDepartmentReviewStatus(editable.department);
      const reviewStatuses: RequestStatus[] = reviewStatus
        ? [reviewStatus, "Rashid Auto Approved"]
        : ["Rashid Auto Approved"];

      if (
        !reviewRole ||
        editable.stage !== "dr-majed" ||
        !canAct(reviewStatuses, reviewRole) ||
        !hasText(workflowAction.declineReason)
      ) {
        return state;
      }

      editable.status = "Department Declined";
      editable.stage = "dr-majed";
      editable.assigneeId = editable.submittedById;
      editable.previousResponsibleId = actor.id;
      actionLabel = `${actor.name} declined department review`;
      declineReason = workflowAction.declineReason;
      addNotification(
        nextState.notifications,
        {
          userId: editable.submittedById,
          requestId,
          title: "Request rejected",
          body: `${editable.id} was rejected by ${actor.name}. Reason: ${declineReason}`,
          type: "declined",
        },
        dateTime,
      );
      break;
    }
    case "dr-majed-update-request": {
      const reviewRole = getDepartmentReviewRole(editable.department);
      const reviewStatus = getDepartmentReviewStatus(editable.department);
      const reviewStatuses: RequestStatus[] = reviewStatus
        ? [reviewStatus, "Rashid Auto Approved"]
        : ["Rashid Auto Approved"];

      if (
        reviewRole !== "Dr. Majed" ||
        editable.stage !== "dr-majed" ||
        !canAct(reviewStatuses, "Dr. Majed") ||
        workflowAction.lineItems.length === 0
      ) {
        return state;
      }

      editable.employeeName = workflowAction.fields.employeeName ?? editable.employeeName;
      editable.department = workflowAction.fields.department ?? editable.department;
      editable.project = workflowAction.fields.project ?? editable.project;
      editable.priority = workflowAction.fields.priority ?? editable.priority;
      editable.requiredByDate =
        workflowAction.fields.requiredByDate ?? editable.requiredByDate;
      editable.reasonForPurchase =
        workflowAction.fields.reasonForPurchase ?? editable.reasonForPurchase;
      editable.vendorName = workflowAction.fields.vendorName ?? editable.vendorName;
      applyLineItemUpdate(editable, workflowAction.lineItems);
      editable.previousResponsibleId = actor.id;
      actionLabel = "Dr. Majed modified request details";
      comment = hasText(workflowAction.comment)
        ? workflowAction.comment
        : "Updated request fields and line items.";
      break;
    }
    case "edlyn-update-researched-prices": {
      const lineItemIds = new Set(getRequestLineItems(editable).map((item) => item.id));
      const itemClarifications = (workflowAction.lineItemClarifications ?? [])
        .map((item) => ({
          lineItemId: item.lineItemId,
          comment: item.comment.trim(),
        }))
        .filter((item) => lineItemIds.has(item.lineItemId) && hasText(item.comment));
      if (
        !canAct(["Edlyn Confirmation", "Purchase in Progress", "Rashid Auto Approved"], "Edlyn") ||
        workflowAction.lineItems.length === 0
      ) {
        return state;
      }

      const returnStatus =
        editable.status === "Purchase in Progress" ? "Purchase in Progress" : "Edlyn Confirmation";
      applyLineItemUpdate(editable, workflowAction.lineItems);
      editable.procurePriceReviewReturnStatus = returnStatus;
      editable.lineItemClarifications =
        itemClarifications.length > 0
          ? itemClarifications.map((item) => ({
              ...item,
              createdAt: dateTime,
              createdBy: actor.id,
              createdByName: actor.name,
            }))
          : editable.lineItemClarifications;
      const route = getPostDepartmentReviewRoute(editable);
      if (route.status === "Rashid Auto Approved") {
        delete editable.procurePriceReviewReturnStatus;
      }
      applyRoute(route, route.status === "Rashid Auto Approved" ? "approved" : "assigned");
      editable.previousResponsibleId = actor.id;
      actionLabel = "Procure updated researched prices";
      comment = hasText(workflowAction.comment)
        ? workflowAction.comment
        : "Updated researched prices and item details.";
      break;
    }
    case "edlyn-update-line-items": {
      const lineItemIds = new Set(getRequestLineItems(editable).map((item) => item.id));
      const itemClarifications = (workflowAction.lineItemClarifications ?? [])
        .map((item) => ({
          lineItemId: item.lineItemId,
          comment: item.comment.trim(),
        }))
        .filter((item) => lineItemIds.has(item.lineItemId) && hasText(item.comment));

      if (!canProcureWorkOnPurchase() || workflowAction.lineItems.length === 0) {
        return state;
      }

      applyLineItemUpdate(editable, workflowAction.lineItems);
      editable.lineItemClarifications =
        itemClarifications.length > 0
          ? itemClarifications.map((item) => ({
              ...item,
              createdAt: dateTime,
              createdBy: actor.id,
              createdByName: actor.name,
            }))
          : editable.lineItemClarifications;
      editable.stage = "edlyn";
      editable.assigneeId = actor.id;
      editable.previousResponsibleId = actor.id;
      actionLabel = "Procure updated line item progress";
      comment = workflowAction.comment;
      break;
    }
    case "edlyn-confirm": {
      if (!canAct(["Edlyn Confirmation", "Rashid Auto Approved"], "Edlyn")) {
        return state;
      }
      editable.status = "Purchase in Progress";
      editable.stage = "edlyn";
      editable.assigneeId = actor.id;
      const sourceLineItems =
        workflowAction.lineItems && workflowAction.lineItems.length > 0
          ? workflowAction.lineItems
          : getRequestLineItems(editable);
      applyLineItemUpdate(
        editable,
        sourceLineItems.map((item) => ({
          ...item,
          status: item.status === "Pending" ? "Processing" : item.status,
          processedAt: item.processedAt ?? dateTime,
        })),
      );
      actionLabel = "Procure confirmed item details";
      comment = hasText(workflowAction.comment)
        ? workflowAction.comment
        : "Confirmed item details and saved current line item quantities.";
      break;
    }
    case "edlyn-request-clarification": {
      const lineItemIds = new Set(getRequestLineItems(editable).map((item) => item.id));
      const itemClarifications = (workflowAction.lineItemClarifications ?? [])
        .map((item) => ({
          lineItemId: item.lineItemId,
          comment: item.comment.trim(),
        }))
        .filter((item) => lineItemIds.has(item.lineItemId) && hasText(item.comment));
      if (
        !canAct(["Edlyn Confirmation", "Purchase in Progress", "Rashid Auto Approved"], "Edlyn") ||
        (!hasText(workflowAction.comment) && itemClarifications.length === 0)
      ) {
        return state;
      }
      editable.edlynClarificationReturnStatus =
        editable.status === "Purchase in Progress"
          ? "Purchase in Progress"
          : "Edlyn Confirmation";
      editable.status = "Edlyn Clarification Requested";
      editable.stage = "edlyn";
      editable.assigneeId = editable.submittedById;
      editable.previousResponsibleId = actor.id;
      editable.lineItemClarifications = itemClarifications.map((item) => ({
        ...item,
        createdAt: dateTime,
        createdBy: actor.id,
        createdByName: actor.name,
      }));
      actionLabel = "Procure requested clarification";
      comment = hasText(workflowAction.comment)
        ? workflowAction.comment
        : itemClarifications
            .map((item, index) => `Item ${index + 1}: ${item.comment}`)
            .join("\n");
      addNotification(
        nextState.notifications,
        {
          userId: editable.submittedById,
          requestId,
          title: "Procure needs clarification",
          body: `${editable.id} needs item or price clarification from you${
            comment ? `: ${comment}` : "."
          }`,
          type: "system",
        },
        dateTime,
      );
      break;
    }
    case "employee-submit-edlyn-clarification": {
      if (
        editable.status !== "Edlyn Clarification Requested" ||
        actor.id !== editable.submittedById
      ) {
        return state;
      }
      const assignee = assignTo("Edlyn", { notify: false });
      if (workflowAction.lineItems && workflowAction.lineItems.length > 0) {
        const lineItems = workflowAction.lineItems.map((item) => ({
          ...item,
          productUrl: item.productUrl ?? "",
        }));
        const totalAed = roundMoney(
          lineItems.reduce((total, item) => total + item.aedTotal, 0),
        );
        const totalQuantity = lineItems.reduce((total, item) => total + item.quantity, 0);
        const vendorName =
          Array.from(new Set(lineItems.map((item) => item.vendorName).filter(Boolean))).join(
            ", ",
          ) || editable.vendorName;

        editable.lineItems = lineItems;
        editable.estimatedAmountAed = totalAed;
        editable.quantity = totalQuantity;
        editable.exchangeRateDate = lineItems[0]?.exchangeRateDate ?? DEFAULT_EXCHANGE_RATE_DATE;
        editable.exchangeRateSource =
          Array.from(new Set(lineItems.map((item) => item.exchangeRateSource))).join(", ") ||
          editable.exchangeRateSource;
        editable.vendorName = vendorName;
        editable.vendor = {
          ...editable.vendor,
          companyName: vendorName || editable.vendor.companyName,
        };

        if (lineItems.length === 1) {
          const [item] = lineItems;
          editable.itemName = item.itemName;
          editable.itemDescription = item.itemDescription;
          editable.estimatedAmount = item.originalTotal;
          editable.currency = item.currency;
        } else {
          editable.itemName = `Bulk upload (${lineItems.length} items)`;
          editable.itemDescription = `Bulk procurement upload containing ${lineItems.length} item(s).`;
          editable.estimatedAmount = totalAed;
          editable.currency = "AED";
        }
      }
      editable.status = editable.edlynClarificationReturnStatus ?? "Edlyn Confirmation";
      editable.stage = "edlyn";
      editable.previousResponsibleId = actor.id;
      delete editable.edlynClarificationReturnStatus;
      delete editable.lineItemClarifications;
      actionLabel = "Employee answered Procure clarification";
      comment = hasText(workflowAction.comment)
        ? workflowAction.comment
        : "Updated item details for Procure.";
      addNotification(
        nextState.notifications,
        {
          userId: assignee.id,
          requestId,
          title: "Clarification received",
          body: `${editable.id} clarification has been submitted and is back with Procure.`,
          type: "system",
        },
        dateTime,
      );
      break;
    }
    case "edlyn-upload-invoice": {
      if (
        !canProcureWorkOnPurchase() ||
        !hasText(workflowAction.invoice.invoiceNumber) ||
        !hasText(workflowAction.invoice.uploadedInvoiceFile) ||
        (!hasText(workflowAction.invoice.uploadedInvoiceStoragePath) &&
          !hasText(workflowAction.invoice.uploadedInvoiceDataUrl)) ||
        !Number.isFinite(workflowAction.invoice.invoiceAmount) ||
        workflowAction.invoice.invoiceAmount <= 0
      ) {
        return state;
      }
      const assignee = assignTo("Aileen", { notify: false });
      if (["Edlyn Confirmation", "Rashid Auto Approved"].includes(editable.status)) {
        editable.status = "Purchase in Progress";
      }
      editable.stage = "edlyn";
      editable.assigneeId = actor.id;
      editable.previousResponsibleId = actor.id;
      const upserted = upsertRequestInvoice(editable, workflowAction.invoice, dateTime);
      actionLabel = upserted.replaced ? "Replaced invoice" : "Uploaded invoice";
      comment = workflowAction.comment;
      uploadedInvoiceReference = upserted.invoice.uploadedInvoiceFile;
      addNotification(
        nextState.notifications,
        {
          userId: assignee.id,
          requestId,
          title: upserted.replaced ? "Invoice replaced" : "Invoice uploaded",
          body: `${editable.id} invoice ${upserted.invoice.invoiceNumber} is ready for finance documentation for ${upserted.lineItemIds.length} item(s).`,
          type: "invoice",
        },
        dateTime,
      );
      break;
    }
    case "aileen-clear-invoice": {
      const pendingInvoices = getPendingFinanceInvoices(editable);
      const invoiceToClear =
        pendingInvoices.find((invoice) => invoice.id === workflowAction.invoiceId) ??
        pendingInvoices[0];

      if (
        actor.role !== "Aileen" ||
        !invoiceToClear ||
        isClosed(editable.status)
      ) {
        return state;
      }
      const assignee = requireRoleUser(state.users, "Edlyn");
      const shouldReturnToProcure = editable.status === "Aileen Finance Review";

      if (shouldReturnToProcure) {
        editable.status = "Edlyn Order Confirmation";
        editable.stage = "edlyn";
        editable.assigneeId = assignee.id;
      }
      editable.invoice = editable.invoice
        ? {
            ...editable.invoice,
            financeNotes:
              workflowAction.financeNotes || editable.invoice.financeNotes,
            clearedAt: dateTime,
          }
        : editable.invoice;
      setRequestInvoices(
        editable,
        getRequestInvoices(editable).map((invoice) =>
          invoice.id === invoiceToClear.id
            ? {
                ...invoice,
                financeNotes: workflowAction.financeNotes || invoice.financeNotes,
                clearedAt: dateTime,
                status: "Cleared",
              }
            : invoice,
        ),
      );
      actionLabel = "Finance cleared invoice";
      comment = workflowAction.financeNotes;
      addNotification(
        nextState.notifications,
        {
          userId: editable.submittedById,
          requestId,
          title: "Invoice cleared",
          body: `${editable.id} invoice ${invoiceToClear.invoiceNumber} has been documented by finance.`,
          type: "finance",
        },
        dateTime,
      );
      addNotification(
        nextState.notifications,
        {
          userId: assignee.id,
          requestId,
          title: shouldReturnToProcure ? "Order confirmation required" : "Invoice cleared",
          body: workflowAction.financeNotes?.trim()
            ? `${editable.id} invoice ${invoiceToClear.invoiceNumber} is cleared by finance. Finance note: ${workflowAction.financeNotes.trim()}`
            : `${editable.id} invoice ${invoiceToClear.invoiceNumber} has been documented by finance.`,
          type: "finance",
        },
        dateTime,
      );
      break;
    }
    case "edlyn-confirm-order":
    case "edlyn-start-delivery-tracking": {
      if (!canProcureWorkOnPurchase()) {
        return state;
      }
      editable.status = "Delivery Tracking";
      editable.stage = "edlyn";
      editable.assigneeId = actor.id;
      editable.orderConfirmedAt = dateTime;
      applyLineItemUpdate(
        editable,
        getRequestLineItems(editable).map((item) => ({
          ...item,
          status:
            item.status === "Cancelled" || item.status === "On hold"
              ? item.status
              : "Purchased",
          processedAt: item.processedAt ?? dateTime,
        })),
      );
      editable.logistics = mergeLogistics(
        editable.logistics,
        workflowAction.type === "edlyn-start-delivery-tracking"
          ? {
              ...workflowAction.logistics,
              deliveryStatus:
                workflowAction.logistics?.deliveryStatus ?? "Order placed",
            }
          : { deliveryStatus: "Order placed" },
        dateTime,
      );
      actionLabel = "Confirmed order and started delivery tracking";
      comment = workflowAction.comment;
      addNotification(
        nextState.notifications,
        {
          userId: editable.submittedById,
          requestId,
          title: "Order placed",
          body: `${editable.id} order has been placed.`,
          type: "order",
        },
        dateTime,
      );
      break;
    }
    case "edlyn-update-logistics": {
      if (!canAct(["Delivery Tracking"], "Edlyn")) {
        return state;
      }
      editable.logistics = mergeLogistics(editable.logistics, workflowAction.logistics, dateTime);
      editable.stage = "edlyn";
      editable.assigneeId = actor.id;
      actionLabel = "Updated delivery tracking";
      comment = workflowAction.comment || workflowAction.logistics.notes;
      addNotification(
        nextState.notifications,
        {
          userId: editable.submittedById,
          requestId,
          title: "Delivery update",
          body: `${editable.id} delivery status was updated to ${editable.logistics.deliveryStatus}.`,
          type: "order",
        },
        dateTime,
      );
      break;
    }
    case "edlyn-receive-item": {
      if (!canAct(["Order Confirmed", "Delivery Tracking"], "Edlyn")) {
        return state;
      }
      const assignee = assignTo("Aileen", { notify: false });
      editable.status = "Item Received";
      editable.stage = "aileen";
      editable.itemReceivedAt = dateTime;
      applyLineItemUpdate(
        editable,
        getRequestLineItems(editable).map((item) => ({
          ...item,
          status:
            item.status === "Cancelled" || item.status === "On hold"
              ? item.status
              : "Delivered",
          deliveredAt:
            item.status === "Cancelled" || item.status === "On hold"
              ? item.deliveredAt
              : (item.deliveredAt ?? dateTime),
        })),
      );
      editable.logistics = mergeLogistics(
        editable.logistics,
        { deliveryStatus: "Delivered", lastCheckpoint: "Item received" },
        dateTime,
      );
      actionLabel = "Marked item received";
      comment = workflowAction.comment;
      addNotification(
        nextState.notifications,
        {
          userId: assignee.id,
          requestId,
          title: "Case ready to close",
          body: `${editable.id} item was received and is ready for final closure.`,
          type: "received",
        },
        dateTime,
      );
      addNotification(
        nextState.notifications,
        {
          userId: editable.submittedById,
          requestId,
          title: "Item received",
          body: `${editable.id} has been marked as received.`,
          type: "received",
        },
        dateTime,
      );
      break;
    }
    case "edlyn-confirm-cancellation": {
      if (!canAct(["Cancellation Requested"], "Edlyn")) {
        return state;
      }
      editable.status = "Cancelled";
      editable.stage = "edlyn";
      editable.assigneeId = actor.id;
      editable.cancelledAt = dateTime;
      editable.cancelledById = editable.cancelledById ?? actor.id;
      actionLabel = "Procure confirmed cancellation";
      comment = workflowAction.comment;
      addNotification(
        nextState.notifications,
        {
          userId: editable.submittedById,
          requestId,
          title: "Request cancelled",
          body: `${editable.id} cancellation has been confirmed by Procure.`,
          type: "closed",
        },
        dateTime,
      );
      break;
    }
    case "aileen-close": {
      if (!canAct(["Item Received"], "Aileen") || isInvoiceFinancePending(editable)) {
        return state;
      }
      editable.status = "Completed";
      editable.stage = "aileen";
      editable.assigneeId = actor.id;
      editable.completedAt = dateTime;
      actionLabel = "Closed procurement case";
      comment = workflowAction.comment;
      addNotification(
        nextState.notifications,
        {
          userId: editable.submittedById,
          requestId,
          title: "Case fully closed",
          body: `${editable.id} has been completed and closed.`,
          type: "closed",
        },
        dateTime,
      );
      break;
    }
    case "admin-reassign": {
      if (actor.role !== "Admin") {
        return state;
      }
      const assignee = getUserById(state.users, workflowAction.assigneeId);
      if (!assignee) {
        return state;
      }
      editable.assigneeId = assignee.id;
      actionLabel = "Admin reassigned request";
      comment = workflowAction.comment;
      addNotification(
        nextState.notifications,
        {
          userId: assignee.id,
          requestId,
          title: "Request reassigned",
          body: `${editable.id} was manually reassigned to you.`,
          type: "assigned",
        },
        dateTime,
      );
      break;
    }
  }

  editable.updatedAt = dateTime;
  addAudit(nextState.auditLogs, editable, actor, previousStatus, actionLabel, dateTime, {
    comment,
    declineReason,
    uploadedInvoiceReference,
    assignedPerson: getAssigneeName(editable, state.users),
  });

  queueOutboundNotificationsForNewInternalNotifications(
    nextState,
    existingNotificationIds,
    dateTime,
  );

  return nextState;
}

function getLeaveReroute(request: ProcurementRequest, unavailableUser: UserProfile) {
  if (isClosed(request.status) || request.assigneeId !== unavailableUser.id) {
    return null;
  }

  if (
    unavailableUser.role === "Mona" &&
    request.stage === "mona" &&
    request.status === "Mona Review"
  ) {
    return getPostMonaRoute(request);
  }

  if (
    ["Mona", "Dr. Majed", "Amro"].includes(unavailableUser.role) &&
    request.stage === "dr-majed" &&
    ["Mona Review", "Dr. Majed Review", "Amro Review", "Rashid Auto Approved"].includes(
      request.status,
    )
  ) {
    return getPostDepartmentReviewRoute(request);
  }

  if (
    unavailableUser.role === "Rashid" &&
    request.stage === "rashid" &&
    request.status === "Rashid Review"
  ) {
    return getPostRashidRoute(request);
  }

  return null;
}

export function updateUserAvailability(
  state: ProcurementState,
  userId: string,
  active: boolean,
  actorId = "user-admin",
) {
  const targetUser = getUserById(state.users, userId);
  const actor = getUserById(state.users, actorId) ?? targetUser;

  if (!targetUser || !actor || targetUser.active === active) {
    return state;
  }

  const dateTime = nowIso();
  const users = state.users.map((user) =>
    user.id === userId ? { ...user, active } : user,
  );
  const nextState: ProcurementState = {
    ...state,
    users,
    requests: state.requests.map((request) => ({
      ...request,
      invoices: request.invoices?.map((invoice) => ({ ...invoice })),
      invoice: request.invoice ? { ...request.invoice } : request.invoice,
      logistics: request.logistics ? { ...request.logistics } : request.logistics,
    })),
    auditLogs: [...state.auditLogs],
    notifications: [...state.notifications],
    outboundNotifications: [...(state.outboundNotifications ?? [])],
  };
  const existingNotificationIds = new Set(state.notifications.map((notification) => notification.id));

  if (active || !isSkippableReviewRole(targetUser.role)) {
    return nextState;
  }

  nextState.requests.forEach((request) => {
    const route = getLeaveReroute(request, targetUser);

    if (!route) {
      return;
    }

    const previousStatus = request.status;
    const resolved = resolveAvailableRoute(request, users, route);
    const assignee =
      getAvailableUserByRole(users, resolved.route.role) ??
      getUserByRole(users, resolved.route.role);

    if (!assignee || assignee.id === targetUser.id) {
      return;
    }

    request.status = resolved.route.status;
    request.stage = resolved.route.stage;
    request.assigneeId = assignee.id;
    request.updatedAt = dateTime;

    const skippedRoles = Array.from(
      new Set<Role>([
        targetUser.role,
        ...resolved.skippedRoles,
      ]),
    );
    const skipComment = skippedRolesComment(skippedRoles);

    addNotification(
      nextState.notifications,
      {
        userId: assignee.id,
        requestId: request.id,
        title: "Request rerouted",
        body: `${request.id} moved to you because ${targetUser.name} is marked on leave.`,
        type: resolved.route.status === "Rashid Auto Approved" ? "approved" : "assigned",
      },
      dateTime,
    );
    addAudit(
      nextState.auditLogs,
      request,
      actor,
      previousStatus,
      `${targetUser.name} marked on leave; request rerouted`,
      dateTime,
      {
        assignedPerson: assignee.name,
        comment: skipComment,
      },
    );
  });

  queueOutboundNotificationsForNewInternalNotifications(
    nextState,
    existingNotificationIds,
    dateTime,
  );

  return nextState;
}

export function markNotificationRead(
  state: ProcurementState,
  notificationId: string,
) {
  return {
    ...state,
    notifications: state.notifications.map((notification) =>
      notification.id === notificationId
        ? { ...notification, read: true }
        : notification,
    ),
  };
}

export function getVisibleRequests(state: ProcurementState, user: UserProfile) {
  if (user.role === "Admin") {
    return state.requests.filter((request) => request.status !== "Cancelled");
  }

  if (user.role === "Employee") {
    return getPersonalRequests(state, user);
  }

  return state.requests.filter(
    (request) =>
      request.status !== "Cancelled" &&
      (request.assigneeId === user.id ||
        request.submittedById === user.id ||
        (user.role === "Aileen" && isInvoiceFinancePending(request))),
  );
}

export function getCancelledRequests(state: ProcurementState, user: UserProfile) {
  if (user.role === "Employee") {
    return getPersonalRequests(state, user).filter((request) => request.status === "Cancelled");
  }

  return state.requests.filter((request) => request.status === "Cancelled");
}

export function isPersonalRequestForUser(request: ProcurementRequest, user: UserProfile) {
  return (
    request.submittedById === user.id ||
    request.employeeName.trim().toLowerCase() === user.name.trim().toLowerCase()
  );
}

export function getPersonalRequests(state: ProcurementState, user: UserProfile) {
  return state.requests.filter((request) => isPersonalRequestForUser(request, user));
}

export function getStuckRequests(
  requests: ProcurementRequest[],
  referenceDate = new Date(),
) {
  return requests.filter((request) => isRequestOverdue(request, referenceDate));
}

export function isUserBlockedTask(
  request: ProcurementRequest,
  user: UserProfile,
  referenceDate = new Date(),
) {
  return (
    !isClosed(request.status) &&
    request.assigneeId === user.id &&
    getStuckRequests([request], referenceDate).length > 0
  );
}

export function getUserBlockedTasks(
  requests: ProcurementRequest[],
  user: UserProfile,
  referenceDate = new Date(),
) {
  return requests.filter((request) => isUserBlockedTask(request, user, referenceDate));
}

export function getDailyReminderRecipients(users: UserProfile[]) {
  return DAILY_REMINDER_ROLES.map((role) =>
    users.find((user) => user.role === role && user.active),
  ).filter((user): user is UserProfile => {
    if (!user) {
      return false;
    }

    return isUserReminderNotificationEnabled(user);
  });
}

export function getActiveAssignedRequests(
  requests: ProcurementRequest[],
  user: UserProfile,
) {
  return requests.filter(
    (request) =>
      !isClosed(request.status) &&
      (request.assigneeId === user.id ||
        (user.role === "Aileen" && isInvoiceFinancePending(request))),
  );
}

function htmlEscape(value: string) {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");
}

export function getDailyReminderEmailPayloads(
  state: ProcurementState,
  dashboardUrl: string,
  referenceDate = new Date(),
): DailyReminderEmail[] {
  const dashboardLink = dashboardUrl || "https://procurement.sulmi.ai/";

  return getDailyReminderRecipients(state.users).map((user) => {
    const activeRequests = getActiveAssignedRequests(state.requests, user);
    const overdueRequests = activeRequests.filter((request) =>
      isRequestOverdue(request, referenceDate),
    );
    const activeRequestIds = activeRequests.map((request) => request.id);
    const overdueRequestIds = overdueRequests.map((request) => request.id);
    const roleLabel = getRoleDisplayName(user.role);
    const subject =
      overdueRequests.length > 0
        ? `Procurement dashboard reminder: ${overdueRequests.length} overdue task(s)`
        : "Procurement dashboard reminder";
    const activeText =
      activeRequestIds.length > 0 ? activeRequestIds.join(", ") : "No active tasks";
    const overdueText =
      overdueRequestIds.length > 0 ? overdueRequestIds.join(", ") : "None";
    const text = [
      `Hi ${user.name},`,
      "",
      "Please check the Procurement Workflow OS dashboard today.",
      `Role queue: ${roleLabel}`,
      `Active assigned tasks: ${activeRequests.length} (${activeText})`,
      `Over 24 hours: ${overdueRequests.length} (${overdueText})`,
      "",
      `Dashboard: ${dashboardLink}`,
    ].join("\n");
    const html = [
      `<p>Hi ${htmlEscape(user.name)},</p>`,
      "<p>Please check the Procurement Workflow OS dashboard today.</p>",
      "<ul>",
      `<li><strong>Role queue:</strong> ${htmlEscape(roleLabel)}</li>`,
      `<li><strong>Active assigned tasks:</strong> ${activeRequests.length} (${htmlEscape(activeText)})</li>`,
      `<li><strong>Over 24 hours:</strong> ${overdueRequests.length} (${htmlEscape(overdueText)})</li>`,
      "</ul>",
      `<p><a href="${htmlEscape(dashboardLink)}">Open Procurement Workflow OS</a></p>`,
    ].join("");

    return {
      userId: user.id,
      name: user.name,
      role: user.role,
      roleLabel,
      email: user.email,
      slackUserId: user.slackUserId,
      notificationsEnabled: isUserNotificationEnabled(user),
      emailNotificationsEnabled: isUserEmailNotificationEnabled(user),
      slackNotificationsEnabled: isUserSlackNotificationEnabled(user),
      activeCount: activeRequests.length,
      overdueCount: overdueRequests.length,
      activeRequestIds,
      overdueRequestIds,
      subject,
      text,
      html,
    };
  });
}

export function getMetrics(requests: ProcurementRequest[]) {
  const completed = requests.filter((request) => request.status === "Completed");
  const durations = completed
    .filter((request) => request.completedAt)
    .map((request) => {
      const start = new Date(request.createdAt).getTime();
      const finish = new Date(request.completedAt as string).getTime();
      return Math.max(0, finish - start) / (1000 * 60 * 60 * 24);
    });

  const averageProcessingTime =
    durations.length === 0
      ? 0
      : durations.reduce((total, duration) => total + duration, 0) / durations.length;

  return {
    total: requests.length,
    pendingApprovals: requests.filter((request) => isApprovalStatus(request.status)).length,
    approved: requests.filter((request) => isApprovedStatus(request.status)).length,
    declined: requests.filter((request) => isDeclined(request.status)).length,
    completed: completed.length,
    pendingInvoice: requests.filter(
      (request) =>
        request.status === "Purchase in Progress" && getRequestInvoices(request).length === 0,
    ).length,
    pendingItemReceipt: requests.filter((request) =>
      [
        "Purchase in Progress",
        "Invoice Cleared",
        "Edlyn Order Confirmation",
        "Delivery Tracking",
        "Order Confirmed",
      ].includes(request.status) && getRequestInvoices(request).length > 0,
    ).length,
    averageProcessingTime,
    stuck: getStuckRequests(requests).length,
  };
}

export function createDailyReminderNotifications(state: ProcurementState) {
  const dateTime = nowIso();
  const recipients = getDailyReminderRecipients(state.users);
  const nextNotifications = [...state.notifications];

  recipients.forEach((user) => {
    const activeRequests = getActiveAssignedRequests(state.requests, user);
    const overdueRequests = activeRequests.filter((request) =>
      isRequestOverdue(request),
    );
    const requestIds = activeRequests.map((request) => request.id);
    const overdueIds = overdueRequests.map((request) => request.id);

    addNotification(
      nextNotifications,
      {
        userId: user.id,
        requestId: activeRequests[0]?.id ?? null,
        title: "Daily dashboard reminder",
        body:
          overdueRequests.length > 0
            ? `Please check your procurement dashboard. ${overdueRequests.length} task(s) are over ${OVERDUE_REQUEST_HOURS} hours: ${overdueIds.join(", ")}.`
            : `Please check your procurement dashboard. Active task(s): ${requestIds.length > 0 ? requestIds.join(", ") : "none"}.`,
        type: "reminder",
      },
      dateTime,
    );
  });

  return {
    ...state,
    notifications: nextNotifications,
  };
}

export function applyLaunchCleanup(state: ProcurementState): ProcurementState {
  if (state.maintenance?.launchCleanupVersion === LAUNCH_CLEANUP_VERSION) {
    return state;
  }

  const cleanupCutoff = new Date(LAUNCH_CLEANUP_CUTOFF_ISO).getTime();
  const requestIdsToRemove = new Set(
    state.requests
      .filter((request) => {
        const createdAt = new Date(request.createdAt).getTime();
        return Number.isFinite(createdAt) && createdAt <= cleanupCutoff;
      })
      .map((request) => request.id),
  );

  return {
    ...state,
    requests: state.requests.filter((request) => !requestIdsToRemove.has(request.id)),
    auditLogs: state.auditLogs.filter((log) => !requestIdsToRemove.has(log.requestId)),
    notifications: [],
    chatbotMessages: [],
    maintenance: {
      ...state.maintenance,
      launchCleanupVersion: LAUNCH_CLEANUP_VERSION,
      launchCleanupAt: nowIso(),
      launchCleanupRemovedRequests: requestIdsToRemove.size,
    },
  };
}

export function answerProcurementQuestion(
  question: string,
  state: ProcurementState,
  currentUser: UserProfile,
) {
  const normalized = question.trim().toLowerCase();
  const requestId = question.match(/PR-\d+/i)?.[0]?.toUpperCase();
  const visible = getVisibleRequests(state, currentUser);
  const canSeePrices = currentUser.role !== "Employee";
  const describe = (request: ProcurementRequest) => {
    const priceText = canSeePrices
      ? ` Total AED ${getRequestTotalAed(request).toFixed(2)} across ${getRequestItemCount(request)} item(s).`
      : ` ${getRequestItemCount(request)} item(s).`;
    const logisticsText = request.logistics?.deliveryStatus
      ? ` Delivery: ${request.logistics.deliveryStatus}.`
      : "";
    return `${request.id}: ${request.itemName} for ${request.project} is ${request.status}, stage ${WORKFLOW_STAGES.find((stage) => stage.key === request.stage)?.label}, assigned to ${getAssigneeName(request, state.users)}.${priceText}${logisticsText}`;
  };

  if (!normalized) {
    return `Ask me about request status, pending approvals, invoices, requests over ${OVERDUE_REQUEST_HOURS} hours, order placement, or completed requests.`;
  }

  if (requestId) {
    const request = state.requests.find((candidate) => candidate.id === requestId);
    return request
      ? describe(request)
      : `I could not find ${requestId}. Check the request ID and try again.`;
  }

  if (normalized.includes("pending with rashid")) {
    const rows = state.requests.filter((request) => request.status === "Rashid Review");
    return rows.length
      ? rows.map(describe).join("\n")
      : "No requests are currently pending with Rashid.";
  }

  if (normalized.includes("pending with mona")) {
    const rows = state.requests.filter(
      (request) =>
        request.status === "Mona Review" ||
        (request.status === "Rashid Auto Approved" &&
          getDepartmentReviewRole(request.department) === "Mona"),
    );
    return rows.length
      ? rows.map(describe).join("\n")
      : "No requests are currently pending with Mona.";
  }

  if (
    normalized.includes("pending with dr") ||
    normalized.includes("pending with dr. masjid") ||
    normalized.includes("pending with dr. majed")
  ) {
    const rows = state.requests.filter(
      (request) =>
        request.status === "Dr. Majed Review" ||
        (request.status === "Rashid Auto Approved" &&
          getDepartmentReviewRole(request.department) === "Dr. Majed"),
    );
    return rows.length
      ? rows.map(describe).join("\n")
      : "No requests are currently pending with Dr. Majed.";
  }

  if (normalized.includes("pending with amro") || normalized.includes("pending with aamro")) {
    const rows = state.requests.filter(
      (request) =>
        request.status === "Amro Review" ||
        (request.status === "Rashid Auto Approved" &&
          getDepartmentReviewRole(request.department) === "Amro"),
    );
    return rows.length
      ? rows.map(describe).join("\n")
      : "No requests are currently pending with Amro.";
  }

  if (
    normalized.includes("invoice") &&
    (normalized.includes("aileen") || normalized.includes("finance"))
  ) {
    const rows = state.requests.filter((request) => isInvoiceFinancePending(request));
    return rows.length
      ? rows.map(describe).join("\n")
      : "No invoices are currently pending with Finance.";
  }

  if (
    normalized.includes("stuck") ||
    normalized.includes("more than 2 days") ||
    normalized.includes("over 24") ||
    normalized.includes("24 hours")
  ) {
    const rows = getStuckRequests(state.requests);
    return rows.length
      ? rows.map(describe).join("\n")
      : `No active requests are over ${OVERDUE_REQUEST_HOURS} hours without an update.`;
  }

  if (normalized.includes("order") && normalized.includes("placed")) {
    const latest = visible
      .filter((request) =>
        ["Delivery Tracking", "Order Confirmed", "Item Received", "Completed"].includes(request.status),
      )
      .sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime())[0];
    return latest
      ? `${latest.id} has an order placed status. ${describe(latest)}`
      : "I do not see an order placed yet for your visible requests.";
  }

  if (normalized.includes("completed") && normalized.includes("month")) {
    const now = new Date();
    const rows = state.requests.filter((request) => {
      if (!request.completedAt) {
        return false;
      }
      const completedAt = new Date(request.completedAt);
      return (
        completedAt.getFullYear() === now.getFullYear() &&
        completedAt.getMonth() === now.getMonth()
      );
    });
    return rows.length
      ? rows.map(describe).join("\n")
      : "No requests have been completed this month.";
  }

  if (normalized.includes("my request") || normalized.includes("status")) {
    const latest = visible
      .slice()
      .sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime())[0];
    return latest
      ? describe(latest)
      : "I cannot see any procurement requests for your current role.";
  }

  return `I can answer questions such as: status of my request, pending with Mona, pending with Rashid, pending with Dr. Majed, pending with Amro, invoices pending with Finance, over ${OVERDUE_REQUEST_HOURS} hours, order placed, request PR-102 stage, or completed requests this month.`;
}

export function serializeState(state: ProcurementState) {
  return JSON.stringify(state);
}

export function parseState(serialized: string | null) {
  const migrateText = (value?: string) =>
    (value ?? "")
      .replaceAll("Layla Hassan", "Abel Gonsalves")
      .replaceAll("Omar Farouk", "Bilal G")
      .replaceAll("Dr. Masjid", "Dr. Majed")
      .replaceAll("dr.masjid", "dr.majed")
      .replaceAll("Dr. Majed approval", "Dr. Majed review");
  const migrateApprovalDisplayText = (value?: string) =>
    migrateText(value)
      .replaceAll("edlyn@example.com", PROCURE_APPROVAL_EMAIL)
      .replaceAll("aileen@example.com", FINANCE_APPROVAL_EMAIL)
      .replaceAll("Edlyn", "Procure")
      .replaceAll("Aileen", "Finance");
  const migrateUserId = (userId?: string) =>
    userId === "user-dr-masjid" ? "user-dr-majed" : (userId ?? "");
  const migrateRole = (role: unknown): Role => {
    const roleText = migrateText(String(role));
    if (roleText === "Procure") return "Edlyn";
    if (roleText === "Finance") return "Aileen";
    return ROLES.includes(roleText as Role) ? (roleText as Role) : "Employee";
  };
  const migrateStatus = (status: unknown): RequestStatus => {
    const statusText = migrateText(String(status));
    if (statusText === "Dr. Majed Declined") {
      return "Dr. Majed Review";
    }
    return STATUSES.includes(statusText as RequestStatus)
      ? (statusText as RequestStatus)
      : "Mona Review";
  };
  const migrateStage = (stage: unknown): WorkflowStage => {
    const stageText = stage === "dr-masjid" ? "dr-majed" : String(stage);
    return WORKFLOW_STAGES.some((candidate) => candidate.key === stageText)
      ? (stageText as WorkflowStage)
      : "mona";
  };
  const migrateDepartment = (department: string) =>
    department === "IT"
      ? "Engineering"
      : department === "Facilities"
        ? "Operations"
        : department;
  const normalizeProjectOptions = (options?: string[]) => {
    const source = Array.isArray(options) ? options : [...DEFAULT_PROJECT_OPTIONS];
    const deduped = Array.from(
      new Set(source.map((option) => String(option).trim()).filter(Boolean)),
    );
    return deduped.length > 0 ? deduped : [...DEFAULT_PROJECT_OPTIONS];
  };
  const normalizeUserNotificationPreferences = (user: UserProfile): UserProfile => ({
    ...user,
    slackUserId: textValue(user.slackUserId),
    notificationsEnabled: user.notificationsEnabled !== false,
    emailNotificationsEnabled: user.emailNotificationsEnabled !== false,
    slackNotificationsEnabled: user.slackNotificationsEnabled !== false,
    reminderNotificationsEnabled: user.reminderNotificationsEnabled !== false,
  });
  const normalizeApprovalUser = (user: UserProfile): UserProfile => {
    const migratedUser = {
      ...user,
      id: migrateUserId(user.id),
      name: migrateText(user.name),
      email: migrateText(user.email),
      role: migrateRole(user.role),
    };
    const email = migratedUser.email.toLowerCase();
    const personalRequesterEmails = new Set([
      "edlyn@sulmi.ai",
      "ednyl@sulmi.ai",
      "endyl@sulmi.ai",
      "aileen@sulmi.ai",
      "alieen@sulmi.ai",
    ]);

    if (
      migratedUser.id === "user-edlyn" ||
      email === "edlyn@example.com" ||
      email === PROCURE_APPROVAL_EMAIL.toLowerCase()
    ) {
      return normalizeUserNotificationPreferences({
        ...migratedUser,
        name: "Procure",
        email: PROCURE_APPROVAL_EMAIL,
        role: "Edlyn",
        department: "Procurement",
        active: true,
      });
    }

    if (
      migratedUser.id === "user-aileen" ||
      email === "aileen@example.com" ||
      email === FINANCE_APPROVAL_EMAIL.toLowerCase()
    ) {
      return normalizeUserNotificationPreferences({
        ...migratedUser,
        name: "Finance",
        email: FINANCE_APPROVAL_EMAIL,
        role: "Aileen",
        department: "Finance",
        active: true,
      });
    }

    if (personalRequesterEmails.has(email)) {
      return normalizeUserNotificationPreferences({
        ...migratedUser,
        role: "Employee",
      });
    }

    return normalizeUserNotificationPreferences(migratedUser);
  };

  const migrateState = (
    state: ProcurementState & { projectOptions?: string[] },
  ): ProcurementState => {
    const migratedUsers = state.users.map(normalizeApprovalUser);
    for (const role of ["Mona", "Amro", "Edlyn", "Aileen"] as const) {
      if (!migratedUsers.some((user) => user.role === role)) {
        migratedUsers.push(requireRoleUser(seedUsers, role));
      }
    }
    const monaUser = migratedUsers.find((user) => user.role === "Mona");
    const drMajedUser = migratedUsers.find((user) => user.role === "Dr. Majed");
    const amroUser = migratedUsers.find((user) => user.role === "Amro");
    const edlynUser = migratedUsers.find((user) => user.role === "Edlyn");
    const projectOptions = normalizeProjectOptions(state.projectOptions);
    const migratedNotifications = state.notifications.map((notification) => {
      const migratedBody = migrateApprovalDisplayText(notification.body);

      return {
        ...notification,
        userId: migrateUserId(notification.userId),
        title:
          notification.title === "Approval pending" &&
          migratedBody.includes("Dr. Majed")
            ? "Review pending"
            : migrateApprovalDisplayText(notification.title),
        body: migratedBody,
      };
    });
    const notificationKey = (notification: NotificationRecord) =>
      `${notification.userId}|${notification.requestId}|${notification.createdAt}`;
    const specificNotificationKeys = new Set(
      migratedNotifications
        .filter((notification) => notification.title !== "Task assigned")
        .map(notificationKey),
    );
    const notifications = migratedNotifications.filter(
      (notification) =>
        notification.title !== "Task assigned" ||
        !specificNotificationKeys.has(notificationKey(notification)),
    );
    const normalizeOutboundNotification = (
      delivery: Partial<OutboundNotificationLog>,
    ): OutboundNotificationLog | null => {
      const id = textValue(delivery.id).trim();
      const notificationId = textValue(delivery.notificationId).trim();
      const userId = migrateUserId(delivery.userId);
      const channel = delivery.channel === "slack" ? "slack" : "email";
      const status = ["queued", "sent", "failed", "skipped"].includes(
        String(delivery.status),
      )
        ? (delivery.status as OutboundNotificationStatus)
        : "queued";

      if (!id || !notificationId || !userId) {
        return null;
      }

      return {
        id,
        notificationId,
        userId,
        requestId: delivery.requestId ? migrateText(String(delivery.requestId)) : null,
        channel,
        eventType:
          delivery.eventType && delivery.eventType !== "reminder"
            ? delivery.eventType
            : "system",
        title: migrateApprovalDisplayText(delivery.title),
        body: migrateApprovalDisplayText(delivery.body),
        requesterName: delivery.requesterName
          ? migrateApprovalDisplayText(delivery.requesterName)
          : undefined,
        itemName: delivery.itemName ? migrateApprovalDisplayText(delivery.itemName) : undefined,
        totalAed: finiteNumberValue(delivery.totalAed, 0) || undefined,
        project: delivery.project ? String(delivery.project) : undefined,
        department: delivery.department ? migrateDepartment(String(delivery.department)) : undefined,
        stageLabel: delivery.stageLabel ? migrateApprovalDisplayText(delivery.stageLabel) : undefined,
        pendingAction: delivery.pendingAction
          ? migrateApprovalDisplayText(delivery.pendingAction)
          : undefined,
        status,
        attempts: finiteNumberValue(delivery.attempts, 0),
        createdAt: textValue(delivery.createdAt, nowIso()),
        updatedAt: textValue(delivery.updatedAt, delivery.createdAt ?? nowIso()),
        sentAt: textValue(delivery.sentAt) || undefined,
        error: textValue(delivery.error) || undefined,
        providerMessageId: textValue(delivery.providerMessageId) || undefined,
      };
    };

    return {
      ...state,
      projectOptions,
      users: migratedUsers,
      requests: state.requests.map((request) => {
        const statusText = migrateText(String(request.status));
        const deprecatedDrDecline = statusText === "Dr. Majed Declined";
        const migratedStage = deprecatedDrDecline ? "dr-majed" : migrateStage(request.stage);
        const migratedStatus = deprecatedDrDecline
          ? "Dr. Majed Review"
          : migrateStatus(request.status);
        const currentStatus =
          migratedStatus === "Invoice Cleared" && migratedStage === "edlyn"
            ? "Edlyn Order Confirmation"
            : migratedStatus;
        const department = migrateDepartment(request.department);
        const reviewRole = getDepartmentReviewRole(department);
        const reroutePendingDepartmentReview =
          migratedStage === "dr-majed" &&
          ["Dr. Majed Review", "Amro Review", "Rashid Auto Approved"].includes(currentStatus);
        let nextStatus = currentStatus;
        let nextStage = migratedStage;
        let nextAssigneeId =
          deprecatedDrDecline && drMajedUser
            ? drMajedUser.id
            : migrateUserId(request.assigneeId);

        if (reroutePendingDepartmentReview) {
          if (reviewRole === "Dr. Majed" && drMajedUser) {
            nextStatus =
              currentStatus === "Rashid Auto Approved" ? currentStatus : "Dr. Majed Review";
            nextAssigneeId = drMajedUser.id;
          } else if (reviewRole === "Mona" && monaUser) {
            nextStatus =
              currentStatus === "Rashid Auto Approved" ? currentStatus : "Mona Review";
            nextAssigneeId = monaUser.id;
          } else if (reviewRole === "Amro" && amroUser) {
            nextStatus = currentStatus === "Rashid Auto Approved" ? currentStatus : "Amro Review";
            nextAssigneeId = amroUser.id;
          } else if (!reviewRole && edlynUser) {
            nextStatus =
              currentStatus === "Rashid Auto Approved" ? currentStatus : "Edlyn Confirmation";
            nextStage = "edlyn";
            nextAssigneeId = edlynUser.id;
          }
        }

        if (currentStatus === "Rashid Declined") {
          nextAssigneeId = migrateUserId(request.submittedById);
        }

        return normalizeRequestFinancials({
          ...request,
          project: request.project || projectOptions[0] || DEFAULT_PROJECT_OPTIONS[0],
          department,
          employeeName: migrateText(request.employeeName),
          itemDescription: migrateText(request.itemDescription),
          reasonForPurchase: migrateText(request.reasonForPurchase),
          vendorName: migrateText(request.vendorName),
          status: nextStatus,
          stage: nextStage,
          assigneeId: nextAssigneeId,
          submittedById: migrateUserId(request.submittedById),
          previousResponsibleId: request.previousResponsibleId
            ? migrateUserId(request.previousResponsibleId)
            : undefined,
          lineItems: getRequestLineItems(request).map((item) => ({
            ...item,
            itemDescription: migrateText(item.itemDescription),
            productUrl: item.productUrl ?? "",
            vendorName: migrateText(item.vendorName),
          })),
          lineItemClarifications: Array.isArray(request.lineItemClarifications)
            ? request.lineItemClarifications.map((item) => ({
                ...item,
                comment: migrateApprovalDisplayText(item.comment),
                createdBy: migrateUserId(item.createdBy),
                createdByName: migrateApprovalDisplayText(item.createdByName),
              }))
            : undefined,
        });
      }),
      auditLogs: state.auditLogs.map((log) => ({
        ...log,
        userId: migrateUserId(log.userId),
        userName: migrateApprovalDisplayText(log.userName),
        action: migrateApprovalDisplayText(log.action),
        previousStatus: migrateStatus(log.previousStatus),
        newStatus: migrateStatus(log.newStatus),
        comment: log.comment ? migrateApprovalDisplayText(log.comment) : log.comment,
        declineReason: log.declineReason
          ? migrateText(log.declineReason)
          : log.declineReason,
        uploadedInvoiceReference: log.uploadedInvoiceReference
          ? migrateText(log.uploadedInvoiceReference)
          : log.uploadedInvoiceReference,
        assignedPerson: log.assignedPerson
          ? migrateApprovalDisplayText(log.assignedPerson)
          : log.assignedPerson,
      })),
      notifications,
      outboundNotifications: Array.isArray(state.outboundNotifications)
        ? state.outboundNotifications
            .map(normalizeOutboundNotification)
            .filter((delivery): delivery is OutboundNotificationLog => Boolean(delivery))
        : [],
      chatbotMessages: state.chatbotMessages.map((message) => ({
        ...message,
        userId: migrateUserId(message.userId),
        content: migrateApprovalDisplayText(message.content),
      })),
    };
  };

  if (!serialized) {
    return migrateState(initialState);
  }

  try {
    const parsed = JSON.parse(serialized) as ProcurementState & { projectOptions?: string[] };
    if (!Array.isArray(parsed.requests) || !Array.isArray(parsed.users)) {
      return migrateState(initialState);
    }
    return migrateState({
      ...parsed,
      auditLogs: Array.isArray(parsed.auditLogs) ? parsed.auditLogs : [],
      notifications: Array.isArray(parsed.notifications) ? parsed.notifications : [],
      chatbotMessages: Array.isArray(parsed.chatbotMessages)
        ? parsed.chatbotMessages
        : [],
    });
  } catch {
    return migrateState(initialState);
  }
}
