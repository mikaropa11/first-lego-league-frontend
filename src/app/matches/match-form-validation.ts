import type { CreateMatchPayload } from "@/api/matchesApi";
import { ValidationError } from "@/types/errors";

function normalizeTime(value: string) {
    const time = value.length === 5 ? `${value}:00` : value;

    if (/^\d{2}:\d{2}:\d{2}$/.test(time)) {
        return `1970-01-01T${time}`;
    }

    return time;
}

function parseTimeToSeconds(value: string) {
    const time = value.includes("T") ? value.split("T").at(-1) ?? "" : value;
    const match = /^([01]\d|2[0-3]):([0-5]\d):([0-5]\d)(?:\.\d+)?$/.exec(time);

    if (!match) {
        throw new ValidationError("Please provide valid match times.");
    }

    const [, hours, minutes, seconds] = match;
    return Number(hours) * 3600 + Number(minutes) * 60 + Number(seconds);
}

export function validateMatchPayload<T extends CreateMatchPayload>(data: T) {
    if (
        !data.startTime ||
        !data.endTime ||
        !data.round ||
        !data.competitionTable ||
        !data.teamA ||
        !data.teamB ||
        !data.referee
    ) {
        throw new ValidationError("Please complete all required match fields.");
    }

    if (data.teamA === data.teamB) {
        throw new ValidationError("Please select two different teams.");
    }

    const normalizedStartTime = normalizeTime(data.startTime);
    const normalizedEndTime = normalizeTime(data.endTime);

    if (parseTimeToSeconds(normalizedStartTime) >= parseTimeToSeconds(normalizedEndTime)) {
        throw new ValidationError("End time must be later than start time.");
    }

    return {
        ...data,
        startTime: normalizedStartTime,
        endTime: normalizedEndTime,
    };
}
