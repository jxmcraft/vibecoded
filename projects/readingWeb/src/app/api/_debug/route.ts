export async function POST(request: Request) {
  try {
    const body = await request.json();
    try {
      const { appendFile } = await import("node:fs/promises");
      await appendFile(
        "/Users/jeromeparungao/vibecoded/vibecoded/.cursor/debug-c1ddfd.log",
        `${JSON.stringify(body)}\n`,
        "utf8"
      );
    } catch {
      // ignore file write failures
    }

    await fetch("http://127.0.0.1:7578/ingest/fb015a75-7408-4825-9bd4-f88cd88246cc", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-Debug-Session-Id": "c1ddfd"
      },
      body: JSON.stringify(body)
    });
  } catch {
    // swallow
  }

  return new Response(null, { status: 204 });
}

