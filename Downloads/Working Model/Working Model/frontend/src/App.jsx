import { useEffect, useState } from 'react';
import { Alert, Box, Container } from '@mui/material';
import { BrowserRouter, Route, Routes } from 'react-router-dom';
import CustomCursor from './components/CustomCursor.jsx';
import Preloader from './components/Preloader.jsx';
import Navbar from './components/Navbar.jsx';
import Footer from './components/Footer.jsx';
import HomePage from './pages/HomePage.jsx';
import PlatformPage from './pages/PlatformPage.jsx';
import DetectorPage from './pages/DetectorPage.jsx';
import ModelsPage from './pages/ModelsPage.jsx';
import ApiPage from './pages/ApiPage.jsx';
import { FALLBACK_CURRENCIES, getCurrencies, getLiveHealth, getModelInfo, getPretrainedSources, getReadyHealth } from './services/api.js';

function BackendWarning({ loadError }) {
  if (!loadError) return null;
  return (
    <Container maxWidth="xl" sx={{ pt: 12 }}>
      <Alert severity="warning" sx={{ borderRadius: 4 }}>{loadError}</Alert>
    </Container>
  );
}

export default function App() {
  const [booting, setBooting] = useState(true);
  const [backendReady, setBackendReady] = useState(false);
  const [currencies, setCurrencies] = useState(FALLBACK_CURRENCIES);
  const [modelInfo, setModelInfo] = useState(null);
  const [sources, setSources] = useState([]);
  const [loadError, setLoadError] = useState('');

  useEffect(() => {
    const timer = setTimeout(() => setBooting(false), 1100);
    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    async function hydrate() {
      try {
        await getLiveHealth();
        await getReadyHealth();
        setBackendReady(true);
        setLoadError('');
        const [currencyData, modelData, sourceData] = await Promise.all([
          getCurrencies(),
          getModelInfo(),
          getPretrainedSources(),
        ]);
        setCurrencies(currencyData?.length ? currencyData : FALLBACK_CURRENCIES);
        setModelInfo(modelData);
        setSources(sourceData || []);
      } catch {
        setBackendReady(false);
        setLoadError('Frontend loaded, but backend is not reachable yet. Start the FastAPI backend at http://localhost:8000 and refresh.');
      }
    }
    hydrate();
  }, []);

  const appData = { backendReady, currencies, modelInfo, sources };

  return (
    <BrowserRouter>
      <Box>
        <Preloader loading={booting} />
        <CustomCursor />
        <Navbar />
        <BackendWarning loadError={loadError} />
        <Routes>
          <Route path="/" element={<HomePage {...appData} />} />
          <Route path="/platform" element={<PlatformPage {...appData} />} />
          <Route path="/detector" element={<DetectorPage {...appData} />} />
          <Route path="/models" element={<ModelsPage {...appData} />} />
          <Route path="/api" element={<ApiPage {...appData} />} />
        </Routes>
        <Footer />
      </Box>
    </BrowserRouter>
  );
}
