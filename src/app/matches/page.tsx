import { EditionsService } from "@/api/editionApi";
import { CompetitionTableService } from "@/api/competitionTableApi";
import { MatchesService, type MatchSearchItemResponse } from "@/api/matchesApi";
import { fetchHalResource } from "@/api/halClient";
import { RoundsService } from "@/api/roundsApi";
import { UsersService } from "@/api/userApi";
import { buttonVariants } from "@/app/components/button";
import EmptyState from "@/app/components/empty-state";
import ErrorAlert from "@/app/components/error-alert";
import PageShell from "@/app/components/page-shell";
import PaginationControls from "@/app/components/pagination-controls";
import { serverAuthProvider } from "@/lib/authProvider";
import { isAdmin } from "@/lib/authz";
import { getEncodedResourceId } from "@/lib/halRoute";
import { filterMatchesByTeam, normalizeTeamSearch } from "@/lib/matchFilter";
import { formatMatchTime } from "@/lib/matchUtils";
import { cn } from "@/lib/utils";
import { parseErrorMessage } from "@/types/errors";
import { Match } from "@/types/match";
import type { HalPage } from "@/types/pagination";
import { Team } from "@/types/team";
import { User } from "@/types/user";
import type { CompetitionTable } from "@/types/competitionTable";
import type { Round } from "@/types/round";
import type { LucideIcon } from "lucide-react";
import {
    ArrowUpRight,
    CalendarDays,
    Clock3,
    RadioTower,
    TableProperties,
} from "lucide-react";
import Link from "next/link";
import { MatchesTimeline } from "./matches-timeline";
import MatchesFilterBar from "./matches-filter-bar";

export const dynamic = "force-dynamic";

const PAGE_SIZE = 5;

type PageSearchParams = Promise<Record<string, string | string[] | undefined>>;
type MatchCardTone = "completed" | "live" | "scheduled" | "unknown";
type SearchParamValue = string | string[] | undefined;
type MatchFilterChip = {
    readonly key: string;
    readonly label: string;
};

type MatchesSearchState = {
    year?: string;
    yearQuery: string;
    urlPage: number;
    view?: string;
    isCalendarView: boolean;
    teamQuery: string;
    normalizedTeamQuery: string;
    hasTeamFilter: boolean;
    startTime?: string;
    endTime?: string;
    tableId?: string;
    roundId?: string;
    hasScheduleFilters: boolean;
};

type MatchStats = {
    totalCount: number;
    liveCount: number;
    tableCount: number;
    roundCount: number;
};

const emptyMatchesPage: HalPage<Match> = {
    items: [],
    hasNext: false,
    hasPrev: false,
    currentPage: 0,
};

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

function getSearchValue(value: SearchParamValue) {
    return Array.isArray(value) ? value[0] ?? "" : value ?? "";
}

function getOptionalSearchValue(value: SearchParamValue) {
    const resolved = getSearchValue(value).trim();
    return resolved.length > 0 ? resolved : undefined;
}

function isResourceReference(value: string | null | undefined) {
    if (!value) return false;

    return value.startsWith("/") || value.startsWith("http");
}

function getDecodedResourceId(value: string | null | undefined) {
    if (!value) return null;

    if (!isResourceReference(value)) {
        const trimmedValue = value.trim();
        return trimmedValue.length > 0 ? trimmedValue : null;
    }

    const encodedResourceId = getEncodedResourceId(value);
    return encodedResourceId ? decodeURIComponent(encodedResourceId) : null;
}

function formatEnumLabel(value: string) {
    return value
        .toLowerCase()
        .split("_")
        .filter(Boolean)
        .map((segment) => segment.charAt(0).toUpperCase() + segment.slice(1))
        .join(" ");
}

function getMatchTone(state: string | null | undefined): MatchCardTone {
    const normalizedState = state?.trim().toUpperCase();

    if (normalizedState === "IN_PROGRESS") {
        return "live";
    }

    if (normalizedState === "COMPLETED" || normalizedState === "FINISHED") {
        return "completed";
    }

    if (normalizedState) {
        return "scheduled";
    }

    return "unknown";
}

