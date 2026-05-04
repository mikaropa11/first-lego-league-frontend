"use client";

import { Button } from "@/app/components/button";
import { Input } from "@/app/components/input";
import { Label } from "@/app/components/label";
import { parseErrorMessage } from "@/types/errors";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { SubmitHandler, useForm } from "react-hook-form";

export type MatchFormOption = { label: string; value: string };

export type MatchFormValues = {
    startTime: string;
    endTime: string;
    round: string;
    competitionTable: string;
    teamA: string;
    teamB: string;
    referee: string;
};

type MatchFormActionResult =
    | string
    | { ok: true; destination: string }
    | { ok: false; error: string };

const selectClassName =
    "border-input h-11 w-full border bg-card px-4 py-2 text-base outline-none " +
    "focus-visible:border-ring focus-visible:ring-ring/35 focus-visible:ring-[3px] " +
    "aria-invalid:border-destructive md:text-sm disabled:pointer-events-none disabled:opacity-50";

function FieldError({
    id,
    message,
}: Readonly<{
    id: string;
    message?: string;
}>) {
    if (!message) {
        return null;
    }

    return (
        <p id={id} className="text-sm text-destructive" role="alert">
            {message}
        </p>
    );
}

function EmptySelectMessage({
    label,
    hasOptions,
}: Readonly<{
    label: string;
    hasOptions: boolean;
}>) {
    if (hasOptions) {
        return null;
    }

    return (
        <p className="text-sm text-muted-foreground">
            No {label.toLowerCase()} are available yet. Create them in the backend first.
        </p>
    );
}

