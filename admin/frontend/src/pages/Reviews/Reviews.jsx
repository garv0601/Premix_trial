import React from 'react';
import { motion } from 'framer-motion';
import { useReviews } from '../../hooks/useReviews';
import ReviewStats from '../../components/reviews/ReviewStats';
import ReviewFilters from '../../components/reviews/ReviewFilters';
import ReviewTable from '../../components/reviews/ReviewTable';
import ReviewDetails from '../../components/reviews/ReviewDetails';
import '../Customers/Customers.css'; // Standard page layout

export default function Reviews() {
  const {
    reviews,
    stats,
    loading,
    error,
    search, setSearch,
    statusFilter, setStatusFilter,
    ratingFilter, setRatingFilter,
    detailOpen, selectedReview, openDetail, closeDetail,
    handleStatusChange, handleDelete, actionLoading,
  } = useReviews();

  if (loading && reviews.length === 0) {
    return (
      <div className="cust-loading">
        <div className="loading-spinner" />
        <p>Loading reviews...</p>
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
      id="admin-reviews"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.35 }}
    >
      <div className="cust-header">
        <div className="cust-header-left">
          <h1 className="cust-title">Customer Reviews</h1>
          <p className="cust-subtitle">Monitor and manage community feedback.</p>
        </div>
      </div>

      <ReviewStats stats={stats} />

      <ReviewFilters
        search={search}
        onSearchChange={setSearch}
        statusFilter={statusFilter}
        onStatusChange={setStatusFilter}
        ratingFilter={ratingFilter}
        onRatingChange={setRatingFilter}
      />

      <ReviewTable
        reviews={reviews}
        onView={openDetail}
      />

      <ReviewDetails
        review={selectedReview}
        isOpen={detailOpen}
        onClose={closeDetail}
        onStatusChange={handleStatusChange}
        onDelete={handleDelete}
        actionLoading={actionLoading}
      />
    </motion.div>
  );
}
