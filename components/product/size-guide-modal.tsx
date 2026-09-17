"use client";

import { useState } from "react";
import type { SizeGuide } from "@/lib/size-guide";

export function SizeGuideModal({ guide }: { guide: SizeGuide }) {
  const [open, setOpen] = useState(false);

  return <>
    <button type="button" onClick={() => setOpen(true)} className="text-xs underline text-muted-foreground font-mono">📏 Hướng dẫn chọn size</button>
    {open && <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4" onClick={() => setOpen(false)}>
      <div role="dialog" aria-modal="true" aria-labelledby="size-guide-title" className="bg-background max-w-lg w-full p-6 max-h-[85vh] overflow-y-auto" onClick={(event) => event.stopPropagation()}>
        <div className="flex justify-between items-center mb-4"><h3 id="size-guide-title" className="font-hand text-xl">Hướng dẫn chọn size</h3><button type="button" onClick={() => setOpen(false)} aria-label="Đóng hướng dẫn chọn size" className="text-muted-foreground">✕</button></div>
        <table className="w-full text-sm mb-6"><thead><tr className="border-b border-dashed border-border text-left font-mono text-xs text-muted-foreground">{guide.columns.map((column) => <th key={column.key} className="pb-2 font-normal">{column.label}</th>)}</tr></thead><tbody>{guide.rows.map((row, index) => <tr key={index} className="border-b border-dashed border-border">{guide.columns.map((column) => <td key={column.key} className="py-2">{row[column.key]}</td>)}</tr>)}</tbody></table>
        <p className="font-mono text-xs text-muted-foreground mb-2">CÁCH ĐO</p><ul className="text-sm text-muted-foreground space-y-1 list-disc pl-4">{guide.howToMeasure.map((line, index) => <li key={index}>{line}</li>)}</ul>
      </div>
    </div>}
  </>;
}
