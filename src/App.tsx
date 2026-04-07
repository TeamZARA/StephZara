import React, { useMemo, useState } from "react";
import { Copy, MessageSquare, ArrowRight } from "lucide-react";

type Contact = {
  id: string;
  name: string;
  phone: string;
  suburb: string;
};

const initialContacts: Contact[] = [
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
  {
    id: "3",
    name: "Amanda Botha",
    phone: "+27 84 555 0112",
    suburb: "Table View",
  }
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
  const [contacts, setContacts] = useState(initialContacts);
  const [currentIndex, setCurrentIndex] = useState(0);

  const current = contacts[currentIndex];

  const draftMessage = useMemo(() => {
    if (!current) return "";
    return renderTemplate(current);
  }, [current]);

  const copyMessage = async () => {
    try {
      await navigator.clipboard.writeText(draftMessage);
      alert("Message copied");
    } catch {
      alert("Copy failed");
    }
  };

  const openWhatsApp = () => {
    const url = buildWhatsAppLink(current.phone, draftMessage);
    window.open(url, "_blank");
  };

  const nextContact = () => {
    if (currentIndex < contacts.length - 1) {
      setCurrentIndex(currentIndex + 1);
    } else {
      alert("No more contacts");
    }
  };

  return (
    <div style={{ maxWidth: 800, margin: "0 auto", padding: 20 }}>
      <h1>StephZara Canvassing System</h1>

      {/* CONTACT LIST */}
      <div style={{ marginBottom: 20 }}>
        <h3>Contacts</h3>
        {contacts.map((c, i) => (
          <div
            key={c.id}
            style={{
              padding: 10,
              marginBottom: 8,
              border: "1px solid #ddd",
              borderRadius: 8,
              background: i === currentIndex ? "#eef2ff" : "white"
            }}
          >
            {c.name} — {c.suburb}
          </div>
        ))}
      </div>

      {/* CURRENT CONTACT */}
      {current && (
        <div style={{ border: "1px solid #ddd", padding: 20, borderRadius: 10 }}>
          <h2>{current.name}</h2>
          <p>{current.phone}</p>
          <p>{current.suburb}</p>

          <textarea
            value={draftMessage}
            readOnly
            style={{
              width: "100%",
              minHeight: 120,
              marginTop: 10,
              marginBottom: 10,
              padding: 10,
              borderRadius: 8,
              border: "1px solid #ccc"
            }}
          />

          {/* ACTION BUTTONS */}
          <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
            <button onClick={copyMessage}>
              <Copy size={16} /> Copy Message
            </button>

            <button onClick={openWhatsApp}>
              <MessageSquare size={16} /> Open WhatsApp
            </button>

            <button onClick={nextContact}>
              <ArrowRight size={16} /> Next Contact
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
