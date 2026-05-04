'use client';

import { Button } from "@/app/components/button";
import ErrorAlert from "@/app/components/error-alert";
import { Input } from "@/app/components/input";
import { Label } from "@/app/components/label";
import { useRouter } from "next/navigation";
import { startTransition, useEffect, useState } from "react";
import { SubmitHandler, useForm } from "react-hook-form";
import { createAwardForTeam } from "./_add-award-actions";

type AddAwardFormValues = {
    name: string;
    title: string;
    category: string;
};

interface AddAwardFormProps {
    teamId: string;
    teamName: string;
}

export default function AddAwardForm({
    teamId,
    teamName,
}: Readonly<AddAwardFormProps>) {
    const router = useRouter();
    const [submitError, setSubmitError] = useState<string | null>(null);
    const [submitSuccess, setSubmitSuccess] = useState<string | null>(null);
    const { register, handleSubmit, reset, formState: { errors, isSubmitting } } = useForm<AddAwardFormValues>({
        defaultValues: {
            name: "",
            title: "",
            category: "",
        },
    });

    useEffect(() => {
        reset({
            name: "",
            title: "",
            category: "",
        });
    }, [reset]);

    const onSubmit: SubmitHandler<AddAwardFormValues> = async (data) => {
        setSubmitError(null);
        setSubmitSuccess(null);

        const result = await createAwardForTeam(teamId, {
            name: data.name.trim(),
            title: data.title.trim(),
            category: data.category.trim(),
        });

        if (!result.success) {
            setSubmitError(result.error);
            return;
        }

        setSubmitSuccess(`Award created for ${teamName}.`);
        reset({
            name: "",
            title: "",
            category: "",
        });
        startTransition(() => {
            router.refresh();
        });
    };

    return (
        <form onSubmit={handleSubmit(onSubmit)} className="rounded-lg border border-border bg-card p-4 shadow-sm">
            <div className="mb-4">
                <h3 className="text-base font-semibold text-foreground">Add Award</h3>
                <p className="mt-1 text-sm text-muted-foreground">
                    Create a new award for this team. The edition is inferred automatically from the team.
                </p>
            </div>

            {submitError && <ErrorAlert message={submitError} className="mb-4" />}
            {submitSuccess && (
                <div
                    role="status"
                    aria-live="polite"
                    className="mb-4 rounded-lg border border-emerald-500/20 bg-emerald-500/10 px-4 py-3 text-sm font-medium text-emerald-700"
                >
                    {submitSuccess}
                </div>
            )}

            <div className="grid gap-4 sm:grid-cols-2">
                <div className="grid gap-2 sm:col-span-2">
                    <Label htmlFor="award-name">Name</Label>
                    <Input
                        id="award-name"
                        aria-invalid={!!errors.name}
                        aria-describedby={errors.name ? "award-name-error" : undefined}
                        {...register("name", {
                            required: "Name is required",
                            maxLength: { value: 120, message: "Max 120 characters" },
                        })}
                    />
                    {errors.name && <p id="award-name-error" className="text-sm text-destructive">{errors.name.message}</p>}
                </div>

                <div className="grid gap-2">
                    <Label htmlFor="award-title">Title</Label>
                    <Input
                        id="award-title"
                        aria-invalid={!!errors.title}
                        aria-describedby={errors.title ? "award-title-error" : undefined}
                        {...register("title", {
                            required: "Title is required",
                            maxLength: { value: 120, message: "Max 120 characters" },
                        })}
                    />
                    {errors.title && <p id="award-title-error" className="text-sm text-destructive">{errors.title.message}</p>}
                </div>

                <div className="grid gap-2">
                    <Label htmlFor="award-category">Category</Label>
                    <Input
                        id="award-category"
                        aria-invalid={!!errors.category}
                        aria-describedby={errors.category ? "award-category-error" : undefined}
                        {...register("category", {
                            required: "Category is required",
                            maxLength: { value: 120, message: "Max 120 characters" },
                        })}
                    />
                    {errors.category && <p id="award-category-error" className="text-sm text-destructive">{errors.category.message}</p>}
                </div>
            </div>

            <div className="mt-4 flex justify-end">
                <Button type="submit" loading={isSubmitting} loadingText="Creating award...">
                    Add Award
                </Button>
            </div>
        </form>
    );
}
