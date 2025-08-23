$(document).ready(function() {
    // funcion para obtener el valor de la cookie
    function getCookie(name) {
        let cookieValue = null;
        if (document.cookie && document.cookie !== '') {
            const cookies = document.cookie.split(';');
            for (let i = 0; i < cookies.length; i++) {
                const cookie = cookies[i].trim();
                if (cookie.substring(0, name.length + 1) === (name + '=')) {
                    cookieValue = decodeURIComponent(cookie.substring(name.length + 1));
                    break;
                }
            }
        }
        return cookieValue;
    }

    // csrftoken será utilizado en la cabecera de la solicitud fetch porque Django lo requiere para las solicitudes POST
    // y PUT para protegerse contra ataques CSRF
    const csrftoken = getCookie('csrftoken');
    //el usuario hace clic en el enlace de cerrar sesión
    $('#logout-link').click(function(e) {
        e.preventDefault();
        
        $.ajax({
            url: '/configuracion/logout/',
            type: 'POST',
            dataType: 'json',
            success: function(data) {
                if (data.success) {
                    // Actualizar solo el div de autenticación
                    $.get('/auth_div/', function(html) {
                        $('.py-3.d-flex.align-items-center.me-4').html(html);
                    });
                }
            },
            error: function() {
                alert('Error al cerrar sesión habshbahbaha');
            }
        });
    });
});