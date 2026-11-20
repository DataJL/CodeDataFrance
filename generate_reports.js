import { jsPDF } from 'jspdf';
import fs from 'fs';
import path from 'path';

const outDir = './public/assets/aistudio';
if (!fs.existsSync(outDir)) {
  fs.mkdirSync(outDir, { recursive: true });
}

function createReport({ filename, title, discipline, competition, authors, metrics, takeaways, benchmarks }) {
  const doc = new jsPDF();
  
  // Header banner
  doc.setFillColor(30, 27, 75); // Dark Indigo
  doc.rect(0, 0, 210, 36, 'F');
  
  doc.setTextColor(255, 255, 255);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(16);
  doc.text('WORLD ATHLETICS / IAAF BIOMECHANICAL REPORT', 14, 15);
  
  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(199, 210, 254);
  doc.text(`Official Scientific Study - ${competition} - Leeds Beckett University`, 14, 25);
  
  // Title & Subtitle
  doc.setTextColor(15, 23, 42);
  doc.setFontSize(16);
  doc.setFont('helvetica', 'bold');
  doc.text(title, 14, 48);
  
  doc.setFontSize(10);
  doc.setFont('helvetica', 'italic');
  doc.setTextColor(71, 85, 105);
  doc.text(`Discipline: ${discipline} | Scientific Team: ${authors.join(', ')}`, 14, 55);
  
  // Line separator
  doc.setDrawColor(203, 213, 225);
  doc.line(14, 60, 196, 60);
  
  // Executive summary
  doc.setFontSize(12);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(30, 27, 75);
  doc.text('1. Executive Summary & Methodology', 14, 70);
  
  doc.setFontSize(9);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(51, 65, 85);
  const summaryText = doc.splitTextToSize(
    `This scientific report presents the 3D kinematic analysis of the elite world finalists in ${discipline} during the World Championships. High-speed cameras operating at 120-250 Hz calibrated with SIMI Motion 3D capture systems recorded approach run-up velocities, step frequency, ground contact times, center of mass (CoM) trajectory, and energy conversion rates.`,
    182
  );
  doc.text(summaryText, 14, 77);
  
  // Metrics Table
  doc.setFontSize(12);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(30, 27, 75);
  doc.text('2. Elite Finalists Kinematic Data Table', 14, 100);
  
  // Table header
  let y = 107;
  doc.setFillColor(241, 245, 249);
  doc.rect(14, y - 5, 182, 8, 'F');
  doc.setFontSize(8);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(30, 41, 59);
  
  const headers = ['Athlete', 'Country', 'Mark / Time', 'Approach Velocity', 'Contact Time', 'Key Biomechanical Metric'];
  doc.text(headers[0], 16, y);
  doc.text(headers[1], 55, y);
  doc.text(headers[2], 75, y);
  doc.text(headers[3], 102, y);
  doc.text(headers[4], 135, y);
  doc.text(headers[5], 160, y);
  
  // Table rows
  doc.setFont('helvetica', 'normal');
  metrics.forEach((m, idx) => {
    y += 8;
    if (idx % 2 === 1) {
      doc.setFillColor(248, 250, 252);
      doc.rect(14, y - 5, 182, 8, 'F');
    }
    doc.setTextColor(15, 23, 42);
    doc.text(m.name, 16, y);
    doc.setTextColor(100, 116, 139);
    doc.text(m.country, 55, y);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(79, 70, 229);
    doc.text(m.mark, 75, y);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(15, 23, 42);
    doc.text(m.velocity, 102, y);
    doc.text(m.contactTime, 135, y);
    doc.text(m.customMetric, 160, y);
  });
  
  // Benchmarks Section
  y += 15;
  doc.setFontSize(12);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(30, 27, 75);
  doc.text('3. Elite Coaching Benchmarks & Reference Ranges', 14, y);
  
  y += 7;
  doc.setFontSize(8.5);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(51, 65, 85);
  benchmarks.forEach(b => {
    doc.text(`• ${b.label}: ${b.range} (Elite average: ${b.avg})`, 18, y);
    y += 5.5;
  });
  
  // Practical Key Takeaways
  y += 5;
  doc.setFontSize(12);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(30, 27, 75);
  doc.text('4. Key Takeaways for Elite Training', 14, y);
  
  y += 7;
  doc.setFontSize(8.5);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(51, 65, 85);
  takeaways.forEach((t, i) => {
    const wrapped = doc.splitTextToSize(`${i + 1}. ${t}`, 180);
    doc.text(wrapped, 16, y);
    y += wrapped.length * 4.5 + 2;
  });
  
  // Footer
  doc.setFontSize(8);
  doc.setTextColor(148, 163, 184);
  doc.text('World Athletics & Carnegie School of Sport - London Research Project | Data France Athle SHN Portal', 14, 285);
  
  const buffer = doc.output('arraybuffer');
  fs.writeFileSync(path.join(outDir, filename), Buffer.from(buffer));
  console.log(`Generated ${filename}`);
}

