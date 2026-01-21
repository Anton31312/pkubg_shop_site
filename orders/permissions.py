"""
Custom permissions for orders app.
"""
from rest_framework import permissions


class IsAdminOrManager(permissions.BasePermission):
    """
    Permission to only allow admins and managers to access.
    """
    
    def has_permission(self, request, view):
        return (
            request.user and 
            request.user.is_authenticated and 
            request.user.role in ['admin', 'manager']
        )


class IsAdminOrManagerOrOwner(permissions.BasePermission):
    """
    Permission to allow admins, managers, or order owner to access.
    """
    
    def has_permission(self, request, view):
        return request.user and request.user.is_authenticated
    
    def has_object_permission(self, request, view, obj):
        # Admins and managers can access any order
        if request.user.role in ['admin', 'manager']:
            return True
        # Users can only access their own orders
        return obj.user == request.user
