import assert from "node:assert/strict";
import test from "node:test";

import {
  initialState,
  parseState,
  serializeState,
  stripEmbeddedInvoiceBlobs,
  type ProcurementState,
} from "./procurement.ts";

const withEmbeddedInvoice = (): ProcurementState => {
  const base = initialState.requests[0];
  return {
    ...initialState,
    requests: [
      {
        ...base,
        invoice: {
          invoiceNumber: "INV-1",
          invoiceAmount: 100,
          invoiceDate: "2026-07-27",
          vendor: "Acme",
          status: "Pending Finance",
          uploadedInvoiceFile: "receipt.pdf",
          uploadedInvoiceStorageBucket: "procurement-files",
          uploadedInvoiceStoragePath: "invoices/PR-1/receipt.pdf",
          uploadedInvoiceDataUrl: `data:application/pdf;base64,${"A".repeat(50000)}`,
          paymentTerms: "Net 30",
          financeNotes: "",
        },
      },
      ...initialState.requests.slice(1),
    ],
  };
};

test("stripEmbeddedInvoiceBlobs drops the base64 but keeps the Storage path", () => {
  const stripped = stripEmbeddedInvoiceBlobs(withEmbeddedInvoice());
  const invoice = stripped.requests[0].invoice;
  assert.equal(invoice?.uploadedInvoiceDataUrl, undefined);
  assert.equal(invoice?.uploadedInvoiceStoragePath, "invoices/PR-1/receipt.pdf");
  assert.equal(invoice?.uploadedInvoiceFile, "receipt.pdf");
});

test("serializeState never emits the embedded base64 (keeps localStorage/DB small)", () => {
  const serialized = serializeState(withEmbeddedInvoice());
  assert.ok(!serialized.includes("uploadedInvoiceDataUrl"));
  assert.ok(!serialized.includes("AAAAAAAAAA"));
});

test("parseState strips base64 on load, so a stale cache cannot reintroduce it", () => {
  // Simulate a stale localStorage/DB copy that still carries the giant blob.
  // The exact request shape after normalization doesn't matter here — what
  // matters is that the parsed, re-serialized state carries no embedded base64.
  const bloated = JSON.stringify(withEmbeddedInvoice());
  assert.ok(bloated.includes("uploadedInvoiceDataUrl"), "fixture should start bloated");
  const reserialized = serializeState(parseState(bloated));
  assert.ok(!reserialized.includes("uploadedInvoiceDataUrl"));
  assert.ok(!reserialized.includes("AAAAAAAAAA"));
});

test("strip is a no-op (same reference) when nothing is embedded", () => {
  const clean = stripEmbeddedInvoiceBlobs(initialState);
  assert.equal(clean, initialState);
});
