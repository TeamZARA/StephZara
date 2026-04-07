import React, { useMemo, useState } from "react";
import { motion } from "framer-motion";
import {
  Building2,
  Home,
  Search,
  Phone,
  MessageSquare,
  CalendarDays,
  Bell,
  Upload,
  Download,
  Filter,
  ChevronRight,
  Copy,
  Send,
  ArrowRight,
  Ban,
  MapPin,
  Users,
  BarChart3,
  CheckCircle2,
  Clock3,
  Star,
  Sparkles,
  FileSpreadsheet,
  LayoutGrid,
  ListChecks,
  Settings,
} from "lucide-react";

type ContactStatus = "New" | "Waiting" | "Interested" | "Appointment" | "Do Not Contact";
type ViewKey = "dashboard" | "workspace" | "pipeline" | "import" | "bulk" | "manager";

type Contact = {
  id: string;
  name: string;
  phone: string;
  suburb: string;
  address: string;
  status: ContactStatus;
  script: string;
  assignedTo: string;
  notes: string;
  reply: string;
  followUpDue: boolean;
  leadTemperature: "Cold" | "Warm" | "Hot";
  valuationRange: string;
  source: string;
};

const scripts: Record<string, string> = {
  "Buyer Enquiry": "Hi {{name}}, quick one — I’m working with a buyer looking in {{suburb}}. Would you consider selling if the price made sense?",
  "Recent Sales": "Hi {{name}}, I’ve just updated recent sales in {{suburb}}. Would you like me to send you what properties near you are selling for?",
  "Property Value": "Hi {{name}}, have you seen what homes in {{suburb}} are selling for lately?",
  "Annual Area Report": "Hi {{name}}, I’m sending out this year’s property update for {{suburb}}. Would you like me to send you the recent sales and area activity?",
  "Follow Up 1": "Hi {{name}}, just checking if you saw my previous message about {{suburb}}.",
  "Appointment Close": "Thanks {{name}}. I can arrange a quick no-obligation valuation for your property in {{suburb}}. What day would suit you best?",
};

const seed: Contact[] = [
  { id: "c1", name: "Janine Smith", phone: "+27 82 555 0141", suburb: "Durbanville", address: "12 Oak Street", status: "New", script: "Recent Sales", assignedTo: "Lerato", notes: "Fresh PropCon import", reply: "", followUpDue: true, leadTemperature: "Cold", valuationRange: "R3.8m - R4.2m", source: "PropCon CSV" },
  { id: "c2", name: "Peter Jacobs", phone: "+27 83 555 0198", suburb: "Blouberg", address: "85 Marine Road", status: "Waiting", script: "Buyer Enquiry", assignedTo: "Lerato", notes: "Follow-up today", reply: "Seen, no reply", followUpDue: true, leadTemperature: "Cold", valuationRange: "R5.5m - R6.1m", source: "PropCon CSV" },
  { id: "c3", name: "Ayesha Daniels", phone: "+27 81 555 0102", suburb: "Parklands", address: "44 Sandpiper Ave", status: "Interested", script: "Property Value", assignedTo: "Lerato", notes: "Warm lead", reply: "Yes, please send recent sales.", followUpDue: false, leadTemperature: "Warm", valuationRange: "R2.4m - R2.8m", source: "PropCon CSV" },
  { id: "c4", name: "Gavin Naidoo", phone: "+27 72 555 0135", suburb: "Table View", address: "17 Beach Road", status: "Appointment", script: "Appointment Close", assignedTo: "Megan", notes: "Valuation booked", reply: "We may sell later this year.", followUpDue: false, leadTemperature: "Hot", valuationRange: "R6.7m - R7.4m", source: "PropCon CSV" },
  { id: "c5", name: "Melissa van Wyk", phone: "+27 79 555 0180", suburb: "Milnerton", address: "23 Sunset Drive", status: "Do Not Contact", script: "Annual Area Report", assignedTo: "Lerato", notes: "Opted out", reply: "No thanks", followUpDue: false, leadTemperature: "Cold", valuationRange: "R4.1m - R4.5m", source: "PropCon CSV" },
];

const views: { key: ViewKey; label: string; icon: React.ComponentType<{ size?: number; className?: string }> }[] = [
  { key: "dashboard", label: "Dashboard", icon: Home },
  { key: "workspace", label: "Workspace", icon: MessageSquare },
  { key: "pipeline", label: "Pipeline", icon: LayoutGrid },
  { key: "import", label: "Import", icon: Upload },
  { key: "bulk", label: "Bulk Export", icon: FileSpreadsheet },
  { key: "manager", label: "Manager", icon: BarChart3 },
];

const statuses: Array<ContactStatus | "All"> = ["All", "New", "Waiting", "Interested", "Appointment", "Do Not Contact"];
const assignees = ["All", "Lerato", "Megan", "Unassigned"];
const pipelineOrder: ContactStatus[] = ["New", "Waiting", "Interested", "Appointment", "Do Not Contact"];

