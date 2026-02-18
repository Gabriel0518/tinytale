import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { AuthProvider } from "@/lib/authContext";
import { GoogleAuthWrapper } from "@/lib/googleAuthWrapper";
import { ToastProvider } from "@/components/ui/Toast";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: {
    default: "TinyTale - Watch Short Dramas Online",
    template: "%s | TinyTale",
  },
  description: "Stream premium short dramas on TinyTale. Discover captivating stories in romance, fantasy, thriller and more — designed for mobile entertainment.",
  openGraph: {
    type: "website",
    siteName: "TinyTale",
    title: "TinyTale - Watch Short Dramas Online",
    description: "Stream premium short dramas on TinyTale. Discover captivating stories in romance, fantasy, thriller and more.",
  },
  twitter: {
    card: "summary_large_image",
    title: "TinyTale - Watch Short Dramas Online",
    description: "Stream premium short dramas on TinyTale. Discover captivating stories in romance, fantasy, thriller and more.",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark">
      <body className={inter.className}>
        <GoogleAuthWrapper>
          <AuthProvider>
            <ToastProvider>
              {children}
            </ToastProvider>
          </AuthProvider>
        </GoogleAuthWrapper>
      </body>
    </html>
  );
}
