import { afterEach, describe, expect, it, vi } from "vitest";
import { ADMIN_EMAIL, CONTACT_EMAIL, sendEmail } from "../../supabase/functions/_shared/gmail";

afterEach(() => vi.unstubAllGlobals());

describe("official email routing", () => {
  it("routes internal notifications to info@easymorte.co.il", () => {
    expect(ADMIN_EMAIL).toBe("info@easymorte.co.il");
    expect(CONTACT_EMAIL).toBe("info@easymorte.co.il");
  });

  it("routes customer replies to info@easymorte.co.il", async () => {
    vi.stubGlobal("Deno", { env: { get: () => "test-only" } });
    const fetchMock = vi.fn().mockResolvedValue(new Response("{}", { status: 200 }));
    vi.stubGlobal("fetch", fetchMock);
    await sendEmail("client@example.test", "Test", "<p>Test</p>");
    const request = fetchMock.mock.calls[0]?.[1];
    const { raw } = JSON.parse(request.body);
    const message = atob(raw.replace(/-/g, "+").replace(/_/g, "/"));
    expect(message.split("\r\n")).toContain("Reply-To: info@easymorte.co.il");
  });
});