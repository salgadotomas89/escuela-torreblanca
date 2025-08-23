from django.http import JsonResponse
from django.shortcuts import render
from django.template.loader import render_to_string
from django.db.models import Q
# Desde cualquier archivo dentro de tus apps
from colegio.models import AppearanceSettings, Asignatura, Colegio, Curso, CursoAsignatura, Evento, HeroSettings, HeroImage, Menu, MenuItem, PreguntaFrecuente, UserProfile, ColegioSubscription, Profesor, Administrativo, Asistente, Alumno, Apoderado, UserRole
from comunicados.models import Comunicado, Comunicados
from noticias.models import Images, Noticia
from colegio.forms import AppearanceSettingsForm, CustomUserForm, FormEvento, HeroSettingsForm, MenuForm, MenuItemForm
from django.contrib.auth.models import User
from django.shortcuts import get_object_or_404
from django.contrib import messages
from django.views.decorators.http import require_POST
from django.views.decorators.csrf import csrf_exempt
from django.contrib.auth import update_session_auth_hash
from django.core.files.storage import default_storage
import os
from colegio.forms import MenuItemForm, MenuForm  # Agrega esto a tus imports si no lo tienes
from django.db.models import Max  # Agregar al inicio del archivo
from django.conf import settings
from django.shortcuts import redirect
from django.contrib.auth.decorators import login_required
from django.contrib.auth import logout, login, authenticate

@csrf_exempt
def registro_usuario(request):
    if request.method == 'POST':
        # Asegurarnos que el rol sea válido
        role = request.POST.get('role')
        valid_roles = dict(UserProfile.ROLES).keys()
        if role not in valid_roles:
            return JsonResponse({
                "success": False,
                "error": {
                    "role": ["Rol no válido. Opciones válidas: " + ", ".join(valid_roles)]
                }
            })

        form = CustomUserForm(request.POST)
        if form.is_valid():
            try:
                user = form.save()
                
                # Crear el UserProfile con el rol
                user_profile = UserProfile.objects.create(user=user, role=role)
                
                # Debug: Verificar si hay archivos en la request
                print(f"FILES en request: {request.FILES}")
                print(f"Foto en FILES: {'foto' in request.FILES}")
                
                # Procesar la foto si se subió una
                if 'foto' in request.FILES:
                    foto = request.FILES['foto']
                    print(f"Archivo recibido: {foto.name}, Tipo: {foto.content_type}, Tamaño: {foto.size}")
                    
                    # Validar el archivo
                    allowed_types = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif']
                    if foto.content_type in allowed_types and foto.size <= 5 * 1024 * 1024:  # 5MB máximo
                        user_profile.foto = foto
                        user_profile.save()
                        print(f"Foto guardada correctamente: {user_profile.foto.url}")
                    else:
                        print(f"Archivo no válido - Tipo: {foto.content_type}, Tamaño: {foto.size}")
                else:
                    print("No se encontró archivo de foto en la request")
                
                return JsonResponse({
                    "success": True, 
                    "message": "Usuario creado correctamente",
                    "foto_guardada": bool('foto' in request.FILES and user_profile.foto)
                })
            except Exception as e:
                # Si algo falla, eliminar el usuario creado
                if 'user' in locals():
                    user.delete()
                print(f"Error al crear usuario: {str(e)}")
                return JsonResponse({
                    "success": False,
                    "error": {"general": [str(e)]}
                })
        else:
            return JsonResponse({
                "success": False,
                "error": form.errors
            })
    return JsonResponse({"success": False, "error": {"general": ["Método no permitido"]}})


def usuarios(request):
    usuarios = User.objects.all()
    context = {
        'usuarios': usuarios,
        'ROLES': UserProfile.ROLES  # Agregamos los roles al contexto
    }
    return render(request, 'usuarios.html', context)


def asignaturas(request):
    asignaturas = Asignatura.objects.all()
    context = {
        'asignaturas': asignaturas
    }
    return render(request, 'asignaturas.html', context)

def config(request):
    return render(request, 'configuracion.html')

#funcion que devuelve la vista para rellenar informacion sobre el colegio
#nombre, direccion, email principal, logo, etc
def ajustes(request):
    try:
        colegio = Colegio.objects.get()
    except Colegio.DoesNotExist:
        # Si no existe, crear uno por defecto
        colegio = Colegio.objects.create(
            nombre="Mi Colegio",
            direccion="Dirección no configurada",
            email="admin@colegio.edu"
        )
    
    # Obtener configuración de apariencia
    try:
        appearance_settings = AppearanceSettings.objects.first()
    except AppearanceSettings.DoesNotExist:
        appearance_settings = AppearanceSettings.objects.create()

    context = {
        "colegio": colegio,
        "appearance_settings": appearance_settings
    }

    return render(request, 'informacion_colegio.html', context)


def obtener_profesor_jefe(request):
    if request.method == 'POST':
        curso_id = request.POST.get('cursoId')

        # Obtén el curso seleccionado
        curso = get_object_or_404(Curso, pk=curso_id)

        # Verifica si el curso tiene un profesor jefe asignado
        if curso.profesor_jefe:
            profesor_jefe = {
                'nombre': curso.profesor_jefe.user.username,
                'titulo': curso.profesor_jefe.role  # Aquí puedes agregar el campo correcto de UserProfile que almacena el título
            }
        else:
            profesor_jefe = {
                'nombre': 'No asignado',
                'titulo': 'No asignado'
            }

        # Devuelve los detalles del profesor jefe en formato JSON
        data = {
            'success': True,
            'profesor': profesor_jefe
        }
        return JsonResponse(data)

    # Maneja el caso si no es una solicitud POST
    data = {
        'success': False,
        'message': 'Método no permitido'
    }
    return JsonResponse(data)

def guardar_asignatura(request):
    if request.method == 'POST':
        nombre = request.POST.get('nombre')
        nueva_asignatura = Asignatura(nombre=nombre)
        nueva_asignatura.save()

        # Obtener la lista actualizada de asignaturas después de guardar
        asignaturas = Asignatura.objects.all()
        asignaturas_info = [{'id': asignatura.id, 'nombre': asignatura.nombre} for asignatura in asignaturas]

        return JsonResponse({'success': True, 'asignaturas': asignaturas_info})
    else:
        return JsonResponse({'success': False, 'error': 'Método de solicitud no válido'})

def guardar_curso(request):
    if request.method == 'POST':
        nombre = request.POST.get('nombreCurso')
        curso = Curso(nombre=nombre)
        curso.save()
         # Obtén la lista actualizada de cursos
        cursos = Curso.objects.all()
        cursos_list = [{'id': curso.id, 'nombre': curso.nombre} for curso in cursos]

        # Devuelve la lista de cursos en formato JSON
        return JsonResponse({'success': True, 'cursos': cursos_list})
    else:
        return JsonResponse({'success': False, 'error': 'Método de solicitud no válido'})

