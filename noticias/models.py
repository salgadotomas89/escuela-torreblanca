from django.db import models
from django.utils import timezone
import os

# Create your models here.
class Noticia(models.Model):
    titulo = models.CharField(max_length=200)
    subtitulo = models.CharField(max_length=200)
    texto = models.TextField(blank=True, null=True)
    #fecha en la que es guardada la noticia
    date = models.DateTimeField(default=timezone.now)
    redactor = models.CharField(max_length=200, default='Tomás Salgado')
    #False = foto/s no este en la galeria, True = foto/s aparezca en la galeria
    galeria = models.BooleanField(default=False, blank=True, null=True)
    tema = models.CharField(max_length=100, null=True, blank=True)
    audio = models.FileField(upload_to='noticias/audios', blank=True, null=True)
    likes = models.PositiveIntegerField(default=0)
    
    def delete(self, *args, **kwargs):
        """Override delete method to also delete audio file"""
        if self.audio and os.path.exists(self.audio.path):
            try:
                os.remove(self.audio.path)
            except Exception as e:
                print(f"Error al eliminar audio {self.audio.path}: {str(e)}")
        super().delete(*args, **kwargs)


#modelo que contiene foto relacionada a una noticia 
class Images(models.Model):
    #clave foranea de una Noticia
    noticia = models.ForeignKey(Noticia,on_delete=models.CASCADE)
    #imagen que guardamos en la carpeta noticias
    image = models.FileField(upload_to='fotos',null=True,blank=True)
    
    def delete(self, *args, **kwargs):
        """Override delete method to also delete image file"""
        if self.image and os.path.exists(self.image.path):
            try:
                os.remove(self.image.path)
            except Exception as e:
                print(f"Error al eliminar imagen {self.image.path}: {str(e)}")
        super().delete(*args, **kwargs)