/* Loaded on:
 * offerForm.html
 */

authenticateUser(() => {
    displayVehicleInfo()
})

/** Displays a vehicle's make, model, year, and image as the user inputs offer information on the form page. */
function displayVehicleInfo() {
    let params = new URL(window.location.href); //get URL of search bar
    var vehicleID = params.searchParams.get("vehicleID"); //get value for key "vehicleID"

    if (!vehicleID) {
        console.error("Error: Vehicle ID is null or undefined.");
        return;
    }

    db.collection("vehicles")
        .doc(vehicleID)
        .get()
        .then(doc => {
            thisVehicle = doc.data();
            vehicleYear = thisVehicle.year;
            vehicleMake = thisVehicle.make;
            vehicleModel = thisVehicle.model;
            vehicleImage2 = thisVehicle.img[1];

            // Insert image
            document.getElementById("vehicle-image-preview").setAttribute("src", vehicleImage2);

            // populate name
            document.getElementById("vehicle-name-display").textContent = `${vehicleYear} ${vehicleMake} ${vehicleModel}`;
        });
}

// Retrieving data from local storage on the second page
const selectedRequests = JSON.parse(localStorage.getItem("selectedRequests"));

// Check if the data exists before using it
if (selectedRequests) {
    console.log("Selected Requests:", selectedRequests);
} else {
    console.log("No data found in local storage.");
}

/**
 * Creates new offers with the information a user had input into the form. A new offer
 * is created for every request selected on the previous page.
 * 
 * @returns null
 */
async function submitForm() {
    let params = new URL(window.location.href);
    var vehicleID = params.searchParams.get("vehicleID");

    if (!vehicleID) {
        console.error("Error: Vehicle ID is null or undefined.");
        return;
    }

    var price = document.getElementById("price-input").value;
    // var year = document.getElementById("year-input").value;
    var color = document.getElementById("color-input").value;
    var odometer = document.getElementById("odometer-input").value;
    var vin = document.getElementById("vin-input").value;

    for (var i = 0; i < selectedRequests.length; i++) {
        var requestDoc = db.collection("requests").doc(selectedRequests[i]);

        try {
            const doc = await requestDoc.get();

            console.log("does doc exis", doc.exists);

            if (doc.exists) {
                var buyerID = doc.data().requesterID;
                console.log("Buyer ID:", buyerID);

                console.log(doc.data().price);
                let requesterPrice = doc.data().requesterPrice;

                const offerRef = await db.collection("offers").add({
                    requestID: selectedRequests[i],
                    buyerID: buyerID,
                    sellerID: userID,
                    vehicleID: vehicleID,
                    offerDate: firebase.firestore.FieldValue.serverTimestamp(),
                    requesterPrice: requesterPrice,
                    price: price,
                    // year: year,
                    color: color,
                    odometer: odometer,
                    vin: vin
                });

                const offerID = offerRef.id;

                // Update user info with the offerID
                await db.collection("users").doc(userID).update({
                    offers: firebase.firestore.FieldValue.arrayUnion(offerID),
                    offerVehicleIDs: firebase.firestore.FieldValue.arrayUnion(vehicleID)
                });

            } else {
                console.log("No such document!");
            }
        } catch (error) {
            console.error("Error getting document:", error);
        }
    }
}

document.getElementById("offer-form-submit").addEventListener("click", handleOfferFormSubmit);

/**
 * Disables the submit button as the offers are being created and redirects the user to the main page after 2 seconds.
 * 
 * @param {Event} event 
 */
function handleOfferFormSubmit(event) {
    document.getElementById("offer-form-submit").removeEventListener("click", handleOfferFormSubmit);
    document.getElementById("offer-form-submit").style.backgroundColor = "var(--faded-button-color)";
    submitForm().then(async function() {
        document.getElementById("successOfferPlaceholder").innerHTML = await fetchHtmlAsText("./text/offer_success.html");
        setTimeout(function() {
            window.location.href = "sell.html";
        }, 2000); // 2000 milliseconds = 2 seconds
    });
}


