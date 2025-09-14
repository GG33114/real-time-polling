const express = require('express');
const prisma = require('../prismaClient');

const router = express.Router();

/**
 * Cast a vote:
 * POST /votes
 * body: { userId: number, pollId: number, pollOptionId: number }
 *
 * Rules:
 * - Ensure pollOption belongs to pollId
 * - Prevent a user from voting more than once on same poll (application-level)
 */
router.post('/', async (req, res) => {
  try {
    const { userId, pollId, pollOptionId } = req.body;
    if (!userId || !pollId || !pollOptionId) return res.status(400).json({ error: 'userId, pollId, pollOptionId required' });

    // confirm option belongs to poll
    const option = await prisma.pollOption.findUnique({
      where: { id: pollOptionId }
    });
    if (!option || option.pollId !== pollId) return res.status(400).json({ error: 'pollOption does not belong to poll' });

    // check if user has already voted on this poll
    const existingVote = await prisma.vote.findFirst({
      where: {
        userId,
        pollOption: {
          pollId
        }
      }
    });
    if (existingVote) {
      return res.status(409).json({ error: 'User has already voted on this poll' });
    }

    // create vote
    const vote = await prisma.vote.create({
      data: {
        user: { connect: { id: userId } },
        pollOption: { connect: { id: pollOptionId } }
      }
    });

    // compute updated counts
    const optionsWithVotes = await prisma.pollOption.findMany({
      where: { pollId },
      include: { votes: true }
    });
    const results = optionsWithVotes.map(o => ({ id: o.id, text: o.text, voteCount: o.votes.length }));

    // emit to room for this poll
    const io = req.app.get('io');
    if (io) {
      io.to(`poll_${pollId}`).emit('vote_update', { pollId, results });
    }

    res.status(201).json({ ok: true, voteId: vote.id, results });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router;
