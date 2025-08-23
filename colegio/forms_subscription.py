from django import forms
from .models import ColegioSubscription

class ColegioSubscriptionForm(forms.ModelForm):
    class Meta:
        model = ColegioSubscription
        fields = ['openai_noticias_enabled', 'openai_comunicados_enabled', 'openai_biblioteca_enabled', 'monthly_limit']
        widgets = {
            'openai_noticias_enabled': forms.CheckboxInput(attrs={'class': 'form-check-input'}),
            'openai_comunicados_enabled': forms.CheckboxInput(attrs={'class': 'form-check-input'}),
            'openai_biblioteca_enabled': forms.CheckboxInput(attrs={'class': 'form-check-input'}),
            'monthly_limit': forms.NumberInput(attrs={'class': 'form-control', 'min': '0'}),
        }
        labels = {
            'openai_noticias_enabled': 'Habilitar IA para Noticias',
            'openai_comunicados_enabled': 'Habilitar IA para Comunicados',
            'openai_biblioteca_enabled': 'Habilitar IA para Biblioteca',
            'monthly_limit': 'Límite mensual de usos (0 = ilimitado)',
        }