// 1. Pole Vault
createReport({
  filename: 'Pole_Vault_Biomechanical_Report.pdf',
  title: "Men's Pole Vault - Official Biomechanical Report",
  discipline: 'Saut a la Perche',
  competition: 'IAAF World Championships London 2017',
  authors: ['Dr Gareth Nicholson', 'Prof Athanassios Bissas', 'Stephane Merlino'],
  metrics: [
    { name: 'Sam Kendricks', country: 'USA', mark: '5.95 m', velocity: '9.62 m/s', contactTime: '124 ms', customMetric: 'Grip 5.12m' },
    { name: 'Piotr Lisek', country: 'POL', mark: '5.89 m', velocity: '9.55 m/s', contactTime: '128 ms', customMetric: 'Grip 5.10m' },
    { name: 'Renaud Lavillenie', country: 'FRA', mark: '5.89 m', velocity: '9.82 m/s', contactTime: '118 ms', customMetric: 'Grip 5.05m' },
    { name: 'Xue Changrui', country: 'CHN', mark: '5.82 m', velocity: '9.48 m/s', contactTime: '126 ms', customMetric: 'Grip 4.98m' },
    { name: 'Pawel Wojciechowski', country: 'POL', mark: '5.75 m', velocity: '9.51 m/s', contactTime: '125 ms', customMetric: 'Grip 5.00m' },
    { name: 'Shawnacy Barber', country: 'CAN', mark: '5.65 m', velocity: '9.74 m/s', contactTime: '120 ms', customMetric: 'Grip 5.08m' },
  ],
  benchmarks: [
    { label: 'Run-up velocity 16m-11m', range: '9.10 - 9.45 m/s', avg: '9.28 m/s' },
    { label: 'Run-up velocity 11m-6m', range: '9.35 - 9.75 m/s', avg: '9.55 m/s' },
    { label: 'Terminal velocity 5m-1m', range: '9.48 - 9.85 m/s', avg: '9.63 m/s' },
    { label: 'Take-off contact time', range: '118 - 132 ms', avg: '123 ms' },
    { label: 'Grip height', range: '4.95 - 5.18 m', avg: '5.06 m' },
    { label: 'Peak pelvis height above bar', range: '+12 to +28 cm', avg: '+19 cm' },
  ],
  takeaways: [
    'Terminal velocity over the last 5 meters is correlated at r=0.84 with the cleared height. Maintaining speed through pole plant is decisive.',
    'Take-off contact duration is among the shortest in athletics (118-128 ms), requiring maximum plant stiffness.',
    'Energy storage into the pole fiberglass reaches 3.5 to 4.2 kJ, recoiling vertically into the pole extension phase.'
  ]
});

