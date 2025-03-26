# OpenAI Integration for Property Analysis

This project now includes OpenAI integration for AI-powered property analysis. The system uses GPT-3.5 Turbo to analyze properties and provide investment insights including ROI estimates, rental estimates, and investment recommendations.

## Setup Instructions

1. **Get an OpenAI API Key**:
   - Sign up for an account at [OpenAI](https://platform.openai.com)
   - Navigate to the API keys section and create a new API key
   - Copy your API key

2. **Configure Your Environment**:
   - Create or edit the `.env.local` file in the root of your project
   - Add your OpenAI API key:
     ```
     OPENAI_API_KEY=your_api_key_here
     ```
   - Make sure to replace `your_api_key_here` with your actual API key

3. **Restart Your Development Server**:
   - Stop and restart your development server to load the new environment variables

## How It Works

When a property is loaded or searched for, the application sends the property details to OpenAI for analysis. The analysis includes:

- Overall investment score (0-100)
- Expected ROI percentage
- Monthly rental income estimate
- Bidding recommendation
- Investment highlights
- Market analysis

If the OpenAI API is not configured or fails, the system will fall back to using mock analysis based on the property details.

## Usage

No additional steps are needed to use the AI analysis. Simply search for properties as usual, and the AI-powered analysis will be displayed for each property.

## API Usage Considerations

- Each property analyzed will count as one API call to OpenAI
- The application is configured to use GPT-3.5 Turbo, which is more cost-effective than GPT-4
- Consider adding rate limiting for production use cases

## Troubleshooting

If you encounter issues with the OpenAI integration:

1. Verify your API key is correctly set in the `.env.local` file
2. Check the browser console for any error messages
3. Ensure you have sufficient credits in your OpenAI account
4. Try using a newer API key if needed 