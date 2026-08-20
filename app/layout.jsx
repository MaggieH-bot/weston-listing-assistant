import "./globals.css";

export const metadata = {
  title: "Weston | 15 West Homes",
  description: "Listing assistant for 15 West Homes.",
  icons: { icon: "/logo.png" },
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body className="bg-paper">{children}</body>
    </html>
  );
}
