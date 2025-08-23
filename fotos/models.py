from django.db import models
from django.utils import timezone

# Create your models here.

class Actividad(models.Model):
    titulo = models.CharField(max_length=200)
    fecha_subida = models.DateTimeField(default=timezone.now)

    def __str__(self):
        return self.titulo

class Imagen(models.Model):
    actividad = models.ForeignKey(Actividad, related_name='imagenes', on_delete=models.CASCADE)
    imagen = models.ImageField(upload_to='fotos/')
    
    def __str__(self):
        return f"Imagen de {self.actividad.titulo}"
