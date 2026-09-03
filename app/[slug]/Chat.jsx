"use client";

import Image from "next/image";
import { useState, useRef, useEffect } from "react";

// Weston's answers arrive as plain text that can contain ordinary markdown
// links and bare URLs (the prompt has him hand out the LCPS and Virginia
// school-quality links). Without this they render as literal punctuation.
// No markdown library: the only syntax the model emits here is links.
// Numbered citation markers are stripped server-side and never arrive.
const LINK_RE =
  /\[([^\][]+)\]\((https?:\/\/[^\s)]+)\)|(https?:\/\/[^\s<>"')\]]*[^\s<>"')\].,;:!?])/g;

const LINK_CLASS =
  "underline underline-offset-2 decoration-teal/40 text-teal break-words " +
  "hover:text-tealdark hover:decoration-tealdark transition rounded-sm " +
  "focus:outline-none focus-visible:ring-2 focus-visible:ring-olive";

function renderAnswer(text) {
  const out = [];
  let last = 0;
  let key = 0;
  let m;
  LINK_RE.lastIndex = 0;
  while ((m = LINK_RE.exec(text)) !== null) {
    if (m.index > last) out.push(text.slice(last, m.index));
    const [, mdLabel, mdUrl, bareUrl] = m;
    const href = mdUrl || bareUrl;
    out.push(
      <a
        key={key++}
        href={href}
        target="_blank"
        rel="noopener noreferrer"
        className={LINK_CLASS}
      >
        {mdLabel || bareUrl}
      </a>
    );
    last = LINK_RE.lastIndex;
  }
  if (last < text.length) out.push(text.slice(last));
  return out;
}

const STAGES = [
  "Just starting to look",
  "Actively touring homes",
  "Ready to make an offer",
  "Already working with an agent",
  "Just curious about the neighborhood",
];

const PRICES = [
  "Under $600k",
  "$600k - $800k",
  "$800k - $1M",
  "$1M - $1.25M",
  "$1.25M - $1.5M",
  "$1.5M+",
  "Not sure yet",
];

function LeadForm({ slug, listing, onClose }) {
  const contactName = listing.buyerContactName || "the 15 West Homes team";
  const [f, setF] = useState({
    name: "",
    email: "",
    phone: "",
    stage: "",
    areas: "",
    price: "",
    autoSearch: false,
    consent: false,
  });
  const [sending, setSending] = useState(false);
  const [legalOpen, setLegalOpen] = useState(false);
  const [sent, setSent] = useState(false);
  const [err, setErr] = useState("");

  const set = (k) => (e) =>
    setF((v) => ({
      ...v,
      [k]: e.target.type === "checkbox" ? e.target.checked : e.target.value,
    }));

  async function submit(e) {
    e.preventDefault();
    if (sending) return;
    setErr("");
    setSending(true);
    try {
      const res = await fetch("/api/lead", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ slug, ...f }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Something went wrong.");
      setSent(true);
    } catch (e2) {
      setErr(e2.message);
    } finally {
      setSending(false);
    }
  }

  const field =
    "font-sans w-full rounded-xl border border-teal/25 px-3 py-2.5 text-ink " +
    "placeholder-teal bg-paper text-[15px] focus:outline-none focus:border-teal/60";

  if (sent) {
    return (
      <div className="pb-6 mb-6 border-b border-teal/12">
        <h2 className="text-ink text-[22px] leading-tight">Thank you.</h2>
        <p className="text-teal mt-2 leading-relaxed">
          That went straight to {contactName}. The 15 West Homes team will follow up about{" "}
          {listing.address}. If you need the team sooner, call{" "}
          <a href="tel:+15712930334" className={LINK_CLASS}>
            571-293-0334
          </a>
          .
        </p>
        <button
          type="button"
          onClick={onClose}
          className="font-sans text-sm mt-4 underline underline-offset-2
                     decoration-teal/40 text-teal hover:text-tealdark transition
                     rounded-sm focus:outline-none focus-visible:ring-2
                     focus-visible:ring-olive"
        >
          Back to the listing
        </button>
      </div>
    );
  }

  return (
    <div className="pb-6 mb-6 border-b border-teal/12">
      <button
        type="button"
        onClick={onClose}
        className="font-sans inline-flex items-center gap-1.5 text-teal text-sm mb-3
                   underline underline-offset-2 decoration-teal/40
                   hover:text-tealdark hover:decoration-tealdark transition rounded-sm
                   focus:outline-none focus-visible:ring-2 focus-visible:ring-olive"
      >
        &larr; Back to Weston
      </button>

      <h2 className="font-serif text-ink text-[22px] leading-tight">
        Tell us about your home search
      </h2>
      <p className="font-sans text-teal text-sm mt-1 mb-3 leading-relaxed">
        {listing.address}
      </p>

      <div className="grid gap-6 md:grid-cols-[minmax(0,1fr)_minmax(20rem,28rem)] md:items-start">
        <form onSubmit={submit} className="font-sans">
          <div className="space-y-2.5">
            <div>
              <label htmlFor="lead-name" className="sr-only">Your name</label>
              <input id="lead-name" required value={f.name} onChange={set("name")}
                placeholder="Your name" className={field} autoComplete="name" />
            </div>
            <div>
              <label htmlFor="lead-email" className="sr-only">Email</label>
              <input id="lead-email" required type="email" value={f.email}
                onChange={set("email")} placeholder="Email" className={field}
                autoComplete="email" inputMode="email" />
            </div>
            <div>
              <label htmlFor="lead-phone" className="sr-only">Phone (optional)</label>
              <input id="lead-phone" type="tel" value={f.phone} onChange={set("phone")}
                placeholder="Phone (optional)" className={field}
                autoComplete="tel" inputMode="tel" />
            </div>
            <div>
              <label htmlFor="lead-stage" className="sr-only">
                What stage of the process are you in?
              </label>
              <select id="lead-stage" value={f.stage} onChange={set("stage")}
                className={field + " appearance-none"}>
                <option value="">What stage of the process are you in?</option>
                {STAGES.map((o) => (
                  <option key={o} value={o}>{o}</option>
                ))}
              </select>
            </div>
            <div>
              <label htmlFor="lead-areas" className="sr-only">
                What areas are you looking at?
              </label>
              <input id="lead-areas" value={f.areas} onChange={set("areas")}
                placeholder="What areas are you looking at?" className={field} />
            </div>
            <div>
              <label htmlFor="lead-price" className="sr-only">
                What price point?
              </label>
              <select id="lead-price" value={f.price} onChange={set("price")}
                className={field + " appearance-none"}>
                <option value="">What price point?</option>
                {PRICES.map((o) => (
                  <option key={o} value={o}>{o}</option>
                ))}
              </select>
            </div>
          </div>

          <label className="flex gap-2.5 mt-3 text-ink text-sm leading-relaxed">
            <input type="checkbox" checked={f.autoSearch} onChange={set("autoSearch")}
              className="mt-0.5 shrink-0 accent-olive" />
            <span>
              Set me up with an automatic search that monitors new listings in
              the areas I am interested in.
            </span>
          </label>

          <label className="flex gap-2.5 mt-3 text-ink text-sm leading-relaxed">
            <input type="checkbox" checked={f.consent} onChange={set("consent")}
              className="mt-0.5 shrink-0 accent-olive" />
            <span>
              I agree to be contacted, including by call and text.{" "}
              <button
                type="button"
                onClick={(e) => {
                  e.preventDefault();
                  setLegalOpen((o) => !o);
                }}
                className="underline underline-offset-2 decoration-teal/40 text-teal
                           hover:text-tealdark transition rounded-sm
                           focus:outline-none focus-visible:ring-2 focus-visible:ring-olive"
              >
                {legalOpen ? "Hide details" : "Details"}
              </button>
            </span>
          </label>

          {legalOpen && (
            <p className="text-teal text-[11px] leading-relaxed mt-2 pl-6">
              By checking this box, I agree by electronic signature to receive
              recurring marketing communication from or on behalf of Maggie
              Hatfield, including auto-dialed calls, texts, and prerecorded
              messages (consent not required to make a purchase; data rates may
              apply; reply STOP to opt-out of texts or HELP for help). I
              understand that I can call 571-293-0334 to obtain direct assistance.
            </p>
          )}

          {err && <p className="text-teal text-sm mt-3">{err}</p>}

          <div className="flex items-center gap-4 mt-4">
            <button type="submit" disabled={sending}
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg
                         bg-olive text-white text-sm hover:opacity-90 transition
                         disabled:opacity-40 focus:outline-none focus-visible:ring-2
                         focus-visible:ring-offset-2 focus-visible:ring-olive">
              {sending
                ? "Sending\u2026"
                : listing.leadButtonLabel || `Send to ${contactName}`}
            </button>
            <button type="button" onClick={onClose}
              className="text-sm underline underline-offset-2 decoration-teal/40
                         text-teal hover:text-tealdark transition rounded-sm
                         focus:outline-none focus-visible:ring-2 focus-visible:ring-olive">
              Cancel
            </button>
          </div>
        </form>

        {(listing.formImage || listing.heroImage) && (
          <div className="relative hidden md:block w-full aspect-[3/2] rounded-2xl overflow-hidden bg-sage/15">
            <Image
              src={listing.formImage || listing.heroImage}
              alt={`${listing.address}, ${listing.city}`}
              fill
              // unoptimized: the source is 1200x800 and 244KB. Letting srcset
              // pick a variant kept serving ~400px into a 353px box, which is
              // upscaled and soft on a retina screen. Serving the original is
              // cheaper than the churn and sharp at any pixel ratio.
              unoptimized
              className="object-cover"
            />
          </div>
        )}
      </div>
    </div>
  );
}

export default function Chat({ slug, listing }) {
  const contactName = listing.buyerContactName || "the 15 West Homes team";
  const [turns, setTurns] = useState([]);
  const [input, setInput] = useState("");
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");
  const [howOpen, setHowOpen] = useState(false);
  const [slow, setSlow] = useState(false);
  const [status, setStatus] = useState("");
  const [showForm, setShowForm] = useState(false);
  const scroll = useRef(null);
  const turnsRef = useRef([]);

  useEffect(() => {
    turnsRef.current = turns;
  }, [turns]);

  // A search-backed answer can take several seconds. After a short delay the
  // dots alone read as "stuck", so add a label saying work is happening.
  useEffect(() => {
    if (!busy) {
      setSlow(false);
      setStatus("");
      return;
    }
    const t = setTimeout(() => setSlow(true), 1500);
    return () => clearTimeout(t);
  }, [busy]);

  useEffect(() => {
    // Don't auto-scroll the empty state, or the hero/price scroll out of view
    // before anyone sees them. Only follow the conversation once it starts.
    if (turns.length === 0) return;
    scroll.current?.scrollTo({
      top: scroll.current.scrollHeight,
      behavior: "smooth",
    });
  }, [turns, busy]);

  async function ask(q) {
    if (!q.trim() || busy) return;
    setErr("");
    setInput("");
    const history = turnsRef.current;
    setTurns([...history, { who: "them", text: q }]);
    setBusy(true);

    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          slug,
          messages: [
            ...history.map((t) => ({
              role: t.who === "them" ? "user" : "assistant",
              content: t.text,
            })),
            { role: "user", content: q },
          ],
        }),
      });

      if (!res.ok) {
        let msg = "failed";
        try {
          msg = (await res.json()).error || msg;
        } catch {}
        throw new Error(msg);
      }

      // NDJSON stream: one JSON object per line. {delta} while the answer is
      // being written, then a final {done, form, searched}.
      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let buf = "";
      let answer = "";
      let started = false;

      const pump = async () => {
        for (;;) {
          const { value, done } = await reader.read();
          if (done) break;
          buf += decoder.decode(value, { stream: true });
          const lines = buf.split("\n");
          buf = lines.pop() ?? "";
          for (const line of lines) {
            if (!line.trim()) continue;
            let msg;
            try {
              msg = JSON.parse(line);
            } catch {
              continue;
            }
            if (msg.error) throw new Error(msg.error);
            if (msg.status) setStatus(msg.status);
            if (msg.delta) {
              answer += msg.delta;
              if (!started) {
                started = true;
                setStatus("");
                setBusy(false);
                setTurns((t) => [...t, { who: "weston", text: answer }]);
              } else {
                setTurns((t) =>
                  t.map((turn, i) =>
                    i === t.length - 1 ? { ...turn, text: answer } : turn
                  )
                );
              }
            }
            if (msg.done) {
              setTurns((t) =>
                t.map((turn, i) =>
                  i === t.length - 1
                    ? {
                        ...turn,
                        // trimEnd: whitespace ahead of a [FORM] token is sent
                        // before the token is recognised, so it cannot be
                        // retracted server-side. Tidy it on the final frame.
                        text: answer.trimEnd(),
                        form: msg.form,
                        searched: msg.searched,
                      }
                    : turn
                )
              );
            }
          }
        }
      };
      await pump();

      if (!started) {
        throw new Error("failed");
      }
    } catch (e) {
      setErr(
        e.message && e.message !== "failed"
          ? e.message
          : "Weston is unavailable right now. Try again in a moment."
      );
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="h-dvh w-full bg-paper flex flex-col font-serif">
      <header className="border-b border-teal/15 bg-white px-5 py-4">
        <div className="max-w-2xl mx-auto">
          <div className="flex items-center gap-3">
            <img src="/logo.png" alt="15 West Homes" className="h-9 w-auto shrink-0" />
            <div className="w-px h-8 bg-teal/15" />
            <div>
              <h1 className="text-teal text-xl leading-none">Weston</h1>
              {!showForm && (
              <p className="font-sans text-teal text-[12px] mt-0.5 leading-snug">
                Hi <span aria-hidden="true">&#128075;</span> I&rsquo;m Weston,
                15 West Homes&rsquo; listing assistant. I&rsquo;m here to answer any
                questions you have about this home.{" "}
                <button
                  type="button"
                  onClick={() => setHowOpen((o) => !o)}
                  aria-expanded={howOpen}
                  aria-controls="weston-how"
                  className="underline underline-offset-2 decoration-teal/40 text-teal
                             hover:text-tealdark hover:decoration-tealdark transition
                             rounded-sm focus:outline-none focus-visible:ring-2
                             focus-visible:ring-olive"
                >
                  Tap to see how I work
                </button>
              </p>
              )}
            </div>
          </div>

          {!showForm && (
          <div
            id="weston-how"
            aria-hidden={!howOpen}
            className={`grid transition-all duration-200 ease-out ${
              howOpen
                ? "grid-rows-[1fr] opacity-100 mt-3"
                : "grid-rows-[0fr] opacity-0"
            }`}
          >
            <div className="overflow-hidden">
              <p className="text-ink/85 leading-relaxed border-l-2 border-sage/60 pl-4 py-1">
                I answer from the seller&rsquo;s verified facts for this listing
                &mdash; taxes, HOA dues, systems, schools, what&rsquo;s nearby. I
                won&rsquo;t guess, and I won&rsquo;t give opinions on the
                neighborhood, the schools, or what the house is worth. When I
                don&rsquo;t have something, I&rsquo;ll say so and connect you with
                {" "}{contactName}.
              </p>
            </div>
          </div>
          )}

          {!showForm && (
          <button
            type="button"
            onClick={() => setShowForm(true)}
            className="font-sans inline-flex items-center gap-1.5 mt-4 px-4 py-2 rounded-lg
                       bg-olive text-white text-sm hover:opacity-90 transition
                       focus:outline-none focus-visible:ring-2
                       focus-visible:ring-offset-2 focus-visible:ring-olive"
          >
            {listing.ctaLabel} &rarr;
          </button>
          )}
        </div>
      </header>

      <main ref={scroll} className="flex-1 overflow-y-auto px-5 py-6">
        <div className={`${showForm ? "max-w-5xl" : "max-w-2xl"} mx-auto space-y-5`} aria-live="polite">
          {showForm ? (
            <LeadForm
              slug={slug}
              listing={listing}
              onClose={() => setShowForm(false)}
            />
          ) : (
          <>

          {turns.length === 0 ? (
            <div>
              <div className="pb-6 mb-6 border-b border-teal/12">
                {listing.heroImage && (
                  <div
                    className={
                      listing.heroFrame === "wide"
                        ? "relative w-full aspect-[16/9] mb-6 rounded-2xl overflow-hidden bg-sage/15"
                        : "relative w-full h-56 sm:h-72 mb-6 rounded-2xl overflow-hidden bg-sage/15"
                    }
                  >
                    <Image
                      src={listing.heroImage}
                      alt={`${listing.address}, ${listing.city}`}
                      fill
                      priority
                      sizes="100vw"
                      className="object-cover"
                    />
                  </div>
                )}

                <h2 className="text-ink text-[26px] leading-tight">
                  {listing.address}
                </h2>
                <p className="text-teal mt-1">{listing.city}</p>
                <p className="text-ink mt-5">
                  <span className="font-sans text-teal text-[11px] uppercase tracking-[0.1em] block mb-1">
                    List Price
                  </span>
                  <span className="text-[28px]">{listing.price}</span>
                </p>

                <div className="font-sans flex flex-wrap gap-x-5 gap-y-1 mt-3 text-teal text-sm">
                  {listing.specs.map((s) => (
                    <span key={s}>{s}</span>
                  ))}
                </div>

                <div className="mt-6 flex flex-wrap items-center gap-3">
                  <span className="font-sans text-[11px] uppercase px-2.5 py-1 rounded bg-olive/12 text-olive tracking-[0.08em]">
                    {listing.status}
                  </span>
                  <span className="font-sans text-teal text-sm">
                    {listing.statusNote}
                  </span>
                </div>

                {listing.openHouse && (
                  <p className="text-ink mt-5 leading-relaxed">{listing.openHouse}</p>
                )}
              </div>

              <p className="font-sans text-teal text-sm mt-6">
                Some question suggestions for you
              </p>

              <div className="mt-3 flex flex-wrap gap-2">
                {listing.starters.map((s) => (
                  <button
                    key={s}
                    onClick={() => ask(s)}
                    className="font-sans text-sm px-3 py-1.5 rounded-full border border-teal/25
                               text-teal hover:bg-teal/5 transition
                               focus:outline-none focus-visible:ring-2 focus-visible:ring-olive"
                  >
                    {s}
                  </button>
                ))}
              </div>

              {listing.floorPlans?.length > 0 && (
                <div className="mb-6">
                  <p className="font-sans text-teal text-sm mb-2">Floor plans</p>
                  <div className="grid grid-cols-3 gap-2">
                    {listing.floorPlans.map((fp) => (
                      <a
                        key={fp.src}
                        href={fp.src}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="group rounded-lg overflow-hidden border border-teal/25
                                   focus:outline-none focus-visible:ring-2 focus-visible:ring-olive"
                      >
                        <span className="relative block w-full aspect-[3/2] bg-white">
                          <Image
                            src={fp.src}
                            alt={`${listing.address} floor plan, ${fp.label}`}
                            fill
                            sizes="(max-width: 672px) 33vw, 220px"
                            className="object-contain p-1"
                          />
                        </span>
                        <span className="font-sans block text-teal text-[11px] px-2 py-1.5
                                         border-t border-teal/15 group-hover:bg-teal/5 transition">
                          {fp.label}
                        </span>
                      </a>
                    ))}
                  </div>
                </div>
              )}

              {listing.fullGalleryUrl && (
                <div className="mb-6">
                  <a
                    href={listing.fullGalleryUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="font-sans text-sm inline-block underline underline-offset-2
                               decoration-teal/40 text-teal hover:text-tealdark
                               hover:decoration-tealdark transition rounded-sm
                               focus:outline-none focus-visible:ring-2 focus-visible:ring-olive"
                  >
                    View full photo gallery &rarr;
                  </a>
                </div>
              )}

            </div>
          ) : (
            <div
              className="sticky -top-6 z-10 -mt-6 bg-paper pt-9 pb-3
                         border-b border-teal/12"
            >
              <div className="flex items-baseline justify-between gap-4">
                <h2 className="text-ink text-[15px] leading-tight truncate">
                  {listing.address}
                </h2>
                <span className="text-ink text-[15px] shrink-0">
                  {listing.price}
                </span>
              </div>
            </div>
          )}

          {turns.map((t, i) => (
            <div key={i}>
              {t.who === "them" ? (
                <div className="flex justify-end">
                  <p className="max-w-[85%] bg-teal text-white rounded-2xl rounded-br-sm px-4 py-2.5 leading-relaxed">
                    {t.text}
                  </p>
                </div>
              ) : (
                <div className="max-w-[92%]">
                  <div className="w-8 h-px bg-olive mb-3" />
                  <p className="text-ink leading-[1.75] whitespace-pre-wrap">
                    {renderAnswer(t.text)}
                  </p>
                  {t.searched && (
                    <p className="font-sans text-teal text-[11px] mt-2">
                      Looked this up just now
                    </p>
                  )}
                  {t.form && (
                    <button
                      type="button"
                      onClick={() => setShowForm(true)}
                      className="font-sans inline-flex items-center gap-1.5 mt-4 px-4 py-2 rounded-lg
                                 bg-olive text-white text-sm hover:opacity-90 transition
                                 focus:outline-none focus-visible:ring-2
                                 focus-visible:ring-offset-2 focus-visible:ring-olive"
                    >
                      Send us your question &rarr;
                    </button>
                  )}
                </div>
              )}
            </div>
          ))}

          {busy && (
            <div className="flex gap-1.5 items-center pt-1">
              {[0, 1, 2].map((i) => (
                <span
                  key={i}
                  className="w-1.5 h-1.5 rounded-full bg-olive animate-pulse"
                  style={{ animationDelay: `${i * 0.18}s` }}
                />
              ))}
              {(status || slow) && (
                <span className="font-sans text-teal text-[13px] ml-2 truncate">
                  {status || "Looking into it\u2026"}
                </span>
              )}
            </div>
          )}

          {err && <p className="font-sans text-teal text-sm py-2">{err}</p>}
          </>
          )}
        </div>
      </main>

      {!showForm && (
      <footer
        className="border-t-4 border-olive bg-teal shadow-[0_-8px_20px_-6px_rgba(55,70,75,0.35)] px-5 pt-4
                   pb-[calc(1rem_+_env(safe-area-inset-bottom))]"
      >
        <div className="max-w-2xl mx-auto">
          <p className="font-sans text-white text-[15px] font-semibold mb-2.5">
            Let me know what questions you have about this home
          </p>
          <div className="flex gap-2 items-end">
            <label htmlFor="weston-input" className="sr-only">
              Let me know what questions you have about this home
            </label>
            <textarea
              id="weston-input"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  ask(input);
                }
              }}
              rows={1}
              placeholder="Type your question"
              className="font-sans flex-1 resize-none rounded-xl border border-teal/25 px-4 py-3
                         text-ink placeholder-teal bg-white text-[15px]
                         focus:outline-none focus:border-teal/60 leading-relaxed"
            />
            <button
              onClick={() => ask(input)}
              disabled={busy || !input.trim()}
              className={`w-11 h-11 rounded-xl text-white flex items-center
                         justify-center shrink-0 transition focus:outline-none
                         focus-visible:ring-2 focus-visible:ring-offset-2
                         focus-visible:ring-olive ${
                           busy || !input.trim()
                             ? "bg-teal/30 cursor-default"
                             : "bg-olive hover:opacity-90"
                         }`}
              aria-label="Send"
            >
              &rarr;
            </button>
          </div>
          <div className="font-sans text-[11px] mt-3 leading-relaxed text-white/85">
            <span className="text-white">Maggie Hatfield, 15 West Homes</span>
            <span className="text-white/70"> &middot; </span>
            <a
              href="tel:+15712930334"
              className="text-white underline underline-offset-2 hover:text-sage
                         rounded-sm focus:outline-none focus-visible:ring-2
                         focus-visible:ring-olive"
            >
              571-293-0334
            </a>
            <span className="text-white/85">
              {" "}
              &middot; VA Lic. #0225228923 &middot; MLS# {listing.mls}
            </span>
          </div>

          <p className="font-sans text-white/80 text-[11px] mt-3 leading-relaxed">
            Information deemed reliable but not guaranteed. Buyer to verify. Equal
            Housing Opportunity. 15 West Homes, brokered by Samson Properties.
          </p>
        </div>
      </footer>
      )}
    </div>
  );
}
