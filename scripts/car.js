/**
 * Loaded on:
 * car.html
 */

// Determine if the page is for an active request or unrequested car. Then, format accordingly.
authenticateUser(() => {
    displayVehicleInfo();
    let params = new URL(window.location.href);
    let vehicleID = params.searchParams.get("vehicleID");
    requestsCollectionRef = db.collection("requests").where("requesterID", "==", userID).where("vehicleID", "==", vehicleID);
    requestsCollectionRef.get().then((requestRef) => {
        requestRef.forEach(doc => {
            console.log(doc.id)
            if (doc) {
                document.querySelector("#request-button").setAttribute("onclick", "deleteRequest()");
                document.querySelector("#request-money").style.display = "none";
                if (doc.data().requesterPrice) {
                    document.querySelector("#request-button").textContent = "Delete Request for $" + doc.data().requesterPrice;
                } else {
                    document.querySelector("#request-button").textContent = "Delete Request";
                }

                document.querySelector("#vehicle-image-container").innerHTML += "<div id='request-status'  class='color-text'>Requested</div>";
            }
        })

        if (requestRef.docs.length <= 0) {
            document.querySelector(".card-section-heading").remove();
        } else {
            displayCardsDynamically();
        }

    })

})

/**
 * Grabs the vehicleID from the url and searches db for the id. Then, it populates the image container and vehicle info fields.
 */
function displayVehicleInfo() {
    let params = new URL(window.location.href); //get URL of search bar
    let vehicleID = params.searchParams.get("vehicleID"); //get value for key "vehicleID"
    console.log(vehicleID);

    // doublecheck: is your collection called "Reviews" or "reviews"?
    db.collection("vehicles")
        .doc(vehicleID)
        .get()
        .then(doc => {
            thisVehicle = doc.data();
            vehicleYear = thisVehicle.year;
            vehicleMake = thisVehicle.make;
            vehicleModel = thisVehicle.model;
            vehicleType = thisVehicle.type;
            vehicleFuel = thisVehicle.fuel;
            vehicleImage2 = thisVehicle.img[1];

            // Insert image
            document.getElementById("vehicle-image-preview").setAttribute("src", vehicleImage2);

            // populate name
            document.getElementById("vehicle-name-display").textContent = `${vehicleYear} ${vehicleMake} ${vehicleModel}`;

            // populate fuel & type
            document.getElementById("vehicle-type-display").innerHTML = "Type: " + vehicleType;
            document.getElementById("vehicle-fuel-display").innerHTML = "Engine: " + vehicleFuel;

            // uncomment when image stuff is sorted
            // let imgEvent = document.querySelector( ".hike-img" );
            // imgEvent.src = "../images/" + hikeCode + ".jpg";
        });
}

/**
 * Sets visibility of warning page when the request button is clicked.
 *
 * @event click #request-button
 */
function createRequest() {
    if (localStorage.getItem("hideRequestWarning") != "true") {
        document.querySelector("#popup-container").style.visibility = "visible";

        document.querySelector("#cancel-request").addEventListener("click", () => {
            localStorage.setItem("hideRequestWarning", document.querySelector("#request-info-hide").checked);
            document.querySelector("#popup-container").style.visibility = "hidden";
        })
    } else {
        addRequestToFirestore();
    }
}

/**
 * Adds a request to the db under requests collection and user request array.
 * Sets visibility for warning menu and success menu.
 * Switches the onclick attribute from createRequest to deleteRequest.
 */
