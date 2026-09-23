import React, { useState, useEffect } from 'react';
import { motion, useReducedMotion } from 'framer-motion';
import { useAuth } from '../../hooks/useAuth';
import { getPaymentMethods, deletePaymentMethod, setDefaultPaymentMethod } from '../../services/paymentService';
import { useRegisterRefresh } from '../../context/RefreshContext';
import AccountSidebar from '../../components/account/AccountSidebar';
import MaaTip from '../../components/account/MaasTip';
import PaymentCard from '../../components/payment/PaymentCard';
import UPICard from '../../components/payment/UPICard';
import DeletePaymentDialog from '../../components/payment/DeletePaymentDialog';
import StripeNoticeModal from '../../components/payment/StripeNoticeModal';
import { Plus, CreditCard } from 'lucide-react';

export default function PaymentMethods() {
  const { user, signOut } = useAuth();
  const shouldReduce = useReducedMotion();
  
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);
  const [cards, setCards] = useState([]);
  const [upis, setUpis] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  
  const [deletingMethod, setDeletingMethod] = useState(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [noticeModalMode, setNoticeModalMode] = useState(null); // 'add' | 'edit' | null

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 768);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const fetchMethods = async () => {
    if (!user) return;
    try {
      setIsLoading(true);
      const data = await getPaymentMethods(user.uid);
      setCards(data.cards.sort((a, b) => (b.isDefault === true ? 1 : 0) - (a.isDefault === true ? 1 : 0)));
      setUpis(data.upis);
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchMethods();
  }, [user]);

  useRegisterRefresh(fetchMethods);

  const handleDeleteConfirm = async () => {
    if (!user || !deletingMethod) return;
    try {
      setIsDeleting(true);
      await deletePaymentMethod(user.uid, deletingMethod.id, deletingMethod.type);
      await fetchMethods();
    } catch (err) {
      console.error(err);
    } finally {
      setIsDeleting(false);
      setDeletingMethod(null);
    }
  };

  const handleSetDefault = async (methodId, type = 'card') => {
    if (!user) return;
    try {
      await setDefaultPaymentMethod(user.uid, methodId, type);
      await fetchMethods();
    } catch (err) {
      console.error(err);
    }
  };

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: { opacity: 1, transition: { staggerChildren: 0.1, delayChildren: 0.1 } }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 15 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.4, ease: 'easeOut' } }
  };

  const hasNoMethods = cards.length === 0 && upis.length === 0;

  return (
    <div className="account-page-root" style={{
      minHeight: '100vh',
      background: '#FFF8F4',
      paddingTop: '64px',
    }}>
      <div 
        id="account-layout"
        data-has-sidebar="true"
        style={{
          display: 'grid',
          gridTemplateColumns: isMobile ? '1fr' : '260px 1fr',
          minHeight: 'calc(100vh - 64px)',
        }}
      >
        {/* Sidebar */}
        {!isMobile && (
          <motion.div
            initial={shouldReduce ? false : { opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5, ease: 'easeOut' }}
          >
            <AccountSidebar user={user} onSignOut={signOut} />
          </motion.div>
        )}

        {/* Main Content */}
        <div className="account-content-area" style={{ padding: isMobile ? '16px' : 'clamp(24px, 4vw, 40px)', maxWidth: '1000px', width: '100%', boxSizing: 'border-box' }}>
          {isMobile && (
            <div style={{ marginBottom: '32px' }}>
              <AccountSidebar user={user} onSignOut={signOut} isMobile={true} />
            </div>
          )}

          <motion.div
            variants={containerVariants}
            initial={shouldReduce ? false : "hidden"}
            animate="visible"
          >
            {/* Header */}
            <motion.div variants={itemVariants} style={{ marginBottom: '32px' }}>
              <h1 style={{
                fontFamily: "'Literata', Georgia, serif",
                fontSize: 'clamp(24px, 3vw, 32px)',
                fontWeight: 700,
                color: '#1C1007',
                margin: '0 0 8px 0'
              }}>
                Payment Methods
              </h1>
              <p style={{
                fontFamily: "'Be Vietnam Pro', sans-serif",
                fontSize: '15px',
                color: '#5D4037',
                margin: 0
              }}>
                Manage your cards and digital wallets for faster checkouts.
              </p>
            </motion.div>

            {isLoading ? (
              <div style={{ padding: '40px 0', textAlign: 'center', color: '#5D4037', fontFamily: "'Be Vietnam Pro', sans-serif" }}>
                Loading payment methods...
              </div>
            ) : hasNoMethods ? (
              <motion.div variants={itemVariants} style={{
                background: '#FFF',
                borderRadius: '16px',
                padding: 'clamp(32px, 6vw, 60px) clamp(16px, 4vw, 24px)',
                textAlign: 'center',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: '16px',
                marginBottom: '48px'
              }}>
                <div style={{
                  width: '64px',
                  height: '64px',
                  borderRadius: '50%',
                  background: '#FEF4EC',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}>
                  <CreditCard size={32} color="#B22222" />
                </div>
                <div>
                  <h3 style={{ fontFamily: "'Literata', Georgia, serif", fontSize: '20px', fontWeight: 600, color: '#1C1007', margin: '0 0 8px 0' }}>
                    No payment methods saved
                  </h3>
                  <p style={{ fontFamily: "'Be Vietnam Pro', sans-serif", fontSize: '15px', color: '#5D4037', margin: 0, maxWidth: '400px' }}>
                    Add a secure payment method for a faster checkout.
                  </p>
                </div>
                <button
                  onClick={() => setNoticeModalMode('add')}
                  style={{
                    background: 'transparent',
                    color: '#B22222',
                    border: '1.5px solid #B22222',
                    padding: '10px 24px',
                    borderRadius: '24px',
                    fontFamily: "'Be Vietnam Pro', sans-serif",
                    fontSize: '14px',
                    fontWeight: 600,
                    cursor: 'pointer',
                    marginTop: '8px',
                    transition: 'all 0.2s'
                  }}
                  onMouseEnter={(e) => { e.currentTarget.style.background = '#B22222'; e.currentTarget.style.color = '#FFF'; }}
                  onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = '#B22222'; }}
                >
                  + Add New Payment Method
                </button>
              </motion.div>
            ) : (
              <>
                {cards.length > 0 && (
                  <motion.div variants={itemVariants} style={{
                    background: '#FFFDF5',
                    borderRadius: '16px',
                    padding: 'clamp(16px, 4vw, 24px)',
                    marginBottom: '24px'
                  }}>
                    <h2 style={{
                      fontFamily: "'Literata', Georgia, serif",
                      fontSize: '18px',
                      fontWeight: 600,
                      color: '#1C1007',
                      margin: '0 0 16px 0'
                    }}>
                      Saved Cards
                    </h2>
                    <div style={{ display: 'grid', gap: '16px' }}>
                      {cards.map(card => (
                        <PaymentCard
                          key={card.id}
                          payment={card}
                          onEdit={() => setNoticeModalMode('edit')}
                          onDelete={(pm) => setDeletingMethod(pm)}
                          onSetDefault={(id) => handleSetDefault(id, 'card')}
                        />
                      ))}
                    </div>
                  </motion.div>
                )}

                {upis.length > 0 && (
                  <motion.div variants={itemVariants} style={{
                    background: '#FFF',
                    borderRadius: '16px',
                    padding: 'clamp(16px, 4vw, 24px)',
                    marginBottom: '24px',
                    border: '1px solid rgba(93, 64, 55, 0.1)'
                  }}>
                    <h2 style={{
                      fontFamily: "'Literata', Georgia, serif",
                      fontSize: '18px',
                      fontWeight: 600,
                      color: '#1C1007',
                      margin: '0 0 16px 0'
                    }}>
                      UPI IDs
                    </h2>
                    <div style={{ display: 'grid', gap: '16px' }}>
                      {upis.map(upi => (
                        <UPICard
                          key={upi.id}
                          upi={upi}
                          onDelete={(pm) => setDeletingMethod(pm)}
                        />
                      ))}
                    </div>
                  </motion.div>
                )}

                <motion.div variants={itemVariants} style={{ marginBottom: '48px', display: 'flex', justifyContent: isMobile ? 'stretch' : 'flex-start' }}>
                  <button
                    onClick={() => setNoticeModalMode('add')}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '8px',
                      background: '#B22222',
                      color: '#FFF',
                      border: 'none',
                      padding: '12px 24px',
                      borderRadius: '24px',
                      fontFamily: "'Be Vietnam Pro', sans-serif",
                      fontSize: '14px',
                      fontWeight: 600,
                      cursor: 'pointer',
                      transition: 'background 0.2s',
                      width: isMobile ? '100%' : 'auto',
                    }}
                    onMouseEnter={(e) => e.currentTarget.style.background = '#8B1A1A'}
                    onMouseLeave={(e) => e.currentTarget.style.background = '#B22222'}
                  >
                    <Plus size={16} />
                    Add New Payment Method
                  </button>
                </motion.div>
              </>
            )}

            {/* Maa's Tip */}
            <motion.div variants={itemVariants}>
              <MaaTip>
                "Keep your payment details updated for a smooth, hassle-free checkout. Your security is our top priority, beta."
              </MaaTip>
            </motion.div>

          </motion.div>
        </div>
      </div>

      <DeletePaymentDialog
        isOpen={!!deletingMethod}
        isDeleting={isDeleting}
        onClose={() => setDeletingMethod(null)}
        onConfirm={handleDeleteConfirm}
      />
      
      <StripeNoticeModal
        isOpen={!!noticeModalMode}
        mode={noticeModalMode}
        onClose={() => setNoticeModalMode(null)}
      />
    </div>
  );
}
