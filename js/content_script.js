/* Declare variables */
var tabLocation; // Location of the tabs
var numTabs; // Number of tabs
var tabArray; // Array of tabs
var tabUrlArray; // Array of tab URLs
var gmailUrl; // URL of Gmail
var currentTab; // Current tab that the user is on
var closeURL; // URL of close.png image

/* Call init function */
init();

/* Initializes variables. */
function init() {
	/* Identifies place to add the new tab button */
	tabLocation = document.querySelectorAll('div[class]')[4];

	/* Creates the new tab button and adds an event listener */
	var tab = document.createElement('tab');
	tabLocation.parentElement.insertAdjacentElement('beforebegin', tab);
	//tab.innerHTML = '<button class="btn" type="tabButton" name=' + 0 + '>+</button>';
	//tab.querySelector('button').addEventListener('click', newTabClickHandler, true);
	//tab.innerHTML = '<a class="small button" type="tabButton" name=' + 0 + '>+</a>';
	tab.innerHTML = '<a class="waves-effect waves-light new-tab-btn btn" type="tabButton" name=' + 0 + '>+</a>';
	tab.querySelector('a[type="tabButton"]').addEventListener('click', newTabClickHandler, true);

	/* Number of tabs */
	numTabs = 1;

	/* Initializes closeURL */
	closeURL = chrome.extension.getURL("img/close.png");

	/* Creates Tab 1 and adds an event listener */
	createButton();

	/* Current tab */
	currentTab = 1;

	/* Array of tabs open */
	tabArray = [];

	/* Array of tab URLs */
	tabUrlArray = [];

	/* Get saved tabs, if there are any */
	loadTabs();

	/* Get saved urls */
	loadUrls();

	/* Save Gmail's URL */
	chrome.runtime.sendMessage({tag: "initialRun"}, function(response) {
		console.log("Initial run happened!");
		// Initialize gmailUrl
		gmailUrl = response.url;
		console.log("gmailURL is " + gmailUrl.toString());
		// Push url for tab 1
		tabUrlArray.push(gmailUrl);
		saveUrls();
	});

	/* Event listener for page changes */
	chrome.runtime.onMessage.addListener(
		function(request, sender, sendResponse) {
			tabUrlArray[currentTab-1] = request.url;
			saveUrls();
			console.log("Tab " + currentTab + " URL saved: " + request.url);
		});
}

/* Creates a tab button. */
function createButton(e) {
	// Initialize tab button
	var tab = document.createElement('tab');
	tabLocation.parentElement.insertAdjacentElement('beforebegin', tab);
	//tab.innerHTML = '<button class="btn" type="tabButton" name=' + numTabs + '>Tab ' + numTabs + '</button>';
	//tab.querySelector('button').addEventListener('click', emailTabClickHandler, true);
	//tab.innerHTML = '<a class="small button" type="tabButton" name=' + numTabs+ '>Tab ' + numTabs + '</a>';
	tab.innerHTML = '<a class="waves-effect waves-light btn" type="tabButton" name=' + numTabs + '>Tab ' + numTabs + '</a>';
	tab.querySelector('a[type="tabButton"]').addEventListener('click', emailTabClickHandler, true);

	// Initialize close button
	var closeTab = document.createElement('close');
	tabLocation.parentElement.insertAdjacentElement('beforebegin', closeTab);
	closeTab.innerHTML = '<a class="waves-effect waves-light close-btn btn" type="closeButton" name="close"><img src=' + closeURL + ' alt="" height="16px" width="16px"/></a>';
	closeTab.querySelector('a[type="closeButton"]').addEventListener('click', closeTabClickHandler, true);

	numTabs++; // Increment the tab number
}

/* Runs when the new tab button is clicked. */
function newTabClickHandler(e) {
	createButton();

	tabArray.push(numTabs);
	tabUrlArray.push(gmailUrl);

	saveUrls(); // Save URLs

	// Update current tab
	var prevTab = currentTab;
	currentTab = numTabs-1;
	var tab = document.getElementsByName(prevTab)[0];
	tab.style.backgroundColor = "#E0E0E0";
	tab = document.getElementsByName(currentTab)[0];
	tab.style.backgroundColor = "#42A5F5";

	goToUrl(prevTab); // Go to new URL

	saveTabs(); // Save tabs
}

