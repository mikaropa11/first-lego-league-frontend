import { AwardsService } from "@/api/awardApi";
import { EditionsService } from "@/api/editionApi";
import { LeaderboardService } from "@/api/leaderboardApi";
import { MediaService } from "@/api/mediaApi";
import { UsersService } from "@/api/userApi";
import { buttonVariants } from "@/app/components/button";
import EmptyState from "@/app/components/empty-state";
import ErrorAlert from "@/app/components/error-alert";
import { Breadcrumb } from "@/app/components/breadcrumb";
import LeaderboardTable from "@/app/components/leaderboard-table";
import { MediaItem } from "@/app/components/media-gallery";
import { MediaSection } from "@/app/components/media-section";
import MediaUploadForm from "@/app/components/media-upload-form";
import { serverAuthProvider } from "@/lib/authProvider";
import { isAdmin } from "@/lib/authz";
import { getEncodedResourceId } from "@/lib/halRoute";
import { getServerTranslations } from "@/lib/i18n/server";
import { getTeamDisplayName } from "@/lib/teamUtils";
import { Award } from "@/types/award";
import { Round } from "@/types/round";
import { Edition } from "@/types/edition";
import { NotFoundError, parseErrorMessage } from "@/types/errors";
import type { LeaderboardItem } from "@/types/leaderboard";
import { MediaContent } from "@/types/mediaContent";
import { Team } from "@/types/team";
import { User } from "@/types/user";
import Link from "next/link";
import { redirect } from "next/navigation";
import DeleteEditionButton from "./delete-edition-button";
import RoundsManager from "./rounds-manager";
import { RoundsService } from "@/api/roundsApi";
import EditionStateControls from "./edition-state-controls";


interface EditionDetailPageProps {
    readonly params: Promise<{ id: string }>;
}

function getTeamHref(team: Team): string | null {
    const teamId = getEncodedResourceId(team.uri);
    return teamId ? `/teams/${teamId}` : null;
}

function getEditionTitle(edition: Edition | null, id: string) {
    if (edition?.year) {
        return `${edition.year}`;
    }

    return `Edition ${id}`;
}

interface EditionUriData {
    awards: Award[];
    mediaContents: MediaContent[];
    awardsError: string | null;
    mediaError: string | null;
}

async function fetchByEditionUri(
    editionUri: string,
    awardsService: AwardsService,
    mediaService: MediaService,
): Promise<EditionUriData> {
    const result: EditionUriData = {
        awards: [],
        mediaContents: [],
        awardsError: null,
        mediaError: null,
    };

    try {
        result.awards = await awardsService.getAwardsOfEdition(editionUri);
    } catch (e) {
        console.error("Failed to fetch awards:", e);
        result.awardsError = parseErrorMessage(e);
    }

    try {
        result.mediaContents = await mediaService.getMediaByEdition(editionUri);
    } catch (e) {
        console.error("Failed to fetch media:", e);
        result.mediaError = parseErrorMessage(e);
    }

    return result;
}

function toMediaItem(content: MediaContent, editionUri: string | null | undefined): MediaItem {
    return {
        uri: content.uri ?? content.link?.("self")?.href,
        id: content.id,
        type: content.type,
        url: content.url ?? content.id,
        edition: editionUri ?? content.edition,
    };
}

