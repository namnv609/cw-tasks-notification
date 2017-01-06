$(function() {
  var currentUserToken;
  var currentUserId;

  chrome.webRequest.onBeforeRequest.addListener(function(requestDetail) {
    var cwInitUrlRegEx = /^.*www\.chatwork\.com\/gateway.php.*myid\=[0-9]+.*_t\=[a-f0-9]+.*$/g;
    var cwTaskActionRegEx = /^.*www\.chatwork\.com\/gateway.php\?cmd\=([a-z]+)_task.*$/g;

    if (requestDetail.type && requestDetail.type === "xmlhttprequest") {
      var requestUrl = requestDetail.url;

      if (cwInitUrlRegEx.test(requestUrl) && !currentUserToken && !currentUserId) {
        currentUserToken = getQueryString(requestUrl, "_t");
        currentUserId = getQueryString(requestUrl, "myid");
      }

      if (cwTaskActionRegEx.test(requestUrl) && requestDetail.type === "xmlhttprequest") {
        getUserTasks(currentUserId, currentUserToken);
      }
    }
  }, {
    urls: ["<all_urls>"]
  });

  chrome.webNavigation.onCompleted.addListener(function(tabDetail) {
    getUserTasks(currentUserId, currentUserToken);
  }, {
    url: [{
      hostContains: "chatwork.com"
    }]
  });

  chrome.browserAction.setBadgeBackgroundColor({color: "#FF0000"});

  chrome.browserAction.onClicked.addListener(function(tab) {
    chrome.tabs.create({
      url: chrome.extension.getURL('settings-page.html'),
      selected: true
    });
  });
});

/**
 * Get user tasks
 *
 * @param  {String} currentUserId    Current user ID
 * @param  {String} currentUserToken Current user token
 * @return {Void}                    Call getTasksInToday method
 */
function getUserTasks(currentUserId, currentUserToken) {
  var cwTaskListUrl = [
    "https://www.chatwork.com/gateway.php?cmd=load_my_task&myid=",
    currentUserId,
    "&_t=",
    currentUserToken,
    "&type=my&status=open"
  ].join("");

  $.getJSON(cwTaskListUrl, function(response) {
    if (response && response.status.success) {
      var taskList = response.result.task_dat;

      getTasksInToday(taskList);
    }
  });
}

/**
 * Get the value of a querystring
 * Ref: https://gomakethings.com/how-to-get-the-value-of-a-querystring-with-native-javascript/
 *
 * @param  {String} url   The URL to get the value from (optional)
 * @param  {String} field The field to get the value of
 * @return {String}       The field value
 */
function getQueryString(url, field) {
  var href = url ? url : window.location.href;
  var reg = new RegExp('[?&]' + field + '=([^&#]*)', 'i');
  var string = reg.exec(href);
  return string ? string[1] : null;
};

/**
 * Convert Epoch to format date
 *
 * @param  {Integer} epochSeconds Epoch seconds
 * @return {String}               Formatted date
 */
function epochToDate(epochSeconds) {
  var date = new Date(0);
  date.setUTCSeconds(epochSeconds);

  return [
    date.getFullYear(),
    (date.getMonth() + 1),
    date.getDate()
  ].join("/");
}

/**
 * Get task(s) in today
 *
 * @param  {Object} taskList Task list
 * @return {Void}            Display message and task list to page
 */
function getTasksInToday(taskList) {
  var todayTaskNumb = 0;
  var todayTasks = [];
  var today = epochToDate((Date.now() / 1000));
  var badgeCountNumb = "";

  $.each(taskList, function(idx, task) {
    var taskDueDate = epochToDate(task.lt);

    if (taskDueDate === today) {
      todayTaskNumb++;
      todayTasks.push(task);
    }
  });

  $.when.apply($, todayTasks).done(function() {
    var messageObj = {
      count: todayTaskNumb,
      tasks: todayTasks
    };

    chrome.tabs.query({url: "*://www.chatwork.com/*"}, function(tabs) {
      tabs.map(function(tab, idx) {
        chrome.tabs.sendMessage(tab.id, messageObj);
      });
    });

    if (todayTaskNumb) {
      badgeCountNumb = todayTaskNumb;
    }

    chrome.browserAction.setBadgeText({text: badgeCountNumb.toString()});
  });
}
