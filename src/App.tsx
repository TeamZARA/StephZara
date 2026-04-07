import React, { useEffect, useMemo, useRef, useState } from "react";

type Status = "New" | "Waiting" | "Interested" | "Appointment" | "Do Not Contact";
type View = "dashboard" | "contacts" | "leads" | "pipeline" | "scripts" | "bulk" | "manager";
type CrmTag = "Unmessaged" | "Messaged" | "Responded" | "Hot Seller" | "Follow Up" | "Archived";

type ContactRecord = {
  id: string;
  category: string;
  name: string;
  surname: string;
  email: string;
  cell: string;
  address: string;
  phone: string;
  type: string;
  idNumber: string;
  birthDay: string;
  tags: string;
  source: string;
  wishLists: string;
  matches: string;
  sms: string;
  emails: string;
  whatsApp: string;
  optIn: string;
  agents: string;
  loaded: string;
  modified: string;
  lastContacted: string;
  status: Status;
  assignee: string;
  temperature: "Cold" | "Warm" | "Hot";
  valueBand: string;
  notes: string;
  reply: string;
  followUpDue: boolean;
  followUpDate: string;
  suburb: string;
  crmTag: CrmTag;
  suburbGroup: string;
};

type ScriptTemplate = {
  id: string;
  name: string;
  category: string;
  content: string;
};

const STORAGE_CONTACTS_KEY = "stephzara_contacts_v4";
const STORAGE_SCRIPTS_KEY = "stephzara_scripts_v4";
const STORAGE_CSV_NAME_KEY = "stephzara_csv_name_v4";

const todayIso = () => new Date().toISOString().slice(0, 10);
const addDaysIso = (days: number) => {
  const d = new Date();
  d.setDate(d.getDate() + days);
  return d.toISOString().slice(0, 10);
};

const seed: ContactRecord[] = [
  {
    id: "1",
    category: "Seller",
    name: "Janine",
    surname: "Smith",
    email: "janine@example.com",
    cell: "+27 82 555 0141",
    address: "12 Oak Street, Durbanville",
    phone: "021 555 1111",
    type: "Owner",
    idNumber: "7506281234088",
    birthDay: "1975-06-28",
    tags: "Hot area",
    source: "PropCon CSV",
    wishLists: "Family home",
    matches: "2",
    sms: "Yes",
    emails: "Yes",
    whatsApp: "Yes",
    optIn: "Yes",
    agents: "Lerato",
    loaded: todayIso(),
    modified: todayIso(),
    lastContacted: "",
    status: "New",
    assignee: "Lerato",
    temperature: "Cold",
    valueBand: "R3.8m - R4.2m",
    notes: "Fresh PropCon import",
    reply: "",
    followUpDue: true,
    followUpDate: todayIso(),
    suburb: "Durbanville",
    crmTag: "Unmessaged",
    suburbGroup: "Durbanville",
  },
  {
    id: "2",
    category: "Seller",
    name: "Peter",
    surname: "Jacobs",
    email: "peter@example.com",
    cell: "+27 83 555 0198",
    address: "85 Marine Road, Blouberg",
    phone: "021 555 2222",
    type: "Owner",
    idNumber: "7801015678088",
    birthDay: "1978-01-01",
    tags: "Follow up",
    source: "PropCon CSV",
    wishLists: "Sea view",
    matches: "1",
    sms: "Yes",
    emails: "Yes",
    whatsApp: "Yes",
    optIn: "Yes",
    agents: "Lerato",
    loaded: todayIso(),
    modified: todayIso(),
    lastContacted: todayIso(),
    status: "Waiting",
    assignee: "Lerato",
    temperature: "Cold",
    valueBand: "R5.5m - R6.1m",
    notes: "Follow-up today",
    reply: "Seen, no reply",
    followUpDue: true,
    followUpDate: addDaysIso(1),
    suburb: "Blouberg",
    crmTag: "Follow Up",
    suburbGroup: "Blouberg",
  },
  {
    id: "3",
    category: "Seller",
    name: "Ayesha",
    surname: "Daniels",
    email: "ayesha@example.com",
    cell: "+27 81 555 0102",
    address: "44 Sandpiper Ave, Parklands",
    phone: "021 555 3333",
    type: "Owner",
    idNumber: "8102023456088",
    birthDay: "1981-02-02",
    tags: "Warm",
    source: "PropCon CSV",
    wishLists: "Parklands",
    matches: "5",
    sms: "Yes",
    emails: "Yes",
    whatsApp: "Yes",
    optIn: "Yes",
    agents: "Lerato",
    loaded: todayIso(),
    modified: todayIso(),
    lastContacted: todayIso(),
    status: "Interested",
    assignee: "Lerato",
    temperature: "Warm",
    valueBand: "R2.4m - R2.8m",
    notes: "Warm lead",
    reply: "Please send recent sales.",
    followUpDue: false,
    followUpDate: addDaysIso(3),
    suburb: "Parklands",
    crmTag: "Responded",
    suburbGroup: "Parklands",
  },
];