export default async function EditionDetailPage(props: Readonly<EditionDetailPageProps>) {
    const t = await getServerTranslations();
    const { id } = await props.params;

    async function deleteEditionAction() {
        "use server";

        await new EditionsService(serverAuthProvider).deleteEdition(id);
        redirect("/editions");
    }

    const editionsService = new EditionsService(serverAuthProvider);
    const awardsService = new AwardsService(serverAuthProvider);
    const mediaService = new MediaService(serverAuthProvider);

    let currentUser: User | null = null;
    let edition: Edition | null = null;
    let teams: Team[] = [];
    let awards: Award[] = [];
    let mediaContents: MediaContent[] = [];
    let leaderboardItems: LeaderboardItem[] = [];
    let rounds: Round[] = [];
    let error: string | null = null;
    let teamsError: string | null = null;
    let awardsError: string | null = null;
    let mediaError: string | null = null;
    let classificationError: string | null = null;
    let roundsError: string | null = null;

    try {
        edition = await editionsService.getEditionById(id);
    } catch (e) {
        console.error("Failed to fetch edition:", e);
        error = e instanceof NotFoundError
            ? t.errors.pageNotFound
            : parseErrorMessage(e);
    }

    try {
        currentUser = await new UsersService(serverAuthProvider).getCurrentUser();
    } catch (e) {
        console.error("Failed to fetch current user:", e);
    }

    if (edition && !error) {
        try {
            teams = await editionsService.getEditionTeams(id);
        } catch (e) {
            console.error("Failed to fetch teams:", e);
            teamsError = parseErrorMessage(e);
        }

        if (edition.uri) {
            ({ awards, mediaContents, awardsError, mediaError } = await fetchByEditionUri(
                edition.uri,
                awardsService,
                mediaService,
            ));
        }

        try {
            const data = await new LeaderboardService(serverAuthProvider).getEditionLeaderboard(id, 0, 100);
            leaderboardItems = data.items;
        } catch (e) {
            console.error("Failed to fetch leaderboard:", e);
            classificationError = parseErrorMessage(e);
        }

        try {
            rounds = await new RoundsService(serverAuthProvider).getRounds();
        } catch (e) {
            console.error("Failed to fetch rounds:", e);
            roundsError = parseErrorMessage(e);
        }
    }

    return (
        <div className="flex min-h-screen items-center justify-center bg-background">
            <div className="w-full max-w-3xl px-4 py-10">
                <Breadcrumb
                    items={[
                        { label: t.breadcrumb.home, href: "/" },
                        { label: t.breadcrumb.editions, href: "/editions" },
                        { label: getEditionTitle(edition, id) },
                    ]}
                />
                <div className="w-full rounded-lg border border-border bg-card p-6 shadow-sm">
                    <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                        <div>
                            <h1 className="mb-2 text-2xl font-semibold text-foreground">
                                {getEditionTitle(edition, id)}
                            </h1>

                            {edition && (
                                <EditionStateControls
                                    editionId={id}
                                    state={edition.state}
                                    isAdmin={!!(currentUser && isAdmin(currentUser))}
                                />
                            )}

                            {edition?.venueName && (
                                <p className="text-sm text-muted-foreground">
                                    {edition.venueName}
                                </p>
                            )}

                            {edition?.description && (
                                <p className="mt-2 text-sm text-muted-foreground">
                                    {edition.description}
                                </p>
                            )}
                        </div>

                        {currentUser && isAdmin(currentUser) && (
                            <div className="flex gap-2">
                                <Link
                                    href={`/editions/${id}/edit`}
                                    className={buttonVariants({ variant: "default", size: "sm" })}
                                >
                                    ✏️ edit
                                </Link>

                                <DeleteEditionButton deleteAction={deleteEditionAction} />
                            </div>
                        )}
                    </div>

                    {error && (
                        <div className="mt-6">
                            <ErrorAlert message={error} />
                        </div>
                    )}

                    {!error && (
                        <>
                            <h2 className="mt-8 mb-4 text-xl font-semibold text-foreground">
                                {t.editions.participatingTeams}
                            </h2>

                            {teamsError && <ErrorAlert message={teamsError} />}

                            {!teamsError && teams.length === 0 && (
                                <EmptyState
                                    title={t.teams.noTeams}
                                    description={t.editions.noTeamsInEdition}
                                />
                            )}

                            {!teamsError && teams.length > 0 && (
                                <ul className="w-full space-y-3">
                                    {teams.map((team, index) => {
                                        const href = getTeamHref(team);
                                        return (
                                            <li
                                                key={team.uri ?? index}
                                                className="w-full rounded-lg border border-border bg-card p-4 shadow-sm transition hover:bg-secondary/30"
                                            >
                                                {href ? (
                                                    <Link href={href} className="font-medium text-foreground">
                                                        {getTeamDisplayName(team)}
                                                    </Link>
                                                ) : (
                                                    <span className="font-medium text-foreground">
                                                        {getTeamDisplayName(team)}
                                                    </span>
                                                )}
                                            </li>
                                        );
                                    })}
                                </ul>
                            )}

                            {!teamsError && teams.length > 0 && awardsError && (
                                <div className="mt-6">
                                    <ErrorAlert message={`Could not load awards. ${awardsError}`} />
                                </div>
                            )}

                            {!teamsError && teams.length > 0 && !awardsError && awards.length === 0 && (
                                <div className="mt-6">
                                    <EmptyState
                                        title={t.editions.noAwardsYet}
                                        description={t.editions.noAwardsYetDescription}
                                    />
                                </div>
                            )}

                            <h2 className="mt-8 mb-4 text-xl font-semibold text-foreground">
                                {t.editions.finalClassification}
                            </h2>

                            <div className="mb-4">
                                <Link href={`/editions/${id}/project-ranking`} className={buttonVariants({ variant: "secondary", size: "sm" })}>
                                    Scientific Project Ranking
                                </Link>
                            </div>

                            {classificationError && <ErrorAlert message={classificationError} />}

                            {!classificationError && leaderboardItems.length === 0 && (
                                <EmptyState
                                    title={t.editions.noResultsYet}
                                    description={t.editions.noResultsYetDescription}
                                />
                            )}

                            {!classificationError && leaderboardItems.length > 0 && (
                                <LeaderboardTable
                                    items={leaderboardItems}
                                    labels={{
                                        team: t.table.team,
                                        totalScore: t.table.totalScore,
                                        matchesPlayed: t.table.matchesPlayed,
                                    }}
                                />
                            )}

                            <h2 className="mt-8 mb-4 text-xl font-semibold text-foreground">
                                {t.editions.rounds}
                            </h2>

                            {roundsError && <ErrorAlert message={roundsError} />}

                            {!roundsError && (
                                <RoundsManager
                                    initialRounds={rounds.map((r) => ({ uri: r.uri, number: r.number }))}
                                    isAdmin={!!(currentUser && isAdmin(currentUser))}
                                />
                            )}

                            <section id="media-section">
                                <h2 className="mt-8 mb-4 text-xl font-semibold text-foreground">
                                    {t.editions.mediaGallery}
                                </h2>

                                {currentUser && isAdmin(currentUser) && edition && (
                                    <MediaUploadForm editionId={id} />
                                )}

                                {mediaError && <ErrorAlert message={mediaError} />}

                                {!mediaError && mediaContents.length > 0 && (
                                    <MediaSection mediaContents={mediaContents.map((media) => toMediaItem(media, edition?.uri))} />
                                )}

                                {!mediaError && mediaContents.length === 0 && (
                                    <EmptyState
                                        title={t.editions.noMediaFound}
                                        description={t.editions.noMediaFoundDescription}
                                    />
                                )}
                            </section>
                        </>
                    )}
                </div>
            </div>
        </div>
    );
}
