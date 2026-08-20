import { notFound } from "next/navigation";
import { getListing, LISTINGS } from "../../../lib/listings";
import Chat from "./Chat";

export function generateStaticParams() {
  return Object.keys(LISTINGS).map((slug) => ({ slug }));
}

export function generateMetadata({ params }) {
  const l = getListing(params.slug);
  if (!l) return { title: "Weston" };
  return {
    title: `${l.address} — Weston`,
    description: `Ask about ${l.address}, ${l.city}.`,
  };
}

export default function Page({ params }) {
  const listing = getListing(params.slug);
  if (!listing) notFound();
  return <Chat slug={params.slug} listing={listing} />;
}
