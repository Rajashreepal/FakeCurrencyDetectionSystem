import { Container } from '@mui/material';
import PageHeader from '../components/PageHeader.jsx';
import ModelDashboard from '../components/ModelDashboard.jsx';

export default function ModelsPage({ modelInfo, sources, currencies, backendReady }) {
  return (
    <main className="page-shell">
      <Container maxWidth="xl">
        <PageHeader
          eyebrow="Model registry"
          title="Monitor backend readiness and model coverage."
          subtitle="See global-model metrics, loaded currency models, pretrained sources and currency support without leaving the frontend."
        />
        <ModelDashboard modelInfo={modelInfo} sources={sources} currencies={currencies} backendReady={backendReady} />
      </Container>
    </main>
  );
}
