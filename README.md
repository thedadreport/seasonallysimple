# Seasonally Simple

Seasonally Simple is an AI-powered seasonal recipe assistant that makes wholesome cooking simple for busy families. This application leverages Claude 3.7 Sonnet to generate custom recipes based on user preferences, dietary restrictions, and seasonal ingredients.

## Features

### Current Functionality
- AI recipe generation with form-based preferences
- Recipe browsing and filtering by cuisine, difficulty, time, and dietary needs
- Recipe detail pages with ingredients, instructions, and nutritional information
- Meal planning calendar interface
- Responsive design for all device sizes

### Implemented Features
- User authentication and profiles
- Recipe management (create, view, search, filter)
- Database integration with PostgreSQL

### Coming Soon
- Shopping list generation
- Subscription management with token system
- Full Claude 3.7 Sonnet API integration

## Tech Stack

- **Frontend**: Next.js 14, React 18, Tailwind CSS
- **UI Components**: Custom designed components with Tailwind
- **Form Handling**: React Hook Form with Zod validation
- **API Integration**: Ready for Claude 3.7 Sonnet integration
- **Database**: SQLite for development, PostgreSQL with Prisma ORM for production

## Getting Started

### Prerequisites

- Node.js 18+

### Installation

1. Clone the repository:
   ```
   git clone https://github.com/yourusername/seasonally-simple.git
   cd seasonally-simple
   ```

2. Install dependencies:
   ```
   npm install
   ```

3. Set up your environment variables:
   ```
   cp .env.local.example .env.local
   ```
   Then edit `.env.local` with your actual configuration values.

4. Start the development server:
   ```
   npm run dev
   ```

5. Open [http://localhost:3000](http://localhost:3000) in your browser to see the application.

## Project Structure

- `/app`: Next.js application routes and components
  - `/api`: API routes for recipe generation and data handling
  - `/components`: Reusable UI components
  - `/recipe-generator`: Recipe generation page
  - `/recipes`: Recipe browsing and detail pages
  - `/meal-plan`: Meal planning calendar interface
  - `/login`: User authentication (mock implementation)
- `/prisma`: Database schema for future implementation
- `/lib`: Utility functions and services
  - `/services`: API services including Claude integration

## Quick Tour

1. **Home Page**: Showcases seasonal ingredients and featured recipe collections
2. **Recipe Generator**: Fill out the form with your preferences to create custom recipes
3. **Recipes Page**: Browse and filter recipes by various parameters
4. **Recipe Detail**: View complete recipe information, adjust servings, and see nutritional data
5. **Meal Plan**: View and interact with a weekly meal planning calendar

## Development Roadmap

### Phase 1: Basic Functionality (Current)
- Recipe browsing and filtering
- AI recipe generation form interface
- Recipe detail pages
- Meal planning interface

### Phase 2: User Accounts & Data Persistence
- User authentication implementation
- Recipe saving functionality
- User preferences storage
- Meal plan persistence

### Phase 3: AI Integration & Subscription
- Claude 3.7 Sonnet API integration
- Token system implementation
- Subscription management
- Payment processing

### Phase 4: Advanced Features
- Shopping list generation and export
- Nutritional analysis and visualization
- Recipe customization and modification
- Social sharing features

## License

This project is licensed under the MIT License - see the LICENSE file for details.

## Acknowledgments

- Built with Claude 3.7 Sonnet for AI-powered recipe generation
- Uses seasonal ingredient data to promote sustainable cooking