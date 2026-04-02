import React, { useMemo, useRef, useState } from "react";
import { motion } from "framer-motion";
import {
  Search, Upload, Download, MessageSquare, Phone, MapPin, Copy, Send,
  Users, Filter, Bell, ShieldCheck, CalendarDays, Ban, FileSpreadsheet,
  ChevronRight, Star, Bot
} from "lucide-react";

type ContactStatus = "New" | "Waiting" | "Interested" | "Appointment" | "Do Not Contact";
type TabKey = "workspace" | "import" | "bulk" | "manager" | "settings";
type Contact = {
  id: string; name: string; phone: string; suburb: string; area: string; address: string;
  status: ContactStatus; script: string; assignedTo: string; reply: string; notes: string;
  followUpDue: boolean; score: number; optedOut: boolean; source: string;
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
  { id:"c1", name:"Janine Smith", phone:"+27 82 555 0141", suburb:"Durbanville", area:"Durbanville", address:"12 Oak Street", status:"New", script:"Recent Sales", assignedTo:"Lerato", reply:"", notes:"Fresh PropCon import", followUpDue:true, score:0, optedOut:false, source:"PropCon CSV" },
  { id:"c2", name:"Peter Jacobs", phone:"+27 83 555 0198", suburb:"Blouberg", area:"Blouberg", address:"85 Marine Road", status:"Waiting", script:"Buyer Enquiry", assignedTo:"Lerato", reply:"Seen, no reply", notes:"Follow-up today", followUpDue:true, score:1, optedOut:false, source:"PropCon CSV" },
  { id:"c3", name:"Ayesha Daniels", phone:"+27 81 555 0102", suburb:"Parklands", area:"Parklands", address:"44 Sandpiper Ave", status:"Interested", script:"Property Value", assignedTo:"Lerato", reply:"Yes, please send recent sales.", notes:"Warm lead", followUpDue:false, score:8, optedOut:false, source:"PropCon CSV" },
  { id:"c4", name:"Gavin Naidoo", phone:"+27 72 555 0135", suburb:"Table View", area:"Table View", address:"17 Beach Road", status:"Appointment", script:"Appointment Close", assignedTo:"Megan", reply:"We may sell later this year.", notes:"Appointment pending", followUpDue:false, score:15, optedOut:false, source:"PropCon CSV" },
  { id:"c5", name:"Melissa van Wyk", phone:"+27 79 555 0180", suburb:"Milnerton", area:"Milnerton", address:"23 Sunset Drive", status:"Do Not Contact", script:"Annual Area Report", assignedTo:"Lerato", reply:"No thanks", notes:"Opted out", followUpDue:false, score:0, optedOut:true, source:"PropCon CSV" }
];

const assignees = ["Lerato", "Megan", "Unassigned"];
const statuses = ["All", "New", "Waiting", "Interested", "Appointment", "Do Not Contact"];

function renderTemplate(template: string, contact: Contact) {
  return template.replaceAll("{{name}}", contact.name || "there").replaceAll("{{suburb}}", contact.suburb || contact.area || "your area");
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
        cell += '"'; i += 1;
      } else { inQuotes = !inQuotes; }
    } else if (char === "," && !inQuotes) {
      row.push(cell); cell = "";
    } else if ((char === "\n" || char === "\r") && !inQuotes) {
      if (char === "\r" && next === "\n") i += 1;
      row.push(cell); rows.push(row); row = []; cell = "";
    } else { cell += char; }
  }
  if (cell.length || row.length) { row.push(cell); rows.push(row); }
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
  for (const row of rows) lines.push(headers.map((header) => csvEscape(row[header])).join(","));
  return lines.join("\n");
}

