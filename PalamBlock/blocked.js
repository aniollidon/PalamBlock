
// get GET parameters
var url = window.location.href;
var params = url.split('?')[1].split('&');
var data = {};
var tmp;
for (var i = 0, l = params.length; i < l; i++) {
tmp = params[i].split('=');
data[tmp[0]] = tmp[1];
}

document.title = "[Block] " +  decodeURIComponent(data.title);

setTimeout(function() {
window.close();
}, 30000);
