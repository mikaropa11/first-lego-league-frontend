"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Plus, AlertCircle } from "lucide-react";
import { Button } from "@/app/components/button";
import { Input } from "@/app/components/input";
import { Label } from "@/app/components/label";
import { CompetitionTableService } from "@/api/competitionTableApi";
import { clientAuthProvider } from "@/lib/authProvider";
import { parseErrorMessage } from "@/types/errors";

export default function CreateCompetitionTableDialog() {
    const router = useRouter();
    const [isOpen, setIsOpen] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [identifier, setIdentifier] = useState("");

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError(null);

        if (!identifier.trim()) {
            setError("Table identifier is required.");
            return;
        }

        setIsLoading(true);
        try {
            const service = new CompetitionTableService(clientAuthProvider);
            await service.createTable(identifier.trim());
            setIdentifier("");
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
            <Button onClick={() => setIsOpen(true)}>
                <Plus className="mr-2 h-4 w-4" />
                Create table
            </Button>
        );
    }

    return (
        <div className="rounded-lg border bg-card p-6 shadow-sm">
            <div className="mb-4">
                <h3 className="text-lg font-medium">Create Competition Table</h3>
                <p className="text-sm text-muted-foreground">
                    Enter a unique identifier for the new table (e.g. &quot;Table-A&quot;, &quot;Red Table&quot;).
                </p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
                {error && (
                    <div className="flex items-center gap-3 border border-red-500/20 bg-red-500/10 px-4 py-3 text-sm font-medium text-red-700">
                        <AlertCircle className="h-5 w-5 text-red-600 shrink-0" />
                        {error}
                    </div>
                )}

                <div className="space-y-2">
                    <Label htmlFor="table-id">Table identifier</Label>
                    <Input
                        id="table-id"
                        value={identifier}
                        onChange={(e) => setIdentifier(e.target.value)}
                        placeholder="e.g. Table-A"
                        disabled={isLoading}
                    />
                </div>

                <div className="flex gap-3 pt-2">
                    <Button type="submit" disabled={isLoading}>
                        {isLoading ? "Creating..." : "Create table"}
                    </Button>
                    <Button
                        type="button"
                        variant="outline"
                        onClick={() => { setIsOpen(false); setError(null); }}
                        disabled={isLoading}
                    >
                        Cancel
                    </Button>
                </div>
            </form>
        </div>
    );
}
