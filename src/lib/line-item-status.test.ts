import assert from "node:assert/strict";
import test from "node:test";

import {
  initialState,
  transitionRequest,
  type ProcurementLineItem,
  type ProcurementRequest,
  type ProcurementState,
} from "./procurement.ts";

const edlyn = initialState.users.find((user) => user.role === "Edlyn")!;
const mona = initialState.users.find((user) => user.role === "Mona")!;

const makeItem = (
  id: string,
  status: ProcurementLineItem["status"] = "Purchased",
): ProcurementLineItem => ({
  id,
  itemName: `Item ${id}`,
  itemDescription: "",
  quantity: 1,
  unitPrice: 10,
  currency: "AED",
  originalTotal: 10,
  fxRateToAed: 1,
  aedTotal: 10,
  vendorName: "Acme",
  exchangeRateDate: "2026-07-27",
  exchangeRateSource: "AED base currency",
  status,
});

const makeRequest = (items: ProcurementLineItem[]): ProcurementRequest => ({
  id: "PR-900",
  employeeName: "Tester",
  department: "Operations",
  project: "Beta",
  itemName: "Bulk order",
  itemDescription: "",
  quantity: items.length,
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
  lineItems: items,
  estimatedAmountAed: 20,
  exchangeRateSource: "AED base currency",
  exchangeRateDate: "2026-07-27",
  status: "Delivery Tracking",
  stage: "edlyn",
  assigneeId: edlyn.id,
  submittedById: "user-admin",
  createdAt: "2026-07-27T00:00:00.000Z",
  updatedAt: "2026-07-27T00:00:00.000Z",
});

const stateWith = (request: ProcurementRequest): ProcurementState => ({
  ...initialState,
  requests: [request],
});

test("delivering one of two items updates that item but keeps the request in delivery", () => {
  const next = transitionRequest(stateWith(makeRequest([makeItem("a"), makeItem("b")])), "PR-900", edlyn.id, {
    type: "edlyn-set-item-status",
    lineItemId: "a",
    status: "Delivered",
  });
  const request = next.requests.find((candidate) => candidate.id === "PR-900")!;
  assert.equal(request.lineItems.find((item) => item.id === "a")?.status, "Delivered");
  assert.ok(request.lineItems.find((item) => item.id === "a")?.deliveredAt);
  assert.equal(request.lineItems.find((item) => item.id === "b")?.status, "Purchased");
  assert.equal(request.status, "Delivery Tracking");
});

test("delivering the last item auto-advances the request to final closure", () => {
  const next = transitionRequest(
    stateWith(makeRequest([makeItem("a", "Delivered"), makeItem("b")])),
    "PR-900",
    edlyn.id,
    { type: "edlyn-set-item-status", lineItemId: "b", status: "Delivered" },
  );
  const request = next.requests.find((candidate) => candidate.id === "PR-900")!;
  assert.equal(request.lineItems.every((item) => item.status === "Delivered"), true);
  assert.equal(request.status, "Item Received");
  assert.equal(request.stage, "aileen");
});

test("all-cancelled does NOT auto-complete (needs at least one delivered)", () => {
  const next = transitionRequest(
    stateWith(makeRequest([makeItem("a", "Cancelled"), makeItem("b")])),
    "PR-900",
    edlyn.id,
    { type: "edlyn-set-item-status", lineItemId: "b", status: "Cancelled" },
  );
  const request = next.requests.find((candidate) => candidate.id === "PR-900")!;
  assert.equal(request.status, "Delivery Tracking");
});

test("a non-Procure actor cannot change item status", () => {
  const state = stateWith(makeRequest([makeItem("a"), makeItem("b")]));
  const next = transitionRequest(state, "PR-900", mona.id, {
    type: "edlyn-set-item-status",
    lineItemId: "a",
    status: "Delivered",
  });
  assert.equal(next, state);
});
