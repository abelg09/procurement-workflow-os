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
  { id: 2, key: "rashid", label: "Rashid Approval", ownerRole: "Rashid" },
  {
    id: 3,
    key: "dr-majed",
    label: "Department Review",
    ownerRole: "Dr. Majed",
    ownerLabel: "Dr. Majed / Amro",
  },
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

type DepartmentReviewRole = "Dr. Majed" | "Amro";

const DR_MAJED_REVIEW_DEPARTMENTS = ["Operations", "Engineering"];
const AMRO_REVIEW_DEPARTMENTS = ["Marketing", "Sales"];

export function getDepartmentReviewRole(department: string): DepartmentReviewRole | null {
  if (DR_MAJED_REVIEW_DEPARTMENTS.includes(department)) {
    return "Dr. Majed";
  }

  if (AMRO_REVIEW_DEPARTMENTS.includes(department)) {
    return "Amro";
  }

  return null;
}

export function getDepartmentReviewStatus(
  department: string,
): "Dr. Majed Review" | "Amro Review" | null {
  const reviewRole = getDepartmentReviewRole(department);

  if (reviewRole === "Dr. Majed") return "Dr. Majed Review";
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
  invoiceNumber: string;
  invoiceAmount: number;
  invoiceDate: string;
  vendor: string;
  uploadedInvoiceFile: string;
  uploadedInvoiceFileSize?: number;
  uploadedInvoiceFileType?: string;
  uploadedInvoiceUploadedAt?: string;
  uploadedInvoiceStorageBucket?: string;
  uploadedInvoiceStoragePath?: string;
  paymentTerms: PaymentTerm;
  financeNotes: string;
  clearedAt?: string;
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
  status: RequestStatus;
  stage: WorkflowStage;
  assigneeId: string;
  submittedById: string;
  previousResponsibleId?: string;
  edlynClarificationReturnStatus?: "Edlyn Confirmation" | "Purchase in Progress";
  lineItemClarifications?: LineItemClarification[];
  logistics?: LogisticsDetails;
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
  chatbotMessages: ChatbotMessage[];
  projectOptions: string[];
  maintenance?: {
    launchCleanupVersion?: string;
    launchCleanupAt?: string;
    launchCleanupRemovedRequests?: number;
  };
};

export type DailyReminderEmail = {
  userId: string;
  name: string;
  role: Role;
  roleLabel: string;
  email: string;
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
  | { type: "employee-resubmit-mona-clarification"; comment: string; lineItems: ProcurementLineItem[] }
  | { type: "rashid-approve"; comment?: string }
  | { type: "rashid-decline"; declineReason: string }
  | { type: "dr-review"; comment?: string }
  | { type: "department-review"; comment?: string }
  | { type: "edlyn-confirm"; comment?: string }
  | {
      type: "edlyn-request-clarification";
      comment?: string;
      lineItemClarifications?: Array<{ lineItemId: string; comment: string }>;
    }
  | { type: "employee-submit-edlyn-clarification"; comment: string; lineItems?: ProcurementLineItem[] }
  | { type: "edlyn-upload-invoice"; invoice: InvoiceDetails; comment?: string }
  | { type: "aileen-clear-invoice"; financeNotes?: string }
  | { type: "edlyn-confirm-order"; comment?: string }
  | { type: "edlyn-start-delivery-tracking"; logistics?: LogisticsDetails; comment?: string }
  | { type: "edlyn-update-logistics"; logistics: LogisticsDetails; comment?: string }
  | { type: "edlyn-receive-item"; comment?: string }
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

export function getRequestLineItems(request: ProcurementRequest) {
  if (Array.isArray(request.lineItems) && request.lineItems.length > 0) {
    return request.lineItems;
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
    },
  ];
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
    status === "Sent Back for Clarification"
  );
}

