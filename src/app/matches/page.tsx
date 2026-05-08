import { EditionsService } from "@/api/editionApi";
import { MatchesService } from "@/api/matchesApi";
import { TeamsService } from "@/api/teamApi";
import { UsersService } from "@/api/userApi";
import { buttonVariants } from "@/app/components/button";
import { Input } from "@/app/components/input";
import EmptyState from "@/app/components/empty-state";
import ErrorAlert from "@/app/components/error-alert";
import PageShell from "@/app/components/page-shell";
import PaginationControls from "@/app/components/pagination-controls";
import { serverAuthProvider } from "@/lib/authProvider";
import { isAdmin } from "@/lib/authz";
import { getEncodedResourceId } from "@/lib/halRoute";
import { filterMatchesByTeam, normalizeTeamSearch } from "@/lib/matchFilter";
import { formatMatchDate, formatMatchTime } from "@/lib/matchUtils";
import { parseErrorMessage } from "@/types/errors";
import type { HalPage } from "@/types/pagination";
import { Match } from "@/types/match";
import { Team } from "@/types/team";
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
    const leftDate = new Date(left).getTime();
    const rightDate = new Date(right).getTime();

    if (!Number.isNaN(leftDate) && !Number.isNaN(rightDate)) {
        return leftDate - rightDate;
    }

    return left.localeCompare(right);
}

function getSearchValue(value: string | string[] | undefined) {
    return Array.isArray(value) ? value[0] ?? "" : value ?? "";
}

function MatchesTeamFilter({
    query,
    year,
    view,
}: Readonly<{ query: string; year?: string; view?: string }>) {
    const resetParams = new URLSearchParams();

    if (year) resetParams.set("year", year);
    if (view === "calendar") resetParams.set("view", view);

    const resetHref = resetParams.toString()
        ? `/matches?${resetParams.toString()}`
        : "/matches";

    return (
        <form
            action="/matches"
            className="flex flex-col gap-3 border border-border bg-card p-4 sm:flex-row sm:items-end"
        >
            {year ? (
                <input type="hidden" name="year" value={year} />
            ) : null}

            {view === "calendar" ? (
                <input type="hidden" name="view" value={view} />
            ) : null}

            <div className="min-w-0 flex-1 space-y-2">
                <label
                    htmlFor="team-search"
                    className="text-sm font-medium text-foreground"
                >
                    Team filter
                </label>

                <Input
                    id="team-search"
                    name="team"
                    type="search"
                    defaultValue={query}
                    placeholder="Search by team name..."
                    autoComplete="off"
                />
            </div>

            <div className="flex gap-2">
                <button
                    type="submit"
                    className={buttonVariants({
                        variant: "secondary",
                        size: "default",
                    })}
                >
                    Search
                </button>

                {query ? (
                    <Link
                        href={resetHref}
                        className={buttonVariants({
                            variant: "ghost",
                            size: "default",
                        })}
                    >
                        Reset
                    </Link>
                ) : null}
            </div>
        </form>
    );
}

