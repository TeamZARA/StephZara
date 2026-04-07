import React, { useMemo, useRef, useState } from "react";
import { motion } from "framer-motion";
import {
  Search,
  Upload,
  Download,
  MessageSquare,
  Phone,
  MapPin,
  Copy,
  Send,
  Users,
  Filter,
  Bell,
  ShieldCheck,
  CalendarDays,
  Ban,
  FileSpreadsheet,
  ChevronRight,
  Star,
  Bot,
  ArrowRight,
  CheckCircle2,
  Clock3,
  BarChart3,
} from "lucide-react";

// Full production-style canvassing UI for StephZara
// Frontend-only version designed to be easy to deploy, then connect to Supabase later.

type ContactStatus = "New" | "Waiting" | "Interested" | "Appointment" | "Do Not Contact";
type TabKey = "workspace" | "import" | "bulk" | "manager" | "settings";

type Contact = {
  id: string;
  name: string;
  phone: string;
  suburb: string;
  area: string;
  address: string;
  status: ContactStatus;
  script: string;
  assignedTo: string;
  reply: string;
  notes: string;
  followUpDue: boolean;
  score: number;
  optedOut: boolean;
  source: string;
  lastContacted?: string;
};

const scripts: Record<string, string> = {
  "Buyer Enquiry": "Hi {{name}}, quick one — I’m working with a buyer looking in {{suburb}}. Would you consider selling if the price made sense?",
  "Recent Sales": "Hi {{name}}, I’ve just updated recent sales in {{suburb}}. Would you like me to send you what properties near you are selling for?",
  "Property Value": "Hi {{name}}, have you seen what homes in {{suburb}} are selling for lately?",
  "Annual Area Report": "Hi {{name}}, I’m sending out this year’s property update for {{suburb}}. Would you like me to send you the recent sales and area activity?",
  "Follow Up 1": "Hi {{name}}, just checking if you saw my previous message about {{suburb}}.",
  "Follow Up 2": "Quick one {{name}} — would you consider selling in the next 6–12 months if the price was right?",
  "Appointment Close": "Thanks {{name}}. I can arrange a quick no-obligation valuation for your property in {{suburb}}. What day would suit you best?",
};

const contactsSeed: Contact[] = [
  {
    id: "c1",
    name: "Janine Smith",
    phone: "+27 82 555 0141",
    suburb: "Durbanville",
    area: "Durbanville",
    address: "12 Oak Street",
    status: "New",
    script: "Recent Sales",
    assignedTo: "Lerato",
    reply: "",
    notes: "Fresh PropCon import",
    followUpDue: true,
    score: 0,
    optedOut: false,
    source: "PropCon CSV",
    lastContacted: "",
  },
  {
    id: "c2",
    name: "Peter Jacobs",
    phone: "+27 83 555 0198",
    suburb: "Blouberg",
    area: "Blouberg",
    address: "85 Marine Road",
    status: "Waiting",
    script: "Buyer Enquiry",
    assignedTo: "Lerato",
    reply: "Seen, no reply",
    notes: "Follow-up today",
    followUpDue: true,
    score: 1,
    optedOut: false,
    source: "PropCon CSV",
    lastContacted: "2026-04-01",
  },
  {
    id: "c3",
    name: "Ayesha Daniels",
    phone: "+27 81 555 0102",
    suburb: "Parklands",
    area: "Parklands",
    address: "44 Sandpiper Ave",
    status: "Interested",
    script: "Property Value",
    assignedTo: "Lerato",
    reply: "Yes, please send recent sales.",
    notes: "Warm lead",
    followUpDue: false,
    score: 8,
    optedOut: false,
    source: "PropCon CSV",
    lastContacted: "2026-04-02",
  },
  {
    id: "c4",
    name: "Gavin Naidoo",
    phone: "+27 72 555 0135",
    suburb: "Table View",
    area: "Table View",
    address: "17 Beach Road",
    status: "Appointment",
    script: "Appointment Close",
    assignedTo: "Megan",
    reply: "We may sell later this year.",
    notes: "Appointment pending",
    followUpDue: false,
    score: 15,
    optedOut: false,
    source: "PropCon CSV",
    lastContacted: "2026-04-02",
  },
  {
    id: "c5",
    name: "Melissa van Wyk",
    phone: "+27 79 555 0180",
    suburb: "Milnerton",
    area: "Milnerton",
    address: "23 Sunset Drive",
    status: "Do Not Contact",
    script: "Annual Area Report",
    assignedTo: "Lerato",
    reply: "No thanks",
    notes: "Opted out",
    followUpDue: false,
    score: 0,
    optedOut: true,
    source: "PropCon CSV",
    lastContacted: "2026-03-31",
  },
];

