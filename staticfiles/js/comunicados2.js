/**
 * Comunicados JavaScript Module
 * Maneja todas las funcionalidades de la página de comunicados
 */

// ===== VARIABLES GLOBALES =====
let isSubmitting = false;
let ordenAscendente = false;

// ===== UTILIDADES =====
/**
 * Limpia el texto eliminando espacios extra y líneas vacías
 */
function cleanText(text) {
    return text.replace(/\s+/g, ' ')
               .trim()
               .split('\n')
               .map(line => line.trim())
               .filter(line => line)
               .join('\n');
}

/**
 * Obtiene el token CSRF del DOM
 */
function getCSRFToken() {
    const contentDiv = document.getElementById('content');
    return contentDiv ? contentDiv.dataset.csrfToken : 
           document.querySelector('[name=csrfmiddlewaretoken]')?.value;
}

/**
 * Calcula el brillo de un color hexadecimal
 */
function calculateBrightness(hex) {
    const r = parseInt(hex.slice(1, 3), 16);
    const g = parseInt(hex.slice(3, 5), 16);
    const b = parseInt(hex.slice(5, 7), 16);
    return (r * 299 + g * 587 + b * 114) / 1000;
}

// ===== GESTIÓN DE COMUNICADOS =====
/**
 * Elimina un comunicado específico
 */
function eliminarComunicado(id) {
    if (!confirm('¿Está seguro de que desea eliminar este comunicado?')) {
        return;
    }

    fetch(`/comunicados/eliminar/${id}/`, {
        method: 'POST',
        headers: {
            'X-CSRFToken': getCSRFToken(),
            'Content-Type': 'application/json'
        },
    })
    .then(response => {
        if (!response.ok) {
            throw new Error('Network response was not ok');
        }
        return response.json();
    })
    .then(data => {
        if (data.success) {
            const comunicadoElement = document.querySelector(`li[data-comunicado-id="${id}"]`);
            if (comunicadoElement) {
                comunicadoElement.remove();
                updateCounters();
            } else {
                location.reload();
            }
        } else {
            alert('Error al eliminar el comunicado: ' + (data.error || 'Error desconocido'));
        }
    })
    .catch(error => {
        console.error('Error:', error);
        alert('Ocurrió un error al eliminar el comunicado');
    });
}

/**
 * Guarda un nuevo comunicado
 */
function guardarComunicado() {
    if (isSubmitting) {
        console.log("Ya se está enviando un comunicado");
        return;
    }

    const form = document.getElementById('addComunicadoForm');
    const guardarBtn = document.getElementById('guardarComunicadoBtn');
    
    isSubmitting = true;
    guardarBtn.disabled = true;

    const formData = new FormData(form);
    
    // Obtener la URL del formulario o usar una URL por defecto
    const contentDiv = document.getElementById('content');
    const actionUrl = contentDiv?.dataset.guardarComunicadoUrl || '/comunicados/guardar/';
    
    fetch(actionUrl, {
        method: 'POST',
        body: formData,
        headers: {
            'X-CSRFToken': getCSRFToken()
        }
    })
    .then(response => response.json())
    .then(data => {
        if (data.success) {
            console.log("Comunicado guardado");
            const modal = bootstrap.Modal.getInstance(document.getElementById('addComunicadoModal'));
            modal.hide();
            location.reload();
        } else {
            alert('Error al guardar el comunicado: ' + data.error);
        }
    })
    .catch(error => {
        console.error('Error:', error);
        alert('Ocurrió un error al guardar el comunicado');
    })
    .finally(() => {
        isSubmitting = false;
        guardarBtn.disabled = false;
        form.reset();
    });
}

/**
 * Elimina comunicados antiguos
 */
function confirmarEliminarAntiguos() {
    const cantidad = document.getElementById('cantidadEliminar').value;
    if (confirm(`¿Está seguro de que desea eliminar los ${cantidad} comunicados más antiguos? Esta acción no se puede deshacer.`)) {
        eliminarAntiguos(cantidad);
    }
}

