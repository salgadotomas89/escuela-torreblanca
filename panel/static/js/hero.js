document.addEventListener('DOMContentLoaded', function() {
    // Referencias a elementos del DOM
    const heroImagePreview = document.getElementById('hero-image-preview');
    const additionalImagesGrid = document.getElementById('additional-images-grid');
    const backgroundImageInput = document.getElementById('id_background_image');
    const additionalImagesInput = document.getElementById('id_additional_images');
    const removeHeroImageBtn = document.getElementById('remove-hero-image');
    const newImagesPreview = document.getElementById('new-images-preview');
    const previewImagesGrid = document.getElementById('preview-images-grid');
    const previewHero = document.getElementById('preview-hero');

    // CRUD para imagen principal
    
    // Eliminar imagen principal
    if (removeHeroImageBtn) {
        removeHeroImageBtn.addEventListener('click', function() {
            if (confirm('¿Estás seguro de que quieres eliminar la imagen principal?')) {
                removeBackgroundImage();
            }
        });
    }

    // Función para eliminar imagen de fondo
    async function removeBackgroundImage() {
        try {
            const response = await fetch('/configuracion/hero/remove-background-image/', {
                method: 'POST',
                headers: {
                    'X-CSRFToken': getCsrfToken(),
                    'Content-Type': 'application/json',
                },
            });

            const data = await response.json();

            if (data.success) {
                // Actualizar vista previa
                heroImagePreview.innerHTML = `
                    <div class="alert alert-info py-2">
                        <i class="bi bi-info-circle me-1"></i>
                        <small>No hay imagen principal configurada.</small>
                    </div>
                `;
                
                // Actualizar preview del hero
                previewHero.style.backgroundImage = 'none';
                
                showToast('Imagen principal eliminada correctamente', 'success');
            } else {
                showToast(data.message || 'Error al eliminar la imagen', 'error');
            }
        } catch (error) {
            console.error('Error:', error);
            showToast('Error al eliminar la imagen', 'error');
        }
    }

    // Actualizar imagen principal
    if (backgroundImageInput) {
        backgroundImageInput.addEventListener('change', function(e) {
            const file = e.target.files[0];
            if (file) {
                uploadBackgroundImage(file);
            }
        });
    }

    // Función para subir imagen de fondo
    async function uploadBackgroundImage(file) {
        const formData = new FormData();
        formData.append('background_image', file);
        formData.append('csrfmiddlewaretoken', getCsrfToken());

        try {
            const response = await fetch('/configuracion/hero/update-background-image/', {
                method: 'POST',
                headers: {
                    'X-CSRFToken': getCsrfToken(),
                },
                body: formData
            });

            const data = await response.json();

            if (data.success) {
                // Actualizar vista previa
                updateBackgroundImagePreview(data.image_url);
                
                // Actualizar preview del hero
                previewHero.style.backgroundImage = `url('${data.image_url}')`;
                
                showToast('Imagen principal actualizada correctamente', 'success');
            } else {
                showToast(data.message || 'Error al subir la imagen', 'error');
            }
        } catch (error) {
            console.error('Error:', error);
            showToast('Error al subir la imagen', 'error');
        }
    }

    // Función para actualizar la vista previa de la imagen principal
    function updateBackgroundImagePreview(imageUrl) {
        heroImagePreview.innerHTML = `
            <div class="card" style="max-width: 400px;">
                <img src="${imageUrl}" 
                     alt="Imagen principal del hero" 
                     class="card-img-top"
                     style="height: 150px; object-fit: cover;">
                <div class="card-body p-2">
                    <small class="text-muted d-block">Imagen principal</small>
                    <button type="button" class="btn btn-danger btn-sm mt-1" id="remove-hero-image">
                        <i class="bi bi-trash"></i> Eliminar principal
                    </button>
                </div>
            </div>
        `;
        
        // Re-agregar event listener al nuevo botón
        const newRemoveBtn = document.getElementById('remove-hero-image');
        if (newRemoveBtn) {
            newRemoveBtn.addEventListener('click', function() {
                if (confirm('¿Estás seguro de que quieres eliminar la imagen principal?')) {
                    removeBackgroundImage();
                }
            });
        }
    }

    // CRUD para imágenes adicionales

    // Subir múltiples imágenes adicionales
    if (additionalImagesInput) {
        additionalImagesInput.addEventListener('change', function(e) {
            const files = Array.from(e.target.files);
            if (files.length > 0) {
                showNewImagesPreview(files);
                uploadAdditionalImages(files);
            }
        });
    }

    // Función para mostrar vista previa de nuevas imágenes
    function showNewImagesPreview(files) {
        previewImagesGrid.innerHTML = '';
        
        files.forEach((file, index) => {
            const reader = new FileReader();
            reader.onload = function(e) {
                const previewDiv = document.createElement('div');
                previewDiv.className = 'col-4';
                previewDiv.innerHTML = `
                    <div class="card">
                        <img src="${e.target.result}" 
                             alt="Nueva imagen ${index + 1}" 
                             class="card-img-top"
                             style="height: 60px; object-fit: cover;">
                        <div class="card-body p-1">
                            <small class="text-muted">${file.name}</small>
                        </div>
                    </div>
                `;
                previewImagesGrid.appendChild(previewDiv);
            };
            reader.readAsDataURL(file);
        });
        
        newImagesPreview.style.display = 'block';
    }

    // Función para subir imágenes adicionales
    async function uploadAdditionalImages(files) {
        const formData = new FormData();
        
        files.forEach((file, index) => {
            formData.append('additional_images', file);
        });
        formData.append('csrfmiddlewaretoken', getCsrfToken());

        try {
            const response = await fetch('/configuracion/hero/upload-additional-images/', {
                method: 'POST',
                headers: {
                    'X-CSRFToken': getCsrfToken(),
                },
                body: formData
            });

            const data = await response.json();

            if (data.success) {
                // Recargar la grilla de imágenes adicionales
                loadAdditionalImages();
                
                // Limpiar vista previa
                newImagesPreview.style.display = 'none';
                additionalImagesInput.value = '';
                
                showToast(`${data.uploaded_count} imagen(es) subida(s) correctamente`, 'success');
            } else {
                showToast(data.message || 'Error al subir las imágenes', 'error');
            }
        } catch (error) {
            console.error('Error:', error);
            showToast('Error al subir las imágenes', 'error');
        }
    }

    // Función para cargar imágenes adicionales
    async function loadAdditionalImages() {
        try {
            const response = await fetch('/configuracion/hero/get-additional-images/');
            const data = await response.json();

            if (data.success) {
                updateAdditionalImagesGrid(data.images);
            }
        } catch (error) {
            console.error('Error:', error);
        }
    }

    // Función para actualizar la grilla de imágenes adicionales
    function updateAdditionalImagesGrid(images) {
        if (!additionalImagesGrid) return;

        additionalImagesGrid.innerHTML = '';

        images.forEach((image, index) => {
            const imageDiv = document.createElement('div');
            imageDiv.className = 'col-4';
            imageDiv.setAttribute('data-image-id', image.id);
            
            imageDiv.innerHTML = `
                <div class="card position-relative">
                    <img src="${image.url}" 
                         alt="Imagen adicional ${index + 1}" 
                         class="card-img-top"
                         style="height: 80px; object-fit: cover;">
                    <div class="card-img-overlay p-1 d-flex justify-content-between align-items-start">
                        <span class="badge bg-primary">${index + 1}</span>
                        <button type="button" 
                                class="btn btn-sm btn-danger remove-additional-image"
                                data-image-id="${image.id}"
                                title="Eliminar imagen">
                            <i class="bi bi-trash"></i>
                        </button>
                    </div>
                </div>
            `;
            
            additionalImagesGrid.appendChild(imageDiv);
        });

        // Agregar event listeners a los botones de eliminar
        document.querySelectorAll('.remove-additional-image').forEach(btn => {
            btn.addEventListener('click', function() {
                const imageId = this.getAttribute('data-image-id');
                if (confirm('¿Estás seguro de que quieres eliminar esta imagen?')) {
                    removeAdditionalImage(imageId);
                }
            });
        });
    }

    // Función para eliminar imagen adicional
    async function removeAdditionalImage(imageId) {
        try {
            const response = await fetch('/configuracion/hero/remove-additional-image/', {
                method: 'POST',
                headers: {
                    'X-CSRFToken': getCsrfToken(),
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ image_id: imageId })
            });

            const data = await response.json();

            if (data.success) {
                // Remover el elemento del DOM
                const imageElement = document.querySelector(`[data-image-id="${imageId}"]`);
                if (imageElement) {
                    imageElement.remove();
                }
                
                // Recargar para actualizar numeración
                loadAdditionalImages();
                
                showToast('Imagen eliminada correctamente', 'success');
            } else {
                showToast(data.message || 'Error al eliminar la imagen', 'error');
            }
        } catch (error) {
            console.error('Error:', error);
            showToast('Error al eliminar la imagen', 'error');
        }
    }

    // Event listeners para imágenes adicionales existentes
    document.querySelectorAll('.remove-additional-image').forEach(btn => {
        btn.addEventListener('click', function() {
            const imageId = this.getAttribute('data-image-id');
            if (confirm('¿Estás seguro de que quieres eliminar esta imagen?')) {
                removeAdditionalImage(imageId);
            }
        });
    });

    // Funciones auxiliares

    // Obtener CSRF token
    function getCsrfToken() {
        const token = document.querySelector('[name=csrfmiddlewaretoken]');
        if (token) {
            return token.value;
        }
        
        // Alternativo: buscar en cookies
        const cookieValue = document.cookie
            .split('; ')
            .find(row => row.startsWith('csrftoken='));
        
        return cookieValue ? cookieValue.split('=')[1] : '';
    }

    // Mostrar toast/notificación
    function showToast(message, type = 'info') {
        // Crear elemento toast
        const toast = document.createElement('div');
        toast.className = `alert alert-${type === 'success' ? 'success' : type === 'error' ? 'danger' : 'info'} alert-dismissible fade show position-fixed`;
        toast.style.cssText = 'top: 20px; right: 20px; z-index: 9999; min-width: 300px;';
        
        toast.innerHTML = `
            ${message}
            <button type="button" class="btn-close" data-bs-dismiss="alert"></button>
        `;
        
        document.body.appendChild(toast);
        
        // Auto-remover después de 5 segundos
        setTimeout(() => {
            if (toast.parentNode) {
                toast.remove();
            }
        }, 5000);
    }
});