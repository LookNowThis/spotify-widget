// version 2 – final working build

const clientId = "027bc5b56c5f428f8e7dff33d28695d1";
const redirectUri = "https://looknowthis.github.io/spotify-widget/";

function generateCodeVerifier() {
    const array = new Uint32Array(56);
    crypto.getRandomValues(array);
    return Array.from(array, dec => ('0' + dec.toString(16)).substr(-2)).join('');
}

async function generateCodeChallenge(codeVerifier) {
    const data = new TextEncoder().encode(codeVerifier);
    const digest = await crypto.subtle.digest("SHA-256", data);
    return btoa(String.fromCharCode(...new Uint8Array(digest)))
        .replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

document.getElementById("login").onclick = async () => {
    const codeVerifier = generateCodeVerifier();
    const codeChallenge = await generateCodeChallenge(codeVerifier);

    localStorage.setItem("code_verifier", codeVerifier);

    const url = "https://accounts.spotify.com/authorize?" +
        new URLSearchParams({
            response_type: "code",
            client_id: clientId,
            scope: "user-read-currently-playing user-read-recently-played",
            redirect_uri: redirectUri,
            code_challenge_method: "S256",
            code_challenge: codeChallenge
        });

    window.location = url;
};

async function getAccessToken(code) {
    const codeVerifier = localStorage.getItem("code_verifier");

    const body = new URLSearchParams({
        grant_type: "authorization_code",
        code: code,
        redirect_uri: redirectUri,
        client_id: clientId,
        code_verifier: codeVerifier
    });

    const response = await fetch("https://accounts.spotify.com/api/token", {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body
    });

    return response.json();
}

async function loadTrack(token) {
    const res = await fetch("https://api.spotify.com/v1/me/player/currently-playing", {
        headers: { Authorization: `Bearer ${token}` }
    });

    if (res.status === 204) {
        document.getElementById("title").innerText = "Nothing playing";
        return;
    }

    const data = await res.json();
    document.getElementById("track").classList.remove("hidden");
    document.getElementById("cover").src = data.item.album.images[0].url;
    document.getElementById("title").innerText = data.item.name;
    document.getElementById("artist").innerText = data.item.artists.map(a => a.name).join(", ");
}

(async () => {
    const params = new URLSearchParams(window.location.search);
    const code = params.get("code");

    if (code) {
        const tokenData = await getAccessToken(code);
        await loadTrack(tokenData.access_token);
    }
})();
