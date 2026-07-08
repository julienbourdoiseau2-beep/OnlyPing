import { beforeEach, describe, expect, it, vi } from "vitest";

const { getServerSession } = vi.hoisted(() => ({ getServerSession: vi.fn() }));
vi.mock("next-auth", () => ({ getServerSession }));
vi.mock("@/lib/auth", () => ({ authOptions: {} }));

const { videoFindUnique } = vi.hoisted(() => ({ videoFindUnique: vi.fn() }));
vi.mock("@/lib/prisma", () => ({ prisma: { video: { findUnique: videoFindUnique } } }));

const { getR2SignedReadUrl, isR2Enabled, parseR2VideoRef } = vi.hoisted(() => ({
  getR2SignedReadUrl: vi.fn(),
  isR2Enabled: vi.fn(),
  parseR2VideoRef: vi.fn()
}));
vi.mock("@/lib/r2", () => ({ getR2SignedReadUrl, isR2Enabled, parseR2VideoRef }));

const { readFile } = vi.hoisted(() => ({ readFile: vi.fn() }));
vi.mock("fs/promises", () => ({ readFile }));

const { GET } = await import("@/app/api/videos/[id]/stream/route");

const context = { params: { id: "video_1" } };

function baseVideo(overrides: Record<string, unknown> = {}) {
  return {
    id: "video_1",
    coachId: "coach_1",
    isPublished: true,
    deletedAt: null,
    videoUrl: "https://example.com/videos/service-court-coupe.mp4",
    purchases: [],
    ...overrides
  };
}

beforeEach(() => {
  getServerSession.mockReset();
  videoFindUnique.mockReset();
  getR2SignedReadUrl.mockReset();
  isR2Enabled.mockReset();
  parseR2VideoRef.mockReset();
  readFile.mockReset();
  parseR2VideoRef.mockReturnValue(null); // default: not an r2 ref, matches real behavior for a plain URL
  getServerSession.mockResolvedValue({ user: { id: "buyer_1", role: "USER" } });
});

describe("GET /api/videos/[id]/stream - access control", () => {
  it("rejects an unauthenticated request", async () => {
    getServerSession.mockResolvedValue(null);
    const response = await GET(new Request("http://localhost/api/videos/video_1/stream"), context);
    expect(response.status).toBe(401);
    expect(videoFindUnique).not.toHaveBeenCalled();
  });

  it("returns 404 when the video does not exist", async () => {
    videoFindUnique.mockResolvedValue(null);
    const response = await GET(new Request("http://localhost/api/videos/video_1/stream"), context);
    expect(response.status).toBe(404);
  });

  it("blocks a soft-deleted video for a stranger with no purchase", async () => {
    videoFindUnique.mockResolvedValue(baseVideo({ deletedAt: new Date() }));
    const response = await GET(new Request("http://localhost/api/videos/video_1/stream"), context);
    expect(response.status).toBe(404);
    const body = await response.json();
    expect(body.error).toMatch(/supprimee/);
  });

  it("still serves a soft-deleted video to someone who purchased it before deletion", async () => {
    videoFindUnique.mockResolvedValue(baseVideo({ deletedAt: new Date(), purchases: [{ id: "purchase_1" }] }));
    const response = await GET(new Request("http://localhost/api/videos/video_1/stream"), context);
    expect(response.status).not.toBe(404);
  });

  it("still serves a soft-deleted video to an ADMIN", async () => {
    getServerSession.mockResolvedValue({ user: { id: "admin_1", role: "ADMIN" } });
    videoFindUnique.mockResolvedValue(baseVideo({ deletedAt: new Date() }));
    const response = await GET(new Request("http://localhost/api/videos/video_1/stream"), context);
    expect(response.status).not.toBe(404);
  });

  it("still serves a soft-deleted video to the owning coach", async () => {
    getServerSession.mockResolvedValue({ user: { id: "coach_1", role: "COACH" } });
    videoFindUnique.mockResolvedValue(baseVideo({ deletedAt: new Date() }));
    const response = await GET(new Request("http://localhost/api/videos/video_1/stream"), context);
    expect(response.status).not.toBe(404);
  });

  it("hides an unpublished video from a stranger (404, not 403 - no existence leak)", async () => {
    videoFindUnique.mockResolvedValue(baseVideo({ isPublished: false }));
    const response = await GET(new Request("http://localhost/api/videos/video_1/stream"), context);
    expect(response.status).toBe(404);
    const body = await response.json();
    expect(body.error).toMatch(/introuvable/);
  });

  it("lets the owning coach preview their own unpublished draft", async () => {
    getServerSession.mockResolvedValue({ user: { id: "coach_1", role: "COACH" } });
    videoFindUnique.mockResolvedValue(baseVideo({ isPublished: false }));
    const response = await GET(new Request("http://localhost/api/videos/video_1/stream"), context);
    expect(response.status).not.toBe(404);
  });

  it("blocks a published video for a logged-in user who hasn't purchased it (403, distinct from not-found)", async () => {
    videoFindUnique.mockResolvedValue(baseVideo({ purchases: [] }));
    const response = await GET(new Request("http://localhost/api/videos/video_1/stream"), context);
    expect(response.status).toBe(403);
    const body = await response.json();
    expect(body.error).toMatch(/Achat requis/);
  });

  it("serves a published, purchased video", async () => {
    videoFindUnique.mockResolvedValue(baseVideo({ purchases: [{ id: "purchase_1" }] }));
    const response = await GET(new Request("http://localhost/api/videos/video_1/stream"), context);
    expect(response.status).not.toBe(403);
    expect(response.status).not.toBe(404);
  });

  it("scopes the purchase lookup to the requesting user (can't ride on someone else's purchase)", async () => {
    videoFindUnique.mockResolvedValue(baseVideo({ purchases: [{ id: "purchase_1" }] }));
    await GET(new Request("http://localhost/api/videos/video_1/stream"), context);
    expect(videoFindUnique).toHaveBeenCalledWith(
      expect.objectContaining({
        select: expect.objectContaining({
          purchases: { where: { userId: "buyer_1" }, select: { id: true } }
        })
      })
    );
  });
});

