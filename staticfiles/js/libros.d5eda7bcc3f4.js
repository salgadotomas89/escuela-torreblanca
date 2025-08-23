// ==============================================
// INITIALIZATION - DOM READY EVENT HANDLERS
// ==============================================
document.addEventListener('DOMContentLoaded', function() {
    console.log('DOM cargado, inicializando modales...');
    
    // Inicializar todos los tooltips y popovers si los hay
    var tooltipTriggerList = [].slice.call(document.querySelectorAll('[data-bs-toggle="tooltip"]'));
    tooltipTriggerList.map(function (tooltipTriggerEl) {
        return new bootstrap.Tooltip(tooltipTriggerEl);
    });

    

    // Configurar el modal de agregar material
    const agregarMaterialModal = document.getElementById('agregarMaterialModal');
    if (agregarMaterialModal) {
        agregarMaterialModal.addEventListener('shown.bs.modal', function () {
            // Configurar editorial search cuando el modal se muestre
            configurarEditorialSearch();
            // Configurar autores search cuando el modal se muestre
            configurarAutoresSearch();
        });
        
        agregarMaterialModal.addEventListener('hidden.bs.modal', function () {
            document.getElementById('agregarMaterialForm').reset();
            if (document.getElementById('edad-recomendada-ia')) {
                document.getElementById('edad-recomendada-ia').style.display = 'none';
            }
            if (document.getElementById('dewey-recomendado')) {
                document.getElementById('dewey-recomendado').style.display = 'none';
            }
            if (document.getElementById('editorial-suggestions')) {
                document.getElementById('editorial-suggestions').innerHTML = '';
            }
            const editorialSearch = document.getElementById('editorial-search');
            if (editorialSearch) {
                editorialSearch.classList.remove('is-valid', 'is-invalid');
            }
            const editorialHidden = document.getElementById('editorial');
            if (editorialHidden) {
                editorialHidden.value = '';
            }

            // Limpiar autores al cerrar el modal
            limpiarAutores();
            if (document.getElementById('autores-suggestions')) {
                document.getElementById('autores-suggestions').innerHTML = '';
                document.getElementById('autores-suggestions').style.display = 'none';
            }
            const autoresSearch = document.getElementById('autores-search');
            if (autoresSearch) {
                autoresSearch.classList.remove('is-valid', 'is-invalid');
                autoresSearch.value = '';
                autoresSearch.style.width = '100px';
            }
        });
    }
    
    // Configurar búsqueda para el modal de préstamo si existe
    if (document.getElementById('alumno-search-prestamo')) {
        configurarBusquedaAlumnos(
            'alumno-search-prestamo',
            'resultados-alumnos',
            'contador-alumnos'
        );
    }

    // Configurar búsqueda para el modal de reserva si existe
    if (document.getElementById('alumno-search-reserva')) {
        configurarBusquedaAlumnos(
            'alumno-search-reserva',
            'alumno-results',
            'contador-alumnos-reserva'
        );
    }

    // Cargar alumnos iniciales al abrir el modal
    const prestamoModal = document.getElementById('prestamoModal');
    if (prestamoModal) {
        prestamoModal.addEventListener('shown.bs.modal', function () {
            cargarAlumnos();
        });
    }
    
    // Configurar componentes de Google Books
    initGoogleBooksListeners();
    
    // Configurar búsqueda para el modal de reserva
    configurarBusquedaReserva();
    
    // Configurar event listeners para el modal de agregar material
    configurarEditorialSearch();
    
    // Habilitar/deshabilitar botón de registro cuando se selecciona un ejemplar
    const ejemplarSelect = document.getElementById('ejemplar-select');
    if (ejemplarSelect) {
        ejemplarSelect.addEventListener('change', function() {
            document.getElementById('btn-registrar-prestamo').disabled = !this.value || !alumnoSeleccionadoId;
        });
    }

    // Cerrar sugerencias al hacer clic fuera
    document.addEventListener('click', function(e) {
        // Cerrar sugerencias de editorial
        const suggestionsDiv = document.getElementById('editorial-suggestions');
        const editorialInput = document.getElementById('editorial-search');
        
        if (suggestionsDiv && editorialInput && !suggestionsDiv.contains(e.target) && e.target !== editorialInput) {
            suggestionsDiv.style.display = 'none';
        }
        
        // Cerrar sugerencias de autores
        const autoresSuggestionsDiv = document.getElementById('autores-suggestions');
        const autoresInput = document.getElementById('autores-search');
        
        if (autoresSuggestionsDiv && autoresInput && !autoresSuggestionsDiv.contains(e.target) && e.target !== autoresInput) {
            autoresSuggestionsDiv.style.display = 'none';
        }
    });
    
    console.log('Modales inicializados correctamente');
});

// ==============================================
// WINDOW GLOBAL FUNCTIONS
// ==============================================

// Función para mostrar el modal de gestión de editoriales
window.mostrarGestionEditoriales = function() {
    const modal = new bootstrap.Modal(document.getElementById('gestionEditorialesModal'));
    modal.show();
    cargarEditoriales(); // Cargar la lista de editoriales al abrir el modal
};

// Función para mostrar el modal de agregar material
window.mostrarModalAgregarMaterial = function() {
    const modal = new bootstrap.Modal(document.getElementById('agregarMaterialModal'));
    modal.show();
    
    // Configurar el search de editorial cuando se abra el modal
    setTimeout(() => {
        configurarEditorialSearch();
    }, 100);
};

// Función para mostrar préstamos
window.mostrarPrestamos = function() {
    const modal = new bootstrap.Modal(document.getElementById('prestamosModal'));
    const tbody = document.getElementById('prestamos-table-body');
    
    tbody.innerHTML = `
        <tr>
            <td colspan="7" class="text-center">
                <div class="spinner-border text-primary" role="status">
                    <span class="visually-hidden">Cargando...</span>
                </div>
            </td>
        </tr>
    `;
    
    modal.show();

    fetch('/biblioteca/obtener-prestamos/')
        .then(response => response.json())
        .then(data => {
            if (data.success) {
                if (data.prestamos.length === 0) {
                    tbody.innerHTML = `
                        <tr>
                            <td colspan="7" class="text-center">
                                No hay préstamos registrados
                            </td>
                        </tr>
                    `;
                    return;
                }

                tbody.innerHTML = data.prestamos.map(prestamo => `
                    <tr>
                        <td>${prestamo.titulo}</td>
                        <td>Ejemplar ${prestamo.ejemplar}</td>
                        <td>${prestamo.alumno}</td>
                        <td>${prestamo.fecha_prestamo}</td>
                        <td>${prestamo.fecha_devolucion}</td>
                        <td>
                            <span class="badge ${prestamo.estado === 'prestado' ? 'bg-warning' : 'bg-success'}">
                                ${prestamo.estado === 'prestado' ? 'Prestado' : 'Devuelto'}
                            </span>
                        </td>
                        <td>
                            ${prestamo.estado === 'prestado' ? `
                                <button class="btn btn-sm btn-success" onclick="registrarDevolucion(${prestamo.id})">
                                    <i class="bi bi-check-circle"></i> Devolver
                                </button>
                            ` : ''}
                        </td>
                    </tr>
                `).join('');
            } else {
                throw new Error(data.error || 'Error al cargar los préstamos');
            }
        })
        .catch(error => {
            console.error('Error:', error);
            tbody.innerHTML = `
                <tr>
                    <td colspan="7" class="text-center text-danger">
                        <i class="bi bi-exclamation-triangle"></i> 
                        Error al cargar los préstamos: ${error.message}
                    </td>
                </tr>
            `;
        });
};

