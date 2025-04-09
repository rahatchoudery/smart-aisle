# Smart AI SLE

A barcode scanning app that analyzes food products for healthiness, ingredients, and allergens using AI-powered analysis.

## Features

- **Barcode Scanning**: Scan product barcodes using your device's camera
- **Health Score Analysis**: Get an instant health score based on ingredients
- **Ingredient Analysis**: Detailed breakdown of ingredients with quality ratings
- **Allergen Detection**: Identify potential allergens in products
- **AI-Powered Insights**: Smart analysis of ingredients and their health impacts

## Tech Stack

- **Frontend**: Next.js, TypeScript, Tailwind CSS
- **AI**: OpenAI API for ingredient analysis
- **Barcode**: ZXing library for barcode scanning

## Getting Started

1. Clone the repository:
   ```bash
   git clone git@github.com:rahatchoudery/smart-aisle.git
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Set up environment variables:
   Create a `.env.local` file with:
   ```
   OPENAI_API_KEY=your_openai_key
   ```

4. Run the development server:
   ```bash
   npm run dev
   ```

5. Open [http://localhost:3000](http://localhost:3000) in your browser

## Project Structure

- `/app` - Next.js application routes and pages
- `/components` - Reusable UI components
- `/services` - API services and data processing
- `/public` - Static assets

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## License

This project is licensed under the MIT License - see the LICENSE file for details. 