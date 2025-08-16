import {genkit} from 'genkit';
import {googleAI} from '@genkit-ai/googleai';
import '@genkit-ai/firebase';

// Ensure required environment variables are present before initializing Genkit.
// This prevents confusing runtime errors when the Google AI plugin is used
// without the necessary credentials.
const requiredEnvVars = ['GOOGLE_API_KEY'];

for (const key of requiredEnvVars) {
  if (!process.env[key]) {
    throw new Error(
      `Missing required environment variable: ${key}. ` +
        'Please set it in your environment before starting the application.'
    );
  }
}

export const ai = genkit({
  plugins: [googleAI()],
  model: 'googleai/gemini-2.0-flash',
});
