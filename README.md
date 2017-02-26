# cloud-flare-ip
A simple node app that updates a cloudflare DNS record using the machines current IP address.
In use on dlindley.co.uk.

# Usage
Run npm install
Modify config.js for your site. Then run node app.js to run the app

# How it works
It makes use of cloudflare and ipify node modules.
Ipify allows us to get the latest IP for your system, cloudflare module allows easy updates of your DNS records.
