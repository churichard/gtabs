/* Declare variables */
var tabLocation; // Location of the tabs
var numTabs; // Number of tabs
var tabArray; // Array of tabs
var tabUrlArray; // Array of tab URLs
var gmailUrl; // URL of Gmail
var currentTab; // Current tab that the user is on
var closeURL; // URL of close.png image
var location; // Location of the user in Gmail

/* Call init function */
init();

/* Initializes variables. */
function init() {
	/* Identifies place to add the new tab button */
	tabLocation = document.querySelectorAll('div[class]')[4];

	/* Creates the new tab button and adds an event listener */
	var tab = document.createElement('tab');
	tabLocation.parentElement.insertAdjacentElement('beforebegin', tab);
	tab.innerHTML = '<a class="waves-effect waves-light new-tab-btn btn" type="tabButton" id=' + 0 + '>+</a>';
	tab.querySelector('a[type="tabButton"]').addEventListener('click', newTabClickHandler, true);

	/* Number of tabs */
	numTabs = 1;

	/* Initializes closeURL */
	closeURL = chrome.extension.getURL("img/close.png");

	/* Current tab */
	currentTab = 1;

	/* Array of tabs open */
	tabArray = [];

	/* Array of tab URLs */
	tabUrlArray = [];

	/* Save Gmail's URL */
	chrome.runtime.sendMessage({tag: "initialRun"}, function(response) {
		console.log("Initial run happened!");

		/* Initialize gmailUrl */
		gmailUrl = response.url;
		console.log("gmailURL is " + gmailUrl.toString());

		/* Get saved urls */
		loadUrls();

		/* Get saved tabs, if there are any */
		loadTabs();
	});

	/* Event listener for page changes */
	chrome.runtime.onMessage.addListener(
		function(request, sender, sendResponse) {
			// Update the tab url
			var currentTabIndex = tabArray.indexOf(currentTab);
			tabUrlArray[currentTabIndex] = request.url;
			// Save the urls
			saveUrls();
			// Update the title of the tab
			updateTitle(currentTabIndex);

			console.log("Tab " + currentTab + " URL saved: " + request.url);
		});
}

/* Creates a tab button. */
function createButton(tabNum, tabName) {
	if (tabNum == null) {
		// Look for the next available tab number
		while (tabArray.indexOf(numTabs) != -1) {
			numTabs++;
		}

		var tabNum = numTabs;
	}

	console.log("LOCATION IS " + location);

	// Initialize tab button
	var tab = document.createElement('tab');
	tabLocation.parentElement.insertAdjacentElement('beforebegin', tab);
	tab.innerHTML = '<a class="waves-effect waves-light btn" type="tabButton" id=' + tabNum + ' value= ' + tabName + '>' + tabName + '</a>';
	tab.querySelector('a[type="tabButton"]').addEventListener('click', emailTabClickHandler, true);

	// Initialize close button
	var closeTab = document.createElement('close');
	tabLocation.parentElement.insertAdjacentElement('beforebegin', closeTab);
	var closeID = "close" + tabNum;
	var imageID = "image" + tabNum;
	closeTab.innerHTML = '<a class="waves-effect waves-light close-btn btn" type="closeButton" id=' + closeID + '>'
	+ '<img src=' + closeURL + ' alt="" id=' + imageID + ' height="16px" width="16px"/></a>';
	closeTab.querySelector('a[type="closeButton"]').addEventListener('click', closeTabClickHandler, true);
}

/* Runs when the new tab button is clicked. */
function newTabClickHandler() {
	tabArray.push(numTabs);
	tabUrlArray.push(gmailUrl);

	createButton(null, getTitle(tabUrlArray.length-1));

	saveUrls(); // Save URLs

	// Change tab colors
	var prevTab = currentTab;
	currentTab = numTabs;
	updateColor(prevTab);

	goToUrl(prevTab, null, null); // Go to new URL

	saveTabs(); // Save tabs
}

/* Runs when an email tab is clicked. */
function emailTabClickHandler(e) {
	var prevTab = currentTab; // Stores the current tab
	currentTab = parseInt(e.target.id); // Updates the current tab

	// Change tab colors
	updateColor(prevTab);

	goToUrl(prevTab, null, null); // Go to new URL

	saveTabs(); // Save tabs
}

/* Runs when a close tab button is clicked. */
function closeTabClickHandler(e) {
	var id = e.target.parentNode.id;

	if (id.length == 0)
		id = e.target.id;

	removeTab(id);
}

/* Stores the tabs that the user has open. */
function saveTabs() {
	// Save it using the Chrome extension storage API.
	chrome.storage.local.set({'currentTab': currentTab}, function() {
        // Notify that we saved.
        console.log('Current tab settings saved: ' + currentTab + ' was saved.');
    });

	var tabsJson = JSON.stringify(tabArray);
	console.log("Tabs: " + tabsJson);

    // Save it using the Chrome extension storage API.
    chrome.storage.local.set({'tabs': tabsJson}, function() {
        // Notify that we saved.
        console.log('Tab settings saved: ' + currentTab + ' was saved.');
    });
}