function addRequestToFirestore()  {
    vehicleID = window.location.href.substring(window.location.href.indexOf("=") + 1);
    let requesterPrice = document.getElementById("request-money").value;
    db.collection("requests").add({
        requestDate: firebase.firestore.FieldValue.serverTimestamp(),
        requesterID: userID,
        vehicleID: vehicleID,
        requesterPrice: requesterPrice
    })
        .then(async (requestRef) => {
            console.log("Document successfully written!");
            db.collection("users").doc(userID).update({
                requests: firebase.firestore.FieldValue.arrayUnion(requestRef.id),
                vehicles: firebase.firestore.FieldValue.arrayUnion(vehicleID)
            })
            document.querySelector("#request-button").setAttribute("onclick", "deleteRequest()");
            document.querySelector("#request-money").style.display = "none";
            if (requesterPrice) {
                document.querySelector("#request-button").textContent = "Delete Request for $" + requesterPrice;
            } else {
                document.querySelector("#request-button").textContent = "Delete Request";
            }

            document.querySelector("#vehicle-image-container").innerHTML += "<div id='request-status' class='color-text'>Requested</div>";

            document.getElementById("successRequestPlaceholder").innerHTML = await fetchHtmlAsText("./text/request_success.html");
        })
        .catch((error) => {
            console.error("Error writing document: ", error);
        });
}

/**
 * Deletes the request of the current vehicle page from the requests collection and user request array.
 */
function deleteRequest() {
    vehicleID = window.location.href.substring(window.location.href.indexOf("=") + 1);
    requestsCollectionRef = db.collection("requests").where("requesterID", "==", userID).where("vehicleID", "==", vehicleID);

    requestsCollectionRef.get()
        .then(requestRef => {
            requestRef.forEach(doc => {
                if (doc.id != "") {
                    db.collection("users").doc(userID).update({
                        requests: firebase.firestore.FieldValue.arrayRemove(doc.id),
                        vehicles: firebase.firestore.FieldValue.arrayRemove(vehicleID)
                    });
                    db.collection("requests").doc(doc.id).delete().then(() => {
                        console.log("request successfully deleted")
                        document.querySelector("#request-button").textContent = "Request this car for:";
                        document.querySelector("#request-money").style.display = "inherit";
                        document.querySelector("#request-button").setAttribute("onclick", "createRequest()");

                        document.querySelector("#request-status").remove();
                    })

                    db.collection("offers").where("requestID", "==", doc.id).get().then((offerDocs) => {
                        offerDocs.forEach((offerDoc) => {
                            deleteOffer(offerDoc.id);
                        })
                    })
                }
            })
        })
}

/**
 * deletes a request and removes the popup.
 */
function undoRequest() {
    deleteRequest();
    document.querySelector("#success-popup").remove();
    // history.back();
}

/**
 * Creates a request and removes the confirmation popup.
 * Also sets local storage to remember whether the user wants to keep seeing the popup.
 */
function confirmRequest() {
    localStorage.setItem("hideRequestWarning", document.querySelector("#request-info-hide").checked);
    document.querySelector("#popup-container").style.visibility = "hidden";
    addRequestToFirestore();
}

/**
 * Displays a car's trims that are grabbed from Firestore.
 */
function displayTrims() {
    let target = document.getElementById("trim-entries");
    let template = document.getElementById("vehicle-trim");
    let vehicleID = window.location.href.substring(window.location.href.indexOf("=") + 1);

    db.collection("vehicles").doc(vehicleID).get().then((vehicleDoc) => {
        vehicleDoc.data().trim.forEach((trim) => {
            let newTrim = template.content.cloneNode(true);
            newTrim.querySelector(".vehicle-trim-name-display").textContent = trim.name;
            newTrim.querySelector(".vehicle-trim-price-display").textContent = "$" + trim.msrp;
            target.appendChild(newTrim);
        })
    });
}
displayTrims();

// Sets the visibility of the trims and adds functionality to the collapse button.
let trimsHidden = "true";
document.querySelector("#expand-button").addEventListener("click", () => {
    if (trimsHidden == "true") {
        document.querySelector("#trim-entries").style.display = "inherit";
        document.querySelector("#expand-button").setAttribute("src", "./images/expandLess.svg");
        trimsHidden = "false";
    } else {
        document.querySelector("#trim-entries").style.display = "none";
        document.querySelector("#expand-button").setAttribute("src", "./images/expandMore.svg");
        trimsHidden = "true";
    }
})

