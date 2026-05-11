"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { UserPlus, AlertCircle, CheckCircle } from "lucide-react";
import { Button } from "@/app/components/button";
import { Input } from "@/app/components/input";
import { Label } from "@/app/components/label";
import { UsersService } from "@/api/userApi";
import { clientAuthProvider } from "@/lib/authProvider";
import { parseErrorMessage } from "@/types/errors";
import { useTranslations } from "@/lib/languageContext";

export default function CreateAdministrator() {
    const t = useTranslations();
    const router = useRouter();
    const [isOpen, setIsOpen] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [successMessage, setSuccessMessage] = useState<string | null>(null);

    const [username, setUsername] = useState("");
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError(null);
        setSuccessMessage(null);

        if (!username || !email || !password) {
            setError(t.forms.fieldRequired);
            return;
        }

        const emailRegex = /^[\w\-.]+@([\w-]+\.)+[\w-]{2,}$/;
        if (!emailRegex.test(email)) {
            setError(t.forms.invalidEmail);
            return;
        }

        setIsLoading(true);

        try {
            const service = new UsersService(clientAuthProvider);
            await service.createAdministrator({ username, email, password });
            setSuccessMessage(t.administrators.administratorCreated);
            setUsername("");
            setEmail("");
            setPassword("");
            setIsOpen(false);
            router.refresh();
        } catch (e) {
            setError(parseErrorMessage(e));
        } finally {
            setIsLoading(false);
        }
    };

    if (!isOpen) {
        return (
            <div className="mb-6">
                <Button onClick={() => setIsOpen(true)}>
                    <UserPlus className="mr-2 h-4 w-4" />
                    {t.administrators.createAdministrator}
                </Button>
                {successMessage && (
                    <div className="mt-4 flex items-center gap-3 border border-green-500/20 bg-green-500/10 px-4 py-3 text-sm font-medium text-green-700">
                        <CheckCircle className="h-5 w-5 text-green-600 shrink-0" />
                        {successMessage}
                    </div>
                )}
            </div>
        );
    }

    return (
        <div className="mb-8 rounded-lg border bg-card p-6 shadow-sm">
            <div className="mb-4">
                <h3 className="text-lg font-medium">{t.administrators.createAdministrator}</h3>
                <p className="text-sm text-muted-foreground">{t.administrators.createAdministratorDescription}</p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
                {error && (
                    <div className="flex items-center gap-3 border border-red-500/20 bg-red-500/10 px-4 py-3 text-sm font-medium text-red-700">
                        <AlertCircle className="h-5 w-5 text-red-600 shrink-0" />
                        {error}
                    </div>
                )}

                <div className="space-y-2">
                    <Label htmlFor="username">{t.administrators.username}</Label>
                    <Input
                        id="username"
                        value={username}
                        onChange={(e) => setUsername(e.target.value)}
                        placeholder={t.administrators.usernamePlaceholder}
                        disabled={isLoading}
                    />
                </div>

                <div className="space-y-2">
                    <Label htmlFor="email">{t.administrators.email}</Label>
                    <Input
                        id="email"
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder={t.administrators.emailPlaceholder}
                        disabled={isLoading}
                    />
                </div>

                <div className="space-y-2">
                    <Label htmlFor="password">{t.administrators.password}</Label>
                    <Input
                        id="password"
                        type="password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        placeholder={t.administrators.passwordPlaceholder}
                        disabled={isLoading}
                    />
                </div>

                <div className="flex gap-3 pt-2">
                    <Button type="submit" disabled={isLoading}>
                        {isLoading ? t.common.loading : t.administrators.createAdministrator}
                    </Button>
                    <Button
                        type="button"
                        variant="outline"
                        onClick={() => {
                            setIsOpen(false);
                            setError(null);
                        }}
                        disabled={isLoading}
                    >
                        {t.common.cancel}
                    </Button>
                </div>
            </form>
        </div>
    );
}
