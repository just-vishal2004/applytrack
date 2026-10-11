import request from "supertest";
import { afterEach, describe, expect, it, vi } from "vitest";
import { createRequire } from "node:module";

const require = createRequire(import.meta.url);
const Application = require("./models/Application");
const app = require("./server");

const sampleApplications = [
  {
    _id: "6acaa454e0b2396b19ef3191",
    company: "StartupMeu",
    position: "Software Engineer Intern",
    status: "Applied",
  },
];

afterEach(() => {
  vi.restoreAllMocks();
});

describe("ApplyTrack API", () => {
  it("returns a healthy response without connecting to MongoDB", async () => {
    const response = await request(app).get("/api/health");

    expect(response.status).toBe(200);
    expect(response.body).toEqual({
      success: true,
      message: "ApplyTrack API is running",
    });
  });

  it("returns the mocked application list and pagination metadata", async () => {
    const query = {
      sort: vi.fn(),
      skip: vi.fn(),
      limit: vi.fn(),
      lean: vi.fn().mockResolvedValue(sampleApplications),
    };
    query.sort.mockReturnValue(query);
    query.skip.mockReturnValue(query);
    query.limit.mockReturnValue(query);

    vi.spyOn(Application, "find").mockReturnValue(query);
    vi.spyOn(Application, "countDocuments").mockResolvedValue(1);

    const response = await request(app).get("/api/applications?page=1&limit=10");

    expect(response.status).toBe(200);
    expect(response.body).toEqual({
      success: true,
      data: sampleApplications,
      pagination: { page: 1, limit: 10, total: 1, totalPages: 1 },
    });
    expect(Application.find).toHaveBeenCalledWith({});
  });

  it("rejects invalid application input before accessing the model", async () => {
    const create = vi.spyOn(Application, "create");

    const response = await request(app)
      .post("/api/applications")
      .send({ company: "   ", position: "Engineer" });

    expect(response.status).toBe(400);
    expect(response.body.success).toBe(false);
    expect(response.body.message).toBe("Validation failed");
    expect(response.body.errors).toContain(
      "company is required and must be a non-empty string"
    );
    expect(create).not.toHaveBeenCalled();
  });

  it("returns 404 when a valid application ID does not exist", async () => {
    vi.spyOn(Application, "findById").mockReturnValue({
      lean: vi.fn().mockResolvedValue(null),
    });

    const response = await request(app).get(
      "/api/applications/6acaa454e0b2396b19ef3191"
    );

    expect(response.status).toBe(404);
    expect(response.body).toEqual({
      success: false,
      message: "Application not found",
    });
  });
});
