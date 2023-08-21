const wait = async(t) => { return new Promise((resolve, _) => setTimeout(resolve, t)); }


const default_blur = 20;
let G_blur = default_blur;

// set blur in css, the url
function set_blur(blur) {
    document.body.style.setProperty("--blur", blur + "px");
    const url = new URL(location.href);
    const params = new URLSearchParams(url.hash.slice(1));
    params.set("blur", blur);
    url.hash = params.toString();
    history.replaceState({blur}, "", url.toString());
}

// update blur when user scrolls
document.addEventListener("wheel", ev => {
    G_blur += ev.deltaY / 100;
    G_blur = Math.max(G_blur, 0);
    set_blur(G_blur);
});

let G_background = false
async function parse_url() {
    const url_params = new URLSearchParams(location.hash.slice(1));

    // blur
    G_blur = Number(url_params.get("blur") ?? G_blur);
    G_blur = isNaN(G_blur) ? default_blur : G_blur;
    set_blur(G_blur);

    // enable running in background
    G_background = url_params.get("background") != null;
}


let image_url = null; // blob url for the image

// update url of the image thats hidden
async function updatecover(url, title, onlyTitle) {
    if(!onlyTitle) {
        const image_blob = await (await fetch(url)).blob();
        if(image_url) URL.revokeObjectURL(image_url);
        image_url = URL.createObjectURL(image_blob);

        const inactive = document.querySelector(".view.transparent");
        const active = document.querySelector(".view:not(.transparent)");
        for (const cover of inactive.querySelectorAll(".cover")) {
            cover.src = image_url;
        }

        // swap
        inactive.classList.remove("transparent");
        active.classList.add("transparent");
    }
    // title
    const inactive = document.querySelector(".title.transparent");
    const active = document.querySelector(".title:not(.transparent)");
    inactive.innerText = title;
    inactive.classList.remove("transparent");
    active.classList.add("transparent");
}

async function spotify_currently_playing() {
    const resp = await api.fetchWithToken("https://api.spotify.com/v1/me/player/currently-playing")
        .catch(e => console.error(e));
    return resp;
}

async function get_url_spotify() {
    const resp = await spotify_currently_playing();
    const item = resp?.item;
    if(!item) return null;
    const coverUrl = item.album.images[0]?.url;
    const title = item.name;
    return {
        coverUrl, title
    };
}


// spotify
const ClientId = "840b32ef33764217a79d9ae97bef3c07";
const RedirectUri = `${location.protocol}//${location.host}${location.pathname}`;
const scope = "user-read-playback-state";
const api = new spotifyapi(ClientId, RedirectUri, scope, "cover");

(async () => {
    await api.login();
    await parse_url();

    let last_playing = {};
    while(true) {
        await wait(1000);
        if (document.hidden && !G_background) continue;
        const currently_playing = await get_url_spotify();
        if(currently_playing) {
            const changedCover = currently_playing.coverUrl != last_playing.coverUrl;
            const changedTitle = currently_playing.title != last_playing.title;
            if(changedCover || changedTitle) {
                last_playing = currently_playing;
                await updatecover(currently_playing.coverUrl, currently_playing.title, !changedCover);
            }
        }
    }
})();
