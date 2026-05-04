"use client";

import { useMemo, useState } from "react";
import EmptyState from "@/app/components/empty-state";
import { ArrowUpRight } from "lucide-react";
import Link from "next/link";

export interface TeamListItem {
    readonly key: string;
    readonly href: string | null;
    readonly name: string;
    readonly category?: string;
    readonly city?: string;
    readonly educationalCenter?: string | null;
    readonly foundationYear?: number;
    readonly inscriptionDate?: string;
}

interface TeamListClientProps {
    readonly teams: TeamListItem[];
}

const inscriptionDateFormatter = new Intl.DateTimeFormat("en", {
    day: "numeric",
    month: "short",
    year: "numeric",
});

function formatTeamCategory(category?: string) {
    if (!category) return null;

    return category
        .toLowerCase()
        .split("_")
        .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
        .join(" ");
}

function formatInscriptionDate(inscriptionDate?: string) {
    if (!inscriptionDate?.trim()) return null;

    const trimmedDate = inscriptionDate.trim();

    if (/^\d{4}-\d{2}-\d{2}$/.test(trimmedDate)) {
        const [year, month, day] = trimmedDate.split("-").map(Number);
        const parsedDate = new Date(year, month - 1, day);

        return Number.isNaN(parsedDate.getTime())
            ? trimmedDate
            : inscriptionDateFormatter.format(parsedDate);
    }

    const parsedDate = new Date(trimmedDate);

    return Number.isNaN(parsedDate.getTime())
        ? trimmedDate
        : inscriptionDateFormatter.format(parsedDate);
}

function TeamCard({ team }: Readonly<{ team: TeamListItem }>) {
    const formattedCategory = formatTeamCategory(team.category);
    const formattedInscriptionDate = formatInscriptionDate(team.inscriptionDate);
    const categoryTone = team.category?.toLowerCase() ?? "unknown";
    const hasFacts = Boolean(
        team.city || team.foundationYear !== undefined || formattedInscriptionDate,
    );

    return (
        <article className="teams-page-team-card" data-category={categoryTone}>
            <div className="teams-page-team-card__body">
                <div className="teams-page-team-card__masthead">
                    {formattedCategory && (
                        <div className="teams-page-team-card__division">
                            {formattedCategory}
                        </div>
                    )}
                </div>

                <div className="teams-page-team-card__header">
                    <div className="teams-page-team-card__identity">
                        <div className="teams-page-team-card__kicker">Team</div>
                        <h3 className="teams-page-team-card__title">{team.name}</h3>
                    </div>
                </div>

                {hasFacts && (
                    <div className="teams-page-team-card__facts">
                        {team.city && (
                            <div className="teams-page-team-card__fact">
                                <div className="teams-page-team-card__fact-label">City</div>
                                <div className="teams-page-team-card__fact-value">{team.city}</div>
                            </div>
                        )}

                        {team.foundationYear !== undefined && (
                            <div className="teams-page-team-card__fact">
                                <div className="teams-page-team-card__fact-label">Founded</div>
                                <div className="teams-page-team-card__fact-value">
                                    {team.foundationYear}
                                </div>
                            </div>
                        )}

                        {formattedInscriptionDate && (
                            <div className="teams-page-team-card__fact">
                                <div className="teams-page-team-card__fact-label">Registered</div>
                                <div className="teams-page-team-card__fact-value">
                                    {formattedInscriptionDate}
                                </div>
                            </div>
                        )}
                    </div>
                )}

                {team.educationalCenter && (
                    <div className="teams-page-team-card__center">
                        <div className="teams-page-team-card__center-label">
                            Educational center
                        </div>
                        <p className="teams-page-team-card__center-copy">
                            {team.educationalCenter}
                        </p>
                    </div>
                )}

                <div className="teams-page-team-card__footer">
                    <div
                        className={
                            team.href
                                ? "teams-page-team-card__action teams-page-team-card__action--interactive"
                                : "teams-page-team-card__action teams-page-team-card__action--disabled"
                        }
                    >
                        {team.href ? "View details" : "Profile unavailable"}
                        {team.href && <ArrowUpRight aria-hidden="true" />}
                    </div>
                </div>
            </div>
        </article>
    );
}

