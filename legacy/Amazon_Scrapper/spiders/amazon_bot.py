import scrapy
from ..items import AmazonScrapperItem

class AmazonBotSpider(scrapy.Spider):
    name = 'amazon-bot'
    count = 1
    start_urls = [
        "https://www.amazon.in/s?k=noise+cancellation+headphones"             
        ]
    
    # name, price, rating, reviews, url

    def parse(self, response):
        product = AmazonScrapperItem()
        name = response.css(".a-color-base.a-text-normal span::text").extract()
        price = response.css(".a-price-whole::text").extract()
        rating = response.css('.a-icon-alt::text').extract()
        reviews = response.css(".s-link-style .s-underline-text::text").extract()
        url = response.css('a.a-link-normal.s-underline-text.s-underline-link-text.s-link-style.a-text-normal').css("::attr(href)").extract()

        print(name)
        product["p_name"] = name
        product["p_price"] = price
        product["p_rating"] = rating
        product["p_reviews"] = reviews
        product["p_url"] = url
        yield product
    
        # AmazonBotSpider.count += 1
        # nxt_page="https://www.amazon.in/s?k=smartphones&page="+str(AmazonBotSpider.count)+"ref=sr_pg_2"
        # if AmazonBotSpider.count < 2:
        #     yield response.follow(nxt_page,callback=self.parse)


 
