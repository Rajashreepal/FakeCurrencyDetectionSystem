import { Alert, Box, Chip, Divider, LinearProgress, Paper, Stack, Typography, Accordion, AccordionSummary, AccordionDetails, Grid } from '@mui/material';
import VerifiedIcon from '@mui/icons-material/Verified';
import ReportProblemIcon from '@mui/icons-material/ReportProblem';
import AnalyticsIcon from '@mui/icons-material/Analytics';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import ImageSearchIcon from '@mui/icons-material/ImageSearch';

function pct(value, fallback = 0) {
  const n = Number(value ?? fallback);
  if (Number.isNaN(n)) return 0;
  return Math.max(0, Math.min(100, n <= 1 ? n * 100 : n));
}

function valueLabel(value) {
  return `${pct(value).toFixed(1)}%`;
}

function verdictTone(verdict = '') {
  if (verdict === 'likely_genuine' || /genuine/i.test(verdict)) return 'safe';
  if (verdict === 'suspicious' || /suspicious|manual|unreliable/i.test(verdict)) return 'warn';
  return 'danger';
}

function severityFor(verdict = '') {
  if (verdict === 'likely_genuine') return 'success';
  if (verdict === 'suspicious' || verdict === 'unreliable_image') return 'warning';
  return 'error';
}

export default function ResultPanel({ result, denominationResult, error }) {
  if (error) return <Alert severity="error" sx={{ borderRadius: 4 }}>{error}</Alert>;

  if (!result && !denominationResult) {
    return (
      <Paper className="result-empty advanced-empty" elevation={0}>
        <ImageSearchIcon sx={{ fontSize: 44, mb: 1 }} />
        <Typography variant="h6" fontWeight={850}>Awaiting scan</Typography>
        <Typography color="text.secondary" sx={{ mt: 1 }}>
          Upload a single note, front/back batch, or use manual features. The decision-engine response will appear here.
        </Typography>
      </Paper>
    );
  }

  const isBatch = Boolean(result?.analyses);

  return (
    <Stack spacing={2}>
      {result && (isBatch ? <BatchResult result={result} /> : <SingleResult result={result} />)}
      {denominationResult && !isBatch && <DenominationResult data={denominationResult} />}
    </Stack>
  );
}

function SingleResult({ result }) {
  const tone = verdictTone(result.final_verdict || result.prediction || result.classification);
  const label = result.final_verdict_label || result.label || result.prediction || 'Analysis complete';
  const quality = result.quality_gate || {};
  const mismatch = result.denomination_consistency || {};

  return (
    <Paper className={`result-card advanced-result ${tone}`} elevation={0}>
      <Stack direction="row" alignItems="center" spacing={1.5}>
        <Box className="result-icon">
          {tone === 'safe' ? <VerifiedIcon /> : <ReportProblemIcon />}
        </Box>
        <Box sx={{ flexGrow: 1 }}>
          <Typography variant="overline" color="text.secondary">Final decision engine</Typography>
          <Typography variant="h4" fontWeight={900}>{label}</Typography>
        </Box>
        <Chip color={severityFor(result.final_verdict)} label={`${Number(result.risk_percent ?? pct(result.risk_score)).toFixed(1)}% risk`} />
      </Stack>

      <Divider sx={{ my: 2.2 }} />

      <Grid container spacing={1.5}>
        <Grid item xs={12} sm={6}>
          <MiniMetric label="Confidence" value={result.confidence} />
        </Grid>
        <Grid item xs={12} sm={6}>
          <MiniMetric label="Reliability" value={result.reliability_score} />
        </Grid>
      </Grid>

      <Stack spacing={1.4} sx={{ mt: 2 }}>
        <ScoreBar label="Authenticity risk" value={result.risk_score} />
        <ScoreBar label="Image quality" value={quality.score} />
        {result.signals?.texture_score !== undefined && <ScoreBar label="Texture health" value={result.signals.texture_score} />}
        {result.signals?.print_complexity_score !== undefined && <ScoreBar label="Print complexity" value={result.signals.print_complexity_score} />}
      </Stack>

      <Box className="result-meta">
        <Chip label={result.currency || 'OTHER'} />
        <Chip label={result.denomination ? `Denomination ${result.denomination}` : 'No denomination selected'} />
        <Chip color={quality.status === 'pass' ? 'success' : quality.status === 'warn' ? 'warning' : 'error'} label={`Quality ${quality.status || 'unknown'}`} />
      </Box>

      {mismatch?.mismatch && <Alert severity="warning" sx={{ mt: 2, borderRadius: 3 }}>{mismatch.message}</Alert>}
      {result.warnings?.length > 0 && (
        <Alert severity="info" sx={{ mt: 2, borderRadius: 3 }}>{result.warnings.slice(0, 2).join(' ')}</Alert>
      )}

      <Explainability result={result} />
    </Paper>
  );
}

