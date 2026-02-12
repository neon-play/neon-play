
export async function onRequestGet(context) {
  const { request, params, env } = context;
  const id = params.id;

  const url = new URL(request.url);
  const ts = url.searchParams.get("ts");
  const sig = url.searchParams.get("sig");

  if (!ts || !sig) {
    return new Response("Missing Signature", { status: 403 });
  }

  const now = Math.floor(Date.now() / 1000);
  if (now - parseInt(ts) > 60) {
    return new Response("Expired", { status: 403 });
  }

  const expected = await sha256(id + ts + env.API_SECRET);
  if (expected !== sig) {
    return new Response("Invalid Signature", { status: 403 });
  }

  const { results } = await env.DB.prepare(`
    SELECT episode_number, stream_url, download_url
    FROM episode_links
    WHERE anime_id = ?
    ORDER BY episode_number ASC
  `).bind(id).all();

  const episodeObject = {};

  results.forEach(ep => {
    episodeObject[`E${ep.episode_number}`] = ep.stream_url;
    episodeObject[`D${ep.episode_number}`] = ep.download_url;
  });

  return json(episodeObject);
}

async function sha256(message) {
  const msgUint8 = new TextEncoder().encode(message);
  const hashBuffer = await crypto.subtle.digest("SHA-256", msgUint8);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, "0")).join("");
}

function json(data) {
  return new Response(JSON.stringify(data), {
    headers: {
      "Content-Type": "application/json",
      "Cache-Control": "no-store"
    }
  });
}
