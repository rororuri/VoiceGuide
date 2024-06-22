const express = require('express');
const multer = require('multer');
const fs = require('fs');
const { PythonShell } = require('python-shell');
const path = require('path');
const Sequelize = require('sequelize');
const https = require('https');
const config = require('./config/config.json').development; // config.json에서 설정 로드
const PORT = process.env.PORT || 3000;
const sequelize = new Sequelize(config.database, config.username, config.password, {
    host: config.host,
    dialect: config.dialect
});
const options = {
    key: fs.readFileSync('private.key'), // 변환된 private.key 파일 경로
    cert: fs.readFileSync('certificate.crt') // 변환된 certificate.crt 파일 경로
  };
const Inquiries = require('./inquiries.js'); // Sequelize 모델 로드
Inquiries.init(sequelize); // Sequelize 모델 초기화

const storage = multer.diskStorage({
    destination: function(req, file, cb) {
        cb(null, 'uploads/');
    },
    filename: function(req, file, cb) {
        const uniqueSuffix = Date.now() + '-' + Math.random().toString(36).substr(2, 9);
        cb(null, uniqueSuffix + path.extname(file.originalname));
    }
});

const upload = multer({ storage: storage });
const app = express();
const port = 3000;

app.use(express.static('public'));
app.use('/detected', express.static('detected'));
app.use('/uploads', express.static('uploads'));
app.use('/explanation', express.static('explanation'));
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname,'mainUI.html'));
});
app.get('/inquiry', (req, res) => {
    res.sendFile(path.join(__dirname,'inquiry.html'));
});
// '시작하기' 버튼을 눌렀을 때 'start.html' 페이지로 이동
app.get('/index', (req, res) => {
    res.sendFile(path.join(__dirname, 'index.html'));
});
app.get('/explanation', (req, res) => {
    res.sendFile(path.join(__dirname, 'explanation.html'));
});
app.post('/upload', upload.single('image'), (req, res) => {
    // 오리지널 이미지 경로
    const originalImagePath = req.file.path;
    const originalImageName = path.basename(originalImagePath);
    let esrganOptions = {
        mode: 'text',
        pythonPath: 'C:\\Users\\ejr33\\anaconda3\\python.exe',
        scriptPath: 'C:\\Users\\ejr33\\OneDrive\\Desktop\\senior',
        args: [originalImagePath]
    };

    PythonShell.run('esrgan_pycharm.py', esrganOptions)
        .then(esrganResults => {
            const esrganOutputImagePath = esrganResults[0]; // ESRGAN 처리된 이미지 경로
            const esrganOutputImageName = path.basename(esrganOutputImagePath);

            let yoloOptions = {
                mode: 'text',
                pythonPath: esrganOptions.pythonPath,
                scriptPath: esrganOptions.scriptPath,
                args: [esrganOutputImagePath]
            };

            PythonShell.run('yolo.py', yoloOptions)
                .then(yoloResults => {
                    const yoloOutputImagePath = yoloResults[0]; // YOLO 처리된 이미지 경로
                    const yoloOutputImageName = path.basename(yoloOutputImagePath);
                    const jsonOutputPath = path.join(__dirname, 'detected', 'enhanced_image.json');
                    // 클라이언트에 반환
                    res.json({
                        esrganImageUrl: `/detected/${esrganOutputImageName}`, // ESRGAN 처리된 이미지 URL
                        yoloImageUrl: `/detected/${yoloOutputImageName}`, // YOLO 처리된 이미지 URL
                        jsonUrl: `/detected/enhanced_image.json` // JSON 결과 URL
                    });
                })
                .catch(err => {
                    console.error('YOLO Error:', err);
                    res.status(500).send('Error occurred while processing the image with YOLO.');
                });
        })
        .catch(err => {
            console.error('ESRGAN Error:', err);
            res.status(500).send('Error occurred while enhancing the image.');
        });
        // JSON 데이터 요청 처리
app.get('/data', (req, res) => {
    const jsonPath = './detected/enhanced_image.json';  // JSON 파일 경로 설정
    fs.readFile(jsonPath, 'utf8', (err, data) => {
        if (err) {
            console.error(err);
            return res.status(500).send("Server Error");
        }
        res.json(JSON.parse(data));
    });
});
});
// JSON 요청 본문을 파싱하기 위해 필요
app.use(express.json());
// URL-encoded 데이터를 파싱하기 위해 필요 (예: HTML 폼 입력)
app.use(express.urlencoded({ extended: true }));

app.post('/submit-inquiry', async (req, res) => {
    try {
        const { email, inquiry } = req.body;
        await Inquiries.create({ email, inquiry });
        res.status(201).send('Inquiry submitted successfully.');
    } catch (error) {
        console.error('Error saving inquiry:', error);
        res.status(500).send('Failed to submit inquiry.');
    }
});
https.createServer(options, app).listen(PORT, () => {
    console.log(`HTTPS Server running at https://localhost:${PORT}`);
  });
