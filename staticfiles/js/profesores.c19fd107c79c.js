$(document).ready(function() {
    // Al hacer clic en el botón "Aplicar color" en el modal
    $('#applyColorBtn2').click(function() {
      var selectedColor = $('#colorPicker').val(); // Obtener el color seleccionado
  
      console.log('Color seleccionado:', selectedColor);
      // Eliminar el carácter "#" del valor del color
      //selectedColor = selectedColor.replace('#', '');
      
      // Construir la URL completa
      var url = 'profesores/seccion/color/' + encodeURIComponent(selectedColor) ;
  
  
      var csrfToken = Cookies.get('csrftoken');
  
      // Realizar la llamada a la API de Django para guardar el color en el modelo
  
      $.ajax({
        url: url,
        method: 'POST',
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
        }
      });
  
      // Cerrar el modal
      $('#colorModal2').modal('hide');
  
      
    });
  });