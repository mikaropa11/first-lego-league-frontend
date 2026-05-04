import Link from "next/link";
import {
    Building2,
    ExternalLink,
    LifeBuoy,
    Trophy,
} from "lucide-react";

const SCOREBOARD_URL = "https://dev-scoreboard.firstlegoleague.win";
const GITHUB_ORGANIZATION_URL =
    "https://github.com/UdL-EPS-SoftArch-Igualada";
const API_DOCUMENTATION_URL = `${
    process.env.NEXT_PUBLIC_API_BASE_URL ?? "https://api.firstlegoleague.win"
}/swagger-ui/index.html`;

const footerLinks = [
    {
        href: GITHUB_ORGANIZATION_URL,
        label: "GitHub organization",
        description: "All repositories",
        icon: Building2,
        tone: "from-blue-500/10 to-blue-500/5 border-blue-200/40",
        iconTone: "bg-blue-500/10 text-blue-600",
    },
    {
        href: API_DOCUMENTATION_URL,
        label: "API documentation",
        description: "Swagger UI",
        icon: LifeBuoy,
        tone: "from-emerald-500/10 to-emerald-500/5 border-emerald-200/40",
        iconTone: "bg-emerald-500/10 text-emerald-600",
    },
    {
        href: SCOREBOARD_URL,
        label: "Scoreboard",
        description: "Live rankings",
        icon: Trophy,
        tone: "from-amber-500/10 to-amber-500/5 border-amber-200/40",
        iconTone: "bg-amber-500/10 text-amber-600",
    },
];

export default function Footer() {
    return (
        <footer className="border-t border-border bg-card/95">
            <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6 lg:px-8">
                <div className="rounded-3xl border border-border bg-background/70 p-8 shadow-sm">
                    <div className="grid gap-8 lg:grid-cols-[1fr_1.5fr] lg:items-center">
                        <div>
                            <p className="text-[0.72rem] font-semibold uppercase tracking-[0.22em] text-primary/80">
                                Catalunya Robotics
                            </p>

                            <h2 className="mt-3 text-2xl font-semibold tracking-[-0.03em] text-foreground">
                                First LEGO League Platform
                            </h2>

                            <p className="mt-3 max-w-md text-sm leading-7 text-muted-foreground">
                                Access the main project resources, technical documentation
                                and live competition tools from one central place.
                            </p>
                        </div>

                        <nav aria-label="Footer navigation">
                            <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                                {footerLinks.map(
                                    ({ href, label, description, icon: Icon, tone, iconTone }) => (
                                        <li key={href}>
                                            <a
                                                href={href}
                                                target="_blank"
                                                rel="noreferrer"
                                                className={`group flex h-full items-start gap-4 rounded-2xl border bg-gradient-to-br ${tone} p-5 transition hover:-translate-y-1 hover:shadow-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring`}
                                                aria-label={`${label}. Opens in a new tab`}
                                            >
                                                <span
                                                    className={`rounded-xl ${iconTone} p-3 transition`}
                                                >
                                                    <Icon aria-hidden="true" className="h-5 w-5" />
                                                </span>

                                                <span className="min-w-0">
                                                    <span className="flex items-center gap-1 text-sm font-semibold text-foreground">
                                                        {label}
                                                        <ExternalLink
                                                            aria-hidden="true"
                                                            className="h-3.5 w-3.5 text-muted-foreground"
                                                        />
                                                    </span>

                                                    <span className="mt-1 block text-xs text-muted-foreground">
                                                        {description}
                                                    </span>
                                                </span>
                                            </a>
                                        </li>
                                    ),
                                )}
                            </ul>
                        </nav>
                    </div>

                    <div className="mt-8 flex flex-col gap-2 border-t border-border pt-5 text-xs text-muted-foreground sm:flex-row sm:items-center sm:justify-between">
                        <p>© {new Date().getFullYear()} First LEGO League Platform.</p>

                        <Link
                            href="/"
                            className="font-medium hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                        >
                            Back to home
                        </Link>
                    </div>
                </div>
            </div>
        </footer>
    );
}