window.registrarDevolucion = function(prestamoId) {
    Swal.fire({
        title: '¿Confirmar devolución?',
        text: "¿Estás seguro de que deseas registrar la devolución?",
        icon: 'question',
        showCancelButton: true,
        confirmButtonColor: '#28a745',
        cancelButtonColor: '#6c757d',
        confirmButtonText: 'Sí, confirmar',
        cancelButtonText: 'Cancelar'
    }).then((result) => {
        if (result.isConfirmed) {
            const formData = new FormData();
            formData.append('prestamo_id', prestamoId);

            fetch('/biblioteca/registrar-devolucion/', {
                method: 'POST',
                body: formData,
                headers: {
                    'X-CSRFToken': document.querySelector('[name=csrfmiddlewaretoken]').value
                }
            })
            .then(response => response.json())
            .then(data => {
                if (data.success) {
                    Swal.fire({
                        icon: 'success',
                        title: '¡Éxito!',
                        text: 'Devolución registrada correctamente',
                        timer: 1500,
                        showConfirmButton: false
                    }).then(() => {
                        mostrarPrestamos(); // Recargar la lista de préstamos
                    });
                } else {
                    throw new Error(data.error || 'Error al registrar la devolución');
                }
            })
            .catch(error => {
                console.error('Error:', error);
                Swal.fire({
                    icon: 'error',
                    title: 'Error',
                    text: error.message || 'Error al registrar la devolución'
                });
            });
        }
    });
};

// ==============================================
// EDITORIAL MANAGEMENT
// ==============================================

// Función para cargar las editoriales
function cargarEditoriales() {
    const tbody = document.getElementById('editoriales-table-body');
    tbody.innerHTML = '<tr><td colspan="2" class="text-center"><div class="spinner-border" role="status"></div></td></tr>';

    fetch('/biblioteca/obtener-editoriales/')
        .then(response => response.json())
        .then(data => {
            if (data.success) {
                tbody.innerHTML = '';
                if (data.editoriales.length === 0) {
                    tbody.innerHTML = '<tr><td colspan="2" class="text-center">No hay editoriales registradas</td></tr>';
                    return;
                }
                
                data.editoriales.forEach(editorial => {
                    const tr = document.createElement('tr');
                    tr.setAttribute('data-editorial-id', editorial.id);
                    const nombreSeguro = editorial.nombre.replace(/"/g, '&quot;').replace(/'/g, "\\'");
                    tr.innerHTML = `
                        <td>${editorial.nombre}</td>
                        <td>
                            <button class="btn btn-sm btn-primary me-1" onclick="editarEditorial(${editorial.id}, '${nombreSeguro}')">
                                <i class="bi bi-pencil"></i>
                            </button>
                            <button class="btn btn-sm btn-danger" onclick="eliminarEditorial(${editorial.id}, '${nombreSeguro}')">
                                <i class="bi bi-trash"></i>
                            </button>
                        </td>
                    `;
                    tbody.appendChild(tr);
                });
            } else {
                throw new Error(data.error || 'Error al cargar las editoriales');
            }
        })
        .catch(error => {
            console.error('Error:', error);
            tbody.innerHTML = `
                <tr>
                    <td colspan="2" class="text-center text-danger">
                        <i class="bi bi-exclamation-triangle"></i> 
                        Error al cargar las editoriales: ${error.message}
                    </td>
                </tr>
            `;
        });
}

// Función para editar editorial
function editarEditorial(id, nombre) {
    if (!id) {
        Swal.fire({
            icon: 'error',
            title: 'Error',
            text: 'ID de editorial no válido'
        });
        return;
    }

    // Llenar el formulario con los datos actuales
    document.getElementById('editorial-id-editar').value = id;
    document.getElementById('editorial-nombre-editar').value = nombre;

    // Mostrar el modal de edición
    const modal = new bootstrap.Modal(document.getElementById('editarEditorialModal'));
    modal.show();
}

// Función para eliminar editorial
function eliminarEditorial(id, nombre) {
    if (!id) {
        Swal.fire({
            icon: 'error',
            title: 'Error',
            text: 'ID de editorial no válido'
        });
        return;
    }

    Swal.fire({
        title: '¿Estás seguro?',
        text: `¿Deseas eliminar la editorial "${nombre}"?`,
        icon: 'warning',
        showCancelButton: true,
        confirmButtonColor: '#d33',
        cancelButtonColor: '#3085d6',
        confirmButtonText: 'Sí, eliminar',
        cancelButtonText: 'Cancelar'
    }).then((result) => {
        if (result.isConfirmed) {
            // Mostrar indicador de carga
            Swal.fire({
                title: 'Eliminando...',
                text: 'Por favor espere',
                allowOutsideClick: false,
                showConfirmButton: false,
                didOpen: () => {
                    Swal.showLoading();
                }
            });

            // Obtener el token CSRF
            const csrftoken = document.querySelector('[name=csrfmiddlewaretoken]').value;

            // Realizar la petición para eliminar
            fetch('/biblioteca/eliminar-editorial/', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/x-www-form-urlencoded',
                    'X-CSRFToken': csrftoken
                },
                body: `id=${id}`
            })
            .then(response => response.json())
            .then(data => {
                if (data.success) {
                    Swal.fire({
                        icon: 'success',
                        title: 'Editorial eliminada',
                        text: data.message || 'La editorial ha sido eliminada correctamente',
                        timer: 2000,
                        showConfirmButton: false
                    }).then(() => {
                        // Recargar la lista de editoriales
                        cargarEditoriales();
                    });
                } else {
                    throw new Error(data.error || 'Error al eliminar la editorial');
                }
            })
            .catch(error => {
                console.error('Error:', error);
                Swal.fire({
                    icon: 'error',
                    title: 'Error',
                    text: error.message || 'Error al eliminar la editorial'
                });
            });
        }
    });
}

// Función para actualizar la editorial
function actualizarEditorial() {
    const id = document.getElementById('editorial-id-editar').value;
    const nombre = document.getElementById('editorial-nombre-editar').value.trim();

    if (!nombre) {
        document.getElementById('editorial-nombre-editar').classList.add('is-invalid');
        return;
    }

    // Mostrar indicador de carga en el botón de guardar
    const botonGuardar = document.querySelector('#editarEditorialModal .btn-primary');
    const textoOriginal = botonGuardar.innerHTML;
    botonGuardar.disabled = true;
    botonGuardar.innerHTML = '<span class="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span> Actualizando...';

    // Obtener el token CSRF
    const csrftoken = document.querySelector('[name=csrfmiddlewaretoken]').value;

    // Realizar la petición para actualizar
    fetch('/biblioteca/actualizar-editorial/', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
            'X-CSRFToken': csrftoken
        },
        body: `id=${id}&nombre=${encodeURIComponent(nombre)}`
    })
    .then(response => response.json())
    .then(data => {
        if (data.success) {
            // Actualizar la fila específica en la tabla
            const nombreSeguro = nombre.replace(/"/g, '&quot;').replace(/'/g, "\\'");
            const fila = document.querySelector(`tr[data-editorial-id="${id}"]`);
            
            if (fila) {
                // Crear el nuevo contenido
                const nuevoContenido = `
                    <td>${nombre}</td>
                    <td>
                        <button class="btn btn-sm btn-primary me-1" onclick="editarEditorial(${id}, '${nombreSeguro}')">
                            <i class="bi bi-pencil"></i>
                        </button>
                        <button class="btn btn-sm btn-danger" onclick="eliminarEditorial(${id}, '${nombreSeguro}')">
                            <i class="bi bi-trash"></i>
                        </button>
                    </td>
                `;

                // Aplicar la animación de salida
                const contenidoActual = fila.innerHTML;
                fila.classList.add('fila-contenido', 'fila-fade-out');
                
                setTimeout(() => {
                    // Actualizar el contenido
                    fila.innerHTML = nuevoContenido;
                    fila.classList.remove('fila-fade-out');
                    fila.classList.add('fila-fade-in', 'fila-actualizada');
                    
                    // Cerrar el modal con una pequeña demora
                    setTimeout(() => {
                        const modal = bootstrap.Modal.getInstance(document.getElementById('editarEditorialModal'));
                        modal.hide();

                        // Mostrar notificación toast en lugar de Swal
                        const Toast = Swal.mixin({
                            toast: true,
                            position: 'top-end',
                            showConfirmButton: false,
                            timer: 3000,
                            timerProgressBar: true,
                            didOpen: (toast) => {
                                toast.addEventListener('mouseenter', Swal.stopTimer)
                                toast.addEventListener('mouseleave', Swal.resumeTimer)
                            }
                        });

                        Toast.fire({
                            icon: 'success',
                            title: 'Editorial actualizada correctamente'
                        });
                    }, 300);

                    // Limpiar las clases después de la animación
                    setTimeout(() => {
                        fila.classList.remove('fila-fade-in', 'fila-actualizada');
                    }, 1500);
                }, 300);
            }
        } else {
            throw new Error(data.error || 'Error al actualizar la editorial');
        }
    })
    .catch(error => {
        console.error('Error:', error);
        Swal.fire({
            icon: 'error',
            title: 'Error',
            text: error.message || 'Error al actualizar la editorial'
        });
    })
    .finally(() => {
        // Restaurar el botón
        botonGuardar.disabled = false;
        botonGuardar.innerHTML = textoOriginal;
    });
}

