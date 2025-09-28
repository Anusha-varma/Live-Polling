import express from "express";
import mongoose from "mongoose";
import cors from "cors";
import http from "http";
import { Server } from "socket.io";

const app = express();
const server = http.createServer(app);
const io = new Server(server, { cors: { origin: '*' } });
app.use(express.json());
app.use(cors());

// MongoDB Connection
mongoose
  .connect(process.env.MONGO_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  })
  .then(() => console.log("✅ MongoDB Connected"))
  .catch((err) => console.error("❌ MongoDB connection error:", err));

// Schema
const questionSchema = new mongoose.Schema({
  question: { type: String, required: true },
  options: { type: [String], required: true },
  correctIndex: { type: Number, required: true },
  timer: { type: Number, required: true },
});

const Question = mongoose.model("Question", questionSchema);

// Add a schema for student responses
const ResponseSchema = new mongoose.Schema({
  questionId: { type: mongoose.Schema.Types.ObjectId, ref: 'Question' },
  selectedIndex: Number,
  timestamp: { type: Date, default: Date.now }
});
const Response = mongoose.model('Response', ResponseSchema);

// Participant schema
const participantSchema = new mongoose.Schema({
  name: { type: String, required: true, unique: true },
  kicked: { type: Boolean, default: false },
  attempted: { type: Boolean, default: false } 
});
const Participant = mongoose.model('Participant', participantSchema);

// GET all questions
app.get("/api/questions", async (req, res) => {
  try {
    const questions = await Question.find();
    res.json(questions);
  } catch (err) {
    console.error("Error fetching questions:", err);
    res.status(500).json({ error: "Failed to fetch questions." });
  }
});
// app.post('/api/reset-test', async (req, res) => {
//   try {
//     await Response.deleteMany({});
//     await Participant.updateMany({}, { attempted: false });
//     res.json({ success: true, message: 'Test reset successfully' });
//   } catch (err) {
//     console.error(err);
//     res.status(500).json({ error: 'Failed to reset test' });
//   }
// });

// app.delete('/api/participants/unattempted', async (req, res) => {
//   try {
//     // delete participants where attempted is false or not set
//     const result = await Participant.deleteMany({ attempted: false });
//     res.json({ success: true, deletedCount: result.deletedCount });
//   } catch (err) {
//     console.error(err);
//     res.status(500).json({ error: 'Failed to delete unattempted participants' });
//   }
// });
// POST /api/participants/markAttempted
app.post('/api/participants/markAttempted', async (req, res) => {
  const { name } = req.body;
  if (!name) return res.status(400).json({ error: 'Name required.' });

  try {
    const participant = await Participant.findOneAndUpdate(
      { name },
      { attempted: true },  // ✅ mark attempted
      { new: true }
    );
    if (!participant) return res.status(404).json({ error: 'Participant not found.' });
    res.json({ success: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to mark participant as attempted' });
  }
});

// POST new question
app.post("/api/questions", async (req, res) => {
  try {
    const { question, options, correctIndex, timer } = req.body;

    if (!question || !Array.isArray(options) || options.length < 2) {
      return res.status(400).json({ error: "Question and at least 2 options are required." });
    }

    const newQ = new Question({ question, options, correctIndex, timer });
    const saved = await newQ.save();
    res.json(saved);
  } catch (err) {
    console.error("Error adding question:", err);
    res.status(500).json({ error: "Failed to add question." });
  }
});

// UPDATE question
app.put("/api/questions/:id", async (req, res) => {
  const { id } = req.params;
  console.log("PUT request id:", id);
  console.log("PUT body:", req.body);

  try {
    const { question, options, correctIndex, timer } = req.body;

    if (!question || !Array.isArray(options) || options.length < 2) {
      return res.status(400).json({ error: "Question and at least 2 valid options are required." });
    }

    const updated = await Question.findByIdAndUpdate(
      id,
      { question, options, correctIndex, timer },
      { new: true }
    );

    if (!updated) return res.status(404).json({ error: "Question not found." });

    res.json(updated);
  } catch (err) {
    console.error("Error updating question:", err);
    res.status(500).json({ error: "Failed to update question." });
  }
});

// DELETE question
app.delete("/api/questions/:id", async (req, res) => {
  const { id } = req.params;
  console.log("DELETE request id:", id);

  try {
    const deleted = await Question.findByIdAndDelete(id);
    if (!deleted) return res.status(404).json({ error: "Question not found." });

    res.json({ success: true });
  } catch (err) {
    console.error("Error deleting question:", err);
    res.status(500).json({ error: "Failed to delete question." });
  }
});

// Endpoint for students to submit a response
app.post('/api/responses', async (req, res) => {
  const { questionId, selectedIndex, name } = req.body;
  if (!questionId || typeof selectedIndex !== 'number' || !name) {
    return res.status(400).json({ error: 'questionId, selectedIndex, and name required.' });
  }
  const participant = await Participant.findOne({ name });
  if (!participant || participant.kicked) {
    return res.status(403).json({ error: 'You have been kicked out.' });
  }
  const response = new Response({ questionId, selectedIndex });
  await response.save();
  // Emit live update event
  io.emit('new-response', { questionId, selectedIndex, name });
  res.json({ success: true });
});

// Endpoint to get aggregated responses for all questions
app.get('/api/responses/aggregate', async (req, res) => {
  // Aggregate responses per question
  const questions = await Question.find();
  const result = [];
  for (const q of questions) {
    const responses = await Response.find({ questionId: q._id });
    const counts = Array(q.options.length).fill(0);
    responses.forEach(r => {
      if (typeof r.selectedIndex === 'number' && r.selectedIndex < counts.length) {
        counts[r.selectedIndex]++;
      }
    });
    const total = counts.reduce((a, b) => a + b, 0);
    const percentages = total > 0 ? counts.map(c => (c / total) * 100) : counts.map(() => 0);
    result.push({ questionId: q._id, percentages });
  }
  res.json(result);
});

// Add participant (called when student enters name)
app.post('/api/participants', async (req, res) => {
  const { name } = req.body;
  if (!name) return res.status(400).json({ error: 'Name required.' });
  let participant = await Participant.findOne({ name });
  if (!participant) participant = await Participant.create({ name });
  res.json(participant);
});

// Get all participants
app.get('/api/participants', async (req, res) => {
  const participants = await Participant.find();
  res.json(participants);
});

// Kick a participant
app.post('/api/participants/kick', async (req, res) => {
  const { name } = req.body;
  if (!name) return res.status(400).json({ error: 'Name required.' });
  const participant = await Participant.findOneAndUpdate({ name }, { kicked: true }, { new: true });
  if (!participant) return res.status(404).json({ error: 'Participant not found.' });
  res.json({ success: true });
});

// Check if participant is kicked
app.get('/api/participants/:name/kicked', async (req, res) => {
  const { name } = req.params;
  const participant = await Participant.findOne({ name });
  res.json({ kicked: participant?.kicked || false });
});

// Socket.io connection
io.on('connection', (socket) => {
  console.log('Socket connected:', socket.id);
});

// Start server
const PORT = 5000;
server.listen(PORT, () => console.log(`🚀 Server running on port ${PORT}`));
