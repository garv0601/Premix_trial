import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, CheckCircle2 } from 'lucide-react';
import './CouponFormModal.css';

const overlayVariants = { hidden: { opacity: 0 }, visible: { opacity: 1 } };
const modalVariants = {
  hidden: { opacity: 0, scale: 0.95, x: '-50%', y: '-45%' },
  visible: { opacity: 1, scale: 1, x: '-50%', y: '-50%', transition: { type: 'spring', stiffness: 350, damping: 28 } },
};

const INITIAL_FORM = {
  code: '',
  discount_type: 'percentage',
  discount_value: '',
  minimum_order_amount: '',
  maximum_discount: '',
  usage_limit: '',
  starts_at: '',
  expires_at: '',
  is_active: true,
  show_as_offer: true,
};

export default function AddCouponModal({ isOpen, onClose, onSubmit }) {
  const [form, setForm] = useState({ ...INITIAL_FORM });
  const [submitting, setSubmitting] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [errors, setErrors] = useState({});

  const handleChange = (field, value) => {
    setForm((prev) => ({ ...prev, [field]: value }));
    if (errors[field]) setErrors((prev) => ({ ...prev, [field]: null }));
  };

  const validate = () => {
    const newErrors = {};
    if (!form.code.trim()) newErrors.code = 'Coupon code is required';
    if (!form.discount_value || isNaN(form.discount_value) || form.discount_value <= 0) {
      newErrors.discount_value = 'Valid value required';
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validate()) return;
    setSubmitting(true);
    
    // Dates are stored as ISO timestamps (starts_at/expires_at columns)
    const result = await onSubmit({
      ...form,
      starts_at: form.starts_at ? new Date(form.starts_at).toISOString() : null,
      expires_at: form.expires_at ? new Date(form.expires_at).toISOString() : null,
    });
    
    setSubmitting(false);
    if (result?.success) {
      setSaveSuccess(true);
      setTimeout(() => {
        setSaveSuccess(false);
        setForm({ ...INITIAL_FORM });
        onClose();
      }, 1500);
    }
  };

  const handleClose = () => {
    setForm({ ...INITIAL_FORM });
    setErrors({});
    setSaveSuccess(false);
    onClose();
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div className="cpm-overlay" variants={overlayVariants} initial="hidden" animate="visible" exit="hidden" onClick={handleClose} />
          <motion.div className="cpm-modal" variants={modalVariants} initial="hidden" animate="visible" exit="hidden">
            <div className="cpm-header">
              <h3>Add New Coupon</h3>
              <button className="cpm-close" onClick={handleClose} aria-label="Close"><X size={18} /></button>
            </div>

            <form className="cpm-form" onSubmit={handleSubmit} noValidate>
              <div className="cpm-scroll-body">
                <div className="cpm-field-row">
                  <div className="cpm-field">
                    <label className="cpm-label">Coupon Code *</label>
                    <input className={`cpm-input ${errors.code ? 'cpm-error' : ''}`} type="text" value={form.code} onChange={(e) => handleChange('code', e.target.value.toUpperCase())} placeholder="e.g. SAVE20" />
                    {errors.code && <span className="cpm-error-text">{errors.code}</span>}
                  </div>
                  <div className="cpm-field">
                    <label className="cpm-label">Status</label>
                    <select className="cpm-select" value={form.is_active ? 'active' : 'inactive'} onChange={(e) => handleChange('is_active', e.target.value === 'active')}>
                      <option value="active">Active</option>
                      <option value="inactive">Inactive</option>
                    </select>
                  </div>
                </div>

                <div className="cpm-field-row">
                  <div className="cpm-field">
                    <label className="cpm-label">Discount Type</label>
                    <select className="cpm-select" value={form.discount_type} onChange={(e) => handleChange('discount_type', e.target.value)}>
                      <option value="percentage">Percentage</option>
                      <option value="fixed">Fixed Amount</option>
                    </select>
                  </div>
                  <div className="cpm-field">
                    <label className="cpm-label">Discount Value *</label>
                    <input className={`cpm-input ${errors.discount_value ? 'cpm-error' : ''}`} type="number" min="0" step="0.01" value={form.discount_value} onChange={(e) => handleChange('discount_value', e.target.value)} placeholder="e.g. 20" />
                    {errors.discount_value && <span className="cpm-error-text">{errors.discount_value}</span>}
                  </div>
                </div>

                <div className="cpm-field-row">
                  <div className="cpm-field">
                    <label className="cpm-label">Min Order Amount</label>
                    <input className="cpm-input" type="number" min="0" value={form.minimum_order_amount} onChange={(e) => handleChange('minimum_order_amount', e.target.value)} placeholder="No minimum" />
                  </div>
                  <div className="cpm-field">
                    <label className="cpm-label">Max Discount</label>
                    <input className="cpm-input" type="number" min="0" value={form.maximum_discount} onChange={(e) => handleChange('maximum_discount', e.target.value)} placeholder="No maximum" disabled={form.discount_type === 'fixed'} />
                  </div>
                </div>

                <div className="cpm-field-row">
                  <div className="cpm-field">
                    <label className="cpm-label">Usage Limit (Total)</label>
                    <input className="cpm-input" type="number" min="1" value={form.usage_limit} onChange={(e) => handleChange('usage_limit', e.target.value)} placeholder="Unlimited" />
                  </div>
                </div>

                <div className="cpm-field-row">
                  <div className="cpm-field">
                    <label className="cpm-label">Start Date</label>
                    <input className="cpm-input" type="date" value={form.starts_at} onChange={(e) => handleChange('starts_at', e.target.value)} />
                  </div>
                  <div className="cpm-field">
                    <label className="cpm-label">Expiry Date</label>
                    <input className="cpm-input" type="date" value={form.expires_at} onChange={(e) => handleChange('expires_at', e.target.value)} />
                  </div>
                </div>

                <div className="cpm-toggle-field">
                  <div className="cpm-toggle-text">
                    <span className="cpm-toggle-title">Show as offer to customers</span>
                    <span className="cpm-toggle-desc">When on, this coupon appears in the checkout “offers available right now” list. Turn off to keep it usable by code only.</span>
                  </div>
                  <label className="cpm-switch">
                    <input type="checkbox" checked={!!form.show_as_offer} onChange={(e) => handleChange('show_as_offer', e.target.checked)} />
                    <span className="cpm-switch-track" />
                    <span className="cpm-switch-thumb" />
                  </label>
                </div>
              </div>

              <div className="cpm-footer">
                <AnimatePresence>
                  {saveSuccess && (
                    <motion.div initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0 }} style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#27AE60', fontSize: '13px', fontWeight: 600, marginRight: 'auto' }}>
                      <CheckCircle2 size={16} /> Created successfully
                    </motion.div>
                  )}
                </AnimatePresence>
                <button type="button" className="cpm-cancel-btn" onClick={handleClose} disabled={submitting || saveSuccess}>Cancel</button>
                <motion.button type="submit" className="cpm-submit-btn" disabled={submitting || saveSuccess} whileHover={!submitting && !saveSuccess ? { scale: 1.02 } : {}} whileTap={!submitting && !saveSuccess ? { scale: 0.98 } : {}}>
                  {submitting ? 'Creating...' : 'Create Coupon'}
                </motion.button>
              </div>
            </form>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
