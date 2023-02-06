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
    const REQUEST_GET = "GET";
    const REQUEST_STATUS_OK = 200;
    const REQUEST_STATUS_ERROR = 400;
    const URL_BASE = "https://scriptures.byu.edu/";
    const URL_BOOKS = `${URL_BASE}mapscrip/model/books.php`;
    const URL_VOLUMES = `${URL_BASE}mapscrip/model/volumes.php`;

    // PRIVATE VARIABLES
    let books;
    let volumes;

    // PRIVATE METHOD DECLARATIONS
    let ajax;
    let booksGrid;
    let cacheBooks;
    let navigateHome;
    let volumesGridContent;
    let volumeTitle;

    // PUBLIC API DECLARATIONS
    let init;
    let onHashChanged;
    

    // PRIVATE METHODS
    ajax = function (url, successCallback, failureCallback) {
        let request = new XMLHttpRequest();
        request.open('GET', url, true);

        request.onload = function () {
            if (request.status >= 200 && request.status < 400) {
                //Success!!
                let data = JSON.parse(request.responseText);

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

    booksGrid = function (volume) {
        let gridContent = '<div class="books">';

        volume.books.forEach(function (book) {
            gridContent += `<a class="btn" id="${book.id}" href="#${volume.id}:${book.id}">${book.gridName}</a>`;
        });

        return `${gridContent}</div>`;
    }

    navigateHome = function (volumeId) {
        document.getElementById("scriptures").innerHTML = `<div id="scripnav">${volumesGridContent(volumeId)}</div>`;
    }

    volumesGridContent = function(volumeId){
        let gridContent = '';

        volumes.forEach(function (volume) {
            if(volumeId === undefined || volumeId === volume.id) {
                gridContent += `<div class="volume">${volumeTitle(volume)}</div>`;
                gridContent += booksGrid(volume);
            }
        });

        return gridContent;
    }

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