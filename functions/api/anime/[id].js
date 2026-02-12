
export async function onRequestGet(context) {
  const { params, env } = context;
  const id = params.id;

  const anime = await env.DB.prepare(`
    SELECT *
    FROM anime
    WHERE id = ?
  `).bind(id).first();

  if (!anime) {
    return new Response("Not Found", { status: 404 });
  }

  const { results: tags } = await env.DB.prepare(`
    SELECT tag_name FROM anime_tags WHERE anime_id = ?
  `).bind(id).all();

  return json({
    ...anime,
    tags: tags.map(t => t.tag_name)
  });
}

function json(data) {
  return new Response(JSON.stringify(data), {
    headers: {
      "Content-Type": "application/json",
      "Cache-Control": "no-store"
    }
  });
}
