"""
Views for integrations app.
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
from .yookassa_service import YooKassaService, PaymentError
from .cdek_service import CDEKService, CDEKError
from .models import DeliveryRequest

logger = logging.getLogger(__name__)


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def create_payment(request):
    """Create payment for order."""
    try:
        order_id = request.data.get('order_id')
        return_url = request.data.get('return_url')
        
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
        
        # Create payment
        yookassa_service = YooKassaService()
        payment_data = yookassa_service.create_payment(order, return_url)
        
        return Response({
            'payment_id': payment_data['id'],
            'confirmation_url': payment_data['confirmation']['confirmation_url'],
            'amount': payment_data['amount']['value'],
            'currency': payment_data['amount']['currency']
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


@csrf_exempt
@require_http_methods(["POST"])
def yookassa_webhook(request):
    """Handle YooKassa webhook notifications."""
    try:
        # Parse webhook data
        webhook_data = json.loads(request.body.decode('utf-8'))
        
        # Process webhook
        yookassa_service = YooKassaService()
        success = yookassa_service.process_webhook(webhook_data)
        
        if success:
            return HttpResponse(status=200)
        else:
            return HttpResponse(status=400)
            
    except json.JSONDecodeError:
        logger.error("Invalid JSON in webhook request")
        return HttpResponse(status=400)
    except Exception as e:
        logger.error(f"Webhook processing error: {str(e)}")
        return HttpResponse(status=500)


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def payment_status(request, payment_id):
    """Get payment status."""
    try:
        yookassa_service = YooKassaService()
        payment_data = yookassa_service.get_payment_status(payment_id)
        
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


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def calculate_delivery_cost(request):
    """Calculate delivery cost using CDEK."""
    try:
        to_address = request.data.get('address')
        weight = request.data.get('weight', 1.0)
        dimensions = request.data.get('dimensions', {})
        
        if not to_address:
            return Response(
                {'error': 'Address is required'}, 
                status=status.HTTP_400_BAD_REQUEST
            )
        
        cdek_service = CDEKService()
        cost_data = cdek_service.calculate_delivery_cost(
            from_location='Москва',  # Store location
            to_location=to_address,
            weight=weight,
            dimensions=dimensions
        )
        
        return Response(cost_data)
        
    except CDEKError as e:
        logger.error(f"CDEK delivery cost calculation error: {str(e)}")
        return Response(
            {'error': str(e)}, 
            status=status.HTTP_400_BAD_REQUEST
        )
    except Exception as e:
        logger.error(f"Unexpected error in calculate_delivery_cost: {str(e)}")
        return Response(
            {'error': 'Произошла ошибка при расчете стоимости доставки'}, 
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def find_pickup_points(request):
    """Find CDEK pickup points by address."""
    try:
        address = request.GET.get('address')
        limit = int(request.GET.get('limit', 10))
        
        if not address:
            return Response(
                {'error': 'Address parameter is required'}, 
                status=status.HTTP_400_BAD_REQUEST
            )
        
        cdek_service = CDEKService()
        pickup_points = cdek_service.find_pickup_points(address, limit)
        
        return Response({'pickup_points': pickup_points})
        
    except CDEKError as e:
        logger.error(f"CDEK pickup points search error: {str(e)}")
        return Response(
            {'error': str(e)}, 
            status=status.HTTP_400_BAD_REQUEST
        )
    except Exception as e:
        logger.error(f"Unexpected error in find_pickup_points: {str(e)}")
        return Response(
            {'error': 'Произошла ошибка при поиске пунктов выдачи'}, 
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def create_delivery_order(request):
    """Create delivery order in CDEK."""
    try:
        order_id = request.data.get('order_id')
        pickup_point_code = request.data.get('pickup_point_code')
        
        if not order_id or not pickup_point_code:
            return Response(
                {'error': 'Order ID and pickup point code are required'}, 
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Get order and verify ownership
        order = get_object_or_404(Order, id=order_id, user=request.user)
        
        if order.status != 'paid':
            return Response(
                {'error': 'Order must be paid before creating delivery'}, 
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Check if delivery already exists
        if DeliveryRequest.objects.filter(order=order).exists():
            return Response(
                {'error': 'Delivery order already exists for this order'}, 
                status=status.HTTP_400_BAD_REQUEST
            )
        
        cdek_service = CDEKService()
        delivery_data = cdek_service.create_delivery_order(order, pickup_point_code)
        
        # Update order status
        order.status = 'processing'
        order.delivery_tracking = delivery_data['cdek_order_id']
        order.save()
        
        return Response(delivery_data)
        
    except CDEKError as e:
        logger.error(f"CDEK delivery order creation error: {str(e)}")
        return Response(
            {'error': str(e)}, 
            status=status.HTTP_400_BAD_REQUEST
        )
    except Exception as e:
        logger.error(f"Unexpected error in create_delivery_order: {str(e)}")
        return Response(
            {'error': 'Произошла ошибка при создании заказа доставки'}, 
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def delivery_status(request, delivery_id):
    """Get delivery status."""
    try:
        # Get delivery request and verify ownership
        delivery_request = get_object_or_404(
            DeliveryRequest, 
            id=delivery_id, 
            order__user=request.user
        )
        
        cdek_service = CDEKService()
        status_data = cdek_service.get_delivery_status(delivery_request.cdek_order_id)
        
        # Update local status if changed
        if status_data['status'] != delivery_request.status:
            delivery_request.status = status_data['status']
            if status_data.get('tracking_number'):
                delivery_request.tracking_number = status_data['tracking_number']
            delivery_request.save()
        
        return Response({
            'delivery_id': delivery_request.id,
            'order_number': delivery_request.order.order_number,
            'status': status_data['status'],
            'cdek_status': status_data['cdek_status'],
            'tracking_number': status_data.get('tracking_number'),
            'pickup_point': delivery_request.pickup_point,
            'updated_at': status_data.get('updated_at')
        })
        
    except CDEKError as e:
        logger.error(f"CDEK delivery status error: {str(e)}")
        return Response(
            {'error': str(e)}, 
            status=status.HTTP_400_BAD_REQUEST
        )
    except Exception as e:
        logger.error(f"Unexpected error in delivery_status: {str(e)}")
        return Response(
            {'error': 'Произошла ошибка при получении статуса доставки'}, 
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )


@csrf_exempt
@require_http_methods(["POST"])
def cdek_webhook(request):
    """Handle CDEK webhook notifications."""
    try:
        # Parse webhook data
        webhook_data = json.loads(request.body.decode('utf-8'))
        
        # Process webhook
        cdek_service = CDEKService()
        success = cdek_service.process_webhook(webhook_data)
        
        if success:
            return HttpResponse(status=200)
        else:
            return HttpResponse(status=400)
            
    except json.JSONDecodeError:
        logger.error("Invalid JSON in CDEK webhook request")
        return HttpResponse(status=400)
    except Exception as e:
        logger.error(f"CDEK webhook processing error: {str(e)}")
        return HttpResponse(status=500)