def obtener_asignaturas(request):
    if request.method == 'POST':
        curso_id = request.POST.get('cursoId')

        try:
            curso = Curso.objects.get(id=curso_id)
            # Obtener las relaciones CursoAsignatura que contienen la info del profesor
            curso_asignaturas = CursoAsignatura.objects.filter(curso=curso).select_related('asignatura', 'profesor__user')
            
            context = {'curso_asignaturas': curso_asignaturas}
            asignaturas_html = render_to_string('asignaturas_list.html', context)
            
            return JsonResponse({'success': True, 'asignaturas_html': asignaturas_html})
        except Curso.DoesNotExist:
            return JsonResponse({'success': False, 'error': 'Curso no encontrado'})
    else:
        asignaturas = Asignatura.objects.all()
        context = {'asignaturas': asignaturas}
        asignaturas_html = render_to_string('asignaturas_list.html', context)
        return JsonResponse({'success': True, 'asignaturas_html': asignaturas_html})

def asignar_asignaturas(request):
    if request.method == 'POST':
        curso_id = request.POST.get('cursoId')
        asignaturas_seleccionadas = request.POST.getlist('asignaturas[]')
        print('DEBUG asignar_asignaturas:')
        print('cursoId:', curso_id)
        print('asignaturas_seleccionadas:', asignaturas_seleccionadas)
        print('POST dict:', dict(request.POST))

        try:
            curso = get_object_or_404(Curso, id=curso_id)
            # Agregar las nuevas asignaturas al curso
            for asignatura_id in asignaturas_seleccionadas:
                asignatura = Asignatura.objects.get(id=asignatura_id)
                # Crear o obtener la relación CursoAsignatura
                curso_asignatura, created = CursoAsignatura.objects.get_or_create(
                    curso=curso,
                    asignatura=asignatura
                )

            # Obtener las relaciones CursoAsignatura actualizadas
            curso_asignaturas = CursoAsignatura.objects.filter(curso=curso).select_related('asignatura', 'profesor__user')

            context = {'curso_asignaturas': curso_asignaturas}
            asignaturas_html = render_to_string('asignaturas_list.html', context)
                
            return JsonResponse({'success': True, 'asignaturas_html': asignaturas_html})
        except (Curso.DoesNotExist, Asignatura.DoesNotExist) as e:
            return JsonResponse({'success': False, 'error': 'Curso no encontrado'})
    else:
        return JsonResponse({'success': False, 'error': 'Método de solicitud no vlido'})

def eliminar_asignatura(request):
    if request.method == 'POST':
        curso_id = request.POST.get('cursoId')
        asignatura_id = request.POST.get('asignatura_id')

        if curso_id :
            try:
                asignatura = CursoAsignatura.objects.get(Q(asignatura_id=asignatura_id), Q(curso_id=curso_id))
                asignatura.delete()

                return JsonResponse({'success': True})
            except CursoAsignatura.DoesNotExist:
                return JsonResponse({'success': False, 'error': 'Asignatura no encontrada'})
        else:
            try:
                print('id asignatura')
                print(asignatura_id)
                asignatura = Asignatura.objects.get(id=asignatura_id)
                asignatura.delete()

                return JsonResponse({'success': True})
            except CursoAsignatura.DoesNotExist:
                return JsonResponse({'success': False, 'error': 'Asignatura no encontrada'})
    else:
        return JsonResponse({'success': False, 'error': 'metodo de solicitud no valido'})

def asignar_profesor_asignatura(request):
    if request.method == 'POST':
        asignatura_id = request.POST.get('asignaturaId')
        profesor_id = request.POST.get('profesorId')
        curso_id = request.POST.get('cursoId')

        try:
            asignatura = CursoAsignatura.objects.get(Q(asignatura_id=asignatura_id), Q(curso_id=curso_id))
            profesor = UserProfile.objects.get(user_id=profesor_id)
            asignatura.profesor = profesor
            asignatura.save()
            
            # Update the professor for the selected subject
            return JsonResponse({'success': True})
        except (Asignatura.DoesNotExist, UserProfile.DoesNotExist):
            return JsonResponse({'success': False, 'error': 'Asignatura o profesor no encontrado'})
    else:
        return JsonResponse({'success': False, 'error': 'Método de solicitud no válido'})



def cursos(request):
    asignaturas = Asignatura.objects.all()
    
    cursos = Curso.objects.all()
    # Filtrar los usuarios con rol de "profesor"
    profesores = UserProfile.objects.filter(role='profesor')


    context = {
        "asignaturas": asignaturas,
        "cursos": cursos,
        "profesores": profesores,
    }

    return render(request, 'cursos.html', context)


def eliminar_asignatura_de_curso(request):
    if request.method == 'POST':
        asignatura_id = request.POST.get('asignatura_id')
        curso_id = request.POST.get('curso_id')

        

        try:
            curso = Curso.objects.get(id=curso_id)
            asignatura = Asignatura.objects.get(id=asignatura_id)
            curso.asignaturas.remove(asignatura)

            asignaturas = list(curso.asignaturas.all())

            context = {'asignaturas': asignaturas}
            asignaturas_html = render_to_string('asignaturas_list.html', context)
                
            return JsonResponse({'success': True, 'asignaturas_html': asignaturas_html})
        except (Curso.DoesNotExist, Asignatura.DoesNotExist):
            return JsonResponse({'success': False, 'error': 'Curso o asignatura no encontrados'})

    return JsonResponse({'success': False, 'error': 'Método de solicitud no válido'})


def asignar_profesor_jefe(request):

    if request.method == 'POST':
        curso_id = request.POST.get('cursoId')
        profesor_id = request.POST.get('profesor')
        profesor_user_profile = UserProfile.objects.get(user_id=profesor_id)
        
        curso = Curso.objects.get(id=curso_id)
        curso.profesor_jefe = profesor_user_profile
        curso.save()
        
        # Get or create the Profesor object and set jefe=True
        profesor_obj, created = Profesor.objects.get_or_create(
            usuario=profesor_user_profile,
            defaults={'jefe': True}
        )
        if not created:
            profesor_obj.jefe = True
            profesor_obj.save()
            
        print('hello')
        return JsonResponse({'success': True})
    else:
        return JsonResponse({'success': False, 'error': 'Método de solicitud no válido'})

