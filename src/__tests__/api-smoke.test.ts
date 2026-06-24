import { DEFAULT_MODEL_CONFIGS } from "@/lib/ai/models";
import { isPaidPlanId } from "@/lib/payments/razorpay";

jest.mock("@/lib/db/connection", () => ({
  connectDB: jest.fn(),
}));

jest.mock("@/lib/db/models/Admin", () => ({
  ModelConfig: {
    find: jest.fn(),
  },
  Alert: {},
  SponsorHighlight: {},
}));

jest.mock("@/lib/auth/auth", () => ({
  auth: jest.fn(),
}));

jest.mock("@/lib/db/models/User", () => ({
  User: {
    findOne: jest.fn(),
    findByIdAndUpdate: jest.fn(),
  },
}));

describe("public model API", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("returns default models when MongoDB is unavailable", async () => {
    const { connectDB } = await import("@/lib/db/connection");
    const { GET } = await import("@/app/api/models/route");
    const consoleErrorSpy = jest.spyOn(console, "error").mockImplementation(() => undefined);

    (connectDB as jest.Mock).mockRejectedValue(new Error("database unavailable"));

    try {
      const response = await GET();
      const body = await response.json();

      expect(response.status).toBe(200);
      expect(body).toEqual(DEFAULT_MODEL_CONFIGS);
    } finally {
      consoleErrorSpy.mockRestore();
    }
  });

  it("returns default models when MongoDB has no active model rows", async () => {
    const { connectDB } = await import("@/lib/db/connection");
    const { ModelConfig } = await import("@/lib/db/models/Admin");
    const { GET } = await import("@/app/api/models/route");

    (connectDB as jest.Mock).mockResolvedValue({});
    (ModelConfig.find as jest.Mock).mockReturnValue({
      sort: jest.fn().mockResolvedValue([]),
    });

    const response = await GET();
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body).toEqual(DEFAULT_MODEL_CONFIGS);
  });
});

describe("plan validation", () => {
  it("accepts only paid checkout plans", () => {
    expect(isPaidPlanId("pro")).toBe(true);
    expect(isPaidPlanId("ultimate")).toBe(true);
    expect(isPaidPlanId("free")).toBe(false);
    expect(isPaidPlanId("starter")).toBe(false);
    expect(isPaidPlanId("premium")).toBe(false);
  });
});

describe("chat API auth boundary", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("returns 401 for anonymous chat requests", async () => {
    const { auth } = await import("@/lib/auth/auth");
    const { POST } = await import("@/app/api/chat/route");

    (auth as jest.Mock).mockResolvedValue(null);

    const request = new Request("http://localhost/api/chat", {
      method: "POST",
      body: JSON.stringify({
        messages: [{ role: "user", content: "Hello" }],
        data: {
          mode: "chat",
          provider: "openrouter",
          modelId: "openai/gpt-oss-120b:free",
        },
      }),
    });

    const response = await POST(request);
    const body = await response.json();

    expect(response.status).toBe(401);
    expect(body.error).toMatch(/unauthorized/i);
  });
});
