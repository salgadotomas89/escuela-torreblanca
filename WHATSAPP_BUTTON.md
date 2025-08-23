# Botón Flotante de WhatsApp

## Descripción
Se ha implementado un botón flotante de WhatsApp que permite a los usuarios contactar directamente al colegio a través de esta plataforma de mensajería.

## Características

### 🎨 Diseño
- Botón circular flotante verde (color oficial de WhatsApp)
- Animación de pulso para llamar la atención
- Efecto hover con cambio de color y escala
- Tooltip informativo al pasar el mouse
- Responsive para dispositivos móviles

### 📱 Funcionalidad
- Enlace directo a WhatsApp con mensaje predeterminado
- Mensaje contextual según la página visitada
- Efecto de aparición gradual al hacer scroll
- Número de teléfono configurable desde el panel de administración

### ⚙️ Configuración

#### Panel de Administración
1. Ingresar al panel de administración de Django
2. Navegar a **Colegio > Appearance Settings**
3. En la sección **"Contacto WhatsApp"** configurar el número de teléfono
4. Formato: `56912345678` (incluir código de país sin el símbolo +)

#### Archivos Creados/Modificados

**CSS:**
- `/colegio/static/css/whatsapp-float.css` - Estilos del botón flotante

**JavaScript:**
- `/colegio/static/js/whatsapp-float.js` - Funcionalidad interactiva

**Templates:**
- `/colegio/templates/components/whatsapp_button.html` - Componente reutilizable
- `/colegio/templatetags/whatsapp_tags.py` - Template tags personalizados

**Modelos:**
- Agregado campo `whatsapp_number` al modelo `AppearanceSettings`

### 🚀 Uso

#### En Templates
```django
{% load whatsapp_tags %}
{% whatsapp_button %}
```

#### Obtener solo el número
```django
{% load whatsapp_tags %}
{% get_whatsapp_number %}
```

### 📍 Ubicación
El botón aparece fijo en la esquina inferior derecha de la pantalla en todas las páginas donde se incluya.

### 📝 Mensajes Contextuales
El sistema detecta automáticamente la página actual y envía mensajes personalizados:

- **Página principal:** "Hola, me gustaría obtener más información sobre el colegio"
- **Noticias:** "Hola, vi una noticia en el sitio web y me gustaría obtener más información"
- **Profesores:** "Hola, me interesa conocer más sobre el equipo docente del colegio"
- **Comunicados:** "Hola, vi un comunicado y tengo algunas consultas"
- **Calendario:** "Hola, necesito información sobre las fechas de evaluaciones"

### 🔧 Personalización

#### Cambiar Colores
Editar el archivo `whatsapp-float.css`:
```css
.whatsapp-float {
    background-color: #25d366; /* Verde de WhatsApp */
}

.whatsapp-float:hover {
    background-color: #128c7e; /* Verde más oscuro */
}
```

#### Cambiar Posición
```css
.whatsapp-float {
    bottom: 20px; /* Distancia desde abajo */
    right: 20px;  /* Distancia desde la derecha */
}
```

#### Cambiar Tamaño
```css
.whatsapp-float {
    width: 60px;
    height: 60px;
}
```

### 📊 Analytics (Opcional)
El JavaScript incluye un evento de clic que se puede conectar con Google Analytics o similar:

```javascript
whatsappButton.addEventListener('click', function(e) {
    // Agregar código de tracking aquí
    console.log('Usuario hizo clic en el botón de WhatsApp');
});
```

### ✅ Requisitos
- Bootstrap Icons (ya incluido en el layout principal)
- Django funcionando correctamente
- Número de WhatsApp válido configurado

### 🔄 Migración Aplicada
```bash
python manage.py makemigrations colegio
python manage.py migrate
```

### 🎯 Compatibilidad
- Todas las versiones modernas de navegadores
- Dispositivos móviles y de escritorio
- Funciona tanto en HTTP como HTTPS

---

**Nota:** Para cambiar el número de WhatsApp, simplemente modifícalo desde el panel de administración en la sección **Appearance Settings**. Los cambios se aplicarán inmediatamente en todo el sitio web.
