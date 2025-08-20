// Prepara els parametres
const url = new URL(window.location.href);
const GO = url.searchParams.get('go') ?? 'browsers';
let get_params = url.searchParams;
get_params.delete('go');
const GO_AFTER = "/admin/" + GO + "?" + get_params.toString();

function save_options() {
    let user = document.getElementById('user').value;
    let clau = document.getElementById('clau').value;
    let clauMd5 = md5(clau);

    // Send a message to API to check if user and clau are correct7
    fetch('/api/v1/admin/login', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({
            user:user, clauMd5:clauMd5})
    }).then((response) => {
        if (response.status === 200) {
            response.json().then((data) => {
                //console.log(data);
                // If correct, save them in localStorage
                localStorage.setItem('user', user);
                localStorage.setItem('authToken', data.authToken);
                // Redirect to GO page
                window.location.href = GO_AFTER;
            });

        } else {
            // If not, show error message
            alert('Usuari o clau incorrectes');
        }
    });
  }

  document.getElementById('clau').addEventListener('keypress', function (e) {
    if (e.key === 'Enter') {
        save_options();
    }
  });
  document.getElementById('save').addEventListener('click',
      save_options);
