from django.shortcuts import render, redirect
from django.contrib import messages
from django.conf import settings
from django.core.mail import send_mail
from django.template.loader import render_to_string
from django.utils.html import strip_tags
from colegio.models import Colegio
import os

# Create your views here.

def contacto(request):
    # Obtener información del colegio
    try:
        colegio = Colegio.objects.first()
    except Colegio.DoesNotExist:
        colegio = None
    
    if request.method == 'POST':
        try:
            # Get form data
            nombre = request.POST.get('nombre')
            apellido = request.POST.get('apellido')
            email = request.POST.get('email')
            telefono = request.POST.get('telefono', 'No proporcionado')
            asunto = request.POST.get('asunto')
            mensaje = request.POST.get('mensaje')

            # Validate required fields
            if not all([nombre, apellido, email, asunto, mensaje]):
                messages.error(request, 'Por favor, completa todos los campos obligatorios.')
                return redirect('contacto')

            # Create email content
            html_content = f"""
            <h2>Nuevo mensaje de contacto</h2>
            <p><strong>Nombre:</strong> {nombre} {apellido}</p>
            <p><strong>Email:</strong> {email}</p>
            <p><strong>Teléfono:</strong> {telefono}</p>
            <p><strong>Asunto:</strong> {asunto}</p>
            <p><strong>Mensaje:</strong></p>
            <p>{mensaje}</p>
            """

            # Create plain text version of the email
            plain_message = f"""
            Nuevo mensaje de contacto

            Nombre: {nombre} {apellido}
            Email: {email}
            Teléfono: {telefono}
            Asunto: {asunto}
            Mensaje:
            {mensaje}
            """

            # Get recipient email from Colegio model or fallback options
            try:
                colegio = Colegio.objects.first()
                if colegio and colegio.email:
                    recipient_email = colegio.email
                else:
                    # Fallback to environment variable or default
                    recipient_email = os.getenv('CONTACT_FORM_EMAIL', 'salgadotomas@outlook.com')
            except Colegio.DoesNotExist:
                # Fallback to environment variable or default
                recipient_email = os.getenv('CONTACT_FORM_EMAIL', 'salgadotomas@outlook.com')

            # Send email using Django's send_mail
            send_mail(
                subject=f'Nuevo mensaje de contacto: {asunto}',
                message=plain_message,
                html_message=html_content,
                from_email=settings.DEFAULT_FROM_EMAIL,
                recipient_list=[recipient_email],
                fail_silently=False,
            )
            
            messages.success(request, '¡Gracias por tu mensaje! Te contactaremos pronto.')
            
        except Exception as e:
            print(f"Error al enviar email: {str(e)}")  # Para debug
            messages.error(request, f'Hubo un error al procesar tu solicitud: {str(e)}')

        return redirect('contacto')

    context = {
        'colegio': colegio,
    }
    return render(request, 'contacto.html', context)

def terminos_condiciones(request):
    # Obtener información del colegio
    try:
        colegio = Colegio.objects.first()
    except Colegio.DoesNotExist:
        colegio = None
    
    context = {
        'colegio': colegio,
    }
    return render(request, 'terminos_condiciones.html', context)