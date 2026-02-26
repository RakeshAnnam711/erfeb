# SiteGenesis Tests



# Setup

1. Install necessary dependencies

		:; npm install

2. Install standalone selenium driver

	    :; npm install --production -g selenium-standalone@latest
	    :; selenium-standalone install

3. Add dw.json file if it doesn't already exist



# Running the Tests

1. Start selenium standalone service

		:; selenium-standalone start

2. Run tests (in separate terminal)

		:; npm run test:sgjc


