const siteIPs = new Map();

chrome.runtime.onStartup.addListener(() => {
	console.log("[show-remote-ip] Extension started");
});

chrome.runtime.onInstalled.addListener(() => {
	console.log("[show-remote-ip] Extension installed");
});

chrome.webRequest.onCompleted.addListener(
	(details) => {
		if (details.frameId === 0 && details.type === "main_frame" && details.ip) {
			// const url = new URL(details.url);
			// const hostname = url.hostname;

			const ipInfo = {
				ip: details.ip,
				timestamp: Date.now(),
				url: details.url,
				tabId: details.tabId,
			};

			siteIPs.set(details.tabId, ipInfo);
		}
	},
	{ urls: ["<all_urls>"] },
	["responseHeaders"],
);

async function handleGetIP(message, sender, sendResponse) {
	try {
		const tab = sender.tab;
		const url = new URL(tab.url);
		const hostname = url.hostname;

		const ipInfo = siteIPs.get(tab.id);

		sendResponse({
			hostname: hostname,
			ip: ipInfo ? ipInfo.ip : null,
			timestamp: ipInfo ? ipInfo.timestamp : null,
			url: tab.url,
		});

		siteIPs.delete(tab.id);
	} catch (error) {
		sendResponse({ error: error.message });
	}
}

function clearCache() {
	siteIPs.clear();
}

async function handleClearCache(sendResponse) {
	try {
		clearCache();
		sendResponse({ success: true });
	} catch (error) {
		sendResponse({ error: error.message });
	}
}

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
	switch (message.action) {
		case "getIP":
			handleGetIP(message, sender, sendResponse);
			return true;

		case "clearCache":
			handleClearCache(sendResponse);
			return true;

		default:
			sendResponse({ error: `Unknown message action: ${message.action}` });
			return false;
	}
});
