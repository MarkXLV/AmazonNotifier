import mysql.connector
import requests
from bs4 import BeautifulSoup

def check_price(name, url, prev_price):
    response = requests.get(url)

    if response.status_code == 200:
        soup = BeautifulSoup(response.text, 'html.parser')

        curr_price = soup.find('span', {'class': 'a-price-whole'})
        if(curr_price < prev_price): 
            print("Go buy" + name + "its cheaper now!!!")

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
table = input("Enter product: ")
query = "SELECT name, price, url FROM " + table + " LIMIT 3";
cursor.execute(query)

# Fetch the results
results = cursor.fetchall()

# Iterate through the results and check prices
for result in results:
    name = result[0]
    url = result[1]
    prev_price = result[2]
    check_price(name, url, prev_price)

# Close the database connection
db.close()

