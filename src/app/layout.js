import "./globals.css";

export const metadata = {
  title: "Multi-Tenant Notes App",
  description: "Assignment for internship",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}