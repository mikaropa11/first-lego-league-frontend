import { AwardsService } from "@/api/awardApi";
import { EditionsService } from "@/api/editionApi";
import { MatchesService } from "@/api/matchesApi";
import { ScientificProjectsService } from "@/api/scientificProjectApi";
import { TeamsService } from "@/api/teamApi";
import { UsersService } from "@/api/userApi";
import EmptyState from "@/app/components/empty-state";
import ErrorAlert from "@/app/components/error-alert";
import { ScientificProjectCardLink } from "@/app/components/scientific-project-card";
import { TeamMembersManager } from "@/app/components/team-member-manager";
import TeamEditSection from "@/app/components/team-edit-section";
import { serverAuthProvider } from "@/lib/authProvider";
import { NotFoundError, parseErrorMessage } from "@/types/errors";
import { Award } from "@/types/award";
import { Match } from "@/types/match";
import { ScientificProject } from "@/types/scientificProject";
import { Team, TeamCoach, TeamMember, TeamMemberSnapshot } from "@/types/team";
import { User } from "@/types/user";
import TeamAwardsSection from "./_team-awards-section";
import TeamShareButton from "./team-share-button";
import TournamentItinerary, { ScheduleItem } from "./tournament-itinerary";

interface TeamDetailPageProps {
    readonly params: Promise<{ id: string }>;
}

function toTeamMemberSnapshot(member: TeamMember): TeamMemberSnapshot {
    return {
        id: member.id,
        name: member.name,
        birthDate: member.birthDate,
        gender: member.gender,
        tShirtSize: member.tShirtSize,
        role: member.role,
        uri: member.uri ?? member.link("self")?.href,
    };
}

function getTeamDisplayName(team: Team | null): string | null {
    if (!team) {
        return null;
    }

    return team.name ?? team.id ?? null;
}

function getTeamUri(team: Team): string | null {
    return team.link("self")?.href ?? team.uri ?? null;
}

function getTeamEditionUri(team: Team): string | null {
    const editionHref = team.link("edition")?.href;
    if (editionHref) {
        return editionHref;
    }

    const edition = Reflect.get(team, "edition");
    return typeof edition === "string" && edition.length > 0 ? edition : null;
}

async function fetchMatchLink<T>(match: Match, rel: string, fetcher: () => Promise<T>): Promise<T | null> {
    if (!match.link(rel)) {
        return null;
    }

    return fetcher().catch(() => null);
}

function getOpponentName(teamA: Team | null, teamB: Team | null, targetId: string): string | undefined {
    const idA = teamA?.id ? String(teamA.id) : undefined;
    const idB = teamB?.id ? String(teamB.id) : undefined;

    if (idA === targetId) {
        return teamB?.name ?? teamB?.id ?? "Unknown Team";
    }

    if (idB === targetId) {
        return teamA?.name ?? teamA?.id ?? "Unknown Team";
    }

    return undefined;
}

async function resolveMatchForTeam(match: Match, targetId: string, matchesService: MatchesService) {
    const matchId = match.uri ? match.uri.split("/").pop() : String(match.id);

    if (!matchId) {
        return { match, hasTeam: false, table: "Unknown" };
    }

    try {
        const [teamA, teamB, competitionTable, round] = await Promise.all([
            fetchMatchLink(match, "teamA", () => matchesService.getMatchTeamA(matchId)),
            fetchMatchLink(match, "teamB", () => matchesService.getMatchTeamB(matchId)),
            fetchMatchLink(match, "competitionTable", () => matchesService.getMatchCompetitionTable(matchId)),
            fetchMatchLink(match, "round", () => matchesService.getMatchRound(matchId)),
        ]);

        const opponent = getOpponentName(teamA, teamB, targetId);
        const table = competitionTable?.uri ? competitionTable.uri.split("/").pop() ?? "Unknown" : "Unknown";
        const roundLabel = round?.number != null ? `Round ${round.number}` : undefined;

        return {
            match,
            hasTeam: opponent !== undefined,
            table,
            opponent,
            round: roundLabel,
        };
    } catch {
        return { match, hasTeam: false, table: "Unknown" };
    }
}

