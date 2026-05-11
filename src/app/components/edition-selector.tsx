"use client";

import { EditionsService } from "@/api/editionApi";
import { clientAuthProvider } from "@/lib/authProvider";
import { Edition } from "@/types/edition";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";
import { useTranslations } from "@/lib/languageContext";

export default function EditionSelector() {
    const [editions, setEditions] = useState<Edition[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const router = useRouter();
    const searchParams = useSearchParams();
    const currentYear = searchParams.get("year");
    const t = useTranslations();

    useEffect(() => {
        const fetchEditions = async () => {
            try {
                setLoading(true);
                setError(null);
                const service = new EditionsService(clientAuthProvider);
                const data = await service.getEditions();
                setEditions(data);
            } catch (err) {
                console.error("Failed to fetch editions:", err);
                setError("Failed to load editions");
            } finally {
                setLoading(false);
            }
        };

        fetchEditions();
    }, []);

    const handleChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
        const year = e.target.value;
        const params = new URLSearchParams(searchParams.toString());
        if (year) {
            params.set("year", year);
        } else {
            params.delete("year");
        }
        router.push("?" + params.toString());
    };

    if (loading) {
        return null;
    }

    if (error || editions.length === 0) {
        return (
            <select
                disabled
                className="border-input h-10 border bg-card px-3 py-2 text-sm opacity-70"
                aria-label="Edition"
            >
                <option>{error ? "Editions unavailable" : "No editions available"}</option>
            </select>
        );
    }

    return (
        <select
            value={currentYear ?? ""}
            onChange={handleChange}
            className="border-input h-10 border bg-card px-3 py-2 text-sm outline-none focus-visible:border-ring focus-visible:ring-ring/35 focus-visible:ring-[3px]"
            aria-label="Edition"
        >
            <option value="">{t.editions.editionSelector}</option>
            {editions.map((edition) => (
                <option key={edition.uri} value={edition.year}>
                    {edition.year} {edition.venueName ? "- " + edition.venueName : ""}
                </option>
            ))}
        </select>
    );
}
