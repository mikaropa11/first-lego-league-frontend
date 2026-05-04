"use client";

import { useAuth } from "@/app/components/authentication";
import EditionSelector from "@/app/components/edition-selector";
import Loginbar from "@/app/components/loginbar";
import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
import { Suspense, useState } from "react";
import { Menu, X, ChevronDown } from "lucide-react";

interface NavLink {
    href: string;
    label: string;
    roles?: string[];
}

function toggleTheme() {
    const html = document.documentElement;
    if (html.classList.contains("dark")) {
        html.classList.remove("dark");
        localStorage.setItem("theme", "light");
        return;
    }
    html.classList.add("dark");
    localStorage.setItem("theme", "dark");
}

export default function Navbar() {
    const [isMenuOpen, setIsMenuOpen] = useState(false);
    const [isModulesOpen, setIsModulesOpen] = useState(false);
    const pathname = usePathname();
    const searchParams = useSearchParams();
    const currentYear = searchParams.get("year");
    const { user } = useAuth();

    const mainNavLinks: NavLink[] = [
        { href: "/teams", label: "Teams" },
        { href: "/scientific-projects", label: "Scientific Projects" },
        { href: "/matches", label: "Matches" },
    ];

    const moduleLinks: NavLink[] = [
        { href: "/editions", label: "Editions" },
        { href: "/volunteers", label: "Volunteers" },
        { href: "/administrators", label: "Administrators", roles: ["ROLE_ADMIN"] }
    ];

    const getHref = (href: string) => currentYear ? `${href}?year=${encodeURIComponent(currentYear)}` : href;

    return (
        <nav className="sticky top-0 z-50 border-b border-border bg-card/95 backdrop-blur-sm">
            <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
                <div className="flex h-16 items-center justify-between gap-4">

                    {/* Logo Section */}
                    <Link href="/" className="mr-auto flex min-w-0 items-center gap-3 shrink-0">
                        <span className="block h-8 w-1 bg-primary" />
                        <div className="min-w-0">
                            <div className="text-[0.68rem] font-medium uppercase tracking-[0.16em] text-muted-foreground">
                                Catalunya Robotics
                            </div>
                            <div className="truncate text-lg font-semibold tracking-[-0.03em] text-foreground">
                                First LEGO League
                            </div>
                        </div>
                    </Link>

                    {/* Desktop Menu */}
                    <div className="hidden lg:flex items-center gap-1">
                        {mainNavLinks.map(({ href, label }) => (
                            <Link
                                key={href}
                                href={getHref(href)}
                                className={`px-3 py-2 text-sm font-medium transition-colors whitespace-nowrap ${pathname.startsWith(href) ? 'text-accent border-b-2 border-accent' : 'text-muted-foreground hover:text-foreground border-b-2 border-transparent'}`}
                            >
                                {label}
                            </Link>
                        ))}

                        {/* Dropdown Click Modules*/}
                        <div className="relative">
                            <button
                                onClick={() => setIsModulesOpen(!isModulesOpen)}
                                className={`flex items-center gap-1 px-3 py-2 text-sm font-medium transition-colors rounded-md whitespace-nowrap ${isModulesOpen ? 'bg-secondary text-foreground' : 'text-muted-foreground hover:text-foreground'}`}
                            >
                                Modules <ChevronDown size={14} className={`transition-transform duration-200 ${isModulesOpen ? 'rotate-180' : ''}`} />
                            </button>

                            {isModulesOpen && (
                                <>
                                    <div
                                        className="fixed inset-0 z-40 cursor-default bg-transparent"
                                        onClick={() => setIsModulesOpen(false)}

                                        onKeyDown={(e) => {
                                            if (e.key === "Escape" || e.key === "Enter") {
                                                setIsModulesOpen(false);
                                            }
                                        }}
                                        role="button"
                                        tabIndex={-1}
                                        aria-label="Close menu"
                                    />

                                    <div className="absolute left-0 top-full pt-2 w-48 flex flex-col z-50 animate-in fade-in zoom-in-95">
                                        <div className="flex flex-col rounded-md border border-border bg-card p-1 shadow-lg">
                                            {moduleLinks
                                                .filter(l => !l.roles || user?.authorities?.some(a => l.roles?.includes(a.authority)))
                                                .map(link => (
                                                    <Link
                                                        key={link.href}
                                                        href={getHref(link.href)}
                                                        className="block rounded-md px-3 py-2 text-sm hover:bg-secondary transition-colors"
                                                        onClick={() => setIsModulesOpen(false)}
                                                    >
                                                        {link.label}
                                                    </Link>
                                                ))}
                                        </div>
                                    </div>
                                </>
                            )}
                        </div>
                    </div>

                    {/* Right Side Actions */}
                    <div className="flex items-center gap-3 shrink-0">
                        <Suspense fallback={null}>
                            <EditionSelector />
                        </Suspense>
                        <Loginbar />
                        <button
                            type="button"
                            onClick={toggleTheme}
                            aria-label="Toggle dark mode"
                            className="rounded-md border border-border px-3 py-1.5 text-sm text-muted-foreground hover:bg-secondary hover:text-foreground cursor-pointer transition-colors"
                        >
                            <span className="dark:hidden">🌙</span>
                            <span className="hidden dark:inline">☀️</span>
                        </button>

                        {/* Mobile Menu Button */}
                        <button
                            onClick={() => setIsMenuOpen(!isMenuOpen)}
                            className="lg:hidden p-2 text-muted-foreground hover:text-foreground transition-colors"
                        >
                            {isMenuOpen ? <X /> : <Menu />}
                        </button>
                    </div>
                </div>
            </div>

            {/* Mobile Menu Content */}
            {isMenuOpen && (
                <div className="lg:hidden border-t border-border bg-card p-4 space-y-2 animate-in slide-in-from-top-2">
                    {[...mainNavLinks, ...moduleLinks]
                        .filter(l => !l.roles || user?.authorities?.some(a => l.roles?.includes(a.authority)))
                        .map(link => (
                            <Link
                                key={link.href}
                                href={getHref(link.href)}
                                onClick={() => setIsMenuOpen(false)}
                                className={`block w-full rounded-md px-4 py-3 text-base font-medium ${pathname.startsWith(link.href) ? 'bg-accent/10 text-accent' : 'hover:bg-secondary'}`}
                            >
                                {link.label}
                            </Link>
                        ))
                    }
                </div>
            )}
        </nav>
    );
}