const fs = require('fs');
const readline = require('readline');

async function processLineByLine() {
  const fileStream = fs.createReadStream('C:/Users/Edwin_Garcia/.gemini/antigravity-ide/brain/86aef2f8-d139-46d9-97d9-4fc3dd50daf4/.system_generated/logs/transcript.jsonl');

  const rl = readline.createInterface({
    input: fileStream,
    crlfDelay: Infinity
  });

  let index = 0;
  for await (const line of rl) {
    if (line.includes('#include <stdio.h>') || line.includes('hivemq_ca_pem_start')) {
      try {
        const data = JSON.parse(line);
        fs.writeFileSync(`C:/Users/Edwin_Garcia/.gemini/antigravity-ide/brain/86aef2f8-d139-46d9-97d9-4fc3dd50daf4/esp32_raw_${index}.txt`, JSON.stringify(data, null, 2));
        console.log(`Successfully extracted raw ${index}`);
        index++;
      } catch (e) {
        console.error(e);
      }
    }
  }
}

processLineByLine();
