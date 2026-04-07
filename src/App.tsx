import React, { useMemo, useRef, useState } from "react";

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
  followUpDue: boolean;
  source: string;
};

const leadsSeed: Lead[] = [
  { id: "1", name: "Janine Smith", phone: "+27 82 555 0141", suburb: "Durbanville", address: "12 Oak Street", status: "New", assignee: "Lerato", temperature: "Cold", valueBand: "R3.8m - R4.2m", notes: "Fresh PropCon import", reply: "", followUpDue: true, source: "PropCon CSV" },
  { id: "2", name: "Peter Jacobs", phone: "+27 83 555 0198", suburb: "Blouberg", address: "85 Marine Road", status: "Waiting", assignee: "Lerato", temperature: "Cold", valueBand: "R5.5m - R6.1m", notes: "Follow-up today", reply: "Seen, no reply", followUpDue: true, source: "PropCon CSV" },
  { id: "3", name: "Ayesha Daniels", phone: "+27 81 555 0102", suburb: "Parklands", address: "44 Sandpiper Ave", status: "Interested", assignee: "Lerato", temperature: "Warm", valueBand: "R2.4m - R2.8m", notes: "Warm lead", reply: "Please send recent sales.", followUpDue: false, source: "PropCon CSV" },
  { id: "4", name: "Gavin Naidoo", phone: "+27 72 555 0135", suburb: "Table View", address: "17 Beach Road", status: "Appointment", assignee: "Megan", temperature: "Hot", valueBand: "R6.7m - R7.4m", notes: "Valuation booked", reply: "Friday works.", followUpDue: false, source: "PropCon CSV" },
  { id: "5", name: "Melissa van Wyk", phone: "+27 79 555 0180", suburb: "Milnerton", address: "23 Sunset Drive", status: "Do Not Contact", assignee: "Lerato", temperature: "Cold", valueBand: "R4.1m - R4.5m", notes: "Opted out", reply: "No thanks", followUpDue: false, source: "PropCon CSV" },
];

const scripts: Record<string, string> = {
  "Buyer Enquiry": "Hi {{name}}, quick one — I’m working with a buyer looking in {{suburb}}. Would you consider selling if the price made sense?",
  "Recent Sales": "Hi {{name}}, I’ve just updated recent sales in {{suburb}}. Would you like me to send you what properties near you are selling for?",
  "Property Value": "Hi {{name}}, have you seen what homes in {{suburb}} are selling for lately?",
  "Appointment Close": "Thanks {{name}}. I can arrange a quick no-obligation valuation for your property in {{suburb}}. What day would suit you best?",
};

const views: { key: View; label: string; emoji: string }[] = [
  { key: "dashboard", label: "Dashboard", emoji: "🏠" },
  { key: "leads", label: "Lead Desk", emoji: "👥" },
  { key: "pipeline", label: "Pipeline", emoji: "📊" },
  { key: "bulk", label: "Bulk Send", emoji: "📤" },
  { key: "manager", label: "Manager", emoji: "📅" },
];

function initials(name: string) {
  return name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
}

function renderScript(template: string, lead: Lead) {
  return template.replace(/\{\{name\}\}/g, lead.name).replace(/\{\{suburb\}\}/g, lead.suburb);
}

function statusColors(status: Status) {
  if (status === "New") return { bg: "#e2e8f0", color: "#334155" };
  if (status === "Waiting") return { bg: "#fef3c7", color: "#92400e" };
  if (status === "Interested") return { bg: "#dcfce7", color: "#166534" };
  if (status === "Appointment") return { bg: "#dbeafe", color: "#1d4ed8" };
  return { bg: "#ffe4e6", color: "#be123c" };
}

