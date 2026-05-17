import { useMemo, useState } from 'react';
import { Alert, Box, Button, Chip, FormControl, Grid, InputLabel, MenuItem, Paper, Select, Stack, Tab, Tabs, TextField, Typography } from '@mui/material';
import CloudUploadIcon from '@mui/icons-material/CloudUpload';
import AutoFixHighIcon from '@mui/icons-material/AutoFixHigh';
import CollectionsIcon from '@mui/icons-material/Collections';
import TuneIcon from '@mui/icons-material/Tune';
import { motion } from 'framer-motion';
import { analyzeBatch, analyzeImage, predictFeatures } from '../services/api.js';
import ResultPanel from './ResultPanel.jsx';

const sampleNotes = {
  genuine: { variance: 3.6216, skewness: 8.6661, curtosis: -2.8073, entropy: -0.44699 },
  counterfeit: { variance: -2.5419, skewness: -0.65804, curtosis: 2.6842, entropy: 1.1952 },
};

const fallbackCurrencies = [
  { code: 'INR', name: 'Indian Rupee', symbol: '₹', supported_denominations: ['10', '20', '50', '100', '200', '500', '2000'] },
  { code: 'USD', name: 'US Dollar', symbol: '$', supported_denominations: ['1', '2', '5', '10', '20', '50', '100'] },
  { code: 'EUR', name: 'Euro', symbol: '€', supported_denominations: ['5', '10', '20', '50', '100', '200', '500'] },
  { code: 'GBP', name: 'Pound Sterling', symbol: '£', supported_denominations: ['5', '10', '20', '50'] },
  { code: 'OTHER', name: 'Other / Generic', symbol: '¤', supported_denominations: [] },
];