function getMatchStateLabel(state: string | null | undefined) {
    const normalizedState = state?.trim().toUpperCase();

    if (normalizedState === "IN_PROGRESS") {
        return "Live now";
    }

    if (normalizedState === "COMPLETED" || normalizedState === "FINISHED") {
        return "Completed";
    }

    if (normalizedState) {
        return formatEnumLabel(normalizedState);
    }

    return "Awaiting status";
}

function isWhitespaceCharacter(character: string | undefined) {
    return character !== undefined && character.trim() === "";
}

function findVsDelimiter(label: string) {
    const normalizedLabel = label.toLowerCase();

    for (let index = 0; index < normalizedLabel.length - 1; index += 1) {
        if (normalizedLabel[index] !== "v" || normalizedLabel[index + 1] !== "s") {
            continue;
        }

        let start = index;
        while (start > 0 && isWhitespaceCharacter(label[start - 1])) {
            start -= 1;
        }

        if (start === index) {
            continue;
        }

        let end = index + 2;
        while (end < label.length && isWhitespaceCharacter(label[end])) {
            end += 1;
        }

        if (end === index + 2) {
            continue;
        }

        return { start, end };
    }

    return null;
}

function splitMatchLabel(label: string) {
    const delimiter = findVsDelimiter(label);

    if (!delimiter) {
        return { teamA: label, teamB: "Team B" };
    }

    const teamA = label.slice(0, delimiter.start);
    const teamB = label.slice(delimiter.end).trim() || "Team B";

    return { teamA, teamB };
}

function getParticipantLabel(value: string | null | undefined, fallback: string) {
    const trimmedValue = value?.trim();

    if (trimmedValue && !isResourceReference(trimmedValue)) {
        return trimmedValue;
    }

    return fallback;
}

function getMatchParticipants(match: Match, labels: Record<string, string>) {
    const { teamA: fallbackTeamA, teamB: fallbackTeamB } = splitMatchLabel(
        getTeamsLabel(match, labels),
    );

    return {
        teamA: getParticipantLabel(match.teamA, fallbackTeamA),
        teamB: getParticipantLabel(match.teamB, fallbackTeamB),
    };
}

function getMatchRoundLabel(match: Match) {
    const inlineRound = match.round?.trim();
    if (inlineRound && !isResourceReference(inlineRound)) {
        return inlineRound;
    }

    const roundValue = match.link("round")?.href ?? match.round;
    const roundId = getDecodedResourceId(roundValue);
    return roundId ? `Round ${roundId}` : "Round pending";
}

function getCompetitionTableLabel(match: Match) {
    const inlineTable = match.competitionTable?.trim();
    if (inlineTable && !isResourceReference(inlineTable)) {
        return inlineTable;
    }

    const tableValue = match.link("competitionTable")?.href ?? match.competitionTable;
    const tableId = getDecodedResourceId(tableValue);
    return tableId ? `Table ${tableId}` : "Pending assignment";
}

function getMatchHref(match: Match, yearQuery: string) {
    const matchId = getEncodedResourceId(match.link("self")?.href ?? match.uri);
    return matchId ? `/matches/${matchId}${yearQuery}` : null;
}

function getMatchStats(matches: Match[]): MatchStats {
    const tableIds = new Set<string>();
    const roundIds = new Set<string>();

    matches.forEach((match) => {
        const tableValue = match.link("competitionTable")?.href ?? match.competitionTable;
        const roundValue = match.link("round")?.href ?? match.round;
        const tableId = getDecodedResourceId(tableValue);
        const roundId = getDecodedResourceId(roundValue);

        if (tableId) {
            tableIds.add(tableId);
        }

        if (roundId) {
            roundIds.add(roundId);
        }
    });

    return {
        totalCount: matches.length,
        liveCount: matches.filter((match) => getMatchTone(match.state) === "live").length,
        tableCount: tableIds.size,
        roundCount: roundIds.size,
    };
}

