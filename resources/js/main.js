const houseURL = 'https://api.propublica.org/congress/v1/116/house/members.json';
const senateURL = 'https://api.propublica.org/congress/v1/116/senate/members.json';

if (window.location.pathname.includes('senate')) {
    getData(senateURL)
} else {
    getData(houseURL)
}

async function getData(url) {
    showElements('loading-table', false);
    showElements('loading', true);

    members = await fetch(url, {
        method: 'GET',
        headers: new Headers({
            'X-API-key': 'lInV5I6hRtQYoAo646WWENy4wLLctGu3dRMM7mSt'
        })
    })
    .then(response => response.json())
    .then(data => data.results[0].members)
    .catch(err => console.error(err))

    showElements('loading-table', true);
    showElements('loading', false);
    
    if (window.location.pathname.includes("attendance")) { 
        calculatePartyMembers(members)
        createEngagedData(members)
        
        leastEngagedMembers = sortMembersLeastEngaged('missed_votes_pct')
        tenPctleastEngagedMembers = sliceTenPct(leastEngagedMembers)
        mostEngagedMembers = sortMembersMostEngaged('missed_votes_pct')
        tenPctMostEngagedMembers = sliceTenPct(mostEngagedMembers)
    
        buildTablesLoyal(tenPctleastEngagedMembers,"table_missed_votes", "missed_votes","missed_votes_pct")
        buildTablesLoyal(tenPctMostEngagedMembers,"table_non_missed_votes", "missed_votes","missed_votes_pct")
    
    } else if (window.location.pathname.includes("loyalty")) {
        createEngagedData(members)
        calculatePartyMembers(members)
    
        leastLoyalMembers = sortMembersMostEngaged('votes_with_party_pct');
        tenPctLeastLoyalMembers = sliceTenPct(leastLoyalMembers);
        mostLoyalMembers = sortMembersLeastEngaged('votes_with_party_pct');
        tenPctMostLoyalMembers = sliceTenPct(mostLoyalMembers);
    
        buildTablesLoyal(tenPctLeastLoyalMembers,"table_least_loyal", "total_votes","votes_with_party_pct")
        buildTablesLoyal(tenPctMostLoyalMembers,"table_most_loyal","total_votes","votes_with_party_pct")
    } else {
        loadDynamicTable(members)
        createStates();
        selectedCheckboxByParty=document.getElementsByClassName("checkbox_by_party");
        for (checkbox of selectedCheckboxByParty) {
            checkbox.addEventListener("click", filterMembers);
        }
        // my variable for the state filter
        selectorValue = document.getElementById("state-selector")
        // my loop for state checkbox
        selectorValue.addEventListener("change", filterMembers);
    }
}

function calculatePartyMembers(members) {
    let numberOfDemocrats = 0;
    let numberOfRepublicants = 0;
    let numberOfIndependants = 0;
    let numberOfMembers = 0;
    let averageOfDemocrats = 0;
    let averageOfRepublicans = 0;
    let averageOfIndependents =0;
    let averageOfMembers = 0;
    for (let member of members) {
        let memberByParty = member.party;
        let memberVotesPercentage = member.votes_with_party_pct;
        if (memberVotesPercentage) {
            if (memberByParty == "D") {
               numberOfDemocrats++;
               averageOfDemocrats += Number(memberVotesPercentage)
            }
            else if (memberByParty=="R") {
               numberOfRepublicants++
               averageOfRepublicans += Number(memberVotesPercentage)
            }
            else {
              numberOfIndependants++;
              averageOfIndependents += Number(memberVotesPercentage)
            }    
        numberOfMembers++; 
        averageOfMembers += Number(memberVotesPercentage);
        }
    }
    let intAverageOfDemocrats = Math.round(averageOfDemocrats/numberOfDemocrats);
    let intAverageOfRepublicans = Math.round(averageOfRepublicans/numberOfRepublicants);
    let intAverageOfIndependents = Math.round(averageOfIndependents/numberOfIndependants);
    let intAverageOfMembers = Math.round(averageOfMembers/numberOfMembers);
    document.getElementById("number_of_democrats").innerHTML = numberOfDemocrats;
    document.getElementById("number_of_republicans").innerHTML = numberOfRepublicants;
    document.getElementById("number_of_independents").innerHTML = numberOfIndependants;
    document.getElementById("number_of_representatives").innerHTML = numberOfMembers;
    document.getElementById("democrats_w_party").innerHTML = intAverageOfDemocrats;
    document.getElementById("republicans_w_party").innerHTML = intAverageOfRepublicans;
    document.getElementById("independents_votes").innerHTML = intAverageOfIndependents;
    document.getElementById("representatives_w_party").innerHTML = intAverageOfMembers;
}

function loadDynamicTable(members) {
    const tableBody = document.getElementById("table_data");
    if(tableBody){
        let dataHTML = "";
        for (let member of members) {

            let fullName= `${member.first_name} ${member.middle_name} ${member.last_name}`
            if (member.middle_name == null) {
              fullName = `${member.first_name} ${member.last_name}`
            }
            dataHTML += `
            <tr>
                <td>
                    <a href="${member.url}" target="_blank">${fullName}</a>
                </td>
                <td>${member.party}</td>
                <td>${member.state}</td>
                <td>${member.seniority}</td>
                <td>${member.votes_with_party_pct}</td>
            </tr>`; 
        }
        tableBody.innerHTML = dataHTML
    }
}

