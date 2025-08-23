from django.utils import timezone
from django.db import models
from django.contrib.auth.models import User
from django.core.validators import MinValueValidator, MaxValueValidator
from datetime import datetime


# Create your models here.
#blank=True quiere decir que el campo no es obligatorio en el formulario
#null=True es para que la base de datos sepa que puede dejar ese campo vacio

#el modelo comunicados hace referencia a la seccion comunicados que tiene un titulo, color de fondo e imagen
DATE_INPUT_FORMATS = ('%d-%m-%Y','%Y-%m-%d')

class AppearanceSettings(models.Model):
    #color de fondo del menu principal
    menu_background_color = models.CharField(max_length=7, default="#FFFFFF")
    #color del texto
    menu_text_color = models.CharField(max_length=7, default="#000000")
    #tamaño
    menu_height = models.PositiveIntegerField(default=80, validators=[MinValueValidator(50), MaxValueValidator(200)])

    #color de fondo del megamenu
    mega_menu_background_color = models.CharField(max_length=7, default="#FFFFFF")
    #color del texto del megamenu
    mega_menu_text_color = models.CharField(max_length=7, default="#000000")

    #color cuando paso por encima de un texto especial
    color_principal_texto = models.CharField(max_length=7, default="#000000")
    
    # Opción para usar el color principal en botones primary
    usar_color_principal = models.BooleanField(default=True, help_text="Activar para que los botones primary usen el color principal del sitio")

    # Nuevos campos para eventos
    eventos_card_background = models.CharField(max_length=7, default="#FFFFFF")
    eventos_card_text_color = models.CharField(max_length=7, default="#000000")

    #color de fondo de la seccion comunicados
    comunicados_background = models.CharField(max_length=7, default="#FFFFFF")

    # Color de fondo de la sección profesores
    profesores_background = models.CharField(max_length=7, default="#FFFFFF")

    # Nuevo campo para cambiar el color de fondo de las cards de comunicados
    comunicados_card_background = models.CharField(max_length=7, default="#FFFFFF")
    comunicados_card_transparency = models.IntegerField(default=0)  # Nuevo campo para la transparencia

    # Campo para el número de WhatsApp
    whatsapp_number = models.CharField(
        max_length=20, 
        blank=True, 
        null=True,
        default="56912345678",
        help_text="Número de WhatsApp para contacto (incluir código de país sin +). Ejemplo: 56912345678"
    )
    
    # Campos para redes sociales
    facebook_url = models.URLField(
        max_length=200,
        blank=True,
        null=True,
        help_text="URL completa de la página de Facebook del colegio"
    )
    
    twitter_url = models.URLField(
        max_length=200,
        blank=True,
        null=True,
        help_text="URL completa de la cuenta de Twitter/X del colegio"
    )
    
    instagram_url = models.URLField(
        max_length=200,
        blank=True,
        null=True,
        help_text="URL completa de la cuenta de Instagram del colegio"
    )
    
    youtube_url = models.URLField(
        max_length=200,
        blank=True,
        null=True,
        help_text="URL completa del canal de YouTube del colegio"
    )

    def __str__(self):
        return "Configuración de Apariencia"

    class Meta:
        verbose_name = "Configuración de Apariencia"
        verbose_name_plural = "Configuraciones de Apariencia"

class UserProfile(models.Model):
    user = models.OneToOneField(User, on_delete=models.CASCADE)
    ROLES = [
        ('administrativo', 'Administrativo'),
        ('profesor', 'Profesor'),
        ('asistente', 'Asistente'),
        ('alumno', 'Alumno'), 
        ('apoderado', 'Apoderado')
    ]
    role = models.CharField(max_length=50, choices=ROLES)  # Mantener por compatibilidad
    foto = models.ImageField(
        upload_to='profile_photos/',
        null=True,
        blank=True,
        default='img/default-profile.png'
    )

    def __str__(self):
        return f"{self.user.username} - {self.get_role_display()}"
    
    def get_roles(self):
        """Obtiene todos los roles del usuario"""
        return UserRole.objects.filter(user_profile=self)
    
    def get_roles_display(self):
        """Obtiene los nombres display de todos los roles"""
        roles = self.get_roles()
        if roles.exists():
            return [role.get_role_display() for role in roles]
        return [self.get_role_display()]  # Fallback al rol único
    
    def has_role(self, role_name):
        """Verifica si el usuario tiene un rol específico"""
        return UserRole.objects.filter(user_profile=self, role=role_name).exists()

