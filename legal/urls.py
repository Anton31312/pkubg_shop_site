from django.urls import path
from . import views

urlpatterns = [
    path('', views.get_legal_info, name='legal-info-get'),
    path('update/', views.update_legal_info, name='legal-info-update'),
]