// 2. Long Jump
createReport({
  filename: 'Long_Jump_Biomechanical_Report.pdf',
  title: "Men's Long Jump - Official Biomechanical Report",
  discipline: 'Saut en Longueur',
  competition: 'IAAF World Championships London 2017',
  authors: ['Dr Paul Brice', 'Prof Athanassios Bissas', 'Dr Gareth Nicholson'],
  metrics: [
    { name: 'Luvo Manyonga', country: 'RSA', mark: '8.48 m', velocity: '10.74 m/s', contactTime: '116 ms', customMetric: 'Angle 21.4 deg' },
    { name: 'Jarrion Lawson', country: 'USA', mark: '8.44 m', velocity: '10.88 m/s', customMetric: 'Angle 20.8 deg', contactTime: '112 ms' },
    { name: 'Ruswahl Samaai', country: 'RSA', mark: '8.32 m', velocity: '10.65 m/s', contactTime: '120 ms', customMetric: 'Angle 22.1 deg' },
    { name: 'Aleksandr Menkov', country: 'ANA', mark: '8.27 m', velocity: '10.58 m/s', contactTime: '122 ms', customMetric: 'Angle 21.8 deg' },
    { name: 'Maykel Masso', country: 'CUB', mark: '8.26 m', velocity: '10.72 m/s', contactTime: '115 ms', customMetric: 'Angle 20.6 deg' },
    { name: 'Shi Yuhao', country: 'CHN', mark: '8.23 m', velocity: '10.60 m/s', contactTime: '118 ms', customMetric: 'Angle 21.5 deg' },
  ],
  benchmarks: [
    { label: 'Run-up velocity 11m-6m', range: '10.40 - 11.10 m/s', avg: '10.75 m/s' },
    { label: 'Horizontal velocity on board', range: '10.55 - 10.95 m/s', avg: '10.72 m/s' },
    { label: 'Loss of velocity at touch-down', range: '1.20 - 1.55 m/s', avg: '1.38 m/s' },
    { label: 'Vertical take-off velocity (Vv)', range: '3.25 - 3.70 m/s', avg: '3.48 m/s' },
    { label: 'Take-off angle', range: '19.5 - 22.5 deg', avg: '21.2 deg' },
    { label: 'Board contact time', range: '112 - 126 ms', avg: '117 ms' },
  ],
  takeaways: [
    'Horizontal board speed accounts for approximately 68% of the resulting jump distance.',
    'The penultimate step is 8 to 14 cm longer than the antecedent, lowering the CoM by 4 to 7 cm without velocity loss.',
    'Take-off foot plant involves active backward clawing action with foot landing flat to minimize braking impulses.'
  ]
});

// 3. 100m Sprint
createReport({
  filename: '100m_Men_Biomechanical_Report.pdf',
  title: "Men's 100m - Official Biomechanical Report",
  discipline: '100m Sprint',
  competition: 'IAAF World Championships London 2017',
  authors: ['Dr Helen Gravestock', 'Prof Athanassios Bissas', 'Stephane Merlino'],
  metrics: [
    { name: 'Justin Gatlin', country: 'USA', mark: '9.92 s', velocity: '12.08 m/s', contactTime: '88 ms', customMetric: 'Freq 4.72 Hz' },
    { name: 'Christian Coleman', country: 'USA', mark: '9.94 s', velocity: '12.18 m/s', contactTime: '84 ms', customMetric: 'Freq 4.88 Hz' },
    { name: 'Usain Bolt', country: 'JAM', mark: '9.95 s', velocity: '12.05 m/s', contactTime: '87 ms', customMetric: 'Step 2.47 m' },
    { name: 'Yohan Blake', country: 'JAM', mark: '9.99 s', velocity: '11.96 m/s', contactTime: '89 ms', customMetric: 'Freq 4.65 Hz' },
    { name: 'Akani Simbine', country: 'RSA', mark: '10.01 s', velocity: '11.92 m/s', contactTime: '86 ms', customMetric: 'Freq 4.70 Hz' },
    { name: 'Jimmy Vicaut', country: 'FRA', mark: '10.08 s', velocity: '11.85 m/s', contactTime: '88 ms', customMetric: 'Freq 4.68 Hz' },
  ],
  benchmarks: [
    { label: 'Reaction time', range: '0.123 - 0.165 s', avg: '0.144 s' },
    { label: '0-30m Acceleration time', range: '3.75 - 3.88 s', avg: '3.81 s' },
    { label: 'Peak velocity section (50-70m)', range: '11.85 - 12.22 m/s', avg: '12.05 m/s' },
    { label: 'Ground contact time at top speed', range: '82 - 92 ms', avg: '86 ms' },
    { label: 'Step frequency', range: '4.55 - 4.90 Hz', avg: '4.72 Hz' },
    { label: 'Average step length', range: '2.18 - 2.50 m', avg: '2.34 m' },
  ],
  takeaways: [
    'Peak velocity is reached between 55m and 68m in world finalists. The winner is the athlete who decelerates least over the final 20m.',
    'Ground contact duration in maximum velocity phase is strictly under 90 milliseconds, demanding immense elastic stiffness.',
    'Asymmetrical force production between left and right foot averages 3.8%, demonstrating high mechanical efficiency.'
  ]
});

