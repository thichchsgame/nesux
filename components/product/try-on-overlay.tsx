"use client";

import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { ArrowLeft, ArrowUpRight, Camera, Check, ImagePlus, Rotate3D, Upload, X } from "lucide-react";

export function TryOnOverlay({ productName, onClose }: { productName: string; onClose: () => void }) {
  const [mode, setMode] = useState<"choose" | "2d" | "3d">("choose");
  const [processing, setProcessing] = useState(false);
  const [complete, setComplete] = useState(false);
  const [uploaded, setUploaded] = useState(false);

  useEffect(() => {
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => { document.body.style.overflow = previousOverflow; };
  }, []);

  function run2D() {
    setUploaded(true);
    setProcessing(true);
    window.setTimeout(() => { setProcessing(false); setComplete(true); }, 1100);
  }

  function reset2D() {
    setMode("choose");
    setComplete(false);
    setUploaded(false);
  }

  return createPortal(
    <div className="fixed inset-0 z-[9999] isolate overflow-y-auto bg-background text-foreground">
      <header className="flex items-center justify-between border-b border-border px-5 py-5 md:px-10">
        <div><p className="text-[10px] uppercase tracking-[0.25em] text-muted-foreground">NEXUS / Virtual fitting room</p><h2 className="font-hand mt-2 text-2xl font-bold uppercase">Try-On / {productName}</h2></div>
        <button type="button" aria-label="Đóng Try-On" onClick={onClose} className="border border-border p-3 hover:bg-foreground/5"><X className="h-5 w-5" /></button>
      </header>
      <main className="mx-auto flex min-h-[calc(100vh-89px)] max-w-[1400px] flex-col gap-8 px-5 py-8 md:px-10 md:py-12">
        {mode === "choose" && <div className="m-auto grid w-full max-w-4xl gap-4 md:grid-cols-2">
          <button type="button" onClick={() => setMode("2d")} className="group border border-border p-7 text-left transition-colors hover:border-foreground/50"><div className="flex items-start justify-between"><Camera className="h-6 w-6" strokeWidth={1.5} /><span className="text-[10px] uppercase tracking-[0.18em]">01 / image</span></div><h3 className="font-hand mt-24 text-4xl font-bold uppercase">2D Try-On</h3><p className="mt-3 max-w-sm text-sm leading-relaxed text-muted-foreground">Tải ảnh chính diện để xem thử {productName} trên dáng người của bạn.</p><span className="mt-8 inline-flex items-center gap-2 text-[10px] uppercase tracking-[0.18em]">Bắt đầu 2D <ArrowUpRight className="h-4 w-4" /></span></button>
          <button type="button" onClick={() => setMode("3d")} className="group border border-border bg-foreground/[0.03] p-7 text-left transition-colors hover:border-foreground/50"><div className="flex items-start justify-between"><Rotate3D className="h-6 w-6" strokeWidth={1.5} /><span className="text-[10px] uppercase tracking-[0.18em]">02 / spatial</span></div><h3 className="font-hand mt-24 text-4xl font-bold uppercase">3D Try-On</h3><p className="mt-3 max-w-sm text-sm leading-relaxed text-muted-foreground">Xoay 360° để xem chi tiết sản phẩm trong không gian 3D.</p><span className="mt-8 inline-flex items-center gap-2 text-[10px] uppercase tracking-[0.18em]">Bắt đầu 3D <ArrowUpRight className="h-4 w-4" /></span></button>
        </div>}
        {mode === "2d" && <div className="mx-auto grid w-full max-w-5xl gap-6 lg:grid-cols-[0.8fr_1.2fr]"><section className="border border-border p-6"><button type="button" onClick={reset2D} className="mb-8 inline-flex items-center gap-2 text-[10px] uppercase tracking-[0.18em] text-muted-foreground"><ArrowLeft className="h-4 w-4" /> Chế độ</button><p className="text-[10px] uppercase tracking-[0.2em] text-muted-foreground">2D / ảnh body</p><h3 className="font-hand mt-3 text-4xl font-bold uppercase">Tải ảnh của bạn</h3><p className="mt-4 text-sm leading-relaxed text-muted-foreground">Chế độ demo — ảnh của bạn không được tải lên hay lưu trữ.</p><label className="mt-8 flex min-h-48 cursor-pointer flex-col items-center justify-center border border-dashed border-border text-center hover:border-foreground/50"><input type="file" accept="image/*" className="sr-only" onChange={run2D} /><ImagePlus className="h-7 w-7 text-muted-foreground" strokeWidth={1.5} /><span className="mt-4 text-[10px] uppercase tracking-[0.16em]">Chọn ảnh</span><span className="mt-2 text-xs text-muted-foreground">JPG / PNG</span></label>{uploaded && <button type="button" onClick={run2D} className="mt-4 flex w-full items-center justify-center gap-2 border border-border py-3 text-[10px] uppercase tracking-[0.18em]">{processing ? "Đang tạo bản xem trước..." : complete ? <><Check className="h-4 w-4" /> Đã sẵn sàng</> : <><Upload className="h-4 w-4" /> Tạo bản xem trước</>}</button>}</section><Preview productName={productName} complete={complete} /></div>}
        {mode === "3d" && <div className="mx-auto grid w-full max-w-5xl gap-6 lg:grid-cols-[1.2fr_0.8fr]"><Preview productName={productName} threeD /><section className="border border-border p-6"><button type="button" onClick={() => setMode("choose")} className="mb-8 inline-flex items-center gap-2 text-[10px] uppercase tracking-[0.18em] text-muted-foreground"><ArrowLeft className="h-4 w-4" /> Chế độ</button><p className="text-[10px] uppercase tracking-[0.2em] text-muted-foreground">3D / xem không gian</p><h3 className="font-hand mt-3 text-4xl font-bold uppercase">{productName}</h3><button type="button" onClick={onClose} className="mt-12 flex w-full items-center justify-center gap-2 bg-foreground py-4 text-[10px] uppercase tracking-[0.18em] text-background">Quay lại sản phẩm <ArrowUpRight className="h-4 w-4" /></button></section></div>}
      </main>
    </div>, document.body,
  );
}

function Preview({ productName, complete = false, threeD = false }: { productName: string; complete?: boolean; threeD?: boolean }) {
  return <section className="relative flex min-h-[520px] items-center justify-center overflow-hidden border border-border bg-card p-8"><div className="absolute inset-0 opacity-20" style={{ backgroundImage: "linear-gradient(var(--foreground) 1px, transparent 1px), linear-gradient(90deg, var(--foreground) 1px, transparent 1px)", backgroundSize: "48px 48px" }} /><div className={`relative flex h-[390px] w-[240px] items-center justify-center border border-border bg-foreground/10 ${threeD ? "-rotate-3" : ""}`}><div className="h-[310px] w-[150px] border-x border-border bg-foreground/[0.08]" /><span className="absolute bottom-5 left-5 text-[9px] uppercase tracking-[0.16em] text-muted-foreground">{threeD ? "3D garment preview / demo" : complete ? "AI fit preview / demo" : "Preview canvas"}</span></div><div className="absolute right-5 top-5 text-right text-[9px] uppercase tracking-[0.16em] text-muted-foreground">{productName}</div></section>;
}
