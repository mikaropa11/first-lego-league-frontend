"use client";

import { UsersService } from "@/api/userApi";
import AuthPageShell from "@/app/components/auth-page-shell";
import { useAuth } from "@/app/components/authentication";
import { Button } from "@/app/components/button";
import ErrorAlert from "@/app/components/error-alert";
import { Input } from "@/app/components/input";
import { Label } from "@/app/components/label";
import { AUTH_COOKIE_NAME, clientAuthProvider } from "@/lib/authProvider";
import { AuthenticationError, parseErrorMessage } from "@/types/errors";
import { deleteCookie, setCookie } from "cookies-next";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { SubmitHandler, useForm } from "react-hook-form";

type FormValues = {
    username: string;
    password: string;
};

function toBase64(value: string) {
    const bytes = new TextEncoder().encode(value);
    let binary = "";

    for (const byte of bytes) {
        binary += String.fromCodePoint(byte);
    }

    return btoa(binary);
}

export default function LoginPage() {
    const router = useRouter();
    const { setUser } = useAuth();
    const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm<FormValues>();
    const [errorMessage, setErrorMessage] = useState<string | null>(null);

    async function login(username: string, password: string) {
        setErrorMessage(null);
        const base64 = toBase64(`${username}:${password}`);
        const authorization = `Basic ${base64}`;
        setCookie(AUTH_COOKIE_NAME, authorization, {
            path: "/",
            secure: window.location.protocol === 'https:',
            sameSite: "strict",
            httpOnly: false,
        });
        localStorage.setItem(AUTH_COOKIE_NAME, authorization);
        const service = new UsersService(clientAuthProvider);
        const user = await service.getCurrentUser();
    
        if (!user) {
            throw new AuthenticationError("Unauthorized", 401);
        }
        
        setUser(user);
    }

    const onSubmit: SubmitHandler<FormValues> = (data) => {
        login(data.username, data.password).then(() => {
            router.push(`/users/${data.username}`);
        }).catch((error) => {
            deleteCookie(AUTH_COOKIE_NAME);
            localStorage.removeItem(AUTH_COOKIE_NAME);
            
            if (error instanceof AuthenticationError) {
                setErrorMessage("Invalid username or password. Please try again.");
            } else {
                setErrorMessage(parseErrorMessage(error));
            }
        });
    };

    return (
        <AuthPageShell
            eyebrow="Member access"
            title="Login"
            description="Sign in to access your profile and protected routes."
        >
            <form onSubmit={handleSubmit(onSubmit)} className="mx-auto grid max-w-xl gap-5">
                {errorMessage && <ErrorAlert message={errorMessage} />}
                <div className="grid gap-2">
                    <Label htmlFor="username">Username</Label>
                    <Input
                        id="username"
                        {...register("username", { required: "Username is required" })}
                    />
                    {errors.username && (
                        <p className="text-sm text-destructive">{errors.username.message}</p>
                    )}
                </div>

                <div className="grid gap-2">
                    <Label htmlFor="password">Password</Label>
                    <Input
                        id="password"
                        type="password"
                        {...register("password", {
                            required: "Password is required",
                            minLength: { value: 8, message: "Minimum 8 characters" },
                        })}
                    />
                    {errors.password && (
                        <p className="text-sm text-destructive">{errors.password.message}</p>
                    )}
                </div>

                <Button type="submit" className="mt-2 w-full" disabled={isSubmitting}>
                    {isSubmitting ? "Logging in..." : "Login"}
                </Button>
            </form>
        </AuthPageShell>
    );
}