def quitar_profesor_jefe(request):
    if request.method == 'POST':
        curso_id = request.POST.get('cursoId')
        curso = Curso.objects.get(id=curso_id)
        
        # Check if there's a profesor_jefe assigned
        if curso.profesor_jefe:
            # Get the Profesor object related to this UserProfile
            try:
                profesor = Profesor.objects.get(usuario=curso.profesor_jefe)
                profesor.jefe = False
                profesor.save()
            except Profesor.DoesNotExist:
                # If no Profesor object exists, we just need to remove the assignment
                pass
            
            # Remove the profesor_jefe assignment from the course
            curso.profesor_jefe = None
            curso.save()

        return JsonResponse({'success': True})
    else:
        return JsonResponse({'success': False, 'error': 'No se pudo eliminar profesor jefe' })

def actualizar_email_colegio(request):
    print('guardando email de colegio')
    nuevo_email = request.POST.get('nuevo_email')

    colegio = Colegio.objects.first()  # Obtener el único objeto del modelo Colegio
    colegio.email = nuevo_email
    colegio.save()

    return JsonResponse({'success': True})

def actualizar_horario_colegio(request):
    print('guardando horario de colegio')
    nuevo_horario = request.POST.get('nuevo_horario')

    colegio = Colegio.objects.first()  # Obtener el único objeto del modelo Colegio
    colegio.horario = nuevo_horario
    colegio.save()

    return JsonResponse({'success': True})

def actualizar_nombre_colegio(request):
    print('guardando nombre colegio')
    nuevo_nombre = request.POST.get('nuevo_nombre')

    colegio = Colegio.objects.first()  # Obtener el único objeto del modelo Colegio
    colegio.nombre = nuevo_nombre
    colegio.save()

    return JsonResponse({'success': True})

def actualizar_direccion_colegio(request):
    print('guardando direccion colegio')
    nueva = request.POST.get('nueva_direccion')

    colegio = Colegio.objects.first()  # Obtener el único objeto del modelo Colegio
    colegio.direccion = nueva
    colegio.save()

    return JsonResponse({'success': True})

def actualizar_telefono_colegio(request):
    print('guardando telefono colegio')
    nuevo = request.POST.get('nuevo_telefono')

    colegio = Colegio.objects.first()  # Obtener el único objeto del modelo Colegio
    colegio.telefono = nuevo
    colegio.save()

    return JsonResponse({'success': True})

def apariencia(request):
    apariencia = AppearanceSettings.objects.first()
    if not apariencia:
        apariencia = AppearanceSettings.objects.create()

    if request.method == 'POST':
        form = AppearanceSettingsForm(request.POST, request.FILES, instance=apariencia)
        if form.is_valid():
            new_instance = form.save()
            
            # Si es una petición AJAX, devolver JSON
            if request.headers.get('X-Requested-With') == 'XMLHttpRequest':
                return JsonResponse({
                    'success': True,
                    'message': 'Configuración de apariencia guardada exitosamente'
                })
            
            # Si no es AJAX, redirigir como antes
            messages.success(request, 'Configuración de apariencia guardada exitosamente')
            return redirect('apariencia')
        else:
            # Si hay errores en el formulario y es AJAX
            if request.headers.get('X-Requested-With') == 'XMLHttpRequest':
                return JsonResponse({
                    'success': False,
                    'message': 'Error al guardar la configuración',
                    'errors': form.errors
                })

    else:
        form = AppearanceSettingsForm(instance=apariencia)

    current_section = request.GET.get('section', None)

    context = {
        'current_section': current_section,
        'apariencia': apariencia,
        'form': form
    }

    return render(request, 'apariencia.html', context)


@login_required
def menu(request):
    # Obtener o crear el menú principal
    menu_principal, created = Menu.objects.get_or_create(
        nombre='Menu Principal'
    )
    
    # Obtener los items ordenados
    menu_items = MenuItem.objects.filter(menu=menu_principal).order_by('orden')
    
    context = {
        'menu': menu_principal,
        'menu_items': menu_items
    }
    return render(request, 'menu.html', context)

def configuracion(request):
    apariencia = AppearanceSettings.objects.first()
    if not apariencia:
        apariencia = AppearanceSettings.objects.create()

    if request.method == 'POST':
        form = AppearanceSettingsForm(request.POST, instance=apariencia)
        if form.is_valid():
            form.save()
            return redirect('inicio')

    else:
        form = AppearanceSettingsForm(instance=apariencia)

    current_section = request.GET.get('section', None)

    context = {
        'current_section': current_section,
        'apariencia': apariencia,
        'form': form,
        'ROLES': UserProfile.ROLES,  # Agregamos los roles al contexto
    }

    return render(request, 'configuracion.html', context)


@login_required
@require_POST
def reset_password(request):
    try:
        usuario_id = request.POST.get('usuario_id')
        new_password1 = request.POST.get('new_password1')
        new_password2 = request.POST.get('new_password2')
        
        # Validaciones
        if not all([usuario_id, new_password1, new_password2]):
            return JsonResponse({
                'success': False,
                'message': 'Todos los campos son requeridos'
            })
            
        if new_password1 != new_password2:
            return JsonResponse({
                'success': False,
                'message': 'Las contraseñas no coinciden'
            })
            
        # Obtener el usuario
        usuario = User.objects.get(id=usuario_id)
        
        # Cambiar la contraseña
        usuario.set_password(new_password1)
        usuario.save()
        
        return JsonResponse({
            'success': True,
            'message': 'Contraseña actualizada exitosamente'
        })
        
    except User.DoesNotExist:
        return JsonResponse({
            'success': False,
            'message': 'Usuario no encontrado'
        })
    except Exception as e:
        return JsonResponse({
            'success': False,
            'message': f'Error al actualizar la contraseña: {str(e)}'
        })
    


@login_required
@require_POST
def eliminar_usuario(request):
    try:
        usuario_id = request.POST.get('usuario_id')
        
        if not usuario_id:
            return JsonResponse({
                'success': False,
                'message': 'ID de usuario no proporcionado'
            })
            
        # Obtener el usuario
        usuario = User.objects.get(id=usuario_id)
        
        # Obtener el perfil del usuario para acceder a la foto
        try:
            user_profile = UserProfile.objects.get(user=usuario)
            
            # Eliminar la foto física del servidor si existe
            if user_profile.foto:
                try:
                    # Verificar si el archivo existe antes de intentar eliminarlo
                    if os.path.exists(user_profile.foto.path):
                        os.remove(user_profile.foto.path)
                        print(f"Foto eliminada: {user_profile.foto.path}")
                except Exception as e:
                    print(f"Error al eliminar la foto: {str(e)}")
                    # No detenemos el proceso si falla la eliminación de la foto
        except UserProfile.DoesNotExist:
            # Si no existe el perfil, simplemente continuamos
            pass
        
        # Eliminar el usuario (esto también eliminará el perfil debido a la relación on_delete=CASCADE)
        usuario.delete()
        
        return JsonResponse({
            'success': True,
            'message': 'Usuario y foto eliminados exitosamente'
        })
        
    except User.DoesNotExist:
        return JsonResponse({
            'success': False,
            'message': 'Usuario no encontrado'
        })
    except Exception as e:
        return JsonResponse({
            'success': False,
            'message': f'Error al eliminar el usuario: {str(e)}'
        })
    
    