export default function MatchForm({
    initialValues,
    roundOptions,
    competitionTableOptions,
    refereeOptions,
    teamOptions,
    unavailableMessage,
    submitLabel,
    loadingText,
    onSubmit,
}: Readonly<{
    initialValues?: MatchFormValues;
    roundOptions: MatchFormOption[];
    competitionTableOptions: MatchFormOption[];
    refereeOptions: MatchFormOption[];
    teamOptions: MatchFormOption[];
    unavailableMessage: string;
    submitLabel: string;
    loadingText: string;
    onSubmit: (data: MatchFormValues) => Promise<MatchFormActionResult>;
}>) {
    const [submitError, setSubmitError] = useState<string | null>(null);
    const router = useRouter();
    const {
        register,
        handleSubmit,
        getValues,
        formState: { errors, isSubmitting },
    } = useForm<MatchFormValues>({ defaultValues: initialValues });

    const isReadyToSubmit =
        roundOptions.length > 0 &&
        competitionTableOptions.length > 0 &&
        refereeOptions.length > 0 &&
        teamOptions.length > 1;

    const handleFormSubmit: SubmitHandler<MatchFormValues> = async (data) => {
        setSubmitError(null);

        try {
            const result = await onSubmit({
                startTime: data.startTime,
                endTime: data.endTime,
                round: data.round,
                competitionTable: data.competitionTable,
                teamA: data.teamA,
                teamB: data.teamB,
                referee: data.referee,
            });

            if (typeof result === "string") {
                router.push(result);
                return;
            }

            if (result.ok) {
                router.push(result.destination);
                router.refresh();
                return;
            }

            setSubmitError(result.error);
        } catch (error) {
            setSubmitError(parseErrorMessage(error));
        }
    };

    return (
        <form onSubmit={handleSubmit(handleFormSubmit)} className="mx-auto grid max-w-xl gap-5">
            {submitError && (
                <p
                    className="border border-destructive/20 bg-destructive/10 px-4 py-3 text-sm font-medium text-destructive"
                    role="alert"
                    aria-live="assertive"
                >
                    {submitError}
                </p>
            )}

            {!isReadyToSubmit && (
                <p
                    className="border border-amber-500/20 bg-amber-500/10 px-4 py-3 text-sm font-medium text-amber-800"
                    role="status"
                    aria-live="polite"
                >
                    {unavailableMessage}
                </p>
            )}

            <div className="grid gap-2 sm:grid-cols-2 sm:gap-4">
                <div className="grid gap-2">
                    <Label htmlFor="startTime">Start time</Label>
                    <Input
                        id="startTime"
                        type="time"
                        step={60}
                        {...register("startTime", {
                            required: "Start time is required",
                        })}
                    />
                    <FieldError id="start-time-error" message={errors.startTime?.message} />
                </div>

                <div className="grid gap-2">
                    <Label htmlFor="endTime">End time</Label>
                    <Input
                        id="endTime"
                        type="time"
                        step={60}
                        {...register("endTime", {
                            required: "End time is required",
                            validate: (value) => {
                                const startTime = getValues("startTime");

                                if (!startTime || !value) {
                                    return true;
                                }

                                return value > startTime || "End time must be later than start time";
                            },
                        })}
                    />
                    <FieldError id="end-time-error" message={errors.endTime?.message} />
                </div>
            </div>

            <div className="grid gap-2">
                <Label htmlFor="round">Round</Label>
                <select
                    id="round"
                    className={selectClassName}
                    aria-invalid={!!errors.round}
                    aria-describedby={errors.round ? "round-error" : undefined}
                    disabled={roundOptions.length === 0}
                    {...register("round", { required: "Round is required" })}
                >
                    <option value="">
                        {roundOptions.length > 0 ? "Select a round..." : "No rounds available"}
                    </option>
                    {roundOptions.map((option) => (
                        <option key={option.value} value={option.value}>
                            {option.label}
                        </option>
                    ))}
                </select>
                <EmptySelectMessage label="rounds" hasOptions={roundOptions.length > 0} />
                <FieldError id="round-error" message={errors.round?.message} />
            </div>

            <div className="grid gap-2">
                <Label htmlFor="competitionTable">Competition table</Label>
                <select
                    id="competitionTable"
                    className={selectClassName}
                    aria-invalid={!!errors.competitionTable}
                    aria-describedby={errors.competitionTable ? "competition-table-error" : undefined}
                    disabled={competitionTableOptions.length === 0}
                    {...register("competitionTable", { required: "Competition table is required" })}
                >
                    <option value="">
                        {competitionTableOptions.length > 0
                            ? "Select a competition table..."
                            : "No competition tables available"}
                    </option>
                    {competitionTableOptions.map((option) => (
                        <option key={option.value} value={option.value}>
                            {option.label}
                        </option>
                    ))}
                </select>
                <EmptySelectMessage
                    label="competition tables"
                    hasOptions={competitionTableOptions.length > 0}
                />
                <FieldError
                    id="competition-table-error"
                    message={errors.competitionTable?.message}
                />
            </div>

            <div className="grid gap-2 sm:grid-cols-2 sm:gap-4">
                <div className="grid gap-2">
                    <Label htmlFor="teamA">Team A</Label>
                    <select
                        id="teamA"
                        className={selectClassName}
                        aria-invalid={!!errors.teamA}
                        aria-describedby={errors.teamA ? "team-a-error" : undefined}
                        disabled={teamOptions.length < 2}
                        {...register("teamA", { required: "Team A is required" })}
                    >
                        <option value="">
                            {teamOptions.length > 1 ? "Select team A..." : "At least two teams are required"}
                        </option>
                        {teamOptions.map((option) => (
                            <option key={option.value} value={option.value}>
                                {option.label}
                            </option>
                        ))}
                    </select>
                    <FieldError id="team-a-error" message={errors.teamA?.message} />
                </div>

                <div className="grid gap-2">
                    <Label htmlFor="teamB">Team B</Label>
                    <select
                        id="teamB"
                        className={selectClassName}
                        aria-invalid={!!errors.teamB}
                        aria-describedby={errors.teamB ? "team-b-error" : undefined}
                        disabled={teamOptions.length < 2}
                        {...register("teamB", {
                            required: "Team B is required",
                            validate: (value) =>
                                value !== getValues("teamA") || "Please select a different team for Team B",
                        })}
                    >
                        <option value="">
                            {teamOptions.length > 1 ? "Select team B..." : "At least two teams are required"}
                        </option>
                        {teamOptions.map((option) => (
                            <option key={option.value} value={option.value}>
                                {option.label}
                            </option>
                        ))}
                    </select>
                    <FieldError id="team-b-error" message={errors.teamB?.message} />
                </div>
            </div>

            <div className="grid gap-2">
                <Label htmlFor="referee">Referee</Label>
                <select
                    id="referee"
                    className={selectClassName}
                    aria-invalid={!!errors.referee}
                    aria-describedby={errors.referee ? "referee-error" : undefined}
                    disabled={refereeOptions.length === 0}
                    {...register("referee", { required: "Referee is required" })}
                >
                    <option value="">
                        {refereeOptions.length > 0 ? "Select a referee..." : "No referees available"}
                    </option>
                    {refereeOptions.map((option) => (
                        <option key={option.value} value={option.value}>
                            {option.label}
                        </option>
                    ))}
                </select>
                <EmptySelectMessage label="referees" hasOptions={refereeOptions.length > 0} />
                <FieldError id="referee-error" message={errors.referee?.message} />
            </div>

            <Button
                type="submit"
                className="mt-2 w-full"
                disabled={!isReadyToSubmit}
                loading={isSubmitting}
                loadingText={loadingText}
            >
                {submitLabel}
            </Button>
        </form>
    );
}
