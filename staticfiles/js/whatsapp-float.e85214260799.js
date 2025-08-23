// Funcionalidad adicional para el botón de WhatsApp
document.addEventListener('DOMContentLoaded', function() {
    const whatsappButton = document.querySelector('.whatsapp-float');
    
    if (whatsappButton) {
        // Obtener el número de teléfono del enlace existente
        const currentHref = whatsappButton.href;
        const phoneMatch = currentHref.match(/wa\.me\/(\d+)/);
        const phoneNumber = phoneMatch ? phoneMatch[1] : '56912345678';
        
        const defaultMessage = 'Hola, me gustaría obtener más información sobre el colegio';
        
        // Función para obtener el mensaje basado en la página actual
        function getContextualMessage() {
            const currentPage = window.location.pathname;
            let message = defaultMessage;
            
            if (currentPage.includes('noticias')) {
                message = 'Hola, vi una noticia en el sitio web y me gustaría obtener más información';
            } else if (currentPage.includes('profesores')) {
                message = 'Hola, me interesa conocer más sobre el equipo docente del colegio';
            } else if (currentPage.includes('comunicados')) {
                message = 'Hola, vi un comunicado y tengo algunas consultas';
            } else if (currentPage.includes('calendario')) {
                message = 'Hola, necesito información sobre las fechas de evaluaciones';
            }
            
            return encodeURIComponent(message);
        }
        
        // Actualizar el enlace con el mensaje contextual
        function updateWhatsAppLink() {
            const message = getContextualMessage();
            const whatsappURL = `https://wa.me/${phoneNumber}?text=${message}`;
            whatsappButton.href = whatsappURL;
        }
        
        // Actualizar el enlace al cargar la página
        updateWhatsAppLink();
        
        // Agregar evento de clic para tracking (opcional)
        whatsappButton.addEventListener('click', function(e) {
            // Aquí se puede agregar código para analytics si se desea
            console.log('Usuario hizo clic en el botón de WhatsApp');
            
            // Opcional: mostrar una confirmación antes de redirigir
            // const confirmed = confirm('¿Deseas contactarnos por WhatsApp?');
            // if (!confirmed) {
            //     e.preventDefault();
            // }
        });
        
        // Efecto de aparición gradual cuando se hace scroll
        let hasScrolled = false;
        window.addEventListener('scroll', function() {
            if (!hasScrolled && window.scrollY > 100) {
                whatsappButton.style.opacity = '0';
                whatsappButton.style.transform = 'scale(0.8)';
                
                setTimeout(() => {
                    whatsappButton.style.transition = 'all 0.5s ease';
                    whatsappButton.style.opacity = '1';
                    whatsappButton.style.transform = 'scale(1)';
                }, 100);
                
                hasScrolled = true;
            }
        });
    }
});
