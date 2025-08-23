// Función para mostrar el marbete
function mostrarMarbete(btn) {
    // Obtener datos del botón
    const dewey = btn.dataset.dewey;
    const autor = btn.dataset.autor;
    const titulo = btn.dataset.titulo;
    const anio = btn.dataset.anio;
    const volumen = btn.dataset.volumen;
    const totalEjemplares = parseInt(btn.dataset.ejemplares) || 1;
    const pais = btn.dataset.pais || '';
    const tipoMaterial = btn.dataset.tipo || 'libro';
    const esReferencia = btn.dataset.referencia === 'true';

    // Formatear el código del autor (tres primeras letras del apellido en MAYÚSCULA)
    const apellido = autor.split(' ').pop();
    const autorCode = apellido.substring(0, 3).toUpperCase();
    
    // Primera letra del título en minúscula
    const tituloCode = titulo.charAt(0).toLowerCase();
    
    // Construir el código Dewey con modificadores
    let deweyCode = dewey;
    
    // Agregar R para obras de referencia
    if (esReferencia) {
        deweyCode = `R\n${deweyCode}`;
    }
    
    // Agregar inicial del país para literatura latinoamericana (860)
    if (dewey.startsWith('860') && pais) {
        deweyCode = `${pais.charAt(0).toUpperCase()}\n${deweyCode}`;
    }

    // Agregar descriptor para materiales no impresos
    if (tipoMaterial !== 'libro') {
        deweyCode = `[${tipoMaterial.toUpperCase()}]\n${deweyCode}`;
    }

    // Generar HTML para todos los marbetes
    let marbetesHTML = '';
    for (let i = 1; i <= totalEjemplares; i++) {
        marbetesHTML += `
            <div class="marbete-item mb-3">
                <div class="dewey-code">${deweyCode}</div>
                <div class="autor-titulo">${autorCode}${tituloCode}</div>
                <div class="anio">${anio || ''}</div>
                <div class="volumen-copia">
                    ${volumen ? `v.${volumen} ` : ''}
                    c.${i}
                </div>
            </div>
        `;
    }
    
    // Actualizar el contenido del modal
    document.getElementById('marbete-contenido').innerHTML = marbetesHTML;

    // Mostrar el modal
    const marbeteModal = new bootstrap.Modal(document.getElementById('marbeteModal'));
    marbeteModal.show();
}

// Función para imprimir el marbete
function imprimirMarbete() {
    const contenidoMarbete = document.getElementById('marbete-contenido');
    
    // Crear un nuevo documento para imprimir
    const ventanaImpresion = window.open('', '', 'width=600,height=600');
    ventanaImpresion.document.write('<html><head><title>Marbetes</title>');
    
    // Agregar estilos para la impresión
    ventanaImpresion.document.write(`
        <style>
            body {
                font-family: Arial, sans-serif;
                padding: 10mm;
                margin: 0;
            }
            .marbete-item {
                width: 50mm;
                height: 75mm;
                padding: 5mm;
                border: 1px solid #000;
                text-align: center;
                margin: 0 auto 10mm auto;
                display: flex;
                flex-direction: column;
                justify-content: center;
                page-break-inside: avoid;
            }
            .marbete-item:last-child {
                margin-bottom: 0;
            }
            .dewey-code {
                font-size: 16pt;
                font-weight: bold;
                margin-bottom: 5mm;
                white-space: pre-line;
            }
            .autor-titulo {
                font-size: 14pt;
                font-weight: bold;
                margin-bottom: 3mm;
            }
            .anio {
                font-size: 12pt;
                margin-bottom: 2mm;
            }
            .volumen-copia {
                font-size: 12pt;
            }
            @media print {
                body {
                    padding: 0;
                }
                .marbete-item {
                    border: none;
                    margin: 0 auto;
                    height: 100vh;
                }
                @page {
                    margin: 0;
                    size: 50mm 75mm;
                }
            }
        </style>
    `);
    
    // Agregar el contenido de los marbetes
    ventanaImpresion.document.write('</head><body>');
    ventanaImpresion.document.write(contenidoMarbete.innerHTML);
    ventanaImpresion.document.write('</body></html>');
    
    // Cerrar el documento y mostrar el diálogo de impresión
    ventanaImpresion.document.close();
    ventanaImpresion.focus();
    
    // Esperar a que el contenido se cargue antes de imprimir
    setTimeout(() => {
        ventanaImpresion.print();
        ventanaImpresion.close();
    }, 250);
}

// Asegurarse de que las funciones estén disponibles globalmente
window.mostrarMarbete = mostrarMarbete;
window.imprimirMarbete = imprimirMarbete; 