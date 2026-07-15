const nodemailer = require("nodemailer");

/**
 * Production-ready Nodemailer transporter for Gmail SMTP.
 *
 * Key production fixes applied:
 *
 * 1. family: 4
 *    Render (and many cloud hosts) default to IPv6 for outbound connections.
 *    Gmail's smtp.gmail.com resolves to both IPv4 and IPv6. When Node.js picks
 *    an IPv6 address on Render's free tier the connection is unreachable
 *    (ENETUNREACH / Connection timeout). Forcing family: 4 tells Node's DNS
 *    resolver to only return IPv4 addresses, which Render supports reliably.
 *
 * 2. connectionTimeout / greetingTimeout / socketTimeout
 *    Without explicit timeouts a stalled TCP handshake (common on cold starts)
 *    blocks the event loop and eventually causes a generic 500 error.
 *    These settings make failures fast and predictable.
 *
 * 3. pool: true / maxConnections: 3
 *    Reuses TCP connections across multiple sendMail() calls. Reduces overhead
 *    and avoids per-request cold-start latency on Render.
 *
 * 4. port: 587 / secure: false / requireTLS: true
 *    Correct settings for Gmail STARTTLS (as opposed to SSL on port 465).
 *    requireTLS ensures the connection is always upgraded; it will refuse to
 *    send in plain text even if the server offers it.
 *
 * 5. logger / debug
 *    Enabled only outside production so Render production logs stay clean,
 *    while local development gets full SMTP conversation traces.
 */

const isProduction = process.env.NODE_ENV === "production";

const transporter = nodemailer.createTransport({
  host: "smtp.gmail.com",
  port: 587,
  secure: false,       // STARTTLS — do NOT set true here (that is for port 465)
  requireTLS: true,    // Abort if STARTTLS upgrade fails (never send plain text)

  auth: {
    user: process.env.EMAIL,
    pass: process.env.EMAIL_PASSWORD, // Must be a Gmail App Password, not your Gmail login password
  },

  // ─── IPv4 fix for Render ───────────────────────────────────────────────────
  // Forces Node's DNS resolver to only consider A (IPv4) records.
  // Prevents ENETUNREACH errors caused by Render routing IPv6 traffic
  // to Gmail SMTP (2607:f8b0:...:587) which is unreliable on Render.
  family: 4,

  // ─── Timeout settings ─────────────────────────────────────────────────────
  connectionTimeout: 10000, // 10 s — max time to establish the TCP connection
  greetingTimeout: 10000,   // 10 s — max time to wait for the SMTP greeting
  socketTimeout: 15000,     // 15 s — max idle time on an open socket

  // ─── Connection pool ──────────────────────────────────────────────────────
  pool: true,          // Reuse connections instead of opening a new one per email
  maxConnections: 3,   // Keep at most 3 concurrent SMTP connections open
  maxMessages: 100,    // Close and reopen a connection after 100 messages

  // ─── Logging (development only) ───────────────────────────────────────────
  logger: !isProduction,  // Print SMTP conversation to console in dev
  debug: false,           // Set to true locally if you want full protocol trace
});

module.exports = transporter;