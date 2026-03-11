// Read query params safely for both blocked.html and blocked-use.html.
var params = new URLSearchParams(window.location.search || "");
var title = params.get("title") || "";
var host = params.get("host") || "aquest lloc web";

document.title = "[Block] " + title;
document.getElementById("blocked").innerText = "a " + host;

// Keep auto-close only for full-page block screen.
if (window.location.pathname.endsWith("/blocked.html")) {
	setTimeout(function () {
		window.close();
	}, 30000);
}
