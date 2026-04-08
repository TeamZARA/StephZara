import React, { useEffect, useMemo, useRef, useState } from "react";

type View = "dashboard" | "contacts" | "scripts" | "bulk" | "manager" | "birthdays";
type CrmTag = "Unmessaged" | "Messaged" | "Responded" | "Hot Seller" | "Follow Up" | "Archived";

type Contact = {
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
  crmTag: CrmTag;
  followUpDue: boolean;
  followUpDate: string;
  notes: string;
};

type ScriptItem = {
  id: string;
  name: string;
  category: string;
  content: string;
};

type BulkDraft = {
  scriptId: string;
  message: string;
};

const CONTACTS_KEY = "stephzara_contacts_safe_v1";
const SCRIPTS_KEY = "stephzara_scripts_safe_v1";
const CSV_NAME_KEY = "stephzara_csv_name_safe_v1";

const today = () => new Date().toISOString().slice(0, 10);
const addDays = (days: number) => {
  const d = new Date();
  d.setDate(d.getDate() + days);
  return d.toISOString().slice(0, 10);
};

const FIELD_DEFS = [
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

const DEFAULT_CONTACTS: Contact[] = [
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
    crmTag: "Follow Up",
    followUpDue: true,
    followUpDate: addDays(1),
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
    crmTag: "Responded",
    followUpDue: false,
    followUpDate: addDays(3),
    notes: "Asked for report",
  },
];

