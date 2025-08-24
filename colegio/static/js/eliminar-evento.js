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
    // Variables para almacenar el evento a eliminar
    let eventoIdToDelete = null;
    
    // Obtener el modal
    const deleteModal = new bootstrap.Modal(document.getElementById('deleteEventModal'));
    
    // Agregar event listener a todos los botones de eliminar
    document.querySelectorAll('.delete-event-btn').forEach(button => {
        button.addEventListener('click', function(e) {
            e.stopPropagation(); // Prevenir que el click se propague a la tarjeta
            
            // Obtener los datos del evento
            eventoIdToDelete = this.getAttribute('data-evento-id');
            const eventoTitulo = this.getAttribute('data-evento-titulo');
            
            // Actualizar el título en el modal
            document.getElementById('eventTitle').textContent = eventoTitulo;
            
            // Mostrar el modal
            deleteModal.show();
        });
    });
    
    // Manejar la confirmación de eliminación
    document.getElementById('confirmDeleteBtn').addEventListener('click', function() {
        if (eventoIdToDelete) {
            
            fetch(`/eliminar-evento/${eventoIdToDelete}/`, {
                method: 'DELETE',
                headers: {
                    'X-CSRFToken': getCookie('csrftoken'),
                    'Content-Type': 'application/json',
                },
            })
            .then(response => {
                if (response.ok) {
                    // Recargar la página o eliminar el elemento del DOM
                    location.reload();
                } else {
                    alert('Error al eliminar el evento');
                }
            })
            .catch(error => {
                console.error('Error:', error);
                alert('Error al eliminar el evento');
            });
            
        }
        
        // Cerrar el modal
        deleteModal.hide();
    });
});
