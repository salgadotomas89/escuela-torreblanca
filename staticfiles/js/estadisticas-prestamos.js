// Variables globales para mantener las instancias de los gráficos
let chartInstances = {};

function mostrarEstadisticas() {
    console.log('Función mostrarEstadisticas llamada');

    // Mostrar el modal de estadísticas
    const estadisticasModal = new bootstrap.Modal(document.getElementById('estadisticasModal'));
    estadisticasModal.show();

    // Mostrar loading y ocultar contenido
    document.getElementById('estadisticas-loading').style.display = 'block';
    document.getElementById('estadisticas-content').style.display = 'none';
    document.getElementById('estadisticas-error').style.display = 'none';

    // Obtener años disponibles
    fetch('/biblioteca/obtener-anos-prestamos/')
        .then(response => response.json())
        .then(data => {
            if (data.success) {
                if (data.años.length === 0) {
                    mostrarError('No hay préstamos registrados en el sistema.');
                    return;
                }

                configurarFiltros(data);
                mostrarContenido();
                actualizarEstadisticas();
            } else {
                throw new Error(data.error || 'Error al obtener años de préstamos');
            }
        })
        .catch(error => {
            console.error('Error:', error);
            mostrarError('Error al cargar las estadísticas: ' + error.message);
        });
}

function configurarFiltros(data) {
    const currentYear = new Date().getFullYear();
    const años = data.años;
    const mesesDisponibles = data.meses_disponibles;
    
    const nombresMeses = {
        1: 'Enero', 2: 'Febrero', 3: 'Marzo', 4: 'Abril',
        5: 'Mayo', 6: 'Junio', 7: 'Julio', 8: 'Agosto',
        9: 'Septiembre', 10: 'Octubre', 11: 'Noviembre', 12: 'Diciembre'
    };

    // Configurar filtro de años
    const filtroAño = document.getElementById('filtro-año');
    filtroAño.innerHTML = '<option value="">Todos los años</option>';
    años.forEach(año => {
        const option = document.createElement('option');
        option.value = año;
        option.textContent = año;
        if (año === currentYear) option.selected = true;
        filtroAño.appendChild(option);
    });

    // Configurar filtro de meses
    const filtroMes = document.getElementById('filtro-mes');
    filtroMes.innerHTML = '<option value="">Todos los meses</option>';
    mesesDisponibles.forEach(mes => {
        const option = document.createElement('option');
        option.value = mes;
        option.textContent = nombresMeses[mes];
        filtroMes.appendChild(option);
    });

    // Mostrar información del rango de datos
    if (data.primer_prestamo && data.ultimo_prestamo) {
        const rangoInfo = document.getElementById('info-rango');
        const rangoTexto = document.getElementById('rango-texto');
        rangoTexto.textContent = `Datos disponibles desde: ${new Date(data.primer_prestamo).toLocaleDateString('es-ES')} hasta: ${new Date(data.ultimo_prestamo).toLocaleDateString('es-ES')}`;
        rangoInfo.style.display = 'block';
    }
}

function mostrarContenido() {
    document.getElementById('estadisticas-loading').style.display = 'none';
    document.getElementById('estadisticas-content').style.display = 'block';
    document.getElementById('estadisticas-error').style.display = 'none';
}

function mostrarError(mensaje) {
    document.getElementById('estadisticas-loading').style.display = 'none';
    document.getElementById('estadisticas-content').style.display = 'none';
    document.getElementById('estadisticas-error').style.display = 'block';
    document.getElementById('mensaje-error').textContent = mensaje;
}

