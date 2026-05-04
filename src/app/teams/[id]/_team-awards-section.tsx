import EmptyState from "@/app/components/empty-state";
import ErrorAlert from "@/app/components/error-alert";
import { getAwardLabel } from "@/lib/awardUtils";
import { Award } from "@/types/award";
import AddAwardForm from "./_add-award-form";

interface TeamAwardsSectionProps {
    teamId: string;
    teamName: string;
    awards: Award[];
    awardsError: string | null;
    isAdminUser: boolean;
    teamEditionUri: string | null;
}

export default function TeamAwardsSection({
    teamId,
    teamName,
    awards,
    awardsError,
    isAdminUser,
    teamEditionUri,
}: Readonly<TeamAwardsSectionProps>) {
    return (
        <section aria-labelledby="team-awards-heading">
            <h2 id="team-awards-heading" className="mt-8 mb-4 text-xl font-semibold">
                Awards
            </h2>

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
                <ul className="space-y-3">
                    {awards.map((award, index) => (
                        <li
                            key={award.uri ?? award.link("self")?.href ?? index}
                            className="rounded-lg border border-border bg-card p-4 shadow-sm"
                        >
                            <p className="font-medium text-foreground">{getAwardLabel(award, index)}</p>
                            <div className="mt-1 text-sm text-muted-foreground">
                                {award.title && <p>{award.title}</p>}
                                {award.category && <p>{award.category}</p>}
                            </div>
                        </li>
                    ))}
                </ul>
            )}
        </section>
    );
}