class UserRole(models.Model):
    """Modelo para manejar múltiples roles por usuario"""
    user_profile = models.ForeignKey(UserProfile, on_delete=models.CASCADE, related_name='roles')
    ROLES = [
        ('administrativo', 'Administrativo'),
        ('profesor', 'Profesor'),
        ('asistente', 'Asistente'),
        ('alumno', 'Alumno'), 
        ('apoderado', 'Apoderado')
    ]
    role = models.CharField(max_length=50, choices=ROLES)
    created_at = models.DateTimeField(auto_now_add=True)
    
    class Meta:
        unique_together = ['user_profile', 'role']  # Evitar duplicados
        verbose_name = "Rol de Usuario"
        verbose_name_plural = "Roles de Usuario"
    
    def __str__(self):
        return f"{self.user_profile.user.username} - {self.get_role_display()}"

class Profesor(models.Model):
    usuario = models.OneToOneField(UserProfile, on_delete=models.CASCADE, null=True, blank=True)
    jefe = models.BooleanField(default=False)

class Administrativo(models.Model):
    usuario = models.OneToOneField(UserProfile, on_delete=models.CASCADE)
    cargo = models.CharField(max_length=100)

class Asistente(models.Model):
    usuario = models.OneToOneField(UserProfile, on_delete=models.CASCADE)
    area = models.CharField(max_length=100)

class Alumno(models.Model):
    usuario = models.OneToOneField(UserProfile, on_delete=models.CASCADE)
    rut = models.CharField(max_length=12)
    curso = models.ForeignKey('Curso', on_delete=models.SET_NULL, null=True)

class Apoderado(models.Model):
    usuario = models.OneToOneField(UserProfile, on_delete=models.CASCADE)
    alumnos = models.ManyToManyField(Alumno, related_name='apoderados')

class Asignatura(models.Model):
    nombre = models.CharField(max_length=50)

    def __str__(self):
        return self.nombre

class Curso(models.Model):
    nombre = models.CharField(max_length=50)
    asignaturas = models.ManyToManyField(Asignatura, through='CursoAsignatura', blank=True, null=True)
    profesor_jefe = models.ForeignKey(UserProfile, related_name='curso_profesor_jefe', on_delete=models.SET_NULL, null=True, blank=True)

    def __str__(self):
        return self.nombre

class CursoAsignatura(models.Model):
    curso = models.ForeignKey(Curso, on_delete=models.CASCADE)
    asignatura = models.ForeignKey(Asignatura, on_delete=models.CASCADE)
    profesor = models.ForeignKey(UserProfile, on_delete=models.SET_NULL, null=True, blank=True)

    def __str__(self):
        return self.asignatura.nombre

class Evento(models.Model):
    fecha = models.DateTimeField(default=timezone.now)
    titulo = models.CharField(max_length=200)
    texto = models.TextField()

class Colegio(models.Model):
    nombre = models.CharField(max_length=200)
    direccion = models.CharField(max_length=200)
    email = models.CharField(max_length=100)
    logo = models.ImageField(upload_to='fotos', blank=True, null=True)
    horario = models.CharField(max_length=100, null=True, blank=True)
    telefono = models.CharField(max_length=100, null=True, blank=True)
    pais = models.CharField(max_length=100, default="Chile", blank=True, null=True)
    region = models.CharField(max_length=100, blank=True, null=True)


