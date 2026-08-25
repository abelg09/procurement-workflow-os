// Edge Function: ocr-invoice
//
// Reads an uploaded invoice file from Storage and runs Google Cloud Vision OCR
// on it, returning the best-guess invoice number, amount, date and vendor for a
// human to confirm in the Invoice Inbox. READ-ONLY: it downloads one file and
// calls Vision — it never writes to Storage or to the app state.
//
// Required secret:  GOOGLE_VISION_API_KEY  (a Google Cloud Vision API key)
// Auto-provided by Supabase:  SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY
//
// Deploy:  supabase functions deploy ocr-invoice
// Secret:  supabase secrets set GOOGLE_VISION_API_KEY=your_key

import { createClient } from "npm:@supabase/supabase-js@2";
import { encodeBase64 } from "jsr:@std/encoding@1/base64";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });

const requiredEnv = (name: string) => {
  const value = Deno.env.get(name);
  if (!value) throw new Error(`Missing environment variable: ${name}`);
  return value;
};

const MONTHS: Record<string, string> = {
  jan: "01", feb: "02", mar: "03", apr: "04", may: "05", jun: "06",
  jul: "07", aug: "08", sep: "09", oct: "10", nov: "11", dec: "12",
};

// Best-effort conversion of a matched date string to YYYY-MM-DD (day-first, as
// used in the UAE). Returns undefined when it cannot parse confidently.
function normalizeDate(raw: string): string | undefined {
  const value = raw.trim();
  const iso = value.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (iso) return `${iso[1]}-${iso[2]}-${iso[3]}`;

  const dmy = value.match(/^(\d{1,2})[\/\-.](\d{1,2})[\/\-.](\d{2,4})$/);
  if (dmy) {
    let [, d, m, y] = dmy;
    if (y.length === 2) y = `20${y}`;
    const dd = d.padStart(2, "0");
    const mm = m.padStart(2, "0");
    if (Number(mm) >= 1 && Number(mm) <= 12 && Number(dd) >= 1 && Number(dd) <= 31) {
      return `${y}-${mm}-${dd}`;
    }
    return undefined;
  }

  const named = value.match(/^(\d{1,2})\s+([A-Za-z]{3,})\.?\s+(\d{2,4})$/);
  if (named) {
    const mm = MONTHS[named[2].slice(0, 3).toLowerCase()];
    if (mm) {
      const dd = named[1].padStart(2, "0");
      const y = named[3].length === 2 ? `20${named[3]}` : named[3];
      return `${y}-${mm}-${dd}`;
    }
  }
  return undefined;
}

