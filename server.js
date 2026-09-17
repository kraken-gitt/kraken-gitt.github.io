import express from 'express';
import cookieParser from 'cookie-parser';
import Database from 'better-sqlite3';
import crypto from 'node:crypto';
import jwt from 'jsonwebtoken';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const app = express();
const port = Number(process.env.PORT || 3000);
const secret = process.env.JWT_SECRET || 'kraken-ai-development-secret-change-me';
const ollamaUrl = process.env.OLLAMA_URL || 'http://127.0.0.1:11434';
const model = process.env.OLLAMA_MODEL || 'devstral-small-2';
const db = new Database(process.env.DB_PATH || path.join(__dirname, 'kraken-ai.sqlite'));
db.pragma('journal_mode = WAL');
db.exec(`CREATE TABLE IF NOT EXISTS users (id INTEGER PRIMARY KEY AUTOINCREMENT, email TEXT UNIQUE NOT NULL, password_hash TEXT NOT NULL, created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP);
CREATE TABLE IF NOT EXISTS messages (id INTEGER PRIMARY KEY AUTOINCREMENT, user_id INTEGER NOT NULL, role TEXT NOT NULL CHECK(role IN ('user','assistant')), content TEXT NOT NULL, created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP, FOREIGN KEY(user_id) REFERENCES users(id));`);
const queries = {
  userByEmail: db.prepare('SELECT * FROM users WHERE email = ?'),
  userById: db.prepare('SELECT id, email, created_at FROM users WHERE id = ?'),
  createUser: db.prepare('INSERT INTO users (email, password_hash) VALUES (?, ?)'),
  messages: db.prepare('SELECT id, role, content, created_at FROM messages WHERE user_id = ? ORDER BY id ASC LIMIT 100'),
  addMessage: db.prepare('INSERT INTO messages (user_id, role, content) VALUES (?, ?, ?)'),
  clearMessages: db.prepare('DELETE FROM messages WHERE user_id = ?')
};
app.use(express.json({ limit: '64kb' }));
app.use(cookieParser());
app.use(express.static(__dirname));
function hashPassword(password, salt = crypto.randomBytes(16).toString('hex')) { return `${salt}:${crypto.scryptSync(password, salt, 64).toString('hex')}`; }
function verifyPassword(password, stored) { const [salt, hash] = stored.split(':'); return crypto.timingSafeEqual(Buffer.from(hash, 'hex'), crypto.scryptSync(password, salt, 64)); }
function sessionCookie(res, userId) { res.cookie('kraken_session', jwt.sign({ sub: userId }, secret, { expiresIn: '30d' }), { httpOnly: true, sameSite: 'lax', secure: process.env.NODE_ENV === 'production', maxAge: 30 * 24 * 60 * 60 * 1000 }); }
function auth(req, res, next) { try { const token = req.cookies.kraken_session; if (!token) return res.status(401).json({ error: 'Authentication required.' }); const payload = jwt.verify(token, secret); const user = queries.userById.get(payload.sub); if (!user) return res.status(401).json({ error: 'Session expired.' }); req.user = user; next(); } catch { res.status(401).json({ error: 'Session expired.' }); } }
function validEmail(email) { return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email); }
app.post('/api/auth/register', (req, res) => { const email = String(req.body.email || '').trim().toLowerCase(); const password = String(req.body.password || ''); if (!validEmail(email) || password.length < 8) return res.status(400).json({ error: 'Use a valid email and a password of at least 8 characters.' }); if (queries.userByEmail.get(email)) return res.status(409).json({ error: 'An account already exists for this email.' }); const result = queries.createUser.run(email, hashPassword(password)); sessionCookie(res, result.lastInsertRowid); res.status(201).json({ user: queries.userById.get(result.lastInsertRowid) }); });
app.post('/api/auth/login', (req, res) => { const email = String(req.body.email || '').trim().toLowerCase(); const password = String(req.body.password || ''); const user = queries.userByEmail.get(email); if (!user || !verifyPassword(password, user.password_hash)) return res.status(401).json({ error: 'Email or password is incorrect.' }); sessionCookie(res, user.id); res.json({ user: queries.userById.get(user.id) }); });
app.post('/api/auth/logout', (req, res) => { res.clearCookie('kraken_session'); res.json({ ok: true }); });
app.get('/api/auth/me', auth, (req, res) => res.json({ user: req.user }));
app.get('/api/chat/history', auth, (req, res) => res.json({ messages: queries.messages.all(req.user.id) }));
app.delete('/api/chat/history', auth, (req, res) => { queries.clearMessages.run(req.user.id); res.json({ ok: true }); });
app.post('/api/chat', auth, async (req, res) => { const content = String(req.body.message || '').trim(); if (!content || content.length > 12000) return res.status(400).json({ error: 'Message must contain between 1 and 12,000 characters.' }); queries.addMessage.run(req.user.id, 'user', content); const history = queries.messages.all(req.user.id).slice(-20).map(m => ({ role: m.role, content: m.content })); let answer; try { const response = await fetch(`${ollamaUrl}/api/chat`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ model, stream: false, options: { temperature: 0.2 }, messages: [{ role: 'system', content: 'You are KrakenAI, a precise senior software engineer. Help with coding, debugging, architecture and secure implementations. Return concise explanations and production-ready code.' }, ...history] }) }); if (!response.ok) throw new Error(`Ollama returned ${response.status}`); const data = await response.json(); answer = data.message?.content || 'Je n’ai pas reçu de réponse exploitable.'; } catch (error) { console.error('Local model error:', error.message); return res.status(503).json({ error: `Le modèle local ${model} est indisponible. Lance Ollama et télécharge le modèle avec: ollama pull ${model}` }); } queries.addMessage.run(req.user.id, 'assistant', answer); res.json({ message: { role: 'assistant', content: answer } }); });
app.get(/.*/, (req, res) => res.sendFile(path.join(__dirname, 'index.html')));
app.listen(port, '0.0.0.0', () => console.log(`Kraken-AI listening on port ${port}`));