@login_required
@require_POST
def cambiar_rol(request):
    try:
        usuario_id = request.POST.get('usuario_id')
        nuevos_roles = request.POST.getlist('roles[]')  # Recibir múltiples roles

        # Imprimir datos recibidos para depuración
        print("Datos recibidos:", request.POST)
        print("usuario_id:", usuario_id)
        print("nuevos_roles:", nuevos_roles)
        
        if not usuario_id:
            return JsonResponse({
                'success': False,
                'message': 'ID de usuario es requerido'
            })
            
        if not nuevos_roles:
            return JsonResponse({
                'success': False,
                'message': 'Debe seleccionar al menos un rol'
            })
            
        # Validar que todos los roles sean válidos
        valid_roles = dict(UserProfile.ROLES).keys()
        for rol in nuevos_roles:
            if rol not in valid_roles:
                return JsonResponse({
                    'success': False,
                    'message': f'Rol no válido: {rol}'
                })
        
        # Obtener el usuario y su perfil
        usuario = User.objects.get(id=usuario_id)
        perfil = usuario.userprofile
        
        # Verificar si el usuario es profesor y tiene asignaciones activas
        roles_actuales = [role.role for role in perfil.get_roles()]
        
        # Si el usuario actualmente es profesor y se le está quitando ese rol
        if 'profesor' in roles_actuales and 'profesor' not in nuevos_roles:
            # Verificar si tiene asignaciones activas
            try:
                profesor = Profesor.objects.get(usuario=perfil)
                asignaciones_activas = CursoAsignatura.objects.filter(profesor=profesor)
                cursos_como_jefe = Curso.objects.filter(profesor_jefe=profesor)
                
                if asignaciones_activas.exists() or cursos_como_jefe.exists():
                    return JsonResponse({
                        'success': False,
                        'message': 'No se puede quitar el rol de profesor porque tiene asignaciones activas o es profesor jefe de un curso. Primero debe reasignar estas responsabilidades.'
                    })
            except Profesor.DoesNotExist:
                pass
        
        # Eliminar todos los roles actuales del usuario
        UserRole.objects.filter(user_profile=perfil).delete()
        
        # Crear los nuevos roles
        for rol in nuevos_roles:
            UserRole.objects.create(user_profile=perfil, role=rol)
        
        # Actualizar el campo role principal (para compatibilidad)
        # Usar el primer rol como principal
        perfil.role = nuevos_roles[0]
        
        # Manejar permisos de staff
        if 'administrativo' in nuevos_roles:
            usuario.is_staff = True
        elif 'administrativo' in roles_actuales and 'administrativo' not in nuevos_roles:
            usuario.is_staff = False
        
        perfil.save()
        usuario.save()
        
        # Obtener los nombres de display de los nuevos roles
        roles_display = [dict(UserProfile.ROLES)[rol] for rol in nuevos_roles]
        
        return JsonResponse({
            'success': True,
            'message': 'Roles actualizados exitosamente',
            'nuevos_roles_display': roles_display
        })
        
    except User.DoesNotExist:
        return JsonResponse({
            'success': False,
            'message': 'Usuario no encontrado'
        })
    except Exception as e:
        return JsonResponse({
            'success': False,
            'message': f'Error al cambiar los roles: {str(e)}'
        })
   
@login_required
def perfil_usuario(request):
    user = request.user
    try:
        user_profile = user.userprofile
        context = {
            'user': user,
            'user_profile': user_profile,
            'role_display': user_profile.get_role_display(),
            'role_specific_data': {}
        }
        
        # Agregar datos específicos según el rol
        if user_profile.role == 'profesor':
            try:
                profesor = Profesor.objects.get(usuario=user_profile)
                context['role_specific_data']['es_jefe'] = profesor.jefe
            except Profesor.DoesNotExist:
                pass
        elif user_profile.role == 'alumno':
            try:
                alumno = Alumno.objects.get(usuario=user_profile)
                context['role_specific_data'].update({
                    'rut': alumno.rut,
                    'curso': alumno.curso.nombre if alumno.curso else 'Sin curso asignado'
                })
            except Alumno.DoesNotExist:
                pass
        elif user_profile.role == 'administrativo':
            try:
                admin = Administrativo.objects.get(usuario=user_profile)
                context['role_specific_data']['cargo'] = admin.cargo
            except Administrativo.DoesNotExist:
                pass
        
        return render(request, 'perfil.html', context)
    except UserProfile.DoesNotExist:
        messages.error(request, "No se encontró el perfil de usuario")
        return redirect('inicio')
    
@login_required
def actualizar_nombre_usuario(request):
    if request.method == 'POST':
        try:
            nuevo_nombre = request.POST.get('nuevo_nombre')
            user = request.user
            user.first_name = nuevo_nombre
            user.save()
            return JsonResponse({'success': True})
        except Exception as e:
            return JsonResponse({'success': False, 'error': str(e)})
    return JsonResponse({'success': False, 'error': 'Método no permitido'})

@login_required
def actualizar_apellido_usuario(request):
    if request.method == 'POST':
        try:
            nuevo_apellido = request.POST.get('nuevo_apellido')
            user = request.user
            user.last_name = nuevo_apellido
            user.save()
            return JsonResponse({'success': True})
        except Exception as e:
            return JsonResponse({'success': False, 'error': str(e)})
    return JsonResponse({'success': False, 'error': 'Método no permitido'})

@login_required
def actualizar_email_usuario(request):
    if request.method == 'POST':
        try:
            nuevo_email = request.POST.get('nuevo_email')
            user = request.user
            user.email = nuevo_email
            user.save()
            return JsonResponse({'success': True})
        except Exception as e:
            return JsonResponse({'success': False, 'error': str(e)})
    return JsonResponse({'success': False, 'error': 'Método no permitido'})

@login_required
def actualizar_foto_usuario(request):
    if request.method == 'POST' and request.FILES.get('foto'):
        try:
            user_profile = request.user.userprofile
            
            # Si ya existe una foto y no es la default, la eliminamos
            if user_profile.foto and hasattr(user_profile.foto, 'url'):
                try:
                    if os.path.exists(user_profile.foto.path):
                        os.remove(user_profile.foto.path)
                except Exception as e:
                    print(f"Error al eliminar la foto anterior: {e}")
            
            # Guardamos la nueva foto
            nueva_foto = request.FILES['foto']
            user_profile.foto = nueva_foto
            user_profile.save()
            
            return JsonResponse({
                'success': True,
                'new_url': user_profile.foto.url
            })
        except Exception as e:
            return JsonResponse({
                'success': False,
                'error': str(e)
            })
    return JsonResponse({
        'success': False,
        'error': 'No se proporcionó ninguna imagen'
    })

