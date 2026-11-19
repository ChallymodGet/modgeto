"use server";

/**
 * Creative profile Server Actions. Reads go through the repositories, so this
 * keeps working when Supabase replaces the fixtures (Phase 8).
 */
import { repositories } from "@/features/data";
import { usernameSchema } from "@/lib/schemas";

export type UsernameCheck =
  | { status: "available"; username: string }
  | { status: "taken" | "invalid"; username: string; message: string };

/** PROF-003: case-insensitive, unique, and not a reserved platform name. */
export async function checkUsername(raw: string): Promise<UsernameCheck> {
  const parsed = usernameSchema.safeParse(raw);
  const username = raw.trim().toLowerCase();
  if (!parsed.success)
    return { status: "invalid", username, message: parsed.error.issues[0].message };
  const existing = await repositories.creatives.getByUsername(parsed.data);
  if (existing)
    return {
      status: "taken",
      username: parsed.data,
      message: "That username is taken. Try another.",
    };
  return { status: "available", username: parsed.data };
}
