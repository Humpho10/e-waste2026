import { useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import { sendContactMessage } from '../api/contact';
import { useToast } from '../components/Toast';
import PublicNavbar from '../components/PublicNavbar';
import PublicFooter from '../components/PublicFooter';
import BackToTopButton from '../components/BackToTopButton';
import Reveal from '../components/Reveal';
import {
  Mail, Send, Clock, MapPin, CheckCircle, User, Chat,
} from '../components/icons';

const TOPICS = ['General inquiry', 'Report a problem', 'Account help', 'Partnership', 'Feedback / suggestion'];

export default function ContactPage() {
  const { toast } = useToast();
  const [form, setForm] = useState({ name: '', email: '', topic: TOPICS[0], message: '' });
  const [sent, setSent] = useState(false);

  const mutation = useMutation({
    mutationFn: (data) => sendContactMessage(data),
    onSuccess: () => {
      setSent(true);
      toast('Message sent — we\'ll get back to you soon', 'success');
    },
    onError: (err) => {
      const errors = err.response?.data?.errors;
      const msg = errors ? Object.values(errors).flat().join(' · ') : err.response?.data?.message || 'Couldn\'t send your message. Please try again.';
      toast(msg, 'error');
    },
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    mutation.mutate(form);
  };

  const sendAnother = () => {
    setForm({ name: '', email: '', topic: TOPICS[0], message: '' });
    setSent(false);
  };

  return (
    <div className="min-h-screen bg-gray-50 font-sans text-gray-800 dark:bg-slate-800/60 dark:text-gray-100">
      <PublicNavbar />

      {/* ── Header ──────────────────────────────────────────── */}
      <section className="relative px-4 py-20 text-center overflow-hidden bg-[#0b2545]">
        <div className="absolute inset-0 bg-cover bg-center opacity-25" style={{ backgroundImage: "url('/hero-5.webp')" }} aria-hidden="true" />
        <div className="absolute inset-0 bg-gradient-to-b from-[#0b2545]/80 via-[#0b2545]/90 to-[#0b2545]" aria-hidden="true" />
        <div className="relative z-10 max-w-2xl mx-auto">
          <h1 className="text-3xl md:text-5xl font-extrabold text-white mb-4 [text-shadow:0_2px_14px_rgba(0,0,0,0.6)]">
            Get in Touch
          </h1>
          <p className="text-blue-100 text-base md:text-lg [text-shadow:0_1px_8px_rgba(0,0,0,0.6)]">
            Questions, feedback, or a problem to report — we'd like to hear from you.
          </p>
        </div>
      </section>

      {/* ── Contact info + form ─────────────────────────────── */}
      <section className="py-14 px-4">
        <div className="max-w-4xl mx-auto grid grid-cols-1 md:grid-cols-5 gap-8">

          {/* Left — direct contact info */}
          <Reveal className="md:col-span-2">
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 h-full dark:bg-slate-900 dark:border-slate-800">
              <h2 className="font-bold text-gray-800 mb-5 dark:text-gray-100">Other ways to reach us</h2>
              <div className="space-y-5">
                <div className="flex items-start gap-3">
                  <div className="w-9 h-9 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center shrink-0 dark:bg-blue-950/40 dark:text-blue-400">
                    <Mail width={16} height={16} />
                  </div>
                  <div>
                    <p className="font-semibold text-gray-800 text-sm dark:text-gray-100">Email</p>
                    <a href="mailto:hello@ewastemart.ug" className="text-blue-600 text-sm hover:underline dark:text-blue-400">hello@ewastemart.ug</a>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <div className="w-9 h-9 rounded-xl bg-green-50 text-green-600 flex items-center justify-center shrink-0 dark:bg-green-950/40 dark:text-green-400">
                    <MapPin width={16} height={16} />
                  </div>
                  <div>
                    <p className="font-semibold text-gray-800 text-sm dark:text-gray-100">Based in</p>
                    <p className="text-gray-500 text-sm dark:text-gray-400">Kampala, Uganda</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <div className="w-9 h-9 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center shrink-0 dark:bg-amber-950/40 dark:text-amber-400">
                    <Clock width={16} height={16} />
                  </div>
                  <div>
                    <p className="font-semibold text-gray-800 text-sm dark:text-gray-100">Response time</p>
                    <p className="text-gray-500 text-sm dark:text-gray-400">Usually within 1–2 business days</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <div className="w-9 h-9 rounded-xl bg-sky-50 text-sky-600 flex items-center justify-center shrink-0 dark:bg-sky-950/40 dark:text-sky-400">
                    <Chat width={16} height={16} />
                  </div>
                  <div>
                    <p className="font-semibold text-gray-800 text-sm dark:text-gray-100">Prefer to message a seller?</p>
                    <p className="text-gray-500 text-sm dark:text-gray-400">Use the chat on any listing page instead — this form is for the E-Waste Mart team.</p>
                  </div>
                </div>
              </div>
            </div>
          </Reveal>

          {/* Right — form */}
          <Reveal delay={100} className="md:col-span-3">
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 dark:bg-slate-900 dark:border-slate-800">
              {sent ? (
                <div className="text-center py-10">
                  <div className="grid place-items-center w-14 h-14 rounded-2xl bg-green-50 text-green-600 mx-auto mb-4 dark:bg-green-950/40 dark:text-green-400">
                    <CheckCircle width={26} height={26} />
                  </div>
                  <h3 className="font-bold text-gray-800 mb-2 dark:text-gray-100">Message sent</h3>
                  <p className="text-gray-500 text-sm mb-6 dark:text-gray-400">Thanks for reaching out — we'll get back to you soon.</p>
                  <button onClick={sendAnother} className="text-blue-600 text-sm font-semibold hover:underline dark:text-blue-400">
                    Send another message
                  </button>
                </div>
              ) : (
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-1.5 dark:text-gray-200">Your name</label>
                      <div className="relative">
                        <User width={16} height={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 dark:text-gray-500" />
                        <input
                          required type="text" value={form.name}
                          onChange={e => setForm({ ...form, name: e.target.value })}
                          placeholder="Jane Doe"
                          className="w-full border border-gray-200 rounded-xl pl-10 pr-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-gray-50 dark:border-slate-700 dark:bg-slate-800/60"
                        />
                      </div>
                    </div>
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-1.5 dark:text-gray-200">Your email</label>
                      <div className="relative">
                        <Mail width={16} height={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 dark:text-gray-500" />
                        <input
                          required type="email" value={form.email}
                          onChange={e => setForm({ ...form, email: e.target.value })}
                          placeholder="jane@example.com"
                          className="w-full border border-gray-200 rounded-xl pl-10 pr-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-gray-50 dark:border-slate-700 dark:bg-slate-800/60"
                        />
                      </div>
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-1.5 dark:text-gray-200">Topic</label>
                    <select
                      value={form.topic}
                      onChange={e => setForm({ ...form, topic: e.target.value })}
                      className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-gray-50 dark:border-slate-700 dark:bg-slate-800/60"
                    >
                      {TOPICS.map(t => <option key={t} value={t}>{t}</option>)}
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-1.5 dark:text-gray-200">Message</label>
                    <textarea
                      required rows={5} value={form.message}
                      onChange={e => setForm({ ...form, message: e.target.value })}
                      placeholder="Tell us what's on your mind..."
                      className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-gray-50 resize-none dark:border-slate-700 dark:bg-slate-800/60"
                    />
                  </div>

                  <button
                    type="submit" disabled={mutation.isPending}
                    className="btn-lift w-full bg-blue-600 hover:bg-blue-700 text-white py-3 rounded-xl text-sm font-semibold transition disabled:opacity-50 flex items-center justify-center gap-2"
                  >
                    {mutation.isPending ? (
                      <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    ) : (
                      <Send width={15} height={15} />
                    )}
                    Send Message
                  </button>
                </form>
              )}
            </div>
          </Reveal>
        </div>
      </section>

      <PublicFooter />
      <BackToTopButton />
    </div>
  );
}