// Búsqueda de editoriales
let timeoutId;

function buscarEditoriales(query) {
    // Limpiar el timeout anterior si existe
    if (timeoutId) {
        clearTimeout(timeoutId);
    }

    const suggestionsDiv = document.getElementById('editorial-suggestions');
    const editorialInput = document.getElementById('editorial-search');
    const editorialHidden = document.getElementById('editorial');

    // Si el query está vacío, limpiar y ocultar sugerencias
    if (!query.trim()) {
        suggestionsDiv.style.display = 'none';
        editorialHidden.value = '';
        editorialInput.classList.remove('is-valid', 'is-invalid');
        return;
    }

    // Esperar 300ms antes de hacer la búsqueda para evitar muchas peticiones
    timeoutId = setTimeout(() => {
        const csrftoken = document.querySelector('[name=csrfmiddlewaretoken]').value;

        // Mostrar indicador de carga
        editorialInput.classList.add('loading');

        fetch('/biblioteca/buscar-editoriales/', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded',
                'X-CSRFToken': csrftoken
            },
            body: `query=${encodeURIComponent(query)}`
        })
        .then(response => response.json())
        .then(data => {
            editorialInput.classList.remove('loading');
            
            if (data.success && data.editoriales.length > 0) {
                suggestionsDiv.innerHTML = '';
                suggestionsDiv.style.display = 'block';

                data.editoriales.forEach(editorial => {
                    const item = document.createElement('a');
                    item.className = 'list-group-item list-group-item-action';
                    item.href = '#';
                    item.textContent = editorial.nombre;
                    
                    item.onclick = (e) => {
                        e.preventDefault();
                        seleccionarEditorial(editorial.id, editorial.nombre);
                    };

                    suggestionsDiv.appendChild(item);
                });
            } else {
                suggestionsDiv.style.display = 'none';
                editorialInput.classList.remove('is-invalid');
                editorialHidden.value = '';
            }
        })
        .catch(error => {
            console.error('Error:', error);
            editorialInput.classList.remove('loading');
            suggestionsDiv.style.display = 'none';
        });
    }, 300);
}

function seleccionarEditorial(id, nombre) {
    const editorialInput = document.getElementById('editorial-search');
    const editorialHidden = document.getElementById('editorial');
    const editorialTag = document.getElementById('editorial-tag');
    const editorialTagText = document.getElementById('editorial-tag-text');
    const suggestionsDiv = document.getElementById('editorial-suggestions');

    editorialHidden.value = id;
    editorialTagText.textContent = nombre;
    editorialTag.classList.remove('d-none');
    editorialInput.value = '';
    editorialInput.style.width = '100px';
    suggestionsDiv.style.display = 'none';
    
    // Mostrar feedback visual de selección válida
    const inputGroup = editorialInput.closest('.input-group');
    inputGroup.classList.remove('is-invalid');
    inputGroup.classList.add('is-valid');
}

function removeEditorial(event) {
    event.preventDefault();
    const editorialTag = document.getElementById('editorial-tag');
    const editorialHidden = document.getElementById('editorial');
    const editorialInput = document.getElementById('editorial-search');
    const inputGroup = editorialInput.closest('.input-group');

    editorialTag.classList.add('d-none');
    editorialHidden.value = '';
    editorialInput.value = '';
    editorialInput.style.width = '100%';
    
    inputGroup.classList.remove('is-valid', 'is-invalid');
    editorialInput.focus();
}

// ==============================================
// EDITORIAL SEARCH CONFIGURATION
// ==============================================

function configurarEditorialSearch() {
    const editorialSearchInput = document.getElementById('editorial-search');
    if (!editorialSearchInput) {
        console.log('Editorial search input not found');
        return;
    }

    // Verificar si ya se configuró para evitar duplicar listeners
    if (editorialSearchInput.dataset.configured === 'true') {
        console.log('Editorial search already configured');
        return;
    }

    // Configurar event listener para ajustar el ancho del input
    editorialSearchInput.addEventListener('input', function() {
        this.style.width = ((this.value.length + 1) * 8) + 'px';
    });
    
    // Configurar event listener para el Enter key con alta prioridad
    editorialSearchInput.addEventListener('keydown', function(e) {
        if (e.key === 'Enter' || e.keyCode === 13) {
            console.log('Enter pressed in editorial input');
            e.preventDefault();
            e.stopPropagation();
            e.stopImmediatePropagation();
            
            const nombreEditorial = this.value.trim();
            
            if (nombreEditorial) {
                // Si hay texto, crear el tag con la nueva editorial
                const editorialTag = document.getElementById('editorial-tag');
                const editorialTagText = document.getElementById('editorial-tag-text');
                const editorialHidden = document.getElementById('editorial');
                
                if (editorialTag && editorialTagText && editorialHidden) {
                    editorialTagText.textContent = nombreEditorial;
                    editorialTag.classList.remove('d-none');
                    editorialHidden.value = ''; // El ID estará vacío ya que es una nueva editorial
                    this.value = '';
                    this.style.width = '100px';
                    
                    // Ocultar sugerencias si están visibles
                    const suggestions = document.getElementById('editorial-suggestions');
                    if (suggestions) {
                        suggestions.style.display = 'none';
                    }
                    
                    // Mostrar feedback visual
                    const inputGroup = this.closest('.input-group');
                    if (inputGroup) {
                        inputGroup.classList.remove('is-invalid');
                        inputGroup.classList.add('is-valid');
                    }
                    
                    console.log('Editorial tag created:', nombreEditorial);
                }
            }
            
            return false;
        }
    }, true); // Usar capturing para que se ejecute antes que otros eventos
    
    // Marcar como configurado
    editorialSearchInput.dataset.configured = 'true';
    console.log('Editorial search configured successfully');
}

// ==============================================
// BOOK MANAGEMENT
// ==============================================

