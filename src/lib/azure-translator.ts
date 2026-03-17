import axios from 'axios';

const key = process.env.AZURE_TRANSLATOR_KEY;
const endpoint = process.env.AZURE_TRANSLATOR_ENDPOINT || "https://api.cognitive.microsofttranslator.com/";
const region = process.env.AZURE_TRANSLATOR_REGION || "southeastasia";

export async function translateText(text: string, to: string) {
  if (!key) throw new Error('Missing Translator Key');
  if (to === 'en') return text; // No need to translate to English

  try {
    const response = await axios({
      baseURL: endpoint,
      url: '/translate',
      method: 'post',
      params: {
        'api-version': '3.0',
        'to': to
      },
      headers: {
        'Ocp-Apim-Subscription-Key': key,
        'Ocp-Apim-Subscription-Region': region,
        'Content-type': 'application/json',
      },
      data: [{
        'text': text
      }],
      responseType: 'json'
    });

    return response.data[0].translations[0].text;
  } catch (error: any) {
    console.error('Translation error:', error.response?.data || error.message);
    return text; // Return original text on failure
  }
}
