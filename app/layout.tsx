import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { AuthProvider } from "@/context/authcontext";
import { ThemeProvider } from "@/context/themeContext";
import Nav from "@/app/nav";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "PriorAuthAI",
  description: "Medical prior authorization assistant powered by Claude",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">
        <AuthProvider>
          <ThemeProvider>
            <header className="bg-[var(--theme-surface)] border-b border-[var(--theme-border)]">
              <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="flex justify-between items-center h-16">
                  <div>
                    <a href="/" className="font-bold text-xl text-[var(--theme-primaryText)]">
                      PriorAuthAI
                    </a>
                  </div>
                  <Nav />
                </div>
              </div>
            </header>

            <main className="flex-1">{children}</main>

            <footer className="bg-gray-900 text-white py-6">
              <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
                <p className="text-sm text-gray-400">&copy; {new Date().getFullYear()} AuthAI. All rights reserved.</p>
              </div>
            </footer>
          </ThemeProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
