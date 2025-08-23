from django import forms

from comunicados.models import Comunicado


class FormComunicado(forms.ModelForm):
    class Meta:
        model = Comunicado
        fields = ["titulo", "texto", "autor"]

class ArchivosFormComunicado(FormComunicado): #extending form
    archivos = forms.FileField(widget=forms.ClearableFileInput(attrs={'multiple': True}))

    class Meta(FormComunicado.Meta):
        fields = FormComunicado.Meta.fields + ['archivos',]