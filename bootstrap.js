// ==UserScript==
// @author          Jeff Williams & Damien Junor
// @name            TW5 Ticket Auto Parser
// @description     In-ticket MBAM,JRT and auto PDR
// @namespace       
// @homepage        
// @icon            
// @updateURL       
// @downloadURL     
// @match           *://*/*
// @grant           none
// @run-at          document-end
// @version         0.0.2
// ==/UserScript==


function DialogWindow()
	{
	this.dialogElement = null;
	this.parentElementId = null;	
	this.buttonElementId = null;
	}
DialogWindow.prototype.toString = function() 	{	return this.dialogElement +" "+	this.parentElementId +" "+this.buttonElementId;};

//////////////////////////////////////////
//MBAM log type 'constants'
var MBAM_UNRECOGNIZED = -1;
var MBAM_ORIGINAL = 0;
var MBAM_UPDATED = 1;

//////////////////////////////////////////
//html data
var htmlDialog ="";
var buttonTime = 0;
var dialogId = "TW5TPSpanDialog";
var uiDialogHTMLElement = null;
var xDragOffset = 0;
var yDragOffset = 0;

var toolGroupRetry = 0;
var maxToolGroupRetry = 50;
//////////////////////////////////////////
var ticketNumValue = 0;

//delay the call to create dialog button to give the website the chance to load.
setTimeout(function (){AddDialogOpenToPage("toolGroup");},200);

//inserts a button onto the specified element
function AddDialogOpenToPage(parentElement)
	{
	toolGroupRetry++;
	//harv note: just cause this page doesn't currently have a number doesn't mean that it's not a ticket page.
	//when tickets are created they get filled out without a page refresh.. insert event notifier on agent create ticket if possible
	if(toolGroupRetry > maxToolGroupRetry)
		{
		return;
		}

	var ticket = GetTicketNumer();
	if ((ticket == null) || (ticket < 0))
		{
		//this is not a ticket do not add button		
		setTimeout(function (){AddDialogOpenToPage("toolGroup");},200);
		return;
		}

	var elementOfParent = document.getElementsByClassName(parentElement);

	if(elementOfParent[0] == null)
		{
		//alert("Unable to find the specified element '"+parentElement+"' to add the Ticket Assistant open dialog button.\nUse the hotkeys 't'+'q' to open dialog");
		//on pages where there's no parentElement don't add the dialog
		return;
		}
	var openDialogButton = document.createElement("button");		
		openDialogButton.innerHTML = "Open TA";
		openDialogButton.addEventListener("click",function(){StartEnumTicketSOPSteps();});
		openDialogButton.style.backgroundColor="blue";
		openDialogButton.style.color="white";			
	elementOfParent[elementOfParent.length-1].appendChild(openDialogButton);
	}

//Harv note: observed that when tickets are created they generate a ticket # without a page reload.
//need to detect this activity and add a button as appropriate.
//the new code should not poll the page but find a page event to add a call listener for event based notifications

//////////////////////////////////////////


//respond to t+q keyboard events by either creating a dialog or setting existing dialog visible
//**this is legacy code as we've added a button
//**the event listener for this call has been so this code will not be called.
function reactKey(evt) 
	{
	//If first key identifier pressed set timeout period 't'
	if(evt.keyCode == 84) //t key
		{
		//Start trigger timer with a .5 second allowable delay between t and q key presses
		buttonTime = GetTimeDelay() + 500;
		// early out return when T key pressed after setting timer.
		return;
		}
   	
	//If second key identifier pressed within timeout show in ticket dialog
	if(evt.keyCode== 81)//q key
		{
		if(GetTimeDelay() < buttonTime)
			{
			StartEnumTicketSOPSteps();
			}
		}
	else
		{
		//reset timer if non Q key pressed after T key pressed
		buttonTime = 0;
		}
	if(evt.keyCode == 68) //d key
		{
		DisplayStepInfo();
		}
	}

function ShowInTicketDialog()
	{	
	uiDialogHTMLElement.style.visibility = "visible";
		uiDialogHTMLElement.style.left = "20";
		uiDialogHTMLElement.style.top = "150";
	}

function HideInTicketDialog()
	{
	//test for presence of un saved PDR data..
	
	var saveButton = document.getElementById('pdrDialogWindowSaveButton');
	//the presence of an (button)element named pdrDialogWindowSaveButton indicates we currently have an open pdr 	
	if(saveButton != null)
		{
		//add this PDR data to ticket
		//possible methods dialog, automatic dump, check for current data.
		}	

	uiDialogHTMLElement.style.opacity = 1.0;
	uiDialogHTMLElement.style.visibility = "hidden";
	}

function DialogMouseOver()
        {
        if(uiDialogHTMLElement.style.visibility != "hidden")
                {
                uiDialogHTMLElement.style.opacity = 1.0;
                }
        }
function DialogMouseOut()
        {
        if(uiDialogHTMLElement.style.visibility != "hidden")
                {
                uiDialogHTMLElement.style.opacity = 1.0;
                }
        }


