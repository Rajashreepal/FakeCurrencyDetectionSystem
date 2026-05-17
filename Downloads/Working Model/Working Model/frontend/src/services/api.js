import axios from 'axios';

export const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || '/api/v1';

export const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 90000,
});

export const FALLBACK_CURRENCIES = [
  { code: 'INR', name: 'Indian Rupee', symbol: '₹', supported_denominations: ['10', '20', '50', '100', '200', '500', '2000'], model_status: 'INR authenticity model + decision engine' },
  { code: 'USD', name: 'US Dollar', symbol: '$', supported_denominations: ['1', '2', '5', '10', '20', '50', '100'], model_status: 'USD denomination model + authenticity engine' },
  { code: 'EUR', name: 'Euro', symbol: '€', supported_denominations: ['5', '10', '20', '50', '100', '200', '500'], model_status: 'advanced authenticity engine' },
  { code: 'GBP', name: 'Pound Sterling', symbol: '£', supported_denominations: ['5', '10', '20', '50'], model_status: 'advanced authenticity engine' },
  { code: 'OTHER', name: 'Other / Generic', symbol: '¤', supported_denominations: [], model_status: 'generic authenticity engine' },
];

export function normalizeCurrencyResponse(data) {
  if (Array.isArray(data)) return data;
  if (data?.supported && typeof data.supported === 'object') {
    return Object.entries(data.supported).map(([code, item]) => ({
      code,
      name: item.name || code,
      symbol: item.symbol || code,
      supported_denominations: item.denominations || item.supported_denominations || [],
      model_status: item.mode || item.model_status || 'advanced authenticity engine',
    }));
  }
  return FALLBACK_CURRENCIES;
}

export async function getLiveHealth() {
  const { data } = await api.get('/health/live');
  return data;
}

export async function getReadyHealth() {
  const { data } = await api.get('/health/ready');
  return data;
}

export async function getCurrencies() {
  const { data } = await api.get('/currencies');
  return normalizeCurrencyResponse(data);
}

export async function getCurrencyDetail(currencyCode) {
  const { data } = await api.get(`/currencies/${currencyCode}`);
  return data;
}

export async function getModelInfo() {
  const { data } = await api.get('/model/info');
  return data;
}

export async function getModelsRegistry() {
  const { data } = await api.get('/models/registry');
  return data;
}

export async function reloadModels() {
  const { data } = await api.post('/model/reload');
  return data;
}

export async function getPretrainedSources() {
  try {
    const { data } = await api.get('/pretrained/sources');
    return Array.isArray(data) ? data : [];
  } catch {
    return [];
  }
}

export async function getSecurityFeatures(currencyCode) {
  const { data } = await api.get(`/security/features/${currencyCode}`);
  return data;
}

export async function predictFeatures(payload) {
  const { data } = await api.post('/predict', payload);
  return data;
}

export async function analyzeImage({ file, currencyCode, denomination }) {
  const formData = new FormData();
  formData.append('file', file);
  formData.append('currency_code', currencyCode || 'OTHER');
  if (denomination) formData.append('denomination', denomination);
  const { data } = await api.post('/analyze/image', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });
  return data;
}

export async function analyzeBatch({ files, currencyCode, denomination }) {
  const formData = new FormData();
  files.forEach((file) => formData.append('files', file));
  formData.append('currency_code', currencyCode || 'OTHER');
  if (denomination) formData.append('denomination', denomination);
  const { data } = await api.post('/analyze/batch', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });
  return data;
}

export async function predictImage({ file, currencyCode, denomination }) {
  return analyzeImage({ file, currencyCode, denomination });
}

export async function predictDenominationImage({ file, currencyCode }) {
  const formData = new FormData();
  formData.append('file', file);
  formData.append('currency_code', currencyCode || 'USD');
  const { data } = await api.post('/predict/denomination/image', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });
  return data;
}
