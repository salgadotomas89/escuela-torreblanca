import logging
import os
from django.conf import settings
from django.http import JsonResponse
from django.shortcuts import render, get_object_or_404
from django.template.loader import render_to_string
from django.db.models import Count, Min
from .models import ArchivosComunicado, Comunicado, Comunicados
from django.core.files.storage import FileSystemStorage
from django.views.decorators.csrf import csrf_exempt
import json
from django.views.decorators.http import require_http_methods
from openai import OpenAI
from django.contrib.auth.decorators import login_required
from colegio.models import Colegio
from django.core.exceptions import ObjectDoesNotExist
from colegio.models import AppearanceSettings


@login_required
@csrf_exempt
@require_http_methods(["POST"])
def guardar_comunicado(request):
        # Generar el título automáticamente
        num_comunicados = Comunicado.objects.count() + 1
        titulo = f'Comunicado nº {num_comunicados}'

        # obtener datos del formulario
        texto = request.POST.get('texto')
        autor = request.POST.get('autor')
        archivo = request.FILES.get('archivo')

        # crear y guardar el comunicado
        comunicado = Comunicado(titulo=titulo, texto=texto, autor=autor)
        comunicado.save()
        
        # manejar el archivo adjunto si existe
        if archivo:
            # Crear la carpeta 'comunicados' si no existe
            upload_dir = os.path.join(settings.MEDIA_ROOT, 'comunicados')
            os.makedirs(upload_dir, exist_ok=True)
            
            # Configurar FileSystemStorage para usar la carpeta 'comunicados'
            fs = FileSystemStorage(location=upload_dir, base_url='/comunicados/')
            print('ruta')
            print(fs.url(archivo.name))
            # Guardar el archivo
            filename = fs.save(archivo.name, archivo)
            file_url = fs.url(filename)
            print('file_url')
            comunicado.save()
            # guardar el archivo en la base de datos
            ArchivosComunicado.objects.create(comunicado=comunicado, archivo=file_url)
        else:
            print("archivo no existe")
            print("comunicado guardado")
            
        return JsonResponse({'success': True})
    

def comunicados(request):
    comunicados = Comunicado.objects.all().order_by('-fecha')
    for comunicado in comunicados:
        comunicado.fecha_formateada = comunicado.fecha.strftime('%Y-%m-%d %H:%M:%S')
    
    autores_unicos = Comunicado.objects.values_list('autor', flat=True).distinct()
    appearance_settings = AppearanceSettings.objects.first()
    
    # Si no existe configuración, crearla con valores por defecto
    if not appearance_settings:
        appearance_settings = AppearanceSettings.objects.create()
    
    context = {
        'comunicados': comunicados,
        'autores_unicos': autores_unicos,
        'appearance_settings': appearance_settings,
    }
    return render(request, 'comunicados.html', context)

def load_more_comunicados(request):
    offset = int(request.GET.get('offset', 0))
    comunicados = Comunicado.objects.all().order_by('-fecha')[offset:offset+11]
    
    return render_comunicados_list(comunicados[:10], comunicados.count() > 10)

def render_comunicados_list(comunicados, has_more):
    context = {
        'comunicados': comunicados,
    }
    html = render_to_string('comunicados_list.html', context)
    return JsonResponse({
        'html': html,
        'has_more': has_more
    })

def autores_frecuentes(request):
    autores = (Comunicado.objects
               .values('autor')
               .annotate(count=Count('autor'))
               .order_by('-count')[:10])
    autores_list = [autor['autor'] for autor in autores]
    return JsonResponse({'autores': autores_list})

@login_required
@csrf_exempt
@require_http_methods(["POST"])
def mejorar_texto(request):
    try:
        data = json.loads(request.body)
        texto_original = data.get('texto', '')

        # Verificar suscripción antes de usar OpenAI
        from colegio.models import ColegioSubscription
        subscription = ColegioSubscription.get_instance()
        subscription.reset_monthly_usage()
        
        if not subscription.can_use_openai('comunicados'):
            return JsonResponse({
                'success': False,
                'error': 'Funcionalidad de IA no disponible - Suscripción requerida'
            })

        # Inicializar el cliente de OpenAI
        client = OpenAI(api_key=settings.OPENAI_API_KEY)

        # Llamada a la API de ChatGPT
        response = client.chat.completions.create(
            model="gpt-3.5-turbo",
            messages=[
                {"role": "system", "content": "Eres un escritor y psicólogo experto en redactar comunicados para apoderados de escuelas. Tu tarea es mejorar el texto proporcionado, haciéndolo más claro, empático y profesional."},
                {"role": "user", "content": f"Mejora el siguiente texto para un comunicado escolar: {texto_original} del colegio {Colegio.nombre}"}
            ]
        )

        texto_mejorado = response.choices[0].message.content.strip()

        # Incrementar uso si la llamada fue exitosa
        subscription.increment_usage()

        return JsonResponse({'success': True, 'texto_mejorado': texto_mejorado})
    except Exception as e:
        return JsonResponse({'success': False, 'error': str(e)})
    

