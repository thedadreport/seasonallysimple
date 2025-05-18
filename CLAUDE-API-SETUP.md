# Claude API Setup Guide

This guide explains how to set up and use the Claude API for Seasonally Simple's recipe generation feature.

## Getting Started with Claude API

1. **Sign up for Claude API access**:
   - Go to [Anthropic Console](https://console.anthropic.com/)
   - Create an account and follow the instructions to set up your organization
   - Billing information will be required to get an API key

2. **Generate an API Key**:
   - In the Anthropic Console, navigate to the API Keys section
   - Click "Create API Key"
   - Name your key (e.g., "Seasonally Simple Development")
   - Copy the generated key immediately - it will only be shown once

3. **Set up environment variables**:
   - Copy `.env.local.example` to `.env.local` (for local development)
   - Add your Claude API key to the `CLAUDE_API_KEY` environment variable
   - (Optional) Customize the `CLAUDE_API_URL` if needed

## Working with Claude in Development

For local development without an API key, the application will fall back to mock recipe data. The code is set up to use mock data when:
- The environment is development (`NODE_ENV === 'development'`)
- No `CLAUDE_API_KEY` is provided in environment variables

### Testing the Claude API Integration

1. Start the development server:
   ```bash
   npm run dev
   ```

2. Navigate to the Recipe Generator page at `/recipe-generator`

3. Fill out the recipe generation form and submit it

4. Check the server logs to see details about:
   - The API request sent to Claude
   - Any responses or errors received

## Prompting Strategy

Our application uses a specific prompting strategy to get consistent, structured recipe data from Claude:

1. We use a system prompt that instructs Claude to act as an expert chef specializing in seasonal, wholesome cooking for families.

2. The user prompt includes specific parameters:
   - Dietary restrictions
   - Cooking time constraints
   - Seasonal focus
   - Serving size
   - Skill level
   - Cuisine type
   - Special requests or preferences

3. We request a response in strict JSON format to make parsing reliable.

4. The JSON structure includes:
   - Recipe title
   - Description
   - Timing information (prep, cook, total)
   - Ingredients with precise amounts
   - Step-by-step instructions
   - Nutritional information
   - Chef's tips

## Handling API Limits and Errors

The Claude API has rate limits and token usage limitations:

- Be aware of the free tier limits for development
- For production, set up appropriate billing and monitor usage
- Properly handle API errors in your UI

## Best Practices for Modifying the Integration

When making changes to the Claude integration:

1. Keep error handling robust - Claude API responses can occasionally vary
2. Maintain fallback mechanisms for when the API is unavailable
3. Update prompt templates with care as they're highly optimized
4. Test new prompts thoroughly to ensure you get consistent, parseable responses
5. Consider token usage when expanding prompts or responses

## API Usage Monitoring

Monitor your Claude API usage through:

1. Anthropic Console dashboard
2. Our own usage tracking system (coming soon)

This will help manage costs and ensure we stay within our API limits.

## Related Files

- `/lib/services/claudeService.ts` - Core service for API calls
- `/app/api/recipes/generate/route.ts` - API endpoint that uses the service
- `/app/recipe-generator/page.tsx` - Frontend component that calls the API