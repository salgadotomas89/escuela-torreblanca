from django.contrib import admin

from colegio.models import  Evento, Colegio, PreguntaFrecuente, AppearanceSettings, HeroSettings, HeroImage, ColegioSubscription
from comunicados.models import Comunicados

# Register your models here.
admin.site.register(Evento)
admin.site.register(Colegio)
admin.site.register(Comunicados)

@admin.register(AppearanceSettings)
class AppearanceSettingsAdmin(admin.ModelAdmin):
    list_display = ('menu_background_color', 'menu_text_color', 'whatsapp_number')
    fieldsets = (
        ('Configuración del Menú', {
            'fields': ('menu_background_color', 'menu_text_color', 'menu_height')
        }),
        ('Configuración del Mega Menú', {
            'fields': ('mega_menu_background_color', 'mega_menu_text_color')
        }),
        ('Colores Principales', {
            'fields': ('color_principal_texto', 'usar_color_principal')
        }),
        ('Sección Eventos', {
            'fields': ('eventos_card_background', 'eventos_card_text_color')
        }),
        ('Sección Comunicados', {
            'fields': ('comunicados_background', 'comunicados_card_background', 'comunicados_card_transparency')
        }),
        ('Sección Profesores', {
            'fields': ('profesores_background',)
        }),
        ('Contacto WhatsApp', {
            'fields': ('whatsapp_number',),
            'description': 'Configuración del botón flotante de WhatsApp'
        }),
    )

@admin.register(PreguntaFrecuente)
class PreguntaFrecuenteAdmin(admin.ModelAdmin):
    list_display = ('orden', 'pregunta', 'activa', 'fecha_creacion', 'fecha_modificacion')
    list_filter = ('activa', 'fecha_creacion')
    search_fields = ('pregunta', 'respuesta')
    list_editable = ('activa',)
    list_display_links = ('orden', 'pregunta')
    ordering = ('orden', 'fecha_creacion')
    
    fieldsets = (
        (None, {
            'fields': ('pregunta', 'respuesta')
        }),
        ('Configuración', {
            'fields': ('orden', 'activa'),
            'classes': ('collapse',)
        }),
    )

class HeroImageInline(admin.TabularInline):
    """
    Inline para gestionar imágenes adicionales del hero
    """
    model = HeroImage
    extra = 1
    fields = ('image', 'order')
    readonly_fields = ('created_at',)


@admin.register(HeroImage)
class HeroImageAdmin(admin.ModelAdmin):
    """
    Admin para gestionar imágenes individuales del hero
    """
    list_display = ('__str__', 'hero_settings', 'order', 'created_at')
    list_filter = ('created_at', 'hero_settings')
    search_fields = ('hero_settings__title',)
    readonly_fields = ('created_at',)
    
    fieldsets = (
        ('Configuración de la Imagen', {
            'fields': ('hero_settings', 'image', 'order')
        }),
        ('Metadatos', {
            'fields': ('created_at',),
            'classes': ('collapse',)
        }),
    )


# Admin para HeroSettings con imágenes inline
@admin.register(HeroSettings)
class HeroSettingsAdmin(admin.ModelAdmin):
    """
    Admin mejorado para gestionar Hero Settings con imágenes múltiples
    """
    list_display = ('title', 'subtitle', 'total_images', 'created_at', 'updated_at')
    list_filter = ('created_at',)
    search_fields = ('title', 'subtitle')
    readonly_fields = ('created_at', 'updated_at')
    inlines = [HeroImageInline]
    
    fieldsets = (
        ('Contenido del Hero', {
            'fields': ('title', 'title_color', 'subtitle', 'subtitle_color')
        }),
        ('Imagen Principal', {
            'fields': ('background_image',),
            'description': 'Imagen principal del hero. Las imágenes adicionales se gestionan en la sección de abajo.'
        }),
        ('Botones de Acción', {
            'fields': ('btn_primary_text', 'btn_primary_url', 'btn_secondary_text', 'btn_secondary_url')
        }),
        ('Metadatos', {
            'fields': ('created_at', 'updated_at'),
            'classes': ('collapse',)
        }),
    )
    
    def total_images(self, obj):
        """
        Muestra el total de imágenes (principal + adicionales)
        """
        return len(obj.get_all_images)
    total_images.short_description = 'Total de imágenes'

@admin.register(ColegioSubscription)
class ColegioSubscriptionAdmin(admin.ModelAdmin):
    list_display = ('openai_noticias_enabled', 'openai_comunicados_enabled', 'openai_biblioteca_enabled', 'current_usage', 'monthly_limit')
    fieldsets = (
        ('Funcionalidades OpenAI', {
            'fields': ('openai_noticias_enabled', 'openai_comunicados_enabled', 'openai_biblioteca_enabled')
        }),
        ('Límites de Uso', {
            'fields': ('monthly_limit', 'current_usage', 'period_start')
        }),
    )
    readonly_fields = ('current_usage', 'period_start')