export default async function TeamDetailPage(props: Readonly<TeamDetailPageProps>) {
    const { id } = await props.params;

    const teamsService = new TeamsService(serverAuthProvider);
    const scientificProjectsService = new ScientificProjectsService(serverAuthProvider);
    const userService = new UsersService(serverAuthProvider);
    const awardsService = new AwardsService(serverAuthProvider);
    const editionsService = new EditionsService(serverAuthProvider);
    const matchesService = new MatchesService(serverAuthProvider);

    let currentUser: User | null = null;
    let team: Team | null = null;
    let coaches: TeamCoach[] = [];
    let members: TeamMember[] = [];
    let scientificProjects: ScientificProject[] = [];
    let awards: Award[] = [];
    let editionYearStr: string | undefined;
    let teamEditionUri: string | null = null;
    let teamMatchesData: Array<{ match: Match; table: string; opponent?: string; round?: string }> = [];

    let error: string | null = null;
    let membersError: string | null = null;
    let scientificProjectsError: string | null = null;
    let awardsError: string | null = null;
    let matchesError: string | null = null;

    try {
        currentUser = await userService.getCurrentUser().catch(() => null);
        team = await teamsService.getTeamById(id);
    } catch (e) {
        if (e instanceof NotFoundError) {
            return <EmptyState title="Not found" description="Team does not exist" />;
        }

        error = parseErrorMessage(e);
    }

    const isAdminUser = !!currentUser?.authorities?.some(
        (authority) => authority.authority === "ROLE_ADMIN"
    );

    const teamDisplayName = getTeamDisplayName(team);
    const teamUri = team ? getTeamUri(team) : null;

    if (team && !error) {
        const rawTeamEditionUri = getTeamEditionUri(team);

        if (rawTeamEditionUri) {
            try {
                const resolvedEdition = await editionsService.getEditionByUri(rawTeamEditionUri);
                teamEditionUri = resolvedEdition.link("self")?.href ?? resolvedEdition.uri ?? rawTeamEditionUri;
                editionYearStr = resolvedEdition.year ? String(resolvedEdition.year) : undefined;
            } catch (e) {
                console.error("Error resolving team edition:", e);
                teamEditionUri = rawTeamEditionUri;
            }
        }

        const [membersResult, scientificProjectsResult, matchesResult, awardsResult] = await Promise.allSettled([
            Promise.all([
                teamsService.getTeamCoach(id),
                teamsService.getTeamMembers(id),
            ]),
            teamDisplayName
                ? scientificProjectsService.getScientificProjectsByTeamName(teamDisplayName)
                : Promise.resolve([] as ScientificProject[]),
            teamEditionUri
                ? matchesService.getMatchesByEdition(teamEditionUri)
                : Promise.resolve([] as Match[]),
            teamUri
                ? awardsService.getAwardsOfTeam(teamUri)
                : Promise.resolve([] as Award[]),
        ]);

        if (membersResult.status === "fulfilled") {
            const [coachesData, membersData] = membersResult.value;
            coaches = coachesData ?? [];
            members = membersData ?? [];
        } else {
            console.error("Error loading members:", membersResult.reason);
            membersError = parseErrorMessage(membersResult.reason);
        }

        if (scientificProjectsResult.status === "fulfilled") {
            scientificProjects = scientificProjectsResult.value;
        } else {
            console.error("Error loading scientific projects:", scientificProjectsResult.reason);
            scientificProjectsError = parseErrorMessage(scientificProjectsResult.reason);
        }

        if (matchesResult.status === "fulfilled") {
            const resolvedMatches = await Promise.all(
                matchesResult.value.map((match) => resolveMatchForTeam(match, String(id), matchesService))
            );

            teamMatchesData = resolvedMatches
                .filter((result) => result.hasTeam)
                .map((result) => ({
                    match: result.match,
                    table: result.table,
                    opponent: result.opponent,
                    round: result.round,
                }));
        } else {
            console.error("Error loading matches:", matchesResult.reason);
            matchesError = parseErrorMessage(matchesResult.reason);
        }

        if (awardsResult.status === "fulfilled") {
            awards = awardsResult.value;
        } else {
            console.error("Error loading awards:", awardsResult.reason);
            awardsError = parseErrorMessage(awardsResult.reason);
        }
    }

    if (error) {
        return <ErrorAlert message={error} />;
    }

    if (!team) {
        return <EmptyState title="Not found" description="Team does not exist" />;
    }

    const currentUserEmail = currentUser?.email?.trim().toLowerCase();

    const isCoach =
        !!currentUserEmail &&
        coaches.some(
            (coach) =>
                coach.emailAddress?.trim().toLowerCase() === currentUserEmail
        );

    const coachName =
        coaches.length > 0
            ? coaches
                .map((coach) => coach.name ?? coach.emailAddress ?? "Unnamed coach")
                .join(", ")
            : "No coach assigned";

    const initialMembers = members.map(toTeamMemberSnapshot);

    const membersKey = initialMembers
        .map((member) => member.uri ?? String(member.id ?? member.name ?? ""))
        .join("|");

    const schedule: ScheduleItem[] = [];

    teamMatchesData.forEach(({ match, table, opponent, round }, index) => {
        if (match.startTime) {
            const isCompleted = match.state === "COMPLETED" || match.state === "FINISHED";
            const matchId = match.uri ? match.uri.split("/").pop() : (match.id ?? index);

            schedule.push({
                id: `match-${matchId}`,
                startTime: match.startTime,
                endTime: match.endTime,
                eventType: "Robot Game",
                location: `Table ${table}`,
                status: isCompleted ? "Completed" : "Pending",
                opponent,
                round,
            });
        }
    });

    scientificProjects.forEach((project, index) => {
        if (project.startTime) {
            const projectId = project.uri ? project.uri.split("/").pop() : `unknown-${index}`;

            schedule.push({
                id: `sp-${projectId}`,
                startTime: project.startTime,
                eventType: "Scientific Project",
                location: project.room ? `Room ${project.room}` : "Unknown Room",
                status: project.score === undefined ? "Pending" : "Completed",
            });
        }
    });

    schedule.sort((a, b) => new Date(a.startTime).getTime() - new Date(b.startTime).getTime());

    return (
        <div className="flex min-h-screen items-center justify-center bg-background">
            <div className="w-full max-w-3xl px-4 py-10">
                <div className="w-full rounded-lg border border-border bg-card p-6 shadow-sm">
                    <div className="mb-2 flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                        <h1 className="text-2xl font-semibold text-foreground">
                            {teamDisplayName ?? "Unnamed team"}
                        </h1>

                        <TeamShareButton teamName={teamDisplayName ?? "Unnamed team"} />
                    </div>

                    <div className="mb-6 space-y-1 text-sm text-muted-foreground">
                        {team.city && (
                            <p>
                                <strong>City:</strong> {team.city}
                            </p>
                        )}
                        <p>
                            <strong>Coach:</strong> {coachName}
                        </p>
                    </div>

                    {isAdminUser && (
                        <div className="mb-6 rounded-md border border-border p-4">
                            <TeamEditSection
                                team={{
                                    id: team.id!,
                                    name: team.name!,
                                    city: team.city ?? undefined,
                                    educationalCenter: team.educationalCenter ?? undefined,
                                    category: team.category ?? undefined,
                                    foundationYear: team.foundationYear ?? undefined,
                                    inscriptionDate: team.inscriptionDate ?? undefined,
                                }}
                            />
                        </div>
                    )}

                    <TeamAwardsSection
                        teamId={id}
                        teamName={teamDisplayName ?? team.id ?? "Team"}
                        awards={awards}
                        awardsError={awardsError}
                        isAdminUser={isAdminUser}
                        teamEditionUri={teamEditionUri}
                    />

                    <h2 className="mt-8 mb-4 text-xl font-semibold">
                        Team Members
                    </h2>

                    {!membersError && (
                        <TeamMembersManager
                            key={`${id}-${membersKey}`}
                            teamId={id}
                            initialMembers={initialMembers}
                            isCoach={isCoach}
                            isAdmin={isAdminUser}
                        />
                    )}

                    {membersError && <ErrorAlert message={membersError} />}

                    <section aria-labelledby="team-projects-heading">
                        <h2
                            id="team-projects-heading"
                            className="mt-8 mb-4 text-xl font-semibold"
                        >
                            Scientific Projects
                        </h2>

                        {scientificProjectsError && (
                            <ErrorAlert
                                message={`Could not load scientific projects. ${scientificProjectsError}`}
                            />
                        )}

                        {!scientificProjectsError && scientificProjects.length === 0 && (
                            <EmptyState
                                title="No scientific projects yet"
                                description="This team has not submitted any scientific projects."
                                className="py-8"
                            />
                        )}

                        {!scientificProjectsError && scientificProjects.length > 0 && (
                            <ul className="space-y-3">
                                {scientificProjects.map((project, index) => (
                                    <li key={project.uri ?? project.link("self")?.href ?? index}>
                                        <ScientificProjectCardLink
                                            project={project}
                                            index={index}
                                            variant="stacked"
                                        />
                                    </li>
                                ))}
                            </ul>
                        )}
                    </section>

                    <section aria-labelledby="tournament-itinerary-heading" className="mt-8">
                        <h2 id="tournament-itinerary-heading" className="mb-4 text-xl font-semibold print:hidden">
                            Tournament Itinerary
                        </h2>

                        {matchesError && (
                            <ErrorAlert message={`Could not load matches. ${matchesError}`} />
                        )}

                        <TournamentItinerary
                            teamName={teamDisplayName ?? "Team"}
                            editionYear={editionYearStr}
                            schedule={schedule}
                        />
                    </section>
                </div>
            </div>
        </div>
    );
}