const defaultScripts: ScriptTemplate[] = [
  { id: "s1", name: "Area Sales Intro 1", category: "Canvassing", content: "Hi {{name}}, I’m putting together a free property sales report for homeowners in {{suburb}}. Would you like me to send you what homes around you have sold for over the last year?" },
  { id: "s2", name: "Area Sales Intro 2", category: "Canvassing", content: "Hi {{name}}, quick one — I’ve just compiled recent property sales in {{suburb}}. Would you be interested in seeing what similar properties nearby have been selling for?" },
  { id: "s3", name: "Neighbourhood Update", category: "Canvassing", content: "Hi {{name}}, I’m sharing a free sales update with homeowners in {{suburb}}. It shows what similar homes have sold for recently. Would you like me to send you a copy?" },
  { id: "s4", name: "Curiosity Hook", category: "Canvassing", content: "Hi {{name}}, have you seen what properties in your area have been achieving lately? I’ve got the latest figures for {{suburb}} if you’d like me to send them through." },
  { id: "s5", name: "Value Awareness", category: "Valuation", content: "Hi {{name}}, property values in {{suburb}} have changed quite a bit over the past year. I’ve put together a simple report showing recent sales — would you like me to send it to you?" },
  { id: "s6", name: "Soft Seller Approach", category: "Canvassing", content: "Hi {{name}}, I’m currently helping buyers looking in {{suburb}}. I also have a free sales report for the area showing recent transactions — would you like me to share it with you?" },
  { id: "s7", name: "Professional Offer", category: "Canvassing", content: "Hi {{name}}, I’m working on a professional sales report for homeowners in {{suburb}} showing recent transactions and price trends. Happy to send it free of charge — would that be useful to you?" },
  { id: "s8", name: "Engagement Question", category: "Canvassing", content: "Hi {{name}}, if you knew exactly what properties in {{suburb}} were selling for today, would that be helpful? I’ve got recent sales data for the area that I can share." },
  { id: "s9", name: "Local Insight", category: "Canvassing", content: "Hi {{name}}, I’ve just updated my records with the latest property sales in {{suburb}}. Would you like a quick breakdown of what’s been happening in your area?" },
  { id: "s10", name: "Friendly Intro", category: "Canvassing", content: "Hi {{name}}, I’m reaching out to a few homeowners in {{suburb}} with a free report on recent property sales. No obligation at all — would you like me to send it through?" },
];

const csvFieldDefs = [
  { key: "category", label: "Category" },
  { key: "name", label: "Name" },
  { key: "surname", label: "Surname" },
  { key: "email", label: "Email" },
  { key: "cell", label: "Cell" },
  { key: "address", label: "Address" },
  { key: "phone", label: "Phone" },
  { key: "type", label: "Type" },
  { key: "idNumber", label: "*ID Number" },
  { key: "birthDay", label: "BirthDay" },
  { key: "tags", label: "Tags" },
  { key: "source", label: "Source" },
  { key: "wishLists", label: "Wish Lists" },
  { key: "matches", label: "Matches" },
  { key: "sms", label: "SMS" },
  { key: "emails", label: "Emails" },
  { key: "whatsApp", label: "WhatsApp" },
  { key: "optIn", label: "Opt-In" },
  { key: "agents", label: "Agents" },
  { key: "loaded", label: "Loaded" },
  { key: "modified", label: "Modified" },
  { key: "lastContacted", label: "Last Contacted" },
] as const;

const views: { key: View; label: string; emoji: string }[] = [
  { key: "dashboard", label: "Dashboard", emoji: "🏠" },
  { key: "contacts", label: "Contacts", emoji: "📒" },
  { key: "leads", label: "Lead Desk", emoji: "👥" },
  { key: "pipeline", label: "Pipeline", emoji: "📊" },
  { key: "scripts", label: "Scripts", emoji: "📝" },
  { key: "bulk", label: "Bulk Send", emoji: "📤" },
  { key: "manager", label: "Manager", emoji: "📅" },
];

function fullName(record: ContactRecord) {
  return `${record.name} ${record.surname}`.trim();
}

function renderScript(content: string, record: ContactRecord) {
  return content
    .replace(/\{\{full_name\}\}/g, fullName(record))
    .replace(/\{\{name\}\}/g, record.name)
    .replace(/\{\{surname\}\}/g, record.surname)
    .replace(/\{\{suburb\}\}/g, record.suburb || record.address)
    .replace(/\{\{cell\}\}/g, record.cell)
    .replace(/\{\{email\}\}/g, record.email)
    .replace(/\{\{address\}\}/g, record.address)
    .replace(/\{\{category\}\}/g, record.category)
    .replace(/\{\{type\}\}/g, record.type);
}

function parseCsv(text: string): string[][] {
  const rows: string[][] = [];
  let row: string[] = [];
  let cell = "";
  let inQuotes = false;
  for (let i = 0; i < text.length; i += 1) {
    const char = text[i];
    const next = text[i + 1];
    if (char === '"') {
      if (inQuotes && next === '"') {
        cell += '"';
        i += 1;
      } else {
        inQuotes = !inQuotes;
      }
    } else if (char === "," && !inQuotes) {
      row.push(cell);
      cell = "";
    } else if ((char === "\n" || char === "\r") && !inQuotes) {
      if (char === "\r" && next === "\n") i += 1;
      row.push(cell);
      rows.push(row);
      row = [];
      cell = "";
    } else {
      cell += char;
    }
  }
  if (cell.length || row.length) {
    row.push(cell);
    rows.push(row);
  }
  return rows;
}

