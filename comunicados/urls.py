from django.urls import path
from . import views

urlpatterns = [
    path('', views.comunicados, name='comunicados'),
    path('load-more/', views.load_more_comunicados, name='load_more_comunicados'),
    path('guardar-comunicado/', views.guardar_comunicado, name='guardar_comunicado'),
    path('autores-frecuentes/', views.autores_frecuentes, name='autores_frecuentes'),
    # Otras URLs existentes...
    path('crear-texto/', views.crear_texto, name='crear_texto'),
    path('eliminar/<int:comunicado_id>/', views.eliminar_comunicado, name='eliminar_comunicado'),
    path('comunicados2/', views.comunicados2, name='comunicados2'),
    path('eliminar-antiguos/', views.eliminar_antiguos, name='eliminar_antiguos'),
    path('guardar-color/', views.guardar_color_comunicados, name='guardar_color_comunicados'),
]
