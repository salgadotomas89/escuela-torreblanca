from django import forms
from django.contrib.auth.forms import UserCreationForm
from django.contrib.auth.models import User
from django.core.exceptions import ValidationError
from PIL import Image
import os

from colegio.models import AppearanceSettings, Colegio, ColegioSubscription, Evento, Menu, MenuItem, HeroSettings, HeroImage


class MultipleFileInput(forms.ClearableFileInput):
    allow_multiple_selected = True


class MultipleFileField(forms.FileField):
    def __init__(self, *args, **kwargs):
        kwargs.setdefault("widget", MultipleFileInput())
        super().__init__(*args, **kwargs)

    def clean(self, data, initial=None):
        single_file_clean = super().clean
        if isinstance(data, (list, tuple)):
            result = [single_file_clean(d, initial) for d in data]
        else:
            result = single_file_clean(data, initial)
        return result


class AppearanceSettingsForm(forms.ModelForm):
    menu_background_color = forms.CharField(widget=forms.TextInput(attrs={'type': 'color'}))
    menu_text_color = forms.CharField(widget=forms.TextInput(attrs={'type': 'color'}))
    mega_menu_background_color = forms.CharField(widget=forms.TextInput(attrs={'type': 'color'}))
    mega_menu_text_color = forms.CharField(widget=forms.TextInput(attrs={'type': 'color'}))
    menu_height = forms.IntegerField(widget=forms.NumberInput(attrs={'min': 50, 'max': 200}))
    color_principal_texto= forms.CharField(widget=forms.TextInput(attrs={'type': 'color'}))
    usar_color_principal = forms.BooleanField(required=False, widget=forms.CheckboxInput(attrs={'class': 'form-check-input'}))
    eventos_card_background = forms.CharField(widget=forms.TextInput(attrs={'type': 'color'}))
    eventos_card_text_color = forms.CharField(widget=forms.TextInput(attrs={'type': 'color'}))
    
    # Campos para redes sociales
    facebook_url = forms.URLField(
        required=False,
        widget=forms.URLInput(attrs={
            'class': 'form-control',
            'placeholder': 'https://facebook.com/tu-pagina'
        })
    )
    
    twitter_url = forms.URLField(
        required=False,
        widget=forms.URLInput(attrs={
            'class': 'form-control',
            'placeholder': 'https://twitter.com/tu-cuenta'
        })
    )
    
    instagram_url = forms.URLField(
        required=False,
        widget=forms.URLInput(attrs={
            'class': 'form-control',
            'placeholder': 'https://instagram.com/tu-cuenta'
        })
    )
    
    youtube_url = forms.URLField(
        required=False,
        widget=forms.URLInput(attrs={
            'class': 'form-control',
            'placeholder': 'https://youtube.com/channel/tu-canal'
        })
    )

    class Meta:
        model = AppearanceSettings
        fields = [
            'menu_background_color', 
            'menu_text_color', 
            'mega_menu_background_color', 
            'mega_menu_text_color', 
            'menu_height', 
            'color_principal_texto',
            'usar_color_principal',
            'eventos_card_background',
            'eventos_card_text_color',
            'facebook_url',
            'twitter_url',
            'instagram_url',
            'youtube_url'
        ]


