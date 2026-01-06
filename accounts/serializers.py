"""
Serializers for accounts app.
"""
from rest_framework import serializers
from django.contrib.auth import get_user_model
from .models import UserProfile

User = get_user_model()


class UserProfileSerializer(serializers.ModelSerializer):
    """Serializer for user profile."""
    
    class Meta:
        model = UserProfile
        fields = ['address', 'birth_date', 'dietary_preferences']


class UserSerializer(serializers.ModelSerializer):
    """Serializer for user data."""
    
    userprofile = UserProfileSerializer(read_only=True)
    
    class Meta:
        model = User
        fields = ['id', 'username', 'email', 'first_name', 'last_name', 'phone', 'role', 'userprofile', 'date_joined']
        read_only_fields = ['id', 'username', 'date_joined']


class UserUpdateSerializer(serializers.ModelSerializer):
    """Serializer for updating user data."""
    
    address = serializers.CharField(source='userprofile.address', required=False, allow_blank=True)
    birth_date = serializers.DateField(source='userprofile.birth_date', required=False, allow_null=True)
    dietary_preferences = serializers.JSONField(source='userprofile.dietary_preferences', required=False)
    
    class Meta:
        model = User
        fields = ['first_name', 'last_name', 'phone', 'address', 'birth_date', 'dietary_preferences']
    
    def update(self, instance, validated_data):
        """Update user and profile data."""
        profile_data = validated_data.pop('userprofile', {})
        
        # Update user fields
        for attr, value in validated_data.items():
            setattr(instance, attr, value)
        instance.save()
        
        # Update profile fields
        if profile_data:
            profile = instance.userprofile
            for attr, value in profile_data.items():
                setattr(profile, attr, value)
            profile.save()
        
        return instance


class UserRegistrationSerializer(serializers.ModelSerializer):
    """Serializer for user registration."""
    
    password = serializers.CharField(write_only=True, min_length=8)
    password_confirm = serializers.CharField(write_only=True)
    
    class Meta:
        model = User
        fields = ['username', 'email', 'first_name', 'last_name', 'password', 'password_confirm']
        extra_kwargs = {
            'username': {'required': False}
        }
    
    def validate(self, attrs):
        """Validate password confirmation."""
        if attrs['password'] != attrs['password_confirm']:
            raise serializers.ValidationError("Пароли не совпадают")
        return attrs
    
    def create(self, validated_data):
        """Create new user."""
        validated_data.pop('password_confirm')
        password = validated_data.pop('password')
        
        # Generate username from email if not provided
        if 'username' not in validated_data:
            validated_data['username'] = validated_data['email']
        
        user = User.objects.create_user(password=password, **validated_data)
        return user