function StatCard({
    icon: Icon,
    label,
    value,
    description,
}: Readonly<{
    icon: LucideIcon;
    label: string;
    value: string;
    description: string;
}>) {
    return (
        <div className="matches-page-stat-card">
            <div className="matches-page-stat-card__inner">
                <div className="matches-page-stat-card__header">
                    <div className="matches-page-stat-card__copy">
                        <div className="matches-page-stat-card__label">{label}</div>
                        <div className="matches-page-stat-card__value">{value}</div>
                    </div>
                    <div className="matches-page-stat-card__icon">
                        <Icon aria-hidden="true" />
                    </div>
                </div>
                <p className="matches-page-stat-card__description">{description}</p>
            </div>
        </div>
    );
}

function MatchCard({
    match,
    index,
    labels,
    yearQuery,
}: Readonly<{
    match: Match;
    index: number;
    labels: Record<string, string>;
    yearQuery: string;
}>) {
    const tone = getMatchTone(match.state);
    const stateLabel = getMatchStateLabel(match.state);
    const teamsLabel = getTeamsLabel(match, labels);
    const { teamA, teamB } = getMatchParticipants(match, labels);
    const matchHref = getMatchHref(match, yearQuery);
    const cardContent = (
        <article className="matches-page-match-card" data-state={tone}>
            <div className="matches-page-match-card__body">
                <div className="matches-page-match-card__masthead">
                    <div className="matches-page-match-card__serial">
                        Match {String(index + 1).padStart(2, "0")}
                    </div>
                    <div className="matches-page-match-card__badge">
                        {tone === "live" ? (
                            <span
                                className="matches-page-match-card__badge-dot"
                                aria-hidden="true"
                            />
                        ) : null}
                        {stateLabel}
                    </div>
                </div>

                <div className="matches-page-match-card__header">
                    <div className="matches-page-match-card__kicker">Matchup</div>
                    <h3 className="matches-page-match-card__title">{teamsLabel}</h3>
                </div>

                <div className="matches-page-match-card__facts">
                    <div className="matches-page-match-card__fact">
                        <div className="matches-page-match-card__fact-label">Start</div>
                        <div className="matches-page-match-card__fact-value">
                            {formatMatchTime(match.startTime)}
                        </div>
                    </div>

                    <div className="matches-page-match-card__fact">
                        <div className="matches-page-match-card__fact-label">End</div>
                        <div className="matches-page-match-card__fact-value">
                            {formatMatchTime(match.endTime)}
                        </div>
                    </div>

                    <div className="matches-page-match-card__fact">
                        <div className="matches-page-match-card__fact-label">Round</div>
                        <div className="matches-page-match-card__fact-value">
                            {getMatchRoundLabel(match)}
                        </div>
                    </div>
                </div>

                <div className="matches-page-match-card__teams">
                    <div className="matches-page-match-card__teams-label">Teams</div>
                    <div className="matches-page-match-card__teams-grid">
                        <div className="matches-page-match-card__team">
                            <div className="matches-page-match-card__team-label">Team A</div>
                            <p className="matches-page-match-card__team-value">{teamA}</p>
                        </div>
                        <div className="matches-page-match-card__team">
                            <div className="matches-page-match-card__team-label">Team B</div>
                            <p className="matches-page-match-card__team-value">{teamB}</p>
                        </div>
                    </div>
                </div>

                <div className="matches-page-match-card__table">
                    <div className="matches-page-match-card__table-label">
                        Competition table
                    </div>
                    <p className="matches-page-match-card__table-value">
                        {getCompetitionTableLabel(match)}
                    </p>
                </div>

                <div className="matches-page-match-card__footer">
                    <div
                        className={cn(
                            "matches-page-match-card__action",
                            matchHref
                                ? "matches-page-match-card__action--interactive"
                                : "matches-page-match-card__action--disabled",
                        )}
                    >
                        {matchHref ? "Open match" : "Details unavailable"}
                        {matchHref ? <ArrowUpRight aria-hidden="true" /> : null}
                    </div>
                </div>
            </div>
        </article>
    );

    return matchHref ? (
        <Link href={matchHref} className="matches-page-link">
            {cardContent}
        </Link>
    ) : (
        <div className="matches-page-link">{cardContent}</div>
    );
}

function getFriendlyMatchesError(error: unknown) {
    const parsedMessage = parseErrorMessage(error);

    if (parsedMessage === "An unexpected error occurred. Please try again.") {
        return "We could not load the matches right now. Please try again in a few minutes.";
    }

    return `We could not load the matches. ${parsedMessage}`;
}

