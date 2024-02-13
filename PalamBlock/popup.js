document.getElementById('login').addEventListener('click',()=>{
    window.open('login.html', '_blank');
});

chrome.storage.sync.get(['alumne'], async (result) => {
    if(result.alumne &&  result.alumne !== '')
        document.getElementById('login').innerText = result.alumne;
    else
        document.getElementById('login').innerText = "Login";
});