function tempColor(temp: Lead["temperature"]) {
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

function objectsToCsv(rows: Record<string, unknown>[]) {
  if (!rows.length) return "";
  const headers = Object.keys(rows[0]);
  const lines = [headers.join(",")];
  rows.forEach((row) => {
    lines.push(headers.map((h) => csvEscape(row[h])).join(","));
  });
  return lines.join("\n");
}

function downloadCsv(filename: string, rows: Record<string, unknown>[]) {
  const csv = objectsToCsv(rows);
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

export default function App() {
  const [view, setView] = useState<View>("dashboard");
  const [search, setSearch] = useState("");
  const [leads, setLeads] = useState<Lead[]>(leadsSeed);
  const [selectedId, setSelectedId] = useState("3");
  const [script, setScript] = useState("Property Value");
  const [selectedBulk, setSelectedBulk] = useState<Record<string, boolean>>({});
  const [csvName, setCsvName] = useState("No file selected");
  const fileRef = useRef<HTMLInputElement | null>(null);

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
    due: leads.filter((l) => l.followUpDue && l.status !== "Do Not Contact").length,
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
    if (idx >= 0 && idx < filtered.length - 1) {
      setSelectedId(filtered[idx + 1].id);
    } else {
      alert("No more leads in this filtered list");
    }
  };

  const markStatus = (status: Status) => {
    setLeads((prev) =>
      prev.map((l) =>
        l.id === selected.id
          ? {
              ...l,
              status,
              followUpDue: status === "Waiting",
              temperature: status === "Appointment" ? "Hot" : status === "Interested" ? "Warm" : l.temperature,
            }
          : l
      )
    );
  };

  const exportBulk = () => {
    const rows = filtered
      .filter((l) => selectedBulk[l.id])
      .map((l) => ({
        Name: l.name,
        Phone: l.phone,
        Suburb: l.suburb,
        Address: l.address,
        Message: renderScript(scripts[script], l),
      }));

    if (!rows.length) {
      alert("Select at least one lead first");
      return;
    }

    downloadCsv("propcon_bulk_export.csv", rows);
  };

  const exportRegister = () => {
    const rows = leads.map((l) => ({
      Name: l.name,
      Phone: l.phone,
      Suburb: l.suburb,
      Address: l.address,
      Status: l.status,
      Assignee: l.assignee,
      Temperature: l.temperature,
      ValueBand: l.valueBand,
      Notes: l.notes,
      Reply: l.reply,
      FollowUpDue: l.followUpDue ? "Yes" : "No",
      Source: l.source,
    }));

    downloadCsv("propcon_register.csv", rows);
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

    const imported: Lead[] = body
      .map((row, index) => {
        const get = (candidates: string[]) => {
          const idx = headers.findIndex((h) => candidates.some((cand) => h.includes(cand)));
          return idx >= 0 ? String(row[idx] || "").trim() : "";
        };

        return {
          id: `import-${Date.now()}-${index}`,
          name: get(["name", "owner", "contact"]),
          phone: get(["phone", "cell", "mobile", "whatsapp"]),
          suburb: get(["suburb", "area", "location"]),
          address: get(["address", "street"]),
          status: "New" as Status,
          assignee: "Unassigned",
          temperature: "Cold" as const,
          valueBand: "Pending",
          notes: get(["notes", "comments", "memo"]),
          reply: "",
          followUpDue: true,
          source: "Imported CSV",
        };
      })
      .filter((lead) => lead.name || lead.phone || lead.address);

    if (!imported.length) {
      alert("No usable rows found in that CSV");
      return;
    }

    setLeads((prev) => [...imported, ...prev]);
    setSelectedId(imported[0].id);
    setCsvName(file.name);
    alert(`${imported.length} leads imported`);
  };

  const openFollowUps = () => {
    setSearch("");
    const waiting = leads.filter((l) => l.followUpDue && l.status !== "Do Not Contact");
    if (waiting.length) {
      setSelectedId(waiting[0].id);
      setView("leads");
    } else {
      alert("No follow-ups due right now");
    }
  };

  return (
    <div style={styles.page}>
      <input
        ref={fileRef}
        type="file"
        accept=".csv,text/csv"
        style={{ display: "none" }}
        onChange={(e) => void handleCsvFile(e.target.files?.[0] || null)}
      />

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
              <button
                key={item.key}
                onClick={() => setView(item.key)}
                style={{
                  ...styles.sidebarButton,
                  ...(view === item.key ? styles.sidebarButtonActive : {}),
                }}
              >
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
                <div style={styles.heroTag}>✨ Modern canvassing view</div>
                <h1 style={styles.heroTitle}>Lead Management Dashboard</h1>
                <p style={styles.heroText}>
                  Brighter cards, cleaner spacing, visible avatars, stronger colour, and a more usable property CRM feel.
                </p>
              </div>
              <div style={styles.heroButtons}>
                <button onClick={handleImportClick} style={styles.whiteButton}>📤 Import CSV</button>
                <button onClick={exportRegister} style={styles.ghostButton}>📥 Export Register</button>
              </div>
            </div>

            <div style={styles.metricsGrid}>
              <MetricCard title="Contacts" value={stats.total} bg="linear-gradient(135deg,#f8fafc,#e2e8f0)" />
              <MetricCard title="Warm / Hot" value={stats.hot + leads.filter((l) => l.temperature === "Warm").length} bg="linear-gradient(135deg,#fef3c7,#fde68a)" />
              <MetricCard title="Interested" value={stats.interested} bg="linear-gradient(135deg,#dcfce7,#a7f3d0)" />
              <MetricCard title="Appointments" value={stats.appointments} bg="linear-gradient(135deg,#dbeafe,#93c5fd)" />
              <MetricCard title="Due Today" value={stats.due} bg="linear-gradient(135deg,#ffe4e6,#fdba74)" />
            </div>
          </section>

          {view === "dashboard" && (
            <div style={styles.twoCol}>
              <section style={styles.card}>
                <div style={styles.cardHeader}>
                  <div>
                    <h2 style={styles.cardTitle}>Command Centre</h2>
                    <div style={styles.cardSub}>A more visual CRM summary.</div>
                  </div>
                </div>

                <div style={styles.focusGrid}>
                  <FocusCard title="Priority follow-ups" value={`${stats.due} leads`} subtitle="Need action today" gradient="linear-gradient(135deg,#ef4444,#fb923c)" />
                  <FocusCard title="Hot opportunities" value={`${stats.hot} leads`} subtitle="Best chance of conversion" gradient="linear-gradient(135deg,#f59e0b,#facc15)" />
                  <FocusCard title="Appointments" value={`${stats.appointments} booked`} subtitle="Valuation bookings" gradient="linear-gradient(135deg,#0ea5e9,#06b6d4)" />
                  <FocusCard title="Suburb spread" value={`${new Set(leads.map((l) => l.suburb)).size} areas`} subtitle="Campaign coverage" gradient="linear-gradient(135deg,#10b981,#14b8a6)" />
                </div>
              </section>

              <section style={styles.card}>
                <div style={styles.cardHeader}>
                  <div>
                    <h2 style={styles.cardTitle}>Next Best Lead</h2>
                    <div style={styles.cardSub}>Fast CRM action card.</div>
                  </div>
                </div>

                <div style={styles.bestLeadBox}>
                  <div style={styles.bestLeadTop}>
                    <Avatar name={selected.name} large />
                    <div>
                      <div style={styles.bestLeadName}>{selected.name}</div>
                      <div style={styles.bestLeadMeta}>{selected.suburb} · {selected.valueBand}</div>
                      <div style={styles.tagRow}>
                        <StatusPill status={selected.status} />
                        <Tag text={selected.assignee} />
                        <Tag text={selected.temperature} />
                      </div>
                    </div>
                  </div>

                  <div style={styles.actionRow}>
                    <button onClick={copyMessage} style={styles.secondaryAction}>📋 Copy Message</button>
                    <button onClick={openWhatsApp} style={styles.whatsAppAction}>💬 Open WhatsApp</button>
                  </div>
                </div>
              </section>
            </div>
          )}

          {view === "leads" && (
            <div style={styles.twoCol}>
              <section style={styles.card}>
                <div style={styles.cardHeader}>
                  <div>
                    <h2 style={styles.cardTitle}>Lead Desk</h2>
                    <div style={styles.cardSub}>Brighter cards, avatars, quick scanning.</div>
                  </div>
                  <div style={styles.topBadge}>{filtered.length} leads</div>
                </div>

                <div style={styles.searchRow}>
                  <div style={styles.searchBox}>
                    <span>🔎</span>
                    <input
                      value={search}
                      onChange={(e) => setSearch(e.target.value)}
                      placeholder="Search contact, suburb, phone..."
                      style={styles.searchInput}
                    />
                  </div>
                </div>

                <div style={styles.listArea}>
                  {filtered.map((lead) => (
                    <button
                      key={lead.id}
                      onClick={() => {
                        setSelectedId(lead.id);
                        const nextScript =
                          lead.status === "Appointment"
                            ? "Appointment Close"
                            : lead.status === "Interested"
                            ? "Property Value"
                            : lead.status === "Waiting"
                            ? "Buyer Enquiry"
                            : "Recent Sales";
                        setScript(nextScript);
                      }}
                      style={{
                        ...styles.leadCard,
                        ...(selected.id === lead.id ? styles.leadCardActive : {}),
                      }}
                    >
                      <div style={styles.leadCardTop}>
                        <div style={styles.leadCardLeft}>
                          <Avatar name={lead.name} />
                          <div>
                            <div style={styles.leadNameRow}>
                              <div style={styles.leadName}>{lead.name}</div>
                              <StatusPill status={lead.status} />
                            </div>
                            <div style={styles.leadMetaRow}>
                              <span>📞 {lead.phone}</span>
                              <span>📍 {lead.suburb}</span>
                            </div>
                            <div style={styles.addressText}>{lead.address}</div>
                            <div style={styles.leadFooterRow}>
                              <span style={{ ...styles.tempDot, background: tempColor(lead.temperature) }} />
                              <span style={styles.footerSmall}>{lead.temperature}</span>
                              <span style={styles.footerDot}>•</span>
                              <span style={styles.footerSmall}>{lead.assignee}</span>
                              {lead.followUpDue ? <span style={{ ...styles.footerSmall, color: "#be123c" }}>• Follow up</span> : null}
                            </div>
                          </div>
                        </div>
                        <span style={styles.chev}>›</span>
                      </div>
                    </button>
                  ))}
                </div>
              </section>

              <section style={styles.card}>
                <div style={styles.cardHeader}>
                  <div>
                    <h2 style={styles.cardTitle}>Lead Card</h2>
                    <div style={styles.cardSub}>Closer to a proper CRM client pane.</div>
                  </div>
                  <button onClick={nextLead} style={styles.darkButton}>➡ Next</button>
                </div>

                <div style={styles.clientHero}>
                  <div style={styles.clientHeroTop}>
                    <div style={styles.clientHeroLeft}>
                      <Avatar name={selected.name} large />
                      <div>
                        <div style={styles.clientName}>{selected.name}</div>
                        <div style={styles.clientAddress}>{selected.address}</div>
                        <div style={styles.tagRow}>
                          <StatusPill status={selected.status} />
                          <Tag text={selected.temperature} />
                          <Tag text={selected.valueBand} />
                        </div>
                      </div>
                    </div>
                    <div style={styles.infoGrid}>
                      <InfoTile label="Phone" value={selected.phone} />
                      <InfoTile label="Assigned" value={selected.assignee} />
                      <InfoTile label="Suburb" value={selected.suburb} />
                      <InfoTile label="Source" value={selected.source} />
                    </div>
                  </div>
                </div>

                <div style={styles.statusGrid}>
                  <ActionPill label="Waiting" onClick={() => markStatus("Waiting")} />
                  <ActionPill label="Interested" tone="green" onClick={() => markStatus("Interested")} />
                  <ActionPill label="Appointment" tone="blue" onClick={() => markStatus("Appointment")} />
                  <ActionPill label="Opt Out" tone="red" onClick={() => markStatus("Do Not Contact")} />
                </div>

                <div style={styles.formGrid}>
                  <div>
                    <label style={styles.label}>Script</label>
                    <select value={script} onChange={(e) => setScript(e.target.value)} style={styles.select}>
                      {Object.keys(scripts).map((s) => (
                        <option key={s}>{s}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label style={styles.label}>Assigned to</label>
                    <select
                      value={selected.assignee}
                      onChange={(e) =>
                        setLeads((prev) => prev.map((l) => (l.id === selected.id ? { ...l, assignee: e.target.value } : l)))
                      }
                      style={styles.select}
                    >
                      {["Lerato", "Megan", "Unassigned"].map((a) => (
                        <option key={a}>{a}</option>
                      ))}
                    </select>
                  </div>
                </div>

                <div style={styles.messageCard}>
                  <div style={styles.messageHeader}>
                    <div style={styles.messageTitle}>WhatsApp Draft</div>
                    <Tag text={script} />
                  </div>
                  <textarea readOnly value={message} style={styles.textarea} />
                  <div style={styles.actionRow3}>
                    <button onClick={copyMessage} style={styles.secondaryAction}>📋 Copy Message</button>
                    <button onClick={openWhatsApp} style={styles.whatsAppAction}>💬 Open WhatsApp</button>
                    <button
                      onClick={() =>
                        setLeads((prev) =>
                          prev.map((l) =>
                            l.id === selected.id ? { ...l, followUpDue: false, status: l.status === "New" ? "Waiting" : l.status } : l
                          )
                        )
                      }
                      style={styles.darkButtonWide}
                    >
                      📨 Log Send
                    </button>
                  </div>
                </div>

                <div style={styles.formGrid}>
                  <div>
                    <label style={styles.label}>Reply / Feedback</label>
                    <textarea
                      value={selected.reply}
                      onChange={(e) =>
                        setLeads((prev) => prev.map((l) => (l.id === selected.id ? { ...l, reply: e.target.value } : l)))
                      }
                      style={styles.smallTextarea}
                    />
                  </div>
                  <div>
                    <label style={styles.label}>Notes</label>
                    <textarea
                      value={selected.notes}
                      onChange={(e) =>
                        setLeads((prev) => prev.map((l) => (l.id === selected.id ? { ...l, notes: e.target.value } : l)))
                      }
                      style={styles.smallTextarea}
                    />
                  </div>
                </div>
              </section>
            </div>
          )}

          {view === "pipeline" && (
            <div style={styles.pipelineGrid}>
              {pipeline.map((column) => (
                <section key={column.status} style={styles.pipelineCol}>
                  <div style={styles.pipelineHead}>
                    <div style={styles.pipelineTitle}>{column.status}</div>
                    <div style={styles.topBadge}>{column.items.length}</div>
                  </div>
                  <div style={styles.pipelineStack}>
                    {column.items.map((lead) => (
                      <button
                        key={lead.id}
                        onClick={() => {
                          setSelectedId(lead.id);
                          setView("leads");
                        }}
                        style={styles.pipelineCard}
                      >
                        <div style={styles.pipelineCardTop}>
                          <Avatar name={lead.name} />
                          <div>
                            <div style={styles.pipelineLeadName}>{lead.name}</div>
                            <div style={styles.pipelineLeadSub}>{lead.suburb}</div>
                          </div>
                        </div>
                        <div style={styles.pipelineFoot}>
                          <span>{lead.assignee}</span>
                          <span style={{ ...styles.tempDot, background: tempColor(lead.temperature) }} />
                        </div>
                      </button>
                    ))}
                  </div>
                </section>
              ))}
            </div>
          )}

          {view === "bulk" && (
            <div style={styles.twoCol}>
              <section style={styles.card}>
                <div style={styles.cardHeader}>
                  <div>
                    <h2 style={styles.cardTitle}>Bulk Send Builder</h2>
                    <div style={styles.cardSub}>Select leads and prepare a batch.</div>
                  </div>
                  <button onClick={exportBulk} style={styles.darkButton}>📥 Export CSV</button>
                </div>

                <div style={styles.tableWrap}>
                  <table style={styles.table}>
                    <thead>
                      <tr>
                        <th style={styles.th}></th>
                        <th style={styles.th}>Lead</th>
                        <th style={styles.th}>Phone</th>
                        <th style={styles.th}>Area</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filtered.map((lead) => (
                        <tr key={lead.id}>
                          <td style={styles.td}>
                            <input
                              type="checkbox"
                              checked={!!selectedBulk[lead.id]}
                              onChange={() => setSelectedBulk((prev) => ({ ...prev, [lead.id]: !prev[lead.id] }))}
                            />
                          </td>
                          <td style={styles.td}>{lead.name}</td>
                          <td style={styles.td}>{lead.phone}</td>
                          <td style={styles.td}>{lead.suburb}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </section>

              <section style={styles.card}>
                <div style={styles.cardHeader}>
                  <div>
                    <h2 style={styles.cardTitle}>Preview Panel</h2>
                    <div style={styles.cardSub}>What your canvasser will send.</div>
                  </div>
                </div>

                <div style={styles.previewStack}>
                  {filtered.filter((l) => selectedBulk[l.id]).length ? (
                    filtered
                      .filter((l) => selectedBulk[l.id])
                      .map((lead) => (
                        <div key={lead.id} style={styles.previewCard}>
                          <div style={styles.previewHead}>
                            <div style={styles.previewName}>{lead.name}</div>
                            <Tag text={lead.suburb} />
                          </div>
                          <div style={styles.previewMessage}>{renderScript(scripts[script], lead)}</div>
                        </div>
                      ))
                  ) : (
                    <div style={styles.emptyBox}>Select leads to preview the batch.</div>
                  )}
                </div>
              </section>
            </div>
          )}

          {view === "manager" && (
            <div style={styles.twoCol}>
              <section style={styles.card}>
                <div style={styles.cardHeader}>
                  <div>
                    <h2 style={styles.cardTitle}>Suburb Results</h2>
                    <div style={styles.cardSub}>Visual suburb-by-suburb momentum.</div>
                  </div>
                </div>

                <div style={styles.chartStack}>
                  {Object.values(
                    leads.reduce<Record<string, { total: number; engaged: number; suburb: string }>>((acc, lead) => {
                      if (!acc[lead.suburb]) acc[lead.suburb] = { suburb: lead.suburb, total: 0, engaged: 0 };
                      acc[lead.suburb].total += 1;
                      if (lead.status === "Interested" || lead.status === "Appointment") acc[lead.suburb].engaged += 1;
                      return acc;
                    }, {})
                  ).map((row) => {
                    const percent = row.total ? Math.round((row.engaged / row.total) * 100) : 0;
                    return (
                      <div key={row.suburb}>
                        <div style={styles.chartLabelRow}>
                          <span>{row.suburb}</span>
                          <span>{percent}% engaged</span>
                        </div>
                        <div style={styles.barBg}>
                          <div style={{ ...styles.barFill, width: `${percent}%` }} />
                        </div>
                      </div>
                    );
                  })}
                </div>
              </section>

              <section style={styles.card}>
                <div style={styles.cardHeader}>
                  <div>
                    <h2 style={styles.cardTitle}>Team Snapshot</h2>
                    <div style={styles.cardSub}>Cleaner manager view with cards.</div>
                  </div>
                </div>

                <div style={styles.previewStack}>
                  {["Lerato", "Megan"].map((agent, idx) => {
                    const rows = leads.filter((l) => l.assignee === agent);
                    return (
                      <div key={agent} style={styles.managerCard}>
                        <div style={styles.managerHead}>
                          <div style={styles.managerName}>⭐ {idx + 1}. {agent}</div>
                          <div style={styles.darkBadge}>{rows.length} leads</div>
                        </div>
                        <div style={styles.managerGrid}>
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
        </main>
      </div>
    </div>
  );
}

function Avatar({ name, large }: { name: string; large?: boolean }) {
  return (
    <div
      style={{
        ...styles.avatar,
        ...(large ? styles.avatarLarge : {}),
      }}
    >
      {initials(name)}
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

function FocusCard({ title, value, subtitle, gradient }: { title: string; value: string; subtitle: string; gradient: string }) {
  return (
    <div style={styles.focusCard}>
      <div style={{ ...styles.focusIcon, background: gradient }} />
      <div style={styles.focusCardTitle}>{title}</div>
      <div style={styles.focusCardValue}>{value}</div>
      <div style={styles.focusCardSub}>{subtitle}</div>
    </div>
  );
}

function StatusPill({ status }: { status: Status }) {
  const c = statusColors(status);
  return <span style={{ ...styles.statusPill, background: c.bg, color: c.color }}>{status}</span>;
}

function Tag({ text }: { text: string }) {
  return <span style={styles.tag}>{text}</span>;
}

function InfoTile({ label, value }: { label: string; value: string }) {
  return (
    <div style={styles.infoTile}>
      <div style={styles.infoLabel}>{label}</div>
      <div style={styles.infoValue}>{value}</div>
    </div>
  );
}

function ActionPill({ label, onClick, tone }: { label: string; onClick: () => void; tone?: "green" | "blue" | "red" }) {
  let background = "#ffffff";
  let color = "#0f172a";
  let border = "1px solid #e2e8f0";

  if (tone === "green") {
    background = "#059669";
    color = "#ffffff";
    border = "none";
  }
  if (tone === "blue") {
    background = "#2563eb";
    color = "#ffffff";
    border = "none";
  }
  if (tone === "red") {
    background = "#e11d48";
    color = "#ffffff";
    border = "none";
  }

  return (
    <button onClick={onClick} style={{ ...styles.actionPill, background, color, border }}>
      {label}
    </button>
  );
}

function MiniBox({ label, value }: { label: string; value: number }) {
  return (
    <div style={styles.miniBox}>
      <div style={styles.miniLabel}>{label}</div>
      <div style={styles.miniValue}>{value}</div>
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  page: {
    minHeight: "100vh",
    background: "linear-gradient(135deg,#eaf3ff 0%,#f7fbff 35%,#f8fafc 100%)",
    color: "#0f172a",
    fontFamily: 'Inter, ui-sans-serif, system-ui, -apple-system, "Segoe UI", sans-serif',
  },
  layout: {
    display: "grid",
    minHeight: "100vh",
    gridTemplateColumns: "280px 1fr",
  },
  sidebar: {
    background: "#0b1730",
    color: "white",
    position: "relative",
  },
  sidebarHeader: {
    borderBottom: "1px solid rgba(255,255,255,0.1)",
    padding: 24,
    display: "flex",
    gap: 16,
    alignItems: "center",
  },
  logoBox: {
    width: 56,
    height: 56,
    borderRadius: 18,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    background: "linear-gradient(135deg,#22d3ee 0%,#2563eb 100%)",
    boxShadow: "0 18px 40px rgba(37,99,235,0.35)",
    fontSize: 26,
  },
  brand: {
    fontSize: 22,
    fontWeight: 700,
  },
  brandSub: {
    fontSize: 12,
    color: "rgba(207,250,254,0.8)",
  },
  sidebarLabel: {
    marginBottom: 12,
    paddingLeft: 12,
    fontSize: 11,
    letterSpacing: "0.24em",
    textTransform: "uppercase",
    color: "rgba(207,250,254,0.6)",
  },
  sidebarButton: {
    width: "100%",
    display: "flex",
    alignItems: "center",
    gap: 12,
    borderRadius: 18,
    padding: "14px 16px",
    background: "transparent",
    color: "#e2e8f0",
    border: "none",
    cursor: "pointer",
    marginBottom: 8,
    textAlign: "left",
    fontSize: 14,
  },
  sidebarButtonActive: {
    background: "white",
    color: "#0f172a",
    boxShadow: "0 16px 30px rgba(15,23,42,0.25)",
  },
  focusCardDark: {
    borderRadius: 28,
    border: "1px solid rgba(255,255,255,0.1)",
    background: "rgba(255,255,255,0.05)",
    padding: 16,
    backdropFilter: "blur(8px)",
  },
  focusTitle: {
    marginBottom: 12,
    fontSize: 14,
    fontWeight: 600,
  },
  darkRow: {
    display: "flex",
    justifyContent: "space-between",
    background: "rgba(255,255,255,0.05)",
    borderRadius: 16,
    padding: "10px 12px",
    marginBottom: 10,
    fontSize: 14,
    color: "#e2e8f0",
  },
  main: {
    padding: 32,
  },
  hero: {
    overflow: "hidden",
    borderRadius: 34,
    border: "1px solid #e2e8f0",
    background: "white",
    boxShadow: "0 30px 80px rgba(15,23,42,0.09)",
    marginBottom: 24,
  },
  heroTop: {
    background: "linear-gradient(120deg,#0f172a 0%,#1d4ed8 45%,#06b6d4 100%)",
    color: "white",
    padding: 32,
    display: "flex",
    justifyContent: "space-between",
    gap: 20,
    flexWrap: "wrap",
    alignItems: "center",
  },
  heroTag: {
    display: "inline-flex",
    alignItems: "center",
    gap: 8,
    borderRadius: 999,
    background: "rgba(255,255,255,0.15)",
    padding: "6px 12px",
    fontSize: 12,
    fontWeight: 600,
    backdropFilter: "blur(8px)",
    marginBottom: 10,
  },
  heroTitle: {
    margin: 0,
    fontSize: 44,
    lineHeight: 1.05,
  },
  heroText: {
    marginTop: 10,
    maxWidth: 760,
    fontSize: 15,
    color: "#cffafe",
  },
  heroButtons: {
    display: "flex",
    gap: 10,
    flexWrap: "wrap",
  },
  whiteButton: {
    borderRadius: 18,
    background: "white",
    color: "#0f172a",
    border: "none",
    padding: "14px 16px",
    fontSize: 14,
    fontWeight: 600,
    cursor: "pointer",
    boxShadow: "0 12px 24px rgba(15,23,42,0.18)",
  },
  ghostButton: {
    borderRadius: 18,
    background: "rgba(255,255,255,0.15)",
    color: "white",
    border: "none",
    padding: "14px 16px",
    fontSize: 14,
    fontWeight: 600,
    cursor: "pointer",
    backdropFilter: "blur(8px)",
  },
  metricsGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(5, minmax(0, 1fr))",
    gap: 16,
    padding: 24,
  },
  metricCard: {
    borderRadius: 28,
    border: "1px solid #e2e8f0",
    padding: 20,
    boxShadow: "0 8px 18px rgba(15,23,42,0.05)",
  },
  metricTitle: {
    fontSize: 13,
    fontWeight: 600,
    opacity: 0.75,
  },
  metricValue: {
    marginTop: 10,
    fontSize: 34,
    fontWeight: 700,
  },
  twoCol: {
    display: "grid",
    gridTemplateColumns: "0.95fr 1.05fr",
    gap: 24,
  },
  card: {
    borderRadius: 32,
    border: "1px solid #e2e8f0",
    background: "white",
    padding: 24,
    boxShadow: "0 8px 18px rgba(15,23,42,0.05)",
  },
  cardHeader: {
    display: "flex",
    justifyContent: "space-between",
    gap: 16,
    alignItems: "center",
    marginBottom: 16,
  },
  cardTitle: {
    margin: 0,
    fontSize: 24,
    fontWeight: 700,
  },
  cardSub: {
    marginTop: 4,
    fontSize: 14,
    color: "#64748b",
  },
  topBadge: {
    borderRadius: 999,
    background: "#eff6ff",
    color: "#1d4ed8",
    padding: "8px 12px",
    fontSize: 12,
    fontWeight: 600,
  },
  focusGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(2, minmax(0, 1fr))",
    gap: 16,
  },
  focusCard: {
    borderRadius: 28,
    border: "1px solid #e2e8f0",
    background: "white",
    padding: 20,
    boxShadow: "0 8px 18px rgba(15,23,42,0.05)",
  },
  focusIcon: {
    width: 46,
    height: 46,
    borderRadius: 16,
    marginBottom: 14,
  },
  focusCardTitle: {
    fontSize: 14,
    fontWeight: 600,
    color: "#64748b",
  },
  focusCardValue: {
    marginTop: 10,
    fontSize: 28,
    fontWeight: 700,
    color: "#0f172a",
  },
  focusCardSub: {
    marginTop: 6,
    fontSize: 12,
    color: "#64748b",
  },
  bestLeadBox: {
    borderRadius: 30,
    background: "linear-gradient(135deg,#eef2ff 0%,#ffffff 50%,#ecfeff 100%)",
    padding: 20,
  },
  bestLeadTop: {
    display: "flex",
    gap: 16,
    alignItems: "center",
  },
  bestLeadName: {
    fontSize: 22,
    fontWeight: 700,
  },
  bestLeadMeta: {
    marginTop: 4,
    fontSize: 14,
    color: "#64748b",
  },
  tagRow: {
    display: "flex",
    gap: 8,
    flexWrap: "wrap",
    marginTop: 12,
  },
  actionRow: {
    display: "grid",
    gridTemplateColumns: "1fr 1fr",
    gap: 12,
    marginTop: 20,
  },
  secondaryAction: {
    borderRadius: 18,
    border: "1px solid #e2e8f0",
    background: "white",
    color: "#0f172a",
    padding: "14px 16px",
    fontSize: 14,
    fontWeight: 600,
    cursor: "pointer",
    boxShadow: "0 6px 16px rgba(15,23,42,0.05)",
  },
  whatsAppAction: {
    borderRadius: 18,
    border: "none",
    background: "linear-gradient(90deg,#10b981 0%,#06b6d4 100%)",
    color: "white",
    padding: "14px 16px",
    fontSize: 14,
    fontWeight: 700,
    cursor: "pointer",
    boxShadow: "0 14px 28px rgba(16,185,129,0.25)",
  },
  searchRow: {
    marginBottom: 16,
  },
  searchBox: {
    display: "flex",
    alignItems: "center",
    gap: 10,
    borderRadius: 18,
    border: "1px solid #e2e8f0",
    background: "#f8fafc",
    padding: "14px 16px",
    boxShadow: "0 6px 12px rgba(15,23,42,0.03)",
  },
  searchInput: {
    width: "100%",
    border: "none",
    outline: "none",
    background: "transparent",
    fontSize: 14,
  },
  listArea: {
    maxHeight: 760,
    overflow: "auto",
    paddingRight: 4,
  },
  leadCard: {
    width: "100%",
    borderRadius: 28,
    border: "1px solid #e2e8f0",
    background: "white",
    padding: 16,
    marginBottom: 12,
    textAlign: "left",
    cursor: "pointer",
    transition: "all 0.2s ease",
    boxShadow: "0 6px 16px rgba(15,23,42,0.05)",
  },
  leadCardActive: {
    border: "1px solid #93c5fd",
    background: "linear-gradient(135deg,#eff6ff 0%,#ffffff 55%,#ecfeff 100%)",
    boxShadow: "0 12px 28px rgba(59,130,246,0.12)",
  },
  leadCardTop: {
    display: "flex",
    justifyContent: "space-between",
    gap: 12,
    alignItems: "flex-start",
  },
  leadCardLeft: {
    display: "flex",
    gap: 12,
    alignItems: "flex-start",
  },
  leadNameRow: {
    display: "flex",
    gap: 8,
    alignItems: "center",
    flexWrap: "wrap",
  },
  leadName: {
    fontWeight: 700,
    color: "#0f172a",
  },
  leadMetaRow: {
    display: "flex",
    gap: 14,
    flexWrap: "wrap",
    marginTop: 8,
    fontSize: 13,
    color: "#64748b",
  },
  addressText: {
    marginTop: 8,
    fontSize: 12,
    color: "#64748b",
  },
  leadFooterRow: {
    display: "flex",
    gap: 8,
    alignItems: "center",
    marginTop: 10,
    flexWrap: "wrap",
  },
  footerSmall: {
    fontSize: 12,
    color: "#475569",
    fontWeight: 600,
  },
  footerDot: {
    color: "#cbd5e1",
    fontSize: 12,
  },
  tempDot: {
    width: 10,
    height: 10,
    borderRadius: 999,
    display: "inline-block",
  },
  chev: {
    color: "#94a3b8",
    fontSize: 22,
    lineHeight: 1,
  },
  clientHero: {
    borderRadius: 32,
    background: "linear-gradient(135deg,#eef2ff 0%,#ffffff 45%,#ecfeff 100%)",
    padding: 20,
  },
  clientHeroTop: {
    display: "flex",
    justifyContent: "space-between",
    gap: 20,
    flexWrap: "wrap",
  },
  clientHeroLeft: {
    display: "flex",
    gap: 16,
    alignItems: "flex-start",
  },
  clientName: {
    fontSize: 30,
    fontWeight: 700,
    color: "#0f172a",
  },
  clientAddress: {
    marginTop: 4,
    fontSize: 14,
    color: "#64748b",
  },
  infoGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(2, minmax(0, 1fr))",
    gap: 10,
    minWidth: 280,
  },
  infoTile: {
    borderRadius: 18,
    border: "1px solid #e2e8f0",
    background: "white",
    padding: "12px 14px",
    boxShadow: "0 6px 14px rgba(15,23,42,0.04)",
  },
  infoLabel: {
    fontSize: 11,
    textTransform: "uppercase",
    letterSpacing: "0.14em",
    color: "#64748b",
    marginBottom: 6,
  },
  infoValue: {
    fontSize: 14,
    fontWeight: 600,
    color: "#0f172a",
  },
  statusGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(4, minmax(0, 1fr))",
    gap: 12,
    marginTop: 20,
  },
  actionPill: {
    borderRadius: 18,
    padding: "14px 14px",
    fontSize: 14,
    fontWeight: 700,
    cursor: "pointer",
    boxShadow: "0 6px 14px rgba(15,23,42,0.05)",
  },
  formGrid: {
    display: "grid",
    gridTemplateColumns: "1fr 1fr",
    gap: 16,
    marginTop: 20,
  },
  label: {
    display: "block",
    marginBottom: 8,
    fontSize: 11,
    fontWeight: 700,
    color: "#64748b",
    textTransform: "uppercase",
    letterSpacing: "0.18em",
  },
  select: {
    width: "100%",
    borderRadius: 18,
    border: "1px solid #e2e8f0",
    background: "white",
    padding: "14px 16px",
    fontSize: 14,
    boxShadow: "0 6px 14px rgba(15,23,42,0.04)",
    outline: "none",
  },
  messageCard: {
    marginTop: 20,
    borderRadius: 30,
    border: "1px solid #e2e8f0",
    background: "linear-gradient(135deg,#ffffff 0%,#ecfdf5 100%)",
    padding: 16,
    boxShadow: "0 6px 14px rgba(15,23,42,0.04)",
  },
  messageHeader: {
    display: "flex",
    justifyContent: "space-between",
    gap: 12,
    alignItems: "center",
    marginBottom: 12,
  },
  messageTitle: {
    fontSize: 14,
    fontWeight: 700,
    color: "#1e293b",
  },
  textarea: {
    width: "100%",
    minHeight: 180,
    borderRadius: 18,
    border: "1px solid #e2e8f0",
    background: "white",
    padding: 16,
    fontSize: 14,
    boxShadow: "inset 0 2px 6px rgba(15,23,42,0.05)",
    outline: "none",
    resize: "vertical" as const,
  },
  actionRow3: {
    display: "grid",
    gridTemplateColumns: "1fr 1fr 1fr",
    gap: 12,
    marginTop: 16,
  },
  darkButton: {
    borderRadius: 18,
    background: "#0f172a",
    color: "white",
    border: "none",
    padding: "12px 16px",
    fontSize: 14,
    fontWeight: 700,
    cursor: "pointer",
    boxShadow: "0 12px 24px rgba(15,23,42,0.16)",
  },
  darkButtonWide: {
    borderRadius: 18,
    background: "linear-gradient(90deg,#0f172a 0%,#334155 100%)",
    color: "white",
    border: "none",
    padding: "14px 16px",
    fontSize: 14,
    fontWeight: 700,
    cursor: "pointer",
    boxShadow: "0 12px 24px rgba(15,23,42,0.16)",
  },
  smallTextarea: {
    width: "100%",
    minHeight: 120,
    borderRadius: 18,
    border: "1px solid #e2e8f0",
    background: "white",
    padding: 16,
    fontSize: 14,
    boxShadow: "0 6px 14px rgba(15,23,42,0.04)",
    outline: "none",
    resize: "vertical" as const,
  },
  pipelineGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(5, minmax(0, 1fr))",
    gap: 16,
  },
  pipelineCol: {
    borderRadius: 30,
    border: "1px solid #e2e8f0",
    background: "white",
    padding: 16,
    boxShadow: "0 8px 18px rgba(15,23,42,0.05)",
  },
  pipelineHead: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 16,
  },
  pipelineTitle: {
    fontWeight: 700,
    color: "#0f172a",
  },
  pipelineStack: {
    display: "grid",
    gap: 12,
  },
  pipelineCard: {
    width: "100%",
    borderRadius: 18,
    border: "1px solid #e2e8f0",
    background: "linear-gradient(135deg,#ffffff 0%,#f8fafc 100%)",
    padding: 14,
    textAlign: "left",
    cursor: "pointer",
    boxShadow: "0 6px 14px rgba(15,23,42,0.04)",
  },
  pipelineCardTop: {
    display: "flex",
    gap: 10,
    alignItems: "center",
  },
  pipelineLeadName: {
    fontSize: 14,
    fontWeight: 700,
    color: "#0f172a",
  },
  pipelineLeadSub: {
    fontSize: 12,
    color: "#64748b",
  },
  pipelineFoot: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: 12,
    fontSize: 12,
    color: "#64748b",
  },
  tableWrap: {
    overflow: "hidden",
    borderRadius: 28,
    border: "1px solid #e2e8f0",
  },
  table: {
    width: "100%",
    borderCollapse: "collapse" as const,
    fontSize: 14,
  },
  th: {
    background: "#f8fafc",
    color: "#475569",
    textAlign: "left" as const,
    padding: "14px 16px",
    fontWeight: 600,
  },
  td: {
    padding: "14px 16px",
    borderTop: "1px solid #e2e8f0",
  },
  previewStack: {
    display: "grid",
    gap: 12,
  },
  previewCard: {
    borderRadius: 18,
    border: "1px solid #e2e8f0",
    background: "linear-gradient(135deg,#ffffff 0%,#f8fafc 100%)",
    padding: 16,
    boxShadow: "0 6px 14px rgba(15,23,42,0.04)",
  },
  previewHead: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 10,
  },
  previewName: {
    fontWeight: 700,
    color: "#0f172a",
  },
  previewMessage: {
    fontFamily: 'ui-monospace, SFMono-Regular, Menlo, Consolas, monospace',
    fontSize: 12,
    color: "#475569",
    lineHeight: 1.5,
  },
  emptyBox: {
    borderRadius: 18,
    background: "#f1f5f9",
    color: "#64748b",
    padding: 32,
    textAlign: "center" as const,
    fontSize: 14,
  },
  chartStack: {
    display: "grid",
    gap: 18,
  },
  chartLabelRow: {
    display: "flex",
    justifyContent: "space-between",
    marginBottom: 8,
    fontSize: 14,
    color: "#334155",
  },
  barBg: {
    height: 12,
    background: "#e2e8f0",
    borderRadius: 999,
    overflow: "hidden",
  },
  barFill: {
    height: "100%",
    background: "linear-gradient(90deg,#2563eb 0%,#06b6d4 100%)",
    borderRadius: 999,
  },
  managerCard: {
    borderRadius: 18,
    border: "1px solid #e2e8f0",
    background: "linear-gradient(135deg,#ffffff 0%,#f8fafc 100%)",
    padding: 16,
    boxShadow: "0 6px 14px rgba(15,23,42,0.04)",
  },
  managerHead: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
  },
  managerName: {
    fontWeight: 700,
    color: "#0f172a",
  },
  darkBadge: {
    borderRadius: 999,
    background: "#0f172a",
    color: "white",
    padding: "6px 12px",
    fontSize: 12,
    fontWeight: 700,
  },
  managerGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(3, minmax(0, 1fr))",
    gap: 10,
    marginTop: 12,
  },
  miniBox: {
    borderRadius: 16,
    background: "#f1f5f9",
    padding: 12,
    textAlign: "center" as const,
  },
  miniLabel: {
    fontSize: 11,
    color: "#64748b",
    textTransform: "uppercase" as const,
    letterSpacing: "0.08em",
  },
  miniValue: {
    marginTop: 6,
    fontSize: 20,
    fontWeight: 700,
    color: "#0f172a",
  },
  avatar: {
    width: 44,
    height: 44,
    borderRadius: 16,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    background: "linear-gradient(135deg,#2563eb 0%,#06b6d4 100%)",
    color: "white",
    fontWeight: 700,
    boxShadow: "0 12px 24px rgba(37,99,235,0.2)",
    flexShrink: 0,
  },
  avatarLarge: {
    width: 58,
    height: 58,
    fontSize: 18,
    borderRadius: 18,
  },
  statusPill: {
    borderRadius: 999,
    padding: "6px 12px",
    fontSize: 12,
    fontWeight: 700,
    boxShadow: "inset 0 0 0 1px rgba(0,0,0,0.04)",
  },
  tag: {
    borderRadius: 999,
    padding: "6px 12px",
    fontSize: 12,
    fontWeight: 600,
    color: "#475569",
    background: "white",
    border: "1px solid #e2e8f0",
    boxShadow: "0 4px 10px rgba(15,23,42,0.04)",
  },
};
