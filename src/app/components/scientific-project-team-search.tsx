"use client";

import { Button } from "@/app/components/button";
import { Input } from "@/app/components/input";
import { Search, X } from "lucide-react";
import { useRouter, useSearchParams } from "next/navigation";
import { useState } from "react";

export default function ScientificProjectTeamSearch() {
    const searchParams = useSearchParams();
    const currentTeamName = searchParams.get("teamName") ?? "";

    return (
        <ScientificProjectTeamSearchForm
            key={currentTeamName}
            currentTeamName={currentTeamName}
            searchParamsString={searchParams.toString()}
        />
    );
}

function ScientificProjectTeamSearchForm({
    currentTeamName,
    searchParamsString,
}: Readonly<{
    currentTeamName: string;
    searchParamsString: string;
}>) {
    const router = useRouter();
    const [teamName, setTeamName] = useState(currentTeamName);

    const navigateWithTeamName = (value: string) => {
        const params = new URLSearchParams(searchParamsString);
        const trimmedValue = value.trim();

        params.delete("page");

        if (trimmedValue) {
            params.set("teamName", trimmedValue);
        } else {
            params.delete("teamName");
        }

        const query = params.toString();
        router.push(query ? `/scientific-projects?${query}` : "/scientific-projects");
    };

    const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        navigateWithTeamName(teamName);
    };

    const handleClear = () => {
        setTeamName("");
        navigateWithTeamName("");
    };

    return (
        <form onSubmit={handleSubmit} className="flex flex-col gap-3 sm:flex-row sm:items-center">
            <div className="relative min-w-0 flex-1">
                <Search
                    className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground"
                    aria-hidden="true"
                />
                <Input
                    type="search"
                    name="teamName"
                    value={teamName}
                    onChange={(event) => setTeamName(event.target.value)}
                    placeholder="Search by team name"
                    aria-label="Search scientific projects by team name"
                    className="pl-10"
                />
            </div>
            <div className="flex gap-2">
                <Button type="submit" size="sm">
                    <Search aria-hidden="true" />
                    Search
                </Button>
                {currentTeamName && (
                    <Button type="button" variant="secondary" size="sm" onClick={handleClear}>
                        <X aria-hidden="true" />
                        Clear
                    </Button>
                )}
            </div>
        </form>
    );
}
