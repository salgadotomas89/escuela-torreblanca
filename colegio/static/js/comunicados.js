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
