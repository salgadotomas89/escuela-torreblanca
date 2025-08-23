from django.core.cache import cache
from django.db.models import Q, Max
from django.http import HttpResponse, JsonResponse
from django.shortcuts import redirect, render
from django.contrib.auth.decorators import login_required
from datetime import datetime
from django.template.loader import render_to_string
from django.db.models import Q
from colegio.models import AppearanceSettings, Asignatura, Colegio, Curso, CursoAsignatura, Evento, HeroSettings, HeroImage, Menu, MenuItem, PreguntaFrecuente, UserProfile, ColegioSubscription, Profesor, Administrativo, Asistente, Alumno, Apoderado
from comunicados.models import Comunicado, Comunicados
from noticias.models import Images, Noticia
from .forms import AppearanceSettingsForm, CustomUserForm, FormEvento, HeroSettingsForm, MenuForm, MenuItemForm
from django.contrib.auth.models import User
from django.shortcuts import get_object_or_404
from django.contrib import messages
from django.views.decorators.http import require_POST
from django.views.decorators.csrf import csrf_exempt
from django.contrib.auth import update_session_auth_hash
from django.core.files.storage import default_storage
import os
from .forms import MenuItemForm, MenuForm  # Agrega esto a tus imports si no lo tienes
from django.db.models import Max  # Agregar al inicio del archivo
from django.conf import settings
from django.contrib.auth import logout, login, authenticate


def not_found(request, exception):
    error_message = "Lo sentimos, la página que estás buscando no se encuentra disponible."
    return render(request, '404.html', {'error_message': error_message}, status=404)

#datos de acceso a admin salgadotomas, miercoles

from django.core import serializers


#funcion para registrar un profesor
def registro_profesor(request):
    if request.method == 'POST':
        form = CustomUserForm(request.POST)
        if form.is_valid():
            # Guardar los datos del formulario
            form.save()
            # Puedes devolver una respuesta JSON con un mensaje de éxito
            return JsonResponse({"message": "Profesor guardado con éxito"})
        else:
            # Si el formulario no es válido, devuelve un error
            return JsonResponse({"error": form.errors}, status=400)
    return JsonResponse({"error": "Solicitud no válida"}, status=400)


def nuevo_formato(fecha):
    print('hola')


def calendario(request):
    cursos = Curso.objects.all()
    print(cursos)
    context = {
        "cursos": cursos,
    }
    return render(request, 'calendario_evaluaciones_2.html', context)


from rest_framework import viewsets
from .models import Administrativo, Alumno, Apoderado, Asistente, Evento, Profesor, UserRole
from .serializers import EventoSerializer

class EventoViewSet(viewsets.ModelViewSet):
    queryset = Evento.objects.all()
    serializer_class = EventoSerializer



def directiva(request):
    context = {'lista': ['directiva','misión', 'visión', 'direccion', 'reglamentos']
}
    return render(request, 'directiva.html', context)

#devuelve la vista para ver a todos los profesores del colegio
def profesores(request):
    return render(request, 'profesores.html')

def inicio(request):
    # Cache key único para el home
    cache_key = 'home_data_v1'
    cached_data = cache.get(cache_key)
    
    if cached_data is None:
        # Se extraen los 3 eventos con fecha más cercana
        eventos = list(Evento.objects.all().order_by('-fecha')[:3])

        # Traigo a 3 profesores desde la base de datos con select_related
        profesores = list(UserProfile.objects.select_related('user').filter(role='profesor')[:3])

        # Limitar noticias a las 6 más recientes y optimizar con prefetch_related para las imágenes
        noticias = list(Noticia.objects.prefetch_related('images_set').order_by('-date')[:6])

        try:
            seccion_comunicado = Comunicados.objects.get()
        except Comunicados.DoesNotExist:
            seccion_comunicado = None

        # Obtener preguntas frecuentes activas
        preguntas_frecuentes = list(PreguntaFrecuente.objects.filter(activa=True).order_by('orden', 'fecha_creacion')[:6])

        # Obtener configuraciones de apariencia para el número de WhatsApp
        try:
            appearance_settings = AppearanceSettings.objects.first()
        except AppearanceSettings.DoesNotExist:
            appearance_settings = None

        # Obtener configuración del hero con prefetch_related para imágenes adicionales
        hero = HeroSettings.objects.prefetch_related('hero_images').first()
        if not hero:
            hero = HeroSettings.objects.create()

        # Guardar en cache por 15 minutos
        cached_data = {
            'eventos': eventos,
            'profesores': profesores,
            'noticias': noticias,
            'seccion_comunicado': seccion_comunicado,
            'preguntas_frecuentes': preguntas_frecuentes,
            'appearance_settings': appearance_settings,
            'hero': hero,
        }
        cache.set(cache_key, cached_data, 900)  # 15 minutos
    
    form = CustomUserForm()  # No cachear el form por seguridad CSRF

    context = {
        'comunicado': cached_data['seccion_comunicado'],
        'noticias': cached_data['noticias'],
        'eventos': cached_data['eventos'],
        'form_usuario': form,
        'profesores': cached_data['profesores'],
        'preguntas_frecuentes': cached_data['preguntas_frecuentes'],
        'appearance_settings': cached_data['appearance_settings'],
        'hero': cached_data['hero'],
    }
    
    return render(request, 'inicio/home.html', context)


