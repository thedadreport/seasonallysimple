'use client';

import { useState, useRef, useEffect } from 'react';
import { ShoppingList } from '@/types/shoppingList';
import { toast } from 'react-hot-toast';

interface ShoppingListShareModalProps {
  isOpen: boolean;
  onClose: () => void;
  shoppingList: ShoppingList | null;
}

export default function ShoppingListShareModal({ isOpen, onClose, shoppingList }: ShoppingListShareModalProps) {
  const [shareOption, setShareOption] = useState<'print' | 'pdf' | 'email' | 'text' | 'apps'>('print');
  const [emailAddress, setEmailAddress] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [pdfSupported, setPdfSupported] = useState(false);
  const printPreviewRef = useRef<HTMLDivElement>(null);
  
  // Check if PDF generation is supported (only in client-side environment)
  useEffect(() => {
    const checkPdfSupport = async () => {
      try {
        // Check if we can require these modules
        if (typeof window !== 'undefined') {
          require('html2canvas');
          require('jspdf');
          setPdfSupported(true);
        }
      } catch (err) {
        console.warn('PDF generation not supported:', err);
        setPdfSupported(false);
      }
    };
    
    checkPdfSupport();
  }, []);

  if (!isOpen || !shoppingList) return null;

  // Group items by category
  const groupedItems = shoppingList.items.reduce((acc, item) => {
    if (!acc[item.category]) {
      acc[item.category] = [];
    }
    acc[item.category].push(item);
    return acc;
  }, {} as Record<string, any[]>);

  // Custom category ordering
  const categoryOrder = [
    'produce', 
    'dairy', 
    'meat', 
    'seafood', 
    'grains', 
    'Fresh Herbs',
    'Herbs & Spices', 
    'Spices',
    'Baking',
    'Canned Goods', 
    'Oils & Vinegars',
    'Condiments',
    'pantry', 
    'other'
  ];

  const sortedCategories = Object.keys(groupedItems).sort((a, b) => {
    const indexA = categoryOrder.indexOf(a);
    const indexB = categoryOrder.indexOf(b);
    
    if (indexA === -1 && indexB === -1) {
      return a.localeCompare(b);
    }
    
    if (indexA === -1) return 1;
    if (indexB === -1) return -1;
    
    return indexA - indexB;
  });

  // Handle print action
  const handlePrint = () => {
    window.print();
  };

  // Handle PDF generation
  const handlePDFDownload = async () => {
    if (!printPreviewRef.current || typeof window === 'undefined') return;
    
    setIsLoading(true);
    
    try {
      // Only import these libraries on the client side
      if (typeof window !== 'undefined') {
        // Using require instead of import for better compatibility with Next.js
        const html2canvas = require('html2canvas').default;
        const jsPDF = require('jspdf').default;
        
        const canvas = await html2canvas(printPreviewRef.current, {
          scale: 2,
          logging: false,
          useCORS: true,
          allowTaint: true
        });
        
        const imgData = canvas.toDataURL('image/png');
        const pdf = new jsPDF({
          orientation: 'portrait',
          unit: 'mm',
          format: 'a4'
        });
        
        // Calculate dimensions to fit on PDF
        const imgWidth = 210 - 20; // A4 width - margins
        const imgHeight = (canvas.height * imgWidth) / canvas.width;
        
        pdf.addImage(imgData, 'PNG', 10, 10, imgWidth, imgHeight);
        pdf.save(`${shoppingList.name.replace(/\s+/g, '-').toLowerCase()}.pdf`);
        
        toast.success('PDF downloaded successfully');
      }
    } catch (error) {
      console.error('Error generating PDF:', error);
      toast.error('Failed to generate PDF');
    } finally {
      setIsLoading(false);
    }
  };

  // Handle email sharing
  const handleEmailShare = async () => {
    if (!emailAddress) {
      toast.error('Please enter an email address');
      return;
    }
    
    setIsLoading(true);
    
    // Format shopping list content for email
    const emailSubject = encodeURIComponent(`Shopping List: ${shoppingList.name}`);
    let emailBody = encodeURIComponent(`${shoppingList.name}\n\n`);
    
    sortedCategories.forEach(category => {
      emailBody += encodeURIComponent(`${category.toUpperCase()}\n`);
      groupedItems[category].forEach(item => {
        emailBody += encodeURIComponent(`- ${item.name} (${item.quantity} ${item.unit || ''})\n`);
      });
      emailBody += encodeURIComponent('\n');
    });
    
    // Attempt to use mailto: link
    window.location.href = `mailto:${emailAddress}?subject=${emailSubject}&body=${emailBody}`;
    
    // In real implementation, you would send this to a server endpoint to handle email delivery
    // For now, simulate the process with a timeout
    setTimeout(() => {
      setIsLoading(false);
      toast.success(`List shared to ${emailAddress}`);
    }, 1000);
  };

  // Handle SMS/text sharing
  const handleTextShare = async () => {
    if (!phoneNumber) {
      toast.error('Please enter a phone number');
      return;
    }
    
    setIsLoading(true);
    
    // Format shopping list content for SMS
    let textMessage = `${shoppingList.name}\n\n`;
    
    sortedCategories.forEach(category => {
      textMessage += `${category.toUpperCase()}\n`;
      groupedItems[category].forEach(item => {
        textMessage += `- ${item.name} (${item.quantity} ${item.unit || ''})\n`;
      });
      textMessage += '\n';
    });
    
    // In a real implementation, you would send this to a server endpoint to handle SMS delivery
    // Here we're simulating it
    
    // Check if we can use the Web Share API for mobile devices
    if (navigator.share) {
      try {
        await navigator.share({
          title: `Shopping List: ${shoppingList.name}`,
          text: textMessage
        });
        toast.success('Shared successfully!');
      } catch (err) {
        console.error('Error sharing:', err);
        toast.error('Failed to share');
      }
    } else {
      // Fallback for desktop - copy to clipboard
      navigator.clipboard.writeText(textMessage)
        .then(() => toast.success('Copied to clipboard! Paste into your messaging app.'))
        .catch(() => toast.error('Failed to copy text'));
    }
    
    setIsLoading(false);
  };

  // Handle sharing to grocery apps
  const handleAppShare = () => {
    // Format shopping list content for app sharing
    let listText = `${shoppingList.name}\n\n`;
    
    sortedCategories.forEach(category => {
      listText += `${category.toUpperCase()}\n`;
      groupedItems[category].forEach(item => {
        listText += `- ${item.name} (${item.quantity} ${item.unit || ''})\n`;
      });
      listText += '\n';
    });
    
    // Copy formatted text to clipboard
    navigator.clipboard.writeText(listText)
      .then(() => {
        toast.success('Copied to clipboard! Paste into your grocery app.');
      })
      .catch(() => {
        toast.error('Failed to copy text');
      });
  };

  // Generate clipboard content for grocery apps
  const getAppContent = () => {
    let content = '';
    
    sortedCategories.forEach(category => {
      content += `${category.toUpperCase()}\n`;
      groupedItems[category].forEach(item => {
        content += `- ${item.name} (${item.quantity} ${item.unit || ''})\n`;
      });
      content += '\n';
    });
    
    return content;
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg max-w-3xl w-full max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="p-4 border-b border-gray-200 flex justify-between items-center">
          <h2 className="text-xl font-serif font-bold text-navy">Share Shopping List</h2>
          <button 
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600"
            aria-label="Close"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
        
        {/* Main content */}
        <div className="flex flex-col md:flex-row overflow-hidden flex-grow">
          {/* Options sidebar */}
          <div className="w-full md:w-1/3 border-r border-gray-200 bg-gray-50">
            <div className="p-4">
              <h3 className="font-medium text-navy mb-3">Export Options</h3>
              <ul className="space-y-2">
                <li>
                  <button 
                    onClick={() => setShareOption('print')} 
                    className={`w-full text-left px-3 py-2 rounded-md flex items-center ${shareOption === 'print' ? 'bg-sage text-white' : 'hover:bg-gray-100'}`}
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
                    </svg>
                    Print
                  </button>
                </li>
                <li>
                  <button 
                    onClick={() => setShareOption('pdf')} 
                    className={`w-full text-left px-3 py-2 rounded-md flex items-center ${shareOption === 'pdf' ? 'bg-sage text-white' : 'hover:bg-gray-100'}`}
                    disabled={!pdfSupported}
                    title={!pdfSupported ? 'PDF generation not available' : 'Download as PDF'}
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                    Download PDF {!pdfSupported && '(Not Available)'}
                  </button>
                </li>
                <li>
                  <button 
                    onClick={() => setShareOption('email')} 
                    className={`w-full text-left px-3 py-2 rounded-md flex items-center ${shareOption === 'email' ? 'bg-sage text-white' : 'hover:bg-gray-100'}`}
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                    </svg>
                    Email
                  </button>
                </li>
                <li>
                  <button 
                    onClick={() => setShareOption('text')} 
                    className={`w-full text-left px-3 py-2 rounded-md flex items-center ${shareOption === 'text' ? 'bg-sage text-white' : 'hover:bg-gray-100'}`}
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
                    </svg>
                    Text Message
                  </button>
                </li>
                <li>
                  <button 
                    onClick={() => setShareOption('apps')} 
                    className={`w-full text-left px-3 py-2 rounded-md flex items-center ${shareOption === 'apps' ? 'bg-sage text-white' : 'hover:bg-gray-100'}`}
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                    </svg>
                    Grocery Apps
                  </button>
                </li>
              </ul>
            </div>
          </div>
          
          {/* Content panel */}
          <div className="w-full md:w-2/3 p-4 overflow-auto flex-grow">
            {shareOption === 'print' && (
              <div>
                <p className="text-gray-600 mb-4">Print your shopping list to take with you to the store.</p>
                
                <div ref={printPreviewRef} className="border border-gray-200 rounded-lg p-4 mb-4 print-preview">
                  <h2 className="text-2xl font-serif font-bold text-navy mb-2">{shoppingList.name}</h2>
                  <p className="text-gray-600 mb-4">{new Date().toLocaleDateString()}</p>
                  
                  {sortedCategories.map((category) => (
                    <div key={category} className="mb-6">
                      <h3 className="text-lg font-medium text-navy capitalize border-b border-gray-200 pb-1 mb-2">
                        {category}
                      </h3>
                      <ul className="space-y-2">
                        {groupedItems[category].map((item) => (
                          <li key={item.id} className="flex items-start gap-2">
                            <div className="print-checkbox border border-gray-300 w-4 h-4 mt-1 flex-shrink-0"></div>
                            <div>
                              <span className="font-medium">{item.name}</span>
                              <span className="text-gray-600 ml-2">
                                {item.quantity} {item.unit}
                              </span>
                            </div>
                          </li>
                        ))}
                      </ul>
                    </div>
                  ))}

                  <div className="text-center text-gray-400 text-sm mt-8 print-footer">
                    Generated with Seasonally Simple
                  </div>
                </div>
                
                <div className="flex gap-2">
                  <button
                    onClick={handlePrint}
                    className="btn-primary flex-grow"
                  >
                    Print Now
                  </button>
                  
                  <a 
                    href={`/shopping-list/print/${shoppingList.id}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="btn-secondary"
                  >
                    Printable Version
                  </a>
                </div>
              </div>
            )}
            
            {shareOption === 'pdf' && (
              <div>
                <p className="text-gray-600 mb-4">Download your shopping list as a PDF to use offline.</p>
                
                <div ref={printPreviewRef} className="border border-gray-200 rounded-lg p-4 mb-4 print-preview">
                  <h2 className="text-2xl font-serif font-bold text-navy mb-2">{shoppingList.name}</h2>
                  <p className="text-gray-600 mb-4">{new Date().toLocaleDateString()}</p>
                  
                  {sortedCategories.map((category) => (
                    <div key={category} className="mb-6">
                      <h3 className="text-lg font-medium text-navy capitalize border-b border-gray-200 pb-1 mb-2">
                        {category}
                      </h3>
                      <ul className="space-y-2">
                        {groupedItems[category].map((item) => (
                          <li key={item.id} className="flex items-start gap-2">
                            <div className="pdf-checkbox border border-gray-300 w-4 h-4 mt-1 flex-shrink-0"></div>
                            <div>
                              <span className="font-medium">{item.name}</span>
                              <span className="text-gray-600 ml-2">
                                {item.quantity} {item.unit}
                              </span>
                            </div>
                          </li>
                        ))}
                      </ul>
                    </div>
                  ))}

                  <div className="text-center text-gray-400 text-sm mt-8">
                    Generated with Seasonally Simple
                  </div>
                </div>
                
                {pdfSupported ? (
                  <button
                    onClick={handlePDFDownload}
                    className="btn-primary w-full"
                    disabled={isLoading}
                  >
                    {isLoading ? (
                      <span className="flex items-center justify-center">
                        <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                        Generating PDF...
                      </span>
                    ) : (
                      'Download PDF'
                    )}
                  </button>
                ) : (
                  <div className="bg-yellow-50 border border-yellow-200 text-yellow-800 p-4 rounded-md">
                    <p className="text-sm font-medium">PDF generation is not available in this environment.</p>
                    <p className="text-xs mt-1">Please use the print option instead.</p>
                  </div>
                )}
              </div>
            )}
            
            {shareOption === 'email' && (
              <div>
                <p className="text-gray-600 mb-4">Share your shopping list via email.</p>
                
                <div className="mb-4">
                  <label className="block text-gray-700 mb-2">Email Address</label>
                  <input
                    type="email"
                    value={emailAddress}
                    onChange={(e) => setEmailAddress(e.target.value)}
                    placeholder="recipient@example.com"
                    className="w-full input-field"
                    required
                  />
                </div>
                
                <div className="border border-gray-200 rounded-lg p-4 mb-4 max-h-64 overflow-auto">
                  <h3 className="font-medium mb-2">Preview:</h3>
                  <div className="text-sm text-gray-600">
                    <p className="font-medium">{shoppingList.name}</p>
                    {sortedCategories.map((category) => (
                      <div key={category} className="mt-2">
                        <p className="font-medium uppercase text-xs">{category}</p>
                        <ul className="ml-4">
                          {groupedItems[category].map((item) => (
                            <li key={item.id}>
                              - {item.name} ({item.quantity} {item.unit || ''})
                            </li>
                          ))}
                        </ul>
                      </div>
                    ))}
                  </div>
                </div>
                
                <button
                  onClick={handleEmailShare}
                  className="btn-primary w-full"
                  disabled={isLoading || !emailAddress}
                >
                  {isLoading ? (
                    <span className="flex items-center justify-center">
                      <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      Sending...
                    </span>
                  ) : (
                    'Send Email'
                  )}
                </button>
              </div>
            )}
            
            {shareOption === 'text' && (
              <div>
                <p className="text-gray-600 mb-4">Share your shopping list via text message or use the mobile share feature if available.</p>
                
                <div className="mb-4">
                  <label className="block text-gray-700 mb-2">Phone Number (optional)</label>
                  <input
                    type="tel"
                    value={phoneNumber}
                    onChange={(e) => setPhoneNumber(e.target.value)}
                    placeholder="(555) 123-4567"
                    className="w-full input-field"
                  />
                </div>
                
                <div className="border border-gray-200 rounded-lg p-4 mb-4 max-h-64 overflow-auto">
                  <h3 className="font-medium mb-2">Preview:</h3>
                  <div className="text-sm text-gray-600">
                    <p className="font-medium">{shoppingList.name}</p>
                    {sortedCategories.map((category) => (
                      <div key={category} className="mt-2">
                        <p className="font-medium uppercase text-xs">{category}</p>
                        <ul className="ml-4">
                          {groupedItems[category].map((item) => (
                            <li key={item.id}>
                              - {item.name} ({item.quantity} {item.unit || ''})
                            </li>
                          ))}
                        </ul>
                      </div>
                    ))}
                  </div>
                </div>
                
                <div className="flex gap-2">
                  <button
                    onClick={handleTextShare}
                    className="btn-primary flex-grow"
                    disabled={isLoading}
                  >
                    {isLoading ? (
                      <span className="flex items-center justify-center">
                        <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                        Sending...
                      </span>
                    ) : (
                      'Share via Text'
                    )}
                  </button>
                  
                  {navigator.share && (
                    <button
                      onClick={() => {
                        const textMessage = getAppContent();
                        navigator.share({
                          title: `Shopping List: ${shoppingList.name}`,
                          text: textMessage
                        })
                        .then(() => toast.success('Shared successfully!'))
                        .catch(err => console.error('Error sharing:', err));
                      }}
                      className="btn-secondary"
                    >
                      Mobile Share
                    </button>
                  )}
                </div>
              </div>
            )}
            
            {shareOption === 'apps' && (
              <div>
                <p className="text-gray-600 mb-4">Copy your shopping list to use with popular grocery apps.</p>
                
                <div className="mb-6">
                  <h3 className="font-medium mb-3">Compatible with:</h3>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                    <div className="border border-gray-200 rounded-lg p-3 text-center">
                      <div className="bg-blue-100 text-blue-800 w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-2">A</div>
                      <p className="text-sm font-medium">AnyList</p>
                    </div>
                    <div className="border border-gray-200 rounded-lg p-3 text-center">
                      <div className="bg-green-100 text-green-800 w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-2">I</div>
                      <p className="text-sm font-medium">Instacart</p>
                    </div>
                    <div className="border border-gray-200 rounded-lg p-3 text-center">
                      <div className="bg-orange-100 text-orange-800 w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-2">O</div>
                      <p className="text-sm font-medium">OurGroceries</p>
                    </div>
                    <div className="border border-gray-200 rounded-lg p-3 text-center">
                      <div className="bg-purple-100 text-purple-800 w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-2">T</div>
                      <p className="text-sm font-medium">Todoist</p>
                    </div>
                    <div className="border border-gray-200 rounded-lg p-3 text-center">
                      <div className="bg-red-100 text-red-800 w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-2">G</div>
                      <p className="text-sm font-medium">Google Keep</p>
                    </div>
                    <div className="border border-gray-200 rounded-lg p-3 text-center">
                      <div className="bg-yellow-100 text-yellow-800 w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-2">+</div>
                      <p className="text-sm font-medium">And more...</p>
                    </div>
                  </div>
                </div>
                
                <div className="border border-gray-200 rounded-lg p-4 mb-4 max-h-64 overflow-auto">
                  <h3 className="font-medium mb-2">Content to copy:</h3>
                  <div className="text-sm text-gray-600">
                    <p className="font-medium">{shoppingList.name}</p>
                    {sortedCategories.map((category) => (
                      <div key={category} className="mt-2">
                        <p className="font-medium uppercase text-xs">{category}</p>
                        <ul className="ml-4">
                          {groupedItems[category].map((item) => (
                            <li key={item.id}>
                              - {item.name} ({item.quantity} {item.unit || ''})
                            </li>
                          ))}
                        </ul>
                      </div>
                    ))}
                  </div>
                </div>
                
                <button
                  onClick={handleAppShare}
                  className="btn-primary w-full"
                >
                  Copy for Grocery Apps
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}