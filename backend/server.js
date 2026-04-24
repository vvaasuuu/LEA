require('dotenv').config();
const express = require('express');
const cors = require('cors');
const aiRouter = require('./routes/ai');

const app = express();
app.use(cors());
app.use(express.json());
app.use('/api', aiRouter);

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => console.log(`LEA backend running on port ${PORT}`));