@login_required
def actualizar_password_usuario(request):
    if request.method == 'POST':
        try:
            current_password = request.POST.get('current_password')
            new_password1 = request.POST.get('new_password1')
            new_password2 = request.POST.get('new_password2')

            user = request.user

            # Validaciones
            if not user.check_password(current_password):
                return JsonResponse({
                    'success': False,
                    'error': 'La contraseña actual es incorrecta'
                })

            if new_password1 != new_password2:
                return JsonResponse({
                    'success': False,
                    'error': 'Las nuevas contraseñas no coinciden'
                })

            if len(new_password1) < 8:
                return JsonResponse({
                    'success': False,
                    'error': 'La contraseña debe tener al menos 8 caracteres'
                })

            user.set_password(new_password1)
            user.save()

            # Actualizar la sesión para que el usuario no sea desconectado
            update_session_auth_hash(request, user)

            return JsonResponse({
                'success': True,
                'message': 'Contraseña actualizada correctamente'
            })
        except Exception as e:
            return JsonResponse({
                'success': False,
                'error': str(e)
            })
    return JsonResponse({'success': False, 'error': 'Método no permitido'})

@login_required
def hero_settings(request):
    """
    Vista para gestionar la configuración del Hero
    """
    hero = HeroSettings.get_or_create_default()

    if request.method == 'POST':
        form = HeroSettingsForm(request.POST, request.FILES, instance=hero)
        if form.is_valid():
            new_instance = form.save()
            
            # Manejar múltiples imágenes adicionales
            additional_images = request.FILES.getlist('additional_images')
            if additional_images:
                # Obtener el último orden para nuevas imágenes
                last_order = HeroImage.objects.filter(hero_settings=new_instance).aggregate(
                    max_order=Max('order')
                )['max_order'] or -1
                
                for i, image_file in enumerate(additional_images):
                    # Validar cada imagen individual
                    if image_file.size > 5 * 1024 * 1024:  # 5MB
                        continue  # Saltar imágenes muy grandes
                    
                    HeroImage.objects.create(
                        hero_settings=new_instance,
                        image=image_file,
                        order=last_order + i + 1
                    )
            
            # Si es una petición AJAX, devolver JSON
            if request.headers.get('X-Requested-With') == 'XMLHttpRequest':
                return JsonResponse({
                    'success': True,
                    'message': 'Configuración del Hero guardada exitosamente',
                    'hero_image_url': new_instance.background_image_url,
                    'total_images': len(new_instance.get_all_images)
                })
            
            # Si no es AJAX, redirigir como antes
            messages.success(request, 'Configuración del Hero guardada exitosamente')
            return redirect('hero_settings')
        else:
            # Si hay errores en el formulario y es AJAX
            if request.headers.get('X-Requested-With') == 'XMLHttpRequest':
                return JsonResponse({
                    'success': False,
                    'message': 'Error al guardar la configuración del Hero',
                    'errors': form.errors
                })

    else:
        form = HeroSettingsForm(instance=hero)

    # Obtener imágenes adicionales para mostrar en el template
    additional_images = HeroImage.objects.filter(hero_settings=hero).order_by('order')

    context = {
        'hero': hero,
        'form': form,
        'additional_images': additional_images
    }

    return render(request, 'hero.html', context)

# Vistas para manejar preguntas frecuentes
@login_required
@require_POST
def crear_pregunta_frecuente(request):
    if not request.user.is_superuser:
        return JsonResponse({'success': False, 'message': 'No tienes permisos para realizar esta acción'})
    
    try:
        pregunta = request.POST.get('pregunta', '').strip()
        respuesta = request.POST.get('respuesta', '').strip()
        orden = request.POST.get('orden', 0)
        
        if not pregunta or not respuesta:
            return JsonResponse({'success': False, 'message': 'La pregunta y respuesta son obligatorias'})
        
        # Si no se especifica orden, usar el siguiente disponible
        if not orden or orden == '0':
            max_orden = PreguntaFrecuente.objects.aggregate(Max('orden'))['orden__max'] or 0
            orden = max_orden + 1
        
        pregunta_obj = PreguntaFrecuente.objects.create(
            pregunta=pregunta,
            respuesta=respuesta,
            orden=int(orden)
        )
        
        return JsonResponse({
            'success': True,
            'message': 'Pregunta frecuente creada exitosamente',
            'pregunta_id': pregunta_obj.id,
            'pregunta': pregunta_obj.pregunta,
            'respuesta': pregunta_obj.respuesta,
            'orden': pregunta_obj.orden,
            'activa': pregunta_obj.activa
        })
        
    except Exception as e:
        return JsonResponse({'success': False, 'message': f'Error al crear la pregunta: {str(e)}'})


@login_required
@require_POST
def actualizar_pregunta_frecuente(request):
    if not request.user.is_superuser:
        return JsonResponse({'success': False, 'message': 'No tienes permisos para realizar esta acción'})
    
    try:
        pregunta_id = request.POST.get('pregunta_id')
        pregunta_texto = request.POST.get('pregunta', '').strip()
        respuesta = request.POST.get('respuesta', '').strip()
        orden = request.POST.get('orden', 0)
        activa = request.POST.get('activa') == 'true'
        
        if not pregunta_id:
            return JsonResponse({'success': False, 'message': 'ID de pregunta no proporcionado'})
        
        if not pregunta_texto or not respuesta:
            return JsonResponse({'success': False, 'message': 'La pregunta y respuesta son obligatorias'})
        
        pregunta_obj = get_object_or_404(PreguntaFrecuente, id=pregunta_id)
        
        pregunta_obj.pregunta = pregunta_texto
        pregunta_obj.respuesta = respuesta
        pregunta_obj.orden = int(orden) if orden else 0
        pregunta_obj.activa = activa
        pregunta_obj.save()
        
        return JsonResponse({
            'success': True,
            'message': 'Pregunta frecuente actualizada exitosamente',
            'pregunta_id': pregunta_obj.id,
            'pregunta': pregunta_obj.pregunta,
            'respuesta': pregunta_obj.respuesta,
            'orden': pregunta_obj.orden,
            'activa': pregunta_obj.activa
        })
        
    except Exception as e:
        return JsonResponse({'success': False, 'message': f'Error al actualizar la pregunta: {str(e)}'})


