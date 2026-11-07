// Render plain text onto canvas: no HTML injection, external resources or invite token.
export async function downloadShareImage(title: string, lines: string[], filename: string) {
  await document.fonts.ready;
  const canvas = document.createElement("canvas"), ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("อุปกรณ์นี้ไม่รองรับการสร้างภาพ");
  const width = 1080, padding = 64, lineHeight = 52;
  const font = getComputedStyle(document.body).fontFamily;
  ctx.font = `30px ${font}`;
  const wrapped: string[] = [];
  for (const line of lines) {
    let row = "";
    for (const char of Array.from(line)) {
      if (ctx.measureText(row + char).width > width - padding * 2) { wrapped.push(row); row = char; } else row += char;
    }
    wrapped.push(row);
  }
  // Split long plans into numbered images to avoid device canvas limits.
  for (let offset = 0; offset < Math.max(1, wrapped.length); offset += 30) {
    const page = wrapped.slice(offset, offset + 30);
    canvas.width = width; canvas.height = 280 + page.length * lineHeight;
    ctx.fillStyle = "#fffaf0"; ctx.fillRect(0, 0, width, canvas.height);
    ctx.fillStyle = "#e85a2c"; ctx.font = `500 38px ${font}`; ctx.fillText("GoGun · ไปกัน", padding, 78);
    ctx.fillStyle = "#14110d"; ctx.font = `500 34px ${font}`;
    ctx.fillText(title, padding, 148, width - padding * 2);
    ctx.font = `30px ${font}`;
    page.forEach((line, i) => ctx.fillText(line, padding, 218 + i * lineHeight));
    ctx.font = `22px ${font}`; ctx.fillStyle = "#625c51";
    ctx.fillText(`สรุป ณ ${new Date().toLocaleString("th-TH")} · ${offset / 30 + 1}`, padding, canvas.height - 28);
    const blob = await new Promise<Blob>((resolve, reject) => canvas.toBlob(b => b ? resolve(b) : reject(new Error("สร้างภาพไม่สำเร็จ")), "image/png"));
    const url = URL.createObjectURL(blob), a = document.createElement("a"); a.href = url; a.download = `${filename}-${offset / 30 + 1}.png`; a.click(); setTimeout(() => URL.revokeObjectURL(url), 30000);
  }
}
