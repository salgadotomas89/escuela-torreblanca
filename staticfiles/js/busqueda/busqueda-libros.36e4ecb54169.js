document.addEventListener('DOMContentLoaded', function() {
    const searchInput = document.getElementById('search-input');
    const tableBody = document.getElementById('libros-table-body');
    const clearSearchBtn = document.getElementById('clear-search');
    let timeoutId;
    let originalTableContent = null;
    let isSearchActive = false;

    // Función para guardar el contenido original de la tabla
    function saveOriginalTableContent() {
        if (!originalTableContent) {
            originalTableContent = tableBody.innerHTML;
        }
    }

    // Función para restaurar el contenido original de la tabla
    function restoreOriginalTableContent() {
        if (originalTableContent) {
            tableBody.innerHTML = originalTableContent;
            isSearchActive = false;
        }
    }

    // Función para limpiar la búsqueda
    function clearSearch() {
        searchInput.value = '';
        if (isSearchActive) {
            restoreOriginalTableContent();
        } else {
            const rows = document.querySelectorAll('.libro-row');
            rows.forEach(row => row.style.display = '');
            
            // Eliminar el mensaje de "no results" si existe
            const noResultsRow = document.getElementById('no-results-row');
            if (noResultsRow && noResultsRow.parentNode) {
                noResultsRow.remove();
            }
        }
        // Enfocar el campo de búsqueda
        searchInput.focus();
    }

    // Añadir evento al botón de limpiar búsqueda
    clearSearchBtn.addEventListener('click', clearSearch);

    // Función para resaltar el texto encontrado
    function highlightText(text, searchTerm) {
        if (!searchTerm) return text;
        const regex = new RegExp(`(${searchTerm})`, 'gi');
        return text.replace(regex, '<mark>$1</mark>');
    }

    // Función para buscar libros en el servidor
    function searchBooksOnServer(searchTerm) {
        // Mostrar un indicador de carga
        tableBody.innerHTML = `
            <tr>
                <td colspan="6" class="text-center">
                    <div class="d-flex justify-content-center">
                        <div class="spinner-border text-primary" role="status">
                            <span class="visually-hidden">Cargando...</span>
                        </div>
                    </div>
                    <p class="mt-2">Buscando libros...</p>
                </td>
            </tr>
        `;

        // Realizar la solicitud al servidor
        fetch(`/biblioteca/search_books?q=${encodeURIComponent(searchTerm)}`)
            .then(response => response.json())
            .then(data => {
                if (data.results && data.results.length > 0) {
                    displaySearchResults(data.results, searchTerm);
                } else {
                    tableBody.innerHTML = `
                        <tr>
                            <td colspan="6" class="text-center">
                                <div class="alert alert-info">
                                    No se encontraron libros que coincidan con "${searchTerm}"
                                </div>
                            </td>
                        </tr>
                    `;
                }
            })
            .catch(error => {
                console.error('Error en la búsqueda:', error);
                tableBody.innerHTML = `
                    <tr>
                        <td colspan="6" class="text-center">
                            <div class="alert alert-danger">
                                Error al buscar libros: ${error.message}
                            </div>
                        </td>
                    </tr>
                `;
            });
    }

    // Función para mostrar los resultados de la búsqueda
    function displaySearchResults(results, searchTerm) {
        tableBody.innerHTML = '';
        
        results.forEach(libro => {
            // Usar los campos que vienen del servidor
            const ejemplaresDisponibles = libro.ejemplares_disponibles || 0;
            const estaDisponible = libro.esta_disponible || false;
            const nombreHighlighted = highlightText(libro.nombre, searchTerm);
            const autorHighlighted = highlightText(libro.autor, searchTerm);
            
            // Determinar la edad recomendada
            const edadRecomendada = libro.edad || '';
            
            const row = document.createElement('tr');
            row.className = 'libro-row';
            row.dataset.libroId = libro.id;
            
            row.innerHTML = `
                <td>${nombreHighlighted}</td>
                <td>${autorHighlighted}</td>
                <td>
                    ${edadRecomendada}
                    <a href="#" onclick="editarEdad('${libro.nombre.replace(/'/g, "\\'")}', '${libro.autor.replace(/'/g, "\\'")}', '${libro.id}')" class="text-muted">
                        <i class="bi bi-pencil-square"></i>
                    </a>
                </td>
                <td>
                    <span class="badge ${estaDisponible ? 'bg-success' : 'bg-danger'}">
                        ${estaDisponible ? 'Disponible' : 'No disponible'}
                    </span>
                </td>
                <td>
                    <span class="badge bg-info">
                        ${ejemplaresDisponibles} / ${libro.total_ejemplares || ejemplaresDisponibles}
                    </span>
                    <small class="text-muted">disponibles</small>
                </td>
                <td>
                    ${getUserActions(libro.id, libro.nombre, libro.autor, ejemplaresDisponibles)}
                </td>
            `;
            
            tableBody.appendChild(row);
        });

        // Agregar mensaje que indica que estamos viendo resultados de búsqueda
        const infoRow = document.createElement('tr');
        infoRow.innerHTML = `
            <td colspan="6" class="text-center bg-light">
                <div class="d-flex justify-content-between align-items-center p-2">
                    <span>Mostrando ${results.length} resultados para "${searchTerm}"</span>
                    <button onclick="location.reload()" class="btn btn-sm btn-outline-secondary">
                        <i class="bi bi-arrow-repeat"></i> Volver a la lista completa
                    </button>
                </div>
            </td>
        `;
        tableBody.appendChild(infoRow);
    }

    // Función para generar los botones de acciones según si el usuario está autenticado
    function getUserActions(libroId, nombreLibro, autorLibro, ejemplaresDisponibles) {
        const isAuthenticated = document.querySelector('[data-auth]') ? 
                              document.querySelector('[data-auth]').dataset.auth === 'true' : 
                              false;
        
        if (isAuthenticated) {
            return `
                <button class="btn btn-sm btn-info" onclick="mostrarInfoLibro('${libroId}')">
                    <i class="bi bi-info-circle"></i> 
                </button>

                <button class="btn btn-sm btn-danger" onclick="eliminarLibro('${libroId}')">
                    <i class="bi bi-trash2-fill"></i>
                </button>

                <button class="btn btn-sm btn-secondary" 
                        onclick="mostrarMarbete(this)" 
                        data-dewey=""
                        data-autor="${autorLibro.replace(/"/g, '&quot;')}"
                        data-titulo="${nombreLibro.replace(/"/g, '&quot;')}"
                        data-anio=""
                        data-volumen=""
                        data-ejemplares="${ejemplaresDisponibles || 0}"
                        data-pais=""
                        data-tipo="libro"
                        data-referencia="false">
                    <i class="bi bi-tag"></i> Marbete
                </button>
                
                <button class="btn btn-sm btn-warning" onclick="mostrarModalPrestamo('${libroId}', '${nombreLibro.replace(/'/g, "\\'")}', '${autorLibro.replace(/'/g, "\\'")}', '${ejemplaresDisponibles}')">
                    <i class="bi bi-book"></i> Préstamo
                </button>
            `;
        } else {
            return `
                <button class="btn btn-sm btn-info" onclick="mostrarInfoLibro('${libroId}')">
                    <i class="bi bi-info-circle"></i> Ver info
                </button>
            `;
        }
    }

    // Función para filtrar las filas de la tabla localmente (solo para la página actual)
    function filterTableLocally(searchTerm) {
        const rows = document.querySelectorAll('.libro-row');
        let visibleCount = 0;

        rows.forEach(row => {
            const nombre = row.cells[0].textContent.toLowerCase();
            const autor = row.cells[1].textContent.toLowerCase();
            const edad = row.cells[2].textContent.toLowerCase();
            
            const matchesSearch = nombre.includes(searchTerm) || 
                                autor.includes(searchTerm) || 
                                edad.includes(searchTerm);

            if (matchesSearch) {
                row.style.display = '';
                visibleCount++;

                // Resaltar texto coincidente
                if (searchTerm) {
                    row.cells[0].innerHTML = highlightText(row.cells[0].textContent, searchTerm);
                    row.cells[1].innerHTML = highlightText(row.cells[1].textContent, searchTerm);
                    row.cells[2].innerHTML = highlightText(row.cells[2].textContent, searchTerm);
                }
            } else {
                row.style.display = 'none';
            }
        });

        // Mostrar mensaje si no hay resultados
        const noResultsRow = document.getElementById('no-results-row') || document.createElement('tr');
        noResultsRow.id = 'no-results-row';
        
        if (visibleCount === 0) {
            noResultsRow.innerHTML = `
                <td colspan="6" class="text-center">
                    <div class="alert alert-info">
                        No se encontraron libros en esta página que coincidan con "${searchTerm}"
                        <hr>
                        <button class="btn btn-primary" id="search-all-btn">
                            <i class="bi bi-search"></i> Buscar en todos los libros
                        </button>
                    </div>
                </td>
            `;
            tableBody.appendChild(noResultsRow);
            
            // Añadir evento al botón de búsqueda completa
            document.getElementById('search-all-btn').addEventListener('click', function() {
                saveOriginalTableContent();
                isSearchActive = true;
                searchBooksOnServer(searchTerm);
            });
        } else if (noResultsRow.parentNode) {
            noResultsRow.remove();
        }
    }

    // Evento de búsqueda con debounce
    searchInput.addEventListener('input', function() {
        const searchTerm = this.value.toLowerCase().trim();

        // Limpiar el timeout anterior
        if (timeoutId) {
            clearTimeout(timeoutId);
        }

        // Si la cadena de búsqueda está vacía y estamos en modo de búsqueda activa, restaurar tabla
        if (!searchTerm && isSearchActive) {
            restoreOriginalTableContent();
            return;
        }

        // Establecer un nuevo timeout
        timeoutId = setTimeout(() => {
            if (searchTerm.length >= 3) {
                // Para búsquedas de 3 o más caracteres, buscar en el servidor
                saveOriginalTableContent();
                isSearchActive = true;
                searchBooksOnServer(searchTerm);
            } else if (searchTerm.length > 0) {
                // Para búsquedas de 1 o 2 caracteres, filtrar localmente
                filterTableLocally(searchTerm);
            } else {
                // Para búsquedas vacías, mostrar todo
                const rows = document.querySelectorAll('.libro-row');
                rows.forEach(row => row.style.display = '');
                
                // Eliminar el mensaje de "no results" si existe
                const noResultsRow = document.getElementById('no-results-row');
                if (noResultsRow && noResultsRow.parentNode) {
                    noResultsRow.remove();
                }
            }
        }, 300);
    });

    // Limpiar la búsqueda cuando se presiona Escape
    searchInput.addEventListener('keydown', function(e) {
        if (e.key === 'Escape') {
            this.value = '';
            if (isSearchActive) {
                restoreOriginalTableContent();
            } else {
                const rows = document.querySelectorAll('.libro-row');
                rows.forEach(row => row.style.display = '');
                
                // Eliminar el mensaje de "no results" si existe
                const noResultsRow = document.getElementById('no-results-row');
                if (noResultsRow && noResultsRow.parentNode) {
                    noResultsRow.remove();
                }
            }
        }
    });
}); 