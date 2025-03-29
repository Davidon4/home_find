# Home Find Investment Property Search Application

A property investment search tool built with React, TypeScript, and Vite. This application helps investors find potential investment properties with key metrics like rental yield, ROI, and investment score.

## Features

- Search for properties using the Piloterr Zoopla API
- Filter properties by price range, bedrooms, and property type
- View estimated rental income and ROI for each property
- Property details including market information and analysis
- Credit-efficient API usage with caching to reduce API calls

## Setup Instructions

### Prerequisites

- Node.js (v18 or higher)
- NPM or Yarn
- Piloterr API key for Zoopla property search

### Installation

1. Clone the repository:
```bash
git clone [your-repository-url]
cd home_find
```

2. Install dependencies:
```bash
npm install
# or
yarn install
```

3. Set up environment variables:
   - Copy `.env.example` to `.env`:
     ```bash
     cp .env.example .env
     ```
   - Edit `.env` and add your Piloterr API key:
     ```
     VITE_PILOTERR_API_KEY=your_api_key_here
     ```

4. Start the development server:
```bash
npm run dev
# or
yarn dev
```

## API Usage

The application uses the Piloterr API to search for Zoopla properties. The API has a limit of 50 credits, and each search uses 1 credit.

### API Request Format

```
curl --location --request GET 'https://piloterr.com/api/v2/zoopla/property?query=example' \
--header 'Content-Type: application/json' \
--header 'x-api-key: <token>'
```

### Optimizing API Usage

To optimize API usage and preserve credits:

1. The application caches search results to avoid duplicate API calls
2. A credit counter keeps track of remaining API credits
3. When credits are exhausted, the application uses cached results
4. The UI shows a notification when using cached results to save credits

## Development Notes

### Property Data Structure

The Piloterr API returns property data in the following structure:

```typescript
interface ZooplaProperty {
  propertyId: string;
  title: string;
  price: string;
  address: string;
  description: string;
  agent: {
    name: string;
    phone: string;
    email: string;
  };
  images: string[];
  details: {
    bedrooms: number;
    bathrooms: number;
    receptions: number;
    squareFeet: number;
    type: string;
    tenure: string;
    garden: string;
    parking: string;
  };
  nearbySchools: string[];
  additionalInfo: {
    built: string;
    energyRating: string;
    councilTaxBand: string;
  };
  mapCoordinates: {
    latitude: number;
    longitude: number;
  };
}
```

## License

[MIT License](LICENSE)
