document.getElementById('login').addEventListener('click',()=>{
    window.open('login.html', '_blank');
});

chrome.storage.local.get(['alumne'], async (result) => {
    if(result.alumne &&  result.alumne !== '')
        document.getElementById('login').innerText = result.alumne;
    else
        document.getElementById('login').innerText = "Login";
});
