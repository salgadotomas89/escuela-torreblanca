from rest_framework import serializers
from .models import Colegio, Evento
from django.utils import timezone


class EventoSerializer(serializers.ModelSerializer):
    # Campos adicionales calculados
    fecha_formatted = serializers.SerializerMethodField()
    
    class Meta:
        model = Evento
        fields = ['id', 'titulo', 'texto', 'fecha', 'fecha_formatted']
        
    def get_fecha_formatted(self, obj):
        """Retorna la fecha en formato legible"""
        return obj.fecha.strftime('%d/%m/%Y %H:%M') if obj.fecha else None
        
    def validate_fecha(self, value):
        """Validar que la fecha no sea en el pasado"""
        if value and value < timezone.now():
            raise serializers.ValidationError("La fecha no puede estar en el pasado")
        return value


class EventoCreateUpdateSerializer(serializers.ModelSerializer):
    """Serializer específico para crear y actualizar eventos"""
    class Meta:
        model = Evento
        fields = ['titulo', 'texto', 'fecha']
        
    def validate_titulo(self, value):
        if len(value.strip()) < 3:
            raise serializers.ValidationError("El título debe tener al menos 3 caracteres")
        return value.strip()
        
    def validate_texto(self, value):
        if len(value.strip()) < 10:
            raise serializers.ValidationError("El texto debe tener al menos 10 caracteres")
        return value.strip()
    

# ...existing code...

class ColegioSerializer(serializers.ModelSerializer):
    # Campo calculado para la URL completa del logo
    logo_url = serializers.SerializerMethodField()
    
    class Meta:
        model = Colegio
        fields = ['id', 'nombre', 'direccion', 'email', 'logo', 'logo_url', 
                 'horario', 'telefono', 'pais', 'region']
        
    def get_logo_url(self, obj):
        """Retorna la URL completa del logo"""
        if obj.logo:
            request = self.context.get('request')
            if request:
                return request.build_absolute_uri(obj.logo.url)
            return obj.logo.url
        return None
        
    def validate_email(self, value):
        """Validar formato de email"""
        from django.core.validators import validate_email
        from django.core.exceptions import ValidationError
        try:
            validate_email(value)
        except ValidationError:
            raise serializers.ValidationError("Formato de email inválido")
        return value
        
    def validate_telefono(self, value):
        """Validar teléfono (opcional, solo si se proporciona)"""
        if value and len(value.strip()) < 8:
            raise serializers.ValidationError("El teléfono debe tener al menos 8 caracteres")
        return value.strip() if value else value


class ColegioCreateUpdateSerializer(serializers.ModelSerializer):
    """Serializer específico para crear y actualizar colegio"""
    class Meta:
        model = Colegio
        fields = ['nombre', 'direccion', 'email', 'logo', 'horario', 'telefono', 'pais', 'region']
        
    def validate_nombre(self, value):
        if len(value.strip()) < 3:
            raise serializers.ValidationError("El nombre debe tener al menos 3 caracteres")
        return value.strip()
        
    def validate_direccion(self, value):
        if len(value.strip()) < 5:
            raise serializers.ValidationError("La dirección debe tener al menos 5 caracteres")
        return value.strip()