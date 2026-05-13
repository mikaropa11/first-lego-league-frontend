"use client";

import { useMemo, useState } from "react";
import EmptyState from "@/app/components/empty-state";
import { ArrowUpRight } from "lucide-react";
import Link from "next/link";
import { useLanguage, useTranslations } from "@/lib/languageContext";

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

function formatTeamCategory(category: string | undefined, t: ReturnType<typeof useTranslations>) {
    if (!category) return null;

    switch (category) {
        case "CHALLENGE":
            return t.teams.challengeCategory;

        case "EXPLORE":
            return t.teams.exploreCategory;

        default:
            return category;
    }
}

function TeamCardKicker() {
    const t = useTranslations();
    return <div className="teams-page-team-card__kicker">{t.teams.member}</div>;
}

function TeamFactCard({ label, value }: Readonly<{ label: string; value: string }>) {
    const t = useTranslations();

    const labelMap: Record<string, string> = {
        city: t.teams.city,
        founded: t.teams.founded,
        registered: t.teams.registered,
    };

    return (
        <div className="teams-page-team-card__fact">
            <div className="teams-page-team-card__fact-label">{labelMap[label] || label}</div>
            <div className="teams-page-team-card__fact-value">{value}</div>
        </div>
    );
}

function TeamEducationalCenter({ center }: Readonly<{ center: string }>) {
    const t = useTranslations();

    return (
        <div className="teams-page-team-card__center">
            <div className="teams-page-team-card__center-label">
                {t.teams.school}
            </div>

            <p className="teams-page-team-card__center-copy">
                {center}
            </p>
        </div>
    );
}

function TeamCardFooter({ href }: Readonly<{ href: string | null }>) {
    const t = useTranslations();

    return (
        <div
            className={
                href
                    ? "teams-page-team-card__action teams-page-team-card__action--interactive"
                    : "teams-page-team-card__action teams-page-team-card__action--disabled"
            }
        >
            {href ? t.teams.viewDetails : t.common.noResults}
            {href && <ArrowUpRight aria-hidden="true" />}
        </div>
    );
}

function TeamCard({ team }: Readonly<{ team: TeamListItem }>) {
    const t = useTranslations();
    const { language } = useLanguage();

    const inscriptionDateFormatter = useMemo(() => {
        return new Intl.DateTimeFormat(language, {
            day: "numeric",
            month: "short",
            year: "numeric",
        });
    }, [language]);

    function formatInscriptionDate(inscriptionDate?: string) {
        if (!inscriptionDate?.trim()) return null;

        const trimmedDate = inscriptionDate.trim();

        if (/^\\d{4}-\\d{2}-\\d{2}$/.test(trimmedDate)) {
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

    const formattedCategory = formatTeamCategory(team.category, t);
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
                        <TeamCardKicker />
                        <h3 className="teams-page-team-card__title">{team.name}</h3>
                    </div>
                </div>

                {hasFacts && (
                    <div className="teams-page-team-card__facts">
                        {team.city && (
                            <TeamFactCard label="city" value={team.city} />
                        )}

                        {team.foundationYear !== undefined && (
                            <TeamFactCard label="founded" value={String(team.foundationYear)} />
                        )}

                        {formattedInscriptionDate && (
                            <TeamFactCard label="registered" value={formattedInscriptionDate} />
                        )}
                    </div>
                )}

                {team.educationalCenter && (
                    <TeamEducationalCenter center={team.educationalCenter} />
                )}

                <div className="teams-page-team-card__footer">
                    <TeamCardFooter href={team.href} />
                </div>
            </div>
        </article>
    );
}

export default function TeamListClient({ teams }: TeamListClientProps) {
    const t = useTranslations();

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
                        <p className="page-eyebrow">{t.teams.searchPlaceholder}</p>

                        <h2 className="text-xl font-semibold text-foreground">
                            {t.filters.filterBy}
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
                        {t.filters.resetFilters}
                    </button>
                </div>

                <div className="grid gap-4 lg:grid-cols-3">
                    <label className="space-y-2">
                        <span className="text-sm font-medium text-foreground">
                            {t.filters.search}
                        </span>

                        <input
                            type="search"
                            value={nameQuery}
                            onChange={(event) => setNameQuery(event.target.value)}
                            placeholder={t.teams.searchPlaceholder}
                            className="w-full rounded-lg border border-border bg-background px-4 py-3 text-sm outline-none transition focus:ring-2 focus:ring-ring"
                        />
                    </label>

                    <label className="space-y-2">
                        <span className="text-sm font-medium text-foreground">
                            {t.filters.category}
                        </span>

                        <select
                            value={categoryFilter}
                            onChange={(event) => setCategoryFilter(event.target.value)}
                            className="w-full rounded-lg border border-border bg-background px-4 py-3 text-sm outline-none transition focus:ring-2 focus:ring-ring"
                        >
                            <option value="all">{t.filters.allCategories}</option>

                            {categoryOptions.map((category) => (
                                <option key={category} value={category}>
                                    {formatTeamCategory(category, t) ?? category}
                                </option>
                            ))}
                        </select>
                    </label>

                    <label className="space-y-2">
                        <span className="text-sm font-medium text-foreground">
                            {t.filters.educationalCenter}
                        </span>

                        <select
                            value={educationalCenterFilter}
                            onChange={(event) => setEducationalCenterFilter(event.target.value)}
                            className="w-full rounded-lg border border-border bg-background px-4 py-3 text-sm outline-none transition focus:ring-2 focus:ring-ring"
                        >
                            <option value="all">{t.filters.allEducationalCenters}</option>

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
                    {t.pagination.showing} {filteredTeams.length}{" "}
                    {filteredTeams.length === 1 ? t.teams.member : t.teams.members}
                </p>
            </div>

            {filteredTeams.length === 0 && (
                <EmptyState
                    title={t.empty.noTeams}
                    description={t.filters.noFiltersApplied}
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