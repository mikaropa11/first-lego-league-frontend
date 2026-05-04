"use client";

import MatchForm, { MatchFormOption } from "../match-form";
import { createMatch } from "./actions";

export default function NewMatchForm({
    roundOptions,
    competitionTableOptions,
    refereeOptions,
    teamOptions,
}: Readonly<{
    roundOptions: MatchFormOption[];
    competitionTableOptions: MatchFormOption[];
    refereeOptions: MatchFormOption[];
    teamOptions: MatchFormOption[];
}>) {
    return (
        <MatchForm
            roundOptions={roundOptions}
            competitionTableOptions={competitionTableOptions}
            refereeOptions={refereeOptions}
            teamOptions={teamOptions}
            unavailableMessage="Match creation needs at least one round, one competition table, one referee, and two teams."
            submitLabel="Create match"
            loadingText="Creating match..."
            onSubmit={createMatch}
        />
    );
}
