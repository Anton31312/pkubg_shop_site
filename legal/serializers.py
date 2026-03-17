from rest_framework import serializers
from .models import LegalInfo


class LegalInfoSerializer(serializers.ModelSerializer):
    # Форматированная дата для фронтенда
    updated_date_formatted = serializers.SerializerMethodField()

    class Meta:
        model = LegalInfo
        fields = '__all__'
        read_only_fields = ['updated_at']

    def get_updated_date_formatted(self, obj):
        if obj.updated_at:
            months = {
                1: 'января', 2: 'февраля', 3: 'марта',
                4: 'апреля', 5: 'мая', 6: 'июня',
                7: 'июля', 8: 'августа', 9: 'сентября',
                10: 'октября', 11: 'ноября', 12: 'декабря'
            }
            d = obj.updated_at
            return f'{d.day:02d} {months[d.month]} {d.year} г.'
        return ''