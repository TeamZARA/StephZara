import React, { useMemo, useState } from "react";
import { motion } from "framer-motion";
import {
  Home,
  Users,
  MessageSquare,
  Phone,
  MapPin,
  CalendarDays,
  Bell,
  Search,
  Filter,
  Upload,
  Download,
  ArrowRight,
  Copy,
  Send,
  Sparkles,
  Building2,
  BarChart3,
  CheckCircle2,
  Flame,
  Clock3,
  ChevronRight,
  Star,
} from "lucide-react";

type Status = "New" | "Waiting" | "Interested" | "Appointment" | "Do Not Contact";
type View = "dashboard" | "leads" | "pipeline" | "bulk" | "manager";

type Lead = {
  id: string;
  name: string;
  phone: string;
  suburb: string;
  address: string;
  status: Status;
  assignee: string;
  temperature: "Cold" | "Warm" | "Hot";
  valueBand: string;
  notes: string;
  reply: string;
};

const leadsSeed: Lead[] = [
  { id: "1", name: "Janine Smith", phone: "+27 82 555 0141", suburb: "Durbanville", address: "12 Oak Street", status: "New", assignee: "Lerato", temperature: "Cold", valueBand: "R3.8m - R4.2m", notes: "Fresh PropCon import", reply: "" },
  { id: "2", name: "Peter Jacobs", phone: "+27 83 555 0198", suburb: "Blouberg", address: "85 Marine Road", status: "Waiting", assignee: "Lerato", temperature: "Cold", valueBand: "R5.5m - R6.1m", notes: "Follow-up today", reply: "Seen, no reply" },
  { id: "3", name: "Ayesha Daniels", phone: "+27 81 555 0102", suburb: "Parklands", address: "44 Sandpiper Ave", status: "Interested", assignee: "Lerato", temperature: "Warm", valueBand: "R2.4m - R2.8m", notes: "Warm lead", reply: "Please send recent sales." },
  { id: "4", name: "Gavin Naidoo", phone: "+27 72 555 0135", suburb: "Table View", address: "17 Beach Road", status: "Appointment", assignee: "Megan", temperature: "Hot", valueBand: "R6.7m - R7.4m", notes: "Valuation booked", reply: "Friday works." },
  { id: "5", name: "Melissa van Wyk", phone: "+27 79 555 0180", suburb: "Milnerton", address: "23 Sunset Drive", status: "Do Not Contact", assignee: "Lerato", temperature: "Cold", valueBand: "R4.1m - R4.5m", notes: "Opted out", reply: "No thanks" },
];

const scripts: Record<string, string> = {
  "Buyer Enquiry": "Hi {{name}}, quick one — I’m working with a buyer looking in {{suburb}}. Would you consider selling if the price made sense?",
  "Recent Sales": "Hi {{name}}, I’ve just updated recent sales in {{suburb}}. Would you like me to send you what properties near you are selling for?",
  "Property Value": "Hi {{name}}, have you seen what homes in {{suburb}} are selling for lately?",
  "Appointment Close": "Thanks {{name}}. I can arrange a quick no-obligation valuation for your property in {{suburb}}. What day would suit you best?",
};

const menu: { key: View; label: string; icon: React.ComponentType<any> }[] = [
  { key: "dashboard", label: "Dashboard", icon: Home },
  { key: "leads", label: "Lead Desk", icon: Users },
  { key: "pipeline", label: "Pipeline", icon: BarChart3 },
  { key: "bulk", label: "Bulk Send", icon: Upload },
  { key: "manager", label: "Manager", icon: CalendarDays },
];

function initials(name: string) {
  return name.split(" ").map((n) => n[0]).join("").slice(0, 2).toUpperCase();
}

function renderScript(template: string, lead: Lead) {
  return template.replace(/\{\{name\}\}/g, lead.name).replace(/\{\{suburb\}\}/g, lead.suburb);
}

function statusStyle(status: Status) {
  if (status === "New") return "bg-slate-100 text-slate-700 ring-slate-200";
  if (status === "Waiting") return "bg-amber-100 text-amber-800 ring-amber-200";
  if (status === "Interested") return "bg-emerald-100 text-emerald-800 ring-emerald-200";
  if (status === "Appointment") return "bg-sky-100 text-sky-800 ring-sky-200";
  return "bg-rose-100 text-rose-800 ring-rose-200";
}

