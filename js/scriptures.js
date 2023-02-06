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
    let cacheBooks;
    let init;
    let displayVolumes;
    let onHashChange;
    let navigateHome;

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

    displayVolumes = function () {
        let volumesList = "<ul>";

        volumes.forEach(function (volume) {
            volumesList += `<li><h3>${volume.fullName}</h3></li>`;
        });

        volumesList += "</ul>";
        document.getElementById("scriptures").innerHTML = volumesList;
    };

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

    onHashChange = function () {
        if (!window.location.hash || typeof(window.location.hash) !== "string") {
            navigateHome();
            return;
        }
        let components = window.location.hash.slice(1).split(":");
        if (components.length === 1) {
            //Navigate to volume
        }
    };

    navigateHome = function () {
        //Send to general home of all volumes
    }

    return {
        displayVolumes,
        init,
        onHashChange
    };
}());