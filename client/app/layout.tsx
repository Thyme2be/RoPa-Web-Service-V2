import type { Metadata } from "next";
import { Sarabun } from "next/font/google";
import "./globals.css";
import { AuthProvider } from "@/context/AuthContext";
import { AppProviders } from "@/context/Providers";
import { Toaster } from "react-hot-toast";

const sarabun = Sarabun({
  variable: "--font-sarabun",
  subsets: ["thai", "latin"],
  weight: ["100", "200", "300", "400", "500", "600", "700", "800"],
});

export const metadata: Metadata = {
  title: "Netbay RoPA Management",
  description: "Enterprise Record of Processing Activities Manager",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="th"
      className={`${sarabun.variable} h-full antialiased`}
    >
      <head>
        <link
          rel="stylesheet"
          href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:opsz,wght,FILL,GRAD@20..48,100..700,0..1,-25..0&family=Material+Symbols+Rounded:opsz,wght,FILL,GRAD@20..48,100..700,0..1,-25..0&display=block"
        />
      </head>
      <body className={`${sarabun.className} h-full`}>
        <AuthProvider>
          <AppProviders>
            {children}
            <Toaster position="top-right" />
          </AppProviders>
        </AuthProvider>
      </body>
    </html>
  );
}