// Hero Parallax Effect - Optimizado para mínimo uso de recursos
(function() {
    'use strict';
    
    // Verificar soporte de parallax y capacidades del dispositivo
    const isMobile = /Mobi|Android|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const supportsIntersectionObserver = 'IntersectionObserver' in window;
    
    let heroParallax, heroSection, heroContent, scrollIndicator;
    let heroHeight = 0;
    let isHeroVisible = true;
    let rafId = null;
    let parallaxEnabled = true;
    
    // Cache de elementos DOM - solo una vez
    function initElements() {
        heroParallax = document.querySelector('.hero-parallax');
        heroSection = document.querySelector('.hero-section');
        heroContent = document.querySelector('.hero-content');
        scrollIndicator = document.querySelector('.scroll-arrow');
        
        if (!heroParallax || !heroSection) return false;
        
        // Verificar si el parallax está habilitado desde el backend
        parallaxEnabled = heroSection.dataset.parallax === 'true';
        
        heroHeight = heroSection.offsetHeight;
        return true;
    }
    
    // Salir temprano si no hay soporte, el usuario prefiere movimiento reducido, o está en móvil, o parallax deshabilitado
    function shouldSkipParallax() {
        return isMobile || prefersReducedMotion || !parallaxEnabled;
    }
    
    // Cache de elementos DOM - solo una vez
    function initElements() {
        heroParallax = document.querySelector('.hero-parallax');
        heroSection = document.querySelector('.hero-section');
        heroContent = document.querySelector('.hero-content');
        scrollIndicator = document.querySelector('.scroll-arrow');
        
        if (!heroParallax || !heroSection) return false;
        
        heroHeight = heroSection.offsetHeight;
        return true;
    }
    
    // Función optimizada de parallax - mínimos cálculos
    function updateParallax() {
        if (shouldSkipParallax()) return;
        
        const scrollTop = window.pageYOffset;
        
        // Actualizar visibilidad basado en scroll actual
        isHeroVisible = scrollTop < heroHeight;
        
        if (!isHeroVisible) return;
        
        // Cálculos mínimos
        const yPos = scrollTop * 0.5; // Velocidad parallax fija
        const opacity = Math.max(0, 1 - (scrollTop / heroHeight));
        
        // Aplicar cambios usando transform3d para aceleración hardware
        heroParallax.style.transform = `translate3d(0, ${yPos}px, 0)`;
        heroContent.style.opacity = opacity;
    }
    
    // Throttled scroll handler con RAF
    function onScroll() {
        if (rafId) return;
        
        rafId = requestAnimationFrame(() => {
            updateParallax();
            rafId = null;
        });
    }
    
    // Función adicional para manejar scroll hacia arriba
    let lastScrollTop = 0;
    function handleScroll() {
        const scrollTop = window.pageYOffset;
        
        // Si hacemos scroll hacia arriba y estamos cerca del hero, forzar actualización
        if (scrollTop < lastScrollTop && scrollTop < heroHeight * 1.5) {
            isHeroVisible = true;
        }
        
        lastScrollTop = scrollTop;
        onScroll();
    }
    
    // Observer para detectar visibilidad del hero
    function setupIntersectionObserver() {
        if (!supportsIntersectionObserver) return;
        
        const observer = new IntersectionObserver((entries) => {
            const heroEntry = entries[0];
            isHeroVisible = heroEntry.isIntersecting || heroEntry.boundingClientRect.bottom > 0;
            
            // Si el hero está visible o parcialmente visible, actualizar parallax
            if (isHeroVisible) {
                updateParallax();
            }
            
            // Cancelar RAF si hero no está visible
            if (!isHeroVisible && rafId) {
                cancelAnimationFrame(rafId);
                rafId = null;
            }
        }, {
            rootMargin: '100px 0px 0px 0px', // Margen superior más amplio
            threshold: [0, 0.1, 0.5, 1]
        });
        
        observer.observe(heroSection);
    }
    
    // Click handler para scroll suave - una sola función
    function setupScrollIndicator() {
        if (!scrollIndicator) return;
        
        scrollIndicator.addEventListener('click', () => {
            const target = document.querySelector('#noticias');
            if (target) {
                target.scrollIntoView({ behavior: 'smooth', block: 'start' });
            }
        }, { passive: true });
    }
    
    // Resize handler con debounce
    let resizeTimeout;
    function onResize() {
        clearTimeout(resizeTimeout);
        resizeTimeout = setTimeout(() => {
            heroHeight = heroSection.offsetHeight;
            isHeroVisible = window.pageYOffset < heroHeight;
        }, 150);
    }
    
    // Inicialización
    function init() {
        if (!initElements()) return;
        
        // Si el parallax está deshabilitado, salir temprano pero mantener otros efectos
        if (shouldSkipParallax()) {
            setupScrollIndicator();
            return;
        }
        
        setupIntersectionObserver();
        setupScrollIndicator();
        
        // Event listeners con passive para mejor rendimiento
        window.addEventListener('scroll', handleScroll, { passive: true });
        window.addEventListener('resize', onResize, { passive: true });
        
        // Primera ejecución
        updateParallax();
    }
    
    // Inicializar cuando el DOM esté listo
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }
    
    // Cleanup al descargar la página
    window.addEventListener('beforeunload', () => {
        if (rafId) {
            cancelAnimationFrame(rafId);
        }
        clearTimeout(resizeTimeout);
    });
    
})();
