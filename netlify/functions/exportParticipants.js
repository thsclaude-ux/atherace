const XLSX = require("xlsx-js-style");
const { verifyAdmin } = require("./_lib/verify-admin");
const { dataRoot } = require("./_lib/data-root");
const { handleOptions, json, corsHeaders } = require("./_lib/http");
const { wrapHandler } = require("./_lib/wrap-handler");
const { ROUNDS } = require("./_lib/scoring");
const {
  HEADERS,
  CODE_COL,
  PHONE_COL,
  buildExportRows,
} = require("./_lib/participants-export");

const HEADER_STYLE = {
  font: { bold: true, name: "Arial" },
  fill: { patternType: "solid", fgColor: { rgb: "FFE0E0E0" } },
  alignment: { horizontal: "center", vertical: "center", wrapText: true },
};

const TEXT_STYLE = { alignment: { horizontal: "right" } };

function applySheetFormatting(ws, rowCount) {
  const range = XLSX.utils.decode_range(ws["!ref"]);

  for (let c = 0; c <= range.e.c; c++) {
    const addr = XLSX.utils.encode_cell({ r: 0, c });
    if (!ws[addr]) ws[addr] = { v: HEADERS[c], t: "s" };
    ws[addr].s = HEADER_STYLE;
  }

  for (let r = 1; r <= rowCount; r++) {
    const phoneAddr = XLSX.utils.encode_cell({ r, c: PHONE_COL });
    if (ws[phoneAddr]) {
      ws[phoneAddr].t = "s";
      ws[phoneAddr].v = String(ws[phoneAddr].v ?? "");
      ws[phoneAddr].z = "@";
      ws[phoneAddr].s = { ...TEXT_STYLE, numFmt: "@" };
    }
    const codeAddr = XLSX.utils.encode_cell({ r, c: CODE_COL });
    if (ws[codeAddr]?.v) {
      ws[codeAddr].t = "s";
      ws[codeAddr].v = String(ws[codeAddr].v);
      ws[codeAddr].z = "@";
    }
  }

  ws["!cols"] = [
    { wch: 18 },
    ...Array.from({ length: ROUNDS }, () => ({ wch: 9 })),
    { wch: 8 },
    { wch: 20 },
    { wch: 14 },
    { wch: 14 },
  ];
}

function buildWorkbook(dataRows) {
  const aoa = [HEADERS, ...dataRows];
  const ws = XLSX.utils.aoa_to_sheet(aoa);
  applySheetFormatting(ws, dataRows.length);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, "المشاركون");
  return XLSX.write(wb, { type: "buffer", bookType: "xlsx", cellStyles: true });
}

function fileTimestamp() {
  const d = new Date();
  const pad = (n) => String(n).padStart(2, "0");
  return `${d.getFullYear()}${pad(d.getMonth() + 1)}${pad(d.getDate())}_${pad(d.getHours())}${pad(d.getMinutes())}${pad(d.getSeconds())}`;
}

/**
 * POST /.netlify/functions/exportParticipants
 * Authorization: Bearer <Firebase ID Token> — مسؤول فقط
 */
exports.handler = wrapHandler(async (event) => {
  const opt = handleOptions(event);
  if (opt) return opt;

  if (event.httpMethod !== "POST") {
    return json(405, { error: "Method not allowed" }, event);
  }

  const admin = await verifyAdmin(event);
  if (!admin.ok) {
    return json(admin.status, { error: admin.error }, event);
  }

  try {
    const root = dataRoot();
    const [participantsSnap, betsSnap, codesSnap] = await Promise.all([
      root.child("participants").once("value"),
      root.child("user_bets").once("value"),
      root.child("codes").once("value"),
    ]);

    const dataRows = buildExportRows(
      participantsSnap.val(),
      betsSnap.val(),
      codesSnap.val()
    );

    const buffer = buildWorkbook(dataRows);
    const filename = `participants_export_${fileTimestamp()}.xlsx`;

    return {
      statusCode: 200,
      headers: {
        "Content-Type":
          "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        "Content-Disposition": `attachment; filename="${filename}"`,
        ...corsHeaders(event),
      },
      body: buffer.toString("base64"),
      isBase64Encoded: true,
    };
  } catch (err) {
    console.error("exportParticipants:", err);
    return json(500, { error: "خطأ في تصدير البيانات" }, event);
  }
});