@login_required
@require_POST
def eliminar_pregunta_frecuente(request):
    if not request.user.is_superuser:
        return JsonResponse({'success': False, 'message': 'No tienes permisos para realizar esta acción'})
    
    try:
        pregunta_id = request.POST.get('pregunta_id')
        
        if not pregunta_id:
            return JsonResponse({'success': False, 'message': 'ID de pregunta no proporcionado'})
        
        pregunta_obj = get_object_or_404(PreguntaFrecuente, id=pregunta_id)
        pregunta_obj.delete()
        
        return JsonResponse({
            'success': True,
            'message': 'Pregunta frecuente eliminada exitosamente'
        })
        
    except Exception as e:
        return JsonResponse({'success': False, 'message': f'Error al eliminar la pregunta: {str(e)}'})


@login_required
def obtener_pregunta_frecuente(request, pregunta_id):
    if not request.user.is_superuser:
        return JsonResponse({'success': False, 'message': 'No tienes permisos para realizar esta acción'})
    
    try:
        pregunta_obj = get_object_or_404(PreguntaFrecuente, id=pregunta_id)
        
        return JsonResponse({
            'success': True,
            'pregunta_id': pregunta_obj.id,
            'pregunta': pregunta_obj.pregunta,
            'respuesta': pregunta_obj.respuesta,
            'orden': pregunta_obj.orden,
            'activa': pregunta_obj.activa
        })
        
    except Exception as e:
        return JsonResponse({'success': False, 'message': f'Error al obtener la pregunta: {str(e)}'})




              



def actualizar_whatsapp_colegio(request):
    print('guardando número de WhatsApp')
    nuevo = request.POST.get('nuevo_whatsapp')

    # Obtener o crear la configuración de apariencia
    appearance_settings, created = AppearanceSettings.objects.get_or_create(pk=1)
    appearance_settings.whatsapp_number = nuevo
    appearance_settings.save()
    
    return JsonResponse({"success": True})

def actualizar_pais_colegio(request):
    print('guardando país colegio')
    nuevo = request.POST.get('nuevo_pais')

    colegio = Colegio.objects.first()  # Obtener el único objeto del modelo Colegio
    colegio.pais = nuevo
    colegio.save()

    return JsonResponse({'success': True})

def actualizar_region_colegio(request):
    print('guardando región colegio')
    nueva = request.POST.get('nueva_region')

    colegio = Colegio.objects.first()  # Obtener el único objeto del modelo Colegio
    colegio.region = nueva
    colegio.save()

    return JsonResponse({'success': True})

@login_required
def preguntas_frecuentes(request):
    """
    Vista para la página de preguntas frecuentes.
    """
    # Obtener todas las preguntas frecuentes ordenadas por orden
    preguntas_frecuentes = PreguntaFrecuente.objects.all().order_by('orden', 'fecha_creacion')

    context = {
        "preguntas_frecuentes": preguntas_frecuentes
    }

    return render(request, 'faq.html', context)

@login_required
def suscripcion_ia(request):
    """Vista para gestionar la suscripción de IA - Solo para superusuario específico"""
    if not (request.user.is_superuser and request.user.username == 'salgadotomas'):
        messages.error(request, 'No tienes permisos para acceder a esta página.')
        return redirect('inicio')
    
    subscription = ColegioSubscription.get_instance()
    
    if request.method == 'POST':
        from colegio.forms import ColegioSubscriptionForm
        form = ColegioSubscriptionForm(request.POST, instance=subscription)
        if form.is_valid():
            form.save()
            
            if request.headers.get('X-Requested-With') == 'XMLHttpRequest':
                return JsonResponse({
                    'success': True,
                    'message': 'Configuración de IA guardada exitosamente'
                })
            
            messages.success(request, 'Configuración de IA guardada exitosamente')
            return redirect('suscripcion_ia')
        else:
            if request.headers.get('X-Requested-With') == 'XMLHttpRequest':
                return JsonResponse({
                    'success': False,
                    'message': 'Error al guardar la configuración',
                    'errors': form.errors
                })
    else:
        from colegio.forms import ColegioSubscriptionForm
        form = ColegioSubscriptionForm(instance=subscription)

    context = {
        'subscription': subscription,
        'form': form
    }

    return render(request, 'suscripcion_ia.html', context)


@login_required
def configuracion_redes_sociales(request):
    """Vista para configurar las URLs de redes sociales"""
    apariencia = AppearanceSettings.objects.first()
    if not apariencia:
        apariencia = AppearanceSettings.objects.create()

    if request.method == 'POST':
        # Solo actualizar los campos de redes sociales
        facebook_url = request.POST.get('facebook_url', '').strip()
        twitter_url = request.POST.get('twitter_url', '').strip()
        instagram_url = request.POST.get('instagram_url', '').strip()
        youtube_url = request.POST.get('youtube_url', '').strip()
        
        # Actualizar solo si se proporcionaron valores
        if facebook_url:
            apariencia.facebook_url = facebook_url
        elif facebook_url == '':
            apariencia.facebook_url = None
            
        if twitter_url:
            apariencia.twitter_url = twitter_url
        elif twitter_url == '':
            apariencia.twitter_url = None
            
        if instagram_url:
            apariencia.instagram_url = instagram_url
        elif instagram_url == '':
            apariencia.instagram_url = None
            
        if youtube_url:
            apariencia.youtube_url = youtube_url
        elif youtube_url == '':
            apariencia.youtube_url = None
        
        apariencia.save()
        messages.success(request, 'Configuración de redes sociales actualizada correctamente.')
        return redirect('configuracion_redes_sociales')

    context = {
        'apariencia': apariencia,
        'current_section': 'redes_sociales'
    }

    return render(request, 'redes_sociales.html', context)


def obtener_asignaturas_disponibles(request):
    if request.method == 'POST':
        curso_id = request.POST.get('cursoId')
        
        try:
            curso = Curso.objects.get(id=curso_id)
            # Obtener asignaturas ya asignadas al curso
            asignaturas_asignadas = CursoAsignatura.objects.filter(curso=curso).values_list('asignatura_id', flat=True)
            
            # Obtener asignaturas disponibles (no asignadas al curso)
            asignaturas_disponibles = Asignatura.objects.exclude(id__in=asignaturas_asignadas)
            
            # Convertir a lista de diccionarios
            asignaturas_data = [{'id': asig.id, 'nombre': asig.nombre} for asig in asignaturas_disponibles]
            
            return JsonResponse({'success': True, 'asignaturas_disponibles': asignaturas_data})
        except Curso.DoesNotExist:
            return JsonResponse({'success': False, 'error': 'Curso no encontrado'})
    else:
        return JsonResponse({'success': False, 'error': 'Método no permitido'})

