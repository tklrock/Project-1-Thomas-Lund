/*
FILE: scriptures.js
AUTHOR: Thomas Lund
DATE: Winter Semester 2023

Description: Front-end JavaScript code for THe Scritpures, Mapped.
IS 542, Winter 2023, BYU.
*/
/*jslint
    browser
*/
/*global
    console, google, map, markerWithLabel, window
*/
/*property
    books, forEach, init, maxBookId, minBookId, onerror, onload, open, parse, push, response, send, status, locaiton, hash, slice, split, fullName, displayVolumes, onHashChange, innerHTML, log, getElementById, responseText, location
*/

const Scriptures = (function () {
    "use strict";

    // CONSTANTS
    const DIV_SCRIPTURES = "scriptures";
    const REQUEST_GET = "GET";
    const REQUEST_STATUS_OK = 200;
    const REQUEST_STATUS_ERROR = 400;
    const URL_BASE = "https://scriptures.byu.edu/";
    const URL_BOOKS = `${URL_BASE}mapscrip/model/books.php`;
    const URL_SCRIPTURES = `${URL_BASE}mapscrip/mapgetscrip.php`;
    const URL_VOLUMES = `${URL_BASE}mapscrip/model/volumes.php`;

    // PRIVATE VARIABLES
    let books;
    let volumes;

    // PRIVATE METHOD DECLARATIONS
    let ajax;
    let backButton;
    let bookChapterValid;
    let booksGrid;
    let booksGridContent;
    let bookTitle;
    let cacheBooks;
    let chaptersGrid;
    let encodedScripturesUrl;
    let getScripturesSuccess;
    let getScripturesFailure;
    let navigateBook;
    let navigateChapter;
    let navigateHome;
    let volumesGridContent;
    let volumeTitle;

    // PUBLIC API DECLARATIONS
    let init;
    let onHashChanged;
    

    // PRIVATE METHODS
    ajax = function (url, successCallback, failureCallback, skipJsonParse) {
        let request = new XMLHttpRequest();
        request.open(REQUEST_GET, url, true);

        request.onload = function () {
            if (request.status >= REQUEST_STATUS_OK && request.status < REQUEST_STATUS_ERROR) {
                //Success!!
                let data = (
                    skipJsonParse
                        ? request.responseText
                        : JSON.parse(request.responseText)
                );

                if (typeof successCallback === "function") {
                    successCallback(data);
                }
            } else {
                // We reached our target server, but it returned an error
                if (typeof(failureCallback) === "function") {
                    failureCallback(request);
                }
            }
        };

        request.onerror = failureCallback;
        request.send();
    };

    backButton = function(href, name) {
        return `<a href=${href}><h5>\u003c Back to ${name}</h5></a>`
    };

    bookChapterValid = function(bookId, chapter) {
        //NEEDS WORK
        return true;
    };

    booksGrid = function (volume) {
        let gridContent = '<div class="books">';

        volume.books.forEach(function (book) {
            console.log(book);
            gridContent += `<a class="btn" id="${book.id}" href="#${volume.id}:${book.id}">${book.gridName}</a>`;
        });

        return `${gridContent}</div>`;
    };

    booksGridContent = function (bookId) {

        let book = books[bookId];    
        let gridContent = '';

        if(book.numChapters === 0){
            navigateChapter(bookId, 0)
        } else if (book.numChapters === 1) {
            navigateChapter(bookId, 1)
        } else {
            gridContent += backButton(`#${book.parentBookId}`, volumes[book.parentBookId - 1].fullName)
            gridContent += `<div class="volume">${bookTitle(book)}</div>`;
            gridContent += chaptersGrid(book);
        }       

        return gridContent;
    };

    bookTitle = function(book){
        return `<a href="#${book.parentBookId}:${book.id}"><h3>${book.fullName}</h3></a>`;
    }

    cacheBooks = function (callback) {
        volumes.forEach(function (volume) {
            let volumeBooks = [];
            let bookId = volume.minBookId;
            while (bookId <= volume.maxBookId) {
                volumeBooks.push(books[bookId]);
                bookId += 1;
            }

            volume.books = volumeBooks;
        });

        if (typeof callback === "function") {
            callback();
        }
    };

    chaptersGrid = function(book){
        let gridContent = '<div class="books">';

        let i = 1;
        while (i <= book.numChapters) {
            gridContent += `<a class="btn" id="${i}" href="#${book.parentBookId}:${book.id}:${i}">${i}</a>`;
            i++;
        }
        return `${gridContent}</div>`;
    };

    encodedScripturesUrl = function (bookId, chapter, verses, isJst) {
        let options = "";
        if (bookId !== undefined && chapter !== undefined) {

            if (verses !== undefined){
                options += verses;
            }
            if (isJst !== undefined){
                options += "&jst=JST";
            }
        }

        return `${URL_SCRIPTURES}?book=${bookId}&chap=${chapter}&verses${options}`;
    }

    getScripturesFailure = function () {
        document.getElementById(DIV_SCRIPTURES).innerHTML = `Unable to retrieve chapter contents.`;
    };

    getScripturesSuccess = function (chapterHtml) {
        document.getElementById(DIV_SCRIPTURES).innerHTML = chapterHtml;
    };

    navigateBook = function(bookId) {
        document.getElementById(DIV_SCRIPTURES).innerHTML = `<div id="scripnav">${booksGridContent(bookId)}</div>`;
    }

    navigateChapter = function (bookId, chapter) {
        ajax(encodedScripturesUrl(bookId, chapter), getScripturesSuccess, getScripturesFailure, true);
    };

    navigateHome = function (volumeId) {
        document.getElementById(DIV_SCRIPTURES).innerHTML = `<div id="scripnav">${volumesGridContent(volumeId)}</div>`;
    };

    volumesGridContent = function(volumeId){
        let gridContent = '';

        volumes.forEach(function (volume) {
            if(volumeId === undefined || volumeId === volume.id) {
                gridContent += `<div class="volume">${volumeTitle(volume)}</div>`;
                gridContent += booksGrid(volume);
            }
        });

        return gridContent;
    };

    volumeTitle = function(volume) {
        return `<a href="#${volume.id}"><h3>${volume.fullName}</h3></a>`;
    };


    // PUBLIC API
    init = function (callback) {
        let booksLoaded = false;
        let volumesLoaded = false;

        ajax(URL_BOOKS,
                function (data) {
            books = data;
            booksLoaded = true;
            if (volumesLoaded) {
                cacheBooks(callback);
            }
        });
        ajax(URL_VOLUMES,
                function (data) {
            volumes = data;
            volumesLoaded = true;
            if (booksLoaded) {
                cacheBooks(callback);
            }
        });
    };

    onHashChanged = function (event) {
        let ids = [];

        if(location.hash !== "" && location.hash.length > 1){
            ids = location.hash.slice(1).split(":");
        }

        if (ids.length <= 0){
            navigateHome();
        } else if (ids.length === 1){
            const volumeId = Number(ids[0]);

            if (volumes.map((volume) => volume.id).includes(volumeId)){
                navigateHome(volumeId);
            } else {
                navigateHome();
            }
        } else {
            const bookId = Number(ids[1]);


            if(books[bookId] === undefined){
                navigateHome();
            } else {
                if(ids.length ===2) {
                    navigateBook(bookId);
                } else {
                    const chapter = Number(ids[2]);

                    if (bookChapterValid(bookId, chapter)) {
                        navigateChapter(bookId, chapter);
                    } else {
                        navigateHome();
                    }
                }
            }
        }
    };

    return {
        init,
        onHashChanged
    };
}());