import { buttonVariants } from "@/app/components/button";
import { Input } from "@/app/components/input";
import { cn } from "@/lib/utils";
import type { CompetitionTable } from "@/types/competitionTable";
import type { Round } from "@/types/round";
import Link from "next/link";

interface MatchesFilterBarProps {
    readonly year?: string;
    readonly view?: string;
    readonly teamQuery?: string;
    readonly startTime?: string;
    readonly endTime?: string;
    readonly tableId?: string;
    readonly roundId?: string;
    readonly competitionTables: CompetitionTable[];
    readonly rounds: Round[];
}

function buildResetHref(year?: string, view?: string) {
    const params = new URLSearchParams();
    if (year) params.set("year", year);
    if (view === "calendar") params.set("view", "calendar");
    const qs = params.toString();
    return qs ? `/matches?${qs}` : "/matches";
}

function fieldClassName() {
    return "h-11 rounded-md border border-border bg-card px-3 py-2 text-sm text-foreground outline-none transition-[color,box-shadow,border-color,background-color] focus-visible:border-ring focus-visible:ring-ring/35 focus-visible:ring-[3px]";
}

function getRoundOptionLabel(round: Round) {
    if (round.number === undefined) {
        return `Round ${round.uri ?? ""}`;
    }

    return `Round ${round.number}`;
}

function getRoundOptionValue(round: Round) {
    if (typeof round.number === "number") {
        return String(round.number);
    }

    return "";
}

export default function MatchesFilterBar({
    year,
    view,
    teamQuery,
    startTime,
    endTime,
    tableId,
    roundId,
    competitionTables,
    rounds,
}: Readonly<MatchesFilterBarProps>) {
    const hasFilters = Boolean(teamQuery || startTime || endTime || tableId || roundId);

    return (
        <section className="rounded-2xl border border-border bg-card p-4 shadow-sm">
            <div className="mb-4 flex flex-col gap-1 sm:flex-row sm:items-end sm:justify-between">
                <div>
                    <div className="page-eyebrow">Quick filters</div>
                    <h3 className="text-base font-semibold text-foreground">
                        Narrow the match list
                    </h3>
                </div>

                {hasFilters ? (
                    <Link
                        href={buildResetHref(year, view)}
                        className={cn(buttonVariants({ variant: "ghost", size: "sm" }), "w-fit")}
                    >
                        Clear filters
                    </Link>
                ) : null}
            </div>

            <form action="/matches" className="grid gap-3 lg:grid-cols-12">
                {year ? <input type="hidden" name="year" value={year} /> : null}
                {view === "calendar" ? <input type="hidden" name="view" value="calendar" /> : null}

                <div className="lg:col-span-3">
                    <label htmlFor="match-team" className="mb-2 block text-sm font-medium text-foreground">
                        Team
                    </label>
                    <Input
                        id="match-team"
                        name="team"
                        type="search"
                        defaultValue={teamQuery}
                        placeholder="Search team"
                        autoComplete="off"
                    />
                </div>

                <div className="lg:col-span-2">
                    <label htmlFor="match-start" className="mb-2 block text-sm font-medium text-foreground">
                        Start after
                    </label>
                    <Input
                        id="match-start"
                        name="startTime"
                        type="datetime-local"
                        defaultValue={startTime}
                    />
                </div>

                <div className="lg:col-span-2">
                    <label htmlFor="match-end" className="mb-2 block text-sm font-medium text-foreground">
                        End before
                    </label>
                    <Input
                        id="match-end"
                        name="endTime"
                        type="datetime-local"
                        defaultValue={endTime}
                    />
                </div>

                <div className="lg:col-span-2">
                    <label htmlFor="match-table" className="mb-2 block text-sm font-medium text-foreground">
                        Table
                    </label>
                    <select
                        id="match-table"
                        name="tableId"
                        defaultValue={tableId ?? ""}
                        className={cn(fieldClassName(), "w-full")}
                    >
                        <option value="">Any table</option>
                        {competitionTables.map((table) => (
                            <option key={table.id ?? table.uri} value={table.id ?? ""}>
                                {table.id ?? "Unknown table"}
                            </option>
                        ))}
                    </select>
                </div>

                <div className="lg:col-span-2">
                    <label htmlFor="match-round" className="mb-2 block text-sm font-medium text-foreground">
                        Round
                    </label>
                    <select
                        id="match-round"
                        name="roundId"
                        defaultValue={roundId ?? ""}
                        className={cn(fieldClassName(), "w-full")}
                    >
                        <option value="">Any round</option>
                        {rounds.map((round) => (
                            <option key={round.uri ?? round.number ?? "round"} value={getRoundOptionValue(round)}>
                                {getRoundOptionLabel(round)}
                            </option>
                        ))}
                    </select>
                </div>

                <div className="flex items-end gap-2 lg:col-span-1 lg:justify-end">
                    <button
                        type="submit"
                        className={cn(buttonVariants({ variant: "default", size: "sm" }), "w-full lg:w-auto")}
                    >
                        Apply
                    </button>
                </div>
            </form>
        </section>
    );
}