function eliminarAntiguos(cantidad) {
    // Obtener URL desde el dataset o usar URL por defecto
    const contentDiv = document.getElementById('content');
    const url = contentDiv?.dataset.eliminarAntiguosUrl || '/comunicados/eliminar_antiguos/';

    fetch(url, {
        method: 'POST',
        headers: {
            'X-CSRFToken': getCSRFToken(),
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({ cantidad: cantidad })
    })
    .then(response => response.json())
    .then(data => {
        if (data.success) {
            location.reload();
        } else {
            alert('Error al eliminar los comunicados: ' + data.error);
        }
    })
    .catch(error => {
        console.error('Error:', error);
        alert('Ocurrió un error al eliminar los comunicados');
    });
}

// ===== FILTRADO Y BÚSQUEDA =====
/**
 * Filtra comunicados por texto de búsqueda
 */
function filterComunicados() {
    const searchInput = document.getElementById('search');
    const filter = searchInput.value.toLowerCase();
    const comunicados = document.querySelectorAll('.element-list li.card');
    
    comunicados.forEach(comunicado => {
        const titulo = comunicado.querySelector('.card-title').textContent.toLowerCase();
        const texto = comunicado.querySelector('.card-text').textContent.toLowerCase();
        const autor = comunicado.querySelector('.card-subtitle').textContent.toLowerCase();
        const fecha = comunicado.querySelector('.text-muted').textContent.toLowerCase();
        
        const isVisible = titulo.includes(filter) || 
                         texto.includes(filter) || 
                         autor.includes(filter) ||
                         fecha.includes(filter);
        
        comunicado.style.display = isVisible ? '' : 'none';
    });

    updateCounters();
}

/**
 * Filtra comunicados por autor
 */
function filterByAuthor(autor, event) {
    if (event) {
        event.preventDefault();
    }

    const comunicadosList = document.querySelectorAll('.element-list li.card');

    comunicadosList.forEach(card => {
        const autorCard = card.getAttribute('data-autor');
        const shouldShow = autor === 'todos' || autorCard === autor;
        card.style.display = shouldShow ? '' : 'none';
    });

    // Actualizar estado activo de los botones de filtro
    document.querySelectorAll('.list-group-item').forEach(item => {
        item.classList.remove('active');
    });

    if (event) {
        event.currentTarget.classList.add('active');
    }

    updateCounters();
}

/**
 * Actualiza los contadores de comunicados
 */
function updateCounters() {
    const comunicados = document.querySelectorAll('.element-list li.card');
    const contadores = {};
    let total = 0;

    comunicados.forEach(card => {
        if (card.style.display !== 'none') {
            const autor = card.getAttribute('data-autor');
            contadores[autor] = (contadores[autor] || 0) + 1;
            total++;
        }
    });

    // Actualizar contador total
    const totalElement = document.getElementById('total-count-right');
    if (totalElement) {
        totalElement.textContent = total;
    }
    
    // Actualizar contadores individuales
    document.querySelectorAll('.autor-count').forEach(badge => {
        const autor = badge.getAttribute('data-autor');
        badge.textContent = contadores[autor] || 0;
    });
}

// ===== ORDENAMIENTO =====
/**
 * Alterna el ordenamiento de comunicados por fecha
 */
function toggleOrdenamiento() {
    ordenAscendente = !ordenAscendente;
    const comunicadosList = document.querySelector('.element-list ul');
    const comunicados = Array.from(comunicadosList.children);
    
    comunicados.sort((a, b) => {
        const fechaA = new Date(a.querySelector('.text-muted').textContent.trim());
        const fechaB = new Date(b.querySelector('.text-muted').textContent.trim());
        
        return ordenAscendente ? fechaA - fechaB : fechaB - fechaA;
    });
    
    // Reordenar DOM
    while (comunicadosList.firstChild) {
        comunicadosList.removeChild(comunicadosList.firstChild);
    }
    comunicados.forEach(comunicado => {
        comunicadosList.appendChild(comunicado);
    });
    
    // Actualizar UI
    const ordenTexto = document.getElementById('ordenTexto');
    if (ordenTexto) {
        ordenTexto.textContent = ordenAscendente ? 'Más antiguos primero' : 'Más recientes primero';
    }
    
    const boton = document.querySelector('.btn-light.btn-sidebar');
    if (boton) {
        boton.classList.toggle('active', ordenAscendente);
    }

    updateCounters();
}

// ===== GESTIÓN DE ARCHIVOS =====
/**
 * Maneja la selección de archivos para extracción de texto
 */
function handleFileSelect(event) {
    const file = event.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    const textoElement = document.getElementById('texto');

    if (file.type === "application/pdf") {
        reader.onload = function(e) {
            const typedarray = new Uint8Array(e.target.result);
            pdfjsLib.getDocument(typedarray).promise.then(function(pdf) {
                const numPages = pdf.numPages;
                const promises = [];
                
                for (let i = 1; i <= numPages; i++) {
                    promises.push(
                        pdf.getPage(i).then(function(page) {
                            return page.getTextContent().then(function(textContent) {
                                return textContent.items.map(item => item.str).join(' ');
                            });
                        })
                    );
                }
                
                Promise.all(promises).then(function(pageTexts) {
                    const text = pageTexts.join('\n\n');
                    textoElement.value = cleanText(text);
                    toggleMejorarButton();
                });
            });
        };
        reader.readAsArrayBuffer(file);
    } else if (file.type === "application/vnd.openxmlformats-officedocument.wordprocessingml.document" || 
               file.type === "application/msword") {
        reader.onload = function(e) {
            mammoth.extractRawText({arrayBuffer: e.target.result})
                .then(function(result) {
                    textoElement.value = cleanText(result.value);
                    toggleMejorarButton();
                });
        };
        reader.readAsArrayBuffer(file);
    } else {
        alert('Tipo de archivo no soportado. Por favor, seleccione un archivo PDF o Word.');
    }
}

// ===== INTELIGENCIA ARTIFICIAL =====
/**
 * Controla la visibilidad del botón de IA
 */
function toggleMejorarButton() {
    const texto = document.getElementById('texto').value.trim();
    const mejorarBtn = document.getElementById('mejorarConIA');
    const palabras = texto.split(/\s+/);
    
    if (mejorarBtn) {
        mejorarBtn.style.display = palabras.length >= 7 ? 'block' : 'none';
    }
}

/**
 * Mejora el texto usando IA
 */
function mejorarTextoConIA() {
    const texto = document.getElementById('texto').value.trim();
    if (!texto) return;

    // Obtener URL desde el dataset o usar URL por defecto
    const contentDiv = document.getElementById('content');
    const url = contentDiv?.dataset.crearTextoUrl || '/comunicados/crear_texto/';

    fetch(url, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'X-CSRFToken': getCSRFToken()
        },
        body: JSON.stringify({ texto: texto })
    })
    .then(response => response.json())
    .then(data => {
        if (data.success) {
            document.getElementById('texto').value = data.texto_mejorado;
        } else {
            alert('Error al mejorar el texto: ' + data.error);
        }
    })
    .catch(error => {
        console.error('Error:', error);
        alert('Ocurrió un error al mejorar el texto');
    });
}

