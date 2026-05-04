"use client";

import { Button } from "@/app/components/button";
import { formatMatchTime } from "@/lib/matchUtils";

export type ScheduleItem = {
    id: string;
    startTime: string;
    endTime?: string;
    eventType: "Robot Game" | "Scientific Project";
    location: string;
    status: "Pending" | "Completed";
    opponent?: string;
    round?: string;
};

interface TournamentItineraryProps {
    teamName: string;
    editionYear?: string;
    schedule: ScheduleItem[];
}

export default function TournamentItinerary({ teamName, editionYear, schedule }: TournamentItineraryProps) {
    const handleDownloadPdf = () => {
        const originalTitle = document.title;
        const yearSuffix = editionYear ? `_${editionYear}` : "";
        const safeTeamName = teamName
            .trim()
            .replace(/[\\/:*?"<>|]+/g, "")
            .replace(/\s+/g, "_");
        document.title = `${safeTeamName}_Schedule${yearSuffix}`;
        window.print();
        setTimeout(() => {
            document.title = originalTitle;
        }, 100);
    };

    if (schedule.length === 0) {
        return (
            <div className="py-8 text-center text-muted-foreground border border-border rounded-lg bg-card mt-4">
                <p>No schedule has been generated for this team yet.</p>
            </div>
        );
    }

    return (
        <div className="mt-4 print:mt-0 tournament-itinerary-print-wrapper" id="tournament-itinerary">
            <div className="flex justify-between items-center mb-4 print:hidden">
                <p className="text-sm text-muted-foreground">Chronological tournament schedule.</p>
                <Button onClick={handleDownloadPdf} variant="outline" size="sm">
                    Download PDF
                </Button>
            </div>
            
            {/* Header for PDF only */}
            <div className="hidden print:block mb-8 border-b border-border pb-4">
                <h1 className="text-2xl font-bold">{teamName}</h1>
                <h2 className="text-xl text-muted-foreground">Tournament Itinerary {editionYear && `- ${editionYear}`}</h2>
            </div>

            <div className="space-y-4">
                {schedule.map((item) => (
                    <div key={item.id} className="flex flex-col sm:flex-row gap-4 p-4 border border-border rounded-lg bg-card shadow-sm print:shadow-none print:border-gray-300">
                        <div className="min-w-[120px] font-semibold text-lg text-primary print:text-black">
                            {formatMatchTime(item.startTime)}
                            {item.endTime && <span className="text-muted-foreground text-sm font-normal block">{formatMatchTime(item.endTime)}</span>}
                        </div>
                        <div className="flex-1">
                            <h3 className="font-medium text-foreground print:text-black">
                                {item.eventType}
                                {item.round && (
                                    <span className="text-sm font-normal text-muted-foreground ml-2">
                                        ({item.round})
                                    </span>
                                )}
                                {item.opponent && (
                                    <span className="text-sm font-normal text-muted-foreground ml-2">
                                        vs {item.opponent}
                                    </span>
                                )}
                            </h3>
                            <p className="text-sm text-muted-foreground print:text-gray-600">{item.location}</p>
                        </div>
                        <div className="flex items-center print:items-start">
                            <span className={`px-2 py-1 text-xs font-medium rounded-full border ${item.status === 'Completed' ? 'bg-green-100 text-green-800 border-green-200 print:border-green-800 print:text-green-900' : 'bg-yellow-100 text-yellow-800 border-yellow-200 print:border-yellow-800 print:text-yellow-900'}`}>
                                {item.status}
                            </span>
                        </div>
                    </div>
                ))}
            </div>
            
            <style dangerouslySetInnerHTML={{__html: `
                @media print {
                    body * {
                        visibility: hidden;
                    }
                    .tournament-itinerary-print-wrapper, .tournament-itinerary-print-wrapper * {
                        visibility: visible;
                    }
                    .tournament-itinerary-print-wrapper {
                        position: absolute;
                        left: 0;
                        top: 0;
                        width: 100%;
                        margin: 0 !important;
                        padding: 20px !important;
                    }
                    .print\\:hidden {
                        display: none !important;
                    }
                    .print\\:block {
                        display: block !important;
                    }
                }
            `}} />
        </div>
    );
}
