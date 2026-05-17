import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';

export default function CustomCursor() {
  const [position, setPosition] = useState({ x: -80, y: -80 });
  const [pressed, setPressed] = useState(false);
  const [hidden, setHidden] = useState(false);

  useEffect(() => {
    const move = (event) => setPosition({ x: event.clientX, y: event.clientY });
    const down = () => setPressed(true);
    const up = () => setPressed(false);
    const leave = () => setHidden(true);
    const enter = () => setHidden(false);
    window.addEventListener('mousemove', move);
    window.addEventListener('mousedown', down);
    window.addEventListener('mouseup', up);
    document.addEventListener('mouseleave', leave);
    document.addEventListener('mouseenter', enter);
    return () => {
      window.removeEventListener('mousemove', move);
      window.removeEventListener('mousedown', down);
      window.removeEventListener('mouseup', up);
      document.removeEventListener('mouseleave', leave);
      document.removeEventListener('mouseenter', enter);
    };
  }, []);

  return (
    <motion.div
      className="custom-cursor"
      animate={{
        x: position.x - 16,
        y: position.y - 16,
        scale: pressed ? 0.72 : 1,
        opacity: hidden ? 0 : 1,
      }}
      transition={{ type: 'spring', stiffness: 520, damping: 34, mass: 0.45 }}
    />
  );
}
