import React, { useMemo, useState } from "react";
import { Copy, MessageSquare } from "lucide-react";

type Contact = {
  id: string;
  name: string;
  phone: string;
  suburb: string;
};

const contacts: Contact[] = [
  {
    id: "1",
    name: "Janine Smith",
    phone: "+27 82 555 0141",
    suburb: "Durbanville",
  },
  {
    id: "2",
    name: "Peter Jacobs",
    phone: "+27 83 555 0198",
    suburb: "Blouberg",
  },
];

function renderTemplate(contact: Contact) {
  return `Hi ${contact.name}, quick one — I’m working with buyers in ${contact.suburb}. Would you consider selling if the price made sense?`;
}

function cleanPhoneForWhatsApp(phone: string) {
  return phone.replace(/\D/g, "");
}

function buildWhatsAppLink(phone: string, message: string) {
  const cleanPhone = cleanPhoneForWhatsApp(phone);
  const encodedMessage = encodeURIComponent(message);
  return `https://wa.me/${cleanPhone}?text=${encodedMessage}`;
}

export default function App() {
  const [selectedId, setSelectedId] = useState("1");

  const selected = useMemo(
    () => contacts.find((c) => c.id === selectedId) || contacts[0],
    [selectedId]
  );

  const draftMessage = renderTemplate(selected);

  const copyMessage = async () => {
    try {
      await navigator.clipboard.writeText(draftMessage);
      alert("Message copied");
    } catch {
      alert("Could not copy message");
    }
  };

  const openWhatsApp = () => {
    const url = buildWhatsAppLink(selected.phone, draftMessage);
    window.open(url, "_blank");
  };

  return (
    <div style={{ padding: 20, maxWidth: 700, margin: "0 auto" }}>
      <h1>StephZara App</h1>

      <div style={{ marginBottom: 20 }}>
        {contacts.map((contact) => (
          <button
            key={contact.id}
            onClick={() => setSelectedId(contact.id)}
            style={{
              display: "block",
              width: "100%",
              padding: 12,
              marginBottom: 10,
              textAlign: "left",
              borderRadius: 10,
              border: "1px solid #ddd",
              background: selectedId === contact.id ? "#f3f4f6" : "white",
              cursor: "pointer",
            }}
          >
            {contact.name} — {contact.suburb}
          </button>
        ))}
      </div>

      <div style={{ padding: 16, border: "1px solid #ddd", borderRadius: 12 }}>
        <h2>{selected.name}</h2>
        <p>{selected.phone}</p>

        <textarea
          value={draftMessage}
          readOnly
          style={{
            width: "100%",
            minHeight: 120,
            marginTop: 12,
            marginBottom: 12,
            padding: 12,
            borderRadius: 10,
            border: "1px solid #ddd",
          }}
        />

        <div style={{ display: "flex", gap: 12 }}>
          <button
            onClick={copyMessage}
            style={{
              padding: "10px 14px",
              borderRadius: 10,
              border: "1px solid #ddd",
              background: "white",
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              gap: 8,
            }}
          >
            <Copy size={16} />
            Copy Message
          </button>

          <button
            onClick={openWhatsApp}
            style={{
              padding: "10px 14px",
              borderRadius: 10,
              border: "none",
              background: "#111827",
              color: "white",
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              gap: 8,
            }}
          >
            <MessageSquare size={16} />
            Open in WhatsApp
          </button>
        </div>
      </div>
    </div>
  );
}
Add WhatsApp open and Copy buttons