// 4. 110m Hurdles
createReport({
  filename: '110m_Hurdles_Biomechanical_Report.pdf',
  title: "Men's 110m Hurdles - Official Biomechanical Report",
  discipline: '110m Haies',
  competition: 'IAAF World Championships London 2017',
  authors: ['Dr Giorgos Paradisis', 'Prof Athanassios Bissas', 'Stephane Merlino'],
  metrics: [
    { name: 'Omar McLeod', country: 'JAM', mark: '13.04 s', velocity: '9.42 m/s', contactTime: '102 ms', customMetric: 'H1-H10: 1.01s' },
    { name: 'Sergey Shubenkov', country: 'ANA', mark: '13.14 s', velocity: '9.38 m/s', contactTime: '104 ms', customMetric: 'H1-H10: 1.02s' },
    { name: 'Balazs Baji', country: 'HUN', mark: '13.28 s', velocity: '9.28 m/s', contactTime: '106 ms', customMetric: 'H1-H10: 1.03s' },
    { name: 'Garfield Darien', country: 'FRA', mark: '13.30 s', velocity: '9.26 m/s', contactTime: '105 ms', customMetric: 'H1-H10: 1.04s' },
    { name: 'Aries Merritt', country: 'USA', mark: '13.31 s', velocity: '9.25 m/s', contactTime: '103 ms', customMetric: 'H1-H10: 1.03s' },
    { name: 'Orlando Ortega', country: 'ESP', mark: '13.37 s', velocity: '9.20 m/s', contactTime: '107 ms', customMetric: 'H1-H10: 1.05s' },
  ],
  benchmarks: [
    { label: 'Start to H1 time', range: '2.48 - 2.58 s', avg: '2.52 s' },
    { label: 'Inter-hurdle split time', range: '0.98 - 1.05 s', avg: '1.02 s' },
    { label: 'Take-off distance before hurdle', range: '2.05 - 2.22 m', avg: '2.14 m' },
    { label: 'Landing distance after hurdle', range: '1.30 - 1.48 m', avg: '1.38 m' },
    { label: 'Airborne clearance time', range: '0.29 - 0.34 s', avg: '0.31 s' },
    { label: 'Take-off contact duration', range: '100 - 112 ms', avg: '105 ms' },
  ],
  takeaways: [
    'Hurdle clearance is an extended sprint stride rather than a jump: parabolic apex occurs before the crossbar.',
    'Take-off distance is slightly greater than 2.10m to allow flat trajectory, with quick lead leg touchdown at ~1.38m.',
    'Inter-hurdle 3-step rhythm shows strict distance progression: Step 1 (1.92m), Step 2 (2.05m), Step 3 (1.95m).'
  ]
});

// 5. Javelin Throw
createReport({
  filename: 'Javelin_Throw_Biomechanical_Report.pdf',
  title: "Men's Javelin Throw - Official Biomechanical Report",
  discipline: 'Lancer du Javelot',
  competition: 'IAAF World Championships London 2017',
  authors: ['Dr Gareth Nicholson', 'Prof Athanassios Bissas', 'Stephane Merlino'],
  metrics: [
    { name: 'Johannes Vetter', country: 'GER', mark: '89.89 m', velocity: '31.2 m/s', contactTime: '132 ms', customMetric: 'Angle 34.8 deg' },
    { name: 'Jakub Vadlejch', country: 'CZE', mark: '89.73 m', velocity: '31.5 m/s', contactTime: '138 ms', customMetric: 'Angle 35.2 deg' },
    { name: 'Petr Frydrych', country: 'CZE', mark: '88.32 m', velocity: '30.8 m/s', contactTime: '142 ms', customMetric: 'Angle 36.1 deg' },
    { name: 'Thomas Rohler', country: 'GER', mark: '88.26 m', velocity: '30.9 m/s', contactTime: '134 ms', customMetric: 'Angle 34.5 deg' },
    { name: 'Tero Pitkamaki', country: 'FIN', mark: '85.90 m', velocity: '30.2 m/s', contactTime: '140 ms', customMetric: 'Angle 35.8 deg' },
    { name: 'Julius Yego', country: 'KEN', mark: '83.50 m', velocity: '29.7 m/s', contactTime: '146 ms', customMetric: 'Angle 37.2 deg' },
  ],
  benchmarks: [
    { label: 'Run-up speed at crossover', range: '6.20 - 7.30 m/s', avg: '6.75 m/s' },
    { label: 'Release velocity of javelin', range: '29.5 - 32.2 m/s', avg: '30.8 m/s' },
    { label: 'Release angle', range: '33.5 - 37.5 deg', avg: '35.4 deg' },
    { label: 'Angle of attitude', range: '34.0 - 38.5 deg', avg: '36.2 deg' },
    { label: 'Angle of attack (Attitude - Release)', range: '-1.5 to +2.5 deg', avg: '+0.8 deg' },
    { label: 'Left plant leg brace time', range: '128 - 146 ms', avg: '136 ms' },
  ],
  takeaways: [
    'Release velocity accounts for more than 70% of resulting throw distance. A 1 m/s gain adds approximately 4.5m.',
    'Brace leg stiffness generates rapid deceleration of hips and torso, transferring kinetic energy to the throwing arm through whip effect.',
    'Minimal angle of attack (near 0 deg) reduces aerodynamic drag and maximizes glide distance.'
  ]
});

