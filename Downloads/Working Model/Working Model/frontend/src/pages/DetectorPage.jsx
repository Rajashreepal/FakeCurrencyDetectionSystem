import { Container } from '@mui/material';
import PageHeader from '../components/PageHeader.jsx';
import Detector from '../components/Detector.jsx';

export default function DetectorPage({ currencies }) {
  return (
    <main className="page-shell">
      <Container maxWidth="xl">
        <PageHeader
          eyebrow="Detection lab"
          title="Upload a note or enter extracted features."
          subtitle="Currency-aware authenticity scanning wired directly to your FastAPI backend. INR also attempts the pretrained denomination endpoint when available."
        />
        <Detector currencies={currencies} />
      </Container>
    </main>
  );
}
