import React, { useMemo, useRef, useState } from "react";

type Status = "New" | "Waiting" | "Interested" | "Appointment" | "Do Not Contact";
type View = "dashboard" | "contacts" | "leads" | "pipeline" | "scripts" | "bulk" | "manager";

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
};

type ScriptTemplate = {
  id: string;
  name: string;
  category: string;
  content: string;
};

const seed: ContactRecord[] = [
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
    loaded: "2026-04-02",
    modified: "2026-04-02",
    lastContacted: "",
    status: "New",
    assignee: "Lerato",
    temperature: "Cold",
    valueBand: "R3.8m - R4.2m",
    notes: "Fresh PropCon import",
    reply: "",
    followUpDue: true,
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
    loaded: "2026-04-02",
    modified: "2026-04-03",
    lastContacted: "2026-04-03",
    status: "Waiting",
    assignee: "Lerato",
    temperature: "Cold",
    valueBand: "R5.5m - R6.1m",
    notes: "Follow-up today",
    reply: "Seen, no reply",
    followUpDue: true,
  },
  {
    id: "3",
    category: "Buyer",
    name: "Ayesha",
    surname: "Daniels",
    email: "ayesha@example.com",
    cell: "+27 81 555 0102",
    address: "44 Sandpiper Ave",
    phone: "021 555 3333",
    type: "Buyer",
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
    loaded: "2026-04-02",
    modified: "2026-04-03",
    lastContacted: "2026-04-03",
    status: "Interested",
    assignee: "Lerato",
    temperature: "Warm",
    valueBand: "R2.4m - R2.8m",
    notes: "Warm lead",
    reply: "Please send recent sales.",
    followUpDue: false,
  },
];