/* Gets the tabs that are stored in the storage and loads them into memory. */
function loadTabs() {
	chrome.storage.local.getBytesInUse('tabs', function(bytesInUse) {
		if (bytesInUse > 0) {
			console.log("There is memory in storage");

			/* Getting tabs from memory and storing them into tabArray */
			chrome.storage.local.get('tabs', function(tabs) {
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
					createButton(tabArray[i], getTitle(i));
				}
			});

			/* Getting the current tab from memory */
			chrome.storage.local.get('currentTab', function(storedCurrentTab) {
				currentTab = parseInt(JSON.parse(JSON.parse(JSON.stringify(storedCurrentTab)).currentTab));
				console.log("Current tab has been retrieved: " + currentTab);

				// Update tab colors
				updateColor(null);
			});
		}
		else {
			console.log("There is no memory in storage");

			tabArray.push(numTabs);
			tabUrlArray.push(gmailUrl);

			createButton(null, getTitle(tabUrlArray.length-1));

			// Update tab colors
			updateColor(null);

			saveUrls(); // Save URLs
			saveTabs(); // Save tabs
		}
	});
}

/* Saves the URLs associated with each tab into memory. */
function saveUrls() {
	var urlJson = JSON.stringify(tabUrlArray);
	console.log("URLS: " + urlJson);

    // Save it using the Chrome extension storage API.
    chrome.storage.local.set({'urls': urlJson}, function() {
        // Notify that we saved.
        var currentTabIndex = tabArray.indexOf(currentTab);
        console.log('Tab URL settings saved: ' + tabUrlArray[currentTabIndex] + ' was saved.');
    });
}

/* Gets the URL associated with the tab from memory and goes to it. */
function goToUrl(prevTab, tempTabArray, tempUrlArray) {
	chrome.storage.local.get('urls', function(urls) {
		if (tempTabArray == null && tempUrlArray == null) {
			// Converts JSON to array of strings
			tempUrlArray = JSON.parse(JSON.parse(JSON.stringify(urls)).urls);
			tempTabArray = tabArray;
		}

		// URL corresponding with the button
		var currentTabIndex = tempTabArray.indexOf(currentTab);
		var url = tempUrlArray[currentTabIndex];

		// Update URL
		var prevTabIndex = tempTabArray.indexOf(prevTab);

		if (url != tempUrlArray[prevTabIndex]) {
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
	chrome.storage.local.getBytesInUse('urls', function(bytesInUse) {
		if (bytesInUse > 0) {
			chrome.storage.local.get('urls', function(urls) {
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
function removeTab(name) {
	// Handles if there are no tabs left
	if (tabArray.length == 1) {
		// Clears the storage
		chrome.storage.local.clear();

		// Closes the Gmail tab
		chrome.runtime.sendMessage({tag: "closeGmail"}, function(response) {});
	}
	else {
		// Get the tab number to be removed
		var num = parseInt(name.substring(5, name.length));

		var tempTabArray = tabArray.slice(0);
		var tempUrlArray = tabUrlArray.slice(0);

		// Remove the tab from tabArray and tabUrlArray
		var tabIndex = tabArray.indexOf(num);
		tabArray.splice(tabIndex, 1);
		tabUrlArray.splice(tabIndex, 1);

		// Remove the tab from the screen
		var tabElement = document.getElementById(num);
		var closeElement = document.getElementById(name);
		tabElement.parentNode.removeChild(tabElement);
		closeElement.parentNode.parentNode.removeChild(closeElement.parentNode);

		// Handles if you remove the current tab
		if (currentTab == num) {
			var prevTab = currentTab;
			// Update the current tab
			currentTab = tabArray[0];

			// Update colors
			updateColor(null);

			// Go to new url
			goToUrl(prevTab, tempTabArray, tempUrlArray);
		}
	}

	// Save changes
	saveTabs();
	saveUrls();
}

/* Updates the color of the current tab. */
function updateColor(prevTab) {
	if (prevTab != null) {
		// Change the color of the previous tab back to gray
		var tab = document.getElementById(prevTab);
		tab.style.backgroundColor = "#E0E0E0";
	}

	// Change the color of the current tab to blue
	tab = document.getElementById(currentTab);
	tab.style.backgroundColor = "#42A5F5";
}

/* Gets the title of the tab. */
function getTitle(index) {
	var rawUrl = tabUrlArray[index];
	var loc = rawUrl.split("/")[6];
	var url = loc.substring(1, loc.length);
	var capUrl = url.charAt(0).toUpperCase() + url.slice(1);
	return capUrl;
}

/* Updates the title of the tab. */
function updateTitle(index) {
	var element = document.getElementById(tabArray[index]);
    element.textContent = getTitle(index);
}