import React, { useEffect, useMemo, useRef, useState } from "react";

type Status = "New" | "Waiting" | "Interested" | "Appointment" | "Do Not Contact";
type View = "dashboard" | "contacts" | "scripts" | "bulk" | "manager";
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
  suburb: string;
  status: Status;
  crmTag: CrmTag;
  followUpDue: boolean;
  followUpDate: string;
  notes: string;
};

type ScriptTemplate = {
  id: string;
  name: string;
  category: string;
  content: string;
};

type BulkDraft = {
  scriptId: string;
  message: string;
};

const CONTACTS_KEY = "stephzara_contacts_v5";
const SCRIPTS_KEY = "stephzara_scripts_v5";
const CSV_NAME_KEY = "stephzara_csv_name_v5";

const csvFields = [
  ["category", "Category"],
  ["name", "Name"],
  ["surname", "Surname"],
  ["email", "Email"],
  ["cell", "Cell"],
  ["address", "Address"],
  ["phone", "Phone"],
  ["type", "Type"],
  ["idNumber", "*ID Number"],
  ["birthDay", "BirthDay"],
  ["tags", "Tags"],
  ["source", "Source"],
  ["wishLists", "Wish Lists"],
  ["matches", "Matches"],
  ["sms", "SMS"],
  ["emails", "Emails"],
  ["whatsApp", "WhatsApp"],
  ["optIn", "Opt-In"],
  ["agents", "Agents"],
  ["loaded", "Loaded"],
  ["modified", "Modified"],
  ["lastContacted", "Last Contacted"],
] as const;

const today = () => new Date().toISOString().slice(0, 10);
const plusDays = (d: number) => {
  const x = new Date();
  x.setDate(x.getDate() + d);
  return x.toISOString().slice(0, 10);
};

