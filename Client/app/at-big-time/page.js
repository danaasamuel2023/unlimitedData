'use client'
import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { 
  ArrowLeft, 
  Smartphone, 
  Zap, 
  Clock, 
  CheckCircle, 
  AlertCircle,
  Loader2,
  Wifi,
  Battery,
  Signal
} from 'lucide-react';

export default function ATBigTimePage() {
  const router = useRouter();
  const [phoneNumber, setPhoneNumber] = useState('');
  const [selectedBundle, setSelectedBundle] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [userData, setUserData] = useState(null);
  const [showPurchaseModal, setShowPurchaseModal] = useState(false);
  const [purchaseStatus, setPurchaseStatus] = useState('idle'); // idle, processing, success, error
  const [error, setError] = useState('');

  // AT Big Time bundles
  const bigTimeBundles = [
    { 
      id: 'bigtime-1gb', 
      name: 'Big Time 1GB', 
      data: '1GB', 
      validity: '7 Days', 
      price: '8.00',
      description: 'Perfect for light browsing and social media'
    },
    { 
      id: 'bigtime-2gb', 
      name: 'Big Time 2GB', 
      data: '2GB', 
      validity: '7 Days', 
      price: '15.00',
      description: 'Great for streaming and downloading'
    },
    { 
      id: 'bigtime-5gb', 
      name: 'Big Time 5GB', 
      data: '5GB', 
      validity: '7 Days', 
      price: '35.00',
      description: 'Ideal for heavy data users'
    },
    { 
      id: 'bigtime-10gb', 
      name: 'Big Time 10GB', 
      data: '10GB', 
      validity: '7 Days', 
      price: '65.00',
      description: 'Maximum data for power users'
    }
  ];

  useEffect(() => {
    // Check authentication
    const authToken = localStorage.getItem('authToken');
    if (!authToken) {
      router.push('/SignIn');
      return;
    }

    // Load user data
    const storedUserData = localStorage.getItem('userData');
    if (storedUserData) {
      const user = JSON.parse(storedUserData);
      setUserData(user);
    }
  }, [router]);

  const handleBundleSelect = (bundle) => {
    setSelectedBundle(bundle);
    setError('');
  };

  const handlePurchase = async () => {
    if (!phoneNumber || !selectedBundle) {
      setError('Please enter a phone number and select a bundle');
      return;
    }

    if (!phoneNumber.match(/^0[0-9]{9}$/)) {
      setError('Please enter a valid Ghana phone number (e.g., 0241234567)');
      return;
    }

    setIsLoading(true);
    setError('');
    setPurchaseStatus('processing');
    setShowPurchaseModal(true);

    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 3000));
      
      // Simulate success
      setPurchaseStatus('success');
      
      // Reset form after success
      setTimeout(() => {
        setPhoneNumber('');
        setSelectedBundle(null);
        setShowPurchaseModal(false);
        setPurchaseStatus('idle');
      }, 3000);
      
    } catch (error) {
      setPurchaseStatus('error');
      setError('Failed to purchase bundle. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const formatPhoneNumber = (value) => {
    // Remove all non-numeric characters
    const numericValue = value.replace(/\D/g, '');
    
    // Limit to 10 digits
    if (numericValue.length <= 10) {
      return numericValue;
    }
    return numericValue.slice(0, 10);
  };

  const handlePhoneChange = (e) => {
    const formatted = formatPhoneNumber(e.target.value);
    setPhoneNumber(formatted);
    setError('');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-purple-50 dark:from-gray-900 dark:to-gray-800">
      {/* Header */}
      <div className="bg-white dark:bg-gray-800 shadow-sm border-b border-gray-200 dark:border-gray-700">
        <div className="max-w-4xl mx-auto px-4 py-4">
          <div className="flex items-center">
            <button
              onClick={() => router.back()}
              className="mr-4 p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
            >
              <ArrowLeft className="w-5 h-5 text-gray-600 dark:text-gray-400" />
            </button>
            <div className="flex items-center">
              <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center mr-3">
                <Wifi className="w-5 h-5 text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-gray-900 dark:text-white">AT Big Time</h1>
                <p className="text-sm text-gray-500 dark:text-gray-400">High-speed data bundles for AirtelTigo</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 py-6">
        {/* User Balance */}
        {userData && (
          <div className="mb-6 bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500 dark:text-gray-400">Available Balance</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">
                  GHS {userData.balance?.toFixed(2) || '0.00'}
                </p>
              </div>
              <div className="text-right">
                <p className="text-sm text-gray-500 dark:text-gray-400">Account Status</p>
                <div className="flex items-center">
                  <div className="w-2 h-2 bg-green-500 rounded-full mr-2"></div>
                  <span className="text-sm font-medium text-green-600 dark:text-green-400">Active</span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Phone Number Input */}
        <div className="mb-6 bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Enter Phone Number</h3>
          <div className="flex items-center space-x-3">
            <div className="flex-1">
              <input
                type="tel"
                value={phoneNumber}
                onChange={handlePhoneChange}
                placeholder="0241234567"
                className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-lg"
                maxLength="10"
              />
            </div>
            <div className="flex items-center text-gray-500 dark:text-gray-400">
              <Smartphone className="w-5 h-5 mr-2" />
              <span className="text-sm">AirtelTigo</span>
            </div>
          </div>
          {error && (
            <div className="mt-3 flex items-center text-red-600 dark:text-red-400">
              <AlertCircle className="w-4 h-4 mr-2" />
              <span className="text-sm">{error}</span>
            </div>
          )}
        </div>

        {/* Bundle Selection */}
        <div className="mb-6">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Select Big Time Bundle</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {bigTimeBundles.map((bundle) => (
              <div
                key={bundle.id}
                onClick={() => handleBundleSelect(bundle)}
                className={`relative p-6 rounded-lg border-2 cursor-pointer transition-all duration-200 ${
                  selectedBundle?.id === bundle.id
                    ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20 shadow-lg'
                    : 'border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 hover:border-gray-300 dark:hover:border-gray-600 hover:shadow-md'
                }`}
              >
                {selectedBundle?.id === bundle.id && (
                  <div className="absolute top-3 right-3">
                    <CheckCircle className="w-6 h-6 text-blue-500" />
                  </div>
                )}
                
                <div className="flex items-center justify-between mb-3">
                  <h4 className="text-lg font-semibold text-gray-900 dark:text-white">
                    {bundle.name}
                  </h4>
                  <div className="text-right">
                    <p className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                      GHS {bundle.price}
                    </p>
                  </div>
                </div>
                
                <div className="space-y-2">
                  <div className="flex items-center text-gray-600 dark:text-gray-400">
                    <Signal className="w-4 h-4 mr-2" />
                    <span className="text-sm">{bundle.data}</span>
                  </div>
                  <div className="flex items-center text-gray-600 dark:text-gray-400">
                    <Clock className="w-4 h-4 mr-2" />
                    <span className="text-sm">Valid for {bundle.validity}</span>
                  </div>
                  <p className="text-sm text-gray-500 dark:text-gray-400 mt-2">
                    {bundle.description}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Purchase Button */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
          <button
            onClick={handlePurchase}
            disabled={!phoneNumber || !selectedBundle || isLoading}
            className="w-full flex items-center justify-center px-6 py-4 bg-gradient-to-r from-blue-500 to-purple-600 text-white rounded-lg hover:from-blue-600 hover:to-purple-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 font-semibold text-lg"
          >
            {isLoading ? (
              <>
                <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                Processing...
              </>
            ) : (
              <>
                <Zap className="w-5 h-5 mr-2" />
                Purchase Bundle
              </>
            )}
          </button>
          
          {selectedBundle && (
            <div className="mt-4 p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
              <h4 className="font-semibold text-gray-900 dark:text-white mb-2">Order Summary</h4>
              <div className="flex justify-between items-center">
                <span className="text-gray-600 dark:text-gray-400">{selectedBundle.name}</span>
                <span className="font-semibold text-gray-900 dark:text-white">GHS {selectedBundle.price}</span>
              </div>
              <div className="flex justify-between items-center mt-1">
                <span className="text-gray-600 dark:text-gray-400">Phone: {phoneNumber}</span>
                <span className="text-sm text-gray-500 dark:text-gray-400">AirtelTigo</span>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Purchase Modal */}
      {showPurchaseModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-md w-full p-6">
            {purchaseStatus === 'processing' && (
              <div className="text-center">
                <div className="w-16 h-16 mx-auto mb-4 bg-blue-100 dark:bg-blue-900/20 rounded-full flex items-center justify-center">
                  <Loader2 className="w-8 h-8 text-blue-500 animate-spin" />
                </div>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                  Processing Your Order
                </h3>
                <p className="text-gray-600 dark:text-gray-400">
                  Please wait while we process your Big Time bundle purchase...
                </p>
              </div>
            )}

            {purchaseStatus === 'success' && (
              <div className="text-center">
                <div className="w-16 h-16 mx-auto mb-4 bg-green-100 dark:bg-green-900/20 rounded-full flex items-center justify-center">
                  <CheckCircle className="w-8 h-8 text-green-500" />
                </div>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                  Purchase Successful!
                </h3>
                <p className="text-gray-600 dark:text-gray-400 mb-4">
                  Your {selectedBundle?.name} bundle has been successfully purchased and will be activated shortly.
                </p>
                <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-3">
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    <strong>Phone:</strong> {phoneNumber}
                  </p>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    <strong>Bundle:</strong> {selectedBundle?.name}
                  </p>
                </div>
              </div>
            )}

            {purchaseStatus === 'error' && (
              <div className="text-center">
                <div className="w-16 h-16 mx-auto mb-4 bg-red-100 dark:bg-red-900/20 rounded-full flex items-center justify-center">
                  <AlertCircle className="w-8 h-8 text-red-500" />
                </div>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                  Purchase Failed
                </h3>
                <p className="text-gray-600 dark:text-gray-400 mb-4">
                  {error || 'An error occurred while processing your purchase. Please try again.'}
                </p>
                <button
                  onClick={() => {
                    setShowPurchaseModal(false);
                    setPurchaseStatus('idle');
                    setError('');
                  }}
                  className="w-full px-4 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600 transition-colors"
                >
                  Try Again
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
