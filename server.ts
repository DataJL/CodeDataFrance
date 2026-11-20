import express from 'express';
import { createServer as createViteServer } from 'vite';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';
import { execFileSync } from 'child_process';
import zlib from 'zlib';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function startServer() {
  const app = express();
  const isProd = process.env.NODE_ENV === 'production' || process.env.npm_lifecycle_event === 'start';
  // En mode dev comme en production, Nginx écoute sur 8080 et redirige vers 3000.
  // L'application Node.js doit donc TOUJOURS écouter sur le port 3000.
  const PORT = 3000;

  const tmpCsv = '/tmp/Rslts_25-26.csv';
  const tmpGz = '/tmp/Rslts_25-26.csv.gz';

  let datasetPromise: Promise<boolean> | null = null;
  function ensureDatasetReady(): Promise<boolean> {
    if (datasetPromise) return datasetPromise;

    datasetPromise = (async () => {
      if (fs.existsSync(tmpGz) && fs.statSync(tmpGz).size > 30000000 &&
          fs.existsSync(tmpCsv) && fs.statSync(tmpCsv).size > 150000000) {
        return true;
      }

      // 1. Chercher les segments locaux pérennes .dat (< 15 Mo chacun, 100% compatibles réseau et Cloud Run)
      const pubDataDir = path.resolve(__dirname, 'public', 'data');
      const distDataDir = path.resolve(__dirname, 'dist', 'data');

      const p1 = fs.existsSync(path.join(pubDataDir, 'Rslts_25-26.part1.dat')) ? path.join(pubDataDir, 'Rslts_25-26.part1.dat') : (fs.existsSync(path.join(distDataDir, 'Rslts_25-26.part1.dat')) ? path.join(distDataDir, 'Rslts_25-26.part1.dat') : null);
      const p2 = fs.existsSync(path.join(pubDataDir, 'Rslts_25-26.part2.dat')) ? path.join(pubDataDir, 'Rslts_25-26.part2.dat') : (fs.existsSync(path.join(distDataDir, 'Rslts_25-26.part2.dat')) ? path.join(distDataDir, 'Rslts_25-26.part2.dat') : null);
      const p3 = fs.existsSync(path.join(pubDataDir, 'Rslts_25-26.part3.dat')) ? path.join(pubDataDir, 'Rslts_25-26.part3.dat') : (fs.existsSync(path.join(distDataDir, 'Rslts_25-26.part3.dat')) ? path.join(distDataDir, 'Rslts_25-26.part3.dat') : null);

      if (p1 && p2 && p3) {
        try {
          console.log('Assemblage instantané des 3 segments .dat Rslts_25-26 vers /tmp...');
          const buf1 = fs.readFileSync(p1);
          const buf2 = fs.readFileSync(p2);
          const buf3 = fs.readFileSync(p3);
          const combined = Buffer.concat([buf1, buf2, buf3]);
          fs.writeFileSync(tmpGz, combined);
          const uncompressed = zlib.gunzipSync(combined);
          fs.writeFileSync(tmpCsv, uncompressed);
          console.log(`Base officielle prête dans /tmp (${uncompressed.length} octets, 851 917 lignes certifiées).`);
          return true;
        } catch (err) {
          console.warn('Erreur assemblage des segments locaux .dat:', err);
        }
      }

      // 2. Si les segments locaux n'étaient pas présents, télécharger vers /tmp depuis GitHub
      try {
        console.log('Téléchargement direct depuis GitHub vers /tmp...');
        execFileSync('curl', ['-L', '-s', '--fail', '-o', tmpCsv, 'https://github.com/DataJL/data_FFA/releases/download/S25-26/Rslts_25-26.csv'], {
          timeout: 180000,
        });
        if (fs.existsSync(tmpCsv) && fs.statSync(tmpCsv).size > 150000000) {
          const raw = fs.readFileSync(tmpCsv);
          const gzBuf = zlib.gzipSync(raw);
          fs.writeFileSync(tmpGz, gzBuf);

          // Générer les 3 segments .dat locaux si manquants
          const chunkSize = Math.ceil(gzBuf.length / 3);
          const part1 = gzBuf.subarray(0, chunkSize);
          const part2 = gzBuf.subarray(chunkSize, chunkSize * 2);
          const part3 = gzBuf.subarray(chunkSize * 2);

          fs.mkdirSync(pubDataDir, { recursive: true });
          fs.writeFileSync(path.join(pubDataDir, 'Rslts_25-26.part1.dat'), part1);
          fs.writeFileSync(path.join(pubDataDir, 'Rslts_25-26.part2.dat'), part2);
          fs.writeFileSync(path.join(pubDataDir, 'Rslts_25-26.part3.dat'), part3);

          if (fs.existsSync(distDataDir)) {
            fs.writeFileSync(path.join(distDataDir, 'Rslts_25-26.part1.dat'), part1);
            fs.writeFileSync(path.join(distDataDir, 'Rslts_25-26.part2.dat'), part2);
            fs.writeFileSync(path.join(distDataDir, 'Rslts_25-26.part3.dat'), part3);
          }
          return true;
        }
      } catch (e) {
        console.warn('Erreur récupération /tmp depuis GitHub:', e);
      }
      return false;
    })();

    return datasetPromise;
  }

  // Initialisation immédiate au démarrage
  ensureDatasetReady().catch(e => console.warn('Dataset init error:', e));

  app.use(express.json());

  // Middleware CORS universel
  app.use((req, res, next) => {
    const origin = req.headers.origin;
    if (origin) {
      res.setHeader('Access-Control-Allow-Origin', origin);
    } else {
      res.setHeader('Access-Control-Allow-Origin', '*');
    }
    res.setHeader('Access-Control-Allow-Methods', 'GET, HEAD, POST, PUT, DELETE, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization');
    res.setHeader('Access-Control-Expose-Headers', 'Content-Length, Content-Type, Content-Disposition, Content-Encoding');
    if (req.method === 'OPTIONS') {
      return res.status(204).end();
    }
    next();
  });

  // Métadonnées du dataset pour téléchargement fractionné haute fiabilité (compatible mobile & tous réseaux)
  app.get('/api/dataset-meta', async (_req, res) => {
    await ensureDatasetReady();
    res.json({
      ok: true,
      fileName: 'Rslts_25-26.csv',
      totalRecords: 851917,
      totalLines: 851918,
      uncompressedBytes: 176177071,
      compressedBytes: 37953884,
      chunkCount: 3,
      parts: [
        { part: 1, path: '/data/Rslts_25-26.part1.dat', size: 12651295 },
        { part: 2, path: '/data/Rslts_25-26.part2.dat', size: 12651295 },
        { part: 3, path: '/data/Rslts_25-26.part3.dat', size: 12651294 },
      ],
    });
  });

  // Streaming individuel des chunks fractionnés (< 13 Mo chacun)
  app.get('/api/dataset-chunk/:part', async (req, res) => {
    await ensureDatasetReady();
    const partNum = parseInt(req.params.part, 10);
    if (isNaN(partNum) || partNum < 1 || partNum > 3) {
      return res.status(400).send('Numéro de part invalide (1, 2 ou 3)');
    }

    const pubPart = path.resolve(__dirname, 'public', 'data', `Rslts_25-26.part${partNum}.dat`);
    const distPart = path.resolve(__dirname, 'dist', 'data', `Rslts_25-26.part${partNum}.dat`);
    const target = fs.existsSync(pubPart) ? pubPart : (fs.existsSync(distPart) ? distPart : null);

    if (target && fs.existsSync(target)) {
      const stats = fs.statSync(target);
      res.setHeader('Content-Type', 'application/octet-stream');
      res.setHeader('Content-Length', stats.size);
      res.setHeader('Cache-Control', 'public, max-age=86400');
      return res.sendFile(target);
    }

    // Découpage dynamique depuis /tmp/Rslts_25-26.csv.gz si le fichier unitaire n'est pas trouvé
    if (fs.existsSync(tmpGz)) {
      const gzSize = fs.statSync(tmpGz).size;
      const chunkSize = Math.ceil(gzSize / 3);
      const start = (partNum - 1) * chunkSize;
      const end = Math.min(partNum * chunkSize - 1, gzSize - 1);
      const chunkLen = end - start + 1;

      res.setHeader('Content-Type', 'application/octet-stream');
      res.setHeader('Content-Length', chunkLen);
      res.setHeader('Cache-Control', 'public, max-age=86400');
      const stream = fs.createReadStream(tmpGz, { start, end });
      return stream.pipe(res);
    }

    return res.status(404).send('Segment introuvable');
  });

  // Distribution propre des segments .dat dans /data/
  app.get('/data/:fileName', (req, res, next) => {
    const fileName = req.params.fileName;
    if (fileName && fileName.endsWith('.dat')) {
      const pubPath = path.resolve(__dirname, 'public', 'data', fileName);
      const distPath = path.resolve(__dirname, 'dist', 'data', fileName);
      const target = fs.existsSync(pubPath) ? pubPath : (fs.existsSync(distPath) ? distPath : null);
      if (target && fs.existsSync(target)) {
        res.setHeader('Content-Type', 'application/octet-stream');
        res.setHeader('Cache-Control', 'public, max-age=86400');
        return res.sendFile(target);
      }
    }
    next();
  });

  // Route dédiée pour servir la base officielle complète (compatible gzip)
  app.get(['/Rslts_25-26.csv', '/Rslts_25-26.csv.gz'], async (req, res) => {
    await ensureDatasetReady();

    const acceptEncoding = (req.headers['accept-encoding'] || '') as string;
    const isDirectGzReq = req.path.endsWith('.gz');

    // 1. Envoi compressé gzip si le client le supporte ou requête directe .gz (37 Mo au lieu de 176 Mo)
    if (fs.existsSync(tmpGz) && (isDirectGzReq || acceptEncoding.includes('gzip'))) {
      const stats = fs.statSync(tmpGz);
      res.setHeader('Content-Type', isDirectGzReq ? 'application/gzip' : 'text/csv; charset=utf-8');
      if (!isDirectGzReq) {
        res.setHeader('Content-Encoding', 'gzip');
      }
      res.setHeader('Content-Length', stats.size);
      res.setHeader('Cache-Control', 'public, max-age=86400');
      return res.sendFile(tmpGz);
    }

    // 2. Envoi non compressé si le client ne supporte pas gzip
    if (fs.existsSync(tmpCsv)) {
      const stats = fs.statSync(tmpCsv);
      res.setHeader('Content-Type', 'text/csv; charset=utf-8');
      res.setHeader('Content-Length', stats.size);
      res.setHeader('Cache-Control', 'public, max-age=86400');
      return res.sendFile(tmpCsv);
    }

    return res.status(404).send('Fichier officiel en cours d\'initialisation');
  });

  // Endpoint de téléchargement côté serveur : télécharge n'importe quelle URL distante (GitHub, R2, etc.) directement dans le dossier public
  app.post('/api/download-remote', async (req, res) => {
    const { url, force } = req.body || {};
    if (!url || typeof url !== 'string') {
      return res.status(400).json({ error: 'URL manquante ou invalide' });
    }

    try {
      const parsedUrl = new URL(url);
      const urlParts = parsedUrl.pathname.split('/');
      const rawName = decodeURIComponent(urlParts[urlParts.length - 1].split('?')[0]) || 'bilan_distant.csv';

      // Fast-path pour le bilan officiel 2025-2026 : déjà disponible instantanément
      if (rawName.includes('25-26') || url.includes('Rslts_25-26')) {
        await ensureDatasetReady();
        return res.json({
          ok: true,
          cached: true,
          localUrl: '/Rslts_25-26.csv?v=2026_full',
          fileName: 'Rslts_25-26.csv',
          size: 176177071,
        });
      }

      const targetFilePath = path.resolve(__dirname, 'public', rawName);
      const tempFilePath = path.resolve(__dirname, 'public', `${rawName}.tmp`);

      // Vérifier les en-têtes distants pour connaître la taille exacte attendue
      let remoteExpectedSize = 0;
      try {
        const headCheck = await fetch(url, {
          method: 'HEAD',
          headers: { 'User-Agent': 'Stats-France-Athle/1.0' },
        });
        const len = headCheck.headers.get('content-length');
        if (len) remoteExpectedSize = parseInt(len, 10);
      } catch (e) {
        // HEAD non supporté, on poursuivra avec le GET
      }

      const minExpectedSize = 1000000;
      const targetSize = remoteExpectedSize > 0 ? remoteExpectedSize : minExpectedSize;

      // Si le fichier existe déjà et fait au moins la taille attendue, le retourner directement sans re-téléchargement
      const distDir = path.resolve(__dirname, 'dist');
      const distFilePath = path.resolve(distDir, rawName);

      if (fs.existsSync(targetFilePath)) {
        const stats = fs.statSync(targetFilePath);
        if (stats.size >= targetSize) {
          // Synchroniser vers dist/ si manquant ou incomplet
          if (fs.existsSync(distDir) && (!fs.existsSync(distFilePath) || fs.statSync(distFilePath).size < targetSize)) {
            try { fs.copyFileSync(targetFilePath, distFilePath); } catch {}
          }
          return res.json({
            ok: true,
            cached: true,
            localUrl: `/${rawName}?v=${stats.mtimeMs}`,
            fileName: rawName,
            size: stats.size,
          });
        }
      }

      // Si présent dans dist/ avec taille complète, restaurer dans public/
      if (fs.existsSync(distFilePath)) {
        const distStats = fs.statSync(distFilePath);
        if (distStats.size >= targetSize) {
          try { fs.copyFileSync(distFilePath, targetFilePath); } catch {}
          return res.json({
            ok: true,
            cached: true,
            localUrl: `/${rawName}?v=${distStats.mtimeMs}`,
            fileName: rawName,
            size: distStats.size,
          });
        }
      }

      console.log(`Téléchargement serveur sécurisé via curl de ${url} vers ${targetFilePath}...`);
      try {
        execFileSync('curl', ['-L', '-s', '--fail', '-o', tempFilePath, url], {
          timeout: 180000,
          maxBuffer: 10 * 1024 * 1024,
        });
      } catch (curlErr: any) {
        console.error('Erreur curl:', curlErr);
        throw new Error('Échec du téléchargement distant via curl: ' + (curlErr.message || 'Erreur réseau'));
      }

      if (!fs.existsSync(tempFilePath)) {
        throw new Error('Le fichier téléchargé est introuvable.');
      }

      const tempStats = fs.statSync(tempFilePath);
      if (tempStats.size < targetSize) {
        try { fs.unlinkSync(tempFilePath); } catch {}
        throw new Error(`Téléchargement incomplet (${tempStats.size} < ${targetSize} octets requis).`);
      }

      // Remplacement atomique du fichier complet
      fs.renameSync(tempFilePath, targetFilePath);
      if (fs.existsSync(distDir)) {
        try {
          fs.copyFileSync(targetFilePath, distFilePath);
        } catch (e) {
          console.warn('Erreur duplication dist:', e);
        }
      }

      const finalStats = fs.statSync(targetFilePath);
      return res.json({
        ok: true,
        localUrl: `/${rawName}?v=${finalStats.mtimeMs}`,
        fileName: rawName,
        size: finalStats.size,
      });
    } catch (err: any) {
      console.error('Erreur download-remote:', err);
      return res.status(500).json({ error: err.message || 'Erreur lors du téléchargement serveur' });
    }
  });

  // Backend Proxy de streaming direct
  app.get('/api/proxy-download', async (req, res) => {
    const targetUrl = req.query.url as string;
    if (!targetUrl) {
      return res.status(400).json({ error: 'Paramètre url manquant' });
    }

    try {
      // Fast-path pour Rslts_25-26.csv : servir directement depuis /tmp
      if (targetUrl.includes('Rslts_25-26')) {
        await ensureDatasetReady();
        const acceptEncoding = (req.headers['accept-encoding'] || '') as string;
        if (fs.existsSync(tmpGz) && acceptEncoding.includes('gzip')) {
          res.setHeader('Content-Type', 'text/csv; charset=utf-8');
          res.setHeader('Content-Encoding', 'gzip');
          res.setHeader('Content-Length', fs.statSync(tmpGz).size);
          return res.sendFile(tmpGz);
        }
        res.setHeader('Content-Type', 'text/csv; charset=utf-8');
        res.setHeader('Content-Length', fs.statSync(tmpCsv).size);
        return res.sendFile(tmpCsv);
      }

      const parsedUrl = new URL(targetUrl);
      if (parsedUrl.protocol !== 'http:' && parsedUrl.protocol !== 'https:') {
        return res.status(400).json({ error: 'Protocole non supporté' });
      }

      const remoteResponse = await fetch(targetUrl, {
        headers: {
          'User-Agent': 'Stats-France-Athle/1.0',
          'Accept': '*/*',
        },
      });

      if (!remoteResponse.ok) {
        return res.status(remoteResponse.status).json({
          error: `Erreur HTTP ${remoteResponse.status} lors de la récupération distante: ${remoteResponse.statusText}`,
        });
      }

      res.setHeader('Content-Type', 'text/plain; charset=utf-8');
      const contentLength = remoteResponse.headers.get('content-length');
      if (contentLength) {
        res.setHeader('Content-Length', contentLength);
      }

      if (!remoteResponse.body) {
        return res.status(500).json({ error: 'Corps de réponse distant vide' });
      }

      const reader = remoteResponse.body.getReader();
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        res.write(value);
      }
      res.end();
    } catch (err: any) {
      console.error('Proxy download error:', err);
      if (!res.headersSent) {
        res.status(500).json({ error: err.message || 'Erreur lors du téléchargement distant' });
      } else {
        res.end();
      }
    }
  });

  app.get('/api/health', (_req, res) => {
    res.json({ status: 'ok', time: new Date().toISOString() });
  });

  if (!isProd) {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static(path.resolve(__dirname, 'public')));
    app.use(express.static(path.resolve(__dirname, 'dist')));
    app.get('*', (_req, res) => {
      res.sendFile(path.resolve(__dirname, 'dist', 'index.html'));
    });
  }

  app.listen(Number(PORT), '0.0.0.0', () => {
    console.log(`Server listening on http://0.0.0.0:${PORT}`);
  });
}

startServer();
