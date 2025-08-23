from colegio.models import AppearanceSettings, Colegio, HeroSettings

def datos_globales(request):
    colegio = Colegio.objects.first()  # Obtener el único objeto del modelo Colegio

    secciones = ['Misión', 'Visión', 'Directiva', 'Reglamentos', 'Proyecto educativo', 'Valores']

    apariencia = AppearanceSettings.objects.first()
    if not apariencia:
        apariencia = AppearanceSettings.objects.create()

    # Obtener configuración del hero
    hero = HeroSettings.get_or_create_default()

    # Split the 'secciones' list into two parts
    secciones_part1 = secciones[:3]
    secciones_part2 = secciones[3:]
       
    return { 
        'colegio': colegio, 
        'secciones': secciones,
        'secciones_part1': secciones_part1,
        'secciones_part2': secciones_part2,
        'apariencia': apariencia,
        'hero': hero,
    }