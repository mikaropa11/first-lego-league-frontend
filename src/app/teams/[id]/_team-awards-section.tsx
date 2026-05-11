import EmptyState from "@/app/components/empty-state";
import ErrorAlert from "@/app/components/error-alert";
import AddAwardForm from "./_add-award-form";
import AwardsManager, { type AwardSnapshot } from "./_awards-section";

interface EditionOption {
    readonly uri?: string;
    readonly year?: number;
    readonly venueName?: string;
}

interface TeamAwardsSectionProps {
    teamId: string;
    teamName: string;
    awards: AwardSnapshot[];
    awardsError: string | null;
    isAdminUser: boolean;
    teamEditionUri: string | null;
    editions: EditionOption[];
}

export default function TeamAwardsSection({
    teamId,
    teamName,
    awards,
    awardsError,
    isAdminUser,
    teamEditionUri,
    editions,
}: Readonly<TeamAwardsSectionProps>) {
    return (
        <section aria-labelledby="team-awards-heading">
            <div className="mb-4 flex items-center justify-between gap-3">
                <h2 id="team-awards-heading" className="text-xl font-semibold">
                    Awards
                </h2>
            </div>

            {isAdminUser && teamEditionUri && (
                <div className="mb-4">
                    <AddAwardForm
                        teamId={teamId}
                        teamName={teamName}
                    />
                </div>
            )}

            {isAdminUser && !teamEditionUri && (
                <ErrorAlert message="This team is not linked to an edition, so awards cannot be created yet." />
            )}

            {awardsError && (
                <ErrorAlert message={`Could not load awards. ${awardsError}`} />
            )}

            {!awardsError && awards.length === 0 && (
                <EmptyState
                    title="No awards yet"
                    description="This team has not received any awards yet."
                    className="py-8"
                />
            )}

            {!awardsError && awards.length > 0 && (
                <AwardsManager
                    key={awards.map((award) => award.uri ?? award.id ?? award.name ?? award.title ?? award.category ?? "").join("|")}
                    teamId={teamId}
                    teamName={teamName}
                    awards={awards}
                    editions={editions}
                    isAdmin={isAdminUser}
                    teamEditionUri={teamEditionUri}
                />
            )}
        </section>
    );
}
