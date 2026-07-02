import { DEFAULT_MODEL_CONFIGS } from "@/lib/ai/models";
import { isPaidPlanId } from "@/features/payments/lib/razorpay";

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

jest.mock("@/features/auth/lib/auth", () => ({
  auth: jest.fn(),
}));

jest.mock("@/lib/db/models/User", () => ({
  User: {
    findOne: jest.fn(),
    findByIdAndUpdate: jest.fn(),
  },
}));

jest.mock("@/lib/db/models/AnonymousUsage", () => ({
  AnonymousUsage: {
    findOne: jest.fn(),
    create: jest.fn(),
    updateOne: jest.fn(),
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
    expect(isPaidPlanId("premium")).toBe(false);
  });
});

describe("chat API auth boundary", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("returns 403 when anonymous chat rate limit is exceeded", async () => {
    const { auth } = await import("@/features/auth/lib/auth");
    const { AnonymousUsage } = await import("@/lib/db/models/AnonymousUsage");
    const { POST } = await import("@/app/api/chat/route");

    (auth as jest.Mock).mockResolvedValue(null);
    (AnonymousUsage.findOne as jest.Mock).mockResolvedValue({
      ip: "127.0.0.1",
      tokensUsedThisMonth: 30000,
      lastMonthlyResetDate: new Date(),
    });

    const request = new Request("http://localhost/api/chat", {
      method: "POST",
      body: JSON.stringify({
        messages: [{ role: "user", content: "Hello" }],
        data: {
          mode: "chat",
          provider: "openrouter",
          modelId: "meta-llama/llama-3.3-70b-instruct:free",
        },
      }),
    });

    const response = await POST(request);
    const body = await response.json();

    expect(response.status).toBe(403);
    expect(body.error).toMatch(/free trial limit/i);
  });
});

describe('attachment handler', () => {
  it("switches to the default vision model when attachments are present and current model doesn't support vision", async () => {
    const { handleAttachments } = await import('@/features/chat/lib/attachment-handler');
    const { updatedModelId } = handleAttachments(
      [{ role: 'user', content: 'test' }],
      [{ url: 'test', mimeType: 'image/png', name: 'test.png' }],
      'meta-llama/llama-3.3-70b-instruct:free',
      'openrouter'
    );
    expect(updatedModelId).toBe('gemini-3.5-flash');
  });
});
