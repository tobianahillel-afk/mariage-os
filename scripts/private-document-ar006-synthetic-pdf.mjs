import { Buffer } from "node:buffer";

export function createExactPdf(exactBytes) {
  const header = Buffer.from("%PDF-1.4\n", "ascii");
  const objectOne = Buffer.from(
    "1 0 obj\n<< /Type /Catalog /Pages 2 0 R >>\nendobj\n",
    "ascii",
  );
  const objectTwo = Buffer.from(
    "2 0 obj\n<< /Type /Pages /Kids [3 0 R] /Count 1 >>\nendobj\n",
    "ascii",
  );
  const objectThree = Buffer.from(
    "3 0 obj\n<< /Type /Page /Parent 2 0 R /MediaBox [0 0 1 1] >>\nendobj\n",
    "ascii",
  );

  function build(paddingBytes) {
    const padding = Buffer.alloc(paddingBytes, 0x41);
    if (paddingBytes >= 2) {
      padding[0] = 0x25;
      padding[paddingBytes - 1] = 0x0a;
    }
    const offsetOne = header.length + padding.length;
    const offsetTwo = offsetOne + objectOne.length;
    const offsetThree = offsetTwo + objectTwo.length;
    const xrefOffset = offsetThree + objectThree.length;
    const xref = Buffer.from(
      `xref\n0 4\n0000000000 65535 f \n${String(offsetOne).padStart(10, "0")} 00000 n \n${String(offsetTwo).padStart(10, "0")} 00000 n \n${String(offsetThree).padStart(10, "0")} 00000 n \ntrailer\n<< /Size 4 /Root 1 0 R >>\nstartxref\n${xrefOffset}\n%%EOF\n`,
      "ascii",
    );
    return Buffer.concat([
      header,
      padding,
      objectOne,
      objectTwo,
      objectThree,
      xref,
    ]);
  }

  let paddingBytes = exactBytes - build(0).length;
  for (let attempt = 0; attempt < 4; attempt += 1) {
    const pdf = build(paddingBytes);
    if (pdf.length === exactBytes) return pdf;
    paddingBytes += exactBytes - pdf.length;
  }
  throw new Error("Unable to construct an exact-size synthetic PDF.");
}
