document.addEventListener('DOMContentLoaded', function () {
    //referencias a elementos relevantes del DOM
    const navbar = document.querySelector('.navbar');
    const megaMenu = document.querySelector('.mega-menu');
    const navbarItem = document.querySelector('.nav-item.colegio');
    
    // Función para manejar la selección de items del menú
    const handleMenuSelection = () => {
        const currentPath = window.location.pathname;
        const menuLinks = document.querySelectorAll('.navbar-nav .nav-item .nav-link');
        
        // Remover clase 'selected' de todos los links
        menuLinks.forEach(link => {
            link.classList.remove('selected');
        });
        
        // Añadir clase 'selected' al link correspondiente según la URL actual
        menuLinks.forEach(link => {
            const href = link.getAttribute('href');
            if (href && (currentPath === href || (href !== '/' && currentPath.includes(href.split('/').pop())))) {
                link.classList.add('selected');
            }
        });
        
        // Manejar caso especial para la página de inicio
        if (currentPath === '/' || currentPath === '/inicio/') {
            const homeLink = document.querySelector('.navbar-nav .nav-item .nav-link[href*="inicio"]');
            if (homeLink) {
                homeLink.classList.add('selected');
            }
        }
    };
    
    // Ejecutar la función al cargar la página
    handleMenuSelection();
    
    // Añadir event listeners para clicks en los items del menú
    const menuLinks = document.querySelectorAll('.navbar-nav .nav-item .nav-link');
    menuLinks.forEach(link => {
        link.addEventListener('click', function() {
            // Remover clase 'selected' de todos los links
            menuLinks.forEach(otherLink => {
                otherLink.classList.remove('selected');
            });
            // Añadir clase 'selected' al link clickeado
            this.classList.add('selected');
        });
    });

    // Verifica si los elementos existen antes de continuar
    if (!navbar || !megaMenu || !navbarItem) return;
    
    // Variables para controlar el estado del mouse sobre los elementos relevantes
    let isMouseOnNavbarItem = false;
    let isMouseOnMegaMenu = false;
    
    // Ajusta la posición del menú desplegable megaMenu para alinearlo con la barra de navegación
    const navbarHeight = navbar.offsetHeight;
    megaMenu.style.top = `${navbarHeight}px`;

    // Función para mostrar o ocultar el menú desplegable megaMenu
    const toggleMegaMenu = (show) => {
        megaMenu.style.display = show ? 'flex' : 'none';
    };

    navbarItem.addEventListener('mouseenter', function () {
        isMouseOnNavbarItem = true;
        toggleMegaMenu(true);
    });

    navbarItem.addEventListener('mouseleave', function () {
        isMouseOnNavbarItem = false;
        setTimeout(function() {
            if (!isMouseOnMegaMenu) {
                toggleMegaMenu(false);
            }
        }, 100);
    });

    megaMenu.addEventListener('mouseenter', function () {
        isMouseOnMegaMenu = true;
    });

    megaMenu.addEventListener('mouseleave', function () {
        isMouseOnMegaMenu = false;
        setTimeout(function() {
            if (!isMouseOnNavbarItem) {
                toggleMegaMenu(false);
            }
        }, 100);
    });

    const hamburgerBtn = document.getElementById("hamburger-btn");
    const dropdown = document.getElementById("hamburger-dropdown");

    if (hamburgerBtn && dropdown) {
        hamburgerBtn.addEventListener("click", function(event) {
            event.stopPropagation();
            dropdown.classList.toggle("active");
            if (dropdown.classList.contains("active")) {
                dropdown.style.display = 'block';
            } else {
                dropdown.style.display = 'none';
            }
        });
    }
    
    const submenuParents = document.querySelectorAll('.submenu-parent');

    submenuParents.forEach(parent => {
        parent.addEventListener('click', function(event) {
            const submenu = parent.querySelector('.submenu');
            if (submenu.style.display === 'flex') {
                submenu.style.display = 'none';
            } else {
                submenu.style.display = 'flex';
            }
            event.stopPropagation();  // prevent event from bubbling up
        });
    });

    // Close all submenus if user clicks outside
    document.addEventListener('click', function(event) {
        if (dropdown && dropdown.classList.contains('active') && !dropdown.contains(event.target) && !hamburgerBtn.contains(event.target)) {
            dropdown.classList.remove('active');
            dropdown.style.display = 'none';
        }
        
        const allSubmenus = document.querySelectorAll('.submenu');
        allSubmenus.forEach(submenu => {
            if (!submenu.parentElement.contains(event.target)) {
                submenu.style.display = 'none';
            }
        });
    });

    window.addEventListener('resize', function() {
        if (window.innerWidth > 768) {
            if (dropdown) {
                dropdown.classList.remove('active');
                dropdown.style.display = 'none';
            }
        } else {
            if (dropdown) {
                dropdown.style.display = '';
            }
        }
    });
    
});