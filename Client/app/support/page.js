'use client'
import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { 
  MessageCircle, 
  Phone, 
  Mail, 
  Clock, 
  HelpCircle, 
  AlertTriangle, 
  CheckCircle, 
  X,
  Send,
  ArrowLeft,
  Zap,
  Database,
  CreditCard,
  Users,
  Settings
} from 'lucide-react';

const SupportPage = () => {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState('contact');
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    subject: '',
    message: '',
    category: 'general'
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitStatus, setSubmitStatus] = useState(null);

  const handleInputChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    
    try {
      // Simulate form submission
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      setSubmitStatus('success');
      setFormData({
        name: '',
        email: '',
        phone: '',
        subject: '',
        message: '',
        category: 'general'
      });
    } catch (error) {
      setSubmitStatus('error');
    } finally {
      setIsSubmitting(false);
    }
  };

  const faqData = [
    {
      category: 'Account & Registration',
      icon: Users,
      questions: [
        {
          q: 'How do I create an account?',
          a: 'Click on "Sign Up" in the top navigation, fill in your details, verify your email, and you\'re ready to start buying data bundles!'
        },
        {
          q: 'I forgot my password. How do I reset it?',
          a: 'Click "Forgot Password" on the login page, enter your email, and follow the instructions sent to your email address.'
        },
        {
          q: 'How do I verify my account?',
          a: 'Account verification is automatic after email confirmation. For additional verification, contact our support team.'
        }
      ]
    },
    {
      category: 'Data Bundles & Networks',
      icon: Database,
      questions: [
        {
          q: 'Which networks do you support?',
          a: 'We support MTN, AirtelTigo, and Telecel networks in Ghana. Check our dashboard for real-time availability.'
        },
        {
          q: 'How long does it take to receive data bundles?',
          a: 'Data bundles are delivered within 5 minutes to 4 hours depending on network conditions and system load.'
        },
        {
          q: 'What if my data bundle doesn\'t arrive?',
          a: 'Contact our support team immediately with your transaction reference. We\'ll investigate and provide a refund or resend within 24 hours.'
        },
        {
          q: 'Can I buy data for someone else?',
          a: 'Yes! Simply enter the recipient\'s phone number when purchasing. Make sure the number is correct as transactions cannot be reversed.'
        }
      ]
    },
    {
      category: 'Payments & Wallet',
      icon: CreditCard,
      questions: [
        {
          q: 'What payment methods do you accept?',
          a: 'We accept Mobile Money (MTN, Vodafone, AirtelTigo), Bank transfers, and Credit/Debit cards through our secure payment gateway.'
        },
        {
          q: 'How do I add money to my wallet?',
          a: 'Go to your dashboard, click "Top Up", choose your preferred payment method, and follow the instructions.'
        },
        {
          q: 'Is my payment information secure?',
          a: 'Yes! We use industry-standard encryption and never store your payment details. All transactions are processed securely.'
        },
        {
          q: 'How long do refunds take?',
          a: 'Refunds are processed within 24-48 hours and may take 3-5 business days to reflect in your account depending on your bank.'
        }
      ]
    },
    {
      category: 'Technical Support',
      icon: Settings,
      questions: [
        {
          q: 'The website is not loading properly. What should I do?',
          a: 'Try refreshing the page, clearing your browser cache, or using a different browser. If the issue persists, contact our technical support.'
        },
        {
          q: 'I\'m having trouble with the mobile app. Can you help?',
          a: 'Make sure you have the latest version installed. If issues continue, try uninstalling and reinstalling the app, then contact support.'
        },
        {
          q: 'How do I update my profile information?',
          a: 'Go to your profile page, click "Edit Profile", make your changes, and save. Some changes may require verification.'
        }
      ]
    }
  ];

  const contactMethods = [
    {
      icon: MessageCircle,
      title: 'WhatsApp Support',
      description: 'Get instant help from our support team',
      action: 'Chat Now',
      link: 'https://chat.whatsapp.com/LEfSM2A3RVKJ1yY8JB5osP',
      color: 'bg-green-500',
      available: '24/7 Available'
    },
    {
      icon: Phone,
      title: 'Phone Support',
      description: 'Speak directly with our support team',
      action: 'Call Now',
      link: 'tel:+233597760914',
      color: 'bg-blue-500',
      available: 'Mon-Fri, 8AM-8PM'
    },
    {
      icon: Mail,
      title: 'Email Support',
      description: 'Send us a detailed message',
      action: 'Send Email',
      link: 'mailto:support@unlimiteddata.com',
      color: 'bg-purple-500',
      available: 'Response within 24 hours'
    }
  ];

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <button
            onClick={() => router.back()}
            className="flex items-center text-yellow-600 hover:text-yellow-700 mb-4"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back
          </button>
          
          <div className="text-center">
            <div className="flex items-center justify-center mb-4">
              <div className="w-16 h-16 bg-yellow-500 rounded-full flex items-center justify-center">
                <HelpCircle className="w-8 h-8 text-white" />
              </div>
            </div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
              Support Center
            </h1>
            <p className="text-gray-600 dark:text-gray-400 text-lg">
              We're here to help you with any questions or issues
            </p>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="flex justify-center mb-8">
          <div className="bg-white dark:bg-gray-800 rounded-lg p-1 shadow-lg">
            <button
              onClick={() => setActiveTab('contact')}
              className={`px-6 py-2 rounded-md font-medium transition-colors ${
                activeTab === 'contact'
                  ? 'bg-yellow-500 text-white'
                  : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
              }`}
            >
              Contact Us
            </button>
            <button
              onClick={() => setActiveTab('faq')}
              className={`px-6 py-2 rounded-md font-medium transition-colors ${
                activeTab === 'faq'
                  ? 'bg-yellow-500 text-white'
                  : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
              }`}
            >
              FAQ
            </button>
          </div>
        </div>

        {/* Contact Tab */}
        {activeTab === 'contact' && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Contact Methods */}
            <div className="space-y-6">
              <h2 className="text-2xl font-semibold text-gray-900 dark:text-white">
                Get in Touch
              </h2>
              
              {contactMethods.map((method, index) => (
                <div
                  key={index}
                  className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-lg hover:shadow-xl transition-shadow"
                >
                  <div className="flex items-start space-x-4">
                    <div className={`w-12 h-12 ${method.color} rounded-lg flex items-center justify-center`}>
                      <method.icon className="w-6 h-6 text-white" />
                    </div>
                    <div className="flex-1">
                      <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-1">
                        {method.title}
                      </h3>
                      <p className="text-gray-600 dark:text-gray-400 mb-2">
                        {method.description}
                      </p>
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-gray-500 dark:text-gray-400">
                          {method.available}
                        </span>
                        <a
                          href={method.link}
                          target={method.link.startsWith('http') ? '_blank' : '_self'}
                          rel={method.link.startsWith('http') ? 'noopener noreferrer' : ''}
                          className="px-4 py-2 bg-yellow-500 text-white rounded-lg hover:bg-yellow-600 transition-colors font-medium"
                        >
                          {method.action}
                        </a>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Contact Form */}
            <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-lg">
              <h2 className="text-2xl font-semibold text-gray-900 dark:text-white mb-6">
                Send us a Message
              </h2>
              
              {submitStatus === 'success' && (
                <div className="mb-6 p-4 bg-green-100 dark:bg-green-900 border border-green-400 text-green-700 dark:text-green-300 rounded-lg flex items-center">
                  <CheckCircle className="w-5 h-5 mr-2" />
                  Thank you! Your message has been sent successfully. We'll get back to you soon.
                </div>
              )}
              
              {submitStatus === 'error' && (
                <div className="mb-6 p-4 bg-red-100 dark:bg-red-900 border border-red-400 text-red-700 dark:text-red-300 rounded-lg flex items-center">
                  <AlertTriangle className="w-5 h-5 mr-2" />
                  Sorry, there was an error sending your message. Please try again or contact us directly.
                </div>
              )}

              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Full Name *
                    </label>
                    <input
                      type="text"
                      name="name"
                      value={formData.name}
                      onChange={handleInputChange}
                      required
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-yellow-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Email Address *
                    </label>
                    <input
                      type="email"
                      name="email"
                      value={formData.email}
                      onChange={handleInputChange}
                      required
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-yellow-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                    />
                  </div>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Phone Number
                    </label>
                    <input
                      type="tel"
                      name="phone"
                      value={formData.phone}
                      onChange={handleInputChange}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-yellow-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Category
                    </label>
                    <select
                      name="category"
                      value={formData.category}
                      onChange={handleInputChange}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-yellow-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                    >
                      <option value="general">General Inquiry</option>
                      <option value="technical">Technical Support</option>
                      <option value="billing">Billing & Payments</option>
                      <option value="account">Account Issues</option>
                      <option value="data">Data Bundle Issues</option>
                      <option value="feedback">Feedback & Suggestions</option>
                    </select>
                  </div>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Subject *
                  </label>
                  <input
                    type="text"
                    name="subject"
                    value={formData.subject}
                    onChange={handleInputChange}
                    required
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-yellow-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Message *
                  </label>
                  <textarea
                    name="message"
                    value={formData.message}
                    onChange={handleInputChange}
                    required
                    rows={5}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-yellow-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                    placeholder="Please describe your issue or question in detail..."
                  />
                </div>
                
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full bg-yellow-500 text-white py-3 px-6 rounded-lg hover:bg-yellow-600 transition-colors font-medium flex items-center justify-center disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isSubmitting ? (
                    <>
                      <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                      Sending...
                    </>
                  ) : (
                    <>
                      <Send className="w-5 h-5 mr-2" />
                      Send Message
                    </>
                  )}
                </button>
              </form>
            </div>
          </div>
        )}

        {/* FAQ Tab */}
        {activeTab === 'faq' && (
          <div className="space-y-8">
            <div className="text-center">
              <h2 className="text-2xl font-semibold text-gray-900 dark:text-white mb-2">
                Frequently Asked Questions
              </h2>
              <p className="text-gray-600 dark:text-gray-400">
                Find answers to common questions about our services
              </p>
            </div>
            
            {faqData.map((category, categoryIndex) => (
              <div key={categoryIndex} className="bg-white dark:bg-gray-800 rounded-lg shadow-lg overflow-hidden">
                <div className="bg-yellow-500 px-6 py-4">
                  <div className="flex items-center">
                    <category.icon className="w-6 h-6 text-white mr-3" />
                    <h3 className="text-xl font-semibold text-white">
                      {category.category}
                    </h3>
                  </div>
                </div>
                
                <div className="p-6">
                  <div className="space-y-6">
                    {category.questions.map((faq, faqIndex) => (
                      <div key={faqIndex} className="border-b border-gray-200 dark:border-gray-700 last:border-b-0 pb-6 last:pb-0">
                        <h4 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                          {faq.q}
                        </h4>
                        <p className="text-gray-600 dark:text-gray-400 leading-relaxed">
                          {faq.a}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Quick Help Section */}
        <div className="mt-12 bg-gradient-to-r from-yellow-500 to-yellow-600 rounded-lg p-8 text-center text-white">
          <Zap className="w-12 h-12 mx-auto mb-4" />
          <h2 className="text-2xl font-bold mb-2">Need Immediate Help?</h2>
          <p className="mb-6 text-yellow-100">
            Join our WhatsApp support group for instant assistance from our team and community
          </p>
          <a
            href="https://chat.whatsapp.com/LEfSM2A3RVKJ1yY8JB5osP"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center bg-white text-yellow-600 px-6 py-3 rounded-lg font-semibold hover:bg-yellow-50 transition-colors"
          >
            <MessageCircle className="w-5 h-5 mr-2" />
            Join WhatsApp Support Group
          </a>
        </div>
      </div>
    </div>
  );
};

export default SupportPage;