function getMatchFilterChips({
    year,
    teamQuery,
    startTime,
    endTime,
    tableId,
    roundId,
    isCalendarView,
    hasScheduleFilters,
}: MatchesSearchState): MatchFilterChip[] {
    const chips: MatchFilterChip[] = [];

    if (year) {
        chips.push({ key: "year", label: `Edition ${year}` });
    }

    if (teamQuery) {
        chips.push({ key: "team", label: `Team: ${teamQuery}` });
    }

    if (startTime) {
        chips.push({ key: "startTime", label: `Start: ${startTime.replace("T", " ")}` });
    }

    if (endTime) {
        chips.push({ key: "endTime", label: `End: ${endTime.replace("T", " ")}` });
    }

    if (tableId) {
        chips.push({ key: "tableId", label: `Table: ${tableId}` });
    }

    if (roundId) {
        chips.push({ key: "roundId", label: `Round: ${roundId}` });
    }

    if (hasScheduleFilters || isCalendarView) {
        chips.push({
            key: "view",
            label: isCalendarView ? "Calendar view" : "List view",
        });
    }

    return chips;
}

function getMatchesControlsNote({
    isCalendarView,
    hasScheduleFilters,
    hasTeamFilter,
    urlPage,
}: Pick<MatchesSearchState, "isCalendarView" | "hasScheduleFilters" | "hasTeamFilter" | "urlPage">) {
    if (isCalendarView) {
        return "Calendar view groups matches by competition table.";
    }

    if (hasScheduleFilters) {
        return "Use the filters below to narrow matches by time, table, or round.";
    }

    if (hasTeamFilter) {
        return "Team filtering searches the full match directory and narrows the current slate.";
    }

    return `Showing page ${urlPage} of the published schedule.`;
}

function getEmptyStateTitle({
    hasScheduleFilters,
    hasTeamFilter,
}: Pick<MatchesSearchState, "hasScheduleFilters" | "hasTeamFilter">) {
    if (hasScheduleFilters) {
        return "No matches found for these filters";
    }

    if (hasTeamFilter) {
        return "No matches found for this team";
    }

    return "No matches available";
}

function getEmptyStateDescription({
    hasScheduleFilters,
    hasTeamFilter,
}: Pick<MatchesSearchState, "hasScheduleFilters" | "hasTeamFilter">) {
    if (hasScheduleFilters) {
        return "Try adjusting the time, table, or round filters, or clear them to see more matches.";
    }

    if (hasTeamFilter) {
        return "Try another team name or clear the filter.";
    }

    return "There are no scheduled matches yet.";
}

function getMatchesSearchState(params: Record<string, string | string[] | undefined>): MatchesSearchState {
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
    const startTime = getOptionalSearchValue(params.startTime);
    const endTime = getOptionalSearchValue(params.endTime);
    const tableId = getOptionalSearchValue(params.tableId);
    const roundId = getOptionalSearchValue(params.roundId);
    const hasScheduleFilters = Boolean(startTime || endTime || tableId || roundId);

    return {
        year,
        yearQuery,
        urlPage,
        view,
        isCalendarView,
        teamQuery,
        normalizedTeamQuery,
        hasTeamFilter,
        startTime,
        endTime,
        tableId,
        roundId,
        hasScheduleFilters,
    };
}

async function getCurrentUser() {
    try {
        return await new UsersService(serverAuthProvider).getCurrentUser();
    } catch (fetchError) {
        console.error("Failed to fetch current user:", fetchError);
        return null;
    }
}

