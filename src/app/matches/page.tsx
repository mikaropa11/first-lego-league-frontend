import { EditionsService } from "@/api/editionApi";
import { MatchesService } from "@/api/matchesApi";
import { UsersService } from "@/api/userApi";
import { buttonVariants } from "@/app/components/button";
import EmptyState from "@/app/components/empty-state";
import ErrorAlert from "@/app/components/error-alert";
import PageShell from "@/app/components/page-shell";
import PaginationControls from "@/app/components/pagination-controls";
import { serverAuthProvider } from "@/lib/authProvider";
import { isAdmin } from "@/lib/authz";
import { getEncodedResourceId } from "@/lib/halRoute";
import { formatMatchTime } from "@/lib/matchUtils";
import { parseErrorMessage } from "@/types/errors";
import type { HalPage } from "@/types/pagination";
import { Match } from "@/types/match";
import { User } from "@/types/user";
import Link from "next/link";
import { MatchesTimeline } from "./matches-timeline";
import { cn } from "@/lib/utils";

export const dynamic = "force-dynamic";

const PAGE_SIZE = 5;

function getTeamsLabel(match: Match, labels: Record<string, string>) {
    const key = match.link("self")?.href ?? match.uri;
    return labels[key] ?? "Unknown Team vs Unknown Team";
}

function getMatchKey(match: Match, index: number) {
    if (match.id !== undefined && match.id !== null) {
        return String(match.id);
    }

    if (match.uri) {
        return match.uri;
    }

    return match.link("self")?.href ?? `match-${index}`;
}

function compareMatchTimes(left: string = "", right: string = "") {
    return left.localeCompare(right);
}

function MatchesTable({ matches, labels, yearQuery }: Readonly<{ matches: Match[]; labels: Record<string, string>; yearQuery: string }>) {
    return (
        <div className="overflow-hidden border border-border">
            <div className="overflow-x-auto">
                <table className="w-full min-w-2xl border-collapse text-left">
                    <caption className="sr-only">List of matches with start time, end time and teams.</caption>
                    <thead className="bg-secondary/70">
                        <tr>
                            <th className="px-4 py-3 text-sm font-semibold text-foreground sm:px-5">Start time</th>
                            <th className="px-4 py-3 text-sm font-semibold text-foreground sm:px-5">End time</th>
                            <th className="px-4 py-3 text-sm font-semibold text-foreground sm:px-5">Teams</th>
                        </tr>
                    </thead>
                    <tbody>
                        {matches.map((match, index) => {
                            const matchId = getEncodedResourceId(match.link("self")?.href ?? match.uri);
                            return (
                                <tr
                                    key={getMatchKey(match, index)}
                                    className={cn(
                                        "border-t border-border transition-colors hover:bg-secondary/40",
                                        match.state === "IN_PROGRESS" && "border-l-2 border-l-red-500 bg-red-500/5"
                                    )}
                                >
                                    <td className="px-4 py-4 text-sm text-foreground sm:px-5">
                                        {formatMatchTime(match.startTime)}
                                    </td>
                                    <td className="px-4 py-4 text-sm text-foreground sm:px-5">
                                        {formatMatchTime(match.endTime)}
                                    </td>
                                    <td className="px-4 py-4 text-sm text-muted-foreground sm:px-5">
                                        <div className="flex items-center gap-2">
                                            {match.state === "IN_PROGRESS" && (
                                                <span className="inline-flex animate-pulse items-center rounded-full bg-red-100 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-red-700">
                                                    ● LIVE
                                                </span>
                                            )}
                                            {matchId ? (
                                                <Link
                                                    href={`/matches/${matchId}${yearQuery}`}
                                                    className="hover:text-foreground hover:underline underline-offset-2"
                                                >
                                                    {getTeamsLabel(match, labels)}
                                                </Link>
                                            ) : (
                                                getTeamsLabel(match, labels)
                                            )}
                                        </div>
                                    </td>
                                </tr>
                            );
                        })}
                    </tbody>
                </table>
            </div>
        </div>
    );
}

function getFriendlyMatchesError(error: unknown) {
    const parsedMessage = parseErrorMessage(error);

    if (parsedMessage === "An unexpected error occurred. Please try again.") {
        return "We could not load the matches right now. Please try again in a few minutes.";
    }

    return `We could not load the matches. ${parsedMessage}`;
}

type PageSearchParams = Promise<Record<string, string | string[] | undefined>>;

