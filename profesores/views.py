from django.shortcuts import render, get_object_or_404
from django.http import JsonResponse
from django.contrib.auth.models import User
from colegio.models import UserProfile, Profesor, Curso, CursoAsignatura
from django.contrib.auth.decorators import login_required
from django.views.decorators.http import require_POST
import os


# Create your views here.
def profesores(request):
    # Obtener todos los profesores
    profesores = UserProfile.objects.filter(role='profesor')
    context = {
        'profesores': profesores,
    }
    
    return render(request, 'profesores.html', context)



@login_required
def crear_profesor(request):
    if request.method == 'POST':
        try:
            # Crear usuario
            user = User.objects.create_user(
                username=request.POST['username'],
                email=request.POST['email'],
                password=request.POST['password'],
                first_name=request.POST['first_name'],
                last_name=request.POST['last_name']
            )

            # Crear perfil de usuario
            user_profile = UserProfile.objects.create(
                user=user,
                role='profesor'
            )

            # Manejar la foto si se proporcionó
            if 'foto' in request.FILES:
                user_profile.foto = request.FILES['foto']
                user_profile.save()

            # Crear profesor
            Profesor.objects.create(usuario=user_profile)
            print('Profesor creado:', user_profile)

            return JsonResponse({
                'success': True,
                'message': 'Profesor creado exitosamente'
            })
        except Exception as e:
            return JsonResponse({
                'success': False,
                'message': str(e)
            }, status=400)

    return JsonResponse({
        'success': False,
        'message': 'Método no permitido'
    }, status=405)


def perfil_profesor(request, id):
    # Obtener el profesor por ID
    profesor = get_object_or_404(Profesor, id=id)
    
    # Obtener cursos donde es profesor jefe
    cursos_jefe = Curso.objects.filter(profesor_jefe=profesor.usuario)
    
    # Obtener asignaturas que imparte
    asignaturas = CursoAsignatura.objects.filter(profesor=profesor.usuario)
    
    # Calcular total de cursos distintos (sin duplicados)
    cursos_distintos = set()
    for asignatura in asignaturas:
        cursos_distintos.add(asignatura.curso.id)
    total_cursos = len(cursos_distintos)
    
    # Puedes agregar más datos según necesites
    
    context = {
        'profesor': profesor,
        'cursos_jefe': cursos_jefe,
        'asignaturas': asignaturas,
        'total_cursos': total_cursos,
        # Años de experiencia podría ser un campo que añadas al modelo o calcules de alguna manera
        'años_experiencia': 5  # valor por defecto
    }
    
    return render(request, 'perfil_profesor.html', context)



@login_required
@require_POST
def eliminar_profesor(request, id):
    # Verificar que el usuario sea superuser
    if not request.user.is_superuser:
        return JsonResponse({
            'success': False,
            'message': 'No tienes permisos para realizar esta acción'
        }, status=403)
    
    try:
        # Obtener el profesor por ID del UserProfile
        profesor_profile = get_object_or_404(UserProfile, id=id, role='profesor')
        
        # Obtener el usuario asociado
        user = profesor_profile.user
        
        # Eliminar la foto asociada si existe
        if profesor_profile.foto and profesor_profile.foto.name:
            try:
                # Verificar que no sea la foto por defecto
                if 'default-profile.png' not in profesor_profile.foto.name:
                    if os.path.exists(profesor_profile.foto.path):
                        os.remove(profesor_profile.foto.path)
            except Exception as e:
                # Si hay error eliminando la foto, continuar con la eliminación del usuario
                print(f"Error eliminando foto: {e}")
        
        # Eliminar el usuario (esto eliminará automáticamente el UserProfile y Profesor por CASCADE)
        user.delete()
        
        return JsonResponse({
            'success': True,
            'message': 'Profesor eliminado exitosamente'
        })
        
    except Exception as e:
        return JsonResponse({
            'success': False,
            'message': f'Error al eliminar profesor: {str(e)}'
        }, status=400)