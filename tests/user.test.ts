import { describe, expect, it, beforeEach } from "bun:test";
import { app } from "../src/index";
import { clearDatabase } from "./db-utils";

describe("User API (Protected)", () => {
  let authToken: string;

  beforeEach(async () => {
    await clearDatabase();
    
    // 1. Register
    await app.handle(
      new Request("http://localhost/api/users", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: "Auth User",
          email: "auth@example.com",
          password: "password123",
        }),
      })
    );

    // 2. Login to get token
    const loginRes = await app.handle(
      new Request("http://localhost/api/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: "auth@example.com",
          password: "password123",
        }),
      })
    );
    const loginData = (await loginRes.json()) as any;
    authToken = loginData.data;
  });

  describe("GET /api/users/current", () => {
    it("should return the current user profile with a valid token", async () => {
      const response = await app.handle(
        new Request("http://localhost/api/users/current", {
          method: "GET",
          headers: { "Authorization": `Bearer ${authToken}` },
        })
      );

      expect(response.status).toBe(200);
      const body = (await response.json()) as any;
      expect(body.data.email).toBe("auth@example.com");
      expect(body.data.name).toBe("Auth User");
      expect(body.data.password).toBeUndefined(); // Should not return password
    });

    it("should return 401 when token is missing", async () => {
      const response = await app.handle(
        new Request("http://localhost/api/users/current", {
          method: "GET",
        })
      );

      expect(response.status).toBe(401);
      const body = (await response.json()) as any;
      expect(body.error).toBe("Unauthorized");
    });

    it("should return 401 when token is invalid", async () => {
      const response = await app.handle(
        new Request("http://localhost/api/users/current", {
          method: "GET",
          headers: { "Authorization": "Bearer invalid-token" },
        })
      );

      expect(response.status).toBe(401);
      const body = (await response.json()) as any;
      expect(body.error).toBe("Unauthorized");
    });
  });

  describe("DELETE /api/users/logout", () => {
    it("should logout successfully and invalidate the token", async () => {
      // 1. Logout
      const logoutRes = await app.handle(
        new Request("http://localhost/api/users/logout", {
          method: "DELETE",
          headers: { "Authorization": `Bearer ${authToken}` },
        })
      );
      expect(logoutRes.status).toBe(200);
      const logoutBody = (await logoutRes.json()) as any;
      expect(logoutBody.data).toBe("OK");

      // 2. Try accessing protected route again
      const currentRes = await app.handle(
        new Request("http://localhost/api/users/current", {
          method: "GET",
          headers: { "Authorization": `Bearer ${authToken}` },
        })
      );
      expect(currentRes.status).toBe(401);
    });

    it("should return 401 when trying to logout with a stale token", async () => {
      // Logout once
      await app.handle(
        new Request("http://localhost/api/users/logout", {
          method: "DELETE",
          headers: { "Authorization": `Bearer ${authToken}` },
        })
      );

      // Try logout again
      const response = await app.handle(
        new Request("http://localhost/api/users/logout", {
          method: "DELETE",
          headers: { "Authorization": `Bearer ${authToken}` },
        })
      );

      expect(response.status).toBe(401);
    });
  });
});