function downloadCsv(filename: string, content: string) {
  const blob = new Blob([content], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url; a.download = filename; document.body.appendChild(a); a.click(); a.remove();
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
  const [csvName, setCsvName] = useState("No file selected");
  const [activeTab, setActiveTab] = useState<TabKey>("workspace");
  const fileRef = useRef<HTMLInputElement | null>(null);

  const selected = contacts.find((c) => c.id === selectedId) || contacts[0];

  const filtered = useMemo(() => contacts.filter((c) => {
    const haystack = [c.name, c.phone, c.suburb, c.address, c.notes, c.assignedTo].join(" ").toLowerCase();
    const matchesSearch = haystack.includes(search.toLowerCase());
    const matchesStatus = statusFilter === "All" ? true : c.status === statusFilter;
    const matchesAssignee = assigneeFilter === "All" ? true : c.assignedTo === assigneeFilter;
    return matchesSearch && matchesStatus && matchesAssignee;
  }), [contacts, search, statusFilter, assigneeFilter]);

  const metrics = useMemo(() => {
    const total = contacts.length;
    const interested = contacts.filter((c) => c.status === "Interested").length;
    const appointments = contacts.filter((c) => c.status === "Appointment").length;
    const replies = contacts.filter((c) => c.reply && c.reply !== "Seen, no reply").length;
    const due = contacts.filter((c) => c.followUpDue && !c.optedOut).length;
    return { total, interested, appointments, due, replyRate: total ? Math.round((replies / total) * 100) : 0, conversionRate: interested ? Math.round((appointments / interested) * 100) : 0 };
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
    const score = status === "Interested" ? 8 : status === "Appointment" ? 15 : selected.score;
    updateSelected({ status, score, optedOut: status === "Do Not Contact" });
  };

  const copyText = async (text: string) => { try { await navigator.clipboard.writeText(text); } catch {} };

  const propconRow = selected ? `${selected.name}\t${selected.phone}\t${selected.suburb}\t${selected.address}\t${draftMessage}` : "";

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
      Name: row.name, Phone: row.phone, Suburb: row.suburb, Address: row.address,
      Message: renderTemplate(scripts[bulkScript], row), AssignedTo: row.assignedTo, Status: row.status,
    }));
    downloadCsv("propcon_whatsapp_batch.csv", objectsToCsv(rows));
  };

  const exportRegister = () => {
    const rows = contacts.map((c) => ({
      Name: c.name, Phone: c.phone, Suburb: c.suburb, Area: c.area, Address: c.address, Status: c.status,
      Script: c.script, AssignedTo: c.assignedTo, Reply: c.reply, Notes: c.notes,
      FollowUpDue: c.followUpDue ? "Yes" : "No", OptedOut: c.optedOut ? "Yes" : "No", Source: c.source,
    }));
    downloadCsv("propcon_canvassing_register.csv", objectsToCsv(rows));
  };

  return (
    <div className="app-shell">
      <input ref={fileRef} type="file" accept=".csv,text/csv" className="hidden" onChange={(e) => void handleCsvFile(e.target.files?.[0] || null)} />
      <div className="container">
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} className="hero-grid">
          <section className="card hero-card">
            <div className="badges">
              <span className="badge badge-primary">Production Repo</span>
              <span className="badge">PropCon Friendly</span>
              <span className="badge">WhatsApp Workflow</span>
            </div>
            <div className="hero-top">
              <div>
                <h1>PropCon Canvasser Hub</h1>
                <p className="muted">Full production-style interface for importing PropCon leads, preparing copy-ready WhatsApp messages, assigning canvassers, managing follow-ups, and tracking suburb performance.</p>
              </div>
              <div className="hero-actions">
                <button className="btn btn-primary" onClick={handleImportClick}><Upload size={16} /> Import CSV</button>
                <button className="btn btn-secondary" onClick={exportRegister}><Download size={16} /> Export Register</button>
              </div>
            </div>
            <div className="metric-grid">
              <MetricCard icon={<Users size={16} />} title="Contacts" value={String(metrics.total)} subtitle="active records" />
              <MetricCard icon={<MessageSquare size={16} />} title="Reply Rate" value={`${metrics.replyRate}%`} subtitle="engaged replies" />
              <MetricCard icon={<CalendarDays size={16} />} title="Appointments" value={String(metrics.appointments)} subtitle="booked leads" />
              <MetricCard icon={<Bell size={16} />} title="Follow-ups" value={String(metrics.due)} subtitle="due today" />
            </div>
          </section>

          <section className="card side-card">
            <div className="card-header">
              <h3><ShieldCheck size={18} /> Safe canvassing rules</h3>
              <p>Designed for a real human canvasser workflow.</p>
            </div>
            <div className="rule">Start with short text-only outreach.</div>
            <div className="rule">Only send reports or images after a reply.</div>
            <div className="rule">Opt-out instantly on NO or stop request.</div>
            <div className="rule">Use suburb-based campaigns to stay focused.</div>
            <div className="rule">Managers review due follow-ups daily.</div>
            <div className="bot-box">
              <div className="bot-title"><Bot size={16} /> Bot handoff path</div>
              <div className="small-muted">Intro message → reply detected → canvasser takeover → appointment or archive</div>
            </div>
          </section>
        </motion.div>

        <div className="tabs">
          {(["workspace", "import", "bulk", "manager", "settings"] as TabKey[]).map((tab) => (
            <button key={tab} className={`tab ${activeTab === tab ? "tab-active" : ""}`} onClick={() => setActiveTab(tab)}>
              {tab === "workspace" && "Workspace"}
              {tab === "import" && "Import"}
              {tab === "bulk" && "Bulk Export"}
              {tab === "manager" && "Manager"}
              {tab === "settings" && "Settings"}
            </button>
          ))}
        </div>

        {activeTab === "workspace" && (
          <div className="two-col">
            <section className="card">
              <div className="card-header"><h3>Contact queue</h3><p>Search and filter the live canvassing list.</p></div>
              <div className="toolbar">
                <div className="search-box"><Search size={16} /><input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search name, suburb, phone, address..." /></div>
                <div className="select-wrap"><Filter size={16} /><select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>{statuses.map((status) => <option key={status} value={status}>{status}</option>)}</select></div>
                <div className="select-wrap"><Users size={16} /><select value={assigneeFilter} onChange={(e) => setAssigneeFilter(e.target.value)}><option value="All">All assignees</option>{assignees.map((name) => <option key={name} value={name}>{name}</option>)}</select></div>
              </div>

              <div className="queue">
                {filtered.map((contact) => (
                  <button key={contact.id} onClick={() => { setSelectedId(contact.id); setSelectedScript(contact.script); }} className={`queue-item ${selectedId === contact.id ? "queue-item-active" : ""}`}>
                    <div className="queue-left">
                      <div className="queue-title-row">
                        <div className="queue-name">{contact.name}</div>
                        <span className={`status-pill status-${contact.status.replace(/ /g, "-").toLowerCase()}`}>{contact.status}</span>
                        {contact.followUpDue && !contact.optedOut ? <span className="plain-pill">Due</span> : null}
                        {contact.optedOut ? <span className="plain-pill">Opted Out</span> : null}
                      </div>
                      <div className="queue-meta">
                        <span><Phone size={14} /> {contact.phone}</span>
                        <span><MapPin size={14} /> {contact.suburb}</span>
                        <span><Users size={14} /> {contact.assignedTo || "Unassigned"}</span>
                      </div>
                      <div className="address-line">{contact.address}</div>
                    </div>
                    <ChevronRight size={18} className="muted-icon" />
                  </button>
                ))}
              </div>
            </section>

            <section className="card">
              <div className="card-header"><h3>Contact workspace</h3><p>Production-style detail panel for your canvasser.</p></div>
              {selected && (
                <>
                  <div className="profile-box">
                    <div className="profile-title-row">
                      <h2>{selected.name}</h2>
                      <span className={`status-pill status-${selected.status.replace(/ /g, "-").toLowerCase()}`}>{selected.status}</span>
                      {selected.optedOut ? <span className="status-pill status-do-not-contact">Do Not Contact</span> : null}
                    </div>
                    <div className="data-grid">
                      <DataBox icon={<Phone size={15} />} label="Phone" value={selected.phone} />
                      <DataBox icon={<MapPin size={15} />} label="Suburb" value={selected.suburb} />
                      <DataBox icon={<MapPin size={15} />} label="Address" value={selected.address} />
                      <DataBox icon={<Users size={15} />} label="Assigned To" value={selected.assignedTo} />
                    </div>
                  </div>

                  <div className="button-grid">
                    <button className="btn btn-secondary" onClick={() => markStatus("Waiting")}>Mark Waiting</button>
                    <button className="btn btn-secondary" onClick={() => markStatus("Interested")}>Mark Interested</button>
                    <button className="btn btn-primary" onClick={() => markStatus("Appointment")}>Set Appointment</button>
                    <button className="btn btn-danger" onClick={() => markStatus("Do Not Contact")}><Ban size={16} /> Opt Out</button>
                  </div>

                  <div className="form-grid">
                    <div>
                      <label>Script</label>
                      <select className="control" value={selectedScript} onChange={(e) => setSelectedScript(e.target.value)}>
                        {Object.keys(scripts).map((name) => <option key={name} value={name}>{name}</option>)}
                      </select>
                    </div>
                    <div>
                      <label>Assigned canvasser</label>
                      <select className="control" value={selected.assignedTo} onChange={(e) => updateSelected({ assignedTo: e.target.value })}>
                        {assignees.filter((a) => a !== "Unassigned").map((name) => <option key={name} value={name}>{name}</option>)}
                      </select>
                    </div>
                  </div>

                  <div>
                    <label>WhatsApp draft</label>
                    <textarea className="textarea" readOnly value={draftMessage} />
                  </div>

                  <div className="button-grid">
                    <button className="btn btn-secondary" onClick={() => void copyText(draftMessage)}><Copy size={16} /> Copy WhatsApp</button>
                    <button className="btn btn-secondary" onClick={() => void copyText(propconRow)}><Copy size={16} /> Copy PropCon Row</button>
                    <button className="btn btn-primary" onClick={() => updateSelected({ followUpDue: false, status: selected.status === "New" ? "Waiting" : selected.status })}><Send size={16} /> Log Send</button>
                  </div>

                  <div className="form-grid">
                    <div>
                      <label>Reply / last feedback</label>
                      <textarea className="textarea small" value={selected.reply} onChange={(e) => updateSelected({ reply: e.target.value })} placeholder="Paste reply or summary..." />
                    </div>
                    <div>
                      <label>Canvasser notes</label>
                      <textarea className="textarea small" value={selected.notes} onChange={(e) => updateSelected({ notes: e.target.value })} placeholder="Add call notes, seller timing, objections..." />
                    </div>
                  </div>

                  <div className="propcon-box">
                    <div className="propcon-title">PropCon paste format</div>
                    <div className="mono">{propconRow}</div>
                  </div>
                </>
              )}
            </section>
          </div>
        )}

        {activeTab === "import" && (
          <div className="two-col import-grid">
            <section className="card">
              <div className="card-header"><h3>PropCon import</h3><p>Cleaner production import flow with CSV upload.</p></div>
              <div className="drop-zone">
                <FileSpreadsheet size={40} className="muted-icon" />
                <div className="drop-title">Selected file</div>
                <div className="muted">{csvName}</div>
                <button className="btn btn-primary" onClick={handleImportClick}><Upload size={16} /> Choose CSV</button>
              </div>
              <div className="mapped-grid">
                <MappedField field="Owner Name" value="name" />
                <MappedField field="Cell Number" value="phone" />
                <MappedField field="Suburb" value="suburb" />
                <MappedField field="Address" value="address" />
                <MappedField field="Notes" value="notes" />
                <MappedField field="Area" value="area" />
              </div>
            </section>

            <section className="card">
              <div className="card-header"><h3>Import preview</h3><p>Example layout for incoming PropCon leads.</p></div>
              <div className="table-wrap">
                <table>
                  <thead><tr><th>Name</th><th>Phone</th><th>Suburb</th><th>Address</th><th>Status</th></tr></thead>
                  <tbody>
                    {contacts.slice(0, 5).map((row) => (
                      <tr key={row.id}>
                        <td>{row.name}</td><td>{row.phone}</td><td>{row.suburb}</td><td>{row.address}</td><td>{row.status}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </section>
          </div>
        )}

        {activeTab === "bulk" && (
          <div className="two-col">
            <section className="card">
              <div className="card-header"><h3>Bulk export builder</h3><p>Select contacts and prepare a PropCon-friendly batch.</p></div>
              <div className="toolbar split">
                <div className="muted">{selectedCount} selected from {filtered.length} filtered contacts</div>
                <div className="inline-actions">
                  <button className="btn btn-secondary" onClick={() => { const next: Record<string, boolean> = {}; filtered.forEach((c) => { next[c.id] = true; }); setSelectedRows(next); }}>Select all</button>
                  <button className="btn btn-secondary" onClick={() => setSelectedRows({})}>Clear</button>
                </div>
              </div>

              <div className="toolbar bulk-toolbar">
                <div className="select-block">
                  <label>Bulk script</label>
                  <select className="control" value={bulkScript} onChange={(e) => setBulkScript(e.target.value)}>
                    {Object.keys(scripts).map((name) => <option key={name} value={name}>{name}</option>)}
                  </select>
                </div>
                <button className="btn btn-secondary" onClick={() => void copyText(bulkRows.map((c) => `${c.name}\t${c.phone}\t${c.suburb}\t${c.address}\t${renderTemplate(scripts[bulkScript], c)}`).join("\n"))}><Copy size={16} /> Copy Rows</button>
                <button className="btn btn-primary" onClick={exportBatch}><Download size={16} /> Export CSV</button>
              </div>

              <div className="table-wrap">
                <table>
                  <thead><tr><th></th><th>Name</th><th>Phone</th><th>Suburb</th><th>Assigned</th><th>Status</th></tr></thead>
                  <tbody>
                    {filtered.map((row) => (
                      <tr key={row.id}>
                        <td><input type="checkbox" checked={!!selectedRows[row.id]} onChange={() => setSelectedRows((prev) => ({ ...prev, [row.id]: !prev[row.id] }))} /></td>
                        <td>{row.name}</td><td>{row.phone}</td><td>{row.suburb}</td><td>{row.assignedTo}</td><td>{row.status}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </section>

            <section className="card">
              <div className="card-header"><h3>Export preview</h3><p>Copy-ready output for PropCon WhatsApp canvassing.</p></div>
              <div className="preview-list">
                {bulkRows.length ? bulkRows.map((row) => (
                  <div key={row.id} className="preview-card">
                    <div className="preview-top"><div className="preview-name">{row.name}</div><span className="plain-pill">{row.suburb}</span></div>
                    <div className="mono">{row.name} | {row.phone} | {row.suburb} | {row.address} | {renderTemplate(scripts[bulkScript], row)}</div>
                  </div>
                )) : <div className="empty-box">Select contacts to preview the exported PropCon rows.</div>}
              </div>
            </section>
          </div>
        )}

        {activeTab === "manager" && (
          <div className="two-col">
            <section className="card">
              <div className="card-header"><h3>Suburb performance</h3><p>Quick area-level overview for management.</p></div>
              <div className="stack">
                {suburbRows.map((row) => {
                  const rate = row.total ? Math.round((row.interested / row.total) * 100) : 0;
                  return (
                    <div key={row.suburb}>
                      <div className="line-top"><span>{row.suburb}</span><span>{row.appointments} appointments · {row.interested} interested</span></div>
                      <div className="progress"><div className="progress-fill" style={{ width: `${rate}%` }} /></div>
                    </div>
                  );
                })}
              </div>
            </section>

            <section className="card">
              <div className="card-header"><h3>Team leaderboard</h3><p>Simple canvasser performance snapshot.</p></div>
              <div className="preview-list">
                {assignees.filter((a) => a !== "Unassigned").map((name, index) => {
                  const rows = contacts.filter((c) => c.assignedTo === name);
                  const score = rows.reduce((sum, row) => sum + row.score, 0);
                  return (
                    <div key={name} className="preview-card">
                      <div className="preview-top"><div className="preview-name"><Star size={14} /> {index + 1}. {name}</div><span className="badge badge-primary">{score} pts</span></div>
                      <div className="mini-grid">
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
          <div className="two-col">
            <section className="card">
              <div className="card-header"><h3>Runtime settings</h3><p>Deployment-facing settings panel style.</p></div>
              <div className="stack">
                <SettingRow label="Mode" value="Production UI Preview" />
                <SettingRow label="Data Source" value="PropCon CSV + Supabase ready" />
                <SettingRow label="Export Format" value="PropCon-friendly batch rows" />
                <SettingRow label="WhatsApp Flow" value="Human-first, copy/send workflow" />
              </div>
            </section>
            <section className="card">
              <div className="card-header"><h3>Next implementation layer</h3><p>What this UI is ready to plug into next.</p></div>
              <div className="rule">Supabase auth and roles</div>
              <div className="rule">CSV import persistence</div>
              <div className="rule">Audit history per contact</div>
              <div className="rule">Vercel deployment</div>
              <div className="rule">Optional approved WhatsApp API handoff</div>
            </section>
          </div>
        )}
      </div>
    </div>
  );
}

function MetricCard({ icon, title, value, subtitle }: { icon: React.ReactNode; title: string; value: string; subtitle: string }) {
  return <div className="metric-card"><div className="metric-title">{icon} {title}</div><div className="metric-value">{value}</div><div className="small-muted">{subtitle}</div></div>;
}
function DataBox({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return <div className="data-box"><div className="data-label">{icon} {label}</div><div className="data-value">{value}</div></div>;
}
function MappedField({ field, value }: { field: string; value: string }) {
  return <div><div className="field-label">{field}</div><div className="mapped-field">{value}</div></div>;
}
function MiniInfo({ label, value }: { label: string; value: number }) {
  return <div className="mini-info"><div className="small-muted">{label}</div><div className="mini-value">{value}</div></div>;
}
function SettingRow({ label, value }: { label: string; value: string }) {
  return <div className="setting-row"><div className="small-muted">{label}</div><div className="setting-value">{value}</div></div>;
}
