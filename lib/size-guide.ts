export type SizeGuideRow = Record<string, string | number>;
export type SizeGuide = {
  columns: { key: string; label: string }[];
  rows: SizeGuideRow[];
  howToMeasure: string[];
};

export const SIZE_GUIDES: Record<string, SizeGuide> = {
  outerwear: {
    columns: [
      { key: "size", label: "Size" },
      { key: "chest", label: "Ngực (cm)" },
      { key: "shoulder", label: "Vai (cm)" },
      { key: "length", label: "Dài áo (cm)" },
    ],
    rows: [
      { size: "S", chest: 100, shoulder: 45, length: 70 },
      { size: "M", chest: 104, shoulder: 47, length: 72 },
      { size: "L", chest: 108, shoulder: 49, length: 74 },
      { size: "XL", chest: 112, shoulder: 51, length: 76 },
    ],
    howToMeasure: [
      "Ngực: đo vòng quanh phần rộng nhất của ngực.",
      "Vai: đo từ đầu vai trái đến đầu vai phải.",
      "Dài áo: đo từ vai xuống gấu áo.",
    ],
  },
  tops: {
    columns: [
      { key: "size", label: "Size" },
      { key: "chest", label: "Ngực (cm)" },
      { key: "shoulder", label: "Vai (cm)" },
      { key: "length", label: "Dài áo (cm)" },
    ],
    rows: [
      { size: "S", chest: 52, shoulder: 44, length: 68 },
      { size: "M", chest: 54, shoulder: 46, length: 70 },
      { size: "L", chest: 56, shoulder: 48, length: 72 },
      { size: "XL", chest: 58, shoulder: 50, length: 74 },
    ],
    howToMeasure: [
      "Ngực: đo vòng quanh phần rộng nhất của ngực.",
      "Vai: đo từ đầu vai trái đến đầu vai phải.",
      "Dài áo: đo từ vai xuống gấu áo.",
    ],
  },
  bottoms: {
    columns: [
      { key: "size", label: "Size" },
      { key: "waist", label: "Vòng eo (cm)" },
      { key: "hip", label: "Vòng mông (cm)" },
      { key: "length", label: "Dài quần (cm)" },
    ],
    rows: [
      { size: "M", waist: 76, hip: 98, length: 98 },
      { size: "L", waist: 80, hip: 102, length: 100 },
    ],
    howToMeasure: [
      "Vòng eo: đo vòng quanh eo, ngay phía trên rốn.",
      "Vòng mông: đo vòng quanh phần rộng nhất của mông.",
      "Dài quần: đo từ đũng quần xuống gấu quần.",
    ],
  },
  footwear: {
    columns: [
      { key: "size", label: "Size (VN)" },
      { key: "footLength", label: "Dài bàn chân (cm)" },
    ],
    rows: [
      { size: "39", footLength: 24.5 },
      { size: "40", footLength: 25 },
      { size: "41", footLength: 25.5 },
      { size: "42", footLength: 26 },
      { size: "43", footLength: 26.5 },
    ],
    howToMeasure: [
      "Đặt chân lên tờ giấy, đánh dấu điểm dài nhất từ gót đến ngón chân dài nhất.",
      "Đo khoảng cách 2 điểm đánh dấu bằng thước — đó là chiều dài bàn chân.",
    ],
  },
};

export function getSizeGuideForCategory(
  categorySlug: string,
): SizeGuide | null {
  return SIZE_GUIDES[categorySlug] ?? null;
}
