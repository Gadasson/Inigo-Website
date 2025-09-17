"use client";
import React, { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import emailjs from "@emailjs/browser";

type Values = { name: string; email: string; subject: string; message: string; website?: string };

export default function ContactForm() {
  const searchParams = useSearchParams();
  const [values, setValues] = useState<Values>({
    name: "",
    email: "",
    subject: "",
    message: "",
    website: "", // honeypot
  });
  const [sending, setSending] = useState(false);
  const [status, setStatus] = useState<null | { ok: boolean; msg: string }>(null);

  // Prefill from query params when available; ensure clearing when not present
  useEffect(() => {
    const subject = searchParams.get('subject') || "";
    const message = searchParams.get('message') || "";

    if (subject || message) {
      setValues((v) => ({ ...v, subject, message }));
    } else {
      setValues((v) => ({ ...v, subject: "", message: "" }));
    }
  }, [searchParams]);

  const onChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setValues((v) => ({ ...v, [name]: value }));
  };

  const validate = (v: Values) => {
    // Comprehensive email regex that handles all valid email formats including dots, plus signs, and underscores
    const emailOk = /^[a-zA-Z0-9]([a-zA-Z0-9._+-]*[a-zA-Z0-9])?@[a-zA-Z0-9]([a-zA-Z0-9.-]*[a-zA-Z0-9])?\.[a-zA-Z]{2,}$/.test(v.email);
    return (
      v.name.trim().length >= 2 &&
      v.name.trim().length <= 60 &&
      emailOk &&
      v.subject.trim().length >= 2 &&
      v.subject.trim().length <= 120 &&
      v.message.trim().length >= 10 &&
      v.message.trim().length <= 2000
    );
  };

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setStatus(null);

    // Honeypot: if a bot filled this, bail silently
    if (values.website && values.website.trim().length > 0) return;

    if (!validate(values)) {
      setStatus({ ok: false, msg: "Please check your details and try again." });
      return;
    }

    setSending(true);
    
    // Debug: Log what we're sending
    const emailData = {
      from_name: values.name,
      from_email: values.email,
      subject: values.subject,
      message: values.message,
    };
    
    console.log('Sending email with data:', emailData);
    
    try {
      const res = await emailjs.send(
        "service_tjt629a",
        "template_sktw6yf",
        emailData,
        "YjOp3b-wXRhW8gVZt"
      );
      if (res.status === 200) {
        setStatus({ ok: true, msg: "✅ Message sent. We'll get back to you soon." });
        setValues({ name: "", email: "", subject: "", message: "", website: "" });
      } else {
        setStatus({ ok: false, msg: "Could not send right now. Please try again later." });
      }
    } catch (err) {
      console.error("EmailJS error:", err);
      setStatus({ ok: false, msg: "Sending failed. Please try again in a moment." });
    } finally {
      setSending(false);
    }
  };

  return (
    <form onSubmit={onSubmit} className="max-w-xl space-y-3">
      {/* Honeypot field (hidden from users) */}
      <input
        type="text"
        name="website"
        value={values.website}
        onChange={onChange}
        className="hidden"
        tabIndex={-1}
        autoComplete="off"
      />
      <div>
        <label className="block text-sm font-medium">Name</label>
        <input
          className="w-full border rounded p-2"
          name="name"
          value={values.name}
          onChange={onChange}
          required
          minLength={2}
          maxLength={60}
        />
      </div>
      <div>
        <label className="block text-sm font-medium">Email</label>
        <input
          className="w-full border rounded p-2"
          type="email"
          name="email"
          value={values.email}
          onChange={onChange}
          required
        />
      </div>
      <div>
        <label className="block text-sm font-medium">Subject</label>
        <input
          className="w-full border rounded p-2"
          name="subject"
          value={values.subject}
          onChange={onChange}
          required
          minLength={2}
          maxLength={120}
        />
      </div>
      <div>
        <label className="block text-sm font-medium">Message</label>
        <textarea
          className="w-full border rounded p-2 min-h-[140px]"
          name="message"
          value={values.message}
          onChange={onChange}
          required
          minLength={10}
          maxLength={2000}
        />
      </div>
      <button
        type="submit"
        disabled={sending}
        className="rounded bg-black text-white px-4 py-2 disabled:opacity-60"
      >
        {sending ? "Sending…" : "Send message"}
      </button>
      {status && (
        <p className={`text-sm ${status.ok ? "text-green-600" : "text-red-600"}`}>{status.msg}</p>
      )}
    </form>
  );
}
