document.addEventListener('DOMContentLoaded', function() {
    const csrfToken = document.querySelector('[name=csrfmiddlewaretoken]').value;
    const tableBody = document.getElementById('menuItemsTable');

    // Función para actualizar el orden en la base de datos
    async function actualizarOrden(itemId, nuevoOrden) {
        try {
            const formData = new FormData();
            formData.append('orden', nuevoOrden);
            
            const response = await fetch(`/configuracion/menu/item/${itemId}/update/`, {
                method: 'POST',
                headers: {
                    'X-CSRFToken': csrfToken
                },
                body: formData
            });
            
            if (!response.ok) {
                throw new Error('Error al actualizar el orden');
            }
            
            return await response.json();
        } catch (error) {
            console.error('Error:', error);
            alert('Error al actualizar el orden');
        }
    }

    // Función para intercambiar el orden de dos filas
    async function intercambiarOrden(fila1, fila2) {
        const orden1 = parseInt(fila1.dataset.orden);
        const orden2 = parseInt(fila2.dataset.orden);
        const id1 = fila1.dataset.id;
        const id2 = fila2.dataset.id;
        
        try {
            // Actualizar los valores en la base de datos
            await actualizarOrden(id1, orden2);
            await actualizarOrden(id2, orden1);
            
            // Actualizar los valores en el DOM
            fila1.dataset.orden = orden2;
            fila2.dataset.orden = orden1;
            fila1.querySelector('.orden-valor').textContent = orden2;
            fila2.querySelector('.orden-valor').textContent = orden1;
            
            // Actualizar estado de los botones
            actualizarEstadoBotones();
        } catch (error) {
            console.error('Error al intercambiar orden:', error);
            alert('Error al actualizar el orden de los items');
        }
    }

    // Función para actualizar el estado de los botones
    function actualizarEstadoBotones() {
        const filas = Array.from(tableBody.getElementsByTagName('tr'));
        
        filas.forEach((fila, index) => {
            const btnSubir = fila.querySelector('.move-up');
            const btnBajar = fila.querySelector('.move-down');
            
            if (btnSubir) btnSubir.disabled = index === 0;
            if (btnBajar) btnBajar.disabled = index === filas.length - 1;
        });
    }

    // Event listeners para los botones de mover
    tableBody.addEventListener('click', async function(e) {
        const target = e.target.closest('.move-up, .move-down');
        if (!target) return;

        const fila = target.closest('tr');
        const filas = Array.from(tableBody.getElementsByTagName('tr'));
        const index = filas.indexOf(fila);

        if (target.classList.contains('move-up') && index > 0) {
            const filaAnterior = filas[index - 1];
            await intercambiarOrden(fila, filaAnterior);
            tableBody.insertBefore(fila, filaAnterior);
        } else if (target.classList.contains('move-down') && index < filas.length - 1) {
            const filaSiguiente = filas[index + 1];
            await intercambiarOrden(fila, filaSiguiente);
            tableBody.insertBefore(filaSiguiente, fila);
        }
    });

    // Inicializar el estado de los botones
    actualizarEstadoBotones();
});