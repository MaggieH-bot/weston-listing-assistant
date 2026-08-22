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
  const image = {
    url: "https://weston-listing-assistant.vercel.app/og-image.jpg",
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