function BatchResult({ result }) {
  return (
    <Paper className={`result-card advanced-result ${verdictTone(result.final_verdict)}`} elevation={0}>
      <Stack direction="row" alignItems="center" spacing={1.5}>
        <Box className="result-icon"><AnalyticsIcon /></Box>
        <Box sx={{ flexGrow: 1 }}>
          <Typography variant="overline" color="text.secondary">Batch decision engine</Typography>
          <Typography variant="h4" fontWeight={900}>{result.final_verdict_label || result.final_verdict}</Typography>
        </Box>
        <Chip color={severityFor(result.final_verdict)} label={`${pct(result.combined_risk_score).toFixed(1)}% risk`} />
      </Stack>
      <Divider sx={{ my: 2.2 }} />
      <Grid container spacing={1.5}>
        <Grid item xs={12} sm={4}><MiniMetric label="Images" value={result.count} raw /></Grid>
        <Grid item xs={12} sm={4}><MiniMetric label="Avg reliability" value={result.average_reliability} /></Grid>
        <Grid item xs={12} sm={4}><MiniMetric label="Avg confidence" value={result.average_confidence} /></Grid>
      </Grid>
      <Stack spacing={1.2} sx={{ mt: 2 }}>
        {(result.reasons || []).slice(0, 4).map((item) => <Alert key={item} severity="info" sx={{ borderRadius: 3 }}>{item}</Alert>)}
      </Stack>
      <Accordion className="glass-accordion" sx={{ mt: 2 }}>
        <AccordionSummary expandIcon={<ExpandMoreIcon />}>
          <Typography fontWeight={850}>Per-image breakdown</Typography>
        </AccordionSummary>
        <AccordionDetails>
          <Stack spacing={1.4}>
            {(result.analyses || []).map((item, idx) => (
              <Box className="batch-row" key={`${item.filename}-${idx}`}>
                <Stack direction="row" justifyContent="space-between" spacing={1}>
                  <Typography fontWeight={850}>{item.filename || `Image ${idx + 1}`}</Typography>
                  <Chip size="small" color={severityFor(item.final_verdict)} label={item.final_verdict_label || item.final_verdict} />
                </Stack>
                <ScoreBar label="Risk" value={item.risk_score} compact />
                <Typography variant="body2" color="text.secondary">{item.explainability?.summary?.[0] || 'Analysis completed.'}</Typography>
              </Box>
            ))}
          </Stack>
        </AccordionDetails>
      </Accordion>
    </Paper>
  );
}

function DenominationResult({ data }) {
  const denom = data.denomination || data.label || data.prediction || 'Detected';
  return (
    <Paper className="result-card" elevation={0}>
      <Typography variant="overline" color="text.secondary">Denomination model</Typography>
      <Typography variant="h4" fontWeight={850}>{data.currency === 'USD' ? '$' : ''}{denom}</Typography>
      <ScoreBar label="Confidence" value={data.confidence} />
    </Paper>
  );
}

function Explainability({ result }) {
  const exp = result.explainability || {};
  const quality = result.quality_gate || {};
  return (
    <Stack spacing={1.4} sx={{ mt: 2 }}>
      {exp.summary?.length > 0 && (
        <Box>
          <Typography fontWeight={900}>Decision summary</Typography>
          <ul className="checks-list">{exp.summary.map((item) => <li key={item}>{item}</li>)}</ul>
        </Box>
      )}

      <Accordion className="glass-accordion">
        <AccordionSummary expandIcon={<ExpandMoreIcon />}>
          <Typography fontWeight={850}>Explainability and quality details</Typography>
        </AccordionSummary>
        <AccordionDetails>
          <Grid container spacing={2}>
            <Grid item xs={12} md={6}>
              <Typography fontWeight={850}>Risk factors</Typography>
              <ul className="checks-list">{(exp.risk_factors?.length ? exp.risk_factors : ['No major risk factor listed.']).map((item) => <li key={item}>{item}</li>)}</ul>
            </Grid>
            <Grid item xs={12} md={6}>
              <Typography fontWeight={850}>Supporting factors</Typography>
              <ul className="checks-list">{(exp.supporting_factors?.length ? exp.supporting_factors : ['No supporting factor listed.']).map((item) => <li key={item}>{item}</li>)}</ul>
            </Grid>
            <Grid item xs={12}>
              <Typography fontWeight={850}>Quality gate</Typography>
              <Typography color="text.secondary">Status: {quality.status || 'unknown'} · Score: {valueLabel(quality.score)}</Typography>
              {quality.recommendations?.length > 0 && <ul className="checks-list">{quality.recommendations.slice(0, 4).map((item) => <li key={item}>{item}</li>)}</ul>}
            </Grid>
          </Grid>
        </AccordionDetails>
      </Accordion>

      {result.security_checklist?.length > 0 && (
        <Accordion className="glass-accordion">
          <AccordionSummary expandIcon={<ExpandMoreIcon />}>
            <Typography fontWeight={850}>Manual security checklist</Typography>
          </AccordionSummary>
          <AccordionDetails>
            <ul className="checks-list">{result.security_checklist.map((item) => <li key={item}>{item}</li>)}</ul>
          </AccordionDetails>
        </Accordion>
      )}
    </Stack>
  );
}

function MiniMetric({ label, value = 0, raw = false }) {
  return (
    <Box className="mini-metric">
      <Typography variant="body2" color="text.secondary">{label}</Typography>
      <Typography variant="h5" fontWeight={900}>{raw ? value : valueLabel(value)}</Typography>
    </Box>
  );
}

function ScoreBar({ label, value = 0, compact = false }) {
  const percent = pct(value);
  return (
    <Box sx={{ mt: compact ? 1 : 0 }}>
      <Stack direction="row" justifyContent="space-between" sx={{ mb: 0.7 }}>
        <Typography variant="body2" color="text.secondary">{label}</Typography>
        <Typography variant="body2" fontWeight={800}>{percent.toFixed(1)}%</Typography>
      </Stack>
      <LinearProgress variant="determinate" value={percent} sx={{ height: compact ? 6 : 9, borderRadius: 999 }} />
    </Box>
  );
}
