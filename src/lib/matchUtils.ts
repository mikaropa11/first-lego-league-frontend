export function formatMatchTime(value?: string | null): string {
    if (!value) {
        return "Not available";
    }

    const timeMatch =
        /^(\d{2}):(\d{2})(?::\d{2}(?:\.\d+)?)?$/.exec(value);

    if (timeMatch) {
        return `${timeMatch[1]}:${timeMatch[2]}`;
    }

    const date = new Date(value);

    if (Number.isNaN(date.getTime())) {
        return value;
    }

    return new Intl.DateTimeFormat("en-GB", {
        hour: "2-digit",
        minute: "2-digit",
    }).format(date);
}

function parseMatchTimeToMinutes(value?: string | null): number | null {
    if (!value) {
        return null;
    }

    const timeMatch = /^(\d{2}):(\d{2})(?::\d{2}(?:\.\d+)?)?$/.exec(value);

    if (timeMatch) {
        return Number.parseInt(timeMatch[1], 10) * 60 + Number.parseInt(timeMatch[2], 10);
    }

    const date = new Date(value);

    if (Number.isNaN(date.getTime())) {
        return null;
    }

    return date.getHours() * 60 + date.getMinutes();
}

function formatDurationMinutes(totalMinutes: number): string {
    const safeMinutes = Math.max(0, Math.floor(totalMinutes));
    const hours = Math.floor(safeMinutes / 60);
    const minutes = safeMinutes % 60;

    if (hours === 0) {
        return `${minutes} min`;
    }

    if (minutes === 0) {
        return hours === 1 ? "1 h" : `${hours} h`;
    }

    return `${hours} h ${minutes.toString().padStart(2, "0")} min`;
}

export function formatMatchDuration(
    startTime?: string | null,
    endTime?: string | null,
): string {
    const startMinutes = parseMatchTimeToMinutes(startTime);
    const endMinutes = parseMatchTimeToMinutes(endTime);

    if (startMinutes === null || endMinutes === null || endMinutes <= startMinutes) {
        return "Not available";
    }

    return formatDurationMinutes(endMinutes - startMinutes);
}

export function formatMatchDate(value?: string | null): string {
    if (!value) {
        return "Not available";
    }

    const date = new Date(value);

    if (Number.isNaN(date.getTime())) {
        return value;
    }

    return new Intl.DateTimeFormat("en-GB", {
        weekday: "long",
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
    }).format(date);
}