function actualizarEstadisticas() {
    const año = document.getElementById('filtro-año').value;
    const mes = document.getElementById('filtro-mes').value;
    
    // Mostrar indicador de carga en el botón
    const btnActualizar = document.getElementById('btn-actualizar');
    const btnActualizarModal = document.querySelector('#estadisticasModal .modal-footer .btn-primary');
    const originalText = btnActualizar.innerHTML;
    const originalModalText = btnActualizarModal.innerHTML;
    
    btnActualizar.innerHTML = '<i class="bi bi-arrow-clockwise spinning me-2"></i>Cargando...';
    btnActualizarModal.innerHTML = '<i class="bi bi-arrow-clockwise spinning me-2"></i>Cargando...';
    btnActualizar.disabled = true;
    btnActualizarModal.disabled = true;
    
    // Construir la URL con los parámetros de filtro
    const url = `/biblioteca/obtener-estadisticas-prestamos/?año=${año}&mes=${mes}`;

    fetch(url)
        .then(response => response.json())
        .then(data => {
            if (data.success) {
                // Destruir gráficos existentes
                Object.keys(chartInstances).forEach(key => {
                    if (chartInstances[key]) {
                        chartInstances[key].destroy();
                        delete chartInstances[key];
                    }
                });

                // Crear nuevos gráficos con los datos filtrados
                crearGraficoLibrosMasPrestados(data.libros_mas_prestados);
                crearGraficoPrestamosPorMes(data.prestamos_por_mes);
                crearGraficoTasaDevolucion(data.tasa_devolucion);
                crearGraficoAlumnosFrecuentes(data.alumnos_frecuentes);
                
                // Actualizar resumen estadístico
                actualizarResumenEstadistico(data);
            } else {
                throw new Error(data.error || 'Error al obtener estadísticas');
            }
        })
        .catch(error => {
            console.error('Error:', error);
            mostrarError('Error al actualizar las estadísticas: ' + error.message);
        })
        .finally(() => {
            // Restaurar botones
            btnActualizar.innerHTML = originalText;
            btnActualizarModal.innerHTML = originalModalText;
            btnActualizar.disabled = false;
            btnActualizarModal.disabled = false;
        });
}

function actualizarResumenEstadistico(data) {
    const resumenContainer = document.getElementById('resumen-stats');
    
    // Calcular estadísticas del resumen
    const totalPrestamos = data.libros_mas_prestados.reduce((sum, libro) => sum + libro.total_prestamos, 0);
    const totalLibrosUnicos = data.libros_mas_prestados.length;
    const totalAlumnos = data.alumnos_frecuentes.length;
    const tasaDevolucion = data.tasa_devolucion.porcentaje || 0;
    
    resumenContainer.innerHTML = `
        <div class="col-md-3">
            <div class="bg-primary text-white rounded p-3">
                <div class="d-flex align-items-center">
                    <i class="bi bi-book-fill fs-2 me-3"></i>
                    <div>
                        <h4 class="mb-0">${totalPrestamos}</h4>
                        <small>Total préstamos</small>
                    </div>
                </div>
            </div>
        </div>
        <div class="col-md-3">
            <div class="bg-success text-white rounded p-3">
                <div class="d-flex align-items-center">
                    <i class="bi bi-journal-bookmark-fill fs-2 me-3"></i>
                    <div>
                        <h4 class="mb-0">${totalLibrosUnicos}</h4>
                        <small>Libros únicos</small>
                    </div>
                </div>
            </div>
        </div>
        <div class="col-md-3">
            <div class="bg-info text-white rounded p-3">
                <div class="d-flex align-items-center">
                    <i class="bi bi-people-fill fs-2 me-3"></i>
                    <div>
                        <h4 class="mb-0">${totalAlumnos}</h4>
                        <small>Alumnos activos</small>
                    </div>
                </div>
            </div>
        </div>
        <div class="col-md-3">
            <div class="bg-warning text-white rounded p-3">
                <div class="d-flex align-items-center">
                    <i class="bi bi-arrow-return-left fs-2 me-3"></i>
                    <div>
                        <h4 class="mb-0">${tasaDevolucion.toFixed(1)}%</h4>
                        <small>Devolución a tiempo</small>
                    </div>
                </div>
            </div>
        </div>
    `;
}

function crearGraficoLibrosMasPrestados(datos) {
    const ctx = document.getElementById('librosMasPrestadosChart').getContext('2d');
    chartInstances.libros = new Chart(ctx, {
        type: 'bar',
        data: {
            labels: datos.map(d => d.ejemplar__material__titulo.length > 30 ? 
                d.ejemplar__material__titulo.substring(0, 30) + '...' : 
                d.ejemplar__material__titulo),
            datasets: [{
                label: 'Número de préstamos',
                data: datos.map(d => d.total_prestamos),
                backgroundColor: 'rgba(54, 162, 235, 0.6)',
                borderColor: 'rgba(54, 162, 235, 1)',
                borderWidth: 1
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    display: false
                },
                tooltip: {
                    callbacks: {
                        title: function(context) {
                            return datos[context[0].dataIndex].ejemplar__material__titulo;
                        }
                    }
                }
            },
            scales: {
                y: {
                    beginAtZero: true,
                    ticks: {
                        stepSize: 1
                    }
                },
                x: {
                    ticks: {
                        maxRotation: 45,
                        minRotation: 45
                    }
                }
            }
        }
    });
}

