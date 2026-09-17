import Link from "next/link";
import { QuestionRowActions } from "@/components/admin/question-row-actions";
import { listQuestionsForAdmin } from "@/lib/questions";

export default async function AdminQuestionsPage() {
  const { questions, total } = await listQuestionsForAdmin();
  return <div>
    <p className="text-sm text-muted-foreground mb-6">{total} câu hỏi</p>
    {questions.length === 0 ? <p className="text-sm text-muted-foreground">Chưa có câu hỏi nào.</p> : <div className="overflow-x-auto"><table className="w-full text-sm">
      <thead><tr className="border-b border-dashed border-border text-left text-muted-foreground font-mono text-xs"><th className="pb-3 font-normal">Sản phẩm</th><th className="pb-3 font-normal">Người hỏi</th><th className="pb-3 font-normal">Câu hỏi</th><th className="pb-3 font-normal">Trạng thái</th><th className="pb-3 font-normal">Thao tác</th></tr></thead>
      <tbody>{questions.map((question) => <tr key={question.id} className="border-b border-dashed border-border align-top"><td className="py-3"><Link href={`/products/${question.product.slug}`} className="underline">{question.product.name}</Link></td><td className="py-3">{question.user.name ?? question.user.email}</td><td className="py-3 max-w-xs"><p className="text-muted-foreground whitespace-pre-line">{question.question}</p>{question.answer && <p className="mt-1 text-xs font-mono text-accent whitespace-pre-line">NEXUS: {question.answer}</p>}</td><td className="py-3"><span className={`font-mono text-xs ${question.status === "PUBLISHED" ? "text-accent" : "text-muted-foreground"}`}>{question.status === "PUBLISHED" ? "Đang hiện" : "Đã ẩn"}</span></td><td className="py-3"><QuestionRowActions questionId={question.id} status={question.status} answer={question.answer} /></td></tr>)}</tbody>
    </table></div>}
  </div>;
}
