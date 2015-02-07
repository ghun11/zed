
var data = require("sdk/self").data;
var pageMod = require("sdk/page-mod");

pageMod.PageMod({
  include: "*.radialpoint.net",
  contentScriptFile: data.url("TW5TicketAssistant.user.js")
});