function crearGraficoPrestamosPorMes(datos) {
    const ctx = document.getElementById('prestamosPorMesChart').getContext('2d');
    chartInstances.prestamos = new Chart(ctx, {
        type: 'line',
        data: {
            labels: datos.map(d => {
                const fecha = new Date(d.mes);
                return fecha.toLocaleDateString('es-ES', { month: 'short', year: 'numeric' });
            }),
            datasets: [{
                label: 'Préstamos',
                data: datos.map(d => d.total),
                borderColor: 'rgba(75, 192, 192, 1)',
                backgroundColor: 'rgba(75, 192, 192, 0.2)',
                tension: 0.3,
                fill: true,
                pointBackgroundColor: 'rgba(75, 192, 192, 1)',
                pointBorderColor: '#fff',
                pointBorderWidth: 2,
                pointRadius: 5
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    display: false
                }
            },
            scales: {
                y: {
                    beginAtZero: true,
                    ticks: {
                        stepSize: 1
                    }
                }
            }
        }
    });
}

function crearGraficoTasaDevolucion(datos) {
    const ctx = document.getElementById('tasaDevolucionChart').getContext('2d');
    const aTiempo = datos.a_tiempo || 0;
    const fueraDeTiempo = (datos.total || 0) - aTiempo;
    
    chartInstances.devolucion = new Chart(ctx, {
        type: 'doughnut',
        data: {
            labels: ['A tiempo', 'Fuera de tiempo'],
            datasets: [{
                data: [aTiempo, fueraDeTiempo],
                backgroundColor: [
                    'rgba(40, 167, 69, 0.8)',
                    'rgba(220, 53, 69, 0.8)'
                ],
                borderColor: [
                    'rgba(40, 167, 69, 1)',
                    'rgba(220, 53, 69, 1)'
                ],
                borderWidth: 2
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    position: 'bottom',
                    labels: {
                        padding: 20
                    }
                },
                tooltip: {
                    callbacks: {
                        label: function(context) {
                            const label = context.label || '';
                            const value = context.parsed;
                            const total = aTiempo + fueraDeTiempo;
                            const percentage = total > 0 ? ((value / total) * 100).toFixed(1) : 0;
                            return `${label}: ${value} (${percentage}%)`;
                        }
                    }
                }
            }
        }
    });
}

function crearGraficoAlumnosFrecuentes(datos) {
    const ctx = document.getElementById('alumnosFrecuentesChart').getContext('2d');
    chartInstances.alumnos = new Chart(ctx, {
        type: 'bar',
        data: {
            labels: datos.map(d => {
                const nombre = `${d.alumno__nombre} ${d.alumno__paterno}`;
                return nombre.length > 20 ? nombre.substring(0, 20) + '...' : nombre;
            }),
            datasets: [{
                label: 'Préstamos realizados',
                data: datos.map(d => d.total_prestamos),
                backgroundColor: 'rgba(153, 102, 255, 0.6)',
                borderColor: 'rgba(153, 102, 255, 1)',
                borderWidth: 1
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    display: false
                },
                tooltip: {
                    callbacks: {
                        title: function(context) {
                            return `${datos[context[0].dataIndex].alumno__nombre} ${datos[context[0].dataIndex].alumno__paterno}`;
                        }
                    }
                }
            },
            scales: {
                y: {
                    beginAtZero: true,
                    ticks: {
                        stepSize: 1
                    }
                },
                x: {
                    ticks: {
                        maxRotation: 45,
                        minRotation: 45
                    }
                }
            }
        }
    });
}

// Limpiar gráficos al cerrar el modal
document.getElementById('estadisticasModal').addEventListener('hidden.bs.modal', function() {
    Object.keys(chartInstances).forEach(key => {
        if (chartInstances[key]) {
            chartInstances[key].destroy();
            delete chartInstances[key];
        }
    });
});

// Agregar CSS para animación de carga
const style = document.createElement('style');
style.textContent = `
    .spinning {
        animation: spin 1s linear infinite;
    }
    
    @keyframes spin {
        from { transform: rotate(0deg); }
        to { transform: rotate(360deg); }
    }
`;
document.head.appendChild(style);

// Asegurarse de que la función esté disponible globalmente
window.mostrarEstadisticas = mostrarEstadisticas;
window.actualizarEstadisticas = actualizarEstadisticas;