/* Declare variables */
var tabLocation; // Location of the tabs
var numTabs; // Number of tabs
var tabArray; // Array of tabs
var tabUrlArray; // Array of tab URLs
var tabTitleArray; // Array of tab titles
var gmailUrl; // URL of Gmail
var currentTab; // Current tab that the user is on
var closeURL; // URL of close.png image
var location; // Location of the user in Gmail
var tabClicked; // If a tab is clicked or not

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

	/* Number of tabs open */
	numTabs = 1;
	/* Initializes closeURL */
	closeURL = chrome.extension.getURL("img/close.png");
	/* Current tab */
	currentTab = 1;
	/* Array of tabs open */
	tabArray = [];
	/* Array of tab URLs */
	tabUrlArray = [];
	/* Array of tab titles */
	tabTitleArray = [];
	/* Initialize tabClicked */
	tabClicked = false;

	/* Save Gmail's URL */
	chrome.runtime.sendMessage({tag: "initialRun"}, function(response) {
		//console.log("Initial run");

		/* Initialize gmailUrl */
		gmailUrl = response.url;

		/* Get saved urls */
		loadUrls();
		/* Get saved titles */
		loadTitles();
		/* Get saved tabs */
		loadTabs();
	});

	/* Event listener for page changes */
	chrome.runtime.onMessage.addListener(
		function(request, sender, sendResponse) {
			// Check to see if the user is composing a message
			var url = request.url;
			var currentTabIndex = tabArray.indexOf(currentTab);
			var cIndex = url.indexOf("?compose");

			// If the user is composing a message
			if (cIndex > -1) {
				// Iterate through all the urls
				for (var i = 0; i < tabUrlArray.length; i++) {
					// Add the compose message window to the urls that don't have it
					var tabUrl = tabUrlArray[i];
					if (tabUrl.indexOf("?compose") === -1) {
						tabUrlArray[i] = tabUrl + url.substring(cIndex, url.length);
					}
				}
			}
			// If the user is not composing a message
			else {
				// Iterate through all the urls
				for (var i = 0; i < tabUrlArray.length; i++) {
					// Remove the compose message window from the urls that have it
					var tabUrl = tabUrlArray[i];
					var index = tabUrl.indexOf("?compose");
					if (index > -1) {
						tabUrlArray[i] = tabUrl.substring(0, index);
					}
				}
			}

			// If none of the tabs were clicked
			if (!tabClicked) {
				// If an email is clicked, open it in a new tab
				var urlArray = url.split("/");
				if (urlArray.length >= 8) {
					// Checking to see that the user is not clicking an attachment
					if ((url.indexOf("&") !== -1) || (tabUrlArray[currentTabIndex].indexOf("&") !== -1)
						|| (url.indexOf("?") !== -1 && url.indexOf(tabUrlArray[currentTabIndex].split("?")[0]) !== -1)
						|| (tabUrlArray[currentTabIndex].indexOf("?") === -1 && tabUrlArray[currentTabIndex].indexOf(url) !== -1)
						|| (tabUrlArray[currentTabIndex].indexOf("?") !== -1 && tabUrlArray[currentTabIndex].indexOf(url) !== -1)) {
					}
					else {
						// Create a new tab
						createButton(null, getTitle(gmailUrl));

						tabArray.push(numTabs);
						tabUrlArray.push(request.url);
						tabTitleArray.push(getTitle(tabUrlArray[currentTabIndex]));

						// Change tab colors
						var prevTab = currentTab;
						currentTab = numTabs;
						updateColor(prevTab);

						saveTabs(); // Save tabs
					}
				}

				currentTabIndex = tabArray.indexOf(currentTab);

				// Update the tab url
				tabUrlArray[currentTabIndex] = url;

				// Update the title of the tab
				tabTitleArray[currentTabIndex] = getTitle(tabUrlArray[currentTabIndex]);
				updateTitle(currentTabIndex);

				// Save the titles
				saveTitles();

				//console.log("Tab " + currentTab + " URL saved: " + url);
			}

			// Save the urls
			saveUrls();

			tabClicked = false; // Reset tabClicked
		});
}

/* Creates a tab button. */
function createButton(tabNum, tabName) {
	if (tabNum === null) {
		// Look for the next available tab number
		while (tabArray.indexOf(numTabs) !== -1) {
			numTabs++;
		}

		tabNum = numTabs;
	}

	// Initialize tab button
	var tab = document.createElement('tab');
	tabLocation.parentElement.insertAdjacentElement('beforebegin', tab);
	tab.innerHTML = '<a class="waves-effect waves-light btn" type="tabButton" id=' + tabNum + '>' + tabName + '</a>';
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
	createButton(null, getTitle(gmailUrl));

	tabArray.push(numTabs);
	tabUrlArray.push(gmailUrl);
	tabTitleArray.push("Inbox");

	saveUrls(); // Save URLs

	// Change tab colors
	var prevTab = currentTab;
	currentTab = numTabs;
	updateColor(prevTab);

	goToUrl(prevTab, null, null); // Go to new URL

	saveTabs(); // Save tabs
	saveTitles(); // Save titles
}

