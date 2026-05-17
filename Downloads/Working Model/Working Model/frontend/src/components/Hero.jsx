import { Box, Button, Chip, Container, Grid, Paper, Stack, Typography } from '@mui/material';
import AutoAwesomeIcon from '@mui/icons-material/AutoAwesome';
import QueryStatsIcon from '@mui/icons-material/QueryStats';
import SecurityIcon from '@mui/icons-material/Security';
import { AnimatePresence, motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { fadeUp, stagger } from '../utils/motion.js';

const currencyLoop = [
  { code: 'GBP', symbol: '£', label: 'Pound Sterling' },
  { code: 'EUR', symbol: '€', label: 'Euro' },
  { code: 'USD', symbol: '$', label: 'US Dollar' },
  { code: 'INR', symbol: '₹', label: 'Indian Rupee' },
];

function RotatingCurrencyMark() {
  const [index, setIndex] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => setIndex((prev) => (prev + 1) % currencyLoop.length), 1900);
    return () => clearInterval(timer);
  }, []);

  const active = currencyLoop[index];

  return (
    <Box className="currency-orbit">
      <div className="note-ring" />
      <AnimatePresence mode="wait">
        <motion.div
          key={active.code}
          className="note-center"
          initial={{ opacity: 0, y: 28, scale: 0.78, filter: 'blur(16px)' }}
          animate={{ opacity: 1, y: 0, scale: 1, filter: 'blur(0px)' }}
          exit={{ opacity: 0, y: -28, scale: 1.14, filter: 'blur(16px)' }}
          transition={{ duration: 0.58, ease: [0.22, 1, 0.36, 1] }}
        >
          {active.symbol}
        </motion.div>
      </AnimatePresence>
      <AnimatePresence mode="wait">
        <motion.span
          key={`${active.code}-label`}
          className="currency-badge"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -10 }}
          transition={{ duration: 0.35 }}
        >
          {active.code} · {active.label}
        </motion.span>
      </AnimatePresence>
      <span className="note-pill top">wavelet features</span>
      <span className="note-pill bottom">risk scoring</span>
    </Box>
  );
}

export default function Hero({ backendReady }) {
  return (
    <Box className="hero-section landing-hero">
      <div className="noise" />
      <Container maxWidth="xl">
        <Grid container spacing={5} alignItems="center">
          <Grid item xs={12} md={7}>
            <motion.div variants={stagger} initial="hidden" animate="visible">
              <motion.div variants={fadeUp}>
                <Chip icon={<AutoAwesomeIcon />} label="Production-ready ML currency intelligence" className="hero-chip" />
              </motion.div>
              <motion.div variants={fadeUp}>
                <Typography variant="h1" className="hero-title">
                  Fake currency detection with a real ML backend.
                </Typography>
              </motion.div>
              <motion.div variants={fadeUp}>
                <Typography variant="h6" className="hero-subtitle">
                  A polished AI platform for USD, EUR, GBP and INR workflows — authenticity scoring, image upload, model telemetry, and currency-aware prediction flows.
                </Typography>
              </motion.div>
              <motion.div variants={fadeUp}>
                <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} sx={{ mt: 4 }}>
                  <Button size="large" variant="contained" component={Link} to="/detector">Launch detector</Button>
                  <Button size="large" variant="outlined" color="secondary" component={Link} to="/platform">Explore platform</Button>
                </Stack>
              </motion.div>
            </motion.div>
          </Grid>
          <Grid item xs={12} md={5}>
            <motion.div initial={{ opacity: 0, scale: 0.92, rotateX: 12 }} animate={{ opacity: 1, scale: 1, rotateX: 0 }} transition={{ duration: 0.9, ease: [0.22, 1, 0.36, 1] }}>
              <Paper className="hero-card" elevation={0}>
                <Stack direction="row" justifyContent="space-between" alignItems="center">
                  <Typography fontWeight={800}>Live model console</Typography>
                  <Chip size="small" color={backendReady ? 'success' : 'warning'} label={backendReady ? 'backend ready' : 'check backend'} />
                </Stack>
                <Box className="banknote-visual">
                  <RotatingCurrencyMark />
                </Box>
                <Grid container spacing={2}>
                  {[
                    ['4+', 'Currencies'],
                    ['2', 'Input modes'],
                    ['ONNX', 'INR denomination'],
                    ['REST', 'FastAPI wired'],
                  ].map(([value, label]) => (
                    <Grid item xs={6} key={label}>
                      <Box className="metric-box">
                        <Typography variant="h5" fontWeight={850}>{value}</Typography>
                        <Typography variant="body2" color="text.secondary">{label}</Typography>
                      </Box>
                    </Grid>
                  ))}
                </Grid>
              </Paper>
            </motion.div>
          </Grid>
        </Grid>
      </Container>
    </Box>
  );
}

export function PlatformPreview() {
  return (
    <Container maxWidth="xl" className="home-preview-section">
      <Grid container spacing={2}>
        {[
          [<SecurityIcon />, 'Authenticity API', 'Image uploads are transformed into banknote features and routed through your backend model registry.'],
          [<QueryStatsIcon />, 'Model telemetry', 'Displays readiness, loaded models, metrics and production warnings from the API.'],
          [<AutoAwesomeIcon />, 'Currency-aware UX', 'Profiles and denominations adapt for INR, USD, EUR, GBP and fallback currencies.'],
        ].map(([icon, title, text]) => (
          <Grid item xs={12} md={4} key={title}>
            <motion.div variants={fadeUp} initial="hidden" whileInView="visible" viewport={{ once: true, amount: 0.35 }}>
              <Paper className="feature-card" elevation={0}>
                <Box className="feature-icon">{icon}</Box>
                <Typography variant="h6" fontWeight={800}>{title}</Typography>
                <Typography color="text.secondary" sx={{ mt: 1 }}>{text}</Typography>
              </Paper>
            </motion.div>
          </Grid>
        ))}
      </Grid>
    </Container>
  );
}
