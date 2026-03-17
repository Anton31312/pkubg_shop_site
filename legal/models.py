from django.db import models


class LegalInfo(models.Model):
    """
    Singleton-модель: хранит юридические данные ИП.
    Всегда одна запись в базе.
    """

    # ═══ Основные данные ИП ═══
    business_type = models.CharField(
        max_length=100,
        default='Индивидуальный предприниматель',
        verbose_name='Организационно-правовая форма'
    )
    full_name = models.CharField(
        max_length=255,
        verbose_name='ФИО предпринимателя',
        help_text='Например: Фамилия Имя Отчество'
    )
    short_name = models.CharField(
        max_length=100,
        verbose_name='Сокращённое наименование',
        help_text='Например: ИП Фамилия И.О.',
        blank=True
    )
    ogrnip = models.CharField(
        max_length=15,
        verbose_name='ОГРНИП'
    )
    inn = models.CharField(
        max_length=12,
        verbose_name='ИНН'
    )

    # ═══ Адрес ═══
    legal_address = models.TextField(
        verbose_name='Юридический адрес',
        help_text='Полный адрес с индексом'
    )
    postal_code = models.CharField(
        max_length=6,
        verbose_name='Индекс',
        blank=True
    )

    # ═══ Контакты ═══
    email = models.EmailField(
        verbose_name='Email'
    )
    phone = models.CharField(
        max_length=20,
        verbose_name='Телефон',
        help_text='В формате +7 (999) 999-99-99'
    )
    working_hours = models.CharField(
        max_length=100,
        verbose_name='Режим работы',
        default='Пн–Пт 09:00–18:00 (МСК)',
        blank=True
    )

    # ═══ Банковские реквизиты ═══
    bank_name = models.CharField(
        max_length=255,
        verbose_name='Наименование банка',
        blank=True
    )
    bik = models.CharField(
        max_length=9,
        verbose_name='БИК',
        blank=True
    )
    checking_account = models.CharField(
        max_length=20,
        verbose_name='Расчётный счёт',
        blank=True
    )
    correspondent_account = models.CharField(
        max_length=20,
        verbose_name='Корреспондентский счёт',
        blank=True
    )

    # ═══ Сайт и бренд ═══
    site_name = models.CharField(
        max_length=100,
        verbose_name='Название магазина',
        default='PKUBG'
    )
    site_url = models.URLField(
        verbose_name='URL сайта',
        default='https://pkubg.ru'
    )
    site_description = models.TextField(
        verbose_name='Описание магазина',
        default='Интернет-магазин низкобелковой и безглютеновой продукции',
        blank=True
    )

    # ═══ Соцсети ═══
    telegram_url = models.URLField(
        verbose_name='Telegram',
        blank=True
    )
    vk_url = models.URLField(
        verbose_name='ВКонтакте',
        blank=True
    )
    ozon_url = models.URLField(
        verbose_name='Ozon',
        blank=True
    )

    # ═══ Мета ═══
    updated_at = models.DateTimeField(
        auto_now=True,
        verbose_name='Дата обновления'
    )

    class Meta:
        verbose_name = 'Юридическая информация'
        verbose_name_plural = 'Юридическая информация'

    def __str__(self):
        return f'{self.business_type} {self.full_name}'

    def save(self, *args, **kwargs):
        """Singleton: всегда перезаписываем запись с pk=1"""
        self.pk = 1

        # Автогенерация сокращённого наименования
        if not self.short_name and self.full_name:
            parts = self.full_name.split()
            if len(parts) >= 3:
                self.short_name = f'ИП {parts[0]} {parts[1][0]}.{parts[2][0]}.'
            elif len(parts) >= 2:
                self.short_name = f'ИП {parts[0]} {parts[1][0]}.'
            else:
                self.short_name = f'ИП {self.full_name}'

        super().save(*args, **kwargs)

    @classmethod
    def load(cls):
        """Получить единственный экземпляр или создать пустой"""
        obj, created = cls.objects.get_or_create(pk=1, defaults={
            'full_name': 'Фамилия Имя Отчество',
            'ogrnip': '000000000000000',
            'inn': '000000000000',
            'legal_address': 'г. Город, ул. Улица, д. 00',
            'email': 'contact@pkubg.ru',
            'phone': '+7 (999) 999-99-99',
        })
        return obj