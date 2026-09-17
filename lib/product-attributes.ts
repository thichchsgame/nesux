export type AttributeDef = {
  key: string;
  label: string;
  type: "text" | "number" | "boolean";
  unit?: string;
};

export const CATEGORY_ATTRIBUTES: Record<string, AttributeDef[]> = {
  outerwear: [
    { key: "fit", label: "Fit", type: "text" },
    { key: "fabric", label: "Chất liệu", type: "text" },
    { key: "weight", label: "Trọng lượng", type: "number", unit: "g" },
    { key: "waterResistance", label: "Chống nước", type: "boolean" },
    { key: "pockets", label: "Số túi", type: "number" },
    { key: "origin", label: "Xuất xứ", type: "text" },
  ],
  tops: [
    { key: "fit", label: "Fit", type: "text" },
    { key: "fabric", label: "Chất liệu", type: "text" },
    { key: "weight", label: "Trọng lượng", type: "number", unit: "g" },
    { key: "origin", label: "Xuất xứ", type: "text" },
  ],
  bottoms: [
    { key: "fit", label: "Fit", type: "text" },
    { key: "fabric", label: "Chất liệu", type: "text" },
    { key: "waistType", label: "Kiểu lưng", type: "text" },
    { key: "pockets", label: "Số túi", type: "number" },
    { key: "origin", label: "Xuất xứ", type: "text" },
  ],
  footwear: [
    { key: "fit", label: "Fit", type: "text" },
    { key: "upperMaterial", label: "Thân giày", type: "text" },
    { key: "liningMaterial", label: "Lót giày", type: "text" },
    { key: "outsoleMaterial", label: "Đế giày", type: "text" },
    { key: "closure", label: "Kiểu đóng", type: "text" },
    { key: "weight", label: "Trọng lượng", type: "number", unit: "g" },
    { key: "origin", label: "Xuất xứ", type: "text" },
  ],
  accessories: [
    { key: "material", label: "Chất liệu", type: "text" },
    { key: "accessoryType", label: "Loại phụ kiện", type: "text" },
    { key: "hatType", label: "Kiểu mũ", type: "text" },
    { key: "adjustable", label: "Điều chỉnh size", type: "boolean" },
    { key: "capacity", label: "Dung tích", type: "text" },
    { key: "strapType", label: "Loại quai", type: "text" },
    { key: "origin", label: "Xuất xứ", type: "text" },
  ],
};

export function getAttributeDefsForCategory(
  categorySlug: string,
): AttributeDef[] {
  return CATEGORY_ATTRIBUTES[categorySlug] ?? [];
}

export function formatAttributeValue(
  definition: AttributeDef,
  rawValue: unknown,
): string | null {
  if (rawValue === undefined || rawValue === null || rawValue === "")
    return null;
  if (definition.type === "boolean") {
    if (rawValue === true || rawValue === "true") return "Có";
    if (rawValue === false || rawValue === "false") return "Không";
    return null;
  }
  if (definition.type === "number") {
    const n = Number(rawValue);
    if (!Number.isFinite(n)) return null;
    return `${n}${definition.unit ?? ""}`;
  }
  return String(rawValue);
}
