// Función para obtener el CSRF token
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

document.addEventListener('DOMContentLoaded', function() {
    // Capturar el evento de envío del formulario
    const eventoForm = document.getElementById('eventoForm');
    if (eventoForm) {
        eventoForm.addEventListener('submit', function(event) {
            event.preventDefault(); // Evitar el envío del formulario por defecto
            
            // Obtener los datos del formulario
            const formData = new FormData(this);
            console.log('guardando el evento');
            
            // Realizar la llamada usando fetch para guardar los datos
            fetch('guardar-evento/', {
                method: 'POST',
                body: formData,
                headers: {
                    'X-CSRFToken': getCookie('csrftoken'),
                }
            })
            .then(response => {
                if (!response.ok) {
                    throw new Error(`HTTP error! status: ${response.status}`);
                }
                return response.json();
            })
            .then(data => {
                console.log('Respuesta del servidor:', data);
                
                if (data.success) {
                    // El evento se guardó correctamente
                    console.log('Evento guardado exitosamente:', data.evento);
                    alert(data.message || 'Evento guardado correctamente');
                    
                    // Cerrar el modal
                    const modal = bootstrap.Modal.getInstance(document.getElementById('nuevoEvento'));
                    if (modal) {
                        modal.hide();
                    }
                    
                    // Limpiar el formulario
                    eventoForm.reset();
                    
                    // Recargar la página para mostrar el nuevo evento
                    location.reload();
                } else {
                    // Hubo errores de validación
                    console.error('Errores de validación:', data.errors);
                    let errorMessage = data.error || 'Error al guardar el evento';
                    
                    if (data.errors) {
                        errorMessage += ':\n';
                        for (let field in data.errors) {
                            errorMessage += `${field}: ${data.errors[field].join(', ')}\n`;
                        }
                    }
                    
                    alert(errorMessage);
                }
            })
            .catch(error => {
                // Ocurrió un error en la solicitud
                console.error('Error en la solicitud:', error);
                alert('Error de conexión. Por favor, inténtelo de nuevo.');
            });
        });
    }
});

// Inicializar datepicker cuando el DOM esté listo
document.addEventListener('DOMContentLoaded', function() {
    // Verificar si jQuery y datepicker están disponibles
    if (typeof $ !== 'undefined' && $.fn.datepicker) {
        $('.fecha-ts').datepicker({
            language: 'es',
            daysOfWeekDisabled: "0,6",
            autoclose: true
        });
    }
});