def registro(request):
    if request.method == 'POST':
        form = CustomUserForm(request.POST)
        if form.is_valid():
            user = form.save()
            role = form.cleaned_data.get('role')
            UserProfile.objects.create(user=user, role=role)
            login(request, user)
            return redirect('inicio')  # Redirige a la pgina de inicio después del registro
    else:
        form = CustomUserForm()
    return render(request, 'registration/form.html', {'form': form})


def guardar_evento(request):
    if request.method == 'POST':
        # Acceder a los datos del comunicado enviados en la solicitud
        evento = FormEvento(request.POST)
        if evento.is_valid():
            evento.save()
            print('evento creado')
            
            # Invalidar cache del home cuando se crea un evento
            cache.delete('home_data_v1')
            
        return JsonResponse({'success': True})
    else:
        return JsonResponse({'success': False, 'error': 'Método de solicitud no válido'})


@csrf_exempt
def registro_usuario(request):
    if request.method == 'POST':
        # Asegurarnos que el rol sea válido
        role = request.POST.get('role')
        valid_roles = dict(UserProfile.ROLES).keys()
        if role not in valid_roles:
            return JsonResponse({
                "success": False,
                "error": {
                    "role": ["Rol no válido. Opciones válidas: " + ", ".join(valid_roles)]
                }
            })

        form = CustomUserForm(request.POST)
        if form.is_valid():
            try:
                user = form.save()
                
                # Crear el UserProfile con el rol
                user_profile = UserProfile.objects.create(user=user, role=role)
                
                # Debug: Verificar si hay archivos en la request
                print(f"FILES en request: {request.FILES}")
                print(f"Foto en FILES: {'foto' in request.FILES}")
                
                # Procesar la foto si se subió una
                if 'foto' in request.FILES:
                    foto = request.FILES['foto']
                    print(f"Archivo recibido: {foto.name}, Tipo: {foto.content_type}, Tamaño: {foto.size}")
                    
                    # Validar el archivo
                    allowed_types = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif']
                    if foto.content_type in allowed_types and foto.size <= 5 * 1024 * 1024:  # 5MB máximo
                        user_profile.foto = foto
                        user_profile.save()
                        print(f"Foto guardada correctamente: {user_profile.foto.url}")
                    else:
                        print(f"Archivo no válido - Tipo: {foto.content_type}, Tamaño: {foto.size}")
                else:
                    print("No se encontró archivo de foto en la request")
                
                return JsonResponse({
                    "success": True, 
                    "message": "Usuario creado correctamente",
                    "foto_guardada": bool('foto' in request.FILES and user_profile.foto)
                })
            except Exception as e:
                # Si algo falla, eliminar el usuario creado
                if 'user' in locals():
                    user.delete()
                print(f"Error al crear usuario: {str(e)}")
                return JsonResponse({
                    "success": False,
                    "error": {"general": [str(e)]}
                })
        else:
            return JsonResponse({
                "success": False,
                "error": form.errors
            })
    return JsonResponse({"success": False, "error": {"general": ["Método no permitido"]}})


