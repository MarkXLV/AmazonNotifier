import mysql.connector
import requests
from bs4 import BeautifulSoup

my_headers = {
    'user-agent': 'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/117.0.0.0 Safari/537.36',
}

def check_price(name, prev_price, url):
    response = requests.get(url, headers = my_headers)

    if response.status_code == 200:
        soup = BeautifulSoup(response.text, 'html.parser')

        curr_price = int(soup.find('span', {'class': 'a-price-whole'}).text.replace(',','').replace('.',''))

        if(curr_price < prev_price): 
            print("Go buy" + name + "its cheaper now!!!")
        else: 
            print("Oops! the price of " + name + " hasn't dropped")

# Connect to the MySQL database
db = mysql.connector.connect(
    host="localhost",
    user="root",
    password="root",
    database="amazon_scraper"
)

# Create a cursor to execute SQL queries
cursor = db.cursor()

# Retrieve the first 3 entries from the table
# table = input("Enter product: ")
# query = "SELECT name, price, url FROM " + table + " LIMIT 3";
query = "SELECT name, price, url FROM smartphones LIMIT 3";
cursor.execute(query)

# Fetch the results
results = cursor.fetchall()

# Iterate through the results and check prices
for result in results:
    name = result[0]
    prev_price = result[1]
    url = result[2]
    check_price(name, prev_price, url)

# Close the database connection
db.close()

