const THUMBNAIL_WIDTH = 280;

export async function generatePdfThumbnail(pdf: any): Promise<string | undefined> {
  if (typeof document === "undefined") {
    return undefined;
  }

  try {
    const firstPage = await pdf.getPage(1);
    const sourceViewport = firstPage.getViewport({ scale: 1.0 });
    const scale = THUMBNAIL_WIDTH / sourceViewport.width;
    const viewport = firstPage.getViewport({ scale: Math.max(scale, 0.1) });

    const canvas = document.createElement("canvas");
    const context = canvas.getContext("2d");
    if (!context) {
      return undefined;
    }

    canvas.width = Math.max(1, Math.floor(viewport.width));
    canvas.height = Math.max(1, Math.floor(viewport.height));

    await firstPage.render({ canvasContext: context, viewport }).promise;
    return canvas.toDataURL("image/jpeg", 0.72);
  } catch {
    return undefined;
  }
}
