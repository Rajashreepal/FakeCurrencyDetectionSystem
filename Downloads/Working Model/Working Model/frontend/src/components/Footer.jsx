import { Box, Button, Container, Divider, Stack, Typography } from '@mui/material';

export default function Footer() {
  return (
    <Box id="api" className="footer-shell">
      <Container maxWidth="xl">
        <Stack direction={{ xs: 'column', md: 'row' }} justifyContent="space-between" alignItems={{ xs: 'flex-start', md: 'center' }} spacing={2}>
          <Box>
            <Typography variant="h5" fontWeight={850}>Ready for Node.js + Python deployment</Typography>
            <Typography color="text.secondary" sx={{ mt: 1 }}>Frontend runs on Vite/Node. Backend stays on Python 3.12 FastAPI at localhost:8000.</Typography>
          </Box>
          <Stack direction="row" spacing={1}>
            <Button variant="outlined" onClick={() => window.open('http://localhost:8000/docs', '_blank')}>Open API docs</Button>
            <Button variant="contained" onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}>Back to top</Button>
          </Stack>
        </Stack>
        <Divider sx={{ my: 4 }} />
        <Typography color="text.secondary" variant="body2">© {new Date().getFullYear()} NoteShield AI. Built for a real fake-currency detection project.</Typography>
      </Container>
    </Box>
  );
}