export default function Detector({ currencies }) {
  const availableCurrencies = currencies?.length ? currencies : fallbackCurrencies;
  const [mode, setMode] = useState('image');
  const [currencyCode, setCurrencyCode] = useState('INR');
  const [denomination, setDenomination] = useState('500');
  const [file, setFile] = useState(null);
  const [preview, setPreview] = useState(null);
  const [batchFiles, setBatchFiles] = useState([]);
  const [batchPreviews, setBatchPreviews] = useState([]);
  const [features, setFeatures] = useState(sampleNotes.genuine);
  const [result, setResult] = useState(null);
  const [denominationResult, setDenominationResult] = useState(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const selectedCurrency = useMemo(() => availableCurrencies.find((item) => item.code === currencyCode), [availableCurrencies, currencyCode]);
  const denoms = selectedCurrency?.supported_denominations || selectedCurrency?.denominations || [];

  const handleCurrency = (code) => {
    setCurrencyCode(code);
    const item = availableCurrencies.find((c) => c.code === code);
    const firstDenom = item?.supported_denominations?.[0] || item?.denominations?.[0] || '';
    setDenomination(firstDenom);
  };

  const handleFile = (chosenFile) => {
    setFile(chosenFile || null);
    setError('');
    setResult(null);
    setDenominationResult(null);
    if (chosenFile) setPreview(URL.createObjectURL(chosenFile));
  };

  const handleBatchFiles = (chosenFiles) => {
    const files = Array.from(chosenFiles || []).slice(0, 6);
    setBatchFiles(files);
    setBatchPreviews(files.map((f) => URL.createObjectURL(f)));
    setError('');
    setResult(null);
    setDenominationResult(null);
  };

  const submitImage = async () => {
    if (!file) return setError('Please upload a banknote image first.');
    setLoading(true); setError(''); setResult(null); setDenominationResult(null);
    try {
      const authResult = await analyzeImage({ file, currencyCode, denomination });
      setResult(authResult);
      const denomOutput = authResult?.model_outputs?.USD_denomination || null;
      if (denomOutput) setDenominationResult({ currency: 'USD', ...denomOutput });
    } catch (err) {
      setError(err.response?.data?.detail || err.message || 'Prediction failed. Check backend connection.');
    } finally {
      setLoading(false);
    }
  };

  const submitBatch = async () => {
    if (!batchFiles.length) return setError('Please upload at least one image for batch analysis.');
    setLoading(true); setError(''); setResult(null); setDenominationResult(null);
    try {
      const batchResult = await analyzeBatch({ files: batchFiles, currencyCode, denomination });
      setResult(batchResult);
    } catch (err) {
      setError(err.response?.data?.detail || err.message || 'Batch analysis failed. Check backend connection.');
    } finally {
      setLoading(false);
    }
  };

  const submitFeatures = async () => {
    setLoading(true); setError(''); setResult(null); setDenominationResult(null);
    try {
      const payload = {
        ...Object.fromEntries(Object.entries(features).map(([key, value]) => [key, Number(value)])),
        currency: { currency_code: currencyCode, denomination },
      };
      const data = await predictFeatures(payload);
      setResult({
        ...data,
        final_verdict_label: data.prediction?.replaceAll('_', ' ') || data.classification,
        risk_percent: Number(data.risk_score || 0) * 100,
        reliability_score: data.confidence || 0,
        quality_gate: { status: 'manual', score: 1, recommendations: ['Manual features do not include image quality checks.'] },
        explainability: { summary: ['Manual wavelet feature score generated by the backend.'], risk_factors: [], supporting_factors: [], cautions: [] },
      });
    } catch (err) {
      setError(err.response?.data?.detail || err.message || 'Prediction failed. Check backend connection.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box id="detector" className="section-shell">
      <Grid container spacing={3}>
        <Grid item xs={12} lg={7}>
          <Paper className="detector-panel pro-detector-panel" elevation={0}>
            <Stack direction="row" justifyContent="space-between" alignItems="flex-start" spacing={2}>
              <Box>
                <Typography variant="overline" color="secondary">Decision-engine detector</Typography>
                <Typography variant="h3">Advanced banknote authenticity lab</Typography>
                <Typography color="text.secondary" sx={{ mt: 1 }}>
                  Single-image scan, front/back batch analysis, quality gate, denomination consistency and explainable risk scoring.
                </Typography>
              </Box>
              <Chip label={`${selectedCurrency?.symbol || ''} ${selectedCurrency?.code || currencyCode}`} color="primary" />
            </Stack>

            <Grid container spacing={2} sx={{ mt: 2 }}>
              <Grid item xs={12} md={4}>
                <FormControl fullWidth>
                  <InputLabel>Currency</InputLabel>
                  <Select value={currencyCode} label="Currency" onChange={(e) => handleCurrency(e.target.value)}>
                    {availableCurrencies.map((item) => (
                      <MenuItem key={item.code} value={item.code}>{item.code} · {item.name}</MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={12} md={4}>
                {denoms.length ? (
                  <FormControl fullWidth>
                    <InputLabel>Denomination</InputLabel>
                    <Select value={denomination || ''} label="Denomination" onChange={(e) => setDenomination(e.target.value)}>
                      {denoms.map((item) => <MenuItem key={item} value={item}>{selectedCurrency?.symbol}{item}</MenuItem>)}
                    </Select>
                  </FormControl>
                ) : (
                  <TextField fullWidth label="Denomination" value={denomination} onChange={(e) => setDenomination(e.target.value)} placeholder="optional" />
                )}
              </Grid>
              <Grid item xs={12} md={4}>
                <Box className="engine-pill"><TuneIcon /> {selectedCurrency?.model_status || selectedCurrency?.mode || 'advanced engine'}</Box>
              </Grid>
            </Grid>

            <Tabs value={mode} onChange={(_, value) => setMode(value)} sx={{ mt: 3 }}>
              <Tab value="image" label="Single scan" />
              <Tab value="batch" label="Front/back batch" />
              <Tab value="features" label="Manual features" />
            </Tabs>

            {mode === 'image' && (
              <Box sx={{ mt: 3 }}>
                <Box className="upload-zone" onDragOver={(e) => e.preventDefault()} onDrop={(e) => { e.preventDefault(); handleFile(e.dataTransfer.files?.[0]); }}>
                  {preview ? <img src={preview} alt="Uploaded banknote preview" /> : <CloudUploadIcon sx={{ fontSize: 54 }} />}
                  <Typography variant="h6" fontWeight={850} sx={{ mt: 2 }}>{file ? file.name : 'Drop one banknote image here'}</Typography>
                  <Typography color="text.secondary">Calls /analyze/image and returns final decision, reasons, quality score and model outputs.</Typography>
                  <Button component="label" variant="outlined" sx={{ mt: 2 }}>
                    Choose image
                    <input hidden accept="image/*" type="file" onChange={(e) => handleFile(e.target.files?.[0])} />
                  </Button>
                </Box>
                <Button disabled={loading} onClick={submitImage} size="large" variant="contained" startIcon={<AutoFixHighIcon />} sx={{ mt: 3 }}>
                  {loading ? 'Running decision engine...' : 'Run advanced scan'}
                </Button>
              </Box>
            )}

            {mode === 'batch' && (
              <Box sx={{ mt: 3 }}>
                <Box className="upload-zone batch-zone" onDragOver={(e) => e.preventDefault()} onDrop={(e) => { e.preventDefault(); handleBatchFiles(e.dataTransfer.files); }}>
                  {batchPreviews.length ? (
                    <Box className="preview-grid">
                      {batchPreviews.map((src, idx) => <img key={src} src={src} alt={`Batch preview ${idx + 1}`} />)}
                    </Box>
                  ) : <CollectionsIcon sx={{ fontSize: 54 }} />}
                  <Typography variant="h6" fontWeight={850} sx={{ mt: 2 }}>{batchFiles.length ? `${batchFiles.length} image(s) selected` : 'Drop front, back, and close-up images'}</Typography>
                  <Typography color="text.secondary">Up to 6 images. Calls /analyze/batch and combines average + maximum risk.</Typography>
                  <Button component="label" variant="outlined" sx={{ mt: 2 }}>
                    Choose images
                    <input hidden accept="image/*" multiple type="file" onChange={(e) => handleBatchFiles(e.target.files)} />
                  </Button>
                </Box>
                <Button disabled={loading} onClick={submitBatch} size="large" variant="contained" startIcon={<AutoFixHighIcon />} sx={{ mt: 3 }}>
                  {loading ? 'Analyzing batch...' : 'Run batch authenticity scan'}
                </Button>
                <Alert severity="info" sx={{ mt: 2, borderRadius: 3 }}>For best results, upload front, back, and one close-up of watermark/security area.</Alert>
              </Box>
            )}

            {mode === 'features' && (
              <Box sx={{ mt: 3 }}>
                <Stack direction="row" spacing={1} sx={{ mb: 2 }}>
                  <Button size="small" variant="outlined" onClick={() => setFeatures(sampleNotes.genuine)}>Load genuine sample</Button>
                  <Button size="small" variant="outlined" onClick={() => setFeatures(sampleNotes.counterfeit)}>Load suspicious sample</Button>
                </Stack>
                <Grid container spacing={2}>
                  {['variance', 'skewness', 'curtosis', 'entropy'].map((field) => (
                    <Grid item xs={12} md={6} key={field}>
                      <TextField fullWidth type="number" label={field} value={features[field]} onChange={(e) => setFeatures((prev) => ({ ...prev, [field]: e.target.value }))} />
                    </Grid>
                  ))}
                </Grid>
                <Button disabled={loading} onClick={submitFeatures} size="large" variant="contained" startIcon={<AutoFixHighIcon />} sx={{ mt: 3 }}>
                  {loading ? 'Predicting...' : 'Predict from manual features'}
                </Button>
              </Box>
            )}
          </Paper>
        </Grid>
        <Grid item xs={12} lg={5}>
          <motion.div initial={{ opacity: 0, x: 24 }} whileInView={{ opacity: 1, x: 0 }} viewport={{ once: true }}>
            <ResultPanel result={result} denominationResult={denominationResult} error={error} />
          </motion.div>
        </Grid>
      </Grid>
    </Box>
  );
}