/* Runs when an email tab is clicked. */
function emailTabClickHandler(e) {
	var prevTab = currentTab; // Stores the current tab
	currentTab = parseInt(e.target.id); // Updates the current tab

	// Change tab colors
	updateColor(prevTab);

	// Get the previous and current tab indices
	var prevTabIndex = tabArray.indexOf(prevTab);
	var currentTabIndex = tabArray.indexOf(currentTab);

	// One of the tabs has been clicked
	if (prevTab !== currentTab && tabUrlArray[currentTabIndex] !== tabUrlArray[prevTabIndex])
		tabClicked = true;

	goToUrl(prevTab, null, null); // Go to new URLs

	saveTabs(); // Save tabs
}

/* Runs when a close tab button is clicked. */
function closeTabClickHandler(e) {
	var id = e.target.parentNode.id;

	if (id.length === 0)
		id = e.target.id;

	// One of the tabs has been clicked
	var tab = parseInt(id.toString().charAt(5));
	var tabIndex = tabArray.indexOf(tab);
	var nextTabIndex;
	if (tabIndex < tabArray.length-1)
		nextTabIndex = tabIndex+1;
	else
		nextTabIndex = tabIndex-1;
	if (tab === currentTab && tabUrlArray[tabIndex] !== tabUrlArray[nextTabIndex])
		tabClicked = true;

	removeTab(id);
}

/* Stores the tabs that the user has open. */
function saveTabs() {
	// Save the current tab
	chrome.storage.local.set({'currentTab': currentTab}, function() {
        // Notify that we saved.
        //console.log('Current tab settings saved: ' + currentTab + ' was saved.');
    });

	var tabsJson = JSON.stringify(tabArray);
	//console.log("Tabs: " + tabsJson);

    // Save the array of tabs
    chrome.storage.local.set({'tabs': tabsJson}, function() {
        // Notify that we saved.
        //console.log('Tab settings saved.');
    });
}

/* Gets the tabs that are stored in the storage and loads them into memory. */
function loadTabs() {
	chrome.storage.local.getBytesInUse('tabs', function(bytesInUse) {
		if (bytesInUse > 0) {
			//console.log("There is memory in storage");

			/* Getting tabs from memory and storing them into tabArray */
			chrome.storage.local.get('tabs', function(tabs) {
				// Converts JSON to array of strings
				var tempTabArray = JSON.parse(JSON.parse(JSON.stringify(tabs)).tabs);

				// Notify that the tabs have been received
				//console.log('Tabs have been received: ' + tempTabArray.toString());

				var arrayLength = tempTabArray.length;

				for (var i = 0; i < arrayLength; i++) {
					tabArray[i] = parseInt(tempTabArray[i]);
				}

				//console.log("Tab url array: " + tabUrlArray.toString());

				/* Rendering tabs in Gmail */
				for (var i = 0; i < arrayLength; i++) {
					createButton(tabArray[i], tabTitleArray[i]);
				}
			});

			/* Getting the current tab from memory */
			chrome.storage.local.get('currentTab', function(storedCurrentTab) {
				currentTab = parseInt(JSON.parse(JSON.parse(JSON.stringify(storedCurrentTab)).currentTab));
				//console.log("Current tab has been retrieved: " + currentTab);

				// Update tab colors
				updateColor(null);
			});
		}
		else {
			//console.log("There is no memory in storage");

			createButton(null, getTitle(gmailUrl));

			tabArray.push(numTabs);
			tabUrlArray.push(gmailUrl);
			tabTitleArray.push("Inbox");

			// Update tab colors
			updateColor(null);

			saveUrls(); // Save URLs
			saveTabs(); // Save tabs
			saveTitles(); // Save titles
		}
	});
}

/* Saves the URLs associated with each tab into memory. */
function saveUrls() {
	var urlJson = JSON.stringify(tabUrlArray);
	//console.log("URLS: " + urlJson);

    // Save it using the Chrome extension storage API.
    chrome.storage.local.set({'urls': urlJson}, function() {
        // Notify that we saved.
        var currentTabIndex = tabArray.indexOf(currentTab);
        //console.log('Tab URL settings saved: ' + tabUrlArray[currentTabIndex] + ' was saved.');
    });
}