export default async function MatchesPage({ searchParams }: Readonly<{ searchParams: PageSearchParams }>) {
    const params = await searchParams;
    const yearParam = params.year;
    const year = Array.isArray(yearParam) ? yearParam[0] : yearParam;
    const yearQuery = year ? `?year=${year}` : "";
    const urlPage = Math.max(1, Number(params.page ?? "1") || 1);
    const viewParam = params.view;
    const view = Array.isArray(viewParam) ? viewParam[0] : viewParam;
    const isCalendarView = view === "calendar";

    let matches: Match[] = [];
    let matchLabels: Record<string, string> = {};
    let result: HalPage<Match> = { items: [], hasNext: false, hasPrev: false, currentPage: 0 };
    let error: string | null = null;
    let currentUser: User | null = null;
    let editionId: string | null = null;

    try {
        currentUser = await new UsersService(serverAuthProvider).getCurrentUser();
    } catch (fetchError) {
        console.error("Failed to fetch current user:", fetchError);
    }

    try {
        const service = new MatchesService(serverAuthProvider);

        if (year) {
            const editionsService = new EditionsService(serverAuthProvider);
            const edition = await editionsService.getEditionByYear(year);
            editionId = getEncodedResourceId(edition?.uri ?? edition?.link("self")?.href);

            if (edition?.uri) {
                const response = await service.getMatchesByEdition(edition.uri + "/matches");
                matches = [...response].sort((left, right) => {
                    const startDiff = compareMatchTimes(left.startTime, right.startTime);
                    if (startDiff !== 0) return startDiff;
                    const endDiff = compareMatchTimes(left.endTime, right.endTime);
                    if (endDiff !== 0) return endDiff;
                    return String(left.id ?? "").localeCompare(String(right.id ?? ""));
                });
            }
        } else {
            result = await service.getMatchesPaged(urlPage - 1, PAGE_SIZE);
            matches = result.items;
        }

        const resolvedLabels = await Promise.all(matches.map(async (match) => {
            const selfLink = match.link("self")?.href ?? match.uri;
            const matchId = getEncodedResourceId(selfLink);

            if (!matchId) return { key: selfLink, label: "Unknown Team vs Unknown Team" };

            let nameA = match.teamA;
            let nameB = match.teamB;

            try {
                if (match.link("teamA")) {
                    const tA = await service.getMatchTeamA(decodeURIComponent(matchId));
                    nameA = tA?.name ?? tA?.id ?? nameA ?? "Team A";
                }
            } catch (error) {
                console.error(`Failed to fetch team A for match ${matchId}:`, error);
                if (!nameA) nameA = "Team A";
            }

            try {
                if (match.link("teamB")) {
                    const tB = await service.getMatchTeamB(decodeURIComponent(matchId));
                    nameB = tB?.name ?? tB?.id ?? nameB ?? "Team B";
                }
            } catch (error) {
                console.error(`Failed to fetch team B for match ${matchId}:`, error);
                if (!nameB) nameB = "Team B";
            }

            return {
                key: selfLink,
                label: `${nameA ?? "Team A"} vs ${nameB ?? "Team B"}`
            };
        }));

        matchLabels = resolvedLabels.reduce((acc, { key, label }) => {
            acc[key] = label;
            return acc;
        }, {} as Record<string, string>);

    } catch (fetchError) {
        console.error("Failed to fetch matches:", fetchError);
        error = getFriendlyMatchesError(fetchError);
    }

    function buildViewUrl(newView: string) {
        const urlParams = new URLSearchParams();
        if (year) urlParams.set("year", year);
        if (newView === "calendar") urlParams.set("view", "calendar");
        if (urlPage > 1 && newView !== "calendar") urlParams.set("page", String(urlPage));
        const qs = urlParams.toString();
        return qs ? `/matches?${qs}` : "/matches";
    }

    return (
        <PageShell
            eyebrow="Competition schedule"
            title="Matches"
            description="Browse the scheduled matches with timing details and participating teams."
            heroAside={isAdmin(currentUser) ? (
                <Link
                    href={`/matches/new${yearQuery}`}
                    className={buttonVariants({ variant: "default", size: "sm" })}
                >
                    + Create
                </Link>
            ) : undefined}
        >
            <div className="space-y-6">
                <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
                    <div className="space-y-3">
                        <div className="page-eyebrow">Live listing</div>
                        <h2 className="section-title">Match schedule</h2>
                    </div>
                    <div className="flex flex-wrap items-center gap-2">
                        <div className="flex bg-secondary p-1 rounded-md border border-border">
                            <Link
                                href={buildViewUrl("list")}
                                className={cn(
                                    "px-3 py-1.5 text-sm font-medium rounded-sm transition-colors",
                                    isCalendarView ? "text-muted-foreground hover:text-foreground" : "bg-background text-foreground shadow-sm"
                                )}
                            >
                                List
                            </Link>
                            <Link
                                href={buildViewUrl("calendar")}
                                className={cn(
                                    "px-3 py-1.5 text-sm font-medium rounded-sm transition-colors",
                                    isCalendarView ? "bg-background text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"
                                )}
                            >
                                Calendar
                            </Link>
                        </div>
                        {editionId && (
                            <Link
                                href={`/editions/${editionId}/competition-tables`}
                                className={buttonVariants({ variant: "outline", size: "sm" })}
                            >
                                Competition Tables
                            </Link>
                        )}
                    </div>
                </div>

                {error && <ErrorAlert message={error} />}

                {!error && matches.length === 0 && (
                    <EmptyState
                        title="No matches available"
                        description="There are no scheduled matches yet."
                    />
                )}

                {!error && matches.length > 0 && (
                    <div className="space-y-4">
                        {isCalendarView ? (
                            <MatchesTimeline matches={matches} labels={matchLabels} yearQuery={yearQuery} />
                        ) : (
                            <MatchesTable matches={matches} labels={matchLabels} yearQuery={yearQuery} />
                        )}
                        {!year && !isCalendarView && (
                            <PaginationControls
                                currentPage={urlPage}
                                hasNext={result.hasNext}
                                hasPrev={result.hasPrev}
                                basePath="/matches"
                            />
                        )}
                    </div>
                )}
            </div>
        </PageShell>
    );
}