export function isClosed(status: RequestStatus) {
  return status === "Completed" || isDeclined(status);
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
      return "Mona to approve or request clarification";
    case "Rashid Review":
      return "Rashid to approve or decline";
    case "Dr. Majed Review":
      return "Dr. Majed to review and forward to Procure";
    case "Amro Review":
      return "Amro to review and forward to Procure";
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
      return "Finance to close the case";
    case "Completed":
      return "No pending action";
    case "Rashid Declined":
      return "Rejected by Rashid; employee notified";
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

function getPostRashidRoute(
  request: ProcurementRequest,
  autoApproved: boolean,
): {
  role: Role;
  status: RequestStatus;
  stage: WorkflowStage;
  title: string;
  body: string;
} {
  const reviewRole = getDepartmentReviewRole(request.department);

  if (reviewRole) {
    const reviewStatus = getDepartmentReviewStatus(request.department) ?? "Dr. Majed Review";
    return {
      role: reviewRole,
      status: autoApproved ? "Rashid Auto Approved" : reviewStatus,
      stage: "dr-majed",
      title: autoApproved ? "Auto-approved request ready" : "Review required",
      body: autoApproved
        ? `${request.id} was auto approved at Rashid stage and is ready for ${reviewRole} review.`
        : `${request.id} is ready for ${reviewRole} review.`,
    };
  }

  return {
    role: "Edlyn",
    status: autoApproved ? "Rashid Auto Approved" : "Edlyn Confirmation",
    stage: "edlyn",
    title: autoApproved ? "Auto-approved purchase task" : "Purchase task assigned",
    body: autoApproved
      ? `${request.id} was auto approved at Rashid stage and is ready for Procure item confirmation.`
      : `${request.id} is ready for Procure item confirmation.`,
  };
}

export function submitProcurementRequest(
  state: ProcurementState,
  draft: ProcurementRequestDraft,
  submittedById: string,
) {
  const dateTime = nowIso();
  const monaUser = requireRoleUser(state.users, "Mona");
  const actor = getUserById(state.users, submittedById) ?? monaUser;
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
    chatbotMessages: state.chatbotMessages,
  };

  addAudit(nextState.auditLogs, request, actor, "Draft", "Submitted request", dateTime, {
    assignedPerson: monaUser.name,
  });
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
    chatbotMessages: state.chatbotMessages,
  };

  const previousStatus = editable.status;
  let actionLabel = "Updated request";
  let comment: string | undefined;
  let declineReason: string | undefined;
  let uploadedInvoiceReference: string | undefined;

  const canAct = (statuses: RequestStatus[], role: Role) =>
    statuses.includes(editable.status) &&
    actor.role === role &&
    editable.assigneeId === actor.id;
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

  switch (workflowAction.type) {
    case "mona-approve": {
      if (!canAct(["Mona Review"], "Mona")) {
        return state;
      }
      comment = workflowAction.comment;
      const totalAed = getRequestTotalAed(editable);
      if (totalAed < 300) {
        const route = getPostRashidRoute(editable, true);
        const assignee = assignTo(route.role, { notify: false });
        editable.status = route.status;
        editable.stage = route.stage;
        editable.previousResponsibleId = actor.id;
        actionLabel = "Mona approved request; Rashid auto approved below AED 300";
        comment =
          comment ??
          `Total converted value is AED ${totalAed.toFixed(2)}, so Rashid approval was skipped.`;
        addNotification(
          nextState.notifications,
          {
            userId: assignee.id,
            requestId,
            title: route.title,
            body: route.body,
            type: "approved",
          },
          dateTime,
        );
      } else {
        const assignee = assignTo("Rashid", { notify: false });
        editable.status = "Rashid Review";
        editable.stage = "rashid";
        editable.previousResponsibleId = actor.id;
        actionLabel = "Mona approved request";
        addNotification(
          nextState.notifications,
          {
            userId: assignee.id,
            requestId,
            title: "Approval required",
            body: `${editable.id} is ready for Rashid approval.`,
            type: "approved",
          },
          dateTime,
        );
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
        !hasText(workflowAction.comment) ||
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
      comment = workflowAction.comment;
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
      const route = getPostRashidRoute(editable, false);
      const assignee = assignTo(route.role, { notify: false });
      editable.status = route.status;
      editable.stage = route.stage;
      editable.previousResponsibleId = actor.id;
      actionLabel = "Rashid approved request";
      comment = workflowAction.comment;
      addNotification(
        nextState.notifications,
        {
          userId: assignee.id,
          requestId,
          title: route.title,
          body: route.body,
          type: "assigned",
        },
        dateTime,
      );
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
      const reviewStatuses: RequestStatus[] =
        reviewRole === "Amro"
          ? ["Amro Review", "Rashid Auto Approved"]
          : ["Dr. Majed Review", "Rashid Auto Approved"];

      if (!reviewRole || !canAct(reviewStatuses, reviewRole)) {
        return state;
      }
      const assignee = assignTo("Edlyn", { notify: false });
      editable.status = "Edlyn Confirmation";
      editable.stage = "edlyn";
      editable.previousResponsibleId = actor.id;
      actionLabel = `${actor.name} completed department review`;
      comment = workflowAction.comment;
      addNotification(
        nextState.notifications,
        {
          userId: assignee.id,
          requestId,
          title: "Purchase task assigned",
          body: `${editable.id} has been reviewed by ${actor.name} and is ready for item confirmation.`,
          type: "assigned",
        },
        dateTime,
      );
      break;
    }
    case "edlyn-confirm": {
      if (!canAct(["Edlyn Confirmation", "Rashid Auto Approved"], "Edlyn")) {
        return state;
      }
      editable.status = "Purchase in Progress";
      editable.stage = "edlyn";
      editable.assigneeId = actor.id;
      actionLabel = "Procure confirmed item details";
      comment = workflowAction.comment;
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
        actor.id !== editable.submittedById ||
        !hasText(workflowAction.comment)
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
      comment = workflowAction.comment;
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
        !canAct(["Purchase in Progress"], "Edlyn") ||
        !hasText(workflowAction.invoice.invoiceNumber) ||
        !hasText(workflowAction.invoice.uploadedInvoiceFile) ||
        !hasText(workflowAction.invoice.uploadedInvoiceStoragePath) ||
        !Number.isFinite(workflowAction.invoice.invoiceAmount) ||
        workflowAction.invoice.invoiceAmount <= 0
      ) {
        return state;
      }
      const assignee = assignTo("Aileen", { notify: false });
      editable.status = "Aileen Finance Review";
      editable.stage = "aileen";
      editable.previousResponsibleId = actor.id;
      editable.invoice = workflowAction.invoice;
      actionLabel = "Uploaded invoice";
      comment = workflowAction.comment;
      uploadedInvoiceReference = workflowAction.invoice.uploadedInvoiceFile;
      addNotification(
        nextState.notifications,
        {
          userId: assignee.id,
          requestId,
          title: "Invoice uploaded",
          body: `${editable.id} invoice ${workflowAction.invoice.invoiceNumber} is ready for finance documentation.`,
          type: "invoice",
        },
        dateTime,
      );
      break;
    }
    case "aileen-clear-invoice": {
      if (!canAct(["Aileen Finance Review"], "Aileen") || !editable.invoice) {
        return state;
      }
      const assignee = assignTo("Edlyn", { notify: false });
      editable.status = "Edlyn Order Confirmation";
      editable.stage = "edlyn";
      editable.invoice = editable.invoice
        ? {
            ...editable.invoice,
            financeNotes:
              workflowAction.financeNotes || editable.invoice.financeNotes,
            clearedAt: dateTime,
          }
        : editable.invoice;
      actionLabel = "Finance cleared invoice";
      comment = workflowAction.financeNotes;
      addNotification(
        nextState.notifications,
        {
          userId: editable.submittedById,
          requestId,
          title: "Invoice cleared",
          body: `${editable.id} invoice has been documented by finance.`,
          type: "finance",
        },
        dateTime,
      );
      addNotification(
        nextState.notifications,
        {
          userId: assignee.id,
          requestId,
          title: "Order confirmation required",
          body: workflowAction.financeNotes?.trim()
            ? `${editable.id} is cleared by finance and is back with Procure. Finance note: ${workflowAction.financeNotes.trim()}`
            : `${editable.id} is cleared by finance and is back with Procure. Inform the employee that the order has been placed.`,
          type: "finance",
        },
        dateTime,
      );
      break;
    }
    case "edlyn-confirm-order":
    case "edlyn-start-delivery-tracking": {
      if (!canAct(["Invoice Cleared", "Edlyn Order Confirmation"], "Edlyn")) {
        return state;
      }
      editable.status = "Delivery Tracking";
      editable.stage = "edlyn";
      editable.assigneeId = actor.id;
      editable.orderConfirmedAt = dateTime;
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
      break;
    }
    case "aileen-close": {
      if (!canAct(["Item Received"], "Aileen")) {
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
    return state.requests;
  }

  if (user.role === "Employee") {
    return getPersonalRequests(state, user);
  }

  return state.requests.filter(
    (request) =>
      request.assigneeId === user.id ||
      request.submittedById === user.id,
  );
}

export function getPersonalRequests(state: ProcurementState, user: UserProfile) {
  const userName = user.name.trim().toLowerCase();

  return state.requests.filter(
    (request) =>
      request.submittedById === user.id ||
      request.employeeName.trim().toLowerCase() === userName,
  );
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
  ).filter((user): user is UserProfile => Boolean(user));
}

