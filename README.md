# ShoppingBird

A smart shopping assistant application built with Next.js, TypeScript, and Supabase. This application helps everyday people record their purchases with a POS-like interface.

## Features

- **Point of Sale (POS) Interface**: Scan or enter barcodes to add items to cart
- **🆕 UPC API Integration**: Automatically fetch product information using UPC/EAN barcodes
- **Store Management**: Create and manage multiple stores
- **Item Management**: Add items with price lists for different stores
- **Multi-language Support**: English and Dhivehi (Maldivian) language support
- **Enhanced Barcode Scanning**: Add items by scanning UPC/EAN codes with automatic product data
- **Invoice Generation**: Create and track purchase invoices
- **Price Management**: Set different prices for items across stores
- **🆕 Product Enhancement**: Rich product metadata with images, brands, models, and categories
- **🆕 Automatic Tagging**: Smart categorization using brand and category information
- **🆕 Price History Tracking**: Foundation for tracking price changes over time

## Technology Stack

- **Frontend**: Next.js 14 with TypeScript
- **UI Components**: shadcn/ui with Tailwind CSS
- **Database**: Supabase (PostgreSQL)
- **Authentication**: Supabase Auth
- **State Management**: React hooks
- **Internationalization**: Custom i18n implementation

## Database Schema

The application uses the following main tables:

- `stores` - Store information
- `items` - Product/item catalog with **enhanced UPC fields** (ean, upc, gtin, asin, title, brand, model, etc.)
- `units` - Measurement units (kg, pieces, etc.)
- `price_lists` - Item prices per store with barcodes
- `invoices` - Purchase transaction records
- `invoice_details` - Line items for each invoice
- `users` - User management
- **🆕 `tags`** - Product categorization and brand tags
- **🆕 `item_tags`** - Many-to-many relationship between items and tags
- **🆕 `price_history`** - Historical price tracking for trend analysis

## Setup Instructions

### 1. Clone the repository
```bash
git clone <repository-url>
cd ShoppingBird
```

### 2. Install dependencies
```bash
npm install
```

### 3. Set up Supabase
1. Create a new Supabase project
2. The database tables and initial data have been set up via the Supabase migration
3. Copy your Supabase URL and anon key

### 4. Environment Variables
Create a `.env.local` file in the root directory:
```bash
cp .env.local.example .env.local
```

Update the values in `.env.local`:
```
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url_here
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key_here
```

### 5. Run the development server
```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the application.

## Usage

### Point of Sale (POS)
1. Navigate to the POS page
2. Select a store from the dropdown
3. Scan or enter a barcode
4. Items will be added to the cart
5. Adjust quantities as needed
6. Add any adjustment amount
7. Process the payment to complete the transaction

### Store Management
1. Navigate to the Stores page
2. Add new stores by clicking "Add Store"
3. Edit or delete existing stores

### Item Management
1. Navigate to the Items page
2. Add new items in two ways:
   - **🆕 Scan UPC**: Click "Scan UPC" to automatically fetch product information
   - **Manual Entry**: Click "Add Item" for traditional manual entry
3. For each item, add price information for different stores
4. Set barcodes, prices, and units for each store

### 🆕 UPC/EAN Product Enhancement
1. Click the "Scan UPC" button on the Items page
2. Enter a valid UPC/EAN barcode (8, 12, or 13 digits)
3. The system automatically fetches:
   - Product title and description
   - Brand and model information
   - Product images
   - Category and dimension data
   - Historical price information
4. Products are automatically tagged with brand and category information
5. Enhanced product cards display rich metadata and UPC badges

### Language Support
The application supports English and Dhivehi languages. Language strings are stored in JSON files under `src/lib/i18n/`.

## API Endpoints

The application uses Supabase's auto-generated API. Key operations include:

- **Items**: CRUD operations for items and price lists
- **Stores**: CRUD operations for stores
- **Invoices**: Create and retrieve purchase transactions
- **Units**: Manage measurement units

## Development

### Project Structure
```
src/
├── app/                    # Next.js app directory
│   ├── items/             # Items management page
│   ├── pos/               # Point of Sale interface
│   ├── stores/            # Store management page
│   └── layout.tsx         # Root layout
├── components/            # Reusable components
│   ├── ui/                # shadcn/ui components
│   └── navigation.tsx     # Navigation component
├── lib/                   # Utilities and configurations
│   ├── i18n/              # Internationalization
│   ├── supabase.ts        # Supabase client
│   ├── 🆕 upc-api.ts        # UPC Item Database API client
│   ├── 🆕 product-enhancement.ts # Product enhancement service
│   └── utils.ts           # Utility functions
└── types/                 # TypeScript type definitions
```

### Adding New Features
1. Follow the existing TypeScript patterns
2. Use the established shadcn/ui components
3. Add translations to both language files
4. Implement proper error handling
5. Test with the existing database schema

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## License

This project is licensed under the MIT License.
