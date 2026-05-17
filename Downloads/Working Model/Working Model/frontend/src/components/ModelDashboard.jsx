import { Box, Button, Chip, Grid, LinearProgress, Paper, Stack, Typography } from '@mui/material';
import RefreshIcon from '@mui/icons-material/Refresh';
import MemoryIcon from '@mui/icons-material/Memory';
import ShieldIcon from '@mui/icons-material/Shield';
import { motion } from 'framer-motion';
import { reloadModels } from '../services/api.js';

function percentFromMetric(value) {
  const n = Number(value ?? 0);
  if (!n) return null;
  return n <= 1 ? n * 100 : n;
}

function modelRows(modelInfo) {
  const models = modelInfo?.models || modelInfo?.loaded_models || {};
  return Object.entries(models).map(([key, value]) => ({ key, ...(value || {}) }));
}

export default function ModelDashboard({ modelInfo, sources, currencies, backendReady }) {
  const rows = modelRows(modelInfo);
  const readyCount = rows.filter((r) => r.ready).length;
  const inrMetric = modelInfo?.models?.INR_authenticity?.metrics || modelInfo?.metrics || {};
  const inrAcc = percentFromMetric(inrMetric.best_balanced_accuracy || inrMetric.best_accuracy || inrMetric.test_accuracy);

  const handleReload = async () => {
    try {
      await reloadModels();
      window.location.reload();
    } catch {
      alert('Model reload failed. Check backend terminal.');
    }
  };

  return (
    <Box id="models" className="section-shell">
      <Stack direction={{ xs: 'column', md: 'row' }} justifyContent="space-between" spacing={2} sx={{ mb: 3 }}>
        <Box>
          <Typography variant="overline" color="secondary">Backend intelligence</Typography>
          <Typography variant="h3">Model registry and decision engine</Typography>
          <Typography color="text.secondary" sx={{ mt: 1 }}>Live readiness for INR authenticity, USD denomination, quality gate, explainability, and fallback rule engines.</Typography>
        </Box>
        <Stack direction="row" spacing={1} alignItems="center">
          <Chip color={backendReady ? 'success' : 'warning'} label={backendReady ? 'API connected' : 'API unavailable'} />
          <Button startIcon={<RefreshIcon />} variant="outlined" onClick={handleReload}>Reload</Button>
        </Stack>
      </Stack>

      <Grid container spacing={2.5}>
        {[
          ['Registry status', backendReady ? 'ready' : 'offline'],
          ['Ready models', `${readyCount}/${rows.length || 0}`],
          ['INR validation', inrAcc ? `${inrAcc.toFixed(1)}%` : '—'],
          ['GPU preference', modelInfo?.prefer_gpu ? 'enabled' : 'CPU/default'],
        ].map(([label, value]) => (
          <Grid item xs={12} sm={6} lg={3} key={label}>
            <motion.div whileHover={{ y: -8 }}>
              <Paper className="stat-card" elevation={0}>
                <Typography color="text.secondary">{label}</Typography>
                <Typography variant="h4" fontWeight={850}>{value}</Typography>
              </Paper>
            </motion.div>
          </Grid>
        ))}
      </Grid>

      <Grid container spacing={2.5} sx={{ mt: 1 }}>
        <Grid item xs={12} lg={7}>
          <Paper className="table-card" elevation={0}>
            <Typography variant="h5" fontWeight={850}>Loaded backend capabilities</Typography>
            <Stack spacing={1.4} sx={{ mt: 2 }}>
              {rows.length ? rows.map((item) => (
                <Box className="model-row" key={item.key}>
                  <Stack direction="row" spacing={1} alignItems="center" justifyContent="space-between">
                    <Stack direction="row" spacing={1.2} alignItems="center">
                      <Box className="model-icon">{item.key.includes('INR') ? <ShieldIcon /> : <MemoryIcon />}</Box>
                      <Box>
                        <Typography fontWeight={850}>{item.key.replaceAll('_', ' ')}</Typography>
                        <Typography color="text.secondary" variant="body2">{item.type || item.mode || 'advanced engine'}</Typography>
                      </Box>
                    </Stack>
                    <Chip size="small" color={item.ready ? 'success' : 'default'} label={item.ready ? 'active' : 'standby'} />
                  </Stack>
                  {item.metrics && (
                    <Box sx={{ mt: 1.3 }}>
                      <LinearProgress variant="determinate" value={percentFromMetric(item.metrics.best_balanced_accuracy || item.metrics.best_accuracy || item.metrics.test_accuracy) || 0} sx={{ borderRadius: 99, height: 7 }} />
                    </Box>
                  )}
                </Box>
              )) : <Typography color="text.secondary">No registry data loaded yet.</Typography>}
            </Stack>
          </Paper>
        </Grid>
        <Grid item xs={12} lg={5}>
          <Paper className="table-card" elevation={0}>
            <Typography variant="h5" fontWeight={850}>Currency coverage</Typography>
            <Stack spacing={1.4} sx={{ mt: 2 }}>
              {currencies.map((item) => (
                <Box className="currency-row" key={item.code}>
                  <Box>
                    <Typography fontWeight={850}>{item.symbol} {item.code} · {item.name}</Typography>
                    <Typography color="text.secondary" variant="body2">{item.model_status || item.mode || 'advanced authenticity engine'}</Typography>
                  </Box>
                  <Chip size="small" label={`${item.supported_denominations?.length || item.denominations?.length || 0} denoms`} />
                </Box>
              ))}
            </Stack>
          </Paper>
        </Grid>
      </Grid>
    </Box>
  );
}
