import React, { useState, useEffect } from 'react';
import { useSelector } from 'react-redux';
import { apiHelpers } from '../../utils/apiConfig';
import './OrderManagement.css';

const OrderManagement = () => {
  const { user } = useSelector(state => state.auth);
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [filters, setFilters] = useState({
    status: '',
    payment_status: '',
    search: '',
    page: 1,
    page_size: 20
  });
  const [pagination, setPagination] = useState({
    total: 0,
    page: 1,
    total_pages: 1
  });
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [showDetailModal, setShowDetailModal] = useState(false);

  useEffect(() => {
    fetchOrders();
  }, [filters]);

  const fetchOrders = async () => {
    setLoading(true);
    setError(null);
    
    try {
      console.log('Fetching orders with filters:', filters);
      const response = await apiHelpers.get('/orders/admin/all/', filters);
      console.log('Orders response:', response.data);
      setOrders(response.data.orders);
      setPagination({
        total: response.data.total,
        page: response.data.page,
        total_pages: response.data.total_pages
      });
    } catch (err) {
      console.error('Error fetching orders:', err);
      setError(err.message || 'Ошибка загрузки заказов');
    } finally {
      setLoading(false);
    }
  };

  const handleFilterChange = (key, value) => {
    setFilters(prev => ({
      ...prev,
      [key]: value,
      page: 1 // Reset to first page on filter change
    }));
  };

  const handlePageChange = (newPage) => {
    setFilters(prev => ({
      ...prev,
      page: newPage
    }));
  };

  const handleViewDetails = async (orderId) => {
    try {
      const response = await apiHelpers.get(`/orders/admin/${orderId}/`);
      setSelectedOrder(response.data);
      setShowDetailModal(true);
    } catch (err) {
      alert('Ошибка загрузки деталей заказа');
      console.error('Error fetching order details:', err);
    }
  };

  const handleUpdateStatus = async (orderId, status, paymentStatus) => {
    try {
      const updateData = {};
      if (status) updateData.status = status;
      if (paymentStatus) updateData.payment_status = paymentStatus;

      await apiHelpers.patch(`/orders/admin/${orderId}/update/`, updateData);
      
      // Refresh orders list
      fetchOrders();
      
      // Update selected order if modal is open
      if (selectedOrder && selectedOrder.id === orderId) {
        const response = await apiHelpers.get(`/orders/admin/${orderId}/`);
        setSelectedOrder(response.data);
      }
      
      alert('Статус заказа обновлен');
    } catch (err) {
      alert('Ошибка обновления статуса');
      console.error('Error updating order status:', err);
    }
  };

  const getStatusBadgeClass = (status) => {
    const statusClasses = {
      pending: 'status-pending',
      paid: 'status-paid',
      processing: 'status-processing',
      shipped: 'status-shipped',
      delivered: 'status-delivered',
      cancelled: 'status-cancelled',
      failed: 'status-failed',
      refunded: 'status-refunded'
    };
    return statusClasses[status] || 'status-default';
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleString('ru-RU', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (loading && orders.length === 0) {
    return (
      <div className="order-management">
        <div className="loading-container">
          <div className="loading-spinner"></div>
          <p>Загрузка заказов...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="order-management">
      <div className="order-management-header">
        <h1>Управление заказами</h1>
        <p className="subtitle">
          {user?.role === 'admin' ? 'Администратор' : 'Менеджер'}
        </p>
      </div>

      {/* Filters */}
      <div className="filters-section">
        <div className="filter-group">
          <input
            type="text"
            placeholder="Поиск по номеру, email, имени..."
            value={filters.search}
            onChange={(e) => handleFilterChange('search', e.target.value)}
            className="search-input"
          />
        </div>

        <div className="filter-group">
          <select
            value={filters.status}
            onChange={(e) => handleFilterChange('status', e.target.value)}
            className="filter-select"
          >
            <option value="">Все статусы заказа</option>
            <option value="processing">В обработке</option>
            <option value="shipped">Отправлен</option>
            <option value="delivered">Доставлен</option>
            <option value="cancelled">Отменен</option>
          </select>
        </div>

        <div className="filter-group">
          <select
            value={filters.payment_status}
            onChange={(e) => handleFilterChange('payment_status', e.target.value)}
            className="filter-select"
          >
            <option value="">Все статусы оплаты</option>
            <option value="pending">Ожидает оплаты</option>
            <option value="paid">Оплачен</option>
            <option value="failed">Ошибка оплаты</option>
            <option value="refunded">Возврат</option>
          </select>
        </div>
      </div>

      {/* Error message */}
      {error && (
        <div className="error-message">
          <p>⚠️ {error}</p>
          <button onClick={fetchOrders}>Попробовать снова</button>
        </div>
      )}

      {/* Orders list */}
      {!error && (
        <>
          <div className="orders-summary">
            <p>Найдено заказов: <strong>{pagination.total}</strong></p>
          </div>

          <div className="orders-list">
            {orders.map((order) => (
              <div key={order.id} className="order-card">
                <div className="order-card-header">
                  <div className="order-number">
                    <h3>Заказ #{order.order_number}</h3>
                    <span className="order-date">{formatDate(order.created_at)}</span>
                  </div>
                  <div className="order-badges">
                    <span className={`status-badge ${getStatusBadgeClass(order.status)}`}>
                      {order.status_display}
                    </span>
                    <span className={`status-badge ${getStatusBadgeClass(order.payment_status)}`}>
                      {order.payment_status_display}
                    </span>
                  </div>
                </div>

                <div className="order-card-body">
                  <div className="order-info-grid">
                    <div className="info-item">
                      <span className="info-label">Покупатель:</span>
                      <span className="info-value">{order.user_name}</span>
                    </div>
                    <div className="info-item">
                      <span className="info-label">Email:</span>
                      <span className="info-value">{order.user_email}</span>
                    </div>
                    <div className="info-item">
                      <span className="info-label">Телефон:</span>
                      <span className="info-value">{order.user_phone || 'Не указан'}</span>
                    </div>
                    <div className="info-item">
                      <span className="info-label">Сумма:</span>
                      <span className="info-value amount">{order.total_amount} ₽</span>
                    </div>
                    <div className="info-item">
                      <span className="info-label">Товаров:</span>
                      <span className="info-value">{order.items_count}</span>
                    </div>
                  </div>

                  {/* Quick status update */}
                  <div className="quick-actions">
                    <select
                      value={order.status}
                      onChange={(e) => handleUpdateStatus(order.id, e.target.value, null)}
                      className="status-select"
                    >
                      <option value="processing">В обработке</option>
                      <option value="shipped">Отправлен</option>
                      <option value="delivered">Доставлен</option>
                      <option value="cancelled">Отменен</option>
                    </select>

                    <button
                      onClick={() => handleViewDetails(order.id)}
                      className="btn-details"
                    >
                      Подробнее
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Pagination */}
          {pagination.total_pages > 1 && (
            <div className="pagination">
              <button
                onClick={() => handlePageChange(pagination.page - 1)}
                disabled={pagination.page === 1}
                className="pagination-btn"
              >
                ← Назад
              </button>
              <span className="pagination-info">
                Страница {pagination.page} из {pagination.total_pages}
              </span>
              <button
                onClick={() => handlePageChange(pagination.page + 1)}
                disabled={pagination.page === pagination.total_pages}
                className="pagination-btn"
              >
                Вперед →
              </button>
            </div>
          )}
        </>
      )}

      {/* Order Detail Modal */}
      {showDetailModal && selectedOrder && (
        <div className="modal-overlay" onClick={() => setShowDetailModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>Заказ #{selectedOrder.order_number}</h2>
              <button
                onClick={() => setShowDetailModal(false)}
                className="modal-close"
              >
                ✕
              </button>
            </div>

            <div className="modal-body">
              {/* Customer info */}
              <div className="detail-section">
                <h3>Информация о покупателе</h3>
                <div className="detail-grid">
                  <div><strong>Имя:</strong> {selectedOrder.user_name}</div>
                  <div><strong>Email:</strong> {selectedOrder.user_email}</div>
                  <div><strong>Телефон:</strong> {selectedOrder.user_phone || 'Не указан'}</div>
                </div>
              </div>

              {/* Order info */}
              <div className="detail-section">
                <h3>Информация о заказе</h3>
                <div className="detail-grid">
                  <div><strong>Дата создания:</strong> {formatDate(selectedOrder.created_at)}</div>
                  <div><strong>Сумма:</strong> {selectedOrder.total_amount} ₽</div>
                  <div><strong>Способ доставки:</strong> {selectedOrder.delivery_method}</div>
                  <div><strong>Адрес доставки:</strong> {selectedOrder.shipping_address}</div>
                  {selectedOrder.delivery_tracking && (
                    <div><strong>Трек-номер:</strong> {selectedOrder.delivery_tracking}</div>
                  )}
                  {selectedOrder.notes && (
                    <div><strong>Комментарий:</strong> {selectedOrder.notes}</div>
                  )}
                </div>
              </div>

              {/* Items */}
              <div className="detail-section">
                <h3>Товары</h3>
                <div className="items-list">
                  {selectedOrder.items.map((item) => (
                    <div key={item.id} className="item-row">
                      <div className="item-info">
                        <span className="item-name">{item.product.name}</span>
                        <span className="item-quantity">x{item.quantity}</span>
                      </div>
                      <div className="item-prices">
                        <span className="item-price">{item.price} ₽</span>
                        <span className="item-subtotal">{item.subtotal} ₽</span>
                      </div>
                    </div>
                  ))}
                </div>
                <div className="items-total">
                  <strong>Итого:</strong>
                  <strong>{selectedOrder.total_amount} ₽</strong>
                </div>
              </div>

              {/* Status update */}
              <div className="detail-section">
                <h3>Обновить статус</h3>
                <div className="status-update-form">
                  <div className="form-group">
                    <label>Статус заказа:</label>
                    <select
                      value={selectedOrder.status}
                      onChange={(e) => handleUpdateStatus(selectedOrder.id, e.target.value, null)}
                      className="form-select"
                    >
                      <option value="processing">В обработке</option>
                      <option value="shipped">Отправлен</option>
                      <option value="delivered">Доставлен</option>
                      <option value="cancelled">Отменен</option>
                    </select>
                  </div>
                  <div className="form-group">
                    <label>Статус оплаты:</label>
                    <select
                      value={selectedOrder.payment_status}
                      onChange={(e) => handleUpdateStatus(selectedOrder.id, null, e.target.value)}
                      className="form-select"
                    >
                      <option value="pending">Ожидает оплаты</option>
                      <option value="paid">Оплачен</option>
                      <option value="failed">Ошибка оплаты</option>
                      <option value="refunded">Возврат</option>
                    </select>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default OrderManagement;
