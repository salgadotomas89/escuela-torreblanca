from django.urls import include, path
from . import views
# Importa la vista creada anteriormente
from colegio.views import not_found
from rest_framework.routers import DefaultRouter
from .views import EventoViewSet,ColegioViewSet

router = DefaultRouter()
router.register(r'eventos', EventoViewSet )
router.register(r'colegio', ColegioViewSet)


urlpatterns = [
    path('api/', include(router.urls)),

    path('', views.inicio, name='inicio'),

    path('registro/', views.registro, name='registro'),
    path('registro/profesor', views.registro_profesor, name='registro_profesor'),

 
    
    path('directiva', views.directiva, name="directiva"),
  
    path('guardar-evento/', views.guardar_evento, name='guardar_evento'),


    path('calendario', views.calendario, name="calendario"),
    


    # Agregar esta URL
    path('registro/usuario/', views.registro_usuario, name='registro_usuario'),

    path('seccion/comunicados/color/', views.guardar_color_comunicados, name='guardar_color_comunicados'),
    path('seccion/profesores/color/', views.guardar_color_profesores, name='guardar_color_profesores'),
   

    # URLs para los templates del megamenú
    path('vision/', views.vision, name='vision'),
    path('mision/', views.mision, name='mision'), 
    path('valores/', views.valores, name='valores'),
    path('proyecto-educativo/', views.proyecto_educativo, name='proyecto_educativo'),
    path('reglamentos/', views.reglamentos, name='reglamentos'),
    path('directiva-megamenu/', views.directiva_megamenu, name='directiva_megamenu'),

    path('admision', views.admision, name='admision'),

]

handler404 = not_found
