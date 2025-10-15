'use client'
import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Zap, Star, AlertTriangle, CheckCircle, X, Info, Phone, CreditCard, Grid3x3, List, Airplay, Smartphone } from 'lucide-react';

// Toast Notification Component
const Toast = ({ message, type, onClose }) => {
  useEffect(() => {
    const timer = setTimeout(() => {
      onClose();
    }, 4000);
    
    return () => clearTimeout(timer);
  }, [onClose]);
  
  return (
    <div className="fixed top-4 right-4 z-50 animate-slide-in">
      <div className={`p-3 rounded-xl shadow-xl flex items-center backdrop-blur-xl border max-w-sm ${
        type === 'success' 
          ? 'bg-emerald-500/90 text-white border-emerald-400/50' 
          : type === 'error' 
            ? 'bg-red-500/90 text-white border-red-400/50' 
            : 'bg-purple-500/90 text-white border-purple-400/50'
      }`}>
        <div className="mr-2">
          {type === 'success' ? (
            <CheckCircle className="h-4 w-4" />
          ) : type === 'error' ? (
            <X className="h-4 w-4" />
          ) : (
            <Info className="h-4 w-4" />
          )}
        </div>
        <div className="flex-grow">
          <p className="font-medium text-sm">{message}</p>
        </div>
        <button onClick={onClose} className="ml-3 hover:scale-110 transition-transform">
          <X className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
};

// Purchase Modal Component
const PurchaseModal = ({ isOpen, onClose, bundle, phoneNumber, setPhoneNumber, onPurchase, error, isLoading }) => {
  if (!isOpen || !bundle) return null;

  const handlePhoneNumberChange = (e) => {
    let formatted = e.target.value.replace(/\D/g, '');
    if (formatted.length > 10) {
      formatted = formatted.substring(0, 10);
    }
    setPhoneNumber(formatted);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    onPurchase();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <div className="bg-white/10 backdrop-blur-xl rounded-2xl border border-white/20 w-full max-w-md shadow-xl">
        <div className="bg-gradient-to-r from-purple-600 via-purple-700 to-red-600 px-6 py-4 rounded-t-2xl flex justify-between items-center">
          <h3 className="text-lg font-bold text-white flex items-center">
            <Smartphone className="w-5 h-5 mr-2" />
            Purchase {bundle.capacity}GB
          </h3>
          <button onClick={onClose} className="text-white hover:text-white/70 p-1 rounded-lg hover:bg-white/10 transition-all">
            <X className="w-4 h-4" />
          </button>
        </div>
        
        <div className="px-6 py-4">
          <div className="bg-white/10 rounded-xl p-4 mb-4">
            <div className="flex justify-between items-center mb-2">
              <span className="text-white font-medium">Data Bundle:</span>
              <span className="text-purple-300 font-bold">{bundle.capacity}GB</span>
            </div>
            <div className="flex justify-between items-center mb-2">
              <span className="text-white font-medium">Network:</span>
              <span className="text-purple-300 font-bold">Telecel</span>
            </div>
            <div className="flex justify-between items-center mb-2">
              <span className="text-white font-medium">Duration:</span>
              <span className="text-emerald-400 font-bold">No-Expiry</span>
            </div>
            <div className="flex justify-between items-center border-t border-white/20 pt-2">
              <span className="text-white font-bold">Total Price:</span>
              <span className="text-purple-300 font-bold text-lg">GH₵{bundle.price}</span>
            </div>
          </div>

          {error && (
            <div className="mb-4 p-3 rounded-xl flex items-start bg-red-500/20 border border-red-500/30">
              <X className="w-4 h-4 text-red-400 mr-2 mt-0.5 flex-shrink-0" />
              <span className="text-red-200 text-sm">{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit}>
            <div className="mb-4">
              <label className="block text-sm font-bold mb-2 text-white">
                Enter Telecel Phone Number
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Phone className="w-4 h-4 text-purple-400" />
                </div>
                <input
                  type="tel"
                  value={phoneNumber}
                  onChange={handlePhoneNumberChange}
                  className="pl-10 pr-4 py-3 block w-full rounded-xl bg-white/10 backdrop-blur-sm border border-white/20 text-white placeholder-white/50 focus:ring-2 focus:ring-purple-500 focus:border-purple-500 font-medium"
                  placeholder="020XXXXXXX"
                  required
                  autoFocus
                />
              </div>
              <p className="mt-1 text-xs text-white/70">Must start with 020 or 050</p>
            </div>

            <div className="mb-4 p-3 bg-purple-500/20 border border-purple-500/30 rounded-xl">
              <div className="flex items-start">
                <AlertTriangle className="w-4 h-4 text-purple-400 mr-2 mt-0.5 flex-shrink-0" />
                <div>
                  <p className="text-purple-200 text-xs">
                    <strong>Important:</strong> Verify your number carefully. No refunds for wrong numbers.
                  </p>
                </div>
              </div>
            </div>

            <div className="flex space-x-3">
              <button
                type="button"
                onClick={onClose}
                className="flex-1 py-3 px-4 bg-white/10 hover:bg-white/20 text-white font-medium rounded-xl transition-all border border-white/20"
                disabled={isLoading}
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isLoading || !phoneNumber || phoneNumber.length !== 10}
                className="flex-1 py-3 px-4 bg-gradient-to-r from-purple-600 to-red-600 hover:from-purple-700 hover:to-red-700 text-white font-bold rounded-xl transition-all transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
              >
                {isLoading ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin mr-2"></div>
                    Processing...
                  </>
                ) : (
                  <>
                    <CreditCard className="w-4 h-4 mr-2" />
                    Purchase Now
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

const ServiceInfoModal = ({ isOpen, onClose, onConfirm }) => {
  if (!isOpen) return null;
  
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <div className="bg-white/10 backdrop-blur-xl rounded-2xl border border-white/20 w-full max-w-md shadow-xl">
        <div className="bg-gradient-to-r from-purple-600 to-red-600 px-6 py-4 rounded-t-2xl flex justify-between items-center">
          <h3 className="text-lg font-bold text-white flex items-center">
            <AlertTriangle className="w-5 h-5 mr-2" />
            Service Notice
          </h3>
          <button onClick={onClose} className="text-white hover:text-white/70 p-1 rounded-lg hover:bg-white/10 transition-all">
            <X className="w-4 h-4" />
          </button>
        </div>
        
        <div className="px-6 py-4 max-h-[60vh] overflow-y-auto">
          <div className="space-y-3 text-white/80 text-sm">
            <div className="flex items-start">
              <div className="w-1 h-1 rounded-full bg-purple-400 mr-2 mt-2 flex-shrink-0"></div>
              <p><strong className="text-white">Not instant service</strong> - delivery times vary</p>
            </div>
            <div className="flex items-start">
              <div className="w-1 h-1 rounded-full bg-purple-400 mr-2 mt-2 flex-shrink-0"></div>
              <p>Only 020 or 050 numbers supported</p>
            </div>
            <div className="flex items-start">
              <div className="w-1 h-1 rounded-full bg-purple-400 mr-2 mt-2 flex-shrink-0"></div>
              <p>Please be patient - orders may take time to process</p>
            </div>
          </div>
          
          <div className="bg-purple-500/20 border border-purple-500/30 p-3 rounded-xl mt-4">
            <div className="flex items-start">
              <Info className="w-4 h-4 text-purple-400 mr-2 mt-0.5 flex-shrink-0" />
              <p className="text-purple-200 text-sm">
                Thank you for your patience and understanding.
              </p>
            </div>
          </div>
        </div>
        
        <div className="px-6 py-4 border-t border-white/10 flex space-x-3">
          <button
            onClick={onClose}
            className="flex-1 py-2 px-3 bg-white/10 hover:bg-white/20 text-white font-medium rounded-xl transition-all border border-white/20 text-sm"
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            className="flex-1 py-2 px-3 bg-gradient-to-r from-purple-600 to-red-600 hover:from-purple-700 hover:to-red-700 text-white font-medium rounded-xl transition-all transform hover:scale-105 text-sm"
          >
            Continue
          </button>
        </div>
      </div>
    </div>
  );
};

const LoadingOverlay = ({ isLoading }) => {
  if (!isLoading) return null;
  
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm">
      <div className="bg-white/10 backdrop-blur-xl rounded-2xl border border-white/20 p-6 max-w-xs w-full mx-auto text-center shadow-xl">
        <div className="flex justify-center mb-4">
          <div className="relative w-12 h-12">
            <div className="w-12 h-12 rounded-full border-3 border-purple-200/20"></div>
            <div className="absolute top-0 w-12 h-12 rounded-full border-3 border-transparent border-t-purple-400 border-r-red-400 animate-spin"></div>
            <div className="absolute inset-2 rounded-full bg-gradient-to-br from-purple-600 to-red-600 animate-pulse flex items-center justify-center">
              <Smartphone className="w-4 h-4 text-white animate-bounce" strokeWidth={2.5} />
            </div>
          </div>
        </div>
        <h4 className="text-lg font-bold text-white mb-2">Processing...</h4>
        <p className="text-white/80 text-sm">Please wait while we process your order</p>
      </div>
    </div>
  );
};

const TelecelBundleSelect = () => {
  const [phoneNumber, setPhoneNumber] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [userData, setUserData] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isPurchaseModalOpen, setIsPurchaseModalOpen] = useState(false);
  const [pendingPurchase, setPendingPurchase] = useState(null);
  const [layout, setLayout] = useState('grid');
  const [error, setError] = useState('');
  
  const [toast, setToast] = useState({
    visible: false,
    message: '',
    type: 'success'
  });

  const inventoryAvailable = true;

  const bundles = [
    { capacity: '5', price: '19.50', network: 'TELECEL', inStock: inventoryAvailable },
    { capacity: '8', price: '34.64', network: 'TELECEL', inStock: inventoryAvailable },
    { capacity: '10', price: '36.50', network: 'TELECEL', inStock: inventoryAvailable },
    { capacity: '12', price: '43.70', network: 'TELECEL', inStock: inventoryAvailable },
    { capacity: '15', price: '52.85', network: 'TELECEL', inStock: inventoryAvailable },
    { capacity: '20', price: '69.80', network: 'TELECEL', inStock: inventoryAvailable },
    { capacity: '25', price: '86.75', network: 'TELECEL', inStock: inventoryAvailable },
    { capacity: '30', price: '103.70', network: 'TELECEL', inStock: inventoryAvailable },
    { capacity: '35', price: '120.65', network: 'TELECEL', inStock: inventoryAvailable },
    { capacity: '40', price: '137.60', network: 'TELECEL', inStock: inventoryAvailable },
    { capacity: '45', price: '154.55', network: 'TELECEL', inStock: inventoryAvailable },
    { capacity: '50', price: '171.50', network: 'TELECEL', inStock: inventoryAvailable },
    { capacity: '100', price: '341.00', network: 'TELECEL', inStock: inventoryAvailable }
  ];

  useEffect(() => {
    const storedUserData = localStorage.getItem('userData');
    if (storedUserData) {
      setUserData(JSON.parse(storedUserData));
    }
  }, []);

  useEffect(() => {
    const style = document.createElement('style');
    style.textContent = `
      @keyframes slideIn {
        from {
          opacity: 0;
          transform: translateX(100px);
        }
        to {
          opacity: 1;
          transform: translateX(0);
        }
      }
      .animate-slide-in {
        animation: slideIn 0.3s ease-out;
      }
    `;
    document.head.appendChild(style);
    
    return () => {
      document.head.removeChild(style);
    };
  }, []);

  const validatePhoneNumber = (number) => {
    const cleanNumber = number.replace(/[\s-]/g, '');
    const telecelPattern = /^(020|050)\d{7}$/;
    return telecelPattern.test(cleanNumber);
  };

  const showToast = (message, type = 'success') => {
    setToast({
      visible: true,
      message,
      type
    });
  };

  const hideToast = () => {
    setToast(prev => ({
      ...prev,
      visible: false
    }));
  };

  const handleBundleSelect = (bundle) => {
    if (!bundle.inStock) {
      showToast('This bundle is currently out of stock', 'error');
      return;
    }

    if (!userData || !userData.id) {
      showToast('Please login to continue', 'error');
      return;
    }

    setPendingPurchase(bundle);
    setPhoneNumber('');
    setError('');
    setIsPurchaseModalOpen(true);
  };

  const processPurchase = async () => {
    if (!pendingPurchase) return;
    
    if (!validatePhoneNumber(phoneNumber)) {
      setError('Please enter a valid Telecel number (020 or 050 followed by 7 digits)');
      return;
    }
    
    setIsLoading(true);
    setError('');

    try {
      const token = localStorage.getItem('authToken');
      const response = await axios.post('https://unlimiteddatagh.onrender.com/api/v1/data/purchase-data', {
        userId: userData.id,
        phoneNumber: phoneNumber,
        network: pendingPurchase.network,
        capacity: parseInt(pendingPurchase.capacity),
        price: parseFloat(pendingPurchase.price)
      }, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.data.status === 'success') {
        showToast(`${pendingPurchase.capacity}GB purchased successfully for ${phoneNumber}!`, 'success');
        setPhoneNumber('');
        setError('');
        setIsPurchaseModalOpen(false);
        setPendingPurchase(null);
      }
    } catch (error) {
      console.error('Purchase error:', error);
      const errorMessage = error.response?.data?.message || 'Purchase failed. Please try again.';
      setError(errorMessage);
      showToast(errorMessage, 'error');
    } finally {
      setIsLoading(false);
    }
  };

  const renderBundles = () => {
    if (layout === 'grid') {
      return (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {bundles.map((bundle, idx) => (
            <BundleCardLarge key={idx} bundle={bundle} onSelect={handleBundleSelect} />
          ))}
        </div>
      );
    } else if (layout === 'list') {
      return (
        <div className="space-y-3">
          {bundles.map((bundle, idx) => (
            <BundleCardList key={idx} bundle={bundle} onSelect={handleBundleSelect} />
          ))}
        </div>
      );
    } else if (layout === 'carousel') {
      return (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
          {bundles.map((bundle, idx) => (
            <BundleCardCompact key={idx} bundle={bundle} onSelect={handleBundleSelect} />
          ))}
        </div>
      );
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900/20 to-slate-900 relative overflow-hidden">
      {/* Background Elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-80 h-80 rounded-full bg-gradient-to-br from-purple-400/5 to-red-400/5 blur-3xl animate-pulse"></div>
        <div className="absolute -bottom-40 -left-40 w-80 h-80 rounded-full bg-gradient-to-br from-purple-400/5 to-red-400/5 blur-3xl animate-pulse delay-1000"></div>
      </div>

      {/* Toast Notification */}
      {toast.visible && (
        <Toast 
          message={toast.message}
          type={toast.type}
          onClose={hideToast}
        />
      )}
      
      {/* Loading Overlay */}
      <LoadingOverlay isLoading={isLoading} />
      
      <div className="relative z-10 min-h-screen p-4">
        <div className="max-w-7xl mx-auto">
          <ServiceInfoModal 
            isOpen={isModalOpen}
            onClose={() => setIsModalOpen(false)}
            onConfirm={() => {
              setIsModalOpen(false);
            }}
          />

          <PurchaseModal
            isOpen={isPurchaseModalOpen}
            onClose={() => {
              setIsPurchaseModalOpen(false);
              setPendingPurchase(null);
              setPhoneNumber('');
              setError('');
            }}
            bundle={pendingPurchase}
            phoneNumber={phoneNumber}
            setPhoneNumber={setPhoneNumber}
            onPurchase={processPurchase}
            error={error}
            isLoading={isLoading}
          />
          
          {/* Header */}
          <div className="mb-8">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center space-x-3">
                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-purple-600 to-red-600 flex items-center justify-center shadow-lg">
                  <img src="/logos/telecel.png" alt="Telecel" className="w-8 h-8 object-contain" />
                </div>
                <div>
                  <h1 className="text-3xl font-bold text-white">Telecel Data Bundles</h1>
                  <p className="text-white/70 text-sm">Premium Data Packages</p>
                </div>
              </div>
              
              {/* Layout Toggle */}
              <div className="flex gap-2">
                <button
                  onClick={() => setLayout('grid')}
                  className={`p-2 rounded-lg transition-all ${layout === 'grid' ? 'bg-gradient-to-r from-purple-600 to-red-600 text-white' : 'bg-white/10 text-white hover:bg-white/20'}`}
                  title="Grid View"
                >
                  <Grid3x3 className="w-5 h-5" />
                </button>
                <button
                  onClick={() => setLayout('list')}
                  className={`p-2 rounded-lg transition-all ${layout === 'list' ? 'bg-gradient-to-r from-purple-600 to-red-600 text-white' : 'bg-white/10 text-white hover:bg-white/20'}`}
                  title="List View"
                >
                  <List className="w-5 h-5" />
                </button>
                <button
                  onClick={() => setLayout('carousel')}
                  className={`p-2 rounded-lg transition-all ${layout === 'carousel' ? 'bg-gradient-to-r from-purple-600 to-red-600 text-white' : 'bg-white/10 text-white hover:bg-white/20'}`}
                  title="Compact View"
                >
                  <Airplay className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Service Info Button */}
            <div className="flex justify-center mb-4">
              <button
                onClick={() => setIsModalOpen(true)}
                className="flex items-center space-x-2 px-4 py-2 bg-purple-500/20 border border-purple-500/50 text-purple-400 font-medium rounded-lg hover:bg-purple-500/30 transition-all"
              >
                <Info className="h-4 w-4" />
                <span>Service Information</span>
              </button>
            </div>
          </div>

          {/* Bundles Container */}
          <div className="mb-8">
            {renderBundles()}
          </div>

          {/* Important Notice */}
          <div className="max-w-4xl mx-auto p-4 bg-red-500/20 border border-red-500/30 rounded-xl">
            <div className="flex items-start">
              <AlertTriangle className="w-5 h-5 text-red-400 mr-3 mt-0.5 flex-shrink-0" />
              <div>
                <h4 className="text-sm font-bold text-red-400 mb-2">Important Notice</h4>
                <div className="space-y-1 text-white/80 text-sm">
                  <p>• Only 020 or 050 numbers supported</p>
                  <p>• Not instant service - delivery takes time</p>
                  <p>• No refunds for wrong numbers</p>
                  <p>• Verify your number carefully before purchase</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

// Bundle Card Components

const BundleCardLarge = ({ bundle, onSelect }) => {
  return (
    <button
      onClick={() => onSelect(bundle)}
      disabled={!bundle.inStock}
      className={`relative p-6 rounded-2xl transition-all border transform hover:scale-105 group ${
        bundle.inStock
          ? 'bg-gradient-to-br from-purple-500/10 to-red-500/10 border-purple-500/30 hover:border-purple-500/60 cursor-pointer shadow-lg hover:shadow-xl'
          : 'bg-gray-500/10 border-gray-500/20 text-gray-500 cursor-not-allowed opacity-50'
      }`}
    >
      {/* Corner Badge */}
      {bundle.inStock && (
        <div className="absolute top-3 right-3 w-8 h-8 bg-gradient-to-br from-purple-600 to-red-600 rounded-full flex items-center justify-center shadow-lg">
          <Star className="w-4 h-4 text-white" />
        </div>
      )}

      {/* Content */}
      <div className="text-center">
        <div className="mb-4">
          <div className="inline-block w-16 h-16 bg-gradient-to-br from-purple-600 to-red-600 rounded-xl p-1 shadow-md">
            <img src="/logos/telecel.png" alt="Telecel" className="w-full h-full object-contain" />
          </div>
        </div>
        
        <h3 className="text-3xl font-bold text-white mb-1">{bundle.capacity}GB</h3>
        <p className="text-white/70 text-sm mb-4">No-Expiry Bundle</p>
        
        <div className="p-3 bg-white/10 rounded-lg mb-4">
          <p className="text-white/60 text-xs mb-1">Price</p>
          <p className="text-2xl font-bold text-purple-300">GH₵{bundle.price}</p>
        </div>
        
        <div className="w-full py-3 px-4 bg-gradient-to-r from-purple-600 to-red-600 text-white font-bold rounded-lg group-hover:shadow-lg transition-all">
          Buy Now
        </div>
      </div>
    </button>
  );
};

const BundleCardList = ({ bundle, onSelect }) => {
  return (
    <button
      onClick={() => onSelect(bundle)}
      disabled={!bundle.inStock}
      className={`w-full p-4 rounded-xl transition-all border flex items-center justify-between ${
        bundle.inStock
          ? 'bg-gradient-to-r from-purple-500/10 to-red-500/10 border-purple-500/30 hover:border-purple-500/60 hover:bg-purple-500/20 cursor-pointer'
          : 'bg-gray-500/10 border-gray-500/20 opacity-50'
      }`}
    >
      <div className="flex items-center space-x-4 flex-1">
        <div className="w-12 h-12 bg-gradient-to-br from-purple-600 to-red-600 rounded-lg p-1">
          <img src="/logos/telecel.png" alt="Telecel" className="w-full h-full object-contain" />
        </div>
        <div className="text-left">
          <h4 className="text-lg font-bold text-white">{bundle.capacity}GB</h4>
          <p className="text-white/60 text-sm">No-Expiry Bundle</p>
        </div>
      </div>
      <div className="text-right">
        <p className="text-2xl font-bold text-purple-300">GH₵{bundle.price}</p>
        <div className="w-24 py-2 px-3 bg-gradient-to-r from-purple-600 to-red-600 text-white font-semibold rounded-lg mt-2 text-sm">
          Buy
        </div>
      </div>
    </button>
  );
};

const BundleCardCompact = ({ bundle, onSelect }) => {
  return (
    <button
      onClick={() => onSelect(bundle)}
      disabled={!bundle.inStock}
      className={`p-3 rounded-lg transition-all border text-center ${
        bundle.inStock
          ? 'bg-gradient-to-br from-purple-500/20 to-red-500/20 border-purple-500/40 hover:border-purple-500/60 cursor-pointer hover:shadow-lg'
          : 'bg-gray-500/10 border-gray-500/20 opacity-50'
      }`}
    >
      <div className="w-10 h-10 bg-gradient-to-br from-purple-600 to-red-600 rounded-lg p-0.5 mx-auto mb-2">
        <img src="/logos/telecel.png" alt="Telecel" className="w-full h-full object-contain" />
      </div>
      <p className="text-purple-300 font-bold text-sm">{bundle.capacity}GB</p>
      <p className="text-purple-300 font-bold text-xs mt-1">GH₵{bundle.price}</p>
    </button>
  );
};

export default TelecelBundleSelect;