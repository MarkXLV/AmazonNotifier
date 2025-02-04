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
git clone https://github.com/MarkXLV/AmazonNotifier.git
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
or
scrapy crawl amazon-bot -o output.json  // write output to file 
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


