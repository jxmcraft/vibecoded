export async function computeDocumentId(file: File): Promise<string> {
  const data = await file.arrayBuffer();
  const hashBuffer = await crypto.subtle.digest("SHA-256", data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  const hashHex = hashArray.map((value) => value.toString(16).padStart(2, "0")).join("");
  return `${file.name}-${hashHex.slice(0, 16)}`;
}
