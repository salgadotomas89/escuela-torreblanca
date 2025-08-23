from django import forms
from .models import Actividad, Imagen

class ActividadForm(forms.ModelForm):
    class Meta:
        model = Actividad
        fields = ['titulo']

class ImagenForm(forms.ModelForm):
    class Meta:
        model = Imagen
        fields = ['imagen']

ImagenFormSet = forms.inlineformset_factory(Actividad, Imagen, form=ImagenForm, extra=3)
