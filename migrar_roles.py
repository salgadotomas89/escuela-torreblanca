#!/usr/bin/env python
"""
Script para migrar roles únicos a múltiples roles
Este script debe ejecutarse después de aplicar las migraciones
"""
import os
import sys
import django

# Configurar Django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'miproyecto.settings')
django.setup()

from colegio.models import UserProfile, UserRole

def migrar_roles():
    """Migra los roles únicos existentes al sistema de múltiples roles"""
    print("Iniciando migración de roles...")
    
    # Obtener todos los perfiles que tienen un rol pero no tienen registros en UserRole
    perfiles = UserProfile.objects.filter(role__isnull=False).exclude(role='')
    
    migrados = 0
    errores = 0
    
    for perfil in perfiles:
        try:
            # Verificar si ya existe un UserRole para este perfil
            if not UserRole.objects.filter(user_profile=perfil).exists():
                # Crear el UserRole basado en el rol único existente
                UserRole.objects.create(
                    user_profile=perfil,
                    role=perfil.role
                )
                migrados += 1
                print(f"Migrado: {perfil.user.username} - {perfil.get_role_display()}")
            else:
                print(f"Ya migrado: {perfil.user.username}")
        except Exception as e:
            errores += 1
            print(f"Error migrando {perfil.user.username}: {str(e)}")
    
    print(f"\nMigración completada:")
    print(f"- Perfiles migrados: {migrados}")
    print(f"- Errores: {errores}")
    print(f"- Total procesados: {len(perfiles)}")

if __name__ == "__main__":
    migrar_roles()
