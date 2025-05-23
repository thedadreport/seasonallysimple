'use client';

// This file contains client-side only functionality that depends on browser APIs
// These functions will throw errors if imported in a server context

// Helper function to dynamically load PDF generation libraries
export const generatePDF = async (element, options = {}) => {
  if (typeof window === 'undefined') {
    throw new Error('PDF generation is only available in browser environments');
  }
  
  try {
    // Dynamically import the required libraries
    const html2canvasModule = await import('html2canvas');
    const jspdfModule = await import('jspdf');
    
    const html2canvas = html2canvasModule.default;
    const jsPDF = jspdfModule.default;
    
    // Default options
    const defaultOptions = {
      filename: 'download.pdf',
      scale: 2,
      format: 'a4',
      unit: 'mm',
      orientation: 'portrait'
    };
    
    // Merge default options with provided options
    const pdfOptions = { ...defaultOptions, ...options };
    
    // Generate canvas from the DOM element
    const canvas = await html2canvas(element, {
      scale: pdfOptions.scale,
      logging: false,
      useCORS: true,
      allowTaint: true
    });
    
    // Convert canvas to image data
    const imgData = canvas.toDataURL('image/png');
    
    // Initialize PDF document
    const pdf = new jsPDF({
      orientation: pdfOptions.orientation,
      unit: pdfOptions.unit,
      format: pdfOptions.format
    });
    
    // Calculate dimensions to fit on PDF
    const imgWidth = 210 - 20; // A4 width - margins
    const imgHeight = (canvas.height * imgWidth) / canvas.width;
    
    // Add image to PDF
    pdf.addImage(imgData, 'PNG', 10, 10, imgWidth, imgHeight);
    
    // Save the PDF
    pdf.save(pdfOptions.filename);
    
    return true;
  } catch (error) {
    console.error('PDF generation failed:', error);
    throw error;
  }
};

// Check if PDF generation is supported in the current environment
export const isPdfGenerationSupported = async () => {
  if (typeof window === 'undefined') {
    return false;
  }
  
  try {
    await Promise.all([
      import('html2canvas').catch(() => { throw new Error('html2canvas not available'); }),
      import('jspdf').catch(() => { throw new Error('jspdf not available'); })
    ]);
    return true;
  } catch (error) {
    console.warn('PDF generation not supported:', error);
    return false;
  }
};