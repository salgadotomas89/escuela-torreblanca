from openai import OpenAI
from miproyecto import settings
import os

def get_openai_response(prompt, feature='noticias'):
    """
    Genera una respuesta usando OpenAI GPT.
    Si no hay API key configurada o permisos, retorna None silenciosamente.
    Esto permite que el sistema maneje la falta de IA sin mostrar errores al usuario.
    """
    # Verificar suscripción
    from colegio.models import ColegioSubscription
    subscription = ColegioSubscription.get_instance()
    subscription.reset_monthly_usage()
    
    if not subscription.can_use_openai(feature):
        return None  # Retorna None silenciosamente
    
    api_key = getattr(settings, 'OPENAI_API_KEY', '')
    
    # Debug: imprimir información sobre la API key
    print(f"API Key encontrada: {'Sí' if api_key else 'No'}")
    if api_key:
        print(f"Primeros 10 caracteres: {api_key[:10]}...")
    
    if not api_key:
        return None  # Retorna None silenciosamente
    
    try:
        # Usar la nueva API de OpenAI 1.x
        client = OpenAI(api_key=api_key)
        
        response = client.chat.completions.create(
            model="gpt-3.5-turbo",
            messages=[
                {"role": "user", "content": prompt}
            ],
            max_tokens=150
        )
        
        # Incrementar uso si la llamada fue exitosa
        subscription.increment_usage()
        
        return response.choices[0].message.content.strip()
    except Exception as e:
        # Mostrar el error específico para debugging
        print(f"Error específico de OpenAI: {str(e)}")
        return None  # Retorna None silenciosamente en lugar de mostrar error