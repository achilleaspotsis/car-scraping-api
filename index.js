const puppeteer = require('puppeteer');

const scrapeCar = async (url) => {
    const browser = await puppeteer.launch({headless: false});
    const page = await browser.newPage();
    await page.setViewport({
        width: 1200,
        height: 3000
    });
    await page.goto(url, {waitUntil: 'networkidle2'});

    const data = await page.evaluate(() => {
        const car = {};

        car.title = document.querySelector(`h1[itemprop="title"]`).innerText || "";
        car.description = document.querySelector(`[itemprop="description"]`).innerText || "";
        car.specs = {};
        car.extras = [];
        car.photos = [];

        const thumbs = document.querySelectorAll("div.thumbs-container img.thumb-img");
        thumbs.forEach(thumb => {
            if (thumb.src) {
                car.photos.push({url: thumb.src.replace("_v.jpg", "_b.jpg")});
            }
        });

        const specTable = document.getElementById("specification-table");
        if (specTable) {
            const trs = specTable.querySelectorAll("tr");
            trs.forEach(tr => {
                const cols = tr.querySelectorAll('td');
                const left = cols[0].innerText;
                car.specs[left] = cols[1].innerText;
            })
        }

        const extraLis = document.querySelectorAll("ul li.extra[title]");
        extraLis.forEach(li => {
            car.extras.push(li.title);
        });

        const breadcrumbLis = document.querySelectorAll("ul.c-breadcrumbs li.c-breadcrumb a");
        breadcrumbLis.forEach((a, i) => {
            const label = a.getAttribute("aria-label");
            switch (i) {
                case 3:
                    car.make = label;
                    break;
                case 4:
                    car.model = label;
                    break;
                case 5:
                    car.year = label;
                    break;
            }
        });

        const iframe = document.querySelector("iframe[src*='google.com/maps']");
        car.maps = iframe.src;

        let params = (new URL(car.maps)).searchParams;
        let location = params.get('q').split(",");
        car.location = {
            latitude: parseFloat(location[0]),
            longitude: parseFloat(location[1])
        };

        return car;
    });

    console.log(data);

    // await new Promise(resolve => setTimeout(resolve, 2000 * 1000));

    await page.close();
    await browser.close();
};

scrapeCar("https://www.car.gr/classifieds/cars/view/321693665-audi-a3");