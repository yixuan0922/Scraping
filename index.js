const puppeteer = require('puppeteer');
const fs = require('fs');
const path = require('path');

async function fetchTimeOutHotList() {

    // const hotListJson = fs.readFileSync('data/timeoutHotList.txt', 'utf8');
    // const fetchedHotList = JSON.parse(hotListJson);
    // console.log(fetchedHotList[0].title);


    const browser = await puppeteer.launch({
        // headless: false
    });
    const page = await browser.newPage();
    await page.goto('https://www.timeout.com/singapore/things-to-do/the-time-out-singapore-hotlist');

    const events = await page.evaluate(() => 
        Array.from(document.querySelectorAll('div._zoneItems_882m9_1.zoneItems article'), (e) => {
            const titleElement = e.querySelector('._h3_cuogz_1');
            const imagesElements = e.querySelector('div._imageContainer_kc5qn_33 div._imageWrap_kc5qn_229 img');
            const imgSrc = imagesElements ? imagesElements.getAttribute('src') : null;
            const url = e.querySelector('div._title_kc5qn_9 a').getAttribute('href');
            
            return {
                title: titleElement ? titleElement.innerText: null,
                imgSrc: imgSrc, 
                url: url? "https://www.timeout.com" + url : null,
            }
        }) 
    );

    for (let event of events) {
        const page = await browser.newPage();
        // console.log('Fetching additional information for ' + event.title);
        await page.goto(event.url);

        // Click the "Show more" button until it no longer exists
        let loadMoreButtonExists = true;
        let buttonPressed = 0;
        while (loadMoreButtonExists) {
            // console.log('Clicking "Show more" button', ++buttonPressed);
            try {
                try {
                    const adCloseButton = await page.waitForSelector('div._overlay_kzzn5_1 div._popupNewsletterContainer_kzzn5_36 button._closeButton_kzzn5_73',{timeout: 2000});
                    if (adCloseButton) {
                        await adCloseButton.click();  // Wait for the ad to close
                    }
                } catch (error) {
                    // console.log('No advertisement found:', error.message);
                }
                await page.waitForSelector('div._ctaContainer_1wb4w_15 div._viewMoreCta_1wb4w_20 a', { timeout: 5000 });
                await page.click('div._ctaContainer_1wb4w_15 div._viewMoreCta_1wb4w_20 a');
                // Add a delay here
                await page.waitForTimeout(2000);
            } catch (error) {
                // console.log(error.message);
                loadMoreButtonExists = false;
            }
        }

        const eventDetails = await page.evaluate(() => {
            const detailsElement = document.querySelector('div[data-section="details"]');
            const priceElement = document.querySelector('div[data-section="price"]');
            
            const address = detailsElement ? Array.from(detailsElement.querySelectorAll('dd._description_k1wdy_9')).map(el => el.textContent).join(', ') : null;
            const price = priceElement ? priceElement.querySelector('dd._description_k1wdy_9').textContent : null;

            const dateTimesElements = document.querySelectorAll('div.zoneItems div._articleRow_14oc2_1 time');
            const dateTimes = Array.from(dateTimesElements).map(el => el.getAttribute('datetime'));

            return {
                address: address,
                price: price,
                startDate: dateTimes[0],  // First element of dateTimes
                endDate: dateTimes[dateTimes.length - 1]
            };
        });

        // console.log(eventDetails);

        event.address = eventDetails.address;
        event.price = eventDetails.price;
        event.startEndDate = [eventDetails.startDate, eventDetails.endDate];
        await page.close();
    }

    await browser.close();

    return events;
}

fetchTimeOutHotList().then((events) => {
    const eventsJson = JSON.stringify(events, null, 2);
    scrapePath = path.join(__dirname, 'data', 'timeoutHotList.txt');
    fs.writeFileSync(scrapePath, eventsJson);
}).catch((error) => console.error(error));
