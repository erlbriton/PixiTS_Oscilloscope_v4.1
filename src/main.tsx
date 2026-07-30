// src/main.tsx

import './styles/oscilloscope.css';
import { Oscilloscope } from './Oscilloscope';

console.log('Oscilloscope starting...');

document.addEventListener('DOMContentLoaded', () => {
    const oscilloscope = new Oscilloscope();
    oscilloscope.initialize();
});

// Immediate initialization if DOM is already loaded
if (document.readyState === 'complete' || document.readyState === 'interactive') {
    const oscilloscope = new Oscilloscope();
    oscilloscope.initialize();
}
