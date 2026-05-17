import { Box, Button, Container, Grid, Paper, Stack, Typography } from '@mui/material';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import Hero, { PlatformPreview } from '../components/Hero.jsx';

export default function HomePage({ backendReady }) {
  return (
    <>
      <Hero backendReady={backendReady} />
      <PlatformPreview />
      <Container maxWidth="xl" className="landing-strip">
        <Paper className="cta-panel" elevation={0}>
          <Grid container spacing={3} alignItems="center">
            <Grid item xs={12} md={8}>
              <Typography variant="overline" color="secondary">From landing to live inference</Typography>
              <Typography variant="h3" sx={{ mt: 0.5 }}>A complete ML product flow, not a one-page demo.</Typography>
              <Typography color="text.secondary" sx={{ mt: 1.5, maxWidth: 760 }}>
                The landing page introduces the product, while detector, platform, models and API details now live on their own pages with clean routing.
              </Typography>
            </Grid>
            <Grid item xs={12} md={4}>
              <Stack direction={{ xs: 'column', sm: 'row', md: 'column' }} spacing={1.5}>
                <Button component={motion(Link)} whileHover={{ y: -3 }} to="/detector" size="large" variant="contained">Start scanning</Button>
                <Button component={motion(Link)} whileHover={{ y: -3 }} to="/api" size="large" variant="outlined" color="secondary">View API wiring</Button>
              </Stack>
            </Grid>
          </Grid>
        </Paper>
      </Container>
    </>
  );
}