//instantiate and initialize this page's ticket assistant html dialog
function CreateHtmlDialog()
	{
	//roll raw html into a dynamic span innerHTML
	var htmlInnerDialog = 
	"<img src='https://dit.aceproject.com/branding/dit/000-acelogo.gif?ts=20141016001832' width=61 height=38>"+
	"<table border='0' width='100%' bgcolor='lightblue' style='border:5px solid RoyalBlue;-webkit-border-radius:8px;-moz-border-radius:8px;-ms-border-radius:8px;-o-border-radius:8px;border-radius:8px;' >"+
	"<tr id='tadialogdragelement' bgcolor='lightblue'>"+
		"<td><input id='processButton' type=button value ='Process' class='toolGroup'>"+"<input id='pdrButton' type=button value ='PDR'></td>"+
		"<td align=center><font size=3>DIT Ticket Assistant Ticket # "+ticketNumValue+"</font> </td>"+
		"<td align=right ><input id='cleanButton' type=button value ='Clear'><input type=button id='_hideButton' value='_'><input type=button id='xhideButton' value='x'></td>"+
	"</tr>"+
	"<tr bgcolor='#E8E8E8'>"+
		"<td colspan=3 align=left><textarea id='dialoginput' style='width: 98%;' rows=8>PASTE (JRT / Malwarebytes / MSINFO32) LOGS HERE</textarea></td>"+
	"</tr>"+
	"<tr bgcolor='#E8E8E8'>"+
		"<td align = center>Software Removed<br><INPUT TYPE ='TEXTBOX' id='maliceValue' value=0 size=4><br>"+
			"Malware Removed<br><INPUT TYPE ='TEXTBOX' id='imsValue' value=0 size=4>"+		"</td>"+
		"<td align=center>"+
			"<table>"+
				"<tr>"+
					"<td>Size Of Junk:<INPUT TYPE ='TEXTBOX' id='jfcValue' value=0 size=4></td>"+
					"<td>"+
						"<input type=RADIO id='sizeval' name='sizevalue'>GB"+
						"<input type=RADIO name='sizevalue' checked>MB"+
					"</td>"+
				"</tr>"+
				"<tr>"+
					"<td>Reg Fixed :<input type='Textbox' id='regfixValue' value=0 size=4></td>"+
					"<td> "+
					"<input type=button id='commitCCleaner' value='Post CCleaner'>"+
					"</td>"+
					"</tr>"+
			"</table>"+
		"</td>	"+
		"<td align=center>"+

			"<table>"+
				"<tr>"+
					"<td>Hijacks Cleared:</td>"+
					"<td><INPUT TYPE ='TEXTBOX' id='hijacksCleared' value=0 size=4></td>"+
				"</tr>"+
				"<tr>"+
					"<td colspan=2><input type=button id='commitHijacks' value='Post Hijacks'></td>"+
					"</tr>"+
			"</table>"+
		"</td>"+
	"</tr>"+
	"<tr bgcolor='#E8E8E8'>"+
		"<td colspan=3 align=left ><TEXTAREA ID='dialogoutput' style='width: 98%;height:250px;'></TEXTAREA></td>"+
	"</tr>"+
	"<td>"+
	"<td align=right colspan=3>Version 2.1.1</td>"+
	"</td>";
		
	"</table>";

	//add a span to the DOM slamming our raw html dialog as it's innerHTML
	uiDialogHTMLElement = document.createElement("span");
	 	uiDialogHTMLElement.innerHTML = htmlInnerDialog;
		uiDialogHTMLElement.id = 'uiDialogHTMLElement';

		//spruce up the main dialog span
		
		//uiDialogHTMLElement.addEventListener("mouseover", function(){DialogMouseOver();});
		//uiDialogHTMLElement.addEventListener("mouseout", function(){DialogMouseOut();});
		uiDialogHTMLElement.style.position = "fixed";	
		uiDialogHTMLElement.style.left = "20px";
		uiDialogHTMLElement.style.top = "150px";
		uiDialogHTMLElement.style.opacity = 1.0;
		uiDialogHTMLElement.style.width = "700";
		
		document.body.appendChild(uiDialogHTMLElement);
	
	//some browsers don't like it when you slam event listeners via span innerHTML like we are with 'uiDialogHTMLElement'
	//manually add event listeners to any element that requires some user based functionality
	document.getElementById('xhideButton').addEventListener("click",function(){HideInTicketDialog();});
	document.getElementById('_hideButton').addEventListener("click",function(){HideInTicketDialog();});
	document.getElementById('processButton').addEventListener("click",function(){OnProcessBegin();});
	document.getElementById('pdrButton').addEventListener("click",function(){OnGeneratePDR();});
	document.getElementById('cleanButton').addEventListener("click",function(){OnClear();});
	document.getElementById('commitCCleaner').addEventListener("click",function(){OnCommitCCLeaner();});
	document.getElementById('commitHijacks').addEventListener("click",function(){OnComittHijacks();});

	document.getElementById('tadialogdragelement').addEventListener("mousedown",StartMouseDrag,false);
	
	//add events for right and left click to clear the text area when clicked
	document.getElementById('dialoginput').addEventListener("click",function(){OnInputTextaraClicked();});
	document.getElementById('dialoginput').addEventListener("contextmenu",function(){OnInputTextaraClicked();});
	}
	
function OnComittHijacks()
	{
	//gather hijack data values
	var hijackDataElement = document.getElementById("hijacksCleared"); 
	if(hijackDataElement != null)
		{
		hijackData = "HijackThis Fixes : "+hijackDataElement.value+ "\n";
		PostDataToStep(hijackData,"HijackThis");
	
		var ccButton = document.getElementById('commitHijacks');
		if(ccButton !=null)
			{ccButton.style.background = "green";}
		}
	}


//mouse down event on dragable element (hard coded to top table row)
function StartMouseDrag(e)
	{
	//set the global drag offset distance between mouse cursor at click and corner of parent element
	var dialog = document.getElementById("uiDialogHTMLElement");
	var pageLocation = uiDialogHTMLElement.getBoundingClientRect();

	xDragOffset = pageLocation.left - e.clientX;
	yDragOffset = pageLocation.top - e.clientY;

	dialog.addEventListener("mousemove",DoMouseDrag,false);
	document.addEventListener("mouseup",StopMouseDrag,false);
	}

//do the mouse drag
function DoMouseDrag(e)
	{
	var x = e.clientX + xDragOffset;
    var y = e.clientY + yDragOffset;

    var dialog = document.getElementById('uiDialogHTMLElement');

    var xfinal = x+"px";
	var yfinal = y+"px";
    
	dialog.style.left = xfinal;
	dialog.style.top = yfinal;
	}

function StopMouseDrag()
	{
	document.getElementById('uiDialogHTMLElement').removeEventListener("mousemove",DoMouseDrag,false);
	document.removeEventListener("mouseup",StopMouseDrag,false);
	}

function OnInputTextaraClicked()
	{
	//textarea {
	//font-family: inherit;
	//font-size: inherit;
	//}
	var inputdialog = document.getElementById('dialoginput');
	if(inputdialog != null)
		{
		inputdialog.value = "";
		}
	}

//commits data from the ccleaner section to the ticket
function OnCommitCCLeaner()
	{
	//gather ccleaner data values
	var ccleanerData = "";
	var regFixedValueElement = document.getElementById("regfixValue"); 
	var jfcValueElement = document.getElementById("jfcValue");
	ccleanerData += "Registry Fixes : "+regFixedValueElement.value+ "\n"+
					"Size of junk removed : "+jfcValueElement.value+" ";

	if(document.getElementById("sizeval").checked)
		{
		ccleanerData += "GB";
		}
	else
		{
		ccleanerData += "MB";
		}
	//alert("Posting :"+ccleanerData+" to:Execute CCleaner Tool");
	PostDataToStep(ccleanerData,"Execute CCleaner Tool");
	var ccButton = document.getElementById('commitCCleaner');
	if(ccButton !=null)
		{ccButton.style.background = "green";}
	}

function OnClear()
	{
	var dialogoutputElement = document.getElementById("dialogoutput");
	var dialoginputElement = document.getElementById("dialoginput");
	var maliceValueElement = document.getElementById("maliceValue");
	var jfcValueElement = document.getElementById("jfcValue");
	var imsValueElement = document.getElementById("imsValue");
	var regFixedValueElement = document.getElementById("regfixValue"); 

	regFixedValueElement.value=0;
	dialogoutputElement.value ="";
	dialoginputElement.value="";
	maliceValueElement.value = 0;
	jfcValueElement.value = 0;
	imsValueElement.value = 0;
	}

function OnProcessBegin()
	{
	AnalizeDialogInput();
	}

