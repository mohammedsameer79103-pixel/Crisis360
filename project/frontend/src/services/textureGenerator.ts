import * as THREE from 'three';

// Cache generated textures to avoid redundant canvas rendering
const textureCache = new Map<string, THREE.CanvasTexture>();

/**
 * Procedural Daytime Glass Curtain Skyscraper Facade Texture
 * Features reflective sky-blue glass, metallic mullions, floor slab spandrels, and interior depth
 */
export function getSkyscraperTexture(): THREE.CanvasTexture {
  if (textureCache.has('skyscraper_day')) return textureCache.get('skyscraper_day')!;

  const canvas = document.createElement('canvas');
  canvas.width = 512;
  canvas.height = 512;
  const ctx = canvas.getContext('2d')!;

  // Base metallic building frame
  ctx.fillStyle = '#cbd5e1';
  ctx.fillRect(0, 0, 512, 512);

  const cols = 8;
  const rows = 16;
  const colW = 512 / cols;
  const rowH = 512 / rows;

  for (let r = 0; r < rows; r++) {
    // Concrete / metal spandrel floor band
    ctx.fillStyle = '#64748b';
    ctx.fillRect(0, r * rowH, 512, 5);

    for (let c = 0; c < cols; c++) {
      // Sky reflection gradient inside window pane
      const grad = ctx.createLinearGradient(c * colW, r * rowH, (c + 1) * colW, (r + 1) * rowH);
      const isSunGlint = (c * 3 + r * 7) % 11 === 0;
      if (isSunGlint) {
        grad.addColorStop(0, '#ffffff');
        grad.addColorStop(0.3, '#7dd3fc');
        grad.addColorStop(1, '#0284c7');
      } else {
        grad.addColorStop(0, '#bae6fd');
        grad.addColorStop(0.5, '#38bdf8');
        grad.addColorStop(1, '#0369a1');
      }

      ctx.fillStyle = grad;
      ctx.fillRect(c * colW + 2.5, r * rowH + 5, colW - 5, rowH - 7);

      // Window blinds / interior office silhouette
      if ((c + r) % 3 === 0) {
        ctx.fillStyle = 'rgba(255, 255, 255, 0.4)';
        ctx.fillRect(c * colW + 4, r * rowH + 6, colW - 8, 4);
      }

      // Silver mullions
      ctx.strokeStyle = '#94a3b8';
      ctx.lineWidth = 1.2;
      ctx.strokeRect(c * colW + 2.5, r * rowH + 5, colW - 5, rowH - 7);
    }
  }

  const texture = new THREE.CanvasTexture(canvas);
  texture.wrapS = THREE.RepeatWrapping;
  texture.wrapT = THREE.RepeatWrapping;
  textureCache.set('skyscraper_day', texture);
  return texture;
}

/**
 * Procedural Residential Apartment Building Facade Texture
 * Features warm sandstone/limestone panels, balconies with glass railings, windows, and AC units
 */
export function getResidentialTexture(): THREE.CanvasTexture {
  if (textureCache.has('residential_day')) return textureCache.get('residential_day')!;

  const canvas = document.createElement('canvas');
  canvas.width = 512;
  canvas.height = 512;
  const ctx = canvas.getContext('2d')!;

  // Warm light stone / architectural stucco facade
  ctx.fillStyle = '#e2e8f0';
  ctx.fillRect(0, 0, 512, 512);

  const cols = 6;
  const rows = 12;
  const colW = 512 / cols;
  const rowH = 512 / rows;

  for (let r = 0; r < rows; r++) {
    // Floor boundary line
    ctx.fillStyle = '#94a3b8';
    ctx.fillRect(0, r * rowH, 512, 3);

    for (let c = 0; c < cols; c++) {
      // Apartment Window
      const winGrad = ctx.createLinearGradient(0, r * rowH, 0, (r + 1) * rowH);
      winGrad.addColorStop(0, '#93c5fd');
      winGrad.addColorStop(1, '#1e40af');
      ctx.fillStyle = winGrad;
      ctx.fillRect(c * colW + 10, r * rowH + 6, colW - 20, rowH - 18);

      // Window frames
      ctx.strokeStyle = '#475569';
      ctx.lineWidth = 1.5;
      ctx.strokeRect(c * colW + 10, r * rowH + 6, colW - 20, rowH - 18);

      // Balcony slab
      ctx.fillStyle = '#cbd5e1';
      ctx.fillRect(c * colW + 6, (r + 1) * rowH - 9, colW - 12, 7);

      // Modern Glass Balcony Railing with blue tint
      ctx.fillStyle = 'rgba(56, 189, 248, 0.45)';
      ctx.fillRect(c * colW + 6, (r + 1) * rowH - 15, colW - 12, 6);
      ctx.strokeStyle = '#64748b';
      ctx.lineWidth = 1;
      ctx.strokeRect(c * colW + 6, (r + 1) * rowH - 15, colW - 12, 6);

      // AC unit louver
      if ((c * 2 + r) % 4 === 0) {
        ctx.fillStyle = '#64748b';
        ctx.fillRect(c * colW + colW - 18, (r + 1) * rowH - 8, 7, 5);
      }
    }
  }

  const texture = new THREE.CanvasTexture(canvas);
  texture.wrapS = THREE.RepeatWrapping;
  texture.wrapT = THREE.RepeatWrapping;
  textureCache.set('residential_day', texture);
  return texture;
}