export function getActiveAssignedRequests(
  requests: ProcurementRequest[],
  user: UserProfile,
) {
  return requests.filter(
    (request) => request.assigneeId === user.id && !isClosed(request.status),
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
    pendingInvoice: requests.filter((request) => request.status === "Purchase in Progress").length,
    pendingItemReceipt: requests.filter((request) =>
      ["Invoice Cleared", "Edlyn Order Confirmation", "Delivery Tracking", "Order Confirmed"].includes(request.status),
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
    const rows = state.requests.filter((request) => request.status === "Aileen Finance Review");
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

  return `I can answer questions such as: status of my request, pending with Rashid, pending with Dr. Majed, pending with Amro, invoices pending with Finance, over ${OVERDUE_REQUEST_HOURS} hours, order placed, request PR-102 stage, or completed requests this month.`;
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
      return {
        ...migratedUser,
        name: "Procure",
        email: PROCURE_APPROVAL_EMAIL,
        role: "Edlyn",
        department: "Procurement",
        active: true,
      };
    }

    if (
      migratedUser.id === "user-aileen" ||
      email === "aileen@example.com" ||
      email === FINANCE_APPROVAL_EMAIL.toLowerCase()
    ) {
      return {
        ...migratedUser,
        name: "Finance",
        email: FINANCE_APPROVAL_EMAIL,
        role: "Aileen",
        department: "Finance",
        active: true,
      };
    }

    if (personalRequesterEmails.has(email)) {
      return {
        ...migratedUser,
        role: "Employee",
      };
    }

    return migratedUser;
  };

  const migrateState = (
    state: ProcurementState & { projectOptions?: string[] },
  ): ProcurementState => {
    const migratedUsers = state.users.map(normalizeApprovalUser);
    for (const role of ["Amro", "Edlyn", "Aileen"] as const) {
      if (!migratedUsers.some((user) => user.role === role)) {
        migratedUsers.push(requireRoleUser(seedUsers, role));
      }
    }
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
