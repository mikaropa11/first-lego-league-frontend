import { AuthProvider } from "@/app/components/authentication";
import { FavoritesProvider } from "@/app/components/favorites-provider";
import Footer from "@/app/components/footer";
import Navbar from "@/app/components/navbar";
import type { Metadata } from "next";
import { Suspense } from "react";
import "./globals.css";
import "../css/volunteers-list.css";

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
                    <FavoritesProvider>
                        <div className="flex min-h-screen flex-col">
                            <Suspense fallback={null}>
                                <Navbar />
                            </Suspense>

                            <main className="flex-1">{children}</main>

                            <Footer />
                        </div>
                    </FavoritesProvider>
                </AuthProvider>
            </body>
        </html>
    );
}
