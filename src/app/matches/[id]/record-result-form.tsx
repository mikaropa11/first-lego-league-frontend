"use client";

import { Button } from "@/app/components/button";
import { Input } from "@/app/components/input";
import { Label } from "@/app/components/label";
import { parseErrorMessage } from "@/types/errors";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { SubmitHandler, useForm } from "react-hook-form";
import { registerMatchResult, updateMatchResultScores } from "./actions";

type FormValues = {
    teamAScore: number;
    teamBScore: number;
};

interface RecordResultFormProps {
    readonly matchId: number;
    readonly teamAId: string;
    readonly teamBId: string;
    readonly teamAName: string;
    readonly teamBName: string;
    readonly mode?: "create" | "edit";
    readonly initialTeamAScore?: number;
    readonly initialTeamBScore?: number;
    readonly teamAResultUri?: string;
    readonly teamBResultUri?: string;
}

function FieldError({ id, message }: Readonly<{ id: string; message?: string }>) {
    if (!message) return null;

    return (
        <p id={id} className="text-sm text-destructive" role="alert">
            {message}
        </p>
    );
}

export default function RecordResultForm({
    matchId,
    teamAId,
    teamBId,
    teamAName,
    teamBName,
    mode = "create",
    initialTeamAScore,
    initialTeamBScore,
    teamAResultUri,
    teamBResultUri,
}: RecordResultFormProps) {
    const [submitError, setSubmitError] = useState<string | null>(null);
    const [success, setSuccess] = useState(false);
    const router = useRouter();

    const {
        register,
        handleSubmit,
        formState: { errors, isSubmitting },
    } = useForm<FormValues>({
        defaultValues: {
            teamAScore: initialTeamAScore,
            teamBScore: initialTeamBScore,
        },
    });

    const isEditMode = mode === "edit";

    const onSubmit: SubmitHandler<FormValues> = async (data) => {
        setSubmitError(null);
        setSuccess(false);

        const teamAScore = Number(data.teamAScore);
        const teamBScore = Number(data.teamBScore);

        try {
        if (isEditMode) {
            if (!teamAResultUri || !teamBResultUri) {
                throw new Error("Cannot update result because result links are missing.");
            }

            if (
                initialTeamAScore === undefined ||
                initialTeamBScore === undefined ||
                !Number.isInteger(initialTeamAScore) ||
                !Number.isInteger(initialTeamBScore)
            ) {
                throw new Error("Cannot update result because previous scores are missing.");
            }

            await updateMatchResultScores({
                teamAResultUri,
                teamBResultUri,
                previousTeamAScore: initialTeamAScore,
                previousTeamBScore: initialTeamBScore,
                teamAScore,
                teamBScore,
            });

            setSuccess(true);
            router.refresh();
            return;
        }

            await registerMatchResult({
                matchId,
                score: {
                    teamAId,
                    teamBId,
                    teamAScore,
                    teamBScore,
                },
            });

            setSuccess(true);
            router.refresh();
        } catch (error) {
            setSubmitError(parseErrorMessage(error));
        }
    };

    return (
        <form onSubmit={handleSubmit(onSubmit)} className="rounded-lg border border-border bg-card p-5">
            <div className="space-y-4">
                {submitError && (
                    <p
                        className="border border-destructive/20 bg-destructive/10 px-4 py-3 text-sm font-medium text-destructive"
                        role="alert"
                        aria-live="assertive"
                    >
                        {submitError}
                    </p>
                )}

                {success && (
                    <p
                        className="border border-green-500/20 bg-green-500/10 px-4 py-3 text-sm font-medium text-green-800 dark:text-green-400"
                        role="status"
                        aria-live="polite"
                    >
                        {isEditMode ? "Result updated successfully." : "Result recorded successfully."}
                    </p>
                )}

                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                    <div className="grid gap-2">
                        <Label htmlFor="teamAScore">{teamAName} score</Label>
                        <Input
                            id="teamAScore"
                            type="number"
                            min={0}
                            step={1}
                            aria-invalid={!!errors.teamAScore}
                            aria-describedby={errors.teamAScore ? "team-a-score-error" : undefined}
                            {...register("teamAScore", {
                                required: "Score is required",
                                min: { value: 0, message: "Score cannot be negative" },
                                valueAsNumber: true,
                            })}
                        />
                        <FieldError id="team-a-score-error" message={errors.teamAScore?.message} />
                    </div>

                    <div className="grid gap-2">
                        <Label htmlFor="teamBScore">{teamBName} score</Label>
                        <Input
                            id="teamBScore"
                            type="number"
                            min={0}
                            step={1}
                            aria-invalid={!!errors.teamBScore}
                            aria-describedby={errors.teamBScore ? "team-b-score-error" : undefined}
                            {...register("teamBScore", {
                                required: "Score is required",
                                min: { value: 0, message: "Score cannot be negative" },
                                valueAsNumber: true,
                            })}
                        />
                        <FieldError id="team-b-score-error" message={errors.teamBScore?.message} />
                    </div>
                </div>

                <Button type="submit" disabled={isSubmitting} className="w-full sm:w-auto">
                    {isSubmitting
                        ? isEditMode
                            ? "Updating..."
                            : "Submitting..."
                        : isEditMode
                          ? "Update result"
                          : "Submit result"}
                </Button>
            </div>
        </form>
    );
}
