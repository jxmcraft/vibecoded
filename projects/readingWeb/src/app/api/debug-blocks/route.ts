import { NextRequest, NextResponse } from "next/server";

// This endpoint receives block data for debugging
export async function POST(request: NextRequest) {
  try {
    const data = await request.json();
    console.log("=== DEBUG: TEXT BLOCKS ===");
    console.log(`Total blocks: ${data.blocks?.length || 0}`);
    
    // Log first 20 blocks with their coordinates
    if (data.blocks && Array.isArray(data.blocks)) {
      data.blocks.slice(0, 20).forEach((block: any, idx: number) => {
        console.log(
          `Block ${idx}: page=${block.pageIndex} y=${block.y?.toFixed(1)} x=${block.x?.toFixed(1)} h=${block.height?.toFixed(1)} w=${block.width?.toFixed(1)} text="${block.text}"`
        );
      });
    }

    // Log lines
    if (data.lines && Array.isArray(data.lines)) {
      console.log(`\n=== GROUPED LINES ===`);
      data.lines.slice(0, 10).forEach((line: any, idx: number) => {
        const blockTexts = line.blocks.map((b: any) => `"${b.text}"`).join(" + ");
        console.log(
          `Line ${idx}: avgY=${line.avgY?.toFixed(1)} blocks=[${blockTexts}]`
        );
      });
    }

    console.log("=== END DEBUG ===\n");

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Debug endpoint error:", error);
    return NextResponse.json({ error: String(error) }, { status: 500 });
  }
}
