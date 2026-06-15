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
  FileSpreadsheet,
  FileText,
  Filter,
  History,
  LayoutDashboard,
  PackageCheck,
  Plus,
  RefreshCcw,
  Search,
  Send,
  Shield,
  ShoppingCart,
  SlidersHorizontal,
  Upload,
  UserCog,
  XCircle,
} from "lucide-react";
import { FormEvent, ReactNode, useEffect, useMemo, useState } from "react";
import {
  AuditLog,
  AttachmentReference,
  CURRENCIES,
  DEPARTMENTS,
  InvoiceDetails,
  NotificationRecord,
  PAYMENT_TERMS,
  PRIORITIES,
  ProcurementRequest,
  ProcurementRequestDraft,
  ProcurementState,
  RequestStatus,
  Role,
  STATUSES,
  UserProfile,
  WORKFLOW_STAGES,
  answerProcurementQuestion,
  createDailyReminderNotifications,
  getAssigneeName,
  getMetrics,
  getPendingAction,
  getStageIndex,
  getStuckRequests,
  getUserById,
  getVisibleRequests,
  initialState,
  isApprovalStatus,
  isClosed,
  isDeclined,
  makeId,
  markNotificationRead,
  nowIso,
  parseState,
  serializeState,
  submitProcurementRequest,
  transitionRequest,
} from "@/lib/procurement";

const STORAGE_KEY = "procurement-workflow-state-v1";

