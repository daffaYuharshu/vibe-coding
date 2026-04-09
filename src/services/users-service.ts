import { db } from "../db";
import { users } from "../db/schema/users";
import { sessions } from "../db/schema/sessions";
import { eq } from "drizzle-orm";

export const registerUser = async (data: any) => {
  const { name, email, password } = data;

  // 1. Check if email already exists
  const existingUser = await db
    .select()
    .from(users)
    .where(eq(users.email, email))
    .limit(1);

  if (existingUser.length > 0) {
    throw new Error("Email sudah terdaftar");
  }

  // 2. Hash password
  const hashedPassword = await Bun.password.hash(password, {
    algorithm: "bcrypt",
    cost: 10,
  });

  // 3. Insert user
  await db.insert(users).values({
    name,
    email,
    password: hashedPassword,
  });

  return { data: "OK" };
};

export const loginUser = async (data: any) => {
  const { email, password } = data;

  // 1. Find user by email
  const [currentUser] = await db
    .select()
    .from(users)
    .where(eq(users.email, email))
    .limit(1);

  if (!currentUser) {
    throw new Error("Email atau password salah");
  }

  // 2. Verify password
  const isPasswordValid = await Bun.password.verify(password, currentUser.password);

  if (!isPasswordValid) {
    throw new Error("Email atau password salah");
  }

  // 3. Generate and store session token
  const token = crypto.randomUUID();
  await db.insert(sessions).values({
    token,
    userId: currentUser.id,
  });

  return { data: token };
};
