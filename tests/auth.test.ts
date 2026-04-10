import { describe, expect, it, beforeEach } from "bun:test";
import { app } from "../src/index";
import { clearDatabase } from "./db-utils";

describe("Authentication API", () => {
  beforeEach(async () => {
    await clearDatabase();
  });

  describe("POST /api/users (Registration)", () => {
    it("should register a new user successfully", async () => {
      const response = await app.handle(
        new Request("http://localhost/api/users", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            name: "Test User",
            email: "test@example.com",
            password: "password123",
          }),
        })
      );

      expect(response.status).toBe(200);
      const body = await response.json();
      expect(body.data).toBe("OK");
    });

    it("should return 400 when email is already registered", async () => {
      // Register once
      await app.handle(
        new Request("http://localhost/api/users", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            name: "Initial User",
            email: "duplicate@example.com",
            password: "password123",
          }),
        })
      );

      // Try registering again with same email
      const response = await app.handle(
        new Request("http://localhost/api/users", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            name: "Duplicate User",
            email: "duplicate@example.com",
            password: "password123",
          }),
        })
      );

      expect(response.status).toBe(400);
      const body = await response.json();
      expect(body.error).toBe("Email sudah terdaftar");
    });

    it("should return 422 when name is longer than 255 characters", async () => {
      const response = await app.handle(
        new Request("http://localhost/api/users", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            name: "A".repeat(256),
            email: "invalid@example.com",
            password: "password123",
          }),
        })
      );

      expect(response.status).toBe(422);
      const body = await response.text();
      expect(body).toBe("Nama maksimal 255 karakter");
    });
  });

  describe("POST /api/login", () => {
    beforeEach(async () => {
      // Seed a user for login tests
      await app.handle(
        new Request("http://localhost/api/users", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            name: "Login User",
            email: "login@example.com",
            password: "correctpassword",
          }),
        })
      );
    });

    it("should login successfully with correct credentials", async () => {
      const response = await app.handle(
        new Request("http://localhost/api/login", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            email: "login@example.com",
            password: "correctpassword",
          }),
        })
      );

      expect(response.status).toBe(200);
      const body = await response.json();
      expect(body.data).toBeDefined();
      expect(typeof body.data).toBe("string"); // Token
    });

    it("should return 401 with incorrect password", async () => {
      const response = await app.handle(
        new Request("http://localhost/api/login", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            email: "login@example.com",
            password: "wrongpassword",
          }),
        })
      );

      expect(response.status).toBe(401);
      const body = await response.json();
      expect(body.error).toBe("Email atau password salah");
    });
  });
});