function createEngagedData(members) {
    for (let member of members) {
        let fullName= `${member.first_name} ${member.middle_name} ${member.last_name}`
            if (member.middle_name == null) {
              fullName = `${member.first_name} ${member.last_name}`
            }
        let missedVotesPercentage=member.missed_votes_pct;
        let missedVotes=member.missed_votes;
        let sortedArray = [fullName, missedVotes, missedVotesPercentage];
    }
}

function sortMembersLeastEngaged(value) {
    let sortedArray = members.sort(function(a, b) {
        return b[value] - a[value];
    });
    return sortedArray;
}

function sortMembersMostEngaged(value) {
    let sortedArray = members.sort(function(a, b) {
        return a[value] - b[value];
    });
    return sortedArray;
}

function sliceTenPct(array) {
    let tenPctOfArray = array.length * 0.1;
    return array.slice(0, tenPctOfArray);
}

function buildTablesMissedVotes() {
    const tableBody = document.getElementById('table_missed_votes')
    if(tableBody){
        let dataTable="";
        for (member of tenPctleastEngagedMembers) {
        let fullNameVotes= `${member.first_name} ${member.middle_name} ${member.last_name}`
            if (member.middle_name == null) {
                fullNameVotes = `${member.first_name} ${member.last_name}`
            }
        dataTable +=`
            <tr>
                <td>${fullNameVotes}</td>
                <td>${member.missed_votes}</td>
                <td>${member.missed_votes_pct}</td>
            </tr>`;
        }
        tableBody.innerHTML = dataTable
    }   
}

function buildTablesNonMissedVotes() {
    const tableBody = document.getElementById('table_non_missed_votes')
    if(tableBody){
        let dataTable="";
        for (member of tenPctMostEngagedMembers) {
        let fullNameVotes= `${member.first_name} ${member.middle_name} ${member.last_name}`
            if (member.middle_name == null) {
                fullNameVotes = `${member.first_name} ${member.last_name}`
            }
        dataTable +=`
            <tr>
                <td>${fullNameVotes}</td>
                <td>${member.missed_votes}</td>
                <td>${member.missed_votes_pct}</td>
            </tr>`;
        }
        tableBody.innerHTML = dataTable
    }
   
}

function buildTablesLoyal(members, tableId, totalKey, averageKey) {
    const tableBody = document.getElementById(tableId)
    if(tableBody){
        let dataTable="";
        for (member of members) {
        let fullNameVotes= `${member.first_name} ${member.middle_name} ${member.last_name}`
        if (member.middle_name == null) {
            fullNameVotes = `${member.first_name} ${member.last_name}`
        }

        dataTable +=`
            <tr>
                <td>${fullNameVotes}</td>
                <td>${member[totalKey]}</td>
                <td>${member[averageKey]}</td>
            </tr>`;
        }
        tableBody.innerHTML = dataTable
    } 
}

function createStates() {
    let stateOptions =[];
    for (member of members) {
        stateOptions.push(member.state)
    }
    stateOptions = Array.from(new Set(stateOptions))
    stateOptions = stateOptions.sort()
    let optionDropdown = stateOptions;
    let selectDropdow = document.getElementById("state-selector");
        for (selectOption in optionDropdown){
            selectDropdow.add(new Option (optionDropdown[selectOption]));
    }
}

function filterMembers(){
    //gets value for checkboxes
    let checkboxes = Array.from(document.querySelectorAll("input[type=checkbox]:checked"));
    let selectedParties = []
    for (checkbox of checkboxes) {
        selectedParties.push(checkbox.value)
    }
    console.log(selectedParties)
    
    //creates the options for the select
    //createStates()=document.getElementById("states").innerHTML
    let selector = document.getElementById("state-selector");
    let selectorValue = selector.value;
    

    //filter my data
    
    //let listOptionState = createStates();
    //    if (listOptionState=document.getElementById("state-selector")) {
    //        listOptionState.insertAdjacentHTML("afterend", listOptionState)
    //    }
    let filteredParty = [];
    for (member of members) {
        let memberState = member.state
        let memberParty = member.party
        if (memberState == selectorValue || selectorValue == "all") {
           if (selectedParties.includes(memberParty)) {
            filteredParty.push(member)
            }
        }
    }
    loadDynamicTable(filteredParty)
}
// create the loader
function onReady(callback) {
    var intervalId = window.setInterval(checkReady, 1000);
    function checkReady(){
        if(document.getElementsByTagName("tbody")[0] !== undefined) {
            window.clearInterval(intervalId);
            callback.call(this);
        }
    }
}  
function showElements(className, value) {
    for (el of document.getElementsByClassName(className)) {
        console.log(el);
        
        el.style.display = value ? 'flex' : 'none';
    }
} 

 