/* Gets the URL associated with the tab from memory and goes to it. */
function goToUrl(prevTab, tempTabArray, tempUrlArray) {
	chrome.storage.local.get('urls', function(urls) {
		if (tempTabArray === null && tempUrlArray === null) {
			// Converts JSON to array of strings
			tempUrlArray = JSON.parse(JSON.parse(JSON.stringify(urls)).urls);
			tempTabArray = tabArray;
		}

		// URL corresponding with the button
		var currentTabIndex = tempTabArray.indexOf(currentTab);
		var url = tempUrlArray[currentTabIndex];

		// Update URL
		var prevTabIndex = tempTabArray.indexOf(prevTab);

		if (url !== tempUrlArray[prevTabIndex]) {
			chrome.runtime.sendMessage({tag: url}, function(response) {
				//console.log(response.message);
			});
		}
		else {
			//console.log("Same URL: " + url)
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
				//console.log("After loading urls: " + tabUrlArray.toString());
			});
		}
	});
}

/* Removes a tab from memory. */
function removeTab(name) {
	// Handles if there are no tabs left
	if (tabArray.length === 1) {
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
		tabTitleArray.splice(tabIndex, 1);

		// Remove the tab from the screen
		var tabElement = document.getElementById(num);
		var closeElement = document.getElementById(name);
		tabElement.parentNode.removeChild(tabElement);
		closeElement.parentNode.parentNode.removeChild(closeElement.parentNode);

		// Handles if you remove the current tab
		if (currentTab === num) {
			var prevTab = currentTab;
			// Update the current tab
			if (tabIndex < tempTabArray.length-1)
				currentTab = tabArray[tabIndex];
			else
				currentTab = tabArray[tabIndex-1];

			// Update colors
			updateColor(null);

			// Go to new url
			goToUrl(prevTab, tempTabArray, tempUrlArray);
		}

		// Save changes
		saveTabs();
		saveUrls();
		saveTitles();
	}
}

/* Saves tab titles to memory. */
function saveTitles() {
	var titleJson = JSON.stringify(tabTitleArray);
	//console.log("Titles: " + titleJson);

    // Save it using the Chrome extension storage API.
    chrome.storage.local.set({'titles': titleJson}, function() {
        // Notify that we saved.
        var currentTabIndex = tabArray.indexOf(currentTab);
        //console.log('Tab title settings saved: ' + tabTitleArray[currentTabIndex] + ' was saved.');
    });
}

/* Loads tab titles from memory. */
function loadTitles() {
	chrome.storage.local.getBytesInUse('titles', function(bytesInUse) {
		if (bytesInUse > 0) {
			chrome.storage.local.get('titles', function(titles) {
				// Converts JSON to array of strings
				var tempTitleArray = JSON.parse(JSON.parse(JSON.stringify(titles)).titles);

				for (var i = 0; i < tempTitleArray.length; i++) {
					tabTitleArray[i] = tempTitleArray[i];
				}
				//console.log("After loading titles: " + tabTitleArray.toString());
			});
		}
	});
}

/* Gets the title of the tab. */
function getTitle(rawUrl) {	
	var urlArray = rawUrl.split("/");
	var title;
	
	if (urlArray.length === 7) {
		var loc = urlArray[6].split("?")[0];

		if (loc === "#") {
			title = "Categories";
		}
		else if (loc === "#sent") {
			title = "Sent Mail";
		}
		else if (loc === "#all") {
			title = "All Mail";
		}
		else if (loc === "#imp") {
			title = "Important";
		}
		else {
			loc = loc.substring(1, loc.length);
			title = loc.charAt(0).toUpperCase() + loc.slice(1);
		}
	}
	else if (urlArray.length > 7) {
		var category = urlArray[6];

		if (category === "#label" || category === "#category" || category === "#search" || category === "#settings") {
			if (urlArray.length === 9) {
				title = document.getElementsByClassName("hP")[0].textContent;
			}
			else {
				title = urlArray[7].split("?")[0];
				title = title.charAt(0).toUpperCase() + title.slice(1);
			}
		}
		else if (category === "#contacts") {
			title = "Contacts";
		}
		else {
			title = document.getElementsByClassName("hP")[0].textContent;
		}
	}
	else {
		//console.log("Something's wrong; urlArray length is less than 7");
	}

	if (title.length > 15)
		title = title.substring(0, 15) + "...";
	
	return title;
}

/* Updates the title of the tab. */
function updateTitle(index) {
	var element = document.getElementById(tabArray[index]);
	element.textContent = tabTitleArray[index];
}

/* Updates the color of the current tab. */
function updateColor(prevTab) {
	if (prevTab !== null) {
		// Change the color of the previous tab back to gray
		var tab = document.getElementById(prevTab);
		tab.style.backgroundColor = "#E0E0E0";
	}

	// Change the color of the current tab to blue
	tab = document.getElementById(currentTab);
	tab.style.backgroundColor = "#42A5F5";
}