const assignees = ["Lerato", "Megan", "Unassigned"];
const statuses = ["All", "New", "Waiting", "Interested", "Appointment", "Do Not Contact"];

function renderTemplate(template: string, contact: Contact) {
  return template
    .replaceAll("{{name}}", contact.name || "there")
    .replaceAll("{{suburb}}", contact.suburb || contact.area || "your area");
}

function cleanPhoneForWhatsApp(phone: string) {
  return phone.replace(/\D/g, "");
}

function buildWhatsAppLink(phone: string, message: string) {
  return `https://wa.me/${cleanPhoneForWhatsApp(phone)}?text=${encodeURIComponent(message)}`;
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

function objectsToCsv(rows: Record<string, unknown>[]) {
  if (!rows.length) return "";
  const headers = Object.keys(rows[0]);
  const lines = [headers.join(",")];
  rows.forEach((row) => {
    lines.push(headers.map((h) => csvEscape(row[h])).join(","));
  });
  return lines.join("\n");
}

function downloadCsv(filename: string, content: string) {
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

export default function App() {
  const [contacts, setContacts] = useState<Contact[]>(contactsSeed);
  const [selectedId, setSelectedId] = useState("c3");
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("All");
  const [assigneeFilter, setAssigneeFilter] = useState("All");
  const [bulkScript, setBulkScript] = useState("Recent Sales");
  const [selectedScript, setSelectedScript] = useState("Property Value");
  const [selectedRows, setSelectedRows] = useState<Record<string, boolean>>({});
  const [activeTab, setActiveTab] = useState<TabKey>("workspace");
  const [csvName, setCsvName] = useState("No file selected");
  const fileRef = useRef<HTMLInputElement | null>(null);

  const selected = contacts.find((c) => c.id === selectedId) || contacts[0];

  const filtered = useMemo(() => {
    return contacts.filter((c) => {
      const haystack = [c.name, c.phone, c.suburb, c.address, c.notes, c.assignedTo].join(" ").toLowerCase();
      const matchesSearch = haystack.includes(search.toLowerCase());
      const matchesStatus = statusFilter === "All" ? true : c.status === statusFilter;
      const matchesAssignee = assigneeFilter === "All" ? true : c.assignedTo === assigneeFilter;
      return matchesSearch && matchesStatus && matchesAssignee;
    });
  }, [contacts, search, statusFilter, assigneeFilter]);

  const metrics = useMemo(() => {
    const total = contacts.length;
    const interested = contacts.filter((c) => c.status === "Interested").length;
    const appointments = contacts.filter((c) => c.status === "Appointment").length;
    const replies = contacts.filter((c) => c.reply && c.reply !== "Seen, no reply").length;
    const due = contacts.filter((c) => c.followUpDue && !c.optedOut).length;
    return {
      total,
      interested,
      appointments,
      due,
      replyRate: total ? Math.round((replies / total) * 100) : 0,
      conversionRate: interested ? Math.round((appointments / interested) * 100) : 0,
    };
  }, [contacts]);

  const suburbRows = useMemo(() => {
    const map: Record<string, { suburb: string; total: number; interested: number; appointments: number }> = {};
    contacts.forEach((c) => {
      if (!map[c.suburb]) map[c.suburb] = { suburb: c.suburb, total: 0, interested: 0, appointments: 0 };
      map[c.suburb].total += 1;
      if (c.status === "Interested") map[c.suburb].interested += 1;
      if (c.status === "Appointment") map[c.suburb].appointments += 1;
    });
    return Object.values(map).sort((a, b) => b.total - a.total);
  }, [contacts]);

  const selectedCount = filtered.filter((c) => selectedRows[c.id]).length;
  const bulkRows = filtered.filter((c) => selectedRows[c.id]);
  const draftMessage = selected ? renderTemplate(scripts[selectedScript], selected) : "";

  const updateSelected = (patch: Partial<Contact>) => {
    if (!selected) return;
    setContacts((prev) => prev.map((c) => (c.id === selected.id ? { ...c, ...patch } : c)));
  };

  const markStatus = (status: ContactStatus) => {
    if (!selected) return;
    const score = status === "Interested" ? 8 : status === "Appointment" ? 15 : 0;
    updateSelected({ status, score, optedOut: status === "Do Not Contact" });
  };

  const copyMessage = async () => {
    if (!draftMessage) return;
    try {
      await navigator.clipboard.writeText(draftMessage);
      alert("Message copied");
    } catch {
      alert("Could not copy message");
    }
  };

  const openWhatsApp = () => {
    if (!selected) return;
    window.open(buildWhatsAppLink(selected.phone, draftMessage), "_blank");
  };

  const nextContact = () => {
    const currentIndex = filtered.findIndex((c) => c.id === selected.id);
    if (currentIndex >= 0 && currentIndex < filtered.length - 1) {
      const next = filtered[currentIndex + 1];
      setSelectedId(next.id);
      setSelectedScript(next.script);
    } else {
      alert("No more contacts in this filtered list");
    }
  };

  const handleImportClick = () => fileRef.current?.click();

  const handleCsvFile = async (file: File | null) => {
    if (!file) return;
    setCsvName(file.name);
    const text = await file.text();
    const rows = parseCsv(text);
    if (rows.length < 2) return;

    const headers = rows[0].map((h) => String(h || "").trim().toLowerCase());
    const body = rows.slice(1).filter((r) => r.some((cell) => String(cell || "").trim() !== ""));

    const imported = body.map((row, index): Contact => {
      const get = (candidates: string[]) => {
        const idx = headers.findIndex((h) => candidates.some((cand) => h.includes(cand)));
        return idx >= 0 ? String(row[idx] || "").trim() : "";
      };

      return {
        id: `imp-${Date.now()}-${index}`,
        name: get(["name", "owner", "contact"]),
        phone: get(["phone", "mobile", "cell", "whatsapp"]),
        suburb: get(["suburb", "area", "location"]),
        area: get(["area", "suburb"]),
        address: get(["address", "street"]),
        status: "New",
        script: "Recent Sales",
        assignedTo: "Unassigned",
        reply: "",
        notes: get(["notes", "comments", "memo"]),
        followUpDue: true,
        score: 0,
        optedOut: false,
        source: "PropCon CSV",
        lastContacted: "",
      };
    }).filter((r) => r.name || r.phone || r.address);

    if (imported.length) {
      setContacts((prev) => [...imported, ...prev]);
      setSelectedId(imported[0].id);
      setSelectedScript(imported[0].script);
      setActiveTab("workspace");
    }
  };

  const exportBatch = () => {
    const rows = bulkRows.map((row) => ({
      Name: row.name,
      Phone: row.phone,
      Suburb: row.suburb,
      Address: row.address,
      Message: renderTemplate(scripts[bulkScript], row),
      AssignedTo: row.assignedTo,
      Status: row.status,
    }));
    downloadCsv("propcon_whatsapp_batch.csv", objectsToCsv(rows));
  };

  const exportRegister = () => {
    const rows = contacts.map((c) => ({
      Name: c.name,
      Phone: c.phone,
      Suburb: c.suburb,
      Area: c.area,
      Address: c.address,
      Status: c.status,
      Script: c.script,
      AssignedTo: c.assignedTo,
      Reply: c.reply,
      Notes: c.notes,
      FollowUpDue: c.followUpDue ? "Yes" : "No",
      OptedOut: c.optedOut ? "Yes" : "No",
      Source: c.source,
      LastContacted: c.lastContacted || "",
    }));
    downloadCsv("propcon_canvassing_register.csv", objectsToCsv(rows));
  };

  return (
    <div className="min-h-screen bg-slate-50 p-4 md:p-8">
      <input ref={fileRef} type="file" accept=".csv,text/csv" className="hidden" onChange={(e) => void handleCsvFile(e.target.files?.[0] || null)} />

      <div className="mx-auto max-w-7xl space-y-6">
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} className="grid gap-4 lg:grid-cols-[1.35fr_.85fr]">
          <section className="rounded-3xl border bg-white p-6 shadow-sm">
            <div className="mb-3 flex flex-wrap gap-2">
              <Badge>Production System</Badge>
              <OutlineBadge>PropCon Friendly</OutlineBadge>
              <OutlineBadge>WhatsApp Workflow</OutlineBadge>
            </div>
            <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
              <div>
                <h1 className="text-3xl font-semibold tracking-tight md:text-4xl">StephZara Canvasser Hub</h1>
                <p className="mt-2 max-w-2xl text-sm text-slate-600 md:text-base">
                  Full production-style interface for importing PropCon leads, preparing copy-ready WhatsApp messages, assigning canvassers, managing follow-ups, and tracking suburb performance.
                </p>
              </div>
              <div className="flex flex-wrap gap-2">
                <ActionButton primary onClick={handleImportClick}><Upload size={16} /> Import CSV</ActionButton>
                <ActionButton onClick={exportRegister}><Download size={16} /> Export Register</ActionButton>
              </div>
            </div>
            <div className="mt-6 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
              <MetricCard icon={<Users size={16} />} title="Contacts" value={String(metrics.total)} subtitle="active records" />
              <MetricCard icon={<MessageSquare size={16} />} title="Reply Rate" value={`${metrics.replyRate}%`} subtitle="engaged replies" />
              <MetricCard icon={<CalendarDays size={16} />} title="Appointments" value={String(metrics.appointments)} subtitle="booked leads" />
              <MetricCard icon={<Bell size={16} />} title="Follow-ups" value={String(metrics.due)} subtitle="due today" />
            </div>
          </section>

          <section className="rounded-3xl border bg-white p-6 shadow-sm">
            <div className="mb-4">
              <h3 className="flex items-center gap-2 text-lg font-semibold"><ShieldCheck size={18} /> Safe canvassing rules</h3>
              <p className="mt-1 text-sm text-slate-600">Designed for a real human canvasser workflow.</p>
            </div>
            <Rule>Start with short text-only outreach.</Rule>
            <Rule>Only send reports or images after a reply.</Rule>
            <Rule>Opt-out instantly on NO or stop request.</Rule>
            <Rule>Use suburb-based campaigns to stay focused.</Rule>
            <Rule>Managers review due follow-ups daily.</Rule>
            <div className="mt-3 rounded-2xl bg-slate-100 p-4">
              <div className="mb-1 flex items-center gap-2 font-medium"><Bot size={16} /> Bot handoff path</div>
              <div className="text-xs text-slate-600">Intro message → reply detected → canvasser takeover → appointment or archive</div>
            </div>
          </section>
        </motion.div>

        <div className="grid grid-cols-2 gap-2 rounded-2xl border bg-white p-2 shadow-sm md:grid-cols-5">
          {(["workspace", "import", "bulk", "manager", "settings"] as TabKey[]).map((tab) => (
            <button
              key={tab}
              className={`rounded-xl px-4 py-3 text-sm font-medium ${activeTab === tab ? "bg-slate-100 text-slate-900" : "text-slate-500"}`}
              onClick={() => setActiveTab(tab)}
            >
              {tab === "workspace" ? "Workspace" : tab === "import" ? "Import" : tab === "bulk" ? "Bulk Export" : tab === "manager" ? "Manager" : "Settings"}
            </button>
          ))}
        </div>

        {activeTab === "workspace" && (
          <div className="grid gap-6 lg:grid-cols-[1.05fr_.95fr]">
            <section className="rounded-3xl border bg-white p-6 shadow-sm">
              <div className="mb-4">
                <h3 className="text-xl font-semibold">Contact queue</h3>
                <p className="text-sm text-slate-600">Search and filter the live canvassing list.</p>
              </div>

              <div className="mb-4 flex flex-col gap-3 md:flex-row">
                <div className="flex flex-1 items-center gap-2 rounded-2xl border bg-slate-50 px-4 py-3">
                  <Search size={16} />
                  <input className="w-full bg-transparent outline-none" value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search name, suburb, phone, address..." />
                </div>
                <div className="flex items-center gap-2 rounded-2xl border bg-slate-50 px-4 py-3">
                  <Filter size={16} />
                  <select className="bg-transparent outline-none" value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
                    {statuses.map((status) => <option key={status} value={status}>{status}</option>)}
                  </select>
                </div>
                <div className="flex items-center gap-2 rounded-2xl border bg-slate-50 px-4 py-3">
                  <Users size={16} />
                  <select className="bg-transparent outline-none" value={assigneeFilter} onChange={(e) => setAssigneeFilter(e.target.value)}>
                    <option value="All">All assignees</option>
                    {assignees.map((name) => <option key={name} value={name}>{name}</option>)}
                  </select>
                </div>
              </div>

              <div className="max-h-[700px] space-y-3 overflow-auto pr-1">
                {filtered.map((contact) => (
                  <button
                    key={contact.id}
                    onClick={() => {
                      setSelectedId(contact.id);
                      setSelectedScript(contact.script);
                    }}
                    className={`w-full rounded-2xl border p-4 text-left transition ${selectedId === contact.id ? "border-slate-900 bg-slate-50" : "border-slate-200 bg-white hover:bg-slate-50"}`}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <div className="flex flex-wrap items-center gap-2">
                          <div className="font-medium">{contact.name}</div>
                          <StatusBadge status={contact.status} />
                          {contact.followUpDue && !contact.optedOut ? <OutlineBadge>Due</OutlineBadge> : null}
                          {contact.optedOut ? <OutlineBadge>Opted Out</OutlineBadge> : null}
                        </div>
                        <div className="mt-2 flex flex-wrap gap-3 text-sm text-slate-600">
                          <span className="inline-flex items-center gap-1"><Phone size={14} /> {contact.phone}</span>
                          <span className="inline-flex items-center gap-1"><MapPin size={14} /> {contact.suburb}</span>
                          <span className="inline-flex items-center gap-1"><Users size={14} /> {contact.assignedTo || "Unassigned"}</span>
                        </div>
                        <div className="mt-2 text-xs text-slate-500">{contact.address}</div>
                      </div>
                      <ChevronRight size={18} className="text-slate-400" />
                    </div>
                  </button>
                ))}
              </div>
            </section>

            <section className="rounded-3xl border bg-white p-6 shadow-sm">
              <div className="mb-4">
                <h3 className="text-xl font-semibold">Contact workspace</h3>
                <p className="text-sm text-slate-600">Production-style detail panel for your canvasser.</p>
              </div>

              {selected && (
                <>
                  <div className="rounded-3xl bg-slate-100 p-5">
                    <div className="flex flex-wrap items-center gap-2">
                      <h2 className="text-2xl font-semibold">{selected.name}</h2>
                      <StatusBadge status={selected.status} />
                      {selected.optedOut ? <OutlineBadge>Do Not Contact</OutlineBadge> : null}
                    </div>
                    <div className="mt-4 grid gap-3 md:grid-cols-2">
                      <InfoBox icon={<Phone size={15} />} label="Phone" value={selected.phone} />
                      <InfoBox icon={<MapPin size={15} />} label="Suburb" value={selected.suburb} />
                      <InfoBox icon={<MapPin size={15} />} label="Address" value={selected.address} />
                      <InfoBox icon={<Users size={15} />} label="Assigned To" value={selected.assignedTo} />
                    </div>
                  </div>

                  <div className="mt-4 grid gap-3 md:grid-cols-4">
                    <ActionButton onClick={() => markStatus("Waiting")}>Mark Waiting</ActionButton>
                    <ActionButton onClick={() => markStatus("Interested")}>Mark Interested</ActionButton>
                    <ActionButton primary onClick={() => markStatus("Appointment")}>Set Appointment</ActionButton>
                    <ActionButton danger onClick={() => markStatus("Do Not Contact")}><Ban size={16} /> Opt Out</ActionButton>
                  </div>

                  <div className="mt-4 grid gap-4 md:grid-cols-2">
                    <div>
                      <label className="mb-2 block text-xs font-medium uppercase tracking-wide text-slate-500">Script</label>
                      <select className="w-full rounded-2xl border bg-white px-4 py-3 outline-none" value={selectedScript} onChange={(e) => setSelectedScript(e.target.value)}>
                        {Object.keys(scripts).map((name) => <option key={name} value={name}>{name}</option>)}
                      </select>
                    </div>
                    <div>
                      <label className="mb-2 block text-xs font-medium uppercase tracking-wide text-slate-500">Assigned canvasser</label>
                      <select className="w-full rounded-2xl border bg-white px-4 py-3 outline-none" value={selected.assignedTo} onChange={(e) => updateSelected({ assignedTo: e.target.value })}>
                        {assignees.filter((a) => a !== "Unassigned").map((name) => <option key={name} value={name}>{name}</option>)}
                      </select>
                    </div>
                  </div>

                  <div className="mt-4">
                    <label className="mb-2 block text-xs font-medium uppercase tracking-wide text-slate-500">WhatsApp draft</label>
                    <textarea className="min-h-[150px] w-full rounded-2xl border bg-slate-50 p-4 outline-none" readOnly value={draftMessage} />
                  </div>

                  <div className="mt-4 grid gap-3 md:grid-cols-4">
                    <ActionButton onClick={copyMessage}><Copy size={16} /> Copy Message</ActionButton>
                    <ActionButton primary onClick={openWhatsApp}><MessageSquare size={16} /> Open WhatsApp</ActionButton>
                    <ActionButton onClick={() => updateSelected({ followUpDue: false, status: selected.status === "New" ? "Waiting" : selected.status, lastContacted: new Date().toISOString().slice(0, 10) })}><Send size={16} /> Log Send</ActionButton>
                    <ActionButton onClick={nextContact}><ArrowRight size={16} /> Next Contact</ActionButton>
                  </div>

                  <div className="mt-4 grid gap-4 md:grid-cols-2">
                    <div>
                      <label className="mb-2 block text-xs font-medium uppercase tracking-wide text-slate-500">Reply / last feedback</label>
                      <textarea className="min-h-[120px] w-full rounded-2xl border bg-white p-4 outline-none" value={selected.reply} onChange={(e) => updateSelected({ reply: e.target.value })} placeholder="Paste reply or summary..." />
                    </div>
                    <div>
                      <label className="mb-2 block text-xs font-medium uppercase tracking-wide text-slate-500">Canvasser notes</label>
                      <textarea className="min-h-[120px] w-full rounded-2xl border bg-white p-4 outline-none" value={selected.notes} onChange={(e) => updateSelected({ notes: e.target.value })} placeholder="Add call notes, seller timing, objections..." />
                    </div>
                  </div>
                </>
              )}
            </section>
          </div>
        )}

        {activeTab === "import" && (
          <div className="grid gap-6 lg:grid-cols-[.95fr_1.05fr]">
            <section className="rounded-3xl border bg-white p-6 shadow-sm">
              <div className="mb-4">
                <h3 className="text-xl font-semibold">PropCon import</h3>
                <p className="text-sm text-slate-600">Cleaner production import flow with CSV upload.</p>
              </div>
              <div className="rounded-3xl border border-dashed border-slate-300 p-8 text-center">
                <FileSpreadsheet className="mx-auto h-10 w-10 text-slate-400" />
                <div className="mt-3 text-sm font-medium">Selected file</div>
                <div className="mt-1 text-sm text-slate-500">{csvName}</div>
                <ActionButton primary onClick={handleImportClick}><Upload size={16} /> Choose CSV</ActionButton>
              </div>
              <div className="mt-4 grid gap-3 md:grid-cols-2">
                <MappedField field="Owner Name" value="name" />
                <MappedField field="Cell Number" value="phone" />
                <MappedField field="Suburb" value="suburb" />
                <MappedField field="Address" value="address" />
                <MappedField field="Notes" value="notes" />
                <MappedField field="Area" value="area" />
              </div>
            </section>

            <section className="rounded-3xl border bg-white p-6 shadow-sm">
              <div className="mb-4">
                <h3 className="text-xl font-semibold">Import preview</h3>
                <p className="text-sm text-slate-600">Example layout for incoming PropCon leads.</p>
              </div>
              <div className="overflow-auto rounded-3xl border">
                <table className="min-w-full text-sm">
                  <thead className="bg-slate-50">
                    <tr>
                      <TableHead>Name</TableHead>
                      <TableHead>Phone</TableHead>
                      <TableHead>Suburb</TableHead>
                      <TableHead>Address</TableHead>
                      <TableHead>Status</TableHead>
                    </tr>
                  </thead>
                  <tbody>
                    {contacts.slice(0, 5).map((row) => (
                      <tr key={row.id} className="border-t">
                        <TableCell>{row.name}</TableCell>
                        <TableCell>{row.phone}</TableCell>
                        <TableCell>{row.suburb}</TableCell>
                        <TableCell>{row.address}</TableCell>
                        <TableCell>{row.status}</TableCell>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </section>
          </div>
        )}

        {activeTab === "bulk" && (
          <div className="grid gap-6 lg:grid-cols-[1.05fr_.95fr]">
            <section className="rounded-3xl border bg-white p-6 shadow-sm">
              <div className="mb-4">
                <h3 className="text-xl font-semibold">Bulk export builder</h3>
                <p className="text-sm text-slate-600">Select contacts and prepare a PropCon-friendly batch.</p>
              </div>

              <div className="mb-4 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                <div className="text-sm text-slate-600">{selectedCount} selected from {filtered.length} filtered contacts</div>
                <div className="flex gap-2">
                  <ActionButton onClick={() => {
                    const next: Record<string, boolean> = {};
                    filtered.forEach((c) => { next[c.id] = true; });
                    setSelectedRows(next);
                  }}>Select all</ActionButton>
                  <ActionButton onClick={() => setSelectedRows({})}>Clear</ActionButton>
                </div>
              </div>

              <div className="mb-4 grid gap-3 md:grid-cols-[1fr_auto_auto] md:items-end">
                <div>
                  <label className="mb-2 block text-xs font-medium uppercase tracking-wide text-slate-500">Bulk script</label>
                  <select className="w-full rounded-2xl border bg-white px-4 py-3 outline-none" value={bulkScript} onChange={(e) => setBulkScript(e.target.value)}>
                    {Object.keys(scripts).map((name) => <option key={name} value={name}>{name}</option>)}
                  </select>
                </div>
                <ActionButton onClick={() => void navigator.clipboard.writeText(bulkRows.map((c) => `${c.name}\t${c.phone}\t${c.suburb}\t${c.address}\t${renderTemplate(scripts[bulkScript], c)}`).join("\n"))}><Copy size={16} /> Copy Rows</ActionButton>
                <ActionButton primary onClick={exportBatch}><Download size={16} /> Export CSV</ActionButton>
              </div>

              <div className="overflow-auto rounded-3xl border">
                <table className="min-w-full text-sm">
                  <thead className="bg-slate-50">
                    <tr>
                      <TableHead></TableHead>
                      <TableHead>Name</TableHead>
                      <TableHead>Phone</TableHead>
                      <TableHead>Suburb</TableHead>
                      <TableHead>Assigned</TableHead>
                      <TableHead>Status</TableHead>
                    </tr>
                  </thead>
                  <tbody>
                    {filtered.map((row) => (
                      <tr key={row.id} className="border-t">
                        <TableCell><input type="checkbox" checked={!!selectedRows[row.id]} onChange={() => setSelectedRows((prev) => ({ ...prev, [row.id]: !prev[row.id] }))} /></TableCell>
                        <TableCell>{row.name}</TableCell>
                        <TableCell>{row.phone}</TableCell>
                        <TableCell>{row.suburb}</TableCell>
                        <TableCell>{row.assignedTo}</TableCell>
                        <TableCell>{row.status}</TableCell>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </section>

            <section className="rounded-3xl border bg-white p-6 shadow-sm">
              <div className="mb-4">
                <h3 className="text-xl font-semibold">Export preview</h3>
                <p className="text-sm text-slate-600">Copy-ready output for PropCon WhatsApp canvassing.</p>
              </div>
              <div className="space-y-3">
                {bulkRows.length ? bulkRows.map((row) => (
                  <div key={row.id} className="rounded-2xl border bg-white p-4 text-xs text-slate-700">
                    <div className="mb-2 flex items-center justify-between">
                      <div className="font-medium text-slate-900">{row.name}</div>
                      <OutlineBadge>{row.suburb}</OutlineBadge>
                    </div>
                    <div className="font-mono break-words">
                      {row.name} | {row.phone} | {row.suburb} | {row.address} | {renderTemplate(scripts[bulkScript], row)}
                    </div>
                  </div>
                )) : <div className="rounded-2xl bg-slate-100 p-8 text-center text-slate-600">Select contacts to preview the exported PropCon rows.</div>}
              </div>
            </section>
          </div>
        )}

        {activeTab === "manager" && (
          <div className="grid gap-6 lg:grid-cols-[1fr_1fr]">
            <section className="rounded-3xl border bg-white p-6 shadow-sm">
              <div className="mb-4">
                <h3 className="text-xl font-semibold">Suburb performance</h3>
                <p className="text-sm text-slate-600">Quick area-level overview for management.</p>
              </div>
              <div className="space-y-4">
                {suburbRows.map((row) => {
                  const rate = row.total ? Math.round((row.interested / row.total) * 100) : 0;
                  return (
                    <div key={row.suburb}>
                      <div className="mb-2 flex items-center justify-between text-sm">
                        <span>{row.suburb}</span>
                        <span>{row.appointments} appointments · {row.interested} interested</span>
                      </div>
                      <div className="h-3 overflow-hidden rounded-full bg-slate-200">
                        <div className="h-full rounded-full bg-slate-900" style={{ width: `${rate}%` }} />
                      </div>
                    </div>
                  );
                })}
              </div>
            </section>

            <section className="rounded-3xl border bg-white p-6 shadow-sm">
              <div className="mb-4">
                <h3 className="text-xl font-semibold">Team leaderboard</h3>
                <p className="text-sm text-slate-600">Simple canvasser performance snapshot.</p>
              </div>
              <div className="space-y-3">
                {assignees.filter((a) => a !== "Unassigned").map((name, index) => {
                  const rows = contacts.filter((c) => c.assignedTo === name);
                  const score = rows.reduce((sum, row) => sum + row.score, 0);
                  return (
                    <div key={name} className="rounded-2xl border bg-white p-4">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2 font-medium"><Star size={14} /> {index + 1}. {name}</div>
                        <Badge>{score} pts</Badge>
                      </div>
                      <div className="mt-3 grid grid-cols-3 gap-3 text-sm text-slate-600">
                        <MiniInfo label="Leads" value={rows.length} />
                        <MiniInfo label="Interested" value={rows.filter((r) => r.status === "Interested").length} />
                        <MiniInfo label="Appointments" value={rows.filter((r) => r.status === "Appointment").length} />
                      </div>
                    </div>
                  );
                })}
              </div>
            </section>
          </div>
        )}

        {activeTab === "settings" && (
          <div className="grid gap-6 lg:grid-cols-[1fr_1fr]">
            <section className="rounded-3xl border bg-white p-6 shadow-sm">
              <div className="mb-4">
                <h3 className="text-xl font-semibold">Runtime settings</h3>
                <p className="text-sm text-slate-600">Deployment-facing settings panel style.</p>
              </div>
              <div className="space-y-3 text-sm text-slate-700">
                <SettingRow label="Mode" value="Production UI Preview" />
                <SettingRow label="Data Source" value="PropCon CSV + Supabase ready" />
                <SettingRow label="Export Format" value="PropCon-friendly batch rows" />
                <SettingRow label="WhatsApp Flow" value="Human-first, copy/send workflow" />
              </div>
            </section>

            <section className="rounded-3xl border bg-white p-6 shadow-sm">
              <div className="mb-4">
                <h3 className="text-xl font-semibold">Next implementation layer</h3>
                <p className="text-sm text-slate-600">What this UI is ready to plug into next.</p>
              </div>
              <Rule>Supabase auth and roles</Rule>
              <Rule>CSV import persistence</Rule>
              <Rule>Audit history per contact</Rule>
              <Rule>Vercel deployment</Rule>
              <Rule>Optional approved WhatsApp API handoff</Rule>
            </section>
          </div>
        )}
      </div>
    </div>
  );
}

function Badge({ children }: { children: React.ReactNode }) {
  return <span className="inline-flex items-center rounded-full bg-slate-900 px-3 py-1 text-xs text-white">{children}</span>;
}

function OutlineBadge({ children }: { children: React.ReactNode }) {
  return <span className="inline-flex items-center rounded-full border px-3 py-1 text-xs text-slate-700">{children}</span>;
}

function StatusBadge({ status }: { status: ContactStatus }) {
  const styles: Record<ContactStatus, string> = {
    New: "bg-slate-100 text-slate-700",
    Waiting: "bg-amber-100 text-amber-800",
    Interested: "bg-emerald-100 text-emerald-800",
    Appointment: "bg-blue-100 text-blue-800",
    "Do Not Contact": "bg-rose-100 text-rose-800",
  };
  return <span className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-medium ${styles[status]}`}>{status}</span>;
}

function ActionButton({ children, primary, danger, onClick }: { children: React.ReactNode; primary?: boolean; danger?: boolean; onClick?: () => void }) {
  return (
    <button
      onClick={onClick}
      className={`inline-flex items-center justify-center gap-2 rounded-2xl px-4 py-3 text-sm font-medium transition ${danger ? "bg-rose-600 text-white" : primary ? "bg-slate-900 text-white" : "border bg-white text-slate-900"}`}
    >
      {children}
    </button>
  );
}

function MetricCard({ icon, title, value, subtitle }: { icon: React.ReactNode; title: string; value: string; subtitle: string }) {
  return (
    <div className="rounded-3xl bg-slate-100 p-4">
      <div className="flex items-center gap-2 text-xs text-slate-500">{icon} {title}</div>
      <div className="mt-1 text-2xl font-semibold">{value}</div>
      <div className="text-xs text-slate-500">{subtitle}</div>
    </div>
  );
}

function Rule({ children }: { children: React.ReactNode }) {
  return <div className="mt-3 rounded-2xl bg-slate-50 p-4 text-sm text-slate-700">{children}</div>;
}

function InfoBox({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <div className="rounded-2xl bg-white p-4 text-sm text-slate-700">
      <div className="mb-1 flex items-center gap-2 text-xs text-slate-500">{icon} {label}</div>
      <div className="font-medium text-slate-900">{value}</div>
    </div>
  );
}

function MappedField({ field, value }: { field: string; value: string }) {
  return (
    <div>
      <div className="mb-2 text-xs font-medium uppercase tracking-wide text-slate-500">{field}</div>
      <div className="rounded-2xl border bg-white px-4 py-3 text-sm text-slate-700">{value}</div>
    </div>
  );
}

function TableHead({ children }: { children: React.ReactNode }) {
  return <th className="px-4 py-3 text-left text-sm font-medium text-slate-600">{children}</th>;
}

function TableCell({ children }: { children: React.ReactNode }) {
  return <td className="px-4 py-3 text-sm text-slate-700">{children}</td>;
}

function MiniInfo({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-2xl bg-slate-100 p-3">
      <div className="text-xs text-slate-500">{label}</div>
      <div className="mt-1 font-semibold text-slate-900">{value}</div>
    </div>
  );
}

function SettingRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl bg-slate-50 p-4">
      <div className="text-xs text-slate-500">{label}</div>
      <div className="mt-1 font-medium text-slate-900">{value}</div>
    </div>
  );
}
