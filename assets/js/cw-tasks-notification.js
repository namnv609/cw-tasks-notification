$(function() {
  var currentUserToken;
  var currentUserId;

  chrome.webRequest.onBeforeRequest.addListener(function(requestDetail) {
    var cwInitUrlRegEx = /^.*www\.chatwork\.com\/gateway.php\?cmd\=init_load.*$/g

    if (requestDetail.type && requestDetail.type === "xmlhttprequest") {
      var requestUrl = requestDetail.url;

      if (cwInitUrlRegEx.test(requestUrl) && !currentUserToken && !currentUserId) {
        currentUserToken = getQueryString(requestUrl, "_t");
        currentUserId = getQueryString(requestUrl, "myid");
      }
    }
  }, {
    urls: ["<all_urls>"]
  });

  chrome.webNavigation.onCompleted.addListener(function(tabDetail) {
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

        $.each(taskList, function(idx, task) {
          console.log(epochToDate(task.lt));
        });
      }
    });
  }, {
    url: [{
      hostContains: "chatwork.com"
    }]
  });
});

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