// Pull structured fields out of the flat OCR text using keyword heuristics.
function parseInvoiceText(text: string) {
  const joined = text.replace(/\r/g, "");
  const lines = joined.split(/\n/).map((line) => line.trim()).filter(Boolean);

  let invoiceNumber: string | undefined;
  const invMatch = joined.match(
    /(?:tax\s*invoice|invoice|inv|bill)\s*(?:no\.?|number|num|#)?\s*[:#\-]?\s*([A-Za-z0-9][A-Za-z0-9/\-]{2,})/i,
  );
  if (invMatch?.[1]) invoiceNumber = invMatch[1].replace(/[.,;]+$/, "").trim();

  // Amount: scan every labelled total and keep the largest — the grand total is
  // almost always the biggest labelled figure on the page.
  let amount: number | undefined;
  let maxAmount = -1;
  const amountRe =
    /(?:grand\s*total|total\s*amount|amount\s*due|balance\s*due|net\s*payable|total\s*payable|total)\s*[:]?\s*(?:aed|dhs|rs\.?|usd|\$|€)?\s*([\d][\d,]*\.?\d{0,2})/gi;
  let match: RegExpExecArray | null;
  while ((match = amountRe.exec(joined)) !== null) {
    const value = Number.parseFloat(match[1].replace(/,/g, ""));
    if (Number.isFinite(value) && value > maxAmount) {
      maxAmount = value;
      amount = value;
    }
  }

  let date: string | undefined;
  const dateMatch = joined.match(
    /(\d{4}-\d{2}-\d{2})|(\d{1,2}[\/\-.]\d{1,2}[\/\-.]\d{2,4})|(\d{1,2}\s+(?:jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec)[a-z]*\.?\s+\d{2,4})/i,
  );
  if (dateMatch) date = normalizeDate(dateMatch[0]);

  // Vendor: first plausible header line that is not a label or a number.
  let vendor: string | undefined;
  for (const line of lines.slice(0, 8)) {
    if (/invoice|tax|receipt|bill|date|no\.|number|quotation|statement/i.test(line)) continue;
    if (/^[\d+]/.test(line)) continue;
    if (line.length < 3 || line.length > 60) continue;
    if (/[A-Za-z]{3,}/.test(line)) {
      vendor = line;
      break;
    }
  }

  return { invoiceNumber, amount, date, vendor };
}

async function runVisionOcr(base64: string, isPdf: boolean, apiKey: string): Promise<string> {
  if (isPdf) {
    const response = await fetch(
      `https://vision.googleapis.com/v1/files:annotate?key=${apiKey}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          requests: [
            {
              inputConfig: { content: base64, mimeType: "application/pdf" },
              features: [{ type: "DOCUMENT_TEXT_DETECTION" }],
              pages: [1, 2, 3, 4, 5],
            },
          ],
        }),
      },
    );
    const data = await response.json();
    if (!response.ok) {
      throw new Error(data?.error?.message ?? "Vision PDF OCR failed.");
    }
    const pages = data?.responses?.[0]?.responses ?? [];
    return pages
      .map((page: { fullTextAnnotation?: { text?: string } }) => page?.fullTextAnnotation?.text ?? "")
      .join("\n");
  }

  const response = await fetch(
    `https://vision.googleapis.com/v1/images:annotate?key=${apiKey}`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        requests: [
          {
            image: { content: base64 },
            features: [{ type: "DOCUMENT_TEXT_DETECTION" }],
          },
        ],
      }),
    },
  );
  const data = await response.json();
  if (!response.ok) {
    throw new Error(data?.error?.message ?? "Vision image OCR failed.");
  }
  return data?.responses?.[0]?.fullTextAnnotation?.text ?? "";
}

Deno.serve(async (request) => {
  if (request.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }
  if (request.method !== "POST") {
    return json({ error: "Method not allowed." }, 405);
  }

  try {
    const supabaseUrl = requiredEnv("SUPABASE_URL");
    const serviceRoleKey = requiredEnv("SUPABASE_SERVICE_ROLE_KEY");
    const visionKey = Deno.env.get("GOOGLE_VISION_API_KEY");
    if (!visionKey) {
      // Not configured yet — the inbox degrades gracefully to manual entry.
      return json({ error: "OCR is not configured (missing GOOGLE_VISION_API_KEY)." }, 501);
    }

    // Require a signed-in caller (same pattern as procurement-notifications).
    const accessToken = (request.headers.get("Authorization") ?? "").replace(/^Bearer\s+/i, "");
    if (!accessToken) return json({ error: "Missing bearer token." }, 401);

    const admin = createClient(supabaseUrl, serviceRoleKey, {
      auth: { autoRefreshToken: false, persistSession: false },
    });
    const { data: userData, error: userError } = await admin.auth.getUser(accessToken);
    if (userError || !userData.user) {
      return json({ error: "Invalid session." }, 401);
    }

    const body = await request.json().catch(() => ({}));
    const path = typeof body.path === "string" ? body.path : "";
    const bucket = typeof body.bucket === "string" && body.bucket ? body.bucket : "procurement-files";
    if (!path) return json({ error: "Missing file path." }, 400);

    const { data: file, error: downloadError } = await admin.storage.from(bucket).download(path);
    if (downloadError || !file) {
      return json({ error: `Could not download file: ${downloadError?.message ?? "not found"}` }, 404);
    }

    const bytes = new Uint8Array(await file.arrayBuffer());
    const base64 = encodeBase64(bytes);
    const isPdf =
      path.toLowerCase().endsWith(".pdf") || (file.type ?? "").toLowerCase().includes("pdf");

    const text = await runVisionOcr(base64, isPdf, visionKey);
    const parsed = parseInvoiceText(text);
    return json({ ...parsed, ocr: true });
  } catch (error) {
    return json({ error: error instanceof Error ? error.message : String(error) }, 500);
  }
});