class HeroSettingsForm(forms.ModelForm):
    """
    Formulario dedicado para la configuración del Hero
    """
    # Imagen de fondo con validación mejorada
    background_image = forms.ImageField(
        required=False,
        widget=forms.FileInput(attrs={
            'class': 'form-control',
            'accept': 'image/jpeg,image/jpg,image/png,image/webp'
        }),
        help_text="Imagen principal para el fondo del hero. Recomendado: 1920x1080px, máximo 5MB"
    )
    
    # Campo para múltiples imágenes adicionales
    additional_images = MultipleFileField(
        required=False,
        help_text="Imágenes adicionales para el hero. Pueden seleccionar múltiples archivos."
    )
    
    # Contenido de texto
    title = forms.CharField(
        max_length=200, 
        widget=forms.TextInput(attrs={'class': 'form-control'})
    )
    subtitle = forms.CharField(
        widget=forms.Textarea(attrs={'rows': 3, 'class': 'form-control'})
    )
    
    # Colores
    title_color = forms.CharField(widget=forms.TextInput(attrs={'type': 'color'}))
    subtitle_color = forms.CharField(widget=forms.TextInput(attrs={'type': 'color'}))
    
    # Botones
    btn_primary_text = forms.CharField(
        max_length=50, 
        widget=forms.TextInput(attrs={'class': 'form-control'})
    )
    btn_secondary_text = forms.CharField(
        max_length=50, 
        widget=forms.TextInput(attrs={'class': 'form-control'})
    )
    btn_primary_url = forms.CharField(
        max_length=200,
        widget=forms.TextInput(attrs={'class': 'form-control'})
    )
    btn_secondary_url = forms.CharField(
        max_length=200,
        widget=forms.TextInput(attrs={'class': 'form-control'})
    )
    class Meta:
        model = HeroSettings
        fields = [
            'background_image',
            'additional_images',
            'title',
            'subtitle',
            'title_color',
            'subtitle_color',
            'btn_primary_text',
            'btn_secondary_text',
            'btn_primary_url',
            'btn_secondary_url'
        ]

    def clean_background_image(self):
        """
        Validación avanzada para la imagen de fondo del hero
        """
        image = self.cleaned_data.get('background_image')
        
        if image:
            # Validar tamaño del archivo (máximo 5MB)
            max_size = 5 * 1024 * 1024  # 5MB
            if image.size > max_size:
                raise ValidationError(
                    f'El archivo es demasiado grande. Tamaño máximo: 5MB. '
                    f'Tamaño actual: {image.size / 1024 / 1024:.2f}MB'
                )
            
            # Validar tipo de archivo
            allowed_types = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp']
            if hasattr(image, 'content_type') and image.content_type not in allowed_types:
                raise ValidationError(
                    'Tipo de archivo no válido. Use JPG, PNG o WebP.'
                )
            
            # Validar dimensiones usando PIL
            try:
                # Abrir la imagen para verificar dimensiones
                pil_image = Image.open(image)
                width, height = pil_image.size
                
                # Advertir si las dimensiones son muy pequeñas
                min_width, min_height = 1280, 720
                if width < min_width or height < min_height:
                    # No es un error crítico, pero se puede registrar como advertencia
                    pass  # En una implementación real, podrías usar logging aquí
                
                # Verificar que la imagen no esté corrupta
                pil_image.verify()
                
            except Exception as e:
                raise ValidationError(
                    f'La imagen parece estar corrupta o no es válida: {str(e)}'
                )
        
        return image

    def clean_additional_images(self):
        """
        Validación para las imágenes adicionales
        """
        # El campo additional_images no está en cleaned_data por defecto
        # Se manejará en la vista
        return None


class CustomUserForm(UserCreationForm):
    ROLES_CHOICES = [
        ('', 'Seleccione un rol'),
        ('profesor', 'Profesor'),
        ('utp', 'UTP'),
        ('director', 'Director')
    ]

    username = forms.CharField(label='Nombre de usuario')
    first_name = forms.CharField(label='Nombre')
    email = forms.EmailField(label='Correo electrónico')
    password1 = forms.CharField(label='Contraseña', widget=forms.PasswordInput)
    password2 = forms.CharField(label='Confirmación de contraseña', widget=forms.PasswordInput)
    role = forms.ChoiceField(choices=ROLES_CHOICES, label='Rol', required=False)

    class Meta:
        model = User
        fields = ('username', 'first_name', 'email', 'password1', 'password2', 'role')

class FormEvento(forms.ModelForm):
    fecha = forms.DateTimeField(
        input_formats=['%m/%d/%Y', '%Y-%m-%d', '%m-%d-%Y', '%d/%m/%Y'],
        widget=forms.DateTimeInput(attrs={
            'class': 'fecha-ts form-control',
            'placeholder': 'MM/DD/YYYY'
        })
    )
    
    class Meta:
        model = Evento
        fields = '__all__'
        widgets = {
            'titulo': forms.TextInput(attrs={'class': 'form-control'}),
            'texto': forms.Textarea(attrs={'class': 'form-control', 'rows': 4}),
        }




class FormColegio(forms.ModelForm):

    class Meta:
        model = Colegio
        fields = '__all__'

class MenuItemForm(forms.ModelForm):
    class Meta:
        model = MenuItem
        fields = ['nombre', 'url', 'es_mega_menu']  # Quitamos 'orden' de los campos
        widgets = {
            'nombre': forms.TextInput(attrs={'class': 'form-control'}),
            'url': forms.TextInput(attrs={'class': 'form-control'}),
            'es_mega_menu': forms.CheckboxInput(attrs={'class': 'form-check-input'})
        }

class MenuForm(forms.ModelForm):
    class Meta:
        model = Menu
        fields = '__all__'  # O especifica los campos exactos que existen en tu modelo Menu
        widgets = {
            'menu_items': forms.CheckboxSelectMultiple,
        }

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