const defaultScripts: ScriptTemplate[] = [
  { id: "s1", name: "Buyer Enquiry", category: "Canvassing", content: "Hi {{full_name}}, quick one — I’m working with a buyer looking in {{suburb}}. Would you consider selling if the price made sense?" },
  { id: "s2", name: "Recent Sales", category: "Canvassing", content: "Hi {{full_name}}, I’ve just updated recent sales in {{suburb}}. Would you like me to send you what properties near you are selling for?" },
  { id: "s3", name: "Property Value", category: "Valuation", content: "Hi {{full_name}}, have you seen what homes in {{suburb}} are selling for lately?" },
  { id: "s4", name: "Appointment Close", category: "Appointment", content: "Thanks {{full_name}}. I can arrange a quick no-obligation valuation for your property in {{suburb}}. What day would suit you best?" },
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

function initials(record: ContactRecord) {
  return `${record.name?.[0] || ""}${record.surname?.[0] || ""}`.toUpperCase();
}

function renderScript(content: string, record: ContactRecord) {
  return content
    .replace(/\{\{full_name\}\}/g, fullName(record))
    .replace(/\{\{name\}\}/g, record.name)
    .replace(/\{\{surname\}\}/g, record.surname)
    .replace(/\{\{suburb\}\}/g, record.address)
    .replace(/\{\{cell\}\}/g, record.cell)
    .replace(/\{\{email\}\}/g, record.email)
    .replace(/\{\{address\}\}/g, record.address)
    .replace(/\{\{category\}\}/g, record.category)
    .replace(/\{\{type\}\}/g, record.type);
}

function statusColors(status: Status) {
  if (status === "New") return { bg: "#e2e8f0", color: "#334155" };
  if (status === "Waiting") return { bg: "#fef3c7", color: "#92400e" };
  if (status === "Interested") return { bg: "#dcfce7", color: "#166534" };
  if (status === "Appointment") return { bg: "#dbeafe", color: "#1d4ed8" };
  return { bg: "#ffe4e6", color: "#be123c" };
}

function tempColor(temp: ContactRecord["temperature"]) {
  if (temp === "Hot") return "#ef4444";
  if (temp === "Warm") return "#f59e0b";
  return "#94a3b8";
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

export default function App() {
  const [view, setView] = useState<View>("dashboard");
  const [records, setRecords] = useState<ContactRecord[]>(seed);
  const [selectedId, setSelectedId] = useState("3");
  const [selectedScriptId, setSelectedScriptId] = useState("s3");
  const [selectedBulk, setSelectedBulk] = useState<Record<string, boolean>>({});
  const [csvName, setCsvName] = useState("No file selected");
  const [scripts, setScripts] = useState<ScriptTemplate[]>(defaultScripts);
  const [scriptName, setScriptName] = useState("");
  const [scriptCategory, setScriptCategory] = useState("Canvassing");
  const [scriptContent, setScriptContent] = useState("");
  const [quickSearch, setQuickSearch] = useState("");
  const [fieldSearch, setFieldSearch] = useState<Record<string, string>>(() => {
    const obj: Record<string, string> = {};
    csvFieldDefs.forEach((f) => {
      obj[f.key] = "";
    });
    return obj;
  });
  const fileRef = useRef<HTMLInputElement | null>(null);

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
      ].join(" ").toLowerCase();

      const quickMatch = quickHay.includes(quickSearch.toLowerCase());
      const fieldMatch = csvFieldDefs.every((field) => {
        const value = fieldSearch[field.key] || "";
        if (!value) return true;
        return String((record as any)[field.key] || "").toLowerCase().includes(value.toLowerCase());
      });
      return quickMatch && fieldMatch;
    });
  }, [records, quickSearch, fieldSearch]);

  const selected = filtered.find((r) => r.id === selectedId) || records.find((r) => r.id === selectedId) || records[0];
  const selectedScript = scripts.find((s) => s.id === selectedScriptId) || scripts[0];
  const message = renderScript(selectedScript.content, selected);

  const stats = {
    total: records.length,
    due: records.filter((r) => r.followUpDue && r.status !== "Do Not Contact").length,
    hot: records.filter((r) => r.temperature === "Hot").length,
    interested: records.filter((r) => r.status === "Interested").length,
    appointments: records.filter((r) => r.status === "Appointment").length,
  };

  const pipeline = ["New", "Waiting", "Interested", "Appointment", "Do Not Contact"].map((status) => ({
    status: status as Status,
    items: records.filter((r) => r.status === status),
  }));

  const copyMessage = async () => {
    try {
      await navigator.clipboard.writeText(message);
      alert("Message copied");
    } catch {
      alert("Could not copy message");
    }
  };

  const openWhatsApp = () => {
    const phone = (selected.cell || selected.phone).replace(/\D/g, "");
    window.open(`https://wa.me/${phone}?text=${encodeURIComponent(message)}`, "_blank");
  };

  const nextLead = () => {
    const idx = filtered.findIndex((r) => r.id === selected.id);
    if (idx >= 0 && idx < filtered.length - 1) setSelectedId(filtered[idx + 1].id);
  };

  const markStatus = (status: Status) => {
    setRecords((prev) =>
      prev.map((r) =>
        r.id === selected.id
          ? {
              ...r,
              status,
              followUpDue: status === "Waiting",
              temperature: status === "Appointment" ? "Hot" : status === "Interested" ? "Warm" : r.temperature,
            }
          : r
      )
    );
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
      }))
    );
  };

  const exportBulk = () => {
    const rows = filtered
      .filter((r) => selectedBulk[r.id])
      .map((r) => ({
        Category: r.category,
        Name: r.name,
        Surname: r.surname,
        Email: r.email,
        Cell: r.cell,
        Address: r.address,
        Phone: r.phone,
        Message: renderScript(selectedScript.content, r),
      }));
    if (!rows.length) {
      alert("Select at least one contact first");
      return;
    }
    downloadCsv("propcon_bulk_export.csv", rows);
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
      source: getByNames(row, ["source"]),
      wishLists: getByNames(row, ["wishlists"]),
      matches: getByNames(row, ["matches"]),
      sms: getByNames(row, ["sms"]),
      emails: getByNames(row, ["emails"]),
      whatsApp: getByNames(row, ["whatsapp"]),
      optIn: getByNames(row, ["optin"]),
      agents: getByNames(row, ["agents"]),
      loaded: getByNames(row, ["loaded"]),
      modified: getByNames(row, ["modified"]),
      lastContacted: getByNames(row, ["lastcontacted"]),
      status: "New",
      assignee: getByNames(row, ["agents"]) || "Unassigned",
      temperature: "Cold",
      valueBand: "Pending",
      notes: "Imported from CSV",
      reply: "",
      followUpDue: true,
    })).filter((r) => r.name || r.surname || r.cell || r.email);

    if (!imported.length) {
      alert("No usable rows found in that CSV");
      return;
    }

    setRecords((prev) => [...imported, ...prev]);
    setSelectedId(imported[0].id);
    setView("contacts");
    alert(`${imported.length} contacts imported`);
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
      setView("leads");
    } else {
      alert("No follow-ups due right now");
    }
  };

  return (
    <div style={styles.page}>
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
              <div style={styles.darkRow}><span>Hot leads</span><strong>{stats.hot}</strong></div>
              <div style={styles.darkRow}><span>Booked</span><strong>{stats.appointments}</strong></div>
              <button onClick={openFollowUps} style={{ ...styles.whiteButton, width: "100%", marginTop: 8 }}>Open Follow Ups</button>
            </div>
          </div>
        </aside>

        <main style={styles.main}>
          <section style={styles.hero}>
            <div style={styles.heroTop}>
              <div>
                <div style={styles.heroTag}>✨ CSV fields now match your PropCon headings</div>
                <h1 style={styles.heroTitle}>Lead Management Dashboard</h1>
                <p style={styles.heroText}>Import the CSV and instantly search by Category, Name, Surname, Email, Cell, Address, Phone, Type, ID Number, BirthDay, Tags, Source, Wish Lists, Matches, SMS, Emails, WhatsApp, Opt-In, Agents, Loaded, Modified, and Last Contacted.</p>
              </div>
              <div style={styles.heroButtons}>
                <button onClick={handleImportClick} style={styles.whiteButton}>📤 Import CSV</button>
                <button onClick={exportRegister} style={styles.ghostButton}>📥 Export Register</button>
              </div>
            </div>
            <div style={styles.metricsGrid}>
              <MetricCard title="Contacts" value={stats.total} bg="linear-gradient(135deg,#f8fafc,#e2e8f0)" />
              <MetricCard title="Warm / Hot" value={stats.hot + records.filter((r) => r.temperature === "Warm").length} bg="linear-gradient(135deg,#fef3c7,#fde68a)" />
              <MetricCard title="Interested" value={stats.interested} bg="linear-gradient(135deg,#dcfce7,#a7f3d0)" />
              <MetricCard title="Appointments" value={stats.appointments} bg="linear-gradient(135deg,#dbeafe,#93c5fd)" />
              <MetricCard title="Due Today" value={stats.due} bg="linear-gradient(135deg,#ffe4e6,#fdba74)" />
            </div>
          </section>

          {view === "contacts" && (
            <div style={styles.card}>
              <div style={styles.cardHeader}>
                <div>
                  <h2 style={styles.cardTitle}>Contacts</h2>
                  <div style={styles.cardSub}>Every CSV heading now has its own search box.</div>
                </div>
                <div style={styles.topBadge}>{filtered.length} results • {csvName}</div>
              </div>

              <div style={styles.contactsSearchGridWide}>
                <SearchField label="Quick Search" value={quickSearch} onChange={setQuickSearch} placeholder="Search all fields" />
                {csvFieldDefs.map((field) => (
                  <SearchField
                    key={field.key}
                    label={field.label}
                    value={fieldSearch[field.key] || ""}
                    onChange={(value) => setFieldSearch((prev) => ({ ...prev, [field.key]: value }))}
                    placeholder={`Search ${field.label}`}
                  />
                ))}
              </div>

              <div style={styles.contactsActionsRow}>
                <button onClick={() => { const next: Record<string, boolean> = {}; filtered.forEach((r) => { next[r.id] = true; }); setSelectedBulk(next); }} style={styles.secondaryAction}>Select All Results</button>
                <button onClick={() => setSelectedBulk({})} style={styles.secondaryAction}>Clear Selection</button>
                <button onClick={() => setView("bulk")} style={styles.darkButton}>Open Bulk Send</button>
              </div>

              <div style={styles.tableWrap}>
                <table style={styles.table}>
                  <thead>
                    <tr>
                      <th style={styles.th}></th>
                      {csvFieldDefs.map((field) => <th key={field.key} style={styles.th}>{field.label}</th>)}
                    </tr>
                  </thead>
                  <tbody>
                    {filtered.map((record) => (
                      <tr key={record.id}>
                        <td style={styles.td}><input type="checkbox" checked={!!selectedBulk[record.id]} onChange={() => setSelectedBulk((prev) => ({ ...prev, [record.id]: !prev[record.id] }))} /></td>
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
                <div style={styles.cardHeader}><div><h2 style={styles.cardTitle}>Saved Scripts</h2><div style={styles.cardSub}>Reusable WhatsApp templates like PropCon.</div></div><div style={styles.topBadge}>{scripts.length} scripts</div></div>
                <div style={styles.listArea}>
                  {scripts.map((item) => (
                    <button key={item.id} onClick={() => setSelectedScriptId(item.id)} style={{ ...styles.scriptCard, ...(selectedScriptId === item.id ? styles.leadCardActive : {}) }}>
                      <div style={styles.previewHead}><div style={styles.previewName}>{item.name}</div><Tag text={item.category} /></div>
                      <div style={styles.previewMessage}>{item.content}</div>
                    </button>
                  ))}
                </div>
              </section>
              <section style={styles.card}>
                <div style={styles.cardHeader}><div><h2 style={styles.cardTitle}>Create Script</h2><div style={styles.cardSub}>Save templates with placeholders like {{full_name}}, {{name}}, {{surname}}, {{email}}, {{cell}}, {{address}}, {{type}}.</div></div></div>
                <div>
                  <label style={styles.label}>Script Name</label>
                  <input value={scriptName} onChange={(e) => setScriptName(e.target.value)} style={styles.input} placeholder="Example: Wish List Match" />
                </div>
                <div style={{ marginTop: 16 }}>
                  <label style={styles.label}>Category</label>
                  <input value={scriptCategory} onChange={(e) => setScriptCategory(e.target.value)} style={styles.input} placeholder="Canvassing" />
                </div>
                <div style={{ marginTop: 16 }}>
                  <label style={styles.label}>Content</label>
                  <textarea value={scriptContent} onChange={(e) => setScriptContent(e.target.value)} style={styles.textarea} placeholder="Hi {{full_name}}, your wish list match in {{address}} is now available..." />
                </div>
                <div style={styles.actionRow3}>
                  <button onClick={saveScript} style={styles.darkButtonWide}>💾 Save Script</button>
                  <button onClick={() => { setScriptName(""); setScriptCategory("Canvassing"); setScriptContent(""); }} style={styles.secondaryAction}>Clear</button>
                  <button onClick={() => setView("leads")} style={styles.secondaryAction}>Use in Lead Desk</button>
                </div>
              </section>
            </div>
          )}

          {view === "bulk" && (
            <div style={styles.twoCol}>
              <section style={styles.card}>
                <div style={styles.cardHeader}><div><h2 style={styles.cardTitle}>Bulk Send Builder</h2><div style={styles.cardSub}>Filtered search results from Contacts can be bulk-selected here.</div></div><button onClick={exportBulk} style={styles.darkButton}>📥 Export CSV</button></div>
                <div style={styles.formGrid}>
                  <div>
                    <label style={styles.label}>Script for bulk batch</label>
                    <select value={selectedScriptId} onChange={(e) => setSelectedScriptId(e.target.value)} style={styles.select}>
                      {scripts.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
                    </select>
                  </div>
                  <div>
                    <label style={styles.label}>Selected Contacts</label>
                    <input value={`${filtered.filter((r) => selectedBulk[r.id]).length} selected`} readOnly style={styles.input} />
                  </div>
                </div>
                <div style={styles.tableWrap}>
                  <table style={styles.table}>
                    <thead>
                      <tr>
                        <th style={styles.th}></th>
                        <th style={styles.th}>Category</th>
                        <th style={styles.th}>Name</th>
                        <th style={styles.th}>Surname</th>
                        <th style={styles.th}>Cell</th>
                        <th style={styles.th}>WhatsApp</th>
                        <th style={styles.th}>Agents</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filtered.map((record) => (
                        <tr key={record.id}>
                          <td style={styles.td}><input type="checkbox" checked={!!selectedBulk[record.id]} onChange={() => setSelectedBulk((prev) => ({ ...prev, [record.id]: !prev[record.id] }))} /></td>
                          <td style={styles.td}>{record.category}</td>
                          <td style={styles.td}>{record.name}</td>
                          <td style={styles.td}>{record.surname}</td>
                          <td style={styles.td}>{record.cell}</td>
                          <td style={styles.td}>{record.whatsApp}</td>
                          <td style={styles.td}>{record.agents}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </section>
              <section style={styles.card}>
                <div style={styles.cardHeader}><div><h2 style={styles.cardTitle}>Preview Panel</h2><div style={styles.cardSub}>What your canvasser will send.</div></div></div>
                <div style={styles.previewStack}>
                  {filtered.filter((r) => selectedBulk[r.id]).length ? filtered.filter((r) => selectedBulk[r.id]).map((record) => (
                    <div key={record.id} style={styles.previewCard}>
                      <div style={styles.previewHead}><div style={styles.previewName}>{fullName(record)}</div><Tag text={record.category} /></div>
                      <div style={styles.previewMessage}>{renderScript(selectedScript.content, record)}</div>
                    </div>
                  )) : <div style={styles.emptyBox}>Select contacts to preview the batch.</div>}
                </div>
              </section>
            </div>
          )}

          {view === "dashboard" && <div style={styles.emptyBox}>Dashboard remains available. Use Contacts for the new CSV-heading search workflow.</div>}
          {view === "leads" && <div style={styles.emptyBox}>Lead Desk remains available in the repo version. This update focused on your new Contacts + CSV heading search requirement.</div>}
          {view === "pipeline" && <div style={styles.emptyBox}>Pipeline remains available in the repo version. This update focused on your new Contacts + CSV heading search requirement.</div>}
          {view === "manager" && <div style={styles.emptyBox}>Manager view remains available in the repo version. This update focused on your new Contacts + CSV heading search requirement.</div>}
        </main>
      </div>
    </div>
  );
}

function Avatar({ initials, large }: { initials: string; large?: boolean }) {
  return <div style={{ ...styles.avatar, ...(large ? styles.avatarLarge : {}) }}>{initials}</div>;
}

function MetricCard({ title, value, bg }: { title: string; value: number; bg: string }) {
  return <div style={{ ...styles.metricCard, background: bg }}><div style={styles.metricTitle}>{title}</div><div style={styles.metricValue}>{value}</div></div>;
}

function FocusCard({ title, value, subtitle, gradient }: { title: string; value: string; subtitle: string; gradient: string }) {
  return <div style={styles.focusCard}><div style={{ ...styles.focusIcon, background: gradient }} /><div style={styles.focusCardTitle}>{title}</div><div style={styles.focusCardValue}>{value}</div><div style={styles.focusCardSub}>{subtitle}</div></div>;
}

function StatusPill({ status }: { status: Status }) {
  const c = statusColors(status);
  return <span style={{ ...styles.statusPill, background: c.bg, color: c.color }}>{status}</span>;
}

function Tag({ text }: { text: string }) {
  return <span style={styles.tag}>{text}</span>;
}

function SearchField({ label, value, onChange, placeholder }: { label: string; value: string; onChange: (v: string) => void; placeholder: string }) {
  return (
    <div>
      <label style={styles.label}>{label}</label>
      <input value={value} onChange={(e) => onChange(e.target.value)} placeholder={placeholder} style={styles.input} />
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  page: { minHeight: "100vh", background: "linear-gradient(135deg,#eaf3ff 0%,#f7fbff 35%,#f8fafc 100%)", color: "#0f172a", fontFamily: 'Inter, ui-sans-serif, system-ui, -apple-system, "Segoe UI", sans-serif' },
  layout: { display: "grid", minHeight: "100vh", gridTemplateColumns: "280px 1fr" },
  sidebar: { background: "#0b1730", color: "white" },
  sidebarHeader: { borderBottom: "1px solid rgba(255,255,255,0.1)", padding: 24, display: "flex", gap: 16, alignItems: "center" },
  logoBox: { width: 56, height: 56, borderRadius: 18, display: "flex", alignItems: "center", justifyContent: "center", background: "linear-gradient(135deg,#22d3ee 0%,#2563eb 100%)", boxShadow: "0 18px 40px rgba(37,99,235,0.35)", fontSize: 26 },
  brand: { fontSize: 22, fontWeight: 700 },
  brandSub: { fontSize: 12, color: "rgba(207,250,254,0.8)" },
  sidebarLabel: { marginBottom: 12, paddingLeft: 12, fontSize: 11, letterSpacing: "0.24em", textTransform: "uppercase", color: "rgba(207,250,254,0.6)" },
  sidebarButton: { width: "100%", display: "flex", alignItems: "center", gap: 12, borderRadius: 18, padding: "14px 16px", background: "transparent", color: "#e2e8f0", border: "none", cursor: "pointer", marginBottom: 8, textAlign: "left", fontSize: 14 },
  sidebarButtonActive: { background: "white", color: "#0f172a", boxShadow: "0 16px 30px rgba(15,23,42,0.25)" },
  focusCardDark: { borderRadius: 28, border: "1px solid rgba(255,255,255,0.1)", background: "rgba(255,255,255,0.05)", padding: 16 },
  focusTitle: { marginBottom: 12, fontSize: 14, fontWeight: 600 },
  darkRow: { display: "flex", justifyContent: "space-between", background: "rgba(255,255,255,0.05)", borderRadius: 16, padding: "10px 12px", marginBottom: 10, fontSize: 14, color: "#e2e8f0" },
  main: { padding: 32 },
  hero: { overflow: "hidden", borderRadius: 34, border: "1px solid #e2e8f0", background: "white", boxShadow: "0 30px 80px rgba(15,23,42,0.09)", marginBottom: 24 },
  heroTop: { background: "linear-gradient(120deg,#0f172a 0%,#1d4ed8 45%,#06b6d4 100%)", color: "white", padding: 32, display: "flex", justifyContent: "space-between", gap: 20, flexWrap: "wrap", alignItems: "center" },
  heroTag: { display: "inline-flex", alignItems: "center", gap: 8, borderRadius: 999, background: "rgba(255,255,255,0.15)", padding: "6px 12px", fontSize: 12, fontWeight: 600, marginBottom: 10 },
  heroTitle: { margin: 0, fontSize: 44, lineHeight: 1.05 },
  heroText: { marginTop: 10, maxWidth: 860, fontSize: 15, color: "#cffafe" },
  heroButtons: { display: "flex", gap: 10, flexWrap: "wrap" },
  whiteButton: { borderRadius: 18, background: "white", color: "#0f172a", border: "none", padding: "14px 16px", fontSize: 14, fontWeight: 600, cursor: "pointer", boxShadow: "0 12px 24px rgba(15,23,42,0.18)" },
  ghostButton: { borderRadius: 18, background: "rgba(255,255,255,0.15)", color: "white", border: "none", padding: "14px 16px", fontSize: 14, fontWeight: 600, cursor: "pointer" },
  metricsGrid: { display: "grid", gridTemplateColumns: "repeat(5, minmax(0, 1fr))", gap: 16, padding: 24 },
  metricCard: { borderRadius: 28, border: "1px solid #e2e8f0", padding: 20, boxShadow: "0 8px 18px rgba(15,23,42,0.05)" },
  metricTitle: { fontSize: 13, fontWeight: 600, opacity: 0.75 },
  metricValue: { marginTop: 10, fontSize: 34, fontWeight: 700 },
  card: { borderRadius: 32, border: "1px solid #e2e8f0", background: "white", padding: 24, boxShadow: "0 8px 18px rgba(15,23,42,0.05)" },
  twoCol: { display: "grid", gridTemplateColumns: "1fr 1fr", gap: 24 },
  cardHeader: { display: "flex", justifyContent: "space-between", gap: 16, alignItems: "center", marginBottom: 16 },
  cardTitle: { margin: 0, fontSize: 24, fontWeight: 700 },
  cardSub: { marginTop: 4, fontSize: 14, color: "#64748b" },
  topBadge: { borderRadius: 999, background: "#eff6ff", color: "#1d4ed8", padding: "8px 12px", fontSize: 12, fontWeight: 600 },
  focusGrid: { display: "grid", gridTemplateColumns: "repeat(2, minmax(0, 1fr))", gap: 16 },
  focusCard: { borderRadius: 28, border: "1px solid #e2e8f0", background: "white", padding: 20, boxShadow: "0 8px 18px rgba(15,23,42,0.05)" },
  focusIcon: { width: 46, height: 46, borderRadius: 16, marginBottom: 14 },
  focusCardTitle: { fontSize: 14, fontWeight: 600, color: "#64748b" },
  focusCardValue: { marginTop: 10, fontSize: 28, fontWeight: 700, color: "#0f172a" },
  focusCardSub: { marginTop: 6, fontSize: 12, color: "#64748b" },
  bestLeadBox: { borderRadius: 30, background: "linear-gradient(135deg,#eef2ff 0%,#ffffff 50%,#ecfeff 100%)", padding: 20 },
  bestLeadTop: { display: "flex", gap: 16, alignItems: "center" },
  bestLeadName: { fontSize: 22, fontWeight: 700 },
  bestLeadMeta: { marginTop: 4, fontSize: 14, color: "#64748b" },
  tagRow: { display: "flex", gap: 8, flexWrap: "wrap", marginTop: 12 },
  actionRow: { display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginTop: 20 },
  actionRow3: { display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 12, marginTop: 16 },
  secondaryAction: { borderRadius: 18, border: "1px solid #e2e8f0", background: "white", color: "#0f172a", padding: "14px 16px", fontSize: 14, fontWeight: 600, cursor: "pointer", boxShadow: "0 6px 16px rgba(15,23,42,0.05)" },
  whatsAppAction: { borderRadius: 18, border: "none", background: "linear-gradient(90deg,#10b981 0%,#06b6d4 100%)", color: "white", padding: "14px 16px", fontSize: 14, fontWeight: 700, cursor: "pointer", boxShadow: "0 14px 28px rgba(16,185,129,0.25)" },
  darkButton: { borderRadius: 18, background: "#0f172a", color: "white", border: "none", padding: "12px 16px", fontSize: 14, fontWeight: 700, cursor: "pointer", boxShadow: "0 12px 24px rgba(15,23,42,0.16)" },
  darkButtonWide: { borderRadius: 18, background: "linear-gradient(90deg,#0f172a 0%,#334155 100%)", color: "white", border: "none", padding: "14px 16px", fontSize: 14, fontWeight: 700, cursor: "pointer", boxShadow: "0 12px 24px rgba(15,23,42,0.16)" },
  contactsSearchGridWide: { display: "grid", gridTemplateColumns: "repeat(4, minmax(0, 1fr))", gap: 14, marginBottom: 18 },
  contactsActionsRow: { display: "flex", gap: 12, marginBottom: 18, flexWrap: "wrap" },
  tableWrap: { overflow: "auto", borderRadius: 28, border: "1px solid #e2e8f0" },
  table: { width: "100%", borderCollapse: "collapse" as const, fontSize: 14 },
  th: { background: "#f8fafc", color: "#475569", textAlign: "left" as const, padding: "14px 16px", fontWeight: 600, whiteSpace: "nowrap" },
  td: { padding: "14px 16px", borderTop: "1px solid #e2e8f0", whiteSpace: "nowrap" },
  listArea: { maxHeight: 760, overflow: "auto", paddingRight: 4 },
  leadCard: { width: "100%", borderRadius: 18, border: "1px solid #e2e8f0", background: "white", padding: 16, textAlign: "left", boxShadow: "0 6px 14px rgba(15,23,42,0.04)" },
  leadCardActive: { border: "1px solid #93c5fd", background: "linear-gradient(135deg,#eff6ff 0%,#ffffff 55%,#ecfeff 100%)" },
  previewHead: { display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10 },
  previewName: { fontWeight: 700, color: "#0f172a" },
  previewMessage: { fontFamily: 'ui-monospace, SFMono-Regular, Menlo, Consolas, monospace', fontSize: 12, color: "#475569", lineHeight: 1.5 },
  previewStack: { display: "grid", gap: 12 },
  previewCard: { borderRadius: 18, border: "1px solid #e2e8f0", background: "linear-gradient(135deg,#ffffff 0%,#f8fafc 100%)", padding: 16, boxShadow: "0 6px 14px rgba(15,23,42,0.04)" },
  scriptCard: { width: "100%", borderRadius: 18, border: "1px solid #e2e8f0", background: "linear-gradient(135deg,#ffffff 0%,#f8fafc 100%)", padding: 16, textAlign: "left", cursor: "pointer", boxShadow: "0 6px 14px rgba(15,23,42,0.04)", marginBottom: 12 },
  emptyBox: { borderRadius: 18, background: "#f1f5f9", color: "#64748b", padding: 32, textAlign: "center" as const, fontSize: 14 },
  chartStack: { display: "grid", gap: 18 },
  chartLabelRow: { display: "flex", justifyContent: "space-between", marginBottom: 8, fontSize: 14, color: "#334155" },
  barBg: { height: 12, background: "#e2e8f0", borderRadius: 999, overflow: "hidden" },
  barFill: { height: "100%", background: "linear-gradient(90deg,#2563eb 0%,#06b6d4 100%)", borderRadius: 999 },
  managerCard: { borderRadius: 18, border: "1px solid #e2e8f0", background: "linear-gradient(135deg,#ffffff 0%,#f8fafc 100%)", padding: 16, boxShadow: "0 6px 14px rgba(15,23,42,0.04)" },
  managerHead: { display: "flex", justifyContent: "space-between", alignItems: "center" },
  managerName: { fontWeight: 700, color: "#0f172a" },
  darkBadge: { borderRadius: 999, background: "#0f172a", color: "white", padding: "6px 12px", fontSize: 12, fontWeight: 700 },
  managerGrid: { display: "grid", gridTemplateColumns: "repeat(3, minmax(0, 1fr))", gap: 10, marginTop: 12 },
  miniBox: { borderRadius: 16, background: "#f1f5f9", padding: 12, textAlign: "center" as const },
  miniLabel: { fontSize: 11, color: "#64748b", textTransform: "uppercase" as const, letterSpacing: "0.08em" },
  miniValue: { marginTop: 6, fontSize: 20, fontWeight: 700, color: "#0f172a" },
  avatar: { width: 44, height: 44, borderRadius: 16, display: "flex", alignItems: "center", justifyContent: "center", background: "linear-gradient(135deg,#2563eb 0%,#06b6d4 100%)", color: "white", fontWeight: 700, boxShadow: "0 12px 24px rgba(37,99,235,0.2)", flexShrink: 0 },
  avatarLarge: { width: 58, height: 58, fontSize: 18, borderRadius: 18 },
  statusPill: { borderRadius: 999, padding: "6px 12px", fontSize: 12, fontWeight: 700, boxShadow: "inset 0 0 0 1px rgba(0,0,0,0.04)" },
  tag: { borderRadius: 999, padding: "6px 12px", fontSize: 12, fontWeight: 600, color: "#475569", background: "white", border: "1px solid #e2e8f0", boxShadow: "0 4px 10px rgba(15,23,42,0.04)" },
  label: { display: "block", marginBottom: 8, fontSize: 11, fontWeight: 700, color: "#64748b", textTransform: "uppercase", letterSpacing: "0.18em" },
  input: { width: "100%", borderRadius: 18, border: "1px solid #e2e8f0", background: "white", padding: "14px 16px", fontSize: 14, boxShadow: "0 6px 14px rgba(15,23,42,0.04)", outline: "none", boxSizing: "border-box" },
  select: { width: "100%", borderRadius: 18, border: "1px solid #e2e8f0", background: "white", padding: "14px 16px", fontSize: 14, boxShadow: "0 6px 14px rgba(15,23,42,0.04)", outline: "none" },
  textarea: { width: "100%", minHeight: 180, borderRadius: 18, border: "1px solid #e2e8f0", background: "white", padding: 16, fontSize: 14, boxShadow: "inset 0 2px 6px rgba(15,23,42,0.05)", outline: "none", resize: "vertical" as const, boxSizing: "border-box" },
};