function guardarMaterial() {
    const formData = new FormData(document.getElementById('agregarMaterialForm'));
    
    // Obtener los valores de editorial
    const editorialId = document.getElementById('editorial').value;
    const editorialTagText = document.getElementById('editorial-tag-text');
    const editorialNombre = editorialTagText ? editorialTagText.textContent.trim() : '';
    
    // Si no hay ID pero hay nombre en el tag, agregar el nombre al formData
    if (!editorialId && editorialNombre) {
        formData.append('editorial_nombre', editorialNombre);
    }

    // Obtener los valores de autores
    if (autoresSeleccionados.length > 0) {
        // Separar autores existentes (con ID) de autores nuevos (sin ID)
        const autoresExistentes = autoresSeleccionados.filter(autor => autor.id !== null);
        const autoresNuevos = autoresSeleccionados.filter(autor => autor.id === null);
        
        // Agregar autores existentes (IDs)
        if (autoresExistentes.length > 0) {
            const idsAutores = autoresExistentes.map(autor => autor.id);
            formData.append('autores_ids', JSON.stringify(idsAutores));
        }
        
        // Agregar autores nuevos (nombres)
        if (autoresNuevos.length > 0) {
            const nombresAutores = autoresNuevos.map(autor => autor.nombre);
            formData.append('autores_nuevos', JSON.stringify(nombresAutores));
        }
    }

    // Mostrar indicador de carga
    const botonGuardar = document.querySelector('#agregarMaterialModal .btn-primary');
    const textoOriginal = botonGuardar.innerHTML;
    botonGuardar.disabled = true;
    botonGuardar.innerHTML = '<span class="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span> Guardando...';

    fetch('/biblioteca/agregar-material/', {
        method: 'POST',
        body: formData,
        headers: {
            'X-CSRFToken': document.querySelector('[name=csrfmiddlewaretoken]').value
        }
    })
    .then(response => response.json())
    .then(data => {
        if (data.success) {
            // Cerrar el modal
            const modal = bootstrap.Modal.getInstance(document.getElementById('agregarMaterialModal'));
            modal.hide();

            // Mostrar mensaje de éxito
            Swal.fire({
                icon: 'success',
                title: '¡Éxito!',
                text: data.message,
                timer: 2000,
                showConfirmButton: false
            }).then(() => {
                // Recargar la página para mostrar el nuevo libro
                window.location.reload();
            });
        } else {
            throw new Error(data.error || 'Error al guardar el material');
        }
    })
    .catch(error => {
        console.error('Error:', error);
        Swal.fire({
            icon: 'error',
            title: 'Error',
            text: error.message || 'Error al guardar el material'
        });
    })
    .finally(() => {
        // Restaurar el botón
        botonGuardar.disabled = false;
        botonGuardar.innerHTML = textoOriginal;
    });
}

function verificarISBN() {
    const isbn = document.getElementById('isbn').value.trim();
    const feedbackDiv = document.getElementById('isbn-feedback');
    const ejemplaresDiv = document.getElementById('ejemplares-existentes');
    const listaEjemplaresDiv = document.getElementById('lista-ejemplares');

    if (!isbn) {
        feedbackDiv.innerHTML = '<span class="text-danger">Por favor ingrese un ISBN</span>';
        return;
    }

    // Obtener el token CSRF
    const csrftoken = document.querySelector('[name=csrfmiddlewaretoken]').value;

    fetch('/biblioteca/verificar-isbn/', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
            'X-CSRFToken': csrftoken
        },
        body: `isbn=${encodeURIComponent(isbn)}`
    })
    .then(response => response.json())
    .then(data => {
        if (data.exists) {
            feedbackDiv.innerHTML = '<span class="text-warning">Este ISBN ya está registrado</span>';
            ejemplaresDiv.style.display = 'block';
            
            // Mostrar los ejemplares existentes
            let ejemplaresHTML = '<ul class="list-group">';
            data.ejemplares.forEach(ejemplar => {
                ejemplaresHTML += `
                    <li class="list-group-item d-flex justify-content-between align-items-center">
                        Ejemplar ${ejemplar.numero_copia}
                        <span class="badge bg-${ejemplar.estado === 'disponible' ? 'success' : 'danger'} rounded-pill">
                            ${ejemplar.estado}
                        </span>
                    </li>`;
            });
            ejemplaresHTML += '</ul>';
            listaEjemplaresDiv.innerHTML = ejemplaresHTML;

            // Actualizar el número de copias para empezar después del último ejemplar
            const ultimaCopia = Math.max(...data.ejemplares.map(e => e.numero_copia));
            document.getElementById('numero_copias').min = 1;
            document.getElementById('numero_copias').value = 1;
        } else {
            feedbackDiv.innerHTML = '<span class="text-success">ISBN disponible para registro</span>';
            ejemplaresDiv.style.display = 'none';
        }
    })
    .catch(error => {
        console.error('Error:', error);
        feedbackDiv.innerHTML = '<span class="text-danger">Error al verificar ISBN</span>';
    });
}

function editarEdad(nombre, autor, id) {
    // Llenar el modal con la información del libro
    document.getElementById('libro-id-edad').value = id;
    document.getElementById('libro-nombre-edad').textContent = nombre;
    document.getElementById('libro-autor-edad').textContent = autor;
    
    // Mostrar el modal
    const modal = new bootstrap.Modal(document.getElementById('editarEdadModal'));
    modal.show();
}

function guardarEdad() {
    const libroId = document.getElementById('libro-id-edad').value;
    const nuevaEdad = document.getElementById('edad-recomendada').value;
    
    if (!nuevaEdad) {
        Swal.fire({
            icon: 'error',
            title: 'Error',
            text: 'Por favor seleccione una edad'
        });
        return;
    }

    // Mostrar indicador de carga
    const botonGuardar = document.querySelector('#editarEdadModal .btn-primary');
    const textoOriginal = botonGuardar.innerHTML;
    botonGuardar.disabled = true;
    botonGuardar.innerHTML = '<span class="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span> Guardando...';

    // Obtener el token CSRF
    const csrftoken = document.querySelector('[name=csrfmiddlewaretoken]').value;

    // Realizar la petición para actualizar la edad
    fetch('/biblioteca/actualizar-edad/', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
            'X-CSRFToken': csrftoken
        },
        body: `libro_id=${libroId}&edad=${nuevaEdad}`
    })
    .then(response => response.json())
    .then(data => {
        if (data.success) {
            // Cerrar el modal
            const modal = bootstrap.Modal.getInstance(document.getElementById('editarEdadModal'));
            modal.hide();

            // Buscar la fila del libro y actualizar la edad
            const filas = document.querySelectorAll('.libro-row');
            filas.forEach(fila => {
                const nombreLibro = fila.querySelector('td:first-child').textContent.trim();
                const autorLibro = fila.querySelector('td:nth-child(2)').textContent.trim();
                
                if (nombreLibro === data.nombre && autorLibro === data.autor) {
                    const celdaEdad = fila.querySelector('td:nth-child(3)');
                    celdaEdad.innerHTML = `
                        ${nuevaEdad}
                        <a href="#" onclick="editarEdad('${data.nombre}', '${data.autor}', '${libroId}')" class="text-muted">
                            <i class="bi bi-pencil-square"></i>
                        </a>
                    `;
                    
                    // Agregar clase para la animación de actualización
                    fila.classList.add('fila-actualizada');
                    setTimeout(() => {
                        fila.classList.remove('fila-actualizada');
                    }, 1500);
                }
            });

            // Mostrar mensaje de éxito
            Swal.fire({
                icon: 'success',
                title: '¡Éxito!',
                text: 'Edad actualizada correctamente',
                timer: 2000,
                showConfirmButton: false
            });
        } else {
            throw new Error(data.error || 'Error al actualizar la edad');
        }
    })
    .catch(error => {
        console.error('Error:', error);
        Swal.fire({
            icon: 'error',
            title: 'Error',
            text: error.message || 'Error al actualizar la edad'
        });
    })
    .finally(() => {
        // Restaurar el botón
        botonGuardar.disabled = false;
        botonGuardar.innerHTML = textoOriginal;
    });
}

