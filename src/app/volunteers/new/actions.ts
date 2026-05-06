"use server";

import { CreateVolunteerPayload, VolunteersService } from "@/api/volunteerApi";
import { UsersService } from "@/api/userApi";
import { serverAuthProvider } from "@/lib/authProvider";
import { isAdmin } from "@/lib/authz";
import { isValidEmailAddress } from "@/lib/validation";
import { AuthenticationError, ValidationError } from "@/types/errors";
import { revalidatePath } from "next/cache";

export type CreateVolunteerFormPayload = {
    name: string;
    emailAddress: string;
    phoneNumber: string;
    edition: string;
    type: string;
    expert: boolean;
    studentCode: string;
};

const volunteerTypes = new Set(["Judge", "Referee", "Floater"]);

function normalizeRequiredString(value: unknown, message: string) {
    if (typeof value !== "string") {
        throw new ValidationError(message);
    }

    const normalized = value.trim();

    if (!normalized) {
        throw new ValidationError(message);
    }

    return normalized;
}

function validateVolunteerPayload(data: CreateVolunteerFormPayload): CreateVolunteerPayload {
    const name = normalizeRequiredString(data.name, "Volunteer name is required.");
    const emailAddress = normalizeRequiredString(data.emailAddress, "Email address is required.");
    const phoneNumber = normalizeRequiredString(data.phoneNumber, "Phone number is required.");
    const edition = normalizeRequiredString(data.edition, "Edition is required.");
    const type = normalizeRequiredString(data.type, "Volunteer type is required.");

    if (!isValidEmailAddress(emailAddress)) {
        throw new ValidationError("Please enter a valid email address.");
    }

    if (!volunteerTypes.has(type)) {
        throw new ValidationError("Please select a valid volunteer type.");
    }

    if (type === "Floater") {
        return {
            name,
            emailAddress,
            phoneNumber,
            edition,
            type,
            studentCode: normalizeRequiredString(data.studentCode, "Student code is required for floaters."),
        };
    }

    return {
        name,
        emailAddress,
        phoneNumber,
        edition,
        type: type as "Judge" | "Referee",
        expert: Boolean(data.expert),
    };
}

export async function createVolunteer(data: CreateVolunteerFormPayload) {
    const auth = await serverAuthProvider.getAuth();
    if (!auth) {
        throw new AuthenticationError();
    }

    const currentUser = await new UsersService(serverAuthProvider).getCurrentUser();

    if (!isAdmin(currentUser)) {
        throw new AuthenticationError("You are not allowed to create volunteers.", 403);
    }

    await new VolunteersService(serverAuthProvider).createVolunteer(validateVolunteerPayload(data));

    revalidatePath("/volunteers");

    return "/volunteers";
}