// ===== GESTIÓN DE COLORES =====
/**
 * Aplica un color a las tarjetas de comunicados
 */
function aplicarColorPreview(color) {
    // Aplicar a las tarjetas
    document.querySelectorAll('.element-list .card').forEach(card => {
        card.style.backgroundColor = color;
        
        const header = card.querySelector('.card-header');
        if (header) {
            header.style.backgroundColor = color;
        }
        
        const body = card.querySelector('.card-body');
        if (body) {
            body.style.backgroundColor = color;
        }
    });
    
    // Actualizar el botón de color
    const btnColor = document.querySelector('[data-bs-target="#colorPickerModal"]');
    if (btnColor) {
        btnColor.style.backgroundColor = color;
        btnColor.style.borderColor = color;
        
        const brillo = calculateBrightness(color);
        btnColor.style.color = brillo > 128 ? '#000000' : '#ffffff';
    }
}

/**
 * Guarda el color seleccionado
 */
function guardarColor() {
    const color = document.getElementById('cardColor').value;
    
    // Obtener URL desde el dataset o usar URL por defecto
    const contentDiv = document.getElementById('content');
    const url = contentDiv?.dataset.guardarColorUrl || '/comunicados/guardar_color/';
    
    fetch(url, {
        method: 'POST',
        headers: {
            'X-CSRFToken': getCSRFToken(),
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({ color: color })
    })
    .then(response => response.json())
    .then(data => {
        if (data.success) {
            aplicarColorPreview(color);
            
            const modal = bootstrap.Modal.getInstance(document.getElementById('colorPickerModal'));
            modal.hide();
            
            alert('Color actualizado correctamente');
        } else {
            alert('Error al actualizar: ' + data.error);
        }
    })
    .catch(error => {
        console.error('Error:', error);
        alert('Ocurrió un error al guardar los cambios');
    });
}

// ===== CARGA DE DATOS =====
/**
 * Carga la lista de autores frecuentes
 */
function cargarAutoresFrecuentes() {
    // Obtener URL desde el dataset o usar URL por defecto
    const contentDiv = document.getElementById('content');
    const url = contentDiv?.dataset.autoresFrecuentesUrl || '/comunicados/autores_frecuentes/';

    fetch(url)
        .then(response => response.json())
        .then(data => {
            const datalist = document.getElementById('autores-list');
            if (datalist) {
                data.autores.forEach(autor => {
                    const option = document.createElement('option');
                    option.value = autor;
                    datalist.appendChild(option);
                });
            }
        })
        .catch(error => console.error('Error cargando autores:', error));
}

/**
 * Aplica el color inicial de las tarjetas
 */
function aplicarColorInicial(color) {
    if (!color) return;
    
    aplicarColorPreview(color);
    
    const colorPicker = document.getElementById('cardColor');
    if (colorPicker) {
        colorPicker.value = color;
    }
}

// ===== INICIALIZACIÓN =====
/**
 * Inicializa todos los event listeners y configuraciones
 */
function initEventListeners() {
    // Botón guardar comunicado
    const guardarBtn = document.getElementById('guardarComunicadoBtn');
    if (guardarBtn) {
        guardarBtn.addEventListener('click', function(e) {
            e.preventDefault();
            guardarComunicado();
        });
    }

    // Campo de texto para mostrar/ocultar botón de IA
    const textoInput = document.getElementById('texto');
    if (textoInput) {
        textoInput.addEventListener('input', toggleMejorarButton);
    }

    // Botón de mejorar con IA
    const mejorarBtn = document.getElementById('mejorarConIA');
    if (mejorarBtn) {
        mejorarBtn.addEventListener('click', mejorarTextoConIA);
    }

    // Input de archivo
    const archivoInput = document.getElementById('archivo');
    if (archivoInput) {
        archivoInput.addEventListener('change', handleFileSelect);
    }

    // Campo de búsqueda
    const searchInput = document.getElementById('search');
    if (searchInput) {
        searchInput.addEventListener('input', filterComunicados);
        searchInput.addEventListener('keyup', filterComunicados);
    }

    // Color picker
    const colorPicker = document.getElementById('cardColor');
    if (colorPicker) {
        colorPicker.addEventListener('input', function() {
            aplicarColorPreview(this.value);
        });
    }

    // Botón de ordenamiento
    const botonOrden = document.querySelector('.btn-light.btn-sidebar');
    if (botonOrden) {
        botonOrden.classList.toggle('active', ordenAscendente);
        botonOrden.addEventListener('click', function() {
            console.log('Botón de ordenamiento clickeado');
        });
    }
}

/**
 * Inicializa tooltips de Bootstrap
 */
function initTooltips() {
    const tooltipTriggerList = [].slice.call(document.querySelectorAll('[data-bs-toggle="tooltip"]'));
    tooltipTriggerList.map(function (tooltipTriggerEl) {
        return new bootstrap.Tooltip(tooltipTriggerEl);
    });
}

// ===== FUNCIONES EXPUESTAS GLOBALMENTE =====
// Estas funciones necesitan estar disponibles globalmente para los event handlers inline del HTML
window.eliminarComunicado = eliminarComunicado;
window.filterByAuthor = filterByAuthor;
window.toggleOrdenamiento = toggleOrdenamiento;
window.confirmarEliminarAntiguos = confirmarEliminarAntiguos;
window.guardarColor = guardarColor;

// ===== INICIALIZACIÓN PRINCIPAL =====
document.addEventListener('DOMContentLoaded', function() {
    // Inicializar event listeners
    initEventListeners();
    
    // Inicializar tooltips
    initTooltips();
    
    // Cargar autores frecuentes
    cargarAutoresFrecuentes();
    
    // Actualizar contadores iniciales
    updateCounters();
    
    // Aplicar color inicial si existe
    const contentDiv = document.getElementById('content');
    const initialColor = contentDiv?.dataset.initialColor;
    if (initialColor) {
        aplicarColorInicial(initialColor);
    }
    
    console.log('Comunicados JavaScript module initialized');
});
