import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { RequestTitle } from "@/components/RequestTitle";
import { ar } from "@/lib/i18n/ar";

function mockFetch(json: unknown, ok = true) {
  const spy = vi.fn((_url: string, _init?: RequestInit) =>
    Promise.resolve({ ok, json: () => Promise.resolve(json) } as unknown as Response),
  );
  vi.stubGlobal("fetch", spy);
  return spy;
}

describe("RequestTitle — ما نوعد بشي ما يصير", () => {
  afterEach(() => vi.unstubAllGlobals());

  it("التخزين غير مفعّل ⇐ لا زر، ورسالة صريحة", () => {
    render(<RequestTitle query="x" aiEnabled={false} requestsEnabled={false} age={9} />);
    expect(screen.queryByRole("button", { name: ar.request.cta })).toBeNull();
    expect(screen.getByTestId("request-disabled")).toHaveTextContent("غير مفعّلة");
  });

  it("الخادم يرجع stored:false ⇐ «ما انحفظ» مو «وصل طلبك»، والطلب فيه الاسم فقط", async () => {
    const spy = mockFetch({ ok: true, stored: false });
    render(<RequestTitle query="لعبة ما لها وجود" aiEnabled={false} age={9} />);
    fireEvent.click(screen.getByRole("button", { name: ar.request.cta }));
    await waitFor(() => expect(screen.getByTestId("request-status")).toHaveTextContent("ما انحفظ"));
    const init = spy.mock.calls[0]![1]!;
    expect(JSON.parse(String(init.body))).toEqual({ name: "لعبة ما لها وجود" });
    expect(init.credentials).toBe("omit");
  });

  it("stored:true ⇐ «وصل طلبك»", async () => {
    mockFetch({ ok: true, stored: true });
    render(<RequestTitle query="x" aiEnabled={false} age={9} />);
    fireEvent.click(screen.getByRole("button", { name: ar.request.cta }));
    await waitFor(() =>
      expect(screen.getByTestId("request-status")).toHaveTextContent(ar.request.sent),
    );
  });
});