function csvEscape(value: unknown) {
  const str = String(value ?? "");
  if (/[",\n]/.test(str)) return `"${str.replace(/"/g, '""')}"`;
  return str;
}

function downloadCsv(filename: string, rows: Record<string, unknown>[]) {
  if (!rows.length) return;
  const headers = Object.keys(rows[0]);
  const lines = [headers.join(",")];
  rows.forEach((row) => lines.push(headers.map((h) => csvEscape(row[h])).join(",")));
  const blob = new Blob([lines.join("\n")], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}

function normalizeHeader(header: string) {
  return header.toLowerCase().replace(/[^a-z0-9]/g, "");
}

function buildWhatsAppUrl(phoneRaw: string, message: string) {
  const phone = phoneRaw.replace(/\D/g, "");
  return `https://wa.me/${phone}?text=${encodeURIComponent(message)}`;
}

function metricBg(index: number) {
  const bgs = [
    "linear-gradient(135deg,#f8fafc,#e2e8f0)",
    "linear-gradient(135deg,#fef3c7,#fde68a)",
    "linear-gradient(135deg,#dcfce7,#a7f3d0)",
    "linear-gradient(135deg,#dbeafe,#93c5fd)",
    "linear-gradient(135deg,#ffe4e6,#fdba74)",
  ];
  return bgs[index % bgs.length];
}

export default function App() {
  const [view, setView] = useState<View>("dashboard");
  const [records, setRecords] = useState<ContactRecord[]>(() => {
    const stored = typeof window !== "undefined" ? localStorage.getItem(STORAGE_CONTACTS_KEY) : null;
    if (!stored) return seed;
    try {
      return JSON.parse(stored) as ContactRecord[];
    } catch {
      return seed;
    }
  });
  const [selectedId, setSelectedId] = useState("3");
  const [selectedScriptId, setSelectedScriptId] = useState("s3");
  const [selectedBulk, setSelectedBulk] = useState<Record<string, boolean>>({});
  const [csvName, setCsvName] = useState(() => (typeof window !== "undefined" ? localStorage.getItem(STORAGE_CSV_NAME_KEY) || "No file selected" : "No file selected"));
  const [scripts, setScripts] = useState<ScriptTemplate[]>(() => {
    const stored = typeof window !== "undefined" ? localStorage.getItem(STORAGE_SCRIPTS_KEY) : null;
    if (!stored) return defaultScripts;
    try {
      return JSON.parse(stored) as ScriptTemplate[];
    } catch {
      return defaultScripts;
    }
  });
  const [scriptName, setScriptName] = useState("");
  const [scriptCategory, setScriptCategory] = useState("Canvassing");
  const [scriptContent, setScriptContent] = useState("");
  const [quickSearch, setQuickSearch] = useState("");
  const [fieldSearch, setFieldSearch] = useState<Record<string, string>>(() => Object.fromEntries(csvFieldDefs.map((f) => [f.key, ""])));
  const [selectedSuburbGroup, setSelectedSuburbGroup] = useState("All suburbs");
  const [selectedCrmTag, setSelectedCrmTag] = useState<CrmTag | "All tags">("All tags");
  const [bulkQueueIndex, setBulkQueueIndex] = useState(0);
  const [bulkDrafts, setBulkDrafts] = useState<Record<string, { scriptId: string; message: string }>>({});
  const fileRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    if (typeof window !== "undefined") localStorage.setItem(STORAGE_CONTACTS_KEY, JSON.stringify(records));
  }, [records]);

  useEffect(() => {
    if (typeof window !== "undefined") localStorage.setItem(STORAGE_SCRIPTS_KEY, JSON.stringify(scripts));
  }, [scripts]);

  useEffect(() => {
    if (typeof window !== "undefined") localStorage.setItem(STORAGE_CSV_NAME_KEY, csvName);
  }, [csvName]);

  const suburbGroups = useMemo(() => ["All suburbs", ...Array.from(new Set(records.map((r) => r.suburb || "Unknown"))).sort()], [records]);

  const filtered = useMemo(() => {
    return records.filter((record) => {
      const quickHay = [
        record.category,
        record.name,
        record.surname,
        record.email,
        record.cell,
        record.address,
        record.phone,
        record.type,
        record.idNumber,
        record.birthDay,
        record.tags,
        record.source,
        record.wishLists,
        record.matches,
        record.sms,
        record.emails,
        record.whatsApp,
        record.optIn,
        record.agents,
        record.loaded,
        record.modified,
        record.lastContacted,
        record.suburb,
        record.crmTag,
      ].join(" ").toLowerCase();
      const quickMatch = quickHay.includes(quickSearch.toLowerCase());
      const fieldMatch = csvFieldDefs.every((field) => {
        const value = fieldSearch[field.key] || "";
        if (!value) return true;
        return String((record as any)[field.key] || "").toLowerCase().includes(value.toLowerCase());
      });
      const suburbMatch = selectedSuburbGroup === "All suburbs" ? true : record.suburb === selectedSuburbGroup;
      const crmTagMatch = selectedCrmTag === "All tags" ? true : record.crmTag === selectedCrmTag;
      return quickMatch && fieldMatch && suburbMatch && crmTagMatch;
    });
  }, [records, quickSearch, fieldSearch, selectedSuburbGroup, selectedCrmTag]);

  const selected = filtered.find((r) => r.id === selectedId) || records.find((r) => r.id === selectedId) || records[0];
  const selectedScript = scripts.find((s) => s.id === selectedScriptId) || scripts[0];
  const leadMessage = renderScript(selectedScript.content, selected);

  const bulkTargets = filtered.filter((r) => selectedBulk[r.id]);
  const bulkTarget = bulkTargets[bulkQueueIndex] || null;

  useEffect(() => {
    if (!bulkTargets.length) return;
    setBulkDrafts((prev) => {
      const next = { ...prev };
      bulkTargets.forEach((record, index) => {
        if (!next[record.id]) {
          const rotatedScript = scripts[index % scripts.length] || selectedScript;
          next[record.id] = {
            scriptId: rotatedScript.id,
            message: renderScript(rotatedScript.content, record),
          };
        }
      });
      return next;
    });
  }, [bulkTargets, scripts, selectedScript]);

  const stats = {
    total: records.length,
    due: records.filter((r) => r.followUpDue && r.status !== "Do Not Contact").length,
    hot: records.filter((r) => r.temperature === "Hot").length,
    interested: records.filter((r) => r.status === "Interested").length,
    appointments: records.filter((r) => r.status === "Appointment").length,
    messaged: records.filter((r) => r.crmTag === "Messaged").length,
    responded: records.filter((r) => r.crmTag === "Responded").length,
  };

  const pipeline = ["New", "Waiting", "Interested", "Appointment", "Do Not Contact"].map((status) => ({
    status: status as Status,
    items: records.filter((r) => r.status === status),
  }));

  const copyLeadMessage = async () => {
    try {
      await navigator.clipboard.writeText(leadMessage);
      alert("Message copied");
    } catch {
      alert("Could not copy message");
    }
  };

  const openLeadWhatsApp = () => {
    window.open(buildWhatsAppUrl(selected.cell || selected.phone, leadMessage), "_blank");
  };

  const markLeadStatus = (status: Status) => {
    setRecords((prev) =>
      prev.map((r) =>
        r.id === selected.id
          ? {
              ...r,
              status,
              followUpDue: status === "Waiting",
              temperature: status === "Appointment" ? "Hot" : status === "Interested" ? "Warm" : r.temperature,
              modified: todayIso(),
            }
          : r
      )
    );
  };

  const tagLead = (crmTag: CrmTag) => {
    setRecords((prev) => prev.map((r) => (r.id === selected.id ? { ...r, crmTag, modified: todayIso() } : r)));
  };

  const nextLead = () => {
    const idx = filtered.findIndex((r) => r.id === selected.id);
    if (idx >= 0 && idx < filtered.length - 1) setSelectedId(filtered[idx + 1].id);
  };

  const exportRegister = () => {
    downloadCsv(
      "propcon_register.csv",
      records.map((r) => ({
        Category: r.category,
        Name: r.name,
        Surname: r.surname,
        Email: r.email,
        Cell: r.cell,
        Address: r.address,
        Phone: r.phone,
        Type: r.type,
        "*ID Number": r.idNumber,
        BirthDay: r.birthDay,
        Tags: r.tags,
        Source: r.source,
        "Wish Lists": r.wishLists,
        Matches: r.matches,
        SMS: r.sms,
        Emails: r.emails,
        WhatsApp: r.whatsApp,
        "Opt-In": r.optIn,
        Agents: r.agents,
        Loaded: r.loaded,
        Modified: r.modified,
        "Last Contacted": r.lastContacted,
        Suburb: r.suburb,
        CRMTag: r.crmTag,
        FollowUpDate: r.followUpDate,
      }))
    );
  };

  const exportBulk = () => {
    const rows = bulkTargets.map((r) => ({
      Category: r.category,
      Name: r.name,
      Surname: r.surname,
      Cell: r.cell,
      Script: scripts.find((s) => s.id === (bulkDrafts[r.id]?.scriptId || selectedScriptId))?.name || "",
      Message: bulkDrafts[r.id]?.message || renderScript(selectedScript.content, r),
    }));
    if (!rows.length) {
      alert("Select at least one contact first");
      return;
    }
    downloadCsv("propcon_bulk_export.csv", rows);
  };

  const openBulkSend = () => {
    if (!bulkTargets.length) {
      alert("Select contacts in Contacts first");
      return;
    }
    setBulkQueueIndex(0);
    setView("bulk");
  };

  const openCurrentBulkWhatsApp = () => {
    if (!bulkTarget) return;
    const draft = bulkDrafts[bulkTarget.id];
    const outgoing = draft?.message || renderScript(selectedScript.content, bulkTarget);
    window.open(buildWhatsAppUrl(bulkTarget.cell || bulkTarget.phone, outgoing), "_blank");
  };

  const copyCurrentBulkMessage = async () => {
    if (!bulkTarget) return;
    try {
      await navigator.clipboard.writeText(bulkDrafts[bulkTarget.id]?.message || renderScript(selectedScript.content, bulkTarget));
      alert("Bulk message copied");
    } catch {
      alert("Could not copy bulk message");
    }
  };

  const markBulkSentAndNext = () => {
    if (!bulkTarget) return;
    setRecords((prev) => prev.map((r) => (r.id === bulkTarget.id ? { ...r, crmTag: "Messaged", followUpDue: true, followUpDate: addDaysIso(3), lastContacted: todayIso(), modified: todayIso() } : r)));
    if (bulkQueueIndex < bulkTargets.length - 1) setBulkQueueIndex((prev) => prev + 1);
    else alert("Bulk queue complete");
  };

  const markBulkResponded = () => {
    if (!bulkTarget) return;
    setRecords((prev) => prev.map((r) => (r.id === bulkTarget.id ? { ...r, crmTag: "Responded", status: "Interested", temperature: "Warm", modified: todayIso() } : r)));
  };

  const markBulkHotSeller = () => {
    if (!bulkTarget) return;
    setRecords((prev) => prev.map((r) => (r.id === bulkTarget.id ? { ...r, crmTag: "Hot Seller", status: "Appointment", temperature: "Hot", modified: todayIso() } : r)));
  };

  const scheduleBulkFollowUp = () => {
    if (!bulkTarget) return;
    setRecords((prev) => prev.map((r) => (r.id === bulkTarget.id ? { ...r, crmTag: "Follow Up", followUpDue: true, followUpDate: addDaysIso(2), modified: todayIso() } : r)));
    alert("Follow-up reminder set");
  };

  const skipBulkAndNext = () => {
    if (!bulkTarget) return;
    if (bulkQueueIndex < bulkTargets.length - 1) setBulkQueueIndex((prev) => prev + 1);
    else alert("No more contacts in queue");
  };

  const prevBulk = () => {
    if (bulkQueueIndex > 0) setBulkQueueIndex((prev) => prev - 1);
  };

  const nextBulk = () => {
    if (bulkQueueIndex < bulkTargets.length - 1) setBulkQueueIndex((prev) => prev + 1);
  };

  const updateBulkDraftScript = (recordId: string, scriptId: string) => {
    const record = records.find((r) => r.id === recordId);
    const script = scripts.find((s) => s.id === scriptId);
    if (!record || !script) return;
    setBulkDrafts((prev) => ({
      ...prev,
      [recordId]: { scriptId, message: renderScript(script.content, record) },
    }));
  };

  const rotateCurrentScript = () => {
    if (!bulkTarget) return;
    const currentId = bulkDrafts[bulkTarget.id]?.scriptId || selectedScriptId;
    const currentIndex = scripts.findIndex((s) => s.id === currentId);
    const nextScript = scripts[(currentIndex + 1) % scripts.length];
    updateBulkDraftScript(bulkTarget.id, nextScript.id);
  };

  const updateBulkDraftMessage = (recordId: string, messageText: string) => {
    setBulkDrafts((prev) => ({
      ...prev,
      [recordId]: { scriptId: prev[recordId]?.scriptId || selectedScriptId, message: messageText },
    }));
  };

  const handleImportClick = () => fileRef.current?.click();

  const handleCsvFile = async (file: File | null) => {
    if (!file) return;
    setCsvName(file.name);
    const text = await file.text();
    const rows = parseCsv(text);
    if (rows.length < 2) return;

    const headers = rows[0].map((h) => String(h || "").trim());
    const normalized = headers.map(normalizeHeader);
    const body = rows.slice(1).filter((r) => r.some((cell) => String(cell || "").trim() !== ""));

    const getByNames = (row: string[], names: string[]) => {
      const idx = normalized.findIndex((h) => names.includes(h));
      return idx >= 0 ? String(row[idx] || "").trim() : "";
    };

    const imported = body.map((row, index): ContactRecord => ({
      id: `import-${Date.now()}-${index}`,
      category: getByNames(row, ["category"]),
      name: getByNames(row, ["name"]),
      surname: getByNames(row, ["surname"]),
      email: getByNames(row, ["email"]),
      cell: getByNames(row, ["cell", "mobile"]),
      address: getByNames(row, ["address"]),
      phone: getByNames(row, ["phone"]),
      type: getByNames(row, ["type"]),
      idNumber: getByNames(row, ["idnumber"]),
      birthDay: getByNames(row, ["birthday"]),
      tags: getByNames(row, ["tags"]),
      source: getByNames(row, ["source"]) || file.name,
      wishLists: getByNames(row, ["wishlists"]),
      matches: getByNames(row, ["matches"]),
      sms: getByNames(row, ["sms"]),
      emails: getByNames(row, ["emails"]),
      whatsApp: getByNames(row, ["whatsapp"]),
      optIn: getByNames(row, ["optin"]),
      agents: getByNames(row, ["agents"]),
      loaded: getByNames(row, ["loaded"]) || todayIso(),
      modified: getByNames(row, ["modified"]) || todayIso(),
      lastContacted: getByNames(row, ["lastcontacted"]),
      status: "New",
      assignee: getByNames(row, ["agents"]) || "Unassigned",
      temperature: "Cold",
      valueBand: "Pending",
      notes: "Imported from CSV",
      reply: "",
      followUpDue: true,
      followUpDate: todayIso(),
      suburb: getByNames(row, ["suburb"]) || getByNames(row, ["address"]),
      crmTag: "Unmessaged",
      suburbGroup: getByNames(row, ["suburb"]) || getByNames(row, ["address"]),
    })).filter((r) => r.name || r.surname || r.cell || r.email);

    if (!imported.length) {
      alert("No usable rows found in that CSV");
      return;
    }

    setRecords((prev) => [...imported, ...prev]);
    setSelectedId(imported[0].id);
    setView("contacts");
    alert(`${imported.length} contacts imported and saved in this browser`);
  };

  const saveScript = () => {
    if (!scriptName.trim() || !scriptContent.trim()) {
      alert("Add a script name and content first");
      return;
    }
    const newScript: ScriptTemplate = { id: `script-${Date.now()}`, name: scriptName.trim(), category: scriptCategory.trim() || "General", content: scriptContent.trim() };
    setScripts((prev) => [newScript, ...prev]);
    setSelectedScriptId(newScript.id);
    setScriptName("");
    setScriptCategory("Canvassing");
    setScriptContent("");
    alert("Script saved");
  };

  const openFollowUps = () => {
    const waiting = records.filter((r) => r.followUpDue && r.status !== "Do Not Contact");
    if (waiting.length) {
      setSelectedId(waiting[0].id);
      setView("contacts");
      setSelectedCrmTag("Follow Up");
    } else {
      alert("No follow-ups due right now");
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900">
      <input ref={fileRef} type="file" accept=".csv,text/csv" style={{ display: "none" }} onChange={(e) => void handleCsvFile(e.target.files?.[0] || null)} />
      <div style={styles.layout}>
        <aside style={styles.sidebar}>
          <div style={styles.sidebarHeader}>
            <div style={styles.logoBox}>🏢</div>
            <div>
              <div style={styles.brand}>StephZara</div>
              <div style={styles.brandSub}>PropCon-style CRM</div>
            </div>
          </div>
          <div style={{ padding: 16 }}>
            <div style={styles.sidebarLabel}>Workspace</div>
            {views.map((item) => (
              <button key={item.key} onClick={() => setView(item.key)} style={{ ...styles.sidebarButton, ...(view === item.key ? styles.sidebarButtonActive : {}) }}>
                <span style={{ fontSize: 18 }}>{item.emoji}</span>
                <span>{item.label}</span>
              </button>
            ))}
          </div>
          <div style={{ padding: 16 }}>
            <div style={styles.focusCardDark}>
              <div style={styles.focusTitle}>🔥 Focus Today</div>
              <div style={styles.darkRow}><span>Follow-ups</span><strong>{stats.due}</strong></div>
              <div style={styles.darkRow}><span>Messaged</span><strong>{stats.messaged}</strong></div>
              <div style={styles.darkRow}><span>Responded</span><strong>{stats.responded}</strong></div>
              <button onClick={openFollowUps} style={{ ...styles.whiteButton, width: "100%", marginTop: 8 }}>Open Follow Ups</button>
            </div>
          </div>
        </aside>

        <main style={styles.main}>
          <section style={styles.hero}>
            <div style={styles.heroTop}>
              <div>
                <div style={styles.heroTag}>✨ Next-level CRM upgrade</div>
                <h1 style={styles.heroTitle}>Lead Management Dashboard</h1>
                <p style={styles.heroText}>Now with smart script rotation, CRM tags, suburb grouping, response tracking, follow-up reminders, and a one-by-one editable WhatsApp queue.</p>
              </div>
              <div style={styles.heroButtons}>
                <button onClick={handleImportClick} style={styles.whiteButton}>📤 Import CSV</button>
                <button onClick={exportRegister} style={styles.ghostButton}>📥 Export Register</button>
              </div>
            </div>
            <div style={styles.metricsGrid}>
              {[
                ["Contacts", stats.total],
                ["Warm / Hot", stats.hot + records.filter((r) => r.temperature === "Warm").length],
                ["Interested", stats.interested],
                ["Appointments", stats.appointments],
                ["Due Today", stats.due],
              ].map(([label, value], i) => <MetricCard key={String(label)} title={String(label)} value={Number(value)} bg={metricBg(i)} />)}
            </div>
          </section>

          {view === "dashboard" && (
            <div style={styles.twoCol}>
              <section style={styles.card}>
                <div style={styles.cardHeader}><div><h2 style={styles.cardTitle}>Smart Overview</h2><div style={styles.cardSub}>Track outreach, responses, and follow-ups.</div></div></div>
                <div style={styles.focusGrid}>
                  <FocusCard title="Messaged" value={`${stats.messaged}`} subtitle="Contacts already reached" gradient="linear-gradient(135deg,#2563eb,#06b6d4)" />
                  <FocusCard title="Responded" value={`${stats.responded}`} subtitle="People who replied" gradient="linear-gradient(135deg,#16a34a,#34d399)" />
                  <FocusCard title="Follow Ups" value={`${stats.due}`} subtitle="Needs another touch" gradient="linear-gradient(135deg,#f59e0b,#f97316)" />
                  <FocusCard title="Hot Sellers" value={`${records.filter((r) => r.crmTag === "Hot Seller").length}`} subtitle="High-priority owners" gradient="linear-gradient(135deg,#ef4444,#fb7185)" />
                </div>
              </section>
              <section style={styles.card}>
                <div style={styles.cardHeader}><div><h2 style={styles.cardTitle}>Suburb Breakdown</h2><div style={styles.cardSub}>Use grouping to work one suburb at a time.</div></div></div>
                <div style={styles.previewStack}>
                  {suburbGroups.filter((s) => s !== "All suburbs").map((suburb) => {
                    const group = records.filter((r) => r.suburb === suburb);
                    return (
                      <button key={suburb} onClick={() => { setSelectedSuburbGroup(suburb); setView("contacts"); }} style={styles.previewCard}>
                        <div style={styles.previewHead}><div style={styles.previewName}>{suburb}</div><span style={styles.tag}>{group.length} contacts</span></div>
                        <div style={styles.previewMessage}>{group.filter((r) => r.crmTag === "Responded").length} responded · {group.filter((r) => r.followUpDue).length} follow up</div>
                      </button>
                    );
                  })}
                </div>
              </section>
            </div>
          )}

          {view === "contacts" && (
            <div style={styles.card}>
              <div style={styles.cardHeader}>
                <div>
                  <h2 style={styles.cardTitle}>Contacts</h2>
                  <div style={styles.cardSub}>Search all imported fields, group by suburb, and build your send queue.</div>
                </div>
                <div style={styles.topBadge}>{filtered.length} results • {csvName}</div>
              </div>

              <div style={styles.contactsActionsRow}>
                <select value={selectedSuburbGroup} onChange={(e) => setSelectedSuburbGroup(e.target.value)} style={styles.select}>
                  {suburbGroups.map((s) => <option key={s}>{s}</option>)}
                </select>
                <select value={selectedCrmTag} onChange={(e) => setSelectedCrmTag(e.target.value as any)} style={styles.select}>
                  {["All tags", "Unmessaged", "Messaged", "Responded", "Hot Seller", "Follow Up", "Archived"].map((t) => <option key={t}>{t}</option>)}
                </select>
                <button onClick={() => { const next: Record<string, boolean> = {}; filtered.forEach((r) => { next[r.id] = true; }); setSelectedBulk(next); setBulkQueueIndex(0); }} style={styles.secondaryAction}>Select All Results</button>
                <button onClick={() => { setSelectedBulk({}); setBulkQueueIndex(0); }} style={styles.secondaryAction}>Clear Selection</button>
                <button onClick={openBulkSend} style={styles.darkButton}>Open Bulk Send</button>
              </div>

              <div style={styles.contactsSearchGridUltraWide}>
                <SearchField label="Quick Search" value={quickSearch} onChange={setQuickSearch} placeholder="Search all fields" />
                {csvFieldDefs.map((field) => (
                  <SearchField key={field.key} label={field.label} value={fieldSearch[field.key] || ""} onChange={(value) => setFieldSearch((prev) => ({ ...prev, [field.key]: value }))} placeholder={field.label} />
                ))}
              </div>

              <div style={styles.tableWrap}>
                <table style={styles.table}>
                  <thead>
                    <tr>
                      <th style={styles.th}></th>
                      <th style={styles.th}>CRM Tag</th>
                      <th style={styles.th}>Suburb</th>
                      {csvFieldDefs.map((field) => <th key={field.key} style={styles.th}>{field.label}</th>)}
                    </tr>
                  </thead>
                  <tbody>
                    {filtered.map((record) => (
                      <tr key={record.id}>
                        <td style={styles.td}><input type="checkbox" checked={!!selectedBulk[record.id]} onChange={() => setSelectedBulk((prev) => ({ ...prev, [record.id]: !prev[record.id] }))} /></td>
                        <td style={styles.td}>{record.crmTag}</td>
                        <td style={styles.td}>{record.suburb}</td>
                        {csvFieldDefs.map((field) => <td key={field.key} style={styles.td}>{String((record as any)[field.key] || "")}</td>)}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {view === "scripts" && (
            <div style={styles.twoCol}>
              <section style={styles.card}>
                <div style={styles.cardHeader}><div><h2 style={styles.cardTitle}>Saved Scripts</h2><div style={styles.cardSub}>Rotate scripts naturally across your queue.</div></div><div style={styles.topBadge}>{scripts.length} scripts</div></div>
                <div style={styles.listArea}>
                  {scripts.map((item) => (
                    <button key={item.id} onClick={() => setSelectedScriptId(item.id)} style={{ ...styles.scriptCard, ...(selectedScriptId === item.id ? styles.leadCardActive : {}) }}>
                      <div style={styles.previewHead}><div style={styles.previewName}>{item.name}</div><span style={styles.tag}>{item.category}</span></div>
                      <div style={styles.previewMessage}>{item.content}</div>
                    </button>
                  ))}
                </div>
              </section>
              <section style={styles.card}>
                <div style={styles.cardHeader}><div><h2 style={styles.cardTitle}>Create Script</h2><div style={styles.cardSub}>Add your own first-contact or follow-up messages.</div></div></div>
                <div>
                  <label style={styles.label}>Script Name</label>
                  <input value={scriptName} onChange={(e) => setScriptName(e.target.value)} style={styles.input} placeholder="Example: Free Sales Report Intro" />
                </div>
                <div style={{ marginTop: 16 }}>
                  <label style={styles.label}>Category</label>
                  <input value={scriptCategory} onChange={(e) => setScriptCategory(e.target.value)} style={styles.input} placeholder="Canvassing" />
                </div>
                <div style={{ marginTop: 16 }}>
                  <label style={styles.label}>Content</label>
                  <textarea value={scriptContent} onChange={(e) => setScriptContent(e.target.value)} style={styles.textarea} placeholder="Hi {{name}}, I’ve put together a free property sales report for {{suburb}}..." />
                </div>
                <div style={styles.actionRow3}>
                  <button onClick={saveScript} style={styles.darkButtonWide}>💾 Save Script</button>
                  <button onClick={() => { setScriptName(""); setScriptCategory("Canvassing"); setScriptContent(""); }} style={styles.secondaryAction}>Clear</button>
                  <button onClick={() => setView("bulk")} style={styles.secondaryAction}>Use in Queue</button>
                </div>
              </section>
            </div>
          )}

          {view === "bulk" && (
            <div style={styles.twoCol}>
              <section style={styles.card}>
                <div style={styles.cardHeader}>
                  <div>
                    <h2 style={styles.cardTitle}>Bulk WhatsApp Queue</h2>
                    <div style={styles.cardSub}>Choose a contact yourself, pick a script, edit the message, send in WhatsApp, then move on.</div>
                  </div>
                  <button onClick={exportBulk} style={styles.darkButton}>📥 Export CSV</button>
                </div>

                <div style={styles.bulkActionBar}>
                  <button onClick={prevBulk} style={styles.secondaryAction}>Previous</button>
                  <button onClick={nextBulk} style={styles.secondaryAction}>Next</button>
                  <button onClick={rotateCurrentScript} style={styles.secondaryAction}>Rotate Script</button>
                  <button onClick={openCurrentBulkWhatsApp} style={styles.whatsAppAction}>Open in WhatsApp</button>
                  <button onClick={copyCurrentBulkMessage} style={styles.secondaryAction}>Copy Message</button>
                </div>

                <div style={styles.bulkInfoBox}>
                  {bulkTarget ? (
                    <>
                      <div style={styles.previewHead}>
                        <div style={styles.previewName}>Queue Item {bulkQueueIndex + 1} / {bulkTargets.length}</div>
                        <span style={styles.tag}>{fullName(bulkTarget)}</span>
                      </div>
                      <div style={styles.bulkQueueMetaGrid}>
                        <div style={styles.infoTile}><div style={styles.infoLabel}>Cell</div><div style={styles.infoValue}>{bulkTarget.cell || bulkTarget.phone}</div></div>
                        <div style={styles.infoTile}><div style={styles.infoLabel}>Agent</div><div style={styles.infoValue}>{bulkTarget.agents || bulkTarget.assignee}</div></div>
                        <div style={styles.infoTile}><div style={styles.infoLabel}>Suburb</div><div style={styles.infoValue}>{bulkTarget.suburb}</div></div>
                        <div style={styles.infoTile}><div style={styles.infoLabel}>CRM Tag</div><div style={styles.infoValue}>{bulkTarget.crmTag}</div></div>
                      </div>
                      <div style={{ marginTop: 16 }}>
                        <label style={styles.label}>Script for this contact</label>
                        <select value={bulkDrafts[bulkTarget.id]?.scriptId || selectedScriptId} onChange={(e) => updateBulkDraftScript(bulkTarget.id, e.target.value)} style={styles.select}>
                          {scripts.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
                        </select>
                      </div>
                      <div style={{ marginTop: 16 }}>
                        <label style={styles.label}>Edit message before opening WhatsApp</label>
                        <textarea value={bulkDrafts[bulkTarget.id]?.message || ""} onChange={(e) => updateBulkDraftMessage(bulkTarget.id, e.target.value)} style={styles.textarea} />
                      </div>
                      <div style={styles.bulkActionBar}>
                        <button onClick={markBulkSentAndNext} style={styles.darkButton}>Mark Sent + Next</button>
                        <button onClick={markBulkResponded} style={styles.secondaryAction}>Mark Responded</button>
                        <button onClick={markBulkHotSeller} style={styles.secondaryAction}>Mark Hot Seller</button>
                        <button onClick={scheduleBulkFollowUp} style={styles.secondaryAction}>Set Follow Up</button>
                        <button onClick={skipBulkAndNext} style={styles.secondaryAction}>Skip</button>
                      </div>
                    </>
                  ) : (
                    <div style={styles.emptyBox}>Select contacts in Contacts first, then open Bulk Send.</div>
                  )}
                </div>
              </section>

              <section style={styles.card}>
                <div style={styles.cardHeader}><div><h2 style={styles.cardTitle}>Selected Queue</h2><div style={styles.cardSub}>Click any contact to choose it yourself in the queue.</div></div><div style={styles.topBadge}>{bulkTargets.length} selected</div></div>
                <div style={styles.previewStack}>
                  {bulkTargets.length ? bulkTargets.map((record, index) => (
                    <button key={record.id} onClick={() => setBulkQueueIndex(index)} style={{ ...styles.previewCard, ...(bulkQueueIndex === index ? styles.leadCardActive : {}) }}>
                      <div style={styles.previewHead}><div style={styles.previewName}>{index + 1}. {fullName(record)}</div><span style={styles.tag}>{scripts.find((s) => s.id === (bulkDrafts[record.id]?.scriptId || selectedScriptId))?.name || "Script"}</span></div>
                      <div style={{ ...styles.previewMessage, marginBottom: 8 }}>{record.cell || record.phone} · {record.crmTag}</div>
                      <div style={styles.previewMessage}>{bulkDrafts[record.id]?.message || renderScript(selectedScript.content, record)}</div>
                    </button>
                  )) : <div style={styles.emptyBox}>Select contacts to build your send queue.</div>}
                </div>
              </section>
            </div>
          )}

          {view === "leads" && (
            <div style={styles.card}>
              <div style={styles.cardHeader}><div><h2 style={styles.cardTitle}>Lead Desk</h2><div style={styles.cardSub}>Quick one-by-one workbench for a single contact.</div></div></div>
              <div style={styles.bulkQueueMetaGrid}>
                <div style={styles.infoTile}><div style={styles.infoLabel}>Contact</div><div style={styles.infoValue}>{fullName(selected)}</div></div>
                <div style={styles.infoTile}><div style={styles.infoLabel}>Cell</div><div style={styles.infoValue}>{selected.cell}</div></div>
                <div style={styles.infoTile}><div style={styles.infoLabel}>Suburb</div><div style={styles.infoValue}>{selected.suburb}</div></div>
                <div style={styles.infoTile}><div style={styles.infoLabel}>CRM Tag</div><div style={styles.infoValue}>{selected.crmTag}</div></div>
              </div>
              <div style={{ marginTop: 16 }}>
                <label style={styles.label}>Script</label>
                <select value={selectedScriptId} onChange={(e) => setSelectedScriptId(e.target.value)} style={styles.select}>
                  {scripts.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
                </select>
              </div>
              <div style={{ marginTop: 16 }}>
                <label style={styles.label}>Message</label>
                <textarea value={leadMessage} readOnly style={styles.textarea} />
              </div>
              <div style={styles.bulkActionBar}>
                <button onClick={copyLeadMessage} style={styles.secondaryAction}>Copy Message</button>
                <button onClick={openLeadWhatsApp} style={styles.whatsAppAction}>Open in WhatsApp</button>
                <button onClick={() => tagLead("Messaged")} style={styles.secondaryAction}>Tag Messaged</button>
                <button onClick={() => tagLead("Responded")} style={styles.secondaryAction}>Tag Responded</button>
                <button onClick={() => tagLead("Hot Seller")} style={styles.secondaryAction}>Tag Hot Seller</button>
                <button onClick={nextLead} style={styles.darkButton}>Next Lead</button>
              </div>
              <div style={styles.bulkActionBar}>
                <button onClick={() => markLeadStatus("Waiting")} style={styles.secondaryAction}>Waiting</button>
                <button onClick={() => markLeadStatus("Interested")} style={styles.secondaryAction}>Interested</button>
                <button onClick={() => markLeadStatus("Appointment")} style={styles.secondaryAction}>Appointment</button>
                <button onClick={() => markLeadStatus("Do Not Contact")} style={styles.secondaryAction}>Do Not Contact</button>
              </div>
            </div>
          )}

          {view === "pipeline" && (
            <div style={styles.previewStack}>
              {pipeline.map((group) => (
                <div key={group.status} style={styles.previewCard}>
                  <div style={styles.previewHead}><div style={styles.previewName}>{group.status}</div><span style={styles.tag}>{group.items.length}</span></div>
                  <div style={styles.previewMessage}>{group.items.map((r) => fullName(r)).join(", ") || "No contacts"}</div>
                </div>
              ))}
            </div>
          )}

          {view === "manager" && (
            <div style={styles.twoCol}>
              <section style={styles.card}>
                <div style={styles.cardHeader}><div><h2 style={styles.cardTitle}>Response Dashboard</h2><div style={styles.cardSub}>Track tag movement across the pipeline.</div></div></div>
                <div style={styles.previewStack}>
                  {(["Unmessaged", "Messaged", "Responded", "Hot Seller", "Follow Up", "Archived"] as CrmTag[]).map((tag, idx) => {
                    const count = records.filter((r) => r.crmTag === tag).length;
                    return <MetricCard key={tag} title={tag} value={count} bg={metricBg(idx)} />;
                  })}
                </div>
              </section>
              <section style={styles.card}>
                <div style={styles.cardHeader}><div><h2 style={styles.cardTitle}>Upcoming Follow Ups</h2><div style={styles.cardSub}>Who needs another message soon.</div></div></div>
                <div style={styles.previewStack}>
                  {records.filter((r) => r.followUpDue).sort((a, b) => a.followUpDate.localeCompare(b.followUpDate)).map((r) => (
                    <div key={r.id} style={styles.previewCard}>
                      <div style={styles.previewHead}><div style={styles.previewName}>{fullName(r)}</div><span style={styles.tag}>{r.followUpDate}</span></div>
                      <div style={styles.previewMessage}>{r.suburb} · {r.crmTag} · {r.cell}</div>
                    </div>
                  ))}
                </div>
              </section>
            </div>
          )}
        </main>
      </div>
    </div>
  );
}
