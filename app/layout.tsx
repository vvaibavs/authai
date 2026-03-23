import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "AuthAI - Insurance Authorization Parser",
  description: "AI-powered insurance authorization document parsing and analysis",
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
      <body className="min-h-full flex flex-col bg-gray-50 text-gray-900">
        <header className="bg-white border-b border-gray-200">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between items-center h-16">
              <div>
                <a href="/" className="font-bold text-xl text-blue-600">
                  AuthAI
                </a>
              </div>
              <nav className="flex items-center gap-4 text-sm text-gray-700">
                <a href="/" className="hover:text-blue-600">
                  Home
                </a>
                <a href="/about" className="hover:text-blue-600">
                  About
                </a>
                <a href="#upload" className="hover:text-blue-600">
                  Upload
                </a>
                <a href="/login" className="bg-blue-600 text-white px-4 py-1.5 rounded-lg hover:bg-blue-700 transition-colors">
                  Login
                </a>
              </nav>
            </div>
          </div>
        </header>

        <main className="flex-1">{children}</main>

        <footer className="bg-gray-900 text-white py-6">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
            <p className="text-sm text-gray-400">&copy; {new Date().getFullYear()} AuthAI. All rights reserved.</p>
          </div>
        </footer>
      </body>
    </html>
  );
}