function initials(name: string) {
  return name.split(" ").map((p) => p[0]).join("").slice(0, 2).toUpperCase();
}

function renderTemplate(template: string, contact: Contact) {
  return template.replace(/\{\{name\}\}/g, contact.name).replace(/\{\{suburb\}\}/g, contact.suburb);
}

function cleanPhone(phone: string) {
  return phone.replace(/\D/g, "");
}

function whatsappUrl(phone: string, message: string) {
  return `https://wa.me/${cleanPhone(phone)}?text=${encodeURIComponent(message)}`;
}

function badgeClasses(status: ContactStatus) {
  if (status === "New") return "bg-slate-100 text-slate-700 border-slate-200";
  if (status === "Waiting") return "bg-amber-100 text-amber-800 border-amber-200";
  if (status === "Interested") return "bg-emerald-100 text-emerald-800 border-emerald-200";
  if (status === "Appointment") return "bg-sky-100 text-sky-800 border-sky-200";
  return "bg-rose-100 text-rose-800 border-rose-200";
}

function tempClasses(temp: Contact["leadTemperature"]) {
  if (temp === "Hot") return "bg-rose-500";
  if (temp === "Warm") return "bg-amber-500";
  return "bg-slate-400";
}

export default function App() {
  const [contacts, setContacts] = useState<Contact[]>(seed);
  const [view, setView] = useState<ViewKey>("dashboard");
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<ContactStatus | "All">("All");
  const [assigneeFilter, setAssigneeFilter] = useState("All");
  const [selectedId, setSelectedId] = useState("c3");
  const [selectedScript, setSelectedScript] = useState("Property Value");
  const [bulkSelected, setBulkSelected] = useState<Record<string, boolean>>({});
  const [csvName, setCsvName] = useState("propcon_leads_april.csv");

  const filtered = useMemo(() => {
    return contacts.filter((c) => {
      const hay = `${c.name} ${c.phone} ${c.suburb} ${c.address} ${c.assignedTo}`.toLowerCase();
      const searchMatch = hay.includes(search.toLowerCase());
      const statusMatch = statusFilter === "All" ? true : c.status === statusFilter;
      const assigneeMatch = assigneeFilter === "All" ? true : c.assignedTo === assigneeFilter;
      return searchMatch && statusMatch && assigneeMatch;
    });
  }, [contacts, search, statusFilter, assigneeFilter]);

  const selected = filtered.find((c) => c.id === selectedId) || contacts.find((c) => c.id === selectedId) || contacts[0];
  const draftMessage = selected ? renderTemplate(scripts[selectedScript], selected) : "";

  const stats = useMemo(() => {
    const total = contacts.length;
    const interested = contacts.filter((c) => c.status === "Interested").length;
    const appointments = contacts.filter((c) => c.status === "Appointment").length;
    const due = contacts.filter((c) => c.followUpDue && c.status !== "Do Not Contact").length;
    const warm = contacts.filter((c) => c.leadTemperature !== "Cold").length;
    return { total, interested, appointments, due, warm };
  }, [contacts]);

  const suburbStats = useMemo(() => {
    const map: Record<string, { suburb: string; total: number; interested: number; appointments: number }> = {};
    contacts.forEach((c) => {
      if (!map[c.suburb]) map[c.suburb] = { suburb: c.suburb, total: 0, interested: 0, appointments: 0 };
      map[c.suburb].total += 1;
      if (c.status === "Interested") map[c.suburb].interested += 1;
      if (c.status === "Appointment") map[c.suburb].appointments += 1;
    });
    return Object.values(map);
  }, [contacts]);

  const pipeline = useMemo(() => pipelineOrder.map((status) => ({ status, items: filtered.filter((c) => c.status === status) })), [filtered]);

  const copyMessage = async () => {
    try {
      await navigator.clipboard.writeText(draftMessage);
      alert("Message copied");
    } catch {
      alert("Could not copy message");
    }
  };

  const openWhatsApp = () => {
    if (!selected) return;
    window.open(whatsappUrl(selected.phone, draftMessage), "_blank");
  };

  const nextContact = () => {
    const idx = filtered.findIndex((c) => c.id === selected.id);
    if (idx >= 0 && idx < filtered.length - 1) {
      const next = filtered[idx + 1];
      setSelectedId(next.id);
      setSelectedScript(next.script);
    } else {
      alert("No more contacts in this filtered list");
    }
  };

  const markStatus = (status: ContactStatus) => {
    setContacts((prev) => prev.map((c) => c.id === selected.id ? { ...c, status, followUpDue: status === "Waiting", leadTemperature: status === "Appointment" ? "Hot" : status === "Interested" ? "Warm" : c.leadTemperature } : c));
  };

  const exportBulk = () => {
    const rows = filtered.filter((c) => bulkSelected[c.id]).map((c) => `${c.name},${c.phone},${c.suburb},${c.address},${renderTemplate(scripts[selectedScript], c)}`);
    const csv = ["Name,Phone,Suburb,Address,Message", ...rows].join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "propcon_bulk_export.csv";
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="min-h-screen bg-[linear-gradient(135deg,#f8fbff_0%,#eef4ff_35%,#f8fafc_100%)] text-slate-900">
      <div className="grid min-h-screen lg:grid-cols-[260px_1fr]">
        <aside className="border-r border-slate-200 bg-[#0f172a] text-white">
          <div className="border-b border-white/10 px-6 py-6">
            <div className="flex items-center gap-3">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-cyan-400 to-blue-500 shadow-lg">
                <Building2 size={24} />
              </div>
              <div>
                <div className="text-lg font-semibold">StephZara</div>
                <div className="text-xs text-slate-300">PropCon CRM</div>
              </div>
            </div>
          </div>

          <div className="px-4 py-5">
            <div className="mb-3 px-3 text-xs uppercase tracking-[0.2em] text-slate-400">Navigation</div>
            <div className="space-y-2">
              {views.map(({ key, label, icon: Icon }) => (
                <button
                  key={key}
                  onClick={() => setView(key)}
                  className={`flex w-full items-center gap-3 rounded-2xl px-4 py-3 text-left text-sm transition ${view === key ? "bg-white text-slate-900 shadow-lg" : "text-slate-300 hover:bg-white/10 hover:text-white"}`}
                >
                  <Icon size={18} />
                  <span>{label}</span>
                </button>
              ))}
            </div>
          </div>

          <div className="px-4 py-2">
            <div className="rounded-3xl bg-white/5 p-4">
              <div className="mb-2 flex items-center gap-2 text-sm font-medium"><Sparkles size={16} /> Daily Targets</div>
              <div className="space-y-3 text-sm text-slate-300">
                <div className="flex items-center justify-between"><span>Follow-ups</span><span>{stats.due}</span></div>
                <div className="flex items-center justify-between"><span>Warm leads</span><span>{stats.warm}</span></div>
                <div className="flex items-center justify-between"><span>Appointments</span><span>{stats.appointments}</span></div>
              </div>
            </div>
          </div>
        </aside>

        <main className="p-5 md:p-8">
          <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="mx-auto max-w-7xl space-y-6">
            <section className="overflow-hidden rounded-[32px] border border-slate-200 bg-white shadow-[0_25px_80px_rgba(15,23,42,0.08)]">
              <div className="bg-[linear-gradient(120deg,#0f172a_0%,#1d4ed8_45%,#06b6d4_100%)] px-6 py-7 text-white md:px-8">
                <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                  <div>
                    <div className="mb-2 inline-flex items-center gap-2 rounded-full bg-white/15 px-3 py-1 text-xs font-medium backdrop-blur"><Sparkles size={14} /> Production CRM View</div>
                    <h1 className="text-3xl font-semibold md:text-5xl">PropCon Canvassing Workspace</h1>
                    <p className="mt-2 max-w-3xl text-sm text-cyan-50 md:text-base">
                      A brighter CRM-style interface with pipeline cards, suburb tracking, canvasser workspace, and fast WhatsApp actions.
                    </p>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <button className="inline-flex items-center gap-2 rounded-2xl bg-white px-4 py-3 text-sm font-medium text-slate-900 shadow"><Upload size={16} /> Import CSV</button>
                    <button className="inline-flex items-center gap-2 rounded-2xl bg-white/15 px-4 py-3 text-sm font-medium text-white backdrop-blur"><Download size={16} /> Export Register</button>
                  </div>
                </div>
              </div>

              <div className="grid gap-4 px-6 py-5 md:grid-cols-2 xl:grid-cols-5 md:px-8">
                <StatCard title="Contacts" value={String(stats.total)} icon={<Users size={18} />} tone="slate" />
                <StatCard title="Warm Leads" value={String(stats.warm)} icon={<Star size={18} />} tone="amber" />
                <StatCard title="Interested" value={String(stats.interested)} icon={<MessageSquare size={18} />} tone="emerald" />
                <StatCard title="Appointments" value={String(stats.appointments)} icon={<CalendarDays size={18} />} tone="blue" />
                <StatCard title="Follow-ups Due" value={String(stats.due)} icon={<Bell size={18} />} tone="rose" />
              </div>
            </section>

            {view === "dashboard" && (
              <div className="grid gap-6 xl:grid-cols-[1.2fr_.8fr]">
                <section className="rounded-[32px] border border-slate-200 bg-white p-6 shadow-sm">
                  <div className="mb-4 flex items-center justify-between">
                    <div>
                      <h2 className="text-xl font-semibold">Today’s command center</h2>
                      <p className="text-sm text-slate-500">Looks and feels more like a real CRM.</p>
                    </div>
                    <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-medium text-slate-700">Live queue</span>
                  </div>
                  <div className="grid gap-4 md:grid-cols-2">
                    <FocusCard title="Priority follow-ups" value={`${stats.due} leads`} subtitle="Needs action today" icon={<Clock3 size={18} />} color="from-rose-500 to-orange-400" />
                    <FocusCard title="Hot opportunities" value={`${contacts.filter((c) => c.leadTemperature === "Hot").length} leads`} subtitle="Ready for appointments" icon={<Sparkles size={18} />} color="from-amber-500 to-yellow-400" />
                    <FocusCard title="New imports" value={`${contacts.filter((c) => c.source === "PropCon CSV").length} records`} subtitle="Latest campaign records" icon={<Upload size={18} />} color="from-sky-500 to-cyan-400" />
                    <FocusCard title="Manager view" value={`${stats.appointments} booked`} subtitle="Current valuation appointments" icon={<CheckCircle2 size={18} />} color="from-emerald-500 to-teal-400" />
                  </div>
                </section>

                <section className="rounded-[32px] border border-slate-200 bg-white p-6 shadow-sm">
                  <div className="mb-4 flex items-center justify-between">
                    <div>
                      <h2 className="text-xl font-semibold">Best next contact</h2>
                      <p className="text-sm text-slate-500">Fast action panel.</p>
                    </div>
                    <button onClick={() => setView("workspace")} className="rounded-2xl bg-slate-900 px-4 py-2 text-sm font-medium text-white">Open workspace</button>
                  </div>
                  <div className="rounded-[28px] bg-[linear-gradient(135deg,#eff6ff_0%,#ffffff_45%,#ecfeff_100%)] p-5">
                    <div className="flex items-center gap-3">
                      <Avatar name={selected.name} large />
                      <div>
                        <div className="text-lg font-semibold">{selected.name}</div>
                        <div className="text-sm text-slate-500">{selected.suburb} · {selected.valuationRange}</div>
                      </div>
                    </div>
                    <div className="mt-4 flex flex-wrap gap-2">
                      <StatusPill status={selected.status} />
                      <span className="rounded-full border border-slate-200 bg-white px-3 py-1 text-xs font-medium text-slate-600">{selected.assignedTo}</span>
                      <span className="rounded-full border border-slate-200 bg-white px-3 py-1 text-xs font-medium text-slate-600">{selected.leadTemperature}</span>
                    </div>
                    <div className="mt-5 grid gap-3 sm:grid-cols-2">
                      <button onClick={copyMessage} className="inline-flex items-center justify-center gap-2 rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-medium text-slate-900 shadow-sm"><Copy size={16} /> Copy Message</button>
                      <button onClick={openWhatsApp} className="inline-flex items-center justify-center gap-2 rounded-2xl bg-[linear-gradient(90deg,#10b981_0%,#06b6d4_100%)] px-4 py-3 text-sm font-medium text-white shadow-lg"><MessageSquare size={16} /> Open WhatsApp</button>
                    </div>
                  </div>
                </section>
              </div>
            )}

            {view === "workspace" && (
              <div className="grid gap-6 xl:grid-cols-[1fr_1.08fr]">
                <section className="rounded-[32px] border border-slate-200 bg-white p-6 shadow-sm">
                  <div className="mb-4 flex items-center justify-between">
                    <div>
                      <h2 className="text-xl font-semibold">Lead list</h2>
                      <p className="text-sm text-slate-500">PropCon records with CRM styling.</p>
                    </div>
                    <span className="rounded-full bg-blue-50 px-3 py-1 text-xs font-medium text-blue-700">{filtered.length} visible</span>
                  </div>

                  <div className="mb-4 flex flex-col gap-3 lg:flex-row">
                    <div className="flex flex-1 items-center gap-2 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 shadow-sm">
                      <Search size={16} className="text-slate-400" />
                      <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search name, suburb, phone..." className="w-full bg-transparent outline-none" />
                    </div>
                    <div className="flex items-center gap-2 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 shadow-sm">
                      <Filter size={16} className="text-slate-400" />
                      <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value as ContactStatus | "All")} className="bg-transparent outline-none">
                        {statuses.map((s) => <option key={s} value={s}>{s}</option>)}
                      </select>
                    </div>
                    <div className="flex items-center gap-2 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 shadow-sm">
                      <Users size={16} className="text-slate-400" />
                      <select value={assigneeFilter} onChange={(e) => setAssigneeFilter(e.target.value)} className="bg-transparent outline-none">
                        {assignees.map((a) => <option key={a} value={a}>{a}</option>)}
                      </select>
                    </div>
                  </div>

                  <div className="max-h-[780px] space-y-3 overflow-auto pr-1">
                    {filtered.map((contact) => (
                      <button
                        key={contact.id}
                        onClick={() => {
                          setSelectedId(contact.id);
                          setSelectedScript(contact.script);
                        }}
                        className={`w-full rounded-[26px] border p-4 text-left transition ${selected.id === contact.id ? "border-blue-300 bg-[linear-gradient(135deg,#eff6ff_0%,#ffffff_55%,#ecfeff_100%)] shadow-md" : "border-slate-200 bg-white hover:-translate-y-0.5 hover:shadow-md"}`}
                      >
                        <div className="flex items-start justify-between gap-3">
                          <div className="flex items-start gap-3">
                            <Avatar name={contact.name} />
                            <div>
                              <div className="flex flex-wrap items-center gap-2">
                                <div className="font-semibold text-slate-900">{contact.name}</div>
                                <StatusPill status={contact.status} />
                                {contact.followUpDue && contact.status !== "Do Not Contact" ? <span className="rounded-full bg-rose-50 px-2.5 py-1 text-[11px] font-medium text-rose-700">Due</span> : null}
                              </div>
                              <div className="mt-2 flex flex-wrap gap-3 text-sm text-slate-500">
                                <span className="inline-flex items-center gap-1"><Phone size={14} /> {contact.phone}</span>
                                <span className="inline-flex items-center gap-1"><MapPin size={14} /> {contact.suburb}</span>
                              </div>
                              <div className="mt-2 text-xs text-slate-500">{contact.address}</div>
                              <div className="mt-3 flex items-center gap-2">
                                <span className={`h-2.5 w-2.5 rounded-full ${tempClasses(contact.leadTemperature)}`} />
                                <span className="text-xs font-medium text-slate-600">{contact.leadTemperature}</span>
                                <span className="text-xs text-slate-400">•</span>
                                <span className="text-xs text-slate-500">{contact.assignedTo}</span>
                              </div>
                            </div>
                          </div>
                          <ChevronRight size={18} className="text-slate-400" />
                        </div>
                      </button>
                    ))}
                  </div>
                </section>

                <section className="rounded-[32px] border border-slate-200 bg-white p-6 shadow-sm">
                  <div className="mb-4 flex items-center justify-between gap-4">
                    <div>
                      <h2 className="text-xl font-semibold">Client card</h2>
                      <p className="text-sm text-slate-500">Feels more like a CRM deal card than plain text.</p>
                    </div>
                    <button onClick={nextContact} className="inline-flex items-center gap-2 rounded-2xl bg-slate-900 px-4 py-3 text-sm font-medium text-white shadow"><ArrowRight size={16} /> Next</button>
                  </div>

                  <div className="rounded-[30px] bg-[linear-gradient(135deg,#eef2ff_0%,#ffffff_45%,#ecfeff_100%)] p-5">
                    <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
                      <div className="flex items-start gap-4">
                        <Avatar name={selected.name} large />
                        <div>
                          <div className="text-2xl font-semibold text-slate-900">{selected.name}</div>
                          <div className="mt-1 text-sm text-slate-500">{selected.address}</div>
                          <div className="mt-3 flex flex-wrap gap-2">
                            <StatusPill status={selected.status} />
                            <span className="rounded-full border border-slate-200 bg-white px-3 py-1 text-xs font-medium text-slate-600">{selected.leadTemperature}</span>
                            <span className="rounded-full border border-slate-200 bg-white px-3 py-1 text-xs font-medium text-slate-600">{selected.valuationRange}</span>
                          </div>
                        </div>
                      </div>
                      <div className="grid gap-2 sm:grid-cols-2">
                        <InfoTile icon={<Phone size={15} />} label="Phone" value={selected.phone} />
                        <InfoTile icon={<Users size={15} />} label="Agent" value={selected.assignedTo} />
                        <InfoTile icon={<MapPin size={15} />} label="Suburb" value={selected.suburb} />
                        <InfoTile icon={<Building2 size={15} />} label="Source" value={selected.source} />
                      </div>
                    </div>
                  </div>

                  <div className="mt-5 grid gap-3 sm:grid-cols-4">
                    <StatusAction label="Mark Waiting" onClick={() => markStatus("Waiting")} />
                    <StatusAction label="Mark Interested" onClick={() => markStatus("Interested")} tone="emerald" />
                    <StatusAction label="Set Appointment" onClick={() => markStatus("Appointment")} tone="blue" />
                    <StatusAction label="Opt Out" onClick={() => markStatus("Do Not Contact")} tone="rose" icon={<Ban size={14} />} />
                  </div>

                  <div className="mt-5 grid gap-4 md:grid-cols-2">
                    <div>
                      <label className="mb-2 block text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">Script</label>
                      <select value={selectedScript} onChange={(e) => setSelectedScript(e.target.value)} className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 shadow-sm outline-none">
                        {Object.keys(scripts).map((s) => <option key={s} value={s}>{s}</option>)}
                      </select>
                    </div>
                    <div>
                      <label className="mb-2 block text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">Assigned canvasser</label>
                      <select value={selected.assignedTo} onChange={(e) => setContacts((prev) => prev.map((c) => c.id === selected.id ? { ...c, assignedTo: e.target.value } : c))} className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 shadow-sm outline-none">
                        {assignees.filter((a) => a !== "All").map((a) => <option key={a} value={a}>{a}</option>)}
                      </select>
                    </div>
                  </div>

                  <div className="mt-5 rounded-[28px] border border-slate-200 bg-[linear-gradient(135deg,#ffffff_0%,#ecfdf5_100%)] p-4 shadow-sm">
                    <div className="mb-3 flex items-center justify-between">
                      <div className="text-sm font-semibold text-slate-800">WhatsApp Message</div>
                      <span className="rounded-full bg-white px-3 py-1 text-xs font-medium text-slate-600 shadow-sm">{selectedScript}</span>
                    </div>
                    <textarea value={draftMessage} readOnly className="min-h-[170px] w-full rounded-2xl border border-slate-200 bg-white p-4 text-sm shadow-inner outline-none" />
                    <div className="mt-4 grid gap-3 sm:grid-cols-3">
                      <button onClick={copyMessage} className="inline-flex items-center justify-center gap-2 rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-medium text-slate-900 shadow-sm"><Copy size={16} /> Copy Message</button>
                      <button onClick={openWhatsApp} className="inline-flex items-center justify-center gap-2 rounded-2xl bg-[linear-gradient(90deg,#10b981_0%,#06b6d4_100%)] px-4 py-3 text-sm font-medium text-white shadow-lg"><MessageSquare size={16} /> Open WhatsApp</button>
                      <button onClick={() => alert("Message logged")} className="inline-flex items-center justify-center gap-2 rounded-2xl bg-[linear-gradient(90deg,#0f172a_0%,#334155_100%)] px-4 py-3 text-sm font-medium text-white shadow"><Send size={16} /> Log Send</button>
                    </div>
                  </div>

                  <div className="mt-5 grid gap-4 md:grid-cols-2">
                    <div>
                      <label className="mb-2 block text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">Reply / Feedback</label>
                      <textarea value={selected.reply} onChange={(e) => setContacts((prev) => prev.map((c) => c.id === selected.id ? { ...c, reply: e.target.value } : c))} className="min-h-[120px] w-full rounded-2xl border border-slate-200 bg-white p-4 text-sm shadow-sm outline-none" />
                    </div>
                    <div>
                      <label className="mb-2 block text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">Notes</label>
                      <textarea value={selected.notes} onChange={(e) => setContacts((prev) => prev.map((c) => c.id === selected.id ? { ...c, notes: e.target.value } : c))} className="min-h-[120px] w-full rounded-2xl border border-slate-200 bg-white p-4 text-sm shadow-sm outline-none" />
                    </div>
                  </div>
                </section>
              </div>
            )}

            {view === "pipeline" && (
              <div className="grid gap-4 xl:grid-cols-5">
                {pipeline.map((column) => (
                  <section key={column.status} className="rounded-[30px] border border-slate-200 bg-white p-4 shadow-sm">
                    <div className="mb-4 flex items-center justify-between">
                      <div className="font-semibold text-slate-900">{column.status}</div>
                      <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-medium text-slate-700">{column.items.length}</span>
                    </div>
                    <div className="space-y-3">
                      {column.items.map((contact) => (
                        <button key={contact.id} onClick={() => { setSelectedId(contact.id); setSelectedScript(contact.script); setView("workspace"); }} className="w-full rounded-2xl border border-slate-200 bg-[linear-gradient(135deg,#ffffff_0%,#f8fafc_100%)] p-4 text-left shadow-sm transition hover:-translate-y-0.5 hover:shadow-md">
                          <div className="flex items-center gap-3">
                            <Avatar name={contact.name} />
                            <div className="min-w-0">
                              <div className="truncate font-medium text-slate-900">{contact.name}</div>
                              <div className="truncate text-xs text-slate-500">{contact.suburb}</div>
                            </div>
                          </div>
                          <div className="mt-3 flex items-center justify-between">
                            <span className="text-xs text-slate-500">{contact.assignedTo}</span>
                            <span className={`h-2.5 w-2.5 rounded-full ${tempClasses(contact.leadTemperature)}`} />
                          </div>
                        </button>
                      ))}
                    </div>
                  </section>
                ))}
              </div>
            )}

            {view === "import" && (
              <div className="grid gap-6 xl:grid-cols-[0.92fr_1.08fr]">
                <section className="rounded-[32px] border border-slate-200 bg-white p-6 shadow-sm">
                  <div className="mb-4">
                    <h2 className="text-xl font-semibold">PropCon Import</h2>
                    <p className="text-sm text-slate-500">Drag-and-drop style import panel feel.</p>
                  </div>
                  <div className="rounded-[30px] border-2 border-dashed border-cyan-200 bg-[linear-gradient(135deg,#eff6ff_0%,#ecfeff_100%)] p-10 text-center">
                    <FileSpreadsheet className="mx-auto mb-3 text-cyan-600" size={38} />
                    <div className="text-lg font-semibold text-slate-900">{csvName}</div>
                    <div className="mt-1 text-sm text-slate-500">Map your PropCon export to the CRM structure.</div>
                    <button className="mt-5 rounded-2xl bg-slate-900 px-4 py-3 text-sm font-medium text-white shadow"><Upload size={16} className="mr-2 inline" />Choose CSV</button>
                  </div>
                </section>
                <section className="rounded-[32px] border border-slate-200 bg-white p-6 shadow-sm">
                  <div className="mb-4">
                    <h2 className="text-xl font-semibold">Preview Table</h2>
                    <p className="text-sm text-slate-500">Shows how the imported records will appear.</p>
                  </div>
                  <div className="overflow-hidden rounded-[28px] border border-slate-200">
                    <table className="min-w-full text-sm">
                      <thead className="bg-slate-50">
                        <tr>
                          <th className="px-4 py-3 text-left font-medium text-slate-600">Name</th>
                          <th className="px-4 py-3 text-left font-medium text-slate-600">Phone</th>
                          <th className="px-4 py-3 text-left font-medium text-slate-600">Suburb</th>
                          <th className="px-4 py-3 text-left font-medium text-slate-600">Status</th>
                        </tr>
                      </thead>
                      <tbody>
                        {contacts.slice(0, 5).map((row) => (
                          <tr key={row.id} className="border-t bg-white">
                            <td className="px-4 py-3">{row.name}</td>
                            <td className="px-4 py-3">{row.phone}</td>
                            <td className="px-4 py-3">{row.suburb}</td>
                            <td className="px-4 py-3">{row.status}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </section>
              </div>
            )}

            {view === "bulk" && (
              <div className="grid gap-6 xl:grid-cols-[1.08fr_.92fr]">
                <section className="rounded-[32px] border border-slate-200 bg-white p-6 shadow-sm">
                  <div className="mb-4 flex items-center justify-between">
                    <div>
                      <h2 className="text-xl font-semibold">Bulk WhatsApp Export</h2>
                      <p className="text-sm text-slate-500">Prepare rows that are ready for canvassing.</p>
                    </div>
                    <button onClick={exportBulk} className="rounded-2xl bg-slate-900 px-4 py-3 text-sm font-medium text-white shadow"><Download size={16} className="mr-2 inline" />Export CSV</button>
                  </div>
                  <div className="overflow-hidden rounded-[28px] border border-slate-200">
                    <table className="min-w-full text-sm">
                      <thead className="bg-slate-50">
                        <tr>
                          <th className="px-4 py-3"></th>
                          <th className="px-4 py-3 text-left font-medium text-slate-600">Name</th>
                          <th className="px-4 py-3 text-left font-medium text-slate-600">Phone</th>
                          <th className="px-4 py-3 text-left font-medium text-slate-600">Suburb</th>
                        </tr>
                      </thead>
                      <tbody>
                        {filtered.map((row) => (
                          <tr key={row.id} className="border-t bg-white">
                            <td className="px-4 py-3"><input type="checkbox" checked={!!bulkSelected[row.id]} onChange={() => setBulkSelected((prev) => ({ ...prev, [row.id]: !prev[row.id] }))} /></td>
                            <td className="px-4 py-3">{row.name}</td>
                            <td className="px-4 py-3">{row.phone}</td>
                            <td className="px-4 py-3">{row.suburb}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </section>
                <section className="rounded-[32px] border border-slate-200 bg-white p-6 shadow-sm">
                  <div className="mb-4">
                    <h2 className="text-xl font-semibold">Preview</h2>
                    <p className="text-sm text-slate-500">See what the export will look like.</p>
                  </div>
                  <div className="space-y-3">
                    {filtered.filter((c) => bulkSelected[c.id]).length ? filtered.filter((c) => bulkSelected[c.id]).map((c) => (
                      <div key={c.id} className="rounded-2xl border border-slate-200 bg-[linear-gradient(135deg,#ffffff_0%,#f8fafc_100%)] p-4 shadow-sm">
                        <div className="mb-2 flex items-center justify-between">
                          <div className="font-medium text-slate-900">{c.name}</div>
                          <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-medium text-slate-700">{c.suburb}</span>
                        </div>
                        <div className="font-mono text-xs text-slate-600">{renderTemplate(scripts[selectedScript], c)}</div>
                      </div>
                    )) : <div className="rounded-2xl bg-slate-100 p-8 text-center text-slate-500">Select contacts to preview the export.</div>}
                  </div>
                </section>
              </div>
            )}

            {view === "manager" && (
              <div className="grid gap-6 xl:grid-cols-2">
                <section className="rounded-[32px] border border-slate-200 bg-white p-6 shadow-sm">
                  <div className="mb-4">
                    <h2 className="text-xl font-semibold">Suburb Performance</h2>
                    <p className="text-sm text-slate-500">Campaign strength by area.</p>
                  </div>
                  <div className="space-y-5">
                    {suburbStats.map((row) => {
                      const rate = row.total ? Math.round((row.interested / row.total) * 100) : 0;
                      return (
                        <div key={row.suburb}>
                          <div className="mb-2 flex items-center justify-between text-sm">
                            <span>{row.suburb}</span>
                            <span>{row.appointments} appts · {row.interested} interested</span>
                          </div>
                          <div className="h-3 overflow-hidden rounded-full bg-slate-200">
                            <div className="h-full rounded-full bg-[linear-gradient(90deg,#2563eb_0%,#06b6d4_100%)]" style={{ width: `${rate}%` }} />
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </section>
                <section className="rounded-[32px] border border-slate-200 bg-white p-6 shadow-sm">
                  <div className="mb-4">
                    <h2 className="text-xl font-semibold">Canvasser Leaderboard</h2>
                    <p className="text-sm text-slate-500">Simple view of current performance.</p>
                  </div>
                  <div className="space-y-3">
                    {["Lerato", "Megan"].map((name, i) => {
                      const rows = contacts.filter((c) => c.assignedTo === name);
                      return (
                        <div key={name} className="rounded-2xl border border-slate-200 bg-[linear-gradient(135deg,#ffffff_0%,#f8fafc_100%)] p-4 shadow-sm">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2 font-medium text-slate-900"><Star size={15} /> {i + 1}. {name}</div>
                            <span className="rounded-full bg-slate-900 px-3 py-1 text-xs font-medium text-white">{rows.length} leads</span>
                          </div>
                          <div className="mt-3 grid grid-cols-3 gap-3">
                            <MiniBox label="Interested" value={rows.filter((r) => r.status === "Interested").length} />
                            <MiniBox label="Appointments" value={rows.filter((r) => r.status === "Appointment").length} />
                            <MiniBox label="Due" value={rows.filter((r) => r.followUpDue).length} />
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </section>
              </div>
            )}
          </motion.div>
        </main>
      </div>
    </div>
  );
}

function Avatar({ name, large }: { name: string; large?: boolean }) {
  return <div className={`flex items-center justify-center rounded-2xl bg-[linear-gradient(135deg,#2563eb_0%,#06b6d4_100%)] font-semibold text-white shadow-lg ${large ? "h-14 w-14 text-base" : "h-11 w-11 text-sm"}`}>{initials(name)}</div>;
}

function StatCard({ title, value, icon, tone }: { title: string; value: string; icon: React.ReactNode; tone: "slate" | "amber" | "emerald" | "blue" | "rose" }) {
  const tones: Record<string, string> = {
    slate: "from-slate-50 to-slate-100 text-slate-900",
    amber: "from-amber-50 to-yellow-100 text-amber-900",
    emerald: "from-emerald-50 to-teal-100 text-emerald-900",
    blue: "from-sky-50 to-blue-100 text-sky-900",
    rose: "from-rose-50 to-orange-100 text-rose-900",
  };
  return (
    <div className={`rounded-[28px] border border-slate-200 bg-gradient-to-br p-5 shadow-sm ${tones[tone]}`}>
      <div className="flex items-center gap-2 text-sm font-medium opacity-80">{icon} {title}</div>
      <div className="mt-3 text-3xl font-semibold">{value}</div>
    </div>
  );
}

function FocusCard({ title, value, subtitle, icon, color }: { title: string; value: string; subtitle: string; icon: React.ReactNode; color: string }) {
  return (
    <div className="rounded-[28px] border border-slate-200 bg-white p-5 shadow-sm">
      <div className={`mb-3 inline-flex rounded-2xl bg-gradient-to-r px-3 py-2 text-white shadow ${color}`}>{icon}</div>
      <div className="text-sm font-medium text-slate-500">{title}</div>
      <div className="mt-2 text-2xl font-semibold text-slate-900">{value}</div>
      <div className="mt-1 text-xs text-slate-500">{subtitle}</div>
    </div>
  );
}

function StatusPill({ status }: { status: ContactStatus }) {
  return <span className={`rounded-full border px-3 py-1 text-xs font-medium ${badgeClasses(status)}`}>{status}</span>;
}

function InfoTile({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white px-4 py-3 shadow-sm">
      <div className="mb-1 flex items-center gap-2 text-xs text-slate-500">{icon} {label}</div>
      <div className="text-sm font-medium text-slate-900">{value}</div>
    </div>
  );
}

function StatusAction({ label, onClick, tone, icon }: { label: string; onClick: () => void; tone?: "emerald" | "blue" | "rose"; icon?: React.ReactNode }) {
  const style = tone === "emerald" ? "bg-emerald-600 text-white" : tone === "blue" ? "bg-blue-600 text-white" : tone === "rose" ? "bg-rose-600 text-white" : "border border-slate-200 bg-white text-slate-900";
  return <button onClick={onClick} className={`inline-flex items-center justify-center gap-2 rounded-2xl px-4 py-3 text-sm font-medium shadow-sm ${style}`}>{icon}{label}</button>;
}

function MiniBox({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-2xl bg-slate-100 p-3 text-center">
      <div className="text-xs text-slate-500">{label}</div>
      <div className="mt-1 text-lg font-semibold text-slate-900">{value}</div>
    </div>
  );
}
