import { Box, LinearProgress, Typography } from '@mui/material';
import { AnimatePresence, motion } from 'framer-motion';

export default function Preloader({ loading }) {
  return (
    <AnimatePresence>
      {loading && (
        <motion.div
          className="preloader"
          initial={{ opacity: 1 }}
          exit={{ opacity: 0, transition: { duration: 0.7, ease: 'easeInOut' } }}
        >
          <motion.div
            initial={{ scale: 0.92, opacity: 0, y: 18 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
          >
            <Box className="preloader-orb">₹</Box>
            <Typography variant="h4" sx={{ mt: 3, fontWeight: 800 }}>
              NoteShield AI
            </Typography>
            <Typography color="text.secondary" sx={{ mt: 1 }}>
              Initialising secure currency intelligence
            </Typography>
            <LinearProgress sx={{ mt: 3, width: 280, borderRadius: 99, height: 7 }} />
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