function tempStyle(temp: Lead["temperature"]) {
  if (temp === "Hot") return "from-rose-500 to-orange-400";
  if (temp === "Warm") return "from-amber-400 to-yellow-300";
  return "from-slate-400 to-slate-300";
}

export default function PropconStyleCRM() {
  const [view, setView] = useState<View>("dashboard");
  const [search, setSearch] = useState("");
  const [leads, setLeads] = useState(leadsSeed);
  const [selectedId, setSelectedId] = useState("3");
  const [script, setScript] = useState("Property Value");
  const [selectedBulk, setSelectedBulk] = useState<Record<string, boolean>>({});

  const filtered = useMemo(() => {
    return leads.filter((lead) => {
      const hay = `${lead.name} ${lead.suburb} ${lead.phone} ${lead.address} ${lead.assignee}`.toLowerCase();
      return hay.includes(search.toLowerCase());
    });
  }, [leads, search]);

  const selected = filtered.find((l) => l.id === selectedId) || leads.find((l) => l.id === selectedId) || leads[0];
  const message = renderScript(scripts[script], selected);

  const stats = {
    total: leads.length,
    due: leads.filter((l) => l.status === "Waiting").length,
    hot: leads.filter((l) => l.temperature === "Hot").length,
    interested: leads.filter((l) => l.status === "Interested").length,
    appointments: leads.filter((l) => l.status === "Appointment").length,
  };

  const pipeline = ["New", "Waiting", "Interested", "Appointment", "Do Not Contact"].map((status) => ({
    status: status as Status,
    items: leads.filter((l) => l.status === status),
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
    const phone = selected.phone.replace(/\D/g, "");
    window.open(`https://wa.me/${phone}?text=${encodeURIComponent(message)}`, "_blank");
  };

  const nextLead = () => {
    const idx = filtered.findIndex((l) => l.id === selected.id);
    if (idx >= 0 && idx < filtered.length - 1) setSelectedId(filtered[idx + 1].id);
  };

  return (
    <div className="min-h-screen bg-[linear-gradient(135deg,#eaf3ff_0%,#f7fbff_35%,#f8fafc_100%)] text-slate-900">
      <div className="grid min-h-screen lg:grid-cols-[280px_1fr]">
        <aside className="relative overflow-hidden bg-[#0b1730] text-white">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(34,211,238,0.18),transparent_30%),radial-gradient(circle_at_bottom,rgba(59,130,246,0.18),transparent_35%)]" />
          <div className="relative border-b border-white/10 px-6 py-6">
            <div className="flex items-center gap-4">
              <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-[linear-gradient(135deg,#22d3ee_0%,#2563eb_100%)] shadow-[0_18px_40px_rgba(37,99,235,0.35)]">
                <Building2 size={28} />
              </div>
              <div>
                <div className="text-xl font-semibold">StephZara</div>
                <div className="text-xs text-cyan-100/80">PropCon-style CRM</div>
              </div>
            </div>
          </div>

          <div className="relative px-4 py-5">
            <div className="mb-3 px-3 text-[11px] uppercase tracking-[0.24em] text-cyan-100/60">Workspace</div>
            <div className="space-y-2">
              {menu.map(({ key, label, icon: Icon }) => (
                <button
                  key={key}
                  onClick={() => setView(key)}
                  className={`flex w-full items-center gap-3 rounded-2xl px-4 py-3 text-left text-sm transition ${view === key ? "bg-white text-slate-900 shadow-xl" : "text-slate-200 hover:bg-white/10 hover:text-white"}`}
                >
                  <Icon size={18} />
                  <span>{label}</span>
                </button>
              ))}
            </div>
          </div>

          <div className="relative px-4">
            <div className="rounded-[28px] border border-white/10 bg-white/5 p-4 backdrop-blur">
              <div className="mb-3 flex items-center gap-2 text-sm font-medium"><Flame size={16} /> Focus Today</div>
              <div className="grid gap-3 text-sm text-slate-200">
                <div className="flex items-center justify-between rounded-2xl bg-white/5 px-3 py-2"><span>Follow-ups</span><span>{stats.due}</span></div>
                <div className="flex items-center justify-between rounded-2xl bg-white/5 px-3 py-2"><span>Hot leads</span><span>{stats.hot}</span></div>
                <div className="flex items-center justify-between rounded-2xl bg-white/5 px-3 py-2"><span>Booked</span><span>{stats.appointments}</span></div>
              </div>
            </div>
          </div>
        </aside>

        <main className="p-5 md:p-8">
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="mx-auto max-w-7xl space-y-6">
            <section className="overflow-hidden rounded-[34px] border border-slate-200 bg-white shadow-[0_30px_80px_rgba(15,23,42,0.09)]">
              <div className="bg-[linear-gradient(120deg,#0f172a_0%,#1d4ed8_45%,#06b6d4_100%)] px-6 py-7 text-white md:px-8">
                <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
                  <div>
                    <div className="mb-2 inline-flex items-center gap-2 rounded-full bg-white/15 px-3 py-1 text-xs font-medium backdrop-blur"><Sparkles size={14} /> Modern canvassing view</div>
                    <h1 className="text-3xl font-semibold md:text-5xl">Lead Management Dashboard</h1>
                    <p className="mt-2 max-w-3xl text-sm text-cyan-50 md:text-base">
                      More visual, more colorful, more like a modern estate CRM: clear cards, avatars, bright actions, and a cleaner PropCon-inspired feel.
                    </p>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <button className="inline-flex items-center gap-2 rounded-2xl bg-white px-4 py-3 text-sm font-medium text-slate-900 shadow"><Upload size={16} /> Import CSV</button>
                    <button className="inline-flex items-center gap-2 rounded-2xl bg-white/15 px-4 py-3 text-sm font-medium text-white backdrop-blur"><Download size={16} /> Export Register</button>
                  </div>
                </div>
              </div>

              <div className="grid gap-4 px-6 py-5 md:grid-cols-2 xl:grid-cols-5 md:px-8">
                <MetricCard title="Contacts" value={stats.total} icon={<Users size={18} />} colors="from-slate-50 to-slate-100 text-slate-900" />
                <MetricCard title="Warm / Hot" value={stats.hot + leads.filter((l) => l.temperature === "Warm").length} icon={<Star size={18} />} colors="from-amber-50 to-yellow-100 text-amber-900" />
                <MetricCard title="Interested" value={stats.interested} icon={<MessageSquare size={18} />} colors="from-emerald-50 to-teal-100 text-emerald-900" />
                <MetricCard title="Appointments" value={stats.appointments} icon={<CalendarDays size={18} />} colors="from-sky-50 to-blue-100 text-sky-900" />
                <MetricCard title="Due Today" value={stats.due} icon={<Bell size={18} />} colors="from-rose-50 to-orange-100 text-rose-900" />
              </div>
            </section>

            {view === "dashboard" && (
              <div className="grid gap-6 xl:grid-cols-[1.15fr_.85fr]">
                <section className="rounded-[32px] border border-slate-200 bg-white p-6 shadow-sm">
                  <div className="mb-5 flex items-center justify-between">
                    <div>
                      <h2 className="text-xl font-semibold">Command Centre</h2>
                      <p className="text-sm text-slate-500">A visually richer CRM summary.</p>
                    </div>
                    <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-medium text-slate-700">Live data</span>
                  </div>
                  <div className="grid gap-4 md:grid-cols-2">
                    <FocusCard title="Priority follow-ups" value={`${stats.due} leads`} subtitle="Need action today" gradient="from-rose-500 to-orange-400" icon={<Clock3 size={18} />} />
                    <FocusCard title="Hot opportunities" value={`${stats.hot} leads`} subtitle="Best chance of conversion" gradient="from-amber-500 to-yellow-400" icon={<Flame size={18} />} />
                    <FocusCard title="Current appointments" value={`${stats.appointments} booked`} subtitle="Valuation bookings" gradient="from-sky-500 to-cyan-400" icon={<CheckCircle2 size={18} />} />
                    <FocusCard title="Suburb spread" value={`${new Set(leads.map((l) => l.suburb)).size} areas`} subtitle="Campaign coverage" gradient="from-emerald-500 to-teal-400" icon={<MapPin size={18} />} />
                  </div>
                </section>

                <section className="rounded-[32px] border border-slate-200 bg-white p-6 shadow-sm">
                  <div className="mb-4 flex items-center justify-between">
                    <div>
                      <h2 className="text-xl font-semibold">Next Best Lead</h2>
                      <p className="text-sm text-slate-500">Fast CRM action card.</p>
                    </div>
                    <button onClick={() => setView("leads")} className="rounded-2xl bg-slate-900 px-4 py-2 text-sm font-medium text-white">Open lead desk</button>
                  </div>
                  <div className="rounded-[30px] bg-[linear-gradient(135deg,#eef2ff_0%,#ffffff_50%,#ecfeff_100%)] p-5">
                    <div className="flex items-center gap-4">
                      <Avatar name={selected.name} large />
                      <div>
                        <div className="text-xl font-semibold text-slate-900">{selected.name}</div>
                        <div className="text-sm text-slate-500">{selected.suburb} · {selected.valueBand}</div>
                        <div className="mt-2 flex flex-wrap gap-2">
                          <StatusPill status={selected.status} />
                          <span className="rounded-full border border-slate-200 bg-white px-3 py-1 text-xs font-medium text-slate-600">{selected.assignee}</span>
                          <span className="rounded-full border border-slate-200 bg-white px-3 py-1 text-xs font-medium text-slate-600">{selected.temperature}</span>
                        </div>
                      </div>
                    </div>
                    <div className="mt-5 grid gap-3 sm:grid-cols-2">
                      <button onClick={copyMessage} className="inline-flex items-center justify-center gap-2 rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-medium text-slate-900 shadow-sm"><Copy size={16} /> Copy Message</button>
                      <button onClick={openWhatsApp} className="inline-flex items-center justify-center gap-2 rounded-2xl bg-[linear-gradient(90deg,#10b981_0%,#06b6d4_100%)] px-4 py-3 text-sm font-medium text-white shadow-lg"><MessageSquare size={16} /> Open WhatsApp</button>
                    </div>
                  </div>
                </section>
              </div>
            )}

            {view === "leads" && (
              <div className="grid gap-6 xl:grid-cols-[0.95fr_1.05fr]">
                <section className="rounded-[32px] border border-slate-200 bg-white p-6 shadow-sm">
                  <div className="mb-4 flex items-center justify-between">
                    <div>
                      <h2 className="text-xl font-semibold">Lead Desk</h2>
                      <p className="text-sm text-slate-500">Bright cards, avatars, fast filtering.</p>
                    </div>
                    <span className="rounded-full bg-blue-50 px-3 py-1 text-xs font-medium text-blue-700">{filtered.length} leads</span>
                  </div>

                  <div className="mb-4 flex flex-col gap-3 lg:flex-row">
                    <div className="flex flex-1 items-center gap-2 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 shadow-sm">
                      <Search size={16} className="text-slate-400" />
                      <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search contact, suburb, phone..." className="w-full bg-transparent outline-none" />
                    </div>
                    <div className="flex items-center gap-2 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 shadow-sm">
                      <Filter size={16} className="text-slate-400" />
                      <select className="bg-transparent outline-none">
                        {statuses.map((s) => <option key={s}>{s}</option>)}
                      </select>
                    </div>
                  </div>

                  <div className="max-h-[760px] space-y-3 overflow-auto pr-1">
                    {filtered.map((lead) => (
                      <button
                        key={lead.id}
                        onClick={() => { setSelectedId(lead.id); setScript(lead.script); }}
                        className={`w-full rounded-[28px] border p-4 text-left transition ${selected.id === lead.id ? "border-blue-300 bg-[linear-gradient(135deg,#eff6ff_0%,#ffffff_55%,#ecfeff_100%)] shadow-md" : "border-slate-200 bg-white hover:-translate-y-0.5 hover:shadow-md"}`}
                      >
                        <div className="flex items-start justify-between gap-3">
                          <div className="flex items-start gap-3">
                            <Avatar name={lead.name} />
                            <div>
                              <div className="flex flex-wrap items-center gap-2">
                                <div className="font-semibold text-slate-900">{lead.name}</div>
                                <StatusPill status={lead.status} />
                              </div>
                              <div className="mt-2 flex flex-wrap gap-3 text-sm text-slate-500">
                                <span className="inline-flex items-center gap-1"><Phone size={14} /> {lead.phone}</span>
                                <span className="inline-flex items-center gap-1"><MapPin size={14} /> {lead.suburb}</span>
                              </div>
                              <div className="mt-2 text-xs text-slate-500">{lead.address}</div>
                              <div className="mt-3 flex items-center gap-2">
                                <span className={`h-2.5 w-2.5 rounded-full bg-gradient-to-r ${tempStyle(lead.temperature)}`} />
                                <span className="text-xs font-medium text-slate-600">{lead.temperature}</span>
                                <span className="text-xs text-slate-400">•</span>
                                <span className="text-xs text-slate-500">{lead.assignee}</span>
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
                  <div className="mb-4 flex items-center justify-between">
                    <div>
                      <h2 className="text-xl font-semibold">Lead Card</h2>
                      <p className="text-sm text-slate-500">Closer to a proper CRM client pane.</p>
                    </div>
                    <button onClick={nextLead} className="inline-flex items-center gap-2 rounded-2xl bg-slate-900 px-4 py-3 text-sm font-medium text-white shadow"><ArrowRight size={16} /> Next</button>
                  </div>

                  <div className="rounded-[32px] bg-[linear-gradient(135deg,#eef2ff_0%,#ffffff_45%,#ecfeff_100%)] p-5">
                    <div className="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
                      <div className="flex items-start gap-4">
                        <Avatar name={selected.name} large />
                        <div>
                          <div className="text-2xl font-semibold text-slate-900">{selected.name}</div>
                          <div className="mt-1 text-sm text-slate-500">{selected.address}</div>
                          <div className="mt-3 flex flex-wrap gap-2">
                            <StatusPill status={selected.status} />
                            <span className="rounded-full border border-slate-200 bg-white px-3 py-1 text-xs font-medium text-slate-600">{selected.temperature}</span>
                            <span className="rounded-full border border-slate-200 bg-white px-3 py-1 text-xs font-medium text-slate-600">{selected.valueBand}</span>
                          </div>
                        </div>
                      </div>
                      <div className="grid gap-2 sm:grid-cols-2">
                        <InfoTile icon={<Phone size={15} />} label="Phone" value={selected.phone} />
                        <InfoTile icon={<Users size={15} />} label="Assigned" value={selected.assignee} />
                        <InfoTile icon={<MapPin size={15} />} label="Suburb" value={selected.suburb} />
                        <InfoTile icon={<Building2 size={15} />} label="Source" value={selected.source} />
                      </div>
                    </div>
                  </div>

                  <div className="mt-5 grid gap-3 sm:grid-cols-4">
                    <StatusAction label="Waiting" onClick={() => markStatus("Waiting")} />
                    <StatusAction label="Interested" tone="emerald" onClick={() => markStatus("Interested")} />
                    <StatusAction label="Appointment" tone="blue" onClick={() => markStatus("Appointment")} />
                    <StatusAction label="Opt Out" tone="rose" onClick={() => markStatus("Do Not Contact")} />
                  </div>

                  <div className="mt-5 grid gap-4 md:grid-cols-2">
                    <div>
                      <label className="mb-2 block text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">Script</label>
                      <select value={script} onChange={(e) => setScript(e.target.value)} className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 shadow-sm outline-none">
                        {Object.keys(scripts).map((s) => <option key={s}>{s}</option>)}
                      </select>
                    </div>
                    <div>
                      <label className="mb-2 block text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">Assigned to</label>
                      <select value={selected.assignee} onChange={(e) => setLeads((prev) => prev.map((l) => l.id === selected.id ? { ...l, assignee: e.target.value } : l))} className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 shadow-sm outline-none">
                        {assignees.filter((a) => a !== "All").map((a) => <option key={a}>{a}</option>)}
                      </select>
                    </div>
                  </div>

                  <div className="mt-5 rounded-[30px] border border-slate-200 bg-[linear-gradient(135deg,#ffffff_0%,#ecfdf5_100%)] p-4 shadow-sm">
                    <div className="mb-3 flex items-center justify-between">
                      <div className="text-sm font-semibold text-slate-800">WhatsApp Draft</div>
                      <span className="rounded-full bg-white px-3 py-1 text-xs font-medium text-slate-600 shadow-sm">{script}</span>
                    </div>
                    <textarea readOnly value={message} className="min-h-[180px] w-full rounded-2xl border border-slate-200 bg-white p-4 text-sm shadow-inner outline-none" />
                    <div className="mt-4 grid gap-3 sm:grid-cols-3">
                      <button onClick={copyMessage} className="inline-flex items-center justify-center gap-2 rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-medium text-slate-900 shadow-sm"><Copy size={16} /> Copy Message</button>
                      <button onClick={openWhatsApp} className="inline-flex items-center justify-center gap-2 rounded-2xl bg-[linear-gradient(90deg,#10b981_0%,#06b6d4_100%)] px-4 py-3 text-sm font-medium text-white shadow-lg"><MessageSquare size={16} /> Open WhatsApp</button>
                      <button className="inline-flex items-center justify-center gap-2 rounded-2xl bg-[linear-gradient(90deg,#0f172a_0%,#334155_100%)] px-4 py-3 text-sm font-medium text-white shadow"><Send size={16} /> Log Send</button>
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
                      {column.items.map((lead) => (
                        <button key={lead.id} onClick={() => { setSelectedId(lead.id); setView("leads"); }} className="w-full rounded-2xl border border-slate-200 bg-[linear-gradient(135deg,#ffffff_0%,#f8fafc_100%)] p-4 text-left shadow-sm transition hover:-translate-y-0.5 hover:shadow-md">
                          <div className="flex items-center gap-3">
                            <Avatar name={lead.name} />
                            <div className="min-w-0">
                              <div className="truncate font-medium text-slate-900">{lead.name}</div>
                              <div className="truncate text-xs text-slate-500">{lead.suburb}</div>
                            </div>
                          </div>
                          <div className="mt-3 flex items-center justify-between">
                            <span className="text-xs text-slate-500">{lead.assignee}</span>
                            <span className={`inline-block h-2.5 w-2.5 rounded-full bg-gradient-to-r ${tempStyle(lead.temperature)}`} />
                          </div>
                        </button>
                      ))}
                    </div>
                  </section>
                ))}
              </div>
            )}

            {view === "bulk" && (
              <div className="grid gap-6 xl:grid-cols-[1.05fr_.95fr]">
                <section className="rounded-[32px] border border-slate-200 bg-white p-6 shadow-sm">
                  <div className="mb-4 flex items-center justify-between">
                    <div>
                      <h2 className="text-xl font-semibold">Bulk Send Builder</h2>
                      <p className="text-sm text-slate-500">Select leads and prepare a batch.</p>
                    </div>
                    <button onClick={exportBulk} className="rounded-2xl bg-slate-900 px-4 py-3 text-sm font-medium text-white shadow"><Download size={16} className="mr-2 inline" />Export CSV</button>
                  </div>
                  <div className="overflow-hidden rounded-[28px] border border-slate-200">
                    <table className="min-w-full text-sm">
                      <thead className="bg-slate-50">
                        <tr>
                          <th className="px-4 py-3"></th>
                          <th className="px-4 py-3 text-left font-medium text-slate-600">Lead</th>
                          <th className="px-4 py-3 text-left font-medium text-slate-600">Phone</th>
                          <th className="px-4 py-3 text-left font-medium text-slate-600">Area</th>
                        </tr>
                      </thead>
                      <tbody>
                        {filtered.map((lead) => (
                          <tr key={lead.id} className="border-t bg-white">
                            <td className="px-4 py-3"><input type="checkbox" checked={!!selectedBulk[lead.id]} onChange={() => setSelectedBulk((prev) => ({ ...prev, [lead.id]: !prev[lead.id] }))} /></td>
                            <td className="px-4 py-3">{lead.name}</td>
                            <td className="px-4 py-3">{lead.phone}</td>
                            <td className="px-4 py-3">{lead.suburb}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </section>

                <section className="rounded-[32px] border border-slate-200 bg-white p-6 shadow-sm">
                  <div className="mb-4">
                    <h2 className="text-xl font-semibold">Preview Panel</h2>
                    <p className="text-sm text-slate-500">Exactly what your canvasser will send.</p>
                  </div>
                  <div className="space-y-3">
                    {filtered.filter((l) => selectedBulk[l.id]).length ? filtered.filter((l) => selectedBulk[l.id]).map((lead) => (
                      <div key={lead.id} className="rounded-2xl border border-slate-200 bg-[linear-gradient(135deg,#ffffff_0%,#f8fafc_100%)] p-4 shadow-sm">
                        <div className="mb-2 flex items-center justify-between">
                          <div className="font-medium text-slate-900">{lead.name}</div>
                          <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-medium text-slate-700">{lead.suburb}</span>
                        </div>
                        <div className="font-mono text-xs text-slate-600">{renderScript(scripts[script], lead)}</div>
                      </div>
                    )) : <div className="rounded-2xl bg-slate-100 p-8 text-center text-slate-500">Select leads to preview the batch.</div>}
                  </div>
                </section>
              </div>
            )}

            {view === "manager" && (
              <div className="grid gap-6 xl:grid-cols-2">
                <section className="rounded-[32px] border border-slate-200 bg-white p-6 shadow-sm">
                  <div className="mb-4">
                    <h2 className="text-xl font-semibold">Suburb Results</h2>
                    <p className="text-sm text-slate-500">Visual suburb-by-suburb momentum.</p>
                  </div>
                  <div className="space-y-5">
                    {Object.values(leads.reduce<Record<string, { total: number; interested: number; suburb: string }>>((acc, lead) => {
                      if (!acc[lead.suburb]) acc[lead.suburb] = { suburb: lead.suburb, total: 0, interested: 0 };
                      acc[lead.suburb].total += 1;
                      if (lead.status === "Interested" || lead.status === "Appointment") acc[lead.suburb].interested += 1;
                      return acc;
                    }, {})).map((row) => {
                      const percent = row.total ? Math.round((row.interested / row.total) * 100) : 0;
                      return (
                        <div key={row.suburb}>
                          <div className="mb-2 flex items-center justify-between text-sm">
                            <span>{row.suburb}</span>
                            <span>{percent}% engaged</span>
                          </div>
                          <div className="h-3 overflow-hidden rounded-full bg-slate-200">
                            <div className="h-full rounded-full bg-[linear-gradient(90deg,#2563eb_0%,#06b6d4_100%)]" style={{ width: `${percent}%` }} />
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </section>

                <section className="rounded-[32px] border border-slate-200 bg-white p-6 shadow-sm">
                  <div className="mb-4">
                    <h2 className="text-xl font-semibold">Team Snapshot</h2>
                    <p className="text-sm text-slate-500">A cleaner manager view with cards.</p>
                  </div>
                  <div className="space-y-3">
                    {["Lerato", "Megan"].map((agent, idx) => {
                      const rows = leads.filter((l) => l.assignee === agent);
                      return (
                        <div key={agent} className="rounded-2xl border border-slate-200 bg-[linear-gradient(135deg,#ffffff_0%,#f8fafc_100%)] p-4 shadow-sm">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2 font-medium text-slate-900"><Star size={15} /> {idx + 1}. {agent}</div>
                            <span className="rounded-full bg-slate-900 px-3 py-1 text-xs font-medium text-white">{rows.length} leads</span>
                          </div>
                          <div className="mt-3 grid grid-cols-3 gap-3">
                            <MiniBox label="Waiting" value={rows.filter((r) => r.status === "Waiting").length} />
                            <MiniBox label="Interested" value={rows.filter((r) => r.status === "Interested").length} />
                            <MiniBox label="Booked" value={rows.filter((r) => r.status === "Appointment").length} />
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
