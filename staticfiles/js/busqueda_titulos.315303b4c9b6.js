/**
 * Funcionalidad de búsqueda y autocompletado de títulos para el modal agregarMaterialModal
 */
document.addEventListener('DOMContentLoaded', function() {
    // Elementos del DOM
    const tituloInput = document.getElementById('titulo');
    if (!tituloInput) return; // Si no existe el input, no hacer nada
    
    // Elementos del formulario para la memoria temporal
    const edadRecomendadaSelect = document.getElementById('edad_recomendada');
    const codigoDeweySelect = document.getElementById('codigo_dewey');
    
    // Crear contenedor para resultados de búsqueda
    const resultadosContainer = document.createElement('div');
    resultadosContainer.id = 'titulo-resultados';
    resultadosContainer.className = 'list-group';
    // Cambiar el estilo para posicionar debajo del input y ajustar el tamaño
    resultadosContainer.style = `
        position: absolute;
        width: 100%;
        z-index: 1500;
        max-height: 250px;
        overflow-y: auto;
        display: none;
        margin-top: 45px; /* Añadir un pequeño espacio entre el input y los resultados */
        box-shadow: 0 2px 4px rgba(0,0,0,0.1); /* Añadir sombra sutil */
    `;
    // Insertar el contenedor después del input en lugar de dentro
    tituloInput.parentElement.appendChild(resultadosContainer);
    
    // Variables de estado
    let timeoutId = null;
    let resultadosActuales = [];
    
    // Elementos del DOM para los botones de reinicio
    const reiniciarEdadBtn = document.getElementById('reiniciar-edad');
    const reiniciarDeweyBtn = document.getElementById('reiniciar-dewey');
    
    // Al abrir el modal, cargar los valores recordados
    $('#agregarMaterialModal').on('shown.bs.modal', function () {
        cargarValoresRecordados();
        actualizarContadores();
    });
    
    // Función para guardar los valores seleccionados en localStorage
    function guardarValoresSeleccionados() {
        if (edadRecomendadaSelect && edadRecomendadaSelect.value) {
            localStorage.setItem('ultimaEdadRecomendada', edadRecomendadaSelect.value);
            
            // Incrementar contador de libros con esta edad
            const contadorEdad = parseInt(localStorage.getItem('contadorEdadRecomendada') || '0') + 1;
            localStorage.setItem('contadorEdadRecomendada', contadorEdad.toString());
        }
        
        if (codigoDeweySelect && codigoDeweySelect.value) {
            localStorage.setItem('ultimoCodigoDewey', codigoDeweySelect.value);
            
            // Incrementar contador de libros con este Dewey
            const contadorDewey = parseInt(localStorage.getItem('contadorCodigoDewey') || '0') + 1;
            localStorage.setItem('contadorCodigoDewey', contadorDewey.toString());
        }
        
        // Actualizar contadores visuales
        actualizarContadores();
    }
    
    // Función para actualizar los contadores visuales
    function actualizarContadores() {
        const contadorEdad = parseInt(localStorage.getItem('contadorEdadRecomendada') || '0');
        const contadorDewey = parseInt(localStorage.getItem('contadorCodigoDewey') || '0');
        
        if (edadRecomendadaSelect) {
            const ultimaEdad = localStorage.getItem('ultimaEdadRecomendada');
            if (ultimaEdad && contadorEdad > 0) {
                // Buscar o crear el contador visual
                let contadorEdadEl = document.getElementById('contador-edad');
                if (!contadorEdadEl) {
                    contadorEdadEl = document.createElement('span');
                    contadorEdadEl.id = 'contador-edad';
                    contadorEdadEl.className = 'badge bg-secondary ms-2';
                    
                    // Insertar después del botón de reinicio
                    if (reiniciarEdadBtn) {
                        reiniciarEdadBtn.after(contadorEdadEl);
                    } else {
                        const edadLabel = document.querySelector('label[for="edad_recomendada"]');
                        if (edadLabel) {
                            edadLabel.appendChild(contadorEdadEl);
                        }
                    }
                }
                
                // Mostrar el valor actual de la edad seleccionada
                let textoEdad = '';
                for (let i = 0; i < edadRecomendadaSelect.options.length; i++) {
                    if (edadRecomendadaSelect.options[i].value === ultimaEdad) {
                        textoEdad = edadRecomendadaSelect.options[i].text;
                        break;
                    }
                }
                
                // Actualizar contenido del contador
                contadorEdadEl.textContent = `${contadorEdad} libro${contadorEdad !== 1 ? 's' : ''} (${textoEdad})`;
            }
        }
        
        if (codigoDeweySelect) {
            const ultimoDewey = localStorage.getItem('ultimoCodigoDewey');
            if (ultimoDewey && contadorDewey > 0) {
                // Buscar o crear el contador visual
                let contadorDeweyEl = document.getElementById('contador-dewey');
                if (!contadorDeweyEl) {
                    contadorDeweyEl = document.createElement('span');
                    contadorDeweyEl.id = 'contador-dewey';
                    contadorDeweyEl.className = 'badge bg-secondary ms-2';
                    
                    // Insertar después del botón de reinicio
                    if (reiniciarDeweyBtn) {
                        reiniciarDeweyBtn.after(contadorDeweyEl);
                    } else {
                        const deweyLabel = document.querySelector('label[for="codigo_dewey"]');
                        if (deweyLabel) {
                            deweyLabel.appendChild(contadorDeweyEl);
                        }
                    }
                }
                
                // Buscar el texto del Dewey seleccionado
                let textoDewey = '';
                for (let i = 0; i < codigoDeweySelect.options.length; i++) {
                    if (codigoDeweySelect.options[i].value === ultimoDewey) {
                        // Abreviar si es muy largo
                        const textoCompleto = codigoDeweySelect.options[i].text;
                        textoDewey = textoCompleto.substring(0, textoCompleto.indexOf(' '));
                        break;
                    }
                }
                
                // Actualizar contenido del contador
                contadorDeweyEl.textContent = `${contadorDewey} libro${contadorDewey !== 1 ? 's' : ''} (${textoDewey})`;
            }
        }
    }
    
    // Función para cargar los valores recordados desde localStorage
    function cargarValoresRecordados() {
        const ultimaEdad = localStorage.getItem('ultimaEdadRecomendada');
        const ultimoDewey = localStorage.getItem('ultimoCodigoDewey');
        
        // Aplicar última edad recomendada si no hay una ya seleccionada
        if (ultimaEdad && edadRecomendadaSelect && !edadRecomendadaSelect.value) {
            for (let i = 0; i < edadRecomendadaSelect.options.length; i++) {
                if (edadRecomendadaSelect.options[i].value === ultimaEdad) {
                    edadRecomendadaSelect.selectedIndex = i;
                    
                    // Agregar indicador visual de valor recordado
                    const edadHelp = document.createElement('div');
                    edadHelp.className = 'form-text text-info';
                    edadHelp.innerHTML = '<i class="bi bi-info-circle"></i> Se ha aplicado la última edad seleccionada';
                    edadHelp.id = 'edad-recordada-info';
                    
                    // Solo agregar si no existe ya
                    if (!document.getElementById('edad-recordada-info')) {
                        edadRecomendadaSelect.parentNode.appendChild(edadHelp);
                        
                        // Eliminar después de 3 segundos
                        setTimeout(() => {
                            if (edadHelp.parentNode) {
                                edadHelp.parentNode.removeChild(edadHelp);
                            }
                        }, 3000);
                    }
                    break;
                }
            }
        }
        
        // Aplicar último código Dewey si no hay uno ya seleccionado
        if (ultimoDewey && codigoDeweySelect && codigoDeweySelect.selectedIndex === 0) {
            for (let i = 0; i < codigoDeweySelect.options.length; i++) {
                if (codigoDeweySelect.options[i].value === ultimoDewey) {
                    codigoDeweySelect.selectedIndex = i;
                    
                    // Agregar indicador visual de valor recordado
                    const deweyHelp = document.createElement('div');
                    deweyHelp.className = 'form-text text-info';
                    deweyHelp.innerHTML = '<i class="bi bi-info-circle"></i> Se ha aplicado el último código Dewey seleccionado';
                    deweyHelp.id = 'dewey-recordado-info';
                    
                    // Solo agregar si no existe ya
                    if (!document.getElementById('dewey-recordado-info')) {
                        codigoDeweySelect.parentNode.querySelector('.input-group').after(deweyHelp);
                        
                        // Eliminar después de 3 segundos
                        setTimeout(() => {
                            if (deweyHelp.parentNode) {
                                deweyHelp.parentNode.removeChild(deweyHelp);
                            }
                        }, 3000);
                    }
                    break;
                }
            }
        }
    }
    
    // Añadir eventos para guardar los valores seleccionados
    if (edadRecomendadaSelect) {
        edadRecomendadaSelect.addEventListener('change', guardarValoresSeleccionados);
    }
    
    if (codigoDeweySelect) {
        codigoDeweySelect.addEventListener('change', guardarValoresSeleccionados);
    }
    
    // Guardar valores al enviar el formulario o cerrar el modal
    document.querySelector('#agregarMaterialModal .modal-footer button[type="button"].btn-primary').addEventListener('click', guardarValoresSeleccionados);
    
    // Función para buscar títulos
    function buscarTitulos(query) {
        if (query.length < 2) {
            resultadosContainer.style.display = 'none';
            return;
        }
        
        // Mostrar indicador de carga
        resultadosContainer.style.display = 'block';
        resultadosContainer.innerHTML = `
            <div class="list-group-item text-center">
                <div class="spinner-border spinner-border-sm text-primary" role="status">
                    <span class="visually-hidden">Buscando...</span>
                </div>
                <span class="ms-2">Buscando libros...</span>
            </div>
        `;
        
        // Realizar la búsqueda en el servidor
        fetch(`/biblioteca/verificar-titulo/?q=${encodeURIComponent(query)}`)
            .then(response => response.json())
            .then(data => {
                if (data.exists && data.resultados.length > 0) {
                    resultadosActuales = data.resultados;
                    mostrarResultados(data.resultados, query);
                } else {
                    resultadosContainer.innerHTML = `
                        <div class="list-group-item text-muted">
                            No se encontraron libros que coincidan con "${query}"
                        </div>
                    `;
                }
            })
            .catch(error => {
                console.error('Error al buscar títulos:', error);
                resultadosContainer.innerHTML = `
                    <div class="list-group-item text-danger">
                        Error al buscar: ${error.message || 'Error desconocido'}
                    </div>
                `;
            });
    }
    
    // Función para mostrar resultados
    function mostrarResultados(resultados, query) {
        resultadosContainer.innerHTML = '';
        
        resultados.forEach((resultado, index) => {
            const item = document.createElement('button');
            item.type = 'button';
            item.className = 'list-group-item list-group-item-action';
            item.dataset.index = index;
            
            // Resaltar la parte del texto que coincide con la búsqueda
            const tituloResaltado = resultado.titulo.replace(
                new RegExp(`(${query})`, 'gi'),
                '<mark>$1</mark>'
            );
            
            item.innerHTML = `
                <div class="d-flex justify-content-between align-items-center">
                    <div>
                        <strong>${tituloResaltado}</strong>
                        <div class="text-muted small">${resultado.autor}</div>
                    </div>
                    <div>
                        <span class="badge bg-secondary">${resultado.editorial || 'Sin editorial'}</span>
                        <span class="badge bg-info">${resultado.anio || 'Sin año'}</span>
                    </div>
                </div>
            `;
            
            // Añadir evento de clic
            item.addEventListener('click', function() {
                seleccionarLibro(parseInt(this.dataset.index));
            });
            
            resultadosContainer.appendChild(item);
        });
    }
    
    // Función para seleccionar un libro de los resultados
    function seleccionarLibro(index) {
        const libro = resultadosActuales[index];
        if (!libro) return;
        
        // Confirmar la selección del libro
        Swal.fire({
            title: '¿Completar formulario?',
            html: `
                <p>Se completará el formulario con los datos del libro:</p>
                <p><strong>${libro.titulo}</strong> de ${libro.autor}</p>
                <p class="small text-muted">Podrás editar los campos antes de guardar</p>
            `,
            icon: 'question',
            showCancelButton: true,
            confirmButtonText: 'Sí, completar',
            cancelButtonText: 'No, cancelar'
        }).then((result) => {
            if (result.isConfirmed) {
                completarFormulario(libro);
            }
        });
    }
    
    // Función para completar el formulario con los datos del libro
    function completarFormulario(libro) {
        // Completar campos básicos
        document.getElementById('titulo').value = libro.titulo;
        document.getElementById('autores').value = libro.autor;
        document.getElementById('anio').value = libro.anio || '';
        document.getElementById('resumen').value = libro.resumen || '';
        
        // Seleccionar la edad recomendada
        const selectEdad = document.getElementById('edad_recomendada');
        if (selectEdad && libro.edad_recomendada) {
            for (let i = 0; i < selectEdad.options.length; i++) {
                if (selectEdad.options[i].value === libro.edad_recomendada) {
                    selectEdad.selectedIndex = i;
                    // Al completar con datos del libro, también guardar la edad
                    guardarValoresSeleccionados();
                    break;
                }
            }
        }
        
        // Seleccionar el código Dewey
        const selectDewey = document.getElementById('codigo_dewey');
        if (selectDewey && libro.dewey_id) {
            for (let i = 0; i < selectDewey.options.length; i++) {
                if (parseInt(selectDewey.options[i].value) === libro.dewey_id) {
                    selectDewey.selectedIndex = i;
                    // Al completar con datos del libro, también guardar el código Dewey
                    guardarValoresSeleccionados();
                    break;
                }
            }
        }
        
        // Completar volumen
        if (document.getElementById('volumen')) {
            document.getElementById('volumen').value = libro.volumen || '';
        }
        
        // Completar ISBN
        if (document.getElementById('isbn')) {
            document.getElementById('isbn').value = libro.isbn || '';
            // Si hay ISBN, verificarlo para mostrar ejemplares existentes
            if (libro.isbn) {
                verificarISBN();
            }
        }
        
        // Establecer la editorial
        if (libro.editorial) {
            const editorialSearch = document.getElementById('editorial-search');
            if (editorialSearch) {
                editorialSearch.value = libro.editorial;
                
                // Si tenemos el ID de la editorial, establecerlo
                if (libro.editorial_id) {
                    document.getElementById('editorial').value = libro.editorial_id;
                    
                    // Mostrar la etiqueta de la editorial seleccionada
                    const editorialTag = document.getElementById('editorial-tag');
                    const editorialTagText = document.getElementById('editorial-tag-text');
                    if (editorialTag && editorialTagText) {
                        editorialTagText.textContent = libro.editorial;
                        editorialTag.classList.remove('d-none');
                    }
                }
            }
        }
        
        // Ocultar los resultados
        resultadosContainer.style.display = 'none';
        
        // Mostrar notificación de éxito
        Swal.fire({
            title: '¡Formulario completado!',
            text: 'Los datos del libro han sido cargados. Puedes editarlos antes de guardar.',
            icon: 'success',
            timer: 2000,
            showConfirmButton: false
        });
    }
    
    // Eventos
    tituloInput.addEventListener('input', function() {
        // Limpiar timeout anterior
        if (timeoutId) {
            clearTimeout(timeoutId);
        }
        
        const query = this.value.trim();
        
        // Si la consulta es muy corta, ocultar resultados
        if (query.length < 2) {
            resultadosContainer.style.display = 'none';
            return;
        }
        
        // Debounce la búsqueda para evitar muchas solicitudes
        timeoutId = setTimeout(() => {
            buscarTitulos(query);
        }, 300);
    });
    
    // Cerrar resultados al hacer clic fuera
    document.addEventListener('click', function(event) {
        if (!tituloInput.contains(event.target) && !resultadosContainer.contains(event.target)) {
            resultadosContainer.style.display = 'none';
        }
    });
    
    // Manejar teclas de navegación
    tituloInput.addEventListener('keydown', function(e) {
        if (resultadosContainer.style.display === 'none') return;
        
        const items = resultadosContainer.querySelectorAll('.list-group-item-action');
        const activeItem = resultadosContainer.querySelector('.active');
        let index = activeItem ? parseInt(activeItem.dataset.index) : -1;
        
        // Tecla Escape: cerrar resultados
        if (e.key === 'Escape') {
            resultadosContainer.style.display = 'none';
            return;
        }
        
        // Tecla Enter: seleccionar resultado activo
        if (e.key === 'Enter' && activeItem) {
            e.preventDefault();
            seleccionarLibro(index);
            return;
        }
        
        // Teclas Arriba/Abajo: navegar por resultados
        if (e.key === 'ArrowDown' || e.key === 'ArrowUp') {
            e.preventDefault();
            
            if (e.key === 'ArrowDown') {
                index = (index < items.length - 1) ? index + 1 : 0;
            } else {
                index = (index > 0) ? index - 1 : items.length - 1;
            }
            
            items.forEach(item => item.classList.remove('active'));
            items[index].classList.add('active');
            items[index].scrollIntoView({ block: 'nearest' });
        }
    });
    
    // Añadir eventos para los botones de reinicio
    if (reiniciarEdadBtn) {
        reiniciarEdadBtn.addEventListener('click', function(e) {
            e.preventDefault();
            
            // Mostrar confirmación
            Swal.fire({
                title: '¿Reiniciar memoria?',
                text: 'Se eliminará la edad recomendada recordada',
                icon: 'question',
                showCancelButton: true,
                confirmButtonText: 'Sí, reiniciar',
                cancelButtonText: 'Cancelar'
            }).then((result) => {
                if (result.isConfirmed) {
                    // Eliminar valor guardado y contador
                    localStorage.removeItem('ultimaEdadRecomendada');
                    localStorage.removeItem('contadorEdadRecomendada');
                    
                    // Eliminar el contador visual si existe
                    const contadorEdadEl = document.getElementById('contador-edad');
                    if (contadorEdadEl) {
                        contadorEdadEl.remove();
                    }
                    
                    // Resetear select
                    if (edadRecomendadaSelect) {
                        edadRecomendadaSelect.selectedIndex = 0;
                    }
                    
                    // Confirmar al usuario
                    Swal.fire({
                        title: 'Memoria reiniciada',
                        text: 'Ya no se recordará la última edad seleccionada',
                        icon: 'success',
                        timer: 1500,
                        showConfirmButton: false
                    });
                }
            });
        });
    }
    
    if (reiniciarDeweyBtn) {
        reiniciarDeweyBtn.addEventListener('click', function(e) {
            e.preventDefault();
            
            // Mostrar confirmación
            Swal.fire({
                title: '¿Reiniciar memoria?',
                text: 'Se eliminará el código Dewey recordado',
                icon: 'question',
                showCancelButton: true,
                confirmButtonText: 'Sí, reiniciar',
                cancelButtonText: 'Cancelar'
            }).then((result) => {
                if (result.isConfirmed) {
                    // Eliminar valor guardado y contador
                    localStorage.removeItem('ultimoCodigoDewey');
                    localStorage.removeItem('contadorCodigoDewey');
                    
                    // Eliminar el contador visual si existe
                    const contadorDeweyEl = document.getElementById('contador-dewey');
                    if (contadorDeweyEl) {
                        contadorDeweyEl.remove();
                    }
                    
                    // Resetear select
                    if (codigoDeweySelect) {
                        codigoDeweySelect.selectedIndex = 0;
                    }
                    
                    // Confirmar al usuario
                    Swal.fire({
                        title: 'Memoria reiniciada',
                        text: 'Ya no se recordará el último código Dewey seleccionado',
                        icon: 'success',
                        timer: 1500,
                        showConfirmButton: false
                    });
                }
            });
        });
    }
});