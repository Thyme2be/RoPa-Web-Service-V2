import type { Metadata } from "next";
import "./globals.css";
import { AuthProvider } from "@/context/AuthContext";
import { AppProviders } from "@/context/Providers";
import { Toaster } from "react-hot-toast";

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
      className="h-full antialiased"
    >
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Sarabun:ital,wght@0,100;0,200;0,300;0,400;0,500;0,600;0,700;0,800;1,100;1,200;1,300;1,400;1,500;1,600;1,700;1,800&display=swap"
          rel="stylesheet"
        />
        <link
          rel="stylesheet"
          href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:opsz,wght,FILL,GRAD@20..48,100..700,0..1,-25..0&family=Material+Symbols+Rounded:opsz,wght,FILL,GRAD@20..48,100..700,0..1,-25..0&display=block"
        />
      </head>
      <body className="h-full" style={{ fontFamily: "'Sarabun', sans-serif" }}>
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