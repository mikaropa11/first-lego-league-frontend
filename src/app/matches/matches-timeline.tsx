import { Match } from "@/types/match";
import { getEncodedResourceId } from "@/lib/halRoute";
import { formatMatchTime } from "@/lib/matchUtils";
import Link from "next/link";

export function MatchesTimeline({
    matches,
    labels,
    yearQuery
}: Readonly<{
    matches: Match[];
    labels: Record<string, string>;
    yearQuery: string;
}>) {
    const getMinutes = (timeStr?: string | null) => {
        if (!timeStr) return 0;
        const timeMatch = /^(\d{2}):(\d{2})/.exec(timeStr);
        if (timeMatch) return Number.parseInt(timeMatch[1], 10) * 60 + Number.parseInt(timeMatch[2], 10);
        const date = new Date(timeStr);
        if (!Number.isNaN(date.getTime())) return date.getHours() * 60 + date.getMinutes();
        return 0;
    };

    const matchesWithTime = matches.map((match) => {
        const start = getMinutes(match.startTime);
        const end = getMinutes(match.endTime) || start + 30; // default 30m if no end time
        
        const tableHref = match.link("competitionTable")?.href;
        let tableId = "Unassigned";
        if (tableHref) {
            const encoded = getEncodedResourceId(tableHref);
            if (encoded) {
                tableId = decodeURIComponent(encoded);
            }
        }

        const selfHref = match.link("self")?.href;
        const uri = match.uri;
        const matchId = getEncodedResourceId(selfHref ?? uri);
        const key = selfHref ?? uri;
        const label = labels[key] ?? "Unknown Team vs Unknown Team";
        return { 
            id: match.id ?? uri,
            startTime: match.startTime,
            endTime: match.endTime,
            startMin: start, 
            endMin: end, 
            tableId,
            matchId,
            label
        };
    });

    const validMatches = matchesWithTime.filter(m => m.startMin > 0);

    if (validMatches.length === 0) {
        return <div className="text-center p-8 text-muted-foreground border border-border rounded-md">No valid match times to display in calendar view.</div>;
    }

    let minMin = Math.min(...validMatches.map(m => m.startMin));
    let maxMin = Math.max(...validMatches.map(m => m.endMin));

    // Add padding to hours
    minMin = Math.max(0, Math.floor(minMin / 60) * 60 - 60);
    maxMin = Math.min(24 * 60, Math.ceil(maxMin / 60) * 60 + 60);
    const totalMinutes = maxMin - minMin;
    const pixelsPerMinute = 2;

    const tables = Array.from(new Set(validMatches.map(m => m.tableId))).sort((a, b) => a.localeCompare(b));

    return (
        <div className="overflow-x-auto border border-border bg-card rounded-md shadow-sm relative">
            {/* Column headers */}
            <div className="flex min-w-[800px] border-b border-border sticky top-0 z-10 bg-secondary/50 backdrop-blur-sm">
                <div className="w-20 flex-shrink-0 border-r border-border" />
                {tables.map(table => (
                    <div key={table} className="flex-1 min-w-[200px] border-r border-border px-2 py-2 text-sm font-medium flex items-center justify-center truncate">
                        {table === "Unassigned" ? "Unassigned" : table}
                    </div>
                ))}
            </div>
            <div className="flex min-w-[800px] relative">
                {/* Time Axis */}
                <div className="w-20 flex-shrink-0 border-r border-border bg-secondary/30 relative" style={{ height: totalMinutes * pixelsPerMinute }}>
                    {Array.from({ length: Math.floor((maxMin - minMin) / 60) + 1 }).map((_, i) => {
                        const hour = Math.floor(minMin / 60) + i;
                        return (
                            <div key={hour} className="absolute w-full text-right pr-2 text-xs text-muted-foreground border-t border-border/50" style={{ top: i * 60 * pixelsPerMinute }}>
                                <span className="inline-block -translate-y-1/2 bg-card px-1 border border-border/50 rounded-sm shadow-sm">{hour.toString().padStart(2, '0')}:00</span>
                            </div>
                        );
                    })}
                </div>

                {/* Tables */}
                {tables.map(table => {
                    const tableMatches = validMatches.filter(m => m.tableId === table);
                    return (
                        <div key={table} className="flex-1 min-w-[200px] border-r border-border relative" style={{ height: totalMinutes * pixelsPerMinute }}>
                            <div className="relative w-full h-full">
                                {tableMatches.map((m, idx) => {
                                    const top = (m.startMin - minMin) * pixelsPerMinute;
                                    const height = Math.max((m.endMin - m.startMin) * pixelsPerMinute, 20);
                                
                                    return (
                                        <div key={m.id ?? idx} className="absolute left-1 right-1 bg-primary/10 border border-primary/30 rounded-sm p-1.5 text-xs overflow-hidden hover:bg-primary/20 hover:z-20 transition-colors shadow-sm" style={{ top: top, height }}>
                                            <div className="font-semibold text-[10px] text-primary mb-0.5">{formatMatchTime(m.startTime)} - {formatMatchTime(m.endTime)}</div>
                                            {m.matchId ? (
                                                <Link href={`/matches/${m.matchId}${yearQuery}`} className="hover:underline leading-tight block font-medium">
                                                    {m.label}
                                                </Link>
                                            ) : (
                                                <span className="leading-tight block font-medium">{m.label}</span>
                                            )}
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
}
