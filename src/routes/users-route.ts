import { Elysia, t } from "elysia";
import { registerUser, loginUser, getCurrentUser, logoutUser } from "../services/users-service";

export const usersRoute = new Elysia()
  .post("/api/users", async ({ body, set }) => {
    try {
      const result = await registerUser(body);
      return result;
    } catch (error: any) {
      if (error.message === "Email sudah terdaftar") {
        set.status = 400;
        return { error: error.message };
      }
      set.status = 500;
      return { error: "Terjadi kesalahan pada server" };
    }
  }, {
    body: t.Object({
      name: t.String(),
      email: t.String({ format: "email" }),
      password: t.String(),
    })
  })
  .post("/api/login", async ({ body, set }) => {
    try {
      const result = await loginUser(body);
      return result;
    } catch (error: any) {
      if (error.message === "Email atau password salah") {
        set.status = 401;
        return { error: error.message };
      }
      set.status = 500;
      return { error: "Terjadi kesalahan pada server" };
    }
  }, {
    body: t.Object({
      email: t.String({ format: "email" }),
      password: t.String(),
    })
  })
  .group("/api/users", (app) =>
    app
      .derive(({ headers }) => {
        const auth = headers.authorization;
        return {
          token: auth?.startsWith("Bearer ") ? auth.split(" ")[1] : null,
        };
      })
      .get("/current", async ({ token, set }) => {
        if (!token) {
          set.status = 401;
          return { error: "Unauthorized" };
        }

        try {
          const result = await getCurrentUser(token);
          return result;
        } catch (error: any) {
          if (error.message === "Unauthorized") {
            set.status = 401;
            return { error: "Unauthorized" };
          }
          set.status = 500;
          return { error: "Terjadi kesalahan pada server" };
        }
      })
      .delete("/logout", async ({ token, set }) => {
        if (!token) {
          set.status = 401;
          return { error: "Unauthorized" };
        }

        try {
          const result = await logoutUser(token);
          return result;
        } catch (error: any) {
          if (error.message === "Unauthorized") {
            set.status = 401;
            return { error: "Unauthorized" };
          }
          set.status = 500;
          return { error: "Terjadi kesalahan pada server" };
        }
      })
  );
