from . import views
from django.urls import path

urlpatterns = [
    path('', views.contacto, name='contacto'),
    path('terminos-condiciones/', views.terminos_condiciones, name='terminos_condiciones'),
]
