"""
Address suggestions API using Dadata service.
"""
import requests
from django.conf import settings
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework import status


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def get_address_suggestions(request):
    """
    Get address suggestions from Dadata API.
    """
    query = request.data.get('query', '').strip()
    
    if not query or len(query) < 3:
        return Response({
            'suggestions': []
        })
    
    # Dadata API key from settings
    api_key = getattr(settings, 'DADATA_API_KEY', None)
    
    if not api_key:
        return Response({
            'error': 'Dadata API key not configured'
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
    
    try:
        # Make request to Dadata API
        response = requests.post(
            'https://suggestions.dadata.ru/suggestions/api/4_1/rs/suggest/address',
            headers={
                'Content-Type': 'application/json',
                'Accept': 'application/json',
                'Authorization': f'Token {api_key}'
            },
            json={
                'query': query,
                'count': 5,
                'locations': [{'country': '*'}]
            },
            timeout=10
        )
        
        if response.status_code == 200:
            data = response.json()
            return Response({
                'suggestions': data.get('suggestions', [])
            })
        else:
            return Response({
                'error': f'Dadata API error: {response.status_code}',
                'suggestions': []
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
            
    except requests.exceptions.RequestException as e:
        return Response({
            'error': f'Request failed: {str(e)}',
            'suggestions': []
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)