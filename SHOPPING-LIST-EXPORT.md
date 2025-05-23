# Shopping List Export & Sharing Features

This document describes the implementation of advanced export and sharing features for the Seasonally Simple shopping list functionality.

## Features Overview

1. **Print-Friendly Format**
   - Optimized printing with clean layout and proper CSS
   - Standalone print view for sharing via URL
   - Automatic page breaks between categories for longer lists
   - Checkboxes for marking items during shopping

2. **Email Sharing**
   - Direct email sharing via mailto: links
   - Formatted plain text version for maximum compatibility
   - Organized by category for easy reading

3. **Text/SMS Sharing**
   - Mobile-optimized format for text messages
   - Uses Web Share API on supported devices
   - Fallback to clipboard for non-supported devices
   - Optimized for readability on small screens

4. **PDF Generation**
   - Client-side PDF generation with html2canvas and jsPDF
   - Maintains visual styling and organization of items
   - Downloadable for offline use

5. **Grocery App Integration**
   - Formatted text for easy copying into grocery apps
   - Compatible with popular apps like AnyList, Instacart, etc.
   - Preserves category organization

## Implementation Details

### Components

1. **ShoppingListShareModal** (`/app/components/ShoppingListShareModal.tsx`)
   - Provides a unified interface for all sharing and export options
   - Tab-based UI for different sharing methods
   - Previews of content for each sharing method
   - Client-side generation of sharing content

2. **Printable Page** (`/app/shopping-list/print/[id]/page.tsx`)
   - Standalone page for print-optimized view
   - Accessible via direct URL for sharing
   - Auto-triggers print dialog on load
   - Clean, minimal design for printing

### Libraries Used

- **html2canvas**: For capturing the DOM as a canvas for PDF generation
- **jsPDF**: For converting canvas to PDF documents
- **Web Share API**: For native mobile sharing on supported devices

### CSS Enhancements

The project includes special print-specific CSS rules in `globals.css`:

- Print-only styles that optimize for paper output
- Special handling for checkboxes to ensure they appear correctly
- Proper page breaks and margins
- Removal of UI elements not needed for printing

## Usage Instructions

### For Users

1. **Accessing Export Features**
   - Click "Share & Export" on any shopping list
   - Select the desired export method from the tabs on the left
   - Follow the prompts for each method

2. **Printing**
   - Choose the "Print" tab
   - Click "Print Now" to use the browser's print dialog
   - Alternatively, use "Printable Version" for a standalone page

3. **Email Sharing**
   - Enter the recipient's email address
   - Click "Send Email" to open your default email client
   - The content will be pre-populated in the email

4. **Text Sharing**
   - Enter an optional phone number
   - Click "Share via Text" to copy content to clipboard
   - On mobile devices, the native share sheet may appear

5. **Grocery App Integration**
   - View compatible grocery apps
   - Click "Copy for Grocery Apps" to copy formatted text
   - Paste into your preferred grocery app

### For Developers

1. **Adding New Sharing Methods**
   - Add a new tab in `ShoppingListShareModal.tsx`
   - Implement the necessary handling functions
   - Update the interface accordingly

2. **Customizing Export Formats**
   - Modify the formatting functions in `ShoppingListShareModal.tsx`
   - For PDF customization, adjust the html2canvas and jsPDF settings

3. **Adding Support for More Grocery Apps**
   - Update the grocery app icons and names in the apps tab
   - Adjust the formatting in `getAppContent()` if needed

## Future Enhancements

- Direct integration with grocery delivery services (Instacart API)
- QR code generation for easy sharing between devices
- Collaborative shopping lists with real-time updates
- Optional location-based store organization
- Integration with recipe scaling to adjust quantities automatically