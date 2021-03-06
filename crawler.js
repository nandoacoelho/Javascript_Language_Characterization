var request = require('request'),
    cheerio = require('cheerio'),
    Jetty = require("jetty"),
    fs = require('fs'),
    db = require('./packagesDB.js'),

    jetty = new Jetty(process.stdout),
    letters = ['a','b','c','d','e','f','g','h','i','j','k','l','m','n','o','p','q','r','s','t','u','v','w','x','y','z'],
    search = letters[0],
    $, $github, totalResults, pageCount, pageToVisit, totalPages, packages, linePlace = 4
    options = {
              host     : 'localhost',
              user     : 'tcc_user',
              password : 'tccstorage',
              database : 'my_db'
            };

// // get github url
// function getGithubURLs(packages) {
//     var githubUrls = [];
//
//     for(key in packages){
//         var url = "https://www.npmjs.com/package/"+packages[key][0],
//         matched = false;
//
//         request(url, function(error, response, body) {
//             if (error)
//                 console.log("Error: " + error);
//             // Check status code (200 is HTTP OK)
//             if (response.statusCode === 200) {
//                 $github = cheerio.load(body);
//
//                 var elem = $github('.box li a');
//                 elem.each(function(index) {
//                     var urlAttr = elem[index].attribs.href;
//                     if ((urlAttr.indexOf("github") !== -1) && !matched) {
//                         matched = true;
//                         var array = [urlAttr,packages[key][0]];
//                         // db.addPackage(array);
//                         githubUrls.push(array);
//                         return;
//                     }
//                 });
//             }
//         });
//     }
//     console.log(githubUrls);
// }

function getNextLetter() {
    var aux = letters.indexOf(search)+1;
    if(aux > letters.length-1)
        console.log("Well done soldier, All results 'a-z' were captured!");
    else {
        search = letters[aux];
        linePlace += 7;
        init(search);
    }
}

// Get all search results into individual objects
function getAllSearchResults() {
    var percent = parseFloat((pageCount/totalPages)*100).toFixed(2);

    if (pageCount <= totalPages) {
        jetty.moveTo([linePlace,0]);
        jetty.text("page "+pageCount+": "+percent+"% read");

        packages = [];
        var searchResult = $('.search-results .package-details');
        searchResult.each(function() {
            var array = [
                $(this).find(".name").text().replace(/[\u0800-\uFFFF]/g,''), // name
                $(this).find(".author").text().replace(/[\u0800-\uFFFF]/g,''), // author
                Number($(this).find(".stars").text()), // stars
                $(this).find(".version").text().replace(/[\u0800-\uFFFF]/g,''), // version
                $(this).find(".description").text().replace(/[\u0800-\uFFFF]/g,''), // description
                $(this).find(".keywords").text().replace(/\s/g,'').replace(/[\u0800-\uFFFF]/g,'') // tags
            ];
            packages.push(array);
        });

        if(db.addPackages(packages)) {
            // getGithubURLs(packages);
            pageCount++;
            requestPage(pageToVisit, getAllSearchResults);
        }
    }
    else {
        db.closeDB();
        console.log("\nDone! all results for '"+search+"' were captured.\n ");
        getNextLetter();
    }
}

// Get total pages number
function getPageNums() {
    totalResults = parseInt($('.centered.ruled').text(), 10);
    totalPages = Math.ceil(totalResults / 20);
    console.log(totalResults + " results found, "+totalPages+" page(s) to scave!\n ");

    getAllSearchResults();
}

// Make page request and parse the document body to '$' var
function requestPage(pageURL, callback) {
    request(pageURL+pageCount, function(error, response, body) {
        if (error)
            console.log("Error: " + error);
        // Check status code (200 is HTTP OK)
        if (response.statusCode === 200)
            $ = cheerio.load(body);
        callback();
    });
}

// init
function init(search) {
    pageCount = 1;
    pageToVisit = "https://www.npmjs.com/search?q=" + search + "&page=";

    console.log("\nsearching page for '" + search + "'...\n ");

    requestPage(pageToVisit, getPageNums);
    db.connectDB(options);
}

// init
init(search);
