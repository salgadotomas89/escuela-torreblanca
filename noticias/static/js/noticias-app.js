document.addEventListener('DOMContentLoaded', function() {
    // ========================================
    // UTILIDADES COMPARTIDAS
    // ========================================
    
    // Función getCookie para manejo de CSRF tokens
    window.getCookie = function(name) {
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
    };

    // Función para mostrar mensajes de alerta
    function mostrarMensaje(mensaje, tipo) {
        const alertPlaceholder = document.getElementById('liveAlertPlaceholder');
        if (alertPlaceholder) {
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
    }

    // ========================================
    // EDITOR DE TEXTO ENRIQUECIDO
    // ========================================
    
    const toolbar = document.getElementById('editor-toolbar');
    const editorContent = document.getElementById('editor-content');
    const hiddenTextarea = document.getElementById('hidden-editor');

    // Función para limpiar y formatear el contenido HTML
    function cleanHTMLContent(htmlContent) {
        // Crear un div temporal para manipular el HTML
        const tempDiv = document.createElement('div');
        tempDiv.innerHTML = htmlContent;
        
        // Remover atributos innecesarios y limpiar el contenido
        const elements = tempDiv.querySelectorAll('*');
        elements.forEach(el => {
            // Mantener solo los atributos esenciales
            const tagName = el.tagName.toLowerCase();
            const allowedAttributes = {
                'a': ['href', 'target'],
                'img': ['src', 'alt']
            };
            
            if (allowedAttributes[tagName]) {
                const attrs = Array.from(el.attributes);
                attrs.forEach(attr => {
                    if (!allowedAttributes[tagName].includes(attr.name)) {
                        el.removeAttribute(attr.name);
                    }
                });
            } else {
                // Para otros elementos, remover todos los atributos
                const attrs = Array.from(el.attributes);
                attrs.forEach(attr => el.removeAttribute(attr.name));
            }
        });
        
        return tempDiv.innerHTML;
    }

    // Manejo de la barra de herramientas del editor
    if (toolbar) {
        toolbar.addEventListener('click', function(e) {
            const button = e.target.closest('button');
            if (!button) return;
            
            e.preventDefault();
            
            // Enfocar el editor antes de ejecutar comandos
            if (editorContent) {
                editorContent.focus();
            }
            
            const command = button.dataset.command;
            if (command === 'createLink') {
                const url = prompt('Ingrese la URL del enlace:');
                if (url) {
                    document.execCommand(command, false, url);
                }
            } else if (command) {
                document.execCommand(command, false, null);
            }
            
            // Actualizar el estado visual de los botones
            updateToolbarButtons();
            
            // Sincronizar contenido
            if (editorContent && hiddenTextarea) {
                hiddenTextarea.value = cleanHTMLContent(editorContent.innerHTML);
            }
        });
    }

    // Función para actualizar el estado visual de los botones de la toolbar
    function updateToolbarButtons() {
        if (!toolbar) return;
        
        const buttons = toolbar.querySelectorAll('.editor-btn');
        buttons.forEach(button => {
            const command = button.dataset.command;
            if (command && command !== 'createLink') {
                try {
                    const isActive = document.queryCommandState(command);
                    button.classList.toggle('active', isActive);
                } catch (e) {
                    // Ignorar errores para comandos no soportados
                }
            }
        });
    }

    // Sincronizar contenido del editor con textarea oculto
    if (editorContent && hiddenTextarea) {
        editorContent.addEventListener('input', function() {
            hiddenTextarea.value = cleanHTMLContent(editorContent.innerHTML);
        });
        
        // Actualizar botones cuando cambie la selección
        editorContent.addEventListener('keyup', updateToolbarButtons);
        editorContent.addEventListener('mouseup', updateToolbarButtons);
        
        // Placeholder para el editor
        editorContent.addEventListener('focus', function() {
            if (this.innerHTML === '' || this.innerHTML === '<br>') {
                this.innerHTML = '';
            }
        });
        
        editorContent.addEventListener('blur', function() {
            if (this.innerHTML === '' || this.innerHTML === '<br>') {
                this.innerHTML = '';
            }
        });
    }

    // ========================================
    // GENERACIÓN DE TEXTO CON IA
    // ========================================
    
  
    
    
    
   
    // ========================================
    // VALIDACIÓN Y ENVÍO DEL FORMULARIO
    // ========================================
    
    const noticiaForm = document.getElementById('noticia-form');
    
    if (noticiaForm) {
        // Validación del formulario
        noticiaForm.addEventListener('submit', function(e) {
            // Sincronizar contenido del editor antes del envío
            if (editorContent && hiddenTextarea) {
                hiddenTextarea.value = cleanHTMLContent(editorContent.innerHTML);
            }

            // Validar que el editor tenga contenido
            if (hiddenTextarea && (hiddenTextarea.value.trim() === '' || hiddenTextarea.value.trim() === '<br>')) {
                e.preventDefault();
                e.stopPropagation();
                if (editorContent) {
                    editorContent.classList.add('is-invalid');
                }
                mostrarMensaje('Por favor, escriba el contenido de la noticia', 'warning');
                return;
            } else {
                // Remover clase de error si el contenido es válido
                if (editorContent) {
                    editorContent.classList.remove('is-invalid');
                }
            }

            // Si llegamos aquí, el formulario es válido, continuar con el envío AJAX
            e.preventDefault();

            const formData = new FormData(noticiaForm);
            const submitBtn = noticiaForm.querySelector('button[type="submit"]');
            const originalText = submitBtn?.textContent;
            
            // Mostrar indicador de carga
            if (submitBtn) {
                submitBtn.disabled = true;
                submitBtn.innerHTML = '<span class="spinner-border spinner-border-sm me-2"></span>Guardando...';
            }

            fetch('/noticias/crear-noticia/', {
                method: 'POST',
                headers: {
                    'X-CSRFToken': getCookie('csrftoken')
                },
                body: formData
            })
            .then(response => response.json())
            .then(data => {
                if (data.success) {
                    // Mostrar mensaje de éxito primero
                    mostrarMensaje('Noticia creada exitosamente', 'success');

                    // Cerrar modal y limpiar formulario después de un breve delay
                    setTimeout(() => {
                        const modal = bootstrap.Modal.getInstance(document.getElementById('modalNoticia'));
                        if (modal) modal.hide();
                        noticiaForm.reset();

                        // Limpiar editor
                        if (editorContent) editorContent.innerHTML = '';
                        if (hiddenTextarea) hiddenTextarea.value = '';

                        // Limpiar indicadores de archivos
                        const imagenesSelected = document.getElementById('imagenes-selected');
                        const audioSelected = document.getElementById('audio-selected');
                        if (imagenesSelected) imagenesSelected.textContent = '';
                        if (audioSelected) audioSelected.textContent = '';

                        // Recargar la página después de otro breve delay
                        setTimeout(() => {
                            location.reload();
                        }, 1000);
                    }, 1200); // Espera 1.2 segundos antes de cerrar el modal
                } else {
                    mostrarMensaje('Error al guardar la noticia: ' + (data.error || 'Error desconocido'), 'danger');
                }
            })
            .catch(error => {
                mostrarMensaje('Error al guardar la noticia', 'danger');
                console.error(error);
            })
            .finally(() => {
                // Restaurar botón
                if (submitBtn && originalText) {
                    submitBtn.disabled = false;
                    submitBtn.textContent = originalText;
                }
            });
        });
    }

    // ========================================
    // MANEJO DE ARCHIVOS SELECCIONADOS
    // ========================================
    
    // Manejo de selección de imágenes
    const imagenesInput = document.getElementById('imagenes');
    if (imagenesInput) {
        imagenesInput.addEventListener('change', function(e) {
            const allowedTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/jpg'];
            const maxFiles = 5; // Máximo de imágenes permitidas
            const maxSizeMB = 2; // Tamaño máximo por imagen en MB
            let valid = true;
            let fileNames = [];

            if (this.files.length > maxFiles) {
                mostrarMensaje(`Solo puedes subir hasta ${maxFiles} imágenes.`, 'danger');
                this.value = '';
                document.getElementById('imagenes-selected').textContent = '';
                return;
            }

            for (const file of this.files) {
                if (!allowedTypes.includes(file.type)) {
                    valid = false;
                    mostrarMensaje(`El archivo "${file.name}" no es un tipo de imagen permitido.`, 'danger');
                } else if (file.size > maxSizeMB * 1024 * 1024) {
                    valid = false;
                    mostrarMensaje(`"${file.name}" supera el tamaño máximo de ${maxSizeMB} MB.`, 'danger');
                } else {
                    fileNames.push(file.name);
                }
            }
            const selectedDiv = document.getElementById('imagenes-selected');
            if (selectedDiv) {
                selectedDiv.textContent = fileNames.length ? fileNames.join(', ') : 'No se han seleccionado archivos válidos';
            }
            if (!valid) {
                this.value = ''; // Limpia el input si hay archivos no válidos
            }
        });
    }

    // Manejo de selección de audio
    const audioInput = document.getElementById('audio');
    if (audioInput) {
        audioInput.addEventListener('change', function(e) {
            const fileName = this.files[0] ? this.files[0].name : 'No se ha seleccionado ningún archivo';
            const selectedDiv = document.getElementById('audio-selected');
            if (selectedDiv) {
                selectedDiv.textContent = fileName;
            }
        });
    }

    // ========================================
    // ELIMINACIÓN DE NOTICIAS
    // ========================================
    
    // Función mejorada para eliminar noticia
    function eliminarNoticia(noticiaId, elemento) {
        console.log('Función eliminarNoticia llamada con ID:', noticiaId); // Debug
        
        // Simplificar usando confirm básico
        if (confirm('¿Está seguro de que desea eliminar esta noticia?')) {
            console.log('Usuario confirmó eliminación'); // Debug
            
            const submitBtn = elemento;
            const originalHTML = submitBtn?.innerHTML;
            
            // Mostrar indicador de carga
            if (submitBtn) {
                submitBtn.disabled = true;
                submitBtn.innerHTML = '<span class="spinner-border spinner-border-sm me-2"></span>Eliminando...';
            }

            console.log('Enviando petición fetch a:', `/noticias/delete/noticia/${noticiaId}`); // Debug

            fetch(`/noticias/delete/noticia/${noticiaId}`, {
                method: 'POST',
                headers: {
                    'X-CSRFToken': getCookie('csrftoken'),
                    'Content-Type': 'application/json',
                },
            })
            .then(response => {
                console.log('Respuesta recibida:', response); // Debug
                return response.json();
            })
            .then(data => {
                console.log('Datos de respuesta:', data); // Debug
                
                if (data.message) {
                    // Mostrar mensaje de éxito
                    mostrarMensaje(data.message, 'success');
                    
                    // Eliminar el elemento del DOM
                    eliminarElementoDelDOM(noticiaId, elemento);
                    
                    // Verificar si quedan noticias
                    verificarNoticiasRestantes();
                    
                } else if (data.error) {
                    mostrarMensaje('Error: ' + data.error, 'danger');
                    // Restaurar botón en caso de error
                    if (submitBtn && originalHTML) {
                        submitBtn.disabled = false;
                        submitBtn.innerHTML = originalHTML;
                    }
                }
            })
            .catch(error => {
                console.error('Error en fetch:', error);
                mostrarMensaje('Error al eliminar la noticia', 'danger');
                // Restaurar botón en caso de error
                if (submitBtn && originalHTML) {
                    submitBtn.disabled = false;
                    submitBtn.innerHTML = originalHTML;
                }
            });
        }
    }

    // Función para eliminar elemento del DOM
    function eliminarElementoDelDOM(noticiaId, elemento) {
        // Encontrar el contenedor de la noticia
        let contenedorNoticia = elemento.closest('.featured-news-article');
        
        if (contenedorNoticia) {
            // Efecto de desvanecimiento
            contenedorNoticia.style.transition = 'all 0.5s ease';
            contenedorNoticia.style.opacity = '0';
            contenedorNoticia.style.transform = 'scale(0.9)';
            
            // Eliminar del DOM después de la animación
            setTimeout(() => {
                // Si es el artículo principal
                if (contenedorNoticia.parentElement.classList.contains('col-md-8')) {
                    contenedorNoticia.parentElement.innerHTML = `
                        <div class="row justify-content-center">
                            <div class="col-12 col-md-10 col-lg-8">
                                <div class="empty-news-container">
                                    <div class="empty-news-content">
                                        <div class="empty-news-icon">
                                            <i class="bi bi-newspaper fs-1"></i>
                                        </div>
                                        <h3 class="empty-news-title">¡Próximamente nuevas noticias!</h3>
                                        <p class="empty-news-message">Estamos preparando contenido interesante para mantener informada a nuestra comunidad educativa. ¡Vuelve pronto para ver las últimas novedades!</p>
                                        <div class="empty-news-animation">
                                            <div class="pulse-circle"></div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    `;
                } else {
                    // Para noticias en tarjetas (col-md-6)
                    const colContainer = contenedorNoticia.closest('.col-md-6');
                    if (colContainer) {
                        colContainer.remove();
                    }
                }
            }, 500);
        }
    }

    // Función para verificar si quedan noticias
    function verificarNoticiasRestantes() {
        setTimeout(() => {
            const noticiasRestantes = document.querySelectorAll('.col-md-6 .featured-news-article');
            const rowContainer = document.querySelector('.row.mb-2');
            
            if (noticiasRestantes.length === 0 && rowContainer) {
                // Si no quedan noticias en las tarjetas, ocultar toda la sección
                rowContainer.style.display = 'none';
            }
        }, 600);
    }

    // Event listener para botones de eliminar (usando delegación de eventos)
    document.addEventListener('click', function(e) {
        console.log('Click detectado en:', e.target); // Debug
        
        // Buscar el botón de eliminar, ya sea que se haga clic en él o en el ícono dentro
        const eliminarBtn = e.target.closest('.eliminar-noticia');
        
        if (eliminarBtn) {
            console.log('Botón de eliminar encontrado:', eliminarBtn); // Debug
            e.preventDefault();
            const noticiaId = eliminarBtn.getAttribute('data-noticia-id');
            console.log('Intentando eliminar noticia ID:', noticiaId); // Debug
            
            if (noticiaId) {
                eliminarNoticia(noticiaId, eliminarBtn);
            } else {
                console.error('No se encontró el ID de la noticia');
            }
        }
    });
    
    // ========================================
    // MODAL DE NOTICIA - PRELLENAR REDACTOR
    // ========================================
    
    // Event listener para cuando se abre el modal de noticia
    const modalNoticia = document.getElementById('modalNoticia');
    if (modalNoticia) {
        modalNoticia.addEventListener('show.bs.modal', function (event) {
            // Obtener el campo redactor
            const redactorInput = document.getElementById('redactor');
            
            // Si el campo está vacío y hay un nombre de usuario disponible, llenarlo
            if (redactorInput && redactorInput.value.trim() === '') {
                // El valor ya debería estar preestablecido en el HTML desde el servidor
                // Este es un respaldo en caso de que se necesite
                const userFullName = redactorInput.getAttribute('value');
                if (userFullName) {
                    redactorInput.value = userFullName;
                }
            }
        });

        // Event listener para cuando se cierra el modal (limpiar formulario)
        modalNoticia.addEventListener('hidden.bs.modal', function (event) {
            const form = document.getElementById('noticia-form');
            if (form) {
                // Limpiar formulario
                form.reset();
                
                // Limpiar editor
                if (editorContent) {
                    editorContent.innerHTML = '';
                }
                if (hiddenTextarea) {
                    hiddenTextarea.value = '';
                }
                
                // Limpiar archivos seleccionados
                const imageneSelected = document.getElementById('imagenes-selected');
                const audioSelected = document.getElementById('audio-selected');
                if (imageneSelected) imageneSelected.innerHTML = '';
                if (audioSelected) audioSelected.innerHTML = '';
                
                // Restaurar el valor del redactor para usuarios superuser
                const redactorInput = document.getElementById('redactor');
                if (redactorInput) {
                    const userFullName = redactorInput.getAttribute('value');
                    if (userFullName) {
                        redactorInput.value = userFullName;
                    }
                }
                
                // Asegurar que "No" esté seleccionado por defecto en galería
                const galeriaNo = document.getElementById('galeria-no');
                if (galeriaNo) {
                    galeriaNo.checked = true;
                }
            }
        });
    }

    // ========================================
    // MODAL DE GALERÍA DE IMÁGENES
    // ========================================
    
    let currentImages = [];
    let currentImageIndex = 0;
    let currentTitle = '';

    // Función para abrir la galería de imágenes
    window.openImageGallery = function(title, images, startIndex = 0) {
        currentImages = images;
        currentImageIndex = startIndex;
        currentTitle = title;
        
        const modal = new bootstrap.Modal(document.getElementById('imageModal'));
        updateImageDisplay();
        updateNavigationVisibility();
        modal.show();
    };

    // Función de compatibilidad con el código anterior
    window.openImageModal = function(imageSrc, imageTitle) {
        openImageGallery(imageTitle, [imageSrc], 0);
    };

    // Función para actualizar la imagen mostrada
    function updateImageDisplay() {
        const modalImage = document.getElementById('modalImage');
        const modalTitle = document.getElementById('imageModalLabel');
        const imageCounter = document.getElementById('imageCounter');
        const thumbnailsContainer = document.getElementById('imageThumbnails');
        
        if (modalImage && currentImages.length > 0) {
            modalImage.src = currentImages[currentImageIndex];
            modalImage.alt = currentTitle;
        }
        
        if (modalTitle) {
            modalTitle.textContent = currentTitle;
        }
        
        if (imageCounter && currentImages.length > 1) {
            imageCounter.textContent = `${currentImageIndex + 1} de ${currentImages.length}`;
            imageCounter.style.display = 'inline-block';
        } else if (imageCounter) {
            imageCounter.style.display = 'none';
        }
        
        // Actualizar miniaturas
        if (thumbnailsContainer && currentImages.length > 1) {
            thumbnailsContainer.innerHTML = '';
            currentImages.forEach((imageSrc, index) => {
                const thumbnail = document.createElement('img');
                thumbnail.src = imageSrc;
                thumbnail.className = `img-thumbnail ${index === currentImageIndex ? 'border-primary border-3' : 'border-secondary'}`;
                thumbnail.style.cssText = 'width: 60px; height: 60px; object-fit: cover; cursor: pointer; opacity: ' + (index === currentImageIndex ? '1' : '0.7');
                thumbnail.onclick = () => {
                    currentImageIndex = index;
                    updateImageDisplay();
                };
                thumbnailsContainer.appendChild(thumbnail);
            });
            thumbnailsContainer.style.display = 'flex';
        } else if (thumbnailsContainer) {
            thumbnailsContainer.style.display = 'none';
        }
    }

    // Función para actualizar la visibilidad de los controles de navegación
    function updateNavigationVisibility() {
        const navigation = document.getElementById('imageNavigation');
        const prevBtn = document.getElementById('prevImageBtn');
        const nextBtn = document.getElementById('nextImageBtn');
        
        if (navigation && currentImages.length > 1) {
            navigation.style.display = 'flex';
            
            if (prevBtn) {
                prevBtn.style.opacity = currentImageIndex > 0 ? '0.75' : '0.3';
                prevBtn.disabled = currentImageIndex === 0;
            }
            
            if (nextBtn) {
                nextBtn.style.opacity = currentImageIndex < currentImages.length - 1 ? '0.75' : '0.3';
                nextBtn.disabled = currentImageIndex === currentImages.length - 1;
            }
        } else if (navigation) {
            navigation.style.display = 'none';
        }
    }

    // Event listeners para los botones de navegación
    const prevBtn = document.getElementById('prevImageBtn');
    const nextBtn = document.getElementById('nextImageBtn');
    
    if (prevBtn) {
        prevBtn.addEventListener('click', function() {
            if (currentImageIndex > 0) {
                currentImageIndex--;
                updateImageDisplay();
                updateNavigationVisibility();
            }
        });
    }
    
    if (nextBtn) {
        nextBtn.addEventListener('click', function() {
            if (currentImageIndex < currentImages.length - 1) {
                currentImageIndex++;
                updateImageDisplay();
                updateNavigationVisibility();
            }
        });
    }

    // Navegación con teclado
    document.addEventListener('keydown', function(e) {
        const modal = document.getElementById('imageModal');
        if (modal && modal.classList.contains('show')) {
            if (e.key === 'ArrowLeft' && currentImageIndex > 0) {
                currentImageIndex--;
                updateImageDisplay();
                updateNavigationVisibility();
            } else if (e.key === 'ArrowRight' && currentImageIndex < currentImages.length - 1) {
                currentImageIndex++;
                updateImageDisplay();
                updateNavigationVisibility();
            }
        }
    });

    // Test básico para verificar que los botones existen
    console.log('Script cargado, buscando botones de eliminar...');
    setTimeout(() => {
        const botones = document.querySelectorAll('.eliminar-noticia');
        console.log('Botones de eliminar encontrados:', botones.length);
        botones.forEach((btn, index) => {
            console.log(`Botón ${index + 1}:`, btn, 'ID:', btn.getAttribute('data-noticia-id'));
        });
    }, 1000);

    // ========================================
    // FUNCIONALIDAD SIDEBAR DE ARCHIVOS
    // ========================================
    
    // Manejar el comportamiento de los colapsos en el sidebar de archivos
    function initializeArchiveSidebar() {
        const collapseElements = document.querySelectorAll('[data-bs-toggle="collapse"]');
        
        collapseElements.forEach(element => {
            const targetId = element.getAttribute('data-bs-target');
            const target = document.querySelector(targetId);
            const chevron = element.querySelector('.transition-rotate');
            
            if (target && chevron) {
                // Manejar eventos de Bootstrap collapse
                target.addEventListener('show.bs.collapse', () => {
                    chevron.style.transform = 'rotate(0deg)';
                    element.setAttribute('aria-expanded', 'true');
                });
                
                target.addEventListener('hide.bs.collapse', () => {
                    chevron.style.transform = 'rotate(-90deg)';
                    element.setAttribute('aria-expanded', 'false');
                });
            }
        });
    }
    
    // Función para resaltar la noticia current en el sidebar
    function highlightCurrentNews() {
        const currentPath = window.location.pathname;
        const archiveLinks = document.querySelectorAll('.archivo-noticia a');
        
        archiveLinks.forEach(link => {
            if (link.getAttribute('href') === currentPath) {
                link.closest('.archivo-noticia').classList.add('current-news');
                link.style.backgroundColor = 'rgba(13, 110, 253, 0.1)';
                link.style.borderLeftColor = '#0d6efd';
                
                // Expandir automáticamente las secciones padre
                let parentCollapse = link.closest('.collapse');
                while (parentCollapse) {
                    if (parentCollapse.classList.contains('collapse')) {
                        const trigger = document.querySelector(`[data-bs-target="#${parentCollapse.id}"]`);
                        if (trigger && !parentCollapse.classList.contains('show')) {
                            const bsCollapse = new bootstrap.Collapse(parentCollapse, {
                                show: true
                            });
                        }
                    }
                    parentCollapse = parentCollapse.parentElement.closest('.collapse');
                }
            }
        });
    }
    
    // Agregar funcionalidad de scroll suave para el contenedor de archivos
    function initializeArchiveScroll() {
        const archiveContainer = document.querySelector('.archivos-container');
        if (archiveContainer) {
            // Verificar si hay una noticia resaltada y hacer scroll hacia ella
            const currentNews = archiveContainer.querySelector('.current-news');
            if (currentNews) {
                setTimeout(() => {
                    currentNews.scrollIntoView({
                        behavior: 'smooth',
                        block: 'center'
                    });
                }, 500);
            }
        }
    }
    
    // Inicializar funcionalidades del sidebar de archivos
    initializeArchiveSidebar();
    highlightCurrentNews();
    initializeArchiveScroll();
});