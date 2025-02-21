export async function GET(request) {
  const forwarded = request.headers.get("x-forwarded-for");
  const ip = forwarded
    ? forwarded.split(",")[0]
    : request.headers.get("x-real-ip");

  return new Response(JSON.stringify({ ip: ip || "unknown" }), {
    headers: { "Content-Type": "application/json" },
  });
}
