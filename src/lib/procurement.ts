export const ROLES = [
  "Employee",
  "Mona",
  "Rashid",
  "Dr. Majed",
  "Edlyn",
  "Aileen",
  "Admin",
] as const;

export type Role = (typeof ROLES)[number];

export const STATUSES = [
  "Draft",
  "Submitted",
  "Mona Review",
  "Rashid Review",
  "Rashid Auto Approved",
  "Rashid Declined",
  "Dr. Majed Review",
  "Edlyn Confirmation",
  "Edlyn Clarification Requested",
  "Purchase in Progress",
  "Invoice Uploaded",
  "Aileen Finance Review",
  "Invoice Cleared",
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
}> = [
  { id: 1, key: "mona", label: "Mona Review", ownerRole: "Mona" },
  { id: 2, key: "rashid", label: "Rashid Approval", ownerRole: "Rashid" },
  {
    id: 3,
    key: "dr-majed",
    label: "Dr. Majed Review",
    ownerRole: "Dr. Majed",
  },
  {
    id: 4,
    key: "edlyn",
    label: "Edlyn Purchase and Item Confirmation",
    ownerRole: "Edlyn",
  },
  {
    id: 5,
    key: "aileen",
    label: "Aileen Finance Documentation",
    ownerRole: "Aileen",
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
  requestId: string;
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
  | { type: "rashid-approve"; comment?: string }
  | { type: "rashid-decline"; declineReason: string }
  | { type: "dr-review"; comment?: string }
  | { type: "edlyn-confirm"; comment?: string }
  | { type: "edlyn-request-clarification"; comment: string }
  | { type: "employee-submit-edlyn-clarification"; comment: string }
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

  return {
    ...request,
    project: request.project || DEFAULT_PROJECT_OPTIONS[0],
    lineItems,
    estimatedAmountAed,
    logistics,
    edlynClarificationReturnStatus,
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
    id: "user-edlyn",
    name: "Edlyn",
    email: "edlyn@example.com",
    role: "Edlyn",
    department: "Purchasing",
    active: true,
  },
  {
    id: "user-aileen",
    name: "Aileen",
    email: "aileen@example.com",
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
    assignedPerson: "Aileen",
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
  requests: seedRequests,
  auditLogs: seedAuditLogs,
  notifications: seedNotifications,
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

export function isApprovalStatus(status: RequestStatus) {
  return (
    status === "Mona Review" ||
    status === "Rashid Review" ||
    status === "Rashid Auto Approved" ||
    status === "Dr. Majed Review"
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
      return "Dr. Majed to review and forward to Edlyn";
    case "Rashid Auto Approved":
      return "Dr. Majed to review and forward to Edlyn";
    case "Edlyn Confirmation":
      return "Edlyn to confirm item details";
    case "Edlyn Clarification Requested":
      return "Employee to answer Edlyn clarification";
    case "Purchase in Progress":
      return "Edlyn to purchase, request clarification, or upload invoice";
    case "Aileen Finance Review":
    case "Invoice Uploaded":
      return "Aileen to document and clear invoice";
    case "Invoice Cleared":
      return "Edlyn to confirm the order and start delivery tracking";
    case "Delivery Tracking":
      return "Edlyn to update logistics or mark item received";
    case "Order Confirmed":
      return "Edlyn to mark item received";
    case "Item Received":
      return "Aileen to close the case";
    case "Completed":
      return "No pending action";
    case "Rashid Declined":
      return "Decline reason recorded; Mona to review";
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
        const assignee = assignTo("Dr. Majed", { notify: false });
        editable.status = "Rashid Auto Approved";
        editable.stage = "dr-majed";
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
            title: "Auto-approved request ready",
            body: `${editable.id} was auto approved at Rashid stage and is ready for Dr. Majed review.`,
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
    case "rashid-approve": {
      if (!canAct(["Rashid Review"], "Rashid")) {
        return state;
      }
      const assignee = assignTo("Dr. Majed", { notify: false });
      editable.status = "Dr. Majed Review";
      editable.stage = "dr-majed";
      editable.previousResponsibleId = actor.id;
      actionLabel = "Rashid approved request";
      comment = workflowAction.comment;
      addNotification(
        nextState.notifications,
        {
          userId: assignee.id,
          requestId,
          title: "Review required",
          body: `${editable.id} is ready for Dr. Majed review.`,
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
      const assignee = assignTo("Mona", { notify: false });
      editable.status = "Rashid Declined";
      editable.stage = "rashid";
      editable.previousResponsibleId = actor.id;
      actionLabel = "Rashid declined request";
      declineReason = workflowAction.declineReason;
      addNotification(
        nextState.notifications,
        {
          userId: assignee.id,
          requestId,
          title: "Request declined",
          body: `${editable.id} was declined by Rashid: ${declineReason}`,
          type: "declined",
        },
        dateTime,
      );
      break;
    }
    case "dr-review": {
      if (!canAct(["Dr. Majed Review", "Rashid Auto Approved"], "Dr. Majed")) {
        return state;
      }
      const assignee = assignTo("Edlyn", { notify: false });
      editable.status = "Edlyn Confirmation";
      editable.stage = "edlyn";
      editable.previousResponsibleId = actor.id;
      actionLabel = "Dr. Majed completed review";
      comment = workflowAction.comment;
      addNotification(
        nextState.notifications,
        {
          userId: assignee.id,
          requestId,
          title: "Purchase task assigned",
          body: `${editable.id} has been reviewed by Dr. Majed and is ready for item confirmation.`,
          type: "assigned",
        },
        dateTime,
      );
      break;
    }
    case "edlyn-confirm": {
      if (!canAct(["Edlyn Confirmation"], "Edlyn")) {
        return state;
      }
      editable.status = "Purchase in Progress";
      editable.stage = "edlyn";
      editable.assigneeId = actor.id;
      actionLabel = "Edlyn confirmed item details";
      comment = workflowAction.comment;
      break;
    }
    case "edlyn-request-clarification": {
      if (
        !canAct(["Edlyn Confirmation", "Purchase in Progress"], "Edlyn") ||
        !hasText(workflowAction.comment)
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
      actionLabel = "Edlyn requested clarification";
      comment = workflowAction.comment;
      addNotification(
        nextState.notifications,
        {
          userId: editable.submittedById,
          requestId,
          title: "Edlyn needs clarification",
          body: `${editable.id} needs item or price clarification from you: ${comment}`,
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
      editable.status = editable.edlynClarificationReturnStatus ?? "Edlyn Confirmation";
      editable.stage = "edlyn";
      editable.previousResponsibleId = actor.id;
      delete editable.edlynClarificationReturnStatus;
      actionLabel = "Employee answered Edlyn clarification";
      comment = workflowAction.comment;
      addNotification(
        nextState.notifications,
        {
          userId: assignee.id,
          requestId,
          title: "Clarification received",
          body: `${editable.id} clarification has been submitted and is back with Edlyn.`,
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
      editable.status = "Invoice Cleared";
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
          body: `${editable.id} is cleared by finance. Inform the employee that the order has been placed.`,
          type: "finance",
        },
        dateTime,
      );
      break;
    }
    case "edlyn-confirm-order":
    case "edlyn-start-delivery-tracking": {
      if (!canAct(["Invoice Cleared"], "Edlyn")) {
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
    return state.requests.filter(
      (request) =>
        request.submittedById === user.id || request.employeeName === user.name,
    );
  }

  return state.requests.filter(
    (request) =>
      request.assigneeId === user.id ||
      request.submittedById === user.id ||
      request.stage === WORKFLOW_STAGES.find((stage) => stage.ownerRole === user.role)?.key,
  );
}

export function getStuckRequests(
  requests: ProcurementRequest[],
  referenceDate = new Date(),
) {
  const twoDaysMs = 1000 * 60 * 60 * 24 * 2;
  return requests.filter((request) => {
    if (isClosed(request.status)) {
      return false;
    }
    return referenceDate.getTime() - new Date(request.updatedAt).getTime() > twoDaysMs;
  });
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
      ["Invoice Cleared", "Delivery Tracking", "Order Confirmed"].includes(request.status),
    ).length,
    averageProcessingTime,
    stuck: getStuckRequests(requests).length,
  };
}

export function createDailyReminderNotifications(state: ProcurementState) {
  const dateTime = nowIso();
  const pending = state.requests.filter((request) =>
    ["Rashid Review", "Dr. Majed Review"].includes(request.status),
  );
  const nextNotifications = [...state.notifications];

  pending.forEach((request) => {
    addNotification(
      nextNotifications,
      {
        userId: request.assigneeId,
        requestId: request.id,
        title:
          request.status === "Dr. Majed Review"
            ? "Daily review reminder"
            : "Daily approval reminder",
        body:
          request.status === "Dr. Majed Review"
            ? `${request.id} is still pending your review.`
            : `${request.id} is still pending your approval.`,
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
    return "Ask me about request status, pending approvals, invoices, stuck requests, order placement, or completed requests.";
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
    const rows = state.requests.filter((request) => request.status === "Dr. Majed Review");
    return rows.length
      ? rows.map(describe).join("\n")
      : "No requests are currently pending with Dr. Majed.";
  }

  if (normalized.includes("invoice") && normalized.includes("aileen")) {
    const rows = state.requests.filter((request) => request.status === "Aileen Finance Review");
    return rows.length
      ? rows.map(describe).join("\n")
      : "No invoices are currently pending with Aileen.";
  }

  if (normalized.includes("stuck") || normalized.includes("more than 2 days")) {
    const rows = getStuckRequests(state.requests);
    return rows.length
      ? rows.map(describe).join("\n")
      : "No active requests are stuck for more than 2 days.";
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

  return "I can answer questions such as: status of my request, pending with Rashid, pending with Dr. Majed, invoices pending with Aileen, stuck more than 2 days, order placed, request PR-102 stage, or completed requests this month.";
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
  const migrateUserId = (userId?: string) =>
    userId === "user-dr-masjid" ? "user-dr-majed" : (userId ?? "");
  const migrateRole = (role: unknown): Role => {
    const roleText = migrateText(String(role));
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

  const migrateState = (
    state: ProcurementState & { projectOptions?: string[] },
  ): ProcurementState => {
    const migratedUsers = state.users.map((user) => ({
      ...user,
      id: migrateUserId(user.id),
      name: migrateText(user.name),
      email: migrateText(user.email),
      role: migrateRole(user.role),
    }));
    const drMajedUser = migratedUsers.find((user) => user.role === "Dr. Majed");
    const projectOptions = normalizeProjectOptions(state.projectOptions);
    const migratedNotifications = state.notifications.map((notification) => {
      const migratedBody = migrateText(notification.body);

      return {
        ...notification,
        userId: migrateUserId(notification.userId),
        title:
          notification.title === "Approval pending" &&
          migratedBody.includes("Dr. Majed")
            ? "Review pending"
            : migrateText(notification.title),
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
        const migratedStatus = deprecatedDrDecline
          ? "Dr. Majed Review"
          : migrateStatus(request.status);

        return normalizeRequestFinancials({
          ...request,
          project: request.project || projectOptions[0] || DEFAULT_PROJECT_OPTIONS[0],
          department: migrateDepartment(request.department),
          employeeName: migrateText(request.employeeName),
          itemDescription: migrateText(request.itemDescription),
          reasonForPurchase: migrateText(request.reasonForPurchase),
          vendorName: migrateText(request.vendorName),
          status: migratedStatus,
          stage: deprecatedDrDecline ? "dr-majed" : migrateStage(request.stage),
          assigneeId:
            deprecatedDrDecline && drMajedUser
              ? drMajedUser.id
              : migrateUserId(request.assigneeId),
          submittedById: migrateUserId(request.submittedById),
          previousResponsibleId: request.previousResponsibleId
            ? migrateUserId(request.previousResponsibleId)
            : undefined,
          lineItems: getRequestLineItems(request).map((item) => ({
            ...item,
            itemDescription: migrateText(item.itemDescription),
            vendorName: migrateText(item.vendorName),
          })),
        });
      }),
      auditLogs: state.auditLogs.map((log) => ({
        ...log,
        userId: migrateUserId(log.userId),
        userName: migrateText(log.userName),
        action: migrateText(log.action),
        previousStatus: migrateStatus(log.previousStatus),
        newStatus: migrateStatus(log.newStatus),
        comment: log.comment ? migrateText(log.comment) : log.comment,
        declineReason: log.declineReason
          ? migrateText(log.declineReason)
          : log.declineReason,
        uploadedInvoiceReference: log.uploadedInvoiceReference
          ? migrateText(log.uploadedInvoiceReference)
          : log.uploadedInvoiceReference,
        assignedPerson: log.assignedPerson
          ? migrateText(log.assignedPerson)
          : log.assignedPerson,
      })),
      notifications,
      chatbotMessages: state.chatbotMessages.map((message) => ({
        ...message,
        userId: migrateUserId(message.userId),
        content: migrateText(message.content),
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
