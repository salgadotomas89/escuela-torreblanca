/* JavaScript para manejo de múltiples imágenes en el hero */
document.addEventListener('DOMContentLoaded', function() {
    const heroBackgrounds = document.querySelectorAll('.hero-bg');
    const heroIndicators = document.querySelectorAll('.hero-indicator');
    
    if (heroBackgrounds.length > 1) {
        let currentSlide = 0;
        let slideInterval;
        
        function showSlide(index) {
            // Ocultar todas las imágenes
            heroBackgrounds.forEach(bg => bg.classList.remove('active'));
            heroIndicators.forEach(indicator => indicator.classList.remove('active'));
            
            // Mostrar la imagen actual
            if (heroBackgrounds[index]) {
                heroBackgrounds[index].classList.add('active');
            }
            if (heroIndicators[index]) {
                heroIndicators[index].classList.add('active');
            }
        }
        
        function nextSlide() {
            currentSlide = (currentSlide + 1) % heroBackgrounds.length;
            showSlide(currentSlide);
        }
        
        function startSlideshow() {
            slideInterval = setInterval(nextSlide, 5000); // Cambiar cada 5 segundos
        }
        
        function stopSlideshow() {
            if (slideInterval) {
                clearInterval(slideInterval);
            }
        }
        
        // Manejar clics en indicadores
        heroIndicators.forEach((indicator, index) => {
            indicator.addEventListener('click', () => {
                currentSlide = index;
                showSlide(currentSlide);
                stopSlideshow();
                startSlideshow(); // Reiniciar el timer
            });
        });
        
        // Pausar slideshow al hacer hover en el hero
        const heroSection = document.getElementById('hero');
        if (heroSection) {
            heroSection.addEventListener('mouseenter', stopSlideshow);
            heroSection.addEventListener('mouseleave', startSlideshow);
        }
        
        // Iniciar slideshow
        startSlideshow();
    }
});