async function getMatchesForView(
    service: MatchesService,
    { year, hasTeamFilter, hasScheduleFilters, urlPage, startTime, endTime, tableId, roundId }:
        Pick<MatchesSearchState, "year" | "hasTeamFilter" | "hasScheduleFilters" | "urlPage" | "startTime" | "endTime" | "tableId" | "roundId">,
) {
    let editionId: string | null = null;
    let result: HalPage<Match> = emptyMatchesPage;

    if (hasScheduleFilters) {
        const page = urlPage - 1;
        const response = await service.getMatchesFiltered({
            startTime,
            endTime,
            tableId,
            roundId,
            page,
            size: PAGE_SIZE,
        });
        const matches = await Promise.all(
            response.items.map(async (item: MatchSearchItemResponse) => {
                try {
                    return await service.getMatchById(item.matchId);
                } catch (error) {
                    console.error(`Failed to fetch filtered match ${item.matchId}:`, error);
                    return null;
                }
            })
        );
        const filteredMatches = matches.filter((match): match is Match => match !== null);

        return {
            matches: filteredMatches,
            result: {
                items: filteredMatches,
                currentPage: response.page,
                hasPrev: response.page > 0,
                hasNext: (response.page + 1) * response.size < response.totalElements,
            },
            editionId,
        };
    }

    if (year) {
        const editionsService = new EditionsService(serverAuthProvider);
        const edition = await editionsService.getEditionByYear(year);
        editionId = getEncodedResourceId(edition?.uri ?? edition?.link("self")?.href);
        const response = edition?.uri ? await service.getMatchesByEdition(`${edition.uri}/matches`) : [];

        return { matches: sortMatches(response), result, editionId };
    }

    if (hasTeamFilter) {
        const matches = await service.getMatches();
        return { matches, result, editionId };
    }

    result = await service.getMatchesPaged(urlPage - 1, PAGE_SIZE);
    return { matches: result.items, result, editionId };
}

function sortMatches(matches: Match[]) {
    return [...matches].sort((left, right) => {
        const startDiff = compareMatchTimes(left.startTime, right.startTime);
        if (startDiff !== 0) return startDiff;
        const endDiff = compareMatchTimes(left.endTime, right.endTime);
        if (endDiff !== 0) return endDiff;
        return String(left.id ?? "").localeCompare(String(right.id ?? ""));
    });
}

function getLinkedTeamReference(match: Match, rel: "teamA" | "teamB") {
    const href = match.link(rel)?.href;
    if (href) return href;

    const inlineValue = rel === "teamA" ? match.teamA : match.teamB;
    return isResourceReference(inlineValue) ? inlineValue : null;
}

function getTeamDisplayName(team: Team | null, fallback: string | undefined, genericName: string) {
    return team?.name ?? team?.id ?? fallback ?? genericName;
}

async function resolveMatchLabels(matches: Match[]) {
    const teamCache = new Map<string, Promise<Team | null>>();

    const getTeam = (reference: string) => {
        if (!teamCache.has(reference)) {
            teamCache.set(
                reference,
                fetchHalResource<Team>(reference, serverAuthProvider).catch((error) => {
                    console.error(`Failed to fetch team resource ${reference}:`, error);
                    return null;
                }),
            );
        }

        return teamCache.get(reference)!;
    };

    const resolvedLabels = await Promise.all(
        matches.map(async (match) => {
            const selfLink = match.link("self")?.href ?? match.uri;
            const teamAReference = getLinkedTeamReference(match, "teamA");
            const teamBReference = getLinkedTeamReference(match, "teamB");
            const fallbackTeamA = getParticipantLabel(match.teamA, "Team A");
            const fallbackTeamB = getParticipantLabel(match.teamB, "Team B");
            const [teamA, teamB] = await Promise.all([
                teamAReference ? getTeam(teamAReference) : null,
                teamBReference ? getTeam(teamBReference) : null,
            ]);

            return {
                key: selfLink,
                label: `${getTeamDisplayName(teamA, fallbackTeamA, "Team A")} vs ${getTeamDisplayName(teamB, fallbackTeamB, "Team B")}`,
            };
        }),
    );

    return resolvedLabels.reduce((acc, { key, label }) => {
        acc[key] = label;
        return acc;
    }, {} as Record<string, string>);
}