// Sets the visibility of the details and adds functionality to the details' collapse button
let detailsHidden = "false";
document.querySelector("#expand-details-button").addEventListener("click", () => {
    if (detailsHidden == "true") {
        document.querySelector("#details-content").style.display = "block";
        document.querySelector("#expand-details-button").setAttribute("src", "./images/expandLess.svg");
        // document.querySelector("#details-header").style.fontSize = "calc(1.325rem + .9vw)";
        detailsHidden = "false";
    } else {
        document.querySelector("#details-content").style.display = "none";
        document.querySelector("#expand-details-button").setAttribute("src", "./images/expandMore.svg");
        // document.querySelector("#details-header").style.fontSize = "20px";
        detailsHidden = "true";
    }
})

/**
 * Displays the offers under a car on car.html.
 */
function displayCardsDynamically() {

    let params = new URL(window.location.href); //get URL of search bar
    let vehicleID = params.searchParams.get("vehicleID"); //get value for key "vehicleID"

    let cardTemplate = document.getElementById("vehicle-offers");
    let vehicleOffers = db.collection("offers").where("vehicleID", "==", vehicleID).where("buyerID", "==", userID);

    vehicleOffers.get()
        .then(querySnapshot => {
            console.log("query finished", querySnapshot.size);
            if (querySnapshot.size <= 0) {
                document.getElementById("offers-container").innerHTML =
                `<p class="glass-container">
        Your request has not recieved any offers yet. When it does, they will show up here.
        </p>`;
            }
            querySnapshot.forEach(vehicleOffersDoc => {
                let sellerID = vehicleOffersDoc.data().sellerID;
                let userDocRef = db.collection("users").doc(sellerID);
                var requestDate = vehicleOffersDoc.data().offerDate;

                // Get the document
                userDocRef.get()
                    .then(userDoc => {
                        if (userDoc.exists) {
                            // Document found, you can access the data using userDoc.data()
                            // console.log("User document data:", userDoc.data());

                            var name = userDoc.data().name;
                            var location = userDoc.data().city;
                            var picture = userDoc.data().profile;
                            var price = vehicleOffersDoc.data().price;

                            let newcard = cardTemplate.content.cloneNode(true);

                            //set custom html attribut of requestID to relevant request for reference by toggle selection
                            let newcardElement = newcard.querySelector('.pill-item');
                            // newcardElement.setAttribute('data-request-id', vehicleRequestsDoc.id);
                            newcardElement.addEventListener('click', function () {
                                        // toggleSelection(this);
                                    });

                            newcard.querySelector('#pill-name').innerHTML = name;
                            newcard.querySelector('#pill-location').innerHTML = location;
                            newcard.querySelector('#pill-price').innerHTML = price;
                            if (price.substring(0, 1) != "$") {
                                newcard.querySelector('#pill-price').innerHTML = "$" + newcard.querySelector('#pill-price').innerHTML;
                            }

                            // gets the time information of when the offer was made
                            const date = new Date(requestDate.seconds * 1000);
                            const year = date.getFullYear();
                            const month = date.toLocaleString('en-US', { month: 'short' });
                            const day = date.getDate();

                            newcard.querySelector('#pill-date').innerHTML = month + " " + day + ", " + year;
                            newcard.querySelector('#pill-pic').setAttribute("src", picture);
                            newcardElement.setAttribute('onclick', `goToOffer("${vehicleOffersDoc.id}")`);

                            document.getElementById("offers-container").appendChild(newcard);

                        } else {
                            console.log("User not found");
                        }
                    })
            });
        })
        .catch(error => {
            console.error("Error getting documents: ", error);
        });
}

/**
 * Directs the user to an offer details page.
 * 
 * @param {string} offerID the Firestore ID of the offer.
 */
function goToOffer(offerID) {
    window.location.assign("offerDetails.html?offerID=" + offerID);
}