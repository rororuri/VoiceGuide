const express = require('express');
const fetch = require('node-fetch');
const multer = require('multer');
const FormData = require('form-data');

const app = express();
const upload = multer();

app.post('/upload', upload.single('image'), async (req, res) => {
    const form = new FormData();
    form.append('file', req.file.buffer, req.file.originalname);

    try {
        const response = await fetch('http://localhost:5000/predict', { method: 'POST', body: form });
        const result = await response.json();
        res.json(result);
    } catch (error) {
        console.error('Error:', error);
        res.status(500).json({error: 'Internal Server Error'});
    }
});

app.listen(3000, () => {
    console.log('Server is running on http://localhost:3000');
});
