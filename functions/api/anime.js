export async function onRequestGet(context) {
  const { request, env } = context;
  const url = new URL(request.url);

  const page = Math.max(parseInt(url.searchParams.get("page") || "1"), 1);
  const limit = 20;
  const offset = (page - 1) * limit;

  const { results } = await env.DB.prepare(`
    SELECT id, title, year, type, image, duration, rating
    FROM anime
    LIMIT ? OFFSET ?
  `).bind(limit, offset).all();

  return json(results);
}

function json(data) {
  return new Response(JSON.stringify(data), {
    headers: {
      "Content-Type": "application/json",
      "Cache-Control": "no-store"
    }
  });
}
