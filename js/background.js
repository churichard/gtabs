chrome.runtime.onMessage.addListener(
	function(request, sender, sendResponse) {
		if (request.tag == "initialRun") {
			var rawUrl = sender.tab.url;
			var urlArray = rawUrl.split("/");
			var gmailUrl = "";
			for (var i = 0; i < 6; i++) {
				gmailUrl += urlArray[i] + "/";
			}
			gmailUrl += "#inbox";
			sendResponse({url: gmailUrl});
		}
		else if (request.tag == "closeGmail") {
			chrome.tabs.query({active: true, currentWindow: true}, function(arrayOfTabs) {
				var activeTabId = arrayOfTabs[0].id;

				chrome.tabs.remove(activeTabId);
			});
		}
		else {
			chrome.tabs.update({url: request.tag});
			sendResponse({message: "Went to URL: " + request.tag});
		}
	});

chrome.tabs.onUpdated.addListener(function(tabId, changeInfo, tab) {
	chrome.tabs.query({active: true, currentWindow: true}, function(tabs) {
		chrome.tabs.sendMessage(tabs[0].id, {url: tabs[0].url}, function(response) {
			// Sending tab url to content_script
		});
	});

	//Clears the storage
	// if (changeInfo.url == undefined){
	// 	chrome.storage.sync.clear();
	// }
});