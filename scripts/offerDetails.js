/* Loaded on:
 * offerDetails.html
 */

/**
 * Loads the details of a single offer that a buyer clicks on.
 */
function displayOfferDetails() {
    let offerID = window.location.href.substring(window.location.href.indexOf('=') + 1);

    db.collection("offers").doc(offerID).get().then(async offerDoc => {
        // Grab data from the offer document
        let vehiclePrice = offerDoc.data().price;
        let vehiclePriceRequester = offerDoc.data().requesterPrice;
        let vehicleColor = offerDoc.data().color;
        let vehicleOdometer = offerDoc.data().odometer;
        let vehicleVin = offerDoc.data().vin;
        let sellerID = offerDoc.data().sellerID;
        let offerDate = offerDoc.data().offerDate.toDate().toDateString();

        let sellerDoc = await db.collection("users").doc(sellerID).get();
        let sellerName = sellerDoc.data().name;
        let sellerLocation = sellerDoc.data().city;
        let sellerImg = sellerDoc.data().profile;
        let sellerEmail = sellerDoc.data().email;
        let sellerPhone = sellerDoc.data().phone;

        document.querySelector('.seller-name').innerHTML = sellerName;
        document.querySelector('.seller-location').textContent += `${sellerEmail} --- ${sellerPhone}`;

        if (sellerLocation) {
            document.querySelector('.seller-location').textContent += " --- " + sellerLocation;
        }

        document.querySelector('#pill-pic').setAttribute('src', sellerImg);
        document.querySelector('.offer-date').innerHTML += offerDate;
        document.querySelector('.vehicle-price').innerHTML = `${sellerName}'s Price: `;
        document.querySelector('.vehicle-price-requester').innerHTML += "$" + vehiclePriceRequester;

        // If it is not null, load it
        if (vehiclePrice.substring(0, 1) == "$") {
            document.querySelector('.vehicle-price').innerHTML += vehiclePrice;
        } else {
            document.querySelector('.vehicle-price').innerHTML += "$" + vehiclePrice;
        }
        if (vehicleColor) {
            document.querySelector('.vehicle-color').innerHTML += vehicleColor;
        } else {
            document.querySelector('.vehicle-color').innerHTML = "";
        }
        if (vehicleOdometer) {
            document.querySelector('.vehicle-odometer').innerHTML += vehicleOdometer + " miles";
        } else {
            document.querySelector('.vehicle-odometer').innerHTML = "";
        }
        if (vehicleVin) {
            document.querySelector('.vehicle-vin').innerHTML += vehicleVin;
        } else {
            document.querySelector('.vehicle-vin').innerHTML += "None";
        }
    })
}

displayOfferDetails();