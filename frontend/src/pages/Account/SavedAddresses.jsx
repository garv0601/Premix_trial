import React, { useState, useEffect } from 'react';
import { motion, useReducedMotion } from 'framer-motion';
import { useAuth } from '../../hooks/useAuth';
import { getAddresses, addAddress, updateAddress, deleteAddress, setDefaultAddress } from '../../services/addressService';
import AccountSidebar from '../../components/account/AccountSidebar';
import MaaTip from '../../components/account/MaasTip';
import AddressCard from '../../components/addresses/AddressCard';
import AddressForm from '../../components/addresses/AddressForm';
import DeleteAddressDialog from '../../components/addresses/DeleteAddressDialog';
import { Plus, MapPin } from 'lucide-react';

export default function SavedAddresses() {
  const { user, signOut } = useAuth();
  const shouldReduce = useReducedMotion();
  
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);
  const [addresses, setAddresses] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  
  // State for forms and modals
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingAddress, setEditingAddress] = useState(null);
  const [deletingAddress, setDeletingAddress] = useState(null);
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 768);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const fetchAddresses = async () => {
    if (!user) return;
    try {
      setIsLoading(true);
      const data = await getAddresses(user.id);
      // Sort so default is always first
      setAddresses(data.sort((a, b) => (b.isDefault === true ? 1 : 0) - (a.isDefault === true ? 1 : 0)));
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchAddresses();
  }, [user]);

  const handleSaveAddress = async (formData) => {
    if (!user) return;
    if (editingAddress) {
      await updateAddress(user.id, editingAddress.id, formData);
    } else {
      await addAddress(user.id, formData);
    }
    await fetchAddresses();
    setIsFormOpen(false);
    setEditingAddress(null);
  };

  const handleDeleteConfirm = async () => {
    if (!user || !deletingAddress) return;
    try {
      setIsDeleting(true);
      await deleteAddress(user.id, deletingAddress.id);
      await fetchAddresses();
    } catch (err) {
      console.error(err);
    } finally {
      setIsDeleting(false);
      setDeletingAddress(null);
    }
  };

  const handleSetDefault = async (addressId) => {
    if (!user) return;
    try {
      await setDefaultAddress(user.id, addressId);
      await fetchAddresses();
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

          {isFormOpen ? (
            <motion.div
              initial={shouldReduce ? false : { opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
            >
              <AddressForm
                initialData={editingAddress}
                onSave={handleSaveAddress}
                onCancel={() => { setIsFormOpen(false); setEditingAddress(null); }}
              />
            </motion.div>
          ) : (
            <motion.div
              variants={containerVariants}
              initial={shouldReduce ? false : "hidden"}
              animate="visible"
            >
              {/* Header */}
              <motion.div variants={itemVariants} style={{
                display: 'flex',
                flexDirection: isMobile ? 'column' : 'row',
                justifyContent: 'space-between',
                alignItems: isMobile ? 'flex-start' : 'flex-end',
                marginBottom: '32px',
                gap: '16px'
              }}>
                <div>
                  <h1 style={{
                    fontFamily: "'Literata', Georgia, serif",
                    fontSize: 'clamp(24px, 3vw, 32px)',
                    fontWeight: 700,
                    color: '#1C1007',
                    margin: '0 0 8px 0'
                  }}>
                    Saved Addresses
                  </h1>
                  <p style={{
                    fontFamily: "'Be Vietnam Pro', sans-serif",
                    fontSize: '15px',
                    color: '#5D4037',
                    margin: 0
                  }}>
                    Manage where we deliver your taste of home.
                  </p>
                </div>

                <button
                  onClick={() => setIsFormOpen(true)}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
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
                    flexShrink: 0,
                    width: isMobile ? '100%' : 'auto',
                    justifyContent: isMobile ? 'center' : 'flex-start',
                  }}
                  onMouseEnter={(e) => e.currentTarget.style.background = '#8B1A1A'}
                  onMouseLeave={(e) => e.currentTarget.style.background = '#B22222'}
                >
                  <Plus size={16} />
                  Add New Address
                </button>
              </motion.div>

              {/* Address List */}
              {isLoading ? (
                <div style={{ padding: '40px 0', textAlign: 'center', color: '#5D4037', fontFamily: "'Be Vietnam Pro', sans-serif" }}>
                  Loading addresses...
                </div>
              ) : addresses.length > 0 ? (
                <div style={{ display: 'grid', gap: '20px', marginBottom: '48px' }}>
                  {addresses.map(address => (
                    <motion.div key={address.id} variants={itemVariants}>
                      <AddressCard
                        address={address}
                        onEdit={(addr) => { setEditingAddress(addr); setIsFormOpen(true); }}
                        onDelete={(addr) => setDeletingAddress(addr)}
                        onSetDefault={handleSetDefault}
                      />
                    </motion.div>
                  ))}
                </div>
              ) : (
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
                    <MapPin size={32} color="#B22222" />
                  </div>
                  <div>
                    <h3 style={{ fontFamily: "'Literata', Georgia, serif", fontSize: '20px', fontWeight: 600, color: '#1C1007', margin: '0 0 8px 0' }}>
                      No saved addresses yet
                    </h3>
                    <p style={{ fontFamily: "'Be Vietnam Pro', sans-serif", fontSize: '15px', color: '#5D4037', margin: 0, maxWidth: '400px' }}>
                      Add your home or office address so your favorite ANNAPURNA premixes can reach you easily.
                    </p>
                  </div>
                  <button
                    onClick={() => setIsFormOpen(true)}
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
                    + Add New Address
                  </button>
                </motion.div>
              )}

              {/* Maa's Tip */}
              <motion.div variants={itemVariants}>
                <MaaTip>
                  "Double-check your pin code, beta, so your fresh premixes find their way home without a hitch! A clear address means a faster meal."
                </MaaTip>
              </motion.div>

            </motion.div>
          )}

        </div>
      </div>

      <DeleteAddressDialog
        isOpen={!!deletingAddress}
        isDeleting={isDeleting}
        onClose={() => setDeletingAddress(null)}
        onConfirm={handleDeleteConfirm}
      />
    </div>
  );
}