export default async function MatchesPage({ searchParams }: Readonly<{ searchParams: PageSearchParams }>) {
    const searchState = getMatchesSearchState(await searchParams);
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
    let result: HalPage<Match> = emptyMatchesPage;
    let error: string | null = null;
    let editionId: string | null = null;
    let competitionTables: CompetitionTable[] = [];
    let rounds: Round[] = [];

    const currentUser: User | null = await getCurrentUser();

    try {
        const service = new MatchesService(serverAuthProvider);
        const loadedMatches = await getMatchesForView(service, searchState);
        matches = loadedMatches.matches;
        result = loadedMatches.result;
        editionId = loadedMatches.editionId;
        matchLabels = await resolveMatchLabels(matches);
        matches = filterMatchesByTeam(matches, matchLabels, normalizedTeamQuery);
    } catch (fetchError) {
        console.error("Failed to fetch matches:", fetchError);
        error = getFriendlyMatchesError(fetchError);
    }

    try {
        const tableService = new CompetitionTableService(serverAuthProvider);
        const roundsService = new RoundsService(serverAuthProvider);
        const [tablesResult, roundsResult] = await Promise.allSettled([
            tableService.getTables(),
            roundsService.getRounds(),
        ]);

        if (tablesResult.status === "fulfilled") {
            competitionTables = tablesResult.value;
        }

        if (roundsResult.status === "fulfilled") {
            rounds = roundsResult.value;
        }
    } catch (fetchError) {
        console.error("Failed to load filter options:", fetchError);
    }

    function buildViewUrl(newView: string) {
        const urlParams = new URLSearchParams();
        if (year) urlParams.set("year", year);
        if (teamQuery) urlParams.set("team", teamQuery);
        if (searchState.startTime) urlParams.set("startTime", searchState.startTime);
        if (searchState.endTime) urlParams.set("endTime", searchState.endTime);
        if (searchState.tableId) urlParams.set("tableId", searchState.tableId);
        if (searchState.roundId) urlParams.set("roundId", searchState.roundId);
        if (newView === "calendar") urlParams.set("view", "calendar");
        if (urlPage > 1 && newView !== "calendar") urlParams.set("page", String(urlPage));
        const qs = urlParams.toString();
        return qs ? `/matches?${qs}` : "/matches";
    }

    const { totalCount, liveCount, tableCount, roundCount } = getMatchStats(matches);
    const hasHeroActions = isAdmin(currentUser) || Boolean(editionId);
    const filterChips = getMatchFilterChips(searchState);

    return (
        <PageShell
            eyebrow="Competition schedule"
            title="Matches"
            description="Browse the scheduled matches with timing details and participating teams."
            bannerClassName="matches-page-banner"
            panelClassName="matches-page-panel"
            heroAside={hasHeroActions ? (
                <div className="matches-page-action-stack">
                    {editionId ? (
                        <Link
                            href={`/editions/${editionId}/competition-tables`}
                            className={cn(
                                buttonVariants({ variant: "outline", size: "sm" }),
                                "matches-page-secondary-button",
                            )}
                        >
                            <span className="matches-page-secondary-button__label">
                                Competition tables
                            </span>
                            <ArrowUpRight aria-hidden="true" />
                        </Link>
                    ) : null}
                    {isAdmin(currentUser) ? (
                        <Link
                            href={`/matches/new${yearQuery}`}
                            className={cn(
                                buttonVariants({ variant: "default", size: "sm" }),
                                "matches-page-create-button",
                            )}
                        >
                            <span className="matches-page-create-button__label">
                                New match
                            </span>
                            <ArrowUpRight aria-hidden="true" />
                        </Link>
                    ) : null}
                </div>
            ) : undefined}
        >
            <div className="matches-page-content">
                <section className="matches-page-search-shell">
                    <div className="matches-page-search-copy">
                        <div className="page-eyebrow">Live Listing</div>
                        <h2 className="section-title">Match schedule</h2>

                        {filterChips.length > 0 ? (
                            <div className="matches-page-filter-chips">
                                {filterChips.map((chip) => (
                                    <span key={chip.key} className="matches-page-filter-chip">
                                        {chip.label}
                                    </span>
                                ))}
                            </div>
                        ) : null}
                    </div>

                    <div className="matches-page-controls">
                        <div className="matches-page-utility-panel">
                            <div className="matches-page-view-toggle" aria-label="View options">
                                <Link
                                    href={buildViewUrl("list")}
                                    className="matches-page-view-link"
                                    data-active={!isCalendarView}
                                    aria-current={!isCalendarView ? "page" : undefined}
                                >
                                    List
                                </Link>
                                <Link
                                    href={buildViewUrl("calendar")}
                                    className="matches-page-view-link"
                                    data-active={isCalendarView}
                                    aria-current={isCalendarView ? "page" : undefined}
                                >
                                    Calendar
                                </Link>
                            </div>

                            <p className="matches-page-controls-note">
                                {getMatchesControlsNote(searchState)}
                            </p>
                        </div>
                    </div>
                </section>

                {!error ? (
                    <MatchesFilterBar
                        year={year}
                        view={view}
                        teamQuery={teamQuery}
                        startTime={searchState.startTime}
                        endTime={searchState.endTime}
                        tableId={searchState.tableId}
                        roundId={searchState.roundId}
                        competitionTables={competitionTables}
                        rounds={rounds}
                    />
                ) : null}

                {error ? <ErrorAlert message={error} /> : null}

                {!error ? (
                    <div className="matches-page-stats-grid">
                        <StatCard
                            icon={Clock3}
                            label="Matches in view"
                            value={String(totalCount)}
                            description={searchState.hasScheduleFilters || hasTeamFilter || year
                                ? "This count reflects the active filters and seasonal context."
                                : "A live page from the rolling match schedule."
                            }
                        />

                        <StatCard
                            icon={RadioTower}
                            label="Live matches"
                            value={String(liveCount)}
                            description={
                                liveCount > 0
                                    ? `${liveCount} match${liveCount === 1 ? "" : "es"} currently marked in progress.`
                                    : "No match is currently marked as live."
                            }
                        />

                        <StatCard
                            icon={TableProperties}
                            label="Competition tables"
                            value={String(tableCount)}
                            description={
                                tableCount > 0
                                    ? `Assignments are spread across ${roundCount} round${roundCount === 1 ? "" : "s"} in the current view.`
                                    : "Competition table assignments are not available for these matches yet."
                            }
                        />
                    </div>
                ) : null}

                {!error && matches.length === 0 ? (
                    <EmptyState
                        className="matches-page-empty-state"
                        title={getEmptyStateTitle(searchState)}
                        description={getEmptyStateDescription(searchState)}
                    />
                ) : null}

                {!error && matches.length > 0 ? (
                    <>
                        {isCalendarView ? (
                            <div className="matches-page-calendar-shell">
                                <div className="matches-page-calendar-header">
                                    <div className="matches-page-calendar-icon">
                                        <CalendarDays aria-hidden="true" />
                                    </div>
                                    <p className="matches-page-calendar-copy">
                                        Competition tables run left to right while the hour rail keeps the day visible at a glance.
                                    </p>
                                </div>
                                <MatchesTimeline
                                    matches={matches}
                                    labels={matchLabels}
                                    yearQuery={yearQuery}
                                />
                            </div>
                        ) : (
                            <ul className="matches-page-grid">
                                {matches.map((match, index) => {
                                    const pageOffset =
                                        !year && !hasTeamFilter ? (urlPage - 1) * PAGE_SIZE : 0;

                                    return (
                                        <li
                                            key={getMatchKey(match, index)}
                                            className="matches-page-item"
                                        >
                                            <MatchCard
                                                match={match}
                                                index={pageOffset + index}
                                                labels={matchLabels}
                                                yearQuery={yearQuery}
                                            />
                                        </li>
                                    );
                                })}
                            </ul>
                        )}

                        {!isCalendarView && (searchState.hasScheduleFilters || (!year && !hasTeamFilter)) ? (
                            <div className="matches-page-pagination">
                                <PaginationControls
                                    currentPage={urlPage}
                                    hasNext={result.hasNext}
                                    hasPrev={result.hasPrev}
                                    basePath="/matches"
                                    variant="editorial"
                                    contextLabel="Move through the published match schedule page by page."
                                    queryParams={{
                                        year,
                                        team: teamQuery || undefined,
                                        startTime: searchState.startTime,
                                        endTime: searchState.endTime,
                                        tableId: searchState.tableId,
                                        roundId: searchState.roundId,
                                        view: isCalendarView ? "calendar" : undefined,
                                    }}
                                />
                            </div>
                        ) : null}
                    </>
                ) : null}
            </div>
        </PageShell>
    );
}
