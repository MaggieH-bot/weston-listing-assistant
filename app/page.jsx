export default function Home() {
  return (
    <main className="min-h-screen flex flex-col items-center justify-center px-6 text-center">
      <img src="/logo.png" alt="15 West Homes" className="h-16 w-auto mb-8" />
      <h1 className="font-sans text-sm uppercase tracking-[0.15em] text-teal">
        Weston
      </h1>
      <p className="font-serif text-ink mt-3 max-w-sm">
        Listing assistant for 15 West Homes. Open a listing link to begin.
      </p>
    </main>
  );
}
