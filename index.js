import express from 'express';
import readline from 'readline';
import path from 'path';
import bodyParser from 'body-parser';
import fs from 'fs';
import ytdl from 'ytdl-core';

const app = express();
const __dirname = path.resolve();
let starttime;
let videoName = 'default';

// bodyParser middleware
app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());

app.get('/', (req, res) => {
  res.sendFile(__dirname + '/index.html');
});

app.post('/', (req, res) => {
  const videoLink = req.body.link;
  download(videoLink, res);
});

const port = process.env.PORT || 5000;
app.listen(port, () => console.log('Server Listen to 127.0.0.1:', port));

async function download(videoLink, res) {
  let url = videoLink;
  let videID = ytdl.getURLVideoID(url);

  const video = ytdl(url, {
    filter: 'audioandvideo',
  });

  // Get Info
  const getVideoInfo = await ytdl.getInfo(videID).then((info) => {
    videoName = info.videoDetails.title;
    console.log('title:', info.videoDetails.title);
  });
  const output = path.resolve(__dirname, 'video-' + Buffer.from(videoName).toString('base64') + '.mp4');
  video.pipe(fs.createWriteStream(output));
  video.once('response', () => {
    starttime = Date.now();
  });

  video.on('progress', (chunkLength, downloaded, total) => {
    console.log('here');
    const percent = downloaded / total;
    const downloadedMinutes = (Date.now() - starttime) / 1000 / 60;
    const estimatedDownloadTime = downloadedMinutes / percent - downloadedMinutes;
    readline.cursorTo(process.stdout, 0);
    process.stdout.write(`${(percent * 100).toFixed(2)}% downloaded `);
    process.stdout.write(
      `(${(downloaded / 1024 / 1024).toFixed(2)}MB of ${(total / 1024 / 1024).toFixed(2)}MB)\n`
    );
    process.stdout.write(`running for: ${downloadedMinutes.toFixed(2)}minutes`);
    process.stdout.write(`, estimated time left: ${estimatedDownloadTime.toFixed(2)}minutes `);
    readline.moveCursor(process.stdout, 0, -1);
  });

  video.on('end', () => {
    process.stdout.write('\n\n');
    console.log('Download Completed!');
    res.sendFile(__dirname + '/index.html');
    res.status(200).json({ status: 'Download concluído com sucesso' });
  });
}
