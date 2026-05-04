"use client";

import MatchForm, { MatchFormOption, MatchFormValues } from "../../match-form";
import { updateMatch } from "./actions";

export default function EditMatchForm({
    matchId,
    initialValues,
    roundOptions,
    competitionTableOptions,
    refereeOptions,
    teamOptions,
}: Readonly<{
    matchId: string;
    initialValues: MatchFormValues;
    roundOptions: MatchFormOption[];
    competitionTableOptions: MatchFormOption[];
    refereeOptions: MatchFormOption[];
    teamOptions: MatchFormOption[];
}>) {
    return (
        <MatchForm
            initialValues={initialValues}
            roundOptions={roundOptions}
            competitionTableOptions={competitionTableOptions}
            refereeOptions={refereeOptions}
            teamOptions={teamOptions}
            unavailableMessage="Match editing needs at least one round, one competition table, one referee, and two teams."
            submitLabel="Submit"
            loadingText="Updating match..."
            onSubmit={(data) => updateMatch(matchId, data)}
        />
    );
}
