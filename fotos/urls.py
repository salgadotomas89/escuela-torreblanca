from django.urls import path
from . import views

urlpatterns = [
    path('', views.lista_actividades, name='lista_actividades'),
    path('subir/', views.subir_actividad, name='subir_actividad'),
    path('eliminar/<int:actividad_id>/', views.eliminar_actividad, name='eliminar_actividad'),
]