// Función para mostrar información del libro
function mostrarInfoLibro(id) {
    console.log('info libro')
    // Obtener el modal
    const modalElement = document.getElementById('infoLibroModal');
    modalElement.setAttribute('data-libro-id', id);
    const modal = new bootstrap.Modal(modalElement);
    
    // Mostrar el modal con estado de carga
    document.getElementById('libro-titulo').innerHTML = '<div class="spinner-border spinner-border-sm" role="status"></div> Cargando...';
    document.getElementById('libro-ejemplares').innerHTML = '<div class="text-center"><div class="spinner-border" role="status"></div></div>';
    modal.show();
    
    // Realizar la petición al servidor
    fetch(`/biblioteca/obtener-info-libro/${id}/`)
        .then(response => {
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            return response.json();
        })
        .then(data => {
            if (!data.success) {
                throw new Error(data.error || 'Error al cargar la información');
            }

            console.log('Datos del libro:');

            const libro = data.libro;

            // Actualizar la información básica
            document.getElementById('libro-titulo').textContent = libro.titulo;
            document.getElementById('libro-autor').textContent = libro.autor;
            document.getElementById('libro-editorial').textContent = libro.editorial;
            document.getElementById('libro-isbn').textContent = libro.isbn;
            document.getElementById('libro-dewey').textContent = libro.dewey;
            document.getElementById('libro-anio').textContent = libro.anio;
            document.getElementById('libro-edad').textContent = libro.edad;
            document.getElementById('libro-volumen').textContent = libro.volumen;
            document.getElementById('libro-resumen').textContent = libro.resumen;

            // Actualizar la imagen
            const fotoImg = document.getElementById('libro-foto');
            fotoImg.src = libro.foto_url || '/static/img/no-cover.png';
            fotoImg.alt = `Portada de ${libro.titulo}`;

            // Actualizar la sección de ejemplares
            const ejemplaresContainer = document.getElementById('libro-ejemplares');
            if (libro.ejemplares && libro.ejemplares.length > 0) {
                const ejemplaresHTML = libro.ejemplares.map(ejemplar => `
                    <div class="list-group-item">
                        <div class="d-flex justify-content-between align-items-center">
                            <div>
                                <h6 class="mb-1">Ejemplar ${ejemplar.numero_copia}</h6>
                                <small class="text-muted">Fecha de adquisición: ${ejemplar.fecha_adquisicion}</small>
                            </div>
                            <span class="badge bg-${ejemplar.estado === 'disponible' ? 'success' : 'danger'}">
                                ${ejemplar.estado_display}
                            </span>
                        </div>
                    </div>
                `).join('');
                
                ejemplaresContainer.innerHTML = `
                    <div class="mb-2">
                        <strong>Total de ejemplares:</strong> ${libro.total_ejemplares}
                        <br>
                        <strong>Ejemplares disponibles:</strong> ${libro.ejemplares_disponibles}
                    </div>
                    ${ejemplaresHTML}
                `;
            } else {
                ejemplaresContainer.innerHTML = '<p class="text-muted">No hay ejemplares registrados</p>';
            }
        })
        .catch(error => {
            console.error('Error:', error);
            // Mostrar mensaje de error
            Swal.fire({
                icon: 'error',
                title: 'Error',
                text: error.message || 'Error al cargar la información del libro'
            });
            // Cerrar el modal
            modal.hide();
        });
}

function cambiarFoto() {
    const inputFoto = document.getElementById('nueva-foto');
    const modalElement = document.getElementById('infoLibroModal');
    const libroId = modalElement.getAttribute('data-libro-id');
    
    if (!libroId) {
        Swal.fire({
            icon: 'error',
            title: 'Error',
            text: 'No se pudo identificar el libro'
        });
        return;
    }

    inputFoto.click();

    inputFoto.onchange = function() {
        if (this.files && this.files[0]) {
            const formData = new FormData();
            formData.append('foto', this.files[0]);
            formData.append('libro_id', libroId);

            // Mostrar loading
            const fotoImg = document.getElementById('libro-foto');
            const originalSrc = fotoImg.src;
            fotoImg.src = '/static/img/loading.gif';

            fetch('/biblioteca/actualizar-foto-libro/', {
                method: 'POST',
                body: formData,
                headers: {
                    'X-CSRFToken': document.querySelector('[name=csrfmiddlewaretoken]').value
                }
            })
            .then(response => response.json())
            .then(data => {
                if (data.success) {
                    // Actualizar la imagen con la nueva foto
                    fotoImg.src = data.foto_url + '?t=' + new Date().getTime(); // Evitar caché
                    Swal.fire({
                        icon: 'success',
                        title: '¡Éxito!',
                        text: 'Foto actualizada correctamente',
                        timer: 1500,
                        showConfirmButton: false
                    });
                } else {
                    throw new Error(data.error || 'Error al actualizar la foto');
                }
            })
            .catch(error => {
                console.error('Error:', error);
                fotoImg.src = originalSrc; // Restaurar imagen original en caso de error
                Swal.fire({
                    icon: 'error',
                    title: 'Error',
                    text: error.message || 'Error al actualizar la foto'
                });
            });
        }
    };
}

// ==============================================
// FUNCIONES PARA MARBETES
// ==============================================

// Función para mostrar el marbete
function mostrarMarbete(btn) {
    // Obtener datos del botón
    const dewey = btn.dataset.dewey;
    const autor = btn.dataset.autor;
    const titulo = btn.dataset.titulo;
    const anio = btn.dataset.anio;
    const volumen = btn.dataset.volumen;
    const copia = btn.dataset.copia;

    // Formatear el código del autor (primeras tres letras del apellido en minúsculas)
    const autorCode = autor.split(' ').pop().substring(0, 3).toLowerCase();
    
    // Actualizar el contenido del marbete
    document.getElementById('dewey-code').textContent = dewey;
    document.getElementById('autor-titulo-code').textContent = `${autorCode} ${titulo.substring(0, 1).toLowerCase()}`;
    document.getElementById('anio-code').textContent = anio;
    
    // Mostrar volumen y copia si existen
    let volumenCopiaText = '';
    if (volumen) {
        volumenCopiaText += `v.${volumen} `;
    }
    if (copia) {
        volumenCopiaText += `c.${copia}`;
    }
    document.getElementById('volumen-copia-code').textContent = volumenCopiaText;

    // Mostrar el modal
    const marbeteModal = new bootstrap.Modal(document.getElementById('marbeteModal'));
    marbeteModal.show();
}

// Función para imprimir el marbete
function imprimirMarbete() {
    const contenidoMarbete = document.getElementById('marbete-contenido');
    
    // Crear un nuevo documento para imprimir
    const ventanaImpresion = window.open('', '', 'width=600,height=600');
    ventanaImpresion.document.write('<html><head><title>Marbete</title>');
    
    // Agregar estilos para la impresión
    ventanaImpresion.document.write(`
        <style>
            body {
                font-family: Arial, sans-serif;
                padding: 10mm;
            }
            .marbete {
                width: 50mm;
                padding: 5mm;
                border: 1px solid #000;
                text-align: center;
            }
            .dewey-code {
                font-size: 16pt;
                font-weight: bold;
                margin-bottom: 5mm;
            }
            .autor-titulo {
                font-weight: bold;
                margin-bottom: 3mm;
            }
            .anio {
                margin-bottom: 2mm;
            }
            .volumen-copia {
                font-size: 10pt;
            }
            @media print {
                body {
                    padding: 0;
                }
                .marbete {
                    border: none;
                }
            }
        </style>
    `);
    
    // Agregar el contenido del marbete
    ventanaImpresion.document.write('</head><body><div class="marbete">');
    ventanaImpresion.document.write(contenidoMarbete.innerHTML);
    ventanaImpresion.document.write('</div></body></html>');
    
    // Cerrar el documento y mostrar el diálogo de impresión
    ventanaImpresion.document.close();
    ventanaImpresion.focus();
    
    // Esperar a que el contenido se cargue antes de imprimir
    setTimeout(() => {
        ventanaImpresion.print();
        ventanaImpresion.close();
    }, 250);
}