/* Runs when an email tab is clicked. */
function emailTabClickHandler(e) {
	var prevTab = currentTab; // Stores the current tab
	currentTab = e.target.name; // Updates the current tab

	// Change tab colors
	var tab = document.getElementsByName(prevTab)[0];
	tab.style.backgroundColor = "#E0E0E0";
	tab = document.getElementsByName(currentTab)[0];
	tab.style.backgroundColor = "#42A5F5";

	goToUrl(prevTab); // Go to new URL

	saveTabs(); // Save tabs
}

/* Runs when a close tab button is clicked. */
function closeTabClickHandler(e) {
	// Handle if you close current tab
	// Handle if you close the one remaining tab
	// Handle if you close another tab

}

/* Stores the tabs that the user has open. */
function saveTabs() {
	// Save it using the Chrome extension storage API.
	chrome.storage.sync.set({'currentTab': currentTab}, function() {
        // Notify that we saved.
        console.log('Current tab settings saved: ' + currentTab + ' was saved.');
    });

	var tabsJson = JSON.stringify(tabArray);
	console.log("Tabs: " + tabsJson);

    // Save it using the Chrome extension storage API.
    chrome.storage.sync.set({'tabs': tabsJson}, function() {
        // Notify that we saved.
        console.log('Tab settings saved: ' + currentTab + ' was saved.');
    });
}

/* Gets the tabs that are stored in the storage and loads them into memory. */
function loadTabs() {
	chrome.storage.sync.getBytesInUse('tabs', function(bytesInUse) {
		if (bytesInUse > 0) {
			/* Getting tabs from memory and storing them into tabArray */
			chrome.storage.sync.get('tabs', function(tabs) {
				// Converts JSON to array of strings
				var tempTabArray = JSON.parse(JSON.parse(JSON.stringify(tabs)).tabs);

				// Notify that the tabs have been received
				console.log('Tabs have been received: ' + tempTabArray.toString());

				var arrayLength = tempTabArray.length;

				for (var i = 0; i < arrayLength; i++) {
					tabArray[i] = parseInt(tempTabArray[i]);
				}

				/* Rendering tabs in Gmail */
				for (var i = 0; i < arrayLength; i++) {
					createButton();
				}
			});

			/* Getting the current tab from memory */
			chrome.storage.sync.get('currentTab', function(storedCurrentTab) {
				currentTab = parseInt(JSON.parse(JSON.parse(JSON.stringify(storedCurrentTab)).currentTab));
				console.log("Current tab has been retrieved: " + currentTab);

				var tab = document.getElementsByName(currentTab)[0];
				tab.style.backgroundColor = "#42A5F5";
				//tab.innerHTML = '<a class="waves-effect waves-light current-tab-btn btn" type="tabButton" name=' + currentTab + '>Tab ' + currentTab + '</a>';
			});
		}
	});
}

/* Saves the URLs associated with each tab into memory. */
function saveUrls() {
	var urlJson = JSON.stringify(tabUrlArray);
	console.log("URLS: " + urlJson);

    // Save it using the Chrome extension storage API.
    chrome.storage.sync.set({'urls': urlJson}, function() {
        // Notify that we saved.
        console.log('Tab URL settings saved: ' + tabUrlArray[currentTab-1] + ' was saved.');
    });
}

/* Gets the URL associated with the tab from memory and goes to it. */
function goToUrl(prevTab) {
	chrome.storage.sync.get('urls', function(urls) {
		// Converts JSON to array of strings
		var tempUrlArray = JSON.parse(JSON.parse(JSON.stringify(urls)).urls);

		// URL corresponding with the button
		var url = tempUrlArray[currentTab-1];

		// Update URL
		if (url != tabUrlArray[prevTab-1]) {
			chrome.runtime.sendMessage({tag: url}, function(response) {
				console.log(response.message);
			});
		}
		else {
			console.log("Same URL: " + url)
		}
	});
}

/* Loads the URLS in memory into the Gmail tabs. */
function loadUrls() {
	chrome.storage.sync.getBytesInUse('urls', function(bytesInUse) {
		if (bytesInUse > 0) {
			chrome.storage.sync.get('urls', function(urls) {
				// Converts JSON to array of strings
				var tempUrlArray = JSON.parse(JSON.parse(JSON.stringify(urls)).urls);

				for (var i = 0; i < tempUrlArray.length; i++) {
					tabUrlArray[i] = tempUrlArray[i];
				}
				console.log("After loading urls: " + tabUrlArray.toString());
			});
		}
	});
}

/* Removes a tab from memory. */
function removeTab() {

}