function OnGeneratePDR()
	{
	//Begin PDR generation.
	var pdr = CreatePDR();
	
	var dialogHtml = "<input id='pdrDialogWindowSaveButton' style='top:5px;left:5px;position:absolute;' type='button' value='Post To Ticket'>";
		dialogHtml +="<textarea id='pdrXvalue' style='top:30px;left:5px;position:absolute;width: 94%;height:80%;'></textarea>";
				
	var pdrDialog = OpenErrorWindow('uiDialogHTMLElement','pdrDialogWindow',dialogHtml,"",'lightblue');
		
		
	var dialogoutputElement = document.getElementById("pdrXvalue");
	dialogoutputElement.value = pdr;
	
	var saveButton = document.getElementById('pdrDialogWindowSaveButton');
		saveButton.addEventListener("click",function(){OnUpdatePDR(pdrDialog);});	
	}

function OnUpdatePDR(dialog)
	{
	var dialogoutputElement = document.getElementById("pdrXvalue");
	if(dialogoutputElement == null)
		{
		console.log("There's no dialog element specified in OnUpdatePDR");
		return;
		}

	var prd = dialogoutputElement.value;
	
	PostDataToStep(prd,"Resolution");
	CloseErrorWindow(dialog.parentElementId,dialog.dialogElement,dialog.buttonElementId);
	}

//identify log by searching for key values.
function CheckLogForKeyValues(inputValue,keyValues)
	{
	var numKeys = keyValues.length;

	var keySearchReturn = -1;
	for(var x=0;x < numKeys;x++)
		{
		keySearchReturn = inputValue.search(keyValues[x]);
		if(keySearchReturn < 0)
			{
			//key not present return false;
			return false;
			}
		}
	return true;
	}

//if this is a HijackThis logfile return true if is else return false
function CheckIfHijackThisLog(inputValue)
	{
	var identifier = "Logfile of Trend Micro HijackThis";
	var identifierPresent = inputValue.search(identifier);
	if(identifierPresent > -1)
		{
		return true;
		}
	return false;
	}

function CompareSysInfo(inputLog, commentDataArray)
	{
	var found = -1;
	for (var x = 0; x < commentDataArray.length;x++)
		{
		if(commentDataArray[x].innerHTML.search("System Name") >=0)
			{
			found = x;
			}
		}

	if(found < 0)
		{
		//none of the data elements contain system info data
		return null;
		}
	
	var isysNameLookup = /System Name+.[a-zA-Z0-9].+/g;
	var ibiosNameLookup = /BIOS Version+.[a-zA-Z0-9].+/g;

	var dsysNameLookup = /System Name+.[a-zA-Z0-9].+/g;
	var dbiosNameLookup = /BIOS Version+.[a-zA-Z0-9].+/g;

	var inputMatchBuffer = isysNameLookup.exec(inputLog);
		inputMatchBuffer += ibiosNameLookup.exec(inputLog);
	
	var ticketMatchBuffer = dsysNameLookup.exec(commentDataArray[found].innerHTML);
		ticketMatchBuffer += dbiosNameLookup.exec(commentDataArray[found].innerHTML);	

	if(ticketMatchBuffer == inputMatchBuffer)
		{
		return true;
		}
	else
		{
		return false;
		}
	}

function AnalizeDialogInput()
	{
	//sync html form values
	var inputLogElement = document.getElementById('dialoginput');
	var inputLog = inputLogElement.value; 			//local var for

	//check for presence of MSINFO32 data
	if(CheckLogForKeyValues(inputLog,new Array("OS Name","Version","System Name","System Directory")))
		{
		//initial pass to see if there's already comment data for this step
		var sopStep = GetStepWithName("System Information");

		//if there's already a sys info step check the data for possible matches
		if(sopStep != null)
			{
			var commentData = EnumStepComments(sopStep);
			//this should never be null.. even "empty" steps should have empty data.
			if(commentData == null)
				{
				console.log("error #1231223456678 : missing comment data on sys info step");
				return;
				}	

			var isMatch = CompareSysInfo(inputLog, commentData);
			if(isMatch == false)
				{
				//there was data found but not matched.. this may not be the same system
				var errorAlert = "MSInfo log mismatch.";

				inputLogElement.value = errorAlert;
				OpenErrorWindow('uiDialogHTMLElement','msInfoErrorWindow','System Info Mismatch','<strong><font color=black>The system information pasted does not match exising system information.<br><br>A new ticket may be required.<br><br>Verify the customer has a multi-device support plan or pitch the appropriate package.</strong></font>','red');
				return;
				}
			if(isMatch == null)
				{
				//there was a system info step but no data in it.. we'll treat this as an append and dump the data
				PostDataToStep(inputLog,"System Information");
				inputLogElement.value = "";
				}
			//if the match was true then we don't need to do anything.. don't post duplicate data into tickets.
			PostDataToStep(inputLog,"System Information");
			inputLogElement.value = "";
			}
		//there wasn't a sys info step so have the post data to step function create one 
		else
			{
			PostDataToStep(inputLog,"System Information");
			inputLogElement.value = "";
			}
		return;
		}
	
	//check for presense of LMI system info
	if(CheckLogForKeyValues(inputLog,new Array('System Information','BIOS Version','Last booted','Computer Name','Interactive User','Device screen')))
		{
		PostDataToStep(inputLog,"System Information");
		inputLogElement.value = "";
		return;
		}

	//hijack this log detected create Colossus entry point form
	if(CheckIfHijackThisLog(inputLog))
		{
		inputLogElement.value = "";
		inputLogElement.value = "The Colossus system under development.\nUnable to process HijackThis logs at this time.\nFollow manual repair process for HijackThis logs.";
		return;
		}
		
	// run Mbam parse method if souce input log identifier key not found
	var parseHeaderRegEx = /Junkware Removal Tool/;
	var regResult = parseHeaderRegEx.exec(inputLog);

	if(regResult !=null)
		{	
		startJrtParse(inputLog);
		}
	else
		{
		startMbam(inputLog);
		}
	inputLogElement.value = "";
	}

function startJrtParse(inputLog)
	{
	var summaryValue = JrtParse(inputLog);

	var incidents = ParseJRTInstances(inputLog);
	var incidentsValue = incidenceFormat(incidents);

	var maliciousElement = document.getElementById("maliceValue");
	maliciousElement.value = (parseInt(maliciousElement.value)|| 0) + incidents.length;

	var dialogoutputElement = document.getElementById("dialogoutput");
	dialogoutputElement.value = summaryValue+"\n"+incidentsValue;

	FillJRTResult(summaryValue,incidentsValue);
	}

