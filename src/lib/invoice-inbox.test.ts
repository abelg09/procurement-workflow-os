import assert from "node:assert/strict";
import test from "node:test";

import {
  addInboxInvoices,
  assignInboxInvoiceToRequest,
  findInboxMatchByNumber,
  getInboxInvoices,
  getRequestInvoices,
  initialState,
  removeInboxInvoice,
  updateInboxInvoice,
  type InboxInvoice,
  type ProcurementRequest,
  type ProcurementState,
} from "./procurement.ts";

const edlyn = initialState.users.find((user) => user.role === "Edlyn")!;
const aileen = initialState.users.find((user) => user.role === "Aileen")!;
const mona = initialState.users.find((user) => user.role === "Mona")!;

const makeRequest = (): ProcurementRequest => ({
  id: "PR-900",
  employeeName: "Tester",
  department: "Operations",
  project: "Beta",
  itemName: "Bulk order",
  itemDescription: "",
  quantity: 1,
  estimatedAmount: 20,
  currency: "AED",
  vendorName: "Acme",
  reasonForPurchase: "test",
  priority: "Normal",
  requiredByDate: "2026-08-01",
  attachments: [],
  vendor: {
    contactPerson: "",
    companyName: "Acme",
    trnNumber: "",
    tradeLicense: "",
    bankDetails: "",
    vatRegistration: "",
    ownerDocument: "",
    websiteLink: "",
    eBrochureLink: "",
    businessLocation: "",
  },
  lineItems: [
    {
      id: "a",
      itemName: "Item a",
      itemDescription: "",
      quantity: 1,
      unitPrice: 20,
      currency: "AED",
      originalTotal: 20,
      fxRateToAed: 1,
      aedTotal: 20,
      vendorName: "Acme",
      exchangeRateDate: "2026-07-27",
      exchangeRateSource: "AED base currency",
      status: "Purchased",
    },
  ],
  estimatedAmountAed: 20,
  exchangeRateSource: "AED base currency",
  exchangeRateDate: "2026-07-27",
  status: "Purchase in Progress",
  stage: "edlyn",
  assigneeId: edlyn.id,
  submittedById: "user-admin",
  createdAt: "2026-07-27T00:00:00.000Z",
  updatedAt: "2026-07-27T00:00:00.000Z",
});

const makeInbox = (overrides: Partial<InboxInvoice> = {}): InboxInvoice => ({
  id: "inbox-1",
  fileName: "invoice.pdf",
  uploadedInvoiceStoragePath: "invoices/inbox/invoice.pdf",
  uploadedAt: "2026-08-01T00:00:00.000Z",
  uploadedById: edlyn.id,
  invoiceNumber: "INV-2291",
  invoiceAmount: 20,
  status: "unassigned",
  ...overrides,
});

const baseState = (inbox: InboxInvoice[] = [], request = makeRequest()): ProcurementState => ({
  ...initialState,
  requests: [request],
  invoiceInbox: inbox,
});

test("addInboxInvoices prepends and getInboxInvoices reads them", () => {
  const next = addInboxInvoices(baseState(), [makeInbox()]);
  assert.equal(getInboxInvoices(next).length, 1);
  assert.equal(getInboxInvoices(next)[0].invoiceNumber, "INV-2291");
});

test("updateInboxInvoice patches a field; removeInboxInvoice deletes", () => {
  const withOne = baseState([makeInbox()]);
  const patched = updateInboxInvoice(withOne, "inbox-1", { invoiceAmount: 4300 });
  assert.equal(getInboxInvoices(patched)[0].invoiceAmount, 4300);
  const removed = removeInboxInvoice(patched, "inbox-1");
  assert.equal(getInboxInvoices(removed).length, 0);
});

test("findInboxMatchByNumber ignores case, spaces, and punctuation", () => {
  const state = baseState([makeInbox({ invoiceNumber: "INV-2291" })]);
  assert.equal(findInboxMatchByNumber(state, "inv 2291")?.id, "inbox-1");
  assert.equal(findInboxMatchByNumber(state, "INV/2291")?.id, "inbox-1");
  assert.equal(findInboxMatchByNumber(state, "INV-9999"), undefined);
});

test("assignInboxInvoiceToRequest attaches the invoice and marks the entry assigned", () => {
  const state = baseState([makeInbox()]);
  const next = assignInboxInvoiceToRequest(state, {
    inboxId: "inbox-1",
    requestId: "PR-900",
    actorId: edlyn.id,
  });
  const request = next.requests.find((candidate) => candidate.id === "PR-900")!;
  const invoices = getRequestInvoices(request);
  assert.equal(invoices.length, 1);
  assert.equal(invoices[0].invoiceNumber, "INV-2291");
  // The request keeps its workflow position untouched.
  assert.equal(request.status, "Purchase in Progress");
  assert.equal(request.stage, "edlyn");
  // The inbox entry is marked assigned and linked to the request.
  const entry = getInboxInvoices(next)[0];
  assert.equal(entry.status, "assigned");
  assert.equal(entry.assignedRequestId, "PR-900");
  // Finance is notified.
  assert.ok(next.notifications.some((n) => n.userId === aileen.id && n.type === "invoice"));
});

test("assignInboxInvoiceToRequest refuses a non-Procure/Finance/Admin actor", () => {
  const state = baseState([makeInbox()]);
  const next = assignInboxInvoiceToRequest(state, {
    inboxId: "inbox-1",
    requestId: "PR-900",
    actorId: mona.id,
  });
  assert.equal(next, state);
});

test("assignInboxInvoiceToRequest refuses an already-assigned entry or a zero amount", () => {
  const assigned = baseState([makeInbox({ status: "assigned" })]);
  assert.equal(
    assignInboxInvoiceToRequest(assigned, { inboxId: "inbox-1", requestId: "PR-900", actorId: edlyn.id }),
    assigned,
  );
  const noAmount = baseState([makeInbox({ invoiceAmount: 0 })]);
  assert.equal(
    assignInboxInvoiceToRequest(noAmount, { inboxId: "inbox-1", requestId: "PR-900", actorId: edlyn.id }),
    noAmount,
  );
});
