import fetch from "node-fetch";
import fs from "fs";

const {
  SPOTIFY_CLIENT_ID,
  SPOTIFY_CLIENT_SECRET,
  SPOTIFY_REFRESH_TOKEN,
} = process.env;

async function getAccessToken() {
  const params = new URLSearchParams();
  params.append("grant_type", "refresh_token");
  params.append("refresh_token", SPOTIFY_REFRESH_TOKEN);
  params.append("client_id", SPOTIFY_CLIENT_ID);
  params.append("client_secret", SPOTIFY_CLIENT_SECRET);

  const response = await fetch("https://accounts.spotify.com/api/token", {
    method: "POST",
    body: params,
  });

  const data = await response.json();
  return data.access_token;
}

async function getNowPlaying(accessToken) {
  const response = await fetch(
    "https://api.spotify.com/v1/me/player/currently-playing",
    {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    }
  );

  if (response.status === 204 || response.status > 400) {
    return null;
  }

  return await response.json();
}

function generateSVG(song) {
  if (!song) {
    return `
<svg width="450" height="120" xmlns="http://www.w3.org/2000/svg">
  <rect width="450" height="120" fill="#1DB954"/>
  <text x="20" y="70" font-size="28" fill="#ffffff">Not playing anything</text>
</svg>`;
  }

  const title = song.item.name;
  const artist = song.item.artists.map((a) => a.name).join(", ");

  return `
<svg width="450" height="120" xmlns="http://www.w3.org/2000/svg">
  <rect width="450" height="120" fill="#1DB954"/>
  <text x="20" y="50" font-size="22" fill="#ffffff">${title}</text>
  <text x="20" y="85" font-size="18" fill="#ffffff">${artist}</text>
</svg>`;
}

async function main() {
  const accessToken = await getAccessToken();
  const song = await getNowPlaying(accessToken);
  const svg = generateSVG(song);

  fs.writeFileSync("now-playing.svg", svg);
}

main();
