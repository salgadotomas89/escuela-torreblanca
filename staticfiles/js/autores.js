console.log('comunicados.js cargado');

document.addEventListener('DOMContentLoaded', function() {
    console.log('DOMContentLoaded activado');

    const comunicadosContainer = $('#comunicados-container');
    const loadMoreBtn = $('#load-more');
    let offset = 10;

    function loadMoreComunicados() {
        console.log('Cargando más comunicados, offset:', offset);
        $.ajax({
            url: '/comunicados/load-more/',
            type: 'GET',
            data: { offset: offset },
            dataType: 'json',
            headers: {
                'X-CSRFToken': getCookie('csrftoken')
            },
            success: function(data) {
                console.log('Comunicados cargados:', data);
                comunicadosContainer.append(data.html);
                offset += 10;
                loadMoreBtn.toggle(data.has_more);
            },
            error: function(jqXHR, textStatus, errorThrown) {
                console.error('Error en la solicitud AJAX:', textStatus, errorThrown);
                alert('Hubo un error al cargar los comunicados. Por favor, intenta de nuevo.');
            }
        });
    }

    // Cargar más comunicados
    loadMoreBtn.on('click', function() {
        console.log('Botón "Cargar más" clicado');
        loadMoreComunicados();
    });

    // Función para obtener el token CSRF
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

    // Manejar el envío del formulario para agregar comunicado
    $('#addComunicadoForm').on('submit', function(event) {
        event.preventDefault();
        console.log('Formulario de agregar comunicado enviado');
        const formData = $(this).serialize();

        $.ajax({
            url: '/comunicados/guardar-comunicado/',
            type: 'POST',
            data: formData,
            headers: {
                'X-CSRFToken': getCookie('csrftoken')
            },
            success: function(response) {
                console.log('Respuesta de guardar comunicado:', response);
                if (response.success) {
                    $('#addComunicadoModal').modal('hide');
                    alert('Comunicado agregado exitosamente');
                    location.reload(); // Recargar la página para mostrar el nuevo comunicado
                } else {
                    alert('Error al agregar el comunicado: ' + response.error);
                }
            },
            error: function(jqXHR, textStatus, errorThrown) {
                console.error('Error en la solicitud AJAX:', textStatus, errorThrown);
                alert('Hubo un error al agregar el comunicado. Por favor, intenta de nuevo.');
            }
        });
    });

    // Obtener autores frecuentes y llenar el datalist
    $.ajax({
        url: '/comunicados/autores-frecuentes/',
        type: 'GET',
        dataType: 'json',
        success: function(data) {
            console.log('Autores frecuentes obtenidos:', data);
            const autoresList = $('#autores-list');
            autoresList.empty();
            data.autores.forEach(function(autor) {
                autoresList.append(new Option(autor));
            });
        },
        error: function(jqXHR, textStatus, errorThrown) {
            console.error('Error al obtener autores frecuentes:', textStatus, errorThrown);
        }
    });
});