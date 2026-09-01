import Image from "next/image";
import Link from "next/link";
import { LISTINGS } from "../lib/listings";

export default function Home() {
  return (
    <main className="min-h-screen bg-paper px-5 py-10 sm:py-16">
      <div className="max-w-4xl mx-auto">
        <img src="/logo.png" alt="15 West Homes" className="h-14 w-auto" />
        <p className="font-sans text-sm uppercase tracking-[0.15em] text-teal mt-10">
          Weston
        </p>
        <h1 className="font-serif text-ink text-4xl sm:text-5xl mt-2 leading-tight">
          Ask about a home.
        </h1>
        <p className="font-sans text-teal mt-3 max-w-xl leading-relaxed">
          Choose a listing. Each Weston assistant answers only from that
          property&rsquo;s verified information.
        </p>

        <div className="grid sm:grid-cols-2 gap-5 mt-9">
          {Object.entries(LISTINGS).map(([slug, listing]) => (
            <Link
              href={`/${slug}`}
              key={slug}
              className="group overflow-hidden rounded-2xl border border-teal/15 bg-white
                         shadow-sm hover:shadow-lg transition focus:outline-none
                         focus-visible:ring-2 focus-visible:ring-olive"
            >
              <div className="relative aspect-[3/2] bg-sage/15">
                {listing.heroImage && (
                  <Image
                    src={listing.heroImage}
                    alt={`${listing.address}, ${listing.city}`}
                    fill
                    sizes="(max-width: 640px) 100vw, 50vw"
                    className="object-cover group-hover:scale-[1.02] transition duration-300"
                  />
                )}
              </div>
              <div className="p-5">
                <p className="font-sans text-xs uppercase tracking-[0.12em] text-olive">
                  {listing.status}
                </p>
                <h2 className="font-serif text-ink text-2xl mt-1">{listing.address}</h2>
                <p className="font-sans text-teal text-sm mt-1">{listing.city}</p>
                <div className="font-sans flex items-center justify-between gap-4 mt-5 text-sm">
                  <strong className="text-ink">{listing.price}</strong>
                  <span className="text-teal underline underline-offset-2 decoration-teal/40">
                    Ask Weston &rarr;
                  </span>
                </div>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </main>
  );
}