//check inputLog for malware bytes log identifiers
// return results -1 = non mbam file, 0 = original format, 1 = updated format
function attemptToIdentifyMBAMLogType(inputLog)
	{
	//init for lookup on 'Malwarebytes Anti-Malware' tag to inentify input Log
	var mbvamLogIdentiferRegExpression = /Malwarebytes Anti-Malware/; //identify as a malware bytes log
	var mbamIdTagResult = mbvamLogIdentiferRegExpression.exec(inputLog);

	//check results for 'Malwarebytes Anti-Malware' tag
	if(mbamIdTagResult != null)
		{
		//identifier found this is a standard malware bytes log
		//need to differentiate log type original / update
		//setup for lookup on 'Scan type'
		mbvamLogIdentiferRegExpression = /Scan type/;
		mbamIdTagResult = mbvamLogIdentiferRegExpression.exec(inputLog);
		if(mbamIdTagResult != null)
			{
			//found original log format identifier
			return MBAM_ORIGINAL;
			}

		//setup for lookup on new log identifier
		mbvamLogIdentiferRegExpression = /Scan Type/;
		mbamIdTagResult = mbvamLogIdentiferRegExpression.exec(inputLog);
		if(mbamIdTagResult != null)
			{
			//found updated log format identifier
			return MBAM_UPDATED;
			}
		}
	else
		{
		//initial lookup failed on 'Malwarebytes Anti-Malware'
		//setup for lookup on 'Radialpoint Malware'
		mbvamLogIdentiferRegExpression = /Radialpoint Malware/;
		mbamIdTagResult = mbvamLogIdentiferRegExpression.exec(inputLog);
		if(mbamIdTagResult != null)
			{
			//identifier found for original malware bytes log format
			return MBAM_ORIGINAL;
			}

		//initial lookup failed on 'Malwarebytes Anti-Malware' and 'RadialPoint Anti-Malware'
		//setup for lookup on 'RadialPoint Anti-Malware'
		mbvamLogIdentiferRegExpression = /RadialPoint Anti-Malware/;
		mbamIdTagResult = mbvamLogIdentiferRegExpression.exec(inputLog);
		if(mbamIdTagResult != null)
			{
			//identifier found for original malware bytes log format
			return MBAM_ORIGINAL;
			}

		}
	//no initial malware tag or log type identifier was not found. return non-mabam result
	return MBAM_UNRECOGNIZED;
	}


//begin processing log as a malware bytes log
function startMbam(inputLog)
	{
	//there are three mbam log formats to parse.. malware bytes standard "older" format , radial point branded "older" format, malware bytes standard "newer" format
	var mbamLogType = attemptToIdentifyMBAMLogType(inputLog);

	if(mbamLogType == MBAM_UNRECOGNIZED)
		{
		alert("This is an unrecognized log type. No action can be performed.");
		return;
		}

	//report storage values
	var sessionValue;			//details about the scan run, date, type, duration
	var summaryValue;			//summary of instances obtained from mbam headers
	var malwareInstancesList;	//array of non-unique malware infection items
	var incidentsValue;			//string representation of unique malware items

	sessionValue = ExtractMbamSessionData(inputLog,mbamLogType);
	malwareInstancesList = ParseMbamIncidents(inputLog, mbamLogType);

	var imsValueElement = document.getElementById("imsValue");

	imsValueElement.value = (parseInt(imsValueElement.value)||0) + malwareInstancesList.length;
	incidentsValue = incidenceFormat(malwareInstancesList);

	if(mbamLogType == MBAM_ORIGINAL)
		{
		summaryValue = ParseOriginalMbamHeader(inputLog);
		}

	if(mbamLogType == MBAM_UPDATED)
		{
		summaryValue = ParseUpdatedMbamHeader(inputLog);
		}

	//put the total result into the visible dialog output value
	var dialogoutputelement = document.getElementById("dialogoutput");

	if(summaryValue == "")
		{
		summaryValue = "No malware detected.";
		}
	if(incidentsValue == "")
		{
		incidentsValue = "No malware instances to remove.";
		}

	dialogoutputelement.value = sessionValue +"\n"+ summaryValue + "\n" + incidentsValue;
	FillMBAMTicketData(sessionValue,summaryValue,incidentsValue);
	}


//parse malware bytes log looking for headers indicated as 'Detected' item lines
function ParseOriginalMbamHeader(inputLog) 
	{
	//regular expression to match items with 'Detected' in the line preceded by alpha values followed by numeric values
	var summary = '';
	var summaryReg = /[a-zA-Z ]+Detected: [0-9]+/g;

	//parse MBAM summary
	var matchS = [];					//work buffer for summaryReg matches in inputLog
	while(true) 
		{
		//perform summaryReg expression match pattern on inputlog and store result in summary string
		matchS = summaryReg.exec(inputLog);
		if(matchS != null) 
			{
			summary += matchS[0] + "\n";
			}
		else
			{
			//no hits 
			break;
			}
		}
	return summary;	
	}

//updated log headers do not share a common identifier. need to search for each valu
function ParseUpdatedMbamHeader(inputLog)
	{
	//regular expression match strings for summary values
	var procRegEx = /Processes: [0-9]+/g;
	var modulesRegEx = /Modules: [0-9]+/g;
	var regKeysRegEx = /Registry Keys: [0-9]+/g;
	var regValRegEx = /Registry Values: [0-9]+/g;
	var regDataRegEx = /Registry Data: [0-9]+/g;
	var foldersRegEx = /Folders: [0-9]+/g;
	var filesRegEx = /Files: [0-9]+/g;
	var pSectorsRegEx = /Physical Sectors: [0-9]+/g;

	var headerSummary ="";
	var matchBuffer;

	//run expression matching and append to return buffer
	matchBuffer = procRegEx.exec(inputLog);
	headerSummary += matchBuffer[0]+"\n";

	matchBuffer = modulesRegEx.exec(inputLog);
	headerSummary += matchBuffer[0]+"\n";

	matchBuffer = regKeysRegEx.exec(inputLog);
	headerSummary += matchBuffer[0]+"\n";

	matchBuffer = regValRegEx.exec(inputLog);
	headerSummary += matchBuffer[0]+"\n";

	matchBuffer = regDataRegEx.exec(inputLog);
	headerSummary += matchBuffer[0]+"\n";

	matchBuffer = foldersRegEx.exec(inputLog);
	headerSummary += matchBuffer[0]+"\n";

	matchBuffer = filesRegEx.exec(inputLog);
	headerSummary += matchBuffer[0]+"\n";

	matchBuffer = pSectorsRegEx.exec(inputLog);
	headerSummary += matchBuffer[0]+"\n";

	return headerSummary;
	}