// ==============================================
// FUNCIONES PARA PRÉSTAMOS Y ALUMNOS
// ==============================================

let alumnoSeleccionadoId = null;
let libroSeleccionadoId = null;

// Función para cargar la lista inicial de alumnos
function cargarAlumnos() {
    const resultadosDiv = document.getElementById('resultados-alumnos');
    const contadorAlumnos = document.getElementById('contador-alumnos');
    
    resultadosDiv.innerHTML = `
        <div class="text-center p-3">
            <div class="spinner-border spinner-border-sm text-primary" role="status"></div>
            <p class="mb-0 mt-2">Cargando alumnos...</p>
        </div>
    `;

    fetch('/biblioteca/buscar_alumnos/?query=')
        .then(response => response.json())
        .then(alumnos => {
            if (alumnos.length > 0) {
                resultadosDiv.innerHTML = alumnos.map(alumno => `
                    <a href="#" class="list-group-item list-group-item-action" 
                       onclick="seleccionarAlumno('${alumno.id}', '${alumno.nombre}', '${alumno.apellido}')">
                        <div class="d-flex justify-content-between align-items-center">
                            <div>
                                <strong>${alumno.nombre}</strong>
                                <br>
                                <small class="text-muted">${alumno.apellido}</small>
                            </div>
                            <i class="bi bi-chevron-right text-muted"></i>
                        </div>
                    </a>
                `).join('');
                if (contadorAlumnos) contadorAlumnos.textContent = `${alumnos.length} alumnos`;
            } else {
                resultadosDiv.innerHTML = `
                    <div class="text-center p-3 text-muted">
                        <i class="bi bi-people" style="font-size: 2rem;"></i>
                        <p class="mb-0 mt-2">No hay alumnos disponibles</p>
                    </div>
                `;
                if (contadorAlumnos) contadorAlumnos.textContent = '0 alumnos';
            }
        })
        .catch(error => {
            console.error('Error:', error);
            resultadosDiv.innerHTML = `
                <div class="text-center p-3 text-danger">
                    <i class="bi bi-exclamation-triangle" style="font-size: 2rem;"></i>
                    <p class="mb-0 mt-2">Error al cargar los alumnos</p>
                </div>
            `;
        });
}

// Función para seleccionar un alumno
function seleccionarAlumno(id, nombre, apellido) {
    alumnoSeleccionadoId = id;
    
    const nombreCompleto = `${nombre} ${apellido}`;
    document.getElementById('alumno-seleccionado').style.display = 'block';
    document.getElementById('alumno-nombre').innerHTML = `
        <i class="bi bi-person-check"></i> ${nombreCompleto}
    `;
    
    // Ocultar la sección de búsqueda
    document.getElementById('alumno-search-prestamo').value = '';
    document.getElementById('resultados-alumnos').parentElement.parentElement.style.display = 'none';
    
    // Habilitar botón de registro si hay un ejemplar seleccionado
    const ejemplarSelect = document.getElementById('ejemplar-select');
    document.getElementById('btn-registrar-prestamo').disabled = !ejemplarSelect.value;
}

// Función para cancelar la selección de alumno
function cancelarSeleccionAlumno() {
    alumnoSeleccionadoId = null;
    document.getElementById('alumno-seleccionado').style.display = 'none';
    document.getElementById('resultados-alumnos').parentElement.parentElement.style.display = 'block';
    document.getElementById('btn-registrar-prestamo').disabled = true;
    document.getElementById('alumno-search-prestamo').focus();
}

// Función para mostrar modal de préstamo
function mostrarModalPrestamo(libroId, titulo, autor, ejemplaresDisponibles) {
    libroSeleccionadoId = libroId;
    
    // Llenar información del libro
    document.getElementById('prestamo-libro-titulo').textContent = titulo;
    document.getElementById('prestamo-libro-autor').textContent = autor;
    document.getElementById('prestamo-ejemplares-disponibles').textContent = ejemplaresDisponibles;

    // Cargar ejemplares disponibles
    cargarEjemplaresDisponibles(libroId);

    // Cargar lista inicial de alumnos
    cargarAlumnos();

    // Limpiar búsqueda anterior
    document.getElementById('alumno-search-prestamo').value = '';
    document.getElementById('alumno-seleccionado').style.display = 'none';
    document.getElementById('btn-registrar-prestamo').disabled = true;
    alumnoSeleccionadoId = null;

    // Mostrar modal
    const modal = new bootstrap.Modal(document.getElementById('prestamoModal'));
    modal.show();
}

function cargarEjemplaresDisponibles(libroId) {
    const select = document.getElementById('ejemplar-select');
    select.innerHTML = '<option value="">Cargando ejemplares...</option>';

    fetch(`/biblioteca/obtener-ejemplares/${libroId}/`)
        .then(response => {
            if (!response.ok) {
                throw new Error(`Error HTTP: ${response.status}`);
            }
            return response.json();
        })
        .then(data => {
            if (data.success) {
                // Filtrar solo los ejemplares disponibles y ordenarlos por número de copia
                const ejemplaresDisponibles = data.ejemplares
                    .filter(ejemplar => ejemplar.estado === 'disponible')
                    .sort((a, b) => a.numero_copia - b.numero_copia);
                
                if (ejemplaresDisponibles.length === 0) {
                    // No hay ejemplares disponibles
                    select.innerHTML = '<option value="">No hay ejemplares disponibles</option>';
                    document.getElementById('btn-registrar-prestamo').disabled = true;
                    return;
                }

                // Si hay ejemplares disponibles
                select.innerHTML = '<option value="">Seleccione un ejemplar</option>';
                ejemplaresDisponibles.forEach(ejemplar => {
                    const option = document.createElement('option');
                    option.value = ejemplar.numero_copia;
                    option.textContent = `Ejemplar ${ejemplar.numero_copia}`;
                    select.appendChild(option);
                });

                // Seleccionar automáticamente el ejemplar con número más bajo
                if (ejemplaresDisponibles.length >= 1) {
                    select.value = ejemplaresDisponibles[0].numero_copia;
                    // Actualizar estado del botón de registro si hay un alumno seleccionado
                    document.getElementById('btn-registrar-prestamo').disabled = !alumnoSeleccionadoId;
                }

                // Actualizar el contador de ejemplares disponibles
                document.getElementById('prestamo-ejemplares-disponibles').textContent = ejemplaresDisponibles.length;
            } else {
                console.error('Error en la respuesta:', data);
                select.innerHTML = '<option value="">Error al cargar ejemplares</option>';
                document.getElementById('btn-registrar-prestamo').disabled = true;
            }
        })
        .catch(error => {
            console.error('Error al cargar ejemplares:', error);
            select.innerHTML = '<option value="">Error al cargar ejemplares</option>';
            document.getElementById('btn-registrar-prestamo').disabled = true;
        });
}

function registrarPrestamo() {
    const ejemplarNumero = document.getElementById('ejemplar-select').value;
    if (!ejemplarNumero || !alumnoSeleccionadoId || !libroSeleccionadoId) {
        Swal.fire({
            icon: 'error',
            title: 'Error',
            text: 'Por favor seleccione un ejemplar y un alumno'
        });
        return;
    }

    const formData = new FormData();
    formData.append('libro_id', libroSeleccionadoId);
    formData.append('alumno_id', alumnoSeleccionadoId);
    formData.append('ejemplar_numero', ejemplarNumero);

    fetch('/biblioteca/registrar_prestamo/', {
        method: 'POST',
        body: formData,
        headers: {
            'X-CSRFToken': document.querySelector('[name=csrfmiddlewaretoken]').value
        }
    })
    .then(response => response.json())
    .then(data => {
        if (data.success) {
            const modal = bootstrap.Modal.getInstance(document.getElementById('prestamoModal'));
            modal.hide();
            
            Swal.fire({
                icon: 'success',
                title: '¡Éxito!',
                text: 'Préstamo registrado correctamente',
                timer: 2000,
                showConfirmButton: false
            }).then(() => {
                window.location.reload();
            });
        } else {
            throw new Error(data.error || 'Error al registrar el préstamo');
        }
    })
    .catch(error => {
        console.error('Error:', error);
        Swal.fire({
            icon: 'error',
            title: 'Error',
            text: error.message || 'Error al registrar el préstamo'
        });
    });
}

