const ClientId = "840b32ef33764217a79d9ae97bef3c07";
const RedirectUri = location.protocol + "//" + location.host + location.pathname;
const scope = "user-read-playback-state";
const api = new spotifyapi(ClientId, RedirectUri, scope);


const wait = async(t) => { return new Promise((resolve, reject) => setTimeout(resolve, t)); }


/*  event handler for image being fully loaded
    this starts the transition to the new loaded image
*/
function loaded_new(event) {
    var active = document.querySelectorAll(".view:not(.transparent)");
    var inactive = document.querySelectorAll(".view.transparent");

    inactive.forEach(elem => elem.classList.remove("transparent"));
    active.forEach(elem => elem.classList.add("transparent"));
}


/* update the image url on the view that isnt being shown */
function updatecover(url) {
    var inactive = document.querySelectorAll(".view.transparent>.cover");
    inactive.forEach(e => e.setAttribute("src", url));
}


(async () => {
    let coverlink;
    while(true) {
        await wait(1000);
        if (document.hidden) continue;
        var resp = await api.fetchWithToken("https://api.spotify.com/v1/me/player/currently-playing").catch(e => console.log(e));
        coverlink = resp?.item?.album?.images[0]?.url;
        if(coverlink == null) continue;

        var active = document.querySelector(".view:not(.transparent)>.cover");
        if (coverlink != active.getAttribute("src"))
            updatecover(coverlink);
    }
})();
