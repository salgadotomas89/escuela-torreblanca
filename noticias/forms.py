from django import forms
from noticias.models import Noticia


class FormNoticia(forms.ModelForm):
    class Meta:
        model = Noticia
        fields = ["titulo", "subtitulo", "texto", "redactor", "galeria", "audio"]


