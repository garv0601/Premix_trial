import React from 'react';
import { motion } from 'framer-motion';
import { Plus } from 'lucide-react';
import { useCoupons } from '../../hooks/useCoupons';
import CouponStats from '../../components/coupons/CouponStats';
import CouponFilters from '../../components/coupons/CouponFilters';
import CouponTable from '../../components/coupons/CouponTable';
import AddCouponModal from '../../components/coupons/AddCouponModal';
import EditCouponModal from '../../components/coupons/EditCouponModal';
import '../Customers/Customers.css'; // Reusing the exact same layout CSS

export default function Coupons() {
  const {
    coupons,
    stats,
    loading,
    error,
    search, setSearch,
    statusFilter, setStatusFilter,
    typeFilter, setTypeFilter,
    addOpen, setAddOpen, handleAdd,
    editOpen, couponToEdit, openEdit, closeEdit, handleEdit,
    handleDelete,
  } = useCoupons();

  if (loading && coupons.length === 0) {
    return (
      <div className="cust-loading">
        <div className="loading-spinner" />
        <p>Loading coupons...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="cust-error">
        <p>Something went wrong: {error}</p>
      </div>
    );
  }

  return (
    <motion.div
      className="customers-page"
      id="admin-coupons"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.35 }}
    >
      <div className="cust-header">
        <div className="cust-header-left">
          <h1 className="cust-title">Coupons Management</h1>
          <p className="cust-subtitle">Manage discount codes and promotional offers.</p>
        </div>
        <div className="cust-header-actions">
          <motion.button
            className="cust-add-btn"
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => setAddOpen(true)}
          >
            <Plus size={16} /> New Coupon
          </motion.button>
        </div>
      </div>

      <CouponStats stats={stats} />

      <CouponFilters
        search={search}
        onSearchChange={setSearch}
        statusFilter={statusFilter}
        onStatusChange={setStatusFilter}
        typeFilter={typeFilter}
        onTypeChange={setTypeFilter}
      />

      <CouponTable
        coupons={coupons}
        onEdit={openEdit}
        onDelete={handleDelete}
      />

      <AddCouponModal
        isOpen={addOpen}
        onClose={() => setAddOpen(false)}
        onSubmit={handleAdd}
      />

      <EditCouponModal
        isOpen={editOpen}
        coupon={couponToEdit}
        onClose={closeEdit}
        onSubmit={handleEdit}
      />
    </motion.div>
  );
}
