// Función para inicializar eventos de galería de imágenes
function initializeImageGalleryEvents() {
    document.querySelectorAll('.image-gallery img').forEach(img => {
        // Remover listener previo si existe
        img.removeEventListener('click', handleImageClick);
        // Agregar nuevo listener
        img.addEventListener('click', handleImageClick);
    });
}

// Función para manejar clics en imágenes de galería
function handleImageClick() {
    const modal = bootstrap.Modal.getOrCreateInstance(document.querySelector(this.dataset.bsTarget));
    const carousel = bootstrap.Carousel.getOrCreateInstance(document.querySelector(this.dataset.bsTarget + ' .carousel'));
    carousel.to(parseInt(this.dataset.bsSlideTo));
    modal.show();
}

document.addEventListener('DOMContentLoaded', function() {
    const actividadForm = document.getElementById('actividadForm');
    const galeriaContainer = document.getElementById('galeria-container');

    // Inicializar eventos de galería al cargar la página
    initializeImageGalleryEvents();

    // Limpiar formulario cuando se abre el modal
    const modal = document.getElementById('subirActividadModal');
    if (modal) {
        modal.addEventListener('show.bs.modal', function() {
            resetearFormulario();
        });
    }

    function resetearFormulario() {
        if (actividadForm) {
            actividadForm.reset();
            document.getElementById('imagePreview').innerHTML = '';
            // Resetear el input de archivos
            const imagenesInput = document.getElementById('imagenes');
            if (imagenesInput) {
                imagenesInput.value = '';
            }
        }
    }

    if (actividadForm) {
        actividadForm.addEventListener('submit', function(e) {
            e.preventDefault();
            
            // Validar archivos
            const imagenesInput = document.getElementById('imagenes');
            const files = imagenesInput.files;
            const maxSize = 5 * 1024 * 1024; // 5MB
            const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/heic', 'image/heif', 'image/webp'];
            
            for (let file of files) {
                if (!allowedTypes.includes(file.type)) {
                    mostrarMensaje('Tipo de archivo no permitido: ' + file.name, 'danger');
                    return;
                }
                if (file.size > maxSize) {
                    mostrarMensaje('Archivo muy grande (máx 5MB): ' + file.name, 'danger');
                    return;
                }
            }
            
            const formData = new FormData(this);
            const submitBtn = this.querySelector('button[type="submit"]');
            const btnText = submitBtn.querySelector('.btn-text');
            const originalText = btnText.textContent;
            
            // Mostrar indicador de carga
            submitBtn.disabled = true;
            btnText.innerHTML = '<span class="spinner-border spinner-border-sm me-2"></span>Subiendo...';

            $.ajax({
                url: actividadForm.action,
                type: 'POST',
                data: formData,
                processData: false,
                contentType: false,
                success: function(response) {
                    if (response.success) {
                        // Cerrar modal y resetear formulario
                        const modal = bootstrap.Modal.getInstance(document.getElementById('subirActividadModal'));
                        modal.hide();
                        resetearFormulario();
                        agregarNuevaActividad(response.actividad);
                        mostrarMensaje('Actividad guardada exitosamente', 'success');
                    } else {
                        mostrarMensaje('Error al guardar la actividad: ' + response.error, 'danger');
                    }
                },
                error: function(xhr, status, error) {
                    console.error('Error:', error);
                    mostrarMensaje('Error al guardar la actividad', 'danger');
                },
                complete: function() {
                    // Restaurar botón
                    submitBtn.disabled = false;
                    btnText.textContent = originalText;
                }
            });
        });
    }

    // Preview de imágenes
    const imagenesInput = document.getElementById('imagenes');
    if (imagenesInput) {
        imagenesInput.addEventListener('change', function(e) {
            const preview = document.getElementById('imagePreview');
            preview.innerHTML = '';
            
            Array.from(e.target.files).forEach(file => {
                if (file.type.startsWith('image/')) {
                    const reader = new FileReader();
                    reader.onload = function(e) {
                        const img = document.createElement('img');
                        img.src = e.target.result;
                        img.className = 'img-thumbnail m-1';
                        img.style.maxWidth = '100px';
                        img.style.maxHeight = '100px';
                        preview.appendChild(img);
                    };
                    reader.readAsDataURL(file);
                }
            });
        });
    }

    $(document).on('click', '.eliminar-actividad', function(e) {
        e.preventDefault();
        const actividadId = $(this).data('id');
        if (confirm('¿Está seguro de que desea eliminar esta actividad?')) {
            eliminarActividad(actividadId);
        }
    });

    function eliminarActividad(actividadId) {
        $.ajax({
            url: `/fotos/eliminar/${actividadId}/`,
            type: 'POST',
            headers: {
                'X-CSRFToken': getCookie('csrftoken')
            },
            success: function(response) {
                if (response.success) {
                    // Eliminar la actividad y su modal asociado
                    const actividadElement = $(`[data-id="${actividadId}"]`).closest('.actividad');
                    const modalId = `carouselModalactividad_${actividadId}`;
                    $(`#${modalId}`).remove();
                    actividadElement.remove();
                    
                    // Verificar si no quedan más actividades
                    const remainingActividades = galeriaContainer.querySelectorAll('.actividad, .noticia-galeria');
                    if (remainingActividades.length === 0) {
                        mostrarEstadoVacio();
                    }
                    
                    mostrarMensaje('Actividad eliminada exitosamente', 'success');
                } else {
                    mostrarMensaje('Error al eliminar la actividad: ' + response.error, 'danger');
                }
            },
            error: function(xhr, status, error) {
                console.error('Error:', error);
                mostrarMensaje('Error al eliminar la actividad', 'danger');
            }
        });
    }

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

    function actualizarListaActividades() {
        $.ajax({
            url: '/fotos/',
            type: 'GET',
            success: function(response) {
                galeriaContainer.innerHTML = $(response).find('#galeria-container').html();
            },
            error: function(xhr, status, error) {
                console.error('Error al actualizar la lista de actividades:', error);
            }
        });
    }

    function agregarNuevaActividad(actividad) {
        // Verificar si existe el contenedor de estado vacío y eliminarlo
        const emptyContainer = galeriaContainer.querySelector('.empty-events-container');
        if (emptyContainer) {
            emptyContainer.closest('.row').remove();
        }

        const actividadId = `actividad_${actividad.id}`;
        const nuevaActividadHTML = `
            <div class="actividad my-3 p-3 rounded shadow-sm nueva-actividad">
                <div class="d-flex justify-content-between align-items-center border-bottom pb-2 mb-0">
                    <h6 class="negrita m-0">
                        <svg class="bd-placeholder-img flex-shrink-0 me-2 rounded" width="32" height="32" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="Placeholder: 32x32" preserveAspectRatio="xMidYMid slice" focusable="false">
                            <title>Placeholder</title>
                            <rect width="100%" height="100%" fill="#007bff"/>
                            <text x="50%" y="50%" fill="#007bff" dy=".3em">32x32</text>
                        </svg>
                        ${actividad.titulo}
                    </h6>
                    <button class="btn btn-danger btn-sm eliminar-actividad" data-id="${actividad.id}">Eliminar</button>
                </div>
                <div class="text-right text-muted">
                    <small>Fecha: ${actividad.fecha}</small>
                </div>
                <div class="d-flex text-muted pt-3">
                    <div class="pb-3 mb-0 small lh-sm w-100">
                        <div class="image-gallery mt-2">
                            ${actividad.imagenes.map((img, index) => `
                                <img src="${img.url}" alt="${actividad.titulo}" class="img-thumbnail m-1" style="max-width: 150px; max-height: 150px;" data-bs-toggle="modal" data-bs-target="#carouselModal${actividadId}" data-bs-slide-to="${index}">
                            `).join('')}
                        </div>
                    </div>
                </div>
            </div>
        `;

        // Modal para el carrusel (se agrega al final del documento)
        const modalHTML = `
            <div class="modal fade" id="carouselModal${actividadId}" tabindex="-1" aria-hidden="true">
                <div class="modal-dialog modal-dialog-centered modal-xl">
                    <div class="modal-content carousel-modal-bg text-white d-flex flex-column justify-content-center">
                        <div class="modal-header border-0">
                            <h5 class="modal-title">${actividad.titulo}</h5>
                            <button type="button" class="btn-close btn-close-white" data-bs-dismiss="modal" aria-label="Cerrar"></button>
                        </div>
                        <div class="modal-body p-0 flex-grow-1 d-flex align-items-center">
                            <div id="carousel${actividadId}" class="carousel slide w-100" data-bs-ride="carousel">
                                <div class="carousel-inner">
                                    ${actividad.imagenes.map((img, index) => `
                                        <div class="carousel-item ${index === 0 ? 'active' : ''}">
                                            <div class="d-flex justify-content-center align-items-center" style="height: 60vh;">
                                                <img src="${img.url}" class="img-fluid rounded" alt="${actividad.titulo}" style="max-height: 100%; max-width: 100%; object-fit: contain;">
                                            </div>
                                        </div>
                                    `).join('')}
                                </div>
                                ${actividad.imagenes.length > 1 ? `
                                    <button class="carousel-control-prev" type="button" data-bs-target="#carousel${actividadId}" data-bs-slide="prev">
                                        <span class="carousel-control-prev-icon" aria-hidden="true"></span>
                                        <span class="visually-hidden">Anterior</span>
                                    </button>
                                    <button class="carousel-control-next" type="button" data-bs-target="#carousel${actividadId}" data-bs-slide="next">
                                        <span class="carousel-control-next-icon" aria-hidden="true"></span>
                                        <span class="visually-hidden">Siguiente</span>
                                    </button>
                                ` : ''}
                            </div>
                        </div>
                        <div class="modal-footer border-0">
                            <p class="text-muted small">Imagen 1 de ${actividad.imagenes.length}</p>
                        </div>
                    </div>
                </div>
            </div>
        `;

        // Insertar la nueva actividad al principio del contenedor
        galeriaContainer.insertAdjacentHTML('afterbegin', nuevaActividadHTML);
        
        // Agregar el modal al final del documento
        document.body.insertAdjacentHTML('beforeend', modalHTML);
        
        // Inicializar los event listeners para las nuevas imágenes
        initializeImageGalleryEvents();
        
        // Añadir animación de entrada
        const nuevaActividad = galeriaContainer.querySelector('.nueva-actividad');
        if (nuevaActividad) {
            setTimeout(() => {
                nuevaActividad.classList.add('mostrar');
            }, 100);
            
            // Remover las clases de animación después de que termine
            setTimeout(() => {
                nuevaActividad.classList.remove('nueva-actividad', 'mostrar');
            }, 600);
        }
    }

    function mostrarEstadoVacio() {
        const estadoVacioHTML = `
            <div class="row justify-content-center">
                <div class="col-12 col-md-8 col-lg-6">
                    <div class="empty-events-container">
                        <div class="empty-events-content">
                            <div class="empty-events-icon">
                                <i class="bi bi-calendar-event fs-1 mb-3"></i>
                            </div>
                            <h3 class="empty-events-title">¡Próximamente nuevas fotos!</h3>
                            <p class="empty-events-message">Estamos preparando actividades emocionantes para nuestra comunidad educativa.</p>
                            <div class="empty-events-animation">
                                <div class="pulse-circle"></div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        `;
        galeriaContainer.innerHTML = estadoVacioHTML;
    }

    function mostrarMensaje(mensaje, tipo) {
        const alertPlaceholder = document.getElementById('liveAlertPlaceholder');
        const wrapper = document.createElement('div');
        wrapper.innerHTML = [
            `<div class="alert alert-${tipo} alert-dismissible" role="alert">`,
            `   <div>${mensaje}</div>`,
            '   <button type="button" class="btn-close" data-bs-dismiss="alert" aria-label="Close"></button>',
            '</div>'
        ].join('');
        alertPlaceholder.append(wrapper);

        // Eliminar la alerta después de 5 segundos
        setTimeout(() => {
            wrapper.remove();
        }, 5000);
    }
});
