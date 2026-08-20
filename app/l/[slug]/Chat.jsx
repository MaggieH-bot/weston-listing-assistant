"use client";

import { useState, useRef, useEffect } from "react";

export default function Chat({ slug, listing }) {
  const [turns, setTurns] = useState([]);
  const [input, setInput] = useState("");
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");
  const scroll = useRef(null);
  const turnsRef = useRef([]);

  useEffect(() => {
    turnsRef.current = turns;
  }, [turns]);

  useEffect(() => {
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

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "failed");

      setTurns((t) => [
        ...t,
        { who: "weston", text: data.text, form: data.form, searched: data.searched },
      ]);
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
    <div className="min-h-screen w-full bg-paper flex flex-col font-serif">
      <header className="border-b border-teal/15 bg-white px-5 py-4">
        <div className="max-w-2xl mx-auto flex items-center gap-3">
          <img src="/logo.png" alt="15 West Homes" className="h-9 w-auto shrink-0" />
          <div className="w-px h-8 bg-teal/15" />
          <div>
            <h1 className="text-teal text-xl leading-none">Weston</h1>
            <p className="font-sans text-teal/55 text-[11px] mt-1 uppercase tracking-[0.1em]">
              {listing.address} &middot; {listing.city.split(",")[0]}
            </p>
          </div>
        </div>
      </header>

      <main ref={scroll} className="flex-1 overflow-y-auto px-5 py-6">
        <div className="max-w-2xl mx-auto space-y-5">
          {turns.length === 0 && (
            <div>
              <div className="pb-6 mb-6 border-b border-teal/12">
                <h2 className="text-ink text-[26px] leading-tight">
                  {listing.address}
                </h2>
                <p className="text-teal/70 mt-1">{listing.city}</p>
                <p className="text-ink text-[28px] mt-5">{listing.price}</p>

                <div className="font-sans flex flex-wrap gap-x-5 gap-y-1 mt-3 text-teal text-sm">
                  {listing.specs.map((s) => (
                    <span key={s}>{s}</span>
                  ))}
                </div>

                <div className="mt-6 flex flex-wrap items-center gap-3">
                  <span className="font-sans text-[11px] uppercase px-2.5 py-1 rounded bg-olive/12 text-olive tracking-[0.08em]">
                    {listing.status}
                  </span>
                  <span className="font-sans text-teal/70 text-sm">
                    {listing.statusNote}
                  </span>
                </div>

                {listing.openHouse && (
                  <p className="text-ink mt-5 leading-relaxed">{listing.openHouse}</p>
                )}
              </div>

              <p className="text-teal/80 leading-relaxed">
                I can answer questions about the house. Ask me anything, or start here.
              </p>

              <div className="mt-5 flex flex-wrap gap-2">
                {listing.starters.map((s) => (
                  <button
                    key={s}
                    onClick={() => ask(s)}
                    className="font-sans text-sm px-3 py-1.5 rounded-full border border-teal/25
                               text-teal/80 hover:bg-teal/5 transition
                               focus:outline-none focus-visible:ring-2 focus-visible:ring-olive"
                  >
                    {s}
                  </button>
                ))}
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
                    {t.text}
                  </p>
                  {t.searched && (
                    <p className="font-sans text-teal/45 text-[11px] mt-2">
                      Looked this up just now
                    </p>
                  )}
                  {t.form && (
                    <a
                      href={listing.leadForm}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="font-sans inline-flex items-center gap-1.5 mt-4 px-4 py-2 rounded-lg
                                 bg-olive text-white text-sm hover:opacity-90 transition
                                 focus:outline-none focus-visible:ring-2
                                 focus-visible:ring-offset-2 focus-visible:ring-olive"
                    >
                      Send us your question &rarr;
                    </a>
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
            </div>
          )}

          {err && <p className="font-sans text-teal text-sm py-2">{err}</p>}
        </div>
      </main>

      <footer className="border-t border-teal/15 bg-white px-5 py-4">
        <div className="max-w-2xl mx-auto">
          <div className="flex gap-2 items-end">
            <textarea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  ask(input);
                }
              }}
              rows={1}
              placeholder="Ask about the house"
              className="font-sans flex-1 resize-none rounded-xl border border-teal/25 px-4 py-3
                         text-ink placeholder-teal/40 bg-paper text-[15px]
                         focus:outline-none focus:border-teal/60 leading-relaxed"
            />
            <button
              onClick={() => ask(input)}
              disabled={busy || !input.trim()}
              className="w-11 h-11 rounded-xl bg-teal text-white flex items-center
                         justify-center shrink-0 disabled:opacity-30 hover:bg-tealdark
                         transition focus:outline-none focus-visible:ring-2
                         focus-visible:ring-offset-2 focus-visible:ring-olive"
              aria-label="Send"
            >
              &rarr;
            </button>
          </div>
          <p className="font-sans text-teal/40 text-[11px] mt-3 leading-relaxed">
            Information deemed reliable but not guaranteed. Buyer to verify. Equal
            Housing Opportunity. 15 West Homes, brokered by Samson Properties.
          </p>
        </div>
      </footer>
    </div>
  );
}