#modelos para el menu
class Menu(models.Model):
    nombre = models.CharField(max_length=100, default='Menu Principal')
    
    def __str__(self):
        return self.nombre

class MenuItem(models.Model):
    nombre = models.CharField(max_length=100)
    url = models.CharField(max_length=200)
    orden = models.IntegerField(default=0)
    es_mega_menu = models.BooleanField(default=False)
    solo_usuarios_logueados = models.BooleanField(default=False)
    menu = models.ForeignKey(Menu, on_delete=models.CASCADE, related_name='items', null=True)
    icono = models.CharField(max_length=50, blank=True, null=True, help_text="Clase del icono de Bootstrap (ej: bi-house-door)") # ¡Campo nuevo!

    class Meta:
        ordering = ['orden']

    def __str__(self):
        return self.nombre


class PreguntaFrecuente(models.Model):
    pregunta = models.CharField(max_length=500, help_text="La pregunta que será mostrada")
    respuesta = models.TextField(help_text="La respuesta a la pregunta")
    orden = models.PositiveIntegerField(default=0, help_text="Orden de aparición (menor número aparece primero)")
    activa = models.BooleanField(default=True, help_text="Si está activa se mostrará en el sitio web")
    fecha_creacion = models.DateTimeField(auto_now_add=True)
    fecha_modificacion = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['orden', 'fecha_creacion']
        verbose_name = 'Pregunta Frecuente'
        verbose_name_plural = 'Preguntas Frecuentes'

    def __str__(self):
        return f"{self.orden}. {self.pregunta[:50]}..."



class HeroSettings(models.Model):
    """
    Modelo dedicado para la configuración del Hero de la página principal
    """
    # Imagen de fondo principal (mantener compatibilidad)
    background_image = models.ImageField(
        upload_to='hero/', 
        blank=True, 
        null=True,
        help_text="Imagen de fondo principal para la sección hero (recomendado: 1920x1080px)"
    )
    
    # Contenido de texto
    title = models.CharField(
        max_length=200, 
        default="Bienvenidos a Nuestro Colegio",
        help_text="Título principal del hero"
    )
    subtitle = models.TextField(
        max_length=500, 
        default="Formando líderes del futuro con excelencia académica y valores sólidos",
        help_text="Subtítulo del hero"
    )
    
    # Colores
    title_color = models.CharField(
        max_length=7, 
        default="#FFFFFF",
        help_text="Color del título principal"
    )
    subtitle_color = models.CharField(
        max_length=7, 
        default="#FFFFFF",
        help_text="Color del subtítulo"
    )
    
    # Botones
    btn_primary_text = models.CharField(
        max_length=50, 
        default="Conoce Más",
        help_text="Texto del botón principal"
    )
    btn_secondary_text = models.CharField(
        max_length=50, 
        default="Ver Comunicados",
        help_text="Texto del botón secundario"
    )
    btn_primary_url = models.CharField(
        max_length=200,
        default="#noticias",
        help_text="URL del botón principal (usar # para anclas)"
    )
    btn_secondary_url = models.CharField(
        max_length=200,
        default="/comunicados/",
        help_text="URL del botón secundario"
    )
    
    # Configuración visual
    
    # Metadata
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        verbose_name = "Configuración Hero"
        verbose_name_plural = "Configuraciones Hero"
        ordering = ['-created_at']

    def __str__(self):
        return f"Hero: {self.title[:30]}..."

    def delete_background_image(self):
        """
        Método auxiliar para eliminar la imagen de fondo de forma segura
        """
        if self.background_image:
            try:
                # Eliminar archivo físico
                import os
                if os.path.exists(self.background_image.path):
                    os.remove(self.background_image.path)
                
                # Limpiar campo en BD
                self.background_image.delete(save=False)
                self.background_image = None
                self.save()
                return True
            except Exception as e:
                # En producción, usar logging
                return False
        return True

    @property
    def has_background_image(self):
        """
        Property para verificar si tiene imagen de fondo configurada
        """
        return bool(self.background_image and self.background_image.name)

    @property
    def background_image_url(self):
        """
        Property para obtener la URL de la imagen de fondo de forma segura
        """
        if self.has_background_image:
            return self.background_image.url
        return None
    
    @classmethod
    def get_active_hero(cls):
        """
        Método de clase para obtener el hero activo
        """
        try:
            return cls.objects.first()
        except cls.DoesNotExist:
            return None
    
    @classmethod
    def get_or_create_default(cls):
        """
        Método de clase para obtener o crear la configuración por defecto
        """
        hero = cls.get_active_hero()
        if not hero:
            hero = cls.objects.create()
        return hero

    def save(self, *args, **kwargs):
        """
        Método save simplificado
        """
        super().save(*args, **kwargs)

    @property
    def get_all_images(self):
        """
        Obtiene todas las imágenes del hero (principal + adicionales)
        """
        images = []
        if self.background_image:
            images.append(self.background_image.url)
        
        # Añadir imágenes adicionales
        additional_images = self.hero_images.all().order_by('order')
        for img in additional_images:
            images.append(img.image.url)
        
        return images
    
    @property
    def has_multiple_images(self):
        """
        Verifica si tiene múltiples imágenes configuradas
        """
        return len(self.get_all_images) > 1


