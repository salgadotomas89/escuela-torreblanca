$(document).ready(function() {
    // Manejar el cambio en el tipo de material
    $('#tipo_material').change(function() {
        $('.campos-especificos').hide();
        $('#campos-' + $(this).val().toLowerCase()).show();
    });

    // Validación del formulario
    $('#agregar-material-form').submit(function(e) {
        e.preventDefault();
        if (validateForm()) {
            // Aquí iría el código para enviar el formulario
            alert('Formulario válido, se enviaría al servidor.');
        }
    });

    function validateForm() {
        let isValid = true;
        $('#agregar-material-form input, #agregar-material-form select, #agregar-material-form textarea').each(function() {
            if ($(this).prop('required') && !$(this).val()) {
                $(this).addClass('is-invalid');
                isValid = false;
            } else {
                $(this).removeClass('is-invalid');
            }
        });

        // Validación específica para cada tipo de material
        let tipoMaterial = $('#tipo_material').val();
        if (tipoMaterial === 'Libro') {
            if (!$('#isbn').val()) {
                $('#isbn').addClass('is-invalid');
                isValid = false;
            }
        } else if (tipoMaterial === 'Revista') {
            if (!$('#issn').val()) {
                $('#issn').addClass('is-invalid');
                isValid = false;
            }
        } else if (tipoMaterial === 'Tesis') {
            if (!$('#institucion').val() || !$('#grado').val()) {
                $('#institucion, #grado').addClass('is-invalid');
                isValid = false;
            }
        } else if (tipoMaterial === 'Fanzine') {
            if (!$('#numero_edicion').val() || !$('#tema').val()) {
                $('#numero_edicion, #tema').addClass('is-invalid');
                isValid = false;
            }
        }

        return isValid;
    }

    // Limpiar la validación cuando se escribe en un campo
    $('#agregar-material-form input, #agregar-material-form select, #agregar-material-form textarea').on('input', function() {
        $(this).removeClass('is-invalid');
    });

    // Manejar el botón de obtener recomendaciones
    $('#obtener-recomendaciones').click(function() {
        // Aquí iría el código para obtener recomendaciones
        $('#recomendaciones-alert').show();
    });

    // Manejar la adición de una nueva editorial
    $('#guardar-editorial').click(function() {
        let nombreEditorial = $('#nombre_editorial').val();
        if (nombreEditorial) {
            // Aquí iría el código para guardar la nueva editorial en el servidor
            let newOption = new Option(nombreEditorial, 'nueva_editorial');
            $('#editorial').append(newOption);
            $('#editorial').val('nueva_editorial');
            $('#nuevaEditorialModal').modal('hide');
        } else {
            $('#nombre_editorial').addClass('is-invalid');
        }
    });
});