def obtener_roles_usuario(request, usuario_id):
    """Vista para obtener los roles actuales de un usuario"""
    try:
        usuario = User.objects.get(id=usuario_id)
        perfil = usuario.userprofile
        
        # Obtener roles del nuevo sistema
        roles_nuevos = UserRole.objects.filter(user_profile=perfil).values_list('role', flat=True)
        
        # Si no hay roles en el nuevo sistema, usar el rol del campo legacy
        if not roles_nuevos.exists():
            roles = [perfil.role] if perfil.role else []
        else:
            roles = list(roles_nuevos)
        
        return JsonResponse({
            'success': True,
            'roles': roles
        })
        
    except User.DoesNotExist:
        return JsonResponse({
            'success': False,
            'message': 'Usuario no encontrado'
        })
    except Exception as e:
        return JsonResponse({
            'success': False,
            'message': f'Error al obtener roles: {str(e)}'
        })
    
@login_required
def crear_menu_item(request):
    if request.method == 'POST':
        try:
            menu_principal = Menu.objects.first()
            if not menu_principal:
                menu_principal = Menu.objects.create(nombre='Menu Principal')

            # Obtener el último orden y agregar 1
            ultimo_orden = MenuItem.objects.filter(menu=menu_principal).aggregate(
                Max('orden'))['orden__max'] or 0
            nuevo_orden = ultimo_orden + 1

            nuevo_item = MenuItem(
                nombre=request.POST.get('nombre'),
                url=request.POST.get('url'),
                orden=nuevo_orden,  # Asignar el nuevo orden automáticamente
                es_mega_menu=request.POST.get('es_mega_menu') == 'on',
                solo_usuarios_logueados=request.POST.get('solo_usuarios_logueados') == 'on',
                menu=menu_principal
            )
            nuevo_item.save()
            return JsonResponse({'success': True, 'id': nuevo_item.id})
        except Exception as e:
            return JsonResponse({'success': False, 'error': str(e)}, status=400)
    return JsonResponse({'success': False, 'error': 'Método no permitido'}, status=405)

@login_required
def obtener_menu_item(request, item_id):
    try:
        item = MenuItem.objects.get(id=item_id)
        data = {
            'id': item.id,
            'nombre': item.nombre,
            'url': item.url,
            'es_mega_menu': item.es_mega_menu,
            'solo_usuarios_logueados': item.solo_usuarios_logueados,
            'orden': item.orden
        }
        return JsonResponse(data)
    except MenuItem.DoesNotExist:
        return JsonResponse({'error': 'Item no encontrado'}, status=404)

@login_required
def actualizar_menu_item(request, item_id):
    if request.method == 'POST':
        try:
            item = MenuItem.objects.get(id=item_id)
            
            # Si la solicitud solo contiene el campo orden
            if 'orden' in request.POST:
                nuevo_orden = request.POST.get('orden')
                try:
                    item.orden = int(nuevo_orden)
                    item.save()
                    return JsonResponse({'success': True})
                except ValueError:
                    return JsonResponse({'error': 'Orden inválido'}, status=400)
            
            # Si es una actualización normal de otros campos
            item.nombre = request.POST.get('nombre')
            item.url = request.POST.get('url')
            item.es_mega_menu = request.POST.get('es_mega_menu') == 'on'
            item.solo_usuarios_logueados = request.POST.get('solo_usuarios_logueados') == 'on'
            item.save()
            return JsonResponse({'success': True})
            
        except MenuItem.DoesNotExist:
            return JsonResponse({'error': 'Item no encontrado'}, status=404)
        except Exception as e:
            return JsonResponse({'error': str(e)}, status=400)
    return JsonResponse({'error': 'Método no permitido'}, status=405)

@login_required
def eliminar_menu_item(request, item_id):
    if request.method == 'POST':
        try:
            item = MenuItem.objects.get(id=item_id)
            item.delete()
            return JsonResponse({'success': True})
        except MenuItem.DoesNotExist:
            return JsonResponse({'error': 'Item no encontrado'}, status=404)
    return JsonResponse({'error': 'Método no permitido'}, status=405)


def actualizar_logo_colegio(request):
    if request.method == 'POST':
        # Verificar que el usuario tenga permisos (staff o superuser)
        if not (request.user.is_staff or request.user.is_superuser):
            return JsonResponse({'success': False, 'error': 'No tiene permisos para realizar esta acción'})
        
        try:
            logo_file = request.FILES.get('logo')
            
            if not logo_file:
                return JsonResponse({'success': False, 'error': 'No se recibió ningún archivo'})
            
            # Validar el tipo de archivo
            allowed_types = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif']
            if logo_file.content_type not in allowed_types:
                return JsonResponse({'success': False, 'error': 'Tipo de archivo no permitido'})
            
            # Validar el tamaño del archivo (2MB máximo)
            if logo_file.size > 2 * 1024 * 1024:
                return JsonResponse({'success': False, 'error': 'El archivo es demasiado grande'})
            
            colegio = Colegio.objects.first()
            if not colegio:
                return JsonResponse({'success': False, 'error': 'No se encontró información del colegio'})
            
            # Eliminar el logo anterior si existe
            if colegio.logo:
                colegio.logo.delete(save=False)
            
            # Guardar el nuevo logo
            colegio.logo = logo_file
            colegio.save()
            
            return JsonResponse({
                'success': True, 
                'logo_url': colegio.logo.url if colegio.logo else None
            })
            
        except Exception as e:
            return JsonResponse({'success': False, 'error': str(e)})
    
    return JsonResponse({'success': False, 'error': 'Método no permitido'})

def eliminar_logo_colegio(request):
    if request.method == 'POST':
        # Verificar que el usuario sea superuser
        if not request.user.is_superuser:
            return JsonResponse({'success': False, 'error': 'No tiene permisos para realizar esta acción'})
        
        try:
            colegio = Colegio.objects.first()
            if not colegio:
                return JsonResponse({'success': False, 'error': 'No se encontró información del colegio'})
            
            if not colegio.logo:
                return JsonResponse({'success': False, 'error': 'No hay logo para eliminar'})
            
            # Eliminar el archivo del logo
            colegio.logo.delete(save=False)
            colegio.logo = None
            colegio.save()
            
            return JsonResponse({'success': True, 'message': 'Logo eliminado correctamente'})
            
        except Exception as e:
            return JsonResponse({'success': False, 'error': str(e)})
    
    return JsonResponse({'success': False, 'error': 'Método no permitido'})


def calendario_configuracion(request):
    cursos = Curso.objects.all()
    context = {
        "cursos": cursos,
    }
    return render(request, 'calendario_evaluaciones.html', context)



