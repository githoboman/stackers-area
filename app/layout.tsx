import type { Metadata } from "next";
import { Oswald } from "next/font/google";
import "./globals.css";
import { Navbar } from "@/components/navbar";

const oswald = Oswald({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Stacks Account History",
  description: "View your Stacks account history and transactions.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={oswald.className}>
        <div className="flex min-h-screen flex-col gap-8 w-full">
          <Navbar />
          {children}
        </div>
      </body>
    </html>
  );
}