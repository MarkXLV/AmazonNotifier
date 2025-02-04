import json
import mysql.connector

def get_norm_rating(price, rating, review, max_price, max_review):
    return rating * (max_price / price) * (review / max_review) 

max_price = 0
max_review = 0

with open('Amazon_Scrapper/output.json', 'r', encoding='utf-8') as json_file:  
    data = json.load(json_file) 

    for product in data:
        p_prices = [int(price.replace(',', '')) for price in product['p_price']]
        p_reviews = [int(review.replace(',', '')) for review in product['p_reviews']]  

        for p_price in p_prices:
            max_price = max(max_price, p_price)

        for p_review in p_reviews:
            max_review = max(max_review, p_review)

with open('Amazon_Scrapper/output.json', 'r', encoding='utf-8') as json_file: 
    data = json.load(json_file)

    norm_ratings = []

    for product in data:
        name = product['p_name']
        prices = [int(price.replace(',', '')) for price in product['p_price']]
        ratings = [float(rating.split(' ')[0]) for rating in product['p_rating'][2:-4]]
        reviews = [int(review.replace(',', '')) for review in product['p_reviews']]
        prefix = "https://www.amazon.in"
        urls = [prefix + url[:url.find("keywords")] if "keywords" in url else prefix + url for url in product['p_url'][::2]]

        # 22, 22, 26, 22, 44

        norm_rating = []

        for price, rating, review in zip(prices, ratings, reviews):
            
            # Rounded to 2 decimal places
            nr = round(get_norm_rating(price, rating, review, max_price, max_review), 2) 
            norm_rating.append(nr)


        products = list(zip(name, norm_rating, prices, urls))
        sorted_products = sorted(products, key=lambda x: x[1], reverse=True)

        # Max len among urls - 217
        # Max len among name - 194

# Establish a MySQL database connection
db = mysql.connector.connect(
    host="localhost",
    user="root",
    password="root",
    database="amazon_scraper"
)

# Create a cursor object to interact with the database
cursor = db.cursor()

# # Your 2D list containing name, norm_rating, price and url
# data = [
#     ["Product1", 4.3, 11999, "https://example.com/product1"],
#     ["Product2", 4.8, 2999, "https://example.com/product2"],
#     # Add more data as needed
# ]

# SQL query to insert data into a table
table = input("Enter product: ")
insert_query = "INSERT INTO " + table + " (name, norm_rating, price, url) VALUES (%s, %s, %s, %s)"

# Loop through the data and execute the insert query
for row in sorted_products:
    cursor.execute(insert_query, row)

# Commit the changes to the database
db.commit()

# Close the cursor and database connection
cursor.close()
db.close()


        