type View = "dashboard" | "new-request" | "notifications" | "admin";

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
      "Purchase in Progress",
      "Invoice Uploaded",
      "Aileen Finance Review",
      "Invoice Cleared",
      "Order Confirmed",
      "Item Received",
    ].includes(status)
  ) {
    return "In progress";
  }
  return "Approved";
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
    maximumFractionDigits: 0,
  }).format(amount)}`;

const classNames = (...values: Array<string | false | null | undefined>) =>
  values.filter(Boolean).join(" ");

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
  onClick?: () => void;
  disabled?: boolean;
  title?: string;
}) {
  const variants = {
    primary: "bg-slate-950 text-white hover:bg-slate-800",
    secondary:
      "border border-slate-200 bg-white text-slate-700 hover:border-slate-300 hover:bg-slate-50",
    danger: "bg-red-600 text-white hover:bg-red-700",
    ghost: "text-slate-600 hover:bg-slate-100",
    success: "bg-emerald-700 text-white hover:bg-emerald-800",
  };

  return (
    <button
      className={classNames(
        "inline-flex min-h-10 items-center justify-center gap-2 rounded-md px-3 text-sm font-semibold transition disabled:opacity-50",
        variants[variant],
      )}
      disabled={disabled}
      onClick={onClick}
      title={title}
      type={type}
    >
      {icon}
      <span>{children}</span>
    </button>
  );
}

function StatusBadge({ status }: { status: RequestStatus }) {
  const tone = statusTone(status);
  return (
    <span
      className={classNames(
        "inline-flex max-w-full items-center rounded-md border px-2 py-1 text-xs font-semibold",
        statusClass[tone],
      )}
    >
      {status}
    </span>
  );
}

function Field({
  label,
  children,
  required,
}: {
  label: string;
  children: ReactNode;
  required?: boolean;
}) {
  return (
    <label className="grid gap-1.5 text-sm font-medium text-slate-700">
      <span>
        {label}
        {required ? <span className="text-red-600"> *</span> : null}
      </span>
      {children}
    </label>
  );
}

function inputClass() {
  return "min-h-10 w-full rounded-md border border-slate-200 bg-white px-3 text-sm text-slate-950 outline-none transition placeholder:text-slate-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-100";
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
    <div className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
      <div className="flex items-center justify-between gap-3">
        <p className="text-sm font-medium text-slate-500">{label}</p>
        <span className={classNames("rounded-md p-2", tone)}>{icon}</span>
      </div>
      <p className="mt-3 text-2xl font-bold text-slate-950">{value}</p>
    </div>
  );
}

function WorkflowTracker({ request }: { request: ProcurementRequest }) {
  const currentIndex = getStageIndex(request.stage);
  const declined = isDeclined(request.status);

  return (
    <div className="grid gap-3 md:grid-cols-5">
      {WORKFLOW_STAGES.map((stage, index) => {
        const complete = request.status === "Completed" || index < currentIndex;
        const current = index === currentIndex;
        const autoApproved =
          request.status === "Rashid Auto Approved" && stage.key === "rashid";

        return (
          <div
            className={classNames(
              "min-h-24 rounded-lg border bg-white p-3",
              complete ? "border-emerald-200" : "border-slate-200",
              current && !declined ? "ring-2 ring-blue-100" : "",
              current && declined ? "border-red-300 ring-2 ring-red-100" : "",
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
            <p className="mt-3 text-sm font-bold leading-5 text-slate-950">
              {stage.label}
            </p>
            <p className="mt-1 text-xs text-slate-500">{stage.ownerRole}</p>
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
    path: `local-demo/${type}/${file.name}`,
    uploadedAt: nowIso(),
  }));
}

function RequestForm({
  currentUser,
  onSubmit,
}: {
  currentUser: UserProfile;
  onSubmit: (draft: ProcurementRequestDraft) => void;
}) {
  const [employeeName, setEmployeeName] = useState(
    currentUser.role === "Employee" ? currentUser.name : "",
  );
  const [department, setDepartment] = useState(
    DEPARTMENTS.includes(currentUser.department as (typeof DEPARTMENTS)[number])
      ? currentUser.department
      : "Operations",
  );
  const [itemName, setItemName] = useState("");
  const [itemDescription, setItemDescription] = useState("");
  const [quantity, setQuantity] = useState(1);
  const [estimatedAmount, setEstimatedAmount] = useState("");
  const [currency, setCurrency] = useState<(typeof CURRENCIES)[number]>("AED");
  const [customCurrency, setCustomCurrency] = useState("");
  const [vendorName, setVendorName] = useState("");
  const [reasonForPurchase, setReasonForPurchase] = useState("");
  const [priority, setPriority] = useState<(typeof PRIORITIES)[number]>("Normal");
  const [requiredByDate, setRequiredByDate] = useState("2026-06-20");
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

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    onSubmit({
      employeeName,
      department,
      itemName,
      itemDescription,
      quantity,
      estimatedAmount: Number(estimatedAmount || 0),
      currency: currency === "Other" ? customCurrency || "Other" : currency,
      vendorName,
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
    setItemName("");
    setItemDescription("");
    setQuantity(1);
    setEstimatedAmount("");
    setVendorName("");
    setReasonForPurchase("");
    setAttachments([]);
  };

  return (
    <form className="grid gap-6" onSubmit={handleSubmit}>
      <section className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
        <div className="mb-5 flex items-center gap-2">
          <ClipboardList className="h-5 w-5 text-blue-700" />
          <h2 className="text-lg font-bold text-slate-950">Procurement request</h2>
        </div>
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
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
          <Field label="Item name" required>
            <TextInput value={itemName} onChange={(event) => setItemName(event.target.value)} required />
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
            <SelectInput value={currency} onChange={(event) => setCurrency(event.target.value as typeof currency)} required>
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
          <div className="md:col-span-2 xl:col-span-3">
            <Field label="Item description" required>
              <TextArea value={itemDescription} onChange={(event) => setItemDescription(event.target.value)} required />
            </Field>
          </div>
          <div className="md:col-span-2 xl:col-span-3">
            <Field label="Reason for purchase" required>
              <TextArea value={reasonForPurchase} onChange={(event) => setReasonForPurchase(event.target.value)} required />
            </Field>
          </div>
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

      <section className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
        <div className="mb-5 flex items-center gap-2">
          <FileText className="h-5 w-5 text-emerald-700" />
          <h2 className="text-lg font-bold text-slate-950">Vendor details</h2>
        </div>
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
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

      <div className="flex justify-end">
        <IconButton icon={<Plus className="h-4 w-4" />} type="submit">
          Submit to Mona
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
  title = "All procurement requests",
  description = "Search, filter, and open requests to view stage actions.",
  showAssigneeFilter = true,
}: {
  requests: ProcurementRequest[];
  users: UserProfile[];
  selectedRequestId?: string;
  onSelect: (id: string) => void;
  title?: string;
  description?: string;
  showAssigneeFilter?: boolean;
}) {
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("All");
  const [assignee, setAssignee] = useState("All");
  const [department, setDepartment] = useState("All");
  const [stage, setStage] = useState("All");
  const [minAmount, setMinAmount] = useState("");
  const [maxAmount, setMaxAmount] = useState("");
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");

  const departments = Array.from(new Set(requests.map((request) => request.department))).sort();

  const filtered = requests.filter((request) => {
    const haystack = [
      request.id,
      request.employeeName,
      request.itemName,
      request.vendorName,
    ]
      .join(" ")
      .toLowerCase();
    const amount = request.estimatedAmount;
    return (
      haystack.includes(search.toLowerCase()) &&
      (status === "All" || request.status === status) &&
      (assignee === "All" || request.assigneeId === assignee) &&
      (department === "All" || request.department === department) &&
      (stage === "All" || request.stage === stage) &&
      (!minAmount || amount >= Number(minAmount)) &&
      (!maxAmount || amount <= Number(maxAmount)) &&
      (!fromDate || request.createdAt.slice(0, 10) >= fromDate) &&
      (!toDate || request.createdAt.slice(0, 10) <= toDate)
    );
  });

  return (
    <section className="rounded-lg border border-slate-200 bg-white shadow-sm">
      <div className="border-b border-slate-200 p-5">
        <div className="flex flex-col gap-3 xl:flex-row xl:items-center xl:justify-between">
          <div>
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
              placeholder="Search ID, employee, item, vendor"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
            />
          </div>
        </div>

        <div className="mt-4 grid gap-3 md:grid-cols-2 xl:grid-cols-4 2xl:grid-cols-8">
          <SelectInput value={status} onChange={(event) => setStatus(event.target.value)}>
            <option>All</option>
            {STATUSES.map((item) => (
              <option key={item}>{item}</option>
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
          <SelectInput value={stage} onChange={(event) => setStage(event.target.value)}>
            <option value="All">All stages</option>
            {WORKFLOW_STAGES.map((item) => (
              <option key={item.key} value={item.key}>
                {item.label}
              </option>
            ))}
          </SelectInput>
          <TextInput placeholder="Min amount" type="number" value={minAmount} onChange={(event) => setMinAmount(event.target.value)} />
          <TextInput placeholder="Max amount" type="number" value={maxAmount} onChange={(event) => setMaxAmount(event.target.value)} />
          <TextInput type="date" value={fromDate} onChange={(event) => setFromDate(event.target.value)} />
          <TextInput type="date" value={toDate} onChange={(event) => setToDate(event.target.value)} />
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full min-w-[1120px] border-collapse text-left text-sm">
          <thead className="bg-slate-50 text-xs uppercase text-slate-500">
            <tr>
              <th className="px-4 py-3">Request</th>
              <th className="px-4 py-3">Stage</th>
              <th className="px-4 py-3">Assignee</th>
              <th className="px-4 py-3">Amount</th>
              <th className="px-4 py-3">Status</th>
              <th className="px-4 py-3">Invoice</th>
              <th className="px-4 py-3">Pending action</th>
              <th className="px-4 py-3">Last updated</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {filtered.map((request) => (
              <tr
                className={classNames(
                  "cursor-pointer transition hover:bg-blue-50/60",
                  selectedRequestId === request.id ? "bg-blue-50" : "bg-white",
                )}
                key={request.id}
                onClick={() => onSelect(request.id)}
              >
                <td className="px-4 py-3">
                  <p className="font-bold text-slate-950">{request.id}</p>
                  <p className="mt-1 max-w-52 truncate text-slate-500">
                    {request.employeeName} - {request.itemName}
                  </p>
                </td>
                <td className="px-4 py-3">
                  {WORKFLOW_STAGES.find((item) => item.key === request.stage)?.label}
                </td>
                <td className="px-4 py-3">{getAssigneeName(request, users)}</td>
                <td className="px-4 py-3 font-semibold">
                  {money(request.estimatedAmount, request.currency)}
                </td>
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
                  <span className="line-clamp-2 max-w-72 text-slate-600">
                    {getPendingAction(request)}
                  </span>
                </td>
                <td className="px-4 py-3 text-slate-500">
                  {formatDateTime(request.updatedAt)}
                </td>
              </tr>
            ))}
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
  const [comment, setComment] = useState("");
  const [declineReason, setDeclineReason] = useState("");
  const [invoiceNumber, setInvoiceNumber] = useState("");
  const [invoiceAmount, setInvoiceAmount] = useState(request.estimatedAmount);
  const [invoiceDate, setInvoiceDate] = useState("2026-06-15");
  const [invoiceFile, setInvoiceFile] = useState("");
  const [paymentTerms, setPaymentTerms] = useState<(typeof PAYMENT_TERMS)[number]>("COD");
  const [financeNotes, setFinanceNotes] = useState("");

  const role = currentUser.role;
  const clearText = () => {
    setComment("");
    setDeclineReason("");
  };
  const canUse = (neededRole: Role) => role === neededRole;
  const invoicePayload = (): InvoiceDetails => ({
    invoiceNumber: invoiceNumber || `${request.id}-INV`,
    invoiceAmount,
    invoiceDate,
    vendor: request.vendorName || request.vendor.companyName,
    uploadedInvoiceFile: invoiceFile || `${request.id.toLowerCase()}-invoice.pdf`,
    paymentTerms,
    financeNotes,
  });

  return (
    <div className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
      <div className="flex items-center gap-2">
        <SlidersHorizontal className="h-5 w-5 text-blue-700" />
        <h3 className="text-base font-bold text-slate-950">Stage actions</h3>
      </div>
      <p className="mt-2 text-sm text-slate-500">{getPendingAction(request)}</p>

      <div className="mt-4 grid gap-3">
        <TextArea
          placeholder="Comment, finance note, or clarification text"
          value={comment}
          onChange={(event) => setComment(event.target.value)}
        />

        {request.status === "Mona Review" && canUse("Mona") ? (
          <div className="flex flex-wrap gap-2">
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
            <TextArea
              placeholder="Decline reason is required when declining"
              value={declineReason}
              onChange={(event) => setDeclineReason(event.target.value)}
            />
            <div className="flex flex-wrap gap-2">
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

        {["Dr. Masjid Review", "Rashid Auto Approved"].includes(request.status) &&
        canUse("Dr. Masjid") ? (
          <div className="grid gap-3">
            <TextArea
              placeholder="Decline reason is required when declining"
              value={declineReason}
              onChange={(event) => setDeclineReason(event.target.value)}
            />
            <div className="flex flex-wrap gap-2">
              <IconButton
                icon={<CheckCircle2 className="h-4 w-4" />}
                onClick={() => {
                  onTransition(request.id, { type: "dr-approve", comment });
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
                    type: "dr-decline",
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

        {request.status === "Edlyn Confirmation" && canUse("Edlyn") ? (
          <IconButton
            icon={<ShoppingCart className="h-4 w-4" />}
            onClick={() => {
              onTransition(request.id, { type: "edlyn-confirm", comment });
              clearText();
            }}
          >
            Confirm item details
          </IconButton>
        ) : null}

        {request.status === "Purchase in Progress" && canUse("Edlyn") ? (
          <div className="grid gap-3 rounded-lg border border-slate-200 p-3">
            <div className="grid gap-3 md:grid-cols-2">
              <TextInput placeholder="Invoice number" value={invoiceNumber} onChange={(event) => setInvoiceNumber(event.target.value)} />
              <TextInput type="number" value={invoiceAmount} onChange={(event) => setInvoiceAmount(Number(event.target.value))} />
              <TextInput type="date" value={invoiceDate} onChange={(event) => setInvoiceDate(event.target.value)} />
              <SelectInput value={paymentTerms} onChange={(event) => setPaymentTerms(event.target.value as typeof paymentTerms)}>
                {PAYMENT_TERMS.map((term) => (
                  <option key={term}>{term}</option>
                ))}
              </SelectInput>
              <div className="md:col-span-2">
                <TextInput
                  placeholder="Uploaded invoice file name"
                  value={invoiceFile}
                  onChange={(event) => setInvoiceFile(event.target.value)}
                />
              </div>
            </div>
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
          </div>
        ) : null}

        {request.status === "Aileen Finance Review" && canUse("Aileen") ? (
          <div className="grid gap-3">
            <TextArea
              placeholder="Finance notes"
              value={financeNotes}
              onChange={(event) => setFinanceNotes(event.target.value)}
            />
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

        {request.status === "Invoice Cleared" && canUse("Edlyn") ? (
          <IconButton
            icon={<Send className="h-4 w-4" />}
            onClick={() => onTransition(request.id, { type: "edlyn-confirm-order", comment })}
          >
            Confirm order placed
          </IconButton>
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
          <div className="rounded-lg border border-dashed border-slate-300 p-3 text-sm text-slate-600">
            Admin can view the full request and reassign it from the Admin view.
          </div>
        ) : null}

        {!isClosed(request.status) &&
        !(
          (request.status === "Mona Review" && canUse("Mona")) ||
          (request.status === "Rashid Review" && canUse("Rashid")) ||
          (["Dr. Masjid Review", "Rashid Auto Approved"].includes(request.status) &&
            canUse("Dr. Masjid")) ||
          (["Edlyn Confirmation", "Purchase in Progress", "Invoice Cleared", "Order Confirmed"].includes(
            request.status,
          ) &&
            canUse("Edlyn")) ||
          (["Aileen Finance Review", "Item Received"].includes(request.status) &&
            canUse("Aileen"))
        ) ? (
          <div className="rounded-lg border border-slate-200 bg-slate-50 p-3 text-sm text-slate-600">
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
      <section className="rounded-lg border border-slate-200 bg-white p-8 text-center text-slate-500 shadow-sm">
        Select a request to see workflow details.
      </section>
    );
  }

  const logs = state.auditLogs.filter((log) => log.requestId === request.id);
  const latestDecline = logs.find((log) => log.declineReason);

  return (
    <section className="grid gap-5">
      <div className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
        <div className="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <h2 className="text-2xl font-bold text-slate-950">{request.id}</h2>
              <StatusBadge status={request.status} />
            </div>
            <p className="mt-2 text-sm text-slate-500">
              {request.employeeName} requested {request.itemName} for{" "}
              {request.department}.
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

      <div className="grid gap-5 xl:grid-cols-[1.35fr_0.65fr]">
        <div className="grid gap-5">
          <div className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
            <h3 className="text-base font-bold text-slate-950">Request details</h3>
            <div className="mt-4 grid gap-4 md:grid-cols-2">
              <Detail label="Item" value={request.itemName} />
              <Detail label="Quantity" value={String(request.quantity)} />
              <Detail label="Amount" value={money(request.estimatedAmount, request.currency)} />
              <Detail label="Priority" value={request.priority} />
              <Detail label="Required by" value={formatDate(request.requiredByDate)} />
              <Detail label="Vendor" value={request.vendorName || "Optional"} />
              <div className="md:col-span-2">
                <Detail label="Description" value={request.itemDescription} />
              </div>
              <div className="md:col-span-2">
                <Detail label="Reason" value={request.reasonForPurchase} />
              </div>
            </div>
          </div>

          <div className="grid gap-5 lg:grid-cols-2">
            <div className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
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

            <div className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
              <h3 className="text-base font-bold text-slate-950">Invoice documentation</h3>
              {request.invoice ? (
                <div className="mt-4 grid gap-3 text-sm">
                  <Detail label="Invoice number" value={request.invoice.invoiceNumber} />
                  <Detail label="Amount" value={money(request.invoice.invoiceAmount, request.currency)} />
                  <Detail label="Invoice date" value={formatDate(request.invoice.invoiceDate)} />
                  <Detail label="Payment terms" value={request.invoice.paymentTerms} />
                  <Detail label="Uploaded file" value={request.invoice.uploadedInvoiceFile} />
                  <Detail label="Finance notes" value={request.invoice.financeNotes || "No notes"} />
                </div>
              ) : (
                <div className="mt-4 rounded-lg border border-amber-200 bg-amber-50 p-3 text-sm text-amber-800">
                  Invoice is pending upload by Edlyn.
                </div>
              )}
            </div>
          </div>

          {latestDecline ? (
            <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-900">
              <strong>Decline reason:</strong> {latestDecline.declineReason}
            </div>
          ) : null}
        </div>

        <ActionPanel
          currentUser={currentUser}
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

function AuditTrail({ logs }: { logs: AuditLog[] }) {
  return (
    <div className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
      <div className="flex items-center gap-2">
        <History className="h-5 w-5 text-slate-700" />
        <h3 className="text-base font-bold text-slate-950">Audit trail</h3>
      </div>
      <div className="mt-4 grid gap-3">
        {logs.length === 0 ? (
          <p className="text-sm text-slate-500">No audit entries yet.</p>
        ) : (
          logs.map((log) => (
            <div className="rounded-lg border border-slate-200 p-3" key={log.id}>
              <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
                <p className="font-semibold text-slate-950">{log.action}</p>
                <p className="text-xs text-slate-500">{formatDateTime(log.dateTime)}</p>
              </div>
              <p className="mt-1 text-sm text-slate-600">
                {log.userName}: {log.previousStatus} to {log.newStatus}
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
  onRead,
  onRunReminder,
}: {
  currentUser: UserProfile;
  state: ProcurementState;
  onRead: (id: string) => void;
  onRunReminder: () => void;
}) {
  const notifications =
    currentUser.role === "Admin"
      ? state.notifications
      : state.notifications.filter((notification) => notification.userId === currentUser.id);

  return (
    <section className="rounded-lg border border-slate-200 bg-white shadow-sm">
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
  onRead,
}: {
  notification: NotificationRecord;
  users: UserProfile[];
  onRead: (id: string) => void;
}) {
  return (
    <div
      className={classNames(
        "rounded-lg border p-4",
        notification.read ? "border-slate-200 bg-white" : "border-blue-200 bg-blue-50",
      )}
    >
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <p className="font-semibold text-slate-950">{notification.title}</p>
          <p className="mt-1 text-sm text-slate-600">{notification.body}</p>
          <p className="mt-2 text-xs text-slate-500">
            {notification.requestId} -{" "}
            {getUserById(users, notification.userId)?.name ?? "Unknown"} -{" "}
            {formatDateTime(notification.createdAt)}
          </p>
        </div>
        {!notification.read ? (
          <IconButton
            icon={<Check className="h-4 w-4" />}
            onClick={() => onRead(notification.id)}
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
    Item: request.itemName,
    Vendor: request.vendorName,
    Amount: request.estimatedAmount,
    Currency: request.currency,
    Status: request.status,
    Stage: WORKFLOW_STAGES.find((stage) => stage.key === request.stage)?.label,
    Assignee: getAssigneeName(request, state.users),
    Invoice: request.invoice?.invoiceNumber ?? "Pending",
    "Pending action": getPendingAction(request),
    "Last updated": formatDateTime(request.updatedAt),
  }));
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

function AdminPanel({
  state,
  setState,
}: {
  state: ProcurementState;
  setState: (updater: (state: ProcurementState) => ProcurementState) => void;
}) {
  const [requestId, setRequestId] = useState(state.requests[0]?.id ?? "");
  const [assigneeId, setAssigneeId] = useState(state.users[0]?.id ?? "");
  const [comment, setComment] = useState("");

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
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Procurement");
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

  return (
    <section className="grid gap-5">
      <div className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
        <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div>
            <div className="flex items-center gap-2">
              <Shield className="h-5 w-5 text-blue-700" />
              <h2 className="text-lg font-bold text-slate-950">Admin controls</h2>
            </div>
            <p className="mt-1 text-sm text-slate-500">
              Manage roles, export reports, view audit logs, and manually reassign work.
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <IconButton icon={<Download className="h-4 w-4" />} onClick={exportCsv} variant="secondary">
              CSV
            </IconButton>
            <IconButton icon={<FileSpreadsheet className="h-4 w-4" />} onClick={exportExcel} variant="secondary">
              Excel
            </IconButton>
          </div>
        </div>
      </div>

      <div className="grid gap-5 xl:grid-cols-2">
        <div className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
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
                        {["Employee", "Mona", "Rashid", "Dr. Masjid", "Edlyn", "Aileen", "Admin"].map((role) => (
                          <option key={role}>{role}</option>
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

        <div className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
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
                  {user.name} ({user.role})
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
    <aside className="rounded-lg border border-slate-200 bg-white shadow-sm">
      <div className="border-b border-slate-200 p-4">
        <div className="flex items-center gap-2">
          <Bot className="h-5 w-5 text-purple-700" />
          <h2 className="text-base font-bold text-slate-950">Procurement Assistant</h2>
        </div>
        <p className="mt-1 text-sm text-slate-500">
          Database-backed answers for status, approvals, invoices, and stuck requests.
        </p>
      </div>
      <div className="grid max-h-[460px] gap-3 overflow-y-auto p-4">
        {messages.length === 0 ? (
          <div className="rounded-lg border border-purple-100 bg-purple-50 p-3 text-sm text-purple-900">
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
      <div className="flex flex-wrap gap-2 border-t border-slate-200 p-3">
        {[
          "Which requests are pending with Rashid?",
          "Which invoices are pending with Aileen?",
          "Show me requests stuck for more than 2 days.",
          "Show all completed requests this month.",
        ].map((item) => (
          <button
            className="rounded-md border border-slate-200 px-2 py-1 text-xs font-medium text-slate-600 hover:bg-slate-50"
            key={item}
            onClick={() => prompt(item)}
            type="button"
          >
            {item}
          </button>
        ))}
      </div>
      <form className="flex gap-2 border-t border-slate-200 p-3" onSubmit={ask}>
        <TextInput
          aria-label="Ask Procurement Assistant"
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
}: {
  request?: ProcurementRequest;
  state: ProcurementState;
}) {
  if (!request) {
    return (
      <section className="rounded-lg border border-slate-200 bg-white p-6 text-sm text-slate-500 shadow-sm">
        Select a request to view its current status.
      </section>
    );
  }

  return (
    <section className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
      <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <h2 className="text-xl font-bold text-slate-950">{request.id}</h2>
            <StatusBadge status={request.status} />
          </div>
          <p className="mt-2 text-sm text-slate-500">
            {request.itemName} for {request.employeeName} in {request.department}
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

      <div className="mt-5 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <Detail label="Amount" value={money(request.estimatedAmount, request.currency)} />
        <Detail label="Invoice" value={request.invoice?.invoiceNumber ?? "Pending"} />
        <Detail label="Required by" value={formatDate(request.requiredByDate)} />
        <Detail label="Pending action" value={getPendingAction(request)} />
      </div>
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
  const selectedRequest =
    state.requests.find((request) => request.id === selectedRequestId) ??
    state.requests[0];

  return (
    <div className="grid gap-5">
      <section className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
        <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
          <div>
            <h2 className="text-xl font-bold text-slate-950">Employee procurement portal</h2>
            <p className="mt-1 text-sm text-slate-500">
              Submit a new request and track company procurement status in one place.
            </p>
          </div>
          <div className="rounded-md border border-slate-200 bg-slate-50 px-3 py-2 text-sm font-semibold text-slate-700">
            {currentUser.name} - Employee
          </div>
        </div>
      </section>

      <RequestForm
        currentUser={currentUser}
        onSubmit={(draft) => {
          const nextId = `PR-${
            Math.max(
              ...state.requests.map((request) => Number(request.id.replace("PR-", ""))),
            ) + 1
          }`;
          setState((current) =>
            submitProcurementRequest(current, draft, currentUser.id),
          );
          setSelectedRequestId(nextId);
        }}
      />

      <RequestsTable
        description="Read-only company status view for submitted requests and workflow progress."
        onSelect={setSelectedRequestId}
        requests={state.requests}
        selectedRequestId={selectedRequest?.id}
        showAssigneeFilter={false}
        title="Company procurement status"
        users={state.users}
      />

      <EmployeeRequestStatus request={selectedRequest} state={state} />
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
    state.requests.find((request) => request.id === selectedRequestId) ??
    visibleRequests[0];
  const metrics = getMetrics(currentUser.role === "Admin" ? state.requests : visibleRequests);

  const metricCards = [
    {
      label: "Total requests",
      value: metrics.total,
      icon: <ClipboardList className="h-4 w-4" />,
      tone: "bg-slate-100 text-slate-700",
    },
    {
      label: "Pending approvals",
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
      label: "Stuck more than 2 days",
      value: metrics.stuck,
      icon: <AlertCircle className="h-4 w-4" />,
      tone: "bg-orange-100 text-orange-700",
    },
  ];

  return (
    <div className="grid gap-5">
      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-5">
        {metricCards.map((card) => (
          <DashboardMetric key={card.label} {...card} />
        ))}
      </div>

      <div className="grid gap-5 2xl:grid-cols-[1fr_420px]">
        <div className="grid gap-5">
          <RequestsTable
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
        <div className="grid gap-5 content-start">
          <ProcurementAssistant
            currentUser={currentUser}
            setState={setState}
            state={state}
          />
          <section className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
            <div className="flex items-center gap-2">
              <Filter className="h-5 w-5 text-slate-700" />
              <h2 className="text-base font-bold text-slate-950">Watchlist</h2>
            </div>
            <div className="mt-3 grid gap-2">
              {getStuckRequests(state.requests).map((request) => (
                <button
                  className="rounded-md border border-orange-200 bg-orange-50 p-3 text-left text-sm text-orange-900"
                  key={request.id}
                  onClick={() => setSelectedRequestId(request.id)}
                  type="button"
                >
                  <strong>{request.id}</strong> has been waiting since{" "}
                  {formatDateTime(request.updatedAt)}
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
  const [state, setState] = useState<ProcurementState>(() => {
    if (typeof window === "undefined") {
      return initialState;
    }
    return parseState(window.localStorage.getItem(STORAGE_KEY));
  });
  const [currentUserId, setCurrentUserId] = useState("user-admin");
  const [view, setView] = useState<View>("dashboard");
  const [selectedRequestId, setSelectedRequestId] = useState("PR-102");

  useEffect(() => {
    if (typeof window !== "undefined") {
      window.localStorage.setItem(STORAGE_KEY, serializeState(state));
    }
  }, [state]);

  const currentUser =
    state.users.find((user) => user.id === currentUserId) ?? state.users[0];
  const isEmployee = currentUser.role === "Employee";
  const unread = state.notifications.filter(
    (notification) => !notification.read && notification.userId === currentUser.id,
  ).length;

  const navItems: Array<{ id: View; label: string; icon: ReactNode; hidden?: boolean }> =
    isEmployee
      ? [
          {
            id: "dashboard",
            label: "Employee portal",
            icon: <ClipboardList className="h-4 w-4" />,
          },
        ]
      : [
          { id: "dashboard", label: "Dashboard", icon: <LayoutDashboard className="h-4 w-4" /> },
          { id: "new-request", label: "New request", icon: <Plus className="h-4 w-4" /> },
          { id: "notifications", label: "Notifications", icon: <Bell className="h-4 w-4" /> },
          {
            id: "admin",
            label: "Admin",
            icon: <Shield className="h-4 w-4" />,
            hidden: currentUser.role !== "Admin",
          },
        ];

  const resetDemo = () => {
    setState(initialState);
    setSelectedRequestId("PR-102");
    window.localStorage.removeItem(STORAGE_KEY);
  };

  return (
    <main className="min-h-screen bg-slate-100">
      <header className="sticky top-0 z-20 border-b border-slate-200 bg-white/95 backdrop-blur">
        <div className="mx-auto flex max-w-[1800px] flex-col gap-4 px-4 py-4 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-12 w-32 shrink-0 items-center justify-center rounded-lg bg-black px-4 shadow-sm">
              <Image
                alt="SULMI"
                className="h-8 w-full object-contain"
                height={36}
                src="/sulmi-logo.svg"
                unoptimized
                width={130}
              />
            </div>
            <div>
              <h1 className="text-xl font-bold text-slate-950">Procurement Workflow OS</h1>
              <p className="text-sm text-slate-500">
                Requests, approvals, purchasing, invoices, and closure
              </p>
            </div>
          </div>

          <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
            {isEmployee ? (
              <div className="rounded-md border border-slate-200 bg-slate-50 px-3 py-2 text-sm font-semibold text-slate-700">
                {currentUser.name} - Employee
              </div>
            ) : (
              <>
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
                      {user.name} - {user.role}
                    </option>
                  ))}
                </SelectInput>
                <IconButton
                  icon={<RefreshCcw className="h-4 w-4" />}
                  onClick={resetDemo}
                  variant="secondary"
                >
                  Reset demo
                </IconButton>
              </>
            )}
          </div>
        </div>

        <nav className="mx-auto flex max-w-[1800px] gap-2 overflow-x-auto px-4 pb-3">
          {navItems
            .filter((item) => !item.hidden)
            .map((item) => (
              <button
                className={classNames(
                  "inline-flex min-h-10 items-center gap-2 rounded-md px-3 text-sm font-semibold transition",
                  view === item.id
                    ? "bg-slate-950 text-white"
                    : "bg-white text-slate-600 hover:bg-slate-100",
                )}
                key={item.id}
                onClick={() => setView(item.id)}
                type="button"
              >
                {item.icon}
                <span>{item.label}</span>
                {item.id === "notifications" && unread ? (
                  <span className="grid h-5 min-w-5 place-items-center rounded-full bg-red-600 px-1 text-xs text-white">
                    {unread}
                  </span>
                ) : null}
              </button>
            ))}
        </nav>
      </header>

      <div className="mx-auto grid max-w-[1800px] gap-5 px-4 py-5">
        {view === "dashboard" ? (
          isEmployee ? (
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

        {view === "new-request" ? (
          <RequestForm
            currentUser={currentUser}
            onSubmit={(draft) => {
              setState((current) =>
                submitProcurementRequest(current, draft, currentUser.id),
              );
              setSelectedRequestId(
                `PR-${Math.max(
                  ...state.requests.map((request) =>
                    Number(request.id.replace("PR-", "")),
                  ),
                ) + 1}`,
              );
              setView("dashboard");
            }}
          />
        ) : null}

        {view === "notifications" ? (
          <NotificationsCenter
            currentUser={currentUser}
            onRead={(id) => setState((current) => markNotificationRead(current, id))}
            onRunReminder={() =>
              setState((current) => createDailyReminderNotifications(current))
            }
            state={state}
          />
        ) : null}

        {view === "admin" && currentUser.role === "Admin" ? (
          <AdminPanel setState={setState} state={state} />
        ) : null}
      </div>
    </main>
  );
}
