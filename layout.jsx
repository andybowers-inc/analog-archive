import "./globals.css";

export const metadata = {
  title: "Analog Archive",
  description: "Film negative organization and roll tracking",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body className="font-sans">{children}</body>
    </html>
  );
}
