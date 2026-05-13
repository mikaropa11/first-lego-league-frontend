import { MatchesService } from "@/api/matchesApi";
import { TeamsService } from "@/api/teamApi";
import { UsersService } from "@/api/userApi";
import ErrorAlert from "@/app/components/error-alert";
import PageShell from "@/app/components/page-shell";
import { Breadcrumb } from "@/app/components/breadcrumb";
import { serverAuthProvider } from "@/lib/authProvider";
import { isAdmin } from "@/lib/authz";
import { getTeamDisplayName } from "@/lib/teamUtils";
import { CompetitionTable } from "@/types/competitionTable";
import { AuthenticationError, NotFoundError, parseErrorMessage } from "@/types/errors";
import { Match } from "@/types/match";
import { Referee } from "@/types/referee";
import { Round } from "@/types/round";
import { Team } from "@/types/team";
import { redirect } from "next/navigation";
import EditMatchForm from "./form";

type Option = {
    label: string;
    value: string;
};

type MatchEditPageProps = {
    readonly params: Promise<{ id: string }>;
};

type MatchEditData = {
    match: Match;
    roundOptions: Option[];
    competitionTableOptions: Option[];
    refereeOptions: Option[];
    teamOptions: Option[];
    selectedRound: Option | null;
    selectedCompetitionTable: Option | null;
    selectedReferee: Option | null;
    selectedTeamA: Option | null;
    selectedTeamB: Option | null;
};

export const dynamic = "force-dynamic";

function getUriLabel(resourceUri?: string, fallbackPrefix: string = "Item") {
    const uri = resourceUri ?? "";
    let decodedId = uri.split("/").findLast(Boolean) ?? "";

    try {
        decodedId = decodeURIComponent(decodedId);
    } catch {
    }

    return decodedId ? `${fallbackPrefix} ${decodedId}` : fallbackPrefix;
}

function getResourceUri(resource?: { uri?: string; link: (rel: string) => { href?: string } | null }) {
    return resource?.link("self")?.href ?? resource?.uri ?? "";
}

function getRoundOption(round: Round): Option | null {
    const resourceUri = getResourceUri(round);
    if (!resourceUri) {
        return null;
    }

    const label =
        round.number === undefined ? getUriLabel(resourceUri, "Round") : `Round ${round.number}`;
    return { label, value: resourceUri };
}

function getCompetitionTableOption(table: CompetitionTable): Option | null {
    const resourceUri = getResourceUri(table);
    if (!resourceUri) {
        return null;
    }

    return {
        label: getUriLabel(resourceUri, "Table"),
        value: resourceUri,
    };
}

function getRefereeOption(referee: Referee): Option | null {
    const resourceUri = getResourceUri(referee);
    if (!resourceUri) {
        return null;
    }

    return {
        label: referee.name ?? referee.emailAddress ?? getUriLabel(resourceUri, "Referee"),
        value: resourceUri,
    };
}

function getTeamOption(team: Team): Option | null {
    const resourceUri = getResourceUri(team);
    if (!resourceUri) {
        return null;
    }

    return {
        label: getTeamDisplayName(team),
        value: resourceUri,
    };
}

function compactOptions(options: Array<Option | null>) {
    return options.filter((option): option is Option => option !== null);
}

function sortOptions(options: Option[]) {
    return options.toSorted((left, right) => left.label.localeCompare(right.label));
}

function ensureSelectedOption(options: Option[], selected: Option | null) {
    if (!selected || options.some((option) => option.value === selected.value)) {
        return options;
    }

    return sortOptions([...options, selected]);
}

function toTimeInputValue(value?: string) {
    if (!value) {
        return "";
    }

    const dateTimeMatch =
        /^(\d{4})-(\d{2})-(\d{2})[T\s](\d{2}):(\d{2})(?::\d{2}(?:\.\d+)?)?$/.exec(value);
    if (dateTimeMatch) {
        return `${dateTimeMatch[1]}-${dateTimeMatch[2]}-${dateTimeMatch[3]}T${dateTimeMatch[4]}:${dateTimeMatch[5]}`;
    }

    const date = new Date(value);
    if (Number.isNaN(date.getTime())) {
        return "";
    }

    const pad = (num: number) => String(num).padStart(2, "0");
    return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
}

function getMatchTitle(match: Match | null, id: string) {
    if (!match) {
        return `Match ${id}`;
    }

    return match.id ? `Match ${match.id}` : `Match ${id}`;
}

