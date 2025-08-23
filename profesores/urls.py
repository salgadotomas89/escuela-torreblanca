from . import views
from django.urls import path

urlpatterns = [
    path('', views.profesores , name='profesores'),
    path('crear_profesor/', views.crear_profesor , name='crear_profesor'),
    path('perfil_profesor/<int:id>/', views.perfil_profesor , name='perfil_profesor'),
    path('eliminar_profesor/<int:id>/', views.eliminar_profesor, name='eliminar_profesor'),
]
