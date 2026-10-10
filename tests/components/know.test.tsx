import { render, screen, within } from "@testing-library/react";
import minecraft from "@data/titles/minecraft.json";
import nodata from "@data/titles/no-data-demo.json";
import { RatingTable } from "@/components/RatingTable";
import { AttentionPoint } from "@/components/AttentionPoint";
import { ConfidenceBadge } from "@/components/ConfidenceBadge";
import { KnowStep } from "@/components/KnowStep";
import { ar } from "@/lib/i18n/ar";
import type { Title } from "@schemas/title";

const mc = minecraft as unknown as Title;
const nd = nodata as unknown as Title;

describe("RatingTable", () => {
  it("GCAM أولًا ثم ESRB ثم PEGI ثم App Store ثم Google Play", () => {
    render(<RatingTable ratings={mc.ratings} age={9} />);
    const ids = screen.getAllByRole("listitem").map((li) => li.getAttribute("data-testid"));
    expect(ids).toEqual(["rating-gcam", "rating-esrb", "rating-pegi", "rating-appStore", "rating-googlePlay"]);
  });
  it("التصنيف الناقص يظهر «غير متوفر» بدون تخمين", () => {
    render(<RatingTable ratings={mc.ratings} age={9} />);
    expect(within(screen.getByTestId("rating-gcam")).getByText(ar.know.unavailable)).toBeInTheDocument();
    expect(within(screen.getByTestId("rating-appStore")).getByText(ar.know.unavailable)).toBeInTheDocument();
  });
  it("مقارنة العمر لكل جهة على حدة", () => {
    render(<RatingTable ratings={mc.ratings} age={9} />);
    expect(within(screen.getByTestId("rating-esrb")).getByText(ar.know.above)).toBeInTheDocument();
    expect(within(screen.getByTestId("rating-pegi")).getByText(ar.know.within)).toBeInTheDocument();
    expect(screen.getByTestId("rating-summary")).toHaveTextContent(ar.know.summaryAbove);
  });
  it("كل التصنيفات ناقصة ⇐ «لا يوجد تصنيف متوفر»", () => {
    render(<RatingTable ratings={nd.ratings} age={9} />);
    expect(screen.getAllByText(ar.know.unavailable)).toHaveLength(5);
    expect(screen.getByTestId("rating-summary")).toHaveTextContent(ar.know.summaryNone);
  });
  it("روابط المصادر تفتح بـ noopener noreferrer", () => {
    render(<RatingTable ratings={mc.ratings} age={9} />);
    for (const a of screen.getAllByTestId("source-link")) {
      expect(a).toHaveAttribute("target", "_blank");
      expect(a).toHaveAttribute("rel", "noopener noreferrer");
    }
  });
});

describe("AttentionPoint", () => {
  it("نقطة بلا مصدر ⇐ «ما لقيت» وبدون أي نص", () => {
    render(
      <ol>
        <AttentionPoint pointKey="ads" point={nd.attentionPoints.ads} index={4} isDemo />
      </ol>,
    );
    expect(screen.getByTestId("not-found")).toHaveTextContent(ar.know.notFound);
    expect(screen.queryByTestId("source-link")).toBeNull();
    expect(screen.getByTestId("confidence-none")).toBeInTheDocument();
  });
  it("نقطة بمصدر تعرض النص والمصدر والثقة", () => {
    render(
      <ol>
        <AttentionPoint pointKey="strangerChat" point={mc.attentionPoints.strangerChat} index={1} isDemo />
      </ol>,
    );
    expect(screen.getByText(mc.attentionPoints.strangerChat.summaryAr)).toBeInTheDocument();
    expect(screen.getByTestId("source-link")).toHaveAttribute("rel", "noopener noreferrer");
    expect(screen.getByTestId("confidence-human")).toHaveTextContent(ar.confidence.demoSuffix);
  });
});

describe("ConfidenceBadge", () => {
  it.each(["human", "auto", "none"] as const)("%s", (level) => {
    render(<ConfidenceBadge level={level} />);
    expect(screen.getByTestId(`confidence-${level}`)).toHaveTextContent(ar.confidence[level]);
  });
});

describe("KnowStep", () => {
  it("خمس نقاط بنفس الترتيب دائمًا", () => {
    render(<KnowStep title={nd} age={9} />);
    const ids = within(screen.getByTestId("attention-points"))
      .getAllByRole("listitem")
      .map((li) => li.getAttribute("data-testid"))
      .filter((x) => x?.startsWith("point-"));
    expect(ids).toEqual(["point-strangerChat", "point-purchases", "point-content", "point-ads", "point-sessionPause"]);
  });
});
