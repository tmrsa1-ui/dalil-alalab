import { render, screen, fireEvent } from "@testing-library/react";
import file from "@data/agreement.json";
import { agreementFileSchema } from "@schemas/agreement";
import { createAgreementStore } from "@/lib/agreement/store";
import { AgreementFlow } from "@/components/AgreementFlow";
import { ar } from "@/lib/i18n/ar";

vi.mock("next/navigation", () => ({ useRouter: () => ({ push: vi.fn() }) }));

const a = agreementFileSchema.parse(file);
/** الـlabel فيه أيقونة قبل النص. */
const opt = (text: string) => screen.getByLabelText(new RegExp(`^\\S+${text}$`, "u"));
const title = { slug: "minecraft", nameAr: "ماين كرافت", isDemo: true };

describe("AgreementFlow", () => {
  it("الطفل ما يشوف اختيارات الأب في أي لحظة", () => {
    const store = createAgreementStore(a, "7to12");
    render(<AgreementFlow store={store} file={a} title={title} />);
    // الأب يختار
    fireEvent.click(opt("ساعة يوميًا بعد الواجبات"));
    fireEvent.click(opt("لا أحد — المحادثة مقفلة"));
    fireEvent.click(opt("بإذن، كل مرة"));
    fireEvent.click(screen.getByRole("button", { name: ar.steps.next }));
    // شاشة التسليم: ما فيها أي خيار
    expect(screen.getByTestId("handoff-child")).toBeInTheDocument();
    expect(screen.queryAllByRole("radio")).toHaveLength(0);
    fireEvent.click(screen.getByRole("button", { name: ar.agree.handoffReady }));
    // واجهة الطفل: ولا خيار محدد مسبقًا، ولا نص من صياغات الأب
    const radios = screen.getAllByRole("radio") as HTMLInputElement[];
    expect(radios.every((r) => !r.checked)).toBe(true);
    expect(screen.queryByText("ساعة يوميًا بعد الواجبات")).toBeNull();
    expect(screen.queryByText(ar.agree.parentTurn)).toBeNull();
    // ولا زر رجوع لشاشة الأب
    expect(screen.queryByRole("button", { name: ar.steps.prev })).toBeNull();
  });

  it("أقل من 7 يتخطى التسليم عند اختيار «أقرر أنا»", () => {
    const store = createAgreementStore(a, "under7");
    render(<AgreementFlow store={store} file={a} title={title} />);
    fireEvent.click(screen.getByRole("button", { name: ar.agree.under7ParentOnly }));
    fireEvent.click(opt("نص ساعة يوميًا بعد الواجبات"));
    fireEvent.click(opt("لا أحد — المحادثة مقفلة"));
    fireEvent.click(opt("لا شي — المشتريات مقفلة"));
    fireEvent.click(screen.getByRole("button", { name: ar.steps.next }));
    expect(screen.queryByTestId("handoff-child")).toBeNull();
    expect(screen.getByTestId("agree-result")).toBeInTheDocument();
  });

  it("ما يحفظ بدون التزام من الأب", () => {
    const store = createAgreementStore(a, "under7");
    store.getState().chooseMode(false);
    store.getState().setParent("when", "when-30m");
    store.getState().setParent("talk", "talk-none");
    store.getState().setParent("purchases", "buy-none");
    store.getState().finishParent();
    render(<AgreementFlow store={store} file={a} title={title} />);
    fireEvent.click(screen.getByRole("button", { name: new RegExp(ar.agree.save) }));
    expect(screen.getByText(ar.agree.needCommitment)).toBeInTheDocument();
    expect(localStorage.getItem("dalil.charter")).toBeNull();
  });
});