// Función para configurar la búsqueda de alumnos
function configurarBusquedaAlumnos(inputId, resultadosId, contadorId) {
    const input = document.getElementById(inputId);
    const resultadosDiv = document.getElementById(resultadosId);
    const contador = document.getElementById(contadorId);
    
    // Verificar solo los elementos requeridos
    if (!input || !resultadosDiv) {
        console.error(`No se encontró el input (${inputId}) o el div de resultados (${resultadosId})`);
        return;
    }

    let timeoutId = null;

    input.addEventListener('input', function() {
        const query = this.value.trim();

        if (timeoutId) {
            clearTimeout(timeoutId);
        }

        // Mostrar loading
        resultadosDiv.innerHTML = `
            <div class="text-center p-3">
                <div class="spinner-border spinner-border-sm text-primary"></div>
                <p class="mb-0 mt-2">Buscando alumnos...</p>
            </div>
        `;

        timeoutId = setTimeout(() => {
            fetch(`/biblioteca/buscar_alumnos/?query=${encodeURIComponent(query)}`)
                .then(response => {
                    if (!response.ok) {
                        throw new Error('Error en la respuesta del servidor');
                    }
                    return response.json();
                })
                .then(alumnos => {
                    if (Array.isArray(alumnos) && alumnos.length > 0) {
                        resultadosDiv.innerHTML = alumnos.map(alumno => `
                            <a href="#" class="list-group-item list-group-item-action" 
                               onclick="seleccionarAlumno('${alumno.id}', '${alumno.nombre}', '${alumno.apellido}'); return false;">
                                <div class="d-flex justify-content-between align-items-center">
                                    <div>
                                        <strong>${alumno.nombre}</strong>
                                        <br>
                                        <small class="text-muted">
                                            ${alumno.apellido}
                                            ${alumno.curso ? ` - ${alumno.curso}` : ''}
                                        </small>
                                    </div>
                                    <i class="bi bi-chevron-right text-muted"></i>
                                </div>
                            </a>
                        `).join('');
                        
                        // Actualizar contador solo si existe el elemento
                        if (contador) {
                            contador.textContent = `${alumnos.length} alumnos encontrados`;
                        }
                    } else {
                        resultadosDiv.innerHTML = `
                            <div class="text-center p-3 text-muted">
                                <i class="bi bi-search" style="font-size: 2rem;"></i>
                                <p class="mb-0 mt-2">No se encontraron alumnos${query ? ` con "${query}"` : ''}</p>
                            </div>
                        `;
                        // Actualizar contador solo si existe el elemento
                        if (contador) {
                            contador.textContent = '0 alumnos';
                        }
                    }
                })
                .catch(error => {
                    console.error('Error en la búsqueda:', error);
                    resultadosDiv.innerHTML = `
                        <div class="text-center p-3 text-danger">
                            <i class="bi bi-exclamation-triangle" style="font-size: 2rem;"></i>
                            <p class="mb-0 mt-2">Error al buscar alumnos: ${error.message}</p>
                        </div>
                    `;
                });
        }, 300);
    });
}

// ==============================================
// FUNCIONES PARA RESERVAS
// ==============================================

// Función para configurar la búsqueda de alumnos para reservas
function configurarBusquedaReserva() {
    const input = document.getElementById('alumno-search-reserva');
    const resultadosDiv = document.getElementById('alumno-results');
    let timeoutId = null;

    if (!input || !resultadosDiv) {
        console.error('No se encontraron los elementos necesarios para la búsqueda de reserva');
        return;
    }

    input.addEventListener('input', function() {
        const query = this.value.trim();

        // Limpiar timeout anterior
        if (timeoutId) {
            clearTimeout(timeoutId);
        }

        // Mostrar loading
        resultadosDiv.innerHTML = `
            <div class="list-group-item text-center">
                <div class="spinner-border spinner-border-sm text-primary" role="status"></div>
                <p class="mb-0 mt-2">Buscando alumnos...</p>
            </div>
        `;

        // Si el input está vacío, mostrar mensaje
        if (!query) {
            resultadosDiv.innerHTML = `
                <div class="list-group-item text-center text-muted">
                    <i class="bi bi-search"></i>
                    <p class="mb-0">Ingrese un nombre para buscar</p>
                </div>
            `;
            return;
        }

        timeoutId = setTimeout(() => {
            fetch(`/biblioteca/buscar_alumnos/?query=${encodeURIComponent(query)}`)
                .then(response => {
                    if (!response.ok) {
                        throw new Error('Error en la respuesta del servidor');
                    }
                    return response.json();
                })
                .then(alumnos => {
                    if (Array.isArray(alumnos) && alumnos.length > 0) {
                        resultadosDiv.innerHTML = alumnos.map(alumno => `
                            <button type="button" 
                                    class="list-group-item list-group-item-action" 
                                    onclick="seleccionarAlumnoReserva('${alumno.id}', '${alumno.nombre}', '${alumno.apellido}')">
                                <div class="d-flex justify-content-between align-items-center">
                                    <div>
                                        <strong>${alumno.nombre} ${alumno.apellido}</strong>
                                        ${alumno.curso ? `<br><small class="text-muted">Curso: ${alumno.curso}</small>` : ''}
                                    </div>
                                    <i class="bi bi-chevron-right"></i>
                                </div>
                            </button>
                        `).join('');
                    } else {
                        resultadosDiv.innerHTML = `
                            <div class="list-group-item text-center text-muted">
                                <i class="bi bi-exclamation-circle"></i>
                                <p class="mb-0">No se encontraron alumnos con "${query}"</p>
                            </div>
                        `;
                    }
                })
                .catch(error => {
                    console.error('Error:', error);
                    resultadosDiv.innerHTML = `
                        <div class="list-group-item text-center text-danger">
                            <i class="bi bi-exclamation-triangle"></i>
                            <p class="mb-0">Error al buscar alumnos: ${error.message}</p>
                        </div>
                    `;
                });
        }, 300);
    });

    // Limpiar resultados al cerrar el modal
    const reservaModal = document.getElementById('reservaModal');
    if (reservaModal) {
        reservaModal.addEventListener('hidden.bs.modal', function() {
            input.value = '';
            resultadosDiv.innerHTML = '';
        });
    }
}

// Función para seleccionar alumno en reserva
function seleccionarAlumnoReserva(id, nombre, apellido) {
    const nombreCompleto = `${nombre} ${apellido}`;
    
    // Actualizar el input con el nombre seleccionado
    document.getElementById('alumno-search-reserva').value = nombreCompleto;
    
    // Limpiar resultados
    document.getElementById('alumno-results').innerHTML = '';
    
    // Habilitar botón de confirmar reserva
    const btnConfirmar = document.getElementById('confirmar-reserva');
    if (btnConfirmar) {
        btnConfirmar.disabled = false;
    }

    // Guardar ID del alumno seleccionado
    document.getElementById('libro-id').value = id;

    // Mostrar feedback de selección
    Swal.fire({
        icon: 'success',
        title: 'Alumno seleccionado',
        text: `Has seleccionado a ${nombreCompleto}`,
        timer: 1500,
        showConfirmButton: false,
        position: 'top-end',
        toast: true
    });
}

