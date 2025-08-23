function mostrarModalDewey() {
    fetch('/static/data/dewey_codes.json')
        .then(response => response.json())
        .then(data => {
            const tbody = document.getElementById('dewey-table-body');
            tbody.innerHTML = data.dewey_codes.map(dewey => `
                <tr>
                    <td>${dewey.codigo}</td>
                    <td>${dewey.descripcion}</td>
                </tr>
            `).join('');
            
            // Verificar si ya existen códigos en la base de datos
            verificarDeweys();
        })
        .catch(error => {
            console.error('Error:', error);
            Swal.fire({
                icon: 'error',
                title: 'Error',
                text: 'Error al cargar los códigos Dewey'
            });
        });

    const modal = new bootstrap.Modal(document.getElementById('deweyModal'));
    modal.show();
}

function verificarDeweys() {
    fetch('/biblioteca/verificar-deweys/')
        .then(response => response.json())
        .then(data => {
            const btnCargar = document.getElementById('btn-cargar-dewey');
            btnCargar.disabled = data.existe;
            if (data.existe) {
                btnCargar.innerHTML = 'Códigos Dewey ya cargados';
            }
        });
}

function cargarDeweys() {
    Swal.fire({
        title: '¿Estás seguro?',
        text: "Se cargarán todos los códigos Dewey en la base de datos",
        icon: 'warning',
        showCancelButton: true,
        confirmButtonColor: '#3085d6',
        cancelButtonColor: '#d33',
        confirmButtonText: 'Sí, cargar',
        cancelButtonText: 'Cancelar'
    }).then((result) => {
        if (result.isConfirmed) {
            const btnCargar = document.getElementById('btn-cargar-dewey');
            btnCargar.disabled = true;
            btnCargar.innerHTML = '<span class="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span> Cargando...';

            fetch('/biblioteca/cargar-deweys/', {
                method: 'POST',
                headers: {
                    'X-CSRFToken': document.querySelector('[name=csrfmiddlewaretoken]').value
                }
            })
            .then(response => response.json())
            .then(data => {
                if (data.success) {
                    Swal.fire(
                        '¡Completado!',
                        'Los códigos Dewey han sido cargados correctamente.',
                        'success'
                    ).then(() => {
                        window.location.reload();
                    });
                } else {
                    throw new Error(data.error);
                }
            })
            .catch(error => {
                console.error('Error:', error);
                btnCargar.disabled = false;
                btnCargar.innerHTML = 'Cargar Deweys en Base de Datos';
                Swal.fire(
                    'Error',
                    'Error al cargar los códigos Dewey',
                    'error'
                );
            });
        }
    });
} 