def obtener_usuarios_disponibles(request):
    if request.method == 'GET':
        # IDs de UserProfile ya asignados como profesor_jefe en algún curso
        from colegio.models import UserProfile, UserRole, Curso
        profesores_jefe_ids = Curso.objects.exclude(profesor_jefe=None).values_list('profesor_jefe_id', flat=True)

        # Usuarios con rol 'profesor' (en campo role o en UserRole)
        profesores_por_rol = UserProfile.objects.filter(role='profesor')
        profesores_por_userrole = UserProfile.objects.filter(roles__role='profesor')
        profesores = (profesores_por_rol | profesores_por_userrole).distinct()

        # Excluir los que ya son profesor_jefe
        usuarios_disponibles = profesores.exclude(id__in=profesores_jefe_ids)

        # Serializa los objetos UserProfile a JSON
        usuarios = [{'id': usuario.user.id, 'username': usuario.user.username} for usuario in usuarios_disponibles]

        # Devuelve los usuarios en formato JSON
        return JsonResponse({'success': True, 'usuarios': usuarios}, safe=False)
    else:
        # Maneja el caso si no es una solicitud GET
        data = {
            'success': False,
            'message': 'Método no permitido'
        }
        return JsonResponse(data)
    

def dame_asignatura(request):
    if request.method == 'POST':
        asignatura_id = request.POST.get('asignaturaId')
        curso_id = request.POST.get('cursoId')
        # Ahora puedes realizar acciones con las variables recibidas
        # y devolver una respuesta JSON si es necesario
        try:
            asignatura = CursoAsignatura.objects.get(Q(asignatura_id=asignatura_id), Q(curso_id=curso_id))
            if asignatura.profesor:
                profesor_nombre = asignatura.profesor.user.first_name
            else:
                profesor_nombre = 'profesor no asignado'
            # Convierte el objeto UserProfile en un diccionario
            profesor_data = {
                'nombre': profesor_nombre
            }

            return JsonResponse({'success': True, 'profesor': profesor_data})
        except CursoAsignatura.DoesNotExist:
            return JsonResponse({'success': False, 'error': 'Asignatura no encontrada'})
    else:
        response_data = {'success': False}
        return JsonResponse(response_data)
    

@login_required
@require_POST
def toggle_superuser(request):
    try:
        usuario_id = request.POST.get('usuario_id')
        
        # Imprimir datos recibidos para depuración
        print("Datos recibidos:", request.POST)
        print("usuario_id:", usuario_id)
        
        if not usuario_id:
            return JsonResponse({
                'success': False,
                'message': 'ID de usuario requerido'
            })
            
        # Verificar que el usuario actual sea superuser
        if not request.user.is_superuser:
            return JsonResponse({
                'success': False,
                'message': 'No tienes permisos para realizar esta acción'
            })
            
        # Obtener el usuario
        usuario = User.objects.get(id=usuario_id)
        
        # No permitir que un usuario se quite sus propios permisos de superuser
        if usuario == request.user:
            return JsonResponse({
                'success': False,
                'message': 'No puedes modificar tus propios permisos de superuser'
            })
        
        # Toggle del estado de superuser
        usuario.is_superuser = not usuario.is_superuser
        usuario.save()
        
        accion = "otorgados" if usuario.is_superuser else "removidos"
        
        return JsonResponse({
            'success': True,
            'message': f'Permisos de superuser {accion} exitosamente para {usuario.first_name} {usuario.last_name}',
            'is_superuser': usuario.is_superuser
        })
        
    except User.DoesNotExist:
        return JsonResponse({
            'success': False,
            'message': 'Usuario no encontrado'
        })
    except Exception as e:
        return JsonResponse({
            'success': False,
            'message': f'Error al cambiar el estado de superuser: {str(e)}'
        })

@login_required
def usuario_detalles(request, user_id):
    """
    Vista para obtener los detalles completos de un usuario
    """
    try:
        user = get_object_or_404(User, id=user_id)
        user_profile = get_object_or_404(UserProfile, user=user)
        
        # Datos básicos del usuario
        user_data = {
            'id': user.id,
            'username': user.username,
            'first_name': user.first_name,
            'last_name': user.last_name,
            'email': user.email,
            'is_active': user.is_active,
            'is_staff': user.is_staff,
            'is_superuser': user.is_superuser,
            'date_joined': user.date_joined.isoformat() if user.date_joined else None,
            'last_login': user.last_login.isoformat() if user.last_login else None,
            'role': user_profile.role,
            'role_display': user_profile.get_role_display(),
            'foto': user_profile.foto.url if user_profile.foto else None,
        }
        
        # Información específica según el rol
        role_info = {}
        
        try:
            if user_profile.role == 'profesor':
                profesor = Profesor.objects.get(usuario=user_profile)
                role_info = {
                    'jefe': profesor.jefe
                }
        except Profesor.DoesNotExist:
            if user_profile.role == 'profesor':
                role_info = {'jefe': False}
        
        try:
            if user_profile.role == 'administrativo':
                administrativo = Administrativo.objects.get(usuario=user_profile)
                role_info = {
                    'cargo': administrativo.cargo
                }
        except Administrativo.DoesNotExist:
            pass
        
        try:
            if user_profile.role == 'asistente':
                asistente = Asistente.objects.get(usuario=user_profile)
                role_info = {
                    'area': asistente.area
                }
        except Asistente.DoesNotExist:
            pass
        
        try:
            if user_profile.role == 'alumno':
                alumno = Alumno.objects.get(usuario=user_profile)
                role_info = {
                    'rut': alumno.rut,
                    'curso': str(alumno.curso) if alumno.curso else None
                }
        except Alumno.DoesNotExist:
            pass
        
        try:
            if user_profile.role == 'apoderado':
                apoderado = Apoderado.objects.get(usuario=user_profile)
                alumnos = [f"{alumno.usuario.user.first_name} {alumno.usuario.user.last_name}" 
                          for alumno in apoderado.alumnos.all()]
                role_info = {
                    'alumnos': alumnos
                }
        except Apoderado.DoesNotExist:
            pass
        
        user_data['role_info'] = role_info
        
        return JsonResponse({
            'success': True,
            'user': user_data
        })
        
    except Exception as e:
        return JsonResponse({
            'success': False,
            'message': f'Error al obtener los detalles del usuario: {str(e)}'
        })


def login_view(request):
    if request.method == 'POST':
        print('iniciando sesion')
        username = request.POST['username']
        password = request.POST['password']
        user = authenticate(request, username=username, password=password)
        if user is not None:
            login(request, user)
            return redirect('inicio')  # Redirige a la página de inicio después del login
        else:
            messages.error(request, 'Usuario o contraseña incorrectos')
    
    return render(request, 'registration/login.html')

@require_POST
@csrf_exempt
def logout_view(request):
    logout(request)
    return JsonResponse({'success': True})

def auth_div(request):
    """Devuelve solo el HTML del div de autenticación"""
    return render(request, 'auth_div.html')