// ==============================================
// AUTORES SEARCH FUNCTIONALITY
// ==============================================

// Array para almacenar los autores seleccionados
let autoresSeleccionados = [];
let timeoutAutores;

function buscarAutores(query) {
    if (timeoutAutores) {
        clearTimeout(timeoutAutores);
    }

    const suggestionsDiv = document.getElementById('autores-suggestions');
    const autoresInput = document.getElementById('autores-search');

    if (!query.trim()) {
        suggestionsDiv.style.display = 'none';
        return;
    }

    timeoutAutores = setTimeout(() => {
        autoresInput.classList.add('loading');

        fetch(`/biblioteca/buscar_autores/?q=${encodeURIComponent(query)}`)
        .then(response => response.json())
        .then(data => {
            autoresInput.classList.remove('loading');
            
            if (data.length > 0) {
                suggestionsDiv.innerHTML = '';
                suggestionsDiv.style.display = 'block';

                data.forEach(autor => {
                    if (!autoresSeleccionados.some(a => a.id === autor.id)) {
                        const item = document.createElement('a');
                        item.className = 'list-group-item list-group-item-action';
                        item.href = '#';
                        item.textContent = autor.nombre;
                        item.dataset.id = autor.id;
                        
                        item.onclick = (e) => {
                            e.preventDefault();
                            seleccionarAutor(autor.id, autor.nombre);
                        };

                        suggestionsDiv.appendChild(item);
                    }
                });

                if (suggestionsDiv.children.length === 0) {
                    suggestionsDiv.style.display = 'none';
                }
            } else {
                suggestionsDiv.style.display = 'none';
            }
        })
        .catch(error => {
            console.error('Error:', error);
            autoresInput.classList.remove('loading');
            suggestionsDiv.style.display = 'none';
        });
    }, 300);
}

function seleccionarAutor(id, nombre) {
    if (!autoresSeleccionados.some(a => a.id === id)) {
        autoresSeleccionados.push({ id: id, nombre: nombre });
        actualizarTagsAutores();
        actualizarInputAutores();
    }

    const autoresInput = document.getElementById('autores-search');
    const suggestionsDiv = document.getElementById('autores-suggestions');
    
    autoresInput.value = '';
    autoresInput.style.width = '100px';
    suggestionsDiv.style.display = 'none';
    
    autoresInput.focus();
}

function agregarAutorPorEnter(nombreAutor) {
    nombreAutor = nombreAutor.trim();
    if (nombreAutor) {
        if (!autoresSeleccionados.some(a => a.nombre.toLowerCase() === nombreAutor.toLowerCase())) {
            autoresSeleccionados.push({ id: null, nombre: nombreAutor });
            actualizarTagsAutores();
            actualizarInputAutores();
            return true;
        }
    }
    return false;
}

function actualizarTagsAutores() {
    const container = document.getElementById('autores-tags-container');
    
    container.innerHTML = '';
    
    autoresSeleccionados.forEach((autor, index) => {
        const tag = document.createElement('div');
        tag.className = 'me-1 mb-1 mt-1';
        tag.innerHTML = `
            <span class="badge bg-primary d-flex align-items-center">
                <span>${autor.nombre}</span>
                <button type="button" class="btn-close btn-close-white ms-2" 
                        style="font-size: 0.5rem;" 
                        onclick="removeAutor(${index})"></button>
            </span>
        `;
        container.appendChild(tag);
    });

    const inputGroup = document.getElementById('autores-search').closest('.input-group');
    if (autoresSeleccionados.length > 0) {
        inputGroup.classList.remove('is-invalid');
        inputGroup.classList.add('is-valid');
    } else {
        inputGroup.classList.remove('is-valid', 'is-invalid');
    }
}

function actualizarInputAutores() {
    const autoresHidden = document.getElementById('autores');
    const nombresAutores = autoresSeleccionados.map(autor => autor.nombre).join(', ');
    autoresHidden.value = nombresAutores;
}

function removeAutor(index) {
    autoresSeleccionados.splice(index, 1);
    actualizarTagsAutores();
    actualizarInputAutores();
    document.getElementById('autores-search').focus();
}

function limpiarAutores() {
    autoresSeleccionados = [];
    actualizarTagsAutores();
    actualizarInputAutores();
}

function configurarAutoresSearch() {
    const autoresSearchInput = document.getElementById('autores-search');
    if (!autoresSearchInput || autoresSearchInput.dataset.configured === 'true') {
        return;
    }

    // Ajustar ancho y búsqueda al escribir
    autoresSearchInput.addEventListener('input', function() {
        this.style.width = ((this.value.length + 1) * 8) + 'px';
        const query = this.value.trim();
        if (query.length > 0) {
            buscarAutores(query);
        } else {
            const suggestions = document.getElementById('autores-suggestions');
            if (suggestions) {
                suggestions.style.display = 'none';
            }
        }
    });
    
    // Manejar tecla Enter y navegación
    autoresSearchInput.addEventListener('keydown', function(e) {
        const suggestions = document.getElementById('autores-suggestions');
        
        if (e.key === 'ArrowDown' || e.key === 'ArrowUp') {
            e.preventDefault();
            if (suggestions.style.display === 'block') {
                const items = suggestions.querySelectorAll('.list-group-item-action');
                const activeItem = suggestions.querySelector('.active');
                let index = Array.from(items).indexOf(activeItem);
                
                if (e.key === 'ArrowDown') index = (activeItem ? index + 1 : 0) % items.length;
                if (e.key === 'ArrowUp') index = (activeItem ? index - 1 : items.length - 1) % items.length;
                
                items.forEach(item => item.classList.remove('active'));
                items[index].classList.add('active');
                items[index].scrollIntoView({ block: 'nearest' });
            }
        }
        
        if (e.key === 'Enter' || e.keyCode === 13) {
            e.preventDefault();
            e.stopPropagation();
            
            const activeItem = suggestions.querySelector('.active');
            if (activeItem) {
                // Si hay un ítem activo en las sugerencias, seleccionarlo
                const id = activeItem.dataset.id;
                const nombre = activeItem.textContent;
                seleccionarAutor(id, nombre);
            } else {
                // Si no hay ítem activo, agregar como nuevo autor
                const nombreAutor = this.value.trim();
                if (nombreAutor && agregarAutorPorEnter(nombreAutor)) {
                    this.value = '';
                    this.style.width = '100px';
                }
            }
            
            suggestions.style.display = 'none';
        }
        
        if (e.key === 'Escape') {
            suggestions.style.display = 'none';
            this.value = '';
            this.style.width = '100px';
        }
    }, true);

    // Marcar como configurado
    autoresSearchInput.dataset.configured = 'true';
}

// Inicializar la funcionalidad cuando el DOM esté listo
document.addEventListener('DOMContentLoaded', function() {
    configurarAutoresSearch();
    
    // Cerrar sugerencias al hacer clic fuera
    document.addEventListener('click', function(e) {
        const suggestions = document.getElementById('autores-suggestions');
        const autoresInput = document.getElementById('autores-search');
        
        if (suggestions && autoresInput && 
            !suggestions.contains(e.target) && 
            !autoresInput.contains(e.target)) {
            suggestions.style.display = 'none';
        }
    });

    // Limpiar autores al cerrar el modal
    const modal = document.getElementById('agregarMaterialModal');
    if (modal) {
        modal.addEventListener('hidden.bs.modal', function() {
            limpiarAutores();
            const suggestions = document.getElementById('autores-suggestions');
            if (suggestions) {
                suggestions.style.display = 'none';
            }
            const autoresInput = document.getElementById('autores-search');
            if (autoresInput) {
                autoresInput.value = '';
                autoresInput.style.width = '100px';
                autoresInput.classList.remove('is-valid', 'is-invalid');
            }
        });
    }
});