import { Box, Button, Chip, Container, Grid, Paper, Stack, Typography } from '@mui/material';
import OpenInNewIcon from '@mui/icons-material/OpenInNew';
import PageHeader from '../components/PageHeader.jsx';

const endpoints = [
  ['GET', '/api/v1/health/live', 'Checks whether the backend server is alive.'],
  ['GET', '/api/v1/health/ready', 'Checks whether model registry and app dependencies are ready.'],
  ['GET', '/api/v1/currencies', 'Loads supported currencies, symbols, denominations and engine modes.'],
  ['GET', '/api/v1/model/info', 'Loads model registry, metrics, readiness and GPU preference.'],
  ['GET', '/api/v1/models/registry', 'Detailed model registry view for dashboard/admin pages.'],
  ['POST', '/api/v1/model/reload', 'Reloads models after replacing model files.'],
  ['POST', '/api/v1/analyze/image', 'Main single-image decision engine: quality gate, risk score, explainability and security checklist.'],
  ['POST', '/api/v1/analyze/batch', 'Batch/front-back-closeup analysis with combined risk decision.'],
  ['POST', '/api/v1/predict/image', 'Backward-compatible alias for image analysis.'],
  ['POST', '/api/v1/predict/denomination/image', 'Denomination model route, currently useful for USD model output.'],
  ['POST', '/api/v1/predict', 'Manual wavelet feature scoring route.'],
  ['GET', '/api/v1/security/features/{currency_code}', 'Currency-specific security checklist for manual inspection support.'],
];

export default function ApiPage({ backendReady }) {
  return (
    <main className="page-shell">
      <Container maxWidth="xl">
        <PageHeader
          eyebrow="API wiring"
          title="Frontend is wired to the advanced decision-engine backend."
          subtitle="This page documents the exact calls used by the React app for single scans, batch scans, model registry, reload and security checklists."
        />
        <Paper className="table-card" elevation={0}>
          <Stack direction={{ xs: 'column', md: 'row' }} justifyContent="space-between" spacing={2} alignItems={{ xs: 'flex-start', md: 'center' }}>
            <Box>
              <Typography variant="h5" fontWeight={850}>FastAPI backend</Typography>
              <Typography color="text.secondary">Expected API base: {import.meta.env.VITE_API_BASE_URL || '/api/v1'} · backend docs at http://localhost:8000/docs</Typography>
            </Box>
            <Stack direction="row" spacing={1}>
              <Chip color={backendReady ? 'success' : 'warning'} label={backendReady ? 'connected' : 'not reachable'} />
              <Button endIcon={<OpenInNewIcon />} onClick={() => window.open('http://localhost:8000/docs', '_blank')} variant="outlined" color="secondary">Open docs</Button>
            </Stack>
          </Stack>
          <Grid container spacing={1.5} sx={{ mt: 2 }}>
            {endpoints.map(([method, path, detail]) => (
              <Grid item xs={12} key={path}>
                <Box className="endpoint-row">
                  <Chip size="small" color={method === 'POST' ? 'primary' : 'default'} label={method} />
                  <Typography fontFamily="monospace" fontWeight={850}>{path}</Typography>
                  <Typography color="text.secondary">{detail}</Typography>
                </Box>
              </Grid>
            ))}
          </Grid>
        </Paper>
      </Container>
    </main>
  );
}
