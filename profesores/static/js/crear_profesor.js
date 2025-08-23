document.addEventListener('DOMContentLoaded', function() {
    const profesorForm = document.getElementById('profesorForm');

    if (profesorForm) {
        profesorForm.addEventListener('submit', function(e) {
            e.preventDefault();
            
            const formData = new FormData(this);

            fetch('/profesores/crear_profesor/', {
                method: 'POST',
                body: formData,
                headers: {
                    'X-Requested-With': 'XMLHttpRequest',
                }
            })
            .then(response => response.json())
            .then(data => {
                if (data.success) {
                    alert(data.message);
                    const modal = bootstrap.Modal.getInstance(document.getElementById('nuevoProfesor'));
                    modal.hide();
                    profesorForm.reset();
                    // Opcional: recargar la página para mostrar el nuevo profesor
                    window.location.reload();
                } else {
                    alert(data.message || 'Error al crear profesor');
                }
            })
            .catch(error => {
                console.error('Error:', error);
                alert('Error al procesar la solicitud');
            });
        });
    }
});