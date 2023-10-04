document.getElementById('login').addEventListener('click',()=>{
    window.location.href = chrome.runtime.getURL("login.html")
});