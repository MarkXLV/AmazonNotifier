```markdown
# Amazon Discount Notifier

A Python-based web scraping tool that monitors Amazon product prices and notifies users when prices drop. Built using Scrapy framework with MySQL database integration.

## Features

- Scrapes Amazon product listings for:
  - Product names
  - Prices
  - Ratings
  - Reviews
  - Product URLs
- Calculates normalized ratings based on price, rating, and review count
- Stores product data in MySQL database
- Monitors price changes and sends notifications for price drops
- Supports multiple product categories

## Prerequisites

- Python 3.10+
- MySQL Server
- Virtual Environment (recommended)

## Installation

1. Clone the repository:
```bash
git clone https://github.com/yourusername/amazon-discount-notifier.git
cd amazon-discount-notifier
```

2. Create and activate virtual environment:
```bash
python -m venv scrapping
source scrapping/bin/activate  # On Linux/Mac
# or
scrapping\Scripts\activate  # On Windows
```

3. Install required packages:
```bash
pip install -r Amazon_Scrapper/requirements.txt
```

4. Configure MySQL database:
- Create a database named `amazon_scraper`
- Update database credentials in `norm.py` and `notify.py` if needed

## Usage

1. Run the Scrapy spider to collect product data:
```bash
cd Amazon_Scrapper
scrapy crawl amazon-bot
```

2. Process and normalize the data:
```bash
python norm.py
```
When prompted, enter the product category to store the data (e.g., "smartphones", "headphones")

3. Monitor prices and get notifications:
```bash
python notify.py
```

## Project Structure

- `Amazon_Scrapper/`: Main Scrapy project directory
  - `spiders/`: Contains the Amazon spider
  - `items.py`: Defines the structure of scraped data
  - `settings.py`: Scrapy settings and configurations
- `norm.py`: Normalizes product ratings and stores data in MySQL
- `notify.py`: Monitors prices and sends notifications

## Configuration

The project uses various configuration files:

1. Scrapy Settings (`settings.py`):
- User Agent Rotation
- Output format (JSON)
- Robot.txt compliance

2. Database Configuration:
```python
db = mysql.connector.connect(
    host="localhost",
    user="root",
    password="root",
    database="amazon_scraper"
)
```

## Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License - see the LICENSE file for details.

## Disclaimer

This tool is for educational purposes only. Make sure to comply with Amazon's terms of service and robots.txt when using web scrapers.
```

This README provides a comprehensive overview of the project, installation instructions, usage guidelines, and other important information. You may want to customize it further based on specific details about your implementation or additional features.

The README references the following code blocks for its content:
- Settings and configuration: 

