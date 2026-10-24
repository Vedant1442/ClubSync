const db = require('./db');

async function migrate() {
  const client = await db.pool.connect();
  try {
    await client.query('BEGIN');

    await client.query(`
      CREATE TABLE IF NOT EXISTS event_qa_questions (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        event_id UUID REFERENCES events(id) ON DELETE CASCADE,
        user_id UUID REFERENCES users(id) ON DELETE SET NULL,
        author_name TEXT,
        author_branch TEXT,
        content TEXT NOT NULL,
        upvotes_count INTEGER DEFAULT 0,
        is_pinned BOOLEAN DEFAULT false,
        is_answered BOOLEAN DEFAULT false,
        answer_text TEXT,
        created_at TIMESTAMPTZ DEFAULT NOW()
      );
    `);

    await client.query(`
      CREATE TABLE IF NOT EXISTS event_qa_upvotes (
        question_id UUID REFERENCES event_qa_questions(id) ON DELETE CASCADE,
        user_id UUID REFERENCES users(id) ON DELETE CASCADE,
        created_at TIMESTAMPTZ DEFAULT NOW(),
        PRIMARY KEY (question_id, user_id)
      );
    `);

    // Add indexes for high performance
    await client.query(`
      CREATE INDEX IF NOT EXISTS idx_qa_event_id ON event_qa_questions(event_id);
      CREATE INDEX IF NOT EXISTS idx_qa_upvotes ON event_qa_upvotes(question_id);
    `);

    await client.query('COMMIT');
    console.log('Event Q&A tables created successfully.');
    process.exit(0);
  } catch (err) {
    await client.query('ROLLBACK');
    console.error('Migration error:', err);
    process.exit(1);
  } finally {
    client.release();
  }
}

migrate();