class HeroImage(models.Model):
    """
    Modelo para imágenes adicionales del Hero
    """
    hero_settings = models.ForeignKey(
        HeroSettings, 
        on_delete=models.CASCADE, 
        related_name='hero_images'
    )
    image = models.ImageField(
        upload_to='hero/additional/', 
        help_text="Imagen adicional para el hero (recomendado: 1920x1080px)"
    )
    order = models.PositiveIntegerField(
        default=0, 
        help_text="Orden de aparición (menor número aparece primero)"
    )
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['order', 'created_at']
        verbose_name = "Imagen del Hero"
        verbose_name_plural = "Imágenes del Hero"

    def __str__(self):
        return f"Imagen {self.order + 1} - {self.hero_settings.title[:30]}"

    def delete_image_file(self):
        """
        Elimina el archivo físico de la imagen
        """
        if self.image:
            try:
                import os
                if os.path.exists(self.image.path):
                    os.remove(self.image.path)
                return True
            except Exception:
                return False
        return True

class ColegioSubscription(models.Model):
    # Funcionalidades de OpenAI
    openai_noticias_enabled = models.BooleanField(default=False)
    openai_comunicados_enabled = models.BooleanField(default=False)
    openai_biblioteca_enabled = models.BooleanField(default=False)
    
    # Límites de uso
    monthly_limit = models.IntegerField(default=0)
    current_usage = models.IntegerField(default=0)
    
    # Control de periodo
    period_start = models.DateField(default=timezone.now)
    
    def __str__(self):
        return "Configuración de Suscripción IA"
    
    @classmethod
    def get_instance(cls):
        obj, created = cls.objects.get_or_create(pk=1)
        return obj
    
    def can_use_openai(self, feature):
        """Verifica si se puede usar OpenAI para una funcionalidad específica"""
        if not getattr(self, f'openai_{feature}_enabled'):
            return False
        
        # Verificar límite mensual
        if self.monthly_limit > 0 and self.current_usage >= self.monthly_limit:
            return False
        
        return True
    
    def increment_usage(self):
        """Incrementa el uso actual"""
        self.current_usage += 1
        self.save()
    
    def reset_monthly_usage(self):
        """Resetea el uso mensual si cambió el mes"""
        current_date = timezone.now().date()
        if current_date.month != self.period_start.month or current_date.year != self.period_start.year:
            self.current_usage = 0
            self.period_start = current_date
            self.save()

    class Meta:
        verbose_name = "Configuración de Suscripción IA"
        verbose_name_plural = "Configuraciones de Suscripción IA"
