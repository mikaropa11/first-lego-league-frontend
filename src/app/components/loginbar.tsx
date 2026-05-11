"use client";

import { UsersService } from "@/api/userApi";
import { useAuth } from "@/app/components/authentication";
import { Avatar, AvatarFallback } from "@/app/components/avatar";
import { buttonVariants } from "@/app/components/button";
import { useTranslations } from "@/lib/languageContext";
import { AUTH_COOKIE_NAME, clientAuthProvider } from "@/lib/authProvider";
import { faUser } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { deleteCookie } from "cookies-next";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

function hasAuthCookie(): boolean {
    if (typeof document === "undefined") return false;
    return new RegExp(`(?:^|;\\s*)${AUTH_COOKIE_NAME}=([^;]+)`).test(
        document.cookie
    );
}

export default function Loginbar() {
    const router = useRouter();
    const { user, setUser } = useAuth();
    const t = useTranslations();

    const [loadingUser, setLoadingUser] = useState(true);

    useEffect(() => {
        let active = true;

        async function load() {
            if (!hasAuthCookie()) {
                if (active) setLoadingUser(false);
                return;
            }

            try {
                const service = new UsersService(clientAuthProvider);
                const currentUser = await service.getCurrentUser();
                if (active) setUser(currentUser ?? null);
            } catch {
                if (active) setUser(null);
            } finally {
                if (active) setLoadingUser(false);
            }
        }

        load();

        return () => {
            active = false;
        };
    }, [setUser]);

    function logout() {
        deleteCookie(AUTH_COOKIE_NAME);
        localStorage.removeItem(AUTH_COOKIE_NAME);
        setUser(null);
        router.push("/");
    }

    if (user) {
        return (
            <div className="flex flex-wrap items-center gap-3">
                <div className="flex items-center gap-3 border border-border bg-card px-3 py-2">
                    <Avatar>
                        <AvatarFallback>
                            <FontAwesomeIcon icon={faUser} className="h-4 w-4" />
                        </AvatarFallback>
                    </Avatar>
                    {user.username ? (
                        <Link href={`/users/${user.username}`} className="min-w-0">
                            <span className="block truncate text-sm font-medium text-foreground">
                                {user.username}
                            </span>
                        </Link>
                    ) : (
                        <span className="block min-w-0 truncate text-sm font-medium text-foreground">
                            {t.auth.user}
                        </span>
                    )}
                </div>
                <button
                    onClick={logout}
                    className={buttonVariants({ variant: "secondary", size: "sm" })}
                >
                    {t.auth.logout}
                </button>
            </div>
        );
    }

    if (loadingUser) {
        return (
            <div className="flex flex-wrap items-center gap-3">
                <div className="flex items-center gap-3 border border-border bg-card px-3 py-2">
                    <Avatar>
                        <AvatarFallback>
                            <FontAwesomeIcon icon={faUser} className="h-4 w-4" />
                        </AvatarFallback>
                    </Avatar>
                    <span className="text-sm">...</span>
                </div>
            </div>
        );
    }

    return (
        <div className="flex flex-wrap items-center gap-2">
            <Link
                href="/login"
                className={buttonVariants({ variant: "default", size: "sm" })}
            >
                {t.auth.login}
            </Link>
        </div>
    );
}
