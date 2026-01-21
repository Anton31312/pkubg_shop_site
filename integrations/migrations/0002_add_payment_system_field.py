# Generated migration for adding payment_system field

from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('integrations', '0001_initial'),
    ]

    operations = [
        migrations.AddField(
            model_name='paymenttransaction',
            name='payment_system',
            field=models.CharField(
                choices=[('robokassa', 'Robokassa'), ('yookassa', 'ЮKassa')],
                default='robokassa',
                max_length=20
            ),
        ),
    ]