function MatchesTable({
    matches,
    labels,
    yearQuery,
}: Readonly<{
    matches: Match[];
    labels: Record<string, string>;
    yearQuery: string;
}>) {
    return (
        <div className="overflow-hidden border border-border">
            <div className="overflow-x-auto">
                <table className="w-full min-w-2xl border-collapse text-left">
                    <caption className="sr-only">
                        List of matches with day, start time, end time and teams.
                    </caption>

                    <thead className="bg-secondary/70">
                        <tr>
                            <th className="px-4 py-3 text-sm font-semibold text-foreground sm:px-5">
                                Day
                            </th>

                            <th className="px-4 py-3 text-sm font-semibold text-foreground sm:px-5">
                                Start time
                            </th>

                            <th className="px-4 py-3 text-sm font-semibold text-foreground sm:px-5">
                                End time
                            </th>

                            <th className="px-4 py-3 text-sm font-semibold text-foreground sm:px-5">
                                Teams
                            </th>
                        </tr>
                    </thead>

                    <tbody>
                        {matches.map((match, index) => {
                            const matchId = getEncodedResourceId(
                                match.link("self")?.href ?? match.uri
                            );

                            return (
                                <tr
                                    key={getMatchKey(match, index)}
                                    className={cn(
                                        "border-t border-border transition-colors hover:bg-secondary/40",
                                        match.state === "IN_PROGRESS" &&
                                            "border-l-2 border-l-red-500 bg-red-500/5"
                                    )}
                                >
                                    <td className="px-4 py-4 text-sm text-foreground sm:px-5 whitespace-nowrap">
                                        {formatMatchDate(match.startTime)}
                                    </td>

                                    <td className="px-4 py-4 text-sm text-foreground sm:px-5 whitespace-nowrap">
                                        {formatMatchTime(match.startTime)}
                                    </td>

                                    <td className="px-4 py-4 text-sm text-foreground sm:px-5 whitespace-nowrap">
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

    if (
        parsedMessage ===
        "An unexpected error occurred. Please try again."
    ) {
        return "We could not load the matches right now. Please try again in a few minutes.";
    }

    return `We could not load the matches. ${parsedMessage}`;
}

type PageSearchParams = Promise<
    Record<string, string | string[] | undefined>
>;

type MatchesSearchState = {
    year?: string;
    yearQuery: string;
    urlPage: number;
    view?: string;
    isCalendarView: boolean;
    teamQuery: string;
    normalizedTeamQuery: string;
    hasTeamFilter: boolean;
};

function getMatchesSearchState(
    params: Record<string, string | string[] | undefined>
): MatchesSearchState {
    const yearParam = params.year;
    const year = Array.isArray(yearParam) ? yearParam[0] : yearParam;

    const yearQuery = year ? `?year=${year}` : "";

    const urlPage = Math.max(1, Number(params.page ?? "1") || 1);

    const viewParam = params.view;
    const view = Array.isArray(viewParam) ? viewParam[0] : viewParam;

    const isCalendarView = view === "calendar";

    const teamQuery = getSearchValue(params.team);

    const normalizedTeamQuery = normalizeTeamSearch(teamQuery);

    const hasTeamFilter = normalizedTeamQuery.length > 0;

    return {
        year,
        yearQuery,
        urlPage,
        view,
        isCalendarView,
        teamQuery,
        normalizedTeamQuery,
        hasTeamFilter,
    };
}

async function getCurrentUser() {
    try {
        return await new UsersService(
            serverAuthProvider
        ).getCurrentUser();
    } catch (fetchError) {
        console.error(
            "Failed to fetch current user:",
            fetchError
        );

        return null;
    }
}

async function getMatchesForView(
    service: MatchesService,
    {
        year,
        hasTeamFilter,
        urlPage,
    }: Pick<
        MatchesSearchState,
        "year" | "hasTeamFilter" | "urlPage"
    >
) {
    let editionId: string | null = null;

    let result: HalPage<Match> = {
        items: [],
        hasNext: false,
        hasPrev: false,
        currentPage: 0,
    };

    if (year) {
        const editionsService = new EditionsService(
            serverAuthProvider
        );

        const edition = await editionsService.getEditionByYear(
            year
        );

        editionId = getEncodedResourceId(
            edition?.uri ?? edition?.link("self")?.href
        );

        const response = edition?.uri
            ? await service.getMatchesByEdition(
                  edition.uri + "/matches"
              )
            : [];

        return {
            matches: sortMatches(response),
            result,
            editionId,
        };
    }

    if (hasTeamFilter) {
        const matches = await service.getMatches();

        return {
            matches: sortMatches(matches),
            result,
            editionId,
        };
    }

    result = await service.getMatchesPaged(
        urlPage - 1,
        PAGE_SIZE
    );

    return {
        matches: sortMatches(result.items),
        result,
        editionId,
    };
}

function sortMatches(matches: Match[]) {
    return [...matches].sort((left, right) => {
        const startDiff = compareMatchTimes(
            left.startTime,
            right.startTime
        );

        if (startDiff !== 0) return startDiff;

        const endDiff = compareMatchTimes(
            left.endTime,
            right.endTime
        );

        if (endDiff !== 0) return endDiff;

        return String(left.id ?? "").localeCompare(
            String(right.id ?? "")
        );
    });
}

function getLinkedTeamId(
    match: Match,
    rel: "teamA" | "teamB"
) {
    const href = match.link(rel)?.href;

    if (!href) return null;

    try {
        const pathname = href.startsWith("http")
            ? new URL(href).pathname
            : href.split(/[?#]/, 1)[0];

        const teamId = pathname
            .split("/")
            .filter(Boolean)
            .pop();

        return teamId ? decodeURIComponent(teamId) : null;
    } catch (error) {
        console.error(
            `Failed to read ${rel} link for match ${match.uri}:`,
            error
        );

        return null;
    }
}

function getTeamDisplayName(
    team: Team | null,
    fallback: string | undefined,
    genericName: string
) {
    return team?.name ?? team?.id ?? fallback ?? genericName;
}

async function resolveMatchLabels(matches: Match[]) {
    const teamsService = new TeamsService(serverAuthProvider);

    const teamCache = new Map<string, Promise<Team | null>>();

    const getTeam = (teamId: string) => {
        if (!teamCache.has(teamId)) {
            teamCache.set(
                teamId,
                teamsService.getTeamById(teamId).catch((error) => {
                    console.error(
                        `Failed to fetch team ${teamId}:`,
                        error
                    );

                    return null;
                })
            );
        }

        return teamCache.get(teamId)!;
    };

    const resolvedLabels = await Promise.all(
        matches.map(async (match) => {
            const selfLink =
                match.link("self")?.href ?? match.uri;

            const teamAId = getLinkedTeamId(match, "teamA");
            const teamBId = getLinkedTeamId(match, "teamB");

            const [teamA, teamB] = await Promise.all([
                teamAId ? getTeam(teamAId) : null,
                teamBId ? getTeam(teamBId) : null,
            ]);

            return {
                key: selfLink,
                label: `${getTeamDisplayName(
                    teamA,
                    match.teamA,
                    "Team A"
                )} vs ${getTeamDisplayName(
                    teamB,
                    match.teamB,
                    "Team B"
                )}`,
            };
        })
    );

    return resolvedLabels.reduce((acc, { key, label }) => {
        acc[key] = label;

        return acc;
    }, {} as Record<string, string>);
}

export default async function MatchesPage({
    searchParams,
}: Readonly<{ searchParams: PageSearchParams }>) {
    const searchState = getMatchesSearchState(
        await searchParams
    );

    const {
        year,
        yearQuery,
        urlPage,
        view,
        isCalendarView,
        teamQuery,
        normalizedTeamQuery,
        hasTeamFilter,
    } = searchState;

    let matches: Match[] = [];

    let matchLabels: Record<string, string> = {};

    let result: HalPage<Match> = {
        items: [],
        hasNext: false,
        hasPrev: false,
        currentPage: 0,
    };

    let error: string | null = null;

    const currentUser: User | null =
        await getCurrentUser();

    let editionId: string | null = null;

    try {
        const service = new MatchesService(
            serverAuthProvider
        );

        const loadedMatches = await getMatchesForView(
            service,
            searchState
        );

        matches = loadedMatches.matches;

        result = loadedMatches.result;

        editionId = loadedMatches.editionId;

        matchLabels = await resolveMatchLabels(matches);

        matches = filterMatchesByTeam(
            matches,
            matchLabels,
            normalizedTeamQuery
        );
    } catch (fetchError) {
        console.error(
            "Failed to fetch matches:",
            fetchError
        );

        error = getFriendlyMatchesError(fetchError);
    }

    function buildViewUrl(newView: string) {
        const urlParams = new URLSearchParams();

        if (year) urlParams.set("year", year);

        if (teamQuery) {
            urlParams.set("team", teamQuery);
        }

        if (newView === "calendar") {
            urlParams.set("view", "calendar");
        }

        if (urlPage > 1 && newView !== "calendar") {
            urlParams.set("page", String(urlPage));
        }

        const qs = urlParams.toString();

        return qs ? `/matches?${qs}` : "/matches";
    }

    return (
        <PageShell
            eyebrow="Competition schedule"
            title="Matches"
            description="Browse the scheduled matches with timing details and participating teams."
            heroAside={
                isAdmin(currentUser) ? (
                    <Link
                        href={`/matches/new${yearQuery}`}
                        className={buttonVariants({
                            variant: "default",
                            size: "sm",
                        })}
                    >
                        + Create
                    </Link>
                ) : undefined
            }
        >
            <div className="space-y-6">
                <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
                    <div className="space-y-3">
                        <div className="page-eyebrow">
                            Live listing
                        </div>

                        <h2 className="section-title">
                            Match schedule
                        </h2>
                    </div>

                    <div className="flex flex-wrap items-center gap-2">
                        <div className="flex bg-secondary p-1 rounded-md border border-border">
                            <Link
                                href={buildViewUrl("list")}
                                className={cn(
                                    "px-3 py-1.5 text-sm font-medium rounded-sm transition-colors",
                                    isCalendarView
                                        ? "text-muted-foreground hover:text-foreground"
                                        : "bg-background text-foreground shadow-sm"
                                )}
                            >
                                List
                            </Link>

                            <Link
                                href={buildViewUrl("calendar")}
                                className={cn(
                                    "px-3 py-1.5 text-sm font-medium rounded-sm transition-colors",
                                    isCalendarView
                                        ? "bg-background text-foreground shadow-sm"
                                        : "text-muted-foreground hover:text-foreground"
                                )}
                            >
                                Calendar
                            </Link>
                        </div>

                        {editionId && (
                            <Link
                                href={`/editions/${editionId}/competition-tables`}
                                className={buttonVariants({
                                    variant: "outline",
                                    size: "sm",
                                })}
                            >
                                Competition Tables
                            </Link>
                        )}
                    </div>
                </div>

                {error && (
                    <ErrorAlert message={error} />
                )}

                {!error && (
                    <MatchesTeamFilter
                        query={teamQuery}
                        year={year}
                        view={view}
                    />
                )}

                {!error && matches.length === 0 && (
                    <EmptyState
                        title={
                            hasTeamFilter
                                ? "No matches found for this team"
                                : "No matches available"
                        }
                        description={
                            hasTeamFilter
                                ? "Try another team name or clear the filter."
                                : "There are no scheduled matches yet."
                        }
                    />
                )}

                {!error && matches.length > 0 && (
                    <div className="space-y-4">
                        {isCalendarView ? (
                            <MatchesTimeline
                                matches={matches}
                                labels={matchLabels}
                                yearQuery={yearQuery}
                            />
                        ) : (
                            <MatchesTable
                                matches={matches}
                                labels={matchLabels}
                                yearQuery={yearQuery}
                            />
                        )}

                        {!year &&
                            !isCalendarView &&
                            !hasTeamFilter && (
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