export default function TeamListClient({ teams }: TeamListClientProps) {
    const [nameQuery, setNameQuery] = useState("");
    const [categoryFilter, setCategoryFilter] = useState("all");
    const [educationalCenterFilter, setEducationalCenterFilter] = useState("all");

    const categoryOptions = useMemo(() => {
        return Array.from(
            new Set(
                teams
                    .map((team) => team.category)
                    .filter((category): category is string => Boolean(category)),
            ),
        ).sort((a, b) => a.localeCompare(b, "en", { sensitivity: "base" }));
    }, [teams]);

    const educationalCenterOptions = useMemo(() => {
        return Array.from(
            new Set(
                teams
                    .map((team) => team.educationalCenter)
                    .filter((center): center is string => Boolean(center)),
            ),
        ).sort((a, b) => a.localeCompare(b, "en", { sensitivity: "base" }));
    }, [teams]);

    const filteredTeams = useMemo(() => {
        const normalizedNameQuery = nameQuery.trim().toLowerCase();

        return teams.filter((team) => {
            const matchesName = team.name.toLowerCase().includes(normalizedNameQuery);
            const matchesCategory =
                categoryFilter === "all" || team.category === categoryFilter;
            const matchesEducationalCenter =
                educationalCenterFilter === "all" ||
                team.educationalCenter === educationalCenterFilter;

            return matchesName && matchesCategory && matchesEducationalCenter;
        });
    }, [teams, nameQuery, categoryFilter, educationalCenterFilter]);

    const hasActiveFilters =
        nameQuery.trim().length > 0 ||
        categoryFilter !== "all" ||
        educationalCenterFilter !== "all";

    function clearFilters() {
        setNameQuery("");
        setCategoryFilter("all");
        setEducationalCenterFilter("all");
    }

    return (
        <div className="space-y-8">
            <section className="rounded-2xl border border-border bg-card p-6 shadow-sm">
                <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                        <p className="page-eyebrow">Browse teams</p>
                        <h2 className="text-xl font-semibold text-foreground">
                            Filter teams
                        </h2>
                    </div>

                    <button
                        type="button"
                        onClick={clearFilters}
                        disabled={!hasActiveFilters}
                        className={`rounded-md px-4 py-2 text-sm font-medium transition ${
                            hasActiveFilters
                                ? "border border-red-500 bg-red-500 text-white hover:bg-red-600"
                                : "border border-border text-muted-foreground disabled:cursor-not-allowed disabled:opacity-50"
                        }`}
                    >
                        Clear filters
                    </button>
                </div>

                <div className="grid gap-4 lg:grid-cols-3">
                    <label className="space-y-2">
                        <span className="text-sm font-medium text-foreground">
                            Search by name
                        </span>
                        <input
                            type="search"
                            value={nameQuery}
                            onChange={(event) => setNameQuery(event.target.value)}
                            placeholder="Search teams..."
                            className="w-full rounded-lg border border-border bg-background px-4 py-3 text-sm outline-none transition focus:ring-2 focus:ring-ring"
                        />
                    </label>

                    <label className="space-y-2">
                        <span className="text-sm font-medium text-foreground">
                            Category
                        </span>
                        <select
                            value={categoryFilter}
                            onChange={(event) => setCategoryFilter(event.target.value)}
                            className="w-full rounded-lg border border-border bg-background px-4 py-3 text-sm outline-none transition focus:ring-2 focus:ring-ring"
                        >
                            <option value="all">All categories</option>
                            {categoryOptions.map((category) => (
                                <option key={category} value={category}>
                                    {formatTeamCategory(category) ?? category}
                                </option>
                            ))}
                        </select>
                    </label>

                    <label className="space-y-2">
                        <span className="text-sm font-medium text-foreground">
                            Educational center
                        </span>
                        <select
                            value={educationalCenterFilter}
                            onChange={(event) => setEducationalCenterFilter(event.target.value)}
                            className="w-full rounded-lg border border-border bg-background px-4 py-3 text-sm outline-none transition focus:ring-2 focus:ring-ring"
                        >
                            <option value="all">All educational centers</option>
                            {educationalCenterOptions.map((center) => (
                                <option key={center} value={center}>
                                    {center}
                                </option>
                            ))}
                        </select>
                    </label>
                </div>
            </section>

            <div className="flex items-center justify-between">
                <p className="text-sm text-muted-foreground">
                    Showing {filteredTeams.length} team
                    {filteredTeams.length !== 1 ? "s" : ""}
                </p>
            </div>

            {filteredTeams.length === 0 && (
                <EmptyState
                    title="No teams match your filters"
                    description="Try changing the search text or selecting another filter."
                />
            )}

            {filteredTeams.length > 0 && (
                <ul className="teams-page-grid">
                    {filteredTeams.map((team) => {
                        const card = <TeamCard team={team} />;

                        return (
                            <li key={team.key} className="teams-page-item">
                                {team.href ? (
                                    <Link href={team.href} className="teams-page-link">
                                        {card}
                                    </Link>
                                ) : (
                                    <div className="teams-page-link">{card}</div>
                                )}
                            </li>
                        );
                    })}
                </ul>
            )}
        </div>
    );
}
