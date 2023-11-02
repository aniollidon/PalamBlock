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
                console.log(data);
                // If correct, save them in localStorage
                localStorage.setItem('user', user);
                localStorage.setItem('authToken', data.authToken);
                // Redirect to admin page
                window.location.href = '/admin';
            });

        } else {
            // If not, show error message
            alert('Usuari o clau incorrectes');
        }
    });
  }

  document.getElementById('save').addEventListener('click',
      save_options);