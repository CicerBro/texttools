export function downloadText(filename: string, text: string, lineEnding: "lf" | "crlf"): void {
  const data = lineEnding === "crlf" ? text.replace(/\n/g, "\r\n") : text;
  const blob = new Blob([data], { type: "text/plain;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename.trim() || "output.txt";
  link.click();
  URL.revokeObjectURL(url);
}

export async function readTextFile(file: File): Promise<string> {
  return file.text();
}
