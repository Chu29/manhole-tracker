import request from "supertest";
import app from "../../app.js";

describe("Health Check Endpoint", () => {
  it("should return 200 OK and status ok", async () => {
    const response = await request(app).get("/api/health");
    
    expect(response.status).toBe(200);
    expect(response.body).toEqual({ status: "ok" });
  });

  it("should return 404 for unknown endpoints", async () => {
    const response = await request(app).get("/api/unknown");
    
    expect(response.status).toBe(404);
    expect(response.body).toEqual({ error: "Not found" });
  });
});
