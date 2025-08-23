from django import template
from colegio.models import AppearanceSettings

register = template.Library()

@register.inclusion_tag('components/whatsapp_button.html')
def whatsapp_button():
    """
    Template tag para mostrar el botón flotante de WhatsApp.
    Uso: {% load whatsapp_tags %} y luego {% whatsapp_button %}
    """
    try:
        appearance_settings = AppearanceSettings.objects.first()
        whatsapp_number = appearance_settings.whatsapp_number if appearance_settings else "56912345678"
    except AppearanceSettings.DoesNotExist:
        whatsapp_number = "56912345678"
    
    return {
        'whatsapp_number': whatsapp_number,
    }

@register.simple_tag
def get_whatsapp_number():
    """
    Template tag simple para obtener solo el número de WhatsApp.
    Uso: {% load whatsapp_tags %} y luego {% get_whatsapp_number %}
    """
    try:
        appearance_settings = AppearanceSettings.objects.first()
        return appearance_settings.whatsapp_number if appearance_settings else "56912345678"
    except AppearanceSettings.DoesNotExist:
        return "56912345678"
