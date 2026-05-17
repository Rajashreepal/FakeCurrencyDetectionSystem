import { AppBar, Box, Button, Container, Stack, Toolbar, Typography } from '@mui/material';
import ShieldOutlinedIcon from '@mui/icons-material/ShieldOutlined';
import MenuIcon from '@mui/icons-material/Menu';
import { motion } from 'framer-motion';
import { NavLink, useLocation } from 'react-router-dom';

const links = [
  ['Platform', '/platform'],
  ['Detector', '/detector'],
  ['Models', '/models'],
  ['API', '/api'],
];

export default function Navbar() {
  const location = useLocation();
  return (
    <AppBar position="fixed" elevation={0} className="glass-nav">
      <Container maxWidth="xl">
        <Toolbar disableGutters sx={{ minHeight: 76 }}>
          <Stack component={NavLink} to="/" direction="row" alignItems="center" spacing={1.2} sx={{ flexGrow: 1, textDecoration: 'none', color: 'inherit' }}>
            <Box className="brand-mark"><ShieldOutlinedIcon fontSize="small" /></Box>
            <Typography variant="h6" fontWeight={800}>NoteShield AI</Typography>
          </Stack>
          <Stack direction="row" spacing={0.5} className="desktop-only">
            {links.map(([label, to]) => (
              <Button
                key={to}
                component={NavLink}
                to={to}
                color="inherit"
                className={location.pathname === to ? 'nav-link active' : 'nav-link'}
              >
                {label}
              </Button>
            ))}
          </Stack>
          <Button component={motion(NavLink)} whileTap={{ scale: 0.96 }} variant="contained" to="/detector" sx={{ ml: 2 }}>
            Scan note
          </Button>
          <Button component={motion.button} whileTap={{ scale: 0.94 }} className="mobile-only" color="inherit" sx={{ ml: 1, minWidth: 44 }}>
            <MenuIcon />
          </Button>
        </Toolbar>
      </Container>
    </AppBar>
  );
}
