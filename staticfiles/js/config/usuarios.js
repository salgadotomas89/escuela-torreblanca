document.addEventListener('DOMContentLoaded', function() {
    const usuarioForm = document.getElementById('usuarioForm');

    function showErrors(errors) {
        // Limpiar errores anteriores
        document.querySelectorAll('.error-feedback').forEach(el => el.remove());
        document.querySelectorAll('.is-invalid').forEach(el => el.classList.remove('is-invalid'));

        // Mostrar nuevos errores
        Object.entries(errors).forEach(([field, messages]) => {
            const input = document.getElementById(field);
            if (input) {
                input.classList.add('is-invalid');
                const errorDiv = document.createElement('div');
                errorDiv.className = 'invalid-feedback error-feedback';
                errorDiv.textContent = Array.isArray(messages) ? messages.join(', ') : messages;
                input.parentNode.appendChild(errorDiv);
            } else {
                // Para errores generales o campos no encontrados
                const form = document.getElementById('usuarioForm');
                const errorDiv = document.createElement('div');
                errorDiv.className = 'alert alert-danger mt-3';
                errorDiv.textContent = Array.isArray(messages) ? messages.join(', ') : messages;
                form.insertBefore(errorDiv, form.firstChild);
            }
        });
    }

    if (usuarioForm) {
        usuarioForm.addEventListener('submit', function(e) {
            e.preventDefault();

            // Validar que las contraseñas coincidan
            const password1 = document.getElementById('password1').value;
            const password2 = document.getElementById('password2').value;

            if (password1 !== password2) {
                showErrors({
                    'password2': ['Las contraseñas no coinciden']
                });
                return;
            }

            const formData = new FormData(usuarioForm);

            fetch('/registro/usuario/', {
                method: 'POST',
                body: formData,
                headers: {
                    'X-CSRFToken': getCookie('csrftoken')
                }
            })
            .then(response => response.json())
            .then(data => {
                if (data.success) {
                    const modal = bootstrap.Modal.getInstance(document.getElementById('modalRegistroUsuario'));
                    modal.hide();
                    usuarioForm.reset();
                    window.location.reload();
                } else {
                    showErrors(data.error);
                }
            })
            .catch(error => {
                console.error('Error:', error);
                showErrors({
                    'general': ['Error al procesar la solicitud']
                });
            });
        });
    }

    // Función para obtener el token CSRF
    function getCookie(name) {
        let cookieValue = null;
        if (document.cookie && document.cookie !== '') {
            const cookies = document.cookie.split(';');
            for (let i = 0; i < cookies.length; i++) {
                const cookie = cookies[i].trim();
                if (cookie.substring(0, name.length + 1) === (name + '=')) {
                    cookieValue = decodeURIComponent(cookie.substring(name.length + 1));
                    break;
                }
            }
        }
        return cookieValue;
    }
});