/**
 * Procedural Modern Office / Commercial Tower Facade Texture
 * High-tech architectural panels, structural bronze/aluminum mullions, and double glazing
 */
export function getCommercialTexture(): THREE.CanvasTexture {
  if (textureCache.has('commercial_day')) return textureCache.get('commercial_day')!;

  const canvas = document.createElement('canvas');
  canvas.width = 512;
  canvas.height = 512;
  const ctx = canvas.getContext('2d')!;

  // Clean titanium / granite architectural composite panel
  ctx.fillStyle = '#334155';
  ctx.fillRect(0, 0, 512, 512);

  const cols = 8;
  const rows = 14;
  const colW = 512 / cols;
  const rowH = 512 / rows;

  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      // Large commercial architectural glass
      const glassGrad = ctx.createLinearGradient(c * colW, r * rowH, (c + 1) * colW, (r + 1) * rowH);
      glassGrad.addColorStop(0, '#38bdf8');
      glassGrad.addColorStop(0.7, '#0284c7');
      glassGrad.addColorStop(1, '#0f172a');

      ctx.fillStyle = glassGrad;
      ctx.fillRect(c * colW + 3, r * rowH + 3, colW - 6, rowH - 6);

      // Vertical sun-shading architectural fins
      ctx.fillStyle = '#94a3b8';
      ctx.fillRect(c * colW + 2, r * rowH, 2, rowH);

      // Mullion outline
      ctx.strokeStyle = '#1e293b';
      ctx.lineWidth = 1;
      ctx.strokeRect(c * colW + 3, r * rowH + 3, colW - 6, rowH - 6);
    }
  }

  const texture = new THREE.CanvasTexture(canvas);
  texture.wrapS = THREE.RepeatWrapping;
  texture.wrapT = THREE.RepeatWrapping;
  textureCache.set('commercial_day', texture);
  return texture;
}

/**
 * Procedural Medical Center / Hospital Facade Texture
 * Medical white composite panels, red emergency accent band, and hospital windows
 */
export function getHospitalTexture(): THREE.CanvasTexture {
  if (textureCache.has('hospital_day')) return textureCache.get('hospital_day')!;

  const canvas = document.createElement('canvas');
  canvas.width = 512;
  canvas.height = 512;
  const ctx = canvas.getContext('2d')!;

  // Clean clinical white facade
  ctx.fillStyle = '#f8fafc';
  ctx.fillRect(0, 0, 512, 512);

  // Red hospital emergency stripe across mid-level
  ctx.fillStyle = '#ef4444';
  ctx.fillRect(0, 240, 512, 28);

  // Medical Cross symbols along the stripe
  for (let x = 64; x < 512; x += 128) {
    ctx.fillStyle = '#ffffff';
    // Cross
    ctx.fillRect(x - 3, 246, 6, 16);
    ctx.fillRect(x - 8, 251, 16, 6);
  }

  const cols = 8;
  const rows = 12;
  const colW = 512 / cols;
  const rowH = 512 / rows;

  for (let r = 0; r < rows; r++) {
    if (r >= 5 && r <= 6) continue; // Skip stripe region

    for (let c = 0; c < cols; c++) {
      // Clean hospital double windows
      ctx.fillStyle = '#60a5fa';
      ctx.fillRect(c * colW + 6, r * rowH + 6, colW - 12, rowH - 12);

      ctx.strokeStyle = '#cbd5e1';
      ctx.lineWidth = 1.5;
      ctx.strokeRect(c * colW + 6, r * rowH + 6, colW - 12, rowH - 12);
    }
  }

  const texture = new THREE.CanvasTexture(canvas);
  texture.wrapS = THREE.RepeatWrapping;
  texture.wrapT = THREE.RepeatWrapping;
  textureCache.set('hospital_day', texture);
  return texture;
}

/**
 * Procedural High-Definition Asphalt Road Texture with Zebra Crosswalks and Markings
 */