describe("GET /api/videos/[id]/stream - source resolution (authorized requests)", () => {
  beforeEach(() => {
    // All these tests exercise an already-authorized viewer; keep that fixed.
    videoFindUnique.mockImplementation(async () => baseVideo({ purchases: [{ id: "purchase_1" }] }));
  });

  it("streams a local mp4 file with the right content type", async () => {
    videoFindUnique.mockResolvedValueOnce(
      baseVideo({ purchases: [{ id: "purchase_1" }], videoUrl: "local:abc123.mp4" })
    );
    readFile.mockResolvedValue(Buffer.from("fake-video-bytes"));

    const response = await GET(new Request("http://localhost/api/videos/video_1/stream"), context);

    expect(response.status).toBe(200);
    expect(response.headers.get("Content-Type")).toBe("video/mp4");
    expect(response.headers.get("Cache-Control")).toBe("private, no-store");
    const buf = Buffer.from(await response.arrayBuffer());
    expect(buf.toString()).toBe("fake-video-bytes");
  });

  it("infers video/webm and video/quicktime from the local file extension", async () => {
    videoFindUnique.mockResolvedValueOnce(
      baseVideo({ purchases: [{ id: "purchase_1" }], videoUrl: "local:clip.webm" })
    );
    readFile.mockResolvedValue(Buffer.from("x"));
    const webmResponse = await GET(new Request("http://localhost/api/videos/video_1/stream"), context);
    expect(webmResponse.headers.get("Content-Type")).toBe("video/webm");

    videoFindUnique.mockResolvedValueOnce(
      baseVideo({ purchases: [{ id: "purchase_1" }], videoUrl: "local:clip.mov" })
    );
    readFile.mockResolvedValue(Buffer.from("x"));
    const movResponse = await GET(new Request("http://localhost/api/videos/video_1/stream"), context);
    expect(movResponse.headers.get("Content-Type")).toBe("video/quicktime");
  });

  it("redirects to a freshly signed R2 URL when the source is an r2: ref", async () => {
    videoFindUnique.mockResolvedValueOnce(
      baseVideo({ purchases: [{ id: "purchase_1" }], videoUrl: "r2:videos/2026/1/clip.mp4" })
    );
    parseR2VideoRef.mockReturnValue("videos/2026/1/clip.mp4");
    isR2Enabled.mockReturnValue(true);
    getR2SignedReadUrl.mockResolvedValue("https://r2.example.com/signed?sig=abc");

    const response = await GET(new Request("http://localhost/api/videos/video_1/stream"), context);
    expect(response.status).toBe(307);
    expect(response.headers.get("location")).toBe("https://r2.example.com/signed?sig=abc");
    expect(getR2SignedReadUrl).toHaveBeenCalledWith("videos/2026/1/clip.mp4", 120);
  });

  it("returns 500 for an r2: ref when R2 isn't configured, instead of a broken redirect", async () => {
    videoFindUnique.mockResolvedValueOnce(
      baseVideo({ purchases: [{ id: "purchase_1" }], videoUrl: "r2:videos/2026/1/clip.mp4" })
    );
    parseR2VideoRef.mockReturnValue("videos/2026/1/clip.mp4");
    isR2Enabled.mockReturnValue(false);

    const response = await GET(new Request("http://localhost/api/videos/video_1/stream"), context);
    expect(response.status).toBe(500);
    expect(getR2SignedReadUrl).not.toHaveBeenCalled();
  });

  it("redirects to an absolute http(s) source URL as-is", async () => {
    videoFindUnique.mockResolvedValueOnce(
      baseVideo({ purchases: [{ id: "purchase_1" }], videoUrl: "https://cdn.example.com/clip.mp4" })
    );
    const response = await GET(new Request("http://localhost/api/videos/video_1/stream"), context);
    expect(response.status).toBe(307);
    expect(response.headers.get("location")).toBe("https://cdn.example.com/clip.mp4");
  });

  it("rejects a video source that matches none of the known formats", async () => {
    videoFindUnique.mockResolvedValueOnce(
      baseVideo({ purchases: [{ id: "purchase_1" }], videoUrl: "not-a-valid-source" })
    );
    const response = await GET(new Request("http://localhost/api/videos/video_1/stream"), context);
    expect(response.status).toBe(500);
    const body = await response.json();
    expect(body.error).toMatch(/Source video invalide/);
  });
});
