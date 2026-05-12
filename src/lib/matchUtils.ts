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