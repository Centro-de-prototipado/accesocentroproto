const fs = require('fs');
const readline = require('readline');

async function processLineByLine() {
  const fileStream = fs.createReadStream('C:/Users/Edwin_Garcia/.gemini/antigravity-ide/brain/86aef2f8-d139-46d9-97d9-4fc3dd50daf4/.system_generated/logs/transcript.jsonl');

  const rl = readline.createInterface({
    input: fileStream,
    crlfDelay: Infinity
  });

  for await (const line of rl) {
    if (line.includes('hivemq_ca_pem_start')) {
      const data = JSON.parse(line);
      // Let's write the content (which contains the ESP32 code) to a file.
      fs.writeFileSync('C:/Users/Edwin_Garcia/.gemini/antigravity-ide/brain/86aef2f8-d139-46d9-97d9-4fc3dd50daf4/esp32_original.txt', data.content || JSON.stringify(data));
      console.log('Successfully extracted!');
      break;
    }
  }
}

processLineByLine();
