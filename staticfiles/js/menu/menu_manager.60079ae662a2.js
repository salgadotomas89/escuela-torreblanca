class MenuManager {
    constructor() {
        this.csrfToken = document.querySelector('[name=csrfmiddlewaretoken]').value;
        this.setupEventListeners();
    }

    setupEventListeners() {
        // Formulario de creación/edición
        const menuItemForm = document.getElementById('menuItemForm');
        if (menuItemForm) {
            menuItemForm.addEventListener('submit', (e) => this.handleFormSubmit(e));
        }

        // Botones de edición
        document.querySelectorAll('.edit-item').forEach(button => {
            button.addEventListener('click', (e) => this.handleEdit(e));
        });

        // Botones de eliminación
        document.querySelectorAll('.delete-item').forEach(button => {
            button.addEventListener('click', (e) => this.handleDelete(e));
        });

        // Botón para agregar nuevo item
        const addButton = document.querySelector('[data-bs-target="#modalMenuItem"]');
        if (addButton) {
            addButton.addEventListener('click', () => this.resetForm());
        }
    }

    resetForm() {
        const form = document.getElementById('menuItemForm');
        form.reset();
        document.getElementById('itemId').value = '';
        document.querySelector('.modal-title').textContent = 'Agregar Item del Menú';
    }

    async handleFormSubmit(e) {
        e.preventDefault();
        const formData = new FormData(e.target);
        const itemId = formData.get('id');
        
        try {
            let url = '/configuracion/menu/item/create/';
            if (itemId) {
                url = `/configuracion/menu/item/${itemId}/update/`;
            }

            const response = await this.sendRequest(url, 'POST', formData);
            if (response.ok) {
                window.location.reload();
            } else {
                const data = await response.json();
                this.showError(data.error || 'Error al guardar el item');
            }
        } catch (error) {
            this.showError('Error al procesar la solicitud');
            console.error('Error:', error);
        }
    }

    async handleEdit(e) {
        const itemId = e.currentTarget.dataset.id;
        if (!itemId) {
            this.showError('ID de item no válido');
            return;
        }

        try {
            const response = await this.sendRequest(`/configuracion/menu/item/${itemId}/`);
            if (!response.ok) {
                throw new Error('Error al obtener el item');
            }
            const data = await response.json();
            this.loadItemData(data);
            document.querySelector('.modal-title').textContent = 'Editar Item del Menú';
            new bootstrap.Modal(document.getElementById('modalMenuItem')).show();
        } catch (error) {
            this.showError('Error al cargar el item en la configuración del menú');
            console.error('Error:', error);
        }
    }

    async handleDelete(e) {
        const itemId = e.currentTarget.dataset.id;
        if (!itemId) {
            this.showError('ID de item no válido');
            return;
        }

        if (confirm('¿Está seguro de eliminar este item?')) {
            try {
                const response = await this.sendRequest(`/configuracion/menu/item/${itemId}/delete/`, 'POST');
                if (response.ok) {
                    e.target.closest('tr').remove();
                } else {
                    const data = await response.json();
                    this.showError(data.error || 'Error al eliminar el item');
                }
            } catch (error) {
                this.showError('Error al eliminar el item');
                console.error('Error:', error);
            }
        }
    }

    async sendRequest(url, method = 'GET', body = null) {
        const options = {
            method,
            headers: {
                'X-CSRFToken': this.csrfToken
            }
        };

        if (body) {
            if (body instanceof FormData) {
                options.body = body;
            } else {
                options.headers['Content-Type'] = 'application/json';
                options.body = JSON.stringify(body);
            }
        }

        return await fetch(url, options);
    }

    loadItemData(data) {
        if (!data) return;
        
        document.getElementById('itemId').value = data.id || '';
        document.getElementById('nombre').value = data.nombre || '';
        document.getElementById('url').value = data.url || '';
        document.getElementById('esMegaMenu').checked = data.es_mega_menu || false;
        document.getElementById('soloUsuariosLogueados').checked = data.solo_usuarios_logueados || false;
    }

    showError(message) {
        console.error(message);
        alert(message);
    }
}

// Inicializar cuando el DOM esté listo
document.addEventListener('DOMContentLoaded', () => {
    new MenuManager();
}); 