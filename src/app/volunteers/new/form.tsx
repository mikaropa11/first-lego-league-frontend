"use client";

import { Button } from "@/app/components/button";
import { Input } from "@/app/components/input";
import { Label } from "@/app/components/label";
import { isValidEmailAddress } from "@/lib/validation";
import { parseErrorMessage } from "@/types/errors";
import { VolunteerRole } from "@/types/volunteer";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { SubmitHandler, useForm, useWatch } from "react-hook-form";
import { CreateVolunteerFormPayload, createVolunteer } from "./actions";

export type VolunteerEditionOption = {
    label: string;
    value: string;
};

const volunteerTypes: VolunteerRole[] = ["Judge", "Referee", "Floater"];

const selectClassName =
    "border-input h-11 w-full border bg-card px-4 py-2 text-base outline-none " +
    "focus-visible:border-ring focus-visible:ring-ring/35 focus-visible:ring-[3px] " +
    "aria-invalid:border-destructive md:text-sm disabled:pointer-events-none disabled:opacity-50";

function FieldError({ message }: Readonly<{ message?: string }>) {
    if (!message) {
        return null;
    }

    return (
        <p className="text-sm text-destructive" role="alert">
            {message}
        </p>
    );
}

export default function NewVolunteerForm({
    editionOptions,
}: Readonly<{
    editionOptions: VolunteerEditionOption[];
}>) {
    const [submitError, setSubmitError] = useState<string | null>(null);
    const [isRedirecting, setIsRedirecting] = useState(false);
    const router = useRouter();
    const {
        register,
        handleSubmit,
        control,
        setValue,
        formState: { errors, isSubmitting },
    } = useForm<CreateVolunteerFormPayload>({
        defaultValues: {
            name: "",
            emailAddress: "",
            phoneNumber: "",
            edition: "",
            type: "Judge",
            expert: false,
            studentCode: "",
        },
    });

    const selectedType = useWatch({ control, name: "type" });
    const isFloater = selectedType === "Floater";
    const isExpertEligible = selectedType === "Judge" || selectedType === "Referee";
    const isUnavailable = editionOptions.length === 0;

    useEffect(() => {
        if (isFloater) {
            setValue("expert", false);
            return;
        }

        setValue("studentCode", "");
    }, [isFloater, setValue]);

    const onSubmit: SubmitHandler<CreateVolunteerFormPayload> = async (data) => {
        setSubmitError(null);

        try {
            const destination = await createVolunteer(data);
            setIsRedirecting(true);
            router.push(destination);
            router.refresh();
        } catch (error) {
            setIsRedirecting(false);
            setSubmitError(parseErrorMessage(error));
        }
    };

    return (
        <form onSubmit={handleSubmit(onSubmit)} className="mx-auto grid max-w-2xl gap-5">
            {submitError && (
                <p
                    className="border border-destructive/20 bg-destructive/10 px-4 py-3 text-sm font-medium text-destructive"
                    role="alert"
                    aria-live="assertive"
                >
                    {submitError}
                </p>
            )}

            {isUnavailable && (
                <p className="border border-border bg-secondary px-4 py-3 text-sm text-muted-foreground">
                    Create an edition before adding volunteers.
                </p>
            )}

            <div className="grid gap-5 md:grid-cols-2">
                <div className="grid gap-2">
                    <Label htmlFor="name">Name</Label>
                    <Input
                        id="name"
                        aria-invalid={!!errors.name}
                        {...register("name", {
                            required: "Volunteer name is required",
                            maxLength: {
                                value: 100,
                                message: "Volunteer name must be 100 characters or fewer",
                            },
                        })}
                    />
                    <FieldError message={errors.name?.message} />
                </div>

                <div className="grid gap-2">
                    <Label htmlFor="emailAddress">Email address</Label>
                    <Input
                        id="emailAddress"
                        type="email"
                        aria-invalid={!!errors.emailAddress}
                        {...register("emailAddress", {
                            required: "Email address is required",
                            validate: (value) =>
                                isValidEmailAddress(value) || "Please enter a valid email address",
                        })}
                    />
                    <FieldError message={errors.emailAddress?.message} />
                </div>

                <div className="grid gap-2">
                    <Label htmlFor="phoneNumber">Phone number</Label>
                    <Input
                        id="phoneNumber"
                        type="tel"
                        aria-invalid={!!errors.phoneNumber}
                        {...register("phoneNumber", {
                            required: "Phone number is required",
                        })}
                    />
                    <FieldError message={errors.phoneNumber?.message} />
                </div>

                <div className="grid gap-2">
                    <Label htmlFor="edition">Edition</Label>
                    <select
                        id="edition"
                        className={selectClassName}
                        disabled={isUnavailable}
                        aria-invalid={!!errors.edition}
                        {...register("edition", {
                            required: "Edition is required",
                        })}
                    >
                        <option value="">Select an edition...</option>
                        {editionOptions.map((option) => (
                            <option key={option.value} value={option.value}>
                                {option.label}
                            </option>
                        ))}
                    </select>
                    <FieldError message={errors.edition?.message} />
                </div>

                <div className="grid gap-2">
                    <Label htmlFor="type">Volunteer type</Label>
                    <select
                        id="type"
                        className={selectClassName}
                        aria-invalid={!!errors.type}
                        {...register("type", {
                            required: "Volunteer type is required",
                        })}
                    >
                        {volunteerTypes.map((type) => (
                            <option key={type} value={type}>
                                {type}
                            </option>
                        ))}
                    </select>
                    <FieldError message={errors.type?.message} />
                </div>

                {isFloater && (
                    <div className="grid gap-2">
                        <Label htmlFor="studentCode">Student code</Label>
                        <Input
                            id="studentCode"
                            aria-invalid={!!errors.studentCode}
                            {...register("studentCode", {
                                validate: (value) =>
                                    !isFloater || value.trim().length > 0 || "Student code is required",
                            })}
                        />
                        <FieldError message={errors.studentCode?.message} />
                    </div>
                )}
            </div>

            {isExpertEligible && (
                <label className="flex items-start gap-3 rounded-lg border border-border bg-card p-4 text-sm">
                    <input
                        type="checkbox"
                        className="mt-1 size-4 accent-primary"
                        {...register("expert")}
                    />
                    <span>
                        <span className="block font-medium text-foreground">Expert volunteer</span>
                        <span className="text-muted-foreground">
                            Mark this judge or referee as an expert for assignment workflows.
                        </span>
                    </span>
                </label>
            )}

            <Button
                type="submit"
                className="w-full"
                disabled={isUnavailable}
                loading={isSubmitting || isRedirecting}
                loadingText={isRedirecting ? "Redirecting..." : "Creating volunteer..."}
            >
                Create volunteer
            </Button>
        </form>
    );
}
