"use client";

import { useState, useRef, useEffect } from "react";

export default function Chat({ slug, listing }) {
  const [turns, setTurns] = useState([]);
  const [input, setInput] = useState("");
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");
  const [howOpen, setHowOpen] = useState(false);
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
    <div className="h-dvh w-full bg-paper flex flex-col font-serif">
      <header className="border-b border-teal/15 bg-white px-5 py-4">
        <div className="max-w-2xl mx-auto">
          <div className="flex items-center gap-3">
            <img src="/logo.png" alt="15 West Homes" className="h-9 w-auto shrink-0" />
            <div className="w-px h-8 bg-teal/15" />
            <div>
              <h1 className="text-teal text-xl leading-none">Weston</h1>
              <p className="font-sans text-teal text-[11px] mt-1 uppercase tracking-[0.1em]">
                {listing.address} &middot; {listing.city.split(",")[0]}
              </p>
            </div>
          </div>

          <a
            href={listing.leadForm}
            target="_blank"
            rel="noopener noreferrer"
            className="font-sans inline-flex items-center gap-1.5 mt-4 px-4 py-2 rounded-lg
                       bg-olive text-white text-sm hover:opacity-90 transition
                       focus:outline-none focus-visible:ring-2
                       focus-visible:ring-offset-2 focus-visible:ring-olive"
          >
            {listing.ctaLabel} &rarr;
          </a>
        </div>
      </header>

      <main ref={scroll} className="flex-1 overflow-y-auto px-5 py-6">
        <div className="max-w-2xl mx-auto space-y-5" aria-live="polite">
          {turns.length === 0 ? (
            <div>
              <div className="pb-6 mb-6 border-b border-teal/12">
                <h2 className="text-ink text-[26px] leading-tight">
                  {listing.address}
                </h2>
                <p className="text-teal mt-1">{listing.city}</p>
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
                  <span className="font-sans text-teal text-sm">
                    {listing.statusNote}
                  </span>
                </div>

                {listing.openHouse && (
                  <p className="text-ink mt-5 leading-relaxed">{listing.openHouse}</p>
                )}
              </div>

              <p className="text-teal leading-relaxed">
                Hi, I&rsquo;m Weston &mdash; 15 West Homes&rsquo; listing assistant for
                this home. Ask me anything, or{" "}
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
                  tap here to see how I work
                </button>
                .
              </p>

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
                    Maggie.
                  </p>
                </div>
              </div>

              <div className="mt-5 flex flex-wrap gap-2">
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
                    {t.text}
                  </p>
                  {t.searched && (
                    <p className="font-sans text-teal text-[11px] mt-2">
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

      <footer
        className="border-t border-teal/15 bg-white px-5 pt-4
                   pb-[calc(1rem_+_env(safe-area-inset-bottom))]"
      >
        <div className="max-w-2xl mx-auto">
          <div className="flex gap-2 items-end">
            <label htmlFor="weston-input" className="sr-only">
              Ask about the house
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
              placeholder="Ask about the house"
              className="font-sans flex-1 resize-none rounded-xl border border-teal/25 px-4 py-3
                         text-ink placeholder-teal bg-paper text-[15px]
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
          <div className="font-sans text-[11px] mt-3 leading-relaxed">
            <span className="text-ink">Maggie Hatfield, 15 West Homes</span>
            <span className="text-teal"> &middot; </span>
            <a
              href="tel:+15712930334"
              className="text-teal underline underline-offset-2 hover:text-tealdark
                         rounded-sm focus:outline-none focus-visible:ring-2
                         focus-visible:ring-olive"
            >
              571-293-0334
            </a>
            <span className="text-teal">
              {" "}
              &middot; VA Lic. #0225228923 &middot; MLS# {listing.mls}
            </span>
          </div>

          <p className="font-sans text-teal text-[11px] mt-3 leading-relaxed">
            Information deemed reliable but not guaranteed. Buyer to verify. Equal
            Housing Opportunity. 15 West Homes, brokered by Samson Properties.
          </p>
        </div>
      </footer>
    </div>
  );
}
