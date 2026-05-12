import Link from "next/link";
import { ArrowUpRight } from "lucide-react";

const SCOREBOARD_URL = "https://dev-scoreboard.firstlegoleague.win";
const GITHUB_ORGANIZATION_URL =
    "https://github.com/UdL-EPS-SoftArch-Igualada";
const API_DOCUMENTATION_URL = `${
    process.env.NEXT_PUBLIC_API_BASE_URL ?? "https://api.firstlegoleague.win"
}/swagger-ui/index.html`;

const resources = [
    { href: GITHUB_ORGANIZATION_URL, label: "GitHub organization" },
    { href: API_DOCUMENTATION_URL, label: "API documentation" },
    { href: SCOREBOARD_URL, label: "Live scoreboard" },
];

export default function Footer() {
    const year = new Date().getFullYear();

    return (
        <footer className="border-t border-border bg-card">
            <div className="mx-auto w-full max-w-6xl px-4 sm:px-6 lg:px-8">
                <div className="grid gap-10 py-12 sm:grid-cols-[1fr_auto] sm:gap-16">
                    <div className="flex flex-col gap-4">
                        <div>
                            <div className="text-[0.68rem] font-medium uppercase tracking-[0.16em] text-muted-foreground">
                                Catalunya Robotics
                            </div>
                            <div className="mt-0.5 text-base font-semibold tracking-[-0.03em] text-foreground">
                                First LEGO League
                            </div>
                        </div>
                        <p className="max-w-xs text-sm leading-6 text-muted-foreground">
                            Regional competition platform for teams, projects, and matches.
                        </p>
                    </div>

                    <div className="flex flex-col gap-3">
                        <h3 className="text-[0.72rem] font-semibold uppercase tracking-[0.2em] text-muted-foreground">
                            Resources
                        </h3>
                        <ul className="flex flex-col gap-2">
                            {resources.map(({ href, label }) => (
                                <li key={href}>
                                    <a
                                        href={href}
                                        target="_blank"
                                        rel="noreferrer"
                                        className="inline-flex items-center gap-1 text-sm text-foreground/80 transition-colors hover:text-foreground focus-visible:outline-none focus-visible:text-foreground"
                                        aria-label={`${label} (opens in a new tab)`}
                                    >
                                        {label}
                                        <ArrowUpRight aria-hidden="true" className="h-3.5 w-3.5 text-muted-foreground" />
                                    </a>
                                </li>
                            ))}
                        </ul>
                    </div>
                </div>

                <div className="flex flex-col gap-2 border-t border-border py-5 text-xs text-muted-foreground sm:flex-row sm:items-center sm:justify-between">
                    <p>© {year} First LEGO League Platform</p>
                    <Link
                        href="/"
                        className="hover:text-foreground transition-colors focus-visible:outline-none focus-visible:text-foreground"
                    >
                        Back to home
                    </Link>
                </div>
            </div>
        </footer>
    );
}
