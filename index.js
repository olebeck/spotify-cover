var client_id = "840b32ef33764217a79d9ae97bef3c07";
var redirect_uri = location.protocol + "//" + location.location.host + location.location.pathname;
var scope = "user-read-playback-state";

var api = new spotifyapi(client_id, redirect_uri, scope);
var coverdiv = document.querySelector(".cover");
var bgdiv = document.querySelector(".background")
var coverlink;

function updatecover(url) {
    coverdiv.setAttribute("src",url);
    bgdiv.setAttribute("src",url);
}

setInterval(async () => {
    if(Document.hidden) return;
    var resp = await api.fetchWithToken("https://api.spotify.com/v1/me/player/currently-playing");
    if(!resp.item) return;
    coverlink = resp.item.album.images[0].url;
    if(coverlink != coverdiv.getAttribute("src"))
        updatecover(coverlink);
},1000);