from rest_framework import status
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import AllowAny, IsAdminUser
from rest_framework.response import Response
from .models import LegalInfo
from .serializers import LegalInfoSerializer


@api_view(['GET'])
@permission_classes([AllowAny])
def get_legal_info(request):
    """
    Публичный эндпоинт: получить юридическую информацию.
    Доступен всем — используется в footer и юридических документах.
    """
    legal_info = LegalInfo.load()
    serializer = LegalInfoSerializer(legal_info)
    return Response(serializer.data)


@api_view(['PUT', 'PATCH'])
@permission_classes([IsAdminUser])
def update_legal_info(request):
    """
    Только для админа: обновить юридическую информацию.
    """
    legal_info = LegalInfo.load()
    serializer = LegalInfoSerializer(
        legal_info,
        data=request.data,
        partial=(request.method == 'PATCH')
    )

    if serializer.is_valid():
        serializer.save()
        return Response(serializer.data)

    return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)