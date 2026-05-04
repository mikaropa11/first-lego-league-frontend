import { AuthProvider } from "@/app/components/authentication";
import Footer from "@/app/components/footer";
import Navbar from "@/app/components/navbar";
import type { Metadata } from "next";
import { Suspense } from "react";
import "./globals.css";

export const metadata: Metadata = {
    title: "First LEGO League",
    description: "Frontend for the First LEGO League platform.",
};

export default function RootLayout({
    children,
}: Readonly<{
    children: React.ReactNode;
}>) {
    return (
        <html lang="en" suppressHydrationWarning>
            <body>
                <script
                    dangerouslySetInnerHTML={{
                        __html: `
            const theme = localStorage.getItem('theme');
            if (theme === 'dark') document.documentElement.classList.add('dark');
          `,
                    }}
                />
                <AuthProvider>
                    <div className="flex min-h-screen flex-col">
                        <Suspense fallback={null}>
                            <Navbar />
                        </Suspense>

                        <main className="flex-1">{children}</main>

                        <Footer />
                    </div>
                </AuthProvider>
            </body>
        </html>
    );
}
