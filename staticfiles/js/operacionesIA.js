//cuando el usuario hace click en el btn onclick=obtenerDatosIA
function obtenerDatosIA() {
    const titulo = document.getElementById('titulo').value;
    const autores = document.getElementById('autores').value;

    if (!titulo || !autores) {
        Swal.fire({
            icon: 'warning',
            title: 'Datos incompletos',
            text: 'Por favor, ingrese el título y los autores del libro.'
        });
        return;
    }

    // Mostrar indicador de carga
    document.getElementById('btn-obtener-ia').disabled = true;
    document.getElementById('btn-obtener-ia').innerHTML = '<i class="bi bi-hourglass-split"></i> Procesando...';

    // Obtener el token CSRF
    const csrftoken = document.querySelector('[name=csrfmiddlewaretoken]').value;

    // Realizar la petición al servidor
    fetch('/biblioteca/openai_recommendation/', {
        method: 'POST',
        headers: {
            'X-CSRFToken': csrftoken,
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({
            title: titulo,
            authors: autores
        })
    })
    .then(response => response.json())
    .then(data => {
        if (data && data.age_recommended && data.dewey_code && data.description && data.publication_year) {
            // Actualizar el campo de edad recomendada
            const edadSelect = document.getElementById('edad_recomendada');
            const edadRecomendada = data.age_recommended.split(' ')[0]; // Obtener solo el número
            edadSelect.value = edadRecomendada;

            // Actualizar el campo de resumen
            document.getElementById('resumen').value = data.description;

            // Actualizar el año de publicación
            document.getElementById('anio').value = data.publication_year.trim();

            // Procesar el código Dewey
            const deweyCode = data.dewey_code.split(' ')[0]; // Obtener solo el código
            const deweyDescription = data.dewey_code.substring(data.dewey_code.indexOf(' ') + 1); // Obtener la descripción
            const deweySelect = document.getElementById('codigo_dewey');

            // Buscar si el código Dewey ya existe
            const deweyOption = Array.from(deweySelect.options).find(option => 
                option.text.startsWith(deweyCode)
            );

            if (deweyOption) {
                // Si existe, seleccionarlo
                deweySelect.value = deweyOption.value;
                document.getElementById('dewey-recomendado').style.display = 'block';
                document.getElementById('dewey-recomendado-texto').textContent = data.dewey_code;
            } else {
                // Si no existe, agregarlo a la base de datos
                fetch('/biblioteca/agregar_codigo_dewey/', {
                    method: 'POST',
                    headers: {
                        'X-CSRFToken': csrftoken,
                        'Content-Type': 'application/x-www-form-urlencoded'
                    },
                    body: `codigo=${encodeURIComponent(deweyCode)}&descripcion=${encodeURIComponent(deweyDescription)}`
                })
                .then(response => response.json())
                .then(deweyData => {
                    if (deweyData.success) {
                        // Agregar la nueva opción al select
                        const newOption = new Option(`${deweyCode} - ${deweyDescription}`, deweyData.id);
                        deweySelect.add(newOption);
                        deweySelect.value = deweyData.id;
                        
                        // Mostrar mensaje de éxito
                        Swal.fire({
                            icon: 'success',
                            title: 'Código Dewey agregado',
                            text: 'Se ha agregado un nuevo código Dewey al sistema',
                            timer: 1500,
                            showConfirmButton: false
                        });
                    }
                });
            }

            Swal.fire({
                icon: 'success',
                title: '¡Datos obtenidos!',
                text: 'Se han actualizado los campos con la información sugerida por la IA.',
                showConfirmButton: false,
                timer: 1500
            });
        } else {
            throw new Error('No se recibió una recomendación válida');
        }
    })
    .catch(error => {
        console.error('Error:', error);
        Swal.fire({
            icon: 'error',
            title: 'Error',
            text: 'Hubo un error al obtener la recomendación'
        });
    })
    .finally(() => {
        // Restaurar el botón
        document.getElementById('btn-obtener-ia').disabled = false;
        document.getElementById('btn-obtener-ia').innerHTML = '<i class="bi bi-robot"></i> Obtener datos con IA';
    });
}
