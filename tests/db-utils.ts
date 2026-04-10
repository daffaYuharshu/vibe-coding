import { db } from "../src/db";
import { users } from "../src/db/schema/users";
import { sessions } from "../src/db/schema/sessions";
import { sql } from "drizzle-orm";

export const clearDatabase = async () => {
  // Disable foreign key checks to allow truncation/deletion in any order
  await db.execute(sql`SET FOREIGN_KEY_CHECKS = 0;`);
  
  await db.delete(sessions);
  await db.delete(users);
  
  await db.execute(sql`SET FOREIGN_KEY_CHECKS = 1;`);
};