@login_required
@csrf_exempt
@require_http_methods(["POST"])
def crear_texto(request):
    try:
        data = json.loads(request.body)
        texto_original = data.get('texto', '')

        # Verificar suscripción antes de usar OpenAI
        from colegio.models import ColegioSubscription
        subscription = ColegioSubscription.get_instance()
        subscription.reset_monthly_usage()
        
        if not subscription.can_use_openai('comunicados'):
            return JsonResponse({
                'success': False,
                'error': 'Funcionalidad de IA no disponible - Suscripción requerida'
            })

        # Inicializar el cliente de OpenAI
        client = OpenAI(api_key=settings.OPENAI_API_KEY)

        # Llamada a la API de ChatGPT
        response = client.chat.completions.create(
            model="gpt-3.5-turbo",
            messages=[
                {"role": "system", "content": "Eres un escritor y psicólogo experto en redactar comunicados para apoderados de escuelas. Tu tarea es usar la informacion proporcionada y crear un texto, haciéndolo más claro, empático y profesional."},
                {"role": "user", "content": f"Usa la informacion y crea un comunicado escolar: {texto_original} del colegio {Colegio.nombre}"}
            ]
        )

        texto_mejorado = response.choices[0].message.content.strip()

        # Incrementar uso si la llamada fue exitosa
        subscription.increment_usage()

        return JsonResponse({'success': True, 'texto_mejorado': texto_mejorado})
    except Exception as e:
        return JsonResponse({'success': False, 'error': str(e)})

@login_required
@csrf_exempt
@require_http_methods(["POST"])
def eliminar_comunicado(request, comunicado_id):
    try:
        comunicado = get_object_or_404(Comunicado, id=comunicado_id)
        comunicado.delete()
        return JsonResponse({'success': True})
    except Exception as e:
        return JsonResponse({'success': False, 'error': str(e)})

@login_required
def enviar_comunicado(request, comunicado_id):
    # ... código existente ...
    return JsonResponse({'success': True})



def comunicados2(request):
    return render(request, 'comunicados2.html')

@login_required
def eliminar_antiguos(request):
    if request.method == 'POST' and request.user.is_authenticated:
        try:
            data = json.loads(request.body)
            cantidad = int(data.get('cantidad', 1))
            
            # Obtener los IDs de los N comunicados más antiguos
            ids_a_eliminar = list(Comunicado.objects.order_by('fecha').values_list('id', flat=True)[:cantidad])
            
            # Eliminar los comunicados usando los IDs
            Comunicado.objects.filter(id__in=ids_a_eliminar).delete()
            
            return JsonResponse({
                'success': True,
                'message': f'Se eliminaron {len(ids_a_eliminar)} comunicados antiguos',
                'eliminados': ids_a_eliminar
            })
        except Exception as e:
            return JsonResponse({
                'success': False,
                'error': str(e)
            }, status=500)
    
    return JsonResponse({
        'success': False,
        'error': 'Método no permitido o usuario no autenticado'
    }, status=403)

@login_required
@csrf_exempt
def guardar_color_comunicados(request):
    if request.method == 'POST':
        try:
            data = json.loads(request.body)
            color = data.get('color')
            
            # Obtener o crear la configuración
            settings, created = AppearanceSettings.objects.get_or_create(pk=1)
            
            # Actualizar solo el color
            settings.comunicados_card_background = color
            settings.save()
            
            return JsonResponse({
                'success': True,
                'message': 'Color actualizado correctamente'
            })
        except Exception as e:
            return JsonResponse({
                'success': False,
                'error': str(e)
            }, status=500)
    
    return JsonResponse({
        'success': False,
        'error': 'Método no permitido'
    }, status=403)

