from django.shortcuts import render, redirect, get_object_or_404
from django.http import JsonResponse
from .models import Actividad, Imagen
from .forms import ActividadForm
from django.views.decorators.http import require_http_methods
from noticias.models import Noticia, Images

from django.shortcuts import render, redirect, get_object_or_404
from django.http import JsonResponse
from .models import Actividad, Imagen
from .forms import ActividadForm
from django.views.decorators.http import require_http_methods
from noticias.models import Noticia, Images
from django.core.files.uploadedfile import UploadedFile
from PIL import Image as PILImage
from django.core.files.base import ContentFile
import io
import os

def convertir_a_webp(imagen_file):
    """Convierte una imagen a formato WebP manteniendo calidad"""
    try:
        # Abrir imagen con Pillow
        imagen = PILImage.open(imagen_file)
        
        # Convertir RGBA a RGB si es necesario (WebP lossy no soporta RGBA)
        if imagen.mode in ('RGBA', 'LA', 'P'):
            # Crear fondo blanco para transparencias
            fondo = PILImage.new('RGB', imagen.size, (255, 255, 255))
            if imagen.mode == 'P':
                imagen = imagen.convert('RGBA')
            fondo.paste(imagen, mask=imagen.split()[-1] if imagen.mode in ('RGBA', 'LA') else None)
            imagen = fondo
        elif imagen.mode not in ('RGB', 'L'):
            imagen = imagen.convert('RGB')
        
        # Crear buffer para la imagen WebP
        output = io.BytesIO()
        
        # Guardar como WebP con alta calidad
        imagen.save(output, format='WEBP', quality=85, optimize=True)
        output.seek(0)
        
        # Crear nombre de archivo con extensión .webp
        nombre_original = imagen_file.name
        nombre_base = os.path.splitext(nombre_original)[0]
        nombre_webp = f"{nombre_base}.webp"
        
        # Crear ContentFile para Django
        return ContentFile(output.read(), name=nombre_webp)
        
    except Exception as e:
        # Si falla la conversión, usar la imagen original
        print(f"Error convirtiendo a WebP: {e}")
        return imagen_file

@require_http_methods(["GET", "POST"])
def subir_actividad(request):
    if request.method == 'POST':
        form = ActividadForm(request.POST)
        if form.is_valid():
            # Validar archivos
            imagenes = request.FILES.getlist('imagenes')
            max_size = 5 * 1024 * 1024  # 5MB
            allowed_types = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/heic', 'image/heif', 'image/webp']
            
            for imagen in imagenes:
                if imagen.content_type not in allowed_types:
                    return JsonResponse({'success': False, 'error': f'Tipo de archivo no permitido: {imagen.name}'})
                if imagen.size > max_size:
                    return JsonResponse({'success': False, 'error': f'Archivo muy grande (máx 5MB): {imagen.name}'})
            
            actividad = form.save()
            imagenes_data = []
            for imagen in imagenes:
                # Convertir a WebP
                webp_imagen = convertir_a_webp(imagen)
                img_obj = Imagen.objects.create(actividad=actividad, imagen=webp_imagen)
                imagenes_data.append({'url': img_obj.imagen.url})
            
            return JsonResponse({
                'success': True,
                'actividad': {
                    'id': actividad.id,
                    'titulo': actividad.titulo,
                    'fecha': actividad.fecha_subida.strftime('%B %d, %Y %H:%M'),
                    'imagenes': imagenes_data
                }
            })
        else:
            return JsonResponse({'success': False, 'error': 'Formulario inválido: ' + str(form.errors)})
    return JsonResponse({'success': False, 'error': 'Método no permitido'})

def lista_actividades(request):
    actividades = Actividad.objects.all().order_by('-fecha_subida')
    noticias = Noticia.objects.filter(galeria=True).order_by('-date')
    form = ActividadForm()

    elementos = []
    for actividad in actividades:
        elementos.append({
            'tipo': 'actividad',
            'id': f"actividad_{actividad.id}",
            'titulo': actividad.titulo,
            'fecha': actividad.fecha_subida,
            'imagenes': list(actividad.imagenes.all()),
            'obj': actividad,
        })
    for noticia in noticias:
        imagenes = list(Images.objects.filter(noticia=noticia))
        if imagenes:
            elementos.append({
                'tipo': 'noticia',
                'id': f"noticia_{noticia.id}",
                'titulo': noticia.titulo,
                'fecha': noticia.date,
                'imagenes': imagenes,
                'obj': noticia,
            })
    # Ordenar por fecha descendente
    elementos.sort(key=lambda x: x['fecha'], reverse=True)

    return render(request, 'galeria.html', {
        'elementos': elementos,
        'form': form,
    })

@require_http_methods(["POST"])
def eliminar_actividad(request, actividad_id):
    try:
        actividad = get_object_or_404(Actividad, id=actividad_id)
        actividad.delete()
        return JsonResponse({'success': True})
    except Exception as e:
        return JsonResponse({'success': False, 'error': str(e)})
