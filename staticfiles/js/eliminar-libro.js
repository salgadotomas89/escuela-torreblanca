function eliminarLibro(libroId) {
    // Primera confirmación
    Swal.fire({
        title: '¿Estás seguro?',
        text: "Esta acción eliminará el libro y toda su información relacionada (préstamos, ejemplares, etc.). Esta acción no se puede deshacer.",
        icon: 'warning',
        showCancelButton: true,
        confirmButtonColor: '#d33',
        cancelButtonColor: '#3085d6',
        confirmButtonText: 'Continuar',
        cancelButtonText: 'Cancelar'
    }).then((result) => {
        if (result.isConfirmed) {
            // Si confirma, pedir la clave
            Swal.fire({
                title: 'Confirmar acción',
                text: 'Por favor, ingrese su contraseña para confirmar',
                input: 'password',
                inputAttributes: {
                    autocapitalize: 'off',
                    autocorrect: 'off'
                },
                inputPlaceholder: 'Ingrese su contraseña',
                showCancelButton: true,
                confirmButtonText: 'Confirmar',
                cancelButtonText: 'Cancelar',
                showLoaderOnConfirm: true,
                preConfirm: (clave) => {
                    if (!clave) {
                        Swal.showValidationMessage('Debe ingresar su contraseña');
                        return false;
                    }
                    
                    const csrftoken = document.querySelector('[name=csrfmiddlewaretoken]').value;
                    
                    // Primero verificar la clave
                    return fetch('/biblioteca/verificar-clave-usuario/', {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/x-www-form-urlencoded',
                            'X-CSRFToken': csrftoken
                        },
                        body: `clave=${encodeURIComponent(clave)}`
                    })
                    .then(response => response.json())
                    .then(data => {
                        if (!data.success) {
                            throw new Error(data.error || 'Contraseña incorrecta');
                        }
                        
                        // Si la clave es correcta, proceder con la eliminación
                        return fetch('/biblioteca/eliminar-libro/', {
                            method: 'POST',
                            headers: {
                                'Content-Type': 'application/x-www-form-urlencoded',
                                'X-CSRFToken': csrftoken
                            },
                            body: `libro_id=${libroId}`
                        })
                        .then(response => {
                            if (!response.ok) {
                                throw new Error('Error al eliminar el libro');
                            }
                            return response.json();
                        });
                    })
                    .catch(error => {
                        Swal.showValidationMessage(
                            `Error: ${error.message}`
                        );
                    });
                },
                allowOutsideClick: () => !Swal.isLoading()
            }).then((result) => {
                if (result.isConfirmed && result.value.success) {
                    // Mostrar mensaje de éxito
                    Swal.fire({
                        title: '¡Eliminado!',
                        text: 'El libro ha sido eliminado correctamente.',
                        icon: 'success',
                        timer: 2000,
                        showConfirmButton: false
                    }).then(() => {
                        // Eliminar la fila de la tabla con una animación
                        const row = document.querySelector(`tr[data-libro-id="${libroId}"]`);
                        if (row) {
                            row.style.transition = 'opacity 0.5s';
                            row.style.opacity = '0';
                            setTimeout(() => {
                                row.remove();
                                // Actualizar el contador de libros si existe
                                const contadorLibros = document.querySelector('.alert-info strong');
                                if (contadorLibros) {
                                    const numeroActual = parseInt(contadorLibros.textContent);
                                    contadorLibros.textContent = (numeroActual - 1).toString();
                                }
                            }, 500);
                        } else {
                            // Si no se encuentra la fila, recargar la página
                            window.location.reload();
                        }
                    });
                } else if (!result.isConfirmed) {
                    // Si cancela en el diálogo de la clave
                    Swal.fire(
                        'Cancelado',
                        'El libro no ha sido eliminado',
                        'info'
                    );
                }
            });
        }
    });
}

// Agregar un listener para el evento personalizado de eliminación
document.addEventListener('eliminarLibroError', function(e) {
    Swal.fire({
        title: 'Error',
        text: e.detail.message || 'Error al eliminar el libro',
        icon: 'error'
    });
}); 