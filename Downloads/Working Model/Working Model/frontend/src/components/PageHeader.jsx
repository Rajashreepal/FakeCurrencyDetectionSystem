import { Box, Chip, Typography } from '@mui/material';
import AutoAwesomeIcon from '@mui/icons-material/AutoAwesome';
import { motion } from 'framer-motion';

export default function PageHeader({ eyebrow, title, subtitle }) {
  return (
    <Box className="page-header">
      <motion.div initial={{ opacity: 0, y: 22 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.55 }}>
        <Chip icon={<AutoAwesomeIcon />} label={eyebrow} className="hero-chip" />
        <Typography variant="h2" className="page-title">{title}</Typography>
        <Typography variant="h6" className="page-subtitle">{subtitle}</Typography>
      </motion.div>
    </Box>
  );
}
