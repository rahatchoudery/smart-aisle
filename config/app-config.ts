/**
 * Application Configuration
 * This file contains configuration settings for the Smart[Ai]sle application
 */

export const APP_CONFIG = {
  /**
   * Scanner Configuration
   */
  scanner: {
    // The default scanner implementation to use
    defaultScanner: "ImprovedZXingScanner",

    // Scanner options
    options: {
      // Scan interval in milliseconds
      scanInterval: 500,

      // Required detection count for a barcode to be considered valid
      requiredDetectionCount: 1,

      // Barcode validation regex pattern
      // This pattern allows for 7-14 digit barcodes or 8-14 alphanumeric characters
      barcodeValidationPattern: /^\d{7,14}$|^[A-Z0-9]{8,14}$/,

      // Timeout in milliseconds before showing manual entry option
      manualEntryTimeout: 15000,

      // Timeout in milliseconds before suggesting demo mode
      demoSuggestionTimeout: 30000,
    },

    // Supported barcode formats
    supportedFormats: ["EAN_13", "EAN_8", "UPC_A", "UPC_E", "CODE_39", "CODE_128"],

    // Demo barcodes for testing
    demoBarcodes: [
      { code: "9780201379624", name: "Organic Granola" },
      { code: "123456789012", name: "Chocolate Chip Cookies" },
      { code: "987654321098", name: "Organic Spinach" },
    ],
  },

  /**
   * Ingredient Analysis Configuration
   */
  ingredientAnalysis: {
    // Whether to use batch processing for ingredients
    useBatchProcessing: false,

    // Batch size for ingredient processing (if batch processing is enabled)
    batchSize: 10,

    // Delay between batches in milliseconds (if batch processing is enabled)
    batchDelay: 0,

    // Whether to use AI-generated descriptions
    useAIDescriptions: true,

    // Fallback to rule-based descriptions if AI generation fails
    fallbackToRuleBased: true,
  },

  /**
   * Elasticsearch Configuration
   */
  elasticsearch: {
    url: process.env.ELASTICSEARCH_URL || "http://localhost:9200",
    username: process.env.ELASTICSEARCH_USERNAME || "elastic",
    password: process.env.ELASTICSEARCH_PASSWORD || "changeme",
  },
}

// Export individual configuration values for easier access
export const ELASTICSEARCH_URL = APP_CONFIG.elasticsearch.url
export const ELASTICSEARCH_USERNAME = APP_CONFIG.elasticsearch.username
export const ELASTICSEARCH_PASSWORD = APP_CONFIG.elasticsearch.password