def guardar_color_comunicados(request):
    if request.method == 'POST':
        try:
            color = request.POST.get('color')
            # Obtener o crear la configuración de apariencia
            appearance_settings = AppearanceSettings.objects.first()
            if not appearance_settings:
                appearance_settings = AppearanceSettings()
            
            # Guardar el color en el campo comunicados_background
            appearance_settings.comunicados_background = color
            appearance_settings.save()
            
            return JsonResponse({
                'success': True,
                'color': color
            })
        except Exception as e:
            return JsonResponse({
                'success': False,
                'error': str(e)
            }, status=400)
    
    return JsonResponse({
        'success': False,
        'error': 'Método no permitido'
    }, status=405)

def guardar_color_profesores(request):
    if request.method == 'POST':
        try:
            color = request.POST.get('color')
            appearance_settings = AppearanceSettings.objects.first()
            if not appearance_settings:
                appearance_settings = AppearanceSettings()
            
            appearance_settings.profesores_background = color
            appearance_settings.save()
            
            return JsonResponse({
                'success': True,
                'color': color
            })
        except Exception as e:
            return JsonResponse({
                'success': False,
                'error': str(e)
            }, status=400)
    
    return JsonResponse({
        'success': False,
        'error': 'Método no permitido'
    }, status=405)


def contacto(request):
    return render(request, 'contacto.html')







# Vistas para los templates del megamenú
def vision(request):
    """Vista para mostrar la página de visión del colegio"""
    colegio = Colegio.objects.first()
    context = {
        'colegio': colegio,
    }
    return render(request, 'megamenu/vision.html', context)

def mision(request):
    """Vista para mostrar la página de misión del colegio"""
    colegio = Colegio.objects.first()
    context = {
        'colegio': colegio,
    }
    return render(request, 'megamenu/mision.html', context)

def valores(request):
    """Vista para mostrar la página de valores del colegio"""
    colegio = Colegio.objects.first()
    context = {
        'colegio': colegio,
    }
    return render(request, 'megamenu/valores.html', context)

def proyecto_educativo(request):
    """Vista para mostrar la página del proyecto educativo del colegio"""
    colegio = Colegio.objects.first()
    context = {
        'colegio': colegio,
    }
    return render(request, 'megamenu/proyecto_educativo.html', context)

def reglamentos(request):
    """Vista para mostrar la página de reglamentos del colegio"""
    colegio = Colegio.objects.first()
    context = {
        'colegio': colegio,
    }
    return render(request, 'megamenu/reglamentos.html', context)

def directiva_megamenu(request):
    """Vista para mostrar la página de directiva del colegio desde el megamenú"""
    colegio = Colegio.objects.first()
    context = {
        'colegio': colegio,
    }
    return render(request, 'megamenu/directiva.html', context)


def admision(request):
    return render(request, 'admision.html')
    
    

from rest_framework import viewsets, permissions, status
from rest_framework.response import Response
from rest_framework.decorators import action
from django.db.models import Q
from django.utils import timezone
from .serializers import EventoSerializer, EventoCreateUpdateSerializer

from rest_framework import viewsets, permissions, status
from rest_framework.response import Response
from rest_framework.decorators import action
from django.db.models import Q
from django.utils import timezone
from .serializers import EventoSerializer, EventoCreateUpdateSerializer

