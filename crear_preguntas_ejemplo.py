#!/usr/bin/env python
import os
import django

# Configurar Django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'miproyecto.settings')
django.setup()

from colegio.models import PreguntaFrecuente

# Crear preguntas frecuentes de ejemplo
preguntas_ejemplo = [
    {
        'pregunta': '¿Cuáles son los horarios de clases?',
        'respuesta': 'Las clases se desarrollan de lunes a viernes de 8:00 AM a 3:30 PM. Los horarios específicos pueden variar según el nivel educativo y se encuentran disponibles en el calendario académico.',
        'orden': 1
    },
    {
        'pregunta': '¿Cómo puedo contactar a los profesores?',
        'respuesta': 'Puede contactar a los profesores a través de sus correos electrónicos institucionales que se encuentran en la sección de profesores, o durante los horarios de atención establecidos en la coordinación académica.',
        'orden': 2
    },
    {
        'pregunta': '¿Dónde puedo ver las calificaciones de mi hijo/a?',
        'respuesta': 'Las calificaciones están disponibles en la sección de "Notas" de nuestro sistema. Los padres y apoderados pueden acceder con sus credenciales proporcionadas por la institución.',
        'orden': 3
    },
    {
        'pregunta': '¿Cuándo son las reuniones de apoderados?',
        'respuesta': 'Las reuniones de apoderados se programan mensualmente y las fechas específicas se comunican a través de los comunicados oficiales. También puede consultar el calendario de eventos para conocer las próximas reuniones.',
        'orden': 4
    },
    {
        'pregunta': '¿Cómo puedo solicitar certificados y documentos?',
        'respuesta': 'Los certificados y documentos oficiales se pueden solicitar en la secretaría del establecimiento durante el horario de atención de 8:00 AM a 4:00 PM, presentando la documentación requerida y cancelando los aranceles correspondientes.',
        'orden': 5
    },
    {
        'pregunta': '¿Qué hacer en caso de ausencia por enfermedad?',
        'respuesta': 'En caso de ausencia por enfermedad, debe notificar al establecimiento el mismo día y presentar el certificado médico correspondiente al reintegrarse a clases. Esto permite justificar la inasistencia y coordinar la recuperación de contenidos.',
        'orden': 6
    }
]

# Crear las preguntas si no existen
for pregunta_data in preguntas_ejemplo:
    pregunta, created = PreguntaFrecuente.objects.get_or_create(
        pregunta=pregunta_data['pregunta'],
        defaults={
            'respuesta': pregunta_data['respuesta'],
            'orden': pregunta_data['orden'],
            'activa': True
        }
    )
    if created:
        print(f"Creada pregunta: {pregunta.pregunta}")
    else:
        print(f"Pregunta ya existe: {pregunta.pregunta}")

print("¡Preguntas frecuentes de ejemplo creadas exitosamente!")
