import { db } from "../db";
import { users } from "../db/schema/users";
import { sessions } from "../db/schema/sessions";
import { eq } from "drizzle-orm";

/**
 * Mendaftarkan pengguna baru ke dalam sistem.
 * Memvalidasi ketersediaan email, melakukan hashing pada password,
 * dan menyimpan profil pengguna baru ke dalam database.
 */
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

/**
 * Melakukan autentikasi pengguna berdasarkan email dan password.
 * Jika valid, fungsi ini akan membuat (generate) UUID token sesi baru,
 * merekamnya di database, dan mengembalikan token tersebut untuk digunakan klien.
 */
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

/**
 * Mengambil informasi detail profil pengguna berdasarkan token autentikasi yang diberikan.
 * Berjalan dengan mencocokkan token di tabel sessions terhadap id pengguna di tabel users
 * secara aman (menyembunyikan atribut password pada respons).
 */
export const getCurrentUser = async (token: string) => {
  const result = await db
    .select({
      id: users.id,
      name: users.name,
      email: users.email,
      createdAt: users.createdAt,
    })
    .from(sessions)
    .innerJoin(users, eq(sessions.userId, users.id))
    .where(eq(sessions.token, token))
    .limit(1);

  if (result.length === 0) {
    throw new Error("Unauthorized");
  }

  return { data: result[0] };
};

/**
 * Mengakhiri sesi pengguna aktif (Logout).
 * Menghancurkan hak akses melalui penghapusan rekord token dari database,
 * membuat token tidak dapat digunakan lagi untuk memanggil rute terproteksi.
 */
export const logoutUser = async (token: string) => {
  const [response] = await db.delete(sessions).where(eq(sessions.token, token));

  if (response.affectedRows === 0) {
    throw new Error("Unauthorized");
  }

  return { data: "OK" };
};