const DEFAULT_SCRIPTS: ScriptItem[] = [
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

const DEFAULT_BIRTHDAY_SCRIPTS: ScriptItem[] = [
  { id: "b1", name: "Birthday Message 1", category: "Birthday", content: "Happy Birthday {{name}}. Wishing you a wonderful day filled with joy, good health, and special moments. Have a fantastic celebration." },
  { id: "b2", name: "Birthday Message 2", category: "Birthday", content: "Hi {{name}}, happy birthday to you. Wishing you a really special day and a year ahead filled with happiness, peace, and success." },
  { id: "b3", name: "Birthday Message 3", category: "Birthday", content: "Happy Birthday {{name}}. Hope your day is full of laughter, love, and everything that makes you happiest. Enjoy every moment." },
  { id: "b4", name: "Birthday Message 4", category: "Birthday", content: "Hi {{name}}, wishing you a very happy birthday and a beautiful year ahead. May today be full of blessings, joy, and celebration." },
  { id: "b5", name: "Birthday Message 5", category: "Birthday", content: "Happy Birthday {{name}}. I hope today brings you lots of happiness, good memories, and time with the people who matter most." },
  { id: "b6", name: "Birthday Message 6", category: "Birthday", content: "Hi {{name}}, just a warm birthday wish to say I hope you have a lovely day and an amazing year ahead. Happy Birthday." },
  { id: "b7", name: "Birthday Message 7", category: "Birthday", content: "Happy Birthday {{name}}. May your day be bright, peaceful, and full of all the little things that make life beautiful." },
  { id: "b8", name: "Birthday Message 8", category: "Birthday", content: "Hi {{name}}, many happy returns on your birthday. Wishing you good health, happiness, and plenty of reasons to smile today." },
  { id: "b9", name: "Birthday Message 9", category: "Birthday", content: "Happy Birthday {{name}}. Hope this year brings you exciting opportunities, great memories, and lots of happiness." },
  { id: "b10", name: "Birthday Message 10", category: "Birthday", content: "Hi {{name}}, wishing you a truly wonderful birthday and a year ahead filled with joy, peace, and success. Enjoy your special day." },
];

function safeParse<T>(raw: string | null, fallback: T): T {
  if (!raw) return fallback;
  try {
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

function normalizeHeader(s: string): string {
  return s.toLowerCase().replace(/[^a-z0-9]/g, "");
}

function fullName(c: Contact): string {
  return `${c.name} ${c.surname}`.trim();
}

function renderTemplate(template: string, c: Contact): string {
  return template
    .replace(/\{\{full_name\}\}/g, fullName(c))
    .replace(/\{\{name\}\}/g, c.name)
    .replace(/\{\{surname\}\}/g, c.surname)
    .replace(/\{\{suburb\}\}/g, c.suburb || c.address)
    .replace(/\{\{address\}\}/g, c.address)
    .replace(/\{\{cell\}\}/g, c.cell)
    .replace(/\{\{email\}\}/g, c.email);
}

function whatsappUrl(phoneRaw: string, message: string): string {
  const phone = phoneRaw.replace(/\D/g, "");
  return `https://wa.me/${phone}?text=${encodeURIComponent(message)}`;
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

function downloadCsv(filename: string, rows: Record<string, unknown>[]) {
  if (!rows.length) return;
  const headers = Object.keys(rows[0]);
  const csv = [headers.join(","), ...rows.map((row) => headers.map((h) => csvEscape(row[h])).join(","))].join("\n");
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}

function csvEscape(value: unknown): string {
  const s = String(value ?? "");
  return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
}

function isBirthdayToday(birthDay: string): boolean {
  if (!birthDay) return false;
  const now = new Date();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const day = String(now.getDate()).padStart(2, "0");
  const normalized = birthDay.trim();
  if (/^\d{4}-\d{2}-\d{2}$/.test(normalized)) return normalized.slice(5) === `${month}-${day}`;
  if (/^\d{2}-\d{2}$/.test(normalized)) return normalized === `${month}-${day}`;
  return false;
}

function MiniStat({ label, value }: { label: string; value: string }) {
  return (
    <div style={styles.miniStat}>
      <div style={styles.miniLabel}>{label}</div>
      <div style={styles.miniValue}>{value}</div>
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

function metricBackground(i: number): string {
  const palette = [
    "linear-gradient(135deg,#f8fafc,#e2e8f0)",
    "linear-gradient(135deg,#fef3c7,#fde68a)",
    "linear-gradient(135deg,#dcfce7,#a7f3d0)",
    "linear-gradient(135deg,#dbeafe,#93c5fd)",
    "linear-gradient(135deg,#ffe4e6,#fdba74)",
  ];
  return palette[i % palette.length];
}

export default function App() {
  const [view, setView] = useState<View>("dashboard");
  const [contacts, setContacts] = useState<Contact[]>(() => {
    if (typeof window === "undefined") return DEFAULT_CONTACTS;
    return safeParse<Contact[]>(localStorage.getItem(CONTACTS_KEY), DEFAULT_CONTACTS);
  });
  const [scripts, setScripts] = useState<ScriptItem[]>(() => {
    if (typeof window === "undefined") return DEFAULT_SCRIPTS;
    return safeParse<ScriptItem[]>(localStorage.getItem(SCRIPTS_KEY), DEFAULT_SCRIPTS);
  });
  const [csvName, setCsvName] = useState<string>(() => {
    if (typeof window === "undefined") return "No file selected";
    return localStorage.getItem(CSV_NAME_KEY) || "No file selected";
  });
  const [selectedScriptId, setSelectedScriptId] = useState<string>("s1");
  const [selectedBulk, setSelectedBulk] = useState<Record<string, boolean>>({});
  const [quickSearch, setQuickSearch] = useState<string>("");
  const [fieldSearch, setFieldSearch] = useState<Record<string, string>>(() => Object.fromEntries(FIELD_DEFS.map(([k]) => [k, ""])));
  const [selectedSuburb, setSelectedSuburb] = useState<string>("All suburbs");
  const [selectedTag, setSelectedTag] = useState<CrmTag | "All tags">("All tags");
  const [bulkIndex, setBulkIndex] = useState<number>(0);
  const [bulkDrafts, setBulkDrafts] = useState<Record<string, BulkDraft>>({});
  const [newScriptName, setNewScriptName] = useState<string>("");
  const [newScriptCategory, setNewScriptCategory] = useState<string>("Canvassing");
  const [newScriptContent, setNewScriptContent] = useState<string>("");
  const [editingScriptId, setEditingScriptId] = useState<string | null>(null);
  const [editingContactId, setEditingContactId] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    if (typeof window !== "undefined") {
      localStorage.setItem(CONTACTS_KEY, JSON.stringify(contacts));
    }
  }, [contacts]);

  useEffect(() => {
    if (typeof window !== "undefined") {
      localStorage.setItem(SCRIPTS_KEY, JSON.stringify(scripts));
    }
  }, [scripts]);

  useEffect(() => {
    if (typeof window !== "undefined") {
      localStorage.setItem(CSV_NAME_KEY, csvName);
    }
  }, [csvName]);

  const suburbOptions = useMemo(() => {
    return ["All suburbs", ...Array.from(new Set(contacts.map((c) => c.suburb || "Unknown"))).sort()];
  }, [contacts]);

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

      for (const [key] of FIELD_DEFS) {
        const needle = (fieldSearch[key] || "").toLowerCase();
        if (needle && !String((c as any)[key] || "").toLowerCase().includes(needle)) return false;
      }
      return true;
    });
  }, [contacts, quickSearch, selectedSuburb, selectedTag, fieldSearch]);

  const birthdayContacts = useMemo(() => contacts.filter((c) => isBirthdayToday(c.birthDay)), [contacts]);
  const birthdayBulkContacts = birthdayContacts;
  const birthdayCurrent = birthdayBulkContacts[bulkIndex] || null;
  const isBirthdayView = view === "birthdays";
  const activeBulkContacts = isBirthdayView ? birthdayBulkContacts : filtered.filter((c) => selectedBulk[c.id]);
  const currentBulk = isBirthdayView ? birthdayCurrent : activeBulkContacts[bulkIndex] || null;
  const currentDraft = currentBulk ? bulkDrafts[currentBulk.id] : undefined;

  useEffect(() => {
    if (!activeBulkContacts.length) return;
    const rotationSource = isBirthdayView ? DEFAULT_BIRTHDAY_SCRIPTS : scripts;
    if (!rotationSource.length) return;
    setBulkDrafts((prev) => {
      const next = { ...prev };
      activeBulkContacts.forEach((c, i) => {
        if (!next[c.id]) {
          const script = rotationSource[i % rotationSource.length];
          next[c.id] = {
            scriptId: script.id,
            message: renderTemplate(script.content, c),
          };
        }
      });
      return next;
    });
  }, [activeBulkContacts, scripts, isBirthdayView]);

  const stats = {
    total: contacts.length,
    messaged: contacts.filter((c) => c.crmTag === "Messaged").length,
    responded: contacts.filter((c) => c.crmTag === "Responded").length,
    hot: contacts.filter((c) => c.crmTag === "Hot Seller").length,
    due: contacts.filter((c) => c.followUpDue).length,
    birthdays: birthdayContacts.length,
  };

  const importCsv = async (file: File | null) => {
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

    const imported: Contact[] = body.map((row, i) => ({
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

    if (editingScriptId) {
      setScripts((prev) => prev.map((s) => (s.id === editingScriptId ? { ...s, name: newScriptName.trim(), category: newScriptCategory.trim() || "Canvassing", content: newScriptContent.trim() } : s)));
      alert("Script updated");
    } else {
      const item: ScriptItem = {
        id: `script-${Date.now()}`,
        name: newScriptName.trim(),
        category: newScriptCategory.trim() || "Canvassing",
        content: newScriptContent.trim(),
      };
      setScripts((prev) => [item, ...prev]);
      setSelectedScriptId(item.id);
      alert("Script saved");
    }

    setEditingScriptId(null);
    setNewScriptName("");
    setNewScriptCategory("Canvassing");
    setNewScriptContent("");
  };

  const beginEditScript = (scriptId: string) => {
    const script = scripts.find((s) => s.id === scriptId);
    if (!script) return;
    setEditingScriptId(scriptId);
    setNewScriptName(script.name);
    setNewScriptCategory(script.category);
    setNewScriptContent(script.content);
  };

  const deleteScript = (scriptId: string) => {
    const next = scripts.filter((s) => s.id !== scriptId);
    if (!next.length) {
      alert("You need at least one normal script.");
      return;
    }
    setScripts(next);
    if (selectedScriptId === scriptId) setSelectedScriptId(next[0].id);
    if (editingScriptId === scriptId) {
      setEditingScriptId(null);
      setNewScriptName("");
      setNewScriptCategory("Canvassing");
      setNewScriptContent("");
    }
  };

  const openBulkSend = () => {
    const normalSelected = filtered.filter((c) => selectedBulk[c.id]);
    if (!normalSelected.length) {
      alert("Select contacts first");
      return;
    }
    setBulkIndex(0);
    setView("bulk");
  };

  const openBirthdays = () => {
    setBulkIndex(0);
    setView("birthdays");
  };

  const updateDraftScript = (contactId: string, scriptId: string) => {
    const c = contacts.find((x) => x.id === contactId);
    const sourceScripts = isBirthdayView ? DEFAULT_BIRTHDAY_SCRIPTS : scripts;
    const s = sourceScripts.find((x) => x.id === scriptId);
    if (!c || !s) return;
    setBulkDrafts((prev) => ({
      ...prev,
      [contactId]: { scriptId, message: renderTemplate(s.content, c) },
    }));
  };

  const rotateScript = () => {
    if (!currentBulk) return;
    const rotationSource = isBirthdayView ? DEFAULT_BIRTHDAY_SCRIPTS : scripts;
    if (!rotationSource.length) return;
    const currentId = currentDraft?.scriptId || rotationSource[0].id;
    const idx = rotationSource.findIndex((s) => s.id === currentId);
    const next = rotationSource[(idx + 1) % rotationSource.length];
    updateDraftScript(currentBulk.id, next.id);
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
    const msg = currentDraft?.message || "";
    window.open(whatsappUrl(currentBulk.cell || currentBulk.phone, msg), "_blank");
  };

  const copyCurrentMessage = async () => {
    if (!currentBulk) return;
    try {
      await navigator.clipboard.writeText(currentDraft?.message || "");
      alert("Message copied");
    } catch {
      alert("Could not copy message");
    }
  };

  const patchContact = (contactId: string, patch: Partial<Contact>) => {
    setContacts((prev) => prev.map((c) => (c.id === contactId ? { ...c, ...patch, modified: today() } : c)));
  };

  const updateContactField = (contactId: string, field: keyof Contact, value: string) => {
    patchContact(contactId, { [field]: value } as Partial<Contact>);
  };

  const markSentAndNext = () => {
    if (!currentBulk) return;
    patchContact(currentBulk.id, { crmTag: "Messaged", lastContacted: today(), followUpDue: true, followUpDate: addDays(3) });
    if (bulkIndex < activeBulkContacts.length - 1) setBulkIndex((x) => x + 1);
    else alert("Queue complete");
  };

  const markResponded = () => {
    if (!currentBulk) return;
    patchContact(currentBulk.id, { crmTag: "Responded" });
  };

  const markHotSeller = () => {
    if (!currentBulk) return;
    patchContact(currentBulk.id, { crmTag: "Hot Seller" });
  };

  const setFollowUp = () => {
    if (!currentBulk) return;
    patchContact(currentBulk.id, { crmTag: "Follow Up", followUpDue: true, followUpDate: addDays(2) });
    alert("Follow-up set");
  };

  const exportRegister = () => {
    downloadCsv("propcon_register.csv", contacts.map((c) => ({
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
    })));
  };

  const exportBulk = () => {
    if (!activeBulkContacts.length) {
      alert("No selected contacts");
      return;
    }
    downloadCsv(isBirthdayView ? "birthday_bulk_export.csv" : "propcon_bulk_export.csv", activeBulkContacts.map((c) => ({
      Name: c.name,
      Surname: c.surname,
      Cell: c.cell,
      Suburb: c.suburb,
      Script: (isBirthdayView ? DEFAULT_BIRTHDAY_SCRIPTS : scripts).find((s) => s.id === (bulkDrafts[c.id]?.scriptId || selectedScriptId))?.name || "",
      Message: bulkDrafts[c.id]?.message || "",
    })));
  };

  const openFollowUps = () => {
    setSelectedTag("Follow Up");
    setView("contacts");
  };

  const saveContactEdit = () => {
    setEditingContactId(null);
    alert("Contact updated");
  };

  const deleteContact = (contactId: string) => {
    setContacts((prev) => prev.filter((c) => c.id !== contactId));
    setSelectedBulk((prev) => {
      const next = { ...prev };
      delete next[contactId];
      return next;
    });
    setBulkDrafts((prev) => {
      const next = { ...prev };
      delete next[contactId];
      return next;
    });
    if (editingContactId === contactId) setEditingContactId(null);
  };

  return (
    <div style={styles.page}>
      <input ref={fileRef} type="file" accept=".csv,text/csv" style={{ display: "none" }} onChange={(e) => void importCsv(e.target.files?.[0] || null)} />
      <div style={styles.layout}>
        <aside style={styles.sidebar}>
          <div style={styles.sidebarHeader}>
            <div style={styles.logoBox}>🏢</div>
            <div>
              <div style={styles.brand}>MarSteph</div>
              <div style={styles.brandSub}></div>
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
              <button key={String(key)} onClick={() => setView(key as View)} style={{ ...styles.sidebarButton, ...(view === key ? styles.sidebarButtonActive : {}) }}>
                <span>{emoji}</span>
                <span>{label}</span>
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
                <div style={styles.heroTag}>✨ Stable version</div>
                <h1 style={styles.heroTitle}>Lead Management Dashboard</h1>
                <p style={styles.heroText}>CSV import, saved contacts, saved scripts, suburb grouping, CRM tags, follow-up dates, and a one-by-one editable WhatsApp queue.</p>
              </div>
              <div style={styles.heroButtons}>
                <button onClick={() => fileRef.current?.click()} style={styles.whiteButton}>Import CSV</button>
                <button onClick={exportRegister} style={styles.ghostButton}>Export Register</button>
              </div>
            </div>
            <div style={styles.metricsGrid}>
              {[
                ["Contacts", stats.total],
                ["Messaged", stats.messaged],
                ["Responded", stats.responded],
                ["Hot Sellers", stats.hot],
                ["Due Today", stats.due],
              ].map(([label, value], i) => (
                <MetricCard key={String(label)} title={String(label)} value={Number(value)} bg={metricBackground(i)} />
              ))}
            </div>
          </section>

          {view === "dashboard" && (
            <div style={styles.twoCol}>
              <section style={styles.card}>
                <div style={styles.sectionTitle}>Overview</div>
                <div style={styles.focusGrid}>
                  <MetricCard title="Contacts" value={stats.total} bg="linear-gradient(135deg,#eff6ff,#dbeafe)" />
                  <MetricCard title="Messaged" value={stats.messaged} bg="linear-gradient(135deg,#ecfeff,#cffafe)" />
                  <MetricCard title="Responded" value={stats.responded} bg="linear-gradient(135deg,#ecfdf5,#bbf7d0)" />
                  <MetricCard title="Hot Sellers" value={stats.hot} bg="linear-gradient(135deg,#fff1f2,#fecdd3)" />
                </div>
                <div style={{ marginTop: 16 }}>
                  <button onClick={openBirthdays} style={styles.primaryButton}>Today's Birthdays ({stats.birthdays})</button>
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
                {FIELD_DEFS.map(([key, label]) => (
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
                      {FIELD_DEFS.map(([key, label]) => <th key={key} style={styles.th}>{label}</th>)}
                      <th style={styles.th}>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filtered.map((c) => {
                      const isEditing = editingContactId === c.id;
                      return (
                        <tr key={c.id}>
                          <td style={styles.td}><input type="checkbox" checked={!!selectedBulk[c.id]} onChange={() => setSelectedBulk((p) => ({ ...p, [c.id]: !p[c.id] }))} /></td>
                          <td style={styles.td}>{c.crmTag}</td>
                          <td style={styles.td}>{isEditing ? <input value={c.suburb} onChange={(e) => updateContactField(c.id, "suburb", e.target.value)} style={{ ...styles.input, minWidth: 140, padding: "8px 10px" }} /> : c.suburb}</td>
                          {FIELD_DEFS.map(([key]) => (
                            <td key={key} style={styles.td}>
                              {isEditing ? (
                                <input value={String((c as any)[key] || "")} onChange={(e) => updateContactField(c.id, key as keyof Contact, e.target.value)} style={{ ...styles.input, minWidth: 140, padding: "8px 10px" }} />
                              ) : (
                                String((c as any)[key] || "")
                              )}
                            </td>
                          ))}
                          <td style={styles.td}>
                            <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                              {isEditing ? (
                                <button onClick={saveContactEdit} style={styles.secondaryButton}>Save</button>
                              ) : (
                                <button onClick={() => setEditingContactId(c.id)} style={styles.secondaryButton}>Edit</button>
                              )}
                              <button onClick={() => deleteContact(c.id)} style={styles.secondaryButton}>Delete</button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
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
                    <div key={s.id} style={{ ...styles.previewCard, ...(selectedScriptId === s.id ? styles.selectedCard : {}) }}>
                      <div style={styles.previewHead}><div style={styles.previewName}>{s.name}</div><span style={styles.tag}>{s.category}</span></div>
                      <div style={styles.previewMessage}>{s.content}</div>
                      <div style={{ ...styles.filtersRow, marginTop: 12, marginBottom: 0 }}>
                        <button onClick={() => setSelectedScriptId(s.id)} style={styles.secondaryButton}>Select</button>
                        <button onClick={() => beginEditScript(s.id)} style={styles.secondaryButton}>Edit</button>
                        <button onClick={() => deleteScript(s.id)} style={styles.secondaryButton}>Delete</button>
                      </div>
                    </div>
                  ))}
                </div>
              </section>
              <section style={styles.card}>
                <div style={styles.sectionTitle}>{editingScriptId ? "Edit Script" : "Create Script"}</div>
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
                  <button onClick={saveScript} style={styles.primaryButton}>{editingScriptId ? "Save Changes" : "Save Script"}</button>
                  <button onClick={() => { setEditingScriptId(null); setNewScriptName(""); setNewScriptCategory("Canvassing"); setNewScriptContent(""); }} style={styles.secondaryButton}>Clear</button>
                </div>
              </section>
            </div>
          )}

          {(view === "bulk" || view === "birthdays") && (
            <div style={styles.twoCol}>
              <section style={styles.card}>
                <div style={styles.cardHeader}>
                  <div>
                    <div style={styles.sectionTitle}>{view === "birthdays" ? "Birthday WhatsApp Queue" : "Bulk WhatsApp Queue"}</div>
                    <div style={styles.sectionSub}>{view === "birthdays" ? "Birthday contacts for today with rotating birthday messages." : "Review and send one contact at a time."}</div>
                  </div>
                  <button onClick={exportBulk} style={styles.primaryButton}>Export Bulk CSV</button>
                </div>

                <div style={styles.filtersRow}>
                  <button onClick={() => setBulkIndex((x) => Math.max(0, x - 1))} style={styles.secondaryButton}>Previous</button>
                  <button onClick={() => setBulkIndex((x) => Math.min(activeBulkContacts.length - 1, x + 1))} style={styles.secondaryButton}>Next</button>
                  <button onClick={rotateScript} style={styles.secondaryButton}>Rotate Script</button>
                  <button onClick={openCurrentInWhatsApp} style={styles.primaryButton}>Open in WhatsApp</button>
                  <button onClick={copyCurrentMessage} style={styles.secondaryButton}>Copy Message</button>
                </div>

                {currentBulk ? (
                  <div style={styles.queueBox}>
                    <div style={styles.previewHead}><div style={styles.previewName}>Queue Item {bulkIndex + 1} / {activeBulkContacts.length}</div><span style={styles.tag}>{fullName(currentBulk)}</span></div>
                    <div style={styles.metaGrid}>
                      <MiniStat label="Cell" value={currentBulk.cell || currentBulk.phone} />
                      <MiniStat label="Suburb" value={currentBulk.suburb} />
                      <MiniStat label="CRM Tag" value={currentBulk.crmTag} />
                      <MiniStat label="Agent" value={currentBulk.agents} />
                    </div>
                    <div style={{ marginTop: 14 }}>
                      <label style={styles.label}>Script for this contact</label>
                      <select value={currentDraft?.scriptId || selectedScriptId} onChange={(e) => updateDraftScript(currentBulk.id, e.target.value)} style={styles.select}>
                        {(isBirthdayView ? DEFAULT_BIRTHDAY_SCRIPTS : scripts).map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
                      </select>
                    </div>
                    <div style={{ marginTop: 14 }}>
                      <label style={styles.label}>Edit message before opening WhatsApp</label>
                      <textarea value={currentDraft?.message || ""} onChange={(e) => updateDraftMessage(currentBulk.id, e.target.value)} style={styles.textarea} />
                    </div>
                    <div style={styles.filtersRow}>
                      <button onClick={markSentAndNext} style={styles.primaryButton}>Mark Sent + Next</button>
                      {!isBirthdayView && <button onClick={markResponded} style={styles.secondaryButton}>Mark Responded</button>}
                      {!isBirthdayView && <button onClick={markHotSeller} style={styles.secondaryButton}>Mark Hot Seller</button>}
                      {!isBirthdayView && <button onClick={setFollowUp} style={styles.secondaryButton}>Set Follow Up</button>}
                    </div>
                  </div>
                ) : (
                  <div style={styles.emptyBox}>{isBirthdayView ? "No birthdays today." : "Select contacts in Contacts first."}</div>
                )}
              </section>

              <section style={styles.card}>
                <div style={styles.cardHeader}>
                  <div>
                    <div style={styles.sectionTitle}>{isBirthdayView ? "Today's Birthdays" : "Selected Queue"}</div>
                    <div style={styles.sectionSub}>{isBirthdayView ? "Click any birthday contact to choose it yourself." : "Click any contact to choose it yourself."}</div>
                  </div>
                  <div style={styles.topBadge}>{activeBulkContacts.length} selected</div>
                </div>
                <div style={styles.previewStack}>
                  {activeBulkContacts.length ? activeBulkContacts.map((c, idx) => (
                    <button key={c.id} onClick={() => setBulkIndex(idx)} style={{ ...styles.previewCard, ...(idx === bulkIndex ? styles.selectedCard : {}) }}>
                      <div style={styles.previewHead}><div style={styles.previewName}>{idx + 1}. {fullName(c)}</div><span style={styles.tag}>{(isBirthdayView ? DEFAULT_BIRTHDAY_SCRIPTS : scripts).find((s) => s.id === (bulkDrafts[c.id]?.scriptId || selectedScriptId))?.name || "Script"}</span></div>
                      <div style={{ ...styles.previewMessage, marginBottom: 6 }}>{c.cell || c.phone} · {isBirthdayView ? c.birthDay : c.crmTag}</div>
                      <div style={styles.previewMessage}>{bulkDrafts[c.id]?.message || ""}</div>
                    </button>
                  )) : <div style={styles.emptyBox}>{isBirthdayView ? "No birthdays today." : "No queue yet."}</div>}
                </div>
              </section>
            </div>
          )}

          {view === "manager" && (
            <div style={styles.twoCol}>
              <section style={styles.card}>
                <div style={styles.sectionTitle}>Response Dashboard</div>
                <div style={styles.metricsGrid}>
                  {(["Unmessaged", "Messaged", "Responded", "Hot Seller", "Follow Up"] as CrmTag[]).map((tag, i) => (
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

const styles: Record<string, React.CSSProperties> = {
  page: { minHeight: "100vh", background: "linear-gradient(135deg,#eaf3ff 0%,#f7fbff 35%,#f8fafc 100%)", color: "#0f172a", fontFamily: 'Inter, system-ui, -apple-system, "Segoe UI", sans-serif' },
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
  emptyBox: { borderRadius: 18, background: "#f1f5f9", color: "#64748b", padding: 32, textAlign: "center" },
};