function ParseMbamIncidents(inputLog,logType) 
	{
	//regular expression to tag on specific instances of infection names
	var instanceRegEx;
	var instanceClarifierRegEx;
	var instanceMatch;
	var instanceSubMatch;

	if(logType == MBAM_ORIGINAL)
		{
		instanceRegEx = /\(([a-zA-z0-9]+\.[a-zA-z0-9\.]+)\)/g; 	
		}

	if(logType == MBAM_UPDATED)
		{
		instanceRegEx = /.*\[[a-zA-Z0-9].+/g;
		}

	var listA = []; 		
	//parse MBAM into infection instance list

	while(true) 
		{
		instanceMatch = instanceRegEx.exec(inputLog);
		if(instanceMatch == null)
			{
			break;
			}

		if(logType == MBAM_ORIGINAL)
			{
			if(instanceMatch != null && arrayExists(listA,instanceMatch[1]) < 0 && isWhiteListed(instanceMatch[1]) == false ) 
				{
				listA.push(instanceMatch[1]);
				}
			}

		if(logType == MBAM_UPDATED)
			{
			instanceSubMatch = instanceMatch[0].split(",");
			if(instanceSubMatch[0].length < 60)
				{
				if((arrayExists(listA,instanceSubMatch[0]) < 0) && (isWhiteListed(instanceSubMatch[0]) == false ))
					{
					listA.push(instanceSubMatch[0]);
					}
				}
			}
		}
	listA.sort();
	return listA;	
	}

//basic session data extraction via copy/paste code running series of simple regular expression searches

//basic session data extraction via copy/paste code running series of simple regular expression searches
function ExtractMbamSessionData(inputLog,logType)
	{
	var typeRegEx;
	var objectsRegEx;
	var elapsedRegEx;
	var dateRegEx;
	var timeRegEx;

	var returnBuffer ="";
	var matchS;

	if(logType == MBAM_ORIGINAL)
		{
		//data and time are on the same line the entire result should appear in the log
		dateRegEx = /.*[0-9]\/+.+/g;
		typeRegEx = /Scan type:+.+/g;
		objectsRegEx = /Objects scanned:+.+/g;
		elapsedRegEx = /Time elapsed:+.+/g;
		}

	if(logType == MBAM_UPDATED)
		{
		//date and time are split onto two lines in the updated format.
		//sloth law dictates that we drop the time element and keep the date
		dateRegEx = /.*[0-9]\/+.+/g;
		typeRegEx = /Scan Type:+.+/g;
		objectsRegEx = /Objects Scanned:+.+/g;
		elapsedRegEx = /Time Elapsed:+.+/g;
		}
	
	//run expression matching and append to return buffer
	matchS = null;
	matchS = dateRegEx.exec(inputLog);
	if(matchS !=null)
		{
		returnBuffer += matchS[0]+"\n";
		}
	else
		{
		returnBuffer += "No Date Specified In Log\n";
		}

	matchS = typeRegEx.exec(inputLog);
	returnBuffer += matchS[0]+"\n";
	
	matchS = objectsRegEx.exec(inputLog);
	returnBuffer += matchS[0]+"\n";	
	
	matchS = elapsedRegEx.exec(inputLog);
	returnBuffer += matchS[0]+"\n";

	return returnBuffer;
	}

function isWhiteListed(infection) 
	{ 
	//whitelist so we don't pick up things that are difficult to avoid with the regex
	// while this may not be the most eloquent solution, only checking these when we HAVE to should cut down on overhead.
	var whiteList = [];
	whiteList[0] = 'explore.exe'; 
	whiteList[1] = 'firefox.exe';
	whiteList[2] = "www.google.com";
	whiteList[3] = "google.com";
	
	
	for(i = 0; i < whiteList.length; i++) 
		{
		if(whiteList[i].toLowerCase() == infection.toLowerCase()) 
			{
			return true;
			}
		}
	return false;
	}

function incidenceFormat(listA)
	{
	//format the infection instance based on form input
	var incidenceString ="";
	for(var i = 0; i < listA.length; i++)
		{
		incidenceString += listA[i] + "\n";
		}
	return incidenceString;
	}

function arrayExists(testA, testS) 
	{
	for(var i = 0; i < testA.length; i++) 
		{
		if(testA[i].toLowerCase() == testS.toLowerCase()) 
			{
			return i;
			}
		}
	return -1;
	}

function GetTimeDelay()
	{
	var d = new Date();
	var n = d.getTime();
	return n;
	}

function CreatePDR()
	{
	var imsValueElement = document.getElementById("imsValue");
	var jfcValueElement = document.getElementById("jfcValue");
	var maliceValueElement = document.getElementById("maliceValue");

	var cxPDR = subreplace(pdrs[0],"#imsValue#",imsValueElement.value);
	cxPDR = subreplace(cxPDR,"#jfcValue#",jfcValueElement.value);
	cxPDR = subreplace(cxPDR,"#maliceValue#",maliceValueElement.value);	
	cxPDR = subreplace(cxPDR,"#cxname#",GetTicketCxName());

	var numMalice = parseInt(imsValueElement.value)||0;
	if(numMalice ==1)
		{
		cxPDR = subreplace(cxPDR,"#malInstance#","instance");
		}
	else
		{		
		cxPDR = subreplace(cxPDR,"#malInstance#","instances");
		}
	
	var numMalware = parseInt(maliceValueElement.value)||0;
	if(numMalware == 1)
		{		
		cxPDR = subreplace(cxPDR,"#malProgs#","program");		
		}
	else
		{
		cxPDR = subreplace(cxPDR,"#malProgs#","programs");
		}
	
	var sessionEnd = GetTicketCampaign();
	if (sessionEnd >-1)
		{
		cxPDR+=hrCampaignConnector[sessionEnd];
		}
			
	if(document.getElementById("sizeval").checked)
		{
		cxPDR = subreplace(cxPDR,"#sizeValueIndicator#","GB");		
		}
	else
		{
		cxPDR = subreplace(cxPDR,"#sizeValueIndicator#","MB");		
		}

	return cxPDR;
	}

function GetTicketCampaign()
	{
	var campaign = document.getElementsByClassName("partner_name");
	if(campaign != null)
		{
		var ticketCampaign = campaign[0].innerHTML;
		return ConvertTicketToHRCampaign(ticketCampaign);		
		}
	return -1;
	}

function ConvertTicketToHRCampaign(campaignString)
	{
	var hrcampaignvalue;
	for(var x=0;x<campaigns.length;x++)
		{
		if(campaigns[x] == campaignString)
			{
			return x;
			}
		}
	return -1;
	}

function GetTicketCxName()
	{
	//example : for FIRSTNAME LASTNAME
	var customer= document.getElementsByClassName("customerName");
	var retName ="";
	if(customer!= null)
		{
		var cxTicketName = customer[0].innerHTML;
		var splitName = cxTicketName.split(" ");
		
		for(var x = 1; x < splitName.length; x++)
			{
			retName += splitName[x].charAt(0).toUpperCase() + splitName[x].slice(1).toLowerCase();
			if(x < splitName.length-1)
				{
				retName +=" ";
				}
			}
		return retName;
		}
	return "[undeturmined customer]";
	}

function subreplace(source, find,replace)
	{
	return source.replace(new RegExp(escapeRegExp(find), 'g'), replace);
	}

function escapeRegExp(string) 
	{
    return string.replace(/([.*+?^=!:${}()|\[\]\/\\])/g, "\\$1");
	}

//depreciated
function EnumerateSOPSteps()
	{
	var elems = document.getElementsByClassName('steps');
	for(var i = 0; i < elems.length; i++) 
		{
    	alert(elems[i].style);
		}
	}

var pdrs = [];
var campaigns=[];
var hrCampaign=[];
var hrCampaignConnector=[];
////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//             
//	PREDEFINED RESPONSE DEFINITIONS
//	A PDR is split into two distinct parts.. The service session notes and the session's campaign closing
//	Modify pdrs values to reflect changes in the service session notes of a PDR
//	Modify campaigns,hrCampaign,hrCampaignConnector,hrCampaignConnector values to reflect changes or additions of session campaign close
//  

// ------>>>>>>>>>>>> Service session notes <<<<<<<<<<<<<<-------------
//These replacement tokens : #imsValue# #jfcValue# #maliceValue# #cxname#
//#malProgs# = program / programs
//#malInstance# = instance / instances
//allow known values to be inserted within the PDR text.
pdrs[0]="Great news #cxname#, we are finished working on your system today!\n\n"
pdrs[0]+="While your computer was being serviced we removed #maliceValue# malicious #malProgs#, along with #jfcValue# #sizeValueIndicator# of junk files and cleaned out #imsValue# #malInstance# of malware.";
pdrs[0]+=" We also made sure your operating system is up to date along with your antivirus.\n\n";

pdrs[0]+="Please let us know how we're doing by filling out our survey when you close this chat window and rate our performance.";
pdrs[0]+=" We really appreciate your input, and are always striving to improve!\n\n";

// ------>>>>>>>>>>>> Session Campaign Close <<<<<<<<<<<<<<-------------

campaigns[0] = "Windstream";	
	hrCampaign[0]="Windstream Tech Help";			
	hrCampaignConnector[0]="If you need to get in touch with us, please open the 'Windstream Service Agent' and click 'My Services' at the top and then click 'Get Help Now'.\n\n";
	hrCampaignConnector[0]+="Thank you for choosing Windstream TechHelp.";

campaigns[1] = "WindstreamNbb";	
	hrCampaign[1]="Windstream Tech Help";			
	hrCampaignConnector[1]="If you need to get in touch with us, please open the 'Windstream Service Agent' and click the 'Live Help' button.\n\n";
	hrCampaignConnector[1]+="Thank you for choosing Windstream TechHelp.";

campaigns[2] = "Virgin Media";	
	hrCampaign[2]="Virgin Media";			
	hrCampaignConnector[2]="If you need to get in touch with us, please open the 'Digital Home Support Hub' and click the 'Live Online Chat' button.\n\n";
	hrCampaignConnector[2]+="Thank you for choosing Virgin Media.";

campaigns[3] = "SquareTrade";	
	hrCampaign[3]="Square Trade Tech Support";		
	hrCampaignConnector[3]="If you need to get in touch with us, please call 1-877-WARRANTY that's 1-877-927-7268.\n\n";
	hrCampaignConnector[3]+="Thank you for choosing Square Trade Tech Support.";

campaigns[4] = "TELUS";			
	hrCampaign[4]="Telus Tech Support Plus";		
	hrCampaignConnector[4]="If you need to get in touch with us, please open the 'TELUS Service Agent' and click the 'Live Help' button.\n\n";
	hrCampaignConnector[4]+="Thank you for choosing Telus Tech Support Plus.";

campaigns[5] = "Eastlink";		
	hrCampaign[5]="Eastlink Beyond Tech Support";	
	hrCampaignConnector[5]="If you need to get in touch with us, please open the 'Eastlink Beyond Tech Support Agent' and click the 'Live Help' button.\n\n";
	hrCampaignConnector[5]+="Thank you for choosing Eastlink Beyond Tech Support.";



//////////////////////////////
//JRT Log parser routines start

function JrtParse(inputLog)
	{
	//summaries for jrt logs need to be iterated manually. each [] entry should generate an up tick on that item
	//mbam logs are simpler a singe list works... jrt requires a dual linked array structure so sorting is non-trivial
	//parse each entry with a [*******]tag
	//if in list increment
	//if not in list add to list
	
	
	var summary = '';
	var summaryReg = /\[+[a-zA-Z ]+\]+/g;
		
	//parse JRT summary
	var counter = 0;
	var matchS = [];					//work buffer for summaryReg matches in inputLog
	var summaryList =[];
	var summaryCount = [];
	var arrayPos ;	
	
	//form JRT summary
	while(true) 
		{
		//perform summaryReg expression match pattern on inputlog and store result in summary string
		matchS = summaryReg.exec(inputLog);
		if(matchS != null) 
			{
			arrayPos = arrayExists(summaryList,matchS[0]);
			
			if(arrayPos < 0)
				{
				//tag not present add to lists
				summaryList.push(matchS[0]);
				summaryCount.push(1);
				}
			else
				{
				//present increment instance
				summaryCount[arrayPos] += 1;
				}		
			}
		else
			{
			break;
			}
		}
	finalFormat = "";
	for(var i = 0; i < summaryList.length; i++)
		{
		finalFormat += "- " + summaryList[i] +" : "+ summaryCount[i]+"\n";
		}
 	return (finalFormat);
	}

function ParseJRTInstances(inputLog)
	{	
	summaryReg = /\[Folder\]+.+/g;
	//clear buffer variables
	var secondaryReg = /\\+[a-z\-\_0-9\.A-Z ]+\"/; //"
	
	
	var insideMatch;
	summaryList =[];  //clear summary list buffer
	var strippedMatch = "";
		
	while(true) 
		{		
		//perform summaryReg expression match pattern on inputlog and store result in summary string
		matchS = summaryReg.exec(inputLog);
		if(matchS != null) 
			{
			insideMatch = secondaryReg.exec(matchS[0]);
			if(insideMatch !=null)
				{
				strippedMatch = insideMatch[0];
				strippedMatch = strippedMatch.substr(1,strippedMatch.length-2);
				arrayPos = arrayExists(summaryList,strippedMatch);
				if(arrayPos < 0)
					{
					//tag not present add to lists
					summaryList.push(strippedMatch);
					}
				}
			}
		else
			{
			//end of results
			break;
			}
		}
	summaryList.sort();	
	return summaryList;	
	}
//////////////////////////////
//JRT Log parser routines end

//////////////////////////
//ticket step enum
var currentSopStepNames;
var sopStepTopElements;

//timer tick duration
var asyncUpdateRate = 0.1;	//tick duration in seconds per tick
var asyncTimeoutRate = 40;	//timeout after this many ticks
var stepWaitCounter = 0;	//state variable for number of times we've cycled waiting for server data to populate steps.

//start the enumeration of ticket steps.. if there's no steps wait for server to populate steps
function StartEnumTicketSOPSteps()
	{
	//clear the currently cached sop step arrays
	currentSopStepNames = [];
	sopStepTopElements = [];		

	//if there's steps in the dom start enumeration immediately
	var enumSteps = AreTicketStepsPresent();

	if(!enumSteps)
		{
		OpenSOPSteps();
		}
 	stepWaitCounter = 0;
	WaitForStepsToPopulate(1);
	}

//this function is to be called just before we ask the server to add a new step
//we can count the ones we've already got and poll till the new one comes in
function StepAddedResync()
	{
	var elements = document.getElementsByClassName('stepName');
	if(elements !=null)
		{
 		stepWaitCounter = 0;
		WaitForStepsToPopulate(elements.length);
		}
	}

//check to see if the ticket steps have been loaded into the dom from the server
//the presense of more steps available than we thought were available indicates a server update
function AreTicketStepsPresent()
	{
	var stepsElements = document.getElementsByClassName('steps');
	var stepElementsFound = stepsElements.length;	

	if(stepElementsFound < 1)
		{
		return false;
		}
	return true;
	}

function AreNewTicketStepsAvailable(currentNumberOfSteps)
	{
	var elements = document.getElementsByClassName('stepName');
	if (elements != null)
		{
		var stepElementsFound = elements.length;
		if(stepElementsFound > currentNumberOfSteps)
			{
			return true;
			}
		}
	return false;
	}

/////////
//wait for steps element to populate
function WaitForStepsToPopulate(currentNumSteps)
	{
	//test for timeout period	
	if(stepWaitCounter > asyncTimeoutRate)
		{
		alert("User Notification #10001 : Server failed to respond while waiting for ticket steps to populate. "+
 				"Please notify support if this error happens frequently otherwise retry the operation or refresh the source page");
		return;
		}
	//this should be a check to see if ticket steps has increased beyond what we knew
	var stepsAvailable = AreNewTicketStepsAvailable(currentNumSteps);
	if(stepsAvailable)
		{
		EnumTicketSOPSteps();
		}
	else
		{
		stepWaitCounter++;
		setTimeout(function (){WaitForStepsToPopulate(currentNumSteps);},asyncUpdateRate*1000);
		}
	}

//trigger the steps to open
function OpenSOPSteps()
	{
	//locate the dom object that triggers a step load from the server
	//valid steps should be a child of "SOPs tabWrapper"

	var SOPwrapper = document.getElementsByClassName('SOPs tabWrapper');
	if(SOPwrapper.length < 1)
		{
		alert('Error 654321 : No sop steps found');
		return;
		}

	//the first element found should represent the most recent SOP step.
	var openContainerElement = SOPwrapper[0].getElementsByClassName('view_sop tab_link close_tab_container');
	//click it
	SimulateClick(openContainerElement[0]);
	}

//cache page element steps
function EnumTicketSOPSteps()
	{
	var elements = document.getElementsByClassName('stepName');
	var numElements = elements.length;

	currentSopStepNames = [];
	sopStepTopElements = [];

	//the actual parent step element is two levels up.. we need the parent of the parent of this element to point at the sop step "top" in the hierarchy
	var topParents;
	for(var i=0; i < numElements; i++)
		{
		//cache the step names
		currentSopStepNames.push(elements[i].innerHTML);

		topParent = GetTopSOPElement(elements[i]);
		sopStepTopElements.push(topParent);
		}
	//debug 
	if(uiDialogHTMLElement == null)
		{
		CreateHtmlDialog();
		}
	else
		{
		ShowInTicketDialog();
		}
	}

////////////////////////////
function DisplayStepInfo()
	{
	if((AreTicketStepsPresent())&&(sopStepTopElements != null))
		{
		var numsteps = sopStepTopElements.length;
		var output = "";
		for (var x=0; x < numsteps;x++)
			{
			output += "Step #"+(x+1)+" "+currentSopStepNames[x] +"\n\r";
			}
		alert(output);
		}
	else
		{
		alert("Error #123455 : No current steps information has been loaded.");
		}
	}

////////////////////////
//General page routines
function SimulateClick(element)
	{
	//this needs to be tested under Chrome and FF extensively
	element.click();

	//alert("Creating mouse event");
	//var mousedEvent = new MouseEvent('click', {'view': window,'bubbles': true,'cancelable': true});
	//alert("Mouse event formed sent");
  	//var canceled = !element.dispatchEvent(mousedEvent);
  	//alert("Mouse click sent");

	}

function GetSubmitCommnetElement(parentelement)
	{
	var commentSubmit = parentelement.querySelectorAll("a");
	if(commentSubmit.length >0)
		{
		//roll through any anchor elements match "button CommentButton" if found return that if not error out.
		for(var x=0;x < commentSubmit.length;x++)
			{
			if(commentSubmit[x].className == "button commentButton")
				{
				return commentSubmit[x];
				}
			}		
		}
	alert("Error #111003 : No comment submit element found in this step:"+parentelement.className);
	return null;
	}

//harvnote : This should get the content of the sop commnet data entered by the technician
//search the SOP step for the "activity_content comment" class which contains the comment data.
//this will return an array of elements containing the text values of the comment data for this step if any.
function EnumStepComments(parentelement)
	{
	//get a list of all the content comments associated with this sop step.
	var sopContentData = parentelement.getElementsByClassName("activity_content comment");
	var commentData = [];

	if(sopContentData != null)
		{
		if(sopContentData.length > 0)
			{
			for(var x =0; x < sopContentData.length; x++)
				{
				commentData.push(sopContentData[x]);
				}
			return commentData;
			}
		}
	alert("Error #111003.1 : No comment submit element found in this step:"+parentelement.className);
	return null;
	}


//search for all textarea elements conatined in this steps hierarchy.
function GetCommentElement(parentelement)
	{
	//the first text area should be the comment box for this step's form
	var commentElement = parentelement.querySelectorAll("textarea");
	if(commentElement == null)
		{
		alert("Error #111002 : No comment element found in this step:"+parentelement.className);
		return null;
		}
	
	if(commentElement[0].name == "comment")
		{
		return commentElement[0];
		}

	alert("Error #111003 : No comment element found in this step:"+parentelement.className);
	return null;
	}

////////////////////////////////////////
function GetSubmitCommnetElement(parentelement)
	{
	var commentSubmit = parentelement.querySelectorAll("a");
	if(commentSubmit.length >0)
		{
		//roll through any anchor elements match "button CommentButton" if found return that if not error out.
		for(var x=0;x < commentSubmit.length;x++)
			{
			if(commentSubmit[x].className == "button commentButton")
				{
				return commentSubmit[x];
				}
			}		
		}
	alert("Error #1110054 : No comment submit element found in this step:"+parentelement.className);
	return null;
	}

//search for all textarea elements conatined in this steps hierarchy.
function GetCommentElement(parentelement)
	{
	//the first text area should be the comment box for this step's form
	var commentElement = parentelement.querySelectorAll("textarea");
	if(commentElement == null)
		{
		alert("Error #111002 : No comment element found in this step:"+parentelement.className);
		return null;
		}

	if(commentElement[0] == null)
		{
		alert("Unable to process request. Ensure that the ticket is in an OPEN state.");
		return null;
		}
	
	if(commentElement[0].name == "comment")
		{
		return commentElement[0];
		}

	alert("Error #111003 : No comment element found in this step:"+parentelement.className);
	return null;
	}

//the element identification is two levels too low
//the parent of the parent is the true Top of this SOP step
function GetTopSOPElement(element)
	{
	var SOPparent = element.parentNode;
	if(SOPparent != null)
		{
		//there's a vaild parent (as there should be) get it's parent
		SOPparent = SOPparent.parentNode;
		if(SOPparent != null)
			{
			return SOPparent;
			}
		}
	return null;
	}

function TriggerAddCustomStep(stepName,stepData)
	{
	//
	var CustomStepFormElement = null;

	//find span 'addCustomStep' clickable element
	var addCustomStepElement = document.getElementsByClassName("addCustomStep");
	if(addCustomStepElement.length == 1)
		{
		SimulateClick(addCustomStepElement[0]);
		}
	else
		{
		alert("Error #10299 : Multiple addCustomStep custom steps returned.");
		return;
		}

	//locate form 'customStepFormContainer'
	var CustomStepDialog = document.getElementsByClassName("customStepFormContainer");
	if(CustomStepDialog.length ==1)
		{
		CustomStepFormElement = CustomStepDialog[0];
		}
	else
		{
		alert("Error #10399 : Multiple customStepFormContainer form returned.");
		return;
		}

	//locate form element (input name="step_name")
	//this contains the page element that will receive the name of the step we're adding
	var StepNameElements = CustomStepFormElement.querySelectorAll("input");

	//iterate over StepNameElements looking for name="step_name"
	for (var x=0; x < StepNameElements.length;x++)
		{
		if(StepNameElements[x].name == "step_name")
			{
			//fill stepname with the name of the step
			StepNameElements[x].value = stepName;
			}
		}

	//locate textarea name = comment
	var stepComment = GetCommentElement(CustomStepFormElement);

	//fill comment with comment data
	stepComment.innerHTML = stepData;

	//locate create_step button
	var formAnchorButtons = CustomStepFormElement.querySelectorAll("a");0
	var createButton = null;
	//iterate over the step anchors looking for class="create_step button"
	for(x=0;x < formAnchorButtons.length;x++)
		{
		if (formAnchorButtons[x].className == "create_step button")
			{
			createButton = formAnchorButtons[x];
			}
		}
	
	if(createButton != null)
		{
		//adding new steps requires that we start the poll for new elements
		StepAddedResync();
		//start the server request to add this new step
		SimulateClick(createButton);
		}
	else
		{
		alert("Error #111091 : No create_step button element found.\n Refresh page if error persists notify support.");
		}
	}

function PostDataToStep(data,stepName)
	{
	var stepElement = GetStepWithName(stepName);

	//if there's no current step add a custom step for this data.
	if(stepElement == null)
		{
		TriggerAddCustomStep(stepName,data);
		}
	else
		{
		//harv note: if there's already a step with this name and there's already recognized data offer agent choice of 
		//overwrite,append,cancel before we update.
		//come to think of it 
	
		var rmsCommentField = GetCommentElement(stepElement);
		rmsCommentField.value = data;

		var addCommentButton = GetSubmitCommnetElement(stepElement);
		//click the element to add the comment button
		SimulateClick(addCommentButton);
		}
	}

//post JRT data to ticket
//summary values go in the custom JRT Step
//instance values go in the Remove Harmful Software step
function FillJRTResult(summary,instances)
	{
	//Harv note:
	//doing this is bad when there's a touch of lag on the server.
	//while the production server works the test simulant page does not.
	//investigate need to introduce a delay between posts.
	PostDataToStep(instances,"Remove Harmful Software");
	PostDataToStep(summary,"Execute Junkware Removal Tool");
	}

//Post MBAM to ticket

function FillMBAMTicketData(session,summary,instances)
	{
	PostDataToStep(session+"\n"+summary+"\n\n"+instances,"Execute Malwarebytes");
	}

//enumerate steps.. find first occurance of stepname and return that
//if not found return null
function GetStepWithName(stepname)
	{
	if(sopStepTopElements != null)
		{
		var numsteps = sopStepTopElements.length;
		for (var x=0; x < numsteps;x++)
			{
			//find if stepname matches this step name
			if(currentSopStepNames[x].search(stepname) >= 0) 
				{
				return sopStepTopElements[x];
				}
			}
		}
	return null;
	}

//get ticket number from non-named H1 element
function GetTicketNumer()
	{
	//harv note: this code is currently being abused as a way to limit the button to ticket pages only
	//all of these values should be checked and if they don't match the pattern gracefully return 
	//right now if it doesn't match you'll end up with an ugly "undefined" as the ticket number.
	var customer = document.getElementsByClassName("customerName");
	if(customer == null)
		{
		return null;
		}

	if(customer[0] == null)
		{
		return null;
		}

	var ticketNumElement = customer[0].parentNode;

	
	if(ticketNumElement == null)
		{
		return null;
		}
	var headerContent = ticketNumElement.innerHTML;
	if(headerContent == null)
		{
		return null;
		}
	var ticketValues = headerContent.split ("<");
	var ticketNumVals = ticketValues[0].split ("#");
	ticketNumValue = ticketNumVals[1];
	return ticketNumValue;
	}
	
function CloseErrorWindow(element,targetElement,buttonElement)
	{	
	//remove the close button event listener
	document.getElementById(buttonElement).removeEventListener("click", function(){CloseErrorWindow(element,childElement,buttonElement);});
	
	if(targetElement == null)
		{
		return;
		}
	var targetParent = targetElement.parentNode;
	
	//remove the error window from the DOM
	targetParent.removeChild(targetElement);
	}

function OpenErrorWindow(element,childElement,title,caption,bgColor)
	{
	//already a window of this type open
	if(document.getElementById(childElement))
		{
		return;
		}

	var parentElement = document.getElementById(element);
	//there was no parent object specified
	if(parentElement == null)
		{
		return;
		}
		
	var errorDiv = document.createElement("div");
	var buttonElement = element+childElement;
	
	errorDiv.id = childElement;
	errorDiv.align = "right";
	errorDiv.style.width = "80%";
	errorDiv.style.height = "70%";
	errorDiv.style.background = bgColor;
	errorDiv.style.padding="5px 5px 5px 5px";
	errorDiv.style.top ="90px";
	errorDiv.style.left ="10px";
	errorDiv.style.position="absolute";		
	errorDiv.style.border = "5px solid black";
	errorDiv.style.MozBorderRadius  = "8px";
	errorDiv.style.WebkitBorderRadius = "8px";
	errorDiv.style.borderRadius = "8px";	
	
	errorDiv.innerHTML = "<input id='"+buttonElement+"' type=button value='x'>"+
		"<center>"+
		"<br><br><br><br>"+
		"<b><big><big>"+title+"</b><br><br>"+caption+
		"</big></big></center>"+
		"</div>	";
	parentElement.appendChild(errorDiv);
	document.getElementById(buttonElement).addEventListener("click",function(){CloseErrorWindow(element,errorDiv,buttonElement);});

	var returnDialog = new DialogWindow();
		returnDialog.dialogElement = errorDiv;
		returnDialog.parentElementId = element;
		returnDialog.buttonElementId = buttonElement;

	return returnDialog;
	}	