class EventoViewSet(viewsets.ModelViewSet):
    queryset = Evento.objects.all().order_by('-fecha')
    
    def get_permissions(self):
        """
        Permitir acceso público para ver eventos (list, retrieve, proximos, estadisticas),
        pero requerir autenticación para crear, actualizar y eliminar eventos.
        """
        if self.action in ['list', 'retrieve', 'proximos', 'estadisticas']:
            # Acceso público para consultar eventos
            permission_classes = [permissions.AllowAny]
        else:
            # Autenticación requerida para crear, actualizar, eliminar
            permission_classes = [permissions.IsAuthenticated]
        
        return [permission() for permission in permission_classes]
    
    def get_serializer_class(self):
        """Usar diferentes serializers para diferentes acciones"""
        if self.action in ['create', 'update', 'partial_update']:
            return EventoCreateUpdateSerializer
        return EventoSerializer
    
    def get_queryset(self):
        """Filtrar eventos basado en parámetros de consulta"""
        queryset = Evento.objects.all().order_by('-fecha')
        
        # Filtrar por fecha desde
        fecha_desde = self.request.query_params.get('fecha_desde', None)
        if fecha_desde:
            queryset = queryset.filter(fecha__gte=fecha_desde)
            
        # Filtrar por fecha hasta
        fecha_hasta = self.request.query_params.get('fecha_hasta', None)
        if fecha_hasta:
            queryset = queryset.filter(fecha__lte=fecha_hasta)
            
        # Buscar por título o texto
        search = self.request.query_params.get('search', None)
        if search:
            queryset = queryset.filter(
                Q(titulo__icontains=search) | Q(texto__icontains=search)
            )
            
        return queryset
    
    def create(self, request, *args, **kwargs):
        """Crear nuevo evento con invalidación de caché"""
        response = super().create(request, *args, **kwargs)
        if response.status_code == status.HTTP_201_CREATED:
            # Invalidar cache del home cuando se crea un evento
            from django.core.cache import cache
            cache.delete('home_data_v1')
        return response
    
    def destroy(self, request, *args, **kwargs):
        """Eliminar evento con invalidación de caché"""
        response = super().destroy(request, *args, **kwargs)
        if response.status_code == status.HTTP_204_NO_CONTENT:
            # Invalidar cache del home cuando se elimina un evento
            from django.core.cache import cache
            cache.delete('home_data_v1')
        return response
    
    def update(self, request, *args, **kwargs):
        """Actualizar evento con invalidación de caché"""
        response = super().update(request, *args, **kwargs)
        if response.status_code == status.HTTP_200_OK:
            # Invalidar cache del home cuando se actualiza un evento
            from django.core.cache import cache
            cache.delete('home_data_v1')
        return response
    
    @action(detail=False, methods=['get'])
    def proximos(self, request):
        """Endpoint personalizado para obtener próximos eventos"""
        eventos_proximos = self.get_queryset().filter(
            fecha__gte=timezone.now()
        )[:5]
        serializer = self.get_serializer(eventos_proximos, many=True)
        return Response(serializer.data)
    
    @action(detail=False, methods=['get'])
    def estadisticas(self, request):
        """Endpoint para estadísticas de eventos"""
        total_eventos = self.get_queryset().count()
        eventos_proximos = self.get_queryset().filter(fecha__gte=timezone.now()).count()
        eventos_pasados = self.get_queryset().filter(fecha__lt=timezone.now()).count()
        
        return Response({
            'total': total_eventos,
            'proximos': eventos_proximos,
            'pasados': eventos_pasados
        })


# ...existing code...

from rest_framework.parsers import MultiPartParser, FormParser
from .serializers import ColegioSerializer, ColegioCreateUpdateSerializer

class ColegioViewSet(viewsets.ModelViewSet):
    queryset = Colegio.objects.all()
    parser_classes = (MultiPartParser, FormParser)
    permission_classes = [permissions.AllowAny]  # Cambiar a acceso público completo
    
    def get_serializer_class(self):
        """Usar diferentes serializers para diferentes acciones"""
        if self.action in ['create', 'update', 'partial_update']:
            return ColegioCreateUpdateSerializer
        return ColegioSerializer
    
    def get_serializer_context(self):
        """Agregar request al contexto para URLs completas"""
        context = super().get_serializer_context()
        context['request'] = self.request
        return context
    
    def perform_create(self, serializer):
        """Personalizar la creación"""
        serializer.save()
        # Invalidar cache si lo usas
        from django.core.cache import cache
        cache.delete('home_data_v1')
    
    def perform_update(self, serializer):
        """Personalizar la actualización"""
        # Si hay una nueva imagen, eliminar la anterior
        instance = self.get_object()
        if 'logo' in self.request.FILES and instance.logo:
            # Eliminar archivo anterior
            try:
                import os
                if os.path.exists(instance.logo.path):
                    os.remove(instance.logo.path)
            except Exception:
                pass
        
        serializer.save()
        # Invalidar cache si lo usas
        from django.core.cache import cache
        cache.delete('home_data_v1')
    
    def perform_destroy(self, instance):
        """Personalizar eliminación para limpiar archivos"""
        # Eliminar archivo del logo si existe
        if instance.logo:
            try:
                import os
                if os.path.exists(instance.logo.path):
                    os.remove(instance.logo.path)
            except Exception:
                pass
        super().perform_destroy(instance)
    
    @action(detail=False, methods=['get'])
    def info_basica(self, request):
        """Endpoint para obtener solo información básica del colegio"""
        colegio = self.get_queryset().first()
        if not colegio:
            return Response({'error': 'No hay información del colegio configurada'}, status=404)
        
        serializer = self.get_serializer(colegio)
        return Response(serializer.data)

# ...existing code...
