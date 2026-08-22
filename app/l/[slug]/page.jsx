import { notFound } from "next/navigation";
import { getListing, LISTINGS } from "../../../lib/listings";
import Chat from "./Chat";

export function generateStaticParams() {
  return Object.keys(LISTINGS).map((slug) => ({ slug }));
}

export function generateMetadata({ params }) {
  const l = getListing(params.slug);
  if (!l) return { title: "Weston" };
  const url = `https://weston-listing-assistant.vercel.app/l/${params.slug}`;
  const title = `${l.address} — Weston`;
  const description = `Ask about ${l.address}, ${l.city}.`;
  // Placeholder card image. Swapped for a real listing photo once photos land.
  // Purpose-built 1.91:1 card cropped from the hero photo. Social scrapers
  // fetch this directly and do not go through next/image, so it has to be
  // small on its own: the 6000x4000 original is 13.9MB, over FB/Twitter caps.
  const image = {
    url: "https://weston-listing-assistant.vercel.app/og-hero.jpg",
    width: 1200,
    height: 630,
  };
  return {
    title,
    description,
    openGraph: {
      title,
      description,
      url,
      siteName: "15 West Homes",
      images: [image],
      type: "website",
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: [image.url],
    },
  };
}

export default function Page({ params }) {
  const listing = getListing(params.slug);
  if (!listing) notFound();
  return <Chat slug={params.slug} listing={listing} />;
}
