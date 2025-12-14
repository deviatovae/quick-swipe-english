import { randomUUID } from "node:crypto";

import { eq } from "drizzle-orm";

import type { Database } from "./client.js";
import { users, type UserRow } from "./schema/index.js";

export interface CreateUserInput {
  email: string;
  passwordHash: string;
}

export async function createUser(db: Database, input: CreateUserInput): Promise<UserRow> {
  const id = randomUUID();
  await db.insert(users).values({
    id,
    email: input.email,
    passwordHash: input.passwordHash,
  });
  const created = await findUserById(db, id);
  if (!created) {
    throw new Error("Failed to create user");
  }
  return created;
}

export function findUserByEmail(db: Database, email: string) {
  return db.query.users.findFirst({
    where: eq(users.email, email),
  });
}

export function findUserById(db: Database, id: string) {
  return db.query.users.findFirst({
    where: eq(users.id, id),
  });
}

