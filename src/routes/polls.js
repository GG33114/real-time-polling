const express = require('express');
const prisma = require('../prismaClient');
const router = express.Router();

/**
 * Create a poll with options
 * POST /polls
 * body: { question: string, creatorId: number, isPublished?: boolean, options: [ "opt1", "opt2", ... ] }
 */
router.post('/', async (req, res) => {
  try {
    const { question, creatorId, isPublished = false, options } = req.body;
    if (!question || !creatorId || !Array.isArray(options) || options.length === 0) {
      return res.status(400).json({ error: 'question, creatorId and non-empty options array required' });
    }

    const created = await prisma.poll.create({
      data: {
        question,
        isPublished,
        creator: { connect: { id: creatorId } },
        options: {
          create: options.map((text) => ({ text }))
        }
      },
      include: { options: true }
    });

    res.status(201).json(created);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

/**
 * Get poll with options and vote counts
 * GET /polls/:id
 */
router.get('/:id', async (req, res) => {
  const pollId = Number(req.params.id);
  try {
    const poll = await prisma.poll.findUnique({
      where: { id: pollId },
      include: {
        options: {
          include: { votes: true }
        },
        creator: { select: { id: true, name: true, email: true } }
      }
    });

    if (!poll) return res.status(404).json({ error: 'Poll not found' });

    // convert votes to counts
    const options = poll.options.map(opt => ({
      id: opt.id,
      text: opt.text,
      voteCount: opt.votes.length
    }));

    res.json({
      id: poll.id,
      question: poll.question,
      isPublished: poll.isPublished,
      createdAt: poll.createdAt,
      updatedAt: poll.updatedAt,
      creator: poll.creator,
      options
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

/**
 * Optional: publish/unpublish poll
 * PATCH /polls/:id
 * body: { isPublished: boolean }
 */
router.patch('/:id', async (req, res) => {
  const pollId = Number(req.params.id);
  const { isPublished } = req.body;
  if (typeof isPublished !== 'boolean') return res.status(400).json({ error: 'isPublished boolean required' });

  try {
    const updated = await prisma.poll.update({
      where: { id: pollId },
      data: { isPublished }
    });
    res.json(updated);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router;
