import { Box, Button, Container, Grid, Paper, Stack, Typography } from '@mui/material';
import { Link } from 'react-router-dom';
import SecurityIcon from '@mui/icons-material/Security';
import HubIcon from '@mui/icons-material/Hub';
import ImageSearchIcon from '@mui/icons-material/ImageSearch';
import InsightsIcon from '@mui/icons-material/Insights';
import PageHeader from '../components/PageHeader.jsx';
import { motion } from 'framer-motion';

const platformCards = [
  ['Currency routing', <HubIcon />, 'Every prediction carries a currency code and optional denomination, so the UI and backend can route INR, USD, EUR, GBP and future currencies cleanly.'],
  ['Image-first workflow', <ImageSearchIcon />, 'Users can upload a banknote image and receive authenticity scoring from the backend feature extraction + model registry flow.'],
  ['Production telemetry', <InsightsIcon />, 'The frontend checks health, readiness, model info and pretrained source visibility so the app feels like a real deployed product.'],
  ['Security-first UX', <SecurityIcon />, 'Results are shown with confidence, risk labels and backend warnings instead of pretending unsupported models are perfect.'],
];

export default function PlatformPage() {
  return (
    <main className="page-shell">
      <Container maxWidth="xl">
        <PageHeader
          eyebrow="Platform"
          title="A full product surface for banknote intelligence."
          subtitle="The platform page explains what the app does, how prediction flows work and why the system is built around currency-specific expansion."
        />
        <Grid container spacing={2.5}>
          {platformCards.map(([title, icon, text]) => (
            <Grid item xs={12} md={6} key={title}>
              <motion.div whileHover={{ y: -8 }}>
                <Paper className="feature-card platform-card" elevation={0}>
                  <Box className="feature-icon">{icon}</Box>
                  <Typography variant="h5" fontWeight={850}>{title}</Typography>
                  <Typography color="text.secondary" sx={{ mt: 1.4 }}>{text}</Typography>
                </Paper>
              </motion.div>
            </Grid>
          ))}
        </Grid>
        <Paper className="process-panel" elevation={0}>
          <Typography variant="h4" fontWeight={900}>How the app flows</Typography>
          <Grid container spacing={2} sx={{ mt: 1 }}>
            {['Upload or enter features', 'Select currency and denomination', 'Backend extracts or accepts features', 'Model registry predicts authenticity', 'Frontend shows risk and confidence'].map((step, index) => (
              <Grid item xs={12} md key={step}>
                <Box className="process-step">
                  <span>{String(index + 1).padStart(2, '0')}</span>
                  <Typography fontWeight={800}>{step}</Typography>
                </Box>
              </Grid>
            ))}
          </Grid>
          <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1.5} sx={{ mt: 3 }}>
            <Button component={Link} to="/detector" variant="contained" size="large">Try detector</Button>
            <Button component={Link} to="/models" variant="outlined" color="secondary" size="large">Check models</Button>
          </Stack>
        </Paper>
      </Container>
    </main>
  );
}
