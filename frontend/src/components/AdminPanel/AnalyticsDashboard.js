import React, { useState, useEffect } from 'react';
import { useSelector } from 'react-redux';
import { Link } from 'react-router-dom';
import api from '../../utils/api';
import './AnalyticsDashboard.css';

const AnalyticsDashboard = () => {
  const { user } = useSelector(state => state.auth);
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [period, setPeriod] = useState('month'); // week | month | all

  useEffect(() => {
    fetchAnalytics();
    const interval = setInterval(fetchAnalytics, 60000);
    return () => clearInterval(interval);
  }, []);

  const fetchAnalytics = async () => {
    try {
      setLoading(true);
      const response = await api.get('/analytics/dashboard/');
      setData(response.data);
      setError(null);
    } catch (err) {
      console.error('Analytics error:', err);
      setError('Ошибка загрузки аналитики');
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (amount) =>
    new Intl.NumberFormat('ru-RU', {
      style: 'currency',
      currency: 'RUB',
      minimumFractionDigits: 0,
    }).format(amount);

  const formatNumber = (n) =>
    new Intl.NumberFormat('ru-RU').format(n);

  const formatDate = (dateStr) =>
    new Date(dateStr).toLocaleString('ru-RU', {
      day: 'numeric',
      month: 'short',
      hour: '2-digit',
      minute: '2-digit',
    });

  // Мини-график выручки (ASCII-бары)
  const RevenueChart = ({ data: chartData }) => {
    if (!chartData || chartData.length === 0) return <p className="no-data">Нет данных</p>;

    const maxRevenue = Math.max(...chartData.map(d => d.revenue));

    return (
      <div className="mini-chart">
        {chartData.slice(-14).map((day, i) => {
          const height = maxRevenue > 0 ? (day.revenue / maxRevenue) * 100 : 0;
          const date = new Date(day.date);
          return (
            <div key={i} className="chart-bar-wrapper" title={`${date.toLocaleDateString('ru-RU')}: ${formatCurrency(day.revenue)} (${day.count} заказов)`}>
              <div
                className="chart-bar"
                style={{ height: `${Math.max(height, 4)}%` }}
              />
              <span className="chart-label">
                {date.getDate()}
              </span>
            </div>
          );
        })}
      </div>
    );
  };

  if (loading && !data) {
    return (
      <div className="analytics-dashboard">
        <div className="loading-container">
          <div className="loading-spinner"></div>
          <p>Загрузка аналитики...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="analytics-dashboard">
      {/* Header */}
      <div className="analytics-header">
        <div className="header-content">
          <h2>📊 Панель аналитики</h2>
          <p className="header-subtitle">
            {user?.first_name}, вот обзор вашего магазина
          </p>
        </div>
        <div className="header-actions">
          <button className="refresh-btn" onClick={fetchAnalytics} disabled={loading}>
            <span className={`refresh-icon ${loading ? 'spinning' : ''}`}>🔄</span>
            Обновить
          </button>
        </div>
      </div>

      {error && (
        <div className="error-banner">
          ⚠️ {error}
          <button onClick={() => setError(null)}>×</button>
        </div>
      )}

      {data && (
        <>
          {/* ═══ КЛЮЧЕВЫЕ МЕТРИКИ (4 карточки сверху) ═══ */}
          <div className="kpi-grid">
            <div className="kpi-card revenue">
              <div className="kpi-icon">💰</div>
              <div className="kpi-content">
                <span className="kpi-label">Выручка за месяц</span>
                <span className="kpi-value">{formatCurrency(data.revenue.month)}</span>
                <span className={`kpi-change ${data.revenue.growth_percent >= 0 ? 'positive' : 'negative'}`}>
                  {data.revenue.growth_percent >= 0 ? '↑' : '↓'} {Math.abs(data.revenue.growth_percent)}%
                  <span className="kpi-change-label"> vs прошлый месяц</span>
                </span>
              </div>
            </div>

            <div className="kpi-card orders">
              <div className="kpi-icon">📦</div>
              <div className="kpi-content">
                <span className="kpi-label">Заказов за месяц</span>
                <span className="kpi-value">{formatNumber(data.orders.month)}</span>
                <span className="kpi-sub">
                  Сегодня: <strong>{data.orders.today}</strong>
                </span>
              </div>
            </div>

            <div className="kpi-card avg-order">
              <div className="kpi-icon">🧾</div>
              <div className="kpi-content">
                <span className="kpi-label">Средний чек</span>
                <span className="kpi-value">{formatCurrency(data.revenue.average_order)}</span>
                <span className="kpi-sub">
                  Всего выручка: {formatCurrency(data.revenue.total)}
                </span>
              </div>
            </div>

            <div className="kpi-card users">
              <div className="kpi-icon">👥</div>
              <div className="kpi-content">
                <span className="kpi-label">Пользователей</span>
                <span className="kpi-value">{formatNumber(data.users.total)}</span>
                <span className="kpi-sub">
                  Новых за месяц: <strong>+{data.users.new_month}</strong>
                </span>
              </div>
            </div>
          </div>

          {/* ═══ ГРАФИК ВЫРУЧКИ ═══ */}
          <div className="analytics-card chart-card">
            <div className="card-header">
              <h3>📈 Выручка по дням</h3>
              <span className="card-subtitle">Последние 14 дней</span>
            </div>
            <div className="card-content">
              <RevenueChart data={data.revenue.by_day} />
            </div>
          </div>

          <div className="analytics-two-col">
            {/* ═══ СТАТУСЫ ЗАКАЗОВ ═══ */}
            <div className="analytics-card">
              <div className="card-header">
                <h3>📋 Заказы по статусам</h3>
              </div>
              <div className="card-content">
                <div className="status-bars">
                  {[
                    { key: 'processing', label: 'В обработке', color: '#ffc107', icon: '⏳' },
                    { key: 'shipped', label: 'Отправлены', color: '#17a2b8', icon: '🚚' },
                    { key: 'delivered', label: 'Доставлены', color: '#28a745', icon: '✅' },
                    { key: 'cancelled', label: 'Отменены', color: '#dc3545', icon: '❌' },
                  ].map(({ key, label, color, icon }) => {
                    const count = data.orders.by_status[key] || 0;
                    const total = data.orders.total || 1;
                    const percent = Math.round((count / total) * 100);
                    return (
                      <div key={key} className="status-bar-item">
                        <div className="status-bar-header">
                          <span>{icon} {label}</span>
                          <span className="status-count">{count}</span>
                        </div>
                        <div className="status-bar-track">
                          <div
                            className="status-bar-fill"
                            style={{ width: `${percent}%`, backgroundColor: color }}
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>

                <div className="payment-summary">
                  <h4>Оплата:</h4>
                  <div className="payment-pills">
                    <span className="pill paid">
                      ✅ Оплачено: {data.orders.by_payment.paid || 0}
                    </span>
                    <span className="pill pending">
                      ⏳ Ожидает: {data.orders.by_payment.pending || 0}
                    </span>
                    <span className="pill failed">
                      ❌ Ошибка: {data.orders.by_payment.failed || 0}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* ═══ КОНВЕРСИЯ ═══ */}
            <div className="analytics-card">
              <div className="card-header">
                <h3>🎯 Конверсия и пользователи</h3>
              </div>
              <div className="card-content">
                <div className="conversion-funnel">
                  <div className="funnel-step">
                    <div className="funnel-bar" style={{ width: '100%' }}>
                      <span>👥 Всего пользователей: {data.users.total}</span>
                    </div>
                  </div>
                  <div className="funnel-step">
                    <div className="funnel-bar" style={{
                      width: `${Math.max((data.users.with_orders / (data.users.total || 1)) * 100, 15)}%`
                    }}>
                      <span>🛒 С заказами: {data.users.with_orders}</span>
                    </div>
                  </div>
                  <div className="funnel-step">
                    <div className="funnel-value">
                      Конверсия: <strong>{data.users.conversion_rate}%</strong>
                    </div>
                  </div>
                </div>

                <div className="users-growth">
                  <div className="growth-item">
                    <span className="growth-label">Новых за неделю</span>
                    <span className="growth-value">+{data.users.new_week}</span>
                  </div>
                  <div className="growth-item">
                    <span className="growth-label">Новых за месяц</span>
                    <span className="growth-value">+{data.users.new_month}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="analytics-two-col">
            {/* ═══ ТОП ТОВАРОВ ═══ */}
            <div className="analytics-card">
              <div className="card-header">
                <h3>🏆 Топ-10 товаров</h3>
                <span className="card-subtitle">По количеству продаж</span>
              </div>
              <div className="card-content">
                {data.top_products.length > 0 ? (
                  <div className="top-products-list">
                    {data.top_products.map((product, index) => (
                      <div key={product.product__id} className="top-product-item">
                        <span className={`rank rank-${index + 1}`}>
                          {index < 3 ? ['🥇', '🥈', '🥉'][index] : `#${index + 1}`}
                        </span>
                        <div className="top-product-info">
                          <Link
                            to={`/products/${product.product__id}`}
                            className="top-product-name"
                          >
                            {product.product__name}
                          </Link>
                          <span className="top-product-stats">
                            {product.total_sold} шт. · {formatCurrency(product.total_revenue)}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="no-data">Нет данных о продажах</p>
                )}
              </div>
            </div>

            {/* ═══ ПРОБЛЕМНЫЕ ТОВАРЫ ═══ */}
            <div className="analytics-card">
              <div className="card-header">
                <h3>⚠️ Требуют внимания</h3>
                <span className="card-subtitle">Склад</span>
              </div>
              <div className="card-content">
                {data.products.out_of_stock_list.length > 0 && (
                  <div className="stock-alert-section">
                    <h4 className="alert-title danger">
                      🚨 Нет в наличии ({data.products.out_of_stock})
                    </h4>
                    {data.products.out_of_stock_list.map(p => (
                      <div key={p.id} className="stock-alert-item">
                        <Link to={`/products/${p.id}`} className="stock-product-name">
                          {p.name}
                        </Link>
                        <span className="stock-badge danger">0 шт.</span>
                      </div>
                    ))}
                  </div>
                )}

                {data.products.low_stock_list.length > 0 && (
                  <div className="stock-alert-section">
                    <h4 className="alert-title warning">
                      ⚠️ Мало на складе ({data.products.low_stock})
                    </h4>
                    {data.products.low_stock_list.map(p => (
                      <div key={p.id} className="stock-alert-item">
                        <Link to={`/products/${p.id}`} className="stock-product-name">
                          {p.name}
                        </Link>
                        <span className="stock-badge warning">{p.stock_quantity} шт.</span>
                      </div>
                    ))}
                  </div>
                )}

                {data.products.out_of_stock_list.length === 0 &&
                  data.products.low_stock_list.length === 0 && (
                    <div className="all-good">
                      <span className="all-good-icon">✅</span>
                      <p>Все товары в наличии</p>
                    </div>
                  )}
              </div>
            </div>
          </div>

          {/* ═══ ПОСЛЕДНИЕ ЗАКАЗЫ ═══ */}
          <div className="analytics-card">
            <div className="card-header">
              <h3>🕐 Последние заказы</h3>
              <Link to="/orders/manage" className="card-link">
                Все заказы →
              </Link>
            </div>
            <div className="card-content">
              <div className="recent-orders-table">
                <div className="table-header">
                  <span>Заказ</span>
                  <span>Покупатель</span>
                  <span>Сумма</span>
                  <span>Статус</span>
                  <span>Дата</span>
                </div>
                {data.recent_orders.map(order => (
                  <div key={order.id} className="table-row">
                    <span className="order-num">#{order.order_number}</span>
                    <span className="order-customer">
                      {order.user__first_name} {order.user__last_name}
                    </span>
                    <span className="order-amount">
                      {formatCurrency(order.total_amount)}
                    </span>
                    <span className={`order-status status-${order.status}`}>
                      {order.status}
                    </span>
                    <span className="order-date">
                      {formatDate(order.created_at)}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* ═══ ТОВАРЫ ПО КАТЕГОРИЯМ ═══ */}
          <div className="analytics-card">
            <div className="card-header">
              <h3>🏷️ Товары по категориям</h3>
            </div>
            <div className="card-content">
              <div className="categories-grid">
                {data.products.by_category.map(cat => (
                  <div key={cat.id} className="category-chip">
                    <span className="category-name">{cat.name}</span>
                    <span className="category-count">{cat.product_count}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default AnalyticsDashboard;