export function getRoadTexture(lanes: number = 4, hasZebra: boolean = true): THREE.CanvasTexture {
  const key = `road_day_${lanes}_${hasZebra}`;
  if (textureCache.has(key)) return textureCache.get(key)!;

  const canvas = document.createElement('canvas');
  canvas.width = 512;
  canvas.height = 128;
  const ctx = canvas.getContext('2d')!;

  // Rich realistic asphalt color
  ctx.fillStyle = '#262930';
  ctx.fillRect(0, 0, 512, 128);

  // Realistic asphalt aggregate speckling
  for (let i = 0; i < 600; i++) {
    const gx = Math.random() * 512;
    const gy = Math.random() * 128;
    ctx.fillStyle = Math.random() > 0.5 ? '#373c47' : '#1a1d22';
    ctx.fillRect(gx, gy, 2, 2);
  }

  // Solid White Road Edge Lines (curb shoulder)
  ctx.fillStyle = '#f1f5f9';
  ctx.fillRect(0, 8, 512, 3.5);
  ctx.fillRect(0, 116, 512, 3.5);

  // Brilliant Double Yellow Center Divider Lines (2-way traffic)
  ctx.fillStyle = '#f59e0b';
  ctx.fillRect(0, 61, 512, 2.5);
  ctx.fillRect(0, 65, 512, 2.5);

  // Dashed White Lane Divider Lines
  if (lanes >= 4) {
    ctx.fillStyle = '#f8fafc';
    for (let x = 0; x < 512; x += 36) {
      ctx.fillRect(x, 34, 18, 2.5);
      ctx.fillRect(x, 92, 18, 2.5);
    }
  }

  // Realistic High-Contrast Zebra Crosswalk at both street intersections
  if (hasZebra) {
    ctx.fillStyle = '#ffffff';
    // Left Zebra
    for (let y = 14; y < 114; y += 11) {
      ctx.fillRect(16, y, 16, 6);
    }
    // Right Zebra
    for (let y = 14; y < 114; y += 11) {
      ctx.fillRect(480, y, 16, 6);
    }

    // Stop line before zebra
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(38, 14, 4, 100);
    ctx.fillRect(470, 14, 4, 100);
  }

  const texture = new THREE.CanvasTexture(canvas);
  texture.wrapS = THREE.RepeatWrapping;
  texture.wrapT = THREE.RepeatWrapping;
  textureCache.set(key, texture);
  return texture;
}

/**
 * Procedural Rooftop Helipad Texture
 */
export function getHelipadTexture(): THREE.CanvasTexture {
  if (textureCache.has('helipad_day')) return textureCache.get('helipad_day')!;

  const canvas = document.createElement('canvas');
  canvas.width = 256;
  canvas.height = 256;
  const ctx = canvas.getContext('2d')!;

  // Smooth concrete pad
  ctx.fillStyle = '#334155';
  ctx.fillRect(0, 0, 256, 256);

  // Red safety boundary square
  ctx.strokeStyle = '#ef4444';
  ctx.lineWidth = 8;
  ctx.strokeRect(18, 18, 220, 220);

  // Yellow landing guide circle
  ctx.beginPath();
  ctx.arc(128, 128, 80, 0, Math.PI * 2);
  ctx.strokeStyle = '#f59e0b';
  ctx.lineWidth = 8;
  ctx.stroke();

  // Bold White Helipad 'H'
  ctx.fillStyle = '#ffffff';
  ctx.fillRect(88, 74, 20, 108);
  ctx.fillRect(148, 74, 20, 108);
  ctx.fillRect(88, 118, 80, 20);

  const texture = new THREE.CanvasTexture(canvas);
  textureCache.set('helipad_day', texture);
  return texture;
}

/**
 * Procedural Lush Grass & Park Lawn Texture
 */
export function getGrassTexture(): THREE.CanvasTexture {
  if (textureCache.has('grass_day')) return textureCache.get('grass_day')!;

  const canvas = document.createElement('canvas');
  canvas.width = 256;
  canvas.height = 256;
  const ctx = canvas.getContext('2d')!;

  // Natural vibrant green lawn
  ctx.fillStyle = '#22c55e';
  ctx.fillRect(0, 0, 256, 256);

  // Multitone organic lawn textures
  for (let i = 0; i < 900; i++) {
    const gx = Math.random() * 256;
    const gy = Math.random() * 256;
    const rand = Math.random();
    ctx.fillStyle = rand > 0.6 ? '#16a34a' : (rand > 0.3 ? '#15803d' : '#4ade80');
    ctx.fillRect(gx, gy, 3, 3);
  }

  const texture = new THREE.CanvasTexture(canvas);
  texture.wrapS = THREE.RepeatWrapping;
  texture.wrapT = THREE.RepeatWrapping;
  textureCache.set('grass_day', texture);
  return texture;
}

/**
 * Procedural Concrete Sidewalk Pavement Texture
 */
export function getSidewalkTexture(): THREE.CanvasTexture {
  if (textureCache.has('sidewalk_day')) return textureCache.get('sidewalk_day')!;

  const canvas = document.createElement('canvas');
  canvas.width = 128;
  canvas.height = 128;
  const ctx = canvas.getContext('2d')!;

  ctx.fillStyle = '#e2e8f0';
  ctx.fillRect(0, 0, 128, 128);

  // Square paving tile expansion joints
  ctx.strokeStyle = '#94a3b8';
  ctx.lineWidth = 1.5;
  for (let x = 0; x <= 128; x += 32) {
    ctx.beginPath();
    ctx.moveTo(x, 0);
    ctx.lineTo(x, 128);
    ctx.stroke();
  }
  for (let y = 0; y <= 128; y += 32) {
    ctx.beginPath();
    ctx.moveTo(0, y);
    ctx.lineTo(128, y);
    ctx.stroke();
  }

  const texture = new THREE.CanvasTexture(canvas);
  texture.wrapS = THREE.RepeatWrapping;
  texture.wrapT = THREE.RepeatWrapping;
  textureCache.set('sidewalk_day', texture);
  return texture;
}
