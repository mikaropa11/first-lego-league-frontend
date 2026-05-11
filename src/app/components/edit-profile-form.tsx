"use client";

import { UsersService } from "@/api/userApi";
import { Button } from "@/app/components/button";
import ErrorAlert from "@/app/components/error-alert";
import { Input } from "@/app/components/input";
import { Label } from "@/app/components/label";
import { clientAuthProvider, updateAuthCookie } from "@/lib/authProvider";
import { parseErrorMessage } from "@/types/errors";
import { CheckCircle } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { SubmitHandler, useForm, useWatch } from "react-hook-form";

interface EditProfileFormProps {
    readonly userId: string;
    readonly currentEmail?: string;
}

type FormValues = {
    email: string;
    password: string;
    confirmPassword: string;
};

export default function EditProfileForm({ userId, currentEmail }: EditProfileFormProps) {
    const service = new UsersService(clientAuthProvider);
    const router = useRouter();
    const [successMessage, setSuccessMessage] = useState<string | null>(null);
    const [errorMessage, setErrorMessage] = useState<string | null>(null);

    const {
        register,
        handleSubmit,
        control,
        reset,
        formState: { errors, isSubmitting },
    } = useForm<FormValues>({
        defaultValues: { email: currentEmail ?? "", password: "", confirmPassword: "" },
    });

    const passwordValue = useWatch({ control, name: "password" });

    const onSubmit: SubmitHandler<FormValues> = async (data) => {
        setSuccessMessage(null);
        setErrorMessage(null);

        const payload: { email?: string; password?: string } = {};

        if (data.email && data.email !== currentEmail) {
            payload.email = data.email;
        }
        if (data.password) {
            payload.password = data.password;
        }

        if (Object.keys(payload).length === 0) {
            setErrorMessage("No changes to save.");
            return;
        }

        try {
            await service.patchUser(userId, payload);

            if (payload.password) {
                await updateAuthCookie(clientAuthProvider, payload.password);
            }

            setSuccessMessage("Profile updated successfully.");
            reset({ email: data.email, password: "", confirmPassword: "" });
            router.refresh();
        } catch (e) {
            setErrorMessage(parseErrorMessage(e));
        }
    };

    return (
        <div className="space-y-5">
            <div>
                <div className="page-eyebrow">Account settings</div>
                <h2 className="section-title">Edit profile</h2>
                <p className="section-copy mt-1">Update your email address or password.</p>
            </div>

            {successMessage && (
                <div
                    className="flex items-center gap-3 rounded-lg border border-green-500/20 bg-green-500/10 px-4 py-3"
                    role="status"
                >
                    <CheckCircle className="h-5 w-5 shrink-0 text-green-600" aria-hidden="true" />
                    <p className="text-sm font-medium text-green-700 dark:text-green-400">{successMessage}</p>
                </div>
            )}

            {errorMessage && <ErrorAlert message={errorMessage} />}

            <form onSubmit={handleSubmit(onSubmit)} className="grid max-w-xl gap-5">
                <div className="grid gap-2">
                    <Label htmlFor="edit-email">Email</Label>
                    <Input
                        id="edit-email"
                        type="email"
                        autoComplete="email"
                        {...register("email", {
                            maxLength: { value: 254, message: "Email must be 254 characters or fewer" },
                            validate: (value) => {
                                if (!value) return true;
                                if (/\s/.test(value)) return "Invalid email address";
                                const parts = value.split("@");
                                if (parts.length !== 2) return "Invalid email address";
                                const [local, domain] = parts;
                                if (!local || !domain?.includes(".")) return "Invalid email address";
                                return true;
                            },
                        })}
                    />
                    {errors.email && (
                        <p className="text-sm text-destructive">{errors.email.message}</p>
                    )}
                </div>

                <div className="grid gap-2">
                    <Label htmlFor="edit-password">New password</Label>
                    <Input
                        id="edit-password"
                        type="password"
                        autoComplete="new-password"
                        placeholder="Leave blank to keep current password"
                        {...register("password", {
                            minLength: { value: 8, message: "Minimum 8 characters" },
                            maxLength: { value: 256, message: "Maximum 256 characters" },
                        })}
                    />
                    {errors.password && (
                        <p className="text-sm text-destructive">{errors.password.message}</p>
                    )}
                </div>

                <div className="grid gap-2">
                    <Label htmlFor="edit-confirm-password">Confirm new password</Label>
                    <Input
                        id="edit-confirm-password"
                        type="password"
                        autoComplete="new-password"
                        placeholder="Repeat new password"
                        {...register("confirmPassword", {
                            validate: (value) =>
                                !passwordValue || value === passwordValue || "Passwords do not match",
                        })}
                    />
                    {errors.confirmPassword && (
                        <p className="text-sm text-destructive">{errors.confirmPassword.message}</p>
                    )}
                </div>

                <Button
                    type="submit"
                    className="mt-2 w-full max-w-xs"
                    loading={isSubmitting}
                    loadingText="Saving changes..."
                >
                    Save changes
                </Button>
            </form>
        </div>
    );
}