async function getAdminAuthorizationError() {
    const auth = await serverAuthProvider.getAuth();
    if (!auth) redirect("/login");

    try {
        const currentUser = await new UsersService(serverAuthProvider).getCurrentUser();
        if (!currentUser) {
            redirect("/login");
        }

        if (!isAdmin(currentUser)) {
            redirect("/");
        }
    } catch (e) {
        if (e instanceof AuthenticationError) {
            redirect("/login");
        }

        return parseErrorMessage(e);
    }

    return null;
}

async function getOptionalRelation<T>(promise: Promise<T>) {
    try {
        return await promise;
    } catch (error) {
        if (error instanceof NotFoundError) {
            return null;
        }

        throw error;
    }
}

async function fetchMatchEditData(id: string): Promise<MatchEditData> {
    const matchesService = new MatchesService(serverAuthProvider);
    const teamsService = new TeamsService(serverAuthProvider);

    const [
        match,
        rounds,
        competitionTables,
        referees,
        teams,
        matchRound,
        matchCompetitionTable,
        matchReferee,
        matchTeamA,
        matchTeamB,
    ] = await Promise.all([
        matchesService.getMatchById(id),
        matchesService.getRounds(),
        matchesService.getCompetitionTables(),
        matchesService.getReferees(),
        teamsService.getTeams(),
        getOptionalRelation(matchesService.getMatchRound(id)),
        getOptionalRelation(matchesService.getMatchCompetitionTable(id)),
        getOptionalRelation(matchesService.getMatchReferee(id)),
        getOptionalRelation(matchesService.getMatchTeamA(id)),
        getOptionalRelation(matchesService.getMatchTeamB(id)),
    ]);

    const selectedRound = matchRound ? getRoundOption(matchRound) : null;
    const selectedCompetitionTable = matchCompetitionTable
        ? getCompetitionTableOption(matchCompetitionTable)
        : null;
    const selectedReferee = matchReferee ? getRefereeOption(matchReferee) : null;
    const selectedTeamA = matchTeamA ? getTeamOption(matchTeamA) : null;
    const selectedTeamB = matchTeamB ? getTeamOption(matchTeamB) : null;
    const teamOptions = sortOptions(compactOptions(teams.map(getTeamOption)));

    return {
        match,
        roundOptions: ensureSelectedOption(
            sortOptions(compactOptions(rounds.map(getRoundOption))),
            selectedRound,
        ),
        competitionTableOptions: ensureSelectedOption(
            sortOptions(compactOptions(competitionTables.map(getCompetitionTableOption))),
            selectedCompetitionTable,
        ),
        refereeOptions: ensureSelectedOption(
            sortOptions(compactOptions(referees.map(getRefereeOption))),
            selectedReferee,
        ),
        teamOptions: ensureSelectedOption(ensureSelectedOption(teamOptions, selectedTeamA), selectedTeamB),
        selectedRound,
        selectedCompetitionTable,
        selectedReferee,
        selectedTeamA,
        selectedTeamB,
    };
}

function getInitialValues(data: MatchEditData) {
    return {
        startTime: toTimeInputValue(data.match.startTime),
        endTime: toTimeInputValue(data.match.endTime),
        round: data.selectedRound?.value ?? "",
        competitionTable: data.selectedCompetitionTable?.value ?? "",
        teamA: data.selectedTeamA?.value ?? "",
        teamB: data.selectedTeamB?.value ?? "",
        referee: data.selectedReferee?.value ?? "",
    };
}

function getMatchEditError(error: unknown) {
    return error instanceof NotFoundError
        ? "This match does not exist."
        : parseErrorMessage(error);
}

export default async function EditMatchPage({ params }: Readonly<MatchEditPageProps>) {
    const { id } = await params;
    const authorizationError = await getAdminAuthorizationError();
    let data: MatchEditData | null = null;
    let error = authorizationError;

    if (!error) {
        try {
            data = await fetchMatchEditData(id);
        } catch (e) {
            error = getMatchEditError(e);
        }
    }

    return (
        <PageShell
            eyebrow="Competition schedule"
            title={`Edit ${getMatchTitle(data?.match ?? null, id)}`}
            description="Update the scheduled time, round, table, teams, and referee for this match."
        >
            <Breadcrumb
                items={[
                    { label: "Home", href: "/" },
                    { label: "Matches", href: "/matches" },
                    { label: getMatchTitle(data?.match ?? null, id), href: `/matches/${id}` },
                    { label: "Edit" },
                ]}
            />

            {error || !data ? (
                <ErrorAlert message={error ?? "This match could not be loaded."} />
            ) : (
                <EditMatchForm
                    matchId={id}
                    initialValues={getInitialValues(data)}
                    roundOptions={data.roundOptions}
                    competitionTableOptions={data.competitionTableOptions}
                    refereeOptions={data.refereeOptions}
                    teamOptions={data.teamOptions}
                />
            )}
        </PageShell>
    );
}
