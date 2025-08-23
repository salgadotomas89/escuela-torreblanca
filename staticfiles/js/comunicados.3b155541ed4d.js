$(document).ready(function() {
  // Al hacer clic en el botón "Aplicar color" en el modal
  $('#applyColorBtn').click(function() {
    var selectedColor = $('#colorPicker').val(); // Obtener el color seleccionado

    console.log('Color seleccionado:', selectedColor);
    // Eliminar el carácter "#" del valor del color
    //selectedColor = selectedColor.replace('#', '');
    
    // Actualizar el color inmediatamente
    $('.color-section').css('background-color', selectedColor);

    var csrfToken = Cookies.get('csrftoken');

    // Realizar la llamada a la API de Django para guardar el color en el modelo

    $.ajax({
      url: 'seccion/comunicados/color/',
      method: 'POST',
      data: {
        color: selectedColor
      },
      headers: {
        'X-CSRFToken': csrfToken  // Incluir el token CSRF en los encabezados de la solicitud
      },
      success: function(response) {
        // La solicitud se completó con éxito
        console.log('Color guardado:', selectedColor);

      },
      error: function(error) {
        // Ocurrió un error en la solicitud
        console.error('Error al guardar el color:', error);
        // Revertir el color en caso de error
        $('.color-section').css('background-color', '');
      }
    });

    // Cerrar el modal
    $('#colorModal').modal('hide');

    
  });
});


$(document).ready(function() {
  // Capturar el evento de envío del formulario
  $('#comunicadoForm').submit(function(event) {
    event.preventDefault(); // Evitar el envío del formulario por defecto

    // Obtener los datos del formulario
    var formData = new FormData(this);

    // Realizar la llamada a la API de Django para guardar los datos
    $.ajax({
      url: 'comunicados/guardar-comunicado/',
      method: 'POST',
      data: formData,
      processData: false,
      contentType: false,
      success: function(response) {
        // La solicitud se completó con éxito, puedes realizar acciones adicionales aquí si es necesario
        console.log('Comunicado guardado');
        
        // Cerrar el modal
        $('#nuevoComunicado').modal('hide');
        
        // Limpiar el formulario
        $('#comunicadoForm')[0].reset();
      },
      error: function(error) {
        // Ocurrió un error en la solicitud, maneja el error adecuadamente
        console.error('Error al guardar el comunicado:', error);
      }
    });
  });
});