const seedContacts: ContactRecord[] = [
  {
    id: "1",
    category: "Seller",
    name: "Janine",
    surname: "Smith",
    email: "janine@example.com",
    cell: "+27 82 555 0141",
    address: "12 Oak Street",
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
    loaded: today(),
    modified: today(),
    lastContacted: "",
    suburb: "Durbanville",
    status: "New",
    crmTag: "Unmessaged",
    followUpDue: true,
    followUpDate: today(),
    notes: "Fresh import",
  },
  {
    id: "2",
    category: "Seller",
    name: "Peter",
    surname: "Jacobs",
    email: "peter@example.com",
    cell: "+27 83 555 0198",
    address: "85 Marine Road",
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
    loaded: today(),
    modified: today(),
    lastContacted: today(),
    suburb: "Blouberg",
    status: "Waiting",
    crmTag: "Follow Up",
    followUpDue: true,
    followUpDate: plusDays(1),
    notes: "Follow up tomorrow",
  },
  {
    id: "3",
    category: "Seller",
    name: "Ayesha",
    surname: "Daniels",
    email: "ayesha@example.com",
    cell: "+27 81 555 0102",
    address: "44 Sandpiper Ave",
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
    loaded: today(),
    modified: today(),
    lastContacted: today(),
    suburb: "Parklands",
    status: "Interested",
    crmTag: "Responded",
    followUpDue: false,
    followUpDate: plusDays(3),
    notes: "Asked for report",
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

function safeJsonParse<T>(raw: string | null, fallback: T): T {
  if (!raw) return fallback;
  try {
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

function normalizeHeader(text: string) {
  return text.toLowerCase().replace(/[^a-z0-9]/g, "");
}

function parseCsv(text: string): string[][] {
  const rows: string[][] = [];
  let row: string[] = [];
  let cell = "";
  let inQuotes = false;
  for (let i = 0; i < text.length; i += 1) {
    const ch = text[i];
    const next = text[i + 1];
    if (ch === '"') {
      if (inQuotes && next === '"') {
        cell += '"';
        i += 1;
      } else {
        inQuotes = !inQuotes;
      }
    } else if (ch === "," && !inQuotes) {
      row.push(cell);
      cell = "";
    } else if ((ch === "\n" || ch === "\r") && !inQuotes) {
      if (ch === "\r" && next === "\n") i += 1;
      row.push(cell);
      rows.push(row);
      row = [];
      cell = "";
    } else {
      cell += ch;
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
  return /[",\n]/.test(str) ? `"${str.replace(/"/g, '""')}"` : str;
}

function downloadCsv(filename: string, rows: Record<string, unknown>[]) {
  if (!rows.length) return;
  const headers = Object.keys(rows[0]);
  const content = [headers.join(","), ...rows.map((r) => headers.map((h) => csvEscape(r[h])).join(","))].join("\n");
  const blob = new Blob([content], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}

function fullName(c: ContactRecord) {
  return `${c.name} ${c.surname}`.trim();
}

function renderScript(template: string, c: ContactRecord) {
  return template
    .replace(/\{\{full_name\}\}/g, fullName(c))
    .replace(/\{\{name\}\}/g, c.name)
    .replace(/\{\{surname\}\}/g, c.surname)
    .replace(/\{\{suburb\}\}/g, c.suburb || c.address)
    .replace(/\{\{address\}\}/g, c.address)
    .replace(/\{\{cell\}\}/g, c.cell)
    .replace(/\{\{email\}\}/g, c.email);
}

function waUrl(phoneRaw: string, message: string) {
  const phone = phoneRaw.replace(/\D/g, "");
  return `https://wa.me/${phone}?text=${encodeURIComponent(message)}`;
}

function metricBackground(i: number) {
  const palette = [
    "linear-gradient(135deg,#f8fafc,#e2e8f0)",
    "linear-gradient(135deg,#fef3c7,#fde68a)",
    "linear-gradient(135deg,#dcfce7,#a7f3d0)",
    "linear-gradient(135deg,#dbeafe,#93c5fd)",
    "linear-gradient(135deg,#ffe4e6,#fdba74)",
  ];
  return palette[i % palette.length];
}

function FocusCard({ title, value, subtitle, bg }: { title: string; value: string; subtitle: string; bg: string }) {
  return (
    <div style={{ ...styles.focusCard, background: bg }}>
      <div style={styles.focusTitleText}>{title}</div>
      <div style={styles.focusValue}>{value}</div>
      <div style={styles.focusSub}>{subtitle}</div>
    </div>
  );
}

function MetricCard({ title, value, bg }: { title: string; value: number; bg: string }) {
  return (
    <div style={{ ...styles.metricCard, background: bg }}>
      <div style={styles.metricTitle}>{title}</div>
      <div style={styles.metricValue}>{value}</div>
    </div>
  );
}

function SearchField({ label, value, onChange, placeholder }: { label: string; value: string; onChange: (v: string) => void; placeholder: string }) {
  return (
    <div>
      <label style={styles.label}>{label}</label>
      <input value={value} onChange={(e) => onChange(e.target.value)} placeholder={placeholder} style={styles.input} />
    </div>
  );
}

export default function App() {
  const [view, setView] = useState<View>("dashboard");
  const [contacts, setContacts] = useState<ContactRecord[]>(() => {
    if (typeof window === "undefined") return seedContacts;
    return safeJsonParse(localStorage.getItem(CONTACTS_KEY), seedContacts);
  });
  const [scripts, setScripts] = useState<ScriptTemplate[]>(() => {
    if (typeof window === "undefined") return defaultScripts;
    return safeJsonParse(localStorage.getItem(SCRIPTS_KEY), defaultScripts);
  });
  const [csvName, setCsvName] = useState(() => (typeof window === "undefined" ? "No file selected" : localStorage.getItem(CSV_NAME_KEY) || "No file selected"));
  const [selectedScriptId, setSelectedScriptId] = useState("s1");
  const [selectedBulk, setSelectedBulk] = useState<Record<string, boolean>>({});
  const [quickSearch, setQuickSearch] = useState("");
  const [fieldSearch, setFieldSearch] = useState<Record<string, string>>(() => Object.fromEntries(csvFields.map(([k]) => [k, ""])));
  const [selectedSuburb, setSelectedSuburb] = useState("All suburbs");
  const [selectedTag, setSelectedTag] = useState<CrmTag | "All tags">("All tags");
  const [bulkIndex, setBulkIndex] = useState(0);
  const [bulkDrafts, setBulkDrafts] = useState<Record<string, BulkDraft>>({});
  const [newScriptName, setNewScriptName] = useState("");
  const [newScriptCategory, setNewScriptCategory] = useState("Canvassing");
  const [newScriptContent, setNewScriptContent] = useState("");
  const fileRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    if (typeof window !== "undefined") localStorage.setItem(CONTACTS_KEY, JSON.stringify(contacts));
  }, [contacts]);

  useEffect(() => {
    if (typeof window !== "undefined") localStorage.setItem(SCRIPTS_KEY, JSON.stringify(scripts));
  }, [scripts]);

  useEffect(() => {
    if (typeof window !== "undefined") localStorage.setItem(CSV_NAME_KEY, csvName);
  }, [csvName]);

  const suburbOptions = useMemo(() => ["All suburbs", ...Array.from(new Set(contacts.map((c) => c.suburb || "Unknown"))).sort()], [contacts]);

  const filtered = useMemo(() => {
    return contacts.filter((c) => {
      const quickHay = [
        c.category, c.name, c.surname, c.email, c.cell, c.address, c.phone, c.type, c.idNumber, c.birthDay, c.tags,
        c.source, c.wishLists, c.matches, c.sms, c.emails, c.whatsApp, c.optIn, c.agents, c.loaded, c.modified,
        c.lastContacted, c.suburb, c.crmTag,
      ].join(" ").toLowerCase();
      if (!quickHay.includes(quickSearch.toLowerCase())) return false;
      if (selectedSuburb !== "All suburbs" && c.suburb !== selectedSuburb) return false;
      if (selectedTag !== "All tags" && c.crmTag !== selectedTag) return false;
      for (const [key] of csvFields) {
        const needle = (fieldSearch[key] || "").toLowerCase();
        if (needle && !String((c as any)[key] || "").toLowerCase().includes(needle)) return false;
      }
      return true;
    });
  }, [contacts, quickSearch, fieldSearch, selectedSuburb, selectedTag]);

  const selectedBulkContacts = filtered.filter((c) => selectedBulk[c.id]);
  const currentBulk = selectedBulkContacts[bulkIndex] || null;
  const currentDraft = currentBulk ? bulkDrafts[currentBulk.id] : undefined;

  useEffect(() => {
    if (!selectedBulkContacts.length || !scripts.length) return;
    setBulkDrafts((prev) => {
      const next = { ...prev };
      selectedBulkContacts.forEach((c, i) => {
        if (!next[c.id]) {
          const chosen = scripts[i % scripts.length];
          next[c.id] = { scriptId: chosen.id, message: renderScript(chosen.content, c) };
        }
      });
      return next;
    });
  }, [selectedBulkContacts, scripts]);

  const stats = {
    total: contacts.length,
    due: contacts.filter((c) => c.followUpDue && c.status !== "Do Not Contact").length,
    hot: contacts.filter((c) => c.crmTag === "Hot Seller").length,
    interested: contacts.filter((c) => c.status === "Interested").length,
    appointments: contacts.filter((c) => c.status === "Appointment").length,
    messaged: contacts.filter((c) => c.crmTag === "Messaged").length,
    responded: contacts.filter((c) => c.crmTag === "Responded").length,
  };

  const handleImport = async (file: File | null) => {
    if (!file) return;
    setCsvName(file.name);
    const text = await file.text();
    const rows = parseCsv(text);
    if (rows.length < 2) {
      alert("CSV file seems empty");
      return;
    }
    const headers = rows[0].map((h) => normalizeHeader(String(h || "").trim()));
    const body = rows.slice(1).filter((r) => r.some((x) => String(x || "").trim() !== ""));
    const pick = (row: string[], names: string[]) => {
      const idx = headers.findIndex((h) => names.includes(h));
      return idx >= 0 ? String(row[idx] || "").trim() : "";
    };
    const imported: ContactRecord[] = body.map((row, i) => ({
      id: `import-${Date.now()}-${i}`,
      category: pick(row, ["category"]),
      name: pick(row, ["name"]),
      surname: pick(row, ["surname"]),
      email: pick(row, ["email"]),
      cell: pick(row, ["cell", "mobile"]),
      address: pick(row, ["address"]),
      phone: pick(row, ["phone"]),
      type: pick(row, ["type"]),
      idNumber: pick(row, ["idnumber"]),
      birthDay: pick(row, ["birthday"]),
      tags: pick(row, ["tags"]),
      source: pick(row, ["source"]) || file.name,
      wishLists: pick(row, ["wishlists"]),
      matches: pick(row, ["matches"]),
      sms: pick(row, ["sms"]),
      emails: pick(row, ["emails"]),
      whatsApp: pick(row, ["whatsapp"]),
      optIn: pick(row, ["optin"]),
      agents: pick(row, ["agents"]),
      loaded: pick(row, ["loaded"]) || today(),
      modified: pick(row, ["modified"]) || today(),
      lastContacted: pick(row, ["lastcontacted"]),
      suburb: pick(row, ["suburb"]) || pick(row, ["address"]),
      status: "New",
      crmTag: "Unmessaged",
      followUpDue: true,
      followUpDate: today(),
      notes: "Imported from CSV",
    })).filter((c) => c.name || c.surname || c.cell || c.email);
    if (!imported.length) {
      alert("No usable rows found in that CSV");
      return;
    }
    setContacts((prev) => [...imported, ...prev]);
    setView("contacts");
    alert(`${imported.length} contacts imported and saved in this browser.`);
  };

  const saveScript = () => {
    if (!newScriptName.trim() || !newScriptContent.trim()) {
      alert("Add a script name and content first");
      return;
    }
    const script: ScriptTemplate = {
      id: `script-${Date.now()}`,
      name: newScriptName.trim(),
      category: newScriptCategory.trim() || "Canvassing",
      content: newScriptContent.trim(),
    };
    setScripts((prev) => [script, ...prev]);
    setSelectedScriptId(script.id);
    setNewScriptName("");
    setNewScriptCategory("Canvassing");
    setNewScriptContent("");
    alert("Script saved");
  };

  const openBulkSend = () => {
    if (!selectedBulkContacts.length) {
      alert("Select contacts first");
      return;
    }
    setBulkIndex(0);
    setView("bulk");
  };

  const updateDraftScript = (contactId: string, scriptId: string) => {
    const contact = contacts.find((c) => c.id === contactId);
    const script = scripts.find((s) => s.id === scriptId);
    if (!contact || !script) return;
    setBulkDrafts((prev) => ({ ...prev, [contactId]: { scriptId, message: renderScript(script.content, contact) } }));
  };

  const rotateScript = () => {
    if (!currentBulk || !scripts.length) return;
    const currentScriptId = currentDraft?.scriptId || scripts[0].id;
    const currentIdx = scripts.findIndex((s) => s.id === currentScriptId);
    const nextScript = scripts[(currentIdx + 1) % scripts.length];
    updateDraftScript(currentBulk.id, nextScript.id);
  };

  const updateDraftMessage = (contactId: string, message: string) => {
    setBulkDrafts((prev) => ({
      ...prev,
      [contactId]: {
        scriptId: prev[contactId]?.scriptId || selectedScriptId,
        message,
      },
    }));
  };

  const openCurrentInWhatsApp = () => {
    if (!currentBulk) return;
    const msg = currentDraft?.message || renderScript((scripts.find((s) => s.id === selectedScriptId) || scripts[0]).content, currentBulk);
    window.open(waUrl(currentBulk.cell || currentBulk.phone, msg), "_blank");
  };

  const copyCurrentMessage = async () => {
    if (!currentBulk) return;
    const msg = currentDraft?.message || "";
    try {
      await navigator.clipboard.writeText(msg);
      alert("Message copied");
    } catch {
      alert("Could not copy message");
    }
  };

  const updateContact = (contactId: string, patch: Partial<ContactRecord>) => {
    setContacts((prev) => prev.map((c) => (c.id === contactId ? { ...c, ...patch, modified: today() } : c)));
  };

  const markSentAndNext = () => {
    if (!currentBulk) return;
    updateContact(currentBulk.id, {
      crmTag: "Messaged",
      followUpDue: true,
      followUpDate: plusDays(3),
      lastContacted: today(),
    });
    if (bulkIndex < selectedBulkContacts.length - 1) setBulkIndex((x) => x + 1);
    else alert("Queue complete");
  };

  const markResponded = () => {
    if (!currentBulk) return;
    updateContact(currentBulk.id, { crmTag: "Responded", status: "Interested" });
  };

  const markHotSeller = () => {
    if (!currentBulk) return;
    updateContact(currentBulk.id, { crmTag: "Hot Seller", status: "Appointment" });
  };

  const setFollowUp = () => {
    if (!currentBulk) return;
    updateContact(currentBulk.id, { crmTag: "Follow Up", followUpDue: true, followUpDate: plusDays(2) });
    alert("Follow-up set");
  };

  const exportRegister = () => {
    downloadCsv(
      "propcon_register.csv",
      contacts.map((c) => ({
        Category: c.category,
        Name: c.name,
        Surname: c.surname,
        Email: c.email,
        Cell: c.cell,
        Address: c.address,
        Phone: c.phone,
        Type: c.type,
        "*ID Number": c.idNumber,
        BirthDay: c.birthDay,
        Tags: c.tags,
        Source: c.source,
        "Wish Lists": c.wishLists,
        Matches: c.matches,
        SMS: c.sms,
        Emails: c.emails,
        WhatsApp: c.whatsApp,
        "Opt-In": c.optIn,
        Agents: c.agents,
        Loaded: c.loaded,
        Modified: c.modified,
        "Last Contacted": c.lastContacted,
        Suburb: c.suburb,
        CRMTag: c.crmTag,
        FollowUpDate: c.followUpDate,
      }))
    );
  };

  const exportBulk = () => {
    const rows = selectedBulkContacts.map((c) => ({
      Name: c.name,
      Surname: c.surname,
      Cell: c.cell,
      Suburb: c.suburb,
      Script: scripts.find((s) => s.id === (bulkDrafts[c.id]?.scriptId || selectedScriptId))?.name || "",
      Message: bulkDrafts[c.id]?.message || "",
    }));
    if (!rows.length) {
      alert("No selected contacts");
      return;
    }
    downloadCsv("propcon_bulk_export.csv", rows);
  };

  const openFollowUps = () => {
    setSelectedTag("Follow Up");
    setView("contacts");
  };

  return (
    <div style={styles.page}>
      <input ref={fileRef} type="file" accept=".csv,text/csv" style={{ display: "none" }} onChange={(e) => void handleImport(e.target.files?.[0] || null)} />
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
           {[
  ["dashboard", "🏠", "Dashboard"],
  ["contacts", "📒", "Contacts"],
  ["scripts", "📝", "Scripts"],
  ["bulk", "📤", "Bulk Send"],
  ["manager", "📅", "Manager"],
].map(([key, emoji, label]) => (
  <button
    key={String(key)}
    onClick={() => setView(key as View)}
    style={{ ...styles.sidebarButton, ...(view === key ? styles.sidebarButtonActive : {}) }}
  >
    <span>{emoji}</span>
    <span>{label}</span>
  </button>
))}
              <button key={v.key} onClick={() => setView(v.key)} style={{ ...styles.sidebarButton, ...(view === v.key ? styles.sidebarButtonActive : {}) }}>
                <span>{v.emoji}</span>
                <span>{v.label}</span>
              </button>
            ))}
          </div>
          <div style={{ padding: 16 }}>
            <div style={styles.focusCardDark}>
              <div style={styles.focusMiniTitle}>Today</div>
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
                <div style={styles.heroTag}>✨ Stable next-level version</div>
                <h1 style={styles.heroTitle}>Lead Management Dashboard</h1>
                <p style={styles.heroText}>CSV import, saved contacts, saved scripts, suburb grouping, CRM tags, follow-up dates, and a one-by-one editable WhatsApp queue.</p>
              </div>
              <div style={styles.heroButtons}>
                <button onClick={() => fileRef.current?.click()} style={styles.whiteButton}>📤 Import CSV</button>
                <button onClick={exportRegister} style={styles.ghostButton}>📥 Export Register</button>
              </div>
            </div>
            <div style={styles.metricsGrid}>
              {[
                ["Contacts", stats.total],
                ["Messaged", stats.messaged],
                ["Responded", stats.responded],
                ["Hot Sellers", stats.hot],
                ["Due Today", stats.due],
              ].map(([label, value], i) => <MetricCard key={String(label)} title={String(label)} value={Number(value)} bg={metricBackground(i)} />)}
            </div>
          </section>

          {view === "dashboard" && (
            <div style={styles.twoCol}>
              <section style={styles.card}>
                <div style={styles.sectionTitle}>Overview</div>
                <div style={styles.focusGrid}>
                  <FocusCard title="Contacts" value={String(stats.total)} subtitle="Loaded in CRM" bg="linear-gradient(135deg,#eff6ff,#dbeafe)" />
                  <FocusCard title="Messaged" value={String(stats.messaged)} subtitle="Already contacted" bg="linear-gradient(135deg,#ecfeff,#cffafe)" />
                  <FocusCard title="Responded" value={String(stats.responded)} subtitle="Engaged owners" bg="linear-gradient(135deg,#ecfdf5,#bbf7d0)" />
                  <FocusCard title="Hot Sellers" value={String(stats.hot)} subtitle="Priority leads" bg="linear-gradient(135deg,#fff1f2,#fecdd3)" />
                </div>
              </section>
              <section style={styles.card}>
                <div style={styles.sectionTitle}>Suburb Groups</div>
                <div style={styles.previewStack}>
                  {suburbOptions.filter((s) => s !== "All suburbs").map((s) => {
                    const count = contacts.filter((c) => c.suburb === s).length;
                    return (
                      <button key={s} onClick={() => { setSelectedSuburb(s); setView("contacts"); }} style={styles.previewCard}>
                        <div style={styles.previewHead}><div style={styles.previewName}>{s}</div><span style={styles.tag}>{count}</span></div>
                        <div style={styles.previewMessage}>Open this area in Contacts</div>
                      </button>
                    );
                  })}
                </div>
              </section>
            </div>
          )}

          {view === "contacts" && (
            <section style={styles.card}>
              <div style={styles.cardHeader}>
                <div>
                  <div style={styles.sectionTitle}>Contacts</div>
                  <div style={styles.sectionSub}>Search by CSV headings, suburb, and CRM tag. Current file: {csvName}</div>
                </div>
                <div style={styles.topBadge}>{filtered.length} results</div>
              </div>

              <div style={styles.filtersRow}>
                <select value={selectedSuburb} onChange={(e) => setSelectedSuburb(e.target.value)} style={styles.select}>
                  {suburbOptions.map((s) => <option key={s}>{s}</option>)}
                </select>
                <select value={selectedTag} onChange={(e) => setSelectedTag(e.target.value as CrmTag | "All tags")} style={styles.select}>
                  {["All tags", "Unmessaged", "Messaged", "Responded", "Hot Seller", "Follow Up", "Archived"].map((t) => <option key={t}>{t}</option>)}
                </select>
                <button onClick={() => { const all: Record<string, boolean> = {}; filtered.forEach((c) => { all[c.id] = true; }); setSelectedBulk(all); }} style={styles.secondaryButton}>Select All Results</button>
                <button onClick={() => setSelectedBulk({})} style={styles.secondaryButton}>Clear Selection</button>
                <button onClick={openBulkSend} style={styles.primaryButton}>Open Bulk Send</button>
              </div>

              <div style={styles.searchGrid}>
                <SearchField label="Quick Search" value={quickSearch} onChange={setQuickSearch} placeholder="Search all fields" />
                {csvFields.map(([key, label]) => (
                  <SearchField key={key} label={label} value={fieldSearch[key] || ""} onChange={(v) => setFieldSearch((p) => ({ ...p, [key]: v }))} placeholder={label} />
                ))}
              </div>

              <div style={styles.tableWrap}>
                <table style={styles.table}>
                  <thead>
                    <tr>
                      <th style={styles.th}></th>
                      <th style={styles.th}>CRM Tag</th>
                      <th style={styles.th}>Suburb</th>
                      {csvFields.map(([key, label]) => <th key={key} style={styles.th}>{label}</th>)}
                    </tr>
                  </thead>
                  <tbody>
                    {filtered.map((c) => (
                      <tr key={c.id}>
                        <td style={styles.td}><input type="checkbox" checked={!!selectedBulk[c.id]} onChange={() => setSelectedBulk((p) => ({ ...p, [c.id]: !p[c.id] }))} /></td>
                        <td style={styles.td}>{c.crmTag}</td>
                        <td style={styles.td}>{c.suburb}</td>
                        {csvFields.map(([key]) => <td key={key} style={styles.td}>{String((c as any)[key] || "")}</td>)}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </section>
          )}

          {view === "scripts" && (
            <div style={styles.twoCol}>
              <section style={styles.card}>
                <div style={styles.sectionTitle}>Saved Scripts</div>
                <div style={styles.previewStack}>
                  {scripts.map((s) => (
                    <button key={s.id} onClick={() => setSelectedScriptId(s.id)} style={{ ...styles.previewCard, ...(selectedScriptId === s.id ? styles.selectedCard : {}) }}>
                      <div style={styles.previewHead}><div style={styles.previewName}>{s.name}</div><span style={styles.tag}>{s.category}</span></div>
                      <div style={styles.previewMessage}>{s.content}</div>
                    </button>
                  ))}
                </div>
              </section>
              <section style={styles.card}>
                <div style={styles.sectionTitle}>Create Script</div>
                <div style={{ marginBottom: 14 }}>
                  <label style={styles.label}>Script Name</label>
                  <input value={newScriptName} onChange={(e) => setNewScriptName(e.target.value)} style={styles.input} />
                </div>
                <div style={{ marginBottom: 14 }}>
                  <label style={styles.label}>Category</label>
                  <input value={newScriptCategory} onChange={(e) => setNewScriptCategory(e.target.value)} style={styles.input} />
                </div>
                <div style={{ marginBottom: 14 }}>
                  <label style={styles.label}>Content</label>
                  <textarea value={newScriptContent} onChange={(e) => setNewScriptContent(e.target.value)} style={styles.textarea} />
                </div>
                <div style={styles.filtersRow}>
                  <button onClick={saveScript} style={styles.primaryButton}>Save Script</button>
                  <button onClick={() => { setNewScriptName(""); setNewScriptCategory("Canvassing"); setNewScriptContent(""); }} style={styles.secondaryButton}>Clear</button>
                </div>
              </section>
            </div>
          )}

          {view === "bulk" && (
            <div style={styles.twoCol}>
              <section style={styles.card}>
                <div style={styles.cardHeader}>
                  <div>
                    <div style={styles.sectionTitle}>Bulk WhatsApp Queue</div>
                    <div style={styles.sectionSub}>Review and send one contact at a time.</div>
                  </div>
                  <button onClick={exportBulk} style={styles.primaryButton}>Export Bulk CSV</button>
                </div>

                <div style={styles.filtersRow}>
                  <button onClick={() => setBulkIndex((x) => Math.max(0, x - 1))} style={styles.secondaryButton}>Previous</button>
                  <button onClick={() => setBulkIndex((x) => Math.min(selectedBulkContacts.length - 1, x + 1))} style={styles.secondaryButton}>Next</button>
                  <button onClick={rotateScript} style={styles.secondaryButton}>Rotate Script</button>
                  <button onClick={openCurrentInWhatsApp} style={styles.primaryButton}>Open in WhatsApp</button>
                  <button onClick={copyCurrentMessage} style={styles.secondaryButton}>Copy Message</button>
                </div>

                {currentBulk ? (
                  <div style={styles.queueBox}>
                    <div style={styles.previewHead}><div style={styles.previewName}>Queue Item {bulkIndex + 1} / {selectedBulkContacts.length}</div><span style={styles.tag}>{fullName(currentBulk)}</span></div>
                    <div style={styles.metaGrid}>
                      <MiniStat label="Cell" value={currentBulk.cell || currentBulk.phone} />
                      <MiniStat label="Suburb" value={currentBulk.suburb} />
                      <MiniStat label="CRM Tag" value={currentBulk.crmTag} />
                      <MiniStat label="Agent" value={currentBulk.agents} />
                    </div>
                    <div style={{ marginTop: 14 }}>
                      <label style={styles.label}>Script for this contact</label>
                      <select value={currentDraft?.scriptId || selectedScriptId} onChange={(e) => updateDraftScript(currentBulk.id, e.target.value)} style={styles.select}>
                        {scripts.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
                      </select>
                    </div>
                    <div style={{ marginTop: 14 }}>
                      <label style={styles.label}>Edit message before opening WhatsApp</label>
                      <textarea value={currentDraft?.message || ""} onChange={(e) => updateDraftMessage(currentBulk.id, e.target.value)} style={styles.textarea} />
                    </div>
                    <div style={styles.filtersRow}>
                      <button onClick={markSentAndNext} style={styles.primaryButton}>Mark Sent + Next</button>
                      <button onClick={markResponded} style={styles.secondaryButton}>Mark Responded</button>
                      <button onClick={markHotSeller} style={styles.secondaryButton}>Mark Hot Seller</button>
                      <button onClick={setFollowUp} style={styles.secondaryButton}>Set Follow Up</button>
                    </div>
                  </div>
                ) : (
                  <div style={styles.emptyBox}>Select contacts in Contacts first.</div>
                )}
              </section>

              <section style={styles.card}>
                <div style={styles.cardHeader}>
                  <div>
                    <div style={styles.sectionTitle}>Selected Queue</div>
                    <div style={styles.sectionSub}>Click any contact to choose it yourself.</div>
                  </div>
                  <div style={styles.topBadge}>{selectedBulkContacts.length} selected</div>
                </div>
                <div style={styles.previewStack}>
                  {selectedBulkContacts.length ? selectedBulkContacts.map((c, idx) => (
                    <button key={c.id} onClick={() => setBulkIndex(idx)} style={{ ...styles.previewCard, ...(idx === bulkIndex ? styles.selectedCard : {}) }}>
                      <div style={styles.previewHead}><div style={styles.previewName}>{idx + 1}. {fullName(c)}</div><span style={styles.tag}>{scripts.find((s) => s.id === (bulkDrafts[c.id]?.scriptId || selectedScriptId))?.name || "Script"}</span></div>
                      <div style={{ ...styles.previewMessage, marginBottom: 6 }}>{c.cell || c.phone} · {c.crmTag}</div>
                      <div style={styles.previewMessage}>{bulkDrafts[c.id]?.message || ""}</div>
                    </button>
                  )) : <div style={styles.emptyBox}>No queue yet.</div>}
                </div>
              </section>
            </div>
          )}

          {view === "manager" && (
            <div style={styles.twoCol}>
              <section style={styles.card}>
                <div style={styles.sectionTitle}>Response Dashboard</div>
                <div style={styles.focusGrid}>
                  {(["Unmessaged", "Messaged", "Responded", "Hot Seller", "Follow Up", "Archived"] as CrmTag[]).map((tag, i) => (
                    <MetricCard key={tag} title={tag} value={contacts.filter((c) => c.crmTag === tag).length} bg={metricBackground(i)} />
                  ))}
                </div>
              </section>
              <section style={styles.card}>
                <div style={styles.sectionTitle}>Upcoming Follow Ups</div>
                <div style={styles.previewStack}>
                  {contacts.filter((c) => c.followUpDue).sort((a, b) => a.followUpDate.localeCompare(b.followUpDate)).map((c) => (
                    <div key={c.id} style={styles.previewCard}>
                      <div style={styles.previewHead}><div style={styles.previewName}>{fullName(c)}</div><span style={styles.tag}>{c.followUpDate}</span></div>
                      <div style={styles.previewMessage}>{c.suburb} · {c.crmTag} · {c.cell}</div>
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

function MiniStat({ label, value }: { label: string; value: string }) {
  return (
    <div style={styles.miniStat}>
      <div style={styles.miniLabel}>{label}</div>
      <div style={styles.miniValue}>{value}</div>
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  page: { minHeight: "100vh", background: "linear-gradient(135deg,#eaf3ff 0%,#f7fbff 35%,#f8fafc 100%)", color: "#0f172a", fontFamily: 'Inter, system-ui, -apple-system, Segoe UI, sans-serif' },
  layout: { display: "grid", minHeight: "100vh", gridTemplateColumns: "280px 1fr" },
  sidebar: { background: "#0b1730", color: "white" },
  sidebarHeader: { padding: 24, display: "flex", gap: 16, alignItems: "center", borderBottom: "1px solid rgba(255,255,255,0.1)" },
  logoBox: { width: 56, height: 56, borderRadius: 18, display: "flex", alignItems: "center", justifyContent: "center", background: "linear-gradient(135deg,#22d3ee,#2563eb)", fontSize: 26 },
  brand: { fontSize: 22, fontWeight: 700 },
  brandSub: { fontSize: 12, color: "rgba(207,250,254,0.8)" },
  sidebarLabel: { marginBottom: 12, paddingLeft: 12, fontSize: 11, letterSpacing: "0.24em", textTransform: "uppercase", color: "rgba(207,250,254,0.6)" },
  sidebarButton: { width: "100%", display: "flex", gap: 12, alignItems: "center", border: "none", background: "transparent", color: "#e2e8f0", padding: "14px 16px", borderRadius: 18, textAlign: "left", cursor: "pointer", marginBottom: 8 },
  sidebarButtonActive: { background: "white", color: "#0f172a" },
  focusCardDark: { borderRadius: 24, padding: 16, background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)" },
  focusMiniTitle: { marginBottom: 12, fontWeight: 700 },
  darkRow: { display: "flex", justifyContent: "space-between", marginBottom: 10, padding: "10px 12px", borderRadius: 14, background: "rgba(255,255,255,0.05)" },
  main: { padding: 28 },
  hero: { borderRadius: 34, overflow: "hidden", background: "white", border: "1px solid #e2e8f0", boxShadow: "0 20px 60px rgba(15,23,42,0.08)", marginBottom: 24 },
  heroTop: { padding: 32, background: "linear-gradient(120deg,#0f172a 0%,#1d4ed8 45%,#06b6d4 100%)", color: "white", display: "flex", justifyContent: "space-between", gap: 20, flexWrap: "wrap", alignItems: "center" },
  heroTag: { display: "inline-block", padding: "6px 12px", borderRadius: 999, background: "rgba(255,255,255,0.15)", marginBottom: 10, fontSize: 12, fontWeight: 700 },
  heroTitle: { margin: 0, fontSize: 42, lineHeight: 1.05 },
  heroText: { marginTop: 10, maxWidth: 760, color: "#cffafe" },
  heroButtons: { display: "flex", gap: 10, flexWrap: "wrap" },
  whiteButton: { border: "none", borderRadius: 18, padding: "14px 16px", background: "white", color: "#0f172a", fontWeight: 700, cursor: "pointer" },
  ghostButton: { border: "none", borderRadius: 18, padding: "14px 16px", background: "rgba(255,255,255,0.15)", color: "white", fontWeight: 700, cursor: "pointer" },
  metricsGrid: { display: "grid", gridTemplateColumns: "repeat(5, minmax(0, 1fr))", gap: 16, padding: 24 },
  metricCard: { borderRadius: 24, padding: 18, border: "1px solid #e2e8f0" },
  metricTitle: { fontSize: 13, fontWeight: 700, opacity: 0.8 },
  metricValue: { marginTop: 10, fontSize: 32, fontWeight: 800 },
  twoCol: { display: "grid", gridTemplateColumns: "1fr 1fr", gap: 24 },
  card: { background: "white", border: "1px solid #e2e8f0", borderRadius: 28, padding: 22, boxShadow: "0 8px 20px rgba(15,23,42,0.05)" },
  cardHeader: { display: "flex", justifyContent: "space-between", alignItems: "center", gap: 16, marginBottom: 16 },
  sectionTitle: { fontSize: 24, fontWeight: 800 },
  sectionSub: { marginTop: 4, color: "#64748b", fontSize: 14 },
  topBadge: { background: "#eff6ff", color: "#1d4ed8", padding: "8px 12px", borderRadius: 999, fontWeight: 700, fontSize: 12 },
  focusGrid: { display: "grid", gridTemplateColumns: "repeat(2, minmax(0, 1fr))", gap: 16 },
  focusCard: { borderRadius: 24, padding: 18, border: "1px solid #e2e8f0" },
  focusTitleText: { fontSize: 14, fontWeight: 700, color: "#475569" },
  focusValue: { marginTop: 8, fontSize: 28, fontWeight: 800 },
  focusSub: { marginTop: 6, fontSize: 12, color: "#64748b" },
  filtersRow: { display: "flex", gap: 12, flexWrap: "wrap", marginBottom: 16 },
  searchGrid: { display: "grid", gridTemplateColumns: "repeat(6, minmax(180px, 1fr))", gap: 12, marginBottom: 18 },
  label: { display: "block", marginBottom: 8, fontSize: 11, fontWeight: 800, letterSpacing: "0.16em", textTransform: "uppercase", color: "#64748b" },
  input: { width: "100%", boxSizing: "border-box", borderRadius: 16, border: "1px solid #dbe2ea", background: "white", padding: "14px 14px", outline: "none" },
  select: { minWidth: 180, borderRadius: 16, border: "1px solid #dbe2ea", background: "white", padding: "14px 14px", outline: "none" },
  textarea: { width: "100%", minHeight: 180, boxSizing: "border-box", borderRadius: 16, border: "1px solid #dbe2ea", background: "white", padding: 14, outline: "none", resize: "vertical" },
  primaryButton: { border: "none", borderRadius: 16, background: "#0f172a", color: "white", padding: "12px 16px", fontWeight: 700, cursor: "pointer" },
  secondaryButton: { border: "1px solid #dbe2ea", borderRadius: 16, background: "white", color: "#0f172a", padding: "12px 16px", fontWeight: 700, cursor: "pointer" },
  tableWrap: { overflow: "auto", borderRadius: 24, border: "1px solid #e2e8f0" },
  table: { width: "100%", borderCollapse: "collapse" },
  th: { textAlign: "left", padding: "14px 16px", background: "#f8fafc", color: "#475569", fontWeight: 700, whiteSpace: "nowrap" },
  td: { padding: "14px 16px", borderTop: "1px solid #e2e8f0", whiteSpace: "nowrap" },
  previewStack: { display: "grid", gap: 12 },
  previewCard: { border: "1px solid #e2e8f0", background: "linear-gradient(135deg,#ffffff,#f8fafc)", borderRadius: 18, padding: 16, textAlign: "left", cursor: "pointer" },
  selectedCard: { border: "1px solid #93c5fd", background: "linear-gradient(135deg,#eff6ff,#ffffff)" },
  previewHead: { display: "flex", justifyContent: "space-between", gap: 12, alignItems: "center", marginBottom: 8 },
  previewName: { fontWeight: 800 },
  previewMessage: { fontSize: 12, color: "#475569", lineHeight: 1.5, whiteSpace: "pre-wrap" },
  tag: { borderRadius: 999, border: "1px solid #e2e8f0", background: "white", padding: "6px 10px", fontSize: 12, fontWeight: 700, color: "#475569" },
  queueBox: { borderRadius: 20, border: "1px solid #e2e8f0", background: "linear-gradient(135deg,#ffffff,#f0fdf4)", padding: 16 },
  metaGrid: { display: "grid", gridTemplateColumns: "repeat(2, minmax(0, 1fr))", gap: 10 },
  miniStat: { borderRadius: 16, border: "1px solid #e2e8f0", background: "white", padding: 12 },
  miniLabel: { fontSize: 11, fontWeight: 800, color: "#64748b", textTransform: "uppercase" },
  miniValue: { marginTop: 6, fontSize: 14, fontWeight: 700 },
};
