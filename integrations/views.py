"""
Views for integrations app - Robokassa payment integration.
"""
import json
import logging
from django.http import JsonResponse, HttpResponse
from django.views.decorators.csrf import csrf_exempt
from django.views.decorators.http import require_http_methods
from django.shortcuts import get_object_or_404
from rest_framework import status
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response

from orders.models import Order
from .robokassa_service import RobokassaService, PaymentError
from .models import PaymentTransaction

logger = logging.getLogger(__name__)


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def create_payment(request):
    """Create payment for order using Robokassa."""
    try:
        order_id = request.data.get('order_id')
        success_url = request.data.get('success_url')
        fail_url = request.data.get('fail_url')
        
        if not order_id:
            return Response(
                {'error': 'Order ID is required'}, 
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Get order and verify ownership
        order = get_object_or_404(Order, id=order_id, user=request.user)
        
        if order.payment_status != 'pending':
            return Response(
                {'error': 'Order is not pending payment'}, 
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Create payment URL
        robokassa_service = RobokassaService()
        
        # Формируем URL'ы для callback'ов
        result_url = request.build_absolute_uri('/api/integrations/webhooks/robokassa/')
        
        payment_data = robokassa_service.create_payment_url(
            order=order,
            result_url=result_url,
            success_url=success_url,
            fail_url=fail_url
        )
        
        return Response({
            'payment_id': payment_data['payment_id'],
            'payment_url': payment_data['payment_url'],
            'amount': payment_data['amount'],
            'currency': payment_data['currency']
        })
        
    except PaymentError as e:
        logger.error(f"Payment creation error: {str(e)}")
        return Response(
            {'error': str(e)}, 
            status=status.HTTP_400_BAD_REQUEST
        )
    except Exception as e:
        logger.error(f"Unexpected error in create_payment: {str(e)}")
        return Response(
            {'error': 'Произошла ошибка при создании платежа'}, 
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def payment_status(request, payment_id):
    """Get payment status."""
    try:
        robokassa_service = RobokassaService()
        payment_data = robokassa_service.get_payment_status(payment_id)
        
        if not payment_data:
            return Response(
                {'error': 'Payment not found'}, 
                status=status.HTTP_404_NOT_FOUND
            )
        
        # Verify user has access to this payment
        order = get_object_or_404(Order, id=payment_data['order_id'], user=request.user)
        
        return Response(payment_data)
        
    except Exception as e:
        logger.error(f"Error getting payment status: {str(e)}")
        return Response(
            {'error': 'Произошла ошибка при получении статуса платежа'}, 
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )


@csrf_exempt
@require_http_methods(["POST", "GET"])
def robokassa_webhook(request):
    """Handle Robokassa ResultURL notifications."""
    try:
        # Robokassa может отправлять данные через POST или GET
        if request.method == 'POST':
            notification_data = request.POST.dict()
        else:
            notification_data = request.GET.dict()
        
        logger.info(f"Robokassa webhook received: {notification_data}")
        
        # Обработка уведомления
        robokassa_service = RobokassaService()
        success = robokassa_service.process_result_notification(notification_data)
        
        if success:
            # Robokassa ожидает ответ вида "OK{InvId}"
            inv_id = notification_data.get('InvId', '')
            return HttpResponse(f"OK{inv_id}", content_type='text/plain')
        else:
            return HttpResponse("ERROR", status=400, content_type='text/plain')
            
    except Exception as e:
        logger.error(f"Robokassa webhook processing error: {str(e)}")
        return HttpResponse("ERROR", status=500, content_type='text/plain')


@csrf_exempt
@require_http_methods(["POST"])
def robokassa_result_url2(request):
    """Handle Robokassa ResultUrl2 notifications (JWS format)."""
    try:
        # ResultUrl2 отправляет JWS токен в теле запроса
        jws_token = request.body.decode('utf-8')
        
        logger.info(f"Robokassa ResultUrl2 received")
        
        # Обработка JWS уведомления
        robokassa_service = RobokassaService()
        success = robokassa_service.process_result_url2_notification(jws_token)
        
        if success:
            return HttpResponse(status=200)
        else:
            return HttpResponse(status=400)
            
    except Exception as e:
        logger.error(f"Robokassa ResultUrl2 processing error: {str(e)}")
        return HttpResponse(status=500)