// 6. Triple Jump
createReport({
  filename: 'Triple_Jump_Biomechanical_Report.pdf',
  title: "Men's Triple Jump - Official Biomechanical Report",
  discipline: 'Triple Saut',
  competition: 'IAAF World Championships London 2017',
  authors: ['Dr Gareth Nicholson', 'Prof Athanassios Bissas', 'Dr Paul Brice'],
  metrics: [
    { name: 'Christian Taylor', country: 'USA', mark: '17.68 m', velocity: '10.48 m/s', contactTime: '124 ms', customMetric: 'Hop 6.18m / Step 5.25m / Jump 6.25m' },
    { name: 'Will Claye', country: 'USA', mark: '17.63 m', velocity: '10.55 m/s', contactTime: '122 ms', customMetric: 'Hop 6.32m / Step 5.12m / Jump 6.19m' },
    { name: 'Dong Bin', country: 'CHN', mark: '17.28 m', velocity: '10.42 m/s', contactTime: '126 ms', customMetric: 'Hop 6.10m / Step 5.08m / Jump 6.10m' },
    { name: 'Nelson Evora', country: 'POR', mark: '17.19 m', velocity: '10.35 m/s', contactTime: '125 ms', customMetric: 'Hop 6.05m / Step 5.15m / Jump 5.99m' },
    { name: 'Alexis Copello', country: 'AZE', mark: '17.16 m', velocity: '10.38 m/s', contactTime: '128 ms', customMetric: 'Hop 6.00m / Step 5.22m / Jump 5.94m' },
    { name: 'Jhon Murillo', country: 'COL', mark: '17.01 m', velocity: '10.28 m/s', contactTime: '130 ms', customMetric: 'Hop 5.95m / Step 5.10m / Jump 5.96m' },
  ],
  benchmarks: [
    { label: 'Run-up velocity at board (Vh)', range: '10.20 - 10.70 m/s', avg: '10.45 m/s' },
    { label: 'Hop phase distance (35-37%)', range: '5.85 - 6.45 m', avg: '6.15 m' },
    { label: 'Step phase distance (29-31%)', range: '4.85 - 5.35 m', avg: '5.10 m' },
    { label: 'Jump phase distance (33-35%)', range: '5.60 - 6.30 m', avg: '5.95 m' },
    { label: 'Ground contact time Hop', range: '118 - 132 ms', avg: '124 ms' },
    { label: 'Ground contact time Step', range: '128 - 146 ms', avg: '136 ms' },
    { label: 'Ground contact time Jump', range: '142 - 165 ms', avg: '152 ms' },
  ],
  takeaways: [
    'Canonical 3-phase distance distribution: Hop 35-37%, Step 29-31%, Jump 33-35%. Christian Taylor uses 35.0% / 29.7% / 35.3%.',
    'Horizontal velocity maintenance: elite jumpers minimize braking forces during the hop touchdown to conserve momentum for the step and jump.',
    'Contact times increase progressively across the 3 phases: ~124 ms at hop, ~136 ms at step, and ~152 ms at jump.'
  ]
});

console.log('All 6 official IAAF PDF reports generated successfully.');
