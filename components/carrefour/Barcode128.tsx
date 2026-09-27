"use client";

import React, { useMemo } from "react";

/* ===================================================================== */

const CODE128_PATTERNS: string[] = [
  "212222", "222122", "222221", "121223", "121322", "131222", "122213", "122312", "132212", "221213",
  "221312", "231212", "112232", "122132", "122231", "113222", "123122", "123221", "223211", "221132",
  "221231", "213212", "223112", "312131", "311222", "321122", "321221", "312212", "322112", "322211",
  "212123", "212321", "232121", "111323", "131123", "131321", "112313", "132113", "132311", "211313",
  "231113", "231311", "112133", "112331", "132131", "113123", "113321", "133121", "313121", "211331",
  "231131", "213113", "213311", "213131", "311123", "311321", "331121", "312113", "312311", "332111",
  "314111", "221411", "431111", "111224", "111422", "121124", "121421", "141122", "141221", "112214",
  "112412", "122114", "122411", "142112", "142211", "241211", "221114", "413111", "241112", "134111",
  "111242", "121142", "121241", "114212", "124112", "124211", "411212", "421112", "421211", "212141",
  "214121", "412121", "111143", "111341", "131141", "114113", "114311", "411113", "411311", "113141",
  "114131", "311141", "411131", "211412", "211214", "211232", "2331112"
];

const START_B = 104;
const STOP = 106;

/* ===================================================================== */

function encodeCode128B(text: string): string {
  const clean = text.replace(/[^\x20-\x7E]/g, "");
  if (!clean) return "";

  const indices: number[] = [START_B];
  let checkSum = START_B;

  for (let i = 0; i < clean.length; i++) {
    const val = clean.charCodeAt(i) - 32;
    indices.push(val);
    checkSum += val * (i + 1);
  }

  indices.push(checkSum % 103);
  indices.push(STOP);

  let patternSequence = "";
  for (const idx of indices) {
    if (idx >= 0 && idx < CODE128_PATTERNS.length) {
      patternSequence += CODE128_PATTERNS[idx];
    }
  }

  let binary = "";
  let isBar = true;
  for (let i = 0; i < patternSequence.length; i++) {
    const count = parseInt(patternSequence[i], 10);
    binary += (isBar ? "1" : "0").repeat(count);
    isBar = !isBar;
  }

  return binary;
}

/* ===================================================================== */

interface BarcodeProps {
  value: string;
  width?: number;
  height?: number;
  className?: string;
}

/* ===================================================================== */

export default function Barcode128({ value, height = 70, className = "" }: BarcodeProps) {
  const binary = useMemo(() => encodeCode128B(value || ""), [value]);

  if (!binary) {
    return null;
  }

  const barWidth = 2;
  const quietZone = 20;
  const totalWidth = binary.length * barWidth + quietZone * 2;
  const totalHeight = height + 30;

  const rects: { x: number; width: number }[] = [];
  let currentX = quietZone;
  let inBar = false;
  let barStart = 0;

  for (let i = 0; i < binary.length; i++) {
    const bit = binary[i];
    if (bit === "1" && !inBar) {
      inBar = true;
      barStart = currentX;
    } else if (bit === "0" && inBar) {
      inBar = false;
      rects.push({ x: barStart, width: currentX - barStart });
    }
    currentX += barWidth;
  }
  if (inBar) {
    rects.push({ x: barStart, width: currentX - barStart });
  }

  return (
    <div className={`flex flex-col items-center bg-white p-3 rounded-2xl shadow-inner ${className}`}>
      <svg
        viewBox={`0 0 ${totalWidth} ${totalHeight}`}
        className="w-full max-w-[340px] h-auto"
        preserveAspectRatio="xMidYMid meet"
      >
        <rect width={totalWidth} height={totalHeight} fill="#FFFFFF" />
        {rects.map((r, idx) => (
          <rect
            key={idx}
            x={r.x}
            y={10}
            width={r.width}
            height={height}
            fill="#000000"
          />
        ))}
        <text
          x={totalWidth / 2}
          y={height + 24}
          textAnchor="middle"
          fontSize="13"
          fontFamily="monospace"
          fontWeight="bold"
          fill="#111827"
          letterSpacing="2"
        >
          {value}
        </text>
      </svg>
    </div>
  );
}
