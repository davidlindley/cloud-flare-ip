let CONFIG = require("./config"),
  ipify = require('ipify'),
  cf = require('cloudflare'),
  fs = require('fs'),
  cloudFlare = new cf({
    email: CONFIG.CLOUDFLARE.EMAIL,
    key: CONFIG.CLOUDFLARE.KEY
  });

/**
 * @name getCurrentIp
 * @desc Calls ipify to get the current IP of machine
 * @returns {Promise} resolves with current IP
 */
function getCurrentIP() {
  return new Promise((resolve, reject) => {
    ipify((err, ip) => {
      if (err) {
        reject(err);
      } else if (ip) {
        resolve(ip);
      }
    });
  });
}

/**
 * @name getDNSRecord
 * @desc Gets the DNS record from options passed in CONFIG
 * @returns {Promise} When resolves contains the DNS record required
 */
function getDNSRecord() {
  return new Promise((resolve, reject) => {
    cloudFlare.browseDNS(CONFIG.CLOUDFLARE.ZONE,
      [{type: CONFIG.CLOUDFLARE.RECORD.TYPE, name: CONFIG.CLOUDFLARE.RECORD.NAME}])
      .then((dnsRecords) => {
        dnsRecords.result.forEach((record) => {
          if (record.name === CONFIG.CLOUDFLARE.RECORD.NAME) {
            resolve(record);
          }
        });
      })
      .catch((error) => {
      reject(error);
    });
  });
}

/**
 * @name readOldIPFromFile
 * @desc Reads the old IP from the stored file
 * @returns {Promise} resolves to the old stored IP
 */
function readOldIPFromFile() {
  return new Promise((resolve, reject) => {
    fs.readFile('./ipaddress', {encoding: 'utf-8'}, (err, data) => {
      if (!err){
        resolve(data);
      } else {
        reject(err);
      }
    });
  });
}

/**
 * @name writeIPToFile
 * @desc Writes IP address to file
 * @param {string} - ip adress to write
 * @returns {Promise} resolves when files is written
 */
function writeIPToFile(ip) {
  return new Promise((resolve, reject) => {
    fs.writeFile("./ipaddress", ip, (err) => {
      if(err) {
        reject(err);
      }
      resolve();
    });
  });
}

/* Runs the App */
readOldIPFromFile().then((oldIP) => {
  getCurrentIP().then((newIP) => {
    if (newIP === oldIP) {
      console.log('new IP and current IP match. Exit');
      return;
    }
    getDNSRecord().then((dnsRecord) => {
      if (dnsRecord.content === oldIP) {
        console.log('new IP and current IP match. Exit');
        return;
      }
      dnsRecord.content = newIP;
      cloudFlare.editDNS(dnsRecord).then((success) => {
        console.log('DNS Updated correctly');
        writeIPToFile(newIP).then((result) => {
          console.log('New IP ' + newIP + ' written to file');
        });
      });
    })
  })
}).catch((error) => {
  console.log(error);
  // Write blank IP to file as error occured
  writeIPToFile('');
});
