"""
Custom permissions for products API.
"""
from rest_framework import permissions


class IsAdminOrManagerOrReadOnly(permissions.BasePermission):
    """
    Custom permission to only allow administrators and managers to edit products.
    Regular users can only read products.
    """
    
    def has_permission(self, request, view):
        # Read permissions are allowed for any authenticated user
        if request.method in permissions.SAFE_METHODS:
            return True
        
        # Write permissions are only allowed for authenticated users with admin or manager role
        return (
            request.user and 
            request.user.is_authenticated and 
            request.user.role in ['admin', 'manager']
        )


class IsAdminOrManager(permissions.BasePermission):
    """
    Permission that only allows administrators and managers to access the view.
    """
    
    def has_permission(self, request, view):
        return (
            request.user and 
            request.user.is_authenticated and 
            request.user.role in ['admin', 'manager']
        )