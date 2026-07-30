// src/main.ts

import './styles/oscilloscope.css';
import { Oscilloscope } from './Oscilloscope';

console.log('Oscilloscope starting...');

const oscilloscope = new Oscilloscope();
oscilloscope.initialize();