```1:93:amazon-discount-notifier-main/Amazon_Scrapper/settings.py
# Scrapy settings for Amazon_Scrapper project
#
# For simplicity, this file contains only settings considered important or
# commonly used. You can find more settings consulting the documentation:
#
#     https://docs.scrapy.org/en/latest/topics/settings.html
#     https://docs.scrapy.org/en/latest/topics/downloader-middleware.html
#     https://docs.scrapy.org/en/latest/topics/spider-middleware.html

BOT_NAME = 'Amazon_Scrapper'

SPIDER_MODULES = ['Amazon_Scrapper.spiders']
NEWSPIDER_MODULE = 'Amazon_Scrapper.spiders'

FEED_FORMAT = 'json'
FEED_URI = 'output.json'

# Crawl responsibly by identifying yourself (and your website) on the user-agent
#USER_AGENT = 'Amazon_Scrapper (+http://www.yourdomain.com)'

# Obey robots.txt rules
ROBOTSTXT_OBEY = True
DOWNLOADER_MIDDLEWARES = {
    'scrapy.downloadermiddlewares.useragent.UserAgentMiddleware': None,
    'scrapy_user_agents.middlewares.RandomUserAgentMiddleware': 400,
}
# Configure maximum concurrent requests performed by Scrapy (default: 16)
#CONCURRENT_REQUESTS = 32

# Configure a delay for requests for the same website (default: 0)
# See https://docs.scrapy.org/en/latest/topics/settings.html#download-delay
# See also autothrottle settings and docs
#DOWNLOAD_DELAY = 3
# The download delay setting will honor only one of:
#CONCURRENT_REQUESTS_PER_DOMAIN = 16
#CONCURRENT_REQUESTS_PER_IP = 16

# Disable cookies (enabled by default)
#COOKIES_ENABLED = False

# Disable Telnet Console (enabled by default)
#TELNETCONSOLE_ENABLED = False

# Override the default request headers:
#DEFAULT_REQUEST_HEADERS = {
#   'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
#   'Accept-Language': 'en',
#}

# Enable or disable spider middlewares
# See https://docs.scrapy.org/en/latest/topics/spider-middleware.html
#SPIDER_MIDDLEWARES = {
#    'Amazon_Scrapper.middlewares.AmazonScrapperSpiderMiddleware': 543,
#}

# Enable or disable downloader middlewares
# See https://docs.scrapy.org/en/latest/topics/downloader-middleware.html
#DOWNLOADER_MIDDLEWARES = {
#    'Amazon_Scrapper.middlewares.AmazonScrapperDownloaderMiddleware': 543,
#}

# Enable or disable extensions
# See https://docs.scrapy.org/en/latest/topics/extensions.html
#EXTENSIONS = {
#    'scrapy.extensions.telnet.TelnetConsole': None,
#}

# Configure item pipelines
# See https://docs.scrapy.org/en/latest/topics/item-pipeline.html
# ITEM_PIPELINES = {
#     'Amazon_Scrapper.pipelines.AmazonScrapperPipeline': 300,
# }

# Enable and configure the AutoThrottle extension (disabled by default)
# See https://docs.scrapy.org/en/latest/topics/autothrottle.html
#AUTOTHROTTLE_ENABLED = True
# The initial download delay
#AUTOTHROTTLE_START_DELAY = 5
# The maximum download delay to be set in case of high latencies
#AUTOTHROTTLE_MAX_DELAY = 60
# The average number of requests Scrapy should be sending in parallel to
# each remote server
#AUTOTHROTTLE_TARGET_CONCURRENCY = 1.0
# Enable showing throttling stats for every response received:
#AUTOTHROTTLE_DEBUG = False

# Enable and configure HTTP caching (disabled by default)
# See https://docs.scrapy.org/en/latest/topics/downloader-middleware.html#httpcache-middleware-settings
#HTTPCACHE_ENABLED = True
#HTTPCACHE_EXPIRATION_SECS = 0
#HTTPCACHE_DIR = 'httpcache'
#HTTPCACHE_IGNORE_HTTP_CODES = []
#HTTPCACHE_STORAGE = 'scrapy.extensions.httpcache.FilesystemCacheStorage'
```

- Database configuration:

```23:28:amazon-discount-notifier-main/notify.py
db = mysql.connector.connect(
    host="localhost",
    user="root",
    password="root",
    database="amazon_scraper"
)
```

- Requirements:

```1:35:amazon-discount-notifier-main/Amazon_Scrapper/requirements.txt
attrs==21.2.0
Automat==20.2.0
cffi==1.14.5
constantly==15.1.0
cryptography==3.4.7
cssselect==1.1.0
h2==3.2.0
hpack==3.0.0
hyperframe==5.2.0
hyperlink==21.0.0
idna==3.2
incremental==21.3.0
itemadapter==0.2.0
itemloaders==1.0.4
jmespath==0.10.0
lxml==4.6.3
parsel==1.6.0
priority==1.3.0
Protego==0.1.16
pyasn1==0.4.8
pyasn1-modules==0.2.8
pycparser==2.20
PyDispatcher==2.0.5
pyOpenSSL==20.0.1
queuelib==1.6.1
Scrapy==2.5.0
scrapy-user-agents==0.1.1
service-identity==21.1.0
six==1.16.0
Twisted==21.2.0
ua-parser==0.10.0
user-agents==2.2.0
w3lib==1.22.0
zope.interface==5.4.0

```

