import { v4 as uuidv4 } from 'uuid';
import type { NextApiRequest, NextApiResponse } from 'next';
import pool from '@/lib/db';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method === 'POST') {
    // Store secret
    const { encryptedContent, expiresIn, passwordProtected, fileName, fileType, messageType } = req.body;
    const id = uuidv4();
    const now = new Date();
    const expiresAt = new Date(now.getTime() + Number(expiresIn));
    try {
      await pool.query(
        `INSERT INTO secrets (id, encrypted_content, created_at, expires_at, password_protected, file_name, file_type, message_type)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
        [id, encryptedContent, now, expiresAt, passwordProtected, fileName, fileType, messageType]
      );
      res.status(200).json({ id });
    } catch (err) {
      console.error(err);
      res.status(500).json({ error: 'Failed to store secret' });
    }
  } else if (req.method === 'GET') {
    // Retrieve and delete secret
    const { id } = req.query;
    try {
      const { rows } = await pool.query('SELECT * FROM secrets WHERE id = $1', [id]);
      if (rows.length === 0 || new Date(rows[0].expires_at) < new Date()) {
        return res.status(404).json({ error: 'Secret not found or expired' });
      }
      // Delete after retrieval
      await pool.query('DELETE FROM secrets WHERE id = $1', [id]);
      res.status(200).json(rows[0]);
    } catch (err) {
      console.error(err);
      res.status(500).json({ error: 'Failed to retrieve secret' });
    }
  } else {
    res.